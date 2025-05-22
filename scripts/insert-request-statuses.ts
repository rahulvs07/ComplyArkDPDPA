import { db } from "../server/db";
import { requestStatuses } from "../shared/schema";
import { eq } from "drizzle-orm";

async function upsertRequestStatuses() {
  console.log("Upserting request statuses...");
  
  const desiredStatuses = [
    { statusName: "Submitted", slaDays: 7, isActive: true },
    { statusName: "InProgress", slaDays: 5, isActive: true },
    { statusName: "AwaitingInfo", slaDays: 3, isActive: true },
    { statusName: "Reassigned", slaDays: 4, isActive: true },
    { statusName: "Escalated", slaDays: 2, isActive: true },
    { statusName: "Closed", slaDays: 0, isActive: true },
  ];

  try {
    // Get existing statuses
    const existingStatuses = await db.select().from(requestStatuses);
    console.log("Existing statuses:", existingStatuses.length);
    
    // For each desired status, either update an existing one or insert a new one
    for (const desiredStatus of desiredStatuses) {
      // Try to find a matching status by name
      const existingStatus = existingStatuses.find(
        status => status.statusName.toLowerCase() === desiredStatus.statusName.toLowerCase()
      );
      
      if (existingStatus) {
        // Update existing status
        console.log(`Updating existing status: ${desiredStatus.statusName}`);
        await db.update(requestStatuses)
          .set({
            statusName: desiredStatus.statusName,
            slaDays: desiredStatus.slaDays,
            isActive: desiredStatus.isActive
          })
          .where(eq(requestStatuses.statusId, existingStatus.statusId));
      } else {
        // Insert new status
        console.log(`Inserting new status: ${desiredStatus.statusName}`);
        await db.insert(requestStatuses).values(desiredStatus);
      }
    }
    
    // Verify the statuses after upsert
    const updatedStatuses = await db.select().from(requestStatuses);
    console.log("Current request statuses:");
    console.table(updatedStatuses);
    
  } catch (error) {
    console.error("Error upserting request statuses:", error);
  } finally {
    process.exit(0);
  }
}

upsertRequestStatuses();