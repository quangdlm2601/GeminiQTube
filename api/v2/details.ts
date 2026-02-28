
import { getYouTubei } from '../_utils/youtubei.js';
import { formatViewCount, formatPublishedAt, formatDuration } from '../_utils/formatters.js';

export default async function handler(request, response) {
    const { videoId } = request.query;

    if (!videoId) {
        response.setHeader('Content-Type', 'application/json');
        return response.status(400).send(JSON.stringify({ message: 'videoId is required.' }));
    }

    try {
        const youtubei = await getYouTubei();
        const details = await youtubei.getInfo(videoId as string);

        // Use 'any' casting to access properties safely as library types might lag behind API changes
        const primaryInfo: any = details.primary_info;
        const secondaryInfo: any = details.secondary_info;
        const basicInfo: any = details.basic_info;

        // --- Title ---
        // Prefer primary_info title which is the displayed title
        const title = primaryInfo?.title?.text || basicInfo?.title || 'Untitled';

        // --- View Count ---
        // Prefer the text string from primary_info (e.g. "2.4M views")
        // Fallback to formatting the number from basic_info
        let viewCount = '0 views';
        if (primaryInfo?.view_count?.text) {
            viewCount = primaryInfo.view_count.text.toString();
        } else if (basicInfo?.view_count) {
            viewCount = formatViewCount(basicInfo.view_count);
        }

        // --- Published At ---
        // Prefer relative date (e.g. "2 days ago") or formatted date (e.g. "Oct 20, 2023")
        let publishedAt = 'a moment ago';
        if (primaryInfo?.relative_date?.text) {
            publishedAt = primaryInfo.relative_date.text.toString();
        } else if (primaryInfo?.date?.text) {
            publishedAt = primaryInfo.date.text.toString();
        } else if (basicInfo?.start_timestamp) {
            publishedAt = formatPublishedAt(basicInfo.start_timestamp);
        }

        // --- Description ---
        // Secondary info contains the full description logic
        let description = '';
        if (secondaryInfo?.description?.text) {
            description = secondaryInfo.description.text.toString();
        } else if (basicInfo?.short_description) {
            description = basicInfo.short_description;
        }

        // --- Channel Name ---
        let channelName = 'Unknown Channel';
        if (secondaryInfo?.owner?.author?.name) {
            channelName = secondaryInfo.owner.author.name.toString();
        } else if (basicInfo?.channel?.name) {
            channelName = basicInfo.channel.name;
        }

        // --- Channel Image ---
        let channelImageUrl = '';
        // Helper to get the largest thumbnail
        const getLargest = (thumbs: any[]) => thumbs && thumbs.length > 0 ? thumbs[thumbs.length - 1].url : '';
        
        if (secondaryInfo?.owner?.author?.thumbnails) {
            channelImageUrl = getLargest(secondaryInfo.owner.author.thumbnails);
        } else if (basicInfo?.channel?.thumbnails) {
            channelImageUrl = getLargest(basicInfo.channel.thumbnails);
        }

        // --- Thumbnail ---
        let thumbnailUrl = '';
        if (basicInfo?.thumbnail) {
            thumbnailUrl = getLargest(basicInfo.thumbnail);
        }

        // --- Duration ---
        let duration = '0:00';
        if (basicInfo?.duration) {
            duration = formatDuration(basicInfo.duration);
        }

        // --- Comment Count ---
        let commentCount = 0;
        if (basicInfo?.comment_count) {
             commentCount = basicInfo.comment_count;
        }

        const videoDetails = {
            title,
            description,
            channelName,
            viewCount,
            publishedAt,
            channelImageUrl,
            thumbnailUrl,
            duration,
            commentCount,
        };

        const result = { videoDetails };

        response.setHeader('Content-Type', 'application/json');
        response.status(200).send(JSON.stringify(result));

    } catch (error: any) {
        console.error(`Error in /api/v2/details for videoId "${videoId}":`, error);
        response.setHeader('Content-Type', 'application/json');
        response.status(500).send(JSON.stringify({ message: error.message || 'An unknown error occurred.' }));
    }
}
