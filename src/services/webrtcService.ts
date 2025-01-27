import { useEffect, useRef, useState } from 'react';

// Default ICE servers as fallback
const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' }
];

class WebRTCConnection {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private onRemoteStream: ((stream: MediaStream) => void) | null = null;
  private onConnectionStateChange: ((state: RTCPeerConnectionState) => void) | null = null;
  private onIceCandidate: ((candidate: RTCIceCandidate | null) => void) | null = null;
  private pendingCandidates: RTCIceCandidate[] = [];
  private isNegotiating: boolean = false;
  private makingOffer: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private cleanupCallbacks: (() => void)[] = [];

  constructor(
    onRemoteStream: (stream: MediaStream) => void,
    onConnectionStateChange: (state: RTCPeerConnectionState) => void,
    onIceCandidate: (candidate: RTCIceCandidate | null) => void
  ) {
    this.onRemoteStream = onRemoteStream;
    this.onConnectionStateChange = onConnectionStateChange;
    this.onIceCandidate = onIceCandidate;
    this.initializePeerConnection();
  }

  private async initializePeerConnection() {
    try {
      // Clean up existing connection if any
      if (this.peerConnection) {
        this.peerConnection.close();
      }

      // Create new peer connection
      this.peerConnection = new RTCPeerConnection({
        iceServers: DEFAULT_ICE_SERVERS,
        iceCandidatePoolSize: 10,
        iceTransportPolicy: 'all'
      });

      this.setupPeerConnectionHandlers();
    } catch (error) {
      console.error('Error initializing peer connection:', error);
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        await this.initializePeerConnection();
      } else {
        throw new Error('Failed to initialize peer connection after multiple attempts');
      }
    }
  }

  private setupPeerConnectionHandlers() {
    if (!this.peerConnection) return;

    // Handle remote tracks
    this.peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        if (this.onRemoteStream) {
          this.onRemoteStream(event.streams[0]);
        }
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      if (this.onConnectionStateChange && this.peerConnection) {
        this.onConnectionStateChange(this.peerConnection.connectionState);
      }

      // Handle disconnection states
      if (this.peerConnection?.connectionState === 'disconnected' ||
          this.peerConnection?.connectionState === 'failed' ||
          this.peerConnection?.connectionState === 'closed') {
        this.cleanup();
      }
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (this.onIceCandidate) {
        this.onIceCandidate(event.candidate);
      }
    };

    // Handle negotiation needed
    this.peerConnection.onnegotiationneeded = async () => {
      try {
        this.isNegotiating = true;
        this.makingOffer = true;
        if (this.peerConnection) {
          const offer = await this.peerConnection.createOffer();
          await this.peerConnection.setLocalDescription(offer);
        }
      } catch (error) {
        console.error('Error during negotiation:', error);
      } finally {
        this.makingOffer = false;
        this.isNegotiating = false;
      }
    };
  }

  async addLocalStream(stream: MediaStream) {
    this.localStream = stream;
    try {
      if (!this.peerConnection) {
        await this.initializePeerConnection();
      }

      // Add tracks to peer connection
      stream.getTracks().forEach(track => {
        if (this.peerConnection) {
          this.peerConnection.addTrack(track, stream);
          
          // Add cleanup callback for this track
          this.cleanupCallbacks.push(() => {
            track.stop();
            track.enabled = false;
          });
        }
      });
    } catch (error) {
      console.error('Error adding local stream:', error);
      throw error;
    }
  }

  cleanup() {
    console.log('Starting WebRTC cleanup...');

    // Execute all cleanup callbacks
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in cleanup callback:', error);
      }
    });
    this.cleanupCallbacks = [];

    // Clean up local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      this.localStream = null;
    }

    // Clean up remote stream
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      this.remoteStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      try {
        this.peerConnection.close();
      } catch (error) {
        console.error('Error closing peer connection:', error);
      }
      this.peerConnection = null;
    }

    // Reset state
    this.pendingCandidates = [];
    this.isNegotiating = false;
    this.makingOffer = false;
    this.reconnectAttempts = 0;

    console.log('WebRTC cleanup completed');
  }

  // Public methods for WebRTC signaling
  async createOffer(): Promise<RTCSessionDescriptionInit | null> {
    try {
      if (!this.peerConnection) {
        await this.initializePeerConnection();
      }
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.error('Error creating offer:', error);
      return null;
    }
  }

  async handleOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit | null> {
    try {
      if (!this.peerConnection) {
        await this.initializePeerConnection();
      }
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      return answer;
    } catch (error) {
      console.error('Error handling offer:', error);
      return null;
    }
  }

  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    try {
      if (!this.peerConnection) {
        throw new Error('No peer connection available');
      }
      if (this.peerConnection.signalingState === 'have-local-offer') {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (error) {
      console.error('Error handling answer:', error);
      throw error;
    }
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    try {
      if (!this.peerConnection) {
        throw new Error('No peer connection available');
      }
      if (this.peerConnection.remoteDescription) {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        this.pendingCandidates.push(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
      throw error;
    }
  }
}

export function useWebRTC(onRemoteStream: (stream: MediaStream) => void) {
  const webrtcRef = useRef<WebRTCConnection | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');

  useEffect(() => {
    return () => {
      if (webrtcRef.current) {
        webrtcRef.current.cleanup();
        webrtcRef.current = null;
      }
    };
  }, []);

  const initialize = () => {
    webrtcRef.current = new WebRTCConnection(
      onRemoteStream,
      (state) => setConnectionState(state),
      (candidate) => {
        if (candidate) {
          // Send candidate through signaling service
          // Implementation depends on your signaling service
        }
      }
    );
  };

  return {
    initialize,
    webrtc: webrtcRef.current,
    connectionState
  };
}