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
      
      // Clean up password - remove any trailing commas or spaces that might cause auth issues
      let cleanPassword = '';
      if (config.smtpPassword) {
        // Gmail app passwords are 16 characters without spaces
        // If password has spaces or unexpected characters, it might be corrupted
        cleanPassword = config.smtpPassword.trim();
        console.log(`Original password length: ${config.smtpPassword.length}, Cleaned password length: ${cleanPassword.length}`);
      }
      
      // Configure nodemailer transport with proper settings for Gmail
      const isGmail = (config.smtpHost || '').includes('gmail.com');
      
      const transportOptions = {
        host: config.smtpHost || 'smtp.gmail.com',
        port: Number(config.smtpPort) || 587,
        secure: Number(config.smtpPort) === 465, // Use SSL if port is 465, otherwise use STARTTLS
        auth: {
          user: config.smtpUsername || 'automatikgarage@gmail.com',
          pass: cleanPassword || '',
        },
        tls: {
          // Gmail requires proper certificates
          rejectUnauthorized: isGmail ? true : false,
          // For Gmail, we need to add these options
          ...(isGmail && {
            minVersion: 'TLSv1.2'
          })
        },
        debug: true, // Enable debug output for detailed logs
        logger: true  // Log information into the console
      };
      
      console.log(`Using ${isGmail ? 'Gmail' : 'Standard'} SMTP configuration`);
      console.log(`Secure mode: ${transportOptions.secure ? 'SSL (Port 465)' : 'STARTTLS (Port 587)'}`);
      
      
      console.log('EMAIL SERVICE: Transport options:', JSON.stringify(transportOptions, (key, value) => 
        key === 'pass' ? '******' : value, 2));
      
      // Create transporter
      console.log('EMAIL SERVICE: Creating transport...');
      const transporter = nodemailer.createTransport(transportOptions as any);
      
      // Verify connection with detailed diagnostics
      console.log('EMAIL SERVICE: Verifying SMTP connection...');
      console.log(`SMTP Server: ${transportOptions.host}:${transportOptions.port}`);
      console.log(`SMTP Username: ${transportOptions.auth.user}`);
      console.log('SMTP Password: ******** (masked for security)');
      console.log(`TLS Settings: ${JSON.stringify(transportOptions.tls)}`);
      
      try {
        const verification = await transporter.verify();
        console.log('EMAIL SERVICE: SMTP connection verification result:', verification);
        console.log('SMTP connection verified successfully');
      } catch (verifyError) {
        console.error('EMAIL SERVICE: SMTP connection verification failed:');
        console.error(verifyError);
        
        // Add detailed error diagnostics
        if (verifyError instanceof Error) {
          console.error('Error name:', verifyError.name);
          console.error('Error message:', verifyError.message);
          console.error('Error stack:', verifyError.stack);
          
          // Common SMTP error diagnostics
          if (verifyError.message.includes('ECONNREFUSED')) {
            console.error('DIAGNOSTIC: The SMTP server refused the connection. Check if:');
            console.error('- The SMTP server hostname and port are correct');
            console.error('- There are no firewall issues blocking the connection');
            console.error('- The SMTP server is running and accepting connections');
          } else if (verifyError.message.includes('ETIMEDOUT')) {
            console.error('DIAGNOSTIC: Connection to the SMTP server timed out. Check if:');
            console.error('- The SMTP server hostname and port are correct');
            console.error('- There are no network issues or high latency');
          } else if (verifyError.message.includes('EAUTH')) {
            console.error('DIAGNOSTIC: Authentication failed. Check if:');
            console.error('- The username and password are correct');
            console.error('- The authentication method is supported by the server');
            console.error('- There are no account restrictions or security settings preventing access');
          }
        }
        
        return { 
          success: false, 
          error: `SMTP connection failed: ${verifyError instanceof Error ? verifyError.message : 'Unknown error'}`
        };
      }
      
      // Send email with enhanced debugging
      console.log('EMAIL SERVICE: Sending email...');
      console.log(`Attempting to send email to ${to} using SMTP: ${transportOptions.host}:${transportOptions.port}`);
      
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
      
      try {
        const result = await transporter.sendMail(mailOptions);
        
        console.log(`Email sent successfully to ${to}, message ID: ${result.messageId}`);
        console.log('SMTP response info:', JSON.stringify(result.response || 'No response info'));
        
        // Save a record of the successful email sending in the logs
        const emailLog = {
          timestamp: new Date().toISOString(),
          recipient: to,
          subject: subject,
          messageId: result.messageId,
          provider: config.provider,
          smtpServer: `${transportOptions.host}:${transportOptions.port}`,
          success: true
        };
        console.log('EMAIL DELIVERY LOG:', JSON.stringify(emailLog, null, 2));
        
        return { 
          success: true,
          messageId: result.messageId
        };
      } catch (emailError) {
        console.error('EMAIL SERVICE: Failed to send email:', emailError);
        console.error('EMAIL SERVICE: Error details:', JSON.stringify(emailError, null, 2));
        
        // Save a record of the failed email sending attempt in the logs
        const errorLog = {
          timestamp: new Date().toISOString(),
          recipient: to,
          subject: subject,
          provider: config.provider,
          smtpServer: `${transportOptions.host}:${transportOptions.port}`,
          success: false,
          errorMessage: emailError instanceof Error ? emailError.message : 'Unknown email error',
          errorName: emailError instanceof Error ? emailError.name : 'Unknown'
        };
        console.error('EMAIL DELIVERY ERROR LOG:', JSON.stringify(errorLog, null, 2));
        
        return {
          success: false,
          error: emailError instanceof Error ? emailError.message : 'Unknown email error'
        };
      }
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
   * with enhanced branding and professional design
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
    
    // Enhanced email template with better organization branding
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verification Code</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f7f7f7;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #4F46E5; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">${organizationName}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px 24px;">
              <h2 style="color: #333333; margin-top: 0; margin-bottom: 16px; font-size: 20px;">Verification Required</h2>
              <p style="color: #555555; margin-bottom: 24px; line-height: 1.5;">Please use the following verification code to complete your request:</p>
              
              <!-- OTP Code Box -->
              <div style="background-color: #f0f0f8; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4F46E5;">${otp}</span>
              </div>
              
              <p style="color: #555555; line-height: 1.5;">This verification code will expire in <strong>15 minutes</strong>.</p>
              <p style="color: #555555; line-height: 1.5; margin-bottom: 24px;">If you did not request this code, please ignore this email or contact support if you have concerns.</p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f2f2f2; padding: 16px 24px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="color: #777777; font-size: 13px; margin: 0;">
                &copy; ${new Date().getFullYear()} ${organizationName}. All rights reserved.
              </p>
              <p style="color: #777777; font-size: 12px; margin-top: 8px;">
                This is an automated message, please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
    
    return await this.sendEmail(to, subject, htmlContent, plainText);
  }
}