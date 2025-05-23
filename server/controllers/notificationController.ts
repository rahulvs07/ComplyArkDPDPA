import { Request, Response } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { storage } from '../storage';

/**
 * Get notifications for the current user's organization
 * @param req Request object
 * @param res Response object
 */
export async function getNotifications(req: Request, res: Response) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;
    
    if (!userId || !organizationId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Check if the user is a superadmin (complyarkadmin)
    const isSuperAdmin = req.user?.username === 'complyarkadmin';
    
    // Get notifications - superadmin can see all, others only see their organization's
    const query = `
      SELECT 
        n.notification_id as "notificationId",
        n.user_id as "userId",
        n.organization_id as "organizationId",
        n.module,
        n.action,
        n.action_type as "actionType",
        n.timestamp,
        n.status,
        n.initiator,
        n.message,
        n.is_read as "isRead",
        n.related_item_id as "relatedItemId",
        n.related_item_type as "relatedItemType",
        u.first_name || ' ' || u.last_name as "userName",
        extract(epoch from now() - n.timestamp) / 60 as "minutesAgo"
      FROM notification_logs n
      JOIN users u ON n.user_id = u.id
      WHERE ${isSuperAdmin ? '1=1' : 'n.organization_id = $1'}
      ORDER BY n.timestamp DESC
      LIMIT $${isSuperAdmin ? 1 : 2}
      OFFSET $${isSuperAdmin ? 2 : 3}
    `;
    
    const params = isSuperAdmin 
      ? [limit, offset] 
      : [organizationId, limit, offset];
    
    const notifications = await db.execute(sql.raw(query, params));
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM notification_logs
      WHERE ${isSuperAdmin ? '1=1' : 'organization_id = $1'}
    `;
    
    const countParams = isSuperAdmin ? [] : [organizationId];
    const totalCount = await db.execute(sql.raw(countQuery, countParams));
    
    return res.status(200).json({
      notifications,
      total: parseInt(totalCount[0]?.total || '0')
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    return res.status(500).json({ message: 'Failed to get notifications' });
  }
}

/**
 * Add a notification to the system
 * @param req Request object
 * @param res Response object
 */
export async function addNotification(req: Request, res: Response) {
  try {
    const { userId, organizationId, module, action, actionType, message, relatedItemId, relatedItemType, initiator } = req.body;
    
    if (!userId || !organizationId || !module || !action || !actionType || !message) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Validate module and actionType
    const validModules = ['DPR', 'Grievance', 'Notice', 'Document', 'Admin'];
    const validActionTypes = ['created', 'reassigned', 'updated', 'escalated', 'translated', 'closed', 'viewed'];
    
    if (!validModules.includes(module)) {
      return res.status(400).json({ message: 'Invalid module' });
    }
    
    if (!validActionTypes.includes(actionType)) {
      return res.status(400).json({ message: 'Invalid action type' });
    }
    
    // Create the notification
    const result = await storage.createNotification({
      userId,
      organizationId,
      module,
      action,
      actionType,
      message,
      relatedItemId,
      relatedItemType,
      initiator: initiator || 'user'
    });
    
    return res.status(201).json(result);
  } catch (error) {
    console.error('Error adding notification:', error);
    return res.status(500).json({ message: 'Failed to add notification' });
  }
}

/**
 * Mark notifications as read
 * @param req Request object
 * @param res Response object
 */
export async function markNotificationsAsRead(req: Request, res: Response) {
  try {
    const { notificationIds } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Mark specific notifications as read, or all if notificationIds is not provided
    const updatedCount = await storage.markNotificationsAsRead(userId, notificationIds);
    
    return res.status(200).json({ 
      success: true, 
      message: `${updatedCount} notifications marked as read`,
      updatedCount
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return res.status(500).json({ message: 'Failed to mark notifications as read' });
  }
}

/**
 * Get unread notification count
 * @param req Request object
 * @param res Response object
 */
export async function getUnreadNotificationCount(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;
    
    if (!userId || !organizationId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Check if the user is a superadmin (complyarkadmin)
    const isSuperAdmin = req.user?.username === 'complyarkadmin';
    
    const query = `
      SELECT COUNT(*) as count
      FROM notification_logs
      WHERE is_read = false
      AND ${isSuperAdmin ? '1=1' : 'organization_id = $1'}
    `;
    
    const params = isSuperAdmin ? [] : [organizationId];
    const result = await db.execute(sql.raw(query, params));
    
    return res.status(200).json({
      count: parseInt(result[0]?.count || '0')
    });
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return res.status(500).json({ message: 'Failed to get unread notification count' });
  }
}