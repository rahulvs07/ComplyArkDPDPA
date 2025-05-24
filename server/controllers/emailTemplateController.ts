/**
 * Email Template Controller
 * Handles CRUD operations for email templates
 */
import { Request, Response } from 'express';
import { db } from '../db';
import { emailTemplates } from '../../shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Get all email templates
 */
export const getAllEmailTemplates = async (req: Request, res: Response) => {
  try {
    const templates = await db.select().from(emailTemplates);
    return res.json(templates);
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return res.status(500).json({ message: 'Failed to fetch email templates' });
  }
};

/**
 * Get a specific email template by ID
 */
export const getEmailTemplateById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const templateId = parseInt(id);
    
    if (isNaN(templateId)) {
      return res.status(400).json({ message: 'Invalid template ID' });
    }
    
    const template = await db.select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, templateId))
      .limit(1);
    
    if (template.length === 0) {
      return res.status(404).json({ message: 'Email template not found' });
    }
    
    return res.json(template[0]);
  } catch (error) {
    console.error('Error fetching email template:', error);
    return res.status(500).json({ message: 'Failed to fetch email template' });
  }
};

/**
 * Create a new email template
 */
export const createEmailTemplate = async (req: Request, res: Response) => {
  try {
    const { name, subject, body } = req.body;
    
    if (!name || !subject || !body) {
      return res.status(400).json({ message: 'Name, subject, and body are required' });
    }
    
    // Check if a template with the same name already exists
    const existingTemplate = await db.select()
      .from(emailTemplates)
      .where(eq(emailTemplates.name, name))
      .limit(1);
    
    if (existingTemplate.length > 0) {
      return res.status(409).json({ message: 'A template with this name already exists' });
    }
    
    const newTemplate = await db.insert(emailTemplates)
      .values({ name, subject, body })
      .returning();
    
    return res.status(201).json(newTemplate[0]);
  } catch (error) {
    console.error('Error creating email template:', error);
    return res.status(500).json({ message: 'Failed to create email template' });
  }
};

/**
 * Update an existing email template
 */
export const updateEmailTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const templateId = parseInt(id);
    const { name, subject, body } = req.body;
    
    if (isNaN(templateId)) {
      return res.status(400).json({ message: 'Invalid template ID' });
    }
    
    if (!name || !subject || !body) {
      return res.status(400).json({ message: 'Name, subject, and body are required' });
    }
    
    // Check if template exists
    const existingTemplate = await db.select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, templateId))
      .limit(1);
    
    if (existingTemplate.length === 0) {
      return res.status(404).json({ message: 'Email template not found' });
    }
    
    // Check if name conflicts with another template
    const nameConflict = await db.select()
      .from(emailTemplates)
      .where(eq(emailTemplates.name, name))
      .limit(1);
    
    if (nameConflict.length > 0 && nameConflict[0].id !== templateId) {
      return res.status(409).json({ message: 'Another template with this name already exists' });
    }
    
    const updatedTemplate = await db.update(emailTemplates)
      .set({ name, subject, body, updatedAt: new Date() })
      .where(eq(emailTemplates.id, templateId))
      .returning();
    
    return res.json(updatedTemplate[0]);
  } catch (error) {
    console.error('Error updating email template:', error);
    return res.status(500).json({ message: 'Failed to update email template' });
  }
};

/**
 * Delete an email template
 */
export const deleteEmailTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const templateId = parseInt(id);
    
    if (isNaN(templateId)) {
      return res.status(400).json({ message: 'Invalid template ID' });
    }
    
    // Check if template exists
    const existingTemplate = await db.select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, templateId))
      .limit(1);
    
    if (existingTemplate.length === 0) {
      return res.status(404).json({ message: 'Email template not found' });
    }
    
    await db.delete(emailTemplates)
      .where(eq(emailTemplates.id, templateId));
    
    return res.json({ message: 'Email template deleted successfully' });
  } catch (error) {
    console.error('Error deleting email template:', error);
    return res.status(500).json({ message: 'Failed to delete email template' });
  }
};