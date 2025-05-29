-- ComplyArk DPDPA Management Platform - Master Setup Script
-- Execute this single script to set up the complete database
-- This script combines all previous scripts in the correct order

USE master;
GO

-- Create database if it doesn't exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'ComplyArkDB')
BEGIN
    CREATE DATABASE ComplyArkDB;
    PRINT 'Database ComplyArkDB created successfully.';
END
ELSE
BEGIN
    PRINT 'Database ComplyArkDB already exists.';
END
GO

USE ComplyArkDB;
GO

-- =============================================
-- PART 1: DROP EXISTING OBJECTS (IF ANY)
-- =============================================
PRINT 'Dropping existing objects if they exist...';

-- Drop triggers first
IF OBJECT_ID('tr_ExceptionLog_CriticalErrors', 'TR') IS NOT NULL DROP TRIGGER tr_ExceptionLog_CriticalErrors;
IF OBJECT_ID('tr_Grievance_AssignmentNotification', 'TR') IS NOT NULL DROP TRIGGER tr_Grievance_AssignmentNotification;
IF OBJECT_ID('tr_DPRRequest_AssignmentNotification', 'TR') IS NOT NULL DROP TRIGGER tr_DPRRequest_AssignmentNotification;
IF OBJECT_ID('tr_Grievance_CheckCompletion', 'TR') IS NOT NULL DROP TRIGGER tr_Grievance_CheckCompletion;
IF OBJECT_ID('tr_DPRRequest_CheckCompletion', 'TR') IS NOT NULL DROP TRIGGER tr_DPRRequest_CheckCompletion;
IF OBJECT_ID('tr_Grievance_UpdateTimestamp', 'TR') IS NOT NULL DROP TRIGGER tr_Grievance_UpdateTimestamp;
IF OBJECT_ID('tr_DPRRequest_UpdateTimestamp', 'TR') IS NOT NULL DROP TRIGGER tr_DPRRequest_UpdateTimestamp;

-- Drop views
IF OBJECT_ID('vw_SystemActivityLog', 'V') IS NOT NULL DROP VIEW vw_SystemActivityLog;
IF OBJECT_ID('vw_OverdueItems', 'V') IS NOT NULL DROP VIEW vw_OverdueItems;
IF OBJECT_ID('vw_UserWorkload', 'V') IS NOT NULL DROP VIEW vw_UserWorkload;
IF OBJECT_ID('vw_OrganizationDashboard', 'V') IS NOT NULL DROP VIEW vw_OrganizationDashboard;
IF OBJECT_ID('vw_GrievanceDetails', 'V') IS NOT NULL DROP VIEW vw_GrievanceDetails;
IF OBJECT_ID('vw_DPRRequestDetails', 'V') IS NOT NULL DROP VIEW vw_DPRRequestDetails;

-- Drop stored procedures
IF OBJECT_ID('sp_GenerateComplianceReport', 'P') IS NOT NULL DROP PROCEDURE sp_GenerateComplianceReport;
IF OBJECT_ID('sp_DatabaseMaintenance', 'P') IS NOT NULL DROP PROCEDURE sp_DatabaseMaintenance;
IF OBJECT_ID('sp_AuditDataAccess', 'P') IS NOT NULL DROP PROCEDURE sp_AuditDataAccess;
IF OBJECT_ID('sp_CreateDatabaseUser', 'P') IS NOT NULL DROP PROCEDURE sp_CreateDatabaseUser;
IF OBJECT_ID('sp_UpdateGrievance', 'P') IS NOT NULL DROP PROCEDURE sp_UpdateGrievance;
IF OBJECT_ID('sp_UpdateDPRRequest', 'P') IS NOT NULL DROP PROCEDURE sp_UpdateDPRRequest;
IF OBJECT_ID('sp_GetOrganizationDashboard', 'P') IS NOT NULL DROP PROCEDURE sp_GetOrganizationDashboard;
IF OBJECT_ID('sp_GetGrievanceHistory', 'P') IS NOT NULL DROP PROCEDURE sp_GetGrievanceHistory;
IF OBJECT_ID('sp_GetDPRRequestHistory', 'P') IS NOT NULL DROP PROCEDURE sp_GetDPRRequestHistory;
IF OBJECT_ID('sp_GetGrievancesWithDetails', 'P') IS NOT NULL DROP PROCEDURE sp_GetGrievancesWithDetails;
IF OBJECT_ID('sp_GetDPRRequestsWithDetails', 'P') IS NOT NULL DROP PROCEDURE sp_GetDPRRequestsWithDetails;

-- Drop functions
IF OBJECT_ID('fn_GetUserWorkload', 'FN') IS NOT NULL DROP FUNCTION fn_GetUserWorkload;
IF OBJECT_ID('fn_GetComplianceScore', 'FN') IS NOT NULL DROP FUNCTION fn_GetComplianceScore;
IF OBJECT_ID('fn_IsRequestOverdue', 'FN') IS NOT NULL DROP FUNCTION fn_IsRequestOverdue;
IF OBJECT_ID('fn_GetDaysUntilDeadline', 'FN') IS NOT NULL DROP FUNCTION fn_GetDaysUntilDeadline;

-- Drop tables in reverse dependency order
IF OBJECT_ID('dpr_request_history', 'U') IS NOT NULL DROP TABLE dpr_request_history;
IF OBJECT_ID('grievance_history', 'U') IS NOT NULL DROP TABLE grievance_history;
IF OBJECT_ID('translated_notices', 'U') IS NOT NULL DROP TABLE translated_notices;
IF OBJECT_ID('notices', 'U') IS NOT NULL DROP TABLE notices;
IF OBJECT_ID('email_templates', 'U') IS NOT NULL DROP TABLE email_templates;
IF OBJECT_ID('exception_logs', 'U') IS NOT NULL DROP TABLE exception_logs;
IF OBJECT_ID('notifications', 'U') IS NOT NULL DROP TABLE notifications;
IF OBJECT_ID('compliance_documents', 'U') IS NOT NULL DROP TABLE compliance_documents;
IF OBJECT_ID('grievances', 'U') IS NOT NULL DROP TABLE grievances;
IF OBJECT_ID('dpr_requests', 'U') IS NOT NULL DROP TABLE dpr_requests;
IF OBJECT_ID('request_statuses', 'U') IS NOT NULL DROP TABLE request_statuses;
IF OBJECT_ID('users', 'U') IS NOT NULL DROP TABLE users;
IF OBJECT_ID('organizations', 'U') IS NOT NULL DROP TABLE organizations;
IF OBJECT_ID('templates', 'U') IS NOT NULL DROP TABLE templates;
IF OBJECT_ID('industries', 'U') IS NOT NULL DROP TABLE industries;

PRINT 'Existing objects dropped successfully.';

-- Execute scripts in sequence
PRINT '=============================================';
PRINT 'EXECUTING SCHEMA CREATION...';
PRINT '=============================================';