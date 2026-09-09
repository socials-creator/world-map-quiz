# Where in the World 🌐

A modern, pinch-zoomable geography game: you're given a country name and you tap it on the map. Built as static HTML/CSS/JS — no build step, no backend, deploys straight to GitHub Pages.

## Features

- **New game** — 15-question rounds. The next country is usually picked from the same continent you're already in, with an occasional (~28% of the time) jump to a different continent to keep you on your toes.
- **Last 10 games** and **highest score ever**, saved locally in your browser (`localStorage`) — no account needed.
- Every country is colored so that **no two neighboring countries share a color** — the map computes this automatically at load time using each country's actual border adjacency (graph coloring), so it stays correct even for edge cases.
- Pinch-to-zoom and drag-to-pan on touch devices, plus on-screen zoom buttons for desktop/mouse.
- Warm, editorial visual style (Fraunces serif display + Inter body) rather than a generic dashboard look.

## Files

```
index.html    structure
style.css     styling
script.js     map rendering + game logic
README.md     this file
```

Map data loads at runtime from a public CDN (`world-atlas`, derived from Natural Earth), so there's nothing to download or bundle.

## Run it locally

Any static file server works, e.g.:

```bash
cd geo-game
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Publish on GitHub Pages

1. Create a new GitHub repository (or use an existing one).
2. Add these four files to the repo root (or to a `/docs` folder if you prefer).
3. Commit and push:
   ```bash
   git init
   git add index.html style.css script.js README.md
   git commit -m "Add geography pointing game"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
4. In the repo on GitHub: **Settings → Pages**.
5. Under **Build and deployment → Source**, choose **Deploy from a branch**.
6. Pick branch `main` and folder `/ (root)` (or `/docs` if that's where you put the files), then **Save**.
7. GitHub will give you a live URL shortly, typically `https://<your-username>.github.io/<your-repo>/`.

No further configuration is needed — everything runs client-side.

## A note on borders

The map uses a standard, widely-used open geographic dataset (Natural Earth, via `world-atlas`) rather than any single country's official claimed boundaries. Several regions in the world have borders that are disputed between countries (for example in South Asia, the Middle East, and elsewhere); this app intentionally uses neutral reference boundaries for gameplay rather than adopting one nation's territorial claims over another's. If you have a specific reason to need a particular country's official boundary set, you can swap in a different GeoJSON/TopoJSON source in `script.js` (the `WORLD_URL` constant), keeping in mind that doing so takes a position on active territorial disputes.

## Customizing

- **Round length**: change `QUESTIONS_PER_GAME` in `script.js`.
- **How often it jumps continents**: change `SAME_CONTINENT_PROBABILITY` (0–1, higher = stays local more).
- **Color palette**: edit the `PALETTE` array in `script.js`.
- **Fonts / colors**: edit the `:root` variables at the top of `style.css`.
