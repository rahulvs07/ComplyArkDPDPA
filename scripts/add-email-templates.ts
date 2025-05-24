/**
 * Script to add default email templates to the database
 * Run with: npx tsx scripts/add-email-templates.ts
 */
import { db } from '../server/db';
import { emailTemplates } from '../shared/schema';
import { eq } from 'drizzle-orm';

const defaultTemplates = [
  {
    name: 'Request Confirmation',
    subject: 'Your Data Protection Request Has Been Received - {requestId}',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Request Confirmation</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; }
    .content { padding: 20px; background-color: #f9f9f9; border-radius: 5px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
    h1 { color: #2c3e50; }
    .info-row { margin-bottom: 10px; }
    .info-label { font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Data Protection Request Confirmation</h1>
    </div>
    <div class="content">
      <p>Dear {firstName},</p>
      
      <p>Thank you for submitting your data protection request. This email confirms that we have received your request and it is now being processed.</p>
      
      <div class="info-row">
        <span class="info-label">Request ID:</span> {requestId}
      </div>
      <div class="info-row">
        <span class="info-label">Organization:</span> {organizationName}
      </div>
      <div class="info-row">
        <span class="info-label">Request Type:</span> {requestType}
      </div>
      <div class="info-row">
        <span class="info-label">Submission Date:</span> {submissionDate}
      </div>
      <div class="info-row">
        <span class="info-label">Current Status:</span> {statusName}
      </div>
      <div class="info-row">
        <span class="info-label">Expected Response By:</span> {dueDate}
      </div>
      
      <p>We will process your request as soon as possible and may contact you if we need additional information.</p>
      
      <p>If you have any questions regarding your request, please contact our data protection team, referencing your Request ID.</p>
      
      <p>Regards,<br>
      Data Protection Team<br>
      {organizationName}</p>
    </div>
    <div class="footer">
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`
  },
  {
    name: 'Request Status Update',
    subject: 'Update on Your Data Protection Request - {requestId}',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Request Status Update</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; }
    .content { padding: 20px; background-color: #f9f9f9; border-radius: 5px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
    h1 { color: #2c3e50; }
    .info-row { margin-bottom: 10px; }
    .info-label { font-weight: bold; }
    .status-update { background-color: #e8f4fc; padding: 15px; border-left: 4px solid #3498db; margin: 15px 0; }
    .status-closed { background-color: #eafaf1; border-left-color: #2ecc71; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Data Protection Request Update</h1>
    </div>
    <div class="content">
      <p>Dear {firstName},</p>
      
      <p>We're writing to inform you that the status of your data protection request has been updated.</p>
      
      <div class="status-update {statusName === 'Closed' ? 'status-closed' : ''}">
        <div class="info-row">
          <span class="info-label">New Status:</span> {statusName}
        </div>
        <div class="info-row">
          <span class="info-label">Comments:</span> {comments}
        </div>
      </div>
      
      <div class="info-row">
        <span class="info-label">Request ID:</span> {requestId}
      </div>
      <div class="info-row">
        <span class="info-label">Organization:</span> {organizationName}
      </div>
      <div class="info-row">
        <span class="info-label">Request Type:</span> {requestType}
      </div>
      <div class="info-row">
        <span class="info-label">Submission Date:</span> {submissionDate}
      </div>
      
      <p>If you have any questions regarding your request, please contact our data protection team, referencing your Request ID.</p>
      
      <p>Regards,<br>
      Data Protection Team<br>
      {organizationName}</p>
    </div>
    <div class="footer">
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`
  },
  {
    name: 'Grievance Confirmation',
    subject: 'Your Grievance Has Been Received - {grievanceId}',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Grievance Confirmation</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; }
    .content { padding: 20px; background-color: #f9f9f9; border-radius: 5px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
    h1 { color: #2c3e50; }
    .info-row { margin-bottom: 10px; }
    .info-label { font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Grievance Submission Confirmation</h1>
    </div>
    <div class="content">
      <p>Dear {firstName},</p>
      
      <p>Thank you for submitting your grievance. This email confirms that we have received your submission and it is now being processed.</p>
      
      <div class="info-row">
        <span class="info-label">Grievance ID:</span> {grievanceId}
      </div>
      <div class="info-row">
        <span class="info-label">Organization:</span> {organizationName}
      </div>
      <div class="info-row">
        <span class="info-label">Submission Date:</span> {submissionDate}
      </div>
      <div class="info-row">
        <span class="info-label">Current Status:</span> {statusName}
      </div>
      <div class="info-row">
        <span class="info-label">Expected Response By:</span> {dueDate}
      </div>
      
      <p>We will process your grievance as soon as possible and may contact you if we need additional information.</p>
      
      <p>If you have any questions regarding your submission, please contact our support team, referencing your Grievance ID.</p>
      
      <p>Regards,<br>
      Grievance Redressal Team<br>
      {organizationName}</p>
    </div>
    <div class="footer">
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`
  },
  {
    name: 'Grievance Status Update',
    subject: 'Update on Your Grievance - {grievanceId}',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Grievance Status Update</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; }
    .content { padding: 20px; background-color: #f9f9f9; border-radius: 5px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
    h1 { color: #2c3e50; }
    .info-row { margin-bottom: 10px; }
    .info-label { font-weight: bold; }
    .status-update { background-color: #e8f4fc; padding: 15px; border-left: 4px solid #3498db; margin: 15px 0; }
    .status-closed { background-color: #eafaf1; border-left-color: #2ecc71; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Grievance Status Update</h1>
    </div>
    <div class="content">
      <p>Dear {firstName},</p>
      
      <p>We're writing to inform you that the status of your grievance has been updated.</p>
      
      <div class="status-update {statusName === 'Closed' ? 'status-closed' : ''}">
        <div class="info-row">
          <span class="info-label">New Status:</span> {statusName}
        </div>
        <div class="info-row">
          <span class="info-label">Comments:</span> {comments}
        </div>
      </div>
      
      <div class="info-row">
        <span class="info-label">Grievance ID:</span> {grievanceId}
      </div>
      <div class="info-row">
        <span class="info-label">Organization:</span> {organizationName}
      </div>
      <div class="info-row">
        <span class="info-label">Submission Date:</span> {submissionDate}
      </div>
      
      <p>If you have any questions regarding your grievance, please contact our support team, referencing your Grievance ID.</p>
      
      <p>Regards,<br>
      Grievance Redressal Team<br>
      {organizationName}</p>
    </div>
    <div class="footer">
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`
  },
  {
    name: 'OTP Verification',
    subject: 'Your One-Time Password for ComplyArk',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>OTP Verification</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; }
    .content { padding: 20px; background-color: #f9f9f9; border-radius: 5px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
    h1 { color: #2c3e50; }
    .otp-code { 
      font-size: 24px; 
      font-weight: bold; 
      text-align: center; 
      padding: 15px; 
      margin: 20px 0; 
      background-color: #e8f4fc; 
      border-radius: 5px; 
      letter-spacing: 5px;
    }
    .warning { color: #e74c3c; font-style: italic; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>OTP Verification</h1>
    </div>
    <div class="content">
      <p>Dear User,</p>
      
      <p>Your one-time password (OTP) for ComplyArk is:</p>
      
      <div class="otp-code">{otp}</div>
      
      <p>This OTP will expire in 10 minutes.</p>
      
      <p class="warning">Do not share this OTP with anyone. ComplyArk will never ask for your OTP via phone, email, or any other communication.</p>
      
      <p>If you didn't request this OTP, please ignore this email or contact our support team.</p>
      
      <p>Regards,<br>
      ComplyArk Team</p>
    </div>
    <div class="footer">
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`
  },
  {
    name: 'Test Email',
    subject: 'ComplyArk Email Configuration Test',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Email Configuration Test</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; }
    .content { padding: 20px; background-color: #f9f9f9; border-radius: 5px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
    h1 { color: #2c3e50; }
    .success { color: #27ae60; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Email Configuration Test</h1>
    </div>
    <div class="content">
      <p>This is a test email from ComplyArk to verify your email configuration.</p>
      
      <p class="success">If you received this email, your email configuration is working correctly!</p>
      
      <p>This test was sent at: {timestamp}</p>
      
      <p>You can now use the email system for sending notifications to users and staff.</p>
      
      <p>Regards,<br>
      ComplyArk Team</p>
    </div>
    <div class="footer">
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`
  }
];

async function addEmailTemplates() {
  try {
    console.log('Adding default email templates...');
    
    for (const template of defaultTemplates) {
      // Check if template already exists
      const existing = await db.select()
        .from(emailTemplates)
        .where(eq(emailTemplates.name, template.name))
        .limit(1);
      
      if (existing.length > 0) {
        console.log(`Template '${template.name}' already exists. Updating...`);
        
        // Update the existing template
        await db.update(emailTemplates)
          .set({
            subject: template.subject,
            body: template.body,
            updatedAt: new Date()
          })
          .where(eq(emailTemplates.id, existing[0].id));
      } else {
        console.log(`Creating new template: ${template.name}`);
        
        // Insert the new template
        await db.insert(emailTemplates)
          .values({
            name: template.name,
            subject: template.subject,
            body: template.body
          });
      }
    }
    
    console.log('Email templates added successfully!');
  } catch (error) {
    console.error('Error adding email templates:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
addEmailTemplates();