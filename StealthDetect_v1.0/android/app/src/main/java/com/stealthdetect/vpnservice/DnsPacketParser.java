package com.stealthdetect.vpnservice;

import android.util.Log;

import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.List;

/**
 * DNS Packet Parser
 * Parses IP packets to extract DNS query information
 *
 * IP Header (20 bytes minimum):
 * - Version (4 bits) + IHL (4 bits)
 * - Type of Service (8 bits)
 * - Total Length (16 bits)
 * - Identification (16 bits)
 * - Flags (3 bits) + Fragment Offset (13 bits)
 * - TTL (8 bits)
 * - Protocol (8 bits) - 17 = UDP
 * - Header Checksum (16 bits)
 * - Source IP (32 bits)
 * - Destination IP (32 bits)
 *
 * UDP Header (8 bytes):
 * - Source Port (16 bits)
 * - Destination Port (16 bits) - 53 = DNS
 * - Length (16 bits)
 * - Checksum (16 bits)
 *
 * DNS Header (12 bytes):
 * - Transaction ID (16 bits)
 * - Flags (16 bits)
 * - Questions (16 bits)
 * - Answer RRs (16 bits)
 * - Authority RRs (16 bits)
 * - Additional RRs (16 bits)
 *
 * DNS Question:
 * - QNAME (variable) - domain name in label format
 * - QTYPE (16 bits) - query type (A=1, AAAA=28, etc.)
 * - QCLASS (16 bits) - query class (IN=1)
 */
public class DnsPacketParser {

    private static final String TAG = "DnsPacketParser";

    // IP Protocol Numbers
    private static final int PROTOCOL_UDP = 17;
    private static final int PROTOCOL_TCP = 6;

    // DNS Port
    private static final int DNS_PORT = 53;

    // DNS Query Types
    private static final int QTYPE_A = 1;      // IPv4 address
    private static final int QTYPE_AAAA = 28;  // IPv6 address
    private static final int QTYPE_CNAME = 5;  // Canonical name
    private static final int QTYPE_MX = 15;    // Mail exchange
    private static final int QTYPE_TXT = 16;   // Text record
    private static final int QTYPE_PTR = 12;   // Pointer record

    /**
     * Result of parsing a DNS packet
     */
    public static class DnsParseResult {
        public boolean isDnsQuery;
        public String domain;
        public String queryType;
        public String sourceIp;
        public String destIp;
        public int sourcePort;
        public int destPort;
        public int transactionId;

        @Override
        public String toString() {
            return "DnsParseResult{" +
                    "isDnsQuery=" + isDnsQuery +
                    ", domain='" + domain + '\'' +
                    ", queryType='" + queryType + '\'' +
                    ", sourceIp='" + sourceIp + '\'' +
                    ", destIp='" + destIp + '\'' +
                    '}';
        }
    }

    /**
     * Parse an IP packet and extract DNS query information if present
     *
     * @param packet Raw IP packet data
     * @param length Length of valid data in packet
     * @return DnsParseResult or null if not a DNS query
     */
    public static DnsParseResult parse(byte[] packet, int length) {
        if (packet == null || length < 28) { // Minimum: 20 IP + 8 UDP
            return null;
        }

        try {
            ByteBuffer buffer = ByteBuffer.wrap(packet, 0, length);

            // Parse IP header
            int versionAndIhl = buffer.get(0) & 0xFF;
            int version = (versionAndIhl >> 4) & 0x0F;

            // Only handle IPv4 for now
            if (version != 4) {
                return null;
            }

            int ihl = (versionAndIhl & 0x0F) * 4; // IP header length in bytes
            if (ihl < 20 || length < ihl + 8) {
                return null;
            }

            // Get protocol (byte 9)
            int protocol = buffer.get(9) & 0xFF;

            // Only handle UDP for DNS
            if (protocol != PROTOCOL_UDP) {
                return null;
            }

            // Get source and destination IP addresses (bytes 12-15 and 16-19)
            String sourceIp = String.format("%d.%d.%d.%d",
                    buffer.get(12) & 0xFF,
                    buffer.get(13) & 0xFF,
                    buffer.get(14) & 0xFF,
                    buffer.get(15) & 0xFF);

            String destIp = String.format("%d.%d.%d.%d",
                    buffer.get(16) & 0xFF,
                    buffer.get(17) & 0xFF,
                    buffer.get(18) & 0xFF,
                    buffer.get(19) & 0xFF);

            // Parse UDP header (starts at IHL offset)
            int udpOffset = ihl;
            if (length < udpOffset + 8) {
                return null;
            }

            int sourcePort = ((buffer.get(udpOffset) & 0xFF) << 8) | (buffer.get(udpOffset + 1) & 0xFF);
            int destPort = ((buffer.get(udpOffset + 2) & 0xFF) << 8) | (buffer.get(udpOffset + 3) & 0xFF);

            // Check if this is DNS traffic (port 53)
            if (destPort != DNS_PORT && sourcePort != DNS_PORT) {
                return null;
            }

            // Parse DNS header (starts after UDP header)
            int dnsOffset = udpOffset + 8;
            if (length < dnsOffset + 12) { // DNS header is 12 bytes
                return null;
            }

            // Transaction ID (bytes 0-1)
            int transactionId = ((buffer.get(dnsOffset) & 0xFF) << 8) | (buffer.get(dnsOffset + 1) & 0xFF);

            // Flags (bytes 2-3)
            int flags = ((buffer.get(dnsOffset + 2) & 0xFF) << 8) | (buffer.get(dnsOffset + 3) & 0xFF);

            // Check QR bit (bit 15) - 0 = query, 1 = response
            boolean isQuery = ((flags >> 15) & 0x01) == 0;

            // We're interested in queries (outgoing DNS requests)
            if (!isQuery) {
                return null;
            }

            // Number of questions (bytes 4-5)
            int questionCount = ((buffer.get(dnsOffset + 4) & 0xFF) << 8) | (buffer.get(dnsOffset + 5) & 0xFF);

            if (questionCount == 0) {
                return null;
            }

            // Parse the first question (starts at byte 12 of DNS section)
            int questionOffset = dnsOffset + 12;

            // Parse domain name (QNAME)
            StringBuilder domainBuilder = new StringBuilder();
            int pos = questionOffset;

            while (pos < length) {
                int labelLength = buffer.get(pos) & 0xFF;

                if (labelLength == 0) {
                    // End of domain name
                    pos++;
                    break;
                }

                // Check for compression pointer (starts with 11xxxxxx)
                if ((labelLength & 0xC0) == 0xC0) {
                    // Compression not typically in queries, skip
                    pos += 2;
                    break;
                }

                if (pos + 1 + labelLength > length) {
                    return null; // Malformed packet
                }

                if (domainBuilder.length() > 0) {
                    domainBuilder.append('.');
                }

                for (int i = 0; i < labelLength; i++) {
                    domainBuilder.append((char) (buffer.get(pos + 1 + i) & 0xFF));
                }

                pos += 1 + labelLength;
            }

            String domain = domainBuilder.toString().toLowerCase();

            if (domain.isEmpty()) {
                return null;
            }

            // Parse QTYPE (2 bytes after domain name)
            if (pos + 2 > length) {
                return null;
            }

            int qtype = ((buffer.get(pos) & 0xFF) << 8) | (buffer.get(pos + 1) & 0xFF);
            String queryType = getQueryTypeName(qtype);

            // Build result
            DnsParseResult result = new DnsParseResult();
            result.isDnsQuery = true;
            result.domain = domain;
            result.queryType = queryType;
            result.sourceIp = sourceIp;
            result.destIp = destIp;
            result.sourcePort = sourcePort;
            result.destPort = destPort;
            result.transactionId = transactionId;

            return result;

        } catch (Exception e) {
            Log.e(TAG, "Error parsing DNS packet", e);
            return null;
        }
    }

    /**
     * Convert DNS query type number to string name
     */
    private static String getQueryTypeName(int qtype) {
        switch (qtype) {
            case QTYPE_A:
                return "A";
            case QTYPE_AAAA:
                return "AAAA";
            case QTYPE_CNAME:
                return "CNAME";
            case QTYPE_MX:
                return "MX";
            case QTYPE_TXT:
                return "TXT";
            case QTYPE_PTR:
                return "PTR";
            default:
                return "OTHER";
        }
    }

    /**
     * Check if a packet is a DNS query without full parsing
     * Useful for quick filtering
     */
    public static boolean isDnsPacket(byte[] packet, int length) {
        if (packet == null || length < 28) {
            return false;
        }

        try {
            // Check IPv4
            int version = (packet[0] >> 4) & 0x0F;
            if (version != 4) {
                return false;
            }

            // Check UDP protocol
            int protocol = packet[9] & 0xFF;
            if (protocol != PROTOCOL_UDP) {
                return false;
            }

            // Get IP header length
            int ihl = (packet[0] & 0x0F) * 4;

            // Check destination port is 53
            int destPort = ((packet[ihl + 2] & 0xFF) << 8) | (packet[ihl + 3] & 0xFF);

            return destPort == DNS_PORT;

        } catch (Exception e) {
            return false;
        }
    }
}
