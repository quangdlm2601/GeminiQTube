
import React from 'react';
import type { Video } from '../types';
import { VideoItem } from './VideoItem';

interface VideoListProps {
  videos: Video[];
  onVideoSelect: (video: Video) => void;
  layout?: 'grid' | 'list';
  isLoading?: boolean;
  isLoadingMore?: boolean;
  currentVideoId?: string;
  onAddToQueue?: (video: Video) => void;
  onRemoveFromQueue?: (videoId: string) => void;
  isQueue?: boolean;
  onPlayMusic?: (video: Video, playlist: Video[]) => void;
}

export const VideoList: React.FC<VideoListProps> = ({ videos, onVideoSelect, layout = 'grid', isLoading = false, isLoadingMore = false, currentVideoId, onAddToQueue, onRemoveFromQueue, isQueue = false, onPlayMusic }) => {
  const containerClasses = layout === 'grid'
    ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8'
    : 'flex flex-col space-y-3';
    
  if (isLoading) {
      return (
        <div className={containerClasses}>
          {[...Array(layout === 'grid' ? 10 : 5)].map((_, index) => (
            <VideoItem key={index} onVideoSelect={() => {}} isLoading={true} layout={layout} />
          ))}
        </div>
      )
  }

  const handlePlayMusic = (video: Video) => {
    onPlayMusic?.(video, videos);
  };
  
  // FIX: Memoize a de-duplicated version of the videos array to prevent duplicate key errors and crashes.
  // This acts as a robust failsafe if the parent component's state management allows duplicates.
  const uniqueVideos = React.useMemo(() => {
    if (!videos || videos.length === 0) return [];
    return Array.from(new Map(videos.map(video => [video.id, video])).values());
  }, [videos]);

  return (
    <div className={containerClasses}>
      {uniqueVideos.map((video) => (
        <VideoItem 
          key={video.id} 
          video={video} 
          onVideoSelect={onVideoSelect} 
          layout={layout}
          isCurrent={video.id === currentVideoId}
          onAddToQueue={onAddToQueue}
          onRemoveFromQueue={onRemoveFromQueue}
          isQueueItem={isQueue}
          onPlayMusic={onPlayMusic ? handlePlayMusic : undefined}
        />
      ))}
      {isLoadingMore && [...Array(layout === 'grid' ? 5 : 2)].map((_, index) => (
        <VideoItem key={`loader-${index}`} onVideoSelect={() => {}} isLoading={true} layout={layout} />
      ))}
    </div>
  );
};
