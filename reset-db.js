const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_vbU0LDmGl4xK@ep-purple-hall-a48e0hx4-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require');

async function resetDatabase() {
  try {
    // Delete all existing data
    console.log('Deleting all relationships...');
    await sql`DELETE FROM relationships`;

    console.log('Deleting all people...');
    await sql`DELETE FROM people`;

    console.log('Resetting sequences...');
    await sql`ALTER SEQUENCE people_id_seq RESTART WITH 1`;
    await sql`ALTER SEQUENCE relationships_id_seq RESTART WITH 1`;

    // Create new family: 2 parents and 3 children
    console.log('\nCreating new family...');

    // Parents
    const [parent1] = await sql`
      INSERT INTO people (name, birth_year, gender)
      VALUES ('John Smith', 1975, 'male')
      RETURNING *
    `;
    console.log('Created:', parent1.name);

    const [parent2] = await sql`
      INSERT INTO people (name, birth_year, gender)
      VALUES ('Sarah Smith', 1977, 'female')
      RETURNING *
    `;
    console.log('Created:', parent2.name);

    // Children
    const [child1] = await sql`
      INSERT INTO people (name, birth_year, gender)
      VALUES ('Emily Smith', 2005, 'female')
      RETURNING *
    `;
    console.log('Created:', child1.name);

    const [child2] = await sql`
      INSERT INTO people (name, birth_year, gender)
      VALUES ('Michael Smith', 2008, 'male')
      RETURNING *
    `;
    console.log('Created:', child2.name);

    const [child3] = await sql`
      INSERT INTO people (name, birth_year, gender)
      VALUES ('Olivia Smith', 2012, 'female')
      RETURNING *
    `;
    console.log('Created:', child3.name);

    // Create relationships
    console.log('\nCreating relationships...');

    // Spouse relationship
    await sql`
      INSERT INTO relationships (person_id, related_person_id, relation_type)
      VALUES (${parent1.id}, ${parent2.id}, 'spouse')
    `;
    console.log('Created spouse relationship: John ↔ Sarah');

    // Parent-child relationships
    await sql`
      INSERT INTO relationships (person_id, related_person_id, relation_type)
      VALUES
        (${parent1.id}, ${child1.id}, 'child'),
        (${parent1.id}, ${child2.id}, 'child'),
        (${parent1.id}, ${child3.id}, 'child'),
        (${parent2.id}, ${child1.id}, 'child'),
        (${parent2.id}, ${child2.id}, 'child'),
        (${parent2.id}, ${child3.id}, 'child')
    `;
    console.log('Created parent-child relationships');

    // Verify
    const people = await sql`SELECT * FROM people ORDER BY id`;
    const relationships = await sql`SELECT * FROM relationships ORDER BY id`;

    console.log('\n✅ Database reset complete!');
    console.log(`Total people: ${people.length}`);
    console.log(`Total relationships: ${relationships.length}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

resetDatabase();
