/**
 * Request Notification Service
 * 
 * Handles email notifications for request creation and closure
 * For both Data Protection Requests and Grievances
 */

import { storage } from '../storage';
import { getTemplateByName, processTemplate, sendEmailWithTemplate } from '../controllers/emailController';

interface RequestNotificationData {
  firstName: string;
  lastName: string;
  email: string;
  organizationName: string;
  requestType: string;
  closureComment?: string;
  assignedStaffEmail?: string | null;
}

/**
 * Send a notification email when a new request is created
 */
export async function sendRequestCreationNotification(
  requestType: 'dpr' | 'grievance',
  requestId: number,
  data: RequestNotificationData
): Promise<boolean> {
  try {
    // Get email template
    const template = await getTemplateByName('Request Creation Notification');
    if (!template) {
      console.error('Request creation email template not found');
      return false;
    }

    // Prepare template variables
    const variables = {
      name: `${data.firstName} ${data.lastName}`,
      requestId: requestId.toString(),
      requestType: data.requestType,
      organizationName: data.organizationName,
      date: new Date().toLocaleDateString()
    };

    // Process the template
    const processedSubject = processTemplate(template.subject, variables);
    const processedBody = processTemplate(template.body, variables);

    // Send the email
    const success = await sendEmailWithTemplate({
      to: data.email,
      subject: processedSubject,
      html: processedBody
    });

    return success;
  } catch (error) {
    console.error('Error sending request creation notification:', error);
    return false;
  }
}

/**
 * Send a notification email when a request is closed
 */
export async function sendRequestClosureNotification(
  requestType: 'dpr' | 'grievance',
  requestId: number,
  data: RequestNotificationData
): Promise<boolean> {
  try {
    // Get email template
    const template = await getTemplateByName('Request Closure Notification');
    if (!template) {
      console.error('Request closure email template not found');
      return false;
    }

    // Prepare template variables
    const variables = {
      name: `${data.firstName} ${data.lastName}`,
      requestId: requestId.toString(),
      requestType: data.requestType,
      organizationName: data.organizationName,
      closureComment: data.closureComment || 'Your request has been processed and is now closed.',
      date: new Date().toLocaleDateString()
    };

    // Process the template
    const processedSubject = processTemplate(template.subject, variables);
    const processedBody = processTemplate(template.body, variables);

    // Prepare recipients
    const options: any = {
      to: data.email,
      subject: processedSubject,
      html: processedBody
    };

    // Add CC for the assigned staff if available
    if (data.assignedStaffEmail) {
      options.cc = [data.assignedStaffEmail];
    }

    // Send the email
    const success = await sendEmailWithTemplate(options);

    return success;
  } catch (error) {
    console.error('Error sending request closure notification:', error);
    return false;
  }
}