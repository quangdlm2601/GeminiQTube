import threading
import time
from pathlib import Path
from flask import Flask, request, jsonify, send_file
from youtube_utils import get_audio_url, download_video_or_audio
from refresh_cookies import refresh_cookies

app = Flask(__name__)

# Background thread to refresh cookies every 12 hours
def background_refresh():
    while True:
        try:
            print("⏳ Background refresh of YouTube cookies...")
            refresh_cookies(headless=True)
        except Exception as e:
            print("⚠️ Background refresh failed:", e)
        time.sleep(12*60*60)  # 12 hours

threading.Thread(target=background_refresh, daemon=True).start()

@app.route("/")
def index():
    return "Flask + yt_dlp + Playwright API ready"

@app.route("/stream", methods=["GET"])
def getYoutubeURL():
    video_id = request.args.get("videoId")
    if not video_id:
        return jsonify({"error": "Missing videoId"}), 400
    video_url = f"https://www.youtube.com/watch?v={video_id}"
    try:
        audio_url = get_audio_url(video_url)
        return jsonify({"streamUrl": audio_url})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


DOWNLOAD_FOLDER = Path("downloads")
DOWNLOAD_FOLDER.mkdir(parents=True, exist_ok=True)
@app.route("/download", methods=["GET"])
def api_download():
    video_id = request.args.get("videoId")
    format_type = request.args.get("format", "mp4")  # mp4 hoặc mp3
    if not video_id:
        return jsonify({"error": "Missing videoId"}), 400

    video_url = f"https://www.youtube.com/watch?v={video_id}"
    target_path = DOWNLOAD_FOLDER / f"{video_id}.{format_type}"
    audio_only = format_type.lower() == "mp3"

    try:
        download_video_or_audio(video_url, target_path, audio_only=audio_only)

        response = send_file(target_path, as_attachment=True)

        @response.call_on_close
        def cleanup():
            try:
                if target_path.exists():
                    target_path.unlink()
            except Exception as e:
                print("⚠️ Failed to delete file:", e)

        return response

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/keep-alive", methods=["GET"])
def keepAlive():
    return jsonify({"status": "OK"})

