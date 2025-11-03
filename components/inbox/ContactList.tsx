/**
 * Contact List Component
 * Displays list of contacts with last message preview
 */
'use client';

import { MessageSquare, User, Phone, CheckCircle2 } from 'lucide-react';
import { ContactWithMessages } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

const channelColors: Record<string, string> = {
  SMS: 'bg-blue-100 text-blue-800',
  WHATSAPP: 'bg-green-100 text-green-800',
  EMAIL: 'bg-purple-100 text-purple-800',
  TWITTER: 'bg-sky-100 text-sky-800',
  FACEBOOK: 'bg-indigo-100 text-indigo-800',
};

interface ContactListProps {
  contacts: ContactWithMessages[];
  selectedContact: ContactWithMessages | null;
  onContactSelect: (contact: ContactWithMessages) => void;
  isLoading: boolean;
}

export function ContactList({
  contacts,
  selectedContact,
  onContactSelect,
  isLoading,
}: ContactListProps) {
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <MessageSquare className="w-12 h-12 mb-4" />
        <p>No contacts yet</p>
        <p className="text-sm mt-2">Start a conversation</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {contacts.map((contact) => (
        <button
          key={contact.id}
          onClick={() => onContactSelect(contact)}
          className={`w-full text-left p-4 hover:bg-gray-50 transition ${
            selectedContact?.id === contact.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
          }`}
        >
          <div className="flex items-start gap-3">
            {contact.avatar ? (
              <img
                src={contact.avatar}
                alt={`${contact.firstName} ${contact.lastName}`}
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                {contact.firstName?.[0] || contact.email?.[0] || '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 truncate">
                  {contact.firstName} {contact.lastName}
                </h3>
                {contact.messages?.[0] && (
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(contact.messages[0].createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {contact.messages?.[0]?.channel && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    channelColors[contact.messages[0].channel] || 'bg-gray-100 text-gray-800'
                  }`}>
                    {contact.messages[0].channel}
                  </span>
                )}
                <p className="text-sm text-gray-600 truncate flex-1">
                  {contact.messages?.[0]?.body || 'No messages yet'}
                </p>
              </div>
              {contact._count?.messages && contact._count.messages > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <MessageSquare className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {contact._count.messages} {contact._count.messages === 1 ? 'message' : 'messages'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

