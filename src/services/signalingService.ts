class SignalingService {
  private ws: WebSocket | null = null;
  private onMessageCallback: ((data: any) => void) | null = null;
  private queueTimeout: NodeJS.Timeout | null = null;
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'searching' | 'matched' = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private maxQueueTime = 30000; // 30 seconds max wait time
  private currentPeerId: string | null = null;

  connect() {
    // Don't try to reconnect if already connected
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    // Don't try to reconnect if already connecting
    if (this.ws?.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket already connecting');
      return;
    }
    
    this.connectionState = 'connecting';

    const wsUrl = this.getWebSocketUrl();
    console.log('Connecting to WebSocket:', wsUrl);

    try {
      this.ws = new WebSocket(wsUrl);
      
      // Set a timeout for the connection attempt
      const connectionTimeout = setTimeout(() => {
        if (this.ws?.readyState === WebSocket.CONNECTING) {
          this.ws.close();
          this.handleReconnect();
        }
      }, 5000); // 5 second timeout

      this.ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('WebSocket connected successfully');
        this.connectionState = 'connected';
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle connection state changes
          if (data.type === 'peer_found') {
            this.connectionState = 'matched';
            this.currentPeerId = data.peerId;
            this.clearQueueTimeout();
          } else if (data.type === 'peer_disconnected') {
            this.connectionState = 'connected';
            this.currentPeerId = null;
          }
          
          if (this.onMessageCallback) {
            this.onMessageCallback(data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        this.connectionState = 'disconnected';
        this.currentPeerId = null;
        this.clearQueueTimeout();
        this.handleReconnect();
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.connectionState = 'disconnected';
      this.handleReconnect();
    }
  }
  
  private clearQueueTimeout() {
    if (this.queueTimeout) {
      clearTimeout(this.queueTimeout);
      this.queueTimeout = null;
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000); // Exponential backoff with 10s max
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => this.connect(), delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.connectionState = 'disconnected';
    }
  }

  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = 'your-railway-app-url.railway.app'; // You'll replace this with your actual Railway URL
    const path = '/ws';

    return `${protocol}//${host}${path}`;
  }

  onMessage(callback: (data: any) => void) {
    this.onMessageCallback = callback;
  }

  send(data: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected. Attempting to reconnect...');
      // Queue message to be sent after connection
      const queuedMessage = () => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify(data));
        } else {
          setTimeout(queuedMessage, 1000);
        }
      };
      this.connect();
      queuedMessage();
      return;
    }

    try {
      this.ws.send(JSON.stringify(data));
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
    }
  }

  findPeer() {
    if (this.connectionState !== 'connected') {
      console.warn('Cannot find peer: not connected');
      return;
    }
    
    this.connectionState = 'searching';
    this.send({ type: 'find_peer' });
    
    // Set timeout for queue
    this.clearQueueTimeout();
    this.queueTimeout = setTimeout(() => {
      if (this.connectionState === 'searching') {
        this.connectionState = 'connected';
        if (this.onMessageCallback) {
          this.onMessageCallback({
            type: 'queue_timeout',
            message: 'No peer found within timeout period'
          });
        }
      }
    }, this.maxQueueTime);
  }

  sendOffer(peerId: string, offer: RTCSessionDescriptionInit) {
    if (this.connectionState !== 'matched' || this.currentPeerId !== peerId) {
      console.warn('Cannot send offer: invalid state or peer');
      return;
    }
    
    this.send({
      type: 'offer',
      peerId,
      offer
    });
  }

  sendAnswer(peerId: string, answer: RTCSessionDescriptionInit) {
    if (this.connectionState !== 'matched' || this.currentPeerId !== peerId) {
      console.warn('Cannot send answer: invalid state or peer');
      return;
    }
    
    this.send({
      type: 'answer',
      peerId,
      answer
    });
  }

  sendIceCandidate(peerId: string, candidate: RTCIceCandidateInit) {
    if (this.connectionState !== 'matched' || this.currentPeerId !== peerId) {
      console.warn('Cannot send ICE candidate: invalid state or peer');
      return;
    }
    
    this.send({
      type: 'ice-candidate',
      peerId,
      candidate
    });
  }

  disconnect() {
    this.clearQueueTimeout();
    this.connectionState = 'disconnected';
    this.currentPeerId = null;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = 0;
  }
  
  getConnectionState() {
    return this.connectionState;
  }
  
  getCurrentPeerId() {
    return this.currentPeerId;
  }
}

export const signalingService = new SignalingService();