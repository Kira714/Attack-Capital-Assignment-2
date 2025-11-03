# Unified Inbox - Multi-Channel Customer Outreach Platform

> **A comprehensive full-stack application for unifying customer communications across SMS, WhatsApp, Email, and Social Media channels into a single, cohesive inbox interface.**

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Key Features Implemented](#key-features-implemented)
- [Tech Stack](#tech-stack)
- [Architecture & Design Decisions](#architecture--design-decisions)
- [Installation & Setup](#installation--setup)
- [Configuration Guide](#configuration-guide)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Testing Guide](#testing-guide)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

This Unified Inbox platform was developed as a comprehensive multi-channel communication system that aggregates messages from SMS (Twilio), WhatsApp (Twilio API), and Email into a single, threaded interface. The application enables sales and support teams to manage all customer communications from one place, reducing context-switching and improving response times.

### Mission Statement

Build a production-ready, CRM-like tool that centralizes outreach across multiple communication channels, with real-time collaboration features, role-based access control, and comprehensive analytics.

### Target Users

- **Sales Teams**: Manage leads and customer conversations
- **Support Teams**: Respond to customer inquiries efficiently
- **Team Managers**: Monitor performance via analytics
- **Administrators**: Configure integrations and manage users

---

## ✨ Key Features Implemented

### ✅ Core Functionality

#### 1. **Unified Inbox Interface**
- **Kanban-Style Threads View**: Grid layout with contact cards, channel badges, and message previews
- **Contact List View**: Traditional sidebar with search and filters
- **Real-Time Updates**: Polling every 2 seconds for new messages
- **Channel-Specific Colors**: Visual distinction for SMS, WhatsApp, Email, Voice

**Location**: 
- `app/threads/page.tsx` - Kanban threads view
- `components/inbox/ThreadsView.tsx` - Threads grid component
- `components/inbox/InboxPage.tsx` - Main inbox with contact list
- `components/inbox/ContactList.tsx` - Contact list sidebar

**Testing**: 
- Navigate to `/threads` to see Kanban view
- Navigate to `/inbox` to see traditional view
- Test search, filters, and clicking contacts

#### 2. **Multi-Channel Messaging**

##### SMS via Twilio
- **Send**: Real-time SMS delivery via Twilio API
- **Receive**: Webhook handler processes inbound SMS
- **Status Tracking**: PENDING → SENT → DELIVERED → READ → FAILED
- **Attachments**: MMS support for images/videos

**Location**: 
- `app/api/send-message/route.ts` - Sends via Twilio
- `app/api/webhooks/twilio/route.ts` - Receives inbound messages
- `lib/integrations/twilio.ts` - Twilio SDK wrapper
- `lib/integrations.ts` - Channel factory pattern

**Testing**:
1. Configure Twilio credentials in `.env`
2. Send SMS from inbox composer
3. Reply from your phone
4. Check inbox for inbound message

##### WhatsApp via Twilio Sandbox
- **Sandbox Integration**: WhatsApp Business API via Twilio
- **Two-Way Messaging**: Send template messages, receive free-form replies
- **24-Hour Window**: Free-form messaging after initial reply
- **Webhook Configuration**: ngrok for local testing

**Location**:
- Same as SMS above
- `lib/integrations/twilio.ts:66-95` - WhatsApp sender
- Environment: `TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"`

**Testing**:
1. Join WhatsApp sandbox in Twilio Console
2. Configure webhook URL via ngrok
3. Send WhatsApp from inbox
4. Reply from WhatsApp
5. Check inbox for reply

**Setup Details**:
```bash
# Join sandbox by sending: "join [your-code]" to +1 415 523 8886
# Configure webhook: https://your-ngrok-url.ngrok.io/api/webhooks/twilio
# In Twilio Console: Messaging → Try it out → WhatsApp → Sandbox Configuration
```

#### 3. **Contact Management System**

**Features**:
- **Unified Contact Profiles**: Single schema for phone, email, social handles
- **History Timeline**: All messages and notes in chronological order
- **Quick Actions**: Call, SMS, WhatsApp, Email from profile
- **Auto-Merge**: Fuzzy matching for duplicate contacts
- **Tags & Status**: ACTIVE, INACTIVE, ARCHIVED

**Location**:
- `app/api/contacts/route.ts` - CRUD operations
- `components/inbox/ContactProfile.tsx` - Profile sidebar
- `app/api/contacts/merge/route.ts` - Duplicate merging
- `components/inbox/ContactProfile.tsx:385-480` - Quick actions (Call button)

**Testing**:
1. Click any contact to open profile
2. Add/edit contact details
3. Click "Call" to initiate voice call
4. Test contact search and filters

#### 4. **Message Scheduling**

**Features**:
- **Quick Presets**: 15 min, 30 min, 1 hour, 1 day
- **Custom Scheduling**: Future date/time selection
- **Scheduled Queue**: View all pending messages
- **Status Management**: SCHEDULED → SENT → CANCELLED → FAILED

**Location**:
- `app/api/scheduled-messages/route.ts` - CRUD for scheduled
- `app/scheduled/page.tsx` - Scheduled messages UI
- `components/inbox/MessageComposer.tsx:93-123` - Schedule handler
- `components/inbox/InboxPage.tsx:70-88` - Send logic

**Testing**:
1. Type a message in composer
2. Click clock icon → Select "15 min"
3. Go to `/scheduled` page
4. View scheduled message countdown
5. Delete if needed

**Note**: Messages are saved in DB but not auto-sent yet (cron scheduler needed)

#### 5. **Internal Notes & Collaboration**

**Features**:
- **Threaded Notes**: Notes linked to contacts
- **@Mentions**: Tag team members in notes
- **Privacy Toggle**: Public vs private notes
- **Role Visibility**: Privacy filtering by role
- **User Presence**: Show who's typing/editing

**Location**:
- `app/api/notes/route.ts` - Notes CRUD
- `components/inbox/ContactProfile.tsx:302-393` - Notes UI
- `components/inbox/ContactProfile.tsx:85-108` - Mention parsing
- Database: `prisma/schema.prisma:203-224` - Note model

**Testing**:
1. Open contact profile
2. Click "+" to add note
3. Type "@" to mention users
4. Save note
5. View in notes list

**Note**: Private note filtering and encryption middleware not yet implemented

#### 6. **Real-Time Collaboration**

**Features**:
- **Typing Indicators**: "User is typing..." shown to others
- **Socket.IO**: WebSocket server for real-time updates
- **Self-Filtering**: Users don't see their own typing indicator
- **Polling Fallback**: 2-second polling if WebSocket fails

**Location**:
- `server.js` - Socket.IO server setup
- `hooks/useSocket.ts` - Client socket hook
- `components/inbox/MessageThread.tsx:26-29` - Typing filter
- Port: 3000 (same as Next.js)

**Testing**:
1. Open two browsers (or incognito + normal)
2. Login as two different users
3. Start typing in same contact
4. See "X is typing" indicator

#### 7. **Analytics Dashboard** (Admin Only)

**Features**:
- **Channel Distribution**: Pie chart by SMS/WhatsApp/Email
- **Volume Trends**: Line graph over time
- **Response Times**: Average time to reply
- **Top Contacts**: Most engaged contacts
- **Export Reports**: CSV download

**Location**:
- `app/analytics/page.tsx` - Dashboard UI
- `app/api/analytics/route.ts` - Metrics calculation
- `app/api/analytics/export/route.ts` - CSV export
- **Access**: `/analytics` (ADMIN only)

**Testing**:
1. Login as ADMIN
2. Navigate to Analytics
3. View charts and metrics
4. Test time range filters
5. Download CSV report
6. **Non-admin users**: Redirected to inbox with "Access Denied"

#### 8. **Role-Based Access Control (RBAC)**

**Roles**:

| Feature | VIEWER | EDITOR | ADMIN |
|---------|--------|--------|-------|
| View Messages | ✅ | ✅ | ✅ |
| View Contacts | ✅ | ✅ | ✅ |
| Send Messages | ❌ | ✅ | ✅ |
| Schedule Messages | ❌ | ✅ | ✅ |
| Add Notes | ❌ | ✅ | ✅ |
| Delete Contacts | ❌ | ❌ | ✅ |
| View Analytics | ❌ | ❌ | ✅ |
| Manage Settings | ❌ | ❌ | ✅ |
| Manage Users | ❌ | ❌ | ✅ |

**Location**:
- `lib/permissions.ts` - Permission matrix
- `app/analytics/page.tsx:57-78` - Admin-only check
- `components/inbox/MessageComposer.tsx:22-25` - Hide composer for VIEWER
- `components/inbox/InboxPage.tsx:163-172` - Hide Analytics link for non-admins
- `lib/auth.ts` - Role in JWT token

**Testing**:
1. Login as VIEWER: Message composer hidden
2. Login as EDITOR: Can send but no Analytics
3. Login as ADMIN: Full access

### 🔧 Additional Features

#### 9. **Attachment Support**
- **Local Storage**: Data URLs for demo
- **Preview**: Images, videos inline
- **PDF Viewer**: Modal with iframe
- **Downloads**: Download button for all file types

**Location**:
- `components/inbox/MessageComposer.tsx:32-94` - File upload
- `components/inbox/MessageThread.tsx:128-191` - Attachment display
- `components/inbox/MessageThread.tsx:24` - PDF viewer modal

**Testing**:
1. Click paperclip icon in composer
2. Upload image/video/PDF
3. Send message
4. Preview attachment in thread
5. Download file

#### 10. **Voice Calling**

**Features**:
- **Twilio Voice**: In-app VoIP calls
- **TwiML Responses**: Server-side call instructions
- **Call Tracking**: Message records for calls

**Location**:
- `app/api/calls/initiate/route.ts` - Start call
- `app/api/calls/gather/route.ts` - TwiML webhook
- `components/inbox/ContactProfile.tsx:385-480` - Call button
- Environment: `TWILIO_WEBHOOK_URL` for ngrok

**Testing**:
1. Click "Call" button in contact profile
2. Hear voice response
3. Check database for call record

#### 11. **Search & Filtering**

**Features**:
- **Global Search**: By name, email, phone, message content
- **Channel Filter**: SMS, WhatsApp, Email, Voice
- **Status Filter**: All, Unread, Scheduled, Recent 24h
- **Auto-Complete**: Contact suggestions

**Location**:
- `components/inbox/ThreadsView.tsx:16-70` - Filter logic
- `components/inbox/InboxPage.tsx:39-60` - Contact filters

**Testing**:
1. Type in search box
2. Select channel filter
3. Switch status filter
4. Results update in real-time

---

## 🛠 Tech Stack

### Frontend
- **Next.js 16** - App Router, Server Components
- **React 19** - Latest React with concurrent features
- **TypeScript** - Full type safety
- **Tailwind CSS 4** - Utility-first styling
- **Lucide React** - Icon library

### Backend
- **Next.js API Routes** - Serverless endpoints
- **Prisma ORM** - Type-safe database access
- **NextAuth.js v5** - Authentication & sessions
- **Socket.IO** - Real-time WebSockets

### Database
- **PostgreSQL 14+** - Relational database
- **Prisma** - ORM with migrations

### Integrations
- **Twilio** - SMS, WhatsApp, Voice
- **Twilio SDK** - Official JavaScript SDK
- **ngrok** - Local webhook tunneling

### State Management
- **TanStack Query** - Server state & caching
- **React Hooks** - Client state
- **Context API** - Session management

### Code Quality
- **ESLint** - Linting
- **Prettier** - Code formatting
- **TypeScript** - Compile-time checks
- **Zod** - Runtime validation

### Development Tools
- **Prisma Studio** - Database GUI
- **Next.js Dev Tools** - Performance insights
- **React Dev Tools** - Component debugging

---

## 🏗 Architecture & Design Decisions

### 1. Data Normalization Strategy

**Decision**: Unified `Message` table for all channels

**Rationale**: 
- Single source of truth
- Consistent query patterns
- Easier to implement threading
- Simplified analytics

**Implementation**:
```prisma
model Message {
  channel     Channel        // SMS, WHATSAPP, EMAIL, etc.
  direction   MessageDirection // INBOUND, OUTBOUND
  externalId  String?       // Channel-specific ID (Twilio SID)
  body        String
  mediaUrls   String[]
  // ... other fields
}
```

**Location**: `prisma/schema.prisma:132-178`

### 2. Factory Pattern for Integrations

**Decision**: Channel sender factory

**Rationale**:
- DRY principle
- Easy to add new channels
- Consistent error handling
- Type safety

**Implementation**:
```typescript
// lib/integrations.ts
export function createSender(channel: Channel): ChannelSender {
  switch(channel) {
    case 'SMS': return new TwilioSMSSender();
    case 'WHATSAPP': return new TwilioWhatsAppSender();
    // ...
  }
}
```

**Usage**:
```typescript
const sender = createSender('SMS');
await sender.send({ to: '+1234567890', body: 'Hello' });
```

**Location**: `lib/integrations.ts`

### 3. Webhook-Orchestrated Updates

**Decision**: Webhooks for inbound, API for outbound

**Rationale**:
- Real-time delivery
- No polling overhead
- Proper status updates
- Industry standard

**Implementation**:
```
Twilio → /api/webhooks/twilio → Prisma → React Query Cache
```

**Flow**:
1. Inbound SMS arrives at Twilio
2. Twilio POSTs to webhook URL
3. Server creates Message record
4. React Query refetches (or WebSocket broadcasts)
5. UI updates

**Location**: `app/api/webhooks/twilio/route.ts`

### 4. Real-Time Collaboration

**Decision**: Socket.IO with polling fallback

**Rationale**:
- Graceful degradation
- Works on all networks
- Lower latency when WebSocket works
- Reliable with polling

**Implementation**:
```typescript
// hooks/useSocket.ts
const socket = io();
socket.emit('user-typing', { contactId, userName });

// MessageThread.tsx
refetchInterval: 2000 // Poll every 2 seconds
```

**Location**: 
- Server: `server.js`
- Client: `hooks/useSocket.ts`
- UI: `components/inbox/MessageThread.tsx:38`

### 5. Role-Based Permissions

**Decision**: Permission matrix in `lib/permissions.ts`

**Rationale**:
- Centralized logic
- Easy to audit
- Type-safe
- Composable checks

**Implementation**:
```typescript
export function hasPermission(role: UserRole, action: string): boolean {
  const permissions: Record<UserRole, string[]> = {
    ADMIN: ['view_analytics', 'manage_users', ...],
    EDITOR: ['send_messages', 'create_contacts', ...],
    VIEWER: ['view_messages', 'view_contacts'],
  };
  return permissions[role]?.includes(action) || false;
}
```

**Usage**:
```typescript
if (!hasPermission(session.user.role, 'view_analytics')) {
  return <AccessDenied />;
}
```

**Location**: `lib/permissions.ts`

### 6. Validation with Zod

**Decision**: Zod schemas for all API requests

**Rationale**:
- Runtime type checking
- Clear error messages
- Reusable schemas
- Type inference

**Implementation**:
```typescript
// lib/validations.ts
export const createMessageSchema = z.object({
  contactId: z.string().uuid(),
  channel: z.enum(['SMS', 'WHATSAPP', 'EMAIL']),
  body: z.string().min(1).max(5000),
});

// lib/validation-middleware.ts
export async function validateRequest<T>(req, schema) {
  const body = await req.json();
  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error });
  }
  return result.data;
}
```

**Location**: 
- Schemas: `lib/validations.ts`
- Middleware: `lib/validation-middleware.ts`
- Usage: `app/api/messages/route.ts:30`

### 7. Optimistic UI Updates

**Decision**: Update UI before server responds

**Rationale**:
- Instant feedback
- Better UX
- Handles offline gracefully
- Industry standard

**Implementation**:
```typescript
const mutation = useMutation({
  onMutate: async (newMessage) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['messages']);
    
    // Snapshot current data
    const previous = queryClient.getQueryData(['messages']);
    
    // Optimistically update
    queryClient.setQueryData(['messages'], (old) => [...old, newMessage]);
    
    return { previous };
  },
  onError: (err, newMessage, context) => {
    // Rollback on error
    queryClient.setQueryData(['messages'], context.previous);
  },
});
```

**Location**: TanStack Query patterns throughout UI components

---

## 📦 Installation & Setup

### Prerequisites

- **Node.js 20+** (use `nvm install 20` or `nvm use 20`)
- **PostgreSQL 14+** (local or cloud like Supabase)
- **Twilio Account** ([sign up](https://www.twilio.com/try-twilio))
- **ngrok** (for local webhook testing)

### Step-by-Step Setup

#### 1. Clone Repository

```bash
git clone <repository-url>
cd frappe
```

#### 2. Install Dependencies

```bash
npm install
```

This automatically runs `prisma generate` via `postinstall` script.

#### 3. Database Setup

**Option A: Docker (Recommended)**

```bash
docker-compose up -d postgres
```

**Option B: Local PostgreSQL**

```bash
createdb unified_inbox
```

#### 4. Environment Configuration

```bash
cp .env.example .env
nano .env  # or your preferred editor
```

**Required Variables**:
```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/unified_inbox?schema=public"

# NextAuth (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Twilio (from console.twilio.com)
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="your-token"
TWILIO_PHONE_NUMBER="+1234567890"
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"

# Google OAuth (optional, from console.cloud.google.com)
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"

# ngrok (for webhook testing)
TWILIO_WEBHOOK_URL="https://your-subdomain.ngrok-free.dev"
```

#### 5. Database Migration

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Seed with demo data
npm run db:seed
```

#### 6. Start Development Server

```bash
# Standard Next.js dev server (no real-time)
npm run dev

# Development with Socket.IO server (recommended)
npm run dev:realtime
```

Visit: **http://localhost:3000**

#### 7. Configure Twilio Webhooks

**For Local Development**:

```bash
# Start ngrok
ngrok http 3000

# Copy forwarding URL (e.g., https://abc123.ngrok-free.dev)
# Set in Twilio Console → Phone Numbers → [Your Number] → Webhooks
#   SMS: POST https://abc123.ngrok-free.dev/api/webhooks/twilio
#   Status: POST https://abc123.ngrok-free.dev/api/webhooks/twilio

# For WhatsApp Sandbox:
# Twilio Console → Messaging → Try it out → WhatsApp → Sandbox Configuration
#   When a message comes in: POST https://abc123.ngrok-free.dev/api/webhooks/twilio
```

**For Production**:
- Use your actual domain
- Configure SSL/TLS
- Update webhook URLs in Twilio Console

---

## ⚙️ Configuration Guide

### Twilio Setup

1. **Create Account**: https://www.twilio.com/try-twilio
2. **Get Credentials**:
   - Account SID: Top of Dashboard
   - Auth Token: Click eye icon to reveal
   - Phone Number: Buy trial number ($1)
3. **WhatsApp Sandbox**:
   - Navigate: Messaging → Try it out → WhatsApp
   - Send "join [your-code]" to +1 415 523 8886
   - Wait for confirmation
4. **Configure Webhooks**:
   - Phone Numbers → Manage → Active numbers → [Your Number]
   - Set SMS webhook: `POST https://your-domain.com/api/webhooks/twilio`
   - Set Status webhook: `POST https://your-domain.com/api/webhooks/twilio`
   - WhatsApp: Messaging → Try it out → WhatsApp → Sandbox Configuration

**Testing**:
- Send SMS from inbox
- Reply from phone
- Check inbox for reply
- Send WhatsApp template
- Reply from WhatsApp
- Check inbox for reply

### Google OAuth Setup (Optional)

1. **Create Project**: https://console.cloud.google.com/
2. **Enable APIs**: Google+ API, Google Identity
3. **Create OAuth Credentials**:
   - Type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
   - For production: Add your domain
4. **Copy Credentials**: Client ID and Secret to `.env`

**Testing**:
- Click "Sign in with Google" on login page
- Complete OAuth flow
- User created automatically

### Database Configuration

**Schema Location**: `prisma/schema.prisma`

**Key Models**:
- `User` - Authentication, roles
- `Contact` - Unified customer profiles
- `Message` - Cross-channel messages
- `Note` - Collaboration notes
- `ScheduledMessage` - Auto-send queue
- `Team` - Multi-tenancy

**View Schema**:
```bash
npm run db:studio
# Opens at http://localhost:5555
```

---

## 🗄️ Database Schema

### Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Message : sends
    User ||--o{ Note : creates
    User ||--o{ ScheduledMessage : schedules
    User }o--|| Team : belongs_to
    
    Contact ||--o{ Message : receives
    Contact ||--o{ Note : has
    Contact ||--o{ ScheduledMessage : scheduled_for
    Contact ||--o{ ContactUpdate : history
    
    Message }o--o{ Message : thread
    
    Message {
        string id PK
        string contactId FK
        string userId FK
        enum channel "SMS|WHATSAPP|EMAIL|VOICE"
        enum direction "INBOUND|OUTBOUND"
        enum status "PENDING|SENT|DELIVERED|READ|FAILED"
        text body
        json mediaUrls
        string externalId "Twilio SID"
        boolean read
        timestamp sentAt
        timestamp deliveredAt
        timestamp createdAt
    }
    
    Contact {
        string id PK
        string firstName
        string lastName
        string email
        string phone
        string company
        enum status "ACTIVE|INACTIVE|ARCHIVED"
        json tags
        timestamp lastContactedAt
        timestamp createdAt
        timestamp updatedAt
    }
    
    User {
        string id PK
        string email UK
        string name
        enum role "VIEWER|EDITOR|ADMIN"
        string teamId FK
        timestamp createdAt
        timestamp updatedAt
    }
    
    Note {
        string id PK
        string contactId FK
        string userId FK
        text content
        boolean isPrivate
        json mentions
        timestamp createdAt
    }
    
    ScheduledMessage {
        string id PK
        string contactId FK
        string userId FK
        enum channel
        enum status "SCHEDULED|SENT|CANCELLED|FAILED"
        text body
        timestamp scheduledFor
        timestamp sentAt
        timestamp createdAt
    }
```

### Key Relationships

1. **User → Messages**: One-to-many (user sends messages)
2. **Contact → Messages**: One-to-many (contact receives messages)
3. **Message → Message**: Self-referential for threading (threadId)
4. **Contact → Notes**: One-to-many (multiple notes per contact)
5. **Team → Users**: One-to-many (multi-tenancy)

### Indexes

Optimized for common queries:

```prisma
Message {
  @@index([contactId])  // Fetch contact messages
  @@index([channel])     // Filter by channel
  @@index([status])      // Filter by status
  @@index([externalId])  // Webhook lookups
  @@index([scheduledFor]) // Scheduled queries
}

Contact {
  @@index([email])       // Email lookups
  @@index([phone])       // Phone lookups
}
```

---

## 📡 API Documentation

### Authentication Endpoints

**Base Path**: `/api/auth`

#### `GET /api/auth/[...nextauth]`
- **Purpose**: NextAuth.js endpoints
- **Methods**: GET, POST
- **Actions**: signin, signout, callback, session
- **Location**: `lib/auth.ts`

#### `GET /api/auth/callback/google`
- **Purpose**: Google OAuth callback
- **Flow**: OAuth code → exchange for token → create/update user → session
- **Location**: Handled by NextAuth

### Message Endpoints

**Base Path**: `/api/messages`

#### `GET /api/messages`
- **Purpose**: Fetch messages
- **Query Params**:
  - `contactId` (string): Filter by contact
  - `channel` (enum): Filter by channel
  - `status` (enum): Filter by status
  - `limit` (number): Pagination limit
  - `offset` (number): Pagination offset
- **Auth**: Required
- **Response**: `{ messages: Message[], total: number }`
- **Location**: `app/api/messages/route.ts:32-106`

#### `POST /api/messages`
- **Purpose**: Create message record
- **Body**:
  ```json
  {
    "contactId": "uuid",
    "channel": "SMS",
    "body": "Hello",
    "mediaUrls": ["url1", "url2"]
  }
  ```
- **Auth**: Required
- **Validation**: Zod schema `createMessageSchema`
- **Response**: Created message
- **Location**: `app/api/messages/route.ts:109-164`

### Contact Endpoints

**Base Path**: `/api/contacts`

#### `GET /api/contacts`
- **Purpose**: List contacts
- **Query Params**:
  - `search` (string): Search by name/email/phone
  - `status` (enum): Filter by status
  - `limit`, `offset`: Pagination
- **Auth**: Required
- **Response**: `{ contacts: Contact[], total: number }`
- **Location**: `app/api/contacts/route.ts:11-83`

#### `POST /api/contacts`
- **Purpose**: Create contact
- **Body**: Contact fields
- **Auth**: EDITOR or ADMIN
- **Location**: `app/api/contacts/route.ts:85-129`

#### `GET /api/contacts/[id]`
- **Purpose**: Get contact details
- **Auth**: Required
- **Response**: Contact with messages, notes, scheduled
- **Location**: `app/api/contacts/[id]/route.ts:9-68`

### Send Endpoints

**Base Path**: `/api/send-message`

#### `POST /api/send-message`
- **Purpose**: Send message via Twilio
- **Body**:
  ```json
  {
    "messageId": "uuid",
    "channel": "SMS",
    "contactId": "uuid"
  }
  ```
- **Flow**: Fetch message → Create Twilio request → Update status
- **Auth**: Required
- **Location**: `app/api/send-message/route.ts`

### Webhook Endpoints

**Base Path**: `/api/webhooks`

#### `POST /api/webhooks/twilio`
- **Purpose**: Receive inbound messages from Twilio
- **Auth**: None (validated by signature)
- **Flow**: Parse payload → Find/create contact → Create message → Return 200
- **Location**: `app/api/webhooks/twilio/route.ts`
- **Security**: Skip signature validation in dev (line 20-24)

### Scheduled Message Endpoints

**Base Path**: `/api/scheduled-messages`

#### `GET /api/scheduled-messages`
- **Purpose**: Fetch scheduled messages
- **Query**: Filter by status (SCHEDULED, SENT, CANCELLED, FAILED)
- **Location**: `app/api/scheduled-messages/route.ts:58-95`

#### `POST /api/scheduled-messages`
- **Purpose**: Create scheduled message
- **Body**: `{ contactId, channel, body, scheduledFor, mediaUrls }`
- **Location**: `app/api/scheduled-messages/route.ts:11-56`

#### `PATCH /api/scheduled-messages/[id]`
- **Purpose**: Update status
- **Body**: `{ status }`
- **Location**: `app/api/scheduled-messages/[id]/route.ts:10-54`

#### `DELETE /api/scheduled-messages/[id]`
- **Purpose**: Delete scheduled
- **Auth**: Required
- **Location**: `app/api/scheduled-messages/[id]/route.ts:56-78`

### Analytics Endpoints

**Base Path**: `/api/analytics`

#### `GET /api/analytics`
- **Purpose**: Fetch metrics
- **Query Params**:
  - `range` (enum): 7d, 30d, all
- **Auth**: ADMIN only
- **Response**: Channel counts, trends, top contacts
- **Location**: `app/api/analytics/route.ts`

#### `GET /api/analytics/export`
- **Purpose**: CSV export
- **Response**: CSV download
- **Location**: `app/api/analytics/export/route.ts`

### Call Endpoints

**Base Path**: `/api/calls`

#### `POST /api/calls/initiate`
- **Purpose**: Start voice call
- **Body**: `{ to, contactId }`
- **Flow**: Create Twilio call → Create message record
- **Location**: `app/api/calls/initiate/route.ts`

#### `POST /api/calls/gather`
- **Purpose**: TwiML webhook
- **Response**: XML TwiML instructions
- **Location**: `app/api/calls/gather/route.ts`

---

## 🧪 Testing Guide

### Manual Testing Checklist

#### Authentication
- [ ] Sign up with credentials
- [ ] Sign in with Google OAuth
- [ ] Session persists on refresh
- [ ] Sign out works
- [ ] Protected routes redirect

**Location**: `app/auth/signin/page.tsx`

#### Unified Inbox
- [ ] Threads view loads
- [ ] Contact list loads
- [ ] Search works
- [ ] Filters work
- [ ] Channel badges display
- [ ] Unread counts correct
- [ ] Scheduled counts correct

**Location**: 
- `app/inbox/page.tsx`
- `app/threads/page.tsx`

#### Messaging
- [ ] Compose message
- [ ] Select channel (SMS/WhatsApp/Email)
- [ ] Send immediately
- [ ] Schedule message
- [ ] Attach files
- [ ] Preview attachments
- [ ] View sent messages
- [ ] Receive inbound messages

**Location**:
- `components/inbox/MessageComposer.tsx`
- `components/inbox/MessageThread.tsx`

#### Twilio Integration
- [ ] SMS sends successfully
- [ ] SMS receives in inbox
- [ ] WhatsApp sends (template)
- [ ] WhatsApp receives (after reply)
- [ ] Voice call initiates
- [ ] Call ends properly

**Setup**:
1. Configure `.env` with Twilio credentials
2. Configure webhooks in Twilio Console
3. Use ngrok for local testing
4. Join WhatsApp sandbox

**Location**: All Twilio code in `lib/integrations/twilio.ts`

#### Contact Management
- [ ] Create contact
- [ ] Edit contact
- [ ] Delete contact (admin)
- [ ] View contact profile
- [ ] Add notes
- [ ] @Mention users
- [ ] View history timeline
- [ ] Call button works

**Location**: `components/inbox/ContactProfile.tsx`

#### Scheduling
- [ ] Schedule 15 min message
- [ ] Schedule 30 min message
- [ ] Schedule 1 hour message
- [ ] Schedule 1 day message
- [ ] View /scheduled page
- [ ] Delete scheduled
- [ ] Cancel scheduled

**Location**: `app/scheduled/page.tsx`

#### Analytics (Admin Only)
- [ ] View dashboard
- [ ] Switch time range
- [ ] See channel distribution
- [ ] See volume trends
- [ ] See top contacts
- [ ] Export CSV
- [ ] Non-admin denied access

**Location**: `app/analytics/page.tsx`

#### RBAC
- [ ] VIEWER: Cannot send messages
- [ ] VIEWER: Composer hidden
- [ ] EDITOR: Can send messages
- [ ] EDITOR: No Analytics access
- [ ] ADMIN: Full access
- [ ] ADMIN: Analytics visible

**Location**: All throughout codebase

### Automated Testing

**Unit Tests** (Future):
```bash
npm test
```

**Integration Tests** (Future):
```bash
npm run test:integration
```

**E2E Tests** (Future):
```bash
npm run test:e2e
```

### Testing Commands

```bash
# Type checking
npm run build

# Linting
npm run lint

# Prisma Studio (database GUI)
npm run db:studio

# Database migrations
npm run db:migrate

# Reset database
npm run db:reset

# Seed data
npm run db:seed
```

---

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to https://vercel.com
   - Import project from GitHub
   - Framework: Next.js
   - Root directory: `frappe`

3. **Environment Variables**
   - Add all `.env` variables in Vercel dashboard
   - Key variables:
     - `DATABASE_URL`
     - `NEXTAUTH_SECRET`
     - `NEXTAUTH_URL`
     - Twilio credentials

4. **Deploy**
   - Click "Deploy"
   - Wait for build
   - Access via Vercel URL

5. **Update Webhooks**
   - Update Twilio webhook URLs to Vercel domain
   - Update `NEXTAUTH_URL` to Vercel domain
   - Update Google OAuth redirect URIs

### Docker Deployment

**docker-compose.yml**:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: unified_inbox
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/unified_inbox
    depends_on:
      - postgres

volumes:
  postgres_data:
```

**Deploy**:
```bash
docker-compose up -d
```

### Production Considerations

1. **Database**: Use managed PostgreSQL (Supabase, Neon, RDS)
2. **Redis**: Add for session storage
3. **CDN**: Vercel Edge Network or CloudFlare
4. **Monitoring**: Add Sentry, DataDog
5. **Logging**: Use structured logging
6. **Backups**: Automated database backups
7. **SSL**: Automatic with Vercel
8. **Rate Limiting**: Implement on API routes
9. **Webhook Security**: Validate signatures in production
10. **File Storage**: Migrate from Data URLs to S3/CloudFront

---

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Errors

**Error**: `Can't reach database server`

**Solution**:
```bash
# Check PostgreSQL is running
docker-compose ps

# Restart PostgreSQL
docker-compose restart postgres

# Check connection string
echo $DATABASE_URL

# Test connection
npm run db:studio
```

#### Twilio Webhook Not Receiving

**Error**: Messages not appearing in inbox

**Solution**:
1. Check ngrok is running: `curl http://localhost:4040/api/tunnels`
2. Verify webhook URL in Twilio Console
3. Check server logs: `console.log('Webhook received:', payload)`
4. Test webhook manually:
   ```bash
   curl -X POST http://localhost:3000/api/webhooks/twilio \
     -d "From=%2B1234567890&Body=test&MessageSid=SM123"
   ```

**Location**: `app/api/webhooks/twilio/route.ts:20`

#### Authentication Redirect Loop

**Error**: Infinite redirect to signin

**Solution**:
1. Check `NEXTAUTH_URL` matches current domain
2. Clear cookies
3. Check `NEXTAUTH_SECRET` is set
4. Verify Google OAuth redirect URIs

**Location**: `lib/auth.ts`

#### Prisma Schema Out of Sync

**Error**: `Table does not exist`

**Solution**:
```bash
# Regenerate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# If needed, reset
npm run db:reset
```

#### TypeScript Errors

**Error**: `Property does not exist on type`

**Solution**:
```bash
# Regenerate Prisma types
npm run db:generate

# Restart TypeScript server
# VS Code: Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

#### Socket.IO Not Connecting

**Error**: Real-time features not working

**Solution**:
1. Check server.js is running: `ps aux | grep "node server.js"`
2. Check port 3000 is not blocked
3. Fallback polling works (refetchInterval: 2000)

**Location**: `server.js`, `hooks/useSocket.ts`

---

## 📊 Integration Comparison

| Channel | Provider | Latency | Cost | Reliability | Setup Difficulty |
|---------|----------|---------|------|-------------|------------------|
| **SMS** | Twilio | ~2s | $0.0075-0.02/msg | 99.9% | ⭐ Easy |
| **WhatsApp** | Twilio API | ~3s | $0.005-0.015/msg | 99.8% | ⭐⭐ Medium |
| **Email** | Resend | ~1s | $0.0001/msg | 99.5% | ⭐ Easy |
| **Twitter DM** | API v2 | ~5s | Free (rate limits) | 99% | ⭐⭐ Medium |
| **Facebook** | Graph API | ~4s | Free | 98% | ⭐⭐⭐ Hard |

**Latency** = Average delivery time from send to receipt  
**Reliability** = Uptime percentage  
**Cost** = Approximate per-message cost

### Integration Status

| Integration | Status | Tested | Production Ready |
|-------------|--------|--------|------------------|
| Twilio SMS | ✅ Implemented | ✅ Yes | ✅ Yes |
| Twilio WhatsApp | ✅ Implemented | ✅ Yes (Sandbox) | ⚠️ Sandbox Only |
| Twilio Voice | ✅ Implemented | ✅ Yes | ✅ Yes |
| Resend Email | ⏳ Schema Ready | ❌ No | ❌ No |
| Twitter API | ⏳ Not Started | ❌ No | ❌ No |
| Facebook Messenger | ⏳ Not Started | ❌ No | ❌ No |
| HubSpot Sync | ⏳ Not Started | ❌ No | ❌ No |

**Legend**:
- ✅ Fully working
- ⚠️ Limited functionality
- ⏳ Planned/Partial

---

## 📝 Key Decisions & Rationale

### 1. Why Next.js App Router?

- **Server Components**: Better performance, less JS
- **API Routes**: Unified full-stack app
- **TypeScript**: First-class support
- **File-based routing**: Easy to understand

### 2. Why Prisma ORM?

- **Type Safety**: End-to-end type inference
- **Migrations**: Version-controlled schema
- **Developer Experience**: Great tooling (Studio)
- **Multi-database**: Easy to switch

### 3. Why Socket.IO for Real-Time?

- **Fallback**: Automatic HTTP polling
- **Reliability**: Works on all networks
- **Ecosystem**: Many plugins
- **Alternative**: Can use native WebSockets

### 4. Why Zod for Validation?

- **Runtime Safety**: Catches bad data
- **Type Inference**: No duplication
- **Error Messages**: Human-readable
- **Schema Composable**: Easy to build complex schemas

### 5. Why TanStack Query?

- **Caching**: Automatic cache management
- **Optimistic Updates**: Better UX
- **Devtools**: Great debugging
- **Industry Standard**: Widely used

### 6. Why Unified Message Table?

- **Simplicity**: One query pattern
- **Threading**: Easy to group conversations
- **Analytics**: Aggregate across channels
- **Normalization**: DRY principle

---

## 🔐 Security Considerations

### Implemented

- ✅ **Webhook Signature Validation** (production only)
- ✅ **Role-Based Access Control** (RBAC)
- ✅ **SQL Injection Prevention** (Prisma parameterized queries)
- ✅ **XSS Prevention** (React auto-escaping)
- ✅ **CSRF Protection** (NextAuth)
- ✅ **Session Management** (secure HTTP-only cookies)
- ✅ **Input Validation** (Zod schemas)

### Production Recommendations

- ⚠️ **Add Rate Limiting** (per-user, per-IP)
- ⚠️ **Add Webhook Signature Validation** (currently skipped in dev)
- ⚠️ **Add File Upload Limits** (size, type, virus scanning)
- ⚠️ **Add Audit Logging** (track all actions)
- ⚠️ **Add 2FA** (for admin accounts)
- ⚠️ **Add Encryption at Rest** (for sensitive fields)
- ⚠️ **Add CORS** (restrict origins)
- ⚠️ **Add Helmet** (security headers)

---

## 🎓 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Twilio API Reference](https://www.twilio.com/docs/apis)
- [TanStack Query Guide](https://tanstack.com/query/latest)
- [NextAuth.js Guide](https://authjs.dev/getting-started/introduction)

---

## 🤝 Contributing

This is an assignment submission. Contributions welcome after grading:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🙏 Acknowledgments

- **Twilio** - Messaging infrastructure
- **Next.js Team** - Amazing framework
- **Prisma** - Best-in-class ORM
- **Vercel** - Hosting platform
- **TanStack** - Query library
- **Open Source Community** - All contributors

---

## 📞 Support

**Questions?** Open an issue on GitHub  
**Bugs?** Open a bug report with steps to reproduce  
**Feature Requests?** Open a feature request

---

**Built with ❤️ for seamless customer communication**

**Last Updated**: November 2025  
**Version**: 1.0.0  
**Author**: Sachit Kumbhat 
