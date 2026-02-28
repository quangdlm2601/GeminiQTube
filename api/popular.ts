
import { youtubeApiFetch, kv } from './_utils/apiKeyManager.js';
import { formatViewCount, formatPublishedAt, formatDuration } from './_utils/formatters.js';
import { parseISO8601Duration } from './_utils/parsers.js';

const POPULAR_VIDEOS_TTL = 60 * 60; // 1 hour in seconds

export default async function handler(request, response) {
    const { pageToken } = request.query;
    const cacheKey = `v1:popular:${pageToken || 'initial'}`;

    try {
        const cachedData = await kv.get(cacheKey);
        if (cachedData) {
            console.log(`[KV CACHE HIT] for popular videos: ${cacheKey}`);
            response.setHeader('Content-Type', 'application/json');
            return response.status(200).send(JSON.stringify(cachedData));
        }
        console.log(`[KV CACHE MISS] for popular videos: ${cacheKey}`);

        const params = {
            part: 'snippet,contentDetails,statistics',
            chart: 'mostPopular',
            regionCode: 'US', // Using a major region for broad results
            maxResults: '20',
            ...(pageToken && { pageToken }),
        };
        const data: any = await youtubeApiFetch('/videos', params);
        
        const videos = (data.items || []).map((item: any) => ({
            id: item.id,
            title: item.snippet.title,
            thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
            channelName: item.snippet.channelTitle,
            viewCount: formatViewCount(parseInt(item.statistics.viewCount, 10)),
            publishedAt: formatPublishedAt(new Date(item.snippet.publishedAt)),
            duration: formatDuration(parseISO8601Duration(item.contentDetails.duration)),
        }));
        
        const result = { videos, nextPageToken: data.nextPageToken };

        // Asynchronously set the cache without blocking the response
        kv.set(cacheKey, result, { ex: POPULAR_VIDEOS_TTL }).catch(err => {
            console.error(`Failed to set KV cache for key "${cacheKey}":`, err);
        });

        response.setHeader('Content-Type', 'application/json');
        response.status(200).send(JSON.stringify(result));
    } catch (error: any) {
        response.setHeader('Content-Type', 'application/json');
        response.status(500).send(JSON.stringify({ message: error.message }));
    }
}
