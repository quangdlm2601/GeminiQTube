import os
import time
import json
import logging
from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout
import yt_dlp

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("youtube_utils")

# Paths
STORAGE_STATE_PATH = Path(os.getenv("YTDL_STORAGE_STATE", "/app/playwright_data/storage_state.json"))
COOKIE_TXT_PATH = Path(os.getenv("YTDL_COOKIES_TXT", "/app/playwright_data/cookies.txt"))
COOKIE_MAX_AGE = int(os.getenv("YTDL_COOKIE_MAX_AGE", 3600))  # 1h

# Desktop user-agent
MOBILE_APP_USER_AGENT = ("Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36 ")

def _cookies_age_seconds(path: Path) -> float:
    try:
        return time.time() - path.stat().st_mtime
    except FileNotFoundError:
        return float("inf")

def storage_to_netscape(storage_path: Path, out_path: Path):
    """Convert Playwright storage_state.json -> Netscape cookies.txt"""
    if not storage_path.exists():
        raise FileNotFoundError(f"{storage_path} not found")
    with open(storage_path) as f:
        data = json.load(f)
    cookies = data.get("cookies", [])
    lines = ["# Netscape HTTP Cookie File"]
    now = int(time.time())
    for c in cookies:
        domain = c.get("domain", "")
        include_subdomains = "TRUE" if domain.startswith(".") else "FALSE"
        path_cookie = c.get("path", "/")
        secure = "TRUE" if c.get("secure", False) else "FALSE"
        expires = c.get("expires") or (now + 3600)
        name = c.get("name", "")
        value = c.get("value", "")
        lines.append("\t".join([domain, include_subdomains, path_cookie, secure, str(int(expires)), name, value]))
    out_path.write_text("\n".join(lines))
    logger.info("✅ Converted storage_state.json -> cookies.txt")
    return out_path

def ensure_cookies(video_url: str, force_refresh=False, headless=True):
    """Ensure cookies.txt exists and is fresh, generate from storage_state.json"""
    if not force_refresh and COOKIE_TXT_PATH.exists() and _cookies_age_seconds(COOKIE_TXT_PATH) < COOKIE_MAX_AGE:
        logger.info("✅ Using cached cookies.txt")
        return COOKIE_TXT_PATH

    logger.info("⚠️ Refreshing cookies via Playwright headless")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=headless, args=["--no-sandbox", "--disable-setuid-sandbox"])
        context_args = {
            "user_agent": MOBILE_APP_USER_AGENT,
            "viewport": {"width": 1280, "height": 800},
            "locale": "en-US",
        }
        if STORAGE_STATE_PATH.exists():
            context_args["storage_state"] = str(STORAGE_STATE_PATH)
        context = browser.new_context(**context_args)
        page = context.new_page()
        page.goto(video_url, wait_until="networkidle")
        time.sleep(1.5)  # wait JS
        # Save storage_state for future reuse
        context.storage_state(path=str(STORAGE_STATE_PATH))
        cookies = context.cookies()
        browser.close()
    # convert to Netscape
    storage_to_netscape(STORAGE_STATE_PATH, COOKIE_TXT_PATH)
    return COOKIE_TXT_PATH

def get_audio_url(video_url: str, use_cookies=True, force_refresh_cookies=False):
    ydl_opts = {
        "format": "bestaudio/best",
        "quiet": True,
        "nocheckcertificate": True,
        "geo_bypass": True,
        "noplaylist": True,
        "user_agent": MOBILE_APP_USER_AGENT,
        "http_headers": {"Referer": video_url},
    }
    if use_cookies:
        cookiefile = ensure_cookies(video_url, force_refresh=force_refresh_cookies)
        if cookiefile.exists():
            ydl_opts["cookiefile"] = str(cookiefile)

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(video_url, download=False)
        if info is None:
            raise RuntimeError("yt-dlp returned no info")
        # Prefer direct audio url
        if "url" in info and info.get("acodec") != "none":
            return info["url"]
        # fallback
        formats = info.get("formats") or []
        audio_formats = [f for f in formats if (f.get("vcodec") == "none") or (f.get("acodec") and f.get("acodec") != "none")]
        if audio_formats:
            audio_formats.sort(key=lambda f: (f.get("abr") or 0, f.get("filesize") or 0), reverse=True)
            return audio_formats[0].get("url")
        return info.get("url")

def download_video_or_audio(video_url: str, target_path: str, audio_only=True, use_cookies=True, force_refresh_cookies=False):
    """
    Download video or audio from YouTube.

    :param video_url: full YouTube URL
    :param target_path: file path to save (e.g. "downloads/video.mp4" or "downloads/audio.m4a")
    :param audio_only: if True, download only audio; else download best video+audio
    :param use_cookies: whether to use cookies
    :param force_refresh_cookies: refresh cookies even if already exists
    :return: path to downloaded file
    """
    ydl_opts = {
        "outtmpl": str(target_path),
        "format": "bestaudio[ext=m4a]/bestaudio" if audio_only else "bestvideo+bestaudio/best",
        "quiet": True,
        "nocheckcertificate": True,
        "geo_bypass": True,
        "noplaylist": True,
        "user_agent": MOBILE_APP_USER_AGENT,
        "merge_output_format": target_path.suffix[1:],  # mp4, m4a, etc
        "http_headers": {"Referer": video_url},
    }

    # Optional: add cookies
    if use_cookies:
        cookiefile = ensure_cookies(video_url, force_refresh=force_refresh_cookies)
        if cookiefile.exists():
            ydl_opts["cookiefile"] = str(cookiefile)

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(video_url, download=True)
        if info is None:
            raise RuntimeError("yt-dlp returned no info")

    return str(target_path)
