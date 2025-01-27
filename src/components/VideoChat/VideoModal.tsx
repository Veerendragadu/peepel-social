import React, { useState, useRef, useEffect } from 'react';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Camera } from 'lucide-react';

interface VideoChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VideoModal({ isOpen, onClose }: VideoChatModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  useEffect(() => {
    if (isOpen) {
      initializeCamera();
      setIsInitializing(true);
      setIsVideoReady(false);
    }
    return () => {
      cleanupMedia();
    };
  }, [isOpen]);

  // Update loading state when stream is ready
  useEffect(() => {
    if (localStream) {
      setTimeout(() => {
        setIsLoading(false);
        setIsInitializing(false);
      }, 1000);
    }
  }, [localStream]);

  // Handle video element events
  useEffect(() => {
    const videoElement = localVideoRef.current;
    if (!videoElement) return;

    const handleCanPlay = () => {
      console.log('Video can play');
      setIsVideoReady(true);
    };

    videoElement.addEventListener('canplay', handleCanPlay);
    return () => videoElement.removeEventListener('canplay', handleCanPlay);
  }, []);

  const initializeCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setIsVideoReady(false);

      // Wait for video element to be available
      let attempts = 0;
      while (!localVideoRef.current && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media devices not supported');
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log('Available devices:', devices);

      // Ensure video element exists before requesting stream
      if (!localVideoRef.current) {
        throw new Error('Video element not found');
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
      console.log('Video tracks:', stream.getVideoTracks());
      console.log('Audio tracks:', stream.getAudioTracks());

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
        const playPromise = await videoElement.play();
        console.log('Video playing successfully');
        setIsVideoReady(true);
      } catch (playError) {
        console.error('Error playing video:', playError);
        throw new Error('Failed to play video stream');
      }

      setLocalStream(stream);
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setError(getErrorMessage(error));
      setIsLoading(false);
    }
  };

  const cleanupMedia = () => {
    console.log('Cleaning up media...');
    if (localStream) {
      console.log('Stopping tracks...');
      localStream.getTracks().forEach(track => {
        console.log(`Stopping track: ${track.kind}`);
        track.stop();
      });
      setLocalStream(null);
    }
    if (localVideoRef.current) {
      console.log('Clearing video element');
      localVideoRef.current.srcObject = null;
    }
    setIsLoading(true);
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isVideoOff;
        setIsVideoOff(prev => !prev);
        console.log(`Video ${isVideoOff ? 'enabled' : 'disabled'}`);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(prev => !prev);
        console.log(`Audio ${isMuted ? 'enabled' : 'disabled'}`);
      }
    }
  };

  const getErrorMessage = (error: any): string => {
    console.log('Processing error:', error);
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
      <div className="w-full h-full max-w-6xl max-h-[90vh] relative">
        {isInitializing ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white">Initializing camera...</p>
            </div>
          </div>
        ) : (
          <div className="relative h-full flex flex-col">
            {/* Video Container */}
            <div ref={videoContainerRef} className="flex-1 flex items-center justify-center p-4">
              <div className="relative w-full h-full max-w-4xl mx-auto bg-black rounded-xl overflow-hidden shadow-lg border border-white/10">
                <video
                  key="localVideo"
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
                    <VideoOff className="w-12 h-12 text-white/50" />
                  </div>
                )}
                {(isLoading || !isVideoReady) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/50 to-transparent z-10">
              <div className="flex items-center justify-center space-x-6">
                <button
                  onClick={toggleAudio}
                  disabled={isLoading}
                  className={`p-4 rounded-full ${
                    isMuted ? 'bg-red-600' : 'bg-white/20'
                  } hover:bg-opacity-90 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isMuted ? (
                    <MicOff className="w-6 h-6 text-white" />
                  ) : (
                    <Mic className="w-6 h-6 text-white" />
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
                    <VideoOff className="w-6 h-6 text-white" />
                  ) : (
                    <Video className="w-6 h-6 text-white" />
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