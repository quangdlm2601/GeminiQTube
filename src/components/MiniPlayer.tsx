
import React, { useEffect, useRef, useState } from 'react';
import type { Video } from '../types';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';
import { CloseIcon } from './icons/CloseIcon';
import { ExpandIcon } from './icons/ExpandIcon';
import { ResizeHandleIcon } from './icons/ResizeHandleIcon';


declare global {
  interface Window {
    YT: any;
  }
}

interface MiniPlayerProps {
  video: Video;
  isPlaying: boolean;
  initialTime: number;
  onTogglePlay: () => void;
  onClose: () => void;
  onExpand: () => void;
  onStateChange: (state: Partial<{ currentTime: number; isPlaying: boolean; }>) => void;
  onVideoEnd: () => void;
  durationInSeconds: number;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ video, isPlaying, initialTime, onTogglePlay, onClose, onExpand, onStateChange, onVideoEnd, durationInSeconds }) => {
  const playerRef = useRef<any>(null);
  const propsRef = useRef({ onVideoEnd, isPlaying, onStateChange, durationInSeconds });
  propsRef.current = { onVideoEnd, isPlaying, onStateChange, durationInSeconds };
  
  const initialTimeRef = useRef(initialTime);
  initialTimeRef.current = initialTime;
  const videoEndedRef = useRef(false);

  const [width, setWidth] = useState(320); // Initial width for 16:9
  const resizeData = useRef<{ initialWidth: number; startX: number; } | null>(null);
  
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    resizeData.current = {
      initialWidth: width,
      startX: e.clientX,
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!resizeData.current) return;
    
    const dx = e.clientX - resizeData.current.startX;
    let newWidth = resizeData.current.initialWidth + dx;
    
    const minWidth = 240;
    const maxWidth = 560;
    
    if (newWidth < minWidth) newWidth = minWidth;
    if (newWidth > maxWidth) newWidth = maxWidth;

    setWidth(newWidth);
  };

  const handleMouseUp = () => {
    resizeData.current = null;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };
  
  useEffect(() => {
    setIsPlayerReady(false); // Reset readiness on video change
    videoEndedRef.current = false; // Reset ended flag on video change

    const onPlayerStateChange = (event: any) => {
      if (!playerRef.current) {
        return;
      }
      
      const state = event.data;
      const { onVideoEnd: latestOnVideoEnd, onStateChange: latestOnStateChange, isPlaying: latestIsPlaying } = propsRef.current;
      
      const playerState = window.YT.PlayerState;
      
      switch (state) {
        case playerState.PLAYING:
            if (!latestIsPlaying) {
                latestOnStateChange({ isPlaying: true });
            }
            break;
        case playerState.PAUSED:
            if (latestIsPlaying) {
                latestOnStateChange({ isPlaying: false });
            }
            break;
        case playerState.ENDED:
            if (!videoEndedRef.current) {
                videoEndedRef.current = true;
                if (latestIsPlaying) {
                    latestOnStateChange({ isPlaying: false });
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
        playerRef.current = new window.YT.Player('mini-player-container', {
            videoId: video.id,
            playerVars: {
                controls: 0,
                rel: 0,
                origin: window.location.origin,
            },
            events: {
                onReady: (event: any) => {
                    event.target.unMute();
                    event.target.seekTo(Math.floor(initialTimeRef.current), true);
                    setIsPlayerReady(true);
                },
                onStateChange: onPlayerStateChange,
            },
        });
    }

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
    
    return () => {
        if (playerRef.current && typeof playerRef.current.destroy === 'function') {
            playerRef.current.destroy();
            playerRef.current = null;
        }
    };
  }, [video.id]);

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

  useEffect(() => {
    const interval = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function' && isPlayerReady) {
            const currentTime = playerRef.current.getCurrentTime();
            if (currentTime >= 0) {
              propsRef.current.onStateChange({ currentTime });
            }

            // Robust autoplay fix: manually trigger end if near the duration
            const { durationInSeconds: currentDuration, onVideoEnd: latestOnVideoEnd } = propsRef.current;
            if (currentDuration > 0 && currentTime > 0 && !videoEndedRef.current) {
                if (currentDuration - currentTime <= 1) {
                    videoEndedRef.current = true;
                    console.log('Video end manually triggered by time check in MiniPlayer.');
                    latestOnVideoEnd();
                }
            }
        }
    }, 500);
    return () => clearInterval(interval);
  }, [isPlayerReady]);


  return (
    <div 
        className={`fixed bottom-4 right-4 max-w-[calc(100vw-2rem)] bg-black rounded-lg shadow-2xl z-50 animate-slide-in aspect-video`}
        style={{ width: `${width}px` }}
    >
        <div className="relative w-full h-full rounded-lg overflow-hidden group">
            {/* Player container - fills the space */}
            <div id="mini-player-container" className="w-full h-full" />
            
            {/* Clickable layer for expanding. Sits over the video area, leaving space for controls */}
            <div 
                className="absolute top-0 left-0 w-full h-[calc(100%-48px)] cursor-pointer"
                onClick={onExpand}
            >
                <div className="w-full h-full flex items-center justify-center bg-transparent group-hover:bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExpandIcon />
                </div>
            </div>

            {/* Controls Bar at the bottom */}
            <div className="absolute bottom-0 left-0 w-full h-12 p-2 bg-gradient-to-t from-black/80 via-black/50 to-transparent flex items-center justify-between z-10">
                 <div className="flex-grow overflow-hidden pr-2">
                    <p className="text-sm font-semibold text-youtube-text-primary truncate">{video.title}</p>
                    <p className="text-xs text-youtube-text-secondary truncate">{video.channelName}</p>
                 </div>
                 <div className="flex items-center space-x-1 flex-shrink-0">
                    <button onClick={onTogglePlay} className="text-youtube-text-primary hover:text-white">
                      {isPlaying ? <PauseIcon /> : <PlayIcon />}
                    </button>
                    <button onClick={onClose} className="text-youtube-text-secondary hover:text-white">
                        <CloseIcon />
                    </button>
                 </div>
            </div>

            {/* Resize Handle - on top of everything at the corner */}
            <div 
              onMouseDown={handleMouseDown}
              className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-20"
              title="Resize"
            >
                <ResizeHandleIcon />
            </div>
        </div>
    </div>
  );
};
