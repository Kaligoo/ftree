const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_vbU0LDmGl4xK@ep-purple-hall-a48e0hx4-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require');

sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`
  .then(r => console.log('Tables:', r))
  .catch(e => console.error('Error:', e.message));
