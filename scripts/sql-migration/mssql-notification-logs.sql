-- ComplyArk Notification Logs Schema for Microsoft SQL Server

USE ComplyArk;
GO

-- Notification Logs Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'notificationLogs')
BEGIN
    CREATE TABLE notificationLogs (
        notificationId INT IDENTITY(1,1) PRIMARY KEY,
        userId INT NOT NULL,
        organizationId INT NOT NULL,
        module NVARCHAR(50) NOT NULL CHECK (module IN ('DPR', 'Grievance', 'Notice', 'Document', 'Admin')),
        action NVARCHAR(100) NOT NULL,
        actionType NVARCHAR(50) NOT NULL CHECK (actionType IN ('created', 'reassigned', 'updated', 'escalated', 'translated', 'closed', 'viewed')),
        timestamp DATETIME NOT NULL DEFAULT GETDATE(),
        status NVARCHAR(50) NOT NULL DEFAULT 'active',
        initiator NVARCHAR(50) NOT NULL DEFAULT 'user',
        message NVARCHAR(MAX) NOT NULL,
        isRead BIT NOT NULL DEFAULT 0,
        relatedItemId INT,
        relatedItemType NVARCHAR(50),
        CONSTRAINT FK_notificationLogs_users FOREIGN KEY (userId) REFERENCES users(id),
        CONSTRAINT FK_notificationLogs_organizations FOREIGN KEY (organizationId) REFERENCES organizations(id)
    );
END
GO

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS IX_notificationLogs_organizationId ON notificationLogs(organizationId);
CREATE INDEX IF NOT EXISTS IX_notificationLogs_userId ON notificationLogs(userId);
CREATE INDEX IF NOT EXISTS IX_notificationLogs_timestamp ON notificationLogs(timestamp DESC);
GO

-- Create stored procedure for adding notification
CREATE OR ALTER PROCEDURE [dbo].[AddNotification]
    @userId INT,
    @organizationId INT,
    @module NVARCHAR(50),
    @action NVARCHAR(100),
    @actionType NVARCHAR(50),
    @message NVARCHAR(MAX),
    @relatedItemId INT = NULL,
    @relatedItemType NVARCHAR(50) = NULL,
    @initiator NVARCHAR(50) = 'user'
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO notificationLogs (
        userId,
        organizationId,
        module,
        action,
        actionType,
        timestamp,
        status,
        initiator,
        message,
        relatedItemId,
        relatedItemType
    )
    VALUES (
        @userId,
        @organizationId,
        @module,
        @action,
        @actionType,
        GETDATE(),
        'active',
        @initiator,
        @message,
        @relatedItemId,
        @relatedItemType
    );
    
    -- Return the newly created notification ID
    SELECT SCOPE_IDENTITY() AS notificationId;
END
GO

-- Create stored procedure for getting notifications by organization
CREATE OR ALTER PROCEDURE [dbo].[GetNotificationsByOrganization]
    @organizationId INT,
    @userId INT = NULL,
    @limit INT = 5,
    @offset INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        n.notificationId,
        n.userId,
        n.organizationId,
        n.module,
        n.action,
        n.actionType,
        n.timestamp,
        n.status,
        n.initiator,
        n.message,
        n.isRead,
        n.relatedItemId,
        n.relatedItemType,
        u.firstName + ' ' + u.lastName AS userName
    FROM 
        notificationLogs n
    INNER JOIN 
        users u ON n.userId = u.id
    WHERE 
        n.organizationId = @organizationId
        AND (@userId IS NULL OR n.userId = @userId)
    ORDER BY 
        n.timestamp DESC
    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY;
    
    -- Get total count for pagination
    SELECT COUNT(*) AS totalCount 
    FROM notificationLogs 
    WHERE organizationId = @organizationId
    AND (@userId IS NULL OR userId = @userId);
END
GO

-- Create stored procedure for marking notifications as read
CREATE OR ALTER PROCEDURE [dbo].[MarkNotificationsAsRead]
    @userId INT,
    @notificationIds NVARCHAR(MAX) = NULL  -- Comma-separated list of notification IDs, NULL means all for the user
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @notificationIds IS NULL
    BEGIN
        -- Mark all notifications for the user as read
        UPDATE notificationLogs
        SET isRead = 1
        WHERE userId = @userId
        AND isRead = 0;
    END
    ELSE
    BEGIN
        -- Parse the comma-separated list and update specific notifications
        WITH NotificationList AS (
            SELECT value AS notificationId
            FROM STRING_SPLIT(@notificationIds, ',')
        )
        UPDATE n
        SET isRead = 1
        FROM notificationLogs n
        INNER JOIN NotificationList nl ON n.notificationId = CAST(nl.notificationId AS INT)
        WHERE n.userId = @userId
        AND n.isRead = 0;
    END
    
    -- Return the count of notifications that were marked as read
    SELECT @@ROWCOUNT AS updatedCount;
END
GO

-- View for notifications with user details
CREATE OR ALTER VIEW [dbo].[vw_NotificationsWithUserDetails]
AS
SELECT 
    n.notificationId,
    n.userId,
    n.organizationId,
    o.businessName AS organizationName,
    n.module,
    n.action,
    n.actionType,
    n.timestamp,
    n.status,
    n.initiator,
    n.message,
    n.isRead,
    n.relatedItemId,
    n.relatedItemType,
    u.firstName + ' ' + u.lastName AS userName,
    u.username,
    DATEDIFF(MINUTE, n.timestamp, GETDATE()) AS minutesAgo
FROM 
    notificationLogs n
INNER JOIN
    users u ON n.userId = u.id
INNER JOIN
    organizations o ON n.organizationId = o.id;
GO