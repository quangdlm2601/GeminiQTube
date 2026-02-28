# AI Studio App: React + Capacitor + Gemini API
# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1L7HaXhzAmlccA1xkrUjoHSdqJt5JyGDp

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `yarn install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `yarn run dev`

## Build App icon for Android
**Prerequisites:**  Node.js, Cordova Res
```
yarn cordova-res android --skip-config --copy
```
## Build APK
**Prerequisites:** Docker

**Steps:**
- Build and run the Docker container to generate the APK.
- Run the Docker container.
- Copy the APK from the container to your local machine:.
- Clean up by removing the container.
- The APK will be available in the `output` directory.

**Summary cli:**
```
yarn gen:app
```

## Backend Server
**Prerequisites:** Docker
- Build and run the Docker container for the backend server.
- The backend server will be accessible at `http://localhost:3555`.
```
yarn run:backend
```

## Renew Storage_state for Playwright
**Prerequisites:** Node.js, Playwright
- Copy profile from your browser to `./backend/profile/`.
  - Windows: C:\Users\<you>\AppData\Local\Google\Chrome\User Data\Default
  - macOS: ~/Library/Application\ Support/Google/Chrome/Default (or Profile 1, Profile 2, etc.)
  - Linux: ~/.config/google-chrome/Default (or ~/.config/chromium/Default)
- Run the following command to renew the `storage_state` file for Playwright:
```
docker build -t geminiqtube-api ./backend
docker run -it --rm \
    -v $(pwd)/backend/playwright_data:/app/playwright_data \
    geminiqtube-api python create_storage_state.py
```

## References
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Gemini API Documentation](https://developers.generativeai.google/products/gemini)
