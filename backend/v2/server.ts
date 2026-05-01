import express from "express";
import streamHandler from "./api/stream";
import { seedCookiesFromSecrets } from "./utils/cookies";

const app = express();
const port = process.env.PORT || 3001;

// Seed cookies from Render secrets on startup
seedCookiesFromSecrets();

app.get("/stream", streamHandler);

app.listen(port, () => {
  console.log(`API v2 running on port ${port}`);
});
