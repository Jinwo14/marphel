const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static frontend files from 'public' folder
app.use(express.static('public'));

// Active rooms in memory
const activeRooms = new Set();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a private room
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    activeRooms.add(roomId);
    socket.emit('system_message', `Joined room: ${roomId}`);
    socket.to(roomId).emit('system_message', `A user connected to the chat.`);
  });

  // Relay private message
  socket.on('send_message', ({ roomId, message }) => {
    socket.to(roomId).emit('receive_message', { sender: 'Peer', text: message });
  });

  // The "Boom" button logic: Destroys the room completely
  socket.on('boom_destroy', (roomId) => {
    if (activeRooms.has(roomId)) {
      io.to(roomId).emit('room_destroyed', '💥 BOOM! This chat session and messages have been wiped forever.');
      io.in(roomId).socketsLeave(roomId);
      activeRooms.delete(roomId);
    }
  });

  // Auto-Boom: Destroy room if someone disconnects or closes tab
  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (room !== socket.id && activeRooms.has(room)) {
        io.to(room).emit('room_destroyed', '💥 A participant left. Chat session wiped!');
        io.in(room).socketsLeave(room);
        activeRooms.delete(room);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Marphel server running at http://localhost:${PORT}`);
});