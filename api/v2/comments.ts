import { getYouTubei } from '../_utils/youtubei.js';
import { formatPublishedAt } from '../_utils/formatters.js';

export default async function handler(request, response) {
    const { videoId, pageToken } = request.query;

    if (!videoId) {
        response.setHeader('Content-Type', 'application/json');
        return response.status(400).send(JSON.stringify({ message: 'videoId is required.' }));
    }

    try {
        const youtubei = await getYouTubei();
        let commentsResult;
        
        // The getComments method can gracefully handle an undefined continuation token.
        // It fetches the first page if the token is null/undefined.
        commentsResult = await youtubei.getComments(videoId as string, pageToken as string | undefined);
        
        if (!commentsResult.contents) {
            // Comments are disabled or unavailable
            const result = { comments: [], nextPageToken: null };
            response.setHeader('Content-Type', 'application/json');
            return response.status(200).send(JSON.stringify(result));
        }

        const comments = (commentsResult.contents || [])
            .map((item: any) => {
                try {
                    // FIX: The actual comment data is often nested inside a 'comment' property.
                    // This makes the mapping more robust to structural changes in the API response.
                    const comment = item.comment || item;

                    if (!comment || typeof comment !== 'object' || !comment.author?.name) {
                        return null;
                    }
                    return {
                        id: comment.id,
                        authorName: comment.author.name,
                        authorImageUrl: comment.author.thumbnails?.[comment.author.thumbnails.length - 1]?.url,
                        text: comment.content?.text?.toString() || '',
                        publishedAt: formatPublishedAt(comment.published),
                        likeCount: comment.likes_count ?? 0, // Ensure likeCount is always a number
                    };
                } catch (e: any) {
                    console.error('Failed to map a comment item due to an error:', e.message);
                    console.error('Problematic comment item:', JSON.stringify(item, null, 2)); // Log the item that caused the error
                    return null; // Return null for any item that fails to process
                }
            })
            .filter(Boolean); // Filter out any nulls from failed mappings or invalid items

        const result = {
            comments,
            nextPageToken: commentsResult.continuation,
        };

        response.setHeader('Content-Type', 'application/json');
        response.status(200).send(JSON.stringify(result));

    } catch (error: any) {
        console.error(`Error in /api/v2/comments for videoId "${videoId}":`, error);
        response.setHeader('Content-Type', 'application/json');
        response.status(500).send(JSON.stringify({ message: error.message || 'An unknown error occurred.' }));
    }
}