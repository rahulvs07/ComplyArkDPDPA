/**
 * Direct Email Sender - Bypasses Test Mode
 * 
 * This utility completely bypasses any test mode flags and sends emails
 * directly using the database email settings.
 */

import nodemailer from 'nodemailer';
import { db } from '../db';
import { emailSettings } from '@shared/schema';

/**
 * Send an email bypassing all test mode flags
 * @param to Recipient email
 * @param subject Email subject
 * @param html HTML content
 * @param text Plain text content
 * @returns Success status and message ID
 */
export async function sendEmailDirectly(
  to: string,
  subject: string,
  html: string,
  text: string
) {
  console.log('\n🔥 BYPASS EMAIL SYSTEM 🔥');
  console.log(`📧 Sending email to: ${to}`);
  console.log(`📝 Subject: ${subject}`);
  
  try {
    // Fetch email settings from database
    const settings = await db.select().from(emailSettings).limit(1);
    
    if (!settings.length) {
      console.error('❌ No email settings found in database');
      return { success: false };
    }
    
    const config = settings[0];
    
    // Create transport with database settings
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: Number(config.smtpPort),
      secure: Number(config.smtpPort) === 465,
      auth: {
        user: config.smtpUsername,
        pass: config.smtpPassword,
      },
      tls: {
        rejectUnauthorized: false
      }
    } as any);
    
    // Send email
    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to,
      subject,
      text,
      html
    });
    
    console.log(`✅ Email sent successfully! ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error };
  }
}