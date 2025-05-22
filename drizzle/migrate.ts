import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { db } from '../server/db';

// This script will run all the migrations to set up the database schema
async function main() {
  console.log('Migration started...');
  
  try {
    await migrate(db, { migrationsFolder: 'drizzle/migrations' });
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();