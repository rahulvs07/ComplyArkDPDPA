/**
 * Script to run the local database setup
 * Run with: node scripts/run-local-setup.js
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('@neondatabase/serverless');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function setupLocalDatabase() {
  console.log('Starting local database setup...');
  
  // Check if DATABASE_URL is available
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable not found.');
    console.log('Please ensure the PostgreSQL database is properly set up and the DATABASE_URL is configured.');
    process.exit(1);
  }

  // Create a new pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'setup-local-db.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Split the SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`Found ${statements.length} SQL statements to execute.`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await pool.query(stmt + ';');
        process.stdout.write('.');
        if ((i + 1) % 20 === 0) {
          process.stdout.write('\n');
        }
      } catch (err) {
        console.error(`\nError executing statement ${i + 1}:`, err.message);
        console.error('Statement:', stmt);
        // Continue with the next statement rather than aborting
      }
    }

    console.log('\nDatabase setup completed successfully!');
    console.log('\nYou can now use the following credentials to log in:');
    console.log('  Admin: complyarkadmin / complyarkadmin');
    console.log('  User: user / password');
  } catch (err) {
    console.error('Error setting up the database:', err);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the setup
setupLocalDatabase().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});