/**
 * Scheduled Messages API
 * POST: Create a scheduled message
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createScheduledMessageSchema } from '@/lib/validations';
import { validateRequest } from '@/lib/validation-middleware';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request body
    const validation = await validateRequest(request, createScheduledMessageSchema);
    if (!validation.success) {
      return validation.response;
    }
    const { contactId, channel, body: messageBody, scheduledFor, subject, mediaUrls } = validation.data;

    const scheduledMessage = await prisma.scheduledMessage.create({
      data: {
        contactId,
        userId: session.user.id,
        channel,
        body: messageBody,
        scheduledFor: new Date(scheduledFor),
        status: 'SCHEDULED',
        mediaUrls: mediaUrls || [],
      },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json(scheduledMessage, { status: 201 });
  } catch (error: any) {
    console.error('Error creating scheduled message:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scheduledMessages = await prisma.scheduledMessage.findMany({
      where: {
        status: {
          in: ['SCHEDULED', 'SENT'],
        },
      },
      orderBy: {
        scheduledFor: 'asc',
      },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({ scheduledMessages });
  } catch (error: any) {
    console.error('Error fetching scheduled messages:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

