/**
 * EMERGENCY EMAIL SENDER
 * 
 * This module provides a direct email sending function that ignores all test mode flags
 * and uses the database email settings directly.
 */

import nodemailer from 'nodemailer';
import { db } from './db';
import { emailSettings } from '@shared/schema';

/**
 * Send an email directly using database settings, bypassing all test mode flags
 */
export async function forceSendEmail(
  to: string,
  subject: string,
  htmlContent: string,
  textContent: string,
  cc?: string[]
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    console.log('🔴 EMERGENCY EMAIL SENDER: Starting direct email sending process');
    console.log(`📨 To: ${to}`);
    console.log(`📝 Subject: ${subject}`);
    
    // Get email settings from database - this is critical
    const settings = await db.select().from(emailSettings).limit(1);
    
    if (settings.length === 0) {
      console.error('🔴 EMERGENCY EMAIL SENDER: No email settings found in database');
      return { success: false, error: 'Email settings not configured' };
    }
    
    const config = settings[0];
    console.log('📧 Using database email settings:');
    console.log('- Provider:', config.provider);
    console.log('- SMTP Host:', config.smtpHost);
    console.log('- SMTP Port:', config.smtpPort);
    
    // Always use SMTP settings from database
    const transportOptions = {
      host: config.smtpHost,
      port: Number(config.smtpPort),
      secure: Number(config.smtpPort) === 465, // Use SSL if port is 465
      auth: {
        user: config.smtpUsername,
        pass: config.smtpPassword,
      },
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates
      }
    };
    
    // Create transporter with database settings
    console.log('📧 Creating nodemailer transport...');
    const transporter = nodemailer.createTransport(transportOptions);
    
    // Verify SMTP connection
    console.log('📧 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');
    
    // Send email
    console.log('📧 Sending email...');
    const mailOptions = {
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to,
      cc,
      subject,
      text: textContent,
      html: htmlContent
    };
    
    // Send the email and get the result
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email sent successfully to ${to}`);
    console.log(`✅ Message ID: ${info.messageId}`);
    
    // Return success with message ID
    return { 
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('🔴 EMERGENCY EMAIL SENDER ERROR:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email error'
    };
  }
}

/**
 * Send a DPR request creation notification
 */
export async function sendDPRCreationEmail(
  request: {
    requestId: number;
    firstName: string;
    lastName: string;
    email: string;
    requestType: string;
    organizationName: string;
    statusName: string;
    dueDate?: Date;
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const subject = `Your ${request.requestType} Request #${request.requestId} - ${request.organizationName}`;
    
    // Plain text version
    const text = `
Hello ${request.firstName} ${request.lastName},

Thank you for submitting your ${request.requestType} request with ${request.organizationName}. We have received it and will process it accordingly.

Request Details:
- Request ID: ${request.requestId}
- Request Type: ${request.requestType}
- Status: ${request.statusName}
- Due Date: ${request.dueDate ? new Date(request.dueDate).toLocaleDateString() : 'TBD'}

Please keep this Request ID for your records. You may be contacted if additional information is needed.
We will notify you when your request has been processed.

This is an automated message from the ComplyArk system.
`;

    // HTML version
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .details { background-color: #eaeaea; padding: 15px; margin: 15px 0; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Request Confirmation</h2>
    </div>
    <div class="content">
      <p>Hello ${request.firstName} ${request.lastName},</p>
      <p>Thank you for submitting your ${request.requestType} request with ${request.organizationName}. We have received it and will process it accordingly.</p>
      <div class="details">
        <p><strong>Request ID:</strong> ${request.requestId}</p>
        <p><strong>Request Type:</strong> ${request.requestType}</p>
        <p><strong>Status:</strong> ${request.statusName}</p>
        <p><strong>Due Date:</strong> ${request.dueDate ? new Date(request.dueDate).toLocaleDateString() : 'TBD'}</p>
      </div>
      <p>Please keep this Request ID for your records. You may be contacted if additional information is needed.</p>
      <p>We will notify you when your request has been processed.</p>
    </div>
    <div class="footer">
      <p>This is an automated message from the ComplyArk system.</p>
      <p>&copy; ComplyArk - Data Protection and Privacy Management</p>
    </div>
  </div>
</body>
</html>`;

    // Send the email using our force sender
    return await forceSendEmail(request.email, subject, html, text);
  } catch (error) {
    console.error('Error sending DPR creation email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error in DPR creation email'
    };
  }
}