-- ComplyArk DPDPA Management Platform - MSSQL Triggers
-- Script 008: Create Triggers for Data Integrity and Automation

USE ComplyArkDB;
GO

-- Trigger: Auto-update lastUpdatedAt for DP Requests
CREATE TRIGGER tr_dp_requests_update
ON dp_requests
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE dp_requests
    SET lastUpdatedAt = GETDATE()
    FROM dp_requests dr
    INNER JOIN inserted i ON dr.requestId = i.requestId;
END;
GO

-- Trigger: Auto-update lastUpdatedAt for Grievances
CREATE TRIGGER tr_grievances_update
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

-- Trigger: Auto-create notification when DP request status changes
CREATE TRIGGER tr_dp_request_status_notification
ON dp_requests
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @requestId INT, @oldStatusId INT, @newStatusId INT, @assignedUserId INT, @organizationId INT;
    DECLARE @oldStatusName NVARCHAR(100), @newStatusName NVARCHAR(100), @requestType NVARCHAR(100);
    
    SELECT 
        @requestId = i.requestId,
        @newStatusId = i.statusId,
        @oldStatusId = d.statusId,
        @assignedUserId = i.assignedToUserId,
        @organizationId = i.organizationId,
        @requestType = i.requestType
    FROM inserted i
    INNER JOIN deleted d ON i.requestId = d.requestId
    WHERE i.statusId != d.statusId;
    
    IF @requestId IS NOT NULL AND @assignedUserId IS NOT NULL
    BEGIN
        -- Get status names
        SELECT @oldStatusName = statusName FROM request_statuses WHERE statusId = @oldStatusId;
        SELECT @newStatusName = statusName FROM request_statuses WHERE statusId = @newStatusId;
        
        -- Create notification
        INSERT INTO notifications (userId, organizationId, title, message, type, createdAt)
        VALUES (
            @assignedUserId,
            @organizationId,
            'DP Request Status Updated',
            'Request #' + CAST(@requestId AS NVARCHAR(10)) + ' (' + @requestType + ') status changed from ' + @oldStatusName + ' to ' + @newStatusName,
            'info',
            GETDATE()
        );
    END
END;
GO

-- Trigger: Auto-create notification when grievance status changes
CREATE TRIGGER tr_grievance_status_notification
ON grievances
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @grievanceId INT, @oldStatusId INT, @newStatusId INT, @assignedUserId INT, @organizationId INT;
    DECLARE @oldStatusName NVARCHAR(100), @newStatusName NVARCHAR(100);
    
    SELECT 
        @grievanceId = i.grievanceId,
        @newStatusId = i.statusId,
        @oldStatusId = d.statusId,
        @assignedUserId = i.assignedToUserId,
        @organizationId = i.organizationId
    FROM inserted i
    INNER JOIN deleted d ON i.grievanceId = d.grievanceId
    WHERE i.statusId != d.statusId;
    
    IF @grievanceId IS NOT NULL AND @assignedUserId IS NOT NULL
    BEGIN
        -- Get status names
        SELECT @oldStatusName = statusName FROM request_statuses WHERE statusId = @oldStatusId;
        SELECT @newStatusName = statusName FROM request_statuses WHERE statusId = @newStatusId;
        
        -- Create notification
        INSERT INTO notifications (userId, organizationId, title, message, type, createdAt)
        VALUES (
            @assignedUserId,
            @organizationId,
            'Grievance Status Updated',
            'Grievance #' + CAST(@grievanceId AS NVARCHAR(10)) + ' status changed from ' + @oldStatusName + ' to ' + @newStatusName,
            'info',
            GETDATE()
        );
    END
END;
GO

-- Trigger: Update email template updatedAt field
CREATE TRIGGER tr_email_templates_update
ON email_templates
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE email_templates
    SET updatedAt = GETDATE()
    FROM email_templates et
    INNER JOIN inserted i ON et.templateId = i.templateId;
END;
GO

-- Trigger: Auto-mark notifications as read after 30 days
CREATE TRIGGER tr_auto_mark_old_notifications
ON notifications
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Mark notifications older than 30 days as read if they haven't been read
    UPDATE notifications
    SET isRead = 1, readAt = GETDATE()
    WHERE isRead = 0 
    AND createdAt < DATEADD(DAY, -30, GETDATE());
END;
GO

-- Trigger: Prevent deletion of active organizations with users
CREATE TRIGGER tr_prevent_organization_deletion
ON organizations
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @organizationId INT;
    DECLARE @activeUsersCount INT;
    
    DECLARE org_cursor CURSOR FOR
    SELECT id FROM deleted;
    
    OPEN org_cursor;
    FETCH NEXT FROM org_cursor INTO @organizationId;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        -- Check if organization has active users
        SELECT @activeUsersCount = COUNT(*)
        FROM users
        WHERE organizationId = @organizationId AND isActive = 1;
        
        IF @activeUsersCount > 0
        BEGIN
            RAISERROR('Cannot delete organization with active users. Please deactivate all users first.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END
        ELSE
        BEGIN
            -- Safe to delete - no active users
            DELETE FROM organizations WHERE id = @organizationId;
        END
        
        FETCH NEXT FROM org_cursor INTO @organizationId;
    END
    
    CLOSE org_cursor;
    DEALLOCATE org_cursor;
END;
GO

-- Trigger: Audit trail for user role changes
CREATE TRIGGER tr_user_role_audit
ON users
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @userId INT, @oldRole NVARCHAR(20), @newRole NVARCHAR(20), @organizationId INT;
    
    SELECT 
        @userId = i.id,
        @oldRole = d.role,
        @newRole = i.role,
        @organizationId = i.organizationId
    FROM inserted i
    INNER JOIN deleted d ON i.id = d.id
    WHERE i.role != d.role;
    
    IF @userId IS NOT NULL
    BEGIN
        -- Log the role change as an exception for audit purposes
        INSERT INTO exception_logs (pageName, functionName, errorMessage, userId, additionalDetails, severity, createdAt)
        VALUES (
            'UserManagement',
            'RoleChange',
            'User role changed from ' + @oldRole + ' to ' + @newRole,
            @userId,
            'User ID: ' + CAST(@userId AS NVARCHAR(10)) + ', Organization ID: ' + CAST(@organizationId AS NVARCHAR(10)),
            'info',
            GETDATE()
        );
    END
END;
GO

PRINT 'All triggers created successfully!';
GO