/**
 * Inbox Page
 * Unified inbox with contacts and messages
 */
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Phone, Mail, Settings, LogOut, BarChart3, Clock, LayoutGrid } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { ContactList } from './ContactList';
import { MessageThread } from './MessageThread';
import { ContactProfile } from './ContactProfile';
import { MessageComposer } from './MessageComposer';
import { ContactWithMessages } from '@/lib/types';

export function InboxPage() {
  const { data: session } = useSession();
  const [selectedContact, setSelectedContact] = useState<ContactWithMessages | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [navFilter, setNavFilter] = useState<string>('all');
  const queryClient = useQueryClient();

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
  const contacts = allContacts.filter(contact => {
    const matchesSearch = !searchTerm || 
      contact.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone?.includes(searchTerm);
    
    // Apply channel filter from dropdown
    const matchesChannel = channelFilter === 'all' || 
      contact.messages?.[0]?.channel === channelFilter;
    
    // Apply navigation filter (navFilter takes precedence for SMS/Calls view)
    let matchesNavFilter = true;
    if (navFilter === 'sms') {
      // Show only contacts with SMS or WhatsApp messages
      matchesNavFilter = contact.messages?.some(m => m.channel === 'SMS' || m.channel === 'WHATSAPP') || false;
    } else if (navFilter === 'calls') {
      // Show only contacts with VOICE messages
      matchesNavFilter = contact.messages?.some(m => m.channel === 'VOICE') || false;
    }
    
    return matchesSearch && matchesChannel && matchesNavFilter;
  });

  const handleContactSelect = (contact: ContactWithMessages) => {
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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            Unified Inbox
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {session?.user?.email}
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <button 
            onClick={() => setShowNewMessageModal(true)}
            className="w-full mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            New Message
          </button>
          <div className="space-y-1">
            <NavLink 
              icon={<Mail className="w-4 h-4" />} 
              label="All Conversations" 
              active={navFilter === 'all'}
              onClick={() => setNavFilter('all')}
            />
            <NavLink 
              icon={<MessageSquare className="w-4 h-4" />} 
              label="SMS/WhatsApp" 
              active={navFilter === 'sms'}
              onClick={() => setNavFilter('sms')}
            />
            <NavLink 
              icon={<Phone className="w-4 h-4" />} 
              label="Calls" 
              active={navFilter === 'calls'}
              onClick={() => setNavFilter('calls')}
            />
            <a href="/threads">
              <NavLink icon={<LayoutGrid className="w-4 h-4" />} label="Threads" />
            </a>
            <a href="/scheduled">
              <NavLink icon={<Clock className="w-4 h-4" />} label="Scheduled" />
            </a>
            {session?.user?.role === 'ADMIN' && (
              <a href="/analytics">
                <NavLink icon={<BarChart3 className="w-4 h-4" />} label="Analytics" />
              </a>
            )}
            {session?.user?.role === 'ADMIN' && (
              <a href="/settings">
                <NavLink icon={<Settings className="w-4 h-4" />} label="Settings" />
              </a>
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Contact List */}
        <div className="w-80 border-r border-gray-200 bg-white overflow-y-auto">
          <div className="p-4 border-b border-gray-200 space-y-3">
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Channels</option>
              <option value="SMS">SMS</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="EMAIL">Email</option>
              <option value="TWITTER">Twitter</option>
              <option value="FACEBOOK">Facebook</option>
            </select>
          </div>
          <ContactList
            contacts={contacts}
            selectedContact={selectedContact}
            onContactSelect={handleContactSelect}
            isLoading={isLoading}
          />
        </div>

        {/* Message Thread */}
        <div className="flex-1 flex flex-col">
          {selectedContact ? (
            <>
              <MessageThread contact={selectedContact} onSendMessage={handleSendMessage} />
              <MessageComposer
                contact={selectedContact}
                onSendMessage={handleSendMessage}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a contact to view messages
            </div>
          )}
        </div>

        {/* Contact Profile Sidebar */}
        {selectedContact && (
          <ContactProfile contact={selectedContact} />
        )}
      </div>

      {/* New Message Modal */}
      {showNewMessageModal && (
        <NewMessageModal
          contacts={allContacts}
          onClose={() => setShowNewMessageModal(false)}
          onSelectContact={(contact) => {
            setSelectedContact(contact);
            setShowNewMessageModal(false);
          }}
        />
      )}
    </div>
  );
}

function NewMessageModal({ contacts, onClose, onSelectContact }: { contacts: ContactWithMessages[]; onClose: () => void; onSelectContact: (contact: ContactWithMessages) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [isGroupMode, setIsGroupMode] = useState(false);

  const filteredContacts = contacts.filter(contact => {
    const query = searchQuery.toLowerCase();
    return (
      contact.firstName?.toLowerCase().includes(query) ||
      contact.lastName?.toLowerCase().includes(query) ||
      contact.email?.toLowerCase().includes(query) ||
      contact.phone?.includes(query)
    );
  });

  const toggleContact = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const handleStartChat = () => {
    if (isGroupMode && selectedContacts.size > 1) {
      // Group chat - select first contact and trigger group mode
      const firstContact = contacts.find(c => selectedContacts.has(c.id));
      if (firstContact) {
        onSelectContact(firstContact);
      }
    } else if (!isGroupMode && selectedContacts.size === 1) {
      // Single contact
      const contact = contacts.find(c => selectedContacts.has(c.id));
      if (contact) {
        onSelectContact(contact);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">New Message</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Group Mode Toggle */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isGroupMode}
                onChange={(e) => {
                  setIsGroupMode(e.target.checked);
                  if (!e.target.checked) setSelectedContacts(new Set());
                }}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Group Message</span>
            </label>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No contacts found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredContacts.map((contact) => {
                const isSelected = selectedContacts.has(contact.id);
                return (
                  <button
                    key={contact.id}
                    onClick={() => toggleContact(contact.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
                      isSelected
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    {contact.avatar ? (
                      <img src={contact.avatar} alt={`${contact.firstName} ${contact.lastName}`} className="w-12 h-12 rounded-full" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {contact.firstName?.[0] || contact.email?.[0] || '?'}
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-900">
                        {contact.firstName} {contact.lastName}
                      </p>
                      {contact.email && (
                        <p className="text-sm text-gray-600">{contact.email}</p>
                      )}
                      {contact.phone && (
                        <p className="text-sm text-gray-600">{contact.phone}</p>
                      )}
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <div>
            {selectedContacts.size > 0 && (
              <p className="text-sm text-gray-600">
                {selectedContacts.size} {selectedContacts.size === 1 ? 'contact' : 'contacts'} selected
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleStartChat}
              disabled={selectedContacts.size === 0 || (!isGroupMode && selectedContacts.size > 1)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              Start Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavLink({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
        active ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

