# ComplyArk DPDPA Management Platform - MSSQL Migration Package

This directory contains complete MSSQL database migration scripts for migrating the ComplyArk DPDPA Management Platform from PostgreSQL to Microsoft SQL Server for Windows deployment.

## Overview

The migration package includes all database components:
- **16 Tables** with proper relationships and constraints
- **7 Views** for reporting and analytics
- **2 Functions** for business logic calculations
- **7 Stored Procedures** for complex operations
- **6 Triggers** for data integrity and automation
- **Performance Indexes** for optimal query execution
- **Complete Sample Data** matching current production system

## Migration Scripts

### Core Structure
1. **001-create-database.sql** - Creates the ComplyArkDB database
2. **002-create-tables.sql** - Creates all 16 tables with relationships
3. **003-create-indexes.sql** - Creates performance indexes

### Master Data
4. **004-insert-master-data.sql** - Industries, request statuses, email templates
5. **005-insert-organizations-users.sql** - Organizations and user accounts

### Advanced Features
6. **006-create-views.sql** - Analytics and reporting views
7. **007-create-functions-procedures.sql** - Business logic functions
8. **008-create-triggers.sql** - Data integrity triggers

### Sample Data
9. **009-insert-sample-data.sql** - Sample requests, grievances, notifications

## Quick Start

### Method 1: Execute All Scripts at Once
```sql
-- Connect to SQL Server Management Studio (SSMS)
-- Open and execute: EXECUTE_ALL.sql
```

### Method 2: Execute Individual Scripts
Execute scripts in numerical order (001 through 009).

## Database Structure

### Core Tables
- `industries` - Industry categories
- `organizations` - Client organizations
- `users` - System users with role-based access
- `request_statuses` - Status workflow definitions

### Request Management
- `dp_requests` - Data protection requests
- `dpr_request_history` - Request audit trail
- `grievances` - Grievance submissions
- `grievance_history` - Grievance audit trail

### Content Management
- `templates` - Privacy notice templates
- `notices` - Generated privacy notices
- `translated_notices` - Multi-language translations
- `email_templates` - Email notification templates

### System Features
- `notifications` - User notifications
- `compliance_documents` - Document management
- `exception_logs` - Error tracking and monitoring

## Test Credentials

After migration, use these credentials to test the system:

**Super Administrator**
- Username: `complyarkadmin`
- Password: `password123`
- Access: Full system administration

**Organization Administrator**
- Username: `tech_admin`
- Password: `password123`
- Organization: TechCorp Solutions Ltd (ID: 33)

## Sample Data Included

The migration includes realistic sample data:

### Organizations
- **TechCorp Solutions Ltd** - Technology company (ID: 33)
- **MediCare Hospital Chain** - Healthcare provider (ID: 34)
- **FinanceFirst Bank** - Financial services (ID: 35)

### Sample Requests
- **Request #59** - Correction request (matches current system)
- **Request #60** - Access request
- **Request #61** - Erasure request
- **Request #62** - Portability request

### Complete Audit Trail
- Full request history matching current system updates
- Status changes with timestamps
- User assignments and modifications

## Key Features

### Business Logic Functions
- `fn_CalculateSLAStatus` - SLA compliance calculation
- `fn_GetSLADaysRemaining` - Time tracking

### Automated Procedures
- `sp_CreateDPRequest` - Request creation with history
- `sp_UpdateDPRequestStatus` - Status updates with audit trail
- `sp_LogException` - Error logging
- `sp_CreateNotification` - Notification management

### Data Integrity Triggers
- Automatic timestamp updates
- Status change notifications
- Role change auditing
- Organization deletion protection

### Analytics Views
- `vw_organization_dashboard` - Organization summaries
- `vw_request_status_summary` - Status analytics
- `vw_sla_compliance` - Compliance reporting
- `vw_user_activity` - User performance metrics

## Connection Configuration

Update your application connection string to:
```
Server=localhost;Database=ComplyArkDB;Integrated Security=true;
```

Or for SQL Server Authentication:
```
Server=localhost;Database=ComplyArkDB;User Id=sa;Password=your_password;
```

## Verification Steps

After migration:

1. **Database Creation**
   ```sql
   USE ComplyArkDB;
   SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES;
   -- Should return 16
   ```

2. **Sample Data Verification**
   ```sql
   SELECT COUNT(*) FROM dp_requests;
   -- Should return 4
   
   SELECT COUNT(*) FROM users;
   -- Should return 8
   ```

3. **Test Login**
   - Use provided credentials to verify authentication
   - Check dashboard functionality
   - Test request creation and updates

## Migration Benefits

### Performance Improvements
- Optimized indexes for fast queries
- Stored procedures for complex operations
- Efficient data types and constraints

### Enhanced Security
- Role-based access control
- Audit trails for all changes
- Data integrity constraints

### Business Continuity
- Complete data preservation
- Matching current system functionality
- No data loss during migration

## Support

This migration package provides:
- Complete database schema
- All current data preserved
- Business logic implemented
- Performance optimizations
- Security enhancements

The migrated database maintains full compatibility with your existing ComplyArk application while providing the benefits of MSSQL Server deployment on Windows environments.