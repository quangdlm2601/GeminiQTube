
import React, { useState } from 'react';
import type { Video } from '../types';
import { LikeIcon } from './icons/LikeIcon';
import { DislikeIcon } from './icons/DislikeIcon';

interface VideoDetailProps {
  video: Video | null;
  isLoading: boolean;
}

export const VideoDetail: React.FC<VideoDetailProps> = ({ video, isLoading }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    if (isLoading) {
        return <VideoDetailSkeleton />;
    }

    if (!video) {
        return null;
    }

    const { title, viewCount, publishedAt, channelName, description, channelImageUrl } = video;

    return (
        <div className="mt-4 text-youtube-text-primary">
            <h1 className="text-xl font-bold">{title}</h1>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-2">
                <div className="flex items-center space-x-3">
                    {channelImageUrl && <img src={channelImageUrl} alt={channelName} className="w-10 h-10 rounded-full" />}
                    <div>
                        <p className="font-semibold">{channelName}</p>
                        <p className="text-xs text-youtube-text-secondary">1.23M subscribers</p>
                    </div>
                    <button className="bg-youtube-text-primary text-black font-semibold px-4 py-2 rounded-full text-sm ml-4 hover:bg-opacity-90">Subscribe</button>
                </div>
                <div className="flex items-center space-x-2 mt-3 sm:mt-0">
                    <div className="flex items-center bg-youtube-dark-secondary rounded-full">
                        <button className="flex items-center space-x-2 px-4 py-2 hover:bg-youtube-dark-tertiary rounded-l-full">
                            <LikeIcon />
                            <span>123K</span>
                        </button>
                        <div className="w-px h-6 bg-youtube-dark-tertiary"></div>
                        <button className="px-4 py-2 hover:bg-youtube-dark-tertiary rounded-r-full">
                            <DislikeIcon />
                        </button>
                    </div>
                </div>
            </div>

            <div className={`mt-4 bg-youtube-dark-secondary p-3 rounded-xl text-sm ${isExpanded ? '' : 'cursor-pointer'}`} onClick={() => !isExpanded && setIsExpanded(true)}>
                <div className="font-semibold flex space-x-2">
                    <p>{viewCount}</p>
                    <p>{publishedAt}</p>
                </div>
                <p className={`whitespace-pre-wrap mt-2 ${!isExpanded && 'line-clamp-2'}`}>
                    {description}
                </p>
                {description && description.length > 150 && (
                    <button onClick={() => setIsExpanded(!isExpanded)} className="font-semibold mt-2">
                        {isExpanded ? 'Show less' : '...more'}
                    </button>
                )}
            </div>
        </div>
    );
};

const VideoDetailSkeleton: React.FC = () => (
    <div className="mt-4 animate-pulse">
        <div className="h-7 bg-youtube-dark-tertiary rounded w-3/4"></div>
        <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-youtube-dark-tertiary"></div>
                <div className="space-y-2">
                    <div className="h-4 bg-youtube-dark-tertiary rounded w-28"></div>
                    <div className="h-3 bg-youtube-dark-tertiary rounded w-20"></div>
                </div>
            </div>
            <div className="h-10 bg-youtube-dark-tertiary rounded-full w-40"></div>
        </div>
        <div className="mt-4 bg-youtube-dark-secondary p-3 rounded-xl space-y-2">
            <div className="h-4 bg-youtube-dark-tertiary rounded w-1/2"></div>
            <div className="h-4 bg-youtube-dark-tertiary rounded"></div>
            <div className="h-4 bg-youtube-dark-tertiary rounded w-5/6"></div>
        </div>
    </div>
);
