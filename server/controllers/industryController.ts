import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { storage } from '../storage';
import { insertIndustrySchema } from '@shared/schema';

// Get all industries
export const listIndustries = async (req: AuthRequest, res: Response) => {
  try {
    const industries = await storage.listIndustries();
    
    // Get organization count for each industry
    const industriesWithOrgCount = await Promise.all(
      industries.map(async (industry) => {
        const organizations = await storage.listOrganizations();
        const orgCount = organizations.filter(org => org.industryId === industry.industryId).length;
        
        return {
          ...industry,
          organizationCount: orgCount
        };
      })
    );
    
    return res.status(200).json(industriesWithOrgCount);
  } catch (error) {
    console.error("List industries error:", error);
    return res.status(500).json({ message: "An error occurred while fetching industries" });
  }
};

// Get one industry
export const getIndustry = async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid industry ID" });
  }
  
  try {
    const industry = await storage.getIndustry(id);
    
    if (!industry) {
      return res.status(404).json({ message: "Industry not found" });
    }
    
    // Get organization count
    const organizations = await storage.listOrganizations();
    const orgCount = organizations.filter(org => org.industryId === industry.industryId).length;
    
    return res.status(200).json({
      ...industry,
      organizationCount: orgCount
    });
  } catch (error) {
    console.error("Get industry error:", error);
    return res.status(500).json({ message: "An error occurred while fetching the industry" });
  }
};

// Create industry
export const createIndustry = async (req: AuthRequest, res: Response) => {
  try {
    // Validate request body
    const validatedData = insertIndustrySchema.parse(req.body);
    
    // Check if industry with same name already exists
    const industries = await storage.listIndustries();
    const existingIndustry = industries.find(
      industry => industry.industryName.toLowerCase() === validatedData.industryName.toLowerCase()
    );
    
    if (existingIndustry) {
      return res.status(400).json({ message: "Industry with this name already exists" });
    }
    
    // Create the industry
    const industry = await storage.createIndustry(validatedData);
    
    return res.status(201).json({
      ...industry,
      organizationCount: 0
    });
  } catch (error) {
    console.error("Create industry error:", error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: "Invalid industry data", errors: error.errors });
    }
    return res.status(500).json({ message: "An error occurred while creating the industry" });
  }
};

// Update industry
export const updateIndustry = async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid industry ID" });
  }
  
  try {
    // Check if industry exists
    const existingIndustry = await storage.getIndustry(id);
    
    if (!existingIndustry) {
      return res.status(404).json({ message: "Industry not found" });
    }
    
    // Validate request body
    const validatedData = insertIndustrySchema.parse(req.body);
    
    // Check if industry with same name already exists (excluding current one)
    const industries = await storage.listIndustries();
    const industryWithSameName = industries.find(
      industry => industry.industryName.toLowerCase() === validatedData.industryName.toLowerCase() && 
                  industry.industryId !== id
    );
    
    if (industryWithSameName) {
      return res.status(400).json({ message: "Industry with this name already exists" });
    }
    
    // Update the industry
    const updatedIndustry = await storage.updateIndustry(id, validatedData);
    
    if (!updatedIndustry) {
      return res.status(500).json({ message: "Failed to update industry" });
    }
    
    // Get organization count
    const organizations = await storage.listOrganizations();
    const orgCount = organizations.filter(org => org.industryId === updatedIndustry.industryId).length;
    
    return res.status(200).json({
      ...updatedIndustry,
      organizationCount: orgCount
    });
  } catch (error) {
    console.error("Update industry error:", error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: "Invalid industry data", errors: error.errors });
    }
    return res.status(500).json({ message: "An error occurred while updating the industry" });
  }
};

// Delete industry
export const deleteIndustry = async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid industry ID" });
  }
  
  try {
    // Check if industry exists
    const existingIndustry = await storage.getIndustry(id);
    
    if (!existingIndustry) {
      return res.status(404).json({ message: "Industry not found" });
    }
    
    // Check if any organization is using this industry
    const organizations = await storage.listOrganizations();
    const orgsUsingIndustry = organizations.filter(org => org.industryId === id);
    
    if (orgsUsingIndustry.length > 0) {
      return res.status(400).json({ 
        message: "Cannot delete industry that is in use by organizations", 
        organizationCount: orgsUsingIndustry.length 
      });
    }
    
    // Delete industry
    const deleted = await storage.deleteIndustry(id);
    
    if (!deleted) {
      return res.status(500).json({ message: "Failed to delete industry" });
    }
    
    return res.status(200).json({ message: "Industry deleted successfully" });
  } catch (error) {
    console.error("Delete industry error:", error);
    return res.status(500).json({ message: "An error occurred while deleting the industry" });
  }
};
