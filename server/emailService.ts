/**
 * Email Service that supports both SMTP and SendGrid
 * This service abstracts away the specifics of each provider to offer a unified interface
 */
import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import { db } from './db';
import { emailSettings, emailTemplates } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Interface for email settings stored in database
export interface EmailSettings {
  provider: 'smtp' | 'sendgrid' | 'test';
  fromEmail: string;
  fromName: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  useTLS?: boolean;
  sendgridApiKey?: string;
}

// Interface for email sending parameters
export interface EmailParams {
  to: string | string[];
  cc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

/**
 * Get the current email settings from the database
 * If no settings are found, returns default test mode settings
 */
export async function getEmailSettings(): Promise<EmailSettings> {
  try {
    const settings = await db.select().from(emailSettings).limit(1);
    
    if (settings.length > 0) {
      return settings[0] as EmailSettings;
    }
    
    // Default to test mode if no settings are found
    return {
      provider: 'test',
      fromEmail: 'noreply@complyark.com',
      fromName: 'ComplyArk System'
    };
  } catch (error) {
    console.error('Error fetching email settings:', error);
    // Fallback to test mode in case of error
    return {
      provider: 'test',
      fromEmail: 'noreply@complyark.com',
      fromName: 'ComplyArk System'
    };
  }
}

/**
 * Save email settings to the database
 */
export async function saveEmailSettings(settings: EmailSettings): Promise<boolean> {
  try {
    const currentSettings = await db.select().from(emailSettings);
    
    if (currentSettings.length > 0) {
      // Update existing settings
      await db.update(emailSettings)
        .set(settings)
        .where(eq(emailSettings.id, currentSettings[0].id));
    } else {
      // Create new settings
      await db.insert(emailSettings).values(settings);
    }
    return true;
  } catch (error) {
    console.error('Error saving email settings:', error);
    return false;
  }
}

/**
 * Process a template with variable substitution
 * @param template The template string with {variable} placeholders
 * @param variables An object with variable names and values
 * @returns The processed template with variables replaced
 */
export function processTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{([^}]+)\}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : match;
  });
}

/**
 * Get an email template by name
 */
export async function getTemplateByName(templateName: string): Promise<any | null> {
  try {
    const templates = await db.select()
      .from(emailTemplates)
      .where(eq(emailTemplates.name, templateName))
      .limit(1);
    
    if (templates.length > 0) {
      return templates[0];
    }
    return null;
  } catch (error) {
    console.error(`Error fetching template "${templateName}":`, error);
    return null;
  }
}

/**
 * Send an email using the configured provider
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    const settings = await getEmailSettings();
    
    // In test mode, just log the email content and return success
    if (settings.provider === 'test') {
      console.log('SENDING EMAIL IN TEST MODE');
      console.log('To:', params.to);
      if (params.cc) console.log('CC:', params.cc);
      console.log('Subject:', params.subject);
      console.log('Text:', params.text);
      console.log('HTML:', params.html?.substring(0, 200) + '...');
      return true;
    }
    
    if (settings.provider === 'smtp') {
      return await sendSmtpEmail(settings, params);
    } else if (settings.provider === 'sendgrid') {
      return await sendSendgridEmail(settings, params);
    }
    
    throw new Error(`Unsupported email provider: ${settings.provider}`);
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send email with a template
 * Gets the template from the database and processes it with the provided variables
 */
export async function sendEmailWithTemplate(
  templateName: string, 
  to: string | string[], 
  cc: string | string[] | undefined,
  variables: Record<string, string>
): Promise<boolean> {
  try {
    const template = await getTemplateByName(templateName);
    if (!template) {
      console.error(`Template "${templateName}" not found`);
      return false;
    }
    
    const subject = processTemplate(template.subject, variables);
    const html = processTemplate(template.body, variables);
    
    return await sendEmail({
      to,
      cc,
      subject,
      html,
      text: html.replace(/<[^>]*>?/gm, '') // Simple HTML to plain text conversion
    });
  } catch (error) {
    console.error(`Error sending email with template "${templateName}":`, error);
    return false;
  }
}

/**
 * Send email using SMTP
 */
async function sendSmtpEmail(
  settings: EmailSettings,
  params: EmailParams
): Promise<boolean> {
  if (!settings.smtpHost || !settings.smtpPort) {
    throw new Error('SMTP settings are incomplete');
  }
  
  try {
    // Create SMTP transport
    const transport = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.useTLS || false,
      auth: settings.smtpUsername && settings.smtpPassword ? {
        user: settings.smtpUsername,
        pass: settings.smtpPassword
      } : undefined
    });
    
    // Send the email
    const result = await transport.sendMail({
      from: `"${settings.fromName}" <${settings.fromEmail}>`,
      to: Array.isArray(params.to) ? params.to.join(', ') : params.to,
      cc: params.cc ? (Array.isArray(params.cc) ? params.cc.join(', ') : params.cc) : undefined,
      subject: params.subject,
      text: params.text,
      html: params.html,
      attachments: params.attachments
    });
    
    console.log('Email sent via SMTP:', result.messageId);
    return true;
  } catch (error) {
    console.error('SMTP email error:', error);
    throw error;
  }
}

/**
 * Send email using SendGrid
 */
async function sendSendgridEmail(
  settings: EmailSettings,
  params: EmailParams
): Promise<boolean> {
  if (!settings.sendgridApiKey) {
    // If SendGrid API key is missing but environment variable is available, use that
    if (process.env.SENDGRID_API_KEY) {
      settings.sendgridApiKey = process.env.SENDGRID_API_KEY;
    } else {
      throw new Error('SendGrid API key is not configured');
    }
  }
  
  try {
    // Configure SendGrid
    sgMail.setApiKey(settings.sendgridApiKey);
    
    // Prepare email data
    const msg = {
      from: {
        email: settings.fromEmail,
        name: settings.fromName
      },
      to: Array.isArray(params.to) ? params.to : [params.to],
      cc: params.cc ? (Array.isArray(params.cc) ? params.cc : [params.cc]) : undefined,
      subject: params.subject,
      text: params.text,
      html: params.html,
      attachments: params.attachments ? params.attachments.map(attachment => ({
        content: Buffer.isBuffer(attachment.content) 
          ? attachment.content.toString('base64') 
          : Buffer.from(attachment.content).toString('base64'),
        filename: attachment.filename,
        type: attachment.contentType,
        disposition: 'attachment'
      })) : undefined
    };
    
    // Send the email
    const result = await sgMail.send(msg);
    console.log('Email sent via SendGrid:', result[0].statusCode);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    throw error;
  }
}

/**
 * Check if an email provider is properly configured
 */
export async function checkEmailConfiguration(): Promise<{ 
  configured: boolean; 
  provider: string;
  error?: string;
}> {
  try {
    const settings = await getEmailSettings();
    
    if (settings.provider === 'test') {
      return { configured: true, provider: 'test' };
    }
    
    if (settings.provider === 'smtp') {
      if (!settings.smtpHost || !settings.smtpPort) {
        return { 
          configured: false, 
          provider: 'smtp',
          error: 'SMTP host and port are required' 
        };
      }
      return { configured: true, provider: 'smtp' };
    }
    
    if (settings.provider === 'sendgrid') {
      if (!settings.sendgridApiKey && !process.env.SENDGRID_API_KEY) {
        return { 
          configured: false, 
          provider: 'sendgrid',
          error: 'SendGrid API key is not configured' 
        };
      }
      return { configured: true, provider: 'sendgrid' };
    }
    
    return { 
      configured: false, 
      provider: settings.provider,
      error: `Unknown provider: ${settings.provider}` 
    };
  } catch (error) {
    console.error('Error checking email configuration:', error);
    return { 
      configured: false, 
      provider: 'unknown',
      error: 'Error checking email configuration' 
    };
  }
}

/**
 * Send a test email to verify configuration
 */
export async function sendTestEmail(to: string): Promise<{ 
  success: boolean;
  message: string;
}> {
  try {
    const settings = await getEmailSettings();
    const result = await sendEmail({
      to,
      subject: 'Test Email from ComplyArk',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <h2 style="color: #4F46E5;">ComplyArk Email Test</h2>
          <p>This is a test email sent from your ComplyArk application.</p>
          <p>Your email settings are configured correctly using the <strong>${settings.provider}</strong> provider.</p>
          <p>From: ${settings.fromName} &lt;${settings.fromEmail}&gt;</p>
          <hr style="border: 0; height: 1px; background: #eaeaea; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
        </div>
      `
    });
    
    if (result) {
      return {
        success: true,
        message: `Test email successfully sent to ${to} using ${settings.provider} provider`
      };
    } else {
      return {
        success: false,
        message: 'Failed to send test email. Check logs for details.'
      };
    }
  } catch (error: any) {
    console.error('Error sending test email:', error);
    return {
      success: false,
      message: `Failed to send test email: ${error.message || 'Unknown error'}`
    };
  }
}