import {defineConfig} from '@playwright/test';
import {fileURLToPath} from 'node:url';
/** Serves the existing production dist only. The main integration owns builds. */
export default defineConfig({
 testDir:'e2e',testMatch:'folders.spec.ts',workers:1,timeout:60000,
 outputDir:'../test-results/folders',
 use:{baseURL:'http://127.0.0.1:4190',browserName:'chromium',headless:true,viewport:{width:1280,height:800},trace:'retain-on-failure'},
 webServer:{command:'npm run preview -- --host 127.0.0.1 --port 4190 --strictPort',cwd:fileURLToPath(new URL('..',import.meta.url)),url:'http://127.0.0.1:4190',reuseExistingServer:false},
});
