/**
 * Twilio Integration for SMS and WhatsApp
 * Supports sending messages, receiving webhooks, and managing phone numbers
 */
import twilio from 'twilio';
type MessageStatusType = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const whatsappFromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

export const twilioClient = accountSid && authToken
  ? twilio(accountSid, authToken)
  : null;

export interface SendMessageParams {
  to: string;
  body: string;
  mediaUrls?: string[];
  channel?: 'SMS' | 'WHATSAPP';
}

export interface TwilioMessageResponse {
  externalId: string;
  status: MessageStatusType;
  sentAt: Date;
  error?: string;
}

/**
 * Send SMS message via Twilio
 */
export async function sendSMS(params: SendMessageParams): Promise<TwilioMessageResponse> {
  if (!twilioClient || !fromNumber) {
    throw new Error('Twilio not configured');
  }

  try {
    const message = await twilioClient.messages.create({
      body: params.body,
      from: fromNumber,
      to: params.to,
      mediaUrl: params.mediaUrls,
    });

  return {
    externalId: message.sid,
    status: (message.status === 'sent' ? 'SENT' : 'PENDING') as MessageStatusType,
    sentAt: new Date(),
  };
  } catch (error: any) {
  return {
    externalId: '',
    status: 'FAILED' as MessageStatusType,
    sentAt: new Date(),
    error: error.message || 'Failed to send SMS',
  };
  }
}

/**
 * Send WhatsApp message via Twilio
 * Note: Requires WhatsApp Business API and Sandbox setup
 */
export async function sendWhatsApp(params: SendMessageParams): Promise<TwilioMessageResponse> {
  if (!twilioClient || !whatsappFromNumber) {
    throw new Error('Twilio not configured');
  }

  try {
    // WhatsApp messages use 'whatsapp:' prefix with sandbox number
    const from = whatsappFromNumber.startsWith('whatsapp:') ? whatsappFromNumber : `whatsapp:${whatsappFromNumber}`;
    const to = params.to.startsWith('whatsapp:') ? params.to : `whatsapp:${params.to}`;

    const message = await twilioClient.messages.create({
      body: params.body,
      from,
      to,
      mediaUrl: params.mediaUrls,
    });

  return {
    externalId: message.sid,
    status: (message.status === 'sent' ? 'SENT' : 'PENDING') as MessageStatusType,
    sentAt: new Date(),
  };
  } catch (error: any) {
    return {
      externalId: '',
      status: 'FAILED' as MessageStatusType,
      sentAt: new Date(),
      error: error.message || 'Failed to send WhatsApp message',
    };
  }
}

/**
 * Validate Twilio webhook signature
 */
export function validateTwilioWebhook(
  signature: string,
  url: string,
  params: Record<string, any>
): boolean {
  if (!authToken) {
    return false;
  }

  return twilio.validateRequest(authToken, signature, url, params);
}

/**
 * Fetch available Twilio phone numbers
 */
export async function fetchTwilioNumbers(): Promise<any[]> {
  if (!twilioClient) {
    return [];
  }

  try {
    const numbers = await twilioClient.incomingPhoneNumbers.list({ limit: 20 });
    return numbers.map(num => ({
      sid: num.sid,
      phoneNumber: num.phoneNumber,
      friendlyName: num.friendlyName,
      capabilities: num.capabilities,
    }));
  } catch (error) {
    console.error('Error fetching Twilio numbers:', error);
    return [];
  }
}

/**
 * Parse Twilio webhook payload
 */
export function parseTwilioWebhook(body: Record<string, any>) {
  return {
    messageSid: body.MessageSid,
    accountSid: body.AccountSid,
    from: body.From,
    to: body.To,
    body: body.Body,
    mediaUrls: body.NumMedia ? JSON.parse(body.MediaUrl0 || '[]') : [],
    status: body.MessageStatus,
  };
}

