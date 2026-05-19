# WallGen AI — Deployment Guide

## Project Structure

```
wallgen/
├── index.html        ← Main page (no inline JS)
├── vercel.json       ← Vercel config + CSP headers
├── css/
│   └── style.css     ← All styles
├── js/
│   └── app.js        ← All JavaScript (addEventListener only)
└── README.md
```

## Deploy to Vercel

### Option 1: Vercel CLI
```bash
npm install -g vercel
cd wallgen
vercel --prod
```

### Option 2: Vercel Dashboard (drag & drop)
1. Go to https://vercel.com/new
2. Click "Browse" and select the `wallgen/` folder
3. Click Deploy — no build settings needed (static site)

### Option 3: GitHub
1. Push this folder to a GitHub repo
2. Import the repo at https://vercel.com/new
3. Vercel auto-detects static HTML — click Deploy

## Why it works on Vercel

- **No inline `onclick`** — all events use `addEventListener` (CSP-safe)
- **External images** from `picsum.photos` — free, CORS-open, no API key
- **`vercel.json`** sets a CSP header that explicitly allows picsum.photos images
- **Fallback `onerror`** on every `<img>` — if one URL fails, a backup loads
- **No build step** — pure HTML/CSS/JS, zero dependencies

## Customisation

- **Add real AI generation**: Replace `picsumUrl()` in `app.js` with a call to
  DALL-E 3, Stable Diffusion, or Replicate API
- **Change colour scheme**: Edit CSS variables in `css/style.css` `:root {}`
- **Add more seeds**: Extend the `SEEDS` and `GEN_SEEDS` arrays in `app.js`
