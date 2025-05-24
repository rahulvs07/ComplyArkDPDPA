/**
 * Direct Email Notification Service
 * 
 * This service bypasses the regular email system to ensure notifications
 * are actually sent for request creation and closure events.
 */

import nodemailer from 'nodemailer';
import { db } from '../db';
import { emailSettings } from '@shared/schema';

// Define the data structure for request notifications
interface RequestNotificationData {
  firstName: string;
  lastName: string;
  email: string;
  organizationName: string;
  requestType: string;
  requestId: number;
  closureComment?: string;
  assignedStaffEmail?: string | null;
}

/**
 * Send a direct email notification for request creation
 */
export async function sendCreationNotificationDirectly(
  requestType: 'dpr' | 'grievance',
  data: RequestNotificationData
): Promise<boolean> {
  try {
    // Get email settings from database
    const settings = await db.select().from(emailSettings).limit(1);
    if (settings.length === 0) {
      console.error('No email settings found in database');
      return false;
    }
    
    const config = settings[0];
    
    // Create a subject line
    const subject = `Your ${data.requestType} Request #${data.requestId} - ${data.organizationName}`;
    
    // Create HTML email content
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
      <p>Hello ${data.firstName} ${data.lastName},</p>
      <p>Thank you for submitting your ${data.requestType} request with ${data.organizationName}. We have received it and will process it accordingly.</p>
      <div class="details">
        <p><strong>Request ID:</strong> ${data.requestId}</p>
        <p><strong>Request Type:</strong> ${data.requestType}</p>
        <p><strong>Submitted On:</strong> ${new Date().toLocaleDateString()}</p>
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

    // Plain text version
    const text = `
Hello ${data.firstName} ${data.lastName},

Thank you for submitting your ${data.requestType} request with ${data.organizationName}. We have received it and will process it accordingly.

Request Details:
- Request ID: ${data.requestId}
- Request Type: ${data.requestType}
- Submitted On: ${new Date().toLocaleDateString()}

Please keep this Request ID for your records. You may be contacted if additional information is needed.
We will notify you when your request has been processed.

This is an automated message from the ComplyArk system.
`;

    // Create transporter
    const transportOptions = {
      host: config.smtpHost,
      port: Number(config.smtpPort) || 587,
      secure: false,
      auth: {
        user: config.smtpUsername || '',
        pass: config.smtpPassword || '',
      },
      tls: {
        rejectUnauthorized: false
      }
    };
    
    const transporter = nodemailer.createTransport(transportOptions);
    
    // Send email
    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: data.email,
      subject: subject,
      text: text,
      html: html
    });
    
    console.log(`✅ Email sent directly to ${data.email} for ${requestType} #${data.requestId}`);
    console.log(`✅ MessageId: ${info.messageId}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error sending direct notification:', error);
    return false;
  }
}

/**
 * Send a direct email notification for request closure
 */
export async function sendClosureNotificationDirectly(
  requestType: 'dpr' | 'grievance',
  data: RequestNotificationData
): Promise<boolean> {
  try {
    // Get email settings from database
    const settings = await db.select().from(emailSettings).limit(1);
    if (settings.length === 0) {
      console.error('No email settings found in database');
      return false;
    }
    
    const config = settings[0];
    
    // Create a subject line
    const subject = `Your ${data.requestType} Request #${data.requestId} Has Been Completed - ${data.organizationName}`;
    
    // Create HTML email content
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
    .comment { background-color: #f5f5f5; padding: 15px; border-left: 4px solid #4F46E5; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Request Completed</h2>
    </div>
    <div class="content">
      <p>Hello ${data.firstName} ${data.lastName},</p>
      <p>Your ${data.requestType} request with ${data.organizationName} has been completed and is now closed.</p>
      <div class="details">
        <p><strong>Request ID:</strong> ${data.requestId}</p>
        <p><strong>Request Type:</strong> ${data.requestType}</p>
        <p><strong>Status:</strong> Closed</p>
      </div>
      
      <p><strong>Comments from our team:</strong></p>
      <div class="comment">
        ${data.closureComment || 'Your request has been processed and is now closed.'}
      </div>
      
      <p>Thank you for using our services. If you have any further questions, please contact us.</p>
    </div>
    <div class="footer">
      <p>This is an automated message from the ComplyArk system.</p>
      <p>&copy; ComplyArk - Data Protection and Privacy Management</p>
    </div>
  </div>
</body>
</html>`;

    // Plain text version
    const text = `
Hello ${data.firstName} ${data.lastName},

Your ${data.requestType} request with ${data.organizationName} has been completed and is now closed.

Request Details:
- Request ID: ${data.requestId}
- Request Type: ${data.requestType}
- Status: Closed

Comments from our team:
${data.closureComment || 'Your request has been processed and is now closed.'}

Thank you for using our services. If you have any further questions, please contact us.

This is an automated message from the ComplyArk system.
`;

    // Prepare mail options
    const mailOptions: any = {
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: data.email,
      subject: subject,
      text: text,
      html: html
    };
    
    // Add CC if specified
    if (data.assignedStaffEmail) {
      mailOptions.cc = data.assignedStaffEmail;
    }
    
    // Create transporter
    const transportOptions = {
      host: config.smtpHost,
      port: Number(config.smtpPort) || 587,
      secure: false,
      auth: {
        user: config.smtpUsername || '',
        pass: config.smtpPassword || '',
      },
      tls: {
        rejectUnauthorized: false
      }
    };
    
    const transporter = nodemailer.createTransport(transportOptions);
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Closure email sent directly to ${data.email} for ${requestType} #${data.requestId}`);
    console.log(`✅ MessageId: ${info.messageId}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error sending direct closure notification:', error);
    return false;
  }
}