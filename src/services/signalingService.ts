class SignalingService {
  private ws: WebSocket | null = null;
  private onMessageCallback: ((data: any) => void) | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    const wsUrl = this.getWebSocketUrl();
    console.log('Connecting to WebSocket:', wsUrl);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected successfully');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
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
        this.handleReconnect();
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => this.connect(), this.reconnectDelay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  private getWebSocketUrl(): string {
    const isProduction = process.env.NODE_ENV === 'production';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;

    if (isProduction) {
      return `${protocol}//${host}/.netlify/functions/websocket`;
    } else {
      // For development, use the current host but different port
      const devPort = '3000';
      return `${protocol}//${window.location.hostname}:${devPort}`;
    }
  }

  onMessage(callback: (data: any) => void) {
    this.onMessageCallback = callback;
  }

  send(data: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected. Attempting to reconnect...');
      this.connect();
      setTimeout(() => this.send(data), 1000); // Retry after connection
      return;
    }

    try {
      this.ws.send(JSON.stringify(data));
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
    }
  }

  findPeer() {
    this.send({ type: 'find_peer' });
  }

  sendOffer(peerId: string, offer: RTCSessionDescriptionInit) {
    this.send({
      type: 'offer',
      peerId,
      offer
    });
  }

  sendAnswer(peerId: string, answer: RTCSessionDescriptionInit) {
    this.send({
      type: 'answer',
      peerId,
      answer
    });
  }

  sendIceCandidate(peerId: string, candidate: RTCIceCandidateInit) {
    this.send({
      type: 'ice-candidate',
      peerId,
      candidate
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = 0;
  }
}

export const signalingService = new SignalingService();