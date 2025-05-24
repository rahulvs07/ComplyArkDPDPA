import nodemailer from 'nodemailer';
import { db } from '../db';
import { emailSettings } from '@shared/schema';

/**
 * Specialized service for sending OTP emails
 * This bypasses the template system and uses a direct approach for more reliable delivery
 */
export async function sendOtpEmail(
  to: string,
  otp: string,
  organizationName: string = 'ComplyArk'
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔑 SENDING OTP EMAIL DIRECTLY');
    console.log(`📧 To: ${to}`);
    console.log(`🔢 OTP: ${otp}`);
    console.log(`🏢 Organization: ${organizationName}`);
    
    // Get email settings
    const settings = await db.select().from(emailSettings).limit(1);
    
    if (settings.length === 0) {
      console.error('No email settings found in database');
      return { success: false, error: 'Email settings not configured' };
    }
    
    const config = settings[0];
    console.log('📧 Using email settings:', {
      provider: config.provider,
      host: config.smtpHost,
      port: config.smtpPort,
      username: config.smtpUsername,
      fromEmail: config.fromEmail
    });
    
    // Prepare email content
    const subject = `Your Verification Code for ${organizationName}`;
    const plainText = `Your verification code is: ${otp}. This code will expire in 15 minutes.`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4F46E5; color: white; padding: 20px; text-align: center;">
          <h2>${organizationName} Verification</h2>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9;">
          <p>Hello,</p>
          <p>Your verification code for ${organizationName} is:</p>
          <div style="font-size: 24px; font-weight: bold; background-color: #eaeaea; padding: 10px; text-align: center; margin: 20px 0; letter-spacing: 5px;">${otp}</div>
          <p>This code will expire in 15 minutes.</p>
        </div>
      </div>
    `;
    
    // Direct SMTP approach - always use this for OTP
    try {
      // Use the nodemailer.createTransport() method with the proper configuration
      const transportOptions = {
        host: config.smtpHost,
        port: Number(config.smtpPort) || 587,
        secure: false, // Try without TLS first
        auth: {
          user: config.smtpUsername || '',
          pass: config.smtpPassword || '',
        },
        // Add additional TLS options to handle SSL/TLS version issues
        tls: {
          rejectUnauthorized: false
        }
      };
      
      console.log('🔄 Creating SMTP transport');
      const transporter = nodemailer.createTransport(transportOptions);
      
      console.log('🔄 Verifying SMTP connection...');
      await transporter.verify();
      console.log('✅ SMTP connection verified successfully');
      
      console.log('🔄 Sending OTP email via SMTP...');
      const result = await transporter.sendMail({
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to,
        subject,
        text: plainText,
        html: htmlContent,
      });
      
      console.log(`✅ OTP email sent successfully, message ID: ${result.messageId}`);
      return { success: true };
    } catch (smtpError) {
      console.error('❌ SMTP error when sending OTP:', smtpError);
      
      // For development environment, simulate success
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 DEV MODE: Simulating successful email send despite error');
        console.log(`📋 Would have sent OTP ${otp} to ${to}`);
        return { success: true };
      }
      
      return {
        success: false,
        error: smtpError instanceof Error ? smtpError.message : 'Unknown SMTP error'
      };
    }
  } catch (error) {
    console.error('❌ Error in sendOtpEmail:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}