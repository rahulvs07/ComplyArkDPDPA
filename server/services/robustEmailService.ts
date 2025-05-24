import nodemailer from 'nodemailer';
import { db } from '../db';
import { emailSettings } from '@shared/schema';

/**
 * Robust Email Service for ComplyArk
 * 
 * This service centralizes all email sending functionality with:
 * - Proper database configuration for email settings
 * - Connection verification before sending
 * - Specific handling for Gmail SMTP
 * - Detailed error logging
 * - Clean password handling
 * 
 * All email notifications should use this service
 */

/**
 * Core email sending function with robust error handling
 */
export async function sendRobustEmail(
  to: string,
  subject: string,
  htmlContent: string,
  textContent: string,
  cc?: string[]
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 SENDING EMAIL`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📬 To: ${to}`);
    console.log(`📝 Subject: ${subject}`);
    if (cc && cc.length > 0) {
      console.log(`📄 CC: ${cc.join(', ')}`);
    }
    
    // Get email settings from database
    const settings = await db.select().from(emailSettings).limit(1);
    
    if (settings.length === 0) {
      console.error('❌ No email settings found in database');
      return { success: false, error: 'Email settings not configured' };
    }
    
    const config = settings[0];
    console.log('📧 Using email settings:');
    console.log('- Provider:', config.provider);
    console.log('- SMTP Host:', config.smtpHost);
    console.log('- SMTP Port:', config.smtpPort);
    
    // Always use SMTP configuration as requested
    // Clean up password - remove any trailing commas or spaces that might cause auth issues
    let cleanPassword = '';
    if (config.smtpPassword) {
      cleanPassword = config.smtpPassword.trim();
    }
    
    // Check if using Gmail SMTP
    const isGmail = (config.smtpHost || '').includes('gmail.com');
    
    const transportOptions = {
      host: config.smtpHost || 'smtp.gmail.com',
      port: Number(config.smtpPort) || 587,
      secure: Number(config.smtpPort) === 465, // Use SSL if port is 465, otherwise use STARTTLS
      auth: {
        user: config.smtpUsername || '',
        pass: cleanPassword || '',
      },
      tls: {
        // Gmail requires proper certificates
        rejectUnauthorized: isGmail ? true : false,
        // For Gmail, we need to add these options
        ...(isGmail && {
          minVersion: 'TLSv1.2'
        })
      }
    };
    
    console.log(`📧 Using ${isGmail ? 'Gmail' : 'Standard'} SMTP configuration`);
    console.log(`📧 Secure mode: ${transportOptions.secure ? 'SSL (Port 465)' : 'STARTTLS (Port 587)'}`);
    
    // Create transporter
    console.log('📧 Creating transport...');
    const transporter = nodemailer.createTransport(transportOptions as any);
    
    // Verify connection
    console.log('📧 Verifying SMTP connection...');
    try {
      await transporter.verify();
      console.log('✅ SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('❌ SMTP connection verification failed:');
      console.error(verifyError);
      return { 
        success: false, 
        error: `SMTP connection failed: ${verifyError instanceof Error ? verifyError.message : 'Unknown error'}`
      };
    }
    
    // Send email
    console.log('📧 Sending email...');
    const mailOptions = {
      from: `"${config.fromName || 'ComplyArk'}" <${config.fromEmail || ''}>`,
      to,
      cc,
      subject,
      text: textContent,
      html: htmlContent,
      priority: 'high'
    };
    
    const result = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email sent successfully to ${to}`);
    console.log(`✅ Message ID: ${result.messageId}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return { 
      success: true,
      messageId: result.messageId
    };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email error'
    };
  }
}

/**
 * Send a request creation notification
 */
export async function sendRequestCreationEmail(
  to: string,
  requestId: number,
  requestType: string,
  firstName: string,
  lastName: string,
  organizationName: string,
  statusName: string = 'Submitted',
  dueDate?: Date
): Promise<{ success: boolean; error?: string; messageId?: string }> {
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

  return await sendRobustEmail(to, subject, html, text);
}

/**
 * Send a grievance creation notification
 */
export async function sendGrievanceCreationEmail(
  to: string,
  grievanceId: number,
  firstName: string,
  lastName: string,
  organizationName: string,
  statusName: string = 'Submitted',
  dueDate?: Date
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const subject = `Your Grievance #${grievanceId} - ${organizationName}`;
  
  // Plain text version
  const text = `
Hello ${firstName} ${lastName},

Thank you for submitting your grievance with ${organizationName}. We have received it and will address it accordingly.

Grievance Details:
- Grievance ID: ${grievanceId}
- Status: ${statusName}
- Due Date: ${dueDate ? new Date(dueDate).toLocaleDateString() : 'TBD'}

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
    .header { background: linear-gradient(135deg, #dc3545, #c82333); color: white; padding: 20px; text-align: center; }
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
      <p>Hello ${firstName} ${lastName},</p>
      <p>Thank you for submitting your grievance with ${organizationName}. We have received it and will address it accordingly.</p>
      <div class="details">
        <p><strong>Grievance ID:</strong> ${grievanceId}</p>
        <p><strong>Status:</strong> ${statusName}</p>
        <p><strong>Due Date:</strong> ${dueDate ? new Date(dueDate).toLocaleDateString() : 'TBD'}</p>
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

  return await sendRobustEmail(to, subject, html, text);
}

/**
 * Send a request closure notification
 */
export async function sendRequestClosureEmail(
  to: string,
  requestId: number,
  requestType: string,
  firstName: string,
  lastName: string,
  organizationName: string,
  statusName: string,
  closureComment: string,
  assignedStaffEmail?: string
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const subject = `Your ${requestType} Request #${requestId} - ${statusName}`;
  
  // Plain text version
  const text = `
Hello ${firstName} ${lastName},

Your ${requestType} request with ${organizationName} has been ${statusName.toLowerCase()}.

Request Details:
- Request ID: ${requestId}
- Request Type: ${requestType}
- Final Status: ${statusName}
- Organization: ${organizationName}

${closureComment ? `Comments: ${closureComment}` : ''}

Thank you for your patience throughout this process.

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
    .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .details { background-color: #eaeaea; padding: 15px; margin: 15px 0; }
    .comment { background-color: #f0f0f0; padding: 15px; margin: 15px 0; border-left: 4px solid #28a745; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Request ${statusName}</h2>
    </div>
    <div class="content">
      <p>Hello ${firstName} ${lastName},</p>
      <p>Your ${requestType} request with ${organizationName} has been ${statusName.toLowerCase()}.</p>
      
      <div class="details">
        <p><strong>Request ID:</strong> ${requestId}</p>
        <p><strong>Request Type:</strong> ${requestType}</p>
        <p><strong>Final Status:</strong> ${statusName}</p>
        <p><strong>Organization:</strong> ${organizationName}</p>
      </div>
      
      ${closureComment ? `
      <div class="comment">
        <p><strong>Comments:</strong></p>
        <p>${closureComment}</p>
      </div>
      ` : ''}
      
      <p>Thank you for your patience throughout this process.</p>
    </div>
    <div class="footer">
      <p>This is an automated message from the ComplyArk system.</p>
      <p>&copy; ComplyArk - Data Protection and Privacy Management</p>
    </div>
  </div>
</body>
</html>`;

  // Include assignedStaffEmail in CC if provided
  const cc = assignedStaffEmail ? [assignedStaffEmail] : undefined;
  
  return await sendRobustEmail(to, subject, html, text, cc);
}

/**
 * Send a grievance closure notification
 */
export async function sendGrievanceClosureEmail(
  to: string,
  grievanceId: number,
  firstName: string,
  lastName: string,
  organizationName: string,
  statusName: string,
  closureComment: string,
  assignedStaffEmail?: string
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const subject = `Your Grievance #${grievanceId} - ${statusName}`;
  
  // Plain text version
  const text = `
Hello ${firstName} ${lastName},

Your grievance with ${organizationName} has been ${statusName.toLowerCase()}.

Grievance Details:
- Grievance ID: ${grievanceId}
- Final Status: ${statusName}
- Organization: ${organizationName}

${closureComment ? `Comments: ${closureComment}` : ''}

Thank you for your patience throughout this process.

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
    .header { background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .details { background-color: #eaeaea; padding: 15px; margin: 15px 0; }
    .comment { background-color: #f0f0f0; padding: 15px; margin: 15px 0; border-left: 4px solid #28a745; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Grievance ${statusName}</h2>
    </div>
    <div class="content">
      <p>Hello ${firstName} ${lastName},</p>
      <p>Your grievance with ${organizationName} has been ${statusName.toLowerCase()}.</p>
      
      <div class="details">
        <p><strong>Grievance ID:</strong> ${grievanceId}</p>
        <p><strong>Final Status:</strong> ${statusName}</p>
        <p><strong>Organization:</strong> ${organizationName}</p>
      </div>
      
      ${closureComment ? `
      <div class="comment">
        <p><strong>Comments:</strong></p>
        <p>${closureComment}</p>
      </div>
      ` : ''}
      
      <p>Thank you for your patience throughout this process.</p>
    </div>
    <div class="footer">
      <p>This is an automated message from the ComplyArk system.</p>
      <p>&copy; ComplyArk - Data Protection and Privacy Management</p>
    </div>
  </div>
</body>
</html>`;

  // Include assignedStaffEmail in CC if provided
  const cc = assignedStaffEmail ? [assignedStaffEmail] : undefined;
  
  return await sendRobustEmail(to, subject, html, text, cc);
}

/**
 * OTP Email Sender
 */
export async function sendOtpEmail(
  to: string,
  otp: string,
  organizationName: string = 'ComplyArk'
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const subject = `${otp} is your verification code for ${organizationName}`;
  
  // Plain text version
  const plainText = `
Your verification code is: ${otp}

This code will expire in 15 minutes.

Please enter this code on the verification page to continue.

This is an automated message, please do not reply.

© ${new Date().getFullYear()} ${organizationName}
  `;
  
  // HTML version
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
  
  return await sendRobustEmail(to, subject, htmlContent, plainText);
}