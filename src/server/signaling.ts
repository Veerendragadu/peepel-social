import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';

interface User {
  id: string;
  ws: WebSocket;
  isAvailable: boolean;
}

class SignalingServer {
  private wss: WebSocketServer;
  private users: Map<string, User> = new Map();
  private waitingQueue: string[] = [];

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.setupWebSocketServer();
    console.log(`Signaling server running on port ${port}`);
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket) => {
      const userId = uuidv4();
      
      // Add user to the pool
      this.users.set(userId, {
        id: userId,
        ws,
        isAvailable: true
      });

      // Send user their ID
      ws.send(JSON.stringify({
        type: 'register',
        userId
      }));

      ws.on('message', (message: string) => {
        this.handleMessage(userId, message);
      });

      ws.on('close', () => {
        this.handleDisconnect(userId);
      });

      // Try to match with someone if they're looking for a stranger
      this.matchUsers(userId);
    });
  }

  private handleMessage(userId: string, message: string) {
    try {
      const data = JSON.parse(message);
      const user = this.users.get(userId);

      if (!user) return;

      switch (data.type) {
        case 'find_peer':
          this.matchUsers(userId);
          break;

        case 'offer':
        case 'answer':
        case 'ice-candidate':
          // Forward signaling messages to the peer
          if (data.targetUserId) {
            const targetUser = this.users.get(data.targetUserId);
            if (targetUser) {
              targetUser.ws.send(JSON.stringify({
                type: data.type,
                [data.type]: data[data.type],
                fromUserId: userId
              }));
            }
          }
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  private matchUsers(userId: string) {
    const user = this.users.get(userId);
    if (!user || !user.isAvailable) return;

    // Add to waiting queue if no match available
    if (this.waitingQueue.length === 0) {
      this.waitingQueue.push(userId);
      return;
    }

    // Find first available user in queue
    while (this.waitingQueue.length > 0) {
      const potentialMatchId = this.waitingQueue.shift();
      if (!potentialMatchId || potentialMatchId === userId) continue;

      const potentialMatch = this.users.get(potentialMatchId);
      if (!potentialMatch || !potentialMatch.isAvailable) continue;

      // Match found! Mark both users as unavailable
      user.isAvailable = false;
      potentialMatch.isAvailable = false;

      // Notify both users of the match
      user.ws.send(JSON.stringify({
        type: 'peer_found',
        targetUserId: potentialMatchId,
        initiator: true
      }));

      potentialMatch.ws.send(JSON.stringify({
        type: 'peer_found',
        targetUserId: userId,
        initiator: false
      }));

      return;
    }

    // No match found, add to waiting queue
    this.waitingQueue.push(userId);
  }

  private handleDisconnect(userId: string) {
    const user = this.users.get(userId);
    if (!user) return;

    // Remove from users map and waiting queue
    this.users.delete(userId);
    this.waitingQueue = this.waitingQueue.filter(id => id !== userId);

    // Notify any connected peer
    this.users.forEach(otherUser => {
      otherUser.ws.send(JSON.stringify({
        type: 'peer_disconnected',
        userId
      }));
    });
  }
}

export default SignalingServer;