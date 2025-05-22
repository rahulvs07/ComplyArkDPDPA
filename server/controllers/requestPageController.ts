import { Request, Response } from "express";
import { db } from "../db";
import { 
  dpRequests, 
  grievances, 
  requestStatuses, 
  organizations,
  users,
  dpRequestHistory,
  grievanceHistory,
  insertDPRequestSchema,
  insertGrievanceSchema
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { ZodError } from "zod";

// Helper to calculate completion date based on SLA days
async function calculateCompletionDate(statusId: number): Promise<Date | null> {
  try {
    const status = await db.query.requestStatuses.findFirst({
      where: eq(requestStatuses.statusId, statusId)
    });
    
    if (!status) return null;
    
    const currentDate = new Date();
    const completionDate = new Date();
    completionDate.setDate(currentDate.getDate() + status.slaDays);
    
    return completionDate;
  } catch (error) {
    console.error("Error calculating completion date:", error);
    return null;
  }
}

// Helper to find organization admin user
async function findOrgAdmin(organizationId: number): Promise<number | null> {
  try {
    const admin = await db.query.users.findFirst({
      where: and(
        eq(users.organizationId, organizationId),
        eq(users.role, "admin")
      )
    });
    
    return admin?.id || null;
  } catch (error) {
    console.error("Error finding organization admin:", error);
    return null;
  }
}

// Get organization by request page token
export async function getOrganizationByToken(req: Request, res: Response) {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }
    
    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.requestPageUrlToken, token)
    });
    
    if (!organization) {
      return res.status(404).json({ message: "Organization not found for this token" });
    }
    
    return res.status(200).json({
      id: organization.id,
      name: organization.businessName,
      token: organization.requestPageUrlToken
    });
  } catch (error) {
    console.error("Error getting organization by token:", error);
    return res.status(500).json({ message: "Server error getting organization" });
  }
}

// Create a new DPRequest
export async function createDPRequest(req: Request, res: Response) {
  try {
    // Parse and validate the request data
    const validatedData = insertDPRequestSchema.parse(req.body);
    
    // Check if the organization exists
    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.id, validatedData.organizationId)
    });
    
    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }
    
    // Get the initial status (typically "Submitted", statusId: 1)
    const initialStatus = await db.query.requestStatuses.findFirst({
      where: eq(requestStatuses.statusName, "Submitted")
    });
    
    if (!initialStatus) {
      return res.status(500).json({ message: "Initial status not found" });
    }
    
    // Find the organization admin to assign the request
    const adminId = await findOrgAdmin(validatedData.organizationId);
    
    if (!adminId) {
      return res.status(500).json({ message: "Organization admin not found" });
    }
    
    // Calculate completion date based on SLA
    const completionDate = await calculateCompletionDate(initialStatus.statusId);
    
    // Create the DPRequest with properly typed date
    const [dpRequest] = await db.insert(dpRequests).values({
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email,
      phone: validatedData.phone,
      requestType: validatedData.requestType,
      requestComment: validatedData.requestComment,
      organizationId: validatedData.organizationId,
      statusId: initialStatus.statusId,
      assignedToUserId: adminId,
      completionDate: completionDate ? completionDate.toISOString() : null,
      createdAt: new Date().toISOString(),
    }).returning();
    
    // Create initial history record
    await db.insert(dpRequestHistory).values({
      requestId: dpRequest.requestId,
      changedByUserId: adminId, // System action, but needs a user ID
      newStatusId: initialStatus.statusId,
      newAssignedToUserId: adminId,
      comments: "Request created by data principal"
    });
    
    return res.status(201).json({
      message: "Data Protection Request created successfully",
      requestId: dpRequest.requestId
    });
  } catch (error) {
    console.error("Error creating DP request:", error);
    
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    
    return res.status(500).json({ message: "Server error creating request" });
  }
}

// Create a new Grievance
export async function createGrievance(req: Request, res: Response) {
  try {
    // Parse and validate the request data
    const validatedData = insertGrievanceSchema.parse(req.body);
    
    // Check if the organization exists
    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.id, validatedData.organizationId)
    });
    
    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }
    
    // Get the initial status (typically "Submitted", statusId: 1)
    const initialStatus = await db.query.requestStatuses.findFirst({
      where: eq(requestStatuses.statusName, "Submitted")
    });
    
    if (!initialStatus) {
      return res.status(500).json({ message: "Initial status not found" });
    }
    
    // Find the organization admin to assign the grievance
    const adminId = await findOrgAdmin(validatedData.organizationId);
    
    if (!adminId) {
      return res.status(500).json({ message: "Organization admin not found" });
    }
    
    // Calculate completion date based on SLA
    const completionDate = await calculateCompletionDate(initialStatus.statusId);
    
    // Create the Grievance
    const [grievance] = await db.insert(grievances).values({
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email,
      phone: validatedData.phone,
      grievanceComment: validatedData.grievanceComment,
      organizationId: validatedData.organizationId,
      statusId: initialStatus.statusId,
      assignedToUserId: adminId,
      completionDate: completionDate ? completionDate.toISOString() : null,
      createdAt: new Date().toISOString(),
    }).returning();
    
    // Create initial history record
    await db.insert(grievanceHistory).values({
      grievanceId: grievance.grievanceId,
      changedByUserId: adminId, // System action, but needs a user ID
      newStatusId: initialStatus.statusId,
      newAssignedToUserId: adminId,
      comments: "Grievance created by complainant"
    });
    
    return res.status(201).json({
      message: "Grievance created successfully",
      grievanceId: grievance.grievanceId
    });
  } catch (error) {
    console.error("Error creating grievance:", error);
    
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    
    return res.status(500).json({ message: "Server error creating grievance" });
  }
}