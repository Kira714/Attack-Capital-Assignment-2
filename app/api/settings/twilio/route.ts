/**
 * Twilio Settings API
 * Returns Twilio configuration status and phone number
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if Twilio is configured
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    
    const configured = !!(accountSid && phoneNumber);

    return NextResponse.json({
      configured,
      phoneNumber: phoneNumber || null,
    });
  } catch (error: any) {
    console.error('Error fetching Twilio settings:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}









