
# GeminiQTube Project Documentation

This project is a YouTube clone built with React and TypeScript. It features a unique **dual-API backend** deployed on **Vercel Serverless Functions**, allowing the user to switch between two different data sources for YouTube content.

## I. Architectural Overview

The application is designed with flexibility and reliability in mind, offering two distinct backend strategies.

1.  **Frontend (React Application):**
    *   Built with React 19 and TypeScript, using Vite as the build tool.
    *   The UI is composed of React components (`src/components/`).
    *   Manages UI state, user interactions, and allows the user to select their preferred API version.
    *   All data requests are sent to the appropriate Serverless Function endpoints.
    *   Implements a client-side caching layer using `localStorage` to improve performance.

2.  **Backend (Vercel Serverless Functions):**
    The backend is split into two independent sets of API endpoints, providing a robust data-fetching strategy.

    *   **V1 API (`/api/*.ts`): Official YouTube Data API**
        *   This is the stable, official method for accessing YouTube data.
        *   **Requires API Keys:** You must provide your own YouTube Data API v3 keys.
        *   **Quota Management:** Uses **Vercel KV** (a Redis-compatible database) to track API key usage and automatically rotate to a fresh key when one's daily quota is exhausted. This makes the V1 API highly resilient.
        *   The logic for this is contained in `api/_utils/apiKeyManager.ts`.

    *   **V2 API (`/api/v2/*.ts`): Innertube API (`youtubei.js`)**
        *   This backend uses the `youtubei.js` library to reverse-engineer the requests made by the official YouTube web client.
        *   **No API Keys Required:** This is its primary advantage.
        *   **Potentially Less Stable:** As it relies on an unofficial API, it may break if YouTube makes significant changes to their internal services. It serves as an excellent, cost-free alternative to the V1 API.

3.  **Data Flow:**
    *   The user selects an API version via the UI toggle. This choice is saved in `localStorage`.
    *   On page load, `src/services/geminiService.ts` checks `localStorage` and sets the `API_BASE_URL` to either `/api` (for V1) or `/api/v2` (for V2).
    *   The React frontend makes a `fetch` call to a relative endpoint (e.g., `/api/v2/search?q=...`).
    *   Vercel's routing directs the request to the correct serverless function.
    *   The function executes, communicates with the corresponding YouTube API, formats the data, and returns it to the frontend.

This dual-API architecture provides both a stable, quota-managed official API and a convenient, key-free unofficial API.

## II. File and Directory Details

### Root Level
*   **`package.json`**: Unified dependencies for frontend and backend.
*   **`vercel.json`**: Vercel deployment and routing configuration.

### Frontend Structure (`src/`)
*   **`components/ApiToggle.tsx`**: The UI component for switching between API versions.
*   **`services/geminiService.ts`**: The main service that dynamically calls the selected API backend.

### Backend Structure (`api/`)
*   **`popular.ts`, `search.ts`, `details.ts`, `comments.ts`**: V1 endpoints using the Official API.
*   **`_utils/apiKeyManager.ts`**: Manages API key rotation and Vercel KV interaction for V1.
*   **`v2/`**: Contains all the V2 endpoints that use `youtubei.js`.
*   **`_utils/youtubei.ts`**: Manages the singleton instance of the `youtubei.js` client for V2.
*   **`_utils/formatters.ts`**: Shared helper functions to format data.
*   **`_utils/parsers.ts`**: Shared helper functions to parse data.

## III. Maintenance and Deployment Guide

### Environment Variables

For the **V1 API** to function, you **must** set the following environment variables in your Vercel project settings:

| Variable                          | Description                                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `YTB_API_KEYS`                    | A comma-separated list of your YouTube Data API v3 keys. Example: `key1,key2,key3`                       |
| `GEMINIQTUBE_KV_REST_API_URL`       | The REST API URL for your Vercel KV store.                                                              |
| `GEMINIQTUBE_KV_REST_API_TOKEN`     | The read/write token for your Vercel KV store.                                                          |

> The V2 API does not require any environment variables.

### Local Development

1.  **Install Dependencies:** `yarn install`
2.  **Set Up Environment:** Create a `.env.local` file in the root directory and add the environment variables listed above.
3.  **Run Locally:**
    *   Install Vercel CLI: `npm i -g vercel`
    *   Run the development server: `vercel dev`
    *   This starts the full application at `http://localhost:3000`.

### Deployment to Vercel

1.  **Connect Git Repository to Vercel.**
2.  **Configure Environment Variables:** In your Vercel project dashboard, go to "Settings" -> "Environment Variables" and add the three variables required for the V1 API.
3.  **Deploy:** Push your code to the main branch. Vercel will automatically build and deploy the application.

### Monitoring and Maintenance

| Issue                                           | Solution                                                                                                                                                                                            |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **V1 API errors:** "All keys have exceeded quota" | All your provided API keys have been used up for the day. The app will automatically try again tomorrow. You can also add more keys to the `YTB_API_KEYS` variable.                                   |
| **V2 API errors:** (e.g., 400 Bad Request)      | This can happen if YouTube changes its internal API. Try updating the `youtubei.js` package to the latest version (`npm install youtubei.js@latest`). In the meantime, switch to the V1 API. |
| Functions timing out                            | Check the Vercel logs for slow responses. If this persists, it may indicate a temporary issue with either YouTube's official API or their internal services.                                           |
