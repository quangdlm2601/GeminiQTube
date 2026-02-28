
import { youtubeApiFetch, kv } from './_utils/apiKeyManager.js';
import { formatPublishedAt } from './_utils/formatters.js';

const COMMENTS_TTL = 5 * 60; // 5 minutes in seconds

export default async function handler(request, response) {
    const { videoId, pageToken } = request.query;
    if (!videoId) {
        response.setHeader('Content-Type', 'application/json');
        return response.status(400).send(JSON.stringify({ message: 'videoId is required.' }));
    }

    const cacheKey = `v1:comments:${videoId}:${pageToken || 'initial'}`;

    try {
        const cachedData = await kv.get(cacheKey);
        if (cachedData) {
            console.log(`[KV CACHE HIT] for V1 comments: ${cacheKey}`);
            response.setHeader('Content-Type', 'application/json');
            return response.status(200).send(JSON.stringify(cachedData));
        }
        console.log(`[KV CACHE MISS] for V1 comments: ${cacheKey}`);

        const params = {
            part: 'snippet',
            videoId,
            order: 'relevance',
            maxResults: '20',
            ...(pageToken && { pageToken }),
        };

        const data: any = await youtubeApiFetch('/commentThreads', params);

        const comments = (data.items || []).map((item: any) => {
            const snippet = item.snippet.topLevelComment.snippet;
            return {
                id: item.snippet.topLevelComment.id,
                authorName: snippet.authorDisplayName,
                authorImageUrl: snippet.authorProfileImageUrl,
                text: snippet.textDisplay,
                publishedAt: formatPublishedAt(new Date(snippet.publishedAt)),
                likeCount: snippet.likeCount,
            };
        });

        const result = { comments, nextPageToken: data.nextPageToken };

        kv.set(cacheKey, result, { ex: COMMENTS_TTL }).catch(err => {
            console.error(`Failed to set KV cache for key "${cacheKey}":`, err);
        });

        response.setHeader('Content-Type', 'application/json');
        response.status(200).send(JSON.stringify(result));
    } catch (error: any) {
        response.setHeader('Content-Type', 'application/json');
        response.status(500).send(JSON.stringify({ message: error.message }));
    }
}
