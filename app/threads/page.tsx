/**
 * Threads Page
 * Kanban-style threads view
 */
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ThreadsView } from '@/components/inbox/ThreadsView';
import { MessageThread } from '@/components/inbox/MessageThread';
import { MessageComposer } from '@/components/inbox/MessageComposer';
import { ContactWithMessages } from '@/lib/types';
import { useQueryClient } from '@tanstack/react-query';

export default function ThreadsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedContact, setSelectedContact] = useState<ContactWithMessages | null>(null);

  const handleThreadSelect = (contact: ContactWithMessages) => {
    setSelectedContact(contact);
  };

  const handleSendMessage = async (contactId: string, body: string, channel: string, scheduledFor?: Date, subject?: string, mediaUrls?: string[]) => {
    try {
      if (scheduledFor) {
        // Create scheduled message
        const messageRes = await fetch('/api/scheduled-messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            contactId, 
            channel, 
            body, 
            scheduledFor: scheduledFor.toISOString(),
            subject,
            mediaUrls 
          }),
        });
        
        if (messageRes.ok) {
          queryClient.invalidateQueries({ queryKey: ['scheduled-messages'] });
          return;
        } else {
          const errorData = await messageRes.json();
          console.error('Failed to schedule message:', errorData);
          alert(`Failed to schedule message: ${errorData.error || 'Unknown error'}`);
          return;
        }
      } else {
        // Send immediately
        const messageRes = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contactId, channel, body, mediaUrls }),
        });
        const message = await messageRes.json();

        await fetch('/api/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId: message.id, channel, contactId }),
        });
      }

      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // If thread is selected, show detail view
  if (selectedContact) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex flex-col">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <button
              onClick={() => setSelectedContact(null)}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
            >
              ← Back to Threads
            </button>
          </div>
          <MessageThread contact={selectedContact} onSendMessage={handleSendMessage} />
          <MessageComposer contact={selectedContact} onSendMessage={handleSendMessage} />
        </div>
      </div>
    );
  }

  // Show threads grid
  return <ThreadsView onThreadSelect={handleThreadSelect} />;
}

