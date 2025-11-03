/**
 * Analytics API
 * Returns metrics and engagement statistics
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const range = searchParams.get('range') || '7d';

    // Calculate date range
    const now = new Date();
    let startDate = new Date(now);
    
    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
    }

    // Get total messages
    const totalMessages = await prisma.message.count({
      where: {
        createdAt: { gte: startDate },
      },
    });

    // Get messages by channel
    const channelBreakdown = await prisma.message.groupBy({
      by: ['channel'],
      where: {
        createdAt: { gte: startDate },
      },
      _count: {
        id: true,
      },
    });

    // Get messages by direction
    const directionBreakdown = await prisma.message.groupBy({
      by: ['direction'],
      where: {
        createdAt: { gte: startDate },
      },
      _count: {
        id: true,
      },
    });

    // Messages over time (daily for 7d/30d, weekly for all)
    const messagesOverTime = await prisma.message.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Count messages by status
    const statusCounts = await prisma.message.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: startDate },
      },
      _count: {
        id: true,
      },
    });

    // Get top contacts
    const topContacts = await prisma.message.groupBy({
      by: ['contactId'],
      where: {
        createdAt: { gte: startDate },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    // Enrich top contacts with contact details
    const enrichedTopContacts = await Promise.all(
      topContacts.map(async (contact) => {
        const contactData = await prisma.contact.findUnique({
          where: { id: contact.contactId },
          select: { firstName: true, lastName: true, email: true },
        });
        const lastMessage = await prisma.message.findFirst({
          where: { contactId: contact.contactId, createdAt: { gte: startDate } },
          select: { channel: true },
          orderBy: { createdAt: 'desc' },
        });
        return {
          id: contact.contactId,
          name: `${contactData?.firstName || ''} ${contactData?.lastName || ''}`.trim() || contactData?.email || 'Unknown',
          messageCount: contact._count.id,
          channel: lastMessage?.channel || 'UNKNOWN',
        };
      })
    );

    // Process channel breakdown
    const processedChannelBreakdown = channelBreakdown.map(ch => {
      const sentCount = directionBreakdown.find(d => d.direction === 'OUTBOUND')?._count.id || 0;
      const receivedCount = directionBreakdown.find(d => d.direction === 'INBOUND')?._count.id || 0;
      return {
        channel: ch.channel,
        sent: sentCount,
        received: receivedCount,
      };
    });

    // Process messages over time
    const groupedMessages = messagesOverTime.reduce((acc, msg) => {
      const date = msg.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const processedMessagesOverTime = Object.entries(groupedMessages).map(([date, messages]) => ({
      date,
      messages,
    }));

    // Channel distribution for pie chart
    const channelDistribution = channelBreakdown.map(ch => ({
      channel: ch.channel,
      value: ch._count.id,
    }));

    // Calculate metrics
    const deliveredCount = statusCounts.find(s => s.status === 'DELIVERED')?._count.id || 0;
    const sentCount = directionBreakdown.find(d => d.direction === 'OUTBOUND')?._count.id || 0;
    const receivedCount = directionBreakdown.find(d => d.direction === 'INBOUND')?._count.id || 0;
    
    const deliveryRate = sentCount > 0 ? Math.round((deliveredCount / sentCount) * 100) : 0;
    const responseRate = receivedCount > 0 ? Math.round((receivedCount / totalMessages) * 100) : 0;
    
    // Calculate average response time (placeholder - would need more sophisticated logic)
    const avgResponseTime = '24m';

    return NextResponse.json({
      totalMessages,
      channelBreakdown: processedChannelBreakdown,
      messagesOverTime: processedMessagesOverTime,
      channelDistribution,
      topContacts: enrichedTopContacts,
      responseRate,
      deliveryRate,
      avgResponseTime,
    });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}









