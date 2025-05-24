import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { db } from '../db';
import { emailSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Define interfaces for email settings
interface EmailSettings {
  id?: number;
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
  enableNotifications: boolean;
}

interface TestEmailParams {
  recipient: string;
  subject: string;
  message: string;
}

// Default email settings
const defaultSettings: EmailSettings = {
  host: '',
  port: 587,
  secure: false,
  auth: {
    user: '',
    pass: '',
  },
  from: 'noreply@complyark.com',
  enableNotifications: true
};

// In-memory email settings cache
let cachedSettings: EmailSettings | null = null;

// Get email transporter
export const getTransporter = async () => {
  const settings = await getEmailSettings();
  
  if (!settings.enableNotifications || !settings.host || !settings.auth.user) {
    console.warn('Email notifications are disabled or configuration is incomplete');
    return null;
  }
  
  return nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    auth: {
      user: settings.auth.user,
      pass: settings.auth.pass,
    }
  });
};

// Get email settings from database or cache
export const getEmailSettings = async (): Promise<EmailSettings> => {
  if (cachedSettings) {
    return cachedSettings;
  }
  
  try {
    const [settingsRecord] = await db.select().from(emailSettings).where(eq(emailSettings.id, 1));
    
    if (settingsRecord) {
      // Transform database record to EmailSettings interface
      const settings: EmailSettings = {
        id: settingsRecord.id,
        host: settingsRecord.host || '',
        port: settingsRecord.port || 587,
        secure: settingsRecord.secure || false,
        auth: {
          user: settingsRecord.username || '',
          pass: settingsRecord.password || '',
        },
        from: settingsRecord.fromEmail || 'noreply@complyark.com',
        enableNotifications: settingsRecord.enabled || false
      };
      
      cachedSettings = settings;
      return settings;
    }
    
    // If no settings found, create default settings
    await createDefaultSettings();
    return defaultSettings;
  } catch (error) {
    console.error('Error retrieving email settings:', error);
    return defaultSettings;
  }
};

// Create default settings in database
const createDefaultSettings = async () => {
  try {
    await db.insert(emailSettings).values({
      host: defaultSettings.host,
      port: defaultSettings.port,
      secure: defaultSettings.secure,
      username: defaultSettings.auth.user,
      password: defaultSettings.auth.pass,
      fromEmail: defaultSettings.from,
      enabled: defaultSettings.enableNotifications
    });
    
    console.log('Created default email settings');
  } catch (error) {
    console.error('Error creating default email settings:', error);
  }
};

// Update email settings in database
const updateEmailSettings = async (settings: EmailSettings) => {
  try {
    await db.update(emailSettings)
      .set({
        host: settings.host,
        port: settings.port,
        secure: settings.secure,
        username: settings.auth.user,
        password: settings.auth.pass,
        fromEmail: settings.from,
        enabled: settings.enableNotifications
      })
      .where(eq(emailSettings.id, 1));
    
    // Update cache
    cachedSettings = settings;
    
    return true;
  } catch (error) {
    console.error('Error updating email settings:', error);
    return false;
  }
};

// Get email settings controller
export const getSettings = async (req: Request, res: Response) => {
  try {
    const settings = await getEmailSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve email settings' });
  }
};

// Update email settings controller
export const updateSettings = async (req: Request, res: Response) => {
  try {
    const settings: EmailSettings = req.body;
    
    if (!settings || !settings.host) {
      return res.status(400).json({ error: 'Invalid email settings' });
    }
    
    const updated = await updateEmailSettings(settings);
    
    if (!updated) {
      return res.status(500).json({ error: 'Failed to update email settings' });
    }
    
    res.json({ message: 'Email settings updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update email settings' });
  }
};

// Send test email controller
export const sendTestEmail = async (req: Request, res: Response) => {
  try {
    const { recipient, subject, message }: TestEmailParams = req.body;
    
    if (!recipient) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }
    
    const settings = await getEmailSettings();
    
    if (!settings.enableNotifications) {
      return res.status(400).json({ error: 'Email notifications are disabled' });
    }
    
    const transporter = await getTransporter();
    
    if (!transporter) {
      return res.status(500).json({ error: 'Email configuration is incomplete' });
    }
    
    // Send test email
    await transporter.sendMail({
      from: settings.from,
      to: recipient,
      subject: subject || 'ComplyArk Test Email',
      text: message || 'This is a test email from ComplyArk.',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #0F3460; margin-top: 0;">ComplyArk Test Email</h2>
        <p>${message || 'This is a test email from ComplyArk.'}</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px;">
          <p>This is an automated message from ComplyArk - your DPDPA compliance platform.</p>
        </div>
      </div>`
    });
    
    res.json({ message: 'Test email sent successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send test email';
    res.status(500).json({ error: errorMessage });
  }
};

// Helper function to send notification emails
export const sendNotificationEmail = async (
  to: string,
  subject: string,
  htmlContent: string,
  textContent?: string
) => {
  try {
    const settings = await getEmailSettings();
    
    if (!settings.enableNotifications) {
      console.log('Email notifications are disabled. Skipping email to:', to);
      return false;
    }
    
    const transporter = await getTransporter();
    
    if (!transporter) {
      console.error('Email configuration is incomplete. Skipping email to:', to);
      return false;
    }
    
    await transporter.sendMail({
      from: settings.from,
      to,
      subject,
      text: textContent || 'Please view this email with an HTML-compatible email client',
      html: htmlContent
    });
    
    console.log('Notification email sent successfully to:', to);
    return true;
  } catch (error) {
    console.error('Failed to send notification email:', error);
    return false;
  }
};