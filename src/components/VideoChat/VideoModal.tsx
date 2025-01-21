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
  const [participants, setParticipants] = useState<{ id: string; stream: MediaStream }[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const { 
    initializeConnection,
    addLocalStream,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate
  } = useWebRTC((stream) => {
    // Handle remote stream
    setParticipants(prev => [...prev, { id: 'remote', stream }]);
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
          if (localStreamRef.current) {
            await addLocalStream(localStreamRef.current);
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

      // Check if permissions are already granted
      const permissions = await navigator.mediaDevices.enumerateDevices();
      const hasVideoPermission = permissions.some(device => device.kind === 'videoinput' && device.label);
      const hasAudioPermission = permissions.some(device => device.kind === 'audioinput' && device.label);

      if (!hasVideoPermission || !hasAudioPermission) {
        // Request permissions explicitly
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      }

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
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
          aspectRatio: { ideal: 16/9 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Store stream reference
      localStreamRef.current = stream;

      // Set up local video immediately
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true; // Mute local video to prevent feedback
        
        // Play the video
        try {
          await localVideoRef.current.play();
        } catch (error) {
          console.error('Error playing local video:', error);
          throw error;
        }
      }

      // Update participants
      setParticipants([{ id: 'local', stream }]);
      
      // Short delay before marking as connected
      setTimeout(() => {
        setIsConnecting(false);
      }, 500);

    } catch (error) {
      console.error('Error accessing media devices:', error);
      handleMediaError(error);
      throw error;
    }
  };

  const cleanupMedia = () => {
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
    }

    // Clear video element
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    // Reset state
    localStreamRef.current = null;
    setParticipants([]);
    setIsConnecting(true);
    setHasError(false);
    setErrorMessage('');
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoOff;
        setIsVideoOff(!isVideoOff);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
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

  const getGridLayout = () => {
    const count = participants.length;
    if (count <= 1) return 'grid-cols-1';
    if (count === 2) return 'md:grid-cols-2';
    if (count === 3) return 'md:grid-cols-3';
    return 'md:grid-cols-2';
  };

  const getVideoBorderStyle = (participantId: string) => {
    const count = participants.length;
    if (count > 1) {
      return 'border-2 border-red-500';
    }
    return 'border border-white/10';
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
            <div className={`flex-1 grid ${getGridLayout()} gap-4 p-4`}>
              {participants.map((participant) => (
                <div 
                  key={participant.id} 
                  className={`relative aspect-video bg-black rounded-xl overflow-hidden shadow-lg ${getVideoBorderStyle(participant.id)}`}
                >
                  <video
                    ref={participant.id === 'local' ? localVideoRef : undefined}
                    autoPlay
                    playsInline
                    muted={participant.id === 'local'}
                    className={`w-full h-full object-cover ${
                      participant.id === 'local' ? 'transform scale-x-[-1]' : ''
                    }`}
                  />
                  {participant.id === 'local' && isVideoOff && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <VideoOff className="w-12 h-12 text-white/50" />
                    </div>
                  )}
                </div>
              ))}
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