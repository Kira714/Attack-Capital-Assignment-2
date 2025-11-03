/**
 * Twilio Webhook Handler
 * Receives inbound SMS/WhatsApp messages and status updates
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseTwilioWebhook, validateTwilioWebhook } from '@/lib/integrations/twilio';
// TypeScript types
type Channel = 'SMS' | 'WHATSAPP' | 'EMAIL' | 'TWITTER' | 'FACEBOOK' | 'OTHER';

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();
    const payload = Object.fromEntries(body.entries());

    // In production, validate the webhook signature
    const signature = request.headers.get('x-twilio-signature');
    const url = request.url;
    
    console.log('🔥 WhatsApp webhook received:', payload);
    
    // For development, skip signature validation
    // const isValid = validateTwilioWebhook(signature || '', url, payload);
    // if (!isValid) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    const { messageSid, from, to, body: messageBody, mediaUrls, status } = parseTwilioWebhook(payload);
    
    console.log('📱 Parsed message:', { messageSid, from, to, messageBody });

    // Determine channel based on phone number format
    const channel = from.startsWith('whatsapp:') ? 'WHATSAPP' : 'SMS';

    // Find or create contact - normalize phone number (keep full number with country code)
    const phoneNumber = from.replace('whatsapp:', '');
    let contact = await prisma.contact.findFirst({
      where: { phone: phoneNumber },
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          phone: phoneNumber,
          firstName: 'Unknown',
          status: 'ACTIVE',
        },
      });
    }

    // Update last contacted timestamp
    await prisma.contact.update({
      where: { id: contact.id },
      data: { lastContactedAt: new Date() },
    });

    // Create inbound message
    const message = await prisma.message.create({
      data: {
        contactId: contact.id,
        channel,
        direction: 'INBOUND',
        status: 'SENT',
        body: messageBody as string,
        mediaUrls: Array.isArray(mediaUrls) ? mediaUrls : mediaUrls ? [mediaUrls as string] : [],
        externalId: messageSid as string,
        read: false,
        sentAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, messageId: message.id });
  } catch (error: any) {
    console.error('Error processing Twilio webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

