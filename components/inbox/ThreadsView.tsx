/**
 * Threads View Component
 * Kanban-style view with threads grouped by contact
 */
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Search, Filter, Phone, Mail, Send, CheckCircle2, Clock, AlertCircle, Eye } from 'lucide-react';
import { ContactWithMessages } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

const channelColors: Record<string, { bg: string; border: string; text: string; icon: any }> = {
  SMS: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: MessageSquare },
  WHATSAPP: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: MessageSquare },
  EMAIL: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', icon: Mail },
  VOICE: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800', icon: Phone },
  TWITTER: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-800', icon: MessageSquare },
  FACEBOOK: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800', icon: MessageSquare },
};

interface ThreadsViewProps {
  onThreadSelect: (contact: ContactWithMessages) => void;
}

export function ThreadsView({ onThreadSelect }: ThreadsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'scheduled' | 'recent'>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');

  // Fetch contacts
  const { data: contactsData, isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await fetch('/api/contacts');
      const data = await res.json();
      return data;
    },
  });

  const allContacts: ContactWithMessages[] = contactsData?.contacts || [];
  
  // Filter contacts
  let filteredContacts = allContacts.filter((contact) => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        contact.firstName?.toLowerCase().includes(searchLower) ||
        contact.lastName?.toLowerCase().includes(searchLower) ||
        contact.email?.toLowerCase().includes(searchLower) ||
        contact.phone?.toLowerCase().includes(searchLower) ||
        contact.messages?.[0]?.body?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Channel filter
    if (channelFilter !== 'all') {
      const hasMessageInChannel = contact.messages?.some(msg => msg.channel === channelFilter);
      if (!hasMessageInChannel) return false;
    }

    // Status filters
    if (statusFilter === 'unread') {
      const hasUnread = contact.messages?.some(msg => !msg.read);
      if (!hasUnread) return false;
    }
    
    if (statusFilter === 'scheduled') {
      const hasScheduled = contact.scheduledMessages && contact.scheduledMessages.length > 0;
      if (!hasScheduled) return false;
    }
    
    if (statusFilter === 'recent') {
      const hasRecentMessage = contact.messages?.[0] && 
        new Date(contact.messages[0].createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (!hasRecentMessage) return false;
    }

    return true;
  });

  // Sort by last message time
  filteredContacts = filteredContacts.sort((a, b) => {
    const timeA = a.messages?.[0]?.createdAt ? new Date(a.messages[0].createdAt).getTime() : 0;
    const timeB = b.messages?.[0]?.createdAt ? new Date(b.messages[0].createdAt).getTime() : 0;
    return timeB - timeA;
  });

  const getStatusBadge = (contact: ContactWithMessages) => {
    const unreadCount = contact.messages?.filter(msg => !msg.read).length || 0;
    if (unreadCount > 0) {
      return (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs font-semibold">
          <Eye className="w-3 h-3" />
          {unreadCount}
        </div>
      );
    }
    
    const scheduledCount = contact.scheduledMessages?.length || 0;
    if (scheduledCount > 0) {
      return (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
          <Clock className="w-3 h-3" />
          {scheduledCount}
        </div>
      );
    }
    
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading threads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Threads</h1>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search threads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Threads</option>
            <option value="unread">Unread</option>
            <option value="scheduled">Scheduled</option>
            <option value="recent">Recent (24h)</option>
          </select>

          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Channels</option>
            <option value="SMS">SMS</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="EMAIL">Email</option>
            <option value="VOICE">Voice</option>
          </select>
        </div>
      </div>

      {/* Threads Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
            <MessageSquare className="w-16 h-16 mb-4 text-gray-300" />
            <p className="text-lg font-medium">No threads found</p>
            <p className="text-sm mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContacts.map((contact) => {
              const lastMessage = contact.messages?.[0];
              const channelColor = lastMessage?.channel ? channelColors[lastMessage.channel] : channelColors.SMS;
              const ChannelIcon = channelColor.icon;

              return (
                <button
                  key={contact.id}
                  onClick={() => onThreadSelect(contact)}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all text-left group"
                >
                  {/* Contact Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {contact.avatar ? (
                        <img
                          src={contact.avatar}
                          alt={`${contact.firstName} ${contact.lastName}`}
                          className="w-12 h-12 rounded-full flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {contact.firstName?.[0] || contact.email?.[0] || '?'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {contact.firstName} {contact.lastName}
                        </h3>
                        {contact.email && (
                          <p className="text-xs text-gray-500 truncate">{contact.email}</p>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(contact)}
                  </div>

                  {/* Last Message Preview */}
                  {lastMessage && (
                    <div className={`mt-3 p-3 ${channelColor.bg} ${channelColor.border} border rounded-lg`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <ChannelIcon className={`w-4 h-4 ${channelColor.text}`} />
                          <span className={`text-xs font-medium ${channelColor.text}`}>
                            {lastMessage.channel}
                          </span>
                        </div>
                        {lastMessage.status === 'SENT' && !lastMessage.read && (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-900 line-clamp-2">
                        {lastMessage.body}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  )}

                  {/* No Messages State */}
                  {!lastMessage && (
                    <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-500 text-center">No messages yet</p>
                    </div>
                  )}

                  {/* Contact Info Footer */}
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>{contact.phone || 'No phone'}</span>
                    {contact._count?.messages && contact._count.messages > 0 && (
                      <span>{contact._count.messages} messages</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

