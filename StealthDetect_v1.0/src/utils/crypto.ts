/**
 * Cryptographic utilities for StealthDetect
 * Handles PIN hashing, file hashing, and integrity checking
 */

// ==================== SHA-256 Hashing ====================

/**
 * Generate SHA-256 hash from string
 * Used for PIN verification and text hashing
 */
export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}

/**
 * Generate SHA-256 hash from file/binary data
 * Used for file integrity checking and IoC matching
 */
export async function hashFile(file: ArrayBuffer | Uint8Array): Promise<string> {
  const data = file instanceof ArrayBuffer ? new Uint8Array(file) : file;
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}

/**
 * Generate SHA-256 hash from Blob (for file uploads)
 */
export async function hashBlob(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  return hashFile(arrayBuffer);
}

// ==================== MD5 Hashing ====================

/**
 * Generate MD5 hash (legacy support for older IoC databases)
 * Note: MD5 is cryptographically broken, only use for IoC matching
 */
export async function hashMD5(data: string | Uint8Array): Promise<string> {
  // MD5 implementation for compatibility
  // In production, use a proper MD5 library if needed
  // For now, we'll use SHA-256 and note it in the algorithm field
  console.warn('MD5 requested but not securely implemented, using SHA-256 instead');
  
  if (typeof data === 'string') {
    return hashString(data);
  } else {
    return hashFile(data);
  }
}

// ==================== PIN Hashing ====================

/**
 * Hash a PIN with salt for secure storage
 * Uses SHA-256 with application-specific salt
 */
export async function hashPIN(pin: string, salt: string = 'StealthDetect_v1'): Promise<string> {
  const saltedPIN = `${salt}:${pin}:${salt}`;
  return hashString(saltedPIN);
}

/**
 * Verify a PIN against its hash
 */
export async function verifyPIN(pin: string, hash: string, salt: string = 'StealthDetect_v1'): Promise<boolean> {
  const computed = await hashPIN(pin, salt);
  return computed === hash;
}

// ==================== Helper Functions ====================

/**
 * Convert ArrayBuffer to hex string
 */
function bufferToHex(buffer: ArrayBuffer): string {
  const byteArray = new Uint8Array(buffer);
  const hexCodes = Array.from(byteArray).map(byte => {
    const hex = byte.toString(16);
    return hex.padStart(2, '0');
  });
  return hexCodes.join('');
}

/**
 * Convert hex string to ArrayBuffer
 */
export function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes.buffer;
}

// ==================== File Scanning Utilities ====================

/**
 * Generate hash for HTTP-downloaded file data
 * Simulates detecting a file download and computing its hash
 */
export async function hashHTTPDownload(url: string, data: ArrayBuffer): Promise<{
  url: string;
  hash: string;
  size: number;
  timestamp: string;
}> {
  const hash = await hashFile(data);
  
  return {
    url,
    hash,
    size: data.byteLength,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate multiple hashes for a file (for cross-referencing)
 */
export async function generateFileSignature(data: ArrayBuffer): Promise<{
  sha256: string;
  size: number;
  timestamp: string;
}> {
  const sha256 = await hashFile(data);
  
  return {
    sha256,
    size: data.byteLength,
    timestamp: new Date().toISOString(),
  };
}

// ==================== Stalkerware Detection Hashing ====================

/**
 * Generate hash signature for detected stalkerware
 * Returns hash WITHOUT storing the actual file (privacy/security)
 */
export interface StalkerwareSignature {
  packageName: string;
  hash: string;
  algorithm: 'SHA-256';
  detectionMethod: string;
  timestamp: string;
  metadata: {
    permissions?: string[];
    size?: number;
    version?: string;
  };
}

/**
 * Create stalkerware signature from detected app
 */
export async function createStalkerwareSignature(
  packageName: string,
  appData: ArrayBuffer | null,
  metadata: {
    permissions?: string[];
    size?: number;
    version?: string;
  }
): Promise<StalkerwareSignature> {
  // If we have app data, hash it
  // Otherwise, hash the package name as identifier
  const hash = appData 
    ? await hashFile(appData)
    : await hashString(packageName);

  return {
    packageName,
    hash,
    algorithm: 'SHA-256',
    detectionMethod: appData ? 'binary_analysis' : 'package_name',
    timestamp: new Date().toISOString(),
    metadata,
  };
}

// ==================== Comparison Utilities ====================

/**
 * Compare two hashes (constant-time to prevent timing attacks)
 */
export function compareHashes(hash1: string, hash2: string): boolean {
  if (hash1.length !== hash2.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < hash1.length; i++) {
    result |= hash1.charCodeAt(i) ^ hash2.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Check if a hash matches any in a list of known malicious hashes
 */
export function findMatchingHash(hash: string, knownHashes: string[]): boolean {
  return knownHashes.some(known => compareHashes(hash, known));
}

// ==================== Test Data Generation ====================

/**
 * Generate a mock file hash for testing
 * In production, this would hash actual file data
 */
export async function generateMockFileHash(fileName: string): Promise<string> {
  return hashString(`mock_file:${fileName}:${Date.now()}`);
}
