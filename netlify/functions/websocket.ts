import { HandlerEvent, HandlerContext } from "@netlify/functions";
import { WebSocket, WebSocketServer } from 'ws';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

// Track connected users and their WebSocket connections
const connectedUsers = new Map<string, WebSocket & { 
  isInChat?: boolean;
  heartbeat?: NodeJS.Timeout;
}>();

// Function to get ICE servers
async function getIceServers() {
  try {
    // Log Xirsys configuration
    console.log('Xirsys Configuration:', {
      url: process.env.XIRSYS_API_URL,
      domain: process.env.XIRSYS_DOMAIN,
      channel: process.env.XIRSYS_CHANNEL,
      ident: process.env.XIRSYS_IDENT,
      apiKey: process.env.XIRSYS_API_KEY?.substring(0, 8) + '...' // Log partial key for security
    });

    const xirsysUrl = process.env.XIRSYS_API_URL || 'https://global.xirsys.net/_turn';
    const xirsysIdent = process.env.XIRSYS_IDENT || 'peepel';
    const xirsysSecret = process.env.XIRSYS_SECRET || 'xirsys_secret';

    // Log request details
    console.log('Making request to Xirsys:', xirsysUrl);

    // Log Xirsys configuration
    console.log('Xirsys Configuration:', {
      url: process.env.XIRSYS_API_URL,
      domain: process.env.XIRSYS_DOMAIN,
      channel: process.env.XIRSYS_CHANNEL,
      ident: process.env.XIRSYS_IDENT,
      apiKey: process.env.XIRSYS_API_KEY?.substring(0, 8) + '...' // Log partial key for security
    });

    const xirsysUrl = process.env.XIRSYS_API_URL || 'https://global.xirsys.net/_turn';
    const xirsysIdent = process.env.XIRSYS_IDENT || 'peepel';
    const xirsysSecret = process.env.XIRSYS_SECRET || 'xirsys_secret';

    // Log request details
    console.log('Making request to Xirsys:', xirsysUrl);

    const response = await fetch(
      xirsysUrl,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${xirsysIdent}:${xirsysSecret}`).toString('base64')}`
        },
        body: JSON.stringify({
          format: "urls",
          domain: process.env.XIRSYS_DOMAIN || 'peepel',
          room: process.env.XIRSYS_CHANNEL || 'peepel-video',
          secure: 1
        })
      }
    );

    // Log response status
    console.log('Xirsys response status:', response.status);

    // Log response status
    console.log('Xirsys response status:', response.status);

    const data = await response.json();
    
    // Log response data (without credentials)
    console.log('Xirsys response:', {
      status: data.s,
      info: data.info,
      hasIceServers: !!data.v?.iceServers,
      iceServerCount: data.v?.iceServers?.length
    });
    
    // Log response data (without credentials)
    console.log('Xirsys response:', {
      status: data.s,
      info: data.info,
      hasIceServers: !!data.v?.iceServers,
      iceServerCount: data.v?.iceServers?.length
    });

    if (!data.v?.iceServers) {
      throw new Error('No ICE servers received from Xirsys');
    }
    
    // Log sanitized ICE servers (without credentials)
    console.log('Received ICE servers:', data.v.iceServers.map(server => ({
      urls: server.urls,
      hasUsername: !!server.username,
      hasCredential: !!server.credential
    })));

    
    // Log sanitized ICE servers (without credentials)
    console.log('Received ICE servers:', data.v.iceServers.map(server => ({
      urls: server.urls,
      hasUsername: !!server.username,
      hasCredential: !!server.credential
    })));

    return data.v.iceServers;
  } catch (error) {
    console.error('Error fetching ICE servers:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    // Fallback to public STUN servers if Xirsys fails
    return [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    // Fallback to public STUN servers if Xirsys fails
    return [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ];
  }
}

// Heartbeat to keep connections alive
function setupHeartbeat(ws: WebSocket & { heartbeat?: NodeJS.Timeout }) {
  if (ws.heartbeat) {
    clearInterval(ws.heartbeat);
  }
  
  ws.heartbeat = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    } else {
      clearInterval(ws.heartbeat);
    }
  }, 30000);
}

// Create WebSocket server instance
let wss: WebSocketServer;

export const handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Log request details for debugging
  console.log('WebSocket request:', {
    method: event.httpMethod,
    headers: event.headers,
    path: event.path,
    isBase64Encoded: event.isBase64Encoded,
    requestContext: event.requestContext
  });

  // Log incoming request details
  console.log('Incoming request:', {
    method: event.httpMethod,
    headers: event.headers,
    path: event.path
  });

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin',
        'Connection': 'keep-alive'
      }
    };
  }

  // Verify WebSocket upgrade request
  if (!event.headers.upgrade || event.headers.upgrade.toLowerCase() !== 'websocket') {
    console.log('Invalid upgrade header:', event.headers.upgrade);
    return {
      statusCode: 426,
      body: 'Upgrade Required',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/plain',
        'Connection': 'Upgrade',
        'Upgrade': 'websocket',
        'Sec-WebSocket-Version': '13',
        'Sec-WebSocket-Key': event.headers['sec-websocket-key'] || '',
        'Sec-WebSocket-Protocol': event.headers['sec-websocket-protocol'] || ''
      }
    };
  }

  try {
    const { websocket } = context.clientContext as any;
    if (!websocket) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'WebSocket context not available' }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
    }
    
    // Log successful WebSocket context
    console.log('WebSocket context available:', !!websocket);

    // Get ICE servers
    const iceServers = await getIceServers();
    if (!iceServers) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to get ICE servers' }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
    }

    // Initialize WebSocket server if not already created
    if (!wss) {
      wss = new WebSocketServer({ 
        noServer: true,
        clientTracking: true,
        perMessageDeflate: false
      });

      // Handle WSS errors
      wss.on('error', (error) => {
        console.error('WebSocket Server Error:', error);
      });
    }

    wss.handleUpgrade(event.requestContext as any, websocket.socket, Buffer.alloc(0), (ws) => {
      const userId = uuidv4();
      connectedUsers.set(userId, ws);
      setupHeartbeat(ws);

      // Set WebSocket timeout
      ws.on('pong', () => {
        ws.isAlive = true;
      });
      // Send initial connection success message
      ws.send(JSON.stringify({
        type: 'connected',
        userId,
        iceServers
      }));

      ws.on('message', async (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          
          // Log incoming message type for debugging
          console.log('Received message type:', data.type);

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

                console.log('Peer match found:', { userId, peerId });
              } else {
                ws.send(JSON.stringify({
                  type: 'waiting',
                  message: 'Waiting for available peer...'
                }));
                console.log('User waiting for peer:', userId);
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
                  }));
                  console.log('Forwarded', data.type, 'from', userId, 'to', data.peerId);
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

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket Error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'WebSocket error occurred'
        }));
      });
    });

    return {
      statusCode: 101, // Switching Protocols
      body: 'Switching Protocols',
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Access-Control-Allow-Origin': '*'
      }
    };
  } catch (error) {
    console.error('WebSocket setup failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'WebSocket setup failed' }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }
};