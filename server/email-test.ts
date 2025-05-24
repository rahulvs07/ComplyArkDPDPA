import nodemailer from 'nodemailer';
import { db } from './db';
import { emailSettings } from '@shared/schema';

async function testEmailConnection() {
  console.log('Starting email connection test');
  
  try {
    // Get email settings from database
    const settings = await db.select().from(emailSettings).limit(1);
    
    if (settings.length === 0) {
      console.error('ERROR: No email settings found in database');
      return;
    }
    
    const config = settings[0];
    console.log('Found email settings:');
    console.log('- Provider:', config.provider);
    console.log('- SMTP Host:', config.smtpHost);
    console.log('- SMTP Port:', config.smtpPort);
    console.log('- SMTP Username:', config.smtpUsername);
    console.log('- From Email:', config.fromEmail);
    console.log('- From Name:', config.fromName);
    
    // Configure nodemailer transport
    console.log('\nCreating transport with these settings...');
    const transportOptions = {
      host: config.smtpHost || '',
      port: Number(config.smtpPort) || 587,
      secure: false,
      auth: {
        user: config.smtpUsername || '',
        pass: config.smtpPassword || '',
      },
      tls: {
        rejectUnauthorized: false
      },
      debug: true, // Enable debug output
      logger: true  // Log information into the console
    };
    
    console.log('Transport options:', JSON.stringify(transportOptions, (key, value) => 
      key === 'pass' ? '******' : value, 2));
    
    // Create transporter
    const transporter = nodemailer.createTransport(transportOptions as any);
    
    // Verify connection
    console.log('\nVerifying SMTP connection...');
    try {
      const verification = await transporter.verify();
      console.log('SMTP connection verification result:', verification);
      console.log('✅ SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('❌ SMTP connection verification failed:');
      console.error(verifyError);
      return;
    }
    
    // Send test email
    console.log('\nSending test email...');
    const testEmail = 'rahulvs07@gmail.com'; // Replace with your email
    
    try {
      const result = await transporter.sendMail({
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to: testEmail,
        subject: 'ComplyArk Test Email',
        text: 'This is a test email to verify email delivery.',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #4F46E5; color: white; padding: 20px; text-align: center;">
              <h2>ComplyArk Email Test</h2>
            </div>
            <div style="padding: 20px; background-color: #f9f9f9;">
              <p>Hello,</p>
              <p>This is a test email to verify that your email delivery system is working correctly.</p>
              <p>If you received this email, your SMTP configuration is working!</p>
            </div>
          </div>
        `,
      });
      
      console.log('✅ Test email sent successfully!');
      console.log('Message ID:', result.messageId);
      console.log('Preview URL:', nodemailer.getTestMessageUrl(result));
    } catch (sendError) {
      console.error('❌ Failed to send test email:');
      console.error(sendError);
    }
  } catch (error) {
    console.error('Error during email test:', error);
  }
}

testEmailConnection().catch(console.error);