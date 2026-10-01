import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/e2e',use:{baseURL:'http://127.0.0.1:3000',channel:process.env.PLAYWRIGHT_CHANNEL||'chromium',headless:true},webServer:{command:'npm run dev -- --port 3000',url:'http://127.0.0.1:3000/demo',reuseExistingServer:true},workers:1});
