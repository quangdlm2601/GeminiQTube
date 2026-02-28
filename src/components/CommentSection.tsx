
import React from 'react';
import type { Comment } from '../types';
import { CommentItem, CommentSkeleton } from './CommentItem';

interface CommentSectionProps {
  comments: Comment[];
  isLoading: boolean;
  isLoadingMore?: boolean;
  isMobile?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ comments, isLoading, isLoadingMore, isMobile, hasMore, onLoadMore }) => {
  return (
    <div>
      <div className="space-y-6">
        {isLoading && [...Array(5)].map((_, i) => <CommentSkeleton key={i} />)}
        {!isLoading && comments.map(comment => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
        {isLoadingMore && [...Array(3)].map((_, i) => <CommentSkeleton key={`loader-${i}`} />)}
      </div>
      {isMobile && hasMore && !isLoadingMore && (
        <div className="text-center mt-6">
            <button 
                onClick={onLoadMore} 
                className="bg-youtube-dark-secondary hover:bg-youtube-dark-tertiary text-youtube-text-primary font-semibold py-2 px-4 rounded-full transition-colors"
            >
                Show More Comments
            </button>
        </div>
      )}
    </div>
  );
};
