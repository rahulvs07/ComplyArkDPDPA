-- ComplyArk Application - PostgreSQL Database Setup Script
-- This script creates necessary tables and inserts initial data for the DPDPA compliance application

-- Create the tables
-- Tables will be automatically created by Drizzle ORM when the application starts

-- Insert Industries
INSERT INTO industries (industryName) VALUES 
('Healthcare'),
('Finance'),
('Technology'),
('E-commerce'),
('Education'),
('Manufacturing'),
('Retail'),
('Telecommunications');

-- Insert Request Statuses
INSERT INTO requestStatuses (statusName, slaDays, isActive) VALUES 
('Submitted', 1, true),
('InProgress', 7, true),
('AwaitingInfo', 3, true),
('Reassigned', 5, true),
('Escalated', 2, true),
('Closed', 0, true);

-- Insert Default Organization
INSERT INTO organizations (
  businessName, 
  businessAddress, 
  industryId, 
  contactPersonName, 
  contactEmail, 
  contactPhone, 
  noOfUsers, 
  remarks, 
  requestPageUrlToken
) VALUES (
  'ComplyArk Technologies', 
  '123 Compliance Street, Tech Park, Bengaluru 560001', 
  3, -- Technology industry
  'Raj Kumar', 
  'admin@complyark.com', 
  '+91-9876543210', 
  10, 
  'Main organization for product demonstrations', 
  'complyark-token-123'
);

-- Insert Admin User (NOTE: Password is hashed in real system, using plain text here for demonstration)
INSERT INTO users (
  username, 
  password, 
  firstName, 
  lastName, 
  email, 
  phone, 
  role, 
  organizationId, 
  isActive, 
  createdAt, 
  canEdit, 
  canDelete
) VALUES (
  'complyarkadmin', 
  'complyarkadmin', -- This would be hashed in production
  'System', 
  'Administrator', 
  'admin@complyark.com', 
  '+91-9876543210', 
  'admin', 
  1, -- The organization we created above
  true, 
  CURRENT_TIMESTAMP, 
  true, 
  true
);

-- Insert Regular User
INSERT INTO users (
  username, 
  password, 
  firstName, 
  lastName, 
  email, 
  phone, 
  role, 
  organizationId, 
  isActive, 
  createdAt, 
  canEdit, 
  canDelete
) VALUES (
  'user', 
  'password', -- This would be hashed in production
  'Regular', 
  'User', 
  'user@complyark.com', 
  '+91-9876543211', 
  'user', 
  1, -- The organization we created above
  true, 
  CURRENT_TIMESTAMP, 
  true, 
  false
);

-- Insert Default Template for Privacy Notice (Simple Privacy Notice Template)
INSERT INTO templates (
  templateName, 
  templateBody, 
  industryId, 
  templatePath
) VALUES (
  'Simple Privacy Notice Template', 
  '# Privacy Notice

## 1. Introduction
This Privacy Notice explains how [Organization Name] collects, uses, discloses, and safeguards your personal data.

## 2. Data Controller
[Organization Name] is the data controller for the personal data collected through our services.

## 3. Personal Data We Collect
We collect the following personal data:

### Selected Personal Data Fields:
- [Will be populated automatically from questionnaire]

## 4. How We Use Your Data
We use your personal data for the following purposes:
- To provide our services
- To communicate with you
- To improve our services
- To comply with legal obligations

## 5. Legal Basis for Processing
We process your data based on:
- Your consent
- Contractual necessity
- Legitimate interests
- Legal compliance

## 6. Data Sharing and Disclosure
We may share your data with:
- Service providers
- Business partners
- Legal authorities when required by law

## 7. Data Retention
We retain your data for as long as necessary to fulfill the purposes for which it was collected.

## 8. Your Rights
You have the right to:
- Access your data
- Rectify inaccurate data
- Erase your data
- Restrict processing
- Data portability
- Object to processing
- Withdraw consent

## 9. Security Measures
We implement appropriate security measures to protect your personal data.

## 10. Contact Information
For any questions regarding this Privacy Notice, please contact:
[Contact Information]

## 11. Updates to this Notice
This Privacy Notice may be updated occasionally. The latest version will always be available on our website.

Last Updated: [Date]', 
  1, -- Healthcare industry (default template applies to all)
  '/templates/default/simple-privacy-notice.txt'
);

-- Insert Industry-specific Templates
INSERT INTO templates (
  templateName, 
  templateBody, 
  industryId, 
  templatePath
) VALUES (
  'Healthcare Privacy Notice Template', 
  '# Healthcare Privacy Notice

## 1. Introduction
This Privacy Notice explains how [Healthcare Organization] collects, uses, discloses, and safeguards your health information and other personal data.

## 2. Data Controller
[Healthcare Organization] is the data controller for the personal data collected through our services.

## 3. Personal Data We Collect
We collect the following types of sensitive personal data:

### Selected Personal Data Fields:
- [Will be populated automatically from questionnaire]

### Medical Information
- Medical history
- Treatment records
- Diagnostic information
- Prescriptions
- Lab results

## 4. How We Use Your Data
We use your personal data for:
- Providing medical treatment
- Insurance processing
- Appointment scheduling
- Healthcare operations
- Research (with proper de-identification)
- Regulatory compliance

## 5. Legal Basis for Processing
We process your data based on:
- Your explicit consent
- Necessary for medical diagnosis and treatment
- Vital interests in emergency situations
- Public health requirements
- Legal compliance with healthcare regulations

## 6. Data Sharing and Disclosure
We may share your data with:
- Other healthcare providers involved in your care
- Insurance providers for claims
- Electronic Health Record systems
- Public health authorities as legally required
- Authorized research institutions (de-identified)

## 7. Data Retention
We retain medical records for the period required by healthcare regulations, typically 7-10 years or as required by local law.

## 8. Your Rights
You have the right to:
- Access your medical records
- Obtain copies of your records
- Request corrections to inaccurate information
- Restrict certain disclosures
- Receive an accounting of disclosures

## 9. Security Measures
We implement industry-standard healthcare security measures to protect your personal and medical data.

## 10. Contact Information
For any questions regarding this Privacy Notice or to exercise your rights, please contact:
[Contact Information]

## 11. Updates to this Notice
This Privacy Notice may be updated occasionally. The latest version will always be available in our facilities and on our website.

Last Updated: [Date]', 
  1, -- Healthcare industry
  '/templates/industry/healthcare-privacy-notice.txt'
);

INSERT INTO templates (
  templateName, 
  templateBody, 
  industryId, 
  templatePath
) VALUES (
  'Finance Privacy Notice Template', 
  '# Financial Services Privacy Notice

## 1. Introduction
This Privacy Notice explains how [Financial Institution] collects, uses, discloses, and safeguards your financial and personal data.

## 2. Data Controller
[Financial Institution] is the data controller for the personal data collected through our services.

## 3. Personal Data We Collect
We collect the following categories of financial and personal data:

### Selected Personal Data Fields:
- [Will be populated automatically from questionnaire]

### Financial Information
- Account details
- Transaction history
- Credit information
- Investment portfolio
- Tax documents

## 4. How We Use Your Data
We use your personal data for:
- Account management
- Transaction processing
- Credit assessment
- Fraud prevention
- Regulatory reporting
- Marketing our financial products

## 5. Legal Basis for Processing
We process your data based on:
- Contractual necessity
- Legal compliance with financial regulations
- Legitimate business interests
- Your consent (for marketing)

## 6. Data Sharing and Disclosure
We may share your data with:
- Credit bureaus
- Regulatory authorities
- Fraud prevention agencies
- Service providers
- Affiliated financial institutions

## 7. Data Retention
We retain financial records as required by financial regulations, typically 7 years after account closure.

## 8. Your Rights
You have the right to:
- Access your financial records
- Correct inaccurate information
- Opt-out of certain data sharing
- Limit direct marketing

## 9. Security Measures
We implement bank-grade security measures to protect your financial and personal data.

## 10. Contact Information
For any questions regarding this Privacy Notice or to exercise your rights, please contact:
[Contact Information]

## 11. Updates to this Notice
This Privacy Notice may be updated occasionally. The latest version will always be available in our branches and on our website.

Last Updated: [Date]', 
  2, -- Finance industry
  '/templates/industry/finance-privacy-notice.txt'
);

-- Insert Sample DPR (Data Principal Request)
INSERT INTO dpRequests (
  organizationId,
  firstName,
  lastName,
  email,
  phone,
  requestType,
  requestComment,
  statusId,
  assignedToUserId,
  createdAt,
  lastUpdatedAt,
  completionDate
) VALUES (
  1, -- ComplyArk organization
  'Priya',
  'Sharma',
  'priya.sharma@example.com',
  '+91-9988776655',
  'Access', -- Access request type
  'I would like to access all my personal data that your organization holds.',
  1, -- Submitted status
  1, -- Assigned to admin by default
  CURRENT_TIMESTAMP - INTERVAL '3 days',
  CURRENT_TIMESTAMP - INTERVAL '3 days',
  CURRENT_DATE + INTERVAL '7 days' -- Completion date based on SLA
);

-- Insert Sample Grievance
INSERT INTO grievances (
  organizationId,
  firstName,
  lastName,
  email,
  phone,
  grievanceComment,
  statusId,
  assignedToUserId,
  createdAt,
  lastUpdatedAt,
  completionDate
) VALUES (
  1, -- ComplyArk organization
  'Amit',
  'Patel',
  'amit.patel@example.com',
  '+91-8877665544',
  'I previously requested the deletion of my data, but continue to receive marketing emails.',
  1, -- Submitted status
  1, -- Assigned to admin by default
  CURRENT_TIMESTAMP - INTERVAL '5 days',
  CURRENT_TIMESTAMP - INTERVAL '5 days',
  CURRENT_DATE + INTERVAL '7 days' -- Completion date based on SLA
);

-- Insert Sample Notice
INSERT INTO notices (
  organizationId,
  noticeName,
  noticeBody,
  createdBy,
  createdOn,
  noticeType,
  version,
  folderLocation
) VALUES (
  1, -- ComplyArk organization
  'ComplyArk Privacy Notice v1.0',
  '# Privacy Notice for ComplyArk Technologies

## 1. Introduction
This Privacy Notice explains how ComplyArk Technologies collects, uses, discloses, and safeguards your personal data.

## 2. Data Controller
ComplyArk Technologies is the data controller for the personal data collected through our services.

## 3. Personal Data We Collect
We collect the following personal data:

### Selected Personal Data Fields:
- Name: To identify you correctly
- Email: For communication and account verification
- Phone Number: For authentication and urgent communications
- Address: For billing and legal requirements

## 4. How We Use Your Data
We use your personal data for the following purposes:
- To provide our compliance management services
- To communicate with you about our services
- To improve our platform based on feedback
- To comply with legal obligations

## 5. Legal Basis for Processing
We process your data based on:
- Your consent
- Contractual necessity when you use our services
- Legitimate interests in improving our platform
- Legal compliance with data protection regulations

## 6. Data Sharing and Disclosure
We may share your data with:
- Cloud service providers that host our platform
- Analytics providers to improve our services
- Legal authorities when required by law

## 7. Data Retention
We retain your data for as long as your account is active, plus 2 years for legal compliance purposes.

## 8. Your Rights
You have the right to:
- Access your data
- Rectify inaccurate data
- Erase your data when no longer needed
- Restrict processing
- Data portability
- Object to processing
- Withdraw consent

## 9. Security Measures
We implement robust security measures including encryption, access controls, and regular security audits.

## 10. Contact Information
For any questions regarding this Privacy Notice, please contact:
privacy@complyark.com or +91-9876543210

## 11. Updates to this Notice
This Privacy Notice may be updated occasionally. The latest version will always be available on our website.

Last Updated: May 23, 2025',
  1, -- Created by admin
  CURRENT_TIMESTAMP - INTERVAL '10 days',
  'Privacy Notice',
  '1.0',
  '/notices/complyark/'
);

-- Insert Sample Compliance Document
INSERT INTO complianceDocuments (
  documentName,
  documentPath,
  documentType,
  uploadedBy,
  uploadedAt,
  organizationId,
  folderPath
) VALUES (
  'DPDPA Readiness Checklist.pdf',
  '/documents/checklists/dpdpa-readiness-checklist.pdf',
  'Checklist',
  1, -- Uploaded by admin
  CURRENT_TIMESTAMP - INTERVAL '15 days',
  1, -- ComplyArk organization
  '/Compliance Documents/Templates/'
);

-- Insert Sample Notification Logs
INSERT INTO notification_logs (
  userId,
  organizationId,
  module,
  action,
  actionType,
  timestamp,
  status,
  initiator,
  message,
  isRead,
  relatedItemId,
  relatedItemType
) VALUES (
  1, -- Admin user
  1, -- ComplyArk organization
  'DPR',
  'New data access request received',
  'created',
  CURRENT_TIMESTAMP - INTERVAL '3 days',
  'active',
  'system',
  'A new data access request has been submitted by Priya Sharma',
  false,
  1, -- Related to the DPR request
  'dpRequest'
);

INSERT INTO notification_logs (
  userId,
  organizationId,
  module,
  action,
  actionType,
  timestamp,
  status,
  initiator,
  message,
  isRead,
  relatedItemId,
  relatedItemType
) VALUES (
  1, -- Admin user
  1, -- ComplyArk organization
  'Grievance',
  'New grievance received',
  'created',
  CURRENT_TIMESTAMP - INTERVAL '5 days',
  'active',
  'system',
  'A new grievance has been submitted by Amit Patel',
  false,
  1, -- Related to the Grievance
  'grievance'
);

INSERT INTO notification_logs (
  userId,
  organizationId,
  module,
  action,
  actionType,
  timestamp,
  status,
  initiator,
  message,
  isRead,
  relatedItemId,
  relatedItemType
) VALUES (
  1, -- Admin user
  1, -- ComplyArk organization
  'Notice',
  'Privacy notice created',
  'created',
  CURRENT_TIMESTAMP - INTERVAL '10 days',
  'active',
  'user',
  'A new privacy notice has been created: ComplyArk Privacy Notice v1.0',
  true,
  1, -- Related to the Notice
  'notice'
);

INSERT INTO notification_logs (
  userId,
  organizationId,
  module,
  action,
  actionType,
  timestamp,
  status,
  initiator,
  message,
  isRead,
  relatedItemId,
  relatedItemType
) VALUES (
  1, -- Admin user
  1, -- ComplyArk organization
  'Document',
  'Compliance document uploaded',
  'created',
  CURRENT_TIMESTAMP - INTERVAL '15 days',
  'active',
  'user',
  'A new compliance document has been uploaded: DPDPA Readiness Checklist.pdf',
  true,
  1, -- Related to the Document
  'document'
);

-- Additional queries can be added as needed for more sample data or configuration