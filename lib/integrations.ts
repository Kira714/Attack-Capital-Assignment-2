/**
 * Integration Factory Pattern
 * 
 * @fileoverview Centralized factory for creating channel-specific senders
 * @module lib/integrations
 * 
 * Usage:
 * ```typescript
 * const sender = createSender('whatsapp');
 * await sender.send({ to: '+1234567890', body: 'Hello!' });
 * ```
 */

import { Channel } from './types';

const twilio = require('twilio');

/**
 * Configuration for integration providers
 */
interface SenderConfig {
  accountSid?: string;
  authToken?: string;
  phoneNumber?: string;
  apiKey?: string;
  webhookUrl?: string;
}

/**
 * Payload for sending messages
 */
export interface SendPayload {
  to: string;
  body: string;
  from?: string;
  mediaUrls?: string[];
  subject?: string;
}

/**
 * Result from sending a message
 */
export interface SendResult {
  success: boolean;
  messageId?: string;
  externalId?: string;
  error?: string;
}

/**
 * Base interface for channel senders
 */
export interface ChannelSender {
  send(payload: SendPayload): Promise<SendResult>;
  validate?(payload: SendPayload): boolean;
}

/**
 * Twilio SMS Sender
 */
class TwilioSMSSender implements ChannelSender {
  private client: any;
  private phoneNumber: string;

  constructor(config: SenderConfig) {
    if (!config.accountSid || !config.authToken || !config.phoneNumber) {
      throw new Error('Twilio configuration missing');
    }
    this.client = twilio(config.accountSid, config.authToken);
    this.phoneNumber = config.phoneNumber;
  }

  async send(payload: SendPayload): Promise<SendResult> {
    try {
      const message = await this.client.messages.create({
        body: payload.body,
        from: payload.from || this.phoneNumber,
        to: payload.to,
        mediaUrl: payload.mediaUrls,
      });

      return {
        success: true,
        messageId: message.sid,
        externalId: message.sid,
      };
    } catch (error: any) {
      console.error('Twilio SMS error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  validate(payload: SendPayload): boolean {
    // SMS can be up to 1600 chars with Twilio
    return payload.body.length <= 1600;
  }
}

/**
 * Twilio WhatsApp Sender
 */
class TwilioWhatsAppSender implements ChannelSender {
  private client: any;
  private phoneNumber: string;

  constructor(config: SenderConfig) {
    if (!config.accountSid || !config.authToken) {
      throw new Error('Twilio configuration missing');
    }
    this.client = twilio(config.accountSid, config.authToken);
    // WhatsApp uses whatsapp: prefix
    this.phoneNumber = config.phoneNumber || 'whatsapp:+14155238886';
  }

  async send(payload: SendPayload): Promise<SendResult> {
    try {
      // WhatsApp in Twilio requires whatsapp: prefix
      const to = payload.to.startsWith('whatsapp:') ? payload.to : `whatsapp:${payload.to}`;
      const from = payload.from || this.phoneNumber;

      const message = await this.client.messages.create({
        body: payload.body,
        from,
        to,
        mediaUrl: payload.mediaUrls,
      });

      return {
        success: true,
        messageId: message.sid,
        externalId: message.sid,
      };
    } catch (error: any) {
      console.error('Twilio WhatsApp error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  validate(payload: SendPayload): boolean {
    // WhatsApp supports up to 4096 chars
    return payload.body.length <= 4096;
  }
}

/**
 * Email Sender (Resend)
 */
class EmailSender implements ChannelSender {
  private apiKey: string;

  constructor(config: SenderConfig) {
    if (!config.apiKey) {
      throw new Error('Email API key missing');
    }
    this.apiKey = config.apiKey;
  }

  async send(payload: SendPayload): Promise<SendResult> {
    try {
      // TODO: Implement Resend API
      return {
        success: false,
        error: 'Email sender not yet implemented',
      };
    } catch (error: any) {
      console.error('Email error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

/**
 * Twilio Voice Call Initiator
 */
class TwilioVoiceSender implements ChannelSender {
  private client: any;
  private phoneNumber: string;
  private webhookUrl?: string;

  constructor(config: SenderConfig) {
    if (!config.accountSid || !config.authToken || !config.phoneNumber) {
      throw new Error('Twilio configuration missing');
    }
    this.client = twilio(config.accountSid, config.authToken);
    this.phoneNumber = config.phoneNumber;
    this.webhookUrl = config.webhookUrl;
  }

  async send(payload: SendPayload): Promise<SendResult> {
    try {
      const call = await this.client.calls.create({
        to: payload.to,
        from: this.phoneNumber,
        url: this.webhookUrl || 'https://handler.twilio.com/twiml/EH123456789',
      });

      return {
        success: true,
        messageId: call.sid,
        externalId: call.sid,
      };
    } catch (error: any) {
      console.error('Twilio Voice error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

/**
 * Factory function to create channel-specific senders
 * 
 * @param channel - The message channel
 * @param config - Configuration for the sender
 * @returns A channel-specific sender implementation
 * 
 * @example
 * ```typescript
 * const config = {
 *   accountSid: process.env.TWILIO_ACCOUNT_SID,
 *   authToken: process.env.TWILIO_AUTH_TOKEN,
 *   phoneNumber: process.env.TWILIO_PHONE_NUMBER,
 * };
 * const sender = createSender('whatsapp', config);
 * const result = await sender.send({
 *   to: '+1234567890',
 *   body: 'Hello from WhatsApp!',
 * });
 * ```
 */
export function createSender(channel: Channel, config: SenderConfig): ChannelSender {
  switch (channel) {
    case 'SMS':
      return new TwilioSMSSender(config);
    
    case 'WHATSAPP':
      return new TwilioWhatsAppSender(config);
    
    case 'EMAIL':
      return new EmailSender(config);
    
    case 'VOICE':
      return new TwilioVoiceSender(config);
    
    default:
      throw new Error(`Unsupported channel: ${channel}`);
  }
}

/**
 * Get default configuration from environment variables
 */
export function getDefaultConfig(): SenderConfig {
  return {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    apiKey: process.env.RESEND_API_KEY,
    webhookUrl: process.env.TWILIO_WEBHOOK_URL || `${process.env.NEXTAUTH_URL}/api/calls/gather`,
  };
}

/**
 * Helper to send a message using the factory pattern
 * 
 * @param channel - Message channel
 * @param payload - Message payload
 * @param config - Optional custom config (uses env vars by default)
 */
export async function sendMessage(
  channel: Channel,
  payload: SendPayload,
  config?: SenderConfig
): Promise<SendResult> {
  const sender = createSender(channel, config || getDefaultConfig());
  return sender.send(payload);
}



