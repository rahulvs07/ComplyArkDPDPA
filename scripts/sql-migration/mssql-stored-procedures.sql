-- ComplyArk Stored Procedures for Microsoft SQL Server
-- Stored Procedures for common operations

USE ComplyArk;
GO

-- Procedure to get active request statuses
CREATE OR ALTER PROCEDURE [dbo].[GetActiveRequestStatuses]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT statusId, statusName, slaDays
    FROM requestStatuses
    WHERE isActive = 1
    ORDER BY statusId;
END
GO

-- Procedure to get DPRequests for an organization with status details
CREATE OR ALTER PROCEDURE [dbo].[GetDPRequestsWithStatus]
    @organizationId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        r.requestId,
        r.organizationId,
        r.firstName,
        r.lastName,
        r.email,
        r.phone,
        r.requestType,
        r.requestComment,
        r.statusId,
        s.statusName,
        r.assignedToUserId,
        u.firstName + ' ' + u.lastName AS assignedToUserName,
        r.createdAt,
        r.lastUpdatedAt,
        r.completionDate,
        r.completedOnTime,
        r.closedDateTime,
        r.closureComments
    FROM 
        dpRequests r
    INNER JOIN 
        requestStatuses s ON r.statusId = s.statusId
    LEFT JOIN
        users u ON r.assignedToUserId = u.id
    WHERE 
        r.organizationId = @organizationId
    ORDER BY 
        r.createdAt DESC;
END
GO

-- Procedure to get Grievances for an organization with status details
CREATE OR ALTER PROCEDURE [dbo].[GetGrievancesWithStatus]
    @organizationId INT
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
        g.grievanceComment,
        g.statusId,
        s.statusName,
        g.assignedToUserId,
        u.firstName + ' ' + u.lastName AS assignedToUserName,
        g.createdAt,
        g.lastUpdatedAt,
        g.completionDate,
        g.completedOnTime,
        g.closedDateTime,
        g.closureComments
    FROM 
        grievances g
    INNER JOIN 
        requestStatuses s ON g.statusId = s.statusId
    LEFT JOIN
        users u ON g.assignedToUserId = u.id
    WHERE 
        g.organizationId = @organizationId
    ORDER BY 
        g.createdAt DESC;
END
GO

-- Procedure to update DP Request status with history tracking
CREATE OR ALTER PROCEDURE [dbo].[UpdateDPRequestStatus]
    @requestId INT,
    @newStatusId INT,
    @changedByUserId INT,
    @newAssignedToUserId INT = NULL,
    @comments NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    
    DECLARE @oldStatusId INT;
    DECLARE @oldAssignedToUserId INT;
    
    -- Get current values
    SELECT @oldStatusId = statusId, @oldAssignedToUserId = assignedToUserId
    FROM dpRequests
    WHERE requestId = @requestId;
    
    -- Update completion date if new status is Closed
    DECLARE @isClosedStatus BIT = 0;
    DECLARE @slaDays INT;
    DECLARE @createdAt DATETIME;
    DECLARE @completionDate DATE = NULL;
    DECLARE @completedOnTime BIT = NULL;
    DECLARE @closedDateTime DATETIME = NULL;
    
    SELECT @slaDays = slaDays, @isClosedStatus = CASE WHEN statusName = 'Closed' THEN 1 ELSE 0 END
    FROM requestStatuses
    WHERE statusId = @newStatusId;
    
    SELECT @createdAt = createdAt
    FROM dpRequests
    WHERE requestId = @requestId;
    
    IF @isClosedStatus = 1
    BEGIN
        SET @completionDate = CONVERT(DATE, GETDATE());
        SET @closedDateTime = GETDATE();
        
        -- Calculate expected completion date
        DECLARE @expectedCompletionDate DATE = DATEADD(DAY, @slaDays, CONVERT(DATE, @createdAt));
        
        -- Check if completed on time
        SET @completedOnTime = CASE WHEN @completionDate <= @expectedCompletionDate THEN 1 ELSE 0 END;
    END
    
    -- Update request status
    UPDATE dpRequests
    SET 
        statusId = @newStatusId,
        assignedToUserId = ISNULL(@newAssignedToUserId, assignedToUserId),
        lastUpdatedAt = GETDATE(),
        completionDate = ISNULL(@completionDate, completionDate),
        completedOnTime = ISNULL(@completedOnTime, completedOnTime),
        closedDateTime = ISNULL(@closedDateTime, closedDateTime),
        closureComments = CASE WHEN @isClosedStatus = 1 THEN @comments ELSE closureComments END
    WHERE requestId = @requestId;
    
    -- Insert history record
    INSERT INTO dpRequestHistory (
        requestId,
        changeDate,
        changedByUserId,
        oldStatusId,
        newStatusId,
        oldAssignedToUserId,
        newAssignedToUserId,
        comments
    )
    VALUES (
        @requestId,
        GETDATE(),
        @changedByUserId,
        @oldStatusId,
        @newStatusId,
        @oldAssignedToUserId,
        @newAssignedToUserId,
        @comments
    );
    
    COMMIT TRANSACTION;
END
GO

-- Procedure to update Grievance status with history tracking
CREATE OR ALTER PROCEDURE [dbo].[UpdateGrievanceStatus]
    @grievanceId INT,
    @newStatusId INT,
    @changedByUserId INT,
    @newAssignedToUserId INT = NULL,
    @comments NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    
    DECLARE @oldStatusId INT;
    DECLARE @oldAssignedToUserId INT;
    
    -- Get current values
    SELECT @oldStatusId = statusId, @oldAssignedToUserId = assignedToUserId
    FROM grievances
    WHERE grievanceId = @grievanceId;
    
    -- Update completion date if new status is Closed
    DECLARE @isClosedStatus BIT = 0;
    DECLARE @slaDays INT;
    DECLARE @createdAt DATETIME;
    DECLARE @completionDate DATE = NULL;
    DECLARE @completedOnTime BIT = NULL;
    DECLARE @closedDateTime DATETIME = NULL;
    
    SELECT @slaDays = slaDays, @isClosedStatus = CASE WHEN statusName = 'Closed' THEN 1 ELSE 0 END
    FROM requestStatuses
    WHERE statusId = @newStatusId;
    
    SELECT @createdAt = createdAt
    FROM grievances
    WHERE grievanceId = @grievanceId;
    
    IF @isClosedStatus = 1
    BEGIN
        SET @completionDate = CONVERT(DATE, GETDATE());
        SET @closedDateTime = GETDATE();
        
        -- Calculate expected completion date
        DECLARE @expectedCompletionDate DATE = DATEADD(DAY, @slaDays, CONVERT(DATE, @createdAt));
        
        -- Check if completed on time
        SET @completedOnTime = CASE WHEN @completionDate <= @expectedCompletionDate THEN 1 ELSE 0 END;
    END
    
    -- Update grievance status
    UPDATE grievances
    SET 
        statusId = @newStatusId,
        assignedToUserId = ISNULL(@newAssignedToUserId, assignedToUserId),
        lastUpdatedAt = GETDATE(),
        completionDate = ISNULL(@completionDate, completionDate),
        completedOnTime = ISNULL(@completedOnTime, completedOnTime),
        closedDateTime = ISNULL(@closedDateTime, closedDateTime),
        closureComments = CASE WHEN @isClosedStatus = 1 THEN @comments ELSE closureComments END
    WHERE grievanceId = @grievanceId;
    
    -- Insert history record
    INSERT INTO grievanceHistory (
        grievanceId,
        changeDate,
        changedByUserId,
        oldStatusId,
        newStatusId,
        oldAssignedToUserId,
        newAssignedToUserId,
        comments
    )
    VALUES (
        @grievanceId,
        GETDATE(),
        @changedByUserId,
        @oldStatusId,
        @newStatusId,
        @oldAssignedToUserId,
        @newAssignedToUserId,
        @comments
    );
    
    COMMIT TRANSACTION;
END
GO

-- Procedure to get request history for a DP Request
CREATE OR ALTER PROCEDURE [dbo].[GetDPRequestHistory]
    @requestId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        h.historyId,
        h.requestId,
        h.changeDate,
        h.changedByUserId,
        changer.firstName + ' ' + changer.lastName AS changedByUserName,
        h.oldStatusId,
        oldStatus.statusName AS oldStatusName,
        h.newStatusId,
        newStatus.statusName AS newStatusName,
        h.oldAssignedToUserId,
        oldAssigned.firstName + ' ' + oldAssigned.lastName AS oldAssignedToUserName,
        h.newAssignedToUserId,
        newAssigned.firstName + ' ' + newAssigned.lastName AS newAssignedToUserName,
        h.comments
    FROM 
        dpRequestHistory h
    INNER JOIN 
        users changer ON h.changedByUserId = changer.id
    LEFT JOIN 
        requestStatuses oldStatus ON h.oldStatusId = oldStatus.statusId
    LEFT JOIN 
        requestStatuses newStatus ON h.newStatusId = newStatus.statusId
    LEFT JOIN 
        users oldAssigned ON h.oldAssignedToUserId = oldAssigned.id
    LEFT JOIN 
        users newAssigned ON h.newAssignedToUserId = newAssigned.id
    WHERE 
        h.requestId = @requestId
    ORDER BY 
        h.changeDate DESC;
END
GO

-- Procedure to get history for a Grievance
CREATE OR ALTER PROCEDURE [dbo].[GetGrievanceHistory]
    @grievanceId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        h.historyId,
        h.grievanceId,
        h.changeDate,
        h.changedByUserId,
        changer.firstName + ' ' + changer.lastName AS changedByUserName,
        h.oldStatusId,
        oldStatus.statusName AS oldStatusName,
        h.newStatusId,
        newStatus.statusName AS newStatusName,
        h.oldAssignedToUserId,
        oldAssigned.firstName + ' ' + oldAssigned.lastName AS oldAssignedToUserName,
        h.newAssignedToUserId,
        newAssigned.firstName + ' ' + newAssigned.lastName AS newAssignedToUserName,
        h.comments
    FROM 
        grievanceHistory h
    INNER JOIN 
        users changer ON h.changedByUserId = changer.id
    LEFT JOIN 
        requestStatuses oldStatus ON h.oldStatusId = oldStatus.statusId
    LEFT JOIN 
        requestStatuses newStatus ON h.newStatusId = newStatus.statusId
    LEFT JOIN 
        users oldAssigned ON h.oldAssignedToUserId = oldAssigned.id
    LEFT JOIN 
        users newAssigned ON h.newAssignedToUserId = newAssigned.id
    WHERE 
        h.grievanceId = @grievanceId
    ORDER BY 
        h.changeDate DESC;
END
GO

-- Procedure to get organization admin users 
CREATE OR ALTER PROCEDURE [dbo].[GetOrganizationAdmins]
    @organizationId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        id,
        username,
        firstName,
        lastName,
        email,
        phone,
        role
    FROM 
        users
    WHERE 
        organizationId = @organizationId AND
        role = 'admin' AND
        isActive = 1;
END
GO

-- Procedure to handle OTP verification
CREATE OR ALTER PROCEDURE [dbo].[VerifyOTP]
    @email NVARCHAR(255),
    @otp NVARCHAR(10),
    @organizationId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @isValid BIT = 0;
    DECLARE @message NVARCHAR(255) = 'Invalid OTP';
    DECLARE @otpId INT;
    
    -- Get the latest OTP for this email and organization
    SELECT TOP 1 @otpId = id
    FROM otpVerification
    WHERE email = @email
    AND organizationId = @organizationId
    AND verified = 0
    AND expiresAt > GETDATE()
    ORDER BY createdAt DESC;
    
    IF @otpId IS NOT NULL
    BEGIN
        -- Update attempts
        UPDATE otpVerification
        SET attempts = attempts + 1
        WHERE id = @otpId;
        
        -- Check if OTP is correct
        IF EXISTS (SELECT 1 FROM otpVerification WHERE id = @otpId AND otp = @otp)
        BEGIN
            -- Mark as verified
            UPDATE otpVerification
            SET verified = 1
            WHERE id = @otpId;
            
            SET @isValid = 1;
            SET @message = 'OTP verified successfully';
        END
        ELSE
        BEGIN
            -- Check if too many attempts
            IF (SELECT attempts FROM otpVerification WHERE id = @otpId) >= 5
            BEGIN
                SET @message = 'Too many failed attempts. Please request a new OTP.';
            END
            ELSE
            BEGIN
                SET @message = 'Invalid OTP. Please try again.';
            END
        END
    END
    ELSE
    BEGIN
        SET @message = 'OTP has expired or is not found. Please request a new OTP.';
    END
    
    -- Return result
    SELECT @isValid AS isValid, @message AS message;
END
GO