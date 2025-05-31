-- ComplyArk DPDPA Management Platform - MSSQL Index Creation
-- Script 003: Create Performance Indexes

USE ComplyArkDB;
GO

-- Primary table indexes for better performance
CREATE NONCLUSTERED INDEX IX_users_organizationId ON users(organizationId);
CREATE NONCLUSTERED INDEX IX_users_email ON users(email);
CREATE NONCLUSTERED INDEX IX_users_username ON users(username);
CREATE NONCLUSTERED INDEX IX_users_role ON users(role);

-- DP Requests indexes
CREATE NONCLUSTERED INDEX IX_dp_requests_organizationId ON dp_requests(organizationId);
CREATE NONCLUSTERED INDEX IX_dp_requests_statusId ON dp_requests(statusId);
CREATE NONCLUSTERED INDEX IX_dp_requests_assignedToUserId ON dp_requests(assignedToUserId);
CREATE NONCLUSTERED INDEX IX_dp_requests_createdAt ON dp_requests(createdAt);
CREATE NONCLUSTERED INDEX IX_dp_requests_lastUpdatedAt ON dp_requests(lastUpdatedAt);
CREATE NONCLUSTERED INDEX IX_dp_requests_requestType ON dp_requests(requestType);

-- Grievances indexes
CREATE NONCLUSTERED INDEX IX_grievances_organizationId ON grievances(organizationId);
CREATE NONCLUSTERED INDEX IX_grievances_statusId ON grievances(statusId);
CREATE NONCLUSTERED INDEX IX_grievances_assignedToUserId ON grievances(assignedToUserId);
CREATE NONCLUSTERED INDEX IX_grievances_createdAt ON grievances(createdAt);
CREATE NONCLUSTERED INDEX IX_grievances_lastUpdatedAt ON grievances(lastUpdatedAt);

-- History tables indexes
CREATE NONCLUSTERED INDEX IX_dpr_request_history_requestId ON dpr_request_history(requestId);
CREATE NONCLUSTERED INDEX IX_dpr_request_history_changeDate ON dpr_request_history(changeDate);
CREATE NONCLUSTERED INDEX IX_dpr_request_history_changedByUserId ON dpr_request_history(changedByUserId);

CREATE NONCLUSTERED INDEX IX_grievance_history_grievanceId ON grievance_history(grievanceId);
CREATE NONCLUSTERED INDEX IX_grievance_history_changeDate ON grievance_history(changeDate);
CREATE NONCLUSTERED INDEX IX_grievance_history_changedByUserId ON grievance_history(changedByUserId);

-- Notifications indexes
CREATE NONCLUSTERED INDEX IX_notifications_userId ON notifications(userId);
CREATE NONCLUSTERED INDEX IX_notifications_organizationId ON notifications(organizationId);
CREATE NONCLUSTERED INDEX IX_notifications_isRead ON notifications(isRead);
CREATE NONCLUSTERED INDEX IX_notifications_createdAt ON notifications(createdAt);

-- Exception logs indexes
CREATE NONCLUSTERED INDEX IX_exception_logs_createdAt ON exception_logs(createdAt);
CREATE NONCLUSTERED INDEX IX_exception_logs_severity ON exception_logs(severity);
CREATE NONCLUSTERED INDEX IX_exception_logs_isResolved ON exception_logs(isResolved);
CREATE NONCLUSTERED INDEX IX_exception_logs_userId ON exception_logs(userId);

-- Compliance documents indexes
CREATE NONCLUSTERED INDEX IX_compliance_documents_organizationId ON compliance_documents(organizationId);
CREATE NONCLUSTERED INDEX IX_compliance_documents_uploadedBy ON compliance_documents(uploadedBy);
CREATE NONCLUSTERED INDEX IX_compliance_documents_uploadedAt ON compliance_documents(uploadedAt);

-- Notices indexes
CREATE NONCLUSTERED INDEX IX_notices_organizationId ON notices(organizationId);
CREATE NONCLUSTERED INDEX IX_notices_templateId ON notices(templateId);
CREATE NONCLUSTERED INDEX IX_notices_createdBy ON notices(createdBy);
CREATE NONCLUSTERED INDEX IX_notices_createdOn ON notices(createdOn);

-- Translated notices indexes
CREATE NONCLUSTERED INDEX IX_translated_notices_organizationId ON translated_notices(organizationId);
CREATE NONCLUSTERED INDEX IX_translated_notices_noticeId ON translated_notices(noticeId);
CREATE NONCLUSTERED INDEX IX_translated_notices_language ON translated_notices(language);

-- Composite indexes for common queries
CREATE NONCLUSTERED INDEX IX_dp_requests_org_status ON dp_requests(organizationId, statusId);
CREATE NONCLUSTERED INDEX IX_dp_requests_status_assigned ON dp_requests(statusId, assignedToUserId);
CREATE NONCLUSTERED INDEX IX_grievances_org_status ON grievances(organizationId, statusId);
CREATE NONCLUSTERED INDEX IX_grievances_status_assigned ON grievances(statusId, assignedToUserId);
CREATE NONCLUSTERED INDEX IX_notifications_user_read ON notifications(userId, isRead);

PRINT 'All indexes created successfully!';
GO