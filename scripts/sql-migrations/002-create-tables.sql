-- ComplyArk DPDPA Management Platform - MSSQL Table Creation
-- Script 002: Create All Tables with Proper Structure

USE ComplyArkDB;
GO

-- Drop existing tables in reverse dependency order if they exist (17 tables total)
IF OBJECT_ID('dpRequestHistory', 'U') IS NOT NULL DROP TABLE dpRequestHistory;
IF OBJECT_ID('grievanceHistory', 'U') IS NOT NULL DROP TABLE grievanceHistory;
IF OBJECT_ID('translatedNotices', 'U') IS NOT NULL DROP TABLE translatedNotices;
IF OBJECT_ID('notices', 'U') IS NOT NULL DROP TABLE notices;
IF OBJECT_ID('emailTemplates', 'U') IS NOT NULL DROP TABLE emailTemplates;
IF OBJECT_ID('emailSettings', 'U') IS NOT NULL DROP TABLE emailSettings;
IF OBJECT_ID('otpVerifications', 'U') IS NOT NULL DROP TABLE otpVerifications;
IF OBJECT_ID('exceptionLogs', 'U') IS NOT NULL DROP TABLE exceptionLogs;
IF OBJECT_ID('notification_logs', 'U') IS NOT NULL DROP TABLE notification_logs;
IF OBJECT_ID('complianceDocuments', 'U') IS NOT NULL DROP TABLE complianceDocuments;
IF OBJECT_ID('grievances', 'U') IS NOT NULL DROP TABLE grievances;
IF OBJECT_ID('dpRequests', 'U') IS NOT NULL DROP TABLE dpRequests;
IF OBJECT_ID('requestStatuses', 'U') IS NOT NULL DROP TABLE requestStatuses;
IF OBJECT_ID('users', 'U') IS NOT NULL DROP TABLE users;
IF OBJECT_ID('organizations', 'U') IS NOT NULL DROP TABLE organizations;
IF OBJECT_ID('templates', 'U') IS NOT NULL DROP TABLE templates;
IF OBJECT_ID('industries', 'U') IS NOT NULL DROP TABLE industries;
GO

-- Industries Table
CREATE TABLE industries (
    industryId INT IDENTITY(1,1) PRIMARY KEY,
    industryName NVARCHAR(255) NOT NULL UNIQUE
);

-- Organizations Table
CREATE TABLE organizations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    businessName NVARCHAR(255) NOT NULL,
    businessAddress NVARCHAR(MAX) NOT NULL,
    industryId INT NOT NULL,
    contactPersonName NVARCHAR(255) NOT NULL,
    contactEmail NVARCHAR(255) NOT NULL,
    contactPhone NVARCHAR(50) NOT NULL,
    noOfUsers INT NOT NULL DEFAULT 1,
    remarks NVARCHAR(MAX),
    requestPageUrlToken NVARCHAR(255),
    FOREIGN KEY (industryId) REFERENCES industries(industryId)
);

-- Users Table
CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(100) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL,
    firstName NVARCHAR(100) NOT NULL,
    lastName NVARCHAR(100) NOT NULL,
    email NVARCHAR(255) NOT NULL,
    phone NVARCHAR(50) NOT NULL,
    role NVARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'superadmin')),
    organizationId INT NOT NULL,
    isActive BIT NOT NULL DEFAULT 1,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    canEdit BIT NOT NULL DEFAULT 0,
    canDelete BIT NOT NULL DEFAULT 0,
    FOREIGN KEY (organizationId) REFERENCES organizations(id)
);

-- Templates Table
CREATE TABLE templates (
    templateId INT IDENTITY(1,1) PRIMARY KEY,
    templateName NVARCHAR(255) NOT NULL,
    templateBody NVARCHAR(MAX) NOT NULL,
    industryId INT NOT NULL,
    templatePath NVARCHAR(500),
    FOREIGN KEY (industryId) REFERENCES industries(industryId)
);

-- Request Statuses Table
CREATE TABLE requestStatuses (
    statusId INT IDENTITY(1,1) PRIMARY KEY,
    statusName NVARCHAR(100) NOT NULL UNIQUE,
    slaDays INT NOT NULL DEFAULT 30,
    isActive BIT NOT NULL DEFAULT 1
);

-- DP Requests Table (matches current schema exactly)
CREATE TABLE dpRequests (
    requestId INT IDENTITY(1,1) PRIMARY KEY,
    organizationId INT NOT NULL,
    firstName NVARCHAR(100) NOT NULL,
    lastName NVARCHAR(100) NOT NULL,
    email NVARCHAR(255) NOT NULL,
    phone NVARCHAR(50) NOT NULL,
    requestType NVARCHAR(100) NOT NULL CHECK (requestType IN ('Access', 'Correction', 'Nomination', 'Erasure')),
    requestComment NVARCHAR(MAX),
    statusId INT NOT NULL,
    assignedToUserId INT,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    lastUpdatedAt DATETIME2,
    completionDate DATE,
    completedOnTime BIT,
    closedDateTime DATETIME2,
    closureComments NVARCHAR(MAX),
    FOREIGN KEY (organizationId) REFERENCES organizations(id),
    FOREIGN KEY (statusId) REFERENCES requestStatuses(statusId),
    FOREIGN KEY (assignedToUserId) REFERENCES users(id)
);

-- Grievances Table
CREATE TABLE grievances (
    grievanceId INT IDENTITY(1,1) PRIMARY KEY,
    organizationId INT NOT NULL,
    firstName NVARCHAR(100) NOT NULL,
    lastName NVARCHAR(100) NOT NULL,
    email NVARCHAR(255) NOT NULL,
    phone NVARCHAR(50) NOT NULL,
    statusId INT NOT NULL,
    grievanceComment NVARCHAR(MAX) NOT NULL,
    assignedToUserId INT,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    lastUpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    completionDate DATE,
    completedOnTime BIT,
    closedDateTime DATETIME2,
    closureComments NVARCHAR(MAX),
    FOREIGN KEY (organizationId) REFERENCES organizations(id),
    FOREIGN KEY (statusId) REFERENCES requestStatuses(statusId),
    FOREIGN KEY (assignedToUserId) REFERENCES users(id)
);

-- DP Request History Table
CREATE TABLE dpRequestHistory (
    historyId INT IDENTITY(1,1) PRIMARY KEY,
    requestId INT NOT NULL,
    changeDate DATETIME2 NOT NULL DEFAULT GETDATE(),
    changedByUserId INT NOT NULL,
    oldStatusId INT,
    newStatusId INT,
    oldAssignedToUserId INT,
    newAssignedToUserId INT,
    comments NVARCHAR(MAX),
    FOREIGN KEY (requestId) REFERENCES dpRequests(requestId),
    FOREIGN KEY (changedByUserId) REFERENCES users(id),
    FOREIGN KEY (oldStatusId) REFERENCES requestStatuses(statusId),
    FOREIGN KEY (newStatusId) REFERENCES requestStatuses(statusId),
    FOREIGN KEY (oldAssignedToUserId) REFERENCES users(id),
    FOREIGN KEY (newAssignedToUserId) REFERENCES users(id)
);

-- Grievances Table
CREATE TABLE grievances (
    grievanceId INT IDENTITY(1,1) PRIMARY KEY,
    organizationId INT NOT NULL,
    firstName NVARCHAR(100) NOT NULL,
    lastName NVARCHAR(100) NOT NULL,
    email NVARCHAR(255) NOT NULL,
    phone NVARCHAR(50) NOT NULL,
    grievanceComment NVARCHAR(MAX) NOT NULL,
    statusId INT NOT NULL,
    assignedToUserId INT,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    lastUpdatedAt DATETIME2,
    completionDate DATE,
    completedOnTime BIT,
    closedDateTime DATETIME2,
    closureComments NVARCHAR(MAX),
    FOREIGN KEY (organizationId) REFERENCES organizations(id),
    FOREIGN KEY (statusId) REFERENCES requestStatuses(statusId),
    FOREIGN KEY (assignedToUserId) REFERENCES users(id)
);

-- Grievance History Table
CREATE TABLE grievanceHistory (
    historyId INT IDENTITY(1,1) PRIMARY KEY,
    grievanceId INT NOT NULL,
    changeDate DATETIME2 NOT NULL DEFAULT GETDATE(),
    changedByUserId INT NOT NULL,
    oldStatusId INT,
    newStatusId INT,
    oldAssignedToUserId INT,
    newAssignedToUserId INT,
    comments NVARCHAR(MAX),
    FOREIGN KEY (grievanceId) REFERENCES grievances(grievanceId),
    FOREIGN KEY (changedByUserId) REFERENCES users(id),
    FOREIGN KEY (oldStatusId) REFERENCES requestStatuses(statusId),
    FOREIGN KEY (newStatusId) REFERENCES requestStatuses(statusId),
    FOREIGN KEY (oldAssignedToUserId) REFERENCES users(id),
    FOREIGN KEY (newAssignedToUserId) REFERENCES users(id)
);

-- Compliance Documents Table
CREATE TABLE complianceDocuments (
    documentId INT IDENTITY(1,1) PRIMARY KEY,
    organizationId INT NOT NULL,
    documentName NVARCHAR(255) NOT NULL,
    documentPath NVARCHAR(500) NOT NULL,
    documentType NVARCHAR(100) NOT NULL,
    uploadedBy INT NOT NULL,
    uploadedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    folderPath NVARCHAR(500) NOT NULL,
    FOREIGN KEY (organizationId) REFERENCES organizations(id),
    FOREIGN KEY (uploadedBy) REFERENCES users(id)
);

-- Notification Logs Table (exact name from schema)
CREATE TABLE notification_logs (
    notification_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    organization_id INT NOT NULL,
    module NVARCHAR(50) NOT NULL CHECK (module IN ('DPR', 'Grievance', 'Notice', 'Document', 'Admin')),
    action NVARCHAR(100) NOT NULL,
    action_type NVARCHAR(50) NOT NULL CHECK (action_type IN ('created', 'reassigned', 'updated', 'escalated', 'translated', 'closed', 'viewed')),
    timestamp DATETIME2 NOT NULL DEFAULT GETDATE(),
    status NVARCHAR(50) NOT NULL DEFAULT 'active',
    initiator NVARCHAR(50) NOT NULL DEFAULT 'user',
    message NVARCHAR(MAX) NOT NULL,
    is_read BIT NOT NULL DEFAULT 0,
    related_item_id INT,
    related_item_type NVARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- Email Settings Table
CREATE TABLE emailSettings (
    id INT IDENTITY(1,1) PRIMARY KEY,
    provider NVARCHAR(20) NOT NULL DEFAULT 'smtp' CHECK (provider IN ('smtp', 'sendgrid')),
    fromEmail NVARCHAR(255) NOT NULL,
    fromName NVARCHAR(255) NOT NULL,
    smtpHost NVARCHAR(255),
    smtpPort INT,
    smtpUsername NVARCHAR(255),
    smtpPassword NVARCHAR(255),
    useTLS BIT DEFAULT 1,
    sendgridApiKey NVARCHAR(500),
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE()
);

-- Email Templates Table
CREATE TABLE emailTemplates (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL UNIQUE,
    subject NVARCHAR(500) NOT NULL,
    body NVARCHAR(MAX) NOT NULL,
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE()
);

-- OTP Verifications Table
CREATE TABLE otpVerifications (
    id INT IDENTITY(1,1) PRIMARY KEY,
    token NVARCHAR(255) NOT NULL UNIQUE,
    otp NVARCHAR(10) NOT NULL,
    email NVARCHAR(255) NOT NULL,
    organizationId INT,
    expiresAt DATETIME2 NOT NULL,
    createdAt DATETIME2 DEFAULT GETDATE(),
    verified BIT DEFAULT 0,
    verifiedAt DATETIME2,
    FOREIGN KEY (organizationId) REFERENCES organizations(id)
);

-- Exception Logs Table
CREATE TABLE exceptionLogs (
    id INT IDENTITY(1,1) PRIMARY KEY,
    pageName NVARCHAR(255) NOT NULL,
    functionName NVARCHAR(255) NOT NULL,
    errorMessage NVARCHAR(MAX) NOT NULL,
    stackTrace NVARCHAR(MAX),
    userId INT,
    organizationId INT,
    browserInfo NVARCHAR(500),
    url NVARCHAR(1000),
    additionalInfo NVARCHAR(MAX),
    severity NVARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status NVARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'ignored')),
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    resolvedAt DATETIME2,
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (organizationId) REFERENCES organizations(id)
);

-- Notices Table
CREATE TABLE notices (
    noticeId INT IDENTITY(1,1) PRIMARY KEY,
    organizationId INT NOT NULL,
    noticeName NVARCHAR(255) NOT NULL,
    noticeBody NVARCHAR(MAX) NOT NULL,
    createdBy INT NOT NULL,
    createdOn DATETIME2 NOT NULL DEFAULT GETDATE(),
    noticeType NVARCHAR(100),
    version NVARCHAR(50),
    folderLocation NVARCHAR(500),
    FOREIGN KEY (organizationId) REFERENCES organizations(id),
    FOREIGN KEY (createdBy) REFERENCES users(id)
);

-- Translated Notices Table
CREATE TABLE translatedNotices (
    id INT IDENTITY(1,1) PRIMARY KEY,
    organizationId INT NOT NULL,
    noticeId INT NOT NULL,
    createdOn DATETIME2 NOT NULL DEFAULT GETDATE(),
    language NVARCHAR(50) NOT NULL,
    translatedBody NVARCHAR(MAX) NOT NULL,
    filePath NVARCHAR(500),
    FOREIGN KEY (organizationId) REFERENCES organizations(id),
    FOREIGN KEY (noticeId) REFERENCES notices(noticeId)
);

PRINT 'All tables created successfully!';
GO