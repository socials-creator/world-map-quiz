# 🌐 Where in the World

A fast, mobile-first interactive geography game designed for iPhone and GitHub Pages.

The goal is simple:

> Find the country shown at the top of the map.

Tap the country directly on the map to answer.

---

## Features

- 🌎 Interactive world map
- 📱 Designed for iPhone touch screens
- 🗺️ Detailed 10m world map geometry
- 🎯 Direct country selection
- 🔍 Pinch/drag/zoom-friendly map
- ➕ Zoom in / zoom out / reset controls
- ❤️ Up to 5 mistakes per round
- 📊 Found / Missed / Remaining counters
- 🕘 Last 10 game results
- 🏆 Persistent high score
- 🔄 Play again after each round
- ☰ Information drawer
- ⚡ No backend required
- 💾 Scores stored locally in the browser

---

## Number of countries

The game contains **197 quiz countries/entities**.

The list includes:

- 193 United Nations member states
- Palestine
- Holy See / Vatican City
- Kosovo
- Taiwan

This keeps the game close to the commonly used "197 countries" count while still including every UN member state.

### Territories are NOT separate quiz questions

Dependent and overseas territories are not presented as separate countries.

Examples include:

- Greenland → Denmark
- Faroe Islands → Denmark
- Puerto Rico → United States
- Guam → United States
- Bermuda → United Kingdom
- Cayman Islands → United Kingdom
- French Guiana → France
- French Polynesia → France
- Réunion → France
- New Caledonia → France
- Hong Kong → China
- Macao → China
- Christmas Island → Australia
- Cocos Islands → Australia
- Tokelau → New Zealand
- Curaçao → Netherlands

This prevents the game from treating dependent territories as independent countries.

---

## Kashmir gameplay region

For the purposes of this game, the wider Kashmir gameplay region requested for the game is assigned to **India's colour**.

The gameplay overlay includes:

- Jammu and Kashmir
- Ladakh
- Aksai Chin
- Shaksgam Valley
- Pakistan-administered Kashmir

The boundaries used by the game are intentionally chosen gameplay boundaries rather than an attempt to represent an international legal position.

The area is clickable as **India**.

---

## Country selection

The game uses the visible country shapes themselves as the primary touch targets.

There is intentionally no large transparent hit-target layer covering the map.

This is important for mobile devices because overlapping transparent hit targets can intercept taps and make the visible country underneath impossible to select.

The current version therefore uses:

```text
Visible country
      ↓
Direct tap
      ↓
Country selection