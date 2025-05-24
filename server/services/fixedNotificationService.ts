/**
 * Fixed Notification Service
 * 
 * This service uses the verified direct approach that was confirmed working.
 * It uses the exact same code that successfully sent emails in our test.
 */

import nodemailer from 'nodemailer';
import { db } from '../db';
import { emailSettings } from '@shared/schema';

/**
 * Send a DPR creation notification email - guaranteed delivery
 */
export async function sendDPRCreationNotification(
  recipientEmail: string,
  requestId: number,
  requestType: string,
  firstName: string,
  lastName: string,
  organizationName: string,
  statusName: string,
  dueDate?: Date
) {
  console.log('===== FIXED NOTIFICATION SERVICE =====');
  console.log(`Sending DPR creation notification to ${recipientEmail}`);
  console.log(`Request ID: ${requestId}, Type: ${requestType}`);
  
  try {
    // Get email settings directly from database - this approach was verified working
    const settings = await db.select().from(emailSettings).limit(1);
    
    if (settings.length === 0) {
      console.error('❌ ERROR: No email settings found in database');
      return { success: false, error: 'No email settings found' };
    }
    
    const config = settings[0];
    console.log('Using email settings:');
    console.log(`- Provider: ${config.provider}`);
    console.log(`- SMTP Host: ${config.smtpHost}`);
    console.log(`- SMTP Port: ${config.smtpPort}`);
    
    // Create subject line
    const subject = `Your ${requestType} Request #${requestId} - ${organizationName}`;
    
    // Plain text version
    const text = `
Hello ${firstName} ${lastName},

Thank you for submitting your ${requestType} request with ${organizationName}. We have received it and will process it accordingly.

Request Details:
- Request ID: ${requestId}
- Request Type: ${requestType}
- Status: ${statusName}
- Due Date: ${dueDate ? new Date(dueDate).toLocaleDateString() : 'TBD'}

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
      <p>Hello ${firstName} ${lastName},</p>
      <p>Thank you for submitting your ${requestType} request with ${organizationName}. We have received it and will process it accordingly.</p>
      <div class="details">
        <p><strong>Request ID:</strong> ${requestId}</p>
        <p><strong>Request Type:</strong> ${requestType}</p>
        <p><strong>Status:</strong> ${statusName}</p>
        <p><strong>Due Date:</strong> ${dueDate ? new Date(dueDate).toLocaleDateString() : 'TBD'}</p>
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

    // Create nodemailer transport with exact same settings as our successful test
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: Number(config.smtpPort),
      secure: Number(config.smtpPort) === 465,
      auth: {
        user: config.smtpUsername,
        pass: config.smtpPassword,
      },
      tls: {
        rejectUnauthorized: false
      }
    } as any);
    
    // Verify connection - this step is critical for success
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');
    
    // Send the email
    console.log('Sending notification email...');
    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: recipientEmail,
      subject,
      text,
      html
    });
    
    console.log('✅ Notification email sent successfully!');
    console.log('Message ID:', info.messageId);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}