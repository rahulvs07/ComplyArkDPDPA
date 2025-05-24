/**
 * Direct Email Sender - One-Time Script
 * This script bypasses all test mode flags and directly sends an email
 * using the database email settings.
 * 
 * Run with: npx tsx server/sendNotificationDirectly.ts [recipient email]
 */

import nodemailer from 'nodemailer';
import { db } from './db';
import { emailSettings } from '@shared/schema';

async function sendEmail() {
  try {
    // Get recipient from command line args
    const recipient = process.argv[2] || 'rahulvs07@gmail.com';
    
    console.log(`Attempting to send test email to: ${recipient}`);
    
    // Get email settings from database
    const settings = await db.select().from(emailSettings).limit(1);
    
    if (settings.length === 0) {
      console.error('No email settings found in database');
      process.exit(1);
    }
    
    const config = settings[0];
    console.log('Using email settings:');
    console.log('- Provider:', config.provider);
    console.log('- SMTP Host:', config.smtpHost);
    console.log('- SMTP Port:', config.smtpPort);
    console.log('- From:', config.fromEmail);
    
    // Configure transporter
    const transportOptions = {
      host: config.smtpHost,
      port: Number(config.smtpPort) || 587,
      secure: Number(config.smtpPort) === 465,
      auth: {
        user: config.smtpUsername,
        pass: config.smtpPassword,
      },
      tls: {
        rejectUnauthorized: false
      },
      debug: true
    };
    
    console.log('Creating transporter...');
    const transporter = nodemailer.createTransport(transportOptions as any);
    
    // Create a simple test email
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>ComplyArk Test Email</h2>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>This is a test email from the ComplyArk system to verify that email notifications are working properly.</p>
          <p>If you received this email, it means the email sending system is configured correctly.</p>
          <p>Time sent: ${new Date().toLocaleString()}</p>
        </div>
        <div class="footer">
          <p>This is an automated message from the ComplyArk system.</p>
          <p>&copy; ComplyArk - Data Protection and Privacy Management</p>
        </div>
      </div>
    </body>
    </html>
    `;
    
    const text = `
    ComplyArk Test Email
    
    Hello,
    
    This is a test email from the ComplyArk system to verify that email notifications are working properly.
    
    If you received this email, it means the email sending system is configured correctly.
    
    Time sent: ${new Date().toLocaleString()}
    
    This is an automated message from the ComplyArk system.
    `;
    
    // Send the email
    console.log('Sending test email...');
    const result = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: recipient,
      subject: 'ComplyArk Email System Test',
      text: text,
      html: html,
      priority: 'high'
    });
    
    console.log('Email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(result));
    
  } catch (error) {
    console.error('Error sending email:', error);
  } finally {
    process.exit(0);
  }
}

// Run the function
sendEmail();