import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'e2e',testMatch:['rich-editor.spec.ts','direct-link.spec.ts','task-board.spec.ts','native-backup.spec.ts'],timeout:45000,workers:1,outputDir:'../test-results/milestone',use:{baseURL:'http://127.0.0.1:4190',headless:true,trace:'retain-on-failure'},projects:[{name:'chromium',use:{browserName:'chromium'}}]});
