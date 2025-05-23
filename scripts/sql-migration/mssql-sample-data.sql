-- ComplyArk Sample Data for Microsoft SQL Server
-- Initial data for testing and demonstration

USE ComplyArk;
GO

-- Clear existing data if needed (for clean re-runs)
-- Comment out if you want to preserve existing data
/*
DELETE FROM dpRequestHistory;
DELETE FROM dpRequests;
DELETE FROM grievanceHistory;
DELETE FROM grievances;
DELETE FROM translatedNotices;
DELETE FROM notices;
DELETE FROM complianceDocuments;
DELETE FROM otpVerification;
DELETE FROM users WHERE username <> 'complyarkadmin';
DELETE FROM templates;
DELETE FROM organizations;
DELETE FROM industries;
DELETE FROM requestStatuses;
*/

-- Industry Data
SET IDENTITY_INSERT industries ON;
INSERT INTO industries (industryId, industryName)
VALUES 
(1, 'Healthcare'),
(2, 'Banking & Finance'),
(3, 'E-commerce & Retail'),
(4, 'Education'),
(5, 'Technology & IT'),
(6, 'Manufacturing'),
(7, 'Telecommunications'),
(8, 'Insurance'),
(9, 'Government'),
(10, 'Travel & Hospitality');
SET IDENTITY_INSERT industries OFF;

-- Organization Data
SET IDENTITY_INSERT organizations ON;
INSERT INTO organizations (id, businessName, businessAddress, industryId, contactPersonName, contactEmail, contactPhone, noOfUsers, remarks, requestPageUrlToken)
VALUES 
(1, 'MediCare Systems', '42 Hospital Avenue, Mumbai, India', 1, 'Dr. Arun Sharma', 'arun.sharma@medicare.com', '+91 98765 43210', 10, 'Leading healthcare provider', 'medicare-systems-token'),
(2, 'National Financial Bank', '7 Banking Street, Delhi, India', 2, 'Priya Malhotra', 'priya.m@nfbank.com', '+91 87654 32109', 15, 'Commercial banking institution', 'nfb-token'),
(3, 'India Retail Solutions', '101 Market Road, Bengaluru, India', 3, 'Raj Patel', 'raj.patel@indiaretail.com', '+91 76543 21098', 8, 'Online retail platform', 'indiaretail-token'),
(4, 'Learning Edge Institute', '25 Education Lane, Chennai, India', 4, 'Dr. Meena Iyer', 'meena.iyer@learningedge.edu', '+91 65432 10987', 12, 'Educational institution', 'learningedge-token'),
(5, 'TechSoft Solutions', '56 Technology Park, Hyderabad, India', 5, 'Vikram Singh', 'vikram.s@techsoft.com', '+91 54321 09876', 20, 'Software development company', 'techsoft-token'),
(31, 'ComplyArk Demo Org', '123 Test Street, New Delhi, India', 5, 'John Doe', 'john@example.com', '+91 12345 67890', 5, 'Demo organization for testing', 'complyark-demo-token');
SET IDENTITY_INSERT organizations OFF;

-- Hard-coded superadmin user
IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'complyarkadmin')
BEGIN
    -- Note: In production, use proper password hashing
    -- This is just for demonstration with a hashed password "admincomplyark"
    SET IDENTITY_INSERT users ON;
    INSERT INTO users (id, username, password, firstName, lastName, email, phone, role, organizationId, isActive, canEdit, canDelete)
    VALUES (1, 'complyarkadmin', '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08', 'System', 'Administrator', 'admin@complyark.com', '+91 99999 99999', 'admin', 1, 1, 1, 1);
    SET IDENTITY_INSERT users OFF;
END

-- Users Data
SET IDENTITY_INSERT users ON;
INSERT INTO users (id, username, password, firstName, lastName, email, phone, role, organizationId, isActive, canEdit, canDelete)
VALUES 
-- For MediCare Systems
(101, 'arun.sharma', 'hashed_password', 'Arun', 'Sharma', 'arun.sharma@medicare.com', '+91 98765 43210', 'admin', 1, 1, 1, 1),
(102, 'sanjay.kumar', 'hashed_password', 'Sanjay', 'Kumar', 'sanjay.k@medicare.com', '+91 98765 43211', 'user', 1, 1, 1, 0),
(103, 'neha.singh', 'hashed_password', 'Neha', 'Singh', 'neha.s@medicare.com', '+91 98765 43212', 'user', 1, 1, 0, 0),

-- For National Financial Bank
(104, 'priya.malhotra', 'hashed_password', 'Priya', 'Malhotra', 'priya.m@nfbank.com', '+91 87654 32109', 'admin', 2, 1, 1, 1),
(105, 'rahul.joshi', 'hashed_password', 'Rahul', 'Joshi', 'rahul.j@nfbank.com', '+91 87654 32110', 'user', 2, 1, 1, 0),

-- For Demo Organization
(106, 'user', 'password', 'John', 'Doe', 'john@example.com', '+91 12345 67890', 'admin', 31, 1, 1, 1),
(107, 'demouser', 'password', 'Demo', 'User', 'demo@example.com', '+91 12345 67891', 'user', 31, 1, 1, 0);
SET IDENTITY_INSERT users OFF;

-- Request Status Data
SET IDENTITY_INSERT requestStatuses ON;
INSERT INTO requestStatuses (statusId, statusName, slaDays, isActive)
VALUES 
(1, 'Submitted', 30, 1),
(2, 'InProgress', 25, 1),
(3, 'AwaitingInfo', 20, 1),
(4, 'Reassigned', 15, 1),
(5, 'Escalated', 10, 1),
(6, 'Closed', 0, 1);
SET IDENTITY_INSERT requestStatuses OFF;

-- Templates
SET IDENTITY_INSERT templates ON;
INSERT INTO templates (templateId, templateName, templateBody, industryId, templatePath)
VALUES 
(1, 'Healthcare Privacy Notice', '# HEALTHCARE PRIVACY NOTICE\n\n## Introduction\n[ORGANIZATION_NAME] is committed to protecting the privacy of our patients. This Privacy Notice explains how we collect and use personal information in connection with our healthcare services.\n\n## Information We Collect\n- Patient demographics and contact information\n- Medical history and health data\n- Insurance and billing information\n- Treatment records and progress notes\n- Diagnostic test results and images\n- Medication and prescription information\n\n## How We Use Your Information\n- To provide medical treatment and care\n- To manage your healthcare and wellness\n- For billing and insurance purposes\n- To improve our services and patient experience\n- For research and public health initiatives (anonymized data only)\n- To comply with legal and regulatory requirements\n\n## Your Rights\nYou have the right to:\n- Access your personal health information\n- Request corrections to inaccurate information\n- Obtain a copy of your medical records\n- Restrict certain uses and disclosures\n- File a complaint if you believe your privacy rights have been violated\n\n## Contact Us\nIf you have questions about this privacy notice or our data practices, please contact our Privacy Officer at [CONTACT_EMAIL] or [CONTACT_PHONE].', 1, '/templates/healthcare_privacy_notice.md'),
(2, 'Banking Privacy Notice', '# BANKING PRIVACY NOTICE\n\n## Introduction\n[ORGANIZATION_NAME] values your trust and is committed to protecting your personal and financial information. This Privacy Notice explains how we collect, use, and safeguard your data.\n\n## Information We Collect\n- Personal identification and contact details\n- Account information and transaction history\n- Credit history and financial status\n- Employment and income information\n- Authentication data (passwords, PINs)\n- Online banking activity and behaviors\n\n## How We Use Your Information\n- To process transactions and manage your accounts\n- To provide financial products and services\n- For risk assessment and fraud prevention\n- To comply with banking regulations and legal requirements\n- To improve our services and customer experience\n- For marketing purposes (with your consent)\n\n## Your Rights\nYou have the right to:\n- Access your personal information\n- Request corrections to inaccurate data\n- Opt-out of marketing communications\n- Request deletion of certain information\n- File a complaint regarding data handling\n\n## Contact Us\nIf you have questions about this privacy notice or our data practices, please contact our Data Protection Officer at [CONTACT_EMAIL] or [CONTACT_PHONE].', 2, '/templates/banking_privacy_notice.md'),
(3, 'E-commerce Privacy Notice', '# E-COMMERCE PRIVACY NOTICE\n\n## Introduction\n[ORGANIZATION_NAME] is committed to protecting your privacy while providing you with a personalized shopping experience. This Privacy Notice explains our data collection and usage practices.\n\n## Information We Collect\n- Account and profile information\n- Contact and shipping details\n- Purchase history and wishlist items\n- Payment information\n- Browsing behavior and preferences\n- Device and location information\n\n## How We Use Your Information\n- To process and fulfill your orders\n- To personalize your shopping experience\n- To communicate about products, services, and promotions\n- To improve our website and offerings\n- For security and fraud prevention\n- To analyze shopping trends and preferences\n\n## Your Rights\nYou have the right to:\n- Access and update your personal information\n- Opt-out of marketing communications\n- Request deletion of your account data\n- Object to certain data processing activities\n- Download a copy of your personal data\n\n## Contact Us\nIf you have questions about this privacy notice or our data practices, please contact our Customer Support team at [CONTACT_EMAIL] or [CONTACT_PHONE].', 3, '/templates/ecommerce_privacy_notice.md'),
(4, 'Education Privacy Notice', '# EDUCATIONAL INSTITUTION PRIVACY NOTICE\n\n## Introduction\n[ORGANIZATION_NAME] is committed to protecting the privacy of our students, faculty, staff, and visitors. This Privacy Notice explains how we collect and use personal information in connection with our educational services.\n\n## Information We Collect\n- Student records and academic information\n- Contact and demographic information\n- Financial information for billing and financial aid\n- Health and disability information (for accommodations)\n- Online learning activities and assessments\n- Campus security and access information\n\n## How We Use Your Information\n- To provide educational services and instruction\n- To administer enrollment, registration, and financial aid\n- To support student success and well-being\n- For institutional research and improvement of programs\n- To maintain a safe campus environment\n- To comply with legal and accreditation requirements\n\n## Your Rights\nYou have the right to:\n- Access your educational records\n- Request correction of inaccurate information\n- Limit disclosure of directory information\n- Opt-out of certain data collection activities\n- File a complaint if you believe your privacy rights have been violated\n\n## Contact Us\nIf you have questions about this privacy notice or our data practices, please contact our Privacy Officer at [CONTACT_EMAIL] or [CONTACT_PHONE].', 4, '/templates/education_privacy_notice.md');
SET IDENTITY_INSERT templates OFF;

-- Sample DPRequests
SET IDENTITY_INSERT dpRequests ON;
INSERT INTO dpRequests (requestId, organizationId, firstName, lastName, email, phone, requestType, requestComment, statusId, assignedToUserId, createdAt, lastUpdatedAt, completionDate, completedOnTime, closedDateTime, closureComments)
VALUES 
-- For MediCare Systems
(1, 1, 'Aditya', 'Gupta', 'aditya.g@example.com', '+91 55555 11111', 'Access', 'I would like to access all my medical records from the past year.', 2, 102, DATEADD(DAY, -15, GETDATE()), DATEADD(DAY, -10, GETDATE()), NULL, NULL, NULL, NULL),
(2, 1, 'Sneha', 'Patel', 'sneha.p@example.com', '+91 55555 22222', 'Correction', 'There is an error in my allergy information that needs to be corrected.', 6, 103, DATEADD(DAY, -45, GETDATE()), DATEADD(DAY, -5, GETDATE()), DATEADD(DAY, -5, GETDATE()), 1, DATEADD(DAY, -5, GETDATE()), 'Information corrected as requested.'),
(3, 1, 'Vijay', 'Sharma', 'vijay.s@example.com', '+91 55555 33333', 'Erasure', 'I want to delete all my non-essential medical data from your records.', 3, 102, DATEADD(DAY, -7, GETDATE()), DATEADD(DAY, -2, GETDATE()), NULL, NULL, NULL, NULL),

-- For National Financial Bank
(4, 2, 'Ananya', 'Reddy', 'ananya.r@example.com', '+91 66666 11111', 'Access', 'I need all transaction records from January to March 2025.', 1, NULL, DATEADD(DAY, -1, GETDATE()), NULL, NULL, NULL, NULL, NULL),
(5, 2, 'Kiran', 'Desai', 'kiran.d@example.com', '+91 66666 22222', 'Nomination', 'I want to update my account nominee information.', 5, 105, DATEADD(DAY, -20, GETDATE()), DATEADD(DAY, -3, GETDATE()), NULL, NULL, NULL, NULL),

-- For Demo Organization
(6, 31, 'Sanjay', 'Kumar', 'sanjay@example.com', '+91 77777 11111', 'Access', 'I need access to all my personal data stored by your company.', 2, 106, DATEADD(DAY, -10, GETDATE()), DATEADD(DAY, -8, GETDATE()), NULL, NULL, NULL, NULL),
(7, 31, 'Meena', 'Verma', 'meena@example.com', '+91 77777 22222', 'Correction', 'My address information is incorrect and needs to be updated.', 4, 107, DATEADD(DAY, -30, GETDATE()), DATEADD(DAY, -25, GETDATE()), NULL, NULL, NULL, NULL),
(8, 31, 'Rahul', 'Singh', 'rahul@example.com', '+91 77777 33333', 'Erasure', 'Please delete all my account information as I no longer wish to use your services.', 6, 106, DATEADD(DAY, -60, GETDATE()), DATEADD(DAY, -30, GETDATE()), DATEADD(DAY, -30, GETDATE()), 1, DATEADD(DAY, -30, GETDATE()), 'Account data deleted as requested.');
SET IDENTITY_INSERT dpRequests OFF;

-- Sample DPRequest History
SET IDENTITY_INSERT dpRequestHistory ON;
INSERT INTO dpRequestHistory (historyId, requestId, changeDate, changedByUserId, oldStatusId, newStatusId, oldAssignedToUserId, newAssignedToUserId, comments)
VALUES 
-- For Request ID 1
(1, 1, DATEADD(DAY, -15, GETDATE()), 101, NULL, 1, NULL, NULL, 'Request received'),
(2, 1, DATEADD(DAY, -12, GETDATE()), 101, 1, 2, NULL, 102, 'Assigned to Sanjay Kumar for processing'),
(3, 1, DATEADD(DAY, -10, GETDATE()), 102, 2, 2, 102, 102, 'Started gathering requested medical records'),

-- For Request ID 2
(4, 2, DATEADD(DAY, -45, GETDATE()), 101, NULL, 1, NULL, NULL, 'Request received'),
(5, 2, DATEADD(DAY, -40, GETDATE()), 101, 1, 2, NULL, 103, 'Assigned to Neha Singh for processing'),
(6, 2, DATEADD(DAY, -35, GETDATE()), 103, 2, 3, 103, 103, 'Need more details about the allergy information to be corrected'),
(7, 2, DATEADD(DAY, -20, GETDATE()), 103, 3, 2, 103, 103, 'Additional information received, continuing processing'),
(8, 2, DATEADD(DAY, -5, GETDATE()), 103, 2, 6, 103, 103, 'Correction completed, request closed'),

-- For Demo Organization Requests
(9, 6, DATEADD(DAY, -10, GETDATE()), 106, NULL, 1, NULL, NULL, 'Request received'),
(10, 6, DATEADD(DAY, -8, GETDATE()), 106, 1, 2, NULL, 106, 'Started processing data access request'),
(11, 7, DATEADD(DAY, -30, GETDATE()), 106, NULL, 1, NULL, NULL, 'Request received'),
(12, 7, DATEADD(DAY, -28, GETDATE()), 106, 1, 2, NULL, 107, 'Assigned to Demo User for processing'),
(13, 7, DATEADD(DAY, -25, GETDATE()), 107, 2, 4, 107, 107, 'Need to verify the correct address with customer'),
(14, 8, DATEADD(DAY, -60, GETDATE()), 106, NULL, 1, NULL, NULL, 'Request received'),
(15, 8, DATEADD(DAY, -55, GETDATE()), 106, 1, 2, NULL, 106, 'Started processing deletion request'),
(16, 8, DATEADD(DAY, -50, GETDATE()), 106, 2, 3, 106, 106, 'Waiting for customer to confirm deletion request'),
(17, 8, DATEADD(DAY, -40, GETDATE()), 106, 3, 2, 106, 106, 'Confirmation received, proceeding with deletion'),
(18, 8, DATEADD(DAY, -30, GETDATE()), 106, 2, 6, 106, 106, 'Deletion completed, request closed');
SET IDENTITY_INSERT dpRequestHistory OFF;

-- Sample Grievances
SET IDENTITY_INSERT grievances ON;
INSERT INTO grievances (grievanceId, organizationId, firstName, lastName, email, phone, grievanceComment, statusId, assignedToUserId, createdAt, lastUpdatedAt, completionDate, completedOnTime, closedDateTime, closureComments)
VALUES 
-- For MediCare Systems
(1, 1, 'Rohan', 'Mehta', 'rohan.m@example.com', '+91 55555 44444', 'I was billed incorrectly for my last doctor visit on May 10th.', 2, 102, DATEADD(DAY, -8, GETDATE()), DATEADD(DAY, -6, GETDATE()), NULL, NULL, NULL, NULL),
(2, 1, 'Pooja', 'Nair', 'pooja.n@example.com', '+91 55555 55555', 'My appointment was rescheduled twice without proper notification.', 6, 103, DATEADD(DAY, -25, GETDATE()), DATEADD(DAY, -5, GETDATE()), DATEADD(DAY, -5, GETDATE()), 1, DATEADD(DAY, -5, GETDATE()), 'Resolved with apology and new appointment scheduling process implemented.'),

-- For National Financial Bank
(3, 2, 'Deepak', 'Verma', 'deepak.v@example.com', '+91 66666 33333', 'ATM withdrawal failed but amount was deducted from my account.', 5, 105, DATEADD(DAY, -12, GETDATE()), DATEADD(DAY, -5, GETDATE()), NULL, NULL, NULL, NULL),
(4, 2, 'Sunita', 'Rao', 'sunita.r@example.com', '+91 66666 44444', 'Customer service representative was rude during my branch visit yesterday.', 3, 105, DATEADD(DAY, -5, GETDATE()), DATEADD(DAY, -2, GETDATE()), NULL, NULL, NULL, NULL),

-- For Demo Organization
(5, 31, 'Vikram', 'Kapoor', 'vikram@example.com', '+91 77777 44444', 'My data was shared with third parties without my consent.', 2, 106, DATEADD(DAY, -7, GETDATE()), DATEADD(DAY, -5, GETDATE()), NULL, NULL, NULL, NULL),
(6, 31, 'Anita', 'Joshi', 'anita@example.com', '+91 77777 55555', 'Website is very difficult to navigate and I cannot find privacy settings.', 6, 107, DATEADD(DAY, -15, GETDATE()), DATEADD(DAY, -5, GETDATE()), DATEADD(DAY, -5, GETDATE()), 1, DATEADD(DAY, -5, GETDATE()), 'Website navigation improved and customer was given a tutorial on privacy settings.');
SET IDENTITY_INSERT grievances OFF;

-- Sample Grievance History
SET IDENTITY_INSERT grievanceHistory ON;
INSERT INTO grievanceHistory (historyId, grievanceId, changeDate, changedByUserId, oldStatusId, newStatusId, oldAssignedToUserId, newAssignedToUserId, comments)
VALUES 
-- For Grievance ID 1
(1, 1, DATEADD(DAY, -8, GETDATE()), 101, NULL, 1, NULL, NULL, 'Grievance received'),
(2, 1, DATEADD(DAY, -7, GETDATE()), 101, 1, 2, NULL, 102, 'Assigned to Sanjay Kumar for processing'),
(3, 1, DATEADD(DAY, -6, GETDATE()), 102, 2, 2, 102, 102, 'Investigating billing records'),

-- For Grievance ID 2
(4, 2, DATEADD(DAY, -25, GETDATE()), 101, NULL, 1, NULL, NULL, 'Grievance received'),
(5, 2, DATEADD(DAY, -24, GETDATE()), 101, 1, 2, NULL, 103, 'Assigned to Neha Singh for processing'),
(6, 2, DATEADD(DAY, -20, GETDATE()), 103, 2, 3, 103, 103, 'Requesting appointment scheduling logs from system'),
(7, 2, DATEADD(DAY, -15, GETDATE()), 103, 3, 2, 103, 103, 'Logs received, found issue with notification system'),
(8, 2, DATEADD(DAY, -5, GETDATE()), 103, 2, 6, 103, 103, 'Issue resolved, notification system fixed, grievance closed'),

-- For Demo Organization Grievances
(9, 5, DATEADD(DAY, -7, GETDATE()), 106, NULL, 1, NULL, NULL, 'Grievance received'),
(10, 5, DATEADD(DAY, -6, GETDATE()), 106, 1, 2, NULL, 106, 'Investigating data sharing practices'),
(11, 5, DATEADD(DAY, -5, GETDATE()), 106, 2, 2, 106, 106, 'Auditing data sharing logs'),
(12, 6, DATEADD(DAY, -15, GETDATE()), 106, NULL, 1, NULL, NULL, 'Grievance received'),
(13, 6, DATEADD(DAY, -14, GETDATE()), 106, 1, 2, NULL, 107, 'Assigned to Demo User for processing'),
(14, 6, DATEADD(DAY, -12, GETDATE()), 107, 2, 2, 107, 107, 'Working with UX team to assess website navigation issues'),
(15, 6, DATEADD(DAY, -10, GETDATE()), 107, 2, 4, 107, 107, 'Escalated to UX design team for priority handling'),
(16, 6, DATEADD(DAY, -5, GETDATE()), 107, 4, 6, 107, 107, 'Website navigation improvements implemented, grievance closed');
SET IDENTITY_INSERT grievanceHistory OFF;

-- Sample Notices
SET IDENTITY_INSERT notices ON;
INSERT INTO notices (noticeId, organizationId, noticeName, noticeBody, createdBy, createdOn, noticeType, version, folderLocation)
VALUES 
(1, 1, 'MediCare Privacy Policy', '# MEDICARE PRIVACY POLICY\n\n## Introduction\nMediCare Systems is committed to protecting the privacy of our patients. This Privacy Notice explains how we collect and use personal information in connection with our healthcare services.\n\n## Information We Collect\n- Patient demographics and contact information\n- Medical history and health data\n- Insurance and billing information\n- Treatment records and progress notes\n- Diagnostic test results and images\n- Medication and prescription information\n\n## How We Use Your Information\n- To provide medical treatment and care\n- To manage your healthcare and wellness\n- For billing and insurance purposes\n- To improve our services and patient experience\n- For research and public health initiatives (anonymized data only)\n- To comply with legal and regulatory requirements\n\n## Your Rights\nYou have the right to:\n- Access your personal health information\n- Request corrections to inaccurate information\n- Obtain a copy of your medical records\n- Restrict certain uses and disclosures\n- File a complaint if you believe your privacy rights have been violated\n\n## Contact Us\nIf you have questions about this privacy notice or our data practices, please contact our Privacy Officer at privacy@medicare.com or +91 98765 43210.', 101, DATEADD(DAY, -90, GETDATE()), 'Privacy Notice', '1.0', 'Notices'),
(2, 2, 'National Financial Bank Privacy Policy', '# NATIONAL FINANCIAL BANK PRIVACY POLICY\n\n## Introduction\nNational Financial Bank values your trust and is committed to protecting your personal and financial information. This Privacy Notice explains how we collect, use, and safeguard your data.\n\n## Information We Collect\n- Personal identification and contact details\n- Account information and transaction history\n- Credit history and financial status\n- Employment and income information\n- Authentication data (passwords, PINs)\n- Online banking activity and behaviors\n\n## How We Use Your Information\n- To process transactions and manage your accounts\n- To provide financial products and services\n- For risk assessment and fraud prevention\n- To comply with banking regulations and legal requirements\n- To improve our services and customer experience\n- For marketing purposes (with your consent)\n\n## Your Rights\nYou have the right to:\n- Access your personal information\n- Request corrections to inaccurate data\n- Opt-out of marketing communications\n- Request deletion of certain information\n- File a complaint regarding data handling\n\n## Contact Us\nIf you have questions about this privacy notice or our data practices, please contact our Data Protection Officer at privacy@nfbank.com or +91 87654 32109.', 104, DATEADD(DAY, -60, GETDATE()), 'Privacy Notice', '1.0', 'Notices'),
(3, 31, 'ComplyArk Demo Privacy Policy', '# COMPLYARK DEMO PRIVACY POLICY\n\n## Introduction\nComplyArk Demo Org is committed to protecting your privacy. This Privacy Notice explains how we collect and use personal information in connection with our services.\n\n## Information We Collect\n- Personal identification and contact details\n- Account information\n- Usage data and preferences\n- Device and connection information\n- Service interaction history\n\n## How We Use Your Information\n- To provide and improve our services\n- To customize user experience\n- For customer support and communication\n- To analyze usage patterns and trends\n- To comply with legal and regulatory requirements\n\n## Your Rights\nYou have the right to:\n- Access your personal information\n- Request corrections to inaccurate data\n- Request deletion of your account data\n- Restrict certain data processing activities\n- File a complaint if you believe your privacy rights have been violated\n\n## Contact Us\nIf you have questions about this privacy notice or our data practices, please contact our Data Protection Officer at privacy@complyarkdemo.com or +91 12345 67890.', 106, DATEADD(DAY, -30, GETDATE()), 'Privacy Notice', '1.0', 'Notices'),
(4, 31, 'Data Subject Request Form', '# DATA SUBJECT REQUEST FORM\n\n## Your Information\n- Full Name: [FULL_NAME]\n- Email Address: [EMAIL]\n- Phone Number: [PHONE]\n- Customer ID (if known): [CUSTOMER_ID]\n\n## Request Type\nPlease indicate what you would like us to do:\n- [ ] Provide a copy of my personal data\n- [ ] Update or correct my information\n- [ ] Delete my personal data\n- [ ] Stop using my data for marketing\n- [ ] Export my data in a portable format\n- [ ] Other (please specify)\n\n## Additional Information\nPlease provide any additional details about your request:\n[ADDITIONAL_DETAILS]\n\n## Verification\nFor security purposes, please answer the following:\n- Date of last purchase (approximate): [LAST_PURCHASE_DATE]\n- Address on file: [ADDRESS]\n\n## How would you like to receive your information?\n- [ ] Email (encrypted file)\n- [ ] Physical mail\n- [ ] Online account access\n\nWe will process your request within 30 days.', 106, DATEADD(DAY, -15, GETDATE()), 'Form', '1.0', 'Forms');
SET IDENTITY_INSERT notices OFF;

-- Sample Translated Notices
SET IDENTITY_INSERT translatedNotices ON;
INSERT INTO translatedNotices (id, noticeId, organizationId, language, translatedBody, filePath, createdOn)
VALUES 
(1, 3, 31, 'Hindi', '# कोम्प्लीआर्क डेमो गोपनीयता नीति\n\n## परिचय\nकोम्प्लीआर्क डेमो ऑर्ग आपकी गोपनीयता की रक्षा के लिए प्रतिबद्ध है। यह गोपनीयता नोटिस बताता है कि हम अपनी सेवाओं के संबंध में व्यक्तिगत जानकारी कैसे एकत्र और उपयोग करते हैं।\n\n## हम क्या जानकारी एकत्र करते हैं\n- व्यक्तिगत पहचान और संपर्क विवरण\n- खाता जानकारी\n- उपयोग डेटा और वरीयताएँ\n- डिवाइस और कनेक्शन जानकारी\n- सेवा इंटरैक्शन इतिहास\n\n## हम आपकी जानकारी का उपयोग कैसे करते हैं\n- हमारी सेवाओं को प्रदान करने और सुधारने के लिए\n- उपयोगकर्ता अनुभव को अनुकूलित करने के लिए\n- ग्राहक सहायता और संचार के लिए\n- उपयोग पैटर्न और रुझानों का विश्लेषण करने के लिए\n- कानूनी और नियामक आवश्यकताओं का पालन करने के लिए\n\n## आपके अधिकार\nआपके पास निम्न अधिकार हैं:\n- अपनी व्यक्तिगत जानकारी तक पहुंच\n- अशुद्ध डेटा में सुधार का अनुरोध\n- अपने खाता डेटा को हटाने का अनुरोध\n- कुछ डेटा प्रोसेसिंग गतिविधियों को प्रतिबंधित करना\n- शिकायत दर्ज करना यदि आपको लगता है कि आपके गोपनीयता अधिकारों का उल्लंघन हुआ है\n\n## हमसे संपर्क करें\nयदि आपके पास इस गोपनीयता नोटिस या हमारी डेटा प्रथाओं के बारे में कोई प्रश्न हैं, तो कृपया हमारे डेटा संरक्षण अधिकारी से privacy@complyarkdemo.com या +91 12345 67890 पर संपर्क करें।', '/translated-notices/hindi-privacy-policy.pdf', DATEADD(DAY, -25, GETDATE())),
(2, 3, 31, 'Tamil', '# கோம்ப்ளியார்க் டெமோ தனியுரிமைக் கொள்கை\n\n## அறிமுகம்\nகோம்ப்ளியார்க் டெமோ ஆர்க் உங்கள் தனியுரிமையைப் பாதுகாக்க உறுதிபூண்டுள்ளது. இந்த தனியுரிமை அறிவிப்பு எங்கள் சேவைகளுடன் தொடர்புடைய தனிப்பட்ட தகவல்களை நாங்கள் எவ்வாறு சேகரிக்கிறோம் மற்றும் பயன்படுத்துகிறோம் என்பதை விளக்குகிறது.\n\n## நாங்கள் எந்த தகவல்களைச் சேகரிக்கிறோம்\n- தனிப்பட்ட அடையாளம் மற்றும் தொடர்பு விவரங்கள்\n- கணக்குத் தகவல்\n- பயன்பாட்டுத் தரவு மற்றும் விருப்பங்கள்\n- சாதனம் மற்றும் இணைப்புத் தகவல்\n- சேவை தொடர்பு வரலாறு\n\n## உங்கள் தகவலை எவ்வாறு பயன்படுத்துகிறோம்\n- எங்கள் சேவைகளை வழங்கவும் மேம்படுத்தவும்\n- பயனர் அனுபவத்தைத் தனிப்பயனாக்க\n- வாடிக்கையாளர் ஆதரவு மற்றும் தொடர்புக்காக\n- பயன்பாட்டு முறைகள் மற்றும் போக்குகளை ஆராய\n- சட்ட மற்றும் ஒழுங்குமுறைத் தேவைகளுக்கு இணங்க\n\n## உங்கள் உரிமைகள்\nஉங்களுக்கு பின்வரும் உரிமைகள் உள்ளன:\n- உங்கள் தனிப்பட்ட தகவலை அணுகுதல்\n- துல்லியமற்ற தரவுகளுக்கு திருத்தங்களைக் கோருதல்\n- உங்கள் கணக்குத் தரவை நீக்கக் கோருதல்\n- சில தரவு செயலாக்க செயல்பாடுகளைக் கட்டுப்படுத்துதல்\n- உங்கள் தனியுரிமை உரிமைகள் மீறப்பட்டதாக நீங்கள் நம்பினால் புகார் அளிக்கலாம்\n\n## எங்களை தொடர்பு கொள்ளுங்கள்\nஇந்த தனியுரிமை அறிவிப்பு அல்லது எங்கள் தரவு நடைமுறைகள் குறித்து உங்களுக்கு கேள்விகள் இருந்தால், தயவுசெய்து எங்கள் தரவு பாதுகாப்பு அதிகாரியை privacy@complyarkdemo.com அல்லது +91 12345 67890 இல் தொடர்பு கொள்ளவும்.', '/translated-notices/tamil-privacy-policy.pdf', DATEADD(DAY, -25, GETDATE())),
(3, 4, 31, 'Hindi', '# डेटा विषय अनुरोध फॉर्म\n\n## आपकी जानकारी\n- पूरा नाम: [FULL_NAME]\n- ईमेल पता: [EMAIL]\n- फोन नंबर: [PHONE]\n- ग्राहक आईडी (यदि ज्ञात है): [CUSTOMER_ID]\n\n## अनुरोध प्रकार\nकृपया इंगित करें कि आप हमसे क्या चाहते हैं:\n- [ ] मेरे व्यक्तिगत डेटा की एक प्रति प्रदान करें\n- [ ] मेरी जानकारी अपडेट या सही करें\n- [ ] मेरा व्यक्तिगत डेटा हटाएं\n- [ ] मार्केटिंग के लिए मेरे डेटा का उपयोग बंद करें\n- [ ] मेरे डेटा को पोर्टेबल फॉर्मेट में निर्यात करें\n- [ ] अन्य (कृपया निर्दिष्ट करें)\n\n## अतिरिक्त जानकारी\nकृपया अपने अनुरोध के बारे में कोई अतिरिक्त विवरण प्रदान करें:\n[ADDITIONAL_DETAILS]\n\n## सत्यापन\nसुरक्षा उद्देश्यों के लिए, कृपया निम्नलिखित का उत्तर दें:\n- अंतिम खरीदारी की तिथि (अनुमानित): [LAST_PURCHASE_DATE]\n- फाइल पर पता: [ADDRESS]\n\n## आप अपनी जानकारी कैसे प्राप्त करना चाहेंगे?\n- [ ] ईमेल (एन्क्रिप्टेड फाइल)\n- [ ] भौतिक मेल\n- [ ] ऑनलाइन खाता पहुंच\n\nहम आपके अनुरोध को 30 दिनों के भीतर संसाधित करेंगे।', '/translated-notices/hindi-data-request-form.pdf', DATEADD(DAY, -10, GETDATE()));
SET IDENTITY_INSERT translatedNotices OFF;

-- Sample Compliance Documents
SET IDENTITY_INSERT complianceDocuments ON;
INSERT INTO complianceDocuments (documentId, documentName, documentPath, documentType, uploadedBy, uploadedAt, organizationId, folderPath)
VALUES 
-- For Demo Organization
(1, 'Privacy Policy Template', '/uploads/compliance/privacy-policy-template.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 106, DATEADD(DAY, -45, GETDATE()), 31, 'Templates'),
(2, 'DPDPA Compliance Checklist', '/uploads/compliance/dpdpa-checklist.pdf', 'application/pdf', 106, DATEADD(DAY, -40, GETDATE()), 31, 'Templates'),
(3, 'Staff Training Manual', '/uploads/compliance/staff-training-manual.pdf', 'application/pdf', 106, DATEADD(DAY, -35, GETDATE()), 31, 'Templates'),
(4, 'Hindi Privacy Notice', '/uploads/compliance/hindi-privacy-notice.pdf', 'application/pdf', 106, DATEADD(DAY, -25, GETDATE()), 31, 'Translated Notices'),
(5, 'Tamil Privacy Notice', '/uploads/compliance/tamil-privacy-notice.pdf', 'application/pdf', 106, DATEADD(DAY, -25, GETDATE()), 31, 'Translated Notices'),
(6, 'Bengali Privacy Notice', '/uploads/compliance/bengali-privacy-notice.pdf', 'application/pdf', 106, DATEADD(DAY, -25, GETDATE()), 31, 'Translated Notices'),
(7, 'Data Processing Agreement', '/uploads/compliance/data-processing-agreement.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 106, DATEADD(DAY, -20, GETDATE()), 31, 'Templates'),
(8, 'Data Breach Response Plan', '/uploads/compliance/data-breach-response-plan.pdf', 'application/pdf', 106, DATEADD(DAY, -15, GETDATE()), 31, 'Templates'),
(9, 'Annual Compliance Report', '/uploads/compliance/annual-compliance-report.pdf', 'application/pdf', 106, DATEADD(DAY, -10, GETDATE()), 31, 'Reports'),
(10, 'Data Protection Impact Assessment', '/uploads/compliance/dpia-template.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 106, DATEADD(DAY, -5, GETDATE()), 31, 'Templates');
SET IDENTITY_INSERT complianceDocuments OFF;

-- Sample OTP Verification
INSERT INTO otpVerification (email, otp, organizationId, createdAt, expiresAt, attempts, verified)
VALUES 
('test@example.com', '123456', 31, DATEADD(HOUR, -2, GETDATE()), DATEADD(HOUR, -1, GETDATE()), 0, 0),
('verified@example.com', '654321', 31, DATEADD(HOUR, -3, GETDATE()), DATEADD(HOUR, -2, GETDATE()), 1, 1);
GO

-- Create functions for common calculations
CREATE OR ALTER FUNCTION [dbo].[GetCompletionDateFromCreatedAt] (
    @createdAt DATETIME,
    @statusId INT
)
RETURNS DATE
AS
BEGIN
    DECLARE @completionDate DATE;
    DECLARE @slaDays INT;
    
    SELECT @slaDays = slaDays
    FROM requestStatuses
    WHERE statusId = @statusId;
    
    SET @completionDate = DATEADD(DAY, @slaDays, CAST(@createdAt AS DATE));
    
    RETURN @completionDate;
END
GO

-- Create function to check if a user is an admin for an organization
CREATE OR ALTER FUNCTION [dbo].[IsUserOrganizationAdmin] (
    @userId INT,
    @organizationId INT
)
RETURNS BIT
AS
BEGIN
    DECLARE @isAdmin BIT = 0;
    
    IF EXISTS (
        SELECT 1
        FROM users
        WHERE id = @userId
        AND organizationId = @organizationId
        AND role = 'admin'
        AND isActive = 1
    )
    BEGIN
        SET @isAdmin = 1;
    END
    
    RETURN @isAdmin;
END
GO