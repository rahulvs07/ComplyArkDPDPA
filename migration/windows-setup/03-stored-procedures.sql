-- ComplyArk DPDPA Management Platform - Stored Procedures, Functions, and Triggers
-- Execute this script after running 01-create-schema.sql and 02-insert-sample-data.sql

USE ComplyArkDB;
GO

-- =============================================
-- STORED PROCEDURES
-- =============================================

-- Procedure to get DPR requests with status and user details
CREATE OR ALTER PROCEDURE sp_GetDPRRequestsWithDetails
    @OrganizationId INT = NULL,
    @StatusId INT = NULL,
    @AssignedToUserId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        dr.requestId,
        dr.organizationId,
        dr.firstName,
        dr.lastName,
        dr.email,
        dr.phone,
        dr.requestType,
        dr.requestComment,
        dr.statusId,
        rs.statusName,
        dr.assignedToUserId,
        CONCAT(u.firstName, ' ', u.lastName) AS assignedToUserName,
        dr.createdAt,
        dr.lastUpdatedAt,
        dr.completionDate,
        dr.completedOnTime,
        dr.closedDateTime,
        dr.closureComments,
        org.businessName AS organizationName
    FROM dpr_requests dr
    LEFT JOIN request_statuses rs ON dr.statusId = rs.statusId
    LEFT JOIN users u ON dr.assignedToUserId = u.id
    LEFT JOIN organizations org ON dr.organizationId = org.id
    WHERE 
        (@OrganizationId IS NULL OR dr.organizationId = @OrganizationId)
        AND (@StatusId IS NULL OR dr.statusId = @StatusId)
        AND (@AssignedToUserId IS NULL OR dr.assignedToUserId = @AssignedToUserId)
    ORDER BY dr.createdAt DESC;
END;
GO

-- Procedure to get grievances with status and user details
CREATE OR ALTER PROCEDURE sp_GetGrievancesWithDetails
    @OrganizationId INT = NULL,
    @StatusId INT = NULL,
    @AssignedToUserId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        g.grievanceId,
        g.organizationId,
        g.firstName,
        g.lastName,
        g.email,
        g.phone,
        g.statusId,
        rs.statusName,
        g.grievanceComment,
        g.assignedToUserId,
        CONCAT(u.firstName, ' ', u.lastName) AS assignedToUserName,
        g.createdAt,
        g.lastUpdatedAt,
        g.completionDate,
        g.completedOnTime,
        g.closedDateTime,
        g.closureComments,
        org.businessName AS organizationName
    FROM grievances g
    LEFT JOIN request_statuses rs ON g.statusId = rs.statusId
    LEFT JOIN users u ON g.assignedToUserId = u.id
    LEFT JOIN organizations org ON g.organizationId = org.id
    WHERE 
        (@OrganizationId IS NULL OR g.organizationId = @OrganizationId)
        AND (@StatusId IS NULL OR g.statusId = @StatusId)
        AND (@AssignedToUserId IS NULL OR g.assignedToUserId = @AssignedToUserId)
    ORDER BY g.createdAt DESC;
END;
GO

-- Procedure to get request history with user details
CREATE OR ALTER PROCEDURE sp_GetDPRRequestHistory
    @RequestId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        h.historyId,
        h.requestId,
        h.changeDate,
        h.changedByUserId,
        CONCAT(u.firstName, ' ', u.lastName) AS changedByUserName,
        h.oldStatusId,
        os.statusName AS oldStatusName,
        h.newStatusId,
        ns.statusName AS newStatusName,
        h.oldAssignedToUserId,
        CONCAT(ou.firstName, ' ', ou.lastName) AS oldAssignedToUserName,
        h.newAssignedToUserId,
        CONCAT(nu.firstName, ' ', nu.lastName) AS newAssignedToUserName,
        h.comments
    FROM dpr_request_history h
    LEFT JOIN users u ON h.changedByUserId = u.id
    LEFT JOIN request_statuses os ON h.oldStatusId = os.statusId
    LEFT JOIN request_statuses ns ON h.newStatusId = ns.statusId
    LEFT JOIN users ou ON h.oldAssignedToUserId = ou.id
    LEFT JOIN users nu ON h.newAssignedToUserId = nu.id
    WHERE h.requestId = @RequestId
    ORDER BY h.changeDate DESC;
END;
GO

-- Procedure to get grievance history with user details
CREATE OR ALTER PROCEDURE sp_GetGrievanceHistory
    @GrievanceId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        h.historyId,
        h.grievanceId,
        h.changeDate,
        h.changedByUserId,
        CONCAT(u.firstName, ' ', u.lastName) AS changedByUserName,
        h.oldStatusId,
        os.statusName AS oldStatusName,
        h.newStatusId,
        ns.statusName AS newStatusName,
        h.oldAssignedToUserId,
        CONCAT(ou.firstName, ' ', ou.lastName) AS oldAssignedToUserName,
        h.newAssignedToUserId,
        CONCAT(nu.firstName, ' ', nu.lastName) AS newAssignedToUserName,
        h.comments
    FROM grievance_history h
    LEFT JOIN users u ON h.changedByUserId = u.id
    LEFT JOIN request_statuses os ON h.oldStatusId = os.statusId
    LEFT JOIN request_statuses ns ON h.newStatusId = ns.statusId
    LEFT JOIN users ou ON h.oldAssignedToUserId = ou.id
    LEFT JOIN users nu ON h.newAssignedToUserId = nu.id
    WHERE h.grievanceId = @GrievanceId
    ORDER BY h.changeDate DESC;
END;
GO

-- Procedure to get organization dashboard statistics
CREATE OR ALTER PROCEDURE sp_GetOrganizationDashboard
    @OrganizationId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- DPR Request Statistics
    SELECT 
        'DPR_STATS' AS category,
        COUNT(*) AS totalRequests,
        SUM(CASE WHEN statusId = 1 THEN 1 ELSE 0 END) AS submittedRequests,
        SUM(CASE WHEN statusId = 2 THEN 1 ELSE 0 END) AS inProgressRequests,
        SUM(CASE WHEN statusId = 6 THEN 1 ELSE 0 END) AS closedRequests,
        SUM(CASE WHEN statusId = 7 THEN 1 ELSE 0 END) AS rejectedRequests,
        SUM(CASE WHEN completedOnTime = 1 THEN 1 ELSE 0 END) AS onTimeCompletions,
        SUM(CASE WHEN completedOnTime = 0 THEN 1 ELSE 0 END) AS overdueCompletions
    FROM dpr_requests 
    WHERE organizationId = @OrganizationId;
    
    -- Grievance Statistics
    SELECT 
        'GRIEVANCE_STATS' AS category,
        COUNT(*) AS totalGrievances,
        SUM(CASE WHEN statusId = 1 THEN 1 ELSE 0 END) AS submittedGrievances,
        SUM(CASE WHEN statusId = 2 THEN 1 ELSE 0 END) AS inProgressGrievances,
        SUM(CASE WHEN statusId = 6 THEN 1 ELSE 0 END) AS closedGrievances,
        SUM(CASE WHEN statusId = 5 THEN 1 ELSE 0 END) AS escalatedGrievances
    FROM grievances 
    WHERE organizationId = @OrganizationId;
    
    -- Recent Activity (Last 30 days)
    SELECT 
        'RECENT_ACTIVITY' AS category,
        COUNT(DISTINCT dr.requestId) AS recentDPRRequests,
        COUNT(DISTINCT g.grievanceId) AS recentGrievances
    FROM organizations o
    LEFT JOIN dpr_requests dr ON o.id = dr.organizationId AND dr.createdAt >= DATEADD(day, -30, GETDATE())
    LEFT JOIN grievances g ON o.id = g.organizationId AND g.createdAt >= DATEADD(day, -30, GETDATE())
    WHERE o.id = @OrganizationId;
END;
GO

-- Procedure to update DPR request with history logging
CREATE OR ALTER PROCEDURE sp_UpdateDPRRequest
    @RequestId INT,
    @StatusId INT = NULL,
    @AssignedToUserId INT = NULL,
    @ClosureComments NVARCHAR(MAX) = NULL,
    @ChangedByUserId INT,
    @Comments NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    
    DECLARE @OldStatusId INT, @OldAssignedToUserId INT;
    
    -- Get current values
    SELECT @OldStatusId = statusId, @OldAssignedToUserId = assignedToUserId
    FROM dpr_requests 
    WHERE requestId = @RequestId;
    
    -- Update the request
    UPDATE dpr_requests 
    SET 
        statusId = ISNULL(@StatusId, statusId),
        assignedToUserId = ISNULL(@AssignedToUserId, assignedToUserId),
        closureComments = ISNULL(@ClosureComments, closureComments),
        lastUpdatedAt = GETDATE(),
        closedDateTime = CASE WHEN @StatusId = 6 THEN GETDATE() ELSE closedDateTime END
    WHERE requestId = @RequestId;
    
    -- Insert history record
    INSERT INTO dpr_request_history 
    (requestId, changedByUserId, oldStatusId, newStatusId, oldAssignedToUserId, newAssignedToUserId, comments, changeDate)
    VALUES 
    (@RequestId, @ChangedByUserId, @OldStatusId, ISNULL(@StatusId, @OldStatusId), 
     @OldAssignedToUserId, ISNULL(@AssignedToUserId, @OldAssignedToUserId), @Comments, GETDATE());
    
    COMMIT TRANSACTION;
END;
GO

-- Procedure to update grievance with history logging
CREATE OR ALTER PROCEDURE sp_UpdateGrievance
    @GrievanceId INT,
    @StatusId INT = NULL,
    @AssignedToUserId INT = NULL,
    @ClosureComments NVARCHAR(MAX) = NULL,
    @ChangedByUserId INT,
    @Comments NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    
    DECLARE @OldStatusId INT, @OldAssignedToUserId INT;
    
    -- Get current values
    SELECT @OldStatusId = statusId, @OldAssignedToUserId = assignedToUserId
    FROM grievances 
    WHERE grievanceId = @GrievanceId;
    
    -- Update the grievance
    UPDATE grievances 
    SET 
        statusId = ISNULL(@StatusId, statusId),
        assignedToUserId = ISNULL(@AssignedToUserId, assignedToUserId),
        closureComments = ISNULL(@ClosureComments, closureComments),
        lastUpdatedAt = GETDATE(),
        closedDateTime = CASE WHEN @StatusId = 6 THEN GETDATE() ELSE closedDateTime END
    WHERE grievanceId = @GrievanceId;
    
    -- Insert history record
    INSERT INTO grievance_history 
    (grievanceId, changedByUserId, oldStatusId, newStatusId, oldAssignedToUserId, newAssignedToUserId, comments, changeDate)
    VALUES 
    (@GrievanceId, @ChangedByUserId, @OldStatusId, ISNULL(@StatusId, @OldStatusId), 
     @OldAssignedToUserId, ISNULL(@AssignedToUserId, @OldAssignedToUserId), @Comments, GETDATE());
    
    COMMIT TRANSACTION;
END;
GO

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to calculate days until completion deadline
CREATE OR ALTER FUNCTION fn_GetDaysUntilDeadline(@CreatedAt DATETIME2, @RequestType NVARCHAR(100))
RETURNS INT
AS
BEGIN
    DECLARE @DeadlineDays INT;
    DECLARE @DaysElapsed INT;
    
    -- Set deadline based on request type (DPDPA compliance requirements)
    SET @DeadlineDays = CASE 
        WHEN @RequestType = 'Access' THEN 30
        WHEN @RequestType = 'Correction' THEN 30
        WHEN @RequestType = 'Erasure' THEN 30
        WHEN @RequestType = 'Nomination' THEN 15
        ELSE 30
    END;
    
    SET @DaysElapsed = DATEDIFF(day, @CreatedAt, GETDATE());
    
    RETURN @DeadlineDays - @DaysElapsed;
END;
GO

-- Function to check if request is overdue
CREATE OR ALTER FUNCTION fn_IsRequestOverdue(@CreatedAt DATETIME2, @RequestType NVARCHAR(100), @StatusId INT)
RETURNS BIT
AS
BEGIN
    DECLARE @IsOverdue BIT = 0;
    DECLARE @DaysUntilDeadline INT;
    
    -- Only check if request is not closed
    IF @StatusId NOT IN (6, 7) -- Not closed or rejected
    BEGIN
        SET @DaysUntilDeadline = dbo.fn_GetDaysUntilDeadline(@CreatedAt, @RequestType);
        IF @DaysUntilDeadline < 0
            SET @IsOverdue = 1;
    END
    
    RETURN @IsOverdue;
END;
GO

-- Function to get organization's compliance score
CREATE OR ALTER FUNCTION fn_GetComplianceScore(@OrganizationId INT)
RETURNS DECIMAL(5,2)
AS
BEGIN
    DECLARE @TotalRequests INT;
    DECLARE @OnTimeCompletions INT;
    DECLARE @ComplianceScore DECIMAL(5,2);
    
    SELECT 
        @TotalRequests = COUNT(*),
        @OnTimeCompletions = SUM(CASE WHEN completedOnTime = 1 THEN 1 ELSE 0 END)
    FROM dpr_requests 
    WHERE organizationId = @OrganizationId 
    AND statusId = 6; -- Only closed requests
    
    IF @TotalRequests > 0
        SET @ComplianceScore = (CAST(@OnTimeCompletions AS DECIMAL(5,2)) / @TotalRequests) * 100;
    ELSE
        SET @ComplianceScore = 100.00; -- Perfect score if no requests
    
    RETURN @ComplianceScore;
END;
GO

-- Function to get user's workload count
CREATE OR ALTER FUNCTION fn_GetUserWorkload(@UserId INT)
RETURNS INT
AS
BEGIN
    DECLARE @Workload INT;
    
    SELECT @Workload = COUNT(*)
    FROM (
        SELECT requestId FROM dpr_requests 
        WHERE assignedToUserId = @UserId AND statusId NOT IN (6, 7)
        UNION ALL
        SELECT grievanceId FROM grievances 
        WHERE assignedToUserId = @UserId AND statusId NOT IN (6, 7)
    ) AS combined_workload;
    
    RETURN ISNULL(@Workload, 0);
END;
GO

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger to update lastUpdatedAt on DPR requests
CREATE OR ALTER TRIGGER tr_DPRRequest_UpdateTimestamp
ON dpr_requests
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE dpr_requests 
    SET lastUpdatedAt = GETDATE()
    FROM dpr_requests dr
    INNER JOIN inserted i ON dr.requestId = i.requestId;
END;
GO

-- Trigger to update lastUpdatedAt on grievances
CREATE OR ALTER TRIGGER tr_Grievance_UpdateTimestamp
ON grievances
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE grievances 
    SET lastUpdatedAt = GETDATE()
    FROM grievances g
    INNER JOIN inserted i ON g.grievanceId = i.grievanceId;
END;
GO

-- Trigger to auto-assign completion status based on deadline
CREATE OR ALTER TRIGGER tr_DPRRequest_CheckCompletion
ON dpr_requests
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Update completion status when request is closed
    UPDATE dpr_requests 
    SET completedOnTime = CASE 
        WHEN dbo.fn_GetDaysUntilDeadline(createdAt, requestType) >= 0 THEN 1 
        ELSE 0 
    END,
    completionDate = CAST(GETDATE() AS DATE)
    FROM dpr_requests dr
    INNER JOIN inserted i ON dr.requestId = i.requestId
    WHERE i.statusId = 6 -- Closed status
    AND dr.completionDate IS NULL;
END;
GO

-- Trigger to auto-assign completion status for grievances
CREATE OR ALTER TRIGGER tr_Grievance_CheckCompletion
ON grievances
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Update completion status when grievance is closed
    UPDATE grievances 
    SET completedOnTime = CASE 
        WHEN dbo.fn_GetDaysUntilDeadline(createdAt, 'Grievance') >= 0 THEN 1 
        ELSE 0 
    END,
    completionDate = CAST(GETDATE() AS DATE)
    FROM grievances g
    INNER JOIN inserted i ON g.grievanceId = i.grievanceId
    WHERE i.statusId = 6 -- Closed status
    AND g.completionDate IS NULL;
END;
GO

-- Trigger to create notification when request is assigned
CREATE OR ALTER TRIGGER tr_DPRRequest_AssignmentNotification
ON dpr_requests
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Create notification when request is newly assigned
    INSERT INTO notifications (userId, organizationId, title, message, type, isRead, createdAt)
    SELECT 
        i.assignedToUserId,
        i.organizationId,
        'New DPR Request Assigned',
        'You have been assigned a new ' + i.requestType + ' request from ' + i.firstName + ' ' + i.lastName,
        'info',
        0,
        GETDATE()
    FROM inserted i
    INNER JOIN deleted d ON i.requestId = d.requestId
    WHERE i.assignedToUserId IS NOT NULL 
    AND (d.assignedToUserId IS NULL OR d.assignedToUserId != i.assignedToUserId);
END;
GO

-- Trigger to create notification when grievance is assigned
CREATE OR ALTER TRIGGER tr_Grievance_AssignmentNotification
ON grievances
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Create notification when grievance is newly assigned
    INSERT INTO notifications (userId, organizationId, title, message, type, isRead, createdAt)
    SELECT 
        i.assignedToUserId,
        i.organizationId,
        'New Grievance Assigned',
        'You have been assigned a new grievance from ' + i.firstName + ' ' + i.lastName,
        'warning',
        0,
        GETDATE()
    FROM inserted i
    INNER JOIN deleted d ON i.grievanceId = d.grievanceId
    WHERE i.assignedToUserId IS NOT NULL 
    AND (d.assignedToUserId IS NULL OR d.assignedToUserId != i.assignedToUserId);
END;
GO

-- Trigger to log exception when critical operations fail
CREATE OR ALTER TRIGGER tr_ExceptionLog_CriticalErrors
ON exception_logs
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Auto-escalate critical errors
    UPDATE exception_logs
    SET severity = 'critical'
    FROM exception_logs el
    INNER JOIN inserted i ON el.id = i.id
    WHERE i.errorMessage LIKE '%timeout%' 
    OR i.errorMessage LIKE '%connection%'
    OR i.errorMessage LIKE '%authentication%'
    OR i.errorMessage LIKE '%permission%';
END;
GO

PRINT 'Stored procedures, functions, and triggers created successfully!';
PRINT 'Available stored procedures:';
PRINT '- sp_GetDPRRequestsWithDetails';
PRINT '- sp_GetGrievancesWithDetails';
PRINT '- sp_GetDPRRequestHistory';
PRINT '- sp_GetGrievanceHistory';
PRINT '- sp_GetOrganizationDashboard';
PRINT '- sp_UpdateDPRRequest';
PRINT '- sp_UpdateGrievance';
PRINT '';
PRINT 'Available functions:';
PRINT '- fn_GetDaysUntilDeadline';
PRINT '- fn_IsRequestOverdue';
PRINT '- fn_GetComplianceScore';
PRINT '- fn_GetUserWorkload';
PRINT '';
PRINT 'Active triggers for data integrity and automation are now in place.';
GO