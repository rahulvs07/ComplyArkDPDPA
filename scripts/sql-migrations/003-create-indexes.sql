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
CREATE NONCLUSTERED INDEX IX_dpRequests_organizationId ON dpRequests(organizationId);
CREATE NONCLUSTERED INDEX IX_dpRequests_statusId ON dpRequests(statusId);
CREATE NONCLUSTERED INDEX IX_dpRequests_assignedToUserId ON dpRequests(assignedToUserId);
CREATE NONCLUSTERED INDEX IX_dpRequests_createdAt ON dpRequests(createdAt);
CREATE NONCLUSTERED INDEX IX_dpRequests_lastUpdatedAt ON dpRequests(lastUpdatedAt);
CREATE NONCLUSTERED INDEX IX_dpRequests_requestType ON dpRequests(requestType);

-- Grievances indexes
CREATE NONCLUSTERED INDEX IX_grievances_organizationId ON grievances(organizationId);
CREATE NONCLUSTERED INDEX IX_grievances_statusId ON grievances(statusId);
CREATE NONCLUSTERED INDEX IX_grievances_assignedToUserId ON grievances(assignedToUserId);
CREATE NONCLUSTERED INDEX IX_grievances_createdAt ON grievances(createdAt);
CREATE NONCLUSTERED INDEX IX_grievances_lastUpdatedAt ON grievances(lastUpdatedAt);

-- History tables indexes
CREATE NONCLUSTERED INDEX IX_dpRequestHistory_requestId ON dpRequestHistory(requestId);
CREATE NONCLUSTERED INDEX IX_dpRequestHistory_changeDate ON dpRequestHistory(changeDate);
CREATE NONCLUSTERED INDEX IX_dpRequestHistory_changedByUserId ON dpRequestHistory(changedByUserId);

CREATE NONCLUSTERED INDEX IX_grievanceHistory_grievanceId ON grievanceHistory(grievanceId);
CREATE NONCLUSTERED INDEX IX_grievanceHistory_changeDate ON grievanceHistory(changeDate);
CREATE NONCLUSTERED INDEX IX_grievanceHistory_changedByUserId ON grievanceHistory(changedByUserId);

-- Notification logs indexes
CREATE NONCLUSTERED INDEX IX_notification_logs_user_id ON notification_logs(user_id);
CREATE NONCLUSTERED INDEX IX_notification_logs_organization_id ON notification_logs(organization_id);
CREATE NONCLUSTERED INDEX IX_notification_logs_is_read ON notification_logs(is_read);
CREATE NONCLUSTERED INDEX IX_notification_logs_timestamp ON notification_logs(timestamp);

-- Exception logs indexes
CREATE NONCLUSTERED INDEX IX_exceptionLogs_createdAt ON exceptionLogs(createdAt);
CREATE NONCLUSTERED INDEX IX_exceptionLogs_severity ON exceptionLogs(severity);
CREATE NONCLUSTERED INDEX IX_exceptionLogs_status ON exceptionLogs(status);
CREATE NONCLUSTERED INDEX IX_exceptionLogs_userId ON exceptionLogs(userId);

-- Compliance documents indexes
CREATE NONCLUSTERED INDEX IX_complianceDocuments_organizationId ON complianceDocuments(organizationId);
CREATE NONCLUSTERED INDEX IX_complianceDocuments_uploadedBy ON complianceDocuments(uploadedBy);
CREATE NONCLUSTERED INDEX IX_complianceDocuments_uploadedAt ON complianceDocuments(uploadedAt);

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