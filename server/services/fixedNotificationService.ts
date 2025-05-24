/**
 * Fixed Notification Service for ComplyArk
 * 
 * This service uses the robust directEmailSender to ensure notifications
 * are reliably delivered even when the main email system is in test mode.
 */

import { db } from '../db';
import { users, organizations } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { sendDirectEmail } from '../directEmailSender';

interface RequestData {
  firstName: string;
  lastName: string;
  email: string;
  organizationName: string;
  requestType: string;
  requestId?: number;
  grievanceId?: number;
  closureComment?: string;
  assignedStaffEmail?: string | null;
}

/**
 * Send a notification when a request is created
 */
export async function sendRequestCreationNotification(
  requestType: 'dpr' | 'grievance',
  requestId: number,
  data: RequestData
): Promise<boolean> {
  try {
    console.log(`Sending creation notification for ${requestType} #${requestId} to ${data.email}`);
    
    // Add the request ID to the data
    if (requestType === 'dpr') {
      data.requestId = requestId;
    } else {
      data.grievanceId = requestId;
    }
    
    // Create a subject line
    const subject = `Your ${data.requestType} Request #${requestId} has been received - ${data.organizationName}`;
    
    // Create text content
    const text = `
Hello ${data.firstName} ${data.lastName},

Thank you for submitting your ${data.requestType} request with ${data.organizationName}. 
We have received it and will process it accordingly.

Request Details:
- Request ID: ${requestId}
- Request Type: ${data.requestType}
- Submitted On: ${new Date().toLocaleDateString()}

Please keep this Request ID for your records. You may be contacted if additional information is needed.
We will notify you when your request has been processed.

This is an automated message from the ComplyArk system.
    `;
    
    // Create HTML content
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
        <p><strong>Request ID:</strong> ${requestId}</p>
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
</html>
    `;
    
    // Use the reliable direct email sender
    const result = await sendDirectEmail(data.email, subject, html, text);
    
    if (result.success) {
      console.log(`✅ Creation notification email sent for ${requestType} #${requestId} - Message ID: ${result.messageId}`);
      return true;
    } else {
      console.error(`❌ Creation notification email failed for ${requestType} #${requestId}: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error in sendRequestCreationNotification for ${requestType} #${requestId}:`, error);
    return false;
  }
}

/**
 * Send a notification when a request is closed
 */
export async function sendRequestClosureNotification(
  requestType: 'dpr' | 'grievance',
  requestId: number,
  data: RequestData
): Promise<boolean> {
  try {
    console.log(`Sending closure notification for ${requestType} #${requestId} to ${data.email}`);
    
    // Add the request ID to the data
    if (requestType === 'dpr') {
      data.requestId = requestId;
    } else {
      data.grievanceId = requestId;
    }
    
    // Create a subject line
    const subject = `Your ${data.requestType} Request #${requestId} has been completed - ${data.organizationName}`;
    
    // Create text content
    const text = `
Hello ${data.firstName} ${data.lastName},

Your ${data.requestType} request with ${data.organizationName} has been completed and is now closed.

Request Details:
- Request ID: ${requestId}
- Request Type: ${data.requestType}
- Status: Closed

Comments from our team:
${data.closureComment || 'Your request has been processed and is now closed.'}

Thank you for using our services. If you have any further questions, please contact us.

This is an automated message from the ComplyArk system.
    `;
    
    // Create HTML content
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
        <p><strong>Request ID:</strong> ${requestId}</p>
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
</html>
    `;
    
    // Set up email options
    let ccOptions = {};
    if (data.assignedStaffEmail) {
      // Add assigned staff to CC
      ccOptions = { cc: [data.assignedStaffEmail] };
      console.log(`📧 Adding CC recipient: ${data.assignedStaffEmail}`);
    }
    
    // Use the reliable direct email sender
    const result = await sendDirectEmail(data.email, subject, html, text);
    
    if (result.success) {
      console.log(`✅ Closure notification email sent for ${requestType} #${requestId} - Message ID: ${result.messageId}`);
      return true;
    } else {
      console.error(`❌ Closure notification email failed for ${requestType} #${requestId}: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error in sendRequestClosureNotification for ${requestType} #${requestId}:`, error);
    return false;
  }
}