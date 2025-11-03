import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { relationships } from '@/lib/db/schema';

export async function GET() {
  try {
    const allRelationships = await db.select().from(relationships);
    return NextResponse.json(allRelationships);
  } catch (error) {
    console.error('Error fetching relationships:', error);
    return NextResponse.json({ error: 'Failed to fetch relationships', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const [newRelationship] = await db.insert(relationships).values({
      personId: body.personId,
      relatedPersonId: body.relatedPersonId,
      relationType: body.relationType,
    }).returning();

    return NextResponse.json(newRelationship);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create relationship' }, { status: 500 });
  }
}
