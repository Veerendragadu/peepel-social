import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface GoogleAdsProps {
  className?: string;
}

export function GoogleAds({ className = "" }: GoogleAdsProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const isAdLoaded = useRef(false);

  useEffect(() => {
    try {
      // Only push ad if window.adsbygoogle is defined and ad not already loaded
      if (window.adsbygoogle && !isAdLoaded.current && adRef.current) {
        window.adsbygoogle.push({});
        isAdLoaded.current = true;
      }
    } catch (error) {
      console.error('Error loading Google Ads:', error);
    }
  }, []);

  return (
    <div className={`relative bg-background/50 backdrop-blur-sm border border-white/10 rounded-xl p-4 overflow-hidden ${className}`}>
      <div ref={adRef}>
        <ins
          className="adsbygoogle w-full"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
          data-ad-slot="XXXXXXXXXX"
          data-ad-format="horizontal"
          data-full-width-responsive="false"
        />
      </div>
      
      {/* Animated Coming Soon Text */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-primary/20 to-secondary/20 backdrop-blur-sm">
        <div className="relative">
          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-white/60 animate-bounce">
            ✨
          </span>
          <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary animate-pulse">
            Coming Soon
          </h3>
          <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-[width_2s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}