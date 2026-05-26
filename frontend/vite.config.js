import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Expose the dev server to all network interfaces so other devices on the same Wi-Fi can access it.
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    cors: true,
  },
  test: {
    environment: 'jsdom',
  },
});
