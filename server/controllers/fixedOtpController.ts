import { Request, Response } from 'express';
import { storage } from '../storage';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { db } from '../db';
import { emailSettings } from '@shared/schema';

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
      await storage.saveOtpVerification({
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
    
    // Send OTP via email
    console.log('********************************************');
    console.log('SENDING OTP EMAIL');
    console.log(`To: ${email}`);
    console.log(`OTP: ${otp}`);
    console.log(`Organization ID: ${organizationId || 'Not specified'}`);
    const orgName = organizationName || 'ComplyArk';
    console.log(`Organization Name: ${orgName}`);
    console.log('********************************************');
    
    // Prepare email content
    const subject = `Your Verification Code for ${orgName}`;
    const plainText = `Your verification code is: ${otp}. This code will expire in 15 minutes.`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4F46E5; color: white; padding: 20px; text-align: center;">
          <h2>${orgName} Verification</h2>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9;">
          <p>Hello,</p>
          <p>Your verification code for ${orgName} is:</p>
          <div style="font-size: 24px; font-weight: bold; background-color: #eaeaea; padding: 10px; text-align: center; margin: 20px 0; letter-spacing: 5px;">${otp}</div>
          <p>This code will expire in 15 minutes.</p>
        </div>
      </div>
    `;
    
    // Send email using SMTP
    let emailSent = false;
    try {
      // Get email settings from database
      const settings = await db.select().from(emailSettings).limit(1);
      
      if (settings.length > 0) {
        const config = settings[0];
        
        // Configure nodemailer transport
        const transportOptions = {
          host: config.smtpHost || '',
          port: Number(config.smtpPort) || 587,
          secure: false, // Use TLS
          auth: {
            user: config.smtpUsername || '',
            pass: config.smtpPassword || '',
          },
          tls: {
            rejectUnauthorized: false // Bypass certificate validation
          }
        };
        
        console.log('Creating SMTP transport with settings:', {
          host: config.smtpHost,
          port: config.smtpPort,
          username: config.smtpUsername
        });
        
        try {
          // Create transporter
          const transporter = nodemailer.createTransport(transportOptions as any);
          
          // Verify connection
          await transporter.verify();
          console.log('SMTP connection verified successfully');
          
          // Send email
          const result = await transporter.sendMail({
            from: `"${config.fromName}" <${config.fromEmail}>`,
            to: email,
            subject,
            text: plainText,
            html: htmlContent,
          });
          
          console.log(`Email sent successfully to ${email}, message ID: ${result.messageId}`);
          emailSent = true;
        } catch (smtpError) {
          console.error('SMTP error when sending email:', smtpError);
        }
      } else {
        console.error('No email settings found in database');
      }
    } catch (emailError) {
      console.error('Error during email sending process:', emailError);
    }
    
    // In development mode, always return success and include OTP in response
    // This allows testing without actually sending emails
    if (process.env.NODE_ENV === 'development') {
      console.log('DEV MODE: Returning OTP in response for testing');
      return res.status(200).json({
        message: 'OTP sent successfully',
        email,
        otpForTesting: otp,
        token,
        emailSent
      });
    }
    
    // In production, only return success status
    return res.status(200).json({
      message: 'OTP sent successfully',
      email,
      token,
      emailSent
    });
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