import { Request, Response } from 'express';
import { db } from '../db';
import { emailTemplates } from '../../shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Get all email templates
 */
export async function getAllEmailTemplates(req: Request, res: Response) {
  try {
    const templates = await db.select().from(emailTemplates);
    return res.status(200).json(templates);
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch email templates', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

/**
 * Get a specific email template by ID
 */
export async function getEmailTemplateById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid template ID' });
    }

    const template = await db.select().from(emailTemplates).where(eq(emailTemplates.id, parseInt(id))).limit(1);
    
    if (!template || template.length === 0) {
      return res.status(404).json({ message: 'Email template not found' });
    }

    return res.status(200).json(template[0]);
  } catch (error) {
    console.error('Error fetching email template:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch email template', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

/**
 * Create a new email template
 */
export async function createEmailTemplate(req: Request, res: Response) {
  try {
    const { name, subject, body } = req.body;
    
    // Validate required fields
    if (!name || !subject || !body) {
      return res.status(400).json({ message: 'Name, subject, and body are required' });
    }

    // Check if template with same name already exists
    const existingTemplate = await db.select().from(emailTemplates).where(eq(emailTemplates.name, name)).limit(1);
    
    if (existingTemplate && existingTemplate.length > 0) {
      return res.status(400).json({ message: 'A template with this name already exists' });
    }

    // Insert new template
    const result = await db.insert(emailTemplates).values({
      name,
      subject,
      body,
    }).returning();

    return res.status(201).json(result[0]);
  } catch (error) {
    console.error('Error creating email template:', error);
    return res.status(500).json({ 
      message: 'Failed to create email template', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

/**
 * Update an existing email template
 */
export async function updateEmailTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, subject, body } = req.body;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid template ID' });
    }

    // Validate required fields
    if (!name || !subject || !body) {
      return res.status(400).json({ message: 'Name, subject, and body are required' });
    }

    // Check if template exists
    const templateId = parseInt(id);
    const existingTemplate = await db.select().from(emailTemplates).where(eq(emailTemplates.id, templateId)).limit(1);
    
    if (!existingTemplate || existingTemplate.length === 0) {
      return res.status(404).json({ message: 'Email template not found' });
    }

    // Check if new name conflicts with another template
    if (name !== existingTemplate[0].name) {
      const nameConflict = await db.select()
        .from(emailTemplates)
        .where(eq(emailTemplates.name, name))
        .limit(1);
      
      if (nameConflict && nameConflict.length > 0) {
        return res.status(400).json({ message: 'A template with this name already exists' });
      }
    }

    // Update template
    const result = await db.update(emailTemplates)
      .set({
        name,
        subject,
        body,
        updatedAt: new Date(),
      })
      .where(eq(emailTemplates.id, templateId))
      .returning();

    return res.status(200).json(result[0]);
  } catch (error) {
    console.error('Error updating email template:', error);
    return res.status(500).json({ 
      message: 'Failed to update email template', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

/**
 * Delete an email template
 */
export async function deleteEmailTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid template ID' });
    }

    const templateId = parseInt(id);
    
    // Check if template exists
    const existingTemplate = await db.select().from(emailTemplates).where(eq(emailTemplates.id, templateId)).limit(1);
    
    if (!existingTemplate || existingTemplate.length === 0) {
      return res.status(404).json({ message: 'Email template not found' });
    }

    // Delete template
    await db.delete(emailTemplates).where(eq(emailTemplates.id, templateId));

    return res.status(200).json({ message: 'Email template deleted successfully' });
  } catch (error) {
    console.error('Error deleting email template:', error);
    return res.status(500).json({ 
      message: 'Failed to delete email template', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}