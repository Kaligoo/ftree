const { Pool } = require('@neondatabase/serverless');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL
});

async function addSampleData() {
  try {
    // Generation 1 (Grandparents)
    const gen1 = await Promise.all([
      pool.query(`INSERT INTO people (name, birth_year, death_year, gender, notes)
                  VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                  ['William Smith', 1940, null, 'male', 'Retired engineer']),
      pool.query(`INSERT INTO people (name, birth_year, death_year, gender, notes)
                  VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                  ['Margaret Smith', 1942, null, 'female', 'Retired teacher']),
      pool.query(`INSERT INTO people (name, birth_year, death_year, gender, notes)
                  VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                  ['Robert Johnson', 1938, 2015, 'male', 'WWII veteran']),
      pool.query(`INSERT INTO people (name, birth_year, death_year, gender, notes)
                  VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                  ['Elizabeth Johnson', 1941, null, 'female', 'Nurse'])
    ]);

    const william = gen1[0].rows[0].id;
    const margaret = gen1[1].rows[0].id;
    const robert = gen1[2].rows[0].id;
    const elizabeth = gen1[3].rows[0].id;

    // Marriages - Generation 1
    await Promise.all([
      pool.query(`INSERT INTO relationships (person_id, related_person_id, relation_type)
                  VALUES ($1, $2, $3)`, [william, margaret, 'spouse']),
      pool.query(`INSERT INTO relationships (person_id, related_person_id, relation_type)
                  VALUES ($1, $2, $3)`, [margaret, william, 'spouse']),
      pool.query(`INSERT INTO relationships (person_id, related_person_id, relation_type)
                  VALUES ($1, $2, $3)`, [robert, elizabeth, 'spouse']),
      pool.query(`INSERT INTO relationships (person_id, related_person_id, relation_type)
                  VALUES ($1, $2, $3)`, [elizabeth, robert, 'spouse'])
    ]);

    // Generation 2 (Parents)
    const gen2 = await Promise.all([
      pool.query(`INSERT INTO people (name, birth_year, gender, notes)
                  VALUES ($1, $2, $3, $4) RETURNING id`,
                  ['James Smith', 1965, 'male', 'Software developer']),
      pool.query(`INSERT INTO people (name, birth_year, gender, notes)
                  VALUES ($1, $2, $3, $4) RETURNING id`,
                  ['Sarah Johnson', 1968, 'female', 'Doctor']),
      pool.query(`INSERT INTO people (name, birth_year, gender, notes)
                  VALUES ($1, $2, $3, $4) RETURNING id`,
                  ['Michael Smith', 1970, 'male', 'Architect']),
      pool.query(`INSERT INTO people (name, birth_year, gender, notes)
                  VALUES ($1, $2, $3, $4) RETURNING id`,
                  ['Jennifer Brown', 1972, 'female', 'Lawyer'])
    ]);

    const james = gen2[0].rows[0].id;
    const sarah = gen2[1].rows[0].id;
    const michael = gen2[2].rows[0].id;
    const jennifer = gen2[3].rows[0].id;

    // Parent-child relationships - Generation 1 to 2
    await Promise.all([
      // William & Margaret's children
      pool.query(`INSERT INTO relationships (person_id, related_person_id, relation_type)
                  VALUES ($1, $2, $3)`, [william, james, 'parent']),
      pool.query(`INSERT INTO relationships (person_id, related_person_id, relation_type)
                  VALUES ($1, $2, $3)`, [margaret, james, 'parent']),
      pool.query(`INSERT INTO relationships (person_id, related_person_id, relation_type)
                  VALUES ($1, $2, $3)`, [william, michael, 'parent']),
      pool.query(`INSERT INTO relationships (person_id, related_person_id, relation_type)
                  VALUES ($1, $2, $3)`, [margaret, michael, 'parent']),
      // Robert & Elizabeth's child
      pool.query(`INSERT INTO relationships (person_id, related_person_id, relation_type)
                  VALUES ($1, $2, $3)`, [robert, sarah, 'parent']),
      pool.query(`INSERT INTO relationships (person_id, related_person_id, relation_type)
                  VALUES ($1, $2, $3)`, [elizabeth, sarah, 'parent'])
    ]);

    // Marriages - Generation 2
    await Promise.all([
      pool.query(`INSERT INTO relationships (person_id, related_person_id, relation_type)
                  VALUES ($1, $2, $3)`, [james, sarah, 'spouse']),
      pool.query(`INSERT INTO relationships (person_id, related_person_id, relation_type)
                  VALUES ($1, $2, $3)`, [sarah, james, 'spouse']),
      pool.query(`INSERT INTO relationships (person_id, related_person_id, relation_type)
                  VALUES ($1, $2, $3)`, [michael, jennifer, 'spouse']),
      pool.query(`INSERT INTO relationships (person_id, related_person_id, relation_type)
                  VALUES ($1, $2, $3)`, [jennifer, michael, 'spouse'])
    ]);

    // Generation 3 (Children)
    const gen3 = await Promise.all([
      pool.query(`INSERT INTO people (name, birth_year, gender, notes)
                  VALUES ($1, $2, $3, $4) RETURNING id`,
                  ['Emily Smith', 1995, 'female', 'College student']),
      pool.query(`INSERT INTO people (name, birth_year, gender, notes)
                  VALUES ($1, $2, $3, $4) RETURNING id`,
                  ['Daniel Smith', 1997, 'male', 'High school teacher']),
      pool.query(`INSERT INTO people (name, birth_year, gender, notes)
                  VALUES ($1, $2, $3, $4) RETURNING id`,
                  ['Olivia Smith', 2000, 'female', 'Graphic designer']),
      pool.query(`INSERT INTO people (name, birth_year, gender, notes)
                  VALUES ($1, $2, $3, $4) RETURNING id`,
                  ['Noah Smith', 2002, 'male', 'University student'])
    ]);

    const emily = gen3[0].rows[0].id;
    const daniel = gen3[1].rows[0].id;
    const olivia = gen3[2].rows[0].id;
    const noah = gen3[3].rows[0].id;

    // Parent-child relationships - Generation 2 to 3
    await Promise.all([
      // James & Sarah's children
      pool.query(`INSERT INTO relationships (person_id, related_person_id, relation_type)
                  VALUES ($1, $2, $3)`, [james, emily, 'parent']),
      pool.query(`INSERT INTO relationships (person_id, related_person_id, relation_type)
                  VALUES ($1, $2, $3)`, [sarah, emily, 'parent']),
      pool.query(`INSERT INTO relationships (person_id, related_person_id, relation_type)
                  VALUES ($1, $2, $3)`, [james, daniel, 'parent']),
      pool.query(`INSERT INTO relationships (person_id, related_person_id, relation_type)
                  VALUES ($1, $2, $3)`, [sarah, daniel, 'parent']),
      // Michael & Jennifer's children
      pool.query(`INSERT INTO relationships (person_id, related_person_id, relation_type)
                  VALUES ($1, $2, $3)`, [michael, olivia, 'parent']),
      pool.query(`INSERT INTO relationships (person_id, related_person_id, relation_type)
                  VALUES ($1, $2, $3)`, [jennifer, olivia, 'parent']),
      pool.query(`INSERT INTO relationships (person_id, related_person_id, relation_type)
                  VALUES ($1, $2, $3)`, [michael, noah, 'parent']),
      pool.query(`INSERT INTO relationships (person_id, related_person_id, relation_type)
                  VALUES ($1, $2, $3)`, [jennifer, noah, 'parent'])
    ]);

    console.log('✅ Successfully added 3 generations of sample family data!');
    console.log('- Generation 1: 4 grandparents');
    console.log('- Generation 2: 4 parents');
    console.log('- Generation 3: 4 children');

  } catch (error) {
    console.error('Error adding sample data:', error);
  } finally {
    await pool.end();
  }
}

addSampleData();
