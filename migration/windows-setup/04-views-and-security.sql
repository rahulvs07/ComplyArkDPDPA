-- ComplyArk DPDPA Management Platform - Views, Additional Indexes, and Security
-- Execute this script after running 03-stored-procedures.sql

USE ComplyArkDB;
GO

-- =============================================
-- VIEWS FOR REPORTING AND ANALYTICS
-- =============================================

-- View: Complete DPR Request Details with Organization and User Info
CREATE OR ALTER VIEW vw_DPRRequestDetails
AS
SELECT 
    dr.requestId,
    dr.organizationId,
    org.businessName AS organizationName,
    org.contactPersonName,
    org.contactEmail,
    dr.firstName,
    dr.lastName,
    dr.email,
    dr.phone,
    dr.requestType,
    dr.requestComment,
    dr.statusId,
    rs.statusName,
    rs.description AS statusDescription,
    dr.assignedToUserId,
    CONCAT(u.firstName, ' ', u.lastName) AS assignedToUserName,
    u.email AS assignedToUserEmail,
    dr.createdAt,
    dr.lastUpdatedAt,
    dr.completionDate,
    dr.completedOnTime,
    dr.closedDateTime,
    dr.closureComments,
    dbo.fn_GetDaysUntilDeadline(dr.createdAt, dr.requestType) AS daysUntilDeadline,
    dbo.fn_IsRequestOverdue(dr.createdAt, dr.requestType, dr.statusId) AS isOverdue,
    DATEDIFF(day, dr.createdAt, ISNULL(dr.closedDateTime, GETDATE())) AS daysInProcess
FROM dpr_requests dr
LEFT JOIN organizations org ON dr.organizationId = org.id
LEFT JOIN request_statuses rs ON dr.statusId = rs.statusId
LEFT JOIN users u ON dr.assignedToUserId = u.id;
GO

-- View: Complete Grievance Details with Organization and User Info
CREATE OR ALTER VIEW vw_GrievanceDetails
AS
SELECT 
    g.grievanceId,
    g.organizationId,
    org.businessName AS organizationName,
    org.contactPersonName,
    org.contactEmail,
    g.firstName,
    g.lastName,
    g.email,
    g.phone,
    g.statusId,
    rs.statusName,
    rs.description AS statusDescription,
    g.grievanceComment,
    g.assignedToUserId,
    CONCAT(u.firstName, ' ', u.lastName) AS assignedToUserName,
    u.email AS assignedToUserEmail,
    g.createdAt,
    g.lastUpdatedAt,
    g.completionDate,
    g.completedOnTime,
    g.closedDateTime,
    g.closureComments,
    dbo.fn_GetDaysUntilDeadline(g.createdAt, 'Grievance') AS daysUntilDeadline,
    dbo.fn_IsRequestOverdue(g.createdAt, 'Grievance', g.statusId) AS isOverdue,
    DATEDIFF(day, g.createdAt, ISNULL(g.closedDateTime, GETDATE())) AS daysInProcess
FROM grievances g
LEFT JOIN organizations org ON g.organizationId = org.id
LEFT JOIN request_statuses rs ON g.statusId = rs.statusId
LEFT JOIN users u ON g.assignedToUserId = u.id;
GO

-- View: Organization Dashboard Summary
CREATE OR ALTER VIEW vw_OrganizationDashboard
AS
SELECT 
    org.id AS organizationId,
    org.businessName,
    org.contactPersonName,
    org.contactEmail,
    org.noOfUsers,
    -- DPR Statistics
    COUNT(DISTINCT dr.requestId) AS totalDPRRequests,
    SUM(CASE WHEN dr.statusId = 1 THEN 1 ELSE 0 END) AS submittedDPRRequests,
    SUM(CASE WHEN dr.statusId = 2 THEN 1 ELSE 0 END) AS inProgressDPRRequests,
    SUM(CASE WHEN dr.statusId = 6 THEN 1 ELSE 0 END) AS closedDPRRequests,
    SUM(CASE WHEN dr.statusId = 7 THEN 1 ELSE 0 END) AS rejectedDPRRequests,
    SUM(CASE WHEN dr.completedOnTime = 1 THEN 1 ELSE 0 END) AS onTimeDPRCompletions,
    -- Grievance Statistics
    COUNT(DISTINCT g.grievanceId) AS totalGrievances,
    SUM(CASE WHEN g.statusId = 1 THEN 1 ELSE 0 END) AS submittedGrievances,
    SUM(CASE WHEN g.statusId = 2 THEN 1 ELSE 0 END) AS inProgressGrievances,
    SUM(CASE WHEN g.statusId = 6 THEN 1 ELSE 0 END) AS closedGrievances,
    SUM(CASE WHEN g.statusId = 5 THEN 1 ELSE 0 END) AS escalatedGrievances,
    -- Compliance Score
    dbo.fn_GetComplianceScore(org.id) AS complianceScore,
    -- Recent Activity (Last 30 days)
    COUNT(DISTINCT CASE WHEN dr.createdAt >= DATEADD(day, -30, GETDATE()) THEN dr.requestId END) AS recentDPRRequests,
    COUNT(DISTINCT CASE WHEN g.createdAt >= DATEADD(day, -30, GETDATE()) THEN g.grievanceId END) AS recentGrievances
FROM organizations org
LEFT JOIN dpr_requests dr ON org.id = dr.organizationId
LEFT JOIN grievances g ON org.id = g.organizationId
GROUP BY org.id, org.businessName, org.contactPersonName, org.contactEmail, org.noOfUsers;
GO

-- View: User Workload Summary
CREATE OR ALTER VIEW vw_UserWorkload
AS
SELECT 
    u.id AS userId,
    u.username,
    CONCAT(u.firstName, ' ', u.lastName) AS fullName,
    u.email,
    u.organizationId,
    org.businessName AS organizationName,
    u.role,
    -- Current Workload
    dbo.fn_GetUserWorkload(u.id) AS currentWorkload,
    -- DPR Assignments
    COUNT(DISTINCT dr.requestId) AS assignedDPRRequests,
    COUNT(DISTINCT CASE WHEN dr.statusId NOT IN (6, 7) THEN dr.requestId END) AS activeDPRRequests,
    -- Grievance Assignments
    COUNT(DISTINCT g.grievanceId) AS assignedGrievances,
    COUNT(DISTINCT CASE WHEN g.statusId NOT IN (6, 7) THEN g.grievanceId END) AS activeGrievances,
    -- Performance Metrics
    COUNT(DISTINCT CASE WHEN dr.completedOnTime = 1 THEN dr.requestId END) AS onTimeCompletions,
    COUNT(DISTINCT CASE WHEN dr.statusId = 6 THEN dr.requestId END) + 
    COUNT(DISTINCT CASE WHEN g.statusId = 6 THEN g.grievanceId END) AS totalCompletions
FROM users u
LEFT JOIN organizations org ON u.organizationId = org.id
LEFT JOIN dpr_requests dr ON u.id = dr.assignedToUserId
LEFT JOIN grievances g ON u.id = g.assignedToUserId
WHERE u.isActive = 1
GROUP BY u.id, u.username, u.firstName, u.lastName, u.email, u.organizationId, org.businessName, u.role;
GO

-- View: Overdue Requests and Grievances
CREATE OR ALTER VIEW vw_OverdueItems
AS
SELECT 
    'DPR' AS itemType,
    CAST(dr.requestId AS NVARCHAR(50)) AS itemId,
    dr.organizationId,
    org.businessName AS organizationName,
    CONCAT(dr.firstName, ' ', dr.lastName) AS submitterName,
    dr.email AS submitterEmail,
    dr.requestType AS itemCategory,
    dr.createdAt,
    dr.assignedToUserId,
    CONCAT(u.firstName, ' ', u.lastName) AS assignedToUserName,
    dbo.fn_GetDaysUntilDeadline(dr.createdAt, dr.requestType) AS daysOverdue,
    rs.statusName AS currentStatus
FROM dpr_requests dr
LEFT JOIN organizations org ON dr.organizationId = org.id
LEFT JOIN users u ON dr.assignedToUserId = u.id
LEFT JOIN request_statuses rs ON dr.statusId = rs.statusId
WHERE dbo.fn_IsRequestOverdue(dr.createdAt, dr.requestType, dr.statusId) = 1

UNION ALL

SELECT 
    'Grievance' AS itemType,
    CAST(g.grievanceId AS NVARCHAR(50)) AS itemId,
    g.organizationId,
    org.businessName AS organizationName,
    CONCAT(g.firstName, ' ', g.lastName) AS submitterName,
    g.email AS submitterEmail,
    'Grievance' AS itemCategory,
    g.createdAt,
    g.assignedToUserId,
    CONCAT(u.firstName, ' ', u.lastName) AS assignedToUserName,
    dbo.fn_GetDaysUntilDeadline(g.createdAt, 'Grievance') AS daysOverdue,
    rs.statusName AS currentStatus
FROM grievances g
LEFT JOIN organizations org ON g.organizationId = org.id
LEFT JOIN users u ON g.assignedToUserId = u.id
LEFT JOIN request_statuses rs ON g.statusId = rs.statusId
WHERE dbo.fn_IsRequestOverdue(g.createdAt, 'Grievance', g.statusId) = 1;
GO

-- View: System Activity Log (Exception Logs with User Details)
CREATE OR ALTER VIEW vw_SystemActivityLog
AS
SELECT 
    el.id,
    el.pageName,
    el.functionName,
    el.errorMessage,
    el.severity,
    el.isResolved,
    el.createdAt,
    el.resolvedAt,
    el.userId,
    CONCAT(u.firstName, ' ', u.lastName) AS userName,
    u.organizationId,
    org.businessName AS organizationName,
    el.resolvedBy,
    CONCAT(ru.firstName, ' ', ru.lastName) AS resolvedByUserName,
    el.additionalDetails
FROM exception_logs el
LEFT JOIN users u ON el.userId = u.id
LEFT JOIN organizations org ON u.organizationId = org.id
LEFT JOIN users ru ON el.resolvedBy = ru.id;
GO

-- =============================================
-- ADDITIONAL PERFORMANCE INDEXES
-- =============================================

-- Index for fast date range queries
CREATE NONCLUSTERED INDEX IX_DPRRequests_CreatedAt_Status 
ON dpr_requests (createdAt, statusId) 
INCLUDE (organizationId, assignedToUserId, requestType);

CREATE NONCLUSTERED INDEX IX_Grievances_CreatedAt_Status 
ON grievances (createdAt, statusId) 
INCLUDE (organizationId, assignedToUserId);

-- Index for overdue calculations
CREATE NONCLUSTERED INDEX IX_DPRRequests_Overdue 
ON dpr_requests (createdAt, requestType, statusId) 
WHERE statusId NOT IN (6, 7);

CREATE NONCLUSTERED INDEX IX_Grievances_Overdue 
ON grievances (createdAt, statusId) 
WHERE statusId NOT IN (6, 7);

-- Index for user performance queries
CREATE NONCLUSTERED INDEX IX_DPRRequests_Assignment_Performance 
ON dpr_requests (assignedToUserId, statusId, completedOnTime) 
INCLUDE (createdAt, closedDateTime);

CREATE NONCLUSTERED INDEX IX_Grievances_Assignment_Performance 
ON grievances (assignedToUserId, statusId, completedOnTime) 
INCLUDE (createdAt, closedDateTime);

-- Index for notification queries
CREATE NONCLUSTERED INDEX IX_Notifications_User_Read 
ON notifications (userId, isRead, createdAt DESC);

-- Index for exception log monitoring
CREATE NONCLUSTERED INDEX IX_ExceptionLogs_Severity_Resolved 
ON exception_logs (severity, isResolved, createdAt DESC);

-- =============================================
-- SECURITY PROCEDURES
-- =============================================

-- Procedure to create database users with appropriate permissions
CREATE OR ALTER PROCEDURE sp_CreateDatabaseUser
    @Username NVARCHAR(100),
    @Password NVARCHAR(255),
    @Role NVARCHAR(20) = 'user'
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @SQL NVARCHAR(MAX);
    
    -- Create SQL Server login
    SET @SQL = 'CREATE LOGIN [' + @Username + '] WITH PASSWORD = ''' + @Password + ''', CHECK_POLICY = ON';
    EXEC sp_executesql @SQL;
    
    -- Create database user
    SET @SQL = 'CREATE USER [' + @Username + '] FOR LOGIN [' + @Username + ']';
    EXEC sp_executesql @SQL;
    
    -- Assign role-based permissions
    IF @Role = 'admin'
    BEGIN
        EXEC sp_addrolemember 'db_datareader', @Username;
        EXEC sp_addrolemember 'db_datawriter', @Username;
        EXEC sp_addrolemember 'db_ddladmin', @Username;
    END
    ELSE
    BEGIN
        EXEC sp_addrolemember 'db_datareader', @Username;
        EXEC sp_addrolemember 'db_datawriter', @Username;
    END;
    
    PRINT 'Database user ' + @Username + ' created with ' + @Role + ' permissions.';
END;
GO

-- Procedure to audit data access
CREATE OR ALTER PROCEDURE sp_AuditDataAccess
    @UserId INT,
    @TableName NVARCHAR(100),
    @Action NVARCHAR(50),
    @RecordId NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Log data access for compliance audit trail
    INSERT INTO exception_logs (pageName, functionName, errorMessage, userId, additionalDetails, severity, isResolved)
    VALUES (
        'Data Access Audit',
        @Action,
        'User accessed ' + @TableName + ' record ' + @RecordId,
        @UserId,
        JSON_OBJECT('table', @TableName, 'action', @Action, 'recordId', @RecordId, 'timestamp', GETDATE()),
        'info',
        1
    );
END;
GO

-- =============================================
-- MAINTENANCE PROCEDURES
-- =============================================

-- Procedure to clean up old logs and maintain database performance
CREATE OR ALTER PROCEDURE sp_DatabaseMaintenance
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @RetentionDays INT = 90;
    DECLARE @CutoffDate DATETIME2 = DATEADD(day, -@RetentionDays, GETDATE());
    
    -- Archive old exception logs
    DELETE FROM exception_logs 
    WHERE createdAt < @CutoffDate 
    AND isResolved = 1 
    AND severity NOT IN ('error', 'critical');
    
    -- Archive old notifications that have been read
    DELETE FROM notifications 
    WHERE createdAt < @CutoffDate 
    AND isRead = 1;
    
    -- Update statistics on frequently used tables
    UPDATE STATISTICS dpr_requests;
    UPDATE STATISTICS grievances;
    UPDATE STATISTICS users;
    UPDATE STATISTICS organizations;
    
    -- Log maintenance completion
    INSERT INTO exception_logs (pageName, functionName, errorMessage, severity, isResolved)
    VALUES ('Database Maintenance', 'sp_DatabaseMaintenance', 'Automated maintenance completed successfully', 'info', 1);
    
    PRINT 'Database maintenance completed successfully.';
END;
GO

-- Procedure to generate compliance reports
CREATE OR ALTER PROCEDURE sp_GenerateComplianceReport
    @OrganizationId INT = NULL,
    @StartDate DATETIME2 = NULL,
    @EndDate DATETIME2 = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Set default date range if not provided
    IF @StartDate IS NULL SET @StartDate = DATEADD(month, -3, GETDATE());
    IF @EndDate IS NULL SET @EndDate = GETDATE();
    
    -- Summary statistics
    SELECT 
        'Summary' AS ReportSection,
        COUNT(DISTINCT dr.requestId) AS TotalDPRRequests,
        COUNT(DISTINCT g.grievanceId) AS TotalGrievances,
        AVG(CASE WHEN dr.completedOnTime = 1 THEN 100.0 ELSE 0.0 END) AS AvgComplianceRate,
        COUNT(DISTINCT CASE WHEN dbo.fn_IsRequestOverdue(dr.createdAt, dr.requestType, dr.statusId) = 1 THEN dr.requestId END) AS OverdueDPRRequests,
        COUNT(DISTINCT CASE WHEN dbo.fn_IsRequestOverdue(g.createdAt, 'Grievance', g.statusId) = 1 THEN g.grievanceId END) AS OverdueGrievances
    FROM dpr_requests dr
    FULL OUTER JOIN grievances g ON dr.organizationId = g.organizationId
    WHERE dr.createdAt BETWEEN @StartDate AND @EndDate
    AND (@OrganizationId IS NULL OR dr.organizationId = @OrganizationId OR g.organizationId = @OrganizationId);
    
    -- Detailed breakdown by status
    SELECT 
        'Status Breakdown' AS ReportSection,
        rs.statusName,
        COUNT(DISTINCT dr.requestId) AS DPRRequests,
        COUNT(DISTINCT g.grievanceId) AS Grievances
    FROM request_statuses rs
    LEFT JOIN dpr_requests dr ON rs.statusId = dr.statusId 
        AND dr.createdAt BETWEEN @StartDate AND @EndDate
        AND (@OrganizationId IS NULL OR dr.organizationId = @OrganizationId)
    LEFT JOIN grievances g ON rs.statusId = g.statusId 
        AND g.createdAt BETWEEN @StartDate AND @EndDate
        AND (@OrganizationId IS NULL OR g.organizationId = @OrganizationId)
    GROUP BY rs.statusName
    ORDER BY rs.statusName;
END;
GO

PRINT 'Views, additional indexes, and security procedures created successfully!';
PRINT '';
PRINT 'Available Views:';
PRINT '- vw_DPRRequestDetails (Complete DPR request information)';
PRINT '- vw_GrievanceDetails (Complete grievance information)';
PRINT '- vw_OrganizationDashboard (Organization summary statistics)';
PRINT '- vw_UserWorkload (User performance and workload)';
PRINT '- vw_OverdueItems (Overdue requests and grievances)';
PRINT '- vw_SystemActivityLog (System activity and exception logs)';
PRINT '';
PRINT 'Additional Security Procedures:';
PRINT '- sp_CreateDatabaseUser (Create users with role-based permissions)';
PRINT '- sp_AuditDataAccess (Log data access for compliance)';
PRINT '- sp_DatabaseMaintenance (Automated cleanup and optimization)';
PRINT '- sp_GenerateComplianceReport (Generate compliance reports)';
PRINT '';
PRINT 'Performance indexes added for optimal query execution.';
GO