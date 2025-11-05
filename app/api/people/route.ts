import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { people } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const allPeople = await db.select().from(people);
    return NextResponse.json(allPeople);
  } catch (error) {
    console.error('Error fetching people:', error);
    const errorDetails = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    return NextResponse.json({
      error: 'Failed to fetch people',
      details: errorDetails,
      stack: errorStack,
      env: process.env.POSTGRES_URL ? 'POSTGRES_URL is set' : 'POSTGRES_URL is NOT set'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const [newPerson] = await db.insert(people).values({
      name: body.name,
      maidenName: body.maidenName || null,
      birthYear: body.birthYear || null,
      birthDate: body.birthDate || null,
      birthPlace: body.birthPlace || null,
      deathYear: body.deathYear || null,
      deathDate: body.deathDate || null,
      deathPlace: body.deathPlace || null,
      marriagePlace: body.marriagePlace || null,
      gender: body.gender || null,
      isFavorite: body.isFavorite || false,
      notes: body.notes || null,
    }).returning();

    return NextResponse.json(newPerson);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create person' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    await db.delete(people).where(eq(people.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete person' }, { status: 500 });
  }
}
