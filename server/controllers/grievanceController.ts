import { Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";

export const grievanceController = {
  // List all grievances for an organization
  async listGrievances(req: Request, res: Response) {
    const orgId = parseInt(req.params.orgId);
    if (isNaN(orgId)) {
      return res.status(400).json({ message: "Invalid organization ID" });
    }

    try {
      const grievances = await storage.listGrievances(orgId);
      return res.status(200).json(grievances);
    } catch (error) {
      console.error(`Error fetching grievances for organization ${orgId}:`, error);
      return res.status(500).json({ message: "Failed to fetch grievances" });
    }
  },

  // Get a single grievance by ID
  async getGrievance(req: Request, res: Response) {
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
      console.error(`Error fetching grievance ${id}:`, error);
      return res.status(500).json({ message: "Failed to fetch grievance" });
    }
  },

  // Get history for a grievance
  async getGrievanceHistory(req: Request, res: Response) {
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
      return res.status(200).json(history);
    } catch (error) {
      console.error(`Error fetching history for grievance ${id}:`, error);
      return res.status(500).json({ message: "Failed to fetch grievance history" });
    }
  },

  // Update a grievance
  async updateGrievance(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid grievance ID" });
    }

    try {
      const grievance = await storage.getGrievance(id);
      if (!grievance) {
        return res.status(404).json({ message: "Grievance not found" });
      }

      // Validate the update data
      const updateSchema = z.object({
        statusId: z.number().optional(),
        assignedToUserId: z.number().nullable().optional(),
        comments: z.string().optional(),
        closureComments: z.string().nullable().optional(),
      });

      const validationResult = updateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: validationResult.error.errors 
        });
      }

      // Update the grievance
      const updatedGrievance = await storage.updateGrievance(
        id,
        validationResult.data
      );

      return res.status(200).json(updatedGrievance);
    } catch (error) {
      console.error(`Error updating grievance ${id}:`, error);
      return res.status(500).json({ message: "Failed to update grievance" });
    }
  },

  // Create a new grievance
  async createGrievance(req: Request, res: Response) {
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
          
          // Calculate completion date based on SLA days
          if (submittedStatus.slaDays > 0) {
            const completionDate = new Date();
            completionDate.setDate(completionDate.getDate() + submittedStatus.slaDays);
            data.completionDate = completionDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
          }
        } else {
          data.statusId = statuses[0].statusId;
        }
      } else {
        // If status ID is provided, get SLA days for that status
        const statuses = await storage.listRequestStatuses();
        const selectedStatus = statuses.find(s => s.statusId === data.statusId);
        
        // Calculate completion date based on SLA days
        if (selectedStatus && selectedStatus.slaDays > 0) {
          const completionDate = new Date();
          completionDate.setDate(completionDate.getDate() + selectedStatus.slaDays);
          data.completionDate = completionDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        }
      }

      const newGrievance = await storage.createGrievance(data);
      
      return res.status(201).json(newGrievance);
    } catch (error) {
      console.error("Error creating grievance:", error);
      return res.status(500).json({ message: "Failed to create grievance" });
    }
  }
};