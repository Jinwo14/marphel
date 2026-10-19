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

const imgBtn = document.getElementById('img-btn');
const imageInput = document.getElementById('image-input');

// Auto-join from URL parameter
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

// Copy Invite Link
copyLinkBtn.addEventListener('click', () => {
  const inviteUrl = `${window.location.origin}/?room=${encodeURIComponent(currentRoomId)}`;
  navigator.clipboard.writeText(inviteUrl).then(() => {
    alert('SECURE LINK COPIED TO CLIPBOARD');
  });
});

// Send Text Message
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

// Trigger Image Upload
imgBtn.addEventListener('click', () => {
  imageInput.click();
});

imageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file && currentRoomId) {
    if (file.size > 5 * 1024 * 1024) {
      alert('FILE OVERSIZE. Select image under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = function (evt) {
      const base64Image = evt.target.result;
      appendImage('You', base64Image, 'you');
      socket.emit('send_image', { roomId: currentRoomId, image: base64Image });
    };
    reader.readAsDataURL(file);
    imageInput.value = '';
  }
});

// Boom Action
boomBtn.addEventListener('click', () => {
  if (confirm('EXECUTE EMERGENCY PURGE? All chat data will be destroyed.')) {
    socket.emit('boom_destroy', currentRoomId);
  }
});

// Socket Listeners
socket.on('receive_message', (data) => {
  appendMessage(data.sender, data.text, 'peer');
});

socket.on('receive_image', (data) => {
  appendImage(data.sender, data.image, 'peer');
});

socket.on('system_message', (msg) => {
  appendMessage('SYSTEM', msg, 'system');
});

socket.on('room_destroyed', (msg) => {
  messageBox.innerHTML = '';
  alert(msg);
  chatScreen.classList.add('hidden');
  joinScreen.classList.remove('hidden');
  window.history.replaceState({}, document.title, window.location.pathname);
  currentRoomId = '';
});

// Helper Functions
function appendMessage(sender, text, type) {
  const div = document.createElement('div');
  div.classList.add('msg', type);
  div.innerText = type === 'system' ? text : `[${sender}]: ${text}`;
  messageBox.appendChild(div);
  messageBox.scrollTop = messageBox.scrollHeight;
}

function appendImage(sender, imageData, type) {
  const div = document.createElement('div');
  div.classList.add('msg', type);

  const label = document.createElement('span');
  label.innerText = `[${sender}] CLASSIFIED IMAGE:`;
  label.style.fontWeight = 'bold';
  label.style.display = 'block';

  const img = document.createElement('img');
  img.src = imageData;

  div.appendChild(label);
  div.appendChild(img);
  messageBox.appendChild(div);
  messageBox.scrollTop = messageBox.scrollHeight;
}