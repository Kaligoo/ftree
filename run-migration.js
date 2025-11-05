const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

const sql = neon('postgresql://neondb_owner:npg_vbU0LDmGl4xK@ep-purple-hall-a48e0hx4-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require');

async function runMigration() {
  try {
    console.log('Running migration...');

    // Use template literal syntax for each statement
    await sql`
      ALTER TABLE people
      ADD COLUMN IF NOT EXISTS maiden_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS birth_date DATE,
      ADD COLUMN IF NOT EXISTS birth_place VARCHAR(255),
      ADD COLUMN IF NOT EXISTS death_date DATE,
      ADD COLUMN IF NOT EXISTS death_place VARCHAR(255),
      ADD COLUMN IF NOT EXISTS marriage_place VARCHAR(255),
      ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE
    `;

    console.log('✅ Migration completed successfully!');
    console.log('\nNew fields added to people table:');
    console.log('- maiden_name (VARCHAR)');
    console.log('- birth_date (DATE)');
    console.log('- birth_place (VARCHAR)');
    console.log('- death_date (DATE)');
    console.log('- death_place (VARCHAR)');
    console.log('- marriage_place (VARCHAR)');
    console.log('- is_favorite (BOOLEAN)');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
