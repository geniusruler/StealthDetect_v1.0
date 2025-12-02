package com.stealthdetect.vpnservice;

/**
 * Data class representing a DNS query event
 */
public class DnsQueryInfo {
    public String timestamp;
    public String domain;
    public String queryType;
    public String sourceApp;
    public int sourcePort;
    public String destinationIp;
    public boolean blocked;

    public DnsQueryInfo() {
        // Default constructor
    }

    public DnsQueryInfo(String timestamp, String domain, String queryType,
                        String sourceApp, int sourcePort, String destinationIp, boolean blocked) {
        this.timestamp = timestamp;
        this.domain = domain;
        this.queryType = queryType;
        this.sourceApp = sourceApp;
        this.sourcePort = sourcePort;
        this.destinationIp = destinationIp;
        this.blocked = blocked;
    }

    @Override
    public String toString() {
        return "DnsQueryInfo{" +
                "domain='" + domain + '\'' +
                ", queryType='" + queryType + '\'' +
                ", sourceApp='" + sourceApp + '\'' +
                ", blocked=" + blocked +
                '}';
    }
}
