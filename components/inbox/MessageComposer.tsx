/**
 * Message Composer Component
 * Input for sending new messages
 */
'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Send, Paperclip, Calendar, X, Clock, File } from 'lucide-react';
import { ContactWithMessages } from '@/lib/types';
import { format } from 'date-fns';
import { useSocket } from '@/hooks/useSocket';

interface MessageComposerProps {
  contact: ContactWithMessages;
  onSendMessage: (contactId: string, body: string, channel: string, scheduledFor?: Date, subject?: string, mediaUrls?: string[]) => void;
}

export function MessageComposer({ contact, onSendMessage }: MessageComposerProps) {
  const { data: session } = useSession();
  
  // Hide composer for VIEWER role
  if (session?.user?.role === 'VIEWER') {
    return null;
  }
  const [message, setMessage] = useState('');
  const [channel, setChannel] = useState<'SMS' | 'WHATSAPP' | 'EMAIL'>('SMS');
  const [subject, setSubject] = useState('');
  const [showScheduling, setShowScheduling] = useState(false);
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { emitTyping, emitStopTyping } = useSocket(contact.id);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      // Upload files to storage (here using data URLs for simplicity)
      // In production, use proper file storage (S3, Cloudinary, etc.)
      const uploadedUrls = await Promise.all(
        files.map(async (file) => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        })
      );
      
      setAttachments(files);
      // Store URLs for sending
      (window as any)[`attachments_${contact.id}`] = uploadedUrls;
      setUploading(false);
    } catch (error) {
      console.error('Upload error:', error);
      setUploading(false);
      alert('Failed to attach file');
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if (!message.trim() && attachments.length === 0) return;

    const attachmentUrls = (window as any)[`attachments_${contact.id}`] || [];
    
    onSendMessage(
      contact.id, 
      message, 
      channel, 
      scheduledTime || undefined,
      channel === 'EMAIL' ? subject : undefined,
      attachmentUrls
    );
    
    setMessage('');
    setSubject('');
    setScheduledTime(null);
    setShowScheduling(false);
    setAttachments([]);
    (window as any)[`attachments_${contact.id}`] = [];
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    // Stop typing
    if (session?.user?.id) {
      emitStopTyping(contact.id, session.user.id);
    }
  };

  const handleSchedule = async (minutes: number) => {
    if (!message.trim() && attachments.length === 0) return;
    
    const now = new Date();
    const scheduled = new Date(now.getTime() + minutes * 60 * 1000);
    const attachmentUrls = (window as any)[`attachments_${contact.id}`] || [];
    
    // Send scheduled message immediately
    await onSendMessage(
      contact.id, 
      message, 
      channel, 
      scheduled,
      channel === 'EMAIL' ? subject : undefined,
      attachmentUrls
    );
    
    // Clear everything
    setMessage('');
    setSubject('');
    setScheduledTime(null);
    setShowScheduling(false);
    setAttachments([]);
    (window as any)[`attachments_${contact.id}`] = [];
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    // Stop typing
    if (session?.user?.id) {
      emitStopTyping(contact.id, session.user.id);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMessageChange = (value: string) => {
    setMessage(value);
    
    // Emit typing indicator
    if (session?.user?.id && session?.user?.name) {
      emitTyping(contact.id, session.user.id, session.user.name);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        emitStopTyping(contact.id, session.user.id);
      }, 2000);
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      {/* Channel Selector */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setChannel('SMS')}
          className={`px-3 py-1 text-xs rounded-full transition ${
            channel === 'SMS'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          SMS
        </button>
        <button
          onClick={() => setChannel('WHATSAPP')}
          className={`px-3 py-1 text-xs rounded-full transition ${
            channel === 'WHATSAPP'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          WhatsApp
        </button>
        <button
          onClick={() => setChannel('EMAIL')}
          className={`px-3 py-1 text-xs rounded-full transition ${
            channel === 'EMAIL'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Email
        </button>
      </div>
      
      {/* Email Subject Field */}
      {channel === 'EMAIL' && (
        <div className="mb-2">
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      )}

      {/* Input */}
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => handleMessageChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Type a ${channel === 'WHATSAPP' ? 'WhatsApp' : 'SMS'} message...`}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
          />
        </div>
        <div className="flex items-center gap-1">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.mp4,.mov"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <button
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            title="Schedule message"
            onClick={() => setShowScheduling(!showScheduling)}
          >
            <Calendar className="w-5 h-5" />
          </button>
          <button
            onClick={handleSend}
            disabled={(!message.trim() && attachments.length === 0) || uploading}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
          {attachments.map((file, index) => (
            <div key={index} className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-300">
              <File className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-900 max-w-[150px] truncate">{file.name}</span>
              <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)}KB</span>
              <button
                onClick={() => removeAttachment(index)}
                className="text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Scheduled Time Preview */}
      {scheduledTime && !showScheduling && (
        <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <Clock className="w-4 h-4 text-blue-600" />
          <span className="text-sm text-blue-900">
            Scheduled for <span className="font-semibold">{format(scheduledTime, 'MMM d, h:mm a')}</span>
          </span>
          <button
            onClick={() => setScheduledTime(null)}
            className="ml-auto text-blue-600 hover:text-blue-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Scheduling Options */}
      {showScheduling && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Schedule Message</span>
            <button
              onClick={() => setShowScheduling(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: '15 min', value: 15 },
              { label: '30 min', value: 30 },
              { label: '1 hour', value: 60 },
              { label: '1 day', value: 1440 },
            ].map((option) => (
              <button
                key={option.label}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-white transition"
                onClick={() => {
                  handleSchedule(option.value);
                  setShowScheduling(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

