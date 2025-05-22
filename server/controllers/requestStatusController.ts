import { Request, Response } from "express";
import { storage } from "../storage";
import { insertRequestStatusSchema } from "@shared/schema";
import { z } from "zod";

export const requestStatusController = {
  // Get all request statuses
  async getRequestStatuses(req: Request, res: Response) {
    try {
      const statuses = await storage.listRequestStatuses();
      return res.status(200).json(statuses);
    } catch (error) {
      console.error("Error fetching request statuses:", error);
      return res.status(500).json({ message: "Failed to fetch request statuses" });
    }
  },

  // Get a single request status
  async getRequestStatus(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid status ID" });
    }

    try {
      const status = await storage.getRequestStatus(id);
      if (!status) {
        return res.status(404).json({ message: "Request status not found" });
      }
      return res.status(200).json(status);
    } catch (error) {
      console.error(`Error fetching request status ${id}:`, error);
      return res.status(500).json({ message: "Failed to fetch request status" });
    }
  },

  // Create a new request status
  async createRequestStatus(req: Request, res: Response) {
    try {
      const data = insertRequestStatusSchema.parse(req.body);
      
      const newStatus = await storage.createRequestStatus({
        statusName: data.statusName,
        slaDays: data.slaDays,
        isActive: data.isActive ?? true
      });
      
      return res.status(201).json(newStatus);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      console.error("Error creating request status:", error);
      return res.status(500).json({ message: "Failed to create request status" });
    }
  },

  // Update an existing request status
  async updateRequestStatus(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid status ID" });
    }

    try {
      const statusExists = await storage.getRequestStatus(id);
      if (!statusExists) {
        return res.status(404).json({ message: "Request status not found" });
      }

      // Validate the update data
      const data = insertRequestStatusSchema.partial().parse(req.body);
      
      const updatedStatus = await storage.updateRequestStatus(id, data);
      if (!updatedStatus) {
        return res.status(404).json({ message: "Request status not found" });
      }
      
      return res.status(200).json(updatedStatus);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      console.error(`Error updating request status ${id}:`, error);
      return res.status(500).json({ message: "Failed to update request status" });
    }
  },

  // Delete a request status
  async deleteRequestStatus(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid status ID" });
    }

    try {
      const statusExists = await storage.getRequestStatus(id);
      if (!statusExists) {
        return res.status(404).json({ message: "Request status not found" });
      }

      const deleted = await storage.deleteRequestStatus(id);
      if (!deleted) {
        return res.status(404).json({ message: "Request status not found or could not be deleted" });
      }
      
      return res.status(200).json({ message: "Request status deleted successfully" });
    } catch (error) {
      console.error(`Error deleting request status ${id}:`, error);
      return res.status(500).json({ message: "Failed to delete request status" });
    }
  }
};