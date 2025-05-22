import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { storage } from '../storage';
import { insertTemplateSchema } from '@shared/schema';
import path from 'path';
import fs from 'fs';

// Directory for template files
const TEMPLATE_DIR = path.join(process.cwd(), 'TemplateRepo');

// Ensure template directory exists
if (!fs.existsSync(TEMPLATE_DIR)) {
  fs.mkdirSync(TEMPLATE_DIR, { recursive: true });
}

// Get all templates
export const listTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const templates = await storage.listTemplates();
    
    // Get industry names for each template
    const templatesWithIndustry = await Promise.all(
      templates.map(async (template) => {
        const industry = await storage.getIndustry(template.industryId);
        return {
          ...template,
          industryName: industry?.industryName || 'Unknown Industry',
          hasFile: !!template.templatePath
        };
      })
    );
    
    return res.status(200).json(templatesWithIndustry);
  } catch (error) {
    console.error("List templates error:", error);
    return res.status(500).json({ message: "An error occurred while fetching templates" });
  }
};

// Get templates by industry
export const getTemplatesByIndustry = async (req: AuthRequest, res: Response) => {
  const industryId = parseInt(req.params.industryId);
  
  if (isNaN(industryId)) {
    return res.status(400).json({ message: "Invalid industry ID" });
  }
  
  try {
    // Check if industry exists
    const industry = await storage.getIndustry(industryId);
    
    if (!industry) {
      return res.status(404).json({ message: "Industry not found" });
    }
    
    const templates = await storage.listTemplates(industryId);
    
    return res.status(200).json(templates.map(template => ({
      ...template,
      industryName: industry.industryName,
      hasFile: !!template.templatePath
    })));
  } catch (error) {
    console.error("Get templates by industry error:", error);
    return res.status(500).json({ message: "An error occurred while fetching templates" });
  }
};

// Get one template
export const getTemplate = async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid template ID" });
  }
  
  try {
    const template = await storage.getTemplate(id);
    
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }
    
    const industry = await storage.getIndustry(template.industryId);
    
    return res.status(200).json({
      ...template,
      industryName: industry?.industryName || 'Unknown Industry',
      hasFile: !!template.templatePath
    });
  } catch (error) {
    console.error("Get template error:", error);
    return res.status(500).json({ message: "An error occurred while fetching the template" });
  }
};

// Create template
export const createTemplate = async (req: AuthRequest, res: Response) => {
  try {
    // Validate request body
    const validatedData = insertTemplateSchema.parse(req.body);
    
    let templatePath = null;
    
    // Handle file upload if provided
    if (req.file) {
      const fileName = `${Date.now()}_${req.file.originalname}`;
      templatePath = path.join(TEMPLATE_DIR, fileName);
      
      // Save file
      fs.writeFileSync(templatePath, req.file.buffer);
    }
    
    // Create the template
    const template = await storage.createTemplate({
      ...validatedData,
      templatePath: templatePath ? templatePath : null
    });
    
    const industry = await storage.getIndustry(template.industryId);
    
    return res.status(201).json({
      ...template,
      industryName: industry?.industryName || 'Unknown Industry',
      hasFile: !!template.templatePath
    });
  } catch (error) {
    console.error("Create template error:", error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: "Invalid template data", errors: error.errors });
    }
    return res.status(500).json({ message: "An error occurred while creating the template" });
  }
};

// Update template
export const updateTemplate = async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid template ID" });
  }
  
  try {
    // Check if template exists
    const existingTemplate = await storage.getTemplate(id);
    
    if (!existingTemplate) {
      return res.status(404).json({ message: "Template not found" });
    }
    
    // Validate request body - partial validation for updates
    const validatedData = insertTemplateSchema.partial().parse(req.body);
    
    let templatePath = existingTemplate.templatePath;
    
    // Handle file upload if provided
    if (req.file) {
      // Delete old file if exists
      if (existingTemplate.templatePath && fs.existsSync(existingTemplate.templatePath)) {
        fs.unlinkSync(existingTemplate.templatePath);
      }
      
      const fileName = `${Date.now()}_${req.file.originalname}`;
      templatePath = path.join(TEMPLATE_DIR, fileName);
      
      // Save new file
      fs.writeFileSync(templatePath, req.file.buffer);
    }
    
    // Update the template
    const updatedTemplate = await storage.updateTemplate(id, {
      ...validatedData,
      templatePath
    });
    
    if (!updatedTemplate) {
      return res.status(500).json({ message: "Failed to update template" });
    }
    
    const industry = await storage.getIndustry(updatedTemplate.industryId);
    
    return res.status(200).json({
      ...updatedTemplate,
      industryName: industry?.industryName || 'Unknown Industry',
      hasFile: !!updatedTemplate.templatePath
    });
  } catch (error) {
    console.error("Update template error:", error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: "Invalid template data", errors: error.errors });
    }
    return res.status(500).json({ message: "An error occurred while updating the template" });
  }
};

// Delete template
export const deleteTemplate = async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid template ID" });
  }
  
  try {
    // Check if template exists
    const existingTemplate = await storage.getTemplate(id);
    
    if (!existingTemplate) {
      return res.status(404).json({ message: "Template not found" });
    }
    
    // Delete file if exists
    if (existingTemplate.templatePath && fs.existsSync(existingTemplate.templatePath)) {
      fs.unlinkSync(existingTemplate.templatePath);
    }
    
    // Delete template
    const deleted = await storage.deleteTemplate(id);
    
    if (!deleted) {
      return res.status(500).json({ message: "Failed to delete template" });
    }
    
    return res.status(200).json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("Delete template error:", error);
    return res.status(500).json({ message: "An error occurred while deleting the template" });
  }
};

// Download template file
export const downloadTemplate = async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid template ID" });
  }
  
  try {
    const template = await storage.getTemplate(id);
    
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }
    
    if (!template.templatePath || !fs.existsSync(template.templatePath)) {
      return res.status(404).json({ message: "Template file not found" });
    }
    
    const fileContent = fs.readFileSync(template.templatePath);
    const fileName = path.basename(template.templatePath);
    
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    return res.send(fileContent);
  } catch (error) {
    console.error("Download template error:", error);
    return res.status(500).json({ message: "An error occurred while downloading the template" });
  }
};
