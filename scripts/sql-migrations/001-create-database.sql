-- ComplyArk DPDPA Management Platform - MSSQL Database Creation
-- Script 001: Create Database and Basic Structure

USE master;
GO

-- Create database if it doesn't exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'ComplyArkDB')
BEGIN
    CREATE DATABASE ComplyArkDB
    COLLATE SQL_Latin1_General_CP1_CI_AS;
    PRINT 'Database ComplyArkDB created successfully.';
END
ELSE
BEGIN
    PRINT 'Database ComplyArkDB already exists.';
END
GO

USE ComplyArkDB;
GO

-- Enable snapshot isolation for better concurrency
ALTER DATABASE ComplyArkDB SET ALLOW_SNAPSHOT_ISOLATION ON;
ALTER DATABASE ComplyArkDB SET READ_COMMITTED_SNAPSHOT ON;
GO

PRINT 'Database setup completed successfully.';
GO