
import React, { useEffect, useRef, useState } from 'react';
import type { Video } from '../types';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

interface VideoPlayerProps {
  video: Video | null;
  onVideoEnd: () => void;
  isPlaying: boolean;
  onPlaybackStateChange: (state: Partial<{ currentTime: number, isPlaying: boolean }>) => void;
  initialTime?: number;
  durationInSeconds?: number;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, onVideoEnd, isPlaying, onPlaybackStateChange, initialTime = 0, durationInSeconds = 0 }) => {
  const playerRef = useRef<any>(null);
  const propsRef = useRef({ onVideoEnd, isPlaying, onPlaybackStateChange, durationInSeconds });
  propsRef.current = { onVideoEnd, isPlaying, onPlaybackStateChange, durationInSeconds };
  
  const initialTimeRef = useRef(initialTime);
  initialTimeRef.current = initialTime;
  const videoEndedRef = useRef(false);

  const [isPlayerReady, setIsPlayerReady] = useState(false);

  useEffect(() => {
    setIsPlayerReady(false); // Reset readiness on video change
    videoEndedRef.current = false; // Reset ended flag on video change

    const onPlayerStateChange = (event: any) => {
      if (!playerRef.current) {
        return;
      }

      const state = event.data;
      const { onVideoEnd: latestOnVideoEnd, onPlaybackStateChange: latestOnPlaybackStateChange, isPlaying: latestIsPlaying } = propsRef.current;
      
      const playerState = window.YT.PlayerState;

      switch (state) {
        case playerState.PLAYING:
            if (!latestIsPlaying) {
                latestOnPlaybackStateChange({ isPlaying: true });
            }
            break;
        case playerState.PAUSED:
            if (latestIsPlaying) {
                latestOnPlaybackStateChange({ isPlaying: false });
            }
            break;
        case playerState.ENDED:
            if (!videoEndedRef.current) {
                videoEndedRef.current = true;
                if (latestIsPlaying) {
                    latestOnPlaybackStateChange({ isPlaying: false });
                }
                latestOnVideoEnd();
            }
            break;
      }
    };

    const setupPlayer = () => {
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
      }
      playerRef.current = new window.YT.Player('youtube-player-container', {
        videoId: video!.id,
        playerVars: {
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onStateChange: onPlayerStateChange,
          onReady: (event: any) => {
            event.target.seekTo(Math.floor(initialTimeRef.current), true);
            setIsPlayerReady(true);
          },
        },
      });
    };
    
    if (video) {
      if (!window.YT || !window.YT.Player) {
        const interval = setInterval(() => {
            if (window.YT && window.YT.Player) {
                clearInterval(interval);
                setupPlayer();
            }
        }, 100);
      } else {
        setupPlayer();
      }
    }

    return () => {
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
      }
      playerRef.current = null;
    };
  }, [video?.id]);

  // This effect is the single source of truth for translating the app's `isPlaying` intent into player actions.
  useEffect(() => {
    if (!isPlayerReady || !playerRef.current || typeof playerRef.current.playVideo !== 'function') {
      return;
    }
    
    if (isPlaying) {
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  }, [isPlaying, isPlayerReady]);

  // This effect continuously reports the current time back to the parent and handles manual end detection.
  useEffect(() => {
    const interval = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function' && isPlayerReady) {
            const currentTime = playerRef.current.getCurrentTime();
            if (currentTime >= 0) {
              propsRef.current.onPlaybackStateChange({ currentTime });
            }

            // Robust autoplay fix: manually trigger end if near the duration
            const { durationInSeconds: currentDuration, onVideoEnd: latestOnVideoEnd } = propsRef.current;
            if (currentDuration > 0 && currentTime > 0 && !videoEndedRef.current) {
                if (currentDuration - currentTime <= 1) {
                    videoEndedRef.current = true;
                    console.log('Video end manually triggered by time check.');
                    latestOnVideoEnd();
                }
            }
        }
    }, 500);
    return () => clearInterval(interval);
  }, [isPlayerReady]);


  if (!video) {
    return (
      <div className="aspect-video bg-youtube-dark-secondary rounded-xl flex items-center justify-center animate-pulse">
        <p className="text-youtube-text-secondary">Loading video...</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
      <div id="youtube-player-container" className="w-full h-full" />
    </div>
  );
};
