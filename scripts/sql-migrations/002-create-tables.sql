-- ComplyArk DPDPA Management Platform - MSSQL Table Creation
-- Script 002: Create All Tables with Proper Structure

USE ComplyArkDB;
GO

-- Drop existing tables in reverse dependency order if they exist
IF OBJECT_ID('dpr_request_history', 'U') IS NOT NULL DROP TABLE dpr_request_history;
IF OBJECT_ID('grievance_history', 'U') IS NOT NULL DROP TABLE grievance_history;
IF OBJECT_ID('translated_notices', 'U') IS NOT NULL DROP TABLE translated_notices;
IF OBJECT_ID('notices', 'U') IS NOT NULL DROP TABLE notices;
IF OBJECT_ID('email_templates', 'U') IS NOT NULL DROP TABLE email_templates;
IF OBJECT_ID('exception_logs', 'U') IS NOT NULL DROP TABLE exception_logs;
IF OBJECT_ID('notifications', 'U') IS NOT NULL DROP TABLE notifications;
IF OBJECT_ID('compliance_documents', 'U') IS NOT NULL DROP TABLE compliance_documents;
IF OBJECT_ID('grievances', 'U') IS NOT NULL DROP TABLE grievances;
IF OBJECT_ID('dp_requests', 'U') IS NOT NULL DROP TABLE dp_requests;
IF OBJECT_ID('request_statuses', 'U') IS NOT NULL DROP TABLE request_statuses;
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
CREATE TABLE request_statuses (
    statusId INT IDENTITY(1,1) PRIMARY KEY,
    statusName NVARCHAR(100) NOT NULL UNIQUE,
    slaDays INT NOT NULL DEFAULT 30,
    isActive BIT NOT NULL DEFAULT 1
);

-- DP Requests Table (matches current schema exactly)
CREATE TABLE dp_requests (
    requestId INT IDENTITY(1,1) PRIMARY KEY,
    organizationId INT NOT NULL,
    firstName NVARCHAR(100) NOT NULL,
    lastName NVARCHAR(100) NOT NULL,
    email NVARCHAR(255) NOT NULL,
    phone NVARCHAR(50) NOT NULL,
    requestType NVARCHAR(100) NOT NULL,
    requestComment NVARCHAR(MAX) NOT NULL,
    statusId INT NOT NULL,
    assignedToUserId INT,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    lastUpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    completionDate DATE,
    completedOnTime BIT,
    closedDateTime DATETIME2,
    closureComments NVARCHAR(MAX),
    FOREIGN KEY (organizationId) REFERENCES organizations(id),
    FOREIGN KEY (statusId) REFERENCES request_statuses(statusId),
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
    FOREIGN KEY (statusId) REFERENCES request_statuses(statusId),
    FOREIGN KEY (assignedToUserId) REFERENCES users(id)
);

-- DP Request History Table
CREATE TABLE dpr_request_history (
    historyId INT IDENTITY(1,1) PRIMARY KEY,
    requestId INT NOT NULL,
    changeDate DATETIME2 NOT NULL DEFAULT GETDATE(),
    changedByUserId INT NOT NULL,
    oldStatusId INT,
    newStatusId INT,
    oldAssignedToUserId INT,
    newAssignedToUserId INT,
    comments NVARCHAR(MAX),
    FOREIGN KEY (requestId) REFERENCES dp_requests(requestId),
    FOREIGN KEY (changedByUserId) REFERENCES users(id),
    FOREIGN KEY (oldStatusId) REFERENCES request_statuses(statusId),
    FOREIGN KEY (newStatusId) REFERENCES request_statuses(statusId),
    FOREIGN KEY (oldAssignedToUserId) REFERENCES users(id),
    FOREIGN KEY (newAssignedToUserId) REFERENCES users(id)
);

-- Grievance History Table
CREATE TABLE grievance_history (
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
    FOREIGN KEY (oldStatusId) REFERENCES request_statuses(statusId),
    FOREIGN KEY (newStatusId) REFERENCES request_statuses(statusId),
    FOREIGN KEY (oldAssignedToUserId) REFERENCES users(id),
    FOREIGN KEY (newAssignedToUserId) REFERENCES users(id)
);

-- Compliance Documents Table
CREATE TABLE compliance_documents (
    documentId INT IDENTITY(1,1) PRIMARY KEY,
    organizationId INT NOT NULL,
    fileName NVARCHAR(255) NOT NULL,
    filePath NVARCHAR(500) NOT NULL,
    fileSize BIGINT NOT NULL,
    mimeType NVARCHAR(100) NOT NULL,
    uploadedBy INT NOT NULL,
    uploadedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    description NVARCHAR(MAX),
    isActive BIT NOT NULL DEFAULT 1,
    FOREIGN KEY (organizationId) REFERENCES organizations(id),
    FOREIGN KEY (uploadedBy) REFERENCES users(id)
);

-- Notifications Table
CREATE TABLE notifications (
    notificationId INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    organizationId INT NOT NULL,
    title NVARCHAR(255) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    type NVARCHAR(50) NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
    isRead BIT NOT NULL DEFAULT 0,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    readAt DATETIME2,
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (organizationId) REFERENCES organizations(id)
);

-- Exception Logs Table
CREATE TABLE exception_logs (
    id INT IDENTITY(1,1) PRIMARY KEY,
    pageName NVARCHAR(255) NOT NULL,
    functionName NVARCHAR(255) NOT NULL,
    errorMessage NVARCHAR(MAX) NOT NULL,
    userId INT,
    additionalDetails NVARCHAR(MAX),
    severity NVARCHAR(20) NOT NULL DEFAULT 'error' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    isResolved BIT NOT NULL DEFAULT 0,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    resolvedAt DATETIME2,
    resolvedBy INT,
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (resolvedBy) REFERENCES users(id)
);

-- Email Templates Table
CREATE TABLE email_templates (
    templateId INT IDENTITY(1,1) PRIMARY KEY,
    templateName NVARCHAR(255) NOT NULL UNIQUE,
    subject NVARCHAR(500) NOT NULL,
    htmlBody NVARCHAR(MAX) NOT NULL,
    textBody NVARCHAR(MAX),
    templateType NVARCHAR(50) NOT NULL DEFAULT 'general' CHECK (templateType IN ('otp', 'notification', 'general')),
    isActive BIT NOT NULL DEFAULT 1,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- Notices Table
CREATE TABLE notices (
    noticeId INT IDENTITY(1,1) PRIMARY KEY,
    organizationId INT NOT NULL,
    templateId INT NOT NULL,
    noticeName NVARCHAR(255) NOT NULL,
    noticeBody NVARCHAR(MAX) NOT NULL,
    createdBy INT NOT NULL,
    createdOn DATETIME2 NOT NULL DEFAULT GETDATE(),
    noticeType NVARCHAR(100),
    version NVARCHAR(50),
    folderLocation NVARCHAR(500),
    FOREIGN KEY (organizationId) REFERENCES organizations(id),
    FOREIGN KEY (templateId) REFERENCES templates(templateId),
    FOREIGN KEY (createdBy) REFERENCES users(id)
);

-- Translated Notices Table
CREATE TABLE translated_notices (
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