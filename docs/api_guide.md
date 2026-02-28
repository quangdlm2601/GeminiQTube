# GeminiQTube API Documentation

## Table of Contents
- [GeminiQTube API Documentation](#geminiqtube-api-documentation)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
    - [Base URLs](#base-urls)
  - [API v1](#api-v1)
    - [V1 Search](#v1-search)
    - [V1 Details](#v1-details)
    - [V1 Comments](#v1-comments)
    - [V1 Popular Videos](#v1-popular-videos)
  - [API v2](#api-v2)
    - [V2 Search](#v2-search)
    - [V2 Details](#v2-details)
    - [V2 Stream](#v2-stream)
    - [V2 Popular Videos](#v2-popular-videos)
    - [V2 Comments](#v2-comments)
  - [Error Handling](#error-handling)
  - [Caching Strategy](#caching-strategy)
    - [Cache TTL (Time To Live) by Endpoint](#cache-ttl-time-to-live-by-endpoint)
    - [Cache Behavior](#cache-behavior)
    - [Benefits](#benefits)
  - [Usage Examples](#usage-examples)
    - [JavaScript/TypeScript](#javascripttypescript)
    - [React Component Example](#react-component-example)
  - [API Version Comparison](#api-version-comparison)
  - [Rate Limiting](#rate-limiting)
  - [Support \& Contact](#support--contact)

---

## Overview

GeminiQTube provides two versions of APIs for fetching YouTube video data:
- **API v1**: Uses YouTube Data API (requires API key)
- **API v2**: Uses YouTubei library (no API key required, more reliable)

All responses are in JSON format and include proper HTTP status codes.

### Base URLs
- **API v1**: `/api/search`, `/api/details`, `/api/comments`, `/api/popular`
- **API v2**: `/api/v2/search`, `/api/v2/details`, `/api/v2/stream`, `/api/v2/popular`, `/api/v2/comments`

---

## API v1

### V1 Search

Search for YouTube videos using YouTube Data API.

**Endpoint**: `GET /api/search`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string |  | Search query |
| `pageToken` | string |  | Token for pagination |
| `maxResults` | string |  | Number of results (default: 15, max: 50) |

**Request Example**:
```bash
curl -X GET "http://localhost:3000/api/search?q=javascript+tutorial&maxResults=10"
```

**Response Example** (200 OK):
```json
{
  "videos": [
    {
      "id": "dQw4w9WgXcQ",
      "title": "JavaScript Tutorial for Beginners",
      "thumbnailUrl": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      "channelName": "Programming Channel",
      "viewCount": "1.5M views",
      "publishedAt": "2 weeks ago",
      "duration": "45:30"
    },
    {
      "id": "AbcD1234efG",
      "title": "Advanced JavaScript Concepts",
      "thumbnailUrl": "https://i.ytimg.com/vi/AbcD1234efG/hqdefault.jpg",
      "channelName": "Tech Academy",
      "viewCount": "850K views",
      "publishedAt": "1 month ago",
      "duration": "1:23:45"
    }
  ],
  "nextPageToken": "CDIQAA"
}
```

**Error Response** (400 Bad Request):
```json
{
  "message": "Search query (q) is required."
}
```

**Caching**: 10 minutes

---

### V1 Details

Get detailed information about a specific YouTube video.

**Endpoint**: `GET /api/details`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `videoId` | string |  | YouTube video ID |

**Request Example**:
```bash
curl -X GET "http://localhost:3000/api/details?videoId=dQw4w9WgXcQ"
```

**Response Example** (200 OK):
```json
{
  "videoDetails": {
    "title": "JavaScript Tutorial for Beginners",
    "description": "Learn JavaScript from scratch. This comprehensive tutorial covers...",
    "channelName": "Programming Channel",
    "viewCount": "1.5M views",
    "publishedAt": "2 weeks ago",
    "channelImageUrl": "https://yt3.ggpht.com/...",
    "thumbnailUrl": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    "duration": "45:30",
    "commentCount": 2450
  }
}
```

**Error Response** (404 Not Found):
```json
{
  "message": "Video not found"
}
```

**Caching**: 30 minutes

---

### V1 Comments

Get comments from a YouTube video with pagination support.

**Endpoint**: `GET /api/comments`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `videoId` | string |  | YouTube video ID |
| `pageToken` | string |  | Token for pagination |

**Request Example**:
```bash
curl -X GET "http://localhost:3000/api/comments?videoId=dQw4w9WgXcQ"
```

**Response Example** (200 OK):
```json
{
  "comments": [
    {
      "id": "UgzH9Z8K2xL7nM_kQ1Z9bAV9qOv",
      "authorName": "John Developer",
      "authorImageUrl": "https://yt3.ggpht.com/...",
      "text": "Great tutorial! Really helped me understand async/await.",
      "publishedAt": "2 days ago",
      "likeCount": 245
    },
    {
      "id": "Ugx0mK3pL8nQ9rS_tU2vWxYzAb",
      "authorName": "Jane Coder",
      "authorImageUrl": "https://yt3.ggpht.com/...",
      "text": "Can you do a part 2 on design patterns?",
      "publishedAt": "1 day ago",
      "likeCount": 89
    }
  ],
  "nextPageToken": "CDIQAA"
}
```

**Error Response** (400 Bad Request):
```json
{
  "message": "videoId is required."
}
```

**Caching**: 5 minutes

---

### V1 Popular Videos

Get the most popular videos on YouTube.

**Endpoint**: `GET /api/popular`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pageToken` | string |  | Token for pagination |

**Request Example**:
```bash
curl -X GET "http://localhost:3000/api/popular"
```

**Response Example** (200 OK):
```json
{
  "videos": [
    {
      "id": "dQw4w9WgXcQ",
      "title": "Trending Video Title",
      "thumbnailUrl": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      "channelName": "Popular Channel",
      "viewCount": "50M views",
      "publishedAt": "3 days ago",
      "duration": "10:45"
    }
  ],
  "nextPageToken": "CDIQAA"
}
```

**Caching**: 1 hour

---

## API v2

API v2 uses the YouTubei library which doesn't require an API key and is more reliable for scraping YouTube data.

### V2 Search

Search for YouTube videos using YouTubei library.

**Endpoint**: `GET /api/v2/search`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string |  | Search query |
| `pageToken` | string |  | Continuation token for pagination |

**Request Example**:
```bash
curl -X GET "http://localhost:3000/api/v2/search?q=web+development"
```

**Response Example** (200 OK):
```json
{
  "videos": [
    {
      "id": "dQw4w9WgXcQ",
      "title": "Web Development Course",
      "thumbnailUrl": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      "channelName": "Code Academy",
      "viewCount": "2.3M views",
      "publishedAt": "2 weeks ago",
      "duration": "3:45:20"
    },
    {
      "id": "AbcD1234efG",
      "title": "HTML & CSS Basics",
      "thumbnailUrl": "https://i.ytimg.com/vi/AbcD1234efG/maxresdefault.jpg",
      "channelName": "Frontend Mastery",
      "viewCount": "1.8M views",
      "publishedAt": "1 month ago",
      "duration": "2:15:00"
    }
  ],
  "nextPageToken": "4qmFsgI6Q..."
}
```

**Error Response** (400 Bad Request):
```json
{
  "message": "Search query (q) is required."
}
```

**Error Response** (500 Internal Server Error):
```json
{
  "message": "An unknown error occurred."
}
```

---

### V2 Details

Get detailed information about a specific YouTube video using YouTubei.

**Endpoint**: `GET /api/v2/details`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `videoId` | string |  | YouTube video ID |

**Request Example**:
```bash
curl -X GET "http://localhost:3000/api/v2/details?videoId=dQw4w9WgXcQ"
```

**Response Example** (200 OK):
```json
{
  "videoDetails": {
    "title": "Web Development Complete Course",
    "description": "Learn web development from scratch including HTML, CSS, JavaScript...",
    "channelName": "Code Academy",
    "viewCount": "2.3M views",
    "publishedAt": "Feb 14, 2024",
    "channelImageUrl": "https://yt3.ggpht.com/...",
    "thumbnailUrl": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    "duration": "3:45:20",
    "commentCount": 5230
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "message": "videoId is required."
}
```

**Error Response** (500 Internal Server Error):
```json
{
  "message": "An unknown error occurred."
}
```

---

### V2 Stream

Get audio stream URL for a YouTube video using yt-dlp.

**Endpoint**: `GET /api/v2/stream`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `videoId` | string |  | YouTube video ID |

**Request Example**:
```bash
curl -X GET "http://localhost:3000/api/v2/stream?videoId=dQw4w9WgXcQ"
```

**Response Example** (200 OK):
```json
{
  "streamUrl": "https://rr.prod.example.com/...audio.m4a",
  "duration": 2700
}
```

**Error Response** (400 Bad Request):
```json
{
  "message": "videoId is required."
}
```

**Error Response** (404 Not Found):
```json
{
  "message": "This video is private or unavailable."
}
```

**Error Response** (500 Internal Server Error):
```json
{
  "message": "An unknown error occurred while fetching the audio stream."
}
```

---

### V2 Popular Videos

Get the most popular videos using YouTubei.

**Endpoint**: `GET /api/v2/popular`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pageToken` | string |  | Continuation token for pagination |

**Request Example**:
```bash
curl -X GET "http://localhost:3000/api/v2/popular"
```

**Response Example** (200 OK):
```json
{
  "videos": [
    {
      "id": "dQw4w9WgXcQ",
      "title": "Trending Video #1",
      "thumbnailUrl": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      "channelName": "Popular Channel",
      "viewCount": "100M views",
      "publishedAt": "1 day ago",
      "duration": "12:34"
    }
  ],
  "nextPageToken": "4qmFsgI6Q..."
}
```

---

### V2 Comments

Get comments from a YouTube video using YouTubei.

**Endpoint**: `GET /api/v2/comments`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `videoId` | string |  | YouTube video ID |
| `pageToken` | string |  | Continuation token for pagination |

**Request Example**:
```bash
curl -X GET "http://localhost:3000/api/v2/comments?videoId=dQw4w9WgXcQ"
```

**Response Example** (200 OK):
```json
{
  "comments": [
    {
      "id": "UgzH9Z8K2xL7nM_kQ1Z9bAV9qOv",
      "authorName": "Tech Enthusiast",
      "authorImageUrl": "https://yt3.ggpht.com/...",
      "text": "Excellent content! Very informative.",
      "publishedAt": "2 hours ago",
      "likeCount": 125
    },
    {
      "id": "Ugx0mK3pL8nQ9rS_tU2vWxYzAb",
      "authorName": "Developer Pro",
      "authorImageUrl": "https://yt3.ggpht.com/...",
      "text": "Can't wait for part 2!",
      "publishedAt": "1 hour ago",
      "likeCount": 45
    }
  ],
  "nextPageToken": "4qmFsgI6Q..."
}
```

---

## Error Handling

All API endpoints return appropriate HTTP status codes:

| Status Code | Meaning | Example |
|-------------|---------|---------|
| 200 | Success | Request completed successfully |
| 400 | Bad Request | Missing required parameter |
| 404 | Not Found | Video not found or unavailable |
| 500 | Internal Server Error | Server error during processing |

**Standard Error Response Format**:
```json
{
  "message": "Error description"
}
```

---

## Caching Strategy

The API implements a multi-level caching strategy using Vercel KV for improved performance:

### Cache TTL (Time To Live) by Endpoint

| Endpoint | Cache Key Format | TTL |
|----------|------------------|-----|
| Search | `v1:search:{query}:{pageToken}:{maxResults}` | 10 minutes |
| Details | `v1:details:{videoId}` | 30 minutes |
| Comments | `v1:comments:{videoId}:{pageToken}` | 5 minutes |
| Popular | `v1:popular:{pageToken}` | 1 hour |

### Cache Behavior

- **Cache Hit**: Returns cached data with log message `[KV CACHE HIT]`
- **Cache Miss**: Fetches fresh data and stores it asynchronously
- **No Blocking**: Cache storage doesn't block the response

**Example from code**:
```javascript
const cachedData = await kv.get(cacheKey);
if (cachedData) {
    console.log(`[KV CACHE HIT] for search: ${cacheKey}`);
    return response.status(200).send(JSON.stringify(cachedData));
}

// If cache miss, fetch from API...
// Then asynchronously set cache
kv.set(cacheKey, result, { ex: SEARCH_TTL }).catch(err => {
    console.error(`Failed to set KV cache for key "${cacheKey}":`, err);
});
```

### Benefits

- **Reduced API Calls**: Minimizes calls to YouTube API
- **Faster Response Times**: Cached data returns immediately
- **Better Performance**: Especially for popular searches
- **Reduced Costs**: Fewer API quota usage

---

## Usage Examples

### JavaScript/TypeScript

```typescript
// Search for videos
async function searchVideos(query: string) {
  const response = await fetch(`/api/v2/search?q=${encodeURIComponent(query)}`);
  const data = await response.json();
  return data.videos;
}

// Get video details
async function getVideoDetails(videoId: string) {
  const response = await fetch(`/api/v2/details?videoId=${videoId}`);
  const data = await response.json();
  return data.videoDetails;
}

// Get audio stream
async function getAudioStream(videoId: string) {
  const response = await fetch(`/api/v2/stream?videoId=${videoId}`);
  const data = await response.json();
  return data.streamUrl;
}

// Get comments
async function getComments(videoId: string, pageToken?: string) {
  const url = `/api/v2/comments?videoId=${videoId}${pageToken ? `&pageToken=${pageToken}` : ''}`;
  const response = await fetch(url);
  const data = await response.json();
  return { comments: data.comments, nextPageToken: data.nextPageToken };
}
```

### React Component Example

```typescript
import { useEffect, useState } from 'react';

export function VideoSearch() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v2/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setVideos(data.videos);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Search videos..."
        onChange={(e) => handleSearch(e.target.value)}
      />
      {loading && <p>Loading...</p>}
      {error && <p style={{color: 'red'}}>{error}</p>}
      {videos.map(video => (
        <div key={video.id}>
          <img src={video.thumbnailUrl} alt={video.title} />
          <h3>{video.title}</h3>
          <p>{video.channelName}</p>
          <p>{video.viewCount} " {video.publishedAt}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## API Version Comparison

| Feature | API v1 | API v2 |
|---------|--------|--------|
| Requires API Key |  |  |
| Quota Limited |  |  |
| Reliability | Medium | High |
| Caching |  |  |
| Stream URL |  |  |
| Best For | Simple queries | Audio extraction, more data |

**Recommendation**: Use API v2 for most use cases as it doesn't require authentication and is more reliable.

---

## Rate Limiting

Currently, no rate limiting is implemented. For production use, consider implementing:

1. **Per-IP Rate Limiting**: Limit requests per IP address
2. **Per-User Rate Limiting**: Limit requests per authenticated user
3. **Global Rate Limiting**: Overall request limit for the API

---

## Support & Contact

For issues or questions about the API, please refer to the project repository or contact the development team.
