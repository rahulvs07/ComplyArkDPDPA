-- ComplyArk DPDPA Management Platform - MSSQL Sample Data Insertion
-- Script 009: Insert Sample Data (DP Requests, Grievances, etc.)

USE ComplyArkDB;
GO

-- Insert Sample DP Requests (matching current system with request ID 59)
SET IDENTITY_INSERT dp_requests ON;
INSERT INTO dp_requests (requestId, organizationId, firstName, lastName, email, phone, requestType, requestComment, statusId, assignedToUserId, createdAt, lastUpdatedAt, completionDate) VALUES 
(59, 33, 'Admin', 'Administrator', 'admin@abc.com', '123-456-7890', 'Correction', 'jhgfjh', 38, 109, '2024-05-24 07:23:47.384', '2025-05-31 14:13:25.328', '2025-06-08'),
(60, 33, 'John', 'Doe', 'john.doe@techcorp.com', '987-654-3210', 'Access', 'Request access to my personal data', 35, 108, '2025-05-30 10:15:30.000', '2025-05-30 10:15:30.000', NULL),
(61, 34, 'Jane', 'Smith', 'jane.smith@medicare.com', '555-123-4567', 'Erasure', 'Please delete my account and all personal data', 36, 111, '2025-05-29 14:20:15.000', '2025-05-30 09:30:45.000', NULL),
(62, 35, 'Robert', 'Johnson', 'robert.j@financefirst.com', '444-555-6666', 'Portability', 'Request data export in machine readable format', 37, 113, '2025-05-28 16:45:22.000', '2025-05-29 11:20:10.000', NULL);
SET IDENTITY_INSERT dp_requests OFF;

-- Insert Sample DPR History (matching the working updates)
SET IDENTITY_INSERT dpr_request_history ON;
INSERT INTO dpr_request_history (historyId, requestId, changedByUserId, oldStatusId, newStatusId, oldAssignedToUserId, newAssignedToUserId, comments, changeDate) VALUES 
(67, 59, 108, 36, 37, 108, 108, NULL, '2025-05-31 14:13:01.800'),
(68, 59, 108, 37, 37, 108, 109, NULL, '2025-05-31 14:13:14.321'),
(69, 59, 108, 37, 38, 109, 109, NULL, '2025-05-31 14:13:25.402'),
(70, 60, 108, NULL, 35, NULL, 108, 'Request submitted', '2025-05-30 10:15:30.000'),
(71, 61, 111, NULL, 35, NULL, 111, 'Request submitted', '2025-05-29 14:20:15.000'),
(72, 61, 111, 35, 36, 111, 111, 'Started processing erasure request', '2025-05-30 09:30:45.000'),
(73, 62, 113, NULL, 35, NULL, 113, 'Request submitted', '2025-05-28 16:45:22.000'),
(74, 62, 113, 35, 37, 113, 113, 'Awaiting additional information from data subject', '2025-05-29 11:20:10.000');
SET IDENTITY_INSERT dpr_request_history OFF;

-- Insert Sample Grievances
SET IDENTITY_INSERT grievances ON;
INSERT INTO grievances (grievanceId, organizationId, firstName, lastName, email, phone, statusId, grievanceComment, assignedToUserId, createdAt, lastUpdatedAt) VALUES 
(1, 33, 'Michael', 'Brown', 'michael.brown@techcorp.com', '333-222-1111', 35, 'My data access request was not processed within the stipulated time frame', 108, '2025-05-25 11:30:00.000', '2025-05-25 11:30:00.000'),
(2, 34, 'Sarah', 'Davis', 'sarah.davis@medicare.com', '666-777-8888', 36, 'Received incorrect information in response to my data portability request', 111, '2025-05-26 13:45:15.000', '2025-05-27 10:20:30.000'),
(3, 35, 'David', 'Wilson', 'david.wilson@financefirst.com', '999-888-7777', 37, 'Data was not erased completely despite confirmation', 113, '2025-05-27 09:15:45.000', '2025-05-28 14:30:20.000');
SET IDENTITY_INSERT grievances OFF;

-- Insert Sample Grievance History
SET IDENTITY_INSERT grievance_history ON;
INSERT INTO grievance_history (historyId, grievanceId, changedByUserId, oldStatusId, newStatusId, oldAssignedToUserId, newAssignedToUserId, comments, changeDate) VALUES 
(1, 1, 108, NULL, 35, NULL, 108, 'Grievance submitted', '2025-05-25 11:30:00.000'),
(2, 2, 111, NULL, 35, NULL, 111, 'Grievance submitted', '2025-05-26 13:45:15.000'),
(3, 2, 111, 35, 36, 111, 111, 'Started investigation', '2025-05-27 10:20:30.000'),
(4, 3, 113, NULL, 35, NULL, 113, 'Grievance submitted', '2025-05-27 09:15:45.000'),
(5, 3, 113, 35, 37, 113, 113, 'Awaiting additional information', '2025-05-28 14:30:20.000');
SET IDENTITY_INSERT grievance_history OFF;

-- Insert Sample Notifications (matching the current system with notification ID 7)
SET IDENTITY_INSERT notifications ON;
INSERT INTO notifications (notificationId, userId, organizationId, title, message, type, isRead, createdAt) VALUES 
(7, 108, 33, 'New DP Request Assigned', 'A new Data Protection request #60 has been assigned to you', 'info', 0, '2025-05-30 10:15:30.000'),
(8, 109, 33, 'Request Status Updated', 'Request #59 status has been updated to Under Review', 'info', 1, '2025-05-31 14:13:25.000'),
(9, 111, 34, 'New Grievance Assigned', 'A new grievance #2 has been assigned to you for investigation', 'warning', 0, '2025-05-26 13:45:15.000'),
(10, 113, 35, 'Escalated Request', 'Request #62 requires your immediate attention', 'error', 0, '2025-05-29 11:20:10.000'),
(11, 108, 33, 'System Maintenance', 'Scheduled maintenance window: June 1, 2025 2:00 AM - 4:00 AM', 'info', 1, '2025-05-28 09:00:00.000');
SET IDENTITY_INSERT notifications OFF;

-- Insert Sample Compliance Documents
SET IDENTITY_INSERT compliance_documents ON;
INSERT INTO compliance_documents (documentId, organizationId, fileName, filePath, fileSize, mimeType, uploadedBy, uploadedAt, description) VALUES 
(1, 33, 'Privacy Policy v2.1.pdf', '/uploads/33/privacy-policy-v2.1.pdf', 245760, 'application/pdf', 108, '2025-05-20 14:30:00.000', 'Updated privacy policy compliant with DPDPA 2023'),
(2, 33, 'Data Processing Agreement.docx', '/uploads/33/dpa-agreement.docx', 98304, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 108, '2025-05-21 10:15:00.000', 'Third-party data processing agreement'),
(3, 34, 'Patient Data Security Policy.pdf', '/uploads/34/patient-data-security.pdf', 512000, 'application/pdf', 111, '2025-05-22 16:45:00.000', 'Healthcare data security and privacy policies'),
(4, 35, 'Financial Data Retention Policy.pdf', '/uploads/35/financial-data-retention.pdf', 189440, 'application/pdf', 113, '2025-05-23 11:20:00.000', 'Data retention schedule for financial records');
SET IDENTITY_INSERT compliance_documents OFF;

-- Insert Sample Notices
SET IDENTITY_INSERT notices ON;
INSERT INTO notices (noticeId, organizationId, templateId, noticeName, noticeBody, createdBy, createdOn, noticeType, version) VALUES 
(1, 33, 1, 'TechCorp Privacy Notice 2025', 'This privacy notice describes how TechCorp Solutions Ltd collects, uses, and protects your personal data...', 108, '2025-05-20 09:00:00.000', 'Privacy Notice', 'v2.1'),
(2, 34, 2, 'MediCare Patient Privacy Notice', 'This notice outlines how MediCare Hospital Chain handles patient information and medical records...', 111, '2025-05-21 11:30:00.000', 'Healthcare Privacy Notice', 'v1.5'),
(3, 35, 3, 'FinanceFirst Customer Privacy Notice', 'This notice explains how FinanceFirst Bank processes customer financial and personal information...', 113, '2025-05-22 14:15:00.000', 'Financial Privacy Notice', 'v3.0');
SET IDENTITY_INSERT notices OFF;

-- Insert Sample Translated Notices
SET IDENTITY_INSERT translated_notices ON;
INSERT INTO translated_notices (id, organizationId, noticeId, createdOn, language, translatedBody, filePath) VALUES 
(1, 33, 1, '2025-05-20 15:30:00.000', 'hin_Deva', 'यह गोपनीयता सूचना बताती है कि टेककॉर्प सॉल्यूशंस लिमिटेड आपके व्यक्तिगत डेटा को कैसे एकत्रित, उपयोग और सुरक्षित करता है...', '/notices/translated/techcorp-privacy-hindi.pdf'),
(2, 33, 1, '2025-05-20 16:00:00.000', 'tam_Taml', 'இந்த தனியுரிமை அறிவிப்பு டெக்கார்ப் சொல்யூஷன்ஸ் லிமிடெட் உங்கள் தனிப்பட்ட தரவை எவ்வாறு சேகரிக்கிறது, பயன்படுத்துகிறது மற்றும் பாதுகாக்கிறது என்பதை விவரிக்கிறது...', '/notices/translated/techcorp-privacy-tamil.pdf'),
(3, 34, 2, '2025-05-21 17:45:00.000', 'ben_Beng', 'এই নোটিশটি বর্ণনা করে যে মেডিকেয়ার হাসপাতাল চেইন রোগীর তথ্য এবং মেডিকেল রেকর্ডগুলি কীভাবে পরিচালনা করে...', '/notices/translated/medicare-privacy-bengali.pdf');
SET IDENTITY_INSERT translated_notices OFF;

-- Insert Sample Exception Logs
SET IDENTITY_INSERT exception_logs ON;
INSERT INTO exception_logs (id, pageName, functionName, errorMessage, userId, additionalDetails, severity, isResolved, createdAt) VALUES 
(1, 'DPRequestPage', 'updateDPRequest', 'Failed to update request status due to database connection timeout', 108, 'Request ID: 59, Organization ID: 33', 'error', 1, '2025-05-30 08:15:30.000'),
(2, 'NotificationService', 'sendEmail', 'SMTP server connection failed', NULL, 'Email: admin@abc.com, Template: OTP Verification', 'warning', 0, '2025-05-30 10:45:22.000'),
(3, 'GrievanceModule', 'createGrievance', 'Validation error: Phone number format invalid', 111, 'Organization ID: 34, Phone: invalid-format', 'info', 1, '2025-05-29 16:20:15.000'),
(4, 'UserManagement', 'RoleChange', 'User role changed from user to admin', 109, 'User ID: 109, Organization ID: 33', 'info', 1, '2025-05-28 12:30:45.000');
SET IDENTITY_INSERT exception_logs OFF;

PRINT 'Sample data inserted successfully!';
PRINT 'Data includes:';
PRINT '- 4 DP Requests (including request #59 from current system)';
PRINT '- 8 History entries matching current system updates';
PRINT '- 3 Grievances with history';
PRINT '- 5 Notifications (including notification #7)';
PRINT '- 4 Compliance documents';
PRINT '- 3 Privacy notices with translations';
PRINT '- 4 Exception log entries';
GO