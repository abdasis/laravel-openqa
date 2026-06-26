import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

// Build mandiri package OpenQA. Output ke dist/, dilayani via route /e2e/assets/*.
// base harus cocok dengan prefix route (config openqa.path, default /e2e) agar
// chunk lazy (dynamic import) dimuat dari /e2e/assets/* bukan root /assets/*.
const base = (process.env.OPENQA_BASE ?? '/e2e').replace(/\/+$/, '') + '/';

export default defineConfig({
    base,
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'resources/js'),
        },
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        manifest: true,
        rollupOptions: {
            input: resolve(__dirname, 'resources/js/app.tsx'),
        },
    },
});
