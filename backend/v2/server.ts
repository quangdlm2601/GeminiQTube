import express from "express";
import streamHandler from "./api/stream";

const app = express();
const port = process.env.PORT || 3001;

app.get("/stream", streamHandler);
  
app.listen(port, () => {
  console.log(`API v2 running on port ${port}`);
});
