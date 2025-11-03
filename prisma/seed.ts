/**
 * Prisma Seed Script
 * Populates the database with sample data for development
 */
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo users with different roles
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@unifiedinbox.com' },
    update: {},
    create: {
      email: 'admin@unifiedinbox.com',
      name: 'Admin User',
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  });

  const editorUser = await prisma.user.upsert({
    where: { email: 'editor@unifiedinbox.com' },
    update: {},
    create: {
      email: 'editor@unifiedinbox.com',
      name: 'Editor User',
      role: 'EDITOR',
      emailVerified: new Date(),
    },
  });

  const viewerUser = await prisma.user.upsert({
    where: { email: 'viewer@unifiedinbox.com' },
    update: {},
    create: {
      email: 'viewer@unifiedinbox.com',
      name: 'Viewer User',
      role: 'VIEWER',
      emailVerified: new Date(),
    },
  });

  console.log('✅ Created users:', { admin: adminUser.email, editor: editorUser.email, viewer: viewerUser.email });
  
  const user = adminUser; // Use admin as default for seed data

  // Create sample contacts
  const contacts = await Promise.all([
    prisma.contact.upsert({
      where: { id: randomUUID() },
      update: {},
      create: {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@example.com',
        phone: '+14155552671',
        company: 'Acme Corp',
        tags: ['VIP', 'Priority'],
        status: 'ACTIVE',
      },
    }),
    prisma.contact.upsert({
      where: { id: randomUUID() },
      update: {},
      create: {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.j@example.com',
        phone: '+14155552672',
        company: 'Tech Startup Inc',
        tags: ['Inbound Lead'],
        status: 'ACTIVE',
      },
    }),
    prisma.contact.upsert({
      where: { id: randomUUID() },
      update: {},
      create: {
        firstName: 'Mike',
        lastName: 'Chen',
        email: 'mchen@example.com',
        phone: '+14155552673',
        tags: ['Follow-up'],
        status: 'ACTIVE',
      },
    }),
  ]);

  console.log('✅ Created contacts:', contacts.length);

  // Create sample messages for first contact
  const messages = await Promise.all([
    prisma.message.create({
      data: {
        contactId: contacts[0].id,
        userId: user.id,
        channel: 'SMS',
        direction: 'OUTBOUND',
        status: 'DELIVERED',
        body: 'Hi John! Thanks for reaching out. How can I help you today?',
        sentAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
        delivered: true,
        deliveredAt: new Date(Date.now() - 86400000 * 2),
      },
    }),
    prisma.message.create({
      data: {
        contactId: contacts[0].id,
        channel: 'SMS',
        direction: 'INBOUND',
        status: 'READ',
        body: 'Hi! I\'m interested in your services. Can we schedule a call?',
        sentAt: new Date(Date.now() - 86400000), // 1 day ago
        delivered: true,
        deliveredAt: new Date(Date.now() - 86400000),
        read: true,
        readAt: new Date(Date.now() - 86350000),
      },
    }),
    prisma.message.create({
      data: {
        contactId: contacts[0].id,
        userId: user.id,
        channel: 'WHATSAPP',
        direction: 'OUTBOUND',
        status: 'SENT',
        body: 'Absolutely! I\'ll send over available times.',
        sentAt: new Date(Date.now() - 86340000),
        delivered: true,
        deliveredAt: new Date(Date.now() - 86330000),
      },
    }),
  ]);

  console.log('✅ Created messages:', messages.length);

  // Create test chat conversation between admin and editor users
  // Using a dummy contact as the conversation thread
  const testChatContact = contacts[1]; // Sarah Johnson as test chat
  
  const testChatMessages = await Promise.all([
    prisma.message.create({
      data: {
        contactId: testChatContact.id,
        userId: adminUser.id,
        channel: 'SMS',
        direction: 'OUTBOUND',
        status: 'DELIVERED',
        body: 'Hey editor! Testing real-time chat. Can you see this?',
        sentAt: new Date(Date.now() - 300000), // 5 mins ago
        delivered: true,
        deliveredAt: new Date(Date.now() - 300000),
      },
    }),
    prisma.message.create({
      data: {
        contactId: testChatContact.id,
        userId: editorUser.id,
        channel: 'SMS',
        direction: 'INBOUND',
        status: 'READ',
        body: 'Yes I can! Real-time collaboration working perfectly! 🎉',
        sentAt: new Date(Date.now() - 240000), // 4 mins ago
        delivered: true,
        deliveredAt: new Date(Date.now() - 240000),
        read: true,
        readAt: new Date(Date.now() - 239000),
      },
    }),
    prisma.message.create({
      data: {
        contactId: testChatContact.id,
        userId: adminUser.id,
        channel: 'WHATSAPP',
        direction: 'OUTBOUND',
        status: 'DELIVERED',
        body: 'Awesome! Try sending a new message and watch it appear in real-time!',
        sentAt: new Date(Date.now() - 180000), // 3 mins ago
        delivered: true,
        deliveredAt: new Date(Date.now() - 180000),
      },
    }),
    prisma.message.create({
      data: {
        contactId: testChatContact.id,
        userId: editorUser.id,
        channel: 'WHATSAPP',
        direction: 'INBOUND',
        status: 'SENT',
        body: 'Perfect! Voice calling, analytics, and all features ready to demo! 📱✨',
        sentAt: new Date(Date.now() - 60000), // 1 min ago
        delivered: true,
        deliveredAt: new Date(Date.now() - 60000),
      },
    }),
  ]);

  console.log('✅ Created test chat messages:', testChatMessages.length);

  // Create sample call records
  const callMessages = await Promise.all([
    prisma.message.create({
      data: {
        contactId: contacts[1].id, // Sarah Johnson
        userId: adminUser.id,
        channel: 'VOICE',
        direction: 'OUTBOUND',
        status: 'DELIVERED',
        body: 'Outbound call - 5 min duration',
        sentAt: new Date(Date.now() - 3600000), // 1 hour ago
        delivered: true,
        deliveredAt: new Date(Date.now() - 3600000),
      },
    }),
    prisma.message.create({
      data: {
        contactId: contacts[2].id, // Mike Chen
        channel: 'VOICE',
        direction: 'INBOUND',
        status: 'FAILED',
        body: 'Missed call',
        sentAt: new Date(Date.now() - 7200000), // 2 hours ago
        delivered: false,
        failed: true,
        failureReason: 'No answer',
      },
    }),
    prisma.message.create({
      data: {
        contactId: contacts[0].id, // John Smith
        userId: editorUser.id,
        channel: 'VOICE',
        direction: 'OUTBOUND',
        status: 'DELIVERED',
        body: 'Outbound call - 3 min duration',
        sentAt: new Date(Date.now() - 10800000), // 3 hours ago
        delivered: true,
        deliveredAt: new Date(Date.now() - 10800000),
      },
    }),
  ]);

  console.log('✅ Created call records:', callMessages.length);

  // Create sample notes
  const notes = await Promise.all([
    prisma.note.create({
      data: {
        contactId: contacts[0].id,
        userId: user.id,
        content: 'Customer expressed strong interest in our premium plan.',
        isPrivate: false,
        mentions: [],
      },
    }),
    prisma.note.create({
      data: {
        contactId: contacts[1].id,
        userId: user.id,
        content: 'Follow up on pricing discussion next week.',
        isPrivate: false,
        mentions: [],
      },
    }),
  ]);

  console.log('✅ Created notes:', notes.length);

  // Create message templates
  const templates = await Promise.all([
    prisma.messageTemplate.create({
      data: {
        name: 'Welcome Message',
        channel: 'SMS',
        body: 'Welcome! Thanks for choosing our service. We\'re here to help.',
        isGlobal: true,
      },
    }),
    prisma.messageTemplate.create({
      data: {
        name: 'Follow-up WhatsApp',
        channel: 'WHATSAPP',
        body: 'Hi! Just checking in. How is everything going?',
        isGlobal: true,
      },
    }),
  ]);

  console.log('✅ Created templates:', templates.length);

  // Update last contacted times
  await Promise.all(
    contacts.map((contact, index) =>
      prisma.contact.update({
        where: { id: contact.id },
        data: {
          lastContactedAt: new Date(Date.now() - 86400000 * (index + 1)),
        },
      })
    )
  );

  console.log('✅ Updated last contacted times');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

