import { Request, Response } from 'express';
import { storage } from '../storage';
import crypto from 'crypto';
import { sendOtpEmail } from '../directEmailSender';

// Generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate a unique token for tracking OTP requests
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Send OTP to user email
export const sendOtp = async (req: Request, res: Response) => {
  try {
    console.log('OTP generate request:', req.body);
    const { email, organizationId, organizationName } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Generate a random 6-digit OTP
    const otp = generateOTP();
    
    // Generate a unique token for verification
    const token = generateToken();
    
    // Set expiry time (15 minutes from now)
    const expiryTime = new Date(Date.now() + 15 * 60 * 1000);
    
    // Store OTP in database
    try {
      await storage.createOtpVerification({
        token,
        otp,
        email,
        organizationId: organizationId || null,
        expiresAt: expiryTime
      });
      console.log('OTP verification stored successfully');
    } catch (dbError) {
      console.error('Error storing OTP in database:', dbError);
      return res.status(500).json({ 
        message: 'Failed to process OTP request',
        error: dbError instanceof Error ? dbError.message : 'Database error'
      });
    }
    
    // Clean up expired OTPs
    try {
      const deletedCount = await storage.cleanupExpiredOtps();
      if (deletedCount > 0) {
        console.log(`Cleaned up ${deletedCount} expired OTPs`);
      }
    } catch (cleanupError) {
      console.warn('Failed to clean up expired OTPs:', cleanupError);
    }
    
    // Send OTP email using our direct email sender
    console.log('Sending OTP email using direct sender');
    const orgName = organizationName || 'ComplyArk';
    
    try {
      const emailResult = await sendOtpEmail(email, otp, orgName);
      
      if (emailResult.success) {
        console.log('OTP email sent successfully:', emailResult.messageId);
      } else {
        console.error('Failed to send OTP email:', emailResult.error);
      }
      
      // In development mode, include the OTP in the response for testing
      if (process.env.NODE_ENV === 'development') {
        return res.status(200).json({
          message: 'OTP sent successfully',
          email,
          token,
          otpForTesting: otp,
          emailSent: emailResult.success
        });
      }
      
      return res.status(200).json({
        message: 'OTP sent successfully',
        email,
        token,
        emailSent: emailResult.success
      });
    } catch (emailError) {
      console.error('Error in OTP email sending:', emailError);
      
      // Return success in development mode with the OTP for testing
      if (process.env.NODE_ENV === 'development') {
        return res.status(200).json({
          message: 'OTP generated (email failed)',
          email,
          token,
          otpForTesting: otp,
          emailSent: false
        });
      }
      
      return res.status(200).json({
        message: 'OTP generated (email failed)',
        email,
        token,
        emailSent: false
      });
    }
  } catch (error) {
    console.error('Error in sendOtp:', error);
    return res.status(500).json({
      message: 'Failed to send OTP',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Verify OTP
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { token, otp } = req.body;
    
    if (!token || !otp) {
      return res.status(400).json({ message: 'Token and OTP are required' });
    }
    
    // Get OTP verification from database
    const verification = await storage.getOtpVerification(token);
    
    if (!verification) {
      return res.status(400).json({ message: 'Invalid token' });
    }
    
    // Check if OTP has expired
    const now = new Date();
    if (verification.expiresAt < now) {
      return res.status(400).json({ message: 'OTP has expired' });
    }
    
    // Check if OTP matches
    if (verification.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    
    // Set authentication in session
    if (req.session) {
      req.session.authenticated = true;
      req.session.email = verification.email;
      
      if (verification.organizationId) {
        req.session.organizationId = verification.organizationId;
      }
    }
    
    // Delete verified OTP
    await storage.deleteOtpVerification(token);
    
    return res.status(200).json({
      message: 'OTP verified successfully',
      email: verification.email,
      organizationId: verification.organizationId
    });
  } catch (error) {
    console.error('Error in verifyOtp:', error);
    return res.status(500).json({
      message: 'Failed to verify OTP',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Check authentication status
export const checkAuth = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.body;
    
    // Check if user is authenticated
    if (req.session?.authenticated) {
      // If organizationId is provided, check if it matches the session
      if (organizationId && req.session.organizationId !== organizationId) {
        return res.status(200).json({ authenticated: false });
      }
      
      return res.status(200).json({
        authenticated: true,
        email: req.session.email,
        organizationId: req.session.organizationId
      });
    }
    
    return res.status(200).json({ authenticated: false });
  } catch (error) {
    console.error('Error in checkAuth:', error);
    return res.status(500).json({
      message: 'Failed to check authentication',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};