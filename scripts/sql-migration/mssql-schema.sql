-- ComplyArk Database Schema for Microsoft SQL Server
-- Schema creation script for migration from PostgreSQL

-- Create database if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'ComplyArk')
BEGIN
    CREATE DATABASE ComplyArk;
END
GO

USE ComplyArk;
GO

-- Industries Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'industries')
BEGIN
    CREATE TABLE industries (
        industryId INT IDENTITY(1,1) PRIMARY KEY,
        industryName NVARCHAR(255) NOT NULL UNIQUE
    );
END
GO

-- Organizations Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'organizations')
BEGIN
    CREATE TABLE organizations (
        id INT IDENTITY(1,1) PRIMARY KEY,
        businessName NVARCHAR(255) NOT NULL,
        businessAddress NVARCHAR(MAX) NOT NULL,
        industryId INT NOT NULL,
        contactPersonName NVARCHAR(255) NOT NULL,
        contactEmail NVARCHAR(255) NOT NULL,
        contactPhone NVARCHAR(50) NOT NULL,
        noOfUsers INT NOT NULL,
        remarks NVARCHAR(MAX),
        requestPageUrlToken NVARCHAR(MAX),
        CONSTRAINT FK_organizations_industries FOREIGN KEY (industryId) REFERENCES industries(industryId)
    );
END
GO

-- Users Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(255) NOT NULL UNIQUE,
        password NVARCHAR(MAX) NOT NULL,
        firstName NVARCHAR(255) NOT NULL,
        lastName NVARCHAR(255) NOT NULL,
        email NVARCHAR(255) NOT NULL,
        phone NVARCHAR(50) NOT NULL,
        role NVARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
        organizationId INT NOT NULL,
        isActive BIT NOT NULL DEFAULT 1,
        createdAt DATETIME NOT NULL DEFAULT GETDATE(),
        canEdit BIT NOT NULL DEFAULT 0,
        canDelete BIT NOT NULL DEFAULT 0,
        CONSTRAINT FK_users_organizations FOREIGN KEY (organizationId) REFERENCES organizations(id)
    );
END
GO

-- Templates Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'templates')
BEGIN
    CREATE TABLE templates (
        templateId INT IDENTITY(1,1) PRIMARY KEY,
        templateName NVARCHAR(255) NOT NULL,
        templateBody NVARCHAR(MAX) NOT NULL,
        industryId INT NOT NULL,
        templatePath NVARCHAR(MAX),
        CONSTRAINT FK_templates_industries FOREIGN KEY (industryId) REFERENCES industries(industryId)
    );
END
GO

-- Notices Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'notices')
BEGIN
    CREATE TABLE notices (
        noticeId INT IDENTITY(1,1) PRIMARY KEY,
        organizationId INT NOT NULL,
        noticeName NVARCHAR(255) NOT NULL,
        noticeBody NVARCHAR(MAX) NOT NULL,
        createdBy INT NOT NULL,
        createdOn DATETIME NOT NULL DEFAULT GETDATE(),
        noticeType NVARCHAR(255),
        version NVARCHAR(50),
        folderLocation NVARCHAR(MAX),
        CONSTRAINT FK_notices_organizations FOREIGN KEY (organizationId) REFERENCES organizations(id),
        CONSTRAINT FK_notices_users FOREIGN KEY (createdBy) REFERENCES users(id)
    );
END
GO

-- TranslatedNotices Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'translatedNotices')
BEGIN
    CREATE TABLE translatedNotices (
        id INT IDENTITY(1,1) PRIMARY KEY,
        noticeId INT NOT NULL,
        organizationId INT NOT NULL,
        language NVARCHAR(50) NOT NULL,
        translatedBody NVARCHAR(MAX) NOT NULL,
        filePath NVARCHAR(MAX),
        createdOn DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_translatedNotices_notices FOREIGN KEY (noticeId) REFERENCES notices(noticeId),
        CONSTRAINT FK_translatedNotices_organizations FOREIGN KEY (organizationId) REFERENCES organizations(id)
    );
END
GO

-- RequestStatus Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'requestStatuses')
BEGIN
    CREATE TABLE requestStatuses (
        statusId INT IDENTITY(1,1) PRIMARY KEY,
        statusName NVARCHAR(100) NOT NULL,
        slaDays INT NOT NULL,
        isActive BIT NOT NULL DEFAULT 1
    );
END
GO

-- DPRequests Table (Data Principal Requests)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'dpRequests')
BEGIN
    CREATE TABLE dpRequests (
        requestId INT IDENTITY(1,1) PRIMARY KEY,
        organizationId INT NOT NULL,
        firstName NVARCHAR(255) NOT NULL,
        lastName NVARCHAR(255) NOT NULL,
        email NVARCHAR(255) NOT NULL,
        phone NVARCHAR(50) NOT NULL,
        requestType NVARCHAR(20) NOT NULL CHECK (requestType IN ('Access', 'Correction', 'Nomination', 'Erasure')),
        requestComment NVARCHAR(MAX),
        statusId INT NOT NULL,
        assignedToUserId INT,
        createdAt DATETIME NOT NULL DEFAULT GETDATE(),
        lastUpdatedAt DATETIME,
        completionDate DATE,
        completedOnTime BIT,
        closedDateTime DATETIME,
        closureComments NVARCHAR(MAX),
        CONSTRAINT FK_dpRequests_organizations FOREIGN KEY (organizationId) REFERENCES organizations(id),
        CONSTRAINT FK_dpRequests_requestStatuses FOREIGN KEY (statusId) REFERENCES requestStatuses(statusId),
        CONSTRAINT FK_dpRequests_users FOREIGN KEY (assignedToUserId) REFERENCES users(id)
    );
END
GO

-- DPRequestHistory Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'dpRequestHistory')
BEGIN
    CREATE TABLE dpRequestHistory (
        historyId INT IDENTITY(1,1) PRIMARY KEY,
        requestId INT NOT NULL,
        changeDate DATETIME NOT NULL DEFAULT GETDATE(),
        changedByUserId INT NOT NULL,
        oldStatusId INT,
        newStatusId INT,
        oldAssignedToUserId INT,
        newAssignedToUserId INT,
        comments NVARCHAR(MAX),
        CONSTRAINT FK_dpRequestHistory_dpRequests FOREIGN KEY (requestId) REFERENCES dpRequests(requestId),
        CONSTRAINT FK_dpRequestHistory_changedBy FOREIGN KEY (changedByUserId) REFERENCES users(id),
        CONSTRAINT FK_dpRequestHistory_oldStatus FOREIGN KEY (oldStatusId) REFERENCES requestStatuses(statusId),
        CONSTRAINT FK_dpRequestHistory_newStatus FOREIGN KEY (newStatusId) REFERENCES requestStatuses(statusId),
        CONSTRAINT FK_dpRequestHistory_oldAssigned FOREIGN KEY (oldAssignedToUserId) REFERENCES users(id),
        CONSTRAINT FK_dpRequestHistory_newAssigned FOREIGN KEY (newAssignedToUserId) REFERENCES users(id)
    );
END
GO

-- Grievances Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'grievances')
BEGIN
    CREATE TABLE grievances (
        grievanceId INT IDENTITY(1,1) PRIMARY KEY,
        organizationId INT NOT NULL,
        firstName NVARCHAR(255) NOT NULL,
        lastName NVARCHAR(255) NOT NULL,
        email NVARCHAR(255) NOT NULL,
        phone NVARCHAR(50) NOT NULL,
        grievanceComment NVARCHAR(MAX) NOT NULL,
        statusId INT NOT NULL,
        assignedToUserId INT,
        createdAt DATETIME NOT NULL DEFAULT GETDATE(),
        lastUpdatedAt DATETIME,
        completionDate DATE,
        completedOnTime BIT,
        closedDateTime DATETIME,
        closureComments NVARCHAR(MAX),
        CONSTRAINT FK_grievances_organizations FOREIGN KEY (organizationId) REFERENCES organizations(id),
        CONSTRAINT FK_grievances_requestStatuses FOREIGN KEY (statusId) REFERENCES requestStatuses(statusId),
        CONSTRAINT FK_grievances_users FOREIGN KEY (assignedToUserId) REFERENCES users(id)
    );
END
GO

-- GrievanceHistory Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'grievanceHistory')
BEGIN
    CREATE TABLE grievanceHistory (
        historyId INT IDENTITY(1,1) PRIMARY KEY,
        grievanceId INT NOT NULL,
        changeDate DATETIME NOT NULL DEFAULT GETDATE(),
        changedByUserId INT NOT NULL,
        oldStatusId INT,
        newStatusId INT,
        oldAssignedToUserId INT,
        newAssignedToUserId INT,
        comments NVARCHAR(MAX),
        CONSTRAINT FK_grievanceHistory_grievances FOREIGN KEY (grievanceId) REFERENCES grievances(grievanceId),
        CONSTRAINT FK_grievanceHistory_changedBy FOREIGN KEY (changedByUserId) REFERENCES users(id),
        CONSTRAINT FK_grievanceHistory_oldStatus FOREIGN KEY (oldStatusId) REFERENCES requestStatuses(statusId),
        CONSTRAINT FK_grievanceHistory_newStatus FOREIGN KEY (newStatusId) REFERENCES requestStatuses(statusId),
        CONSTRAINT FK_grievanceHistory_oldAssigned FOREIGN KEY (oldAssignedToUserId) REFERENCES users(id),
        CONSTRAINT FK_grievanceHistory_newAssigned FOREIGN KEY (newAssignedToUserId) REFERENCES users(id)
    );
END
GO

-- Compliance Documents Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'complianceDocuments')
BEGIN
    CREATE TABLE complianceDocuments (
        documentId INT IDENTITY(1,1) PRIMARY KEY,
        documentName NVARCHAR(255) NOT NULL,
        documentPath NVARCHAR(MAX) NOT NULL,
        documentType NVARCHAR(50) NOT NULL,
        uploadedBy INT NOT NULL,
        uploadedAt DATETIME NOT NULL DEFAULT GETDATE(),
        organizationId INT NOT NULL,
        folderPath NVARCHAR(MAX) NOT NULL,
        CONSTRAINT FK_complianceDocuments_users FOREIGN KEY (uploadedBy) REFERENCES users(id),
        CONSTRAINT FK_complianceDocuments_organizations FOREIGN KEY (organizationId) REFERENCES organizations(id)
    );
END
GO

-- OTP Verification Table (for email verification)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'otpVerification')
BEGIN
    CREATE TABLE otpVerification (
        id INT IDENTITY(1,1) PRIMARY KEY,
        email NVARCHAR(255) NOT NULL,
        otp NVARCHAR(10) NOT NULL,
        organizationId INT NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT GETDATE(),
        expiresAt DATETIME NOT NULL,
        attempts INT NOT NULL DEFAULT 0,
        verified BIT NOT NULL DEFAULT 0,
        CONSTRAINT FK_otpVerification_organizations FOREIGN KEY (organizationId) REFERENCES organizations(id)
    );
END
GO

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS IX_dpRequests_organizationId ON dpRequests(organizationId);
CREATE INDEX IF NOT EXISTS IX_dpRequests_statusId ON dpRequests(statusId);
CREATE INDEX IF NOT EXISTS IX_grievances_organizationId ON grievances(organizationId);
CREATE INDEX IF NOT EXISTS IX_grievances_statusId ON grievances(statusId);
CREATE INDEX IF NOT EXISTS IX_notices_organizationId ON notices(organizationId);
CREATE INDEX IF NOT EXISTS IX_users_organizationId ON users(organizationId);
CREATE INDEX IF NOT EXISTS IX_complianceDocuments_organizationId ON complianceDocuments(organizationId);
GO