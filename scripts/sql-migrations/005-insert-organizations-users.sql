-- ComplyArk DPDPA Management Platform - MSSQL Organizations and Users Data
-- Script 005: Insert Organizations and Users (matching current system data)

USE ComplyArkDB;
GO

-- Insert Organizations (matching current system with ID 33)
SET IDENTITY_INSERT organizations ON;
INSERT INTO organizations (id, businessName, businessAddress, industryId, contactPersonName, contactEmail, contactPhone, noOfUsers, remarks, requestPageUrlToken) VALUES 
(33, 'TechCorp Solutions Ltd', '123 Technology Park, Electronic City, Bangalore, Karnataka 560100', 1, 'Technology Admin', 'admin@techcorp.com', '+91-9876543210', 25, 'Leading software development and IT services company', 'tc_2024_secure_token_001'),
(34, 'MediCare Hospital Chain', '456 Health Avenue, Koramangala, Bangalore, Karnataka 560034', 2, 'Dr. Medical Admin', 'admin@medicare.com', '+91-9876543211', 150, 'Multi-specialty hospital chain', 'mc_2024_secure_token_002'),
(35, 'FinanceFirst Bank', '789 Financial District, MG Road, Bangalore, Karnataka 560001', 3, 'Banking Admin', 'admin@financefirst.com', '+91-9876543212', 500, 'Private sector banking services', 'ff_2024_secure_token_003');
SET IDENTITY_INSERT organizations OFF;

-- Insert Users (matching current system with proper IDs)
SET IDENTITY_INSERT users ON;
INSERT INTO users (id, username, password, firstName, lastName, email, phone, role, organizationId, isActive, canEdit, canDelete) VALUES 
-- Super Admin
(1, 'complyarkadmin', '$2a$10$N9qo8uLOickgx2ZMRZoMye.32POc/Wt7rKp8jXOzo2Ej8j/rGVk9i', 'System', 'Administrator', 'admin@complyark.com', '+91-9000000000', 'superadmin', 33, 1, 1, 1),

-- TechCorp Solutions Users (Organization ID: 33)
(108, 'tech_admin', '$2a$10$N9qo8uLOickgx2ZMRZoMye.32POc/Wt7rKp8jXOzo2Ej8j/rGVk9i', 'Tech', 'Administrator', 'admin@techcorp.com', '+91-9876543210', 'admin', 33, 1, 1, 0),
(109, 'alex_smith', '$2a$10$N9qo8uLOickgx2ZMRZoMye.32POc/Wt7rKp8jXOzo2Ej8j/rGVk9i', 'Alex', 'Smith', 'alex@techcorp.com', '+91-9876543220', 'user', 33, 1, 1, 0),
(110, 'sarah_jones', '$2a$10$N9qo8uLOickgx2ZMRZoMye.32POc/Wt7rKp8jXOzo2Ej8j/rGVk9i', 'Sarah', 'Jones', 'sarah@techcorp.com', '+91-9876543221', 'user', 33, 1, 0, 0),

-- MediCare Hospital Users (Organization ID: 34)
(111, 'medicare_admin', '$2a$10$N9qo8uLOickgx2ZMRZoMye.32POc/Wt7rKp8jXOzo2Ej8j/rGVk9i', 'Medical', 'Administrator', 'admin@medicare.com', '+91-9876543211', 'admin', 34, 1, 1, 0),
(112, 'dr_patel', '$2a$10$N9qo8uLOickgx2ZMRZoMye.32POc/Wt7rKp8jXOzo2Ej8j/rGVk9i', 'Dr. Rajesh', 'Patel', 'rajesh@medicare.com', '+91-9876543230', 'user', 34, 1, 1, 0),

-- FinanceFirst Bank Users (Organization ID: 35)
(113, 'finance_admin', '$2a$10$N9qo8uLOickgx2ZMRZoMye.32POc/Wt7rKp8jXOzo2Ej8j/rGVk9i', 'Banking', 'Administrator', 'admin@financefirst.com', '+91-9876543212', 'admin', 35, 1, 1, 0),
(114, 'manager_kumar', '$2a$10$N9qo8uLOickgx2ZMRZoMye.32POc/Wt7rKp8jXOzo2Ej8j/rGVk9i', 'Vijay', 'Kumar', 'vijay@financefirst.com', '+91-9876543240', 'user', 35, 1, 1, 0);
SET IDENTITY_INSERT users OFF;

PRINT 'Organizations and users data inserted successfully!';
PRINT 'Login credentials:';
PRINT 'Super Admin: complyarkadmin / password123';
PRINT 'Tech Admin: tech_admin / password123';
PRINT 'User passwords are hashed for "password123"';
GO