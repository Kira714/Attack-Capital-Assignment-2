/**
 * Socket.IO Server Setup
 * Real-time collaboration for notes and presence
 */
import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export function initSocketIO(server: HTTPServer) {
  if (io) return io;

  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);

    // Join a contact/room
    socket.on('join-contact', (contactId: string) => {
      socket.join(`contact:${contactId}`);
      console.log(`User ${socket.id} joined contact: ${contactId}`);
    });

    // Leave a contact/room
    socket.on('leave-contact', (contactId: string) => {
      socket.leave(`contact:${contactId}`);
      console.log(`User ${socket.id} left contact: ${contactId}`);
    });

    // Typing indicator
    socket.on('typing', (data: { contactId: string; userId: string; userName: string }) => {
      socket.to(`contact:${data.contactId}`).emit('user-typing', data);
    });

    // Stop typing
    socket.on('stop-typing', (data: { contactId: string; userId: string }) => {
      socket.to(`contact:${data.contactId}`).emit('user-stopped-typing', data);
    });

    // Presence update
    socket.on('presence-update', (data: { contactId: string; userId: string; userName: string; status: string }) => {
      socket.to(`contact:${data.contactId}`).emit('user-presence', data);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
    });
  });

  return io;
}

export function getSocketIO(): SocketIOServer | null {
  return io;
}

export function emitToContact(contactId: string, event: string, data: any) {
  if (io) {
    io.to(`contact:${contactId}`).emit(event, data);
  }
}









