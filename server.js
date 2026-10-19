const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Enable payload handling up to 10MB for smooth image sharing
const io = new Server(server, {
  maxHttpBufferSize: 1e7,
  cors: { origin: "*" }
});

app.use(express.static('public'));

const activeRooms = new Set();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join private room
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    activeRooms.add(roomId);
    socket.emit('system_message', `SECURE CHANNEL CONNECTED: [${roomId}]`);
    socket.to(roomId).emit('system_message', `ANONYMOUS OPERATIVE CONNECTED`);
  });

  // Relay text message
  socket.on('send_message', ({ roomId, message }) => {
    socket.to(roomId).emit('receive_message', { sender: 'Operative', text: message });
  });

  // Relay image payload
  socket.on('send_image', ({ roomId, image }) => {
    socket.to(roomId).emit('receive_image', { sender: 'Operative', image });
  });

  // Manual "Boom" Destroy
  socket.on('boom_destroy', (roomId) => {
    if (activeRooms.has(roomId)) {
      io.to(roomId).emit('room_destroyed', '💥 CRITICAL OVERRIDE! DATA WIPED PERMANENTLY.');
      io.in(roomId).socketsLeave(roomId);
      activeRooms.delete(roomId);
    }
  });

  // Auto-Boom on disconnect
  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (room !== socket.id && activeRooms.has(room)) {
        io.to(room).emit('room_destroyed', '💥 OPERATIVE DISCONNECTED. SESSION PURGED!');
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
  console.log(`🚀 Marphel Core Online at http://localhost:${PORT}`);
});