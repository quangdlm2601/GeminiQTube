

import React from 'react';
import type { Comment } from '../types';
import { LikeIcon } from './icons/LikeIcon';
import { DislikeIcon } from './icons/DislikeIcon';
import DefaultAvatar from '../assets/default-avatar.svg';

interface CommentItemProps {
  comment: Comment;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
  const { authorName, authorImageUrl, publishedAt, text, likeCount } = comment;
  return (
    <div className="flex items-start space-x-4">
      <img 
        src={authorImageUrl} 
        alt={authorName} 
        className="w-10 h-10 rounded-full bg-youtube-dark-tertiary"
        onError={(e) => {
            if (e.currentTarget.src !== DefaultAvatar) {
                e.currentTarget.onerror = null; // prevent infinite loops
                e.currentTarget.src = DefaultAvatar;
            }
        }}
      />
      <div className="flex-grow">
        <div className="flex items-center space-x-2">
          <p className="font-semibold text-sm">{authorName}</p>
          <p className="text-xs text-youtube-text-secondary">{publishedAt}</p>
        </div>
        <p className="text-sm mt-1">{text}</p>
        <div className="flex items-center space-x-4 mt-2">
          <button className="flex items-center space-x-1.5 text-youtube-text-secondary hover:text-youtube-text-primary">
            <LikeIcon />
            <span className="text-xs">{likeCount > 0 ? likeCount : ''}</span>
          </button>
          <button className="text-youtube-text-secondary hover:text-youtube-text-primary">
            <DislikeIcon />
          </button>
          <button className="text-xs font-semibold text-youtube-text-secondary hover:text-youtube-text-primary">Reply</button>
        </div>
      </div>
    </div>
  );
};

export const CommentSkeleton: React.FC = () => (
    <div className="flex items-start space-x-4 animate-pulse">
        <div className="w-10 h-10 rounded-full bg-youtube-dark-tertiary"></div>
        <div className="flex-grow space-y-2">
            <div className="h-4 bg-youtube-dark-tertiary rounded w-1/3"></div>
            <div className="h-4 bg-youtube-dark-tertiary rounded w-full"></div>
            <div className="h-4 bg-youtube-dark-tertiary rounded w-2/3"></div>
        </div>
    </div>
);