import {defineConfig} from 'vite';
export default defineConfig({build:{outDir:'artifacts/legacy',emptyOutDir:true,rollupOptions:{input:'tests/legacy.worker.ts',output:{entryFileNames:'legacy-worker.js'}}},worker:{format:'es'}});
