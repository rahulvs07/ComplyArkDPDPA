-- Add organizationId column to translatedNotices table
ALTER TABLE "translatedNotices" ADD COLUMN "organizationId" INTEGER NOT NULL;

-- Add foreign key constraint to the organizationId column
ALTER TABLE "translatedNotices" ADD CONSTRAINT "translatedNotices_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id");