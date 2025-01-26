import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { WebSocketServer } from 'ws';
import { createServer } from 'node-turn';
import { config } from 'dotenv';

config();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3478;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100')
});
app.use(limiter);

// Serve static files
app.use(express.static('dist'));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

// WebSocket server for signaling
const wss = new WebSocketServer({ 
  server,
  path: '/ws',
  perMessageDeflate: false
});

// Track connected users
const connectedUsers = new Map();

wss.on('connection', (ws) => {
  const userId = crypto.randomUUID();
  connectedUsers.set(userId, ws);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      switch (data.type) {
        case 'find_peer':
          // Find available peer for stranger chat
          const availablePeer = Array.from(connectedUsers.entries())
            .find(([id, socket]) => 
              id !== userId && 
              socket.readyState === ws.OPEN &&
              !socket.isInChat
            );

          if (availablePeer) {
            const [peerId, peerSocket] = availablePeer;
            
            // Mark both users as in chat
            ws.isInChat = true;
            peerSocket.isInChat = true;

            // Send peer found messages
            ws.send(JSON.stringify({
              type: 'peer_found',
              peerId
            }));
            
            peerSocket.send(JSON.stringify({
              type: 'peer_found',
              peerId: userId
            }));
          }
          break;

        case 'offer':
        case 'answer':
        case 'ice-candidate':
          // Forward signaling messages to peer
          if (data.peerId && connectedUsers.has(data.peerId)) {
            connectedUsers.get(data.peerId).send(JSON.stringify({
              type: data.type,
              [data.type]: data[data.type],
              peerId: userId
            }));
          }
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  ws.on('close', () => {
    connectedUsers.delete(userId);
  });
});

// Start TURN server
const turnServer = createServer({
  authMech: 'long-term',
  credentials: {
    username: process.env.TURN_USERNAME || 'default_user',
    password: process.env.TURN_PASSWORD || 'default_password'
  },
  realm: process.env.TURN_REALM || 'peepel.com',
  debugLevel: 'INFO',
  listenIps: ['0.0.0.0'],
  relayIps: ['0.0.0.0'],
  minPort: 49152,
  maxPort: 65535
});

const PORT = process.env.PORT || 8080;
const TURN_PORT = process.env.TURN_PORT || 3478;

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

turnServer.start(() => {
  console.log(`TURN server running on port ${TURN_PORT}`);
});

// Graceful shutdown
const shutdown = () => {
  console.log('\nShutting down servers...');
  server.close();
  turnServer.stop();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);