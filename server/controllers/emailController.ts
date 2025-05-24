import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { AuthRequest } from '../middleware/auth';
import dotenv from 'dotenv';

// Interface for email settings
interface EmailSettings {
  emailEnabled: boolean;
  emailTestMode: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  defaultFromEmail: string;
  defaultFromName: string;
}

// Get current email settings
export const getEmailSettings = async (req: AuthRequest, res: Response) => {
  try {
    // Check if user has admin access
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized. Admin access required." });
    }

    // Load current environment variables
    const settings: EmailSettings = {
      emailEnabled: process.env.EMAIL_ENABLED === 'true',
      emailTestMode: process.env.EMAIL_TEST_MODE === 'true',
      smtpHost: process.env.SMTP_HOST || '',
      smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
      smtpUser: process.env.SMTP_USER || '',
      smtpPassword: process.env.SMTP_PASSWORD || '',
      defaultFromEmail: process.env.DEFAULT_FROM_EMAIL || 'noreply@complyark.com',
      defaultFromName: process.env.DEFAULT_FROM_NAME || 'ComplyArk Notifications'
    };

    return res.status(200).json(settings);
  } catch (error) {
    console.error('Error fetching email settings:', error);
    return res.status(500).json({ message: "Failed to fetch email settings" });
  }
};

// Update email settings
export const updateEmailSettings = async (req: AuthRequest, res: Response) => {
  try {
    // Check if user has admin access
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized. Admin access required." });
    }

    const settings = req.body as EmailSettings;

    // Validate settings
    if (!settings.smtpHost && settings.emailEnabled && !settings.emailTestMode) {
      return res.status(400).json({ message: "SMTP host is required when email is enabled in production mode" });
    }

    // For security, we'll add some minimal validation
    if (settings.smtpPort < 1 || settings.smtpPort > 65535) {
      return res.status(400).json({ message: "Invalid SMTP port" });
    }

    // In a production environment, these settings should be stored in a secure way
    // For this implementation, we'll update the .env file directly for simplicity
    // In a real-world scenario, you might use a database or a secure configuration management system

    // Read the current .env file
    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = '';
    
    try {
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }
    } catch (readError) {
      console.error('Error reading .env file:', readError);
      // Create a new file if it doesn't exist
      envContent = '';
    }

    // Update the environment variables
    const envVars = {
      EMAIL_ENABLED: settings.emailEnabled.toString(),
      EMAIL_TEST_MODE: settings.emailTestMode.toString(),
      SMTP_HOST: settings.smtpHost,
      SMTP_PORT: settings.smtpPort.toString(),
      SMTP_USER: settings.smtpUser,
      SMTP_PASSWORD: settings.smtpPassword,
      DEFAULT_FROM_EMAIL: settings.defaultFromEmail,
      DEFAULT_FROM_NAME: settings.defaultFromName
    };

    // Create or update .env file
    let newEnvContent = '';
    
    if (envContent) {
      // Update existing variables
      Object.entries(envVars).forEach(([key, value]) => {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (envContent.match(regex)) {
          envContent = envContent.replace(regex, `${key}=${value}`);
        } else {
          envContent += `\n${key}=${value}`;
        }
      });
      
      newEnvContent = envContent;
    } else {
      // Create new .env file
      newEnvContent = Object.entries(envVars)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
    }

    // Write to .env file
    fs.writeFileSync(envPath, newEnvContent);

    // Update the current process.env
    Object.entries(envVars).forEach(([key, value]) => {
      process.env[key] = value;
    });

    // Reload environment variables
    dotenv.config();

    return res.status(200).json({ message: "Email settings updated successfully" });
  } catch (error) {
    console.error('Error updating email settings:', error);
    return res.status(500).json({ message: "Failed to update email settings" });
  }
};

// Send a test email
export const sendTestEmail = async (req: AuthRequest, res: Response) => {
  try {
    // Check if user has admin access
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized. Admin access required." });
    }

    const { recipient, subject, message } = req.body;

    // Validate required fields
    if (!recipient || !subject) {
      return res.status(400).json({ message: "Recipient and subject are required" });
    }

    // Import the email service
    const { sendEmail } = await import('../utils/emailService');

    // Set test mode for this specific email if we're in the admin panel
    const testModeOverride = true;
    
    // Create HTML version of the message
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
        <div style="background: linear-gradient(135deg, #2E77AE, #0F3460); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">ComplyArk Test Email</h1>
        </div>
        <div style="padding: 20px;">
          <p>${message.replace(/\n/g, '<br>')}</p>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;">
          <p style="color: #666; font-size: 14px;">This is a test email sent from the ComplyArk Compliance Management System.</p>
        </div>
        <div style="background: #f9f9f9; padding: 15px; text-align: center; border-radius: 0 0 5px 5px; font-size: 14px; color: #666;">
          <p>Powered by ComplyArk - Simplifying Data Protection Compliance</p>
        </div>
      </div>
    `;

    // Send the test email
    const emailSent = await sendEmail({
      to: recipient,
      subject,
      text: message,
      html,
      from: `"${process.env.DEFAULT_FROM_NAME || 'ComplyArk'}" <${process.env.DEFAULT_FROM_EMAIL || 'noreply@complyark.com'}>`,
      organizationName: 'ComplyArk'
    });

    if (emailSent) {
      return res.status(200).json({ message: "Test email sent successfully" });
    } else {
      return res.status(500).json({ message: "Failed to send test email" });
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    return res.status(500).json({ message: `Failed to send test email: ${error.message}` });
  }
};