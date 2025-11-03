const { Pool } = require('@neondatabase/serverless');
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

async function checkData() {
  try {
    const people = await pool.query('SELECT COUNT(*) FROM people');
    const relationships = await pool.query('SELECT COUNT(*) FROM relationships');
    
    console.log('People in database:', people.rows[0].count);
    console.log('Relationships in database:', relationships.rows[0].count);
    
    const allPeople = await pool.query('SELECT name, birth_year FROM people ORDER BY birth_year');
    console.log('\nAll people:');
    allPeople.rows.forEach(p => console.log(`- ${p.name} (${p.birth_year})`));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkData();
