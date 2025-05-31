-- ComplyArk DPDPA Management Platform - MSSQL Functions and Stored Procedures
-- Script 007: Create Functions and Stored Procedures for Business Logic

USE ComplyArkDB;
GO

-- Function: Calculate SLA Compliance Status
CREATE FUNCTION fn_CalculateSLAStatus
(
    @createdDate DATETIME2,
    @slaDays INT,
    @completedDate DATETIME2 = NULL
)
RETURNS NVARCHAR(20)
AS
BEGIN
    DECLARE @result NVARCHAR(20);
    DECLARE @targetDate DATETIME2;
    DECLARE @checkDate DATETIME2;
    
    SET @targetDate = DATEADD(DAY, @slaDays, @createdDate);
    SET @checkDate = COALESCE(@completedDate, GETDATE());
    
    IF @checkDate <= @targetDate
        SET @result = 'On Time';
    ELSE
        SET @result = 'Overdue';
    
    RETURN @result;
END;
GO

-- Function: Get Days Remaining for SLA
CREATE FUNCTION fn_GetSLADaysRemaining
(
    @createdDate DATETIME2,
    @slaDays INT
)
RETURNS INT
AS
BEGIN
    DECLARE @targetDate DATETIME2;
    DECLARE @daysRemaining INT;
    
    SET @targetDate = DATEADD(DAY, @slaDays, @createdDate);
    SET @daysRemaining = DATEDIFF(DAY, GETDATE(), @targetDate);
    
    RETURN @daysRemaining;
END;
GO

-- Stored Procedure: Create DP Request with History
CREATE PROCEDURE sp_CreateDPRequest
    @organizationId INT,
    @firstName NVARCHAR(100),
    @lastName NVARCHAR(100),
    @email NVARCHAR(255),
    @phone NVARCHAR(50),
    @requestType NVARCHAR(100),
    @requestComment NVARCHAR(MAX),
    @assignedToUserId INT = NULL,
    @requestId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Insert the request
        INSERT INTO dp_requests (organizationId, firstName, lastName, email, phone, requestType, requestComment, statusId, assignedToUserId)
        VALUES (@organizationId, @firstName, @lastName, @email, @phone, @requestType, @requestComment, 35, @assignedToUserId); -- 35 = Submitted
        
        SET @requestId = SCOPE_IDENTITY();
        
        -- Create initial history entry
        INSERT INTO dpr_request_history (requestId, changedByUserId, newStatusId, changeDate, comments)
        VALUES (@requestId, COALESCE(@assignedToUserId, 1), 35, GETDATE(), 'Request submitted');
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Stored Procedure: Update DP Request Status with History
CREATE PROCEDURE sp_UpdateDPRequestStatus
    @requestId INT,
    @newStatusId INT,
    @assignedToUserId INT = NULL,
    @changedByUserId INT,
    @comments NVARCHAR(MAX) = NULL,
    @completionDate DATE = NULL,
    @closureComments NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @oldStatusId INT;
    DECLARE @oldAssignedToUserId INT;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Get current values
        SELECT @oldStatusId = statusId, @oldAssignedToUserId = assignedToUserId
        FROM dp_requests
        WHERE requestId = @requestId;
        
        -- Update the request
        UPDATE dp_requests
        SET statusId = @newStatusId,
            assignedToUserId = COALESCE(@assignedToUserId, assignedToUserId),
            lastUpdatedAt = GETDATE(),
            completionDate = @completionDate,
            closureComments = @closureComments,
            closedDateTime = CASE WHEN @newStatusId IN (40, 41) THEN GETDATE() ELSE NULL END, -- 40=Closed, 41=Rejected
            completedOnTime = CASE 
                WHEN @newStatusId IN (40, 41) THEN 
                    CASE WHEN dbo.fn_CalculateSLAStatus(createdAt, 30, GETDATE()) = 'On Time' THEN 1 ELSE 0 END
                ELSE NULL 
            END
        WHERE requestId = @requestId;
        
        -- Create history entry
        INSERT INTO dpr_request_history (requestId, changedByUserId, oldStatusId, newStatusId, oldAssignedToUserId, newAssignedToUserId, comments, changeDate)
        VALUES (@requestId, @changedByUserId, @oldStatusId, @newStatusId, @oldAssignedToUserId, COALESCE(@assignedToUserId, @oldAssignedToUserId), @comments, GETDATE());
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Stored Procedure: Create Grievance with History
CREATE PROCEDURE sp_CreateGrievance
    @organizationId INT,
    @firstName NVARCHAR(100),
    @lastName NVARCHAR(100),
    @email NVARCHAR(255),
    @phone NVARCHAR(50),
    @grievanceComment NVARCHAR(MAX),
    @assignedToUserId INT = NULL,
    @grievanceId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Insert the grievance
        INSERT INTO grievances (organizationId, firstName, lastName, email, phone, statusId, grievanceComment, assignedToUserId)
        VALUES (@organizationId, @firstName, @lastName, @email, @phone, 35, @grievanceComment, @assignedToUserId); -- 35 = Submitted
        
        SET @grievanceId = SCOPE_IDENTITY();
        
        -- Create initial history entry
        INSERT INTO grievance_history (grievanceId, changedByUserId, newStatusId, changeDate, comments)
        VALUES (@grievanceId, COALESCE(@assignedToUserId, 1), 35, GETDATE(), 'Grievance submitted');
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Stored Procedure: Log Exception
CREATE PROCEDURE sp_LogException
    @pageName NVARCHAR(255),
    @functionName NVARCHAR(255),
    @errorMessage NVARCHAR(MAX),
    @userId INT = NULL,
    @additionalDetails NVARCHAR(MAX) = NULL,
    @severity NVARCHAR(20) = 'error'
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO exception_logs (pageName, functionName, errorMessage, userId, additionalDetails, severity, createdAt)
    VALUES (@pageName, @functionName, @errorMessage, @userId, @additionalDetails, @severity, GETDATE());
END;
GO

-- Stored Procedure: Create Notification
CREATE PROCEDURE sp_CreateNotification
    @userId INT,
    @organizationId INT,
    @title NVARCHAR(255),
    @message NVARCHAR(MAX),
    @type NVARCHAR(50) = 'info'
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO notifications (userId, organizationId, title, message, type, createdAt)
    VALUES (@userId, @organizationId, @title, @message, @type, GETDATE());
END;
GO

-- Stored Procedure: Get Dashboard Statistics
CREATE PROCEDURE sp_GetDashboardStats
    @organizationId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Pending requests count
    SELECT 
        COUNT(*) AS pendingCount,
        'dp_requests' AS category
    FROM dp_requests 
    WHERE (@organizationId IS NULL OR organizationId = @organizationId)
    AND statusId NOT IN (40, 41) -- Not closed or rejected
    
    UNION ALL
    
    -- Overdue requests count
    SELECT 
        COUNT(*) AS overdueCount,
        'overdue_requests' AS category
    FROM dp_requests dr
    JOIN request_statuses rs ON dr.statusId = rs.statusId
    WHERE (@organizationId IS NULL OR dr.organizationId = @organizationId)
    AND dr.statusId NOT IN (40, 41)
    AND DATEDIFF(DAY, dr.createdAt, GETDATE()) > rs.slaDays
    
    UNION ALL
    
    -- Total grievances count
    SELECT 
        COUNT(*) AS grievanceCount,
        'grievances' AS category
    FROM grievances
    WHERE (@organizationId IS NULL OR organizationId = @organizationId)
    
    UNION ALL
    
    -- Compliance documents count
    SELECT 
        COUNT(*) AS documentsCount,
        'documents' AS category
    FROM compliance_documents
    WHERE (@organizationId IS NULL OR organizationId = @organizationId)
    AND isActive = 1;
END;
GO

-- Stored Procedure: Archive Old Records
CREATE PROCEDURE sp_ArchiveOldRecords
    @archiveDays INT = 365
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @archiveDate DATETIME2 = DATEADD(DAY, -@archiveDays, GETDATE());
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Archive old exception logs (resolved ones older than archive date)
        DELETE FROM exception_logs
        WHERE isResolved = 1 
        AND resolvedAt < @archiveDate;
        
        -- Archive old notifications (read ones older than archive date)
        DELETE FROM notifications
        WHERE isRead = 1 
        AND readAt < @archiveDate;
        
        COMMIT TRANSACTION;
        
        PRINT 'Archive completed successfully';
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

PRINT 'All functions and stored procedures created successfully!';
GO