import { Request, Response } from 'express';
import { storage } from '../storage';
import { db } from '../db';
import { insertDPRequestSchema, insertGrievanceSchema, dpRequestHistory, grievanceHistory } from '@shared/schema';
import { AuthRequest } from '../middleware/auth';
import crypto from 'crypto';

// Generate URL token for organization
export const generateRequestPageUrl = async (req: AuthRequest, res: Response) => {
  const orgId = parseInt(req.params.id);
  
  if (isNaN(orgId)) {
    return res.status(400).json({ message: "Invalid organization ID" });
  }
  
  try {
    // Check if organization exists
    const organization = await storage.getOrganization(orgId);
    
    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }
    
    // Generate token
    const token = crypto.randomBytes(16).toString('hex');
    
    // Update organization with token
    const updatedOrg = await storage.updateOrganization(orgId, {
      requestPageUrlToken: token
    });
    
    if (!updatedOrg) {
      return res.status(500).json({ message: "Failed to update organization" });
    }
    
    // Create full URL (this would be updated based on your actual domain)
    const fullUrl = `${req.protocol}://${req.get('host')}/request-page/${token}`;
    
    return res.status(200).json({ 
      token,
      url: fullUrl
    });
    
  } catch (error) {
    console.error("Generate request page URL error:", error);
    return res.status(500).json({ message: "An error occurred while generating request page URL" });
  }
};

// Create DP request from external page
export const createDPRequest = async (req: Request, res: Response) => {
  const token = req.params.token;
  
  if (!token) {
    return res.status(400).json({ message: "Invalid request page token" });
  }
  
  try {
    // Find organization by token
    const organization = await storage.getOrganizationByToken(token);
    
    if (!organization) {
      return res.status(404).json({ message: "Invalid request page. Organization not found." });
    }
    
    // Validate request body
    const validatedData = insertDPRequestSchema.parse({
      ...req.body,
      organizationId: organization.id,
      // Find default admin user for the organization to assign the request
      assignedToUserId: req.body.assignedToUserId || 
        (await storage.getOrgAdmin(organization.id))?.id,
      // Set default status to "Submitted" (statusId 1)
      statusId: 1
    });
    
    // Create DP request
    const dpRequest = await storage.createDPRequest(validatedData);
    
    // Add history entry
    await db.insert(dpRequestHistory).values({
      requestId: dpRequest.requestId,
      changedByUserId: dpRequest.assignedToUserId || 0,
      oldStatusId: null,
      newStatusId: dpRequest.statusId,
      oldAssignedToUserId: null,
      newAssignedToUserId: dpRequest.assignedToUserId,
      comments: 'Request created through external request page'
    });
    
    return res.status(201).json({
      message: "Data Principal Request created successfully",
      requestId: dpRequest.requestId
    });
    
  } catch (error) {
    console.error("Create DP request error:", error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: "Invalid request data", errors: error.errors });
    }
    return res.status(500).json({ message: "An error occurred while creating the request" });
  }
};

// Create Grievance from external page
export const createGrievance = async (req: Request, res: Response) => {
  const token = req.params.token;
  
  if (!token) {
    return res.status(400).json({ message: "Invalid request page token" });
  }
  
  try {
    // Find organization by token
    const organization = await storage.getOrganizationByToken(token);
    
    if (!organization) {
      return res.status(404).json({ message: "Invalid request page. Organization not found." });
    }
    
    // Validate request body
    const validatedData = insertGrievanceSchema.parse({
      ...req.body,
      organizationId: organization.id,
      // Find default admin user for the organization to assign the grievance
      assignedToUserId: req.body.assignedToUserId || 
        (await storage.getOrgAdmin(organization.id))?.id,
      // Set default status to "Submitted" (statusId 1)
      statusId: 1
    });
    
    // Create grievance
    const grievance = await storage.createGrievance(validatedData);
    
    // Add history entry
    await db.insert(grievanceHistory).values({
      grievanceId: grievance.grievanceId,
      changedByUserId: grievance.assignedToUserId || 0,
      oldStatusId: null,
      newStatusId: grievance.statusId,
      oldAssignedToUserId: null,
      newAssignedToUserId: grievance.assignedToUserId,
      comments: 'Grievance created through external request page'
    });
    
    return res.status(201).json({
      message: "Grievance logged successfully",
      grievanceId: grievance.grievanceId
    });
    
  } catch (error) {
    console.error("Create grievance error:", error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: "Invalid grievance data", errors: error.errors });
    }
    return res.status(500).json({ message: "An error occurred while creating the grievance" });
  }
};

// Get request page data
export const getRequestPageData = async (req: Request, res: Response) => {
  const token = req.params.token;
  
  if (!token) {
    return res.status(400).json({ message: "Invalid request page token" });
  }
  
  try {
    // Find organization by token
    const organization = await storage.getOrganizationByToken(token);
    
    if (!organization) {
      return res.status(404).json({ message: "Invalid request page. Organization not found." });
    }
    
    // Return organization details for the request page
    return res.status(200).json({
      organizationId: organization.id,
      businessName: organization.businessName,
      // Only send necessary info to the client
    });
    
  } catch (error) {
    console.error("Get request page data error:", error);
    return res.status(500).json({ message: "An error occurred while fetching request page data" });
  }
};