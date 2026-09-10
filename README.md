# Where in the World 🌐

A modern, pinch-zoomable geography game: you're given a country name and you tap it on the map. Built as static HTML/CSS/JS — no build step, no backend, deploys straight to GitHub Pages.

**V2 changes:** thinner borders, disputed regions (Aksai Chin, Pakistan-administered Kashmir) shown as a neutral grey overlay outside the quiz, New Game + Last 10 Games moved onto the home screen instead of behind the hamburger, and rounds now run until every country is placed or you rack up 5 misses.

## Features

- **New game**, always visible in the control row — no menu digging. A round runs until you've placed **every country on the map, or you reach 5 misses**, whichever comes first. The next country is usually picked from the same continent you're already in, with an occasional (~28% of the time) jump to a different continent to keep you on your toes.
- **Last 10 games**, always visible as a scrollable strip under the control row, and **highest score ever**, in the hamburger drawer — saved locally in your browser (`localStorage`), no account needed.
- The hamburger (☰) now only holds secondary, check-occasionally info: highest score, how a round works, and the map legend — not anything needed to start or track a game.
- Every country is colored so that **no two neighboring countries share a color** — computed automatically at load time from each country's actual border adjacency (graph coloring).
- Disputed regions (Aksai Chin, Pakistan-administered Kashmir) are drawn as a neutral grey overlay, excluded from the quiz — see "A note on borders" below.
- Pinch-to-zoom and drag-to-pan on touch devices, plus on-screen zoom buttons for desktop/mouse. Country borders are thin hairlines that stay thin at any zoom level (non-scaling stroke).
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

The map uses a standard, widely-used open geographic dataset (Natural Earth, via `world-atlas`) rather than any single country's official claimed boundaries. Several regions in the world have borders that are disputed between countries (for example in South Asia, the Middle East, and elsewhere); this app intentionally uses neutral reference boundaries for gameplay rather than adopting one nation's territorial claims over another's.

Two specific areas — **Aksai Chin** (administered by China, claimed by India) and **Pakistan-administered Kashmir** (Azad Kashmir and Gilgit-Baltistan, claimed by India) — are drawn as a separate grey "disputed" overlay rather than folded into any one country, since the underlying 110m dataset doesn't ship these as separate shapes. The outlines are hand-simplified approximations for gameplay, not a precise or legal boundary reference, and these regions are excluded from the quiz (you're never asked to find them, and they're not clickable — clicks pass through to whatever's beneath). If you need a more precise disputed-areas source, Natural Earth publishes a dedicated `ne_10m_admin_0_disputed_areas` layer you could load and merge in instead of the hand-drawn polygons in `script.js` (the `DISPUTED_REGIONS` constant).

## Customizing

- **Ending conditions**: change `MAX_MISTAKES` in `script.js` (currently 5; a round also always ends once every country has been asked).
- **How often it jumps continents**: change `SAME_CONTINENT_PROBABILITY` (0–1, higher = stays local more).
- **Color palette**: edit the `PALETTE` array in `script.js`.
- **Disputed region outlines**: edit the `DISPUTED_REGIONS` constant in `script.js`.
- **Fonts / colors**: edit the `:root` variables at the top of `style.css`.
