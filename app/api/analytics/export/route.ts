/**
 * Analytics Export API
 * Export analytics data as CSV
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
    const format = searchParams.get('format') || 'csv';

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
        startDate = new Date(0);
        break;
    }

    // Fetch messages for export
    const messages = await prisma.message.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      include: {
        contact: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (format === 'csv') {
      // Generate CSV
      const csvHeader = 'Date,Channel,Direction,Status,From,To,Body\n';
      const csvRows = messages.map(msg => {
        const date = new Date(msg.createdAt).toISOString();
        const from = msg.direction === 'OUTBOUND' 
          ? (msg.user?.email || msg.contact.email || '') 
          : (msg.contact.email || msg.contact.phone || '');
        const to = msg.direction === 'OUTBOUND'
          ? (msg.contact.email || msg.contact.phone || '')
          : (msg.user?.email || '');
        const body = (msg.body || '').replace(/"/g, '""'); // Escape quotes
        return `"${date}","${msg.channel}","${msg.direction}","${msg.status}","${from}","${to}","${body}"`;
      });

      const csv = csvHeader + csvRows.join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="messages-export-${range}-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Default: return JSON
    return NextResponse.json({
      messages,
      total: messages.length,
      range,
    });
  } catch (error: any) {
    console.error('Error exporting analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}









