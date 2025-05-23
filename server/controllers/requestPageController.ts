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

// Helper to find organization admin user or fallback
async function findOrgAdmin(organizationId: number): Promise<number | null> {
  try {
    // First try to find an admin user in the organization
    const admin = await db.query.users.findFirst({
      where: and(
        eq(users.organizationId, organizationId),
        eq(users.role, "admin")
      )
    });
    
    if (admin) {
      console.log(`Found admin user for organization ${organizationId}: ${admin.id}`);
      return admin.id;
    }
    
    // If no admin, try to find any user in the organization
    const anyUser = await db.query.users.findFirst({
      where: eq(users.organizationId, organizationId)
    });
    
    if (anyUser) {
      console.log(`No admin found, using regular user for organization ${organizationId}: ${anyUser.id}`);
      return anyUser.id;
    }
    
    // As a last resort, find the superadmin (complyarkadmin)
    const superAdmin = await db.query.users.findFirst({
      where: eq(users.username, "complyarkadmin")
    });
    
    if (superAdmin) {
      console.log(`No users found for organization ${organizationId}, using superadmin: ${superAdmin.id}`);
      return superAdmin.id;
    }
    
    console.error(`No suitable user found for organization ${organizationId}`);
    return null;
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
    
    // Try to find an admin user to assign the request, but don't require it
    const adminId = await findOrgAdmin(validatedData.organizationId);
    
    // We'll allow unassigned requests, so don't fail if no admin found
    
    // Calculate completion date based on SLA
    const completionDate = await calculateCompletionDate(initialStatus.statusId);
    
    // Create the DPRequest with Drizzle type-safe insert
    const requestValues: any = {
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email,
      phone: validatedData.phone,
      requestType: validatedData.requestType as "Access" | "Correction" | "Nomination" | "Erasure",
      requestComment: validatedData.requestComment || "",
      organizationId: validatedData.organizationId,
      statusId: initialStatus.statusId
    };
    
    // Only assign if an admin was found - otherwise leave unassigned
    if (adminId) {
      requestValues.assignedToUserId = adminId;
    }
    
    // Only add completionDate if it's calculated
    if (completionDate) {
      requestValues.completionDate = completionDate;
    }
    
    const [dpRequest] = await db.insert(dpRequests)
      .values(requestValues)
      .returning();
    
    // Send email notification to the requester
    try {
      const { sendDPRSubmissionNotification } = await import('../utils/emailService');
      
      // Get status name for notification
      const status = await db.query.requestStatuses.findFirst({
        where: eq(requestStatuses.statusId, dpRequest.statusId)
      });
      
      // Get assigned user name if available
      let assignedUser = null;
      if (dpRequest.assignedToUserId) {
        assignedUser = await db.query.users.findFirst({
          where: eq(users.id, dpRequest.assignedToUserId)
        });
      }
      
      await sendDPRSubmissionNotification({
        requestId: dpRequest.requestId,
        requestType: dpRequest.requestType,
        requesterName: `${dpRequest.firstName} ${dpRequest.lastName}`,
        requesterEmail: dpRequest.email,
        organizationName: organization.businessName,
        statusName: status?.statusName || 'Submitted',
        assignedTo: assignedUser ? `${assignedUser.firstName} ${assignedUser.lastName}` : 'System Admin',
        dueDate: completionDate ? new Date(completionDate).toLocaleDateString() : 'TBD'
      });
      
      console.log(`✅ Email notification sent for DPR request #${dpRequest.requestId}`);
    } catch (emailError) {
      console.error('📧 Email notification failed:', emailError);
      // Don't fail the request creation if email fails
    }
    
    // Skip creating history for now - this ensures the request itself is created
    // even if we don't have a proper user ID for history records
    return res.status(201).json({
      message: "Data Protection Request created successfully",
      requestId: dpRequest.requestId,
      status: "New request created - assigned for processing"
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
    
    // Try to find an admin user to assign the grievance, but don't require it
    const adminId = await findOrgAdmin(validatedData.organizationId);
    
    // We'll allow unassigned grievances, so don't fail if no admin found
    
    // Calculate completion date based on SLA
    const completionDate = await calculateCompletionDate(initialStatus.statusId);
    
    // Create the Grievance
    const grievanceValues: any = {
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email,
      phone: validatedData.phone,
      grievanceComment: validatedData.grievanceComment || "",
      organizationId: validatedData.organizationId,
      statusId: initialStatus.statusId
    };
    
    // Only assign if an admin was found - otherwise leave unassigned
    if (adminId) {
      grievanceValues.assignedToUserId = adminId;
    }
    
    // Only add completionDate if it's calculated
    if (completionDate) {
      grievanceValues.completionDate = completionDate;
    }
    
    const [grievance] = await db.insert(grievances)
      .values(grievanceValues)
      .returning();
    
    // Send email notification to the requester
    try {
      const { sendGrievanceSubmissionNotification } = await import('../utils/emailService');
      
      // Get status name for notification
      const status = await db.query.requestStatuses.findFirst({
        where: eq(requestStatuses.statusId, grievance.statusId)
      });
      
      // Get assigned user name if available
      let assignedUser = null;
      if (grievance.assignedToUserId) {
        assignedUser = await db.query.users.findFirst({
          where: eq(users.id, grievance.assignedToUserId)
        });
      }
      
      await sendGrievanceSubmissionNotification({
        grievanceId: grievance.grievanceId,
        requesterName: `${grievance.firstName} ${grievance.lastName}`,
        requesterEmail: grievance.email,
        organizationName: organization.businessName,
        statusName: status?.statusName || 'Submitted',
        assignedTo: assignedUser ? `${assignedUser.firstName} ${assignedUser.lastName}` : 'System Admin',
        dueDate: completionDate ? new Date(completionDate).toLocaleDateString() : 'TBD'
      });
      
      console.log(`✅ Email notification sent for Grievance #${grievance.grievanceId}`);
    } catch (emailError) {
      console.error('📧 Email notification failed:', emailError);
      // Don't fail the grievance creation if email fails
    }
    
    // Skip creating history for grievances to ensure successful submission
    return res.status(201).json({
      message: "Grievance created successfully",
      grievanceId: grievance.grievanceId,
      status: "New grievance submitted - assigned for review"
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