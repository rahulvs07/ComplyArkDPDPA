import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import { db } from '../db';
import { emailSettings, emailTemplates } from '@shared/schema';
import { storage } from '../storage';
import { AuthRequest } from '../types';
import { sql } from 'drizzle-orm';

// Interface for email settings
interface EmailSettingsConfig {
  provider: 'smtp' | 'sendgrid';
  fromEmail: string;
  fromName: string;
  // SMTP-specific fields
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  useTLS?: boolean;
  // SendGrid-specific fields
  sendgridApiKey?: string;
}

// Interface for email templates
interface EmailTemplate {
  id?: number;
  name: string;
  subject: string;
  body: string;
}

// Interface for test email parameters
interface TestEmailParams {
  recipient: string;
  subject: string;
  message: string;
}

// Get email settings
export const getEmailSettings = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.username !== 'complyarkadmin') {
      return res.status(403).json({ message: 'Only super admins can access email settings' });
    }

    const settings = await storage.getEmailSettings();
    
    if (!settings) {
      return res.status(200).json({
        provider: 'smtp',
        fromEmail: '',
        fromName: 'ComplyArk Notifications',
        smtpHost: '',
        smtpPort: 587,
        smtpUsername: '',
        smtpPassword: '',
        useTLS: true,
        sendgridApiKey: '',
      });
    }

    // Don't expose the full password or API key in the response
    const settingsWithoutSensitive = {
      ...settings,
      smtpPassword: settings.smtpPassword ? '********' : '',
      sendgridApiKey: settings.sendgridApiKey ? '********' : '',
    };

    return res.status(200).json(settingsWithoutSensitive);
  } catch (error) {
    console.error('Get email settings error:', error);
    return res.status(500).json({ message: 'Failed to retrieve email settings' });
  }
};

// Update email settings
export const updateEmailSettings = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.username !== 'complyarkadmin') {
      return res.status(403).json({ message: 'Only super admins can update email settings' });
    }

    const {
      provider,
      fromEmail,
      fromName,
      smtpHost,
      smtpPort,
      smtpUsername,
      smtpPassword,
      useTLS,
      sendgridApiKey,
    } = req.body as EmailSettingsConfig;

    // Validate required fields based on the provider
    if (!provider || !fromEmail || !fromName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (provider === 'smtp' && (!smtpHost || !smtpPort || !smtpUsername)) {
      return res.status(400).json({ message: 'SMTP configuration requires host, port, and username' });
    }

    if (provider === 'sendgrid' && !sendgridApiKey) {
      return res.status(400).json({ message: 'SendGrid configuration requires an API key' });
    }

    // Get existing settings if any
    const existingSettings = await storage.getEmailSettings();

    // Prepare settings object
    const updatedSettings: any = {
      provider,
      fromEmail,
      fromName,
      smtpHost: provider === 'smtp' ? smtpHost : null,
      smtpPort: provider === 'smtp' && smtpPort ? parseInt(smtpPort.toString()) : null,
      smtpUsername: provider === 'smtp' ? smtpUsername : null,
      useTLS: provider === 'smtp' ? useTLS : false,
      sendgridApiKey: provider === 'sendgrid' ? sendgridApiKey : null,
    };

    // Only update password if provided and not masked
    if (provider === 'smtp' && smtpPassword && smtpPassword !== '********') {
      updatedSettings.smtpPassword = smtpPassword;
    } else if (provider === 'smtp' && existingSettings && existingSettings.smtpPassword && smtpPassword === '********') {
      // Keep existing password if masked password is provided
      updatedSettings.smtpPassword = existingSettings.smtpPassword;
    }

    // Only update API key if provided and not masked
    if (provider === 'sendgrid' && sendgridApiKey && sendgridApiKey !== '********') {
      updatedSettings.sendgridApiKey = sendgridApiKey;
    } else if (provider === 'sendgrid' && existingSettings && existingSettings.sendgridApiKey && sendgridApiKey === '********') {
      // Keep existing API key if masked key is provided
      updatedSettings.sendgridApiKey = existingSettings.sendgridApiKey;
    }

    // Update settings using storage interface
    const result = await storage.updateEmailSettings(updatedSettings);

    return res.status(200).json({ message: 'Email settings updated successfully' });
  } catch (error) {
    console.error('Update email settings error:', error);
    return res.status(500).json({ message: 'Failed to update email settings' });
  }
};

// Send a test email
export const sendTestEmail = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.username !== 'complyarkadmin') {
      return res.status(403).json({ message: 'Only super admins can send test emails' });
    }

    const { recipient, subject, message } = req.body as TestEmailParams;

    if (!recipient || !subject || !message) {
      return res.status(400).json({ message: 'Recipient, subject, and message are required' });
    }

    // Get email settings
    const emailConfig = await storage.getEmailSettings();
    
    if (!emailConfig) {
      return res.status(400).json({ message: 'Email settings not configured' });
    }

    // Send email based on the provider
    if (emailConfig.provider === 'smtp') {
      await sendSmtpEmail(emailConfig, recipient, subject, message);
    } else if (emailConfig.provider === 'sendgrid') {
      await sendSendGridEmail(emailConfig, recipient, subject, message);
    } else {
      return res.status(400).json({ message: 'Invalid email provider' });
    }

    return res.status(200).json({ message: 'Test email sent successfully' });
  } catch (error: any) {
    console.error('Send test email error:', error);
    return res.status(500).json({ message: `Failed to send test email: ${error.message}` });
  }
};

// Get email templates
export const getEmailTemplates = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.username !== 'complyarkadmin') {
      return res.status(403).json({ message: 'Only super admins can access email templates' });
    }

    const templates = await storage.listEmailTemplates();
    return res.status(200).json(templates);
  } catch (error) {
    console.error('Get email templates error:', error);
    return res.status(500).json({ message: 'Failed to retrieve email templates' });
  }
};

// Create or update an email template
export const saveEmailTemplate = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.username !== 'complyarkadmin') {
      return res.status(403).json({ message: 'Only super admins can manage email templates' });
    }

    const { id, name, subject, body } = req.body as EmailTemplate;

    if (!name || !subject || !body) {
      return res.status(400).json({ message: 'Name, subject, and body are required' });
    }

    let result;
    
    // Check if we're updating an existing template
    if (id) {
      const existingTemplate = await db.select().from(emailTemplates).where(sql`id = ${id}`).limit(1);
      
      if (existingTemplate.length === 0) {
        return res.status(404).json({ message: 'Template not found' });
      }
      
      result = await db.update(emailTemplates).set({ name, subject, body }).where(sql`id = ${id}`);
      return res.status(200).json({ message: 'Template updated successfully', id });
    } else {
      // Check if a template with this name already exists
      const existingTemplate = await db.select().from(emailTemplates).where(sql`name = ${name}`).limit(1);
      
      if (existingTemplate.length > 0) {
        // Update the existing template
        result = await db.update(emailTemplates)
          .set({ subject, body })
          .where(sql`id = ${existingTemplate[0].id}`);
        
        return res.status(200).json({ 
          message: 'Template updated successfully', 
          id: existingTemplate[0].id 
        });
      } else {
        // Create a new template
        result = await db.insert(emailTemplates).values({ name, subject, body });
        return res.status(201).json({ message: 'Template created successfully' });
      }
    }
  } catch (error) {
    console.error('Save email template error:', error);
    return res.status(500).json({ message: 'Failed to save email template' });
  }
};

// Delete an email template
export const deleteEmailTemplate = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.username !== 'complyarkadmin') {
      return res.status(403).json({ message: 'Only super admins can delete email templates' });
    }

    const templateId = parseInt(req.params.id);
    
    if (isNaN(templateId)) {
      return res.status(400).json({ message: 'Invalid template ID' });
    }

    const existingTemplate = await db.select().from(emailTemplates).where(sql`id = ${templateId}`).limit(1);
    
    if (existingTemplate.length === 0) {
      return res.status(404).json({ message: 'Template not found' });
    }

    await db.delete(emailTemplates).where(sql`id = ${templateId}`);
    
    return res.status(200).json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete email template error:', error);
    return res.status(500).json({ message: 'Failed to delete email template' });
  }
};

// Helper function to send email via SMTP
async function sendSmtpEmail(
  config: any,
  recipient: string,
  subject: string,
  message: string,
  html?: string
): Promise<void> {
  if (!config.smtpHost || !config.smtpPort || !config.smtpUsername) {
    throw new Error('SMTP configuration is incomplete');
  }

  const transportConfig: any = {
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: config.smtpUsername,
      pass: config.smtpPassword,
    },
  };

  // Add TLS configuration if enabled
  if (config.useTLS) {
    transportConfig.tls = {
      ciphers: 'SSLv3',
      rejectUnauthorized: false,
    };
  }

  const transporter = nodemailer.createTransport(transportConfig);

  const mailOptions = {
    from: `"${config.fromName}" <${config.fromEmail}>`,
    to: recipient,
    subject: subject,
    text: message,
    html: html || message,
  };

  await transporter.sendMail(mailOptions);
}

// Helper function to send email via SendGrid
async function sendSendGridEmail(
  config: any,
  recipient: string,
  subject: string,
  message: string,
  html?: string
): Promise<void> {
  if (!config.sendgridApiKey) {
    throw new Error('SendGrid API key is not configured');
  }

  sgMail.setApiKey(config.sendgridApiKey);

  const msg = {
    to: recipient,
    from: {
      email: config.fromEmail,
      name: config.fromName,
    },
    subject: subject,
    text: message,
    html: html || message,
  };

  await sgMail.send(msg);
}

// Public function to send email using configured provider
export async function sendEmail(
  recipient: string,
  subject: string,
  message: string,
  html?: string
): Promise<boolean> {
  try {
    // Get email settings
    const settings = await db.select().from(emailSettings).limit(1);
    
    if (settings.length === 0) {
      console.error('Email settings not configured');
      return false;
    }

    const emailConfig = settings[0];

    // Send email based on the provider
    if (emailConfig.provider === 'smtp') {
      await sendSmtpEmail(emailConfig, recipient, subject, message, html);
    } else if (emailConfig.provider === 'sendgrid') {
      await sendSendGridEmail(emailConfig, recipient, subject, message, html);
    } else {
      console.error('Invalid email provider');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Send email error:', error);
    return false;
  }
}

// Function to send email using a template
export async function sendTemplateEmail(
  recipient: string,
  templateName: string,
  templateVariables: Record<string, string> = {}
): Promise<boolean> {
  try {
    // Get the template
    const template = await db.select().from(emailTemplates).where(sql`name = ${templateName}`).limit(1);
    
    if (template.length === 0) {
      console.error(`Template "${templateName}" not found`);
      return false;
    }

    // Replace variables in the subject and body
    let subject = template[0].subject;
    let body = template[0].body;

    // Replace template variables with their values
    Object.entries(templateVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      subject = subject.replace(regex, value);
      body = body.replace(regex, value);
    });

    // Send the email
    return await sendEmail(recipient, subject, body, body);
  } catch (error) {
    console.error('Send template email error:', error);
    return false;
  }
}