/**
 * Contact Profile Component
 * Shows contact details, notes, and history
 */
'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { ContactWithMessages } from '@/lib/types';
import {
  User,
  Mail,
  Phone,
  Building,
  Tag,
  Plus,
  Edit,
  MessageSquare,
  Calendar,
  AtSign,
  PhoneCall,
} from 'lucide-react';

interface ContactProfileProps {
  contact: ContactWithMessages;
}

export function ContactProfile({ contact }: ContactProfileProps) {
  const { data: session } = useSession();
  const [showNotes, setShowNotes] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState<{ start: number; end: number } | null>(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const queryClient = useQueryClient();

  // Fetch contact details with notes
  const { data: contactData } = useQuery({
    queryKey: ['contact', contact.id],
    queryFn: async () => {
      const res = await fetch(`/api/contacts/${contact.id}`);
      const data = await res.json();
      return data;
    },
  });

  // Fetch users for @mentions
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      if (!res.ok) return [];
      const data = await res.json();
      return data.users || [];
    },
  });

  const fullContact = contactData || contact;
  const users = usersData || [];

  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: contact.id, content }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact', contact.id] });
      setNoteText('');
      setShowNotes(false);
    },
  });

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    addNoteMutation.mutate(noteText);
  };

  const handleTextChange = (value: string) => {
    setNoteText(value);
    
    // Check for @ symbol to show mention menu
    const cursorPosition = value.length;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // If there's a space after @, the mention is complete
      if (textAfterAt.includes(' ') || textAfterAt.includes('\n')) {
        setShowMentionMenu(false);
        setMentionQuery('');
      } else {
        setShowMentionMenu(true);
        setMentionQuery(textAfterAt.toLowerCase());
        setMentionPosition({ start: lastAtIndex, end: cursorPosition });
      }
    } else {
      setShowMentionMenu(false);
      setMentionQuery('');
      setMentionPosition(null);
    }
  };

  const handleMentionSelect = (user: any) => {
    if (!mentionPosition) return;
    
    const textBefore = noteText.substring(0, mentionPosition.start);
    const textAfter = noteText.substring(mentionPosition.end);
    const newText = `${textBefore}@${user.name || user.email} ${textAfter}`;
    setNoteText(newText);
    setShowMentionMenu(false);
    setMentionQuery('');
    setMentionPosition(null);
  };

  const filteredUsers = users.filter((user: any) => {
    if (!mentionQuery) return true;
    const nameMatch = user.name?.toLowerCase().includes(mentionQuery);
    const emailMatch = user.email?.toLowerCase().includes(mentionQuery);
    return nameMatch || emailMatch;
  });

  const renderNoteWithMentions = (content: string) => {
    // Parse @mentions and highlight them
    const parts = content.split(/(@[\w@.]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-sm font-medium">
            <AtSign className="w-3 h-3" />
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto">
      <div className="p-6">
        {/* Contact Info */}
        <div className="flex flex-col items-center mb-6">
          {contact.avatar ? (
            <img
              src={contact.avatar}
              alt={`${contact.firstName} ${contact.lastName}`}
              className="w-24 h-24 rounded-full mb-4"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-3xl mb-4">
              {contact.firstName?.[0] || contact.email?.[0] || '?'}
            </div>
          )}
          <h3 className="text-lg font-semibold text-gray-900">
            {contact.firstName} {contact.lastName}
          </h3>
          <span className="text-sm text-gray-500">
            {contact.messages?.length || 0} messages
          </span>
        </div>

        {/* Quick Actions */}
        {contact.phone && (
          <div className="mb-6 flex gap-2">
            <button
              onClick={async () => {
                setShowCallModal(true);
                setIsCalling(true);
                
                // Initiate Twilio voice call
                try {
                  const res = await fetch('/api/calls/initiate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      contactId: contact.id,
                      to: contact.phone 
                    }),
                  });
                  
                  if (!res.ok) {
                    alert('Failed to initiate call');
                    setIsCalling(false);
                    setShowCallModal(false);
                  }
                } catch (error) {
                  console.error('Call error:', error);
                  setIsCalling(false);
                  setShowCallModal(false);
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <PhoneCall className="w-4 h-4" />
              Call
            </button>
            <button
              onClick={() => {
                window.open(`sms:${contact.phone}`, '_self');
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <MessageSquare className="w-4 h-4" />
              Text
            </button>
          </div>
        )}
        
        {/* Call Modal */}
        {showCallModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Calling {contact.firstName} {contact.lastName}</h3>
              <p className="text-gray-600 mb-6">{contact.phone}</p>
              
              <div className="flex items-center justify-center mb-6">
                {isCalling ? (
                  <div className="animate-pulse text-green-600 text-center">
                    <PhoneCall className="w-16 h-16 mx-auto mb-2" />
                    <p className="text-sm">Connecting...</p>
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <PhoneCall className="w-16 h-16 mx-auto" />
                  </div>
                )}
              </div>
              
              <button
                onClick={() => {
                  setIsCalling(false);
                  setShowCallModal(false);
                  // Hang up the call
                }}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Hang Up
              </button>
            </div>
          </div>
        )}

        {/* Contact Details */}
        <div className="space-y-4 mb-6">
          {contact.email && (
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-900">{contact.email}</p>
              </div>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="text-sm font-medium text-gray-900">{contact.phone}</p>
              </div>
            </div>
          )}
          {contact.company && (
            <div className="flex items-start gap-3">
              <Building className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Company</p>
                <p className="text-sm font-medium text-gray-900">{contact.company}</p>
              </div>
            </div>
          )}
        </div>

        {/* Tags */}
        {contact.tags && contact.tags.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-gray-400" />
              <p className="text-sm font-medium text-gray-700">Tags</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {contact.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Notes Section */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Notes
            </h4>
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {showNotes && (
            <div className="mb-4">
              <div className="relative">
                <textarea
                  value={noteText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="Add a note about this contact... (type @ to mention users)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
                {/* Mention Menu */}
                {showMentionMenu && filteredUsers.length > 0 && (
                  <div className="absolute bottom-full left-0 mb-2 w-full max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    {filteredUsers.map((user: any) => (
                      <button
                        key={user.id}
                        onClick={() => handleMentionSelect(user)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 transition"
                      >
                        {user.image ? (
                          <img src={user.image} alt={user.name} className="w-6 h-6 rounded-full" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                            {user.name?.[0] || user.email[0]}
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{user.name || user.email}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <span className="text-xs text-gray-500 capitalize">{user.role}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleAddNote}
                  disabled={!noteText.trim() || addNoteMutation.isPending}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowNotes(false);
                    setNoteText('');
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Notes List */}
          <div className="space-y-3">
            {fullContact.notes?.length > 0 ? (
              fullContact.notes.map((note: any) => (
                <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm text-gray-700">
                      {renderNoteWithMentions(note.content)}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No notes yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

