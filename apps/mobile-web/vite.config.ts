import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // /config.json 은 레포 루트의 public-config/ 에서 그대로 서빙합니다.
  publicDir: '../../public-config',
});
