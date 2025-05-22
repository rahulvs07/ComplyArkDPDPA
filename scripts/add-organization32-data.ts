import { db } from '../server/db';
import { dpRequests, dpRequestHistory, grievances, grievanceHistory, requestStatuses } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function addOrganization32Data() {
  try {
    console.log('Starting to add data for organizationId: 32');
    
    // Get the request statuses
    const statusesResult = await db.select().from(requestStatuses);
    const statuses = statusesResult.reduce((acc, status) => {
      acc[status.statusName] = status.statusId;
      return acc;
    }, {} as Record<string, number>);
    
    // Add DPR for organizationId: 32
    const [dprRequest] = await db.insert(dpRequests).values({
      organizationId: 32,
      firstName: "Michael",
      lastName: "Johnson",
      email: "michael.johnson@example.com",
      phone: "+66222333444",
      requestType: "Erasure",
      requestComment: "I would like all my personal data to be deleted from your systems.",
      statusId: statuses["Submitted"],
      assignedToUserId: 107, // Assign to admin user
      lastUpdatedAt: new Date(),
      completionDate: null,
      completedOnTime: null,
      closedDateTime: null,
      closureComments: null
    }).returning();

    console.log('Added DPR record:', dprRequest);
    
    // Add DPR history
    await db.insert(dpRequestHistory).values({
      requestId: dprRequest.requestId,
      changedByUserId: 107, // Admin user ID
      oldStatusId: null,
      newStatusId: statuses["Submitted"],
      oldAssignedToUserId: null,
      newAssignedToUserId: 107,
      comments: "Request submitted and assigned to admin",
      changeDate: new Date()
    });
    
    console.log('Added DPR history record');
    
    // Add a second DPR for organization 32 with a different status
    const [dprRequest2] = await db.insert(dpRequests).values({
      organizationId: 32,
      firstName: "Sarah",
      lastName: "Williams",
      email: "sarah.williams@example.com",
      phone: "+66555666777",
      requestType: "Correction",
      requestComment: "My contact details need to be updated in your system.",
      statusId: statuses["InProgress"],
      assignedToUserId: 107, // Assign to admin user
      lastUpdatedAt: new Date(),
      completionDate: null,
      completedOnTime: null,
      closedDateTime: null,
      closureComments: null
    }).returning();

    console.log('Added second DPR record:', dprRequest2);
    
    // Add history for second DPR
    await db.insert(dpRequestHistory).values({
      requestId: dprRequest2.requestId,
      changedByUserId: 107, // Admin user ID
      oldStatusId: null,
      newStatusId: statuses["Submitted"],
      oldAssignedToUserId: null,
      newAssignedToUserId: 107,
      comments: "Request submitted",
      changeDate: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    });
    
    await db.insert(dpRequestHistory).values({
      requestId: dprRequest2.requestId,
      changedByUserId: 107, // Admin user ID
      oldStatusId: statuses["Submitted"],
      newStatusId: statuses["InProgress"],
      oldAssignedToUserId: 107,
      newAssignedToUserId: 107,
      comments: "Processing correction request",
      changeDate: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    });
    
    console.log('Added history records for second DPR');
    
    // Add Grievance for organizationId: 32
    const [grievanceRequest] = await db.insert(grievances).values({
      organizationId: 32,
      firstName: "David",
      lastName: "Brown",
      email: "david.brown@example.com",
      phone: "+66888999000",
      grievanceComment: "I received marketing emails even after opting out.",
      statusId: statuses["Submitted"],
      assignedToUserId: 107, // Assign to admin user
      lastUpdatedAt: new Date(),
      completionDate: null,
      completedOnTime: null,
      closedDateTime: null,
      closureComments: null
    }).returning();
    
    console.log('Added Grievance record:', grievanceRequest);
    
    // Add Grievance history
    await db.insert(grievanceHistory).values({
      grievanceId: grievanceRequest.grievanceId,
      changedByUserId: 107, // Admin user ID
      oldStatusId: null,
      newStatusId: statuses["Submitted"],
      oldAssignedToUserId: null,
      newAssignedToUserId: 107,
      comments: "Grievance submitted and assigned to admin",
      changeDate: new Date()
    });
    
    console.log('Added Grievance history record');
    
    // Add a second Grievance with different status
    const [grievanceRequest2] = await db.insert(grievances).values({
      organizationId: 32,
      firstName: "Emily",
      lastName: "Taylor",
      email: "emily.taylor@example.com",
      phone: "+66111222333",
      grievanceComment: "My data was shared with third parties without my consent.",
      statusId: statuses["Escalated"],
      assignedToUserId: 107, // Assign to admin user
      lastUpdatedAt: new Date(),
      completionDate: null,
      completedOnTime: null,
      closedDateTime: null,
      closureComments: null
    }).returning();
    
    console.log('Added second Grievance record:', grievanceRequest2);
    
    // Add history for second Grievance
    await db.insert(grievanceHistory).values({
      grievanceId: grievanceRequest2.grievanceId,
      changedByUserId: 107, // Admin user ID
      oldStatusId: null,
      newStatusId: statuses["Submitted"],
      oldAssignedToUserId: null,
      newAssignedToUserId: 107,
      comments: "Grievance submitted",
      changeDate: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    });
    
    await db.insert(grievanceHistory).values({
      grievanceId: grievanceRequest2.grievanceId,
      changedByUserId: 107, // Admin user ID
      oldStatusId: statuses["Submitted"],
      newStatusId: statuses["InProgress"],
      oldAssignedToUserId: 107,
      newAssignedToUserId: 107,
      comments: "Investigating the data sharing issue",
      changeDate: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    });
    
    await db.insert(grievanceHistory).values({
      grievanceId: grievanceRequest2.grievanceId,
      changedByUserId: 107, // Admin user ID
      oldStatusId: statuses["InProgress"],
      newStatusId: statuses["Escalated"],
      oldAssignedToUserId: 107,
      newAssignedToUserId: 107,
      comments: "Escalated to senior management due to severity",
      changeDate: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    });
    
    console.log('Added history records for second Grievance');
    
    console.log('Successfully added all data for organizationId: 32');
  } catch (error) {
    console.error('Error adding organization data:', error);
  }
}

// Run the function
addOrganization32Data()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });