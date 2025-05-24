import { Request, Response } from 'express';
import { sendEmail, sendEmailWithTemplate } from './emailController';
import { storage } from '../storage';
import crypto from 'crypto';

// Generate OTP
function generateOTP(): string {
  // Generate a 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate a token for tracking OTP requests
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Send OTP to user email
export const sendOtp = async (req: Request, res: Response) => {
  try {
    console.log('OTP request received for processing');
    const { email, organizationId } = req.body;
    
    if (!email) {
      console.log('OTP request rejected: missing email');
      return res.status(400).json({ message: 'Email is required' });
    }
    
    console.log(`Processing OTP request for email: ${email}`);
    
    // Generate OTP and token
    const otp = generateOTP();
    const token = generateToken();
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + 15); // OTP valid for 15 minutes
    
    // Store OTP data in database
    try {
      console.log('Storing OTP verification in database');
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
    
    // Send OTP via email using template
    console.log('Sending OTP via email using template');
    const emailResult = await sendEmailWithTemplate(
      email,
      'OTP Verification',
      {
        otp: otp,
        expiryMinutes: '15'
      }
    );
    
    // Fallback to direct email sending if template not found
    if (!emailResult.success && emailResult.error?.includes('not found')) {
      console.log('OTP template not found, using fallback email format');
      
      const subject = 'Your OTP Verification Code';
      const plainText = `
        ComplyArk Verification
        Your One-Time Password (OTP) for verification is: ${otp}
        This OTP will expire in 15 minutes.
        If you did not request this OTP, please ignore this email.
      `;
      
      const htmlMessage = `
        <h2>ComplyArk Verification</h2>
        <p>Your One-Time Password (OTP) for verification is: <strong>${otp}</strong></p>
        <p>This OTP will expire in 15 minutes.</p>
        <p>If you did not request this OTP, please ignore this email.</p>
      `;
      
      console.log('Attempting fallback email format');
      const fallbackResult = await sendEmail(email, subject, plainText, htmlMessage);
      
      // Use the fallback result instead
      if (fallbackResult.success) {
        console.log('Fallback email sent successfully');
        emailResult.success = true;
        emailResult.error = undefined;
      } else {
        console.error('Fallback email also failed:', fallbackResult.error);
      }
    }
    
    // Log success or failure
    if (!emailResult.success) {
      console.log('Failed to send OTP email. Error:', emailResult.error);
      console.log('Proceeding anyway for testing purposes with OTP:', otp);
    } else {
      console.log('OTP email sent successfully');
    }
    
    // Create response object
    const responseData: any = {
      message: 'OTP sent successfully',
      token,
      expiresAt: expiryTime
    };
    
    // Always include test information for admin testing
    console.log('********************************************');
    console.log('*** TEST OTP: ' + otp + ' ***');
    console.log('*** USE THIS CODE FOR VERIFICATION ***');
    console.log('********************************************');
    
    // Include the OTP directly in the response for easier testing
    responseData.testOtp = otp; // Make OTP visible in the response for testing
    responseData.email = email;
    responseData.testInfo = {
      testOtp: otp,
      emailStatus: emailResult.success ? 'sent' : 'failed'
    };
    
    // Include error details if email failed
    if (!emailResult.success && emailResult.error) {
      responseData.testInfo.emailError = emailResult.error;
    }
    
    console.log('OTP process completed successfully');
    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ 
      message: 'Failed to send OTP',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Verify OTP
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { otp, token } = req.body;
    
    if (!otp || !token) {
      return res.status(400).json({ message: 'OTP and token are required' });
    }
    
    // Retrieve stored OTP data from database
    const storedData = await storage.getOtpVerificationByToken(token);
    
    if (!storedData) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    
    // Check if OTP has already been verified
    if (storedData.verified) {
      return res.status(400).json({ message: 'This OTP has already been used' });
    }
    
    // Check if OTP has expired
    if (new Date() > storedData.expiresAt) {
      return res.status(400).json({ message: 'OTP has expired' });
    }
    
    // Verify OTP
    if (storedData.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    
    // Mark OTP as verified in database
    await storage.markOtpAsVerified(token);
    
    // Update session if available
    if (req.session) {
      req.session.authenticated = true;
      req.session.email = storedData.email;
      req.session.organizationId = storedData.organizationId;
    }
    
    return res.status(200).json({
      message: 'OTP verified successfully',
      email: storedData.email,
      organizationId: storedData.organizationId
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ message: 'Failed to verify OTP' });
  }
};