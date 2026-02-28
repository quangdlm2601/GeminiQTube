import React from 'react';
import type { Video } from '../types';
import { AddToQueueIcon } from './icons/AddToQueueIcon';
import { RemoveIcon } from './icons/RemoveIcon';
import { PlayMusicIcon } from './icons/PlayMusicIcon';

interface VideoItemProps {
  video?: Video;
  onVideoSelect: (video: Video) => void;
  layout?: 'grid' | 'list';
  isLoading?: boolean;
  isCurrent?: boolean;
  onAddToQueue?: (video: Video) => void;
  onRemoveFromQueue?: (videoId: string) => void;
  isQueueItem?: boolean;
  onPlayMusic?: (video: Video) => void;
}

export const VideoItem: React.FC<VideoItemProps> = ({ video, onVideoSelect, layout = 'grid', isLoading = false, isCurrent = false, onAddToQueue, onRemoveFromQueue, isQueueItem = false, onPlayMusic }) => {
  if (isLoading || !video) {
    return layout === 'grid' ? <VideoGridSkeleton /> : <VideoListSkeleton />;
  }

  const { thumbnailUrl, duration, title, channelName, viewCount, publishedAt } = video;

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (video) onAddToQueue?.(video);
  };

  const handleRemoveFromQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (video) onRemoveFromQueue?.(video.id);
  };

  const handlePlayMusic = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (video) onPlayMusic?.(video);
  };
  
  const actionButtons = (
    <div className="flex flex-col items-center space-y-2">
        {isQueueItem && onRemoveFromQueue && (
            <button onClick={handleRemoveFromQueue} className="text-youtube-text-secondary hover:text-youtube-text-primary p-1" title="Remove from queue">
                <RemoveIcon />
            </button>
        )}
        {!isQueueItem && onAddToQueue && (
            <button onClick={handleAddToQueue} className="text-youtube-text-secondary hover:text-youtube-text-primary p-1" title="Add to queue">
                <AddToQueueIcon />
            </button>
        )}
        {!isQueueItem && onPlayMusic && (
            <button onClick={handlePlayMusic} className="text-youtube-text-secondary hover:text-youtube-text-primary p-1" title="Play music">
                <PlayMusicIcon />
            </button>
        )}
    </div>
  );

  if (layout === 'list') {
    return (
      <div 
        className={`group flex items-start space-x-3 cursor-pointer p-2 rounded-lg relative ${isCurrent ? 'bg-youtube-dark-tertiary' : 'hover:bg-youtube-dark-secondary'}`} 
        onClick={() => onVideoSelect(video)}
      >
        <div className="w-40 flex-shrink-0">
          <div className="relative aspect-video">
            <img src={thumbnailUrl} alt={title} className="rounded-lg w-full h-full object-cover" />
            <span className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1.5 py-0.5 rounded">
              {duration}
            </span>
          </div>
        </div>
        <div className="flex-grow pt-1">
          <h3 className="text-sm font-medium text-youtube-text-primary line-clamp-2">{title}</h3>
          <p className="text-xs text-youtube-text-secondary mt-1">{channelName}</p>
          <div className="text-xs text-youtube-text-secondary flex items-center">
            <span>{viewCount}</span>
            <span className="mx-1">•</span>
            <span>{publishedAt}</span>
          </div>
        </div>
        <div className="flex-shrink-0 pt-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          {actionButtons}
        </div>
      </div>
    );
  }

  return (
    <div className="cursor-pointer group" onClick={() => onVideoSelect(video)}>
      <div className="relative aspect-video">
        <img src={thumbnailUrl} alt={title} className="rounded-lg w-full h-full object-cover group-hover:rounded-none transition-all duration-200" />
        <span className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1.5 py-0.5 rounded">
          {duration}
        </span>
      </div>
      <div className="mt-2 flex items-start space-x-2">
        <div className="flex-grow">
          <h3 className="text-base font-medium text-youtube-text-primary line-clamp-2">{title}</h3>
          <p className="text-sm text-youtube-text-secondary mt-1">{channelName}</p>
          <div className="text-sm text-youtube-text-secondary flex items-center">
            <span>{viewCount}</span>
            <span className="mx-1">•</span>
            <span>{publishedAt}</span>
          </div>
        </div>
        <div className="flex-shrink-0 pt-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            {actionButtons}
        </div>
      </div>
    </div>
  );
};


const VideoGridSkeleton: React.FC = () => (
    <div className="animate-pulse">
      <div className="relative aspect-video bg-youtube-dark-tertiary rounded-lg"></div>
      <div className="mt-2 flex space-x-2">
        <div className="w-10 h-10 rounded-full bg-youtube-dark-tertiary flex-shrink-0"></div>
        <div className="flex-grow space-y-2">
          <div className="h-4 bg-youtube-dark-tertiary rounded"></div>
          <div className="h-4 bg-youtube-dark-tertiary rounded w-3/4"></div>
          <div className="h-3 bg-youtube-dark-tertiary rounded w-1/2"></div>
        </div>
      </div>
    </div>
);

const VideoListSkeleton: React.FC = () => (
  <div className="flex space-x-3 animate-pulse p-2">
    <div className="w-40 flex-shrink-0">
      <div className="relative aspect-video bg-youtube-dark-tertiary rounded-lg"></div>
    </div>
    <div className="flex-grow space-y-2">
      <div className="h-4 bg-youtube-dark-tertiary rounded"></div>
      <div className="h-4 bg-youtube-dark-tertiary rounded w-5/6"></div>
      <div className="h-3 bg-youtube-dark-tertiary rounded w-1/2"></div>
    </div>
  </div>
);