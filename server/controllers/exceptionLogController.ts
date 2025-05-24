import { Request, Response } from 'express';
import { db } from '../db';
import { exceptionLogs } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { AuthRequest } from '../types';

/**
 * Create a new exception log entry
 */
export const logException = async (req: Request, res: Response) => {
  try {
    const {
      pageName,
      functionName,
      errorMessage,
      stackTrace,
      browserInfo,
      url,
      additionalInfo,
      severity
    } = req.body;

    // Get user and organization ID if available from session
    const userId = (req as AuthRequest).session?.userId || null;
    const organizationId = (req as AuthRequest).session?.organizationId || null;

    // Insert the exception log
    const [logEntry] = await db.insert(exceptionLogs).values({
      pageName,
      functionName,
      errorMessage,
      stackTrace,
      userId,
      organizationId,
      browserInfo,
      url,
      additionalInfo,
      severity: severity || 'medium'
    }).returning();

    res.status(201).json({
      message: 'Exception logged successfully',
      logId: logEntry.id
    });
  } catch (error) {
    console.error('Error logging exception:', error);
    res.status(500).json({ message: 'Failed to log exception' });
  }
};

/**
 * Get all exception logs (with pagination and filtering)
 */
export const getExceptionLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, status, severity } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    // Only superadmin or admin can see all logs
    if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
      return res.status(403).json({ message: 'Unauthorized to view exception logs' });
    }

    // Build query based on filters
    let query = db.select().from(exceptionLogs);
    
    if (status && status !== 'all') {
      query = query.where(eq(exceptionLogs.status, String(status)));
    }
    
    if (severity && severity !== 'all') {
      query = query.where(eq(exceptionLogs.severity, String(severity)));
    }
    
    // Get total count for pagination
    const totalResults = await query.execute();
    const total = totalResults.length;
    
    // Execute query with pagination
    const logs = await query
      .orderBy(desc(exceptionLogs.createdAt))
      .limit(Number(limit))
      .offset(offset)
      .execute();

    res.status(200).json({
      logs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error retrieving exception logs:', error);
    res.status(500).json({ message: 'Failed to retrieve exception logs' });
  }
};

/**
 * Get a specific exception log by ID
 */
export const getExceptionLogById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Only superadmin or admin can see logs
    if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
      return res.status(403).json({ message: 'Unauthorized to view exception logs' });
    }

    const [log] = await db
      .select()
      .from(exceptionLogs)
      .where(eq(exceptionLogs.id, Number(id)))
      .execute();

    if (!log) {
      return res.status(404).json({ message: 'Exception log not found' });
    }

    res.status(200).json(log);
  } catch (error) {
    console.error('Error retrieving exception log:', error);
    res.status(500).json({ message: 'Failed to retrieve exception log' });
  }
};

/**
 * Update exception log status (e.g., mark as resolved)
 */
export const updateExceptionLogStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, additionalInfo } = req.body;
    
    // Only superadmin or admin can update logs
    if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
      return res.status(403).json({ message: 'Unauthorized to update exception logs' });
    }

    const [log] = await db
      .select()
      .from(exceptionLogs)
      .where(eq(exceptionLogs.id, Number(id)))
      .execute();

    if (!log) {
      return res.status(404).json({ message: 'Exception log not found' });
    }

    // Update log status
    const [updatedLog] = await db
      .update(exceptionLogs)
      .set({
        status,
        additionalInfo: additionalInfo ? `${log.additionalInfo || ''}\n${new Date().toISOString()} - Status updated to ${status}: ${additionalInfo}` : log.additionalInfo,
        resolvedAt: status === 'resolved' ? new Date() : log.resolvedAt
      })
      .where(eq(exceptionLogs.id, Number(id)))
      .returning();

    res.status(200).json({ 
      message: 'Exception log status updated successfully',
      log: updatedLog
    });
  } catch (error) {
    console.error('Error updating exception log status:', error);
    res.status(500).json({ message: 'Failed to update exception log status' });
  }
};

/**
 * Delete an exception log (for cleanup purposes)
 */
export const deleteExceptionLog = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Only superadmin can delete logs
    if (req.user?.role !== 'superadmin') {
      return res.status(403).json({ message: 'Unauthorized to delete exception logs' });
    }

    const [log] = await db
      .select()
      .from(exceptionLogs)
      .where(eq(exceptionLogs.id, Number(id)))
      .execute();

    if (!log) {
      return res.status(404).json({ message: 'Exception log not found' });
    }

    await db
      .delete(exceptionLogs)
      .where(eq(exceptionLogs.id, Number(id)))
      .execute();

    res.status(200).json({ message: 'Exception log deleted successfully' });
  } catch (error) {
    console.error('Error deleting exception log:', error);
    res.status(500).json({ message: 'Failed to delete exception log' });
  }
};