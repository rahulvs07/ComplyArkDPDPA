import { db } from "../server/db";
import { grievances, grievanceHistory } from "../shared/schema";

async function insertGrievanceData() {
  try {
    console.log("Starting to insert sample grievance data...");
    
    // First, get organizations and users to reference in the grievances
    const organizations = await db.query.organizations.findMany();
    const users = await db.query.users.findMany();
    
    if (organizations.length === 0) {
      console.log("No organizations found in the database. Please run the seed-database script first.");
      return;
    }
    
    if (users.length === 0) {
      console.log("No users found in the database. Please run the seed-database script first.");
      return;
    }
    
    // Get request statuses
    const statuses = await db.query.requestStatuses.findMany();
    
    if (statuses.length === 0) {
      console.log("No request statuses found in the database. Please run the seed-database script first.");
      return;
    }
    
    console.log("Found statuses:", statuses.map(s => `${s.statusId}: ${s.statusName}`).join(', '));
    
    // Map status names to IDs for easier reference
    const statusMap = {
      submitted: statuses.find(s => s.statusName === "Submitted")?.statusId || 21,
      pending: statuses.find(s => s.statusName === "Pending Verification")?.statusId || 22,
      inProgress: statuses.find(s => s.statusName === "In Progress")?.statusId || 23,
      review: statuses.find(s => s.statusName === "Under Review")?.statusId || 24,
      awaiting: statuses.find(s => s.statusName === "Awaiting Information")?.statusId || 25,
      completed: statuses.find(s => s.statusName === "Completed")?.statusId || 26,
      closed: statuses.find(s => s.statusName === "Closed")?.statusId || 27,
      rejected: statuses.find(s => s.statusName === "Rejected")?.statusId || 28,
      overdue: statuses.find(s => s.statusName === "Overdue")?.statusId || 29,
      onHold: statuses.find(s => s.statusName === "On Hold")?.statusId || 30
    };
    
    // Delete existing grievances data to avoid duplicates
    console.log("Clearing existing grievance data...");
    await db.delete(grievanceHistory);
    await db.delete(grievances);
    
    // Sample grievance data
    const sampleGrievances = [
      {
        organizationId: organizations[0].id,
        firstName: "Michael",
        lastName: "Rodriguez",
        email: "michael.rodriguez@example.com",
        phone: "+1-555-123-4567",
        grievanceComment: "I requested data erasure 45 days ago and haven't received confirmation. This exceeds your stated timeframe.",
        statusId: statusMap.submitted,
        assignedToUserId: users.find(u => u.role === "admin")?.id || null,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 2)),
        lastUpdatedAt: new Date(new Date().setDate(new Date().getDate() - 2)),
        completionDate: null,
        closedDateTime: null,
        closureComments: null
      },
      {
        organizationId: organizations[1].id,
        firstName: "Sarah",
        lastName: "Johnson",
        email: "sarah.johnson@example.com",
        phone: "+1-555-987-6543",
        grievanceComment: "Your privacy notice states I can access all my data, but I only received partial information when I submitted my request.",
        statusId: statusMap.inProgress,
        assignedToUserId: users.find(u => u.organizationId === organizations[1].id)?.id || null,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 10)),
        lastUpdatedAt: new Date(new Date().setDate(new Date().getDate() - 5)),
        completionDate: null,
        closedDateTime: null,
        closureComments: null
      },
      {
        organizationId: organizations[0].id,
        firstName: "David",
        lastName: "Wong",
        email: "david.wong@example.com",
        phone: "+1-555-234-5678",
        grievanceComment: "I submitted a correction request for my personal information, but the changes were not applied correctly.",
        statusId: statusMap.pending,
        assignedToUserId: users.find(u => u.role === "admin")?.id || null,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 15)),
        lastUpdatedAt: new Date(new Date().setDate(new Date().getDate() - 8)),
        completionDate: null,
        closedDateTime: null,
        closureComments: null
      },
      {
        organizationId: organizations[2].id,
        firstName: "Emily",
        lastName: "Chen",
        email: "emily.chen@example.com",
        phone: "+1-555-345-6789",
        grievanceComment: "I believe my data is being used for purposes I did not consent to. I've seen targeted advertisements based on information I only shared with your company.",
        statusId: statusMap.onHold,
        assignedToUserId: users.find(u => u.organizationId === organizations[2].id)?.id || null,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 20)),
        lastUpdatedAt: new Date(new Date().setDate(new Date().getDate() - 12)),
        completionDate: null,
        closedDateTime: null,
        closureComments: null
      },
      {
        organizationId: organizations[1].id,
        firstName: "James",
        lastName: "Smith",
        email: "james.smith@example.com",
        phone: "+1-555-456-7890",
        grievanceComment: "I opted out of data sharing with third parties, but I've received communications indicating my information was shared anyway.",
        statusId: statusMap.closed,
        assignedToUserId: users.find(u => u.organizationId === organizations[1].id)?.id || null,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 30)),
        lastUpdatedAt: new Date(new Date().setDate(new Date().getDate() - 5)),
        completionDate: new Date(new Date().setDate(new Date().getDate() - 5)),
        closedDateTime: new Date(new Date().setDate(new Date().getDate() - 5)),
        closureComments: "Investigated and confirmed data sharing settings were corrected. Provided compensation for the error."
      },
      {
        organizationId: organizations[0].id,
        firstName: "Sophia",
        lastName: "Garcia",
        email: "sophia.garcia@example.com",
        phone: "+1-555-567-8901",
        grievanceComment: "I requested a copy of all data you hold about me, but I suspect the information provided was incomplete. Specifically, my purchase history only went back 1 year when I've been a customer for 5 years.",
        statusId: statusMap.completed,
        assignedToUserId: users.find(u => u.role === "admin")?.id || null,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 45)),
        lastUpdatedAt: new Date(new Date().setDate(new Date().getDate() - 20)),
        completionDate: new Date(new Date().setDate(new Date().getDate() - 20)),
        closedDateTime: new Date(new Date().setDate(new Date().getDate() - 20)),
        closureComments: "Provided complete purchase history going back to account creation. The initial response was incomplete due to a system limitation that has been fixed."
      },
      {
        organizationId: organizations[3].id,
        firstName: "Aiden",
        lastName: "Taylor",
        email: "aiden.taylor@example.com",
        phone: "+1-555-678-9012",
        grievanceComment: "I believe sensitive health information I shared during a customer service call was improperly stored and potentially accessed by unauthorized personnel.",
        statusId: statusMap.inProgress,
        assignedToUserId: users.find(u => u.organizationId === organizations[3].id || u.role === "admin")?.id || null,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 7)),
        lastUpdatedAt: new Date(new Date().setDate(new Date().getDate() - 3)),
        completionDate: null,
        closedDateTime: null,
        closureComments: null
      },
      {
        organizationId: organizations[2].id,
        firstName: "Olivia",
        lastName: "Brown",
        email: "olivia.brown@example.com",
        phone: "+1-555-789-0123",
        grievanceComment: "Your company continues to send me marketing emails despite multiple unsubscribe attempts and direct requests to be removed from all marketing lists.",
        statusId: statusMap.submitted,
        assignedToUserId: null,
        createdAt: new Date(),
        lastUpdatedAt: new Date(),
        completionDate: null,
        closedDateTime: null,
        closureComments: null
      }
    ];
    
    // Insert grievances
    console.log("Inserting grievance data...");
    for (const grievanceData of sampleGrievances) {
      const [grievance] = await db.insert(grievances).values(grievanceData).returning();
      
      // Add a history entry for each grievance
      if (grievance) {
        await db.insert(grievanceHistory).values({
          grievanceId: grievance.grievanceId,
          changeDate: grievance.createdAt,
          changedByUserId: grievance.assignedToUserId || users[0].id,
          oldStatusId: null,
          newStatusId: grievance.statusId,
          oldAssignedToUserId: null,
          newAssignedToUserId: grievance.assignedToUserId,
          comments: "Grievance received and logged."
        });
        
        // Add additional history entries for non-new grievances
        if (grievance.statusId !== 1) {
          await db.insert(grievanceHistory).values({
            grievanceId: grievance.grievanceId,
            changeDate: new Date(new Date(grievance.createdAt).setDate(new Date(grievance.createdAt).getDate() + 1)),
            changedByUserId: grievance.assignedToUserId || users[0].id,
            oldStatusId: 1, // New
            newStatusId: grievance.statusId !== 10 ? 2 : 2, // In Progress
            oldAssignedToUserId: null,
            newAssignedToUserId: grievance.assignedToUserId,
            comments: "Grievance assigned and investigation started."
          });
        }
        
        // Add closure history entry for closed grievances
        if (grievance.statusId === 10) {
          await db.insert(grievanceHistory).values({
            grievanceId: grievance.grievanceId,
            changeDate: grievance.closedDateTime!,
            changedByUserId: grievance.assignedToUserId || users[0].id,
            oldStatusId: 2, // In Progress
            newStatusId: 10, // Closed
            oldAssignedToUserId: grievance.assignedToUserId,
            newAssignedToUserId: grievance.assignedToUserId,
            comments: grievance.closureComments || "Grievance resolved and closed."
          });
        }
      }
    }
    
    console.log("Sample grievance data inserted successfully!");
  } catch (error) {
    console.error("Error inserting sample grievance data:", error);
  } finally {
    process.exit(0);
  }
}

insertGrievanceData();