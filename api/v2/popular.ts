
import { getYouTubei } from '../_utils/youtubei.js';
import { formatViewCount, formatPublishedAt, formatDuration } from '../_utils/formatters.js';

export default async function handler(request, response) {
    const { pageToken } = request.query;
    try {
        const youtubei = await getYouTubei();
        let feed;

        if (pageToken) {
            // Use the generic continuation method for pagination
            feed = await youtubei.getContinuation(pageToken as string);
        } else {
            // FIX: Replaced youtubei.getTrending() with youtubei.getHomeFeed() to resolve a 400 Bad Request error.
            feed = await youtubei.getHomeFeed();
        }
        
        const videos = (feed.videos || []).map((video) => {
            if (video.type !== 'Video') return null;
            return {
                id: video.id,
                title: video.title.text || 'Untitled',
                thumbnailUrl: video.thumbnails[video.thumbnails.length - 1]?.url,
                channelName: video.author?.name || 'Unknown Channel',
                viewCount: formatViewCount(video.view_count || 0),
                publishedAt: video.published?.text || 'some time ago',
                duration: formatDuration(video.duration.seconds),
            };
        }).filter(Boolean);

        const result = {
            videos,
            nextPageToken: feed.continuation,
        };

        response.setHeader('Content-Type', 'application/json');
        response.status(200).send(JSON.stringify(result));
    } catch (error: any) {
        console.error("Error in /api/v2/popular:", error);
        response.setHeader('Content-Type', 'application/json');
        response.status(500).send(JSON.stringify({ message: error.message || 'An unknown error occurred.' }));
    }
}
