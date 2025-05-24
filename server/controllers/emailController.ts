import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { MailService } from '@sendgrid/mail';
import { db } from '../db';
import { emailSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface EmailSettings {
  provider: 'smtp' | 'sendgrid';
  fromEmail: string;
  fromName: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  useTLS?: boolean;
  sendgridApiKey?: string;
}

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
}

// Get email settings
export const getEmailSettings = async (req: Request, res: Response) => {
  try {
    const settings = await db.select().from(emailSettings).limit(1);
    
    if (settings.length > 0) {
      // Don't return sensitive info like passwords or API keys
      const safeSettings = {
        ...settings[0],
        smtpPassword: settings[0].smtpPassword ? '••••••••••••' : null,
        sendgridApiKey: settings[0].sendgridApiKey ? '••••••••••••' : null,
      };
      
      return res.status(200).json(safeSettings);
    } else {
      return res.status(200).json({ provider: 'smtp' });
    }
  } catch (error) {
    console.error('Error fetching email settings:', error);
    return res.status(500).json({ message: 'Error fetching email settings' });
  }
};

// Save email settings
export const saveEmailSettings = async (req: Request, res: Response) => {
  try {
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
    } = req.body as EmailSettings;
    
    // Validate required fields
    if (!provider || !fromEmail || !fromName) {
      return res.status(400).json({
        message: 'Provider, from email, and from name are required'
      });
    }
    
    // Validate SMTP specific fields
    if (provider === 'smtp' && (!smtpHost || !smtpPort)) {
      return res.status(400).json({
        message: 'SMTP host and port are required for SMTP configuration'
      });
    }
    
    // Validate SendGrid specific fields
    if (provider === 'sendgrid' && !sendgridApiKey && !(await hasExistingSendgridKey())) {
      return res.status(400).json({
        message: 'SendGrid API key is required'
      });
    }
    
    // Check if settings already exist
    const existingSettings = await db.select().from(emailSettings).limit(1);
    
    // Prepare settings object
    const settingsData = {
      provider,
      fromEmail,
      fromName,
      smtpHost: provider === 'smtp' ? smtpHost : null,
      smtpPort: provider === 'smtp' && smtpPort ? smtpPort : null,
      smtpUsername: provider === 'smtp' ? smtpUsername : null,
      useTLS: provider === 'smtp' ? useTLS : false,
    };
    
    // Only update password/API key if provided (otherwise keep existing)
    const settingsWithSensitiveData = {
      ...settingsData,
      smtpPassword: provider === 'smtp' && smtpPassword 
        ? smtpPassword 
        : existingSettings.length > 0 && provider === 'smtp'
          ? existingSettings[0].smtpPassword
          : null,
      sendgridApiKey: provider === 'sendgrid' && sendgridApiKey 
        ? sendgridApiKey 
        : existingSettings.length > 0 && provider === 'sendgrid'
          ? existingSettings[0].sendgridApiKey
          : null,
    };
    
    if (existingSettings.length > 0) {
      // Update existing settings
      await db.update(emailSettings)
        .set(settingsWithSensitiveData)
        .where(eq(emailSettings.id, existingSettings[0].id));
      
      return res.status(200).json({ message: 'Email settings updated successfully' });
    } else {
      // Insert new settings
      await db.insert(emailSettings).values(settingsWithSensitiveData);
      
      return res.status(201).json({ message: 'Email settings created successfully' });
    }
  } catch (error) {
    console.error('Error saving email settings:', error);
    return res.status(500).json({ message: 'Error saving email settings' });
  }
};

// Send test email
export const sendTestEmail = async (req: Request, res: Response) => {
  try {
    const { recipient, subject, message } = req.body;
    
    // Validate required fields
    if (!recipient || !subject || !message) {
      return res.status(400).json({
        message: 'Recipient, subject, and message are required'
      });
    }
    
    // Get email settings
    const settings = await db.select().from(emailSettings).limit(1);
    
    if (settings.length === 0) {
      return res.status(400).json({
        message: 'Email settings not configured. Please configure email settings first.'
      });
    }
    
    const emailConfig = settings[0];
    
    // Send email based on provider
    if (emailConfig.provider === 'smtp') {
      const result = await sendSmtpEmail(
        emailConfig,
        recipient,
        subject,
        message
      );
      
      if (result.success) {
        return res.status(200).json({ message: 'Test email sent successfully' });
      } else {
        return res.status(500).json({ message: result.error });
      }
    } else if (emailConfig.provider === 'sendgrid') {
      const result = await sendSendgridEmail(
        emailConfig,
        recipient,
        subject,
        message
      );
      
      if (result.success) {
        return res.status(200).json({ message: 'Test email sent successfully' });
      } else {
        return res.status(500).json({ message: result.error });
      }
    } else {
      return res.status(400).json({
        message: 'Invalid email provider configuration'
      });
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    return res.status(500).json({ message: 'Error sending test email' });
  }
};

// Get email templates
export const getEmailTemplates = async (req: Request, res: Response) => {
  try {
    // Mock data for now - will be replaced with actual database queries later
    const templates: EmailTemplate[] = [
      {
        id: 1,
        name: 'OTP Verification',
        subject: 'Your OTP Verification Code',
        body: 'Your OTP verification code is: {{otp}}. It will expire in {{expiryMinutes}} minutes.',
      },
      {
        id: 2,
        name: 'Request Confirmation',
        subject: 'Your Request Confirmation',
        body: 'Thank you for submitting your request. Your request ID is: {{requestId}}. You can track the status of your request using this ID.',
      },
      {
        id: 3,
        name: 'Request Status Update',
        subject: 'Update on Your Request',
        body: 'The status of your request (ID: {{requestId}}) has been updated to: {{status}}.',
      },
    ];
    
    return res.status(200).json(templates);
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return res.status(500).json({ message: 'Error fetching email templates' });
  }
};

// Utility Functions

// Check if SendGrid API key exists in database
async function hasExistingSendgridKey(): Promise<boolean> {
  const settings = await db.select().from(emailSettings).limit(1);
  return settings.length > 0 && !!settings[0].sendgridApiKey;
}

// Send email using SMTP
async function sendSmtpEmail(
  config: typeof emailSettings.$inferSelect,
  to: string,
  subject: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!config.smtpHost || !config.smtpPort) {
      return {
        success: false,
        error: 'SMTP host or port not configured'
      };
    }
    
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.useTLS,
      auth: config.smtpUsername && config.smtpPassword ? {
        user: config.smtpUsername,
        pass: config.smtpPassword,
      } : undefined,
    });
    
    await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to,
      subject,
      text,
    });
    
    return { success: true };
  } catch (error) {
    console.error('SMTP email error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown SMTP error'
    };
  }
}

// Send email using SendGrid
async function sendSendgridEmail(
  config: typeof emailSettings.$inferSelect,
  to: string,
  subject: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!config.sendgridApiKey) {
      return {
        success: false,
        error: 'SendGrid API key not configured'
      };
    }
    
    const mailService = new MailService();
    mailService.setApiKey(config.sendgridApiKey);
    
    await mailService.send({
      from: {
        email: config.fromEmail,
        name: config.fromName,
      },
      to,
      subject,
      text,
    });
    
    return { success: true };
  } catch (error) {
    console.error('SendGrid email error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown SendGrid error'
    };
  }
}

// Helper function to send email using configured provider
export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get email settings
    const settings = await db.select().from(emailSettings).limit(1);
    
    if (settings.length === 0) {
      return {
        success: false,
        error: 'Email settings not configured'
      };
    }
    
    const config = settings[0];
    
    if (config.provider === 'smtp') {
      return sendSmtpEmail(config, to, subject, text);
    } else if (config.provider === 'sendgrid') {
      return sendSendgridEmail(config, to, subject, text);
    } else {
      return {
        success: false,
        error: 'Invalid email provider configuration'
      };
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email error'
    };
  }
}