-- ComplyArk DPDPA Management Platform - Sample Data Insertion Script
-- Execute this script after running 01-create-schema.sql

USE ComplyArkDB;
GO

-- Insert Industries
INSERT INTO industries (industryName) VALUES 
('Technology'),
('Healthcare'),
('Finance'),
('Education'),
('Manufacturing'),
('Retail'),
('Government'),
('Non-Profit');

-- Insert Organizations
INSERT INTO organizations (businessName, businessAddress, industryId, contactPersonName, contactEmail, contactPhone, noOfUsers, remarks, requestPageUrlToken) VALUES 
('TechCorp Solutions', '123 Tech Street, Bangalore, Karnataka 560001', 1, 'Rajesh Kumar', 'rajesh@techcorp.com', '+91-9876543210', 25, 'Leading software development company', 'tc_2024_token_001'),
('MediCare Hospital', '456 Health Avenue, Mumbai, Maharashtra 400001', 2, 'Dr. Priya Sharma', 'priya@medicare.com', '+91-9876543211', 150, 'Multi-specialty hospital', 'mc_2024_token_002'),
('FinanceFirst Bank', '789 Money Lane, Delhi, Delhi 110001', 3, 'Amit Patel', 'amit@financefirst.com', '+91-9876543212', 500, 'Private sector bank', 'ff_2024_token_003'),
('EduTech Institute', '321 Learning Road, Pune, Maharashtra 411001', 4, 'Dr. Sunita Reddy', 'sunita@edutech.com', '+91-9876543213', 75, 'Educational technology institute', 'et_2024_token_004');

-- Insert Request Statuses
INSERT INTO request_statuses (statusName, description, isActive) VALUES 
('Submitted', 'Request has been submitted and is pending review', 1),
('In Progress', 'Request is currently being processed', 1),
('Awaiting Information', 'Additional information required from the requester', 1),
('Under Review', 'Request is under management review', 1),
('Escalated', 'Request has been escalated to senior management', 1),
('Closed', 'Request has been completed and closed', 1),
('Rejected', 'Request has been rejected', 1),
('On Hold', 'Request processing is temporarily on hold', 1);

-- Insert Users
INSERT INTO users (username, password, firstName, lastName, email, phone, role, organizationId, isActive, canEdit, canDelete) VALUES 
-- Super Admin (no organization)
('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMye.32POc/Wt7rKp8jXOzo2Ej8j/rGVk9i', 'System', 'Administrator', 'admin@complyark.com', '+91-9000000000', 'admin', 1, 1, 1, 1),

-- TechCorp Solutions Users (Organization ID: 1)
('techcorp_admin', '$2a$10$N9qo8uLOickgx2ZMRZoMye.32POc/Wt7rKp8jXOzo2Ej8j/rGVk9i', 'Rajesh', 'Kumar', 'rajesh@techcorp.com', '+91-9876543210', 'admin', 1, 1, 1, 0),
('techcorp_user1', '$2a$10$N9qo8uLOickgx2ZMRZoMye.32POc/Wt7rKp8jXOzo2Ej8j/rGVk9i', 'Anita', 'Singh', 'anita@techcorp.com', '+91-9876543220', 'user', 1, 1, 0, 0),
('techcorp_user2', '$2a$10$N9qo8uLOickgx2ZMRZoMye.32POc/Wt7rKp8jXOzo2Ej8j/rGVk9i', 'Vikram', 'Shah', 'vikram@techcorp.com', '+91-9876543221', 'user', 1, 1, 0, 0),

-- MediCare Hospital Users (Organization ID: 2)
('medicare_admin', '$2a$10$N9qo8uLOickgx2ZMRZoMye.32POc/Wt7rKp8jXOzo2Ej8j/rGVk9i', 'Priya', 'Sharma', 'priya@medicare.com', '+91-9876543211', 'admin', 2, 1, 1, 0),
('medicare_user1', '$2a$10$N9qo8uLOickgx2ZMRZoMye.32POc/Wt7rKp8jXOzo2Ej8j/rGVk9i', 'Rohit', 'Gupta', 'rohit@medicare.com', '+91-9876543230', 'user', 2, 1, 0, 0),

-- FinanceFirst Bank Users (Organization ID: 3)
('finance_admin', '$2a$10$N9qo8uLOickgx2ZMRZoMye.32POc/Wt7rKp8jXOzo2Ej8j/rGVk9i', 'Amit', 'Patel', 'amit@financefirst.com', '+91-9876543212', 'admin', 3, 1, 1, 0),
('finance_user1', '$2a$10$N9qo8uLOickgx2ZMRZoMye.32POc/Wt7rKp8jXOzo2Ej8j/rGVk9i', 'Neha', 'Agarwal', 'neha@financefirst.com', '+91-9876543240', 'user', 3, 1, 0, 0),

-- EduTech Institute Users (Organization ID: 4)
('edutech_admin', '$2a$10$N9qo8uLOickgx2ZMRZoMye.32POc/Wt7rKp8jXOzo2Ej8j/rGVk9i', 'Sunita', 'Reddy', 'sunita@edutech.com', '+91-9876543213', 'admin', 4, 1, 1, 0),
('edutech_user1', '$2a$10$N9qo8uLOickgx2ZMRZoMye.32POc/Wt7rKp8jXOzo2Ej8j/rGVk9i', 'Kiran', 'Joshi', 'kiran@edutech.com', '+91-9876543250', 'user', 4, 1, 0, 0);

-- Insert Templates
INSERT INTO templates (templateName, templateBody, industryId, templatePath) VALUES 
('Technology Privacy Notice', 'This privacy notice describes how we collect, use, and protect your personal data in accordance with the Digital Personal Data Protection Act, 2023...', 1, '/templates/tech-privacy-notice.docx'),
('Healthcare Privacy Notice', 'This privacy notice outlines our data protection practices for patient information and medical records...', 2, '/templates/healthcare-privacy-notice.docx'),
('Financial Services Privacy Notice', 'This notice explains how we handle your financial and personal information in compliance with regulatory requirements...', 3, '/templates/finance-privacy-notice.docx'),
('Educational Privacy Notice', 'This privacy notice describes how we collect and use student and staff personal data...', 4, '/templates/education-privacy-notice.docx');

-- Insert Sample DPR Requests
INSERT INTO dpr_requests (organizationId, firstName, lastName, email, phone, requestType, requestComment, statusId, assignedToUserId, completionDate) VALUES 
(1, 'Ravi', 'Sharma', 'ravi.sharma@email.com', '+91-9876543300', 'Access', 'I would like to access my personal data that your company has collected.', 1, 3, '2024-06-15'),
(1, 'Meera', 'Patel', 'meera.patel@email.com', '+91-9876543301', 'Correction', 'There is an error in my contact information. Please correct it.', 2, 3, '2024-06-20'),
(2, 'Arjun', 'Singh', 'arjun.singh@email.com', '+91-9876543302', 'Erasure', 'I want to delete my account and all associated personal data.', 1, 6, '2024-06-25'),
(3, 'Kavya', 'Reddy', 'kavya.reddy@email.com', '+91-9876543303', 'Access', 'Please provide me with a copy of all my personal data you have on file.', 3, 8, '2024-06-30'),
(4, 'Sanjay', 'Kumar', 'sanjay.kumar@email.com', '+91-9876543304', 'Nomination', 'I would like to nominate my spouse as my data fiduciary.', 2, 10, '2024-07-05');

-- Insert Sample Grievances
INSERT INTO grievances (organizationId, firstName, lastName, email, phone, statusId, grievanceComment, assignedToUserId, completionDate) VALUES 
(1, 'Deepika', 'Nair', 'deepika.nair@email.com', '+91-9876543400', 1, 'I have not received a response to my data access request submitted 30 days ago.', 3, '2024-06-18'),
(2, 'Rahul', 'Jain', 'rahul.jain@email.com', '+91-9876543401', 2, 'My personal data was shared without my consent. I need this to be investigated.', 6, '2024-06-22'),
(3, 'Pooja', 'Agarwal', 'pooja.agarwal@email.com', '+91-9876543402', 1, 'The correction I requested was not implemented properly. My data is still incorrect.', 8, '2024-06-27'),
(4, 'Manish', 'Gupta', 'manish.gupta@email.com', '+91-9876543403', 3, 'I believe there has been a data breach affecting my personal information.', 10, '2024-07-02');

-- Insert Email Templates
INSERT INTO email_templates (templateName, subject, htmlBody, textBody, templateType, isActive) VALUES 
('OTP Verification', 'ComplyArk - OTP Verification Code', 
'<html><body><div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #2563eb; margin: 0;">ComplyArk</h1><p style="color: #666; margin: 5px 0;">DPDPA Compliance Management</p></div><h2 style="color: #333;">OTP Verification Required</h2><p>Your OTP verification code is:</p><div style="background: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 6px;"><span style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 5px;">{{OTP}}</span></div><p style="color: #666; font-size: 14px;">This code will expire in 10 minutes. Please do not share this code with anyone.</p><p style="color: #666; font-size: 14px;">If you did not request this verification, please ignore this email.</p></div></body></html>',
'Your OTP verification code is: {{OTP}}. This code will expire in 10 minutes.',
'otp', 1),

('Request Notification', 'ComplyArk - New Request Notification', 
'<html><body><div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><h2>New Request Submitted</h2><p>A new {{REQUEST_TYPE}} request has been submitted.</p><p><strong>Request ID:</strong> {{REQUEST_ID}}</p><p><strong>Submitted by:</strong> {{SUBMITTER_NAME}}</p><p><strong>Email:</strong> {{SUBMITTER_EMAIL}}</p><p>Please review and process this request.</p></div></body></html>',
'New {{REQUEST_TYPE}} request submitted. Request ID: {{REQUEST_ID}} by {{SUBMITTER_NAME}} ({{SUBMITTER_EMAIL}})',
'notification', 1),

('Status Update', 'ComplyArk - Request Status Update', 
'<html><body><div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><h2>Request Status Update</h2><p>Your request status has been updated.</p><p><strong>Request ID:</strong> {{REQUEST_ID}}</p><p><strong>New Status:</strong> {{NEW_STATUS}}</p><p><strong>Comments:</strong> {{COMMENTS}}</p></div></body></html>',
'Your request {{REQUEST_ID}} status has been updated to {{NEW_STATUS}}. Comments: {{COMMENTS}}',
'notification', 1);

-- Insert Sample Notifications
INSERT INTO notifications (userId, organizationId, title, message, type, isRead) VALUES 
(3, 1, 'New DPR Request', 'A new data access request has been submitted by Ravi Sharma.', 'info', 0),
(3, 1, 'Request Overdue', 'Request #1 is approaching its completion deadline.', 'warning', 0),
(6, 2, 'New Grievance', 'A new grievance has been submitted by Rahul Jain.', 'info', 1),
(8, 3, 'System Update', 'The compliance management system has been updated with new features.', 'success', 0),
(10, 4, 'Training Reminder', 'Please complete the data protection training module.', 'info', 0);

-- Insert Sample Exception Logs
INSERT INTO exception_logs (pageName, functionName, errorMessage, userId, additionalDetails, severity, isResolved) VALUES 
('DPR Controller', 'updateDPRequest', 'Failed to update request status due to validation error', 3, '{"requestId": 1, "error": "Invalid status transition"}', 'warning', 1),
('Grievance Controller', 'createGrievance', 'Database connection timeout', NULL, '{"timeout": 30000, "query": "INSERT INTO grievances"}', 'error', 0),
('User Controller', 'authenticateUser', 'Invalid login attempt detected', NULL, '{"username": "unknown_user", "ip": "192.168.1.100"}', 'warning', 1),
('Email Service', 'sendOtpEmail', 'SMTP connection failed', 5, '{"smtp_host": "smtp.gmail.com", "error": "Authentication failed"}', 'error', 0);

-- Insert Sample Notices
INSERT INTO notices (organizationId, templateId, title, content, createdBy) VALUES 
(1, 1, 'TechCorp Privacy Notice', 'This privacy notice explains how TechCorp Solutions collects, uses, and protects your personal data...', 2),
(2, 2, 'MediCare Patient Privacy Notice', 'This notice describes how MediCare Hospital handles patient information and medical records...', 5),
(3, 3, 'FinanceFirst Privacy Policy', 'This privacy policy outlines how FinanceFirst Bank processes customer financial data...', 7),
(4, 4, 'EduTech Student Data Notice', 'This notice explains how EduTech Institute collects and uses student personal information...', 9);

-- Insert Sample Translated Notices
INSERT INTO translated_notices (noticeId, languageCode, languageName, translatedTitle, translatedContent) VALUES 
(1, 'hi_Deva', 'Hindi', 'टेककॉर्प गोपनीयता सूचना', 'यह गोपनीयता सूचना बताती है कि टेककॉर्प सॉल्यूशंस आपके व्यक्तिगत डेटा को कैसे एकत्र, उपयोग और सुरक्षित करता है...'),
(1, 'ta_Taml', 'Tamil', 'டெக்கார்ப் தனியுரிமை அறிவிப்பு', 'இந்த தனியுரிமை அறிவிப்பு டெக்கார்ப் சொல்யூஷன்ஸ் உங்கள் தனிப்பட்ட தரவை எப்படி சேகரித்து, பயன்படுத்தி, பாதுகாக்கிறது என்பதை விளக்குகிறது...'),
(2, 'hi_Deva', 'Hindi', 'मेडिकेयर रोगी गोपनीयता सूचना', 'यह सूचना बताती है कि मेडिकेयर अस्पताल रोगी की जानकारी और चिकित्सा रिकॉर्ड को कैसे संभालता है...'),
(3, 'te_Telu', 'Telugu', 'ఫైనాన్స్‌ఫస్ట్ గోప్యతా విధానం', 'ఈ గోప్యతా విధానం ఫైనాన్స్‌ఫస్ట్ బ్యాంక్ కస్టమర్ ఆర్థిక డేటాను ఎలా ప్రాసెస్ చేస్తుందో వివరిస్తుంది...');

PRINT 'Sample data inserted successfully!';
PRINT 'You can now log in with the following credentials:';
PRINT 'Super Admin - Username: admin, Password: admin123';
PRINT 'Organization Admins - Username: [org]_admin, Password: admin123';
PRINT 'Regular Users - Username: [org]_user1, Password: user123';
GO