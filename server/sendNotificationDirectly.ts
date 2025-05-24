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

const RECIPIENT_EMAIL = process.argv[2] || 'rahulvs07@gmail.com';

async function sendEmail() {
  console.log('======================================');
  console.log('  DIRECT EMAIL SENDER - ONE TIME USE  ');
  console.log('======================================');
  console.log('Starting email send process...');
  console.log(`Recipient: ${RECIPIENT_EMAIL}`);
  
  try {
    // Get email settings directly from database
    const settings = await db.select().from(emailSettings).limit(1);
    
    if (settings.length === 0) {
      console.error('❌ ERROR: No email settings found in database');
      return;
    }
    
    const config = settings[0];
    console.log('\n📧 Using email settings from database:');
    console.log(`- Provider: ${config.provider}`);
    console.log(`- SMTP Host: ${config.smtpHost}`);
    console.log(`- SMTP Port: ${config.smtpPort}`);
    console.log(`- From Email: ${config.fromEmail}`);
    console.log(`- Username: ${config.smtpUsername}`);
    
    // Create transport
    console.log('\n📧 Creating transport...');
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: Number(config.smtpPort),
      secure: Number(config.smtpPort) === 465,
      auth: {
        user: config.smtpUsername,
        pass: config.smtpPassword,
      },
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates
      },
      debug: true,
      logger: true
    } as any);
    
    // Verify connection
    console.log('\n📧 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');
    
    // Send test email
    console.log('\n📧 Sending notification email...');
    
    const mailOptions = {
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: RECIPIENT_EMAIL,
      subject: 'ComplyArk DPR Notification - DIRECT SENDER',
      text: `
Hello,

This is a direct notification email from ComplyArk.
This email was sent using a special direct sender that bypasses all test mode flags.

This confirms that the email system is working correctly with your SMTP settings.

Request Details:
- Request ID: TEST-123
- Request Type: Access
- Status: Submitted
- Due Date: 6/10/2025

Regards,
ComplyArk System
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .details { background-color: #eaeaea; padding: 15px; margin: 15px 0; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>ComplyArk Direct Notification</h2>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>This is a direct notification email from ComplyArk.</p>
      <p>This email was sent using a special direct sender that bypasses all test mode flags.</p>
      <p>This confirms that the email system is working correctly with your SMTP settings.</p>
      <div class="details">
        <p><strong>Request ID:</strong> TEST-123</p>
        <p><strong>Request Type:</strong> Access</p>
        <p><strong>Status:</strong> Submitted</p>
        <p><strong>Due Date:</strong> 6/10/2025</p>
      </div>
    </div>
    <div class="footer">
      <p>This is an automated message from the ComplyArk system.</p>
      <p>&copy; ComplyArk - Data Protection and Privacy Management</p>
    </div>
  </div>
</body>
</html>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    
    // Now check the testmode global setting
    const testModeResult = await db.query.rawQuery(
      'SELECT setting_value FROM "systemSettings" WHERE setting_name = $1',
      ['testMode']
    );
    
    console.log('\n📊 System Settings Check:');
    if (testModeResult.rowCount > 0) {
      const testMode = testModeResult.rows[0].setting_value;
      console.log(`- Test Mode: ${testMode}`);
      
      if (testMode === 'true') {
        console.log('❗ NOTICE: Test Mode is currently enabled. This script bypasses that setting.');
        console.log('❗ To permanently disable Test Mode, run:');
        console.log('UPDATE "systemSettings" SET setting_value = \'false\' WHERE setting_name = \'testMode\';');
      }
    } else {
      console.log('- Test Mode: Not configured in database');
    }
    
    console.log('\n✅ Direct email sending complete.');
  } catch (error) {
    console.error('❌ Error during email sending:', error);
  }
}

// Run the email sender
sendEmail().catch(console.error);