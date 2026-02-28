
import { youtubeApiFetch, kv } from './_utils/apiKeyManager.js';
import { formatViewCount, formatPublishedAt, formatDuration } from './_utils/formatters.js';
import { parseISO8601Duration } from './_utils/parsers.js';

const SEARCH_TTL = 10 * 60; // 10 minutes in seconds

export default async function handler(request, response) {
    const { q, pageToken, maxResults = '15' } = request.query;
    if (!q) {
        response.setHeader('Content-Type', 'application/json');
        return response.status(400).send(JSON.stringify({ message: 'Search query (q) is required.' }));
    }

    const cacheKey = `v1:search:${q}:${pageToken || 'initial'}:${maxResults}`;

    try {
        const cachedData = await kv.get(cacheKey);
        if (cachedData) {
            console.log(`[KV CACHE HIT] for search: ${cacheKey}`);
            response.setHeader('Content-Type', 'application/json');
            return response.status(200).send(JSON.stringify(cachedData));
        }
        console.log(`[KV CACHE MISS] for search: ${cacheKey}`);

        const searchParams = {
            part: 'snippet',
            q,
            type: 'video',
            maxResults,
            ...(pageToken && { pageToken }),
        };
        const searchData: any = await youtubeApiFetch('/search', searchParams);
        const videoIds = (searchData.items || []).map((item) => item.id.videoId).join(',');
        
        if (!videoIds) {
            const emptyResult = { videos: [], nextPageToken: undefined };
            response.setHeader('Content-Type', 'application/json');
            return response.status(200).send(JSON.stringify(emptyResult));
        }

        const videosParams = {
            part: 'snippet,contentDetails,statistics',
            id: videoIds,
        };
        const videosData: any = await youtubeApiFetch('/videos', videosParams);
        const videoDetailsMap = new Map((videosData.items || []).map((item) => [item.id, item]));

        const videos = (searchData.items || []).map((item) => {
            const videoDetails: any = videoDetailsMap.get(item.id.videoId);
            if (!videoDetails) return null;
            return {
                id: item.id.videoId,
                title: item.snippet.title,
                thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
                channelName: item.snippet.channelTitle,
                viewCount: formatViewCount(parseInt(videoDetails.statistics.viewCount, 10)),
                publishedAt: formatPublishedAt(new Date(item.snippet.publishedAt)),
                duration: formatDuration(parseISO8601Duration(videoDetails.contentDetails.duration)),
            };
        }).filter(Boolean);

        const result = { videos, nextPageToken: searchData.nextPageToken };

        // Asynchronously set the cache without blocking the response
        kv.set(cacheKey, result, { ex: SEARCH_TTL }).catch(err => {
            console.error(`Failed to set KV cache for key "${cacheKey}":`, err);
        });

        response.setHeader('Content-Type', 'application/json');
        response.status(200).send(JSON.stringify(result));
    } catch (error: any) {
        response.setHeader('Content-Type', 'application/json');
        response.status(500).send(JSON.stringify({ message: error.message }));
    }
}
