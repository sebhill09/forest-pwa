# Forest — personal focus PWA

**Live:** https://sebhill09.github.io/forest-pwa/ — open in Safari on iPhone, then Share → Add to Home Screen.

An unofficial, personal-use clone of the Forest focus timer. Plant a tree, stay in the app while it grows, and build a forest out of finished focus sessions. If you leave, the tree withers.

Built as a static, offline-capable PWA — no build step, no backend, no account.

## Run locally

```bash
cd forest-pwa
python3 -m http.server 8080
# open http://localhost:8080
```

A service worker is used, so open it over `localhost` or HTTPS (not `file://`).

## Install on iPhone

1. Deploy the folder to any HTTPS static host (GitHub Pages, Netlify, Cloudflare Pages, Vercel…).
2. Open the URL in **Safari** on iPhone.
3. Tap **Share** → **Add to Home Screen**.
4. Launch it from the home screen — it runs full-screen, works offline, and keeps your data on-device.

### Permanent hosting

The app is a static site. Create a public GitHub repository, upload this folder with `index.html` at the repo root, then go to **Settings → Pages → Deploy from a branch → main / (root)**. No build step is required. Netlify, Cloudflare Pages or Vercel also work with a simple folder deploy.

## Features

- Focus timer with plant-a-tree growth stages, sprout → mature
- Leaving the app during a session withers the tree (strict mode kills instantly)
- 12 original tree species, unlockable with coins
- Persistent forest meadow with tappable tree history
- Tags, 7-day chart, streaks, achievements, coin rewards
- Wake-lock support while focusing, soft completion chime
- Offline-first service worker, standalone PWA manifest, safe-area layout
- Local-only data (localStorage), JSON export

## Structure

```
index.html            app shell
css/style.css         design system + layouts
js/trees.js           12 original SVG tree species
js/app.js             state, timer engine, views, achievements
manifest.webmanifest  PWA manifest
sw.js                 offline cache
icons/                icon.svg + generated PNGs
```

## Credits & disclaimer

Inspired by [Forest](https://www.forestapp.cc/) by Seekrtech. Not affiliated with, endorsed by, or connected to Seekrtech. No Forest assets are used — all tree artwork is original. This build does not plant real trees.

Focus data stays in the browser on the device. Nothing is uploaded.
