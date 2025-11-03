/**
 * Message Thread Component
 * Displays conversation history for a contact
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { ContactWithMessages, MessageWithContact } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, CheckCircle2, XCircle, Phone, File, Eye, Download, X } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';

interface MessageThreadProps {
  contact: ContactWithMessages;
  onSendMessage: (contactId: string, body: string, channel: string) => void;
}

export function MessageThread({ contact, onSendMessage }: MessageThreadProps) {
  const { data: session } = useSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isConnected, typingUsers } = useSocket(contact.id);
  const [viewingPDF, setViewingPDF] = useState<string | null>(null);
  
  // Filter out current user from typing indicators
  const otherUsersTyping = Array.from(typingUsers).filter(
    userName => userName !== session?.user?.name && userName !== session?.user?.email
  );

  const { data: messagesData } = useQuery({
    queryKey: ['messages', contact.id],
    queryFn: async () => {
      const res = await fetch(`/api/messages?contactId=${contact.id}`);
      const data = await res.json();
      return data;
    },
    refetchInterval: 2000, // Poll every 2 seconds for real-time updates
  });

  const messages: MessageWithContact[] = messagesData?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'SMS':
        return <MessageSquare className="w-4 h-4" />;
      case 'WHATSAPP':
        return <MessageSquare className="w-4 h-4" />;
      case 'VOICE':
        return <Phone className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string, failed: boolean) => {
    if (failed) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    if (status === 'DELIVERED' || status === 'READ') {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }
    return null;
  };

  const getMessageColors = (channel: string, direction: string) => {
    if (direction === 'INBOUND') {
      // Received messages - different colors per channel
      switch (channel) {
        case 'WHATSAPP':
          return 'bg-green-50 border border-green-200 text-gray-900';
        case 'SMS':
          return 'bg-blue-50 border border-blue-200 text-gray-900';
        case 'VOICE':
          return 'bg-purple-50 border border-purple-200 text-gray-900';
        case 'EMAIL':
          return 'bg-yellow-50 border border-yellow-200 text-gray-900';
        default:
          return 'bg-gray-100 text-gray-900';
      }
    } else {
      // Outbound (sent) messages - different colors per channel
      switch (channel) {
        case 'WHATSAPP':
          return 'bg-green-600 text-white';
        case 'SMS':
          return 'bg-blue-600 text-white';
        case 'VOICE':
          return 'bg-purple-600 text-white';
        case 'EMAIL':
          return 'bg-yellow-600 text-white';
        default:
          return 'bg-blue-600 text-white';
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      {/* Contact Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {contact.avatar ? (
              <img
                src={contact.avatar}
                alt={`${contact.firstName} ${contact.lastName}`}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                {contact.firstName?.[0] || contact.email?.[0] || '?'}
              </div>
            )}
            <div>
              <h2 className="font-semibold text-gray-900">
                {contact.firstName} {contact.lastName}
              </h2>
              <p className="text-sm text-gray-500">{contact.email || contact.phone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
            <MessageSquare className="w-16 h-16 mb-4" />
            <p>No messages yet</p>
            <p className="text-sm mt-2">Start the conversation</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-md px-4 py-2 rounded-lg ${getMessageColors(message.channel, message.direction)}`}
              >
                {/* Show sender name for outbound messages */}
                {message.direction === 'OUTBOUND' && message.user && (
                  <p className="text-xs font-medium mb-1 text-blue-100">
                    {message.user.name || message.user.email}
                  </p>
                )}
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                    {/* Attachments */}
                    {message.mediaUrls && message.mediaUrls.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.mediaUrls.map((url: string, index: number) => {
                          const isImage = url.startsWith('data:image/') || url.match(/\.(jpg|jpeg|png|gif)$/i);
                          const isVideo = url.startsWith('data:video/') || url.match(/\.(mp4|mov)$/i);
                          const isPDF = url.startsWith('data:application/pdf') || url.match(/\.pdf$/i);
                          
                          return (
                            <div key={index} className="border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                              {isImage && (
                                <div className="relative">
                                  <img src={url} alt={`Attachment ${index + 1}`} className="w-full max-h-48 object-contain" />
                                  <a href={url} download className="absolute bottom-2 right-2 p-1 bg-white rounded-lg shadow-md hover:bg-gray-100">
                                    <Download className="w-4 h-4 text-gray-700" />
                                  </a>
                                </div>
                              )}
                              {isVideo && (
                                <div className="relative">
                                  <video src={url} controls className="w-full max-h-48">
                                    Your browser does not support video playback.
                                  </video>
                                  <a href={url} download className="absolute bottom-2 right-2 p-1 bg-white rounded-lg shadow-md hover:bg-gray-100">
                                    <Download className="w-4 h-4 text-gray-700" />
                                  </a>
                                </div>
                              )}
                              {isPDF && (
                                <div className="p-3 flex items-center gap-3">
                                  <File className="w-8 h-8 text-red-600" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">PDF Attachment</p>
                                    <p className="text-xs text-gray-500">Click to view</p>
                                  </div>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => setViewingPDF(url)}
                                      className="p-1 hover:bg-gray-200 rounded"
                                    >
                                      <Eye className="w-4 h-4 text-gray-700" />
                                    </button>
                                    <a href={url} download className="p-1 hover:bg-gray-200 rounded">
                                      <Download className="w-4 h-4 text-gray-700" />
                                    </a>
                                  </div>
                                </div>
                              )}
                              {!isImage && !isVideo && !isPDF && (
                                <div className="p-3 flex items-center gap-3">
                                  <File className="w-8 h-8 text-gray-600" />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">File Attachment</p>
                                    <p className="text-xs text-gray-500">Click to download</p>
                                  </div>
                                  <a href={url} download className="p-1 hover:bg-gray-200 rounded">
                                    <Download className="w-4 h-4 text-gray-700" />
                                  </a>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {message.direction === 'OUTBOUND' && (
                    <div className="flex items-center gap-1">
                      {getStatusIcon(message.status, message.failed)}
                    </div>
                  )}
                </div>
                <div
                  className={`flex items-center gap-2 mt-2 text-xs ${
                    message.direction === 'OUTBOUND' ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {getChannelIcon(message.channel)}
                  <span>
                    {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
        {/* Typing Indicator - only show other users */}
        {otherUsersTyping.length > 0 && isConnected && (
          <div className="flex justify-start">
            <div className="px-4 py-2 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-500 italic">
                {otherUsersTyping.join(', ')} {otherUsersTyping.length === 1 ? 'is' : 'are'} typing...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* PDF Viewer Modal */}
      {viewingPDF && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={() => setViewingPDF(null)}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">PDF Viewer</h3>
              <button
                onClick={() => setViewingPDF(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            {/* PDF Content */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src={viewingPDF}
                className="w-full h-full border-0"
                title="PDF Viewer"
              />
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <a
                href={viewingPDF}
                download
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </a>
              <button
                onClick={() => setViewingPDF(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

