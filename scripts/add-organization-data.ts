import { db } from '../server/db';
import { dpRequests, dpRequestHistory, grievances, grievanceHistory, requestStatuses } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function addOrganizationData() {
  try {
    console.log('Starting to add data for organizationId: 31');
    
    // Get the request statuses
    const statusesResult = await db.select().from(requestStatuses);
    const statuses = statusesResult.reduce((acc, status) => {
      acc[status.statusName] = status.statusId;
      return acc;
    }, {} as Record<string, number>);
    
    // Add DPR for organizationId: 31
    const [dprRequest] = await db.insert(dpRequests).values({
      organizationId: 31,
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "+66123456789",
      requestType: "Access",
      requestComment: "I need access to all my personal data.",
      statusId: statuses["Submitted"],
      assignedToUserId: null,
      lastUpdatedAt: new Date(),
      completionDate: null,
      completedOnTime: null,
      closedDateTime: null,
      closureComments: null
    }).returning();

    console.log('Added DPR record:', dprRequest);
    
    // Add DPR history - using admin user ID 107 as the changedByUserId since it can't be null
    await db.insert(dpRequestHistory).values({
      requestId: dprRequest.requestId,
      changedByUserId: 107, // Using admin user ID
      oldStatusId: null,
      newStatusId: statuses["Submitted"],
      oldAssignedToUserId: null,
      newAssignedToUserId: null,
      comments: "Request submitted by data subject",
      changeDate: new Date()
    });
    
    console.log('Added DPR history record');
    
    // Add Grievance for organizationId: 31
    const [grievanceRequest] = await db.insert(grievances).values({
      organizationId: 31,
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@example.com",
      phone: "+66987654321",
      grievanceComment: "My data was used for marketing without my consent.",
      statusId: statuses["Submitted"],
      assignedToUserId: null,
      lastUpdatedAt: new Date(),
      completionDate: null,
      completedOnTime: null,
      closedDateTime: null,
      closureComments: null
    }).returning();
    
    console.log('Added Grievance record:', grievanceRequest);
    
    // Add Grievance history - using admin user ID 107 as the changedByUserId
    await db.insert(grievanceHistory).values({
      grievanceId: grievanceRequest.grievanceId,
      changedByUserId: 107, // Using admin user ID
      oldStatusId: null,
      newStatusId: statuses["Submitted"],
      oldAssignedToUserId: null,
      newAssignedToUserId: null,
      comments: "Grievance submitted by data subject",
      changeDate: new Date()
    });
    
    console.log('Added Grievance history record');
    
    console.log('Successfully added all data for organizationId: 31');
  } catch (error) {
    console.error('Error adding organization data:', error);
  }
}

// Run the function
addOrganizationData()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });