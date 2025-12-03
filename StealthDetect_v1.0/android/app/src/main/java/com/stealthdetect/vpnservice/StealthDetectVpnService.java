package com.stealthdetect.vpnservice;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.VpnService;
import android.os.Build;
import android.os.ParcelFileDescriptor;
import android.util.Log;

import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.nio.ByteBuffer;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.TimeZone;
import java.util.concurrent.ConcurrentLinkedQueue;

/**
 * VPN Service for intercepting and analyzing DNS queries
 *
 * This service creates a local VPN tunnel that intercepts all network traffic,
 * parses DNS queries to extract domain names, and forwards legitimate traffic
 * while reporting DNS events to the JavaScript layer for threat detection.
 */
public class StealthDetectVpnService extends VpnService {

    private static final String TAG = "StealthDetectVPN";
    public static final String ACTION_START = "com.stealthdetect.vpn.START";
    public static final String ACTION_STOP = "com.stealthdetect.vpn.STOP";

    private static final String NOTIFICATION_CHANNEL_ID = "stealthdetect_vpn";
    private static final int NOTIFICATION_ID = 1;

    // DNS Configuration
    private static final String PRIMARY_DNS = "8.8.8.8";
    private static final String SECONDARY_DNS = "8.8.4.4";
    private static final int DNS_PORT = 53;

    // VPN Configuration
    private static final String VPN_ADDRESS = "10.0.0.2";
    private static final int VPN_PREFIX_LENGTH = 32;
    private static final int MTU = 1500;

    // Static state tracking
    private static volatile boolean isRunning = false;
    private static String startTime = null;
    private static int packetsProcessed = 0;
    private static int dnsQueriesIntercepted = 0;

    // Listeners
    private static DnsEventListener dnsEventListener;
    private static StateChangeListener stateChangeListener;

    // VPN components
    private ParcelFileDescriptor vpnInterface;
    private Thread vpnThread;
    private volatile boolean shouldRun = false;

    // DNS forwarding
    private DatagramSocket dnsSocket;

    // Deduplication - avoid reporting same domain multiple times in short period
    private final Set<String> recentDomains = new HashSet<>();
    private long lastDomainClearTime = 0;
    private static final long DOMAIN_CACHE_TTL = 5000; // 5 seconds

    // Interfaces
    public interface DnsEventListener {
        void onDnsEvent(DnsQueryInfo query);
    }

    public interface StateChangeListener {
        void onStateChange(String state, String errorMessage);
    }

    // Static setters for listeners
    public static void setDnsEventListener(DnsEventListener listener) {
        dnsEventListener = listener;
    }

    public static void setStateChangeListener(StateChangeListener listener) {
        stateChangeListener = listener;
    }

    // Static getters for status
    public static boolean isRunning() {
        return isRunning;
    }

    public static String getStartTime() {
        return startTime;
    }

    public static int getPacketsProcessed() {
        return packetsProcessed;
    }

    public static int getDnsQueriesIntercepted() {
        return dnsQueriesIntercepted;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            return START_NOT_STICKY;
        }

        String action = intent.getAction();

        if (ACTION_START.equals(action)) {
            startVpn();
        } else if (ACTION_STOP.equals(action)) {
            stopVpn();
        }

        return START_STICKY;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    NOTIFICATION_CHANNEL_ID,
                    "StealthDetect VPN",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Network monitoring for stalkerware detection");

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification createNotification() {
        Intent notificationIntent = getPackageManager()
                .getLaunchIntentForPackage(getPackageName());

        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, notificationIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(this, NOTIFICATION_CHANNEL_ID);
        } else {
            builder = new Notification.Builder(this);
        }

        return builder
                .setContentTitle("StealthDetect Active")
                .setContentText("Monitoring network for threats")
                .setSmallIcon(android.R.drawable.ic_secure)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .build();
    }

    private void startVpn() {
        Log.i(TAG, "=== startVpn() called, isRunning=" + isRunning + " ===");
        if (isRunning) {
            Log.w(TAG, "VPN already running, returning early");
            return;
        }

        try {
            // Start as foreground service (required for Android 8+)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                // Android 14+ requires specifying the foreground service type
                startForeground(NOTIFICATION_ID, createNotification(),
                    android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForeground(NOTIFICATION_ID, createNotification());
            }

            // Configure VPN interface
            Builder builder = new Builder();
            builder.setSession("StealthDetect DNS Monitor")
                    .addAddress(VPN_ADDRESS, VPN_PREFIX_LENGTH)
                    .addRoute("0.0.0.0", 0)
                    .addDnsServer(PRIMARY_DNS)
                    .addDnsServer(SECONDARY_DNS)
                    .setBlocking(true)
                    .setMtu(MTU);

            // Allow app to bypass VPN to prevent loops
            try {
                builder.addDisallowedApplication(getPackageName());
            } catch (PackageManager.NameNotFoundException e) {
                Log.w(TAG, "Could not exclude own package from VPN", e);
            }

            vpnInterface = builder.establish();

            if (vpnInterface == null) {
                Log.e(TAG, "Failed to establish VPN interface");
                notifyStateChange("error", "Failed to establish VPN interface");
                return;
            }

            // Initialize DNS socket for forwarding
            dnsSocket = new DatagramSocket();
            dnsSocket.setSoTimeout(5000);

            // Protect DNS socket from VPN routing
            protect(dnsSocket);

            isRunning = true;
            startTime = getIsoTimestamp();
            packetsProcessed = 0;
            dnsQueriesIntercepted = 0;
            shouldRun = true;

            Log.i(TAG, "VPN interface established, starting packet processor thread...");

            // Start packet processing thread
            vpnThread = new Thread(this::processPackets, "VPN-Packet-Processor");
            vpnThread.start();

            notifyStateChange("connected", null);
            Log.i(TAG, "=== VPN started successfully ===");
            Log.i(TAG, "Listener status: dnsEventListener=" + (dnsEventListener != null) + ", stateChangeListener=" + (stateChangeListener != null));

        } catch (Exception e) {
            Log.e(TAG, "Failed to start VPN", e);
            notifyStateChange("error", e.getMessage());
            cleanup();
        }
    }

    private void stopVpn() {
        shouldRun = false;
        isRunning = false;

        cleanup();

        notifyStateChange("disconnected", null);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            stopForeground(true);
        }

        stopSelf();
        Log.i(TAG, "VPN stopped");
    }

    private void cleanup() {
        if (vpnThread != null) {
            vpnThread.interrupt();
            try {
                vpnThread.join(1000);
            } catch (InterruptedException ignored) {}
            vpnThread = null;
        }

        if (dnsSocket != null) {
            dnsSocket.close();
            dnsSocket = null;
        }

        if (vpnInterface != null) {
            try {
                vpnInterface.close();
            } catch (Exception e) {
                Log.e(TAG, "Error closing VPN interface", e);
            }
            vpnInterface = null;
        }

        recentDomains.clear();
    }

    /**
     * Main packet processing loop
     * Reads packets from VPN tunnel, parses DNS queries, and forwards traffic
     */
    private void processPackets() {
        FileInputStream in = null;
        FileOutputStream out = null;

        try {
            in = new FileInputStream(vpnInterface.getFileDescriptor());
            out = new FileOutputStream(vpnInterface.getFileDescriptor());

            byte[] packet = new byte[32767];
            ByteBuffer responseBuffer = ByteBuffer.allocate(32767);

            Log.i(TAG, "=== Packet processing thread started ===");
            int logCounter = 0;

            while (shouldRun && !Thread.currentThread().isInterrupted()) {
                try {
                    int length = in.read(packet);

                    if (length <= 0) {
                        continue;
                    }

                    packetsProcessed++;

                    // Log every 10th packet to avoid spam
                    if (logCounter++ % 10 == 0) {
                        Log.d(TAG, "Packet received: " + length + " bytes (total: " + packetsProcessed + ")");
                    }

                    // Check if this is a DNS packet
                    if (DnsPacketParser.isDnsPacket(packet, length)) {
                        Log.i(TAG, "DNS packet detected, parsing...");
                        // Parse the DNS query
                        DnsPacketParser.DnsParseResult dnsResult =
                                DnsPacketParser.parse(packet, length);

                        if (dnsResult != null && dnsResult.isDnsQuery) {
                            // Report DNS query to JS layer
                            reportDnsQuery(dnsResult);

                            // Forward DNS query to real DNS server and get response
                            byte[] response = forwardDnsQuery(packet, length);

                            if (response != null) {
                                // Build response IP packet and write back
                                byte[] responsePacket = buildDnsResponsePacket(
                                        packet, length, response);

                                if (responsePacket != null) {
                                    out.write(responsePacket);
                                }
                            }
                        }
                    } else {
                        // Non-DNS packet - forward as-is
                        // Note: In a production VPN, you'd need proper IP forwarding
                        // For DNS-only monitoring, we just log non-DNS traffic
                    }

                } catch (Exception e) {
                    if (shouldRun && !Thread.currentThread().isInterrupted()) {
                        Log.e(TAG, "Error processing packet", e);
                    }
                }
            }

        } catch (Exception e) {
            if (shouldRun) {
                Log.e(TAG, "Fatal error in packet processing", e);
                notifyStateChange("error", "Packet processing error: " + e.getMessage());
            }
        } finally {
            try {
                if (in != null) in.close();
                if (out != null) out.close();
            } catch (Exception ignored) {}

            Log.i(TAG, "Packet processing thread ended");
        }
    }

    /**
     * Report a DNS query to the JavaScript layer
     */
    private void reportDnsQuery(DnsPacketParser.DnsParseResult dnsResult) {
        Log.i(TAG, "reportDnsQuery called for: " + dnsResult.domain);

        // Clear old cached domains periodically
        long now = System.currentTimeMillis();
        if (now - lastDomainClearTime > DOMAIN_CACHE_TTL) {
            recentDomains.clear();
            lastDomainClearTime = now;
        }

        // Skip if we recently reported this domain
        if (recentDomains.contains(dnsResult.domain)) {
            Log.d(TAG, "Skipping duplicate domain: " + dnsResult.domain);
            return;
        }
        recentDomains.add(dnsResult.domain);

        dnsQueriesIntercepted++;

        Log.i(TAG, "Listener is " + (dnsEventListener != null ? "SET" : "NULL"));

        if (dnsEventListener != null) {
            DnsQueryInfo query = new DnsQueryInfo();
            query.timestamp = getIsoTimestamp();
            query.domain = dnsResult.domain;
            query.queryType = dnsResult.queryType;
            query.sourceApp = null; // Would require root to get app from UID
            query.sourcePort = dnsResult.sourcePort;
            query.destinationIp = dnsResult.destIp;
            query.blocked = false;

            try {
                Log.i(TAG, "Calling dnsEventListener.onDnsEvent() for: " + dnsResult.domain);
                dnsEventListener.onDnsEvent(query);
                Log.i(TAG, "dnsEventListener.onDnsEvent() completed for: " + dnsResult.domain);
            } catch (Exception e) {
                Log.e(TAG, "Error reporting DNS event", e);
            }
        } else {
            Log.w(TAG, "DNS event listener is NULL - cannot report event!");
        }

        Log.i(TAG, "DNS Query: " + dnsResult.domain + " (" + dnsResult.queryType + ")");
    }

    /**
     * Forward DNS query to real DNS server and get response
     */
    private byte[] forwardDnsQuery(byte[] packet, int length) {
        if (dnsSocket == null || dnsSocket.isClosed()) {
            return null;
        }

        try {
            // Extract DNS payload from IP/UDP packet
            int ipHeaderLength = (packet[0] & 0x0F) * 4;
            int udpOffset = ipHeaderLength;
            int dnsOffset = udpOffset + 8;
            int dnsLength = length - dnsOffset;

            if (dnsLength <= 0) {
                return null;
            }

            byte[] dnsQuery = new byte[dnsLength];
            System.arraycopy(packet, dnsOffset, dnsQuery, 0, dnsLength);

            // Send to DNS server
            InetAddress dnsServer = InetAddress.getByName(PRIMARY_DNS);
            DatagramPacket queryPacket = new DatagramPacket(
                    dnsQuery, dnsLength, dnsServer, DNS_PORT);
            dnsSocket.send(queryPacket);

            // Receive response
            byte[] responseBuffer = new byte[1024];
            DatagramPacket responsePacket = new DatagramPacket(
                    responseBuffer, responseBuffer.length);
            dnsSocket.receive(responsePacket);

            byte[] response = new byte[responsePacket.getLength()];
            System.arraycopy(responseBuffer, 0, response, 0, responsePacket.getLength());

            return response;

        } catch (Exception e) {
            Log.e(TAG, "Error forwarding DNS query", e);
            return null;
        }
    }

    /**
     * Build a complete IP/UDP packet containing the DNS response
     */
    private byte[] buildDnsResponsePacket(byte[] originalPacket, int originalLength,
                                           byte[] dnsResponse) {
        try {
            int ipHeaderLength = (originalPacket[0] & 0x0F) * 4;

            // Calculate new packet size
            int newLength = ipHeaderLength + 8 + dnsResponse.length; // IP + UDP + DNS
            byte[] responsePacket = new byte[newLength];

            // Copy and modify IP header
            System.arraycopy(originalPacket, 0, responsePacket, 0, ipHeaderLength);

            // Swap source and destination IP
            System.arraycopy(originalPacket, 16, responsePacket, 12, 4); // dest -> src
            System.arraycopy(originalPacket, 12, responsePacket, 16, 4); // src -> dest

            // Update total length in IP header
            responsePacket[2] = (byte) ((newLength >> 8) & 0xFF);
            responsePacket[3] = (byte) (newLength & 0xFF);

            // Update IP checksum (simplified - set to 0 for now)
            responsePacket[10] = 0;
            responsePacket[11] = 0;

            // Build UDP header
            int udpOffset = ipHeaderLength;

            // Swap ports
            responsePacket[udpOffset] = originalPacket[udpOffset + 2];
            responsePacket[udpOffset + 1] = originalPacket[udpOffset + 3];
            responsePacket[udpOffset + 2] = originalPacket[udpOffset];
            responsePacket[udpOffset + 3] = originalPacket[udpOffset + 1];

            // UDP length
            int udpLength = 8 + dnsResponse.length;
            responsePacket[udpOffset + 4] = (byte) ((udpLength >> 8) & 0xFF);
            responsePacket[udpOffset + 5] = (byte) (udpLength & 0xFF);

            // UDP checksum (0 = disabled for UDP over IPv4)
            responsePacket[udpOffset + 6] = 0;
            responsePacket[udpOffset + 7] = 0;

            // Copy DNS response
            System.arraycopy(dnsResponse, 0, responsePacket, udpOffset + 8, dnsResponse.length);

            return responsePacket;

        } catch (Exception e) {
            Log.e(TAG, "Error building DNS response packet", e);
            return null;
        }
    }

    private void notifyStateChange(String state, String errorMessage) {
        if (stateChangeListener != null) {
            try {
                stateChangeListener.onStateChange(state, errorMessage);
            } catch (Exception e) {
                Log.e(TAG, "Error notifying state change", e);
            }
        }
    }

    private String getIsoTimestamp() {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
        return sdf.format(new Date());
    }

    @Override
    public void onDestroy() {
        stopVpn();
        super.onDestroy();
    }

    @Override
    public void onRevoke() {
        // Called when user revokes VPN permission
        Log.w(TAG, "VPN permission revoked by user");
        stopVpn();
        super.onRevoke();
    }
}
