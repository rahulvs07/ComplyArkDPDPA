-- ComplyArk Views for Microsoft SQL Server
-- Create useful views for reporting and analytics

USE ComplyArk;
GO

-- View for DPRequests with status and assigned user details
CREATE OR ALTER VIEW [dbo].[vw_DPRequestsComplete]
AS
SELECT 
    r.requestId,
    r.organizationId,
    o.businessName AS organizationName,
    r.firstName,
    r.lastName,
    r.firstName + ' ' + r.lastName AS fullName,
    r.email,
    r.phone,
    r.requestType,
    r.requestComment,
    r.statusId,
    s.statusName,
    r.assignedToUserId,
    CASE WHEN u.id IS NULL THEN NULL ELSE u.firstName + ' ' + u.lastName END AS assignedToName,
    r.createdAt,
    r.lastUpdatedAt,
    r.completionDate,
    r.completedOnTime,
    r.closedDateTime,
    r.closureComments,
    DATEDIFF(DAY, r.createdAt, ISNULL(r.closedDateTime, GETDATE())) AS daysOpen,
    DATEADD(DAY, s.slaDays, CAST(r.createdAt AS DATE)) AS expectedCompletionDate
FROM 
    dpRequests r
INNER JOIN
    organizations o ON r.organizationId = o.id
INNER JOIN
    requestStatuses s ON r.statusId = s.statusId
LEFT JOIN
    users u ON r.assignedToUserId = u.id;
GO

-- View for Grievances with status and assigned user details
CREATE OR ALTER VIEW [dbo].[vw_GrievancesComplete]
AS
SELECT 
    g.grievanceId,
    g.organizationId,
    o.businessName AS organizationName,
    g.firstName,
    g.lastName,
    g.firstName + ' ' + g.lastName AS fullName,
    g.email,
    g.phone,
    g.grievanceComment,
    g.statusId,
    s.statusName,
    g.assignedToUserId,
    CASE WHEN u.id IS NULL THEN NULL ELSE u.firstName + ' ' + u.lastName END AS assignedToName,
    g.createdAt,
    g.lastUpdatedAt,
    g.completionDate,
    g.completedOnTime,
    g.closedDateTime,
    g.closureComments,
    DATEDIFF(DAY, g.createdAt, ISNULL(g.closedDateTime, GETDATE())) AS daysOpen,
    DATEADD(DAY, s.slaDays, CAST(g.createdAt AS DATE)) AS expectedCompletionDate
FROM 
    grievances g
INNER JOIN
    organizations o ON g.organizationId = o.id
INNER JOIN
    requestStatuses s ON g.statusId = s.statusId
LEFT JOIN
    users u ON g.assignedToUserId = u.id;
GO

-- View for Notices with associated organization
CREATE OR ALTER VIEW [dbo].[vw_NoticesComplete]
AS
SELECT 
    n.noticeId,
    n.organizationId,
    o.businessName AS organizationName,
    n.noticeName,
    n.noticeBody,
    n.createdBy,
    u.firstName + ' ' + u.lastName AS createdByName,
    n.createdOn,
    n.noticeType,
    n.version,
    n.folderLocation,
    (SELECT COUNT(*) FROM translatedNotices tn WHERE tn.noticeId = n.noticeId) AS translationCount
FROM 
    notices n
INNER JOIN
    organizations o ON n.organizationId = o.id
INNER JOIN
    users u ON n.createdBy = u.id;
GO

-- View for DPRequest weekly dashboard metrics
CREATE OR ALTER VIEW [dbo].[vw_DPRequestWeeklyMetrics]
AS
SELECT 
    organizationId,
    DATEADD(DAY, -DATEPART(WEEKDAY, createdAt) + 1, CAST(createdAt AS DATE)) AS weekStartDate,
    requestType,
    COUNT(*) AS requestCount,
    SUM(CASE WHEN statusName = 'Closed' THEN 1 ELSE 0 END) AS closedCount,
    SUM(CASE WHEN completedOnTime = 1 THEN 1 ELSE 0 END) AS completedOnTimeCount,
    SUM(CASE WHEN completedOnTime = 0 THEN 1 ELSE 0 END) AS completedLateCount,
    AVG(CASE WHEN closedDateTime IS NOT NULL THEN DATEDIFF(DAY, createdAt, closedDateTime) ELSE NULL END) AS avgDaysToClose
FROM 
    [dbo].[vw_DPRequestsComplete]
GROUP BY
    organizationId,
    DATEADD(DAY, -DATEPART(WEEKDAY, createdAt) + 1, CAST(createdAt AS DATE)),
    requestType;
GO

-- View for Grievance weekly dashboard metrics
CREATE OR ALTER VIEW [dbo].[vw_GrievanceWeeklyMetrics]
AS
SELECT 
    organizationId,
    DATEADD(DAY, -DATEPART(WEEKDAY, createdAt) + 1, CAST(createdAt AS DATE)) AS weekStartDate,
    COUNT(*) AS grievanceCount,
    SUM(CASE WHEN statusName = 'Closed' THEN 1 ELSE 0 END) AS closedCount,
    SUM(CASE WHEN completedOnTime = 1 THEN 1 ELSE 0 END) AS completedOnTimeCount,
    SUM(CASE WHEN completedOnTime = 0 THEN 1 ELSE 0 END) AS completedLateCount,
    AVG(CASE WHEN closedDateTime IS NOT NULL THEN DATEDIFF(DAY, createdAt, closedDateTime) ELSE NULL END) AS avgDaysToClose
FROM 
    [dbo].[vw_GrievancesComplete]
GROUP BY
    organizationId,
    DATEADD(DAY, -DATEPART(WEEKDAY, createdAt) + 1, CAST(createdAt AS DATE));
GO

-- View for status distribution dashboard
CREATE OR ALTER VIEW [dbo].[vw_RequestStatusDistribution]
AS
SELECT 
    'DPRequest' AS requestType,
    organizationId,
    statusName,
    COUNT(*) AS requestCount
FROM 
    [dbo].[vw_DPRequestsComplete]
GROUP BY
    organizationId,
    statusName

UNION ALL

SELECT 
    'Grievance' AS requestType,
    organizationId,
    statusName,
    COUNT(*) AS requestCount
FROM 
    [dbo].[vw_GrievancesComplete]
GROUP BY
    organizationId,
    statusName;
GO

-- View for upcoming SLA deadlines
CREATE OR ALTER VIEW [dbo].[vw_UpcomingSLADeadlines]
AS
SELECT 
    'DPRequest' AS requestType,
    requestId AS id,
    organizationId,
    fullName,
    email,
    statusName,
    CASE WHEN assignedToName IS NULL THEN 'Unassigned' ELSE assignedToName END AS assignedToName,
    createdAt,
    expectedCompletionDate,
    DATEDIFF(DAY, GETDATE(), expectedCompletionDate) AS daysRemaining
FROM 
    [dbo].[vw_DPRequestsComplete]
WHERE 
    statusName <> 'Closed'
    AND expectedCompletionDate >= GETDATE()
    AND expectedCompletionDate <= DATEADD(DAY, 7, GETDATE())

UNION ALL

SELECT 
    'Grievance' AS requestType,
    grievanceId AS id,
    organizationId,
    fullName,
    email,
    statusName,
    CASE WHEN assignedToName IS NULL THEN 'Unassigned' ELSE assignedToName END AS assignedToName,
    createdAt,
    expectedCompletionDate,
    DATEDIFF(DAY, GETDATE(), expectedCompletionDate) AS daysRemaining
FROM 
    [dbo].[vw_GrievancesComplete]
WHERE 
    statusName <> 'Closed'
    AND expectedCompletionDate >= GETDATE()
    AND expectedCompletionDate <= DATEADD(DAY, 7, GETDATE());
GO

-- View for organization stats summary
CREATE OR ALTER VIEW [dbo].[vw_OrganizationStats]
AS
SELECT 
    o.id AS organizationId,
    o.businessName,
    o.contactPersonName,
    (SELECT COUNT(*) FROM users u WHERE u.organizationId = o.id AND u.isActive = 1) AS activeUserCount,
    (SELECT COUNT(*) FROM dpRequests dp WHERE dp.organizationId = o.id) AS dpRequestCount,
    (SELECT COUNT(*) FROM grievances g WHERE g.organizationId = o.id) AS grievanceCount,
    (SELECT COUNT(*) FROM notices n WHERE n.organizationId = o.id) AS noticeCount,
    (SELECT COUNT(*) FROM translatedNotices tn WHERE tn.organizationId = o.id) AS translatedNoticeCount,
    (SELECT COUNT(*) FROM complianceDocuments cd WHERE cd.organizationId = o.id) AS documentCount
FROM 
    organizations o;
GO

-- View for compliance documents with folder structure
CREATE OR ALTER VIEW [dbo].[vw_ComplianceDocuments]
AS
SELECT 
    cd.documentId,
    cd.documentName,
    cd.documentPath,
    cd.documentType,
    cd.folderPath,
    cd.uploadedAt,
    cd.uploadedBy,
    u.firstName + ' ' + u.lastName AS uploadedByName,
    cd.organizationId,
    o.businessName AS organizationName
FROM 
    complianceDocuments cd
INNER JOIN
    users u ON cd.uploadedBy = u.id
INNER JOIN
    organizations o ON cd.organizationId = o.id;
GO