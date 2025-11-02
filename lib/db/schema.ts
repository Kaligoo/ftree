import { pgTable, serial, varchar, integer, timestamp, text } from 'drizzle-orm/pg-core';

// Family tree members
export const people = pgTable('people', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  birthYear: integer('birth_year'),
  deathYear: integer('death_year'),
  gender: varchar('gender', { length: 20 }), // 'male', 'female', 'other'
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Relationships between people
export const relationships = pgTable('relationships', {
  id: serial('id').primaryKey(),
  personId: integer('person_id').notNull().references(() => people.id, { onDelete: 'cascade' }),
  relatedPersonId: integer('related_person_id').notNull().references(() => people.id, { onDelete: 'cascade' }),
  relationType: varchar('relation_type', { length: 50 }).notNull(), // 'parent', 'spouse', 'child'
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type Person = typeof people.$inferSelect;
export type NewPerson = typeof people.$inferInsert;
export type Relationship = typeof relationships.$inferSelect;
export type NewRelationship = typeof relationships.$inferInsert;
