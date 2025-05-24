import nodemailer from 'nodemailer';
import { db } from './db';
import { emailSettings } from '@shared/schema';

/**
 * Direct email sender for critical emails like OTP
 * This bypasses any template system or complex processing
 */
export async function sendDirectEmail(
  to: string,
  subject: string,
  htmlContent: string,
  textContent: string
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    console.log('DIRECT EMAIL: Starting email sending process');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    
    // Get email settings from database
    const settings = await db.select().from(emailSettings).limit(1);
    
    if (settings.length === 0) {
      console.error('DIRECT EMAIL: No email settings found in database');
      return { success: false, error: 'Email settings not configured' };
    }
    
    const config = settings[0];
    console.log('DIRECT EMAIL: Using email settings:');
    console.log('- Provider:', config.provider);
    console.log('- SMTP Host:', config.smtpHost);
    console.log('- SMTP Port:', config.smtpPort);
    
    // Configure nodemailer transport based on provider setting
    let transportOptions;
    
    if (config.provider === 'sendgrid') {
      // We're using a dummy key as requested and falling back to SMTP
      console.log('DIRECT EMAIL: SendGrid configured, but using SMTP as requested');
    }
    
    // Always use SMTP configuration as requested
    // Clean up password - remove any trailing commas or spaces that might cause auth issues
    let cleanPassword = '';
    if (config.smtpPassword) {
      cleanPassword = config.smtpPassword.trim();
      console.log(`DIRECT EMAIL: Original password length: ${config.smtpPassword.length}, Cleaned password length: ${cleanPassword.length}`);
    }
    
    // Check if using Gmail SMTP
    const isGmail = (config.smtpHost || '').includes('gmail.com');
    
    transportOptions = {
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
    
    console.log(`DIRECT EMAIL: Using ${isGmail ? 'Gmail' : 'Standard'} SMTP configuration`);
    console.log(`DIRECT EMAIL: Secure mode: ${transportOptions.secure ? 'SSL (Port 465)' : 'STARTTLS (Port 587)'}`);
    
    
    console.log('DIRECT EMAIL: Transport options:', JSON.stringify(transportOptions, (key, value) => 
      key === 'pass' ? '******' : value, 2));
    
    // Create transporter
    console.log('DIRECT EMAIL: Creating transport...');
    const transporter = nodemailer.createTransport(transportOptions as any);
    
    // Verify connection
    console.log('DIRECT EMAIL: Verifying SMTP connection...');
    try {
      const verification = await transporter.verify();
      console.log('DIRECT EMAIL: SMTP connection verification result:', verification);
      console.log('DIRECT EMAIL: SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('DIRECT EMAIL: SMTP connection verification failed:');
      console.error(verifyError);
      return { 
        success: false, 
        error: `SMTP connection failed: ${verifyError instanceof Error ? verifyError.message : 'Unknown error'}`
      };
    }
    
    // Send email with enhanced debugging
    console.log('DIRECT EMAIL: Sending email...');
    const mailOptions = {
      from: `"${config.fromName || 'ComplyArk'}" <${config.fromEmail || 'automatikgarage@gmail.com'}>`,
      to,
      subject,
      text: textContent,
      html: htmlContent,
      priority: 'high',
      headers: {
        'X-Priority': '1',
        'Importance': 'high',
        'X-MSMail-Priority': 'High'
      }
    };
    
    console.log('DIRECT EMAIL: Mail options:', JSON.stringify({
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      headers: mailOptions.headers
    }, null, 2));
    
    const result = await transporter.sendMail(mailOptions);
    
    console.log(`DIRECT EMAIL: Email sent successfully to ${to}`);
    console.log(`DIRECT EMAIL: Message ID: ${result.messageId}`);
    
    return { 
      success: true,
      messageId: result.messageId
    };
  } catch (error) {
    console.error('DIRECT EMAIL: Error sending email:', error);
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
export async function sendOtpEmail(
  to: string,
  otp: string,
  organizationName: string = 'ComplyArk'
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    console.log(`SENDING OTP EMAIL TO: ${to}`);
    console.log(`OTP: ${otp}`);
    console.log(`Organization: ${organizationName}`);
    
    // Create a more professional email subject
    const subject = `${otp} is your verification code for ${organizationName}`;
    
    // Create a simple plain text version for email clients that don't support HTML
    const plainText = `
Your verification code is: ${otp}

This code will expire in 15 minutes.

Please enter this code on the verification page to continue.

This is an automated message, please do not reply.

© ${new Date().getFullYear()} ${organizationName}
    `;
    
    // Create a professional HTML email with better branding and design
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);">
    <tr>
      <td style="padding: 30px 0; background-color: #4F46E5; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${organizationName}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #333333;">Hello,</p>
        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #333333;">Please use the following verification code to complete your request:</p>
        
        <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 4px; padding: 20px; margin: 30px 0; text-align: center;">
          <p style="font-size: 32px; font-weight: bold; margin: 0; letter-spacing: 5px; color: #4F46E5;">${otp}</p>
        </div>
        
        <p style="margin: 0 0 10px; font-size: 16px; line-height: 1.5; color: #333333;">This code will expire in 15 minutes.</p>
        <p style="margin: 0 0 10px; font-size: 16px; line-height: 1.5; color: #333333;">If you did not request this code, please ignore this email.</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 30px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e9ecef;">
        <p style="margin: 0; font-size: 14px; color: #6c757d;">This is an automated message, please do not reply.</p>
        <p style="margin: 10px 0 0; font-size: 14px; color: #6c757d;">© ${new Date().getFullYear()} ${organizationName}</p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
    
    // Attempt to send email with detailed logging
    console.log('DIRECT EMAIL: Starting OTP email sending process...');
    const result = await sendDirectEmail(to, subject, htmlContent, plainText);
    
    if (result.success) {
      console.log('DIRECT EMAIL: OTP email sent successfully');
      console.log('DIRECT EMAIL: Message ID:', result.messageId);
    } else {
      console.error('DIRECT EMAIL: OTP email sending failed:', result.error);
      // Log additional diagnostic information
      console.error('DIRECT EMAIL: Recipient:', to);
      console.error('DIRECT EMAIL: Subject:', subject);
    }
    
    return result;
  } catch (error) {
    console.error('DIRECT EMAIL: Unexpected error in sendOtpEmail function:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error in OTP email function'
    };
  }
}