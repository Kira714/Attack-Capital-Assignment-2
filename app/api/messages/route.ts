/**
 * Messages API
 * 
 * @fileoverview Handles message creation and retrieval with full validation
 * @module api/messages
 * 
 * @endpoint GET /api/messages
 * @query {string} contactId - Filter by contact
 * @query {string} channel - Filter by channel (SMS, WHATSAPP, EMAIL, etc.)
 * @query {string} status - Filter by status
 * @query {number} limit - Result limit (default 50)
 * @query {number} offset - Pagination offset
 * @returns {object} { messages: Message[], total: number, limit: number, offset: number }
 * 
 * @endpoint POST /api/messages
 * @body {string} contactId - Recipient contact ID
 * @body {string} channel - Message channel
 * @body {string} body - Message content (max 5000 chars)
 * @body {string[]} mediaUrls - Optional media attachments
 * @body {string} threadId - Optional thread ID for replies
 * @returns {Message} Created message object
 * 
 * @security Requires authentication
 * @validation POST requests validated with Zod schema
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createMessageSchema } from '@/lib/validations';
import { validateRequest } from '@/lib/validation-middleware';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const contactId = searchParams.get('contactId');
    const channel = searchParams.get('channel');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};

    if (contactId) where.contactId = contactId;
    if (channel) where.channel = channel;
    if (status) where.status = status;

    const messages = await prisma.message.findMany({
      where,
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        replies: {
          take: 10,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.message.count({ where });

    return NextResponse.json({
      messages,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
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

    // Validate request body
    const validation = await validateRequest(request, createMessageSchema);
    if (!validation.success) {
      return validation.response;
    }
    const { contactId, channel, body: messageBody, mediaUrls, threadId } = validation.data;

    const message = await prisma.message.create({
      data: {
        contactId,
        userId: session.user.id,
        channel,
        direction: 'OUTBOUND',
        status: 'PENDING',
        body: messageBody,
        mediaUrls: mediaUrls || [],
        threadId,
      },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error: any) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

