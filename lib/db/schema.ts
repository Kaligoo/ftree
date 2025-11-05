import { pgTable, serial, varchar, integer, timestamp, text, date, boolean } from 'drizzle-orm/pg-core';

// Family tree members
export const people = pgTable('people', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  maidenName: varchar('maiden_name', { length: 255 }),
  birthYear: integer('birth_year'),
  birthDate: date('birth_date'),
  birthPlace: varchar('birth_place', { length: 255 }),
  deathYear: integer('death_year'),
  deathDate: date('death_date'),
  deathPlace: varchar('death_place', { length: 255 }),
  marriagePlace: varchar('marriage_place', { length: 255 }),
  gender: varchar('gender', { length: 20 }), // 'male', 'female', 'other'
  isFavorite: boolean('is_favorite').default(false),
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
