const socket = io();

let currentRoomId = '';

const joinScreen = document.getElementById('join-screen');
const chatScreen = document.getElementById('chat-screen');
const roomInput = document.getElementById('room-input');
const joinBtn = document.getElementById('join-btn');
const currentRoomSpan = document.getElementById('current-room');
const messageBox = document.getElementById('message-box');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const boomBtn = document.getElementById('boom-btn');
const copyLinkBtn = document.getElementById('copy-link-btn');

// Automatically join room if specified in the URL query string (e.g. ?room=secret123)
window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const roomParam = urlParams.get('room');
  if (roomParam) {
    roomInput.value = roomParam;
    joinBtn.click();
  }
});

// Join Room Event
joinBtn.addEventListener('click', () => {
  const roomId = roomInput.value.trim();
  if (roomId) {
    currentRoomId = roomId;
    socket.emit('join_room', roomId);
    currentRoomSpan.innerText = roomId;
    joinScreen.classList.add('hidden');
    chatScreen.classList.remove('hidden');
  }
});

// Copy Invite Link to Clipboard
copyLinkBtn.addEventListener('click', () => {
  const inviteUrl = `${window.location.origin}/?room=${encodeURIComponent(currentRoomId)}`;
  navigator.clipboard.writeText(inviteUrl).then(() => {
    alert('Invite link copied to clipboard!');
  });
});

// Send Message Event
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const message = messageInput.value.trim();
  if (message && currentRoomId) {
    appendMessage('You', message, 'you');
    socket.emit('send_message', { roomId: currentRoomId, message });
    messageInput.value = '';
  }
}

// Click the "Boom" button to destroy room
boomBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to boom/destroy this chat room?')) {
    socket.emit('boom_destroy', currentRoomId);
  }
});

// Socket Event Listeners
socket.on('receive_message', (data) => {
  appendMessage(data.sender, data.text, 'peer');
});

socket.on('system_message', (msg) => {
  appendMessage('System', msg, 'system');
});

socket.on('room_destroyed', (msg) => {
  messageBox.innerHTML = '';
  alert(msg);
  // Reset view back to join screen and clear URL parameters
  chatScreen.classList.add('hidden');
  joinScreen.classList.remove('hidden');
  window.history.replaceState({}, document.title, window.location.pathname);
  currentRoomId = '';
});

function appendMessage(sender, text, type) {
  const div = document.createElement('div');
  div.classList.add('msg', type);
  div.innerText = type === 'system' ? text : `${sender}: ${text}`;
  messageBox.appendChild(div);
  messageBox.scrollTop = messageBox.scrollHeight;
}