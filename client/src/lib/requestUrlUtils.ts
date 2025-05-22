/**
 * Utility functions for working with request page URLs and tokens
 */

/**
 * Extract token from URL path
 * Used to get the request page token from a URL like /request-page/:token
 */
export function extractTokenFromPath(path: string): string | null {
  const segments = path.split('/');
  const requestPageIndex = segments.findIndex(segment => segment === 'request-page');
  
  if (requestPageIndex >= 0 && segments[requestPageIndex + 1]) {
    return segments[requestPageIndex + 1];
  }
  
  return null;
}

/**
 * Create URL for OTP verification with request page token
 * This creates a URL that will redirect back to the request page after verification
 */
export function createOtpUrlWithToken(organizationId: number, token: string): string {
  return `/auth/otp/${organizationId}/${token}`;
}

/**
 * Create URL for request page with token
 */
export function createRequestPageUrl(token: string): string {
  return `/request-page/${token}`;
}

/**
 * Gets the base URL for the application
 * Useful for creating absolute URLs for external sharing
 */
export function getBaseUrl(): string {
  const protocol = window.location.protocol;
  const host = window.location.host;
  return `${protocol}//${host}`;
}