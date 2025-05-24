import nodemailer from 'nodemailer';
import { db } from '../db';
import { emailSettings } from '@shared/schema';

/**
 * Centralized email service that handles sending emails
 * regardless of the configured provider
 */
export class EmailService {
  /**
   * Sends an email using the configured provider
   * Currently using SMTP directly regardless of configuration
   */
  static async sendEmail(
    to: string,
    subject: string,
    htmlContent: string,
    textContent: string
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      console.log('EMAIL SERVICE: Starting email sending process');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      
      // Get email settings from database
      const settings = await db.select().from(emailSettings).limit(1);
      
      if (settings.length === 0) {
        console.error('EMAIL SERVICE: No email settings found in database');
        return { success: false, error: 'Email settings not configured' };
      }
      
      const config = settings[0];
      console.log('EMAIL SERVICE: Using email settings:');
      console.log('- Provider:', config.provider);
      console.log('- SMTP Host:', config.smtpHost);
      console.log('- SMTP Port:', config.smtpPort);
      
      // As requested, we always use SMTP regardless of the provider setting
      console.log('EMAIL SERVICE: Using SMTP as requested');
      
      // Configure nodemailer transport with the exact settings that worked in the test
      const transportOptions = {
        host: config.smtpHost || 'smtp.gmail.com',
        port: Number(config.smtpPort) || 587,
        secure: false, // Use TLS
        auth: {
          user: config.smtpUsername || 'automatikgarage@gmail.com',
          pass: config.smtpPassword || '',
        },
        tls: {
          rejectUnauthorized: false // Accept self-signed certificates
        },
        debug: true, // Enable debug output for detailed logs
        logger: true  // Log information into the console
      };
      
      console.log('EMAIL SERVICE: Transport options:', JSON.stringify(transportOptions, (key, value) => 
        key === 'pass' ? '******' : value, 2));
      
      // Create transporter
      console.log('EMAIL SERVICE: Creating transport...');
      const transporter = nodemailer.createTransport(transportOptions as any);
      
      // Verify connection
      console.log('EMAIL SERVICE: Verifying SMTP connection...');
      try {
        const verification = await transporter.verify();
        console.log('EMAIL SERVICE: SMTP connection verification result:', verification);
        console.log('EMAIL SERVICE: SMTP connection verified successfully');
      } catch (verifyError) {
        console.error('EMAIL SERVICE: SMTP connection verification failed:');
        console.error(verifyError);
        return { 
          success: false, 
          error: `SMTP connection failed: ${verifyError instanceof Error ? verifyError.message : 'Unknown error'}`
        };
      }
      
      // Send email with enhanced debugging
      console.log('EMAIL SERVICE: Sending email...');
      const mailOptions = {
        from: `"${config.fromName || 'ComplyArk'}" <${config.fromEmail || 'automatikgarage@gmail.com'}>`,
        to,
        subject,
        text: textContent,
        html: htmlContent,
        priority: 'high' as const, // Fixed type issue
        headers: {
          'X-Priority': '1',
          'Importance': 'high',
          'X-MSMail-Priority': 'High'
        }
      };
      
      console.log('EMAIL SERVICE: Mail options:', JSON.stringify({
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        headers: mailOptions.headers
      }, null, 2));
      
      const result = await transporter.sendMail(mailOptions);
      
      console.log(`EMAIL SERVICE: Email sent successfully to ${to}`);
      console.log(`EMAIL SERVICE: Message ID: ${result.messageId}`);
      
      return { 
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      console.error('EMAIL SERVICE: Error sending email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error'
      };
    }
  }
  
  /**
   * Specialized function for sending OTP verification emails
   */
  static async sendOtpEmail(
    to: string,
    otp: string,
    organizationName: string = 'ComplyArk'
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    console.log(`EMAIL SERVICE: Sending OTP email to: ${to}`);
    console.log(`OTP: ${otp}`);
    
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
    
    return await this.sendEmail(to, subject, htmlContent, plainText);
  }
}