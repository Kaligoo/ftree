import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { people, relationships } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    const [updatedPerson] = await db
      .update(people)
      .set({
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
        isFavorite: body.isFavorite !== undefined ? body.isFavorite : undefined,
        notes: body.notes || null,
      })
      .where(eq(people.id, id))
      .returning();

    return NextResponse.json(updatedPerson);
  } catch (error) {
    console.error('Error updating person:', error);
    return NextResponse.json({ error: 'Failed to update person' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    // Delete all relationships first
    await db.delete(relationships).where(eq(relationships.personId, id));
    await db.delete(relationships).where(eq(relationships.relatedPersonId, id));

    // Then delete the person
    await db.delete(people).where(eq(people.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting person:', error);
    return NextResponse.json({ error: 'Failed to delete person' }, { status: 500 });
  }
}
