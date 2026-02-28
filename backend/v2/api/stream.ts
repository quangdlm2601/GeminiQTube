import { Request, Response } from "express";
import { create } from "youtube-dl-exec";

// Use system-installed yt-dlp (Python version)
const youtubedl = create("yt-dlp");

const streamHandler = async (req: Request, res: Response) => {
  const { videoId } = req.query;

  if (!videoId || typeof videoId !== "string") {
    return res.status(400).json({ message: "videoId is required." });
  }

  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    const videoInfo = await youtubedl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificates: true,
      callHome: false,

      // --------- ANDROID spoof (anti 403, anti signature) ---------
      extractorArgs: {
        youtube: {
          player_client: ["android"],
          player_skip: ["configs"],
        },
      },

      userAgent: "com.google.android.youtube/19.09.37 (Linux; U; Android 13)",

      // Best audio format
      format: "ba/b",

      // Prevent YouTube throttling (50 kb/s problem)
      httpChunkSize: "10M",
    } as any);

    const streamUrl = (videoInfo as any).url;
    const duration = (videoInfo as any).duration;

    if (!streamUrl) {
      console.error(
        `yt-dlp returned no stream URL for videoId "${videoId}"`,
        videoInfo
      );
      throw new Error("Could not extract audio stream URL.");
    }

    return res.status(200).json({ streamUrl, duration });
  } catch (error: any) {
    console.error(`Error in /api/v2/stream "${videoId}":`, error);

    const msg =
      error.stderr || error.message || "An unknown yt-dlp error occurred.";

    if (msg.includes("Private video") || msg.includes("Video unavailable")) {
      return res
        .status(404)
        .json({ message: "This video is private or unavailable." });
    }

    return res.status(500).json({ message: msg });
  }
};

export default streamHandler;
