import {defineConfig} from '@playwright/test';
import base from '../playwright.config';
const external=process.env.PHOSPHORA_TEST_URL;
export default defineConfig({...base,testDir:'./e2e',testMatch:['firefox-zoom.spec.ts','navigation.spec.ts'],grep:/small viewport|spatial search|transient menu|reduced-motion/,use:{...base.use,baseURL:external||'http://127.0.0.1:4175'},projects:[{name:'firefox',use:{browserName:'firefox'}}],webServer:external?undefined:{command:'npm run preview -- --port 4175 --strictPort',url:'http://127.0.0.1:4175',reuseExistingServer:false}});
