import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { storage } from '../storage';
import { insertOrganizationSchema } from '@shared/schema';
import crypto from 'crypto';

// Get all organizations
export const listOrganizations = async (req: AuthRequest, res: Response) => {
  try {
    const organizations = await storage.listOrganizations();
    
    // Get industry names for each organization
    const orgsWithIndustry = await Promise.all(
      organizations.map(async (org) => {
        const industry = await storage.getIndustry(org.industryId);
        return {
          ...org,
          industryName: industry?.industryName || 'Unknown Industry'
        };
      })
    );
    
    return res.status(200).json(orgsWithIndustry);
  } catch (error) {
    console.error("List organizations error:", error);
    return res.status(500).json({ message: "An error occurred while fetching organizations" });
  }
};

// Get one organization
export const getOrganization = async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid organization ID" });
  }
  
  try {
    const organization = await storage.getOrganization(id);
    
    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }
    
    const industry = await storage.getIndustry(organization.industryId);
    
    return res.status(200).json({
      ...organization,
      industryName: industry?.industryName || 'Unknown Industry'
    });
  } catch (error) {
    console.error("Get organization error:", error);
    return res.status(500).json({ message: "An error occurred while fetching the organization" });
  }
};

// Create organization
export const createOrganization = async (req: AuthRequest, res: Response) => {
  try {
    // Validate request body
    const validatedData = insertOrganizationSchema.parse(req.body);
    
    // Generate a unique token for external requests
    const token = crypto.randomBytes(16).toString('hex');
    
    // Create the organization
    const organization = await storage.createOrganization({
      ...validatedData,
      requestPageUrlToken: token
    });
    
    // Create a default admin user for this organization
    const defaultPassword = `admin${organization.id}`;
    await storage.createUser({
      username: `admin${organization.id}`,
      password: defaultPassword, // In a real app, this would be hashed
      firstName: "Admin",
      lastName: "User",
      email: validatedData.contactEmail,
      phone: validatedData.contactPhone,
      role: "admin",
      organizationId: organization.id,
      isActive: true,
      canEdit: true,
      canDelete: true
    });
    
    // Get industry name
    const industry = await storage.getIndustry(organization.industryId);
    
    return res.status(201).json({
      ...organization,
      industryName: industry?.industryName || 'Unknown Industry'
    });
  } catch (error) {
    console.error("Create organization error:", error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: "Invalid organization data", errors: error.errors });
    }
    return res.status(500).json({ message: "An error occurred while creating the organization" });
  }
};

// Update organization
export const updateOrganization = async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid organization ID" });
  }
  
  try {
    // Check if organization exists
    const existingOrg = await storage.getOrganization(id);
    
    if (!existingOrg) {
      return res.status(404).json({ message: "Organization not found" });
    }
    
    // Validate request body - partial validation for updates
    const validatedData = insertOrganizationSchema.partial().parse(req.body);
    
    // Update the organization
    const updatedOrg = await storage.updateOrganization(id, validatedData);
    
    // Get industry name
    const industry = await storage.getIndustry(updatedOrg.industryId);
    
    return res.status(200).json({
      ...updatedOrg,
      industryName: industry?.industryName || 'Unknown Industry'
    });
  } catch (error) {
    console.error("Update organization error:", error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: "Invalid organization data", errors: error.errors });
    }
    return res.status(500).json({ message: "An error occurred while updating the organization" });
  }
};

// Delete organization
export const deleteOrganization = async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid organization ID" });
  }
  
  try {
    // Check if organization exists
    const existingOrg = await storage.getOrganization(id);
    
    if (!existingOrg) {
      return res.status(404).json({ message: "Organization not found" });
    }
    
    // Delete organization
    const deleted = await storage.deleteOrganization(id);
    
    if (!deleted) {
      return res.status(500).json({ message: "Failed to delete organization" });
    }
    
    // Delete all users associated with this organization
    const users = await storage.listUsers(id);
    
    for (const user of users) {
      await storage.deleteUser(user.id);
    }
    
    return res.status(200).json({ message: "Organization deleted successfully" });
  } catch (error) {
    console.error("Delete organization error:", error);
    return res.status(500).json({ message: "An error occurred while deleting the organization" });
  }
};

// Get users for an organization
export const getOrganizationUsers = async (req: AuthRequest, res: Response) => {
  const orgId = parseInt(req.params.orgId);
  
  if (isNaN(orgId)) {
    return res.status(400).json({ message: "Invalid organization ID" });
  }
  
  try {
    // Check if organization exists
    const organization = await storage.getOrganization(orgId);
    
    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }
    
    // Get all users for this organization
    const users = await storage.listUsers(orgId);
    
    // Remove passwords from response
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return {
        ...userWithoutPassword,
        organizationName: organization.businessName
      };
    });
    
    return res.status(200).json(usersWithoutPasswords);
  } catch (error) {
    console.error("Get organization users error:", error);
    return res.status(500).json({ message: "An error occurred while fetching organization users" });
  }
};
