import React, { useState, useRef, useEffect } from 'react';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Camera, Loader2, Users } from 'lucide-react';
import { signalingService } from '../../services/signalingService';
import { useWebRTC } from '../../services/webrtcService';

interface StrangerVideoChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StrangerVideoChat({ isOpen, onClose }: StrangerVideoChatProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const { initialize: initializeWebRTC, webrtc, connectionState } = useWebRTC((stream) => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
    }
  });

  useEffect(() => {
    if (isOpen) {
      initializeCamera();
      setupSignaling();
    }
    return () => {
      cleanupMedia();
      signalingService.disconnect();
    };
  }, [isOpen]);

  const setupSignaling = () => {
    signalingService.onMessage((data) => {
      console.log('Received signaling message:', data.type);
      switch (data.type) {
        case 'connected':
          console.log('Connected to signaling server');
          break;
        case 'peer_found':
          console.log('Peer found:', data.peerId);
          setPeerId(data.peerId);
          setIsSearching(false);
          if (data.initiator && webrtc) {
            console.log('Initiating connection as caller');
            handleInitiateConnection();
          }
          break;
        case 'offer':
          if (webrtc) {
            handleReceiveOffer(data.data);
          }
          break;
        case 'answer':
          if (webrtc) {
            webrtc.handleAnswer(data.data);
          }
          break;
        case 'ice-candidate':
          if (webrtc) {
            webrtc.handleIceCandidate(data.data);
          }
          break;
        case 'peer_disconnected':
          handlePeerDisconnect();
          retryConnection();
          break;
      }
    });

    signalingService.connect();
  };

  const handleInitiateConnection = async () => {
    if (!webrtc || !localStream) return;
    console.log('Adding local stream to connection');
    await webrtc.addLocalStream(localStream);
    const offer = await webrtc.createOffer();
    if (offer && peerId) {
      console.log('Sending offer to peer');
      signalingService.send({
        type: 'offer',
        peerId,
        offer
      });
    }
  };

  const handleReceiveOffer = async (offer: RTCSessionDescriptionInit) => {
    if (!webrtc || !localStream) return;
    console.log('Received offer, adding local stream');
    await webrtc.addLocalStream(localStream);
    const answer = await webrtc.handleOffer(offer);
    if (answer && peerId) {
      console.log('Sending answer to peer');
      signalingService.send({
        type: 'answer',
        peerId,
        answer
      });
    }
  };

  const retryConnection = () => {
    if (retryCount < maxRetries) {
      console.log(`Retrying connection (${retryCount + 1}/${maxRetries})`);
      setRetryCount(prev => prev + 1);
      // Short delay before retry
      setTimeout(() => {
        startSearching();
      }, 1000);
    } else {
      console.log('Max retries reached');
      setError('Connection failed after multiple attempts. Please try again.');
      setIsSearching(false);
    }
  };

  const handlePeerDisconnect = () => {
    setPeerId(null);
    setIsSearching(false);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  const startSearching = () => {
    console.log('Starting peer search');
    setIsSearching(true);
    initializeWebRTC();
    setRetryCount(0);
    signalingService.send({ type: 'find_peer' });
  };
  const initializeCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setIsVideoReady(false);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media devices not supported');
      }

      console.log('Requesting media stream...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          facingMode: "user",
          aspectRatio: { ideal: 16/9 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log('Media stream obtained:', stream);

      // Get video element
      const videoElement = localVideoRef.current;
      if (!videoElement) {
        throw new Error('Video element not found');
      }

      // Set up video element
      videoElement.srcObject = stream;
      videoElement.playsInline = true;
      videoElement.muted = true; // Important: keep muted to avoid feedback
      videoElement.autoplay = true;

      // Explicitly play the video
      try {
        console.log('Attempting to play video...');
        await videoElement.play();
        console.log('Video playing successfully');
        setIsVideoReady(true);
      } catch (playError) {
        console.error('Error playing video:', playError);
        throw new Error('Failed to play video stream');
      }

      setLocalStream(stream);
      setIsLoading(false);
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setError(getErrorMessage(error));
      setIsLoading(false);
    }
  };

  const cleanupMedia = () => {
    console.log('Cleaning up media streams...');
    if (localStream) {
      localStream.getTracks().forEach(track => {
        console.log(`Stopping track: ${track.kind}`);
        track.stop();
        track.enabled = false;
      });
      setLocalStream(null);
    }
    if (localVideoRef.current) {
      console.log('Clearing local video element');
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      console.log('Clearing remote video element');
      remoteVideoRef.current.srcObject = null;
    }
    setIsLoading(true);
    setIsVideoReady(false);
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isVideoOff;
        setIsVideoOff(prev => !prev);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(prev => !prev);
      }
    }
  };

  const getErrorMessage = (error: any): string => {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return 'Camera and microphone access denied. Please allow access to use video chat.';
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      return 'No camera or microphone found. Please connect a device and try again.';
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      return 'Could not access your camera or microphone. Please make sure no other app is using them.';
    }
    return `An error occurred while setting up video chat: ${error.message || 'Unknown error'}`;
  };

  if (!isOpen) return null;

  if (error) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center p-6 max-w-md">
          <div className="mb-6 flex justify-center">
            <Camera className="w-12 h-12 text-red-500" />
          </div>
          <h3 className="text-xl text-white mb-4">Camera Access Required</h3>
          <p className="text-white/60 mb-6">{error}</p>
          <div className="space-y-4">
            <button
              onClick={initializeCamera}
              className="w-full px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={onClose}
              className="w-full px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="w-full h-full relative">
        <div className="relative h-full flex flex-col">
          {/* Video Container */}
          <div className="flex-1 flex items-center justify-center p-2 sm:p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 w-full h-full max-w-6xl mx-auto">
              {/* Local Video */}
              <div className="relative bg-black rounded-lg sm:rounded-xl overflow-hidden shadow-lg border border-white/10 h-[30vh] md:h-full">
                <video
                  ref={localVideoRef}
                  playsInline
                  muted
                  autoPlay
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    isVideoReady ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ transform: 'scaleX(-1)' }}
                />
                {isVideoOff && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <VideoOff className="w-8 h-8 sm:w-12 sm:h-12 text-white/50" />
                  </div>
                )}
                {(isLoading || !isVideoReady) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="w-8 h-8 sm:w-12 sm:h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              
              {/* Remote Video */}
              <div className="relative bg-black rounded-lg sm:rounded-xl overflow-hidden shadow-lg border border-white/10 h-[30vh] md:h-full">
                <video
                  ref={remoteVideoRef}
                  playsInline
                  autoPlay
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  {isSearching ? (
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 sm:w-12 sm:h-12 text-primary animate-spin mx-auto mb-2 sm:mb-4" />
                      <p className="text-white/60 text-sm sm:text-base">
                        {connectionState === 'connecting' ? 'Connecting...' : 'Searching for peer...'}
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={startSearching}
                      className="px-4 sm:px-6 py-2 sm:py-3 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity flex items-center space-x-2 text-sm sm:text-base"
                    >
                      <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Find Someone</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black via-black/50 to-transparent z-10">
            <div className="flex items-center justify-center space-x-4 sm:space-x-6">
              <button
                onClick={toggleAudio}
                disabled={isLoading}
                className={`p-4 rounded-full ${
                  isMuted ? 'bg-red-600' : 'bg-white/20'
                } hover:bg-opacity-90 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isMuted ? (
                  <MicOff className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                ) : (
                  <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                )}
              </button>

              <button
                onClick={toggleVideo}
                disabled={isLoading}
                className={`p-4 rounded-full ${
                  isVideoOff ? 'bg-red-600' : 'bg-white/20'
                } hover:bg-opacity-90 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isVideoOff ? (
                  <VideoOff className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                ) : (
                  <Video className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                )}
              </button>

              <button
                onClick={() => {
                  cleanupMedia();
                  onClose();
                }}
                disabled={isLoading}
                className="p-4 rounded-full bg-red-600 hover:bg-opacity-90 transition-all transform hover:scale-105 active:scale-95"
              >
                <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}