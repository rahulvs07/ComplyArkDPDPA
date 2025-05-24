/**
 * Script to add default notification email templates to the database
 * Run with: npx tsx scripts/add-notification-templates.ts
 */

import { db } from '../server/db';
import { emailTemplates } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function addNotificationTemplates() {
  try {
    console.log('Adding notification email templates...');
    
    // Default templates
    const defaultTemplates = [
      {
        name: 'Request Confirmation',
        subject: 'Your {requestType} Request Confirmation - {organizationName}',
        body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { padding: 20px; background-color: #f9f9f9; border-left: 1px solid #ddd; border-right: 1px solid #ddd; }
    .details { background-color: #eaeaea; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; background-color: #f1f1f1; padding: 15px; border-radius: 0 0 5px 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Request Confirmation</h2>
    </div>
    <div class="content">
      <p>Hello {firstName},</p>
      <p>Thank you for submitting your {requestType} request to {organizationName}. We have received it and will process it accordingly.</p>
      <div class="details">
        <p><strong>Request ID:</strong> {requestId}</p>
        <p><strong>Request Type:</strong> {requestType}</p>
        <p><strong>Expected Completion:</strong> {dueDate}</p>
      </div>
      <p>You can reference this Request ID in any future communications about this request.</p>
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
        subject: 'Update on Your {requestType} Request - {organizationName}',
        body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { padding: 20px; background-color: #f9f9f9; border-left: 1px solid #ddd; border-right: 1px solid #ddd; }
    .status { font-weight: bold; padding: 10px; text-align: center; margin: 15px 0; border-radius: 5px; }
    .status-processing { background-color: #fff3cd; color: #856404; }
    .status-completed { background-color: #d4edda; color: #155724; }
    .status-closed { background-color: #d4edda; color: #155724; }
    .comments { background-color: #f1f1f1; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #7C3AED; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; background-color: #f1f1f1; padding: 15px; border-radius: 0 0 5px 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Request Status Update</h2>
    </div>
    <div class="content">
      <p>Hello {firstName},</p>
      <p>There has been an update to your {requestType} request with {organizationName}.</p>
      <div class="status status-{statusName}">
        Current Status: <strong>{statusName}</strong>
      </div>
      <p><strong>Request ID:</strong> {requestId}</p>
      
      <div class="comments">
        <p><strong>Comments:</strong></p>
        <p>{comments}</p>
      </div>
      
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
      {
        name: 'Grievance Confirmation',
        subject: 'Your Grievance Submission Confirmation - {organizationName}',
        body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { padding: 20px; background-color: #f9f9f9; border-left: 1px solid #ddd; border-right: 1px solid #ddd; }
    .details { background-color: #eaeaea; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; background-color: #f1f1f1; padding: 15px; border-radius: 0 0 5px 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Grievance Submission Confirmation</h2>
    </div>
    <div class="content">
      <p>Hello {firstName},</p>
      <p>Thank you for submitting your grievance to {organizationName}. We have received it and will address it promptly.</p>
      <div class="details">
        <p><strong>Grievance ID:</strong> {grievanceId}</p>
        <p><strong>Submitted On:</strong> {submissionDate}</p>
        <p><strong>Expected Resolution:</strong> {dueDate}</p>
      </div>
      <p>You can reference this Grievance ID in any future communications about this matter.</p>
      <p>We will keep you updated on any progress or if we need additional information from you.</p>
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
        name: 'Grievance Status Update',
        subject: 'Update on Your Grievance - {organizationName}',
        body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { padding: 20px; background-color: #f9f9f9; border-left: 1px solid #ddd; border-right: 1px solid #ddd; }
    .status { font-weight: bold; padding: 10px; text-align: center; margin: 15px 0; border-radius: 5px; }
    .status-processing { background-color: #fff3cd; color: #856404; }
    .status-completed { background-color: #d4edda; color: #155724; }
    .status-closed { background-color: #d4edda; color: #155724; }
    .comments { background-color: #f1f1f1; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #7C3AED; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; background-color: #f1f1f1; padding: 15px; border-radius: 0 0 5px 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Grievance Status Update</h2>
    </div>
    <div class="content">
      <p>Hello {firstName},</p>
      <p>There has been an update to your grievance with {organizationName}.</p>
      <div class="status status-{statusName}">
        Current Status: <strong>{statusName}</strong>
      </div>
      <p><strong>Grievance ID:</strong> {grievanceId}</p>
      
      <div class="comments">
        <p><strong>Comments:</strong></p>
        <p>{comments}</p>
      </div>
      
      <p>If you have any questions, please contact the organization handling your grievance.</p>
    </div>
    <div class="footer">
      <p>This is an automated message from the ComplyArk system.</p>
      <p>&copy; ComplyArk - Data Protection and Privacy Management</p>
    </div>
  </div>
</body>
</html>`,
      }
    ];
    
    // Check for existing templates and add only missing ones
    for (const template of defaultTemplates) {
      const existing = await db.select()
        .from(emailTemplates)
        .where(eq(emailTemplates.name, template.name))
        .limit(1);
      
      if (existing.length === 0) {
        await db.insert(emailTemplates).values(template);
        console.log(`Added template: ${template.name}`);
      } else {
        console.log(`Template already exists: ${template.name}`);
      }
    }
    
    console.log('Notification email templates added successfully!');
  } catch (error) {
    console.error('Error adding notification templates:', error);
  }
}

// Execute the function
addNotificationTemplates();