# Where in the World 🌐

A modern, pinch-zoomable geography game: you're given a country name and you tap it on the map. Built as static HTML/CSS/JS — no build step, no backend, deploys straight to GitHub Pages.

**V4 changes:**
- Fixed countries being unselectable — the old invisible "hit-target" overlay layer sat on top of the map and was swallowing taps before they reached a country. Click handling now lives directly on each visible country shape.
- The Jammu & Kashmir / Ladakh / Aksai Chin / Shaksgam Valley / Pakistan-administered Kashmir region is merged into India: same fill color, quizzed as "India," no separate grey overlay. This is a gameplay simplification, not a statement on any country's territorial claims.
- The question card is now compact — just the country name and a Skip button, no explanatory text underneath.
- Exactly **197 quiz countries**: the 193 UN member states plus Palestine, the Holy See (Vatican City), Kosovo, and Taiwan. Overseas territories (Greenland, Puerto Rico, Hong Kong, French Guiana, etc.) are folded into their sovereign country and are never asked as separate answers. Switched to the 10m-resolution `world-atlas` dataset so tiny states like Vatican City, Monaco, and San Marino render as real shapes.

**V3 changes:** higher max zoom (up to 40×); a missed or skipped country now pans/zooms the map to it and pulses its border instead of just naming it; fixed a continent-classification bug that put some Pacific nations in the wrong region bucket.

**V2 changes:** thinner borders, New Game + Last 10 Games moved onto the home screen instead of behind the hamburger, rounds now run until every country is placed or you rack up 5 misses.

## Features

- **New game**, always visible in the control row. A round runs until you've placed **every one of the 197 countries, or reached 5 misses**, whichever comes first. The next country is usually picked from the same continent you're already in, with an occasional jump to a different continent.
- **Last 10 games**, always visible as a scrollable strip under the control row, and **highest score ever**, in the hamburger drawer — saved locally in your browser (`localStorage`), no account needed.
- The hamburger (☰) holds secondary, check-occasionally info: highest score, how a round works, and the map legend.
- Every country is colored so that **no two neighboring countries share a color** — computed automatically at load time from each country's actual border adjacency (graph coloring).
- Pinch-to-zoom and drag-to-pan on touch devices, plus on-screen zoom buttons for desktop/mouse, zoomable up to 40×.
- Miss a country or skip it, and the map pans and zooms to the correct one, pulsing its border for a moment, before moving to the next country.
- Warm, editorial visual style (Fraunces serif display + Inter body) rather than a generic dashboard look.

## Files

```
index.html    structure
style.css     styling
script.js     map rendering + game logic
README.md     this file
```

Map data loads at runtime from a public CDN (`world-atlas` 10m, derived from Natural Earth), so there's nothing to download or bundle.

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
   git commit -m "Where in the World v4"
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

The map uses a standard, widely-used open geographic dataset (Natural Earth, via `world-atlas`) rather than any single country's official claimed boundaries. For this game, the wider Jammu & Kashmir / Ladakh / Aksai Chin / Shaksgam Valley / Pakistan-administered Kashmir region is shown and quizzed as part of India — a gameplay choice made at the requester's direction, not a claim about the region's legal or political status. The outline used for that region is a hand-simplified approximation for gameplay, not a precise or legal boundary reference.

## Customizing

- **Ending conditions**: change `MAX_MISTAKES` in `script.js` (currently 5; a round also always ends once every country has been asked).
- **How often it jumps continents**: change `SAME_CONTINENT_PROBABILITY` (0–1, higher = stays local more).
- **Color palette**: edit the `PALETTE` array in `script.js`.
- **Quiz country list / territory mapping**: edit `QUIZ_COUNTRIES` and `TERRITORY_PARENT` in `script.js`.
- **Kashmir gameplay region outline**: edit the `KASHMIR_FEATURE` constant in `script.js`.
- **Fonts / colors**: edit the `:root` variables at the top of `style.css`.
