# Setup Guide for Unified Inbox

This guide will help you set up the Unified Inbox project from scratch.

## Prerequisites

- **Node.js 20+** (Use `nvm use 20` or `nvm install 20`)
- **PostgreSQL 14+** (local or cloud)
- **Twilio Account** (trial or paid)

## Quick Start

### 1. Database Setup (Docker)

```bash
# Start PostgreSQL with Docker
docker-compose up -d postgres

# Wait for database to be ready
docker-compose ps
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# This will automatically run Prisma generate
```

### 3. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your values
nano .env  # or your preferred editor
```

Required environment variables:

```env
# Database (already configured for Docker)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/unified_inbox?schema=public"

# NextAuth (generate a random secret)
NEXTAUTH_SECRET="your-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Twilio (get from https://console.twilio.com/)
TWILIO_ACCOUNT_SID="your_account_sid"
TWILIO_AUTH_TOKEN="your_auth_token"
TWILIO_PHONE_NUMBER="+1234567890"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

### 4. Database Migration

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Seed with demo data
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Twilio Setup

1. **Create Account**: Go to https://www.twilio.com/try-twilio
2. **Get Credentials**: From Console Dashboard
   - Account SID
   - Auth Token
   - Phone Number
3. **WhatsApp Sandbox** (Optional):
   - Go to Messaging → Try it out → Send a WhatsApp Message
   - Follow instructions to join sandbox
4. **Configure Webhooks**:
   - In Twilio Console, set webhook URL to: `https://your-domain.com/api/webhooks/twilio`

## Google OAuth Setup

1. Go to https://console.cloud.google.com/
2. Create new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Secret to `.env`

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps

# View logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Prisma Issues

```bash
# Regenerate Prisma client
npm run db:generate

# Check schema
cat prisma/schema.prisma

# Open Prisma Studio
npm run db:studio
```

### Next.js Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

### Node Version Issues

```bash
# Ensure Node 20+
nvm install 20
nvm use 20
node -v  # Should show v20.x.x
```

## Production Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Docker

```bash
# Build image
docker build -t unified-inbox .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e NEXTAUTH_SECRET=... \
  unified-inbox
```

## Next Steps

- Set up additional integrations (Email, Social Media)
- Configure webhooks for Twilio
- Set up monitoring and logging
- Implement analytics dashboard
- Add automated testing

## Demo Credentials

After seeding, you can log in with:
- **Email**: `demo@unifiedinbox.com`
- **Password**: `password`

**Note**: Change these in production!

## Support

For issues or questions:
- Open an issue on GitHub
- Check the main README.md
- Review API documentation









