import { db } from "../server/db";
import { notificationLogs, users, organizations } from "../shared/schema";

/**
 * Script to add a test notification
 * Run with: npx tsx scripts/add-test-notification.ts
 */
async function addTestNotification() {
  try {
    console.log("Creating sample data for notification testing...");
    
    // First, check if we have any users in the system
    const existingUsers = await db.select().from(users);
    let userId: number;
    let organizationId: number;
    
    if (existingUsers.length === 0) {
      // Create a test organization first
      const [organization] = await db.insert(organizations).values({
        businessName: "Test Organization",
        businessAddress: "123 Test Street",
        industryId: 1, // Default industry ID
        contactPersonName: "Test Contact",
        contactEmail: "test@example.com",
        contactPhone: "1234567890",
        noOfUsers: 1,
        remarks: "Created for notification testing",
        requestPageUrlToken: null
      }).returning();
      
      organizationId = organization.id;
      console.log("Created test organization with ID:", organizationId);
      
      // Create a test user
      const [user] = await db.insert(users).values({
        firstName: "Test",
        lastName: "User",
        email: "testuser@example.com",
        phone: "1234567890",
        password: "password", // In a real app, this would be hashed
        username: "testuser",
        role: "admin",
        organizationId: organizationId,
        isActive: true,
        createdAt: new Date(),
        canEdit: true,
        canDelete: true
      }).returning();
      
      userId = user.id;
      console.log("Created test user with ID:", userId);
    } else {
      // Use the first existing user and their organization
      userId = existingUsers[0].id;
      organizationId = existingUsers[0].organizationId;
      console.log("Using existing user ID:", userId, "and organization ID:", organizationId);
    }
    
    // Now insert a notification using the user and organization IDs
    const [notification] = await db.insert(notificationLogs).values({
      userId: userId,
      organizationId: organizationId,
      module: "DPR",
      action: "New data request received",
      actionType: "created",
      message: "A new data request has been submitted and requires your attention",
      initiator: "system",
      relatedItemId: 1,
      relatedItemType: "DPRequest",
      isRead: false
    }).returning();
    
    console.log("Test notification created:", notification);
    
    // Display all notifications
    const allNotifications = await db.select().from(notificationLogs);
    console.log(`Total notifications: ${allNotifications.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error("Error creating test notification:", error);
    process.exit(1);
  }
}

addTestNotification();