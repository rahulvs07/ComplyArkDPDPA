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
export async function getGrievanceHistory(req: AuthRequest, res: Response) {
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
export async function updateGrievance(req: Request, res: Response) {
  console.log("=== GRIEVANCE CONTROLLER UPDATE START ===");
  console.log("Request params:", req.params);
  console.log("Request body:", req.body);
  
  const id = parseInt(req.params.id);
  console.log("Parsed ID:", id);
  
  if (isNaN(id)) {
    console.log("Invalid ID, returning 400");
    return res.status(400).json({ message: "Invalid grievance ID" });
  }

  try {
    const grievance = await storage.getGrievance(id);
    if (!grievance) {
      return res.status(404).json({ message: "Grievance not found" });
    }

    // Parse the incoming data - ensure statusId is converted to number
    let parsedData = {
      ...req.body
    };
    
    // Convert string statusId to number
    if (typeof parsedData.statusId === 'string') {
      parsedData.statusId = parseInt(parsedData.statusId);
    }
    
    // Convert string assignedToUserId to number or null
    if (parsedData.assignedToUserId === '') {
      parsedData.assignedToUserId = null;
    } else if (typeof parsedData.assignedToUserId === 'string') {
      parsedData.assignedToUserId = parseInt(parsedData.assignedToUserId);
    }

    // Validate the update data - less strict to handle more data formats
    const updateSchema = z.object({
      statusId: z.number().or(z.string().transform(val => parseInt(val))),
      assignedToUserId: z.number().nullable().optional().or(z.string().transform(val => val ? parseInt(val) : null)),
      comments: z.string().optional().nullable(),
      completionDate: z.string().optional().nullable(),
      closureComments: z.string().nullable().optional(),
    });

    const validationResult = updateSchema.safeParse(parsedData);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Invalid request data", 
        errors: validationResult.error.errors 
      });
    }

    console.log("About to update grievance with validated data:", validationResult.data);
    
    // Update the grievance
    const updatedGrievance = await storage.updateGrievance(
      id,
      validationResult.data
    );

    console.log("Grievance updated successfully:", updatedGrievance);
    console.log("Checking history creation conditions:", {
      statusIdDefined: validationResult.data.statusId !== undefined,
      assignedToUserIdDefined: validationResult.data.assignedToUserId !== undefined,
      statusId: validationResult.data.statusId,
      assignedToUserId: validationResult.data.assignedToUserId
    });

    // Create history entry for any status or assignment changes
    if (validationResult.data.statusId !== undefined || validationResult.data.assignedToUserId !== undefined) {
      try {
        const historyData = {
          grievanceId: id,
          changedByUserId: (req as any).user?.id || 1, // Fallback to user ID 1 if no user
          oldStatusId: grievance.statusId,
          newStatusId: validationResult.data.statusId !== undefined ? validationResult.data.statusId : grievance.statusId,
          oldAssignedToUserId: grievance.assignedToUserId,
          newAssignedToUserId: validationResult.data.assignedToUserId !== undefined ? validationResult.data.assignedToUserId : grievance.assignedToUserId,
          comments: validationResult.data.comments || null,
          changeDate: new Date()
        };
        
        console.log("Creating grievance history:", historyData);
        const historyResult = await storage.createGrievanceHistory(historyData);
        console.log("History created successfully:", historyResult);
      } catch (historyError) {
        console.error("Error creating grievance history:", historyError);
        // Don't fail the update if history creation fails
      }
    }

    return res.status(200).json(updatedGrievance);
  } catch (error) {
    console.error(`Error updating grievance ${id}:`, error);
    return res.status(500).json({ message: "Failed to update grievance" });
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