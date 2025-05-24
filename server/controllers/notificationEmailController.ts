/**
 * Notification Email Controller
 * Handles sending notification emails for various events
 */
import { Request, Response } from 'express';
import { db } from '../db';
import { 
  sendEmailWithTemplate, 
  getTemplateByName,
  processTemplate
} from '../emailService';
import { format } from 'date-fns';

/**
 * Send confirmation email when a new DPR request is created
 */
export const sendDprConfirmationEmail = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    
    if (!requestId) {
      return res.status(400).json({ message: 'Request ID is required' });
    }
    
    // Get the request details
    const request = await db.query.dpRequests.findFirst({
      where: (dpRequests, { eq }) => eq(dpRequests.requestId, parseInt(requestId)),
      with: {
        organization: true,
        requestType: true,
        status: true
      }
    });
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    // Format dates
    const dueDate = request.dueDate ? format(new Date(request.dueDate), 'MMMM dd, yyyy') : 'Not specified';
    
    // Prepare template variables
    const variables = {
      firstName: request.requestorFirstName || 'Requestor',
      requestId: requestId,
      organizationName: request.organization?.businessName || 'Organization',
      requestType: request.requestType?.requestTypeName || 'Data Protection Request',
      dueDate,
      submissionDate: format(new Date(request.requestDate), 'MMMM dd, yyyy'),
      statusName: request.status?.statusName || 'Submitted'
    };
    
    // Send the confirmation email
    const emailSent = await sendEmailWithTemplate(
      'Request Confirmation',
      request.requestorEmail,
      undefined, // No CC for confirmation
      variables
    );
    
    if (!emailSent) {
      console.error(`Failed to send confirmation email for DPR request ${requestId}`);
      return res.status(500).json({ message: 'Failed to send confirmation email' });
    }
    
    return res.json({ message: 'Confirmation email sent successfully' });
  } catch (error) {
    console.error('Error sending DPR confirmation email:', error);
    return res.status(500).json({ message: 'Failed to send confirmation email' });
  }
};

/**
 * Send notification email when a DPR request status changes
 */
export const sendDprStatusNotification = async (req: Request, res: Response) => {
  try {
    const { requestId, statusId, comments } = req.body;
    
    if (!requestId || !statusId) {
      return res.status(400).json({ message: 'Request ID and Status ID are required' });
    }
    
    // Get the request details
    const request = await db.query.dpRequests.findFirst({
      where: (dpRequests, { eq }) => eq(dpRequests.requestId, parseInt(requestId)),
      with: {
        organization: true,
        requestType: true,
        assignedTo: true
      }
    });
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    // Get the new status
    const status = await db.query.requestStatuses.findFirst({
      where: (requestStatuses, { eq }) => eq(requestStatuses.statusId, parseInt(statusId))
    });
    
    if (!status) {
      return res.status(404).json({ message: 'Status not found' });
    }
    
    // Format dates
    const dueDate = request.dueDate ? format(new Date(request.dueDate), 'MMMM dd, yyyy') : 'Not specified';
    
    // Prepare template variables
    const variables = {
      firstName: request.requestorFirstName || 'Requestor',
      requestId: requestId.toString(),
      organizationName: request.organization?.businessName || 'Organization',
      requestType: request.requestType?.requestTypeName || 'Data Protection Request',
      dueDate,
      submissionDate: format(new Date(request.requestDate), 'MMMM dd, yyyy'),
      statusName: status.statusName,
      comments: comments || 'No additional comments provided.'
    };
    
    // For closed status, CC the assigned staff member if available
    let ccEmails: string[] | undefined = undefined;
    if (status.statusName.toLowerCase() === 'closed' && request.assignedTo?.email) {
      ccEmails = [request.assignedTo.email];
    }
    
    // Send the status update email
    const emailSent = await sendEmailWithTemplate(
      'Request Status Update',
      request.requestorEmail,
      ccEmails,
      variables
    );
    
    if (!emailSent) {
      console.error(`Failed to send status notification email for DPR request ${requestId}`);
      return res.status(500).json({ message: 'Failed to send status notification email' });
    }
    
    return res.json({ message: 'Status notification email sent successfully' });
  } catch (error) {
    console.error('Error sending DPR status notification email:', error);
    return res.status(500).json({ message: 'Failed to send status notification email' });
  }
};

/**
 * Send confirmation email when a new grievance is created
 */
export const sendGrievanceConfirmationEmail = async (req: Request, res: Response) => {
  try {
    const { grievanceId } = req.params;
    
    if (!grievanceId) {
      return res.status(400).json({ message: 'Grievance ID is required' });
    }
    
    // Get the grievance details
    const grievance = await db.query.grievances.findFirst({
      where: (grievances, { eq }) => eq(grievances.grievanceId, parseInt(grievanceId)),
      with: {
        organization: true,
        status: true
      }
    });
    
    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }
    
    // Format dates
    const dueDate = grievance.dueDate ? format(new Date(grievance.dueDate), 'MMMM dd, yyyy') : 'Not specified';
    
    // Prepare template variables
    const variables = {
      firstName: grievance.fullName?.split(' ')[0] || 'Complainant',
      grievanceId: grievanceId,
      organizationName: grievance.organization?.businessName || 'Organization',
      dueDate,
      submissionDate: format(new Date(grievance.submissionDate), 'MMMM dd, yyyy'),
      statusName: grievance.status?.statusName || 'Submitted'
    };
    
    // Send the confirmation email
    const emailSent = await sendEmailWithTemplate(
      'Grievance Confirmation',
      grievance.email,
      undefined, // No CC for confirmation
      variables
    );
    
    if (!emailSent) {
      console.error(`Failed to send confirmation email for grievance ${grievanceId}`);
      return res.status(500).json({ message: 'Failed to send confirmation email' });
    }
    
    return res.json({ message: 'Confirmation email sent successfully' });
  } catch (error) {
    console.error('Error sending grievance confirmation email:', error);
    return res.status(500).json({ message: 'Failed to send confirmation email' });
  }
};

/**
 * Send notification email when a grievance status changes
 */
export const sendGrievanceStatusNotification = async (req: Request, res: Response) => {
  try {
    const { grievanceId, statusId, comments } = req.body;
    
    if (!grievanceId || !statusId) {
      return res.status(400).json({ message: 'Grievance ID and Status ID are required' });
    }
    
    // Get the grievance details
    const grievance = await db.query.grievances.findFirst({
      where: (grievances, { eq }) => eq(grievances.grievanceId, parseInt(grievanceId)),
      with: {
        organization: true,
        assignedTo: true
      }
    });
    
    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }
    
    // Get the new status
    const status = await db.query.requestStatuses.findFirst({
      where: (requestStatuses, { eq }) => eq(requestStatuses.statusId, parseInt(statusId))
    });
    
    if (!status) {
      return res.status(404).json({ message: 'Status not found' });
    }
    
    // Format dates
    const dueDate = grievance.dueDate ? format(new Date(grievance.dueDate), 'MMMM dd, yyyy') : 'Not specified';
    
    // Prepare template variables
    const variables = {
      firstName: grievance.fullName?.split(' ')[0] || 'Complainant',
      grievanceId: grievanceId.toString(),
      organizationName: grievance.organization?.businessName || 'Organization',
      dueDate,
      submissionDate: format(new Date(grievance.submissionDate), 'MMMM dd, yyyy'),
      statusName: status.statusName,
      comments: comments || 'No additional comments provided.'
    };
    
    // For closed status, CC the assigned staff member if available
    let ccEmails: string[] | undefined = undefined;
    if (status.statusName.toLowerCase() === 'closed' && grievance.assignedTo?.email) {
      ccEmails = [grievance.assignedTo.email];
    }
    
    // Send the status update email
    const emailSent = await sendEmailWithTemplate(
      'Grievance Status Update',
      grievance.email,
      ccEmails,
      variables
    );
    
    if (!emailSent) {
      console.error(`Failed to send status notification email for grievance ${grievanceId}`);
      return res.status(500).json({ message: 'Failed to send status notification email' });
    }
    
    return res.json({ message: 'Status notification email sent successfully' });
  } catch (error) {
    console.error('Error sending grievance status notification email:', error);
    return res.status(500).json({ message: 'Failed to send status notification email' });
  }
};