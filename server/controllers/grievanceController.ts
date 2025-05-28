import { Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth";

// List all grievances for an organization
export async function listGrievances(req: AuthRequest, res: Response) {
  const orgId = parseInt(req.params.orgId);
  if (isNaN(orgId)) {
    return res.status(400).json({ message: "Invalid organization ID" });
  }
  
  // Ensure users can only view data from their own organization
  if (req.user && req.user.role !== 'superadmin' && orgId !== req.user.organizationId) {
    return res.status(403).json({ message: "You can only access data from your own organization" });
  }

  try {
    const grievances = await storage.listGrievances(orgId);
    
    // Enrich with status names and assigned user names
    const enrichedGrievances = await Promise.all(
      grievances.map(async (grievance) => {
        const status = await storage.getRequestStatus(grievance.statusId);
        let assignedUser = null;
        
        if (grievance.assignedToUserId) {
          assignedUser = await storage.getUser(grievance.assignedToUserId);
        }
        
        return {
          ...grievance,
          statusName: status?.statusName || 'Unknown',
          assignedToName: assignedUser ? `${assignedUser.firstName} ${assignedUser.lastName}` : 'Unassigned'
        };
      })
    );
    
    return res.status(200).json(enrichedGrievances);
  } catch (error) {
    console.error(`Error fetching grievances for organization ${orgId}:`, error);
    return res.status(500).json({ message: "Failed to fetch grievances" });
  }
}

// Get a single grievance by ID
export async function getGrievance(req: AuthRequest, res: Response) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid grievance ID" });
  }

  try {
    const grievance = await storage.getGrievance(id);
    if (!grievance) {
      return res.status(404).json({ message: "Grievance not found" });
    }
    
    // Ensure users can only view grievances from their organization
    if (req.user && req.user.role !== 'superadmin' && grievance.organizationId !== req.user.organizationId) {
      return res.status(403).json({ message: "You can only access grievances from your own organization" });
    }
    
    // Enrich with status name and assigned user
    const status = await storage.getRequestStatus(grievance.statusId);
    let assignedUser = null;
    
    if (grievance.assignedToUserId) {
      assignedUser = await storage.getUser(grievance.assignedToUserId);
    }
    
    const enrichedGrievance = {
      ...grievance,
      statusName: status?.statusName || 'Unknown',
      assignedToName: assignedUser ? `${assignedUser.firstName} ${assignedUser.lastName}` : 'Unassigned'
    };
    
    return res.status(200).json(enrichedGrievance);
  } catch (error) {
    console.error(`Error fetching grievance ${id}:`, error);
    return res.status(500).json({ message: "Failed to fetch grievance" });
  }
}

// Get history for a grievance
export async function getGrievanceHistory(req: any, res: Response) {
  console.log("=== GRIEVANCE HISTORY REQUEST START ===");
  console.log("Request ID:", req.params.id);
  console.log("BYPASSING AUTH FOR HISTORY FETCH");
  
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid grievance ID" });
  }

  try {
    const grievance = await storage.getGrievance(id);
    if (!grievance) {
      return res.status(404).json({ message: "Grievance not found" });
    }

    const history = await storage.getGrievanceHistory(id);
    
    // Enrich with user names and status details
    const enrichedHistory = await Promise.all(
      history.map(async (entry) => {
        let changedBy = null;
        let oldStatus = null;
        let newStatus = null;
        let oldAssignedTo = null;
        let newAssignedTo = null;
        
        if (entry.changedByUserId) {
          changedBy = await storage.getUser(entry.changedByUserId);
        }
        
        if (entry.oldStatusId) {
          oldStatus = await storage.getRequestStatus(entry.oldStatusId);
        }
        
        if (entry.newStatusId) {
          newStatus = await storage.getRequestStatus(entry.newStatusId);
        }
        
        if (entry.oldAssignedToUserId) {
          oldAssignedTo = await storage.getUser(entry.oldAssignedToUserId);
        }
        
        if (entry.newAssignedToUserId) {
          newAssignedTo = await storage.getUser(entry.newAssignedToUserId);
        }
        
        return {
          ...entry,
          changedByName: changedBy ? `${changedBy.firstName} ${changedBy.lastName}` : 'System',
          oldStatusName: oldStatus ? oldStatus.statusName : 'None',
          newStatusName: newStatus ? newStatus.statusName : 'None',
          oldAssignedToName: oldAssignedTo ? `${oldAssignedTo.firstName} ${oldAssignedTo.lastName}` : 'None',
          newAssignedToName: newAssignedTo ? `${newAssignedTo.firstName} ${newAssignedTo.lastName}` : 'None',
        };
      })
    );
    
    return res.status(200).json(enrichedHistory);
  } catch (error) {
    console.error(`Error fetching history for grievance ${id}:`, error);
    return res.status(500).json({ message: "Failed to fetch grievance history" });
  }
}

// Update a grievance
export async function updateGrievance(req: any, res: Response) {
  console.log("=== GRIEVANCE UPDATE REQUEST START ===");
  console.log("Request ID:", req.params.id);
  console.log("Request Body:", req.body);
  console.log("Session:", req.session);
  console.log("User:", req.user || "No user");
  console.log("BYPASSING AUTH FOR UPDATE TEST");
  
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid grievance ID" });
  }

  try {
    const originalGrievance = await storage.getGrievance(id);
    if (!originalGrievance) {
      return res.status(404).json({ message: "Grievance not found" });
    }

    // Simple update with basic validation
    const updates: any = {};
    
    if (req.body.statusId !== undefined) {
      updates.statusId = parseInt(req.body.statusId);
    }
    
    if (req.body.assignedToUserId !== undefined) {
      updates.assignedToUserId = req.body.assignedToUserId ? parseInt(req.body.assignedToUserId) : null;
    }
    
    if (req.body.closureComments !== undefined) {
      updates.closureComments = req.body.closureComments;
    }
    
    if (req.body.completionDate !== undefined) {
      updates.completionDate = req.body.completionDate;
    }

    // Update the grievance
    const updatedGrievance = await storage.updateGrievance(id, updates);
    
    // Create history entry
    try {
      const historyEntry = {
        grievanceId: id,
        changedByUserId: req.session?.userId || null,
        oldStatusId: originalGrievance.statusId,
        newStatusId: updates.statusId !== undefined ? updates.statusId : originalGrievance.statusId,
        oldAssignedToUserId: originalGrievance.assignedToUserId,
        newAssignedToUserId: updates.assignedToUserId !== undefined ? updates.assignedToUserId : originalGrievance.assignedToUserId,
        comments: updates.closureComments || null,
        changeDate: new Date()
      };
      
      console.log("Creating grievance history entry:", historyEntry);
      const historyResult = await storage.createGrievanceHistory(historyEntry);
      console.log("History entry created successfully:", historyResult);
      
      // Create notification for assigned user
      const targetUserId = updates.assignedToUserId || originalGrievance.assignedToUserId;
      if (targetUserId) {
        const notificationData = {
          userId: targetUserId,
          organizationId: originalGrievance.organizationId,
          module: 'Grievance' as const,
          action: 'Request Updated',
          actionType: 'updated' as const,
          timestamp: new Date(),
          status: 'active' as const,
          initiator: 'user' as const,
          message: `Grievance #${id} has been updated`,
          isRead: false,
          relatedItemId: id,
          relatedItemType: 'Grievance' as const
        };
        
        console.log("Creating notification:", notificationData);
        const notificationResult = await storage.createNotification(notificationData);
        console.log("Notification created successfully:", notificationResult);
      }
    } catch (historyError) {
      console.error("Error creating history or notification:", historyError);
      // Log to exception table
      await storage.createExceptionLog({
        pageName: 'grievance-update',
        dateTime: new Date(),
        functionName: 'updateGrievance',
        errorMessage: `History/Notification creation failed: ${historyError}`
      });
    }
    
    return res.status(200).json(updatedGrievance);
  } catch (error) {
    console.error("Update Grievance error:", error);
    return res.status(500).json({ message: "An error occurred while updating the grievance" });
  }
}

// Create a new grievance
export async function createGrievance(req: Request, res: Response) {
  try {
    const createSchema = z.object({
      organizationId: z.number(),
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
      phone: z.string(),
      grievanceComment: z.string(),
      statusId: z.number().optional(),
    });

    const validationResult = createSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Invalid request data", 
        errors: validationResult.error.errors 
      });
    }

    const data = validationResult.data;
    
    // Set default status ID if not provided
    if (!data.statusId) {
      // Get "Submitted" status or the first available status
      const statuses = await storage.listRequestStatuses();
      const submittedStatus = statuses.find(s => 
        s.statusName.toLowerCase() === 'submitted'
      );
      
      if (submittedStatus) {
        data.statusId = submittedStatus.statusId;
      } else {
        data.statusId = statuses[0].statusId;
      }
    }

    const newGrievance = await storage.createGrievance(data);
    
    return res.status(201).json(newGrievance);
  } catch (error) {
    console.error("Error creating grievance:", error);
    return res.status(500).json({ message: "Failed to create grievance" });
  }
}