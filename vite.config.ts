import path from 'path';
import react from '@vitejs/plugin-react';
// FIX: Removed unused 'loadEnv' which was causing a TypeScript error.
import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';

// FIX: In an ES module, __dirname is not available. This is the standard way to derive it.
// This resolves the "Cannot find name '__dirname'" error.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // FIX: This line was removed to fix "Property 'cwd' does not exist on type 'Process'".
  // The 'env' variable was also unused.
  // const env = loadEnv(mode, process.cwd(), '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  };
});
