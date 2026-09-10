# Where in the World 🌐

A modern, pinch-zoomable geography game: you're given a country name and you tap it on the map. Built as static HTML/CSS/JS — no build step, no backend, deploys straight to GitHub Pages.

**V10 changes:**
- Country colors now shift each time you start a new game (New Game / Play Again), instead of staying fixed for the whole session. The neighbor-coloring rule (no two adjacent countries share a color) is still respected — only the starting point in the palette is randomized.

**V9 changes:**
- **Fixed: long country names got cut off in the question box.** The prompt card had a hard `140px` max-width and a fixed `2.2rem` font size, so longer names (e.g. "Democratic Republic of the Congo") overflowed or were clipped. The card now grows up to ~340px, the name scales down smoothly for longer text (`clamp()`), and wraps onto a second line if needed instead of being cut off.
- Updated the map legend copy for Jammu & Kashmir / Ladakh.

**V8 changes (bug fixes — countries weren't clickable, and a false "map failed to load" message appeared even though the map rendered fine):**
- **Fixed: countries not tappable.** The click handler was attached with a plain `"click"` listener. On touch devices, `d3-zoom` calls `preventDefault()` on `touchstart` (to stop the page scrolling while you pan the map), which also suppresses the synthetic `"click"` event browsers normally fire after a tap — so taps silently did nothing, even though the map looked correct and a mouse click worked fine. Replaced it with a `pointerdown`/`pointerup` based tap detector (small movement + short duration = a tap), which isn't affected by that suppression and works the same for mouse and touch.
- **Fixed: false "Map data failed to load" message.** That message is meant only for a genuine failed/broken fetch of the map data. Previously, code that ran *after* the map had already drawn successfully — saving/loading your local history and high score via `localStorage` — could throw (e.g. private browsing, strict browser privacy settings, some embedded browsers block `localStorage` entirely) and that error was being caught by the same handler as a real network failure, showing a misleading "check your connection" message even though the map was fine. `localStorage` access is now wrapped so a storage failure degrades gracefully (history/high score just won't persist for that session) instead of throwing, and is isolated from the map-load error path entirely.
- Reordered map drawing so the invisible tap layer is set up immediately after the visible countries, before the (non-essential) disputed-region overlay — so even if something unexpected happens while drawing that overlay, it can no longer prevent the map from being clickable.

**V6 changes:** fixed a critical bug — V5 pointed the map at `countries-10m.json`, which isn't actually published in the `world-atlas` CDN package, so the map silently failed to load (you'd just see the empty ocean background). Reverted to the working 50m dataset and added an error message if map data ever fails to load again. Also implemented the ~197-country target properly: dependencies and overseas territories (Greenland, Puerto Rico, Hong Kong, French Guiana, and ~50 others) are now excluded from the quiz and visually colored the same as their administering country, and clicking one now correctly counts as answering for that country. Kept the coloring-distribution fix from V5 (see below) rather than reverting it — it was correct and validated; the "only green" report was actually this same data-loading bug, not a coloring bug.

**V5 changes:** fixed the coloring algorithm so islands (which have no bordering neighbors to constrain their color) spread across the full palette instead of collapsing onto one dominant color, and swapped out two palette colors that were blending into the ocean background.

**V4 changes:** ~197 UN member countries (attempted via 10m data — see V6 fix above); fixed click detection on touch devices using d3's click-distance tolerance; question card now minimal (just emoji + skip button); Jammu & Kashmir, Ladakh, Aksai Chin, Shaksgam Valley, and Pakistan-administered Kashmir now displayed with India's color to show regional grouping, with clear borders to denote their disputed status.

**V3 changes:** much higher max zoom (up to 40×) plus an invisible wider tap-margin; switched to 50m data for better Caribbean/Pacific coverage; missed/skipped countries now pan/zoom and pulse on the map; fixed continent-classification bug for dateline-crossing Pacific nations.

## Features

- **New game**, always visible in the control row — no menu digging. A round runs until you've placed **every country on the map, or you reach 5 misses**, whichever comes first. The next country is usually picked from the same continent you're already in, with an occasional (~28% of the time) jump to a different continent to keep you on your toes.
- **Last 10 games**, always visible as a scrollable strip under the control row, and **highest score ever**, in the hamburger drawer — saved locally in your browser (`localStorage`), no account needed. If your browser blocks local storage, the game still works fully — it just won't remember your history between visits.
- The hamburger (☰) now only holds secondary, check-occasionally info: highest score, how a round works, and the map legend — not anything needed to start or track a game.
- Every country is colored so that **no two neighboring countries share a color** — computed automatically at load time from each country's actual border adjacency (graph coloring).
- Disputed regions (Aksai Chin, Pakistan-administered Kashmir) are drawn as a neutral grey overlay, excluded from the quiz — see "A note on borders" below.
- Pinch-to-zoom and drag-to-pan on touch devices, plus on-screen zoom buttons for desktop/mouse, zoomable up to 40×. Country borders are thin hairlines that stay thin at any zoom level (non-scaling stroke), and every country has an invisible slightly-wider tap margin so thin or small shapes (Portugal, small islands) are easier to hit precisely. Tapping/clicking is handled with a pointer-based tap detector so it's reliable on both touch and mouse (see V8 changelog above).
- Miss a country or skip it, and the map pans and zooms in on the correct one, pulsing its border for a moment, before moving on.
- Warm, editorial visual style (Fraunces serif display + Inter body) rather than a generic dashboard look.

## Territories and dependencies

The quiz targets only legitimate sovereign countries (~197: the 193 UN members plus Vatican, Palestine, Kosovo, and Taiwan). Overseas territories and dependencies — Greenland, Puerto Rico, Hong Kong, French Guiana, and roughly 50 others — are filtered out of the question pool via a curated name list (`EXCLUDE_FROM_QUIZ` in `script.js`) and colored the same as their administering country (`DEPENDENCY_PARENT`), so clicking one counts as answering for that country.

This filtering matches against the exact "name" property in the map data, so it's inherently best-effort — if you spot a territory still showing up as its own quiz question, add its exact on-screen name to `EXCLUDE_FROM_QUIZ` (and to `DEPENDENCY_PARENT` if you want it colored with a parent country).

## The disputed Kashmir region

The area comprising Jammu & Kashmir, Ladakh, Aksai Chin, Shaksgam Valley, and Pakistan-administered Kashmir is displayed with the same fill color as India, but with clear borders to denote their disputed status. This is a visual choice to show regional grouping; the borders are simplified reference lines for gameplay, not a legal boundary. These regions are excluded from the quiz (you're never asked to name them individually).

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

- **Country dataset**: change `WORLD_URL` in `script.js` to point to a different TopoJSON source (currently uses Natural Earth 50m via `world-atlas@2`).
- **Ending conditions**: change `MAX_MISTAKES` (currently 5; a round also ends once every country has been asked).
- **How often it jumps continents**: change `SAME_CONTINENT_PROBABILITY` (0–1, higher = stays local more).
- **Tap tolerance**: change `TAP_MAX_MOVE_PX` / `TAP_MAX_DURATION_MS` at the top of `script.js` (how far/long a press can be and still count as a tap rather than a pan).
- **Color palette**: edit the `PALETTE` array in `script.js`.
- **Disputed region outlines**: edit the `DISPUTED_REGIONS` constant in `script.js`.
- **Fonts / colors**: edit the `:root` variables at the top of `style.css`.
- **Question card size**: edit the `.prompt-card` CSS class.
