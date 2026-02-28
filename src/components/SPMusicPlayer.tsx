import React from 'react';
import type { Video } from '../types';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';
import { NextIcon } from './icons/NextIcon';
import { PreviousIcon } from './icons/PreviousIcon';
import { CloseIcon } from './icons/CloseIcon';

interface NativeMusicPlayerProps {
  track: Video;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

export const NativeMusicPlayer: React.FC<NativeMusicPlayerProps> = ({ track, isPlaying, onTogglePlay, onNext, onPrev, onClose }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-24 md:h-20 bg-youtube-dark-secondary border-t border-youtube-dark-tertiary z-50 flex items-center justify-between px-4 animate-fade-in">
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
