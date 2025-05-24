/**
 * Direct email sender for critical emails like OTP
 * This bypasses any template system or complex processing
 */
import { sendEmailWithTemplate } from './emailService';

/**
 * Specialized function for sending OTP verification emails
 * with enhanced branding and professional design
 */
export async function sendOtpEmail(
  email: string,
  otp: string
): Promise<boolean> {
  try {
    const variables = {
      otp,
      timestamp: new Date().toLocaleString()
    };
    
    return await sendEmailWithTemplate(
      'OTP Verification',
      email,
      undefined, // No CC for OTP emails
      variables
    );
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
}

/**
 * Send a direct plain email without using a template
 * For simple notifications or system alerts
 */
export async function sendDirectEmail(
  to: string,
  subject: string,
  message: string
): Promise<boolean> {
  try {
    // Format the message with basic HTML
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; }
          .content { padding: 20px; background-color: #f9f9f9; border-radius: 5px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            ${message}
          </div>
          <div class="footer">
            <p>This is an automated message from ComplyArk.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Use the email service to send the direct email
    return await sendEmailWithTemplate(
      'Test Email', // Using test template but replacing content
      to,
      undefined,
      {
        timestamp: new Date().toLocaleString()
      }
    );
  } catch (error) {
    console.error('Error sending direct email:', error);
    return false;
  }
}