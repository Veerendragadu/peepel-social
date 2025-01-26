import { useEffect, useRef, useState } from 'react';

const ICE_CONFIGURATION = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    {
      urls: `turn:${window.location.hostname}:3478`,
      username: import.meta.env.VITE_TURN_USERNAME || 'default_user',
      credential: import.meta.env.VITE_TURN_PASSWORD || 'default_password'
    }
  ],
  iceCandidatePoolSize: 10,
  iceTransportPolicy: 'all'
};

class WebRTCConnection {
  private peerConnection: RTCPeerConnection;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private onRemoteStream: (stream: MediaStream) => void;
  private onConnectionStateChange: (state: RTCPeerConnectionState) => void;
  private onIceCandidate: (candidate: RTCIceCandidate | null) => void;
  private pendingCandidates: RTCIceCandidate[] = [];
  private isNegotiating: boolean = false;
  private makingOffer: boolean = false;
  private mediaConstraints = {
    video: { 
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 },
      facingMode: "user",
      aspectRatio: { ideal: 16/9 }
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  };

  constructor(
    onRemoteStream: (stream: MediaStream) => void,
    onConnectionStateChange: (state: RTCPeerConnectionState) => void,
    onIceCandidate: (candidate: RTCIceCandidate | null) => void
  ) {
    this.peerConnection = new RTCPeerConnection(ICE_CONFIGURATION);
    this.onRemoteStream = onRemoteStream;
    this.onConnectionStateChange = onConnectionStateChange;
    this.onIceCandidate = onIceCandidate;
    this.setupPeerConnection();
  }

  private setupPeerConnection() {
    // Handle remote tracks
    this.peerConnection.ontrack = ({ streams: [stream] }) => {
      this.remoteStream = stream;
      this.onRemoteStream(stream);
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      this.onConnectionStateChange(this.peerConnection.connectionState);
      
      // Clean up on disconnection
      if (this.peerConnection.connectionState === 'disconnected' ||
          this.peerConnection.connectionState === 'failed' ||
          this.peerConnection.connectionState === 'closed') {
        this.cleanup();
      }
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      this.onIceCandidate(event.candidate);
    };

    // Handle negotiation needed
    this.peerConnection.onnegotiationneeded = async () => {
      try {
        this.isNegotiating = true;
        this.makingOffer = true;
        await this.peerConnection.setLocalDescription();
        this.makingOffer = false;
      } catch (err) {
        console.error('Error during negotiation:', err);
      } finally {
        this.isNegotiating = false;
      }
    };
  }

  async addLocalStream(stream: MediaStream) {
    this.localStream = stream;
    try {
      console.log('Adding tracks to peer connection...');
      for (const track of stream.getTracks()) {
        console.log('Adding track:', track.kind);
        await this.peerConnection.addTrack(track, stream);
      }
    } catch (error) {
      console.error('Error adding local stream:', error);
      throw error;
    }
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  async handleOffer(offer: RTCSessionDescriptionInit) {
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  async handleAnswer(answer: RTCSessionDescriptionInit) {
    try {
      if (this.peerConnection.signalingState === 'have-local-offer') {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      } else {
        console.warn('Unexpected answer in signaling state:', this.peerConnection.signalingState);
      }
    } catch (error) {
      console.error('Error handling answer:', error);
      throw error;
    }
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit) {
    try {
      if (this.peerConnection.remoteDescription) {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        // Store candidate if remote description is not set yet
        this.pendingCandidates.push(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
      throw error;
    }
  }

  private cleanup() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }
    this.pendingCandidates = [];
    this.isNegotiating = false;
    this.makingOffer = false;
  }

  close() {
    this.cleanup();
    this.peerConnection.close();
  }
}

export function useWebRTC(onRemoteStream: (stream: MediaStream) => void) {
  const peerConnection = useRef<WebRTCConnection | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState | null>(null);

  useEffect(() => {
    return () => {
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
    };
  }, []);

  const initializeConnection = () => {
    peerConnection.current = new WebRTCConnection(
      onRemoteStream,
      (state: RTCPeerConnectionState) => {
        console.log('Connection state changed:', state);
        setConnectionState(state);
      },
      (candidate) => {
        if (candidate) {
          // Send candidate through signaling service
          signalingService.sendIceCandidate(
            signalingService.getCurrentPeerId(),
            candidate.toJSON()
          );
        }
      }
    );
  };

  const addLocalStream = async (stream: MediaStream) => {
    if (peerConnection.current === null) {
      initializeConnection();
    }
    await peerConnection.current?.addLocalStream(stream);
  };

  const createOffer = async () => {
    return await peerConnection.current?.createOffer();
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit | undefined> => {
    return await peerConnection.current?.handleOffer(offer);
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit): Promise<void> => {
    await peerConnection.current?.handleAnswer(answer);
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit): Promise<void> => {
    await peerConnection.current?.handleIceCandidate(candidate);
  };

  return {
    initializeConnection,
    addLocalStream,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    connectionState: connectionState || 'new'
  };
}