import { Request, Response } from 'express';
import { z } from 'zod';
import { randomInt } from 'crypto';
import { sendEmail, generateOTPEmailTemplate } from '../utils/emailService';

// In-memory store for OTPs - in production, use a more persistent solution with TTL
interface OTPRecord {
  email: string;
  otp: string;
  expiresAt: Date;
  organizationId: number;
  attempts: number;
}

// Store OTPs with expiration (30 minutes)
const otpStore: Map<string, OTPRecord> = new Map();

// Clean up expired OTPs every 5 minutes
setInterval(() => {
  const now = new Date();
  for (const [key, record] of otpStore.entries()) {
    if (record.expiresAt < now) {
      otpStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Email validation schema
const emailSchema = z.object({
  email: z.string().email('Invalid email format'),
});

// OTP verification schema
const otpVerificationSchema = z.object({
  email: z.string().email('Invalid email format'),
  otp: z.string().min(6, 'OTP must be at least 6 characters'),
  organizationId: z.number().int().positive()
});

// Generate a random OTP
function generateOTP(length = 6): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += randomInt(0, 10).toString();
  }
  return result;
}

// Send OTP to email using our email service
async function sendOTPEmail(email: string, otp: string, organizationName: string): Promise<boolean> {
  try {
    // Get HTML and text versions of the email
    const { text, html } = generateOTPEmailTemplate(otp, organizationName, 30);
    
    // Send the email
    const emailSent = await sendEmail({
      to: email,
      subject: `${organizationName} - Your Verification Code`,
      text,
      html
    });
    
    return emailSent;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
}

// Generate and send OTP
export const generateOTPForEmail = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const orgId = parseInt(organizationId, 10);
    
    if (isNaN(orgId)) {
      return res.status(400).json({ message: 'Invalid organization ID' });
    }
    
    // Validate email
    const validationResult = emailSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid email address', 
        errors: validationResult.error.format() 
      });
    }
    
    const { email } = validationResult.data;
    
    // Get organization
    const organization = await (req as any).storage.getOrganization(orgId);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    
    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30); // Expires in 30 minutes
    
    // Store OTP
    const key = `${email}-${orgId}`;
    otpStore.set(key, {
      email,
      otp,
      expiresAt,
      organizationId: orgId,
      attempts: 0
    });
    
    // Send OTP via email
    const emailSent = await sendOTPEmail(email, otp, organization.businessName);
    
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
    }
    
    return res.status(200).json({ 
      message: 'OTP sent successfully', 
      email: email,
      expiresAt
    });
  } catch (error) {
    console.error('Error generating OTP:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Verify OTP
export const verifyOTP = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validationResult = otpVerificationSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid verification data', 
        errors: validationResult.error.format() 
      });
    }
    
    const { email, otp, organizationId } = validationResult.data;
    
    // Get OTP record
    const key = `${email}-${organizationId}`;
    const record = otpStore.get(key);
    
    // Check if OTP exists
    if (!record) {
      return res.status(404).json({ message: 'OTP not found or expired. Please request a new OTP.' });
    }
    
    // Check if OTP has expired
    if (record.expiresAt < new Date()) {
      otpStore.delete(key);
      return res.status(401).json({ message: 'OTP has expired. Please request a new OTP.' });
    }
    
    // Check if too many attempts
    if (record.attempts >= 3) {
      otpStore.delete(key);
      return res.status(401).json({ message: 'Too many failed attempts. Please request a new OTP.' });
    }
    
    // Increment attempts
    record.attempts++;
    
    // Check if OTP matches
    if (record.otp !== otp) {
      return res.status(401).json({ 
        message: 'Invalid OTP. Please try again.', 
        attemptsLeft: 3 - record.attempts
      });
    }
    
    // OTP verified successfully
    
    // Set session data
    if (req.session) {
      req.session.authenticated = true;
      req.session.email = email;
      req.session.organizationId = organizationId;
    }
    
    // Create a temporary access token
    const accessToken = generateSessionToken();
    
    // Clear OTP after successful verification
    otpStore.delete(key);
    
    return res.status(200).json({ 
      message: 'OTP verified successfully', 
      accessToken,
      email
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Check if user is authenticated for a specific organization
export const checkAuthentication = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.body;
    
    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }
    
    const orgId = parseInt(organizationId.toString(), 10);
    
    if (isNaN(orgId)) {
      return res.status(400).json({ message: 'Invalid organization ID' });
    }
    
    // Check if session exists and if user is authenticated for this organization
    if (
      req.session && 
      req.session.authenticated === true && 
      req.session.organizationId === orgId
    ) {
      return res.status(200).json({ 
        authenticated: true,
        email: req.session.email
      });
    }
    
    return res.status(200).json({ authenticated: false });
  } catch (error) {
    console.error('Error checking authentication:', error);
    return res.status(500).json({ message: 'An error occurred while checking authentication' });
  }
};

// Logout / End session
export const logout = async (req: Request, res: Response) => {
  try {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('Error destroying session:', err);
          return res.status(500).json({ message: 'Failed to log out' });
        }
        
        res.clearCookie('connect.sid'); // Clear the session cookie
        return res.status(200).json({ message: 'Logged out successfully' });
      });
    } else {
      return res.status(200).json({ message: 'Already logged out' });
    }
  } catch (error) {
    console.error('Error logging out:', error);
    return res.status(500).json({ message: 'An error occurred while logging out' });
  }
};

// Generate a random session token
function generateSessionToken(length = 48): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}