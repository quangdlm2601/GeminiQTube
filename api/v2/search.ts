
import { getYouTubei } from '../_utils/youtubei.js';
import { formatViewCount, formatPublishedAt, formatDuration } from '../_utils/formatters.js';

export default async function handler(request, response) {
    const { q, pageToken } = request.query;

    if (!q) {
        response.setHeader('Content-Type', 'application/json');
        return response.status(400).send(JSON.stringify({ message: 'Search query (q) is required.' }));
    }

    try {
        const youtubei = await getYouTubei();
        let searchResult;
        
        if (pageToken) {
            // If we have a pageToken (continuation token), use it to get the next page
            const continuation = await youtubei.getSearchContinuation(pageToken as string);
            searchResult = continuation;
        } else {
            // Otherwise, perform a new search
            searchResult = await youtubei.search(q as string, { type: 'video' });
        }
        
        const videos = (searchResult.videos || []).map((video) => {
            if (video.type !== 'Video') return null;
            return {
                id: video.id,
                title: video.title.text || 'Untitled',
                thumbnailUrl: video.thumbnails[video.thumbnails.length - 1]?.url,
                channelName: video.author?.name || 'Unknown Channel',
                viewCount: video.view_count ? formatViewCount(video.view_count) : '0 views',
                publishedAt: video.published?.text || 'some time ago',
                duration: video.duration ? formatDuration(video.duration.seconds) : '0:00',
            };
        }).filter(Boolean);

        const result = {
            videos,
            nextPageToken: searchResult.continuation,
        };

        response.setHeader('Content-Type', 'application/json');
        response.status(200).send(JSON.stringify(result));

    } catch (error: any) {
        console.error(`Error in /api/v2/search for query "${q}":`, error);
        response.setHeader('Content-Type', 'application/json');
        response.status(500).send(JSON.stringify({ message: error.message || 'An unknown error occurred.' }));
    }
}