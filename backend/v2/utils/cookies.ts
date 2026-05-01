import * as fs from "fs";
import * as path from "path";

const PLAYWRIGHT_DIR = process.env.PLAYWRIGHT_DIR || "/app/playwright_data";
export const COOKIE_TXT_PATH = path.join(PLAYWRIGHT_DIR, "cookies.txt");

/**
 * Seed cookies from /etc/secrets/ to working directory on startup
 * (Render secret files are read-only, need copy to working dir)
 */
export const seedCookiesFromSecrets = (): void => {
  const secretCookiePath = "/etc/secrets/cookies.txt";

  // Create working directory
  if (!fs.existsSync(PLAYWRIGHT_DIR)) {
    fs.mkdirSync(PLAYWRIGHT_DIR, { recursive: true });
  }

  // Copy secret cookies to working dir if it exists
  if (fs.existsSync(secretCookiePath)) {
    try {
      fs.copyFileSync(secretCookiePath, COOKIE_TXT_PATH);
      console.log(`🌱 Seeded ${COOKIE_TXT_PATH} from ${secretCookiePath}`);
    } catch (err) {
      console.error(`⚠️  Failed to seed cookies: ${err}`);
    }
  }
};

/**
 * Check if cookies file exists and is usable
 */
export const hasCookies = (): boolean => {
  return fs.existsSync(COOKIE_TXT_PATH) && fs.statSync(COOKIE_TXT_PATH).size > 0;
};
