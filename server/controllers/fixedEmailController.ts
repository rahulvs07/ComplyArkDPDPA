/**
 * Fixed Email Controller - Guaranteed Email Delivery
 * 
 * This controller provides direct access to email sending functionality
 * that completely bypasses any test mode flags.
 */

import nodemailer from 'nodemailer';
import { Request, Response } from 'express';
import { db } from '../db';
import { emailSettings } from '@shared/schema';

/**
 * Send an email notification for DPR or Grievance requests
 */
export async function sendNotification(req: Request, res: Response) {
  try {
    const { recipientEmail, subject, htmlContent, textContent } = req.body;
    
    if (!recipientEmail || !subject || !htmlContent) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Get email settings from database
    const settings = await db.select().from(emailSettings).limit(1);
    
    if (settings.length === 0) {
      return res.status(500).json({ message: 'Email settings not configured' });
    }
    
    const config = settings[0];
    
    // Create transporter with email settings from database
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
    
    // Send email
    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: recipientEmail,
      subject,
      text: textContent || htmlContent.replace(/<[^>]*>/g, ''),
      html: htmlContent
    });
    
    console.log(`Email sent successfully: ${info.messageId}`);
    return res.status(200).json({ 
      success: true, 
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Send notification email for DPR request creation
 */
export async function sendDPRNotification(req: Request, res: Response) {
  try {
    const {
      requestId,
      firstName,
      lastName,
      email,
      requestType,
      organizationName,
      statusName,
      dueDate
    } = req.body;
    
    if (!email || !firstName || !lastName || !requestType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Create subject line
    const subject = `Your ${requestType} Request #${requestId} - ${organizationName}`;
    
    // HTML email template
    const htmlContent = `
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
            <p><strong>Status:</strong> ${statusName || 'Submitted'}</p>
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
    
    // Plain text version
    const textContent = `
Hello ${firstName} ${lastName},

Thank you for submitting your ${requestType} request with ${organizationName}. We have received it and will process it accordingly.

Request Details:
- Request ID: ${requestId}
- Request Type: ${requestType}
- Status: ${statusName || 'Submitted'}
- Due Date: ${dueDate ? new Date(dueDate).toLocaleDateString() : 'TBD'}

Please keep this Request ID for your records. You may be contacted if additional information is needed.
We will notify you when your request has been processed.

This is an automated message from the ComplyArk system.
`;
    
    // Send email using our direct email sender
    const emailBody = {
      recipientEmail: email,
      subject,
      htmlContent,
      textContent
    };
    
    // Modify the request object with our email content
    req.body = emailBody;
    
    // Forward to the generic email sender
    return await sendNotification(req, res);
  } catch (error) {
    console.error('Error sending DPR notification:', error);
    return res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}