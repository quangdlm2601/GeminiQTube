from pathlib import Path
import json
import os

COOKIE_TXT = Path(os.environ.get("COOKIE_TXT", "/app/playwright_data/cookies.txt"))
STORAGE_JSON = Path(os.environ.get("STORAGE_JSON", "/app/playwright_data/storage_state.json"))

def convert_netscape_to_storage_state(cookie_txt_path: Path, storage_json_path: Path):
    cookies = []
    with open(cookie_txt_path) as f:
        for line in f:
            if line.startswith("#") or not line.strip():
                continue
            domain, flag, path_cookie, secure, expires, name, value = line.strip().split("\t")
            cookies.append({
                "name": name,
                "value": value,
                "domain": domain,
                "path": path_cookie,
                "expires": int(expires),
                "httpOnly": False,
                "secure": secure == "TRUE",
            })
    with open(storage_json_path, "w") as f:
        json.dump({"cookies": cookies, "origins": []}, f, indent=2)

if __name__ == "__main__":
    convert_netscape_to_storage_state(COOKIE_TXT, STORAGE_JSON)
    print(f"✅ Converted {COOKIE_TXT} -> {STORAGE_JSON}")
