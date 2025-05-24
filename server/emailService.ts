/**
 * Email Service that supports both SMTP and SendGrid
 * This service abstracts away the specifics of each provider to offer a unified interface
 */
import nodemailer from 'nodemailer';
import { MailService } from '@sendgrid/mail';
import { db } from './db';
import { emailSettings, emailTemplates } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Define email settings interface
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

// Define email params interface
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
    
    if (settings.length === 0) {
      // Return default test mode settings if none found
      return {
        provider: 'test',
        fromEmail: 'noreply@complyark.com',
        fromName: 'ComplyArk',
      };
    }
    
    return {
      provider: settings[0].provider as 'smtp' | 'sendgrid',
      fromEmail: settings[0].fromEmail,
      fromName: settings[0].fromName,
      smtpHost: settings[0].smtpHost || undefined,
      smtpPort: settings[0].smtpPort || undefined,
      smtpUsername: settings[0].smtpUsername || undefined,
      smtpPassword: settings[0].smtpPassword || undefined,
      useTLS: settings[0].useTLS || false,
      sendgridApiKey: settings[0].sendgridApiKey || undefined,
    };
  } catch (error) {
    console.error('Error getting email settings:', error);
    // Return default test mode settings if error
    return {
      provider: 'test',
      fromEmail: 'noreply@complyark.com',
      fromName: 'ComplyArk',
    };
  }
}

/**
 * Save email settings to the database
 */
export async function saveEmailSettings(settings: EmailSettings): Promise<boolean> {
  try {
    // Check if settings already exist
    const existingSettings = await db.select().from(emailSettings).limit(1);
    
    if (existingSettings.length > 0) {
      // Update existing settings
      await db.update(emailSettings)
        .set({
          provider: settings.provider,
          fromEmail: settings.fromEmail,
          fromName: settings.fromName,
          smtpHost: settings.smtpHost,
          smtpPort: settings.smtpPort,
          smtpUsername: settings.smtpUsername,
          smtpPassword: settings.smtpPassword,
          useTLS: settings.useTLS,
          sendgridApiKey: settings.sendgridApiKey,
          updatedAt: new Date()
        })
        .where(eq(emailSettings.id, existingSettings[0].id));
    } else {
      // Insert new settings
      await db.insert(emailSettings).values({
        provider: settings.provider,
        fromEmail: settings.fromEmail,
        fromName: settings.fromName,
        smtpHost: settings.smtpHost,
        smtpPort: settings.smtpPort,
        smtpUsername: settings.smtpUsername,
        smtpPassword: settings.smtpPassword,
        useTLS: settings.useTLS,
        sendgridApiKey: settings.sendgridApiKey
      });
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
  let processedTemplate = template;
  
  // Replace variables in the template
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{${key}}`, 'g');
    processedTemplate = processedTemplate.replace(regex, value);
  }
  
  return processedTemplate;
}

/**
 * Get an email template by name
 */
export async function getTemplateByName(templateName: string): Promise<any | null> {
  try {
    const template = await db.select()
      .from(emailTemplates)
      .where(eq(emailTemplates.name, templateName))
      .limit(1);
    
    return template.length > 0 ? template[0] : null;
  } catch (error) {
    console.error(`Error getting email template '${templateName}':`, error);
    return null;
  }
}

/**
 * Send an email using the configured provider
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    const settings = await getEmailSettings();
    
    // Test mode just logs the email and returns true
    if (settings.provider === 'test') {
      console.log('Test Mode Email:', {
        from: `${settings.fromName} <${settings.fromEmail}>`,
        to: params.to,
        cc: params.cc,
        subject: params.subject,
        text: params.text,
        html: params.html,
        attachments: params.attachments
      });
      return true;
    }
    
    // Send using SMTP
    if (settings.provider === 'smtp') {
      return await sendSmtpEmail(settings, params);
    }
    
    // Send using SendGrid
    if (settings.provider === 'sendgrid') {
      return await sendSendgridEmail(settings, params);
    }
    
    return false;
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
  cc?: string | string[],
  variables: Record<string, string> = {}
): Promise<boolean> {
  try {
    const template = await getTemplateByName(templateName);
    
    if (!template) {
      console.error(`Email template '${templateName}' not found`);
      return false;
    }
    
    // Process the template with variables
    const subject = processTemplate(template.subject, variables);
    const body = processTemplate(template.body, variables);
    
    // Send the email
    return await sendEmail({
      to,
      cc,
      subject,
      html: body
    });
  } catch (error) {
    console.error(`Error sending email with template '${templateName}':`, error);
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
  try {
    if (!settings.smtpHost || !settings.smtpPort) {
      console.error('SMTP not properly configured');
      return false;
    }
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.useTLS,
      auth: settings.smtpUsername && settings.smtpPassword ? {
        user: settings.smtpUsername,
        pass: settings.smtpPassword
      } : undefined
    });
    
    // Format recipients
    const to = Array.isArray(params.to) ? params.to.join(', ') : params.to;
    const cc = params.cc ? (Array.isArray(params.cc) ? params.cc.join(', ') : params.cc) : undefined;
    
    // Send mail
    const info = await transporter.sendMail({
      from: `${settings.fromName} <${settings.fromEmail}>`,
      to,
      cc,
      subject: params.subject,
      text: params.text,
      html: params.html,
      attachments: params.attachments?.map(attachment => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType
      }))
    });
    
    console.log('SMTP Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending SMTP email:', error);
    return false;
  }
}

/**
 * Send email using SendGrid
 */
async function sendSendgridEmail(
  settings: EmailSettings,
  params: EmailParams
): Promise<boolean> {
  try {
    if (!settings.sendgridApiKey) {
      console.error('SendGrid API key not configured');
      return false;
    }
    
    // Setup SendGrid
    const sendgrid = new MailService();
    sendgrid.setApiKey(settings.sendgridApiKey);
    
    // Format recipients
    const to = Array.isArray(params.to) ? params.to : [params.to];
    const cc = params.cc ? (Array.isArray(params.cc) ? params.cc : [params.cc]) : undefined;
    
    // Create message
    const msg = {
      from: {
        email: settings.fromEmail,
        name: settings.fromName
      },
      to,
      cc,
      subject: params.subject,
      text: params.text,
      html: params.html,
      attachments: params.attachments?.map(attachment => ({
        content: Buffer.isBuffer(attachment.content) 
          ? attachment.content.toString('base64') 
          : Buffer.from(attachment.content).toString('base64'),
        filename: attachment.filename,
        type: attachment.contentType,
        disposition: 'attachment'
      }))
    };
    
    // Send mail
    await sendgrid.send(msg as any);
    console.log('SendGrid Email sent');
    return true;
  } catch (error) {
    console.error('Error sending SendGrid email:', error);
    return false;
  }
}

/**
 * Check if an email provider is properly configured
 */
export async function checkEmailConfiguration(): Promise<{ 
  configured: boolean; 
  provider: string; 
  issues: string[] 
}> {
  try {
    const settings = await getEmailSettings();
    const issues: string[] = [];
    
    if (settings.provider === 'test') {
      return {
        configured: true,
        provider: 'Test Mode',
        issues: []
      };
    } else if (settings.provider === 'smtp') {
      if (!settings.smtpHost) issues.push('SMTP Host not configured');
      if (!settings.smtpPort) issues.push('SMTP Port not configured');
      
      return {
        configured: issues.length === 0,
        provider: 'SMTP',
        issues
      };
    } else if (settings.provider === 'sendgrid') {
      if (!settings.sendgridApiKey) issues.push('SendGrid API Key not configured');
      
      return {
        configured: issues.length === 0,
        provider: 'SendGrid',
        issues
      };
    }
    
    return {
      configured: false,
      provider: 'Unknown',
      issues: ['Unknown email provider']
    };
  } catch (error) {
    console.error('Error checking email configuration:', error);
    return {
      configured: false,
      provider: 'Error',
      issues: ['Error checking configuration']
    };
  }
}

/**
 * Send a test email to verify configuration
 */
export async function sendTestEmail(to: string): Promise<{ 
  success: boolean; 
  message: string 
}> {
  try {
    const result = await sendEmail({
      to,
      subject: 'ComplyArk Email Configuration Test',
      html: `
        <h1>Email Configuration Test</h1>
        <p>This is a test email from ComplyArk to verify your email configuration.</p>
        <p>If you received this email, your email configuration is working correctly.</p>
        <p>Time: ${new Date().toLocaleString()}</p>
      `
    });
    
    return {
      success: result,
      message: result 
        ? 'Test email sent successfully' 
        : 'Failed to send test email'
    };
  } catch (error) {
    console.error('Error sending test email:', error);
    return {
      success: false,
      message: `Error sending test email: ${error.message}`
    };
  }
}