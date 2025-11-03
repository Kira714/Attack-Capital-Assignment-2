/**
 * Merge Duplicate Contacts API
 * Auto-detect and merge duplicate contacts
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

/**
 * Calculate similarity between two strings (Levenshtein distance)
 */
function similarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  if (longer.length === 0) return 1.0;
  const distance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'update_contacts')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all contacts
    const contacts = await prisma.contact.findMany({
      include: {
        _count: {
          select: { messages: true, notes: true },
        },
      },
    });

    // Find potential duplicates
    const duplicates: any[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < contacts.length; i++) {
      if (processed.has(contacts[i].id)) continue;

      const group = [contacts[i]];
      
      for (let j = i + 1; j < contacts.length; j++) {
        if (processed.has(contacts[j].id)) continue;

        let isDuplicate = false;

        // Check email match
        if (contacts[i].email && contacts[j].email && 
            contacts[i].email.toLowerCase() === contacts[j].email.toLowerCase()) {
          isDuplicate = true;
        }

        // Check phone match
        if (contacts[i].phone && contacts[j].phone && 
            contacts[i].phone === contacts[j].phone) {
          isDuplicate = true;
        }

        // Check name similarity (80% threshold)
        if (!isDuplicate && contacts[i].firstName && contacts[j].firstName) {
          const nameSimilarity = similarity(
            `${contacts[i].firstName} ${contacts[i].lastName}`,
            `${contacts[j].firstName} ${contacts[j].lastName}`
          );
          if (nameSimilarity >= 0.8) {
            isDuplicate = true;
          }
        }

        if (isDuplicate) {
          group.push(contacts[j]);
          processed.add(contacts[j].id);
        }
      }

      if (group.length > 1) {
        duplicates.push(group);
        processed.add(contacts[i].id);
      }
    }

    return NextResponse.json({
      duplicates,
      total: duplicates.length,
    });
  } catch (error: any) {
    console.error('Error finding duplicates:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'delete_contacts')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { primaryId, duplicateIds } = body;

    if (!primaryId || !duplicateIds || !Array.isArray(duplicateIds)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Merge duplicates into primary contact
    for (const duplicateId of duplicateIds) {
      // Move all messages from duplicate to primary
      await prisma.message.updateMany({
        where: { contactId: duplicateId },
        data: { contactId: primaryId },
      });

      // Move all notes from duplicate to primary
      await prisma.note.updateMany({
        where: { contactId: duplicateId },
        data: { contactId: primaryId },
      });

      // Move scheduled messages
      await prisma.scheduledMessage.updateMany({
        where: { contactId: duplicateId },
        data: { contactId: primaryId },
      });

      // Delete the duplicate contact
      await prisma.contact.delete({
        where: { id: duplicateId },
      });
    }

    return NextResponse.json({
      success: true,
      merged: duplicateIds.length,
    });
  } catch (error: any) {
    console.error('Error merging contacts:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}









