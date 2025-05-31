-- ComplyArk DPDPA Management Platform - MSSQL Views Creation
-- Script 006: Create Views for Data Analysis and Reporting

USE ComplyArkDB;
GO

-- View: Organization Dashboard Summary
CREATE VIEW vw_organization_dashboard AS
SELECT 
    o.id AS organizationId,
    o.businessName,
    o.industryId,
    i.industryName,
    COUNT(DISTINCT u.id) AS totalUsers,
    COUNT(DISTINCT dr.requestId) AS totalDPRequests,
    COUNT(DISTINCT g.grievanceId) AS totalGrievances,
    COUNT(DISTINCT cd.documentId) AS totalDocuments,
    COUNT(DISTINCT n.noticeId) AS totalNotices
FROM organizations o
LEFT JOIN industries i ON o.industryId = i.industryId
LEFT JOIN users u ON o.id = u.organizationId AND u.isActive = 1
LEFT JOIN dp_requests dr ON o.id = dr.organizationId
LEFT JOIN grievances g ON o.id = g.organizationId
LEFT JOIN compliance_documents cd ON o.id = cd.organizationId AND cd.isActive = 1
LEFT JOIN notices n ON o.id = n.organizationId
GROUP BY o.id, o.businessName, o.industryId, i.industryName;
GO

-- View: Request Status Summary
CREATE VIEW vw_request_status_summary AS
SELECT 
    rs.statusId,
    rs.statusName,
    rs.slaDays,
    COUNT(DISTINCT dr.requestId) AS dpRequestCount,
    COUNT(DISTINCT g.grievanceId) AS grievanceCount,
    AVG(DATEDIFF(day, dr.createdAt, COALESCE(dr.closedDateTime, GETDATE()))) AS avgDaysOpen
FROM request_statuses rs
LEFT JOIN dp_requests dr ON rs.statusId = dr.statusId
LEFT JOIN grievances g ON rs.statusId = g.statusId
WHERE rs.isActive = 1
GROUP BY rs.statusId, rs.statusName, rs.slaDays;
GO

-- View: User Activity Summary
CREATE VIEW vw_user_activity AS
SELECT 
    u.id AS userId,
    u.username,
    u.firstName + ' ' + u.lastName AS fullName,
    u.role,
    u.organizationId,
    o.businessName,
    COUNT(DISTINCT dr.requestId) AS assignedDPRequests,
    COUNT(DISTINCT g.grievanceId) AS assignedGrievances,
    COUNT(DISTINCT drh.historyId) AS dprHistoryEntries,
    COUNT(DISTINCT gh.historyId) AS grievanceHistoryEntries,
    COUNT(DISTINCT n.noticeId) AS noticesCreated
FROM users u
LEFT JOIN organizations o ON u.organizationId = o.id
LEFT JOIN dp_requests dr ON u.id = dr.assignedToUserId
LEFT JOIN grievances g ON u.id = g.assignedToUserId
LEFT JOIN dpr_request_history drh ON u.id = drh.changedByUserId
LEFT JOIN grievance_history gh ON u.id = gh.changedByUserId
LEFT JOIN notices n ON u.id = n.createdBy
WHERE u.isActive = 1
GROUP BY u.id, u.username, u.firstName, u.lastName, u.role, u.organizationId, o.businessName;
GO

-- View: SLA Compliance Report
CREATE VIEW vw_sla_compliance AS
SELECT 
    dr.organizationId,
    o.businessName,
    rs.statusName,
    rs.slaDays,
    COUNT(dr.requestId) AS totalRequests,
    SUM(CASE WHEN dr.completedOnTime = 1 THEN 1 ELSE 0 END) AS onTimeRequests,
    SUM(CASE WHEN dr.completedOnTime = 0 THEN 1 ELSE 0 END) AS overdueRequests,
    CASE 
        WHEN COUNT(dr.requestId) > 0 
        THEN CAST(SUM(CASE WHEN dr.completedOnTime = 1 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(dr.requestId) * 100
        ELSE 0 
    END AS compliancePercentage
FROM dp_requests dr
JOIN organizations o ON dr.organizationId = o.id
JOIN request_statuses rs ON dr.statusId = rs.statusId
WHERE dr.statusId IN (40, 41) -- Closed or Rejected
GROUP BY dr.organizationId, o.businessName, rs.statusName, rs.slaDays;
GO

-- View: Monthly Request Trends
CREATE VIEW vw_monthly_request_trends AS
SELECT 
    YEAR(dr.createdAt) AS requestYear,
    MONTH(dr.createdAt) AS requestMonth,
    dr.organizationId,
    o.businessName,
    dr.requestType,
    COUNT(dr.requestId) AS requestCount,
    AVG(DATEDIFF(day, dr.createdAt, COALESCE(dr.closedDateTime, GETDATE()))) AS avgProcessingDays
FROM dp_requests dr
JOIN organizations o ON dr.organizationId = o.id
GROUP BY YEAR(dr.createdAt), MONTH(dr.createdAt), dr.organizationId, o.businessName, dr.requestType;
GO

-- View: Exception Log Summary
CREATE VIEW vw_exception_summary AS
SELECT 
    el.severity,
    el.pageName,
    el.functionName,
    COUNT(el.id) AS totalExceptions,
    COUNT(CASE WHEN el.isResolved = 1 THEN 1 END) AS resolvedExceptions,
    COUNT(CASE WHEN el.isResolved = 0 THEN 1 END) AS unresolvedExceptions,
    MAX(el.createdAt) AS lastOccurrence,
    AVG(DATEDIFF(hour, el.createdAt, COALESCE(el.resolvedAt, GETDATE()))) AS avgResolutionHours
FROM exception_logs el
GROUP BY el.severity, el.pageName, el.functionName;
GO

-- View: Notification Analytics
CREATE VIEW vw_notification_analytics AS
SELECT 
    n.userId,
    u.firstName + ' ' + u.lastName AS userName,
    n.organizationId,
    o.businessName,
    n.type,
    COUNT(n.notificationId) AS totalNotifications,
    COUNT(CASE WHEN n.isRead = 1 THEN 1 END) AS readNotifications,
    COUNT(CASE WHEN n.isRead = 0 THEN 1 END) AS unreadNotifications,
    AVG(DATEDIFF(minute, n.createdAt, COALESCE(n.readAt, GETDATE()))) AS avgReadTimeMinutes
FROM notifications n
JOIN users u ON n.userId = u.id
JOIN organizations o ON n.organizationId = o.id
GROUP BY n.userId, u.firstName, u.lastName, n.organizationId, o.businessName, n.type;
GO

PRINT 'All views created successfully!';
GO