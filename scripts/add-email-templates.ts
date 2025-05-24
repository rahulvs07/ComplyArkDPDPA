import { db } from '../server/db';
import { emailTemplates } from '../shared/schema';

/**
 * Script to add default email templates to the database
 * Run with: npx tsx scripts/add-email-templates.ts
 */
async function addEmailTemplates() {
  try {
    console.log('Adding default email templates...');
    
    // Check if any templates already exist
    const existingTemplates = await db.select().from(emailTemplates);
    
    if (existingTemplates.length > 0) {
      console.log(`Found ${existingTemplates.length} existing templates. Skipping.`);
      console.log('To recreate templates, delete existing ones first.');
      return;
    }
    
    // Default templates
    const defaultTemplates = [
      {
        name: 'OTP Verification',
        subject: 'Your Verification Code for ComplyArk',
        body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .code { font-size: 24px; font-weight: bold; background-color: #eaeaea; padding: 10px; text-align: center; margin: 20px 0; letter-spacing: 5px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>ComplyArk Verification</h2>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>Your verification code for ComplyArk is:</p>
      <div class="code">{otp}</div>
      <p>This code will expire in {expiryMinutes} minutes.</p>
      <p>If you did not request this code, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>This is an automated message, please do not reply.</p>
      <p>&copy; ComplyArk - Data Protection and Privacy Management</p>
    </div>
  </div>
</body>
</html>`,
      },
      {
        name: 'Request Confirmation',
        subject: 'Your Request Confirmation - ComplyArk',
        body: `
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
      <p>Hello {firstName},</p>
      <p>Thank you for submitting your {requestType} request. We have received it and will process it accordingly.</p>
      <div class="details">
        <p><strong>Request ID:</strong> {requestId}</p>
        <p><strong>Request Type:</strong> {requestType}</p>
        <p><strong>Submitted On:</strong> {submissionDate}</p>
      </div>
      <p>You can track the status of your request using this Request ID.</p>
      <p>We will keep you updated on any progress or if we need additional information.</p>
    </div>
    <div class="footer">
      <p>This is an automated message from the ComplyArk system.</p>
      <p>&copy; ComplyArk - Data Protection and Privacy Management</p>
    </div>
  </div>
</body>
</html>`,
      },
      {
        name: 'Request Status Update',
        subject: 'Update on Your Request - ComplyArk',
        body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .status { font-weight: bold; padding: 10px; text-align: center; margin: 15px 0; }
    .status-processing { background-color: #fff3cd; color: #856404; }
    .status-completed { background-color: #d4edda; color: #155724; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Request Status Update</h2>
    </div>
    <div class="content">
      <p>Hello {firstName},</p>
      <p>There has been an update to your {requestType} request.</p>
      <div class="status">
        Current Status: {status}
      </div>
      <p><strong>Request ID:</strong> {requestId}</p>
      <p>{statusMessage}</p>
      <p>If you have any questions, please contact the organization handling your request.</p>
    </div>
    <div class="footer">
      <p>This is an automated message from the ComplyArk system.</p>
      <p>&copy; ComplyArk - Data Protection and Privacy Management</p>
    </div>
  </div>
</body>
</html>`,
      },
    ];
    
    // Insert templates
    for (const template of defaultTemplates) {
      await db.insert(emailTemplates).values(template);
      console.log(`Added template: ${template.name}`);
    }
    
    console.log('Email templates added successfully!');
  } catch (error) {
    console.error('Error adding email templates:', error);
  } finally {
    process.exit(0);
  }
}

// Execute the function
addEmailTemplates();