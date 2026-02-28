
import type { Video, Comment } from '../src/types';

// The backend proxy server is now responsible for all API key management.
// Default to V2 (Innertube) if no setting is found or if it's set to 'true'. Only use V1 if explicitly set to 'false'.
const useApiV2 = localStorage.getItem('geminiqtube-useApiV2') !== 'false';
const API_BASE_URL = useApiV2 ? '/api/v2' : '/api';
console.log(`Using API version: ${useApiV2 ? 'v2 (Innertube)' : 'v1 (Official)'}`);


// --- Caching Layer (Remains on client for performance) ---
const CACHE_PREFIX = 'geminiqtube-cache:';
const POPULAR_VIDEOS_TTL = 60 * 60 * 1000; // 1 hour TTL
const SEARCH_TTL = 10 * 60 * 1000; // 10 minutes TTL
const DETAILS_TTL = 30 * 60 * 1000; // 30 minutes TTL
const COMMENTS_TTL = 5 * 60 * 1000; // 5 minutes TTL


const getCache = (key: string): { data: any } | null => {
    try {
        const itemStr = localStorage.getItem(`${CACHE_PREFIX}${key}`);
        if (!itemStr) {
            return null;
        }
        const item = JSON.parse(itemStr);
        
        if (Date.now() > item.expiresAt) {
            localStorage.removeItem(`${CACHE_PREFIX}${key}`);
            return null;
        }
        
        return { data: item.data };
    } catch (error) {
        console.warn(`Error reading from localStorage cache for key "${key}":`, error);
        return null;
    }
};

const cleanupExpiredCache = () => {
    console.log("Running cache cleanup...");
    let itemsRemoved = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
            try {
                const itemStr = localStorage.getItem(key);
                if (itemStr) {
                    const item = JSON.parse(itemStr);
                    if (Date.now() > item.expiresAt) {
                        localStorage.removeItem(key);
                        itemsRemoved++;
                    }
                }
            } catch (e) {
                localStorage.removeItem(key);
            }
        }
    }
    console.log(`Cache cleanup finished. Removed ${itemsRemoved} expired items.`);
};

const setCache = (key: string, data: any, ttl: number) => {
    const expiresAt = Date.now() + ttl;
    const item = { data, expiresAt };
    const fullKey = `${CACHE_PREFIX}${key}`;

    try {
        localStorage.setItem(fullKey, JSON.stringify(item));
    } catch (error: any) {
        if (error.name === 'QuotaExceededError' || (error.code && (error.code === 22 || error.code === 1014))) {
            console.warn(`LocalStorage quota exceeded for key "${key}". Running cleanup...`);
            cleanupExpiredCache();
            try {
                localStorage.setItem(fullKey, JSON.stringify(item));
                console.log("Successfully saved to cache after cleanup.");
            } catch (retryError) {
                console.error(`Failed to save to cache even after cleanup for key "${key}":`, retryError);
            }
        } else {
            console.warn(`Error writing to localStorage cache for key "${key}":`, error);
        }
    }
};

// --- Initial Cache Cleanup on Load ---
cleanupExpiredCache();

// A generic fetch wrapper to talk to our backend proxy
const proxyApiFetch = async (endpoint: string, params: Record<string, string>) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}${endpoint}?${queryString}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            // The error message now comes from our proxy server
            throw new Error(data.message || `An error occurred with the backend proxy (${response.status})`);
        }
        
        return data;
    } catch (error) {
        console.error(`Error fetching from backend proxy endpoint "${endpoint}":`, error);
        // Re-throw a more user-friendly error
        if (error instanceof Error) {
            throw new Error(`Failed to fetch data: ${error.message}`);
        }
        throw new Error("A network error occurred while contacting the application server.");
    }
};


// --- Helper functions to format data (no changes needed) ---

const decodeHtmlEntities = (text: string): string => {
    if (typeof text !== 'string') return text;
    try {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        return textarea.value;
    } catch (e) {
        console.error("Failed to decode HTML entities", e);
        return text;
    }
};

// The formatting functions are now handled by the backend, as each API source has different raw data.
// The frontend will now receive consistently pre-formatted strings.

// --- API Functions (rewritten to use the proxy) ---

export const getPopularVideos = async (pageToken?: string): Promise<{ videos: Video[], nextPageToken?: string }> => {
    const cacheKey = `popular-videos:${pageToken || 'initial'}:${API_BASE_URL}`;

    const cachedItem = getCache(cacheKey);
    if (cachedItem) {
        console.log(`[CACHE HIT] for popular videos: ${cacheKey}`);
        return cachedItem.data;
    }
    console.log(`[CACHE MISS] for popular videos: ${cacheKey}`);

    const params: { [key: string]: string } = {};
    if (pageToken) {
        params.pageToken = pageToken;
    }
    
    const data = await proxyApiFetch('/popular', params);

    const videos: Video[] = (data.videos || []).map((item: any): Video => ({
        ...item,
        title: decodeHtmlEntities(item.title),
        channelName: decodeHtmlEntities(item.channelName),
    }));
    
    const result = { videos, nextPageToken: data.nextPageToken };
    setCache(cacheKey, result, POPULAR_VIDEOS_TTL);
    return result;
};

export const searchVideos = async (query: string, pageToken?: string, maxResults: string = '15'): Promise<{ videos: Video[], nextPageToken?: string }> => {
    const cacheKey = `search:${query}:${pageToken || 'initial'}:${maxResults}:${API_BASE_URL}`;
    
    const cachedItem = getCache(cacheKey);
    if (cachedItem) {
        console.log(`[CACHE HIT] for search: ${cacheKey}`);
        return cachedItem.data;
    }
    console.log(`[CACHE MISS] for search: ${cacheKey}`);
    
    const params: { [key: string]: string } = { q: query, maxResults };
    if (pageToken) {
        params.pageToken = pageToken;
    }

    const data = await proxyApiFetch('/search', params);
    
    const videos: Video[] = (data.videos || []).map((item: any): Video => ({
        ...item,
        title: decodeHtmlEntities(item.title),
        channelName: decodeHtmlEntities(item.channelName),
    }));

    const result = { videos, nextPageToken: data.nextPageToken };
    setCache(cacheKey, result, SEARCH_TTL);
    return result;
};


export const getVideoDetails = async (videoId: string): Promise<Partial<Video>> => {
    const cacheKey = `video-details:${videoId}:${API_BASE_URL}`;

    const cachedItem = getCache(cacheKey);
    if (cachedItem) {
        console.log(`[CACHE HIT] for video details: ${cacheKey}`);
        return cachedItem.data;
    }
    console.log(`[CACHE MISS] for video details: ${cacheKey}`);

    const data = await proxyApiFetch('/details', { videoId });

    const videoDetails: Partial<Video> = {
        ...data.videoDetails,
        title: decodeHtmlEntities(data.videoDetails.title),
        description: decodeHtmlEntities(data.videoDetails.description),
        channelName: decodeHtmlEntities(data.videoDetails.channelName),
    };

    setCache(cacheKey, videoDetails, DETAILS_TTL);
    return videoDetails;
};

export const getComments = async (videoId: string, pageToken?: string): Promise<{ comments: Comment[], nextPageToken?: string }> => {
    const cacheKey = `comments:${videoId}:${pageToken || 'initial'}:${API_BASE_URL}`;

    const cachedItem = getCache(cacheKey);
    if (cachedItem) {
        console.log(`[CACHE HIT] for comments: ${cacheKey}`);
        return cachedItem.data;
    }
    console.log(`[CACHE MISS] for comments: ${cacheKey}`);
    
    const params: { [key: string]: string } = { videoId };
    if (pageToken) {
        params.pageToken = pageToken;
    }
    
    const data = await proxyApiFetch('/comments', params);

    const comments: Comment[] = (data.comments || []).map((item: any): Comment => ({
        ...item,
        text: decodeHtmlEntities(item.text),
    }));

    const result = { comments, nextPageToken: data.nextPageToken };
    setCache(cacheKey, result, COMMENTS_TTL);
    return result;
};


export const getAudioStream = async (videoId: string): Promise<{ streamUrl: string, duration: number }> => {
    // This should only work with the V2 API.
    if (!useApiV2) {
        throw new Error("Audio streaming is only available with the V2 (Innertube) API.");
    }
    
    // Stream URLs are often temporary, so we don't cache them.
    const queryString = new URLSearchParams({ videoId }).toString();
    const url = `/api/v2/audiostream?${queryString}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `An error occurred with the audiostream endpoint (${response.status})`);
        }
        
        return data;
    } catch (error) {
        console.error(`Error fetching from audiostream endpoint for videoId "${videoId}":`, error);
        if (error instanceof Error) {
            throw new Error(`Failed to fetch audio stream: ${error.message}`);
        }
        throw new Error("A network error occurred while fetching the audio stream.");
    }
};