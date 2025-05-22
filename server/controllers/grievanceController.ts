import { Request, Response } from 'express';
import { storage } from '../storage';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

// Schema for grievance updates
const grievanceUpdateSchema = z.object({
  statusId: z.number().optional(),
  assignedToUserId: z.number().optional().nullable(),
  resolutionDetails: z.string().optional().nullable(),
  resolutionDate: z.coerce.date().optional().nullable(),
  comments: z.string().optional(),
});

/**
 * Get all grievances for an organization
 */
export const getGrievances = async (req: Request, res: Response) => {
  const orgId = parseInt(req.params.orgId);
  const statusId = req.query.statusId ? parseInt(req.query.statusId as string) : undefined;
  
  if (isNaN(orgId)) {
    return res.status(400).json({ message: "Invalid organization ID" });
  }
  
  try {
    const grievances = await storage.listGrievances(orgId, statusId);
    return res.status(200).json(grievances);
  } catch (error) {
    console.error("Error fetching grievances:", error);
    return res.status(500).json({ message: "Failed to fetch grievances" });
  }
};

/**
 * Get a specific grievance by ID
 */
export const getGrievance = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid grievance ID" });
  }
  
  try {
    const grievance = await storage.getGrievance(id);
    if (!grievance) {
      return res.status(404).json({ message: "Grievance not found" });
    }
    
    return res.status(200).json(grievance);
  } catch (error) {
    console.error("Error fetching grievance:", error);
    return res.status(500).json({ message: "Failed to fetch grievance" });
  }
};

/**
 * Update a grievance and track changes in history
 */
export const updateGrievance = async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid grievance ID" });
  }
  
  try {
    // Validate update data
    const validationResult = grievanceUpdateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Invalid update data", 
        errors: validationResult.error.errors 
      });
    }
    
    const updateData = validationResult.data;
    
    // Get current grievance state
    const currentGrievance = await storage.getGrievance(id);
    if (!currentGrievance) {
      return res.status(404).json({ message: "Grievance not found" });
    }
    
    // Create history record for tracking changes
    const historyData: any = {
      grievanceId: id,
      changedByUserId: req.user!.id,
      changeDate: new Date(),
      comments: updateData.comments || "Grievance updated",
      oldStatusId: null,
      newStatusId: null,
      oldAssignedToUserId: null,
      newAssignedToUserId: null
    };
    
    // Track status change if applicable
    if (updateData.statusId && updateData.statusId !== currentGrievance.statusId) {
      historyData.oldStatusId = currentGrievance.statusId;
      historyData.newStatusId = updateData.statusId;
    }
    
    // Track assignee change if applicable
    if (updateData.assignedToUserId !== undefined && 
        updateData.assignedToUserId !== currentGrievance.assignedToUserId) {
      historyData.oldAssignedToUserId = currentGrievance.assignedToUserId;
      historyData.newAssignedToUserId = updateData.assignedToUserId;
    }
    
    // Update the grievance with lastUpdatedAt
    const updates = {
      ...updateData,
      lastUpdatedAt: new Date()
    };
    
    const updatedGrievance = await storage.updateGrievance(id, updates);
    
    // Create history record
    await storage.createGrievanceHistory(historyData);
    
    return res.status(200).json(updatedGrievance);
  } catch (error) {
    console.error("Error updating grievance:", error);
    return res.status(500).json({ message: "Failed to update grievance" });
  }
};

/**
 * Get history of changes for a grievance
 */
export const getGrievanceHistory = async (req: Request, res: Response) => {
  const grievanceId = parseInt(req.params.id);
  
  if (isNaN(grievanceId)) {
    return res.status(400).json({ message: "Invalid grievance ID" });
  }
  
  try {
    const history = await storage.listGrievanceHistory(grievanceId);
    return res.status(200).json(history);
  } catch (error) {
    console.error("Error fetching grievance history:", error);
    return res.status(500).json({ message: "Failed to fetch grievance history" });
  }
};