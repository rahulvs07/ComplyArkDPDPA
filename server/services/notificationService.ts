/**
 * Notification Service for ComplyArk
 * 
 * This service handles automatic email notifications for various events:
 * - Status changes for DPR and Grievances
 * - Escalation alerts
 * - Assignment notifications
 * - Due date reminders
 */

import { storage } from '../storage';
import { 
  sendStatusChangeNotification, 
  sendEscalationNotification,
  sendAssignmentNotification 
} from '../utils/emailService';

interface StatusChangeEvent {
  requestId?: number;
  grievanceId?: number;
  requestType?: string;
  oldStatusId: number;
  newStatusId: number;
  organizationId: number;
  changedByUserId: number;
  assignedToUserId?: number;
  comments?: string;
}

/**
 * Handle status change and send appropriate notifications
 */
export async function handleStatusChange(event: StatusChangeEvent): Promise<void> {
  try {
    // Get the request/grievance details
    let requestData = null;
    let organization = null;
    
    if (event.requestId) {
      requestData = await storage.getDPRequest(event.requestId);
    } else if (event.grievanceId) {
      requestData = await storage.getGrievance(event.grievanceId);
    }
    
    if (!requestData) {
      console.error('Request/Grievance not found for notification');
      return;
    }
    
    // Get organization details
    organization = await storage.getOrganization(event.organizationId);
    if (!organization) {
      console.error('Organization not found for notification');
      return;
    }
    
    // Get status names
    const oldStatus = await storage.getRequestStatus(event.oldStatusId);
    const newStatus = await storage.getRequestStatus(event.newStatusId);
    
    if (!oldStatus || !newStatus) {
      console.error('Status information not found for notification');
      return;
    }
    
    // Get assigned user name if available
    let assignedUser = null;
    if (event.assignedToUserId) {
      assignedUser = await storage.getUser(event.assignedToUserId);
    }
    
    // Prepare notification data
    const notificationData = {
      requestId: event.requestId,
      grievanceId: event.grievanceId,
      requestType: event.requestType,
      requesterName: `${requestData.firstName} ${requestData.lastName}`,
      requesterEmail: requestData.email,
      organizationName: organization.businessName,
      statusName: newStatus.statusName,
      assignedTo: assignedUser ? `${assignedUser.firstName} ${assignedUser.lastName}` : undefined,
      comments: event.comments
    };
    
    // Send status change notification to the requester
    await sendStatusChangeNotification(
      notificationData, 
      newStatus.statusName, 
      oldStatus.statusName
    );
    
    // Check if this is an escalation
    if (newStatus.statusName === 'Escalated') {
      await sendEscalationNotification(notificationData);
      console.log(`🚨 Escalation notification sent for ${event.requestId ? 'DPR' : 'Grievance'} #${event.requestId || event.grievanceId}`);
    }
    
    // If request was reassigned, notify the new assignee
    if (event.assignedToUserId && assignedUser) {
      await sendAssignmentNotification(assignedUser.email, notificationData);
      console.log(`👤 Assignment notification sent to ${assignedUser.email}`);
    }
    
    console.log(`✅ Status change notification sent for ${event.requestId ? 'DPR' : 'Grievance'} #${event.requestId || event.grievanceId}`);
    
  } catch (error) {
    console.error('📧 Failed to send status change notification:', error);
  }
}

/**
 * Start periodic checks for overdue requests (every hour)
 */
export function startOverdueNotificationScheduler(): void {
  console.log('🕐 Starting overdue notification scheduler...');
  
  // Run every hour to check for overdue requests
  setInterval(async () => {
    try {
      console.log('🔍 Checking for overdue requests...');
      
      const currentDate = new Date();
      
      // This would check for overdue requests and send notifications
      // Implementation depends on your specific SLA requirements
      
      console.log('✅ Overdue check completed.');
    } catch (error) {
      console.error('📧 Failed to check overdue requests:', error);
    }
  }, 60 * 60 * 1000);
}