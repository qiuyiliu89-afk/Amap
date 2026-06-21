# GitHub Upload Notes

This folder is a clean GitHub upload copy of Amap AI Campaign Studio.

Included:
- React + Vite source code
- Netlify Functions for server-side Ark API calls
- Render backend server for long-running Ark API calls
- required public homepage visual assets
- project docs
- package and build config files
- `.env.example`

Excluded intentionally:
- `.env.local` and real secrets
- `node_modules`
- `dist`
- `.git` history
- local temp/cache/log files
- unused reference screenshots and slicing assets

After uploading to GitHub and deploying on Netlify, configure server-only environment variables with the Functions scope:

- `ARK_API_KEY`
- `ARK_BASE_URL`
- `ARK_MODEL`
- `ARK_IMAGE_MODEL`
- `ARK_IMAGE_SIZE`
- `ARK_IMAGE_RESPONSE_FORMAT`

Do not put a real API key in any `VITE_` environment variable.

If using Render to avoid Netlify Function 504 timeouts:

1. Create a Render Web Service from this GitHub repository.
2. Use `npm install` as the Build Command.
3. Use `npm run render:start` as the Start Command.
4. Add the `ARK_*` variables to Render.
5. Add these browser-safe variables to Netlify and redeploy the frontend:
   - `VITE_ARK_RESPONSE_API_URL=https://<render-service>.onrender.com/api/ark-response`
   - `VITE_ARK_IMAGE_API_URL=https://<render-service>.onrender.com/api/ark-image`
6. Optional Render rate-limit controls:
   - `ARK_RETRY_ATTEMPTS=4`
   - `ARK_RETRY_BASE_DELAY_MS=2500`
   - `ARK_IMAGE_REQUEST_GAP_MS=2500`
