/**
 * Send Message API
 * Handles cross-channel message sending via Twilio
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendSMS, sendWhatsApp } from '@/lib/integrations/twilio';
import { sendEmail } from '@/lib/integrations/email';
// Using string literals for MessageStatus
type MessageStatusType = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { messageId, channel, contactId } = body;

    // Fetch the message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { contact: true },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (message.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Send via appropriate channel
    let result;
    console.log('📤 Sending message via', channel, 'to', message.contact.phone);
    
    if (channel === 'WHATSAPP') {
      result = await sendWhatsApp({
        to: message.contact.phone || '',
        body: message.body,
        mediaUrls: message.mediaUrls,
      });
      console.log('📱 WhatsApp result:', result);
    } else if (channel === 'SMS') {
      result = await sendSMS({
        to: message.contact.phone || '',
        body: message.body,
        mediaUrls: message.mediaUrls,
      });
      console.log('💬 SMS result:', result);
    } else if (channel === 'EMAIL') {
      result = await sendEmail({
        to: message.contact.email || '',
        subject: 'Message from Unified Inbox',
        body: message.body,
      });
      console.log('📧 Email result:', result);
    } else {
      return NextResponse.json(
        { error: 'Unsupported channel' },
        { status: 400 }
      );
    }

    // Update message status
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        status: result.status,
        externalId: result.externalId,
        sentAt: result.sentAt,
        failureReason: result.error || null,
        failed: result.status === 'FAILED',
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

    // Update contact last contacted
    await prisma.contact.update({
      where: { id: contactId },
      data: { lastContactedAt: new Date() },
    });

    return NextResponse.json(updatedMessage);
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

