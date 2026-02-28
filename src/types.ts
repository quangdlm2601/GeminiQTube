

export interface Video {
  id: string;
  title: string;
  thumbnailUrl: string;
  channelName: string;
  viewCount: string;
  publishedAt: string;
  duration: string;
  description?: string;
  channelImageUrl?: string;
  commentCount?: number;
}

export interface Comment {
  id: string;
  authorName: string;
  authorImageUrl: string;
  text: string;
  publishedAt: string;
  likeCount: number;
}