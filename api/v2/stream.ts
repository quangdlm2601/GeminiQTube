// api/v2/audiostream.ts working on local only
import { create } from "youtube-dl-exec";

export default async function handler(request, response) {
    const youtubedl = create("yt-dlp");
    const { videoId } = request.query;

    if (!videoId || typeof videoId !== 'string') {
        response.setHeader('Content-Type', 'application/json');
        return response.status(400).send(JSON.stringify({ message: 'videoId is required.' }));
    }

    try {
        const url = `https://www.youtube.com/watch?v=${videoId}`;
        
        // Use --dump-single-json to get all info, including the direct stream URL and duration.
        // We select the best audio-only format available.
        // yt-dlp format selection: https://github.com/yt-dlp/yt-dlp#format-selection
        // 'ba' is bestaudio. 'b' is best overall.
        const videoInfo = await youtubedl(url, {
            dumpSingleJson: true,
            format: 'ba/b', // bestaudio, fallback to best overall if no audio-only
            noWarnings: true,
            callHome: false,
            noCheckCertificates: true,
        });

        // The URL is in the 'url' property of the parsed JSON
        const streamUrl = videoInfo.url;
        const duration = videoInfo.duration; // duration is already in seconds

        if (!streamUrl) {
            console.error(`yt-dlp did not return a stream URL for videoId "${videoId}"`, videoInfo);
            throw new Error('Could not extract a stream URL for this video.');
        }

        const result = {
            streamUrl,
            duration,
        };
        
        response.setHeader('Content-Type', 'application/json');
        response.status(200).send(JSON.stringify(result));

    } catch (error: any) {
        console.error(`Error in /api/v2/stream (yt-dlp) for videoId "${videoId}":`, error);
        // yt-dlp often outputs errors to stderr, which are caught here.
        // The error object from youtube-dl-exec contains stderr.
        const errorMessage = error.stderr || error.message || 'An unknown error occurred while fetching the audio stream.';
        response.setHeader('Content-Type', 'application/json');
        // Check for common yt-dlp errors and provide a cleaner message.
        if (errorMessage.includes('Private video') || errorMessage.includes('Video unavailable')) {
             return response.status(404).send(JSON.stringify({ message: 'This video is private or unavailable.' }));
        }
        
        return response.status(500).send(JSON.stringify({ message: errorMessage }));
    }
}
