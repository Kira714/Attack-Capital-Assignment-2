/**
 * Shared TypeScript types for the application
 */

// Enum types
export type Channel = 'SMS' | 'WHATSAPP' | 'EMAIL' | 'TWITTER' | 'FACEBOOK' | 'VOICE' | 'OTHER';
export type MessageStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
export type MessageDirection = 'INBOUND' | 'OUTBOUND';
export type ContactStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type UserRole = 'VIEWER' | 'EDITOR' | 'ADMIN';
export type ScheduledMessageStatus = 'SCHEDULED' | 'SENT' | 'CANCELLED' | 'FAILED';

export interface MessageWithContact {
  id: string;
  contactId: string;
  userId: string | null;
  channel: Channel;
  direction: MessageDirection;
  status: MessageStatus;
  body: string;
  mediaUrls: string[];
  externalId: string | null;
  read: boolean;
  readAt: Date | null;
  scheduledFor: Date | null;
  sentAt: Date | null;
  delivered: boolean;
  deliveredAt: Date | null;
  failed: boolean;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  threadId: string | null;
  contact: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    avatar: string | null;
  };
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
}

export interface ContactWithMessages {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  avatar: string | null;
  status: ContactStatus;
  tags: string[];
  lastContactedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  messages: MessageWithContact[];
  _count?: {
    messages: number;
  };
}

export interface ChannelIntegration {
  provider: string;
  name: string;
  channel: Channel;
  isActive: boolean;
  latency?: number;
  cost?: string;
  reliability?: number;
}

export interface AnalyticsMetrics {
  totalMessages: number;
  messagesByChannel: Record<Channel, number>;
  messagesByStatus: Record<MessageStatus, number>;
  averageResponseTime: number;
  responseRate: number;
  conversionRate: number;
}

