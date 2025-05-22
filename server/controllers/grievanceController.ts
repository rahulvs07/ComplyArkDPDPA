import { Request, Response } from 'express';
import { storage } from '../storage';
import { db } from '../db';
import { insertGrievanceSchema, grievanceHistory } from '@shared/schema';
import { AuthRequest } from '../middleware/auth';

// Get all grievances for an organization
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
    console.error("Get grievances error:", error);
    return res.status(500).json({ message: "An error occurred while fetching grievances" });
  }
};

// Get a specific grievance by ID
export const getGrievance = async (req: Request, res: Response) => {
  const grievanceId = parseInt(req.params.id);
  
  if (isNaN(grievanceId)) {
    return res.status(400).json({ message: "Invalid grievance ID" });
  }
  
  try {
    const grievance = await storage.getGrievance(grievanceId);
    
    if (!grievance) {
      return res.status(404).json({ message: "Grievance not found" });
    }
    
    return res.status(200).json(grievance);
  } catch (error) {
    console.error("Get grievance error:", error);
    return res.status(500).json({ message: "An error occurred while fetching the grievance" });
  }
};

// Update a grievance
export const updateGrievance = async (req: AuthRequest, res: Response) => {
  const grievanceId = parseInt(req.params.id);
  
  if (isNaN(grievanceId)) {
    return res.status(400).json({ message: "Invalid grievance ID" });
  }
  
  try {
    const existingGrievance = await storage.getGrievance(grievanceId);
    
    if (!existingGrievance) {
      return res.status(404).json({ message: "Grievance not found" });
    }
    
    // Update grievance with new data
    const updatedGrievance = await storage.updateGrievance(grievanceId, req.body);
    
    // Add history entry if status or assignment changed
    if (
      (req.body.statusId && req.body.statusId !== existingGrievance.statusId) ||
      (req.body.assignedToUserId && req.body.assignedToUserId !== existingGrievance.assignedToUserId)
    ) {
      await db.insert(grievanceHistory).values({
        grievanceId: grievanceId,
        changedByUserId: req.user!.id,
        oldStatusId: existingGrievance.statusId,
        newStatusId: req.body.statusId || existingGrievance.statusId,
        oldAssignedToUserId: existingGrievance.assignedToUserId,
        newAssignedToUserId: req.body.assignedToUserId || existingGrievance.assignedToUserId,
        comments: req.body.comments || "Updated grievance"
      });
    }
    
    return res.status(200).json(updatedGrievance);
  } catch (error) {
    console.error("Update grievance error:", error);
    return res.status(500).json({ message: "An error occurred while updating the grievance" });
  }
};

// Get grievance history
export const getGrievanceHistory = async (req: Request, res: Response) => {
  const grievanceId = parseInt(req.params.id);
  
  if (isNaN(grievanceId)) {
    return res.status(400).json({ message: "Invalid grievance ID" });
  }
  
  try {
    const history = await storage.listGrievanceHistory(grievanceId);
    return res.status(200).json(history);
  } catch (error) {
    console.error("Get grievance history error:", error);
    return res.status(500).json({ message: "An error occurred while fetching grievance history" });
  }
};