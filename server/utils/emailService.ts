

/**
 * Enhanced Email Service for ComplyArk
 * 
 * This module provides comprehensive email notification functionality including:
 * - Request submissions and status changes
 * - Escalation notifications
 * - Assignment notifications
 * - Reminder emails
 */

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  organizationName?: string;
}

interface NotificationData {
  requestId?: number;
  grievanceId?: number;
  requestType?: string;
  requesterName: string;
  requesterEmail: string;
  organizationName: string;
  statusName: string;
  assignedTo?: string;
  dueDate?: string;
  comments?: string;
}

/**
 * Send an email (development version - logs to console)
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Default sender address
    const from = options.from || 'noreply@complyark.com';
    
    // Log the email details to the console for development
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 EMAIL NOTIFICATION SENT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📤 From: ${from}`);
    console.log(`📬 To: ${options.to}`);
    console.log(`📝 Subject: ${options.subject}`);
    console.log(`🏢 Organization: ${options.organizationName || 'N/A'}`);
    console.log(`⏰ Sent at: ${new Date().toLocaleString()}`);
    
    if (options.text) {
      console.log('\n📄 Text Content:');
      console.log('─'.repeat(60));
      console.log(options.text);
      console.log('─'.repeat(60));
    }
    
    if (options.html) {
      console.log('\n🌐 HTML Content:');
      console.log('─'.repeat(60));
      console.log(options.html.replace(/<[^>]*>/g, '').substring(0, 200) + '...');
      console.log('─'.repeat(60));
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
}

/**
 * Send DPR Request Submission Notification
 */
export async function sendDPRSubmissionNotification(data: NotificationData): Promise<boolean> {
  const subject = `New Data Protection Request Submitted - ${data.requestType}`;
  
  const text = `
ComplyArk - Data Protection Request Notification

A new Data Protection Request has been submitted to ${data.organizationName}.

Request Details:
- Request ID: ${data.requestId}
- Request Type: ${data.requestType}
- Requester: ${data.requesterName}
- Email: ${data.requesterEmail}
- Status: ${data.statusName}
- Due Date: ${data.dueDate}

Please log in to the ComplyArk dashboard to review and process this request.

Best regards,
ComplyArk Team
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2E77AE, #0F3460); color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; }
    .details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #2E77AE; }
    .footer { text-align: center; margin-top: 20px; color: #666; }
    .logo { font-size: 24px; font-weight: bold; }
    .button { background: #2E77AE; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">ComplyArk</div>
      <h2>New Data Protection Request</h2>
    </div>
    
    <div class="content">
      <p>A new Data Protection Request has been submitted to <strong>${data.organizationName}</strong>.</p>
      
      <div class="details">
        <h3>Request Details:</h3>
        <ul>
          <li><strong>Request ID:</strong> ${data.requestId}</li>
          <li><strong>Request Type:</strong> ${data.requestType}</li>
          <li><strong>Requester:</strong> ${data.requesterName}</li>
          <li><strong>Email:</strong> ${data.requesterEmail}</li>
          <li><strong>Status:</strong> ${data.statusName}</li>
          <li><strong>Due Date:</strong> ${data.dueDate}</li>
        </ul>
      </div>
      
      <p>Please log in to the ComplyArk dashboard to review and process this request.</p>
      
      <div style="text-align: center;">
        <a href="#" class="button">View Request Dashboard</a>
      </div>
    </div>
    
    <div class="footer">
      <p>Best regards,<br>ComplyArk Team</p>
      <p><em>This is an automated notification. Please do not reply to this email.</em></p>
    </div>
  </div>
</body>
</html>
`;

  return await sendEmail({
    to: data.requesterEmail,
    subject,
    text,
    html,
    organizationName: data.organizationName
  });
}

/**
 * Send Grievance Submission Notification
 */
export async function sendGrievanceSubmissionNotification(data: NotificationData): Promise<boolean> {
  const subject = `New Grievance Submitted - ${data.organizationName}`;
  
  const text = `
ComplyArk - Grievance Notification

A new grievance has been submitted to ${data.organizationName}.

Grievance Details:
- Grievance ID: ${data.grievanceId}
- Submitted by: ${data.requesterName}
- Email: ${data.requesterEmail}
- Status: ${data.statusName}
- Due Date: ${data.dueDate}

Please log in to the ComplyArk dashboard to review and address this grievance.

Best regards,
ComplyArk Team
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #dc3545, #c82333); color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; }
    .details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #dc3545; }
    .footer { text-align: center; margin-top: 20px; color: #666; }
    .logo { font-size: 24px; font-weight: bold; }
    .button { background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">ComplyArk</div>
      <h2>New Grievance Submitted</h2>
    </div>
    
    <div class="content">
      <p>A new grievance has been submitted to <strong>${data.organizationName}</strong>.</p>
      
      <div class="details">
        <h3>Grievance Details:</h3>
        <ul>
          <li><strong>Grievance ID:</strong> ${data.grievanceId}</li>
          <li><strong>Submitted by:</strong> ${data.requesterName}</li>
          <li><strong>Email:</strong> ${data.requesterEmail}</li>
          <li><strong>Status:</strong> ${data.statusName}</li>
          <li><strong>Due Date:</strong> ${data.dueDate}</li>
        </ul>
      </div>
      
      <p>Please log in to the ComplyArk dashboard to review and address this grievance promptly.</p>
      
      <div style="text-align: center;">
        <a href="#" class="button">View Grievance Dashboard</a>
      </div>
    </div>
    
    <div class="footer">
      <p>Best regards,<br>ComplyArk Team</p>
      <p><em>This is an automated notification. Please do not reply to this email.</em></p>
    </div>
  </div>
</body>
</html>
`;

  return await sendEmail({
    to: data.requesterEmail,
    subject,
    text,
    html,
    organizationName: data.organizationName
  });
}

/**
 * Send Status Change Notification
 */
export async function sendStatusChangeNotification(data: NotificationData, newStatus: string, oldStatus: string): Promise<boolean> {
  const subject = `Request Status Updated - ${data.requestType || 'Grievance'} #${data.requestId || data.grievanceId}`;
  
  const text = `
ComplyArk - Status Update Notification

Your ${data.requestType ? 'Data Protection Request' : 'Grievance'} status has been updated.

Request Details:
- ID: ${data.requestId || data.grievanceId}
- Previous Status: ${oldStatus}
- New Status: ${newStatus}
- Organization: ${data.organizationName}
${data.assignedTo ? `- Assigned to: ${data.assignedTo}` : ''}
${data.comments ? `- Comments: ${data.comments}` : ''}

You can check the current status and any updates by logging in to your account.

Best regards,
ComplyArk Team
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; }
    .details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #28a745; }
    .status-change { background: #e9f7ef; padding: 10px; border-radius: 5px; margin: 10px 0; }
    .footer { text-align: center; margin-top: 20px; color: #666; }
    .logo { font-size: 24px; font-weight: bold; }
    .button { background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">ComplyArk</div>
      <h2>Status Updated</h2>
    </div>
    
    <div class="content">
      <p>Your ${data.requestType ? 'Data Protection Request' : 'Grievance'} status has been updated.</p>
      
      <div class="details">
        <h3>Request Details:</h3>
        <ul>
          <li><strong>ID:</strong> ${data.requestId || data.grievanceId}</li>
          <li><strong>Organization:</strong> ${data.organizationName}</li>
          ${data.assignedTo ? `<li><strong>Assigned to:</strong> ${data.assignedTo}</li>` : ''}
        </ul>
        
        <div class="status-change">
          <strong>Status Change:</strong> ${oldStatus} → ${newStatus}
        </div>
        
        ${data.comments ? `<p><strong>Comments:</strong> ${data.comments}</p>` : ''}
      </div>
      
      <p>You can check the current status and any updates by logging in to your account.</p>
      
      <div style="text-align: center;">
        <a href="#" class="button">Check Status</a>
      </div>
    </div>
    
    <div class="footer">
      <p>Best regards,<br>ComplyArk Team</p>
      <p><em>This is an automated notification. Please do not reply to this email.</em></p>
    </div>
  </div>
</body>
</html>
`;

  return await sendEmail({
    to: data.requesterEmail,
    subject,
    text,
    html,
    organizationName: data.organizationName
  });
}

/**
 * Send Escalation Notification
 */
export async function sendEscalationNotification(data: NotificationData): Promise<boolean> {
  const subject = `URGENT: Request Escalated - ${data.requestType || 'Grievance'} #${data.requestId || data.grievanceId}`;
  
  const text = `
ComplyArk - ESCALATION NOTIFICATION

A ${data.requestType ? 'Data Protection Request' : 'Grievance'} has been escalated and requires immediate attention.

Request Details:
- ID: ${data.requestId || data.grievanceId}
- Type: ${data.requestType || 'Grievance'}
- Requester: ${data.requesterName}
- Organization: ${data.organizationName}
- Status: ${data.statusName}
- Due Date: ${data.dueDate}

This request requires immediate attention to ensure compliance with SLA requirements.

Please log in to the ComplyArk dashboard immediately to address this escalated request.

Best regards,
ComplyArk Team
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #dc3545, #c82333); color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; }
    .details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #dc3545; }
    .urgent { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .footer { text-align: center; margin-top: 20px; color: #666; }
    .logo { font-size: 24px; font-weight: bold; }
    .button { background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">ComplyArk</div>
      <h2>🚨 ESCALATION ALERT</h2>
    </div>
    
    <div class="content">
      <div class="urgent">
        <h3>⚠️ URGENT ATTENTION REQUIRED</h3>
        <p>A ${data.requestType ? 'Data Protection Request' : 'Grievance'} has been escalated and requires immediate attention.</p>
      </div>
      
      <div class="details">
        <h3>Request Details:</h3>
        <ul>
          <li><strong>ID:</strong> ${data.requestId || data.grievanceId}</li>
          <li><strong>Type:</strong> ${data.requestType || 'Grievance'}</li>
          <li><strong>Requester:</strong> ${data.requesterName}</li>
          <li><strong>Organization:</strong> ${data.organizationName}</li>
          <li><strong>Status:</strong> ${data.statusName}</li>
          <li><strong>Due Date:</strong> ${data.dueDate}</li>
        </ul>
      </div>
      
      <p>This request requires immediate attention to ensure compliance with SLA requirements.</p>
      
      <div style="text-align: center;">
        <a href="#" class="button">🚨 ADDRESS IMMEDIATELY</a>
      </div>
    </div>
    
    <div class="footer">
      <p>Best regards,<br>ComplyArk Team</p>
      <p><em>This is an automated escalation notification. Please do not reply to this email.</em></p>
    </div>
  </div>
</body>
</html>
`;

  return await sendEmail({
    to: data.requesterEmail,
    subject,
    text,
    html,
    organizationName: data.organizationName
  });
}

/**
 * Send Assignment Notification to Staff
 */
export async function sendAssignmentNotification(staffEmail: string, data: NotificationData): Promise<boolean> {
  const subject = `New Assignment: ${data.requestType || 'Grievance'} #${data.requestId || data.grievanceId}`;
  
  const text = `
ComplyArk - Assignment Notification

You have been assigned a new ${data.requestType ? 'Data Protection Request' : 'Grievance'}.

Request Details:
- ID: ${data.requestId || data.grievanceId}
- Type: ${data.requestType || 'Grievance'}
- Requester: ${data.requesterName}
- Email: ${data.requesterEmail}
- Organization: ${data.organizationName}
- Status: ${data.statusName}
- Due Date: ${data.dueDate}

Please log in to the ComplyArk dashboard to review and process this assignment.

Best regards,
ComplyArk Team
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #6f42c1, #5a32a3); color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; }
    .details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #6f42c1; }
    .footer { text-align: center; margin-top: 20px; color: #666; }
    .logo { font-size: 24px; font-weight: bold; }
    .button { background: #6f42c1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">ComplyArk</div>
      <h2>New Assignment</h2>
    </div>
    
    <div class="content">
      <p>You have been assigned a new ${data.requestType ? 'Data Protection Request' : 'Grievance'}.</p>
      
      <div class="details">
        <h3>Assignment Details:</h3>
        <ul>
          <li><strong>ID:</strong> ${data.requestId || data.grievanceId}</li>
          <li><strong>Type:</strong> ${data.requestType || 'Grievance'}</li>
          <li><strong>Requester:</strong> ${data.requesterName}</li>
          <li><strong>Email:</strong> ${data.requesterEmail}</li>
          <li><strong>Organization:</strong> ${data.organizationName}</li>
          <li><strong>Status:</strong> ${data.statusName}</li>
          <li><strong>Due Date:</strong> ${data.dueDate}</li>
        </ul>
      </div>
      
      <p>Please log in to the ComplyArk dashboard to review and process this assignment.</p>
      
      <div style="text-align: center;">
        <a href="#" class="button">View Assignment</a>
      </div>
    </div>
    
    <div class="footer">
      <p>Best regards,<br>ComplyArk Team</p>
      <p><em>This is an automated assignment notification. Please do not reply to this email.</em></p>
    </div>
  </div>
</body>
</html>
`;

  return await sendEmail({
    to: staffEmail,
    subject,
    text,
    html,
    organizationName: data.organizationName
  });
}

/**
 * Generate OTP Email Template
 */
export function generateOTPEmailTemplate(
  otp: string,
  organizationName: string,
  expiresInMinutes: number = 30
): { text: string; html: string } {
  // Plain text version
  const text = `
ComplyArk Verification Code

Your verification code for ${organizationName} is: ${otp}

This code will expire in ${expiresInMinutes} minutes.

Please enter this code in the verification page to continue with your request.

This is an automated message, please do not reply.
`;

  // HTML version
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #0F3460;
      color: #ffffff;
      padding: 20px;
      text-align: center;
    }
    .content {
      padding: 20px;
      background-color: #f7f7f7;
    }
    .code {
      font-size: 24px;
      font-weight: bold;
      text-align: center;
      letter-spacing: 3px;
      margin: 20px 0;
      padding: 15px;
      background-color: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 5px;
    }
    .footer {
      font-size: 12px;
      color: #777;
      text-align: center;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ComplyArk Verification</h1>
    </div>
    <div class="content">
      <h2>Your Verification Code</h2>
      <p>You requested to access the ${organizationName} data protection request form. Please use the following code to verify your email address:</p>
      <div class="code">${otp}</div>
      <p>This code will expire in ${expiresInMinutes} minutes.</p>
      <p>If you did not request this code, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p>This is an automated message from ComplyArk. Please do not reply to this email.</p>
      <p>&copy; ${new Date().getFullYear()} ComplyArk. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

  return { text, html };
}

/**
 * Generate Request Confirmation Email Template
 */
export function generateRequestConfirmationTemplate(
  reference: string | number,
  requestType: string,
  organizationName: string,
  firstName: string,
  lastName: string
): { text: string; html: string } {
  // Plain text version
  const text = `
ComplyArk - Request Confirmation

Dear ${firstName} ${lastName},

Your ${requestType} has been successfully submitted to ${organizationName}.

Reference Number: ${reference}

Please save this reference number as you will need it to check the status of your request.

You can check the status of your request by visiting our request status page and entering your reference number and email address.

Thank you for using ComplyArk.

This is an automated message, please do not reply.
`;

  // HTML version
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Request Confirmation</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #0F3460;
      color: #ffffff;
      padding: 20px;
      text-align: center;
    }
    .content {
      padding: 20px;
      background-color: #f7f7f7;
    }
    .reference {
      font-size: 18px;
      font-weight: bold;
      text-align: center;
      margin: 20px 0;
      padding: 15px;
      background-color: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 5px;
    }
    .footer {
      font-size: 12px;
      color: #777;
      text-align: center;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }
    .button {
      display: inline-block;
      background-color: #2E77AE;
      color: #ffffff;
      padding: 10px 20px;
      margin: 20px 0;
      text-decoration: none;
      border-radius: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Request Confirmation</h1>
    </div>
    <div class="content">
      <h2>Your Request Has Been Submitted</h2>
      <p>Dear ${firstName} ${lastName},</p>
      <p>Your ${requestType} has been successfully submitted to <strong>${organizationName}</strong>.</p>
      <p>Please save your reference number:</p>
      <div class="reference">${reference}</div>
      <p>You will need this reference number to check the status of your request.</p>
      <p>You can check the status of your request at any time by visiting our request status page and entering your reference number and email address.</p>
      <center><a href="#" class="button">Check Request Status</a></center>
    </div>
    <div class="footer">
      <p>This is an automated message from ComplyArk. Please do not reply to this email.</p>
      <p>&copy; ${new Date().getFullYear()} ComplyArk. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

  return { text, html };
}