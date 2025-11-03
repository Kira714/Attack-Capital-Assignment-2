/**
 * Twilio Voice Call API
 * POST: Initiate a Twilio voice call
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const twilio = require('twilio');

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioPhone) {
      return NextResponse.json({ 
        error: 'Twilio not configured',
        configured: false
      }, { status: 400 });
    }

    const body = await request.json();
    const { to, contactId } = body;

    if (!to) {
      return NextResponse.json({ 
        error: 'Phone number required' 
      }, { status: 400 });
    }

    const client = twilio(accountSid, authToken);
    
    // For local development, Twilio can't reach localhost
    // Use a TwiML URL or a public ngrok URL in production
    const webhookUrl = process.env.TWILIO_WEBHOOK_URL 
      ? `${process.env.TWILIO_WEBHOOK_URL}/api/calls/gather`
      : `http://localhost:3000/api/calls/gather`;
    
    try {
      // Make the call
      const call = await client.calls.create({
        to: to,
        from: twilioPhone,
        url: webhookUrl,
      });

      // Create call record in database
      if (contactId) {
        await prisma.message.create({
          data: {
            contactId,
            userId: session.user.id,
            channel: 'VOICE',
            direction: 'OUTBOUND',
            status: 'PENDING',
            body: `Call to ${to}`,
            externalId: call.sid,
            sentAt: new Date(),
          },
        });
      }

      return NextResponse.json({
        success: true,
        callSid: call.sid,
        status: call.status,
      });
    } catch (callError: any) {
      // Handle Twilio-specific errors
      if (callError.message?.includes('Url is not a valid URL')) {
        return NextResponse.json({
          error: 'Twilio webhook URL not accessible',
          details: 'For local development, you need a public URL (e.g., ngrok) or TwiML Bin',
          suggestion: 'Set TWILIO_WEBHOOK_URL in .env to a public HTTPS URL or use Twilio TwiML Bins',
        }, { status: 400 });
      }
      throw callError;
    }
  } catch (error: any) {
    console.error('Error initiating call:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to initiate call',
        details: error.message
      },
      { status: 500 }
    );
  }
}

