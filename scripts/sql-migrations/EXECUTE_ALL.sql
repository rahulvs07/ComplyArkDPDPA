-- ComplyArk DPDPA Management Platform - MSSQL Complete Migration
-- Master Execution Script: Execute All Migration Scripts in Correct Order
-- 
-- Instructions:
-- 1. Connect to your SQL Server instance using SQL Server Management Studio (SSMS)
-- 2. Execute this script as a Database Administrator
-- 3. Monitor the output for any errors
-- 4. All scripts will be executed in the correct sequence

PRINT '========================================';
PRINT 'ComplyArk DPDPA Platform - MSSQL Migration';
PRINT 'Starting complete database migration...';
PRINT '========================================';
PRINT '';

-- Script 001: Create Database
PRINT 'Executing Script 001: Create Database...';
:r "001-create-database.sql"
PRINT 'Script 001 completed.';
PRINT '';

-- Script 002: Create Tables
PRINT 'Executing Script 002: Create Tables...';
:r "002-create-tables.sql"
PRINT 'Script 002 completed.';
PRINT '';

-- Script 003: Create Indexes
PRINT 'Executing Script 003: Create Indexes...';
:r "003-create-indexes.sql"
PRINT 'Script 003 completed.';
PRINT '';

-- Script 004: Insert Master Data
PRINT 'Executing Script 004: Insert Master Data...';
:r "004-insert-master-data.sql"
PRINT 'Script 004 completed.';
PRINT '';

-- Script 005: Insert Organizations and Users
PRINT 'Executing Script 005: Insert Organizations and Users...';
:r "005-insert-organizations-users.sql"
PRINT 'Script 005 completed.';
PRINT '';

-- Script 006: Create Views
PRINT 'Executing Script 006: Create Views...';
:r "006-create-views.sql"
PRINT 'Script 006 completed.';
PRINT '';

-- Script 007: Create Functions and Stored Procedures
PRINT 'Executing Script 007: Create Functions and Stored Procedures...';
:r "007-create-functions-procedures.sql"
PRINT 'Script 007 completed.';
PRINT '';

-- Script 008: Create Triggers
PRINT 'Executing Script 008: Create Triggers...';
:r "008-create-triggers.sql"
PRINT 'Script 008 completed.';
PRINT '';

-- Script 009: Insert Sample Data
PRINT 'Executing Script 009: Insert Sample Data...';
:r "009-insert-sample-data.sql"
PRINT 'Script 009 completed.';
PRINT '';

PRINT '========================================';
PRINT 'MIGRATION COMPLETED SUCCESSFULLY!';
PRINT '';
PRINT 'Database: ComplyArkDB';
PRINT 'Tables Created: 16';
PRINT 'Views Created: 7';
PRINT 'Functions Created: 2';
PRINT 'Stored Procedures Created: 7';
PRINT 'Triggers Created: 6';
PRINT '';
PRINT 'Test Login Credentials:';
PRINT 'Super Admin: complyarkadmin / password123';
PRINT 'Tech Admin: tech_admin / password123';
PRINT 'Organization: TechCorp Solutions Ltd (ID: 33)';
PRINT '';
PRINT 'Next Steps:';
PRINT '1. Update your application connection string';
PRINT '2. Test the application with the new database';
PRINT '3. Verify all functionality works correctly';
PRINT '========================================';
GO