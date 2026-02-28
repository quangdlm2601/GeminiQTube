export const formatViewCount = (count: number): string => {
    if (isNaN(count)) return '0 views';

    if (count >= 1_000_000_000) {
        return `${(count / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B views`;
    }
    if (count >= 1_000_000) {
        return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M views`;
    }
    if (count >= 1_000) {
        return `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}K views`;
    }
    return `${count} views`;
};

export const formatPublishedAt = (publishedDate: Date): string => {
    if (!publishedDate || isNaN(publishedDate.getTime())) return 'a moment ago';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - publishedDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';

    const years = Math.floor(diffInSeconds / 31536000);
    if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;

    const months = Math.floor(diffInSeconds / 2592000);
    if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
    
    const weeks = Math.floor(diffInSeconds / 604800);
    if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;

    const days = Math.floor(diffInSeconds / 86400);
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;

    const hours = Math.floor(diffInSeconds / 3600);
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;

    const minutes = Math.floor(diffInSeconds / 60);
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    
    return `just now`;
};

export const formatDuration = (totalSeconds: number): string => {
    if (isNaN(totalSeconds) || totalSeconds < 0) return '0:00';

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    const hStr = hours > 0 ? `${hours}:` : '';
    const mStr = (hours > 0 && minutes < 10) ? `0${minutes}` : `${minutes}`;
    const sStr = seconds < 10 ? `0${seconds}` : `${seconds}`;

    return `${hStr}${mStr}:${sStr}`;
};
