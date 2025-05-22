import { randomBytes } from 'crypto';

/**
 * Generates a secure random token for request page URLs
 * @param length Length of the token to generate
 * @returns A secure random string
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Creates an encrypted token containing the organization ID
 * This is a simple implementation using base64 encoding and a prefix
 * For production, consider using a proper encryption method
 * @param organizationId The organization ID to encode
 * @returns An encoded token string
 */
export function encodeOrganizationId(organizationId: number): string {
  // Create a string with a prefix and the organization ID
  const tokenData = `org_${Date.now()}_${organizationId}`;
  
  // Base64 encode it and replace characters that might cause URL issues
  return Buffer.from(tokenData).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Decodes an organization token back to its ID
 * @param token The encoded token
 * @returns The organization ID or null if invalid
 */
export function decodeOrganizationToken(token: string): number | null {
  try {
    // Restore base64 padding if needed
    let paddedToken = token;
    while (paddedToken.length % 4 !== 0) {
      paddedToken += '=';
    }
    
    // Replace URL-safe characters back
    paddedToken = paddedToken.replace(/-/g, '+').replace(/_/g, '/');
    
    // Decode and extract the organization ID
    const decoded = Buffer.from(paddedToken, 'base64').toString();
    const match = decoded.match(/^org_\d+_(\d+)$/);
    
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    
    return null;
  } catch (error) {
    console.error('Error decoding organization token:', error);
    return null;
  }
}