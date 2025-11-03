/**
 * Scheduled Messages Page
 * View and manage all scheduled messages with calendar-style UI
 */
'use client';

import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Trash2, Pause, Play, MessageSquare, CheckCircle2, Loader2 } from 'lucide-react';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';

export default function ScheduledMessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch scheduled messages
  const { data: scheduledData, isLoading } = useQuery({
    queryKey: ['scheduled-messages'],
    queryFn: async () => {
      const res = await fetch('/api/scheduled-messages');
      if (!res.ok) return { scheduledMessages: [] };
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Update status mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/scheduled-messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-messages'] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/scheduled-messages/${id}`, {
        method: 'DELETE',
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-messages'] });
    },
  });

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  const scheduledMessages = scheduledData?.scheduledMessages || [];

  // Group messages by date
  const groupedMessages = scheduledMessages.reduce((acc: any, msg: any) => {
    const date = format(parseISO(msg.scheduledFor), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Scheduled Messages</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your scheduled messages</p>
            </div>
            <button
              onClick={() => router.push('/inbox')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Back to Inbox
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : scheduledMessages.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Scheduled Messages</h3>
            <p className="text-gray-600 mb-6">Schedule messages from the inbox composer</p>
            <button
              onClick={() => router.push('/inbox')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Go to Inbox
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedMessages).map(([date, messages]: [string, any[]]) => (
              <div key={date} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Date Header */}
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <span className="font-semibold text-gray-900">
                      {isToday(parseISO(date)) && 'Today'}
                      {isTomorrow(parseISO(date)) && 'Tomorrow'}
                      {!isToday(parseISO(date)) && !isTomorrow(parseISO(date)) && format(parseISO(date), 'MMMM d, yyyy')}
                    </span>
                    <span className="text-sm text-gray-500">({messages.length})</span>
                  </div>
                </div>

                {/* Messages */}
                <div className="divide-y divide-gray-200">
                  {messages.map((msg: any) => (
                    <div key={msg.id} className="p-6 hover:bg-gray-50 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Status Badge */}
                          <div className="flex items-center gap-2 mb-2">
                            {msg.status === 'SENT' && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                                <CheckCircle2 className="w-3 h-3 inline mr-1" />
                                Sent
                              </span>
                            )}
                            {msg.status === 'SCHEDULED' && isPast(parseISO(msg.scheduledFor)) && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                                <Loader2 className="w-3 h-3 inline mr-1 animate-spin" />
                                Processing
                              </span>
                            )}
                            {msg.status === 'SCHEDULED' && !isPast(parseISO(msg.scheduledFor)) && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                                <Clock className="w-3 h-3 inline mr-1" />
                                Scheduled
                              </span>
                            )}
                            {msg.status === 'CANCELLED' && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                                Cancelled
                              </span>
                            )}
                            {msg.status === 'FAILED' && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                                Failed
                              </span>
                            )}
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded uppercase">
                              {msg.channel}
                            </span>
                          </div>

                          {/* Content */}
                          <p className="text-gray-900 mb-2">{msg.body}</p>

                          {/* Contact Info */}
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" />
                              {msg.contact.firstName} {msg.contact.lastName}
                            </span>
                            <span>to {msg.contact.phone || msg.contact.email}</span>
                          </div>

                          {/* Schedule Time */}
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span>{format(parseISO(msg.scheduledFor), 'h:mm a')}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        {msg.status === 'SCHEDULED' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => deleteMutation.mutate(msg.id)}
                              disabled={deleteMutation.isPending}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

