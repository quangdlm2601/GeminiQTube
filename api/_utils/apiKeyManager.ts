
import { createClient } from '@vercel/kv';
import fetch from 'node-fetch';

// --- Vercel KV Client ---
const kv = createClient({
  url: process.env.GEMINIQTUBE_KV_REST_API_URL,
  token: process.env.GEMINIQTUBE_KV_REST_API_TOKEN,
});

// --- API Key Management ---
const apiKeys = (process.env.YTB_API_KEYS || '')
  .split(',')
  .map(key => key.trim())
  .filter(key => key.length > 0);

const getQuotaResetTimeInSeconds = () => {
    const now = new Date();
    const pacificDateStr = now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
    const pacificDate = new Date(pacificDateStr);
    pacificDate.setDate(pacificDate.getDate() + 1);
    pacificDate.setHours(0, 0, 0, 0);
    const resetTime = pacificDate.getTime();
    const secondsUntilReset = Math.floor((resetTime - Date.now()) / 1000);
    return Math.max(secondsUntilReset, 60); // Ensure at least a 60-second TTL
};

const setKeyAsExhausted = async (apiKey) => {
    const ttl = getQuotaResetTimeInSeconds();
    await kv.set(`exhausted:${apiKey}`, 'true', { ex: ttl });
    console.warn(`API key ending in ...${apiKey.slice(-4)} has been marked as exhausted in Vercel KV for ${ttl} seconds.`);
};

const getAvailableKeys = async () => {
    if (apiKeys.length === 0) return [];
    const exhaustedKeyChecks = await kv.mget(...apiKeys.map(key => `exhausted:${key}`));
    const available = apiKeys.filter((key, index) => !exhaustedKeyChecks[index]);
    if (available.length === 0 && apiKeys.length > 0) {
        console.log("All keys are currently marked as exhausted in Vercel KV.");
    }
    return available;
};

// Fisher-Yates (aka Knuth) Shuffle for randomizing key selection
const shuffle = (array) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex > 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
};


const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';

const youtubeApiFetch = async (endpoint, params) => {
    if (apiKeys.length === 0) {
        throw new Error("No YouTube API keys are configured on the server.");
    }
    
    const availableKeys = await getAvailableKeys();
    if (availableKeys.length === 0) {
        throw new Error("All provided YouTube API keys have exceeded their quota for the day.");
    }

    // Shuffle keys to ensure random distribution and prevent hammering one key.
    const shuffledKeys = shuffle(availableKeys);
    
    for (const apiKey of shuffledKeys) {
        const url = new URL(`${YOUTUBE_API_URL}${endpoint}`);
        url.search = new URLSearchParams({ ...params, key: apiKey }).toString();

        try {
            const response = await fetch(url.toString());
            // FIX: Explicitly type `data` as `any` to resolve errors when accessing properties on the unknown JSON response.
            const data: any = await response.json();

            if (response.ok) {
                // Success!
                return data;
            }

            const isQuotaError = data.error?.errors?.some(
                (e) => e.reason === 'quotaExceeded' || e.reason === 'dailyLimitExceeded'
            );

            if (response.status === 403 && isQuotaError) {
                await setKeyAsExhausted(apiKey);
                console.warn(`Key ...${apiKey.slice(-4)} failed (quota). Trying next available key.`);
                continue; // Move to the next key in the shuffled list
            } else {
                // For any other API error (e.g., bad request, forbidden but not quota), we fail fast.
                console.error('YouTube API Error:', data);
                throw new Error(data.error?.message || `An unknown YouTube API error occurred (${response.status})`);
            }

        } catch (error: any) {
            // This catches network errors from fetch(), JSON parsing errors, or the error thrown above.
            // We'll treat network errors as fatal for the whole request, as it's unlikely to be key-specific.
            console.error("Fatal error during YouTube API call:", error);
            if (error.message.includes('YouTube API error')) {
                throw error; // Re-throw the specific API error
            }
            throw new Error("A network error occurred while contacting the YouTube API.");
        }
    }
    
    // If the loop completes, it means every available key was tried and failed with a quota error.
    throw new Error("All available YouTube API keys have exceeded their quota for the day.");
};

export { youtubeApiFetch, kv };
