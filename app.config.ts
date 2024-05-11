import { defineConfig } from "@solidjs/start/config";
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  vite: {
    plugins: [solidPlugin()],
  },
  server: {
    preset: "vercel"
  }
});
