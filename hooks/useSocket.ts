/**
 * Socket.IO Client Hook
 * Real-time collaboration for notes and messages
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket(contactId?: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const timeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('✅ Socket connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('user-typing', (data: { userId: string; userName: string }) => {
      setTypingUsers(prev => new Set(prev).add(data.userName));
      
      // Clear typing indicator after 3 seconds
      if (timeoutRef.current[data.userName]) {
        clearTimeout(timeoutRef.current[data.userName]);
      }
      timeoutRef.current[data.userName] = setTimeout(() => {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userName);
          return newSet;
        });
      }, 3000);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.close();
    };
  }, []);

  useEffect(() => {
    if (socket && contactId) {
      socket.emit('join-contact', contactId);
      return () => {
        socket.emit('leave-contact', contactId);
      };
    }
  }, [socket, contactId]);

  const emitTyping = (contactId: string, userId: string, userName: string) => {
    if (socket) {
      socket.emit('typing', { contactId, userId, userName });
    }
  };

  const emitStopTyping = (contactId: string, userId: string) => {
    if (socket) {
      socket.emit('stop-typing', { contactId, userId });
    }
  };

  return {
    socket,
    isConnected,
    typingUsers,
    emitTyping,
    emitStopTyping,
  };
}









