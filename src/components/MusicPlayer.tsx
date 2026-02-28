import React, { useEffect, useRef } from 'react';
import type { Video } from '../types';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';
import { NextIcon } from './icons/NextIcon';
import { PreviousIcon } from './icons/PreviousIcon';
import { CloseIcon } from './icons/CloseIcon';


declare global {
  interface Window {
    YT: any;
  }
}

interface MusicPlayerProps {
  track: Video;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  onTrackEnd: () => void;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ track, isPlaying, onTogglePlay, onNext, onPrev, onClose, onTrackEnd }) => {
  const playerRef = useRef<any>(null);
  const onTrackEndRef = useRef(onTrackEnd);
  
  useEffect(() => {
    onTrackEndRef.current = onTrackEnd;
  }, [onTrackEnd]);

  useEffect(() => {
    const onPlayerStateChange = (event: any) => {
      if (event.data === window.YT.PlayerState.ENDED) {
        onTrackEndRef.current();
      }
    };
    
    const setupPlayer = () => {
        if (playerRef.current && typeof playerRef.current.destroy === 'function') {
          playerRef.current.destroy();
        }
        playerRef.current = new window.YT.Player('music-player', {
            height: '1',
            width: '1',
            videoId: track.id,
            playerVars: {
                autoplay: 1,
                controls: 0,
            },
            events: {
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
  }, [track.id]);

  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
      if (isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    }
  }, [isPlaying, track.id]);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-youtube-dark-secondary border-t border-youtube-dark-tertiary z-50 flex items-center justify-between px-4">
      {/* Hidden player div */}
      <div className="absolute top-[-1px] left-[-1px] w-0 h-0">
        <div id="music-player"></div>
      </div>
      
      <div className="flex items-center space-x-4 w-1/3">
        <img src={track.thumbnailUrl} alt={track.title} className="w-14 h-14 rounded-md object-cover" />
        <div>
          <p className="text-sm font-semibold text-youtube-text-primary line-clamp-1">{track.title}</p>
          <p className="text-xs text-youtube-text-secondary line-clamp-1">{track.channelName}</p>
        </div>
      </div>
      
      <div className="flex items-center justify-center space-x-4 w-1/3">
        <button onClick={onPrev} className="text-youtube-text-primary hover:text-white"><PreviousIcon /></button>
        <button onClick={onTogglePlay} className="text-youtube-text-primary hover:text-white p-2 bg-youtube-dark-tertiary rounded-full">
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button onClick={onNext} className="text-youtube-text-primary hover:text-white"><NextIcon /></button>
      </div>
      
      <div className="w-1/3 flex justify-end">
         <button onClick={onClose} className="text-youtube-text-secondary hover:text-white"><CloseIcon /></button>
      </div>
    </div>
  );
};