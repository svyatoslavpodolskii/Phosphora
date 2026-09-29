import {defineConfig} from '@playwright/test';
import {fileURLToPath} from 'node:url';
export default defineConfig({testDir:'pages',workers:1,timeout:45000,use:{baseURL:'http://127.0.0.1:4185',browserName:'chromium'},webServer:{command:'node scripts/pages-test-server.mjs',cwd:fileURLToPath(new URL('..',import.meta.url)),url:'http://127.0.0.1:4185',reuseExistingServer:false}});
