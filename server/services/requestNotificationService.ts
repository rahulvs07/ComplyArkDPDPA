/**
 * Request Notification Service
 * 
 * Handles email notifications for request creation and closure
 * For both Data Protection Requests and Grievances
 */

import { db } from '../db';
import { emailTemplates } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { sendEmail } from '../controllers/emailController';

/**
 * Send a notification email when a new request is created
 */
export async function sendRequestCreationNotification(
  requestType: 'dpr' | 'grievance',
  requestId: number,
  requestData: {
    firstName: string;
    lastName: string;
    email: string;
    organizationName: string;
    requestType?: string;
  }
): Promise<boolean> {
  try {
    // Get email template for request creation
    const templateName = 'Request Creation Notification';
    const template = await db.select().from(emailTemplates)
      .where(eq(emailTemplates.name, templateName))
      .limit(1);
    
    if (template.length === 0) {
      console.error(`Email template '${templateName}' not found`);
      return false;
    }
    
    const fullName = `${requestData.firstName} ${requestData.lastName}`;
    const requestTypeDisplay = requestType === 'dpr' 
      ? `Data Protection Request (${requestData.requestType || 'General'})`
      : 'Grievance';
    
    // Replace template variables
    let subject = template[0].subject
      .replace('{requestType}', requestTypeDisplay)
      .replace('{requestId}', requestId.toString());
    
    let htmlContent = template[0].body
      .replace(/{requestId}/g, requestId.toString())
      .replace(/{requestType}/g, requestTypeDisplay)
      .replace(/{name}/g, fullName)
      .replace(/{organizationName}/g, requestData.organizationName);
    
    // Create plain text version by stripping HTML
    const textContent = htmlContent.replace(/<[^>]*>/g, '');
    
    // Send the email
    const result = await sendEmail(
      requestData.email,
      subject,
      textContent,
      htmlContent
    );
    
    if (result.success) {
      console.log(`✅ Creation notification email sent successfully for ${requestType} #${requestId}`);
      return true;
    } else {
      console.error(`❌ Failed to send creation notification email for ${requestType} #${requestId}:`, result.error);
      return false;
    }
  } catch (error) {
    console.error(`Error sending creation notification for ${requestType} #${requestId}:`, error);
    return false;
  }
}

/**
 * Send a notification email when a request is closed
 */
export async function sendRequestClosureNotification(
  requestType: 'dpr' | 'grievance',
  requestId: number,
  requestData: {
    firstName: string;
    lastName: string;
    email: string;
    organizationName: string;
    requestType?: string;
    closureComment: string;
    assignedStaffEmail?: string;
  }
): Promise<boolean> {
  try {
    // Get email template for request closure
    const templateName = 'Request Closure Notification';
    const template = await db.select().from(emailTemplates)
      .where(eq(emailTemplates.name, templateName))
      .limit(1);
    
    if (template.length === 0) {
      console.error(`Email template '${templateName}' not found`);
      return false;
    }
    
    const fullName = `${requestData.firstName} ${requestData.lastName}`;
    const requestTypeDisplay = requestType === 'dpr' 
      ? `Data Protection Request (${requestData.requestType || 'General'})`
      : 'Grievance';
    
    // Replace template variables
    let subject = template[0].subject
      .replace('{requestType}', requestTypeDisplay)
      .replace('{requestId}', requestId.toString());
    
    let htmlContent = template[0].body
      .replace(/{requestId}/g, requestId.toString())
      .replace(/{requestType}/g, requestTypeDisplay)
      .replace(/{name}/g, fullName)
      .replace(/{organizationName}/g, requestData.organizationName)
      .replace(/{closureComment}/g, requestData.closureComment || 'No comments provided');
    
    // Create plain text version by stripping HTML
    const textContent = htmlContent.replace(/<[^>]*>/g, '');
    
    // Configure email recipients
    const to = requestData.email;
    const cc = requestData.assignedStaffEmail ? [requestData.assignedStaffEmail] : [];
    
    // Send the email
    const result = await sendEmail(
      to,
      subject,
      textContent,
      htmlContent,
      cc
    );
    
    if (result.success) {
      console.log(`✅ Closure notification email sent successfully for ${requestType} #${requestId}`);
      return true;
    } else {
      console.error(`❌ Failed to send closure notification email for ${requestType} #${requestId}:`, result.error);
      return false;
    }
  } catch (error) {
    console.error(`Error sending closure notification for ${requestType} #${requestId}:`, error);
    return false;
  }
}