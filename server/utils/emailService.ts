/**
 * Email Service Utility
 * 
 * This module provides functionality for sending emails in the application.
 * Currently uses console logging for development but can easily be upgraded
 * to SendGrid or another email provider in the future.
 */

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

/**
 * Send an email (development version - logs to console)
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Default sender address
    const from = options.from || 'noreply@complyark.com';
    
    // Log the email details to the console for development
    console.log('\n----- EMAIL SENT -----');
    console.log(`From: ${from}`);
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    
    if (options.text) {
      console.log('\nText Content:');
      console.log(options.text);
    }
    
    if (options.html) {
      console.log('\nHTML Content:');
      console.log(options.html);
    }
    
    console.log('----- END EMAIL -----\n');
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Generate OTP Email Template
 */
export function generateOTPEmailTemplate(
  otp: string,
  organizationName: string,
  expiresInMinutes: number = 30
): { text: string; html: string } {
  // Plain text version
  const text = `
ComplyArk Verification Code

Your verification code for ${organizationName} is: ${otp}

This code will expire in ${expiresInMinutes} minutes.

Please enter this code in the verification page to continue with your request.

This is an automated message, please do not reply.
`;

  // HTML version
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #0F3460;
      color: #ffffff;
      padding: 20px;
      text-align: center;
    }
    .content {
      padding: 20px;
      background-color: #f7f7f7;
    }
    .code {
      font-size: 24px;
      font-weight: bold;
      text-align: center;
      letter-spacing: 3px;
      margin: 20px 0;
      padding: 15px;
      background-color: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 5px;
    }
    .footer {
      font-size: 12px;
      color: #777;
      text-align: center;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ComplyArk Verification</h1>
    </div>
    <div class="content">
      <h2>Your Verification Code</h2>
      <p>You requested to access the ${organizationName} data protection request form. Please use the following code to verify your email address:</p>
      <div class="code">${otp}</div>
      <p>This code will expire in ${expiresInMinutes} minutes.</p>
      <p>If you did not request this code, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p>This is an automated message from ComplyArk. Please do not reply to this email.</p>
      <p>&copy; ${new Date().getFullYear()} ComplyArk. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

  return { text, html };
}

/**
 * Generate Request Confirmation Email Template
 */
export function generateRequestConfirmationTemplate(
  reference: string | number,
  requestType: string,
  organizationName: string,
  firstName: string,
  lastName: string
): { text: string; html: string } {
  // Plain text version
  const text = `
ComplyArk - Request Confirmation

Dear ${firstName} ${lastName},

Your ${requestType} has been successfully submitted to ${organizationName}.

Reference Number: ${reference}

Please save this reference number as you will need it to check the status of your request.

You can check the status of your request by visiting our request status page and entering your reference number and email address.

Thank you for using ComplyArk.

This is an automated message, please do not reply.
`;

  // HTML version
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Request Confirmation</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #0F3460;
      color: #ffffff;
      padding: 20px;
      text-align: center;
    }
    .content {
      padding: 20px;
      background-color: #f7f7f7;
    }
    .reference {
      font-size: 18px;
      font-weight: bold;
      text-align: center;
      margin: 20px 0;
      padding: 15px;
      background-color: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 5px;
    }
    .footer {
      font-size: 12px;
      color: #777;
      text-align: center;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }
    .button {
      display: inline-block;
      background-color: #2E77AE;
      color: #ffffff;
      padding: 10px 20px;
      margin: 20px 0;
      text-decoration: none;
      border-radius: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Request Confirmation</h1>
    </div>
    <div class="content">
      <h2>Your Request Has Been Submitted</h2>
      <p>Dear ${firstName} ${lastName},</p>
      <p>Your ${requestType} has been successfully submitted to <strong>${organizationName}</strong>.</p>
      <p>Please save your reference number:</p>
      <div class="reference">${reference}</div>
      <p>You will need this reference number to check the status of your request.</p>
      <p>You can check the status of your request at any time by visiting our request status page and entering your reference number and email address.</p>
      <center><a href="#" class="button">Check Request Status</a></center>
    </div>
    <div class="footer">
      <p>This is an automated message from ComplyArk. Please do not reply to this email.</p>
      <p>&copy; ${new Date().getFullYear()} ComplyArk. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

  return { text, html };
}