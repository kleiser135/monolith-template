/**
 * Enterprise-grade IP validation with RFC compliance and private range detection
 * Prevents SSRF attacks and validates IP addresses according to standards
 */

import ipRangeCheck from 'ip-range-check';

interface IPValidationResult {
  isValid: boolean;
  type: 'ipv4' | 'ipv6' | 'invalid';
  isPrivate: boolean;
  isReserved: boolean;
  isLoopback: boolean;
  isMulticast: boolean;
  isLinkLocal: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reason?: string;
  allowedForSSRF: boolean;
}

export class IPValidator {
  // RFC 1918 Private Address Ranges
  private static readonly PRIVATE_RANGES_V4 = [
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16'
  ];

  // RFC 3927 Link-Local
  private static readonly LINK_LOCAL_V4 = ['169.254.0.0/16'];

  // RFC 5735 Special Use IPv4
  private static readonly RESERVED_RANGES_V4 = [
    '0.0.0.0/8',        // Current network
    '127.0.0.0/8',      // Loopback
    '224.0.0.0/4',      // Multicast
    '240.0.0.0/4',      // Reserved for future use
    '255.255.255.255/32' // Broadcast
  ];

  // RFC 4193 Unique Local IPv6
  private static readonly PRIVATE_RANGES_V6 = [
    'fc00::/7'
  ];

  // RFC 4291 Special Use IPv6
  private static readonly RESERVED_RANGES_V6 = [
    '::/128',           // Unspecified
    '::1/128',          // Loopback
    'ff00::/8',         // Multicast
    'fe80::/10',        // Link-local
    '2001:db8::/32',    // Documentation
    '2001::/32',        // Teredo
    '2002::/16',        // 6to4
    'fc00::/7',         // Unique local
    'fec0::/10'         // Site-local (deprecated)
  ];

  // Cloud metadata endpoints (AWS, GCP, Azure, etc.)
  private static readonly CLOUD_METADATA_RANGES = [
    '169.254.169.254/32', // AWS, GCP metadata
    '169.254.169.253/32', // AWS IMDSv2
    '100.100.100.200/32', // Alibaba Cloud
    '169.254.169.250/32'  // Azure metadata (through proxy)
  ];

  /**
   * Validate an IP address with comprehensive security checks
   */
  public static validate(ip: string): IPValidationResult {
    const trimmedIP = ip.trim();
    
    // Basic format validation
    if (!this.isValidIPFormat(trimmedIP)) {
      return {
        isValid: false,
        type: 'invalid',
        isPrivate: false,
        isReserved: false,
        isLoopback: false,
        isMulticast: false,
        isLinkLocal: false,
        riskLevel: 'high',
        reason: 'Invalid IP address format',
        allowedForSSRF: false
      };
    }

    const isIPv6 = trimmedIP.includes(':');
    const type = isIPv6 ? 'ipv6' : 'ipv4';

    // Check various IP characteristics
    const isPrivate = this.isPrivateIP(trimmedIP, isIPv6);
    const isReserved = this.isReservedIP(trimmedIP, isIPv6);
    const isLoopback = this.isLoopbackIP(trimmedIP, isIPv6);
    const isMulticast = this.isMulticastIP(trimmedIP, isIPv6);
    const isLinkLocal = this.isLinkLocalIP(trimmedIP, isIPv6);
    const isCloudMetadata = this.isCloudMetadataIP(trimmedIP);

    // Calculate risk level
    const riskLevel = this.calculateRiskLevel({
      isPrivate,
      isReserved,
      isLoopback,
      isMulticast,
      isLinkLocal,
      isCloudMetadata
    });

    // Determine if IP is allowed for SSRF protection
    const allowedForSSRF = this.isAllowedForSSRF({
      isPrivate,
      isReserved,
      isLoopback,
      isMulticast,
      isLinkLocal,
      isCloudMetadata
    });

    return {
      isValid: true,
      type,
      isPrivate,
      isReserved,
      isLoopback,
      isMulticast,
      isLinkLocal,
      riskLevel,
      reason: this.getRiskReason({
        isPrivate,
        isReserved,
        isLoopback,
        isMulticast,
        isLinkLocal,
        isCloudMetadata
      }),
      allowedForSSRF
    };
  }

  /**
   * Quick check if IP is safe for outbound requests (SSRF protection)
   */
  public static isSafeForOutboundRequest(ip: string): boolean {
    const result = this.validate(ip);
    return result.isValid && result.allowedForSSRF;
  }

  /**
   * Extract and validate all IPs from a URL
   */
  public static validateURLHost(url: string): IPValidationResult | null {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;

      // Remove IPv6 brackets if present
      const cleanHostname = hostname.replace(/^\[|\]$/g, '');

      // Check if hostname is an IP address
      if (this.isValidIPFormat(cleanHostname)) {
        return this.validate(cleanHostname);
      }

      return null; // Not an IP address
    } catch {
      return null; // Invalid URL
    }
  }

  private static isValidIPFormat(ip: string): boolean {
    // IPv4 validation
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipv4Match = ip.match(ipv4Regex);
    
    if (ipv4Match) {
      return ipv4Match.slice(1).every(octet => {
        const num = parseInt(octet, 10);
        return num >= 0 && num <= 255 && octet === num.toString();
      });
    }

    // IPv6 validation (comprehensive)
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}$|^::$/;
    if (ip.includes(':')) {
      // Handle IPv6 shorthand notation
      const parts = ip.split('::');
      if (parts.length > 2) return false;
      
      if (parts.length === 2) {
        const leftParts = parts[0] ? parts[0].split(':') : [];
        const rightParts = parts[1] ? parts[1].split(':') : [];
        const totalParts = leftParts.length + rightParts.length;
        
        if (totalParts > 8) return false;
        
        return [...leftParts, ...rightParts].every(part => 
          part === '' || /^[0-9a-fA-F]{1,4}$/.test(part)
        );
      }
      
      return ipv6Regex.test(ip);
    }

    return false;
  }

  private static isPrivateIP(ip: string, isIPv6: boolean): boolean {
    const ranges = isIPv6 ? this.PRIVATE_RANGES_V6 : this.PRIVATE_RANGES_V4;
    return ranges.some(range => ipRangeCheck(ip, range));
  }

  private static isReservedIP(ip: string, isIPv6: boolean): boolean {
    const ranges = isIPv6 ? this.RESERVED_RANGES_V6 : this.RESERVED_RANGES_V4;
    return ranges.some(range => ipRangeCheck(ip, range));
  }

  private static isLoopbackIP(ip: string, isIPv6: boolean): boolean {
    if (isIPv6) {
      return ip === '::1';
    }
    return ipRangeCheck(ip, '127.0.0.0/8');
  }

  private static isMulticastIP(ip: string, isIPv6: boolean): boolean {
    if (isIPv6) {
      return ipRangeCheck(ip, 'ff00::/8');
    }
    return ipRangeCheck(ip, '224.0.0.0/4');
  }

  private static isLinkLocalIP(ip: string, isIPv6: boolean): boolean {
    if (isIPv6) {
      return ipRangeCheck(ip, 'fe80::/10');
    }
    return ipRangeCheck(ip, '169.254.0.0/16');
  }

  private static isCloudMetadataIP(ip: string): boolean {
    return this.CLOUD_METADATA_RANGES.some(range => ipRangeCheck(ip, range));
  }

  private static calculateRiskLevel(checks: {
    isPrivate: boolean;
    isReserved: boolean;
    isLoopback: boolean;
    isMulticast: boolean;
    isLinkLocal: boolean;
    isCloudMetadata: boolean;
  }): 'low' | 'medium' | 'high' | 'critical' {
    const { isPrivate, isReserved, isLoopback, isMulticast, isLinkLocal, isCloudMetadata } = checks;

    if (isCloudMetadata || isLoopback) return 'critical';
    if (isPrivate || isLinkLocal) return 'high';
    if (isReserved || isMulticast) return 'medium';
    
    return 'low';
  }

  private static isAllowedForSSRF(checks: {
    isPrivate: boolean;
    isReserved: boolean;
    isLoopback: boolean;
    isMulticast: boolean;
    isLinkLocal: boolean;
    isCloudMetadata: boolean;
  }): boolean {
    const { isPrivate, isReserved, isLoopback, isMulticast, isLinkLocal, isCloudMetadata } = checks;

    // Block any potentially dangerous IPs for SSRF protection
    return !(isPrivate || isReserved || isLoopback || isMulticast || isLinkLocal || isCloudMetadata);
  }

  private static getRiskReason(checks: {
    isPrivate: boolean;
    isReserved: boolean;
    isLoopback: boolean;
    isMulticast: boolean;
    isLinkLocal: boolean;
    isCloudMetadata: boolean;
  }): string {
    const { isPrivate, isReserved, isLoopback, isMulticast, isLinkLocal, isCloudMetadata } = checks;

    if (isCloudMetadata) return 'Cloud metadata endpoint - critical SSRF risk';
    if (isLoopback) return 'Loopback address - potential local service access';
    if (isPrivate) return 'Private network address - internal resource access risk';
    if (isLinkLocal) return 'Link-local address - local network access risk';
    if (isReserved) return 'Reserved address range - special use IP';
    if (isMulticast) return 'Multicast address - group communication protocol';
    
    return 'Public IP address - low risk for SSRF';
  }
}
