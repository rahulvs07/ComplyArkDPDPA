import { Request, Response } from 'express';
import { db } from '../db';
import { emailTemplates, emailSettings, organizations, dpRequests, grievances, requestStatuses, users } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { sendEmail } from '../controllers/emailController';

/**
 * Send notification email for data protection request status changes
 */
export async function sendDprStatusNotification(req: Request, res: Response) {
  try {
    const { requestId, statusId, comments } = req.body;
    
    if (!requestId || !statusId) {
      return res.status(400).json({ message: 'Request ID and status ID are required' });
    }

    // Get request details
    const dprRequest = await db.select()
      .from(dpRequests)
      .where(eq(dpRequests.requestId, requestId))
      .limit(1);
    
    if (!dprRequest || dprRequest.length === 0) {
      return res.status(404).json({ message: 'Data protection request not found' });
    }

    // Get organization details
    const organization = await db.select()
      .from(organizations)
      .where(eq(organizations.id, dprRequest[0].organizationId))
      .limit(1);
    
    if (!organization || organization.length === 0) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Get status details
    const status = await db.select()
      .from(requestStatuses)
      .where(eq(requestStatuses.statusId, statusId))
      .limit(1);
    
    if (!status || status.length === 0) {
      return res.status(404).json({ message: 'Status not found' });
    }

    // Get template for request status update
    const template = await db.select()
      .from(emailTemplates)
      .where(eq(emailTemplates.name, 'Request Status Update'))
      .limit(1);
    
    if (!template || template.length === 0) {
      return res.status(404).json({ message: 'Email template not found' });
    }

    // Get email settings
    const settings = await db.select().from(emailSettings).limit(1);
    
    if (!settings || settings.length === 0) {
      return res.status(500).json({ message: 'Email settings not configured' });
    }

    // Prepare email content
    const subject = template[0].subject
      .replace('{requestType}', dprRequest[0].requestType)
      .replace('{organizationName}', organization[0].businessName);

    let htmlContent = template[0].body
      .replace('{firstName}', dprRequest[0].firstName)
      .replace('{lastName}', dprRequest[0].lastName)
      .replace('{requestId}', requestId.toString())
      .replace('{requestType}', dprRequest[0].requestType)
      .replace('{statusName}', status[0].statusName)
      .replace('{organizationName}', organization[0].businessName)
      .replace('{comments}', comments || 'No additional comments provided.');

    // Send email
    try {
      // If status is Closed (assuming status 5 is "Closed"), also CC the assigned staff member
      let ccEmail = null;
      if (statusId === 5 && dprRequest[0].assignedToUserId) {
        // Get assigned user's email
        const assignedUser = await db.select()
          .from(users)
          .where(eq(users.id, dprRequest[0].assignedToUserId))
          .limit(1);
        
        if (assignedUser && assignedUser.length > 0) {
          ccEmail = assignedUser[0].email;
        }
      }

      await sendEmail({
        to: dprRequest[0].email,
        from: `${settings[0].fromName} <${settings[0].fromEmail}>`,
        subject,
        html: htmlContent,
        cc: ccEmail ? [ccEmail] : undefined
      });

      // Update request with status
      const currentDate = new Date();
      await db.update(dpRequests)
        .set({ 
          statusId, 
          lastUpdatedAt: currentDate,
          ...(statusId === 5 ? { // Assuming status 5 is "Closed"
            closedDateTime: currentDate,
            closureComments: comments || null
          } : {})
        })
        .where(eq(dpRequests.requestId, requestId));

      return res.status(200).json({ 
        message: 'Status update notification sent successfully',
        requestId,
        statusId,
        statusName: status[0].statusName
      });
    } catch (error) {
      console.error('Email sending failed:', error);
      return res.status(500).json({ 
        message: 'Failed to send notification email', 
        error: error instanceof Error ? error.message : 'Unknown error',
        note: 'Status was updated but email notification failed' 
      });
    }
  } catch (error) {
    console.error('Error sending DPR status notification:', error);
    return res.status(500).json({ 
      message: 'Failed to send status notification', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

/**
 * Send notification email for grievance status changes
 */
export async function sendGrievanceStatusNotification(req: Request, res: Response) {
  try {
    const { grievanceId, statusId, comments } = req.body;
    
    if (!grievanceId || !statusId) {
      return res.status(400).json({ message: 'Grievance ID and status ID are required' });
    }

    // Get grievance details
    const grievanceData = await db.select()
      .from(grievances)
      .where(eq(grievances.grievanceId, grievanceId))
      .limit(1);
    
    if (!grievanceData || grievanceData.length === 0) {
      return res.status(404).json({ message: 'Grievance not found' });
    }

    // Get organization details
    const organization = await db.select()
      .from(organizations)
      .where(eq(organizations.id, grievanceData[0].organizationId))
      .limit(1);
    
    if (!organization || organization.length === 0) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Get status details
    const status = await db.select()
      .from(requestStatuses)
      .where(eq(requestStatuses.statusId, statusId))
      .limit(1);
    
    if (!status || status.length === 0) {
      return res.status(404).json({ message: 'Status not found' });
    }

    // Get template for grievance status update
    const template = await db.select()
      .from(emailTemplates)
      .where(eq(emailTemplates.name, 'Grievance Status Update'))
      .limit(1);
    
    if (!template || template.length === 0) {
      return res.status(404).json({ message: 'Email template not found' });
    }

    // Get email settings
    const settings = await db.select().from(emailSettings).limit(1);
    
    if (!settings || settings.length === 0) {
      return res.status(500).json({ message: 'Email settings not configured' });
    }

    // Prepare email content
    const subject = template[0].subject
      .replace('{organizationName}', organization[0].businessName);

    let htmlContent = template[0].body
      .replace('{firstName}', grievanceData[0].firstName)
      .replace('{lastName}', grievanceData[0].lastName)
      .replace('{grievanceId}', grievanceId.toString())
      .replace('{statusName}', status[0].statusName)
      .replace('{organizationName}', organization[0].businessName)
      .replace('{comments}', comments || 'No additional comments provided.');

    // Send email
    try {
      // If status is Closed (assuming status 5 is "Closed"), also CC the assigned staff member
      let ccEmail = null;
      if (statusId === 5 && grievanceData[0].assignedToUserId) {
        // Get assigned user's email
        const assignedUser = await db.select()
          .from(users)
          .where(eq(users.id, grievanceData[0].assignedToUserId))
          .limit(1);
        
        if (assignedUser && assignedUser.length > 0) {
          ccEmail = assignedUser[0].email;
        }
      }

      await sendEmail({
        to: grievanceData[0].email,
        from: `${settings[0].fromName} <${settings[0].fromEmail}>`,
        subject,
        html: htmlContent,
        cc: ccEmail ? [ccEmail] : undefined
      });

      // Update grievance with status
      const currentDate = new Date();
      await db.update(grievances)
        .set({ 
          statusId, 
          lastUpdatedAt: currentDate,
          ...(statusId === 5 ? { // Assuming status 5 is "Closed"
            closedDateTime: currentDate,
            closureComments: comments || null
          } : {})
        })
        .where(eq(grievances.grievanceId, grievanceId));

      return res.status(200).json({ 
        message: 'Status update notification sent successfully',
        grievanceId,
        statusId,
        statusName: status[0].statusName
      });
    } catch (error) {
      console.error('Email sending failed:', error);
      return res.status(500).json({ 
        message: 'Failed to send notification email', 
        error: error instanceof Error ? error.message : 'Unknown error',
        note: 'Status was updated but email notification failed' 
      });
    }
  } catch (error) {
    console.error('Error sending grievance status notification:', error);
    return res.status(500).json({ 
      message: 'Failed to send status notification', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

/**
 * Send confirmation email to user after creating a data protection request
 */
export async function sendDprConfirmationEmail(req: Request, res: Response) {
  try {
    const { requestId } = req.params;
    
    if (!requestId) {
      return res.status(400).json({ message: 'Request ID is required' });
    }

    // Get request details
    const dprRequest = await db.select()
      .from(dpRequests)
      .where(eq(dpRequests.requestId, parseInt(requestId)))
      .limit(1);
    
    if (!dprRequest || dprRequest.length === 0) {
      return res.status(404).json({ message: 'Data protection request not found' });
    }

    // Get organization details
    const organization = await db.select()
      .from(organizations)
      .where(eq(organizations.id, dprRequest[0].organizationId))
      .limit(1);
    
    if (!organization || organization.length === 0) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Get template for request confirmation
    const template = await db.select()
      .from(emailTemplates)
      .where(eq(emailTemplates.name, 'Request Confirmation'))
      .limit(1);
    
    if (!template || template.length === 0) {
      return res.status(404).json({ message: 'Email template not found' });
    }

    // Get email settings
    const settings = await db.select().from(emailSettings).limit(1);
    
    if (!settings || settings.length === 0) {
      return res.status(500).json({ message: 'Email settings not configured' });
    }

    // Calculate expected completion date (based on SLA)
    const requestStatus = await db.select()
      .from(requestStatuses)
      .where(eq(requestStatuses.statusId, dprRequest[0].statusId))
      .limit(1);
    
    const slaDays = requestStatus && requestStatus.length > 0 ? requestStatus[0].slaDays : 15; // Default to 15 days if not found
    const dueDate = new Date(dprRequest[0].createdAt);
    dueDate.setDate(dueDate.getDate() + slaDays);

    // Prepare email content
    const subject = template[0].subject
      .replace('{requestType}', dprRequest[0].requestType)
      .replace('{organizationName}', organization[0].businessName);

    let htmlContent = template[0].body
      .replace('{firstName}', dprRequest[0].firstName)
      .replace('{lastName}', dprRequest[0].lastName)
      .replace('{requestId}', requestId)
      .replace('{requestType}', dprRequest[0].requestType)
      .replace('{organizationName}', organization[0].businessName)
      .replace('{dueDate}', dueDate.toLocaleDateString());

    // Send email
    try {
      await sendEmail({
        to: dprRequest[0].email,
        from: `${settings[0].fromName} <${settings[0].fromEmail}>`,
        subject,
        html: htmlContent,
      });

      return res.status(200).json({ 
        message: 'Confirmation email sent successfully',
        requestId
      });
    } catch (error) {
      console.error('Email sending failed:', error);
      return res.status(500).json({ 
        message: 'Failed to send confirmation email', 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Error sending DPR confirmation:', error);
    return res.status(500).json({ 
      message: 'Failed to send confirmation email', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

/**
 * Send confirmation email to user after creating a grievance
 */
export async function sendGrievanceConfirmationEmail(req: Request, res: Response) {
  try {
    const { grievanceId } = req.params;
    
    if (!grievanceId) {
      return res.status(400).json({ message: 'Grievance ID is required' });
    }

    // Get grievance details
    const grievanceData = await db.select()
      .from(grievances)
      .where(eq(grievances.grievanceId, parseInt(grievanceId)))
      .limit(1);
    
    if (!grievanceData || grievanceData.length === 0) {
      return res.status(404).json({ message: 'Grievance not found' });
    }

    // Get organization details
    const organization = await db.select()
      .from(organizations)
      .where(eq(organizations.id, grievanceData[0].organizationId))
      .limit(1);
    
    if (!organization || organization.length === 0) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Get template for grievance confirmation
    const template = await db.select()
      .from(emailTemplates)
      .where(eq(emailTemplates.name, 'Grievance Confirmation'))
      .limit(1);
    
    if (!template || template.length === 0) {
      return res.status(404).json({ message: 'Email template not found' });
    }

    // Get email settings
    const settings = await db.select().from(emailSettings).limit(1);
    
    if (!settings || settings.length === 0) {
      return res.status(500).json({ message: 'Email settings not configured' });
    }

    // Calculate expected completion date (based on SLA)
    const requestStatus = await db.select()
      .from(requestStatuses)
      .where(eq(requestStatuses.statusId, grievanceData[0].statusId))
      .limit(1);
    
    const slaDays = requestStatus && requestStatus.length > 0 ? requestStatus[0].slaDays : 15; // Default to 15 days if not found
    const dueDate = new Date(grievanceData[0].createdAt);
    dueDate.setDate(dueDate.getDate() + slaDays);

    // Prepare email content
    const subject = template[0].subject
      .replace('{organizationName}', organization[0].businessName);

    let htmlContent = template[0].body
      .replace('{firstName}', grievanceData[0].firstName)
      .replace('{lastName}', grievanceData[0].lastName)
      .replace('{grievanceId}', grievanceId)
      .replace('{organizationName}', organization[0].businessName)
      .replace('{dueDate}', dueDate.toLocaleDateString());

    // Send email
    try {
      await sendEmail({
        to: grievanceData[0].email,
        from: `${settings[0].fromName} <${settings[0].fromEmail}>`,
        subject,
        html: htmlContent,
      });

      return res.status(200).json({ 
        message: 'Confirmation email sent successfully',
        grievanceId
      });
    } catch (error) {
      console.error('Email sending failed:', error);
      return res.status(500).json({ 
        message: 'Failed to send confirmation email', 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Error sending grievance confirmation:', error);
    return res.status(500).json({ 
      message: 'Failed to send confirmation email', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}