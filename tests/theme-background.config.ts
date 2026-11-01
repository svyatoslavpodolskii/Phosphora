import {defineConfig} from '@playwright/test';
// Independent runner: reuse main's production preview without building dist.
// Set THEME_TEST_URL=http://127.0.0.1:4191 to verify current source via dev.
export default defineConfig({testDir:'e2e',testMatch:'theme-background.spec.ts',timeout:45000,workers:1,
 outputDir:'../test-results/theme-background',
 use:{baseURL:process.env.THEME_TEST_URL||'http://127.0.0.1:4190',headless:true,trace:'retain-on-failure'},
 projects:[{name:'chromium',use:{browserName:'chromium'}}]});
