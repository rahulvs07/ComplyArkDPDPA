-- ComplyArk DPDPA Management Platform - MSSQL Master Data Insertion
-- Script 004: Insert Master Data (Industries, Request Statuses, Email Templates)

USE ComplyArkDB;
GO

-- Insert Industries
SET IDENTITY_INSERT industries ON;
INSERT INTO industries (industryId, industryName) VALUES 
(1, 'Technology'),
(2, 'Healthcare'),
(3, 'Finance'),
(4, 'Education'),
(5, 'Manufacturing'),
(6, 'Retail'),
(7, 'Government'),
(8, 'Non-Profit'),
(9, 'Telecommunications'),
(10, 'Energy');
SET IDENTITY_INSERT industries OFF;

-- Insert Request Statuses (matching current system)
SET IDENTITY_INSERT request_statuses ON;
INSERT INTO request_statuses (statusId, statusName, slaDays, isActive) VALUES 
(35, 'Submitted', 30, 1),
(36, 'In Progress', 30, 1),
(37, 'Awaiting Information', 30, 1),
(38, 'Under Review', 30, 1),
(39, 'Escalated', 15, 1),
(40, 'Closed', 0, 1),
(41, 'Rejected', 0, 1),
(42, 'On Hold', 30, 1);
SET IDENTITY_INSERT request_statuses OFF;

-- Insert Email Templates
SET IDENTITY_INSERT email_templates ON;
INSERT INTO email_templates (templateId, templateName, subject, htmlBody, textBody, templateType, isActive) VALUES 
(1, 'OTP Verification', 'ComplyArk - OTP Verification Code', 
'<html><body><div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #2563eb; margin: 0;">ComplyArk</h1><p style="color: #666; margin: 5px 0;">DPDPA Compliance Management</p></div><h2 style="color: #333;">OTP Verification Required</h2><p>Your OTP verification code is:</p><div style="background: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 6px;"><span style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 5px;">{{OTP}}</span></div><p style="color: #666; font-size: 14px;">This code will expire in 10 minutes. Please do not share this code with anyone.</p><p style="color: #666; font-size: 14px;">If you did not request this verification, please ignore this email.</p></div></body></html>',
'Your OTP verification code is: {{OTP}}. This code will expire in 10 minutes.',
'otp', 1),

(2, 'Request Notification', 'ComplyArk - New Request Notification', 
'<html><body><div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><h2>New Request Submitted</h2><p>A new {{REQUEST_TYPE}} request has been submitted.</p><p><strong>Request ID:</strong> {{REQUEST_ID}}</p><p><strong>Submitted by:</strong> {{SUBMITTER_NAME}}</p><p><strong>Email:</strong> {{SUBMITTER_EMAIL}}</p><p>Please review and process this request.</p></div></body></html>',
'New {{REQUEST_TYPE}} request submitted. Request ID: {{REQUEST_ID}} by {{SUBMITTER_NAME}} ({{SUBMITTER_EMAIL}})',
'notification', 1),

(3, 'Status Update', 'ComplyArk - Request Status Update', 
'<html><body><div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><h2>Request Status Update</h2><p>Your request status has been updated.</p><p><strong>Request ID:</strong> {{REQUEST_ID}}</p><p><strong>New Status:</strong> {{NEW_STATUS}}</p><p><strong>Comments:</strong> {{COMMENTS}}</p></div></body></html>',
'Your request {{REQUEST_ID}} status has been updated to {{NEW_STATUS}}. Comments: {{COMMENTS}}',
'notification', 1);
SET IDENTITY_INSERT email_templates OFF;

-- Insert Templates for privacy notices
SET IDENTITY_INSERT templates ON;
INSERT INTO templates (templateId, templateName, templateBody, industryId, templatePath) VALUES 
(1, 'Technology Privacy Notice', 'This privacy notice describes how we collect, use, and protect your personal data in accordance with the Digital Personal Data Protection Act, 2023...', 1, '/templates/tech-privacy-notice.docx'),
(2, 'Healthcare Privacy Notice', 'This privacy notice outlines our data protection practices for patient information and medical records...', 2, '/templates/healthcare-privacy-notice.docx'),
(3, 'Financial Services Privacy Notice', 'This notice explains how we handle your financial and personal information in compliance with regulatory requirements...', 3, '/templates/finance-privacy-notice.docx'),
(4, 'Educational Privacy Notice', 'This privacy notice describes how we collect and use student and staff personal data...', 4, '/templates/education-privacy-notice.docx');
SET IDENTITY_INSERT templates OFF;

PRINT 'Master data inserted successfully!';
GO