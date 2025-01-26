import React, { useState, useRef, useEffect } from 'react';
import { Video, VideoOff, Mic, MicOff, PhoneOff, SkipForward, Camera } from 'lucide-react';
import { useWebRTC } from '../../services/webrtcService';
import { signalingService } from '../../services/signalingService';

interface VideoChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMeetingStranger?: boolean;
  maxParticipants?: number;
}

export function VideoModal({ isOpen, onClose, isMeetingStranger = false, maxParticipants = 4 }: VideoChatModalProps) {
  const [isConnecting, setIsConnecting] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const { 
    initializeConnection,
    addLocalStream,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate
  } = useWebRTC((remoteStream) => {
    // Handle remote stream
    setRemoteStream(remoteStream);
  });

  useEffect(() => {
    if (isOpen) {
      requestMediaPermissions();
      signalingService.connect();
      signalingService.onMessage(handleSignalingMessage);
    }
    return () => {
      cleanupMedia();
      signalingService.disconnect();
    };
  }, [isOpen]);

  const handleSignalingMessage = async (data: any) => {
    try {
      switch (data.type) {
        case 'peer_found':
          // Initialize WebRTC connection when peer is found
          initializeConnection();
          if (localStream) {
            await addLocalStream(localStream);
          }
          // Create and send offer if we're the initiator
          if (data.initiator) {
            const offer = await createOffer();
            if (offer) {
              signalingService.sendOffer(data.peerId, offer);
            }
          }
          break;

        case 'offer':
          // Handle incoming offer
          const answer = await handleOffer(data.offer);
          if (answer) {
            signalingService.sendAnswer(data.peerId, answer);
          }
          break;

        case 'answer':
          // Handle incoming answer
          await handleAnswer(data.answer);
          break;

        case 'ice-candidate':
          // Handle incoming ICE candidate
          await handleIceCandidate(data.candidate);
          break;
      }
    } catch (error) {
      console.error('Error handling signaling message:', error);
    }
  };

  const requestMediaPermissions = async () => {
    try {
      setIsConnecting(true);
      setHasError(false);
      setErrorMessage('');

      await initializeMedia();
    } catch (error) {
      console.error('Permission error:', error);
      handleMediaError(error);
    }
  };

  const handleMediaError = (error: any) => {
    setHasError(true);
    setIsConnecting(false);

    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      setErrorMessage('Camera and microphone access denied. Please allow access to use video chat.');
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      setErrorMessage('No camera or microphone found. Please connect a device and try again.');
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      setErrorMessage('Could not access your camera or microphone. Please make sure no other app is using them.');
    } else {
      setErrorMessage('An error occurred while setting up video chat. Please try again.');
    }
  };

  const initializeMedia = async () => {
    try {
      // Stop any existing streams first
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        localVideoRef.current.srcObject = null;
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
      // Store stream in state
      setLocalStream(stream);

      // Set up local video immediately
      if (localVideoRef.current) {
        console.log('Setting up local video element...');
        // Ensure video element is properly configured
        localVideoRef.current.playsInline = true;
        localVideoRef.current.autoplay = true;
        localVideoRef.current.muted = true;
        localVideoRef.current.srcObject = stream;
        
        try {
          await localVideoRef.current.play();
          console.log('Local video playback started');
        } catch (error) {
          console.error('Error playing local video:', error);
          throw error;
        }
      }

      // Short delay before marking as connected
      setTimeout(() => {
        setIsConnecting(false);
      }, 1000);

    } catch (error) {
      console.error('Error accessing media devices:', error);
      handleMediaError(error);
      throw error;
    }
  };

  const cleanupMedia = () => {
    // Stop all tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
      });
    }

    // Clear video element
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    setIsConnecting(true);
    setHasError(false);
    setErrorMessage('');
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoOff;
        setIsVideoOff(!isVideoOff);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  const handleSkip = () => {
    setIsSkipping(true);
    // Clean up current connection
    cleanupMedia();
    // Find new peer
    signalingService.findPeer();
    setTimeout(() => {
      setIsSkipping(false);
    }, 2000);
  };

  if (!isOpen) return null;

  if (hasError) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center p-6 max-w-md">
          <div className="mb-6 flex justify-center">
            <Camera className="w-12 h-12 text-red-500" />
          </div>
          <h3 className="text-xl text-white mb-4">Camera Access Required</h3>
          <p className="text-white/60 mb-6">{errorMessage}</p>
          <div className="space-y-4">
            <button
              onClick={requestMediaPermissions}
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
    <div className="fixed inset-0 bg-black z-50">
      <div ref={containerRef} className="h-full relative">
        {isConnecting ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white">Connecting to {isMeetingStranger ? 'a stranger' : 'chat room'}...</p>
            </div>
          </div>
        ) : (
          <div className="relative h-full flex flex-col">
            {/* Videos Grid */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              {/* Local Video */}
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-lg border border-white/10">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                  {isVideoOff && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <VideoOff className="w-12 h-12 text-white/50" />
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 text-xs text-white/60 bg-black/50 px-2 py-1 rounded">
                    Your Video
                  </div>
              </div>
              
              {/* Remote Video */}
              {remoteStream && (
                <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-lg border border-white/10">
                  <video
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                    srcObject={remoteStream}
                  />
                </div>
              )}
            </div>

            {/* Control Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/50 to-transparent">
              <div className="flex items-center justify-center space-x-6">
                <button
                  onClick={toggleAudio}
                  className={`p-4 rounded-full ${
                    isMuted ? 'bg-red-600' : 'bg-white/20'
                  } hover:bg-opacity-90 transition-all transform hover:scale-105 active:scale-95`}
                >
                  {isMuted ? (
                    <MicOff className="w-6 h-6 text-white" />
                  ) : (
                    <Mic className="w-6 h-6 text-white" />
                  )}
                </button>

                <button
                  onClick={toggleVideo}
                  className={`p-4 rounded-full ${
                    isVideoOff ? 'bg-red-600' : 'bg-white/20'
                  } hover:bg-opacity-90 transition-all transform hover:scale-105 active:scale-95`}
                >
                  {isVideoOff ? (
                    <VideoOff className="w-6 h-6 text-white" />
                  ) : (
                    <Video className="w-6 h-6 text-white" />
                  )}
                </button>

                {isMeetingStranger && (
                  <button
                    onClick={handleSkip}
                    disabled={isSkipping}
                    className="p-4 rounded-full bg-yellow-600 hover:bg-opacity-90 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <SkipForward className="w-6 h-6 text-white" />
                  </button>
                )}

                <button
                  onClick={() => {
                    cleanupMedia();
                    onClose();
                  }}
                  className="p-4 rounded-full bg-red-600 hover:bg-opacity-90 transition-all transform hover:scale-105 active:scale-95"
                >
                  <PhoneOff className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}