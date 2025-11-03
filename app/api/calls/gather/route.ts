/**
 * Twilio Call Gather Webhook
 * Handles incoming call webhooks from Twilio
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // This is a TwiML webhook endpoint
  // Return TwiML instructions to Twilio
  
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">
        Thank you for calling the Unified Inbox. This is a test call from your application.
    </Say>
    <Pause length="1"/>
    <Say voice="alice">
        The call functionality is working correctly. Goodbye!
    </Say>
    <Hangup/>
</Response>`;

  return new NextResponse(twiml, {
    headers: { 'Content-Type': 'text/xml' },
  });
}



