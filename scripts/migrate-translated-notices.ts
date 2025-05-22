import { db } from '../server/db';
import { notices, translatedNotices } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function migrateTranslatedNotices() {
  console.log('Starting migration of translatedNotices table...');

  try {
    // Run the SQL migration first to add the column
    await db.execute(`
      DO $$ 
      BEGIN
        -- Check if the column doesn't exist yet
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'translatedNotices' 
          AND column_name = 'organizationId'
        ) THEN
          -- Add organizationId column
          ALTER TABLE "translatedNotices" ADD COLUMN "organizationId" INTEGER;
          
          -- Add foreign key constraint
          ALTER TABLE "translatedNotices" ADD CONSTRAINT "translatedNotices_organizationId_fkey" 
            FOREIGN KEY ("organizationId") REFERENCES "organizations"("id");
        END IF;
      END $$;
    `);

    console.log('Column added successfully. Updating existing records...');

    // Get all translated notices that need to be updated
    const translatedNoticesData = await db.select().from(translatedNotices);
    
    // For each translated notice, get the parent notice to find the organization
    for (const translatedNotice of translatedNoticesData) {
      if (translatedNotice.organizationId === null) {
        const parentNotice = await db.select().from(notices).where(eq(notices.noticeId, translatedNotice.noticeId)).limit(1);
        
        if (parentNotice.length > 0) {
          // Update the translated notice with the organization ID from the parent
          await db.update(translatedNotices)
            .set({ organizationId: parentNotice[0].organizationId })
            .where(eq(translatedNotices.id, translatedNotice.id));
          
          console.log(`Updated translated notice ID ${translatedNotice.id} with organization ID ${parentNotice[0].organizationId}`);
        } else {
          console.log(`Warning: Could not find parent notice for translated notice ID ${translatedNotice.id}`);
        }
      }
    }

    // Now make the column NOT NULL
    await db.execute(`
      ALTER TABLE "translatedNotices" ALTER COLUMN "organizationId" SET NOT NULL;
    `);

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

// Run the migration
migrateTranslatedNotices()
  .then(() => {
    console.log('Migration script finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error in migration script:', error);
    process.exit(1);
  });