# Client Deployment Notes

## Environment Variables

Set the backend URL through `VITE_API_URL`.

Examples:

- Local: `VITE_API_URL=http://localhost:5001`
- Production: `VITE_API_URL=https://your-render-service.onrender.com`

Files included:

- `.env.example` (local template)
- `.env.production` (production template)

## Vercel Setup

- Framework Preset: `Vite`
- Root Directory: `client`
- Build Command: `npm run build`
- Output Directory: `dist`

In Vercel Project Settings -> Environment Variables, add:

- `VITE_API_URL=https://your-render-service.onrender.com`

Then redeploy.
