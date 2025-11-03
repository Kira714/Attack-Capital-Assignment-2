/**
 * Zod validation schemas
 * Type-safe validation for all API endpoints
 */
import { z } from 'zod';

// Message schemas
export const createMessageSchema = z.object({
  contactId: z.string().min(1, 'Contact ID required'),
  channel: z.enum(['SMS', 'WHATSAPP', 'EMAIL', 'TWITTER', 'FACEBOOK', 'VOICE', 'OTHER'], {
    errorMap: () => ({ message: 'Invalid channel' }),
  }),
  body: z.string().min(1, 'Message body required').max(5000, 'Message too long'),
  mediaUrls: z.array(z.string().url()).optional(),
  threadId: z.string().optional(),
});

export const sendMessageSchema = z.object({
  messageId: z.string().uuid('Invalid message ID'),
  contactId: z.string().min(1, 'Contact ID required'),
  channel: z.enum(['SMS', 'WHATSAPP', 'EMAIL', 'TWITTER', 'FACEBOOK', 'VOICE', 'OTHER']),
});

// Contact schemas
export const createContactSchema = z.object({
  firstName: z.string().min(1, 'First name required').max(100),
  lastName: z.string().max(100).optional(),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
  company: z.string().max(200).optional(),
  tags: z.array(z.string()).optional(),
  twitterHandle: z.string().max(100).optional(),
  facebookId: z.string().max(100).optional(),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).default('ACTIVE'),
});

export const updateContactSchema = createContactSchema.partial();

export const mergeContactsSchema = z.object({
  primaryId: z.string().uuid('Invalid primary contact ID'),
  duplicateId: z.string().uuid('Invalid duplicate contact ID'),
});

// Note schemas
export const createNoteSchema = z.object({
  contactId: z.string().uuid('Invalid contact ID'),
  content: z.string().min(1, 'Note content required').max(5000, 'Note too long'),
  isPrivate: z.boolean().default(false),
  mentions: z.array(z.string()).optional(),
});

// Scheduled message schemas
export const createScheduledMessageSchema = z.object({
  contactId: z.string().uuid('Invalid contact ID'),
  channel: z.enum(['SMS', 'WHATSAPP', 'EMAIL', 'TWITTER', 'FACEBOOK', 'VOICE', 'OTHER']),
  body: z.string().min(1, 'Message body required').max(5000, 'Message too long'),
  scheduledFor: z.string().datetime('Invalid scheduled time'),
  mediaUrls: z.array(z.string()).optional(), // Allow data URLs
  subject: z.string().max(500).optional(),
});

// Call schemas
export const initiateCallSchema = z.object({
  contactId: z.string().uuid('Invalid contact ID').optional(),
  to: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
});

// Twilio number schemas
export const purchaseNumberSchema = z.object({
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
});

// User schemas
export const updateUserSchema = z.object({
  name: z.string().max(200).optional(),
  role: z.enum(['VIEWER', 'EDITOR', 'ADMIN']).optional(),
  teamId: z.string().uuid('Invalid team ID').optional(),
});

// Export types
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type MergeContactsInput = z.infer<typeof mergeContactsSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type CreateScheduledMessageInput = z.infer<typeof createScheduledMessageSchema>;
export type InitiateCallInput = z.infer<typeof initiateCallSchema>;
export type PurchaseNumberInput = z.infer<typeof purchaseNumberSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;



