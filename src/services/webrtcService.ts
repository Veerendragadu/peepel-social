import { useEffect, useRef } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

class WebRTCConnection {
  private peerConnection: RTCPeerConnection;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private onRemoteStream: (stream: MediaStream) => void;
  private onConnectionStateChange: (state: RTCPeerConnectionState) => void;

  constructor(
    onRemoteStream: (stream: MediaStream) => void,
    onConnectionStateChange: (state: RTCPeerConnectionState) => void
  ) {
    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);
    this.onRemoteStream = onRemoteStream;
    this.onConnectionStateChange = onConnectionStateChange;
    this.setupPeerConnection();
  }

  private setupPeerConnection() {
    this.peerConnection.ontrack = ({ streams: [stream] }) => {
      this.remoteStream = stream;
      this.onRemoteStream(stream);
    };

    this.peerConnection.onconnectionstatechange = () => {
      this.onConnectionStateChange(this.peerConnection.connectionState);
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send the candidate to the remote peer
        // This will be implemented in the signaling service
      }
    };
  }

  async addLocalStream(stream: MediaStream) {
    this.localStream = stream;
    stream.getTracks().forEach(track => {
      if (this.localStream) {
        this.peerConnection.addTrack(track, this.localStream);
      }
    });
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
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit) {
    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  close() {
    this.peerConnection.close();
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
  }
}

export function useWebRTC(onRemoteStream: (stream: MediaStream) => void) {
  const peerConnection = useRef<WebRTCConnection | null>(null);

  useEffect(() => {
    return () => {
      if (peerConnection.current) {
        peerConnection.current.close();
      }
    };
  }, []);

  const initializeConnection = () => {
    peerConnection.current = new WebRTCConnection(
      onRemoteStream,
      (state) => {
        console.log('Connection state:', state);
      }
    );
  };

  const addLocalStream = async (stream: MediaStream) => {
    if (!peerConnection.current) {
      initializeConnection();
    }
    await peerConnection.current?.addLocalStream(stream);
  };

  const createOffer = async () => {
    return await peerConnection.current?.createOffer();
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    return await peerConnection.current?.handleOffer(offer);
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    await peerConnection.current?.handleAnswer(answer);
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    await peerConnection.current?.handleIceCandidate(candidate);
  };

  return {
    initializeConnection,
    addLocalStream,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
  };
}