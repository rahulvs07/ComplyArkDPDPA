import { Request, Response } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { notificationLogs } from "@shared/schema";
import { eq, and, count } from "drizzle-orm";

/**
 * Get notifications for the current user's organization
 * @param req Request object
 * @param res Response object
 */
export async function getNotifications(req: any, res: Response) {
  try {
    // Check for authentication using the same pattern as other endpoints
    if (!req.session || !req.session.authenticated) {
      return res.status(401).json({ message: "Unauthorized. Please login to access this resource." });
    }

    const limit = parseInt(req.query.limit as string) || 5;
    const offset = parseInt(req.query.offset as string) || 0;
    const organizationId = req.session.organizationId;

    // Get user info from session
    const user = await storage.getUserByEmail(req.session.email);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    console.log(`Fetching notifications for user ${user.id} in organization ${organizationId}`);
    const notifications = await storage.getNotifications(organizationId, limit, offset, user.id);
    console.log(`Found ${notifications.length} notifications`);
    
    return res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({ message: "Failed to fetch notifications", error: (error as Error).message });
  }
}

/**
 * Add a notification to the system
 * @param req Request object
 * @param res Response object
 */
export async function addNotification(req: Request, res: Response) {
  try {
    const notification = req.body;
    
    // Validate required fields
    if (!notification.userId || !notification.organizationId || !notification.module || !notification.action || !notification.actionType || !notification.message) {
      return res.status(400).json({ message: "Missing required notification fields" });
    }
    
    const result = await storage.createNotification(notification);
    
    return res.status(201).json(result);
  } catch (error) {
    console.error("Error creating notification:", error);
    return res.status(500).json({ message: "Failed to create notification", error: (error as Error).message });
  }
}

/**
 * Mark notifications as read
 * @param req Request object
 * @param res Response object
 */
export async function markNotificationsAsRead(req: Request, res: Response) {
  try {
    // Authorization check - user must be logged in
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized. Please login to access this resource." });
    }
    
    const userId = req.user.id;
    const { notificationIds } = req.body;
    
    // If notificationIds is provided, mark only those notifications as read
    // Otherwise, mark all unread notifications for this user as read
    const updatedCount = await storage.markNotificationsAsRead(userId, notificationIds);
    
    return res.status(200).json({ 
      message: `${updatedCount} notification(s) marked as read`, 
      count: updatedCount 
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return res.status(500).json({ message: "Failed to mark notifications as read", error: (error as Error).message });
  }
}

/**
 * Get unread notification count
 * @param req Request object
 * @param res Response object
 */
export async function getUnreadNotificationCount(req: any, res: Response) {
  try {
    // Check for authentication using the same pattern as other endpoints
    if (!req.session || !req.session.authenticated) {
      return res.status(401).json({ message: "Unauthorized. Please login to access this resource." });
    }
    
    const organizationId = req.session.organizationId;
    
    // Get user info from session
    const user = await storage.getUserByEmail(req.session.email);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Get count for this specific user from database
    const count = await storage.getUnreadNotificationCountForUser(user.id);
    
    return res.status(200).json({ count });
  } catch (error) {
    console.error("Error fetching unread notification count:", error);
    return res.status(500).json({ message: "Failed to fetch unread notification count", error: (error as Error).message });
  }
}