import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests/e2e',timeout:45000,workers:1,use:{baseURL:'http://127.0.0.1:4173',headless:true,trace:'retain-on-failure'},webServer:{command:'npm run preview',url:'http://127.0.0.1:4173',reuseExistingServer:true},projects:[{name:'chromium',use:{browserName:'chromium'}}]});
