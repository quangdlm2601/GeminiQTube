import time
from pathlib import Path
from playwright.sync_api import sync_playwright
from filelock import FileLock

# === Configuration ===
PLAYWRIGHT_DIR = Path("./playwright_data")
STORAGE_STATE = PLAYWRIGHT_DIR / "storage_state.json"
LOCK_FILE = PLAYWRIGHT_DIR / "cookie_refresh.lock"
SESSION_MAX_AGE = 60 * 60 * 24 * 7  # 1 week


def cookies_expired():
    """
    Check if the cookies (storage_state.json) have expired.
    If file does not exist or is older than SESSION_MAX_AGE → return True.
    """
    if not STORAGE_STATE.exists():
        print("⚠️  No storage_state.json found — need refresh.")
        return True
    age = time.time() - STORAGE_STATE.stat().st_mtime
    expired = age > SESSION_MAX_AGE
    if expired:
        print("⚠️  Cookies expired — need refresh.")
    else:
        print(f"✅ Cookies valid — age {age/3600:.1f} hours old.")
    return expired


def refresh_cookies(headless=True):
    """
    Launch Playwright (Chromium) to refresh Google/YouTube login session.
    Uses a file lock to ensure only one process runs this at a time.
    """
    PLAYWRIGHT_DIR.mkdir(parents=True, exist_ok=True)

    # Ensure only one process can refresh cookies at a time
    with FileLock(str(LOCK_FILE)):
        print("🔒 Acquired lock for cookie refresh...")

        with sync_playwright() as p:
            # Launch Chromium (headless by default, disable sandbox for Docker)
            browser = p.chromium.launch(
                headless=headless,
                args=["--no-sandbox", "--disable-setuid-sandbox"]
            )

            # Reuse existing session if available
            context_args = {}
            if STORAGE_STATE.exists():
                context_args["storage_state"] = str(STORAGE_STATE)

            context = browser.new_context(**context_args)
            page = context.new_page()

            # Visit Google login to ensure session refresh
            page.goto("https://accounts.google.com/ServiceLogin")
            print("⚡ Loading Google login page to refresh session...")
            time.sleep(5)  # Wait for JS to initialize; adjust if needed

            # Save the refreshed session
            context.storage_state(path=STORAGE_STATE)
            print(f"✅ Refreshed session saved at {STORAGE_STATE}")

            browser.close()
        print("🔓 Released cookie lock.")


if __name__ == "__main__":
    """
    Main entry point.
    Run this script to automatically refresh cookies if needed.
    Safe for multi-worker environments (e.g., Gunicorn).
    """
    PLAYWRIGHT_DIR.mkdir(parents=True, exist_ok=True)
    if cookies_expired():
        refresh_cookies(headless=True)
    else:
        print("✅ Cookies still valid, no refresh needed.")
