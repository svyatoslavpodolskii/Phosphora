import {defineConfig} from '@playwright/test';
import base from '../playwright.config';
export default defineConfig({...base,testDir:'./e2e',use:{...base.use,baseURL:'http://127.0.0.1:4187'},webServer:{command:'npm run preview -- --port 4187 --strictPort',url:'http://127.0.0.1:4187',reuseExistingServer:true}});
