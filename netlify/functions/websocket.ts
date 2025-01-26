import { HandlerEvent, HandlerContext } from "@netlify/functions";
import { WebSocket, WebSocketServer } from 'ws';

// Track connected users and their WebSocket connections
const connectedUsers = new Map<string, WebSocket & { isInChat?: boolean }>();

// Create WebSocket server instance
let wss: WebSocketServer;

export const handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Verify WebSocket upgrade request
  if (event.headers.upgrade?.toLowerCase() !== 'websocket') {
    return {
      statusCode: 426,
      body: 'Upgrade Required',
      headers: {
        'Content-Type': 'text/plain',
        'Connection': 'Upgrade',
        'Upgrade': 'websocket'
      }
    };
  }

  try {
    const { websocket } = context.clientContext as any;
    if (!websocket) {
      throw new Error('No WebSocket context available');
    }

    // Initialize WebSocket server if not already created
    if (!wss) {
      wss = new WebSocketServer({ 
        noServer: true
      });
    }

    wss.handleUpgrade(event.requestContext as any, websocket.socket, Buffer.alloc(0), (ws) => {
      const userId = crypto.randomUUID();
      connectedUsers.set(userId, ws);

      // Send initial connection success message
      ws.send(JSON.stringify({
        type: 'connected',
        userId
      }));

      ws.on('message', async (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          
          switch (data.type) {
            case 'find_peer':
              const availablePeer = Array.from(connectedUsers.entries())
                .find(([id, socket]) => 
                  id !== userId &&
                  socket.readyState === WebSocket.OPEN &&
                  !socket.isInChat
                );

              if (availablePeer) {
                const [peerId, peerSocket] = availablePeer;
                
                ws.isInChat = true; 
                peerSocket.isInChat = true;

                ws.send(JSON.stringify({
                  type: 'peer_found',
                  peerId,
                  initiator: true
                }));
                
                peerSocket.send(JSON.stringify({
                  type: 'peer_found',
                  peerId: userId,
                  initiator: false
                }));
              } else {
                ws.send(JSON.stringify({
                  type: 'waiting',
                  message: 'Waiting for available peer...'
                }));
              }
              break;

            case 'offer':
            case 'answer':
            case 'ice-candidate':
              if (data.peerId && connectedUsers.has(data.peerId)) {
                const targetWs = connectedUsers.get(data.peerId);
                if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                  targetWs.send(JSON.stringify({
                    type: data.type,
                    data: data[data.type],
                    peerId: userId
                  });
                }
              }
              break;
          }
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Failed to process message'
          }));
        }
      });

      ws.on('close', async () => {
        // Notify peer if in chat
        if (ws.isInChat) {
          connectedUsers.forEach((socket, id) => {
            if (socket.isInChat) {
              socket.send(JSON.stringify({
                type: 'peer_disconnected',
                peerId: userId
              }));
            }
          });
        }
        connectedUsers.delete(userId);
        console.log(`Client ${userId} disconnected`);
      });
    });

    return {
      statusCode: 101, // Switching Protocols
      body: 'Switching Protocols',
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade'
      }
    };
  } catch (error) {
    console.error('WebSocket setup failed:', error);
    return {
      statusCode: 500,
      body: 'WebSocket setup failed',
      headers: {
        'Content-Type': 'text/plain'
      }
    };
  }
};