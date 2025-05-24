/**
 * Direct Notification Sender for Data Protection Requests
 * 
 * This module provides direct email sending that bypasses all test mode flags
 * by using the working code from the email-test.ts script.
 */

import nodemailer from 'nodemailer';
import { db } from './db';
import { emailSettings } from '@shared/schema';

/**
 * Send a direct email notification for a Data Protection Request
 */
export async function sendDirectDPRNotification(dprRequest: {
  requestId: number;
  firstName: string;
  lastName: string;
  email: string;
  requestType: string;
  organizationName: string;
  statusName: string;
  dueDate?: Date;
}) {
  console.log('===== DIRECT NOTIFICATION SYSTEM =====');
  console.log(`Sending DPR notification for request #${dprRequest.requestId}`);
  console.log(`To: ${dprRequest.email}`);
  
  try {
    // Get email settings from database
    const settings = await db.select().from(emailSettings).limit(1);
    
    if (settings.length === 0) {
      console.error('ERROR: No email settings found in database');
      return { success: false, error: 'No email settings found' };
    }
    
    const config = settings[0];
    console.log('Using email settings:');
    console.log('- Provider:', config.provider);
    console.log('- SMTP Host:', config.smtpHost);
    console.log('- SMTP Port:', config.smtpPort);
    
    // Configure nodemailer transport
    const transportOptions = {
      host: config.smtpHost,
      port: Number(config.smtpPort),
      secure: Number(config.smtpPort) === 465,
      auth: {
        user: config.smtpUsername,
        pass: config.smtpPassword,
      },
      tls: {
        rejectUnauthorized: false
      },
      debug: true
    };
    
    // Create transporter with verified settings
    const transporter = nodemailer.createTransport(transportOptions as any);
    
    // Verify connection
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');
    
    // Create email content
    const subject = `Your ${dprRequest.requestType} Request #${dprRequest.requestId} - ${dprRequest.organizationName}`;
    
    // Plain text version
    const text = `
Hello ${dprRequest.firstName} ${dprRequest.lastName},

Thank you for submitting your ${dprRequest.requestType} request with ${dprRequest.organizationName}. We have received it and will process it accordingly.

Request Details:
- Request ID: ${dprRequest.requestId}
- Request Type: ${dprRequest.requestType}
- Status: ${dprRequest.statusName}
- Due Date: ${dprRequest.dueDate ? new Date(dprRequest.dueDate).toLocaleDateString() : 'TBD'}

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
      <p>Hello ${dprRequest.firstName} ${dprRequest.lastName},</p>
      <p>Thank you for submitting your ${dprRequest.requestType} request with ${dprRequest.organizationName}. We have received it and will process it accordingly.</p>
      <div class="details">
        <p><strong>Request ID:</strong> ${dprRequest.requestId}</p>
        <p><strong>Request Type:</strong> ${dprRequest.requestType}</p>
        <p><strong>Status:</strong> ${dprRequest.statusName}</p>
        <p><strong>Due Date:</strong> ${dprRequest.dueDate ? new Date(dprRequest.dueDate).toLocaleDateString() : 'TBD'}</p>
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

    // Send the email using the transporter
    console.log('Sending direct notification email...');
    const result = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: dprRequest.email,
      subject: subject,
      text: text,
      html: html,
    });
    
    console.log('✅ Direct notification email sent successfully!');
    console.log('Message ID:', result.messageId);
    
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('ERROR sending direct notification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Send a direct email notification for a Grievance Request
 */
export async function sendDirectGrievanceNotification(grievance: {
  grievanceId: number;
  firstName: string;
  lastName: string;
  email: string;
  organizationName: string;
  statusName: string;
  dueDate?: Date;
}) {
  console.log('===== DIRECT NOTIFICATION SYSTEM =====');
  console.log(`Sending Grievance notification for grievance #${grievance.grievanceId}`);
  console.log(`To: ${grievance.email}`);
  
  try {
    // Get email settings from database
    const settings = await db.select().from(emailSettings).limit(1);
    
    if (settings.length === 0) {
      console.error('ERROR: No email settings found in database');
      return { success: false, error: 'No email settings found' };
    }
    
    const config = settings[0];
    console.log('Using email settings:');
    console.log('- Provider:', config.provider);
    console.log('- SMTP Host:', config.smtpHost);
    console.log('- SMTP Port:', config.smtpPort);
    
    // Configure nodemailer transport
    const transportOptions = {
      host: config.smtpHost,
      port: Number(config.smtpPort),
      secure: Number(config.smtpPort) === 465,
      auth: {
        user: config.smtpUsername,
        pass: config.smtpPassword,
      },
      tls: {
        rejectUnauthorized: false
      },
      debug: true
    };
    
    // Create transporter with verified settings
    const transporter = nodemailer.createTransport(transportOptions as any);
    
    // Verify connection
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');
    
    // Create email content
    const subject = `Your Grievance #${grievance.grievanceId} - ${grievance.organizationName}`;
    
    // Plain text version
    const text = `
Hello ${grievance.firstName} ${grievance.lastName},

Thank you for submitting your grievance with ${grievance.organizationName}. We have received it and will address it accordingly.

Grievance Details:
- Grievance ID: ${grievance.grievanceId}
- Status: ${grievance.statusName}
- Due Date: ${grievance.dueDate ? new Date(grievance.dueDate).toLocaleDateString() : 'TBD'}

Please keep this Grievance ID for your records. You may be contacted if additional information is needed.
We will notify you when your grievance has been processed.

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
    .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .details { background-color: #eaeaea; padding: 15px; margin: 15px 0; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Grievance Confirmation</h2>
    </div>
    <div class="content">
      <p>Hello ${grievance.firstName} ${grievance.lastName},</p>
      <p>Thank you for submitting your grievance with ${grievance.organizationName}. We have received it and will address it accordingly.</p>
      <div class="details">
        <p><strong>Grievance ID:</strong> ${grievance.grievanceId}</p>
        <p><strong>Status:</strong> ${grievance.statusName}</p>
        <p><strong>Due Date:</strong> ${grievance.dueDate ? new Date(grievance.dueDate).toLocaleDateString() : 'TBD'}</p>
      </div>
      <p>Please keep this Grievance ID for your records. You may be contacted if additional information is needed.</p>
      <p>We will notify you when your grievance has been processed.</p>
    </div>
    <div class="footer">
      <p>This is an automated message from the ComplyArk system.</p>
      <p>&copy; ComplyArk - Data Protection and Privacy Management</p>
    </div>
  </div>
</body>
</html>`;

    // Send the email using the transporter
    console.log('Sending direct notification email...');
    const result = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: grievance.email,
      subject: subject,
      text: text,
      html: html,
    });
    
    console.log('✅ Direct notification email sent successfully!');
    console.log('Message ID:', result.messageId);
    
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('ERROR sending direct notification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}