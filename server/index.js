const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const users = new Map();

wss.on('connection', (ws) => {
  const userId = Date.now().toString();

  users.set(userId, ws);

  ws.send(JSON.stringify({ type: 'userId', userId }));

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    switch (data.type) {
      case 'offer':
      case 'answer':
      case 'iceCandidate':
        const targetUser = users.get(data.targetUserId);
        if (targetUser) {
          targetUser.send(message);
        }
        break;
      default:
        break;
    }
  });

  ws.on('close', () => {
    users.delete(userId);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

function handleWebRTCError(err) {
  console.error('WebRTC error:', err);
}

server.listen(3004, () => {
  console.log('Server started on port 3004');
});