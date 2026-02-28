
import { youtubeApiFetch, kv } from './_utils/apiKeyManager.js';
import { formatViewCount, formatPublishedAt, formatDuration } from './_utils/formatters.js';
import { parseISO8601Duration } from './_utils/parsers.js';

const DETAILS_TTL = 30 * 60; // 30 minutes in seconds

export default async function handler(request, response) {
    const { videoId } = request.query;
    if (!videoId) {
        response.setHeader('Content-Type', 'application/json');
        return response.status(400).send(JSON.stringify({ message: 'videoId is required.' }));
    }
    
    const cacheKey = `v1:details:${videoId}`;

    try {
        const cachedData = await kv.get(cacheKey);
        if (cachedData) {
            console.log(`[KV CACHE HIT] for details: ${cacheKey}`);
            response.setHeader('Content-Type', 'application/json');
            return response.status(200).send(JSON.stringify(cachedData));
        }
        console.log(`[KV CACHE MISS] for details: ${cacheKey}`);

        // Fetch Video Details
        const videoData: any = await youtubeApiFetch('/videos', {
            part: 'snippet,statistics,contentDetails',
            id: videoId
        });
        const videoItem = videoData.items?.[0];
        if (!videoItem) {
            response.setHeader('Content-Type', 'application/json');
            return response.status(404).send(JSON.stringify({ message: 'Video not found' }));
        }
        
        // Fetch Channel Image
        const channelId = videoItem.snippet.channelId;
        const channelData: any = await youtubeApiFetch('/channels', { part: 'snippet', id: channelId });
        const channelImage = channelData.items?.[0]?.snippet?.thumbnails?.default?.url;

        const videoDetails = {
            title: videoItem.snippet.title,
            description: videoItem.snippet.description,
            channelName: videoItem.snippet.channelTitle,
            viewCount: formatViewCount(parseInt(videoItem.statistics.viewCount, 10)),
            publishedAt: formatPublishedAt(new Date(videoItem.snippet.publishedAt)),
            channelImageUrl: channelImage,
            thumbnailUrl: videoItem.snippet.thumbnails.high?.url || videoItem.snippet.thumbnails.default.url,
            duration: formatDuration(parseISO8601Duration(videoItem.contentDetails.duration)),
            commentCount: parseInt(videoItem.statistics.commentCount, 10),
        };

        const result = { videoDetails };

        // Asynchronously set the cache without blocking the response
        kv.set(cacheKey, result, { ex: DETAILS_TTL }).catch(err => {
            console.error(`Failed to set KV cache for key "${cacheKey}":`, err);
        });

        response.setHeader('Content-Type', 'application/json');
        response.status(200).send(JSON.stringify(result));

    } catch (error: any) {
        response.setHeader('Content-Type', 'application/json');
        response.status(500).send(JSON.stringify({ message: error.message }));
    }
}
