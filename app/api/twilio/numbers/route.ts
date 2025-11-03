/**
 * Twilio Numbers API
 * GET: Fetch available phone numbers
 * POST: Purchase a phone number
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const twilio = require('twilio');

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      return NextResponse.json({ 
        error: 'Twilio not configured',
        numbers: []
      });
    }

    const client = twilio(accountSid, authToken);
    
    // Fetch available numbers for purchase (US)
    const availableNumbers = await client.availablePhoneNumbers('US')
      .local
      .list({ limit: 20 });

    // Fetch already purchased numbers
    const incomingNumbers = await client.incomingPhoneNumbers.list();

    return NextResponse.json({
      available: availableNumbers.map((num: any) => ({
        phoneNumber: num.phoneNumber,
        locality: num.locality || 'Unknown',
        region: num.region || 'Unknown',
        capabilities: num.capabilities,
      })),
      purchased: incomingNumbers.map((num: any) => ({
        sid: num.sid,
        phoneNumber: num.phoneNumber,
        friendlyName: num.friendlyName,
        capabilities: num.capabilities,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching Twilio numbers:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        numbers: [],
        purchased: []
      },
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

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      return NextResponse.json({ 
        error: 'Twilio not configured' 
      }, { status: 400 });
    }

    const body = await request.json();
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json({ 
        error: 'Phone number required' 
      }, { status: 400 });
    }

    const client = twilio(accountSid, authToken);
    
    // Purchase the phone number
    const incomingNumber = await client.incomingPhoneNumbers.create({
      phoneNumber: phoneNumber,
    });

    return NextResponse.json({
      success: true,
      number: {
        sid: incomingNumber.sid,
        phoneNumber: incomingNumber.phoneNumber,
        friendlyName: incomingNumber.friendlyName,
        capabilities: incomingNumber.capabilities,
      },
      message: 'Phone number purchased successfully!',
    });
  } catch (error: any) {
    console.error('Error purchasing phone number:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to purchase number',
        details: error.message
      },
      { status: 500 }
    );
  }
}



