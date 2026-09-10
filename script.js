/* ============================================================
   Where in the World — geography pointing game (V8)
   Data: Natural Earth via world-atlas (CDN), TopoJSON
   ============================================================ */

// 50m resolution — confirmed to exist in the world-atlas CDN package.
// (V5 pointed this at countries-10m.json hoping for full UN coverage, but
// that file isn't published in this package, so the fetch silently failed
// and no countries ever drew — which is why the map went blank/green.
// We now hit the ~197 UN-country target differently: by excluding known
// dependencies/territories from the quiz below, rather than by dataset
// resolution — see EXCLUDE_FROM_QUIZ.)
const WORLD_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";
const MAX_MISTAKES = 5;
const SAME_CONTINENT_PROBABILITY = 0.72; // chance the next country stays in-region
const REVEAL_ZOOM_MS = 650;    // pan/zoom duration when pointing to a missed country
const REVEAL_HOLD_MS = 1700;   // how long we linger before the next question

// Tap-detection tuning (V8): replaces relying on the browser's synthetic
// "click" event, which d3-zoom's preventDefault() on touchstart can
// suppress on touch devices — see the V8 changelog note in README.
const TAP_MAX_MOVE_PX = 10;
const TAP_MAX_DURATION_MS = 600;

const STORAGE_HISTORY_KEY = "geoGame.history.v6";
const STORAGE_HIGH_KEY = "geoGame.highScore.v6";

/* ---------- Regions whose sovereignty is contested: Jammu & Kashmir,
   Ladakh, Aksai Chin, Shaksgam Valley, Pakistan-administered Kashmir.
   These are drawn with India's color and clear borders. Excluded from quiz. ---------- */

const DISPUTED_REGIONS = [
  {
    name: "Jammu & Kashmir",
    coordinates: [[[
      [74.50, 32.20], [75.20, 32.30], [76.10, 32.50], [76.80, 33.20],
      [76.95, 34.20], [77.25, 35.00], [76.95, 35.85], [76.35, 36.40],
      [75.65, 36.60], [75.10, 36.30], [74.75, 35.50], [74.40, 34.80],
      [74.50, 32.20]
    ]]]
  },
  {
    name: "Ladakh",
    coordinates: [[[
      [77.25, 32.80], [78.60, 32.50], [79.20, 33.05], [79.65, 34.00],
      [80.05, 35.20], [79.75, 36.05], [78.85, 35.95], [77.95, 35.30],
      [77.45, 34.50], [77.25, 32.80]
    ]]]
  },
  {
    name: "Aksai Chin",
    coordinates: [[[
      [78.40, 34.90], [79.00, 34.30], [79.50, 34.05], [80.20, 34.25],
      [80.50, 34.95], [80.10, 35.40], [79.40, 35.60], [78.70, 35.35],
      [78.40, 34.90]
    ]]]
  },
  {
    name: "Shaksgam Valley",
    coordinates: [[[
      [75.80, 35.85], [76.45, 35.70], [77.10, 36.20], [76.70, 36.85],
      [76.05, 36.70], [75.80, 35.85]
    ]]]
  },
  {
    name: "Pakistan-administered Kashmir",
    coordinates: [[[
      [73.10, 33.80], [74.00, 33.40], [74.90, 33.60], [75.80, 34.35],
      [76.90, 35.00], [77.10, 36.00], [76.60, 36.80], [75.60, 36.90],
      [74.40, 36.75], [73.40, 36.05], [72.85, 34.90], [73.10, 33.80]
    ]]]
  }
];

const disputedFeatureCollection = {
  type: "FeatureCollection",
  features: DISPUTED_REGIONS.map(r => ({
    type: "Feature",
    properties: { name: r.name },
    geometry: { type: "Polygon", coordinates: r.coordinates }
  }))
};

let indiaColorIndex = -1; // will be set once features load

/* ---------- Dependencies & overseas territories: not asked as separate
   quiz countries, and drawn with their administering country's color so
   they read as part of that country rather than their own entity.
   Name matching is best-effort against Natural Earth's "name" property —
   if you spot a territory still being quizzed, add its exact on-map name
   to EXCLUDE_FROM_QUIZ (and to DEPENDENCY_PARENT if it has a clear parent). ---------- */

const EXCLUDE_FROM_QUIZ = new Set([
  "Greenland", "Puerto Rico", "French Guiana", "Guadeloupe", "Martinique",
  "Mayotte", "Réunion", "Reunion", "French Polynesia", "New Caledonia",
  "Saint Pierre and Miquelon", "Wallis and Futuna", "Saint Barthelemy",
  "Saint Martin", "Fr. S. Antarctic Lands", "French Southern and Antarctic Lands",
  "Hong Kong", "Hong Kong S.A.R.", "Macao", "Macau", "Macau S.A.R.",
  "Faroe Islands", "Faroe Is.", "Bermuda", "Cayman Islands", "Cayman Is.",
  "British Virgin Islands", "British Virgin Is.", "Turks and Caicos Islands",
  "Turks and Caicos Is.", "Falkland Islands", "Falkland Is.", "Gibraltar",
  "Isle of Man", "Jersey", "Guernsey", "Anguilla", "Montserrat",
  "Saint Helena", "Saint Helena, Ascension and Tristan da Cunha",
  "British Indian Ocean Territory", "Pitcairn Islands", "Pitcairn",
  "South Georgia and the Islands", "South Georgia and South Sandwich Islands",
  "Aruba", "Curaçao", "Curacao", "Sint Maarten", "Bonaire", "Sint Eustatius",
  "American Samoa", "Guam", "Northern Mariana Islands", "N. Mariana Islands",
  "United States Virgin Islands", "U.S. Virgin Islands", "U.S. Virgin Is.",
  "Norfolk Island", "Christmas Island", "Cocos Islands", "Cocos (Keeling) Islands",
  "Cook Islands", "Niue", "Tokelau", "Svalbard", "Svalbard and Jan Mayen",
  "Åland", "Aland", "Åland Islands",
  // Contested areas with no single administering "parent" — excluded from
  // the quiz but left with their own neutral color, same reasoning as the
  // Kashmir region above (not assigned to any one claimant).
  "Western Sahara", "W. Sahara", "Somaliland", "N. Cyprus", "Northern Cyprus",
  "Akrotiri and Dhekelia", "Bouvet Island", "Heard Island and McDonald Islands",
  "French Southern Territories",
]);

const DEPENDENCY_PARENT = {
  "Greenland": "Denmark", "Faroe Islands": "Denmark", "Faroe Is.": "Denmark",
  "Puerto Rico": "United States of America",
  "American Samoa": "United States of America",
  "Guam": "United States of America",
  "Northern Mariana Islands": "United States of America", "N. Mariana Islands": "United States of America",
  "United States Virgin Islands": "United States of America",
  "U.S. Virgin Islands": "United States of America", "U.S. Virgin Is.": "United States of America",
  "French Guiana": "France", "Guadeloupe": "France", "Martinique": "France",
  "Mayotte": "France", "Réunion": "France", "Reunion": "France",
  "French Polynesia": "France", "New Caledonia": "France",
  "Saint Pierre and Miquelon": "France", "Wallis and Futuna": "France",
  "Saint Barthelemy": "France", "Saint Martin": "France",
  "Fr. S. Antarctic Lands": "France", "French Southern and Antarctic Lands": "France",
  "Hong Kong": "China", "Hong Kong S.A.R.": "China",
  "Macao": "China", "Macau": "China", "Macau S.A.R.": "China",
  "Bermuda": "United Kingdom", "Cayman Islands": "United Kingdom", "Cayman Is.": "United Kingdom",
  "British Virgin Islands": "United Kingdom", "British Virgin Is.": "United Kingdom",
  "Turks and Caicos Islands": "United Kingdom", "Turks and Caicos Is.": "United Kingdom",
  "Falkland Islands": "United Kingdom", "Falkland Is.": "United Kingdom",
  "Gibraltar": "United Kingdom", "Isle of Man": "United Kingdom",
  "Jersey": "United Kingdom", "Guernsey": "United Kingdom",
  "Anguilla": "United Kingdom", "Montserrat": "United Kingdom",
  "Saint Helena": "United Kingdom", "Saint Helena, Ascension and Tristan da Cunha": "United Kingdom",
  "British Indian Ocean Territory": "United Kingdom",
  "Pitcairn Islands": "United Kingdom", "Pitcairn": "United Kingdom",
  "South Georgia and the Islands": "United Kingdom",
  "South Georgia and South Sandwich Islands": "United Kingdom",
  "Aruba": "Netherlands", "Curaçao": "Netherlands", "Curacao": "Netherlands",
  "Sint Maarten": "Netherlands", "Bonaire": "Netherlands", "Sint Eustatius": "Netherlands",
  "Norfolk Island": "Australia", "Christmas Island": "Australia",
  "Cocos Islands": "Australia", "Cocos (Keeling) Islands": "Australia",
  "Cook Islands": "New Zealand", "Niue": "New Zealand", "Tokelau": "New Zealand",
  "Svalbard": "Norway", "Svalbard and Jan Mayen": "Norway",
  "Åland": "Finland", "Aland": "Finland", "Åland Islands": "Finland",
};

/* ---------- DOM refs ---------- */

const els = {
  map: document.getElementById("map"),
  liveScore: document.getElementById("live-score"),
  liveMistakes: document.getElementById("live-mistakes"),
  liveRemaining: document.getElementById("live-remaining"),
  newGameBtn: document.getElementById("new-game-btn"),
  skipBtn: document.getElementById("skip-btn"),
  promptCountry: document.getElementById("prompt-country"),
  feedbackToast: document.getElementById("feedback-toast"),
  highScoreNumber: document.getElementById("high-score-number"),
  highScoreOutof: document.getElementById("high-score-outof"),
  historyList: document.getElementById("history-list"),
  resultOverlay: document.getElementById("result-overlay"),
  resultTitle: document.getElementById("result-title"),
  resultScore: document.getElementById("result-score"),
  resultCopy: document.getElementById("result-copy"),
  playAgainBtn: document.getElementById("play-again-btn"),
  closeResultBtn: document.getElementById("close-result-btn"),
  menuToggle: document.getElementById("menu-toggle"),
  drawer: document.getElementById("sidebar"),
  drawerClose: document.getElementById("drawer-close"),
  drawerScrim: document.getElementById("drawer-scrim"),
  zoomIn: document.getElementById("zoom-in"),
  zoomOut: document.getElementById("zoom-out"),
  zoomReset: document.getElementById("zoom-reset"),
};

// Verify all required elements exist
if (!els.map || !els.newGameBtn || !els.promptCountry) {
  console.error("Missing critical DOM elements — page may not have loaded fully");
}

/* ---------- Map setup ---------- */

let width = els.map.clientWidth;
let height = els.map.clientHeight;

const svg = d3.select("#map").append("svg")
  .attr("viewBox", `0 0 ${width} ${height}`);

const g = svg.append("g");
const countryLayer = g.append("g").attr("class", "country-layer");
const disputedLayer = g.append("g").attr("class", "disputed-layer");
const hitLayer = g.append("g").attr("class", "hit-layer"); // invisible, wider tap targets, always on top

const projection = d3.geoNaturalEarth1();
const path = d3.geoPath(projection);

const MAX_SCALE = 40; // was 10 in V1/V2 — needed to comfortably tap small countries

const zoomBehavior = d3.zoom()
  .scaleExtent([1, MAX_SCALE])
  .clickDistance(5)  // any movement < 5px treated as click, not drag — fixes touch detection
  .on("zoom", (event) => g.attr("transform", event.transform));

svg.call(zoomBehavior).on("dblclick.zoom", null);

els.zoomIn.addEventListener("click", () => svg.transition().duration(200).call(zoomBehavior.scaleBy, 1.7));
els.zoomOut.addEventListener("click", () => svg.transition().duration(200).call(zoomBehavior.scaleBy, 1 / 1.7));
els.zoomReset.addEventListener("click", () => svg.transition().duration(300).call(zoomBehavior.transform, d3.zoomIdentity));

window.addEventListener("resize", () => {
  width = els.map.clientWidth;
  height = els.map.clientHeight;
  svg.attr("viewBox", `0 0 ${width} ${height}`);
  projection.fitSize([width, height], { type: "Sphere" });
  countryLayer.selectAll("path.country").attr("d", path);
  disputedLayer.selectAll("path.disputed-region").attr("d", path);
  hitLayer.selectAll("path.hit-target").attr("d", path);
});

/* ---------- Palette for neighbor-safe coloring ---------- */

// Deliberately avoids teal/seafoam tones, which would blend into the ocean
// background below, and keeps every color reasonably saturated so borders
// stay legible against both the map's ocean and the cream page background.
const PALETTE = [
  "#D97757", "#3D5A80", "#E8B04B", "#7C6FB0",
  "#4A7FA5", "#C9425A", "#588157", "#E0664E",
  "#B5651D", "#8E44AD", "#D4A24C", "#2F4858",
];

function colorForIndex(i) {
  if (i >= 0 && i < PALETTE.length) return PALETTE[i];
  if (i < 0) return PALETTE[0]; // defensive: never index with -1 (e.g. India not found)
  const hue = (i * 47) % 360;
  return `hsl(${hue} 55% 55%)`;
}

/* ---------- Rough continent bucket from centroid, used only to bias question order ---------- */

function continentFromCentroid([lon, lat]) {
  // Pacific nations near the antimeridian can have centroid longitude
  // reported as either strongly positive or strongly negative — handle
  // both ends first so e.g. Samoa/Fiji/Tonga land in Oceania, not the Americas.
  if (lon >= 110 || lon <= -130) return lat > 15 ? "Asia" : "Oceania";
  if (lon < -30) return lat > 15 ? "North America" : "South America";
  if (lon < 60) return lat > 30 ? "Europe" : "Africa";
  return lat > -10 ? "Asia" : "Oceania";
}

/* ---------- Game state ---------- */

let features = [];      // array of geojson features, index = id
let neighborsOf = [];    // array of neighbor index arrays
let continentOf = [];    // array of continent strings
let nameOf = [];
let sovereignIndices = []; // feature indices that are legitimate quiz targets
let parentIndexOf = [];    // for a dependency, the index of its administering country; else null

let game = {
  active: false,
  score: 0,
  mistakes: 0,
  targetIndex: null,
  remaining: [],   // indices not yet asked this round
  asked: [],       // indices already asked this round
};

/* Resolve a clicked feature to the country it should count as — a click on
   a dependency (e.g. Greenland) counts as its administering country (Denmark). */
function resolveSovereignIndex(i) {
  const p = parentIndexOf[i];
  return (p !== null && p !== undefined) ? p : i;
}

/* ---------- Load data ---------- */

d3.json(WORLD_URL).then((world) => {
  // --- Step 1: parse the fetched TopoJSON into usable game data. Errors
  // here mean we genuinely have no map to show, so they fall through to
  // the outer .catch() below, which is the correct "reload the page" case.
  const objectKey = Object.keys(world.objects)[0];
  const collection = topojson.feature(world, world.objects[objectKey]);
  const rawNeighbors = topojson.neighbors(world.objects[objectKey].geometries);

  const keepIndex = [];
  collection.features.forEach((f, i) => {
    if (f.geometry && f.properties.name !== "Antarctica") keepIndex.push(i);
  });
  features = keepIndex.map(i => collection.features[i]);

  const oldToNew = new Map(keepIndex.map((oldI, newI) => [oldI, newI]));
  neighborsOf = keepIndex.map((oldI) =>
    rawNeighbors[oldI].filter(n => oldToNew.has(n)).map(n => oldToNew.get(n))
  );

  nameOf = features.map(f => f.properties.name);
  continentOf = features.map(f => continentFromCentroid(d3.geoCentroid(f)));

  const nameToIndex = new Map(nameOf.map((n, i) => [n, i]));
  parentIndexOf = nameOf.map((name) => {
    const parentName = DEPENDENCY_PARENT[name];
    return (parentName && nameToIndex.has(parentName)) ? nameToIndex.get(parentName) : null;
  });
  sovereignIndices = features.map((_, i) => i).filter(i => !EXCLUDE_FROM_QUIZ.has(nameOf[i]));

  if (!features.length) {
    throw new Error("Parsed world data but found zero renderable country features.");
  }

  assignColors();
  drawMap();

  // --- Step 2: everything below is "nice to have" (persisted history /
  // high score). V6/V7 let a failure here (e.g. localStorage blocked by
  // browser privacy settings) bubble up to the same .catch() as a real
  // network failure, which wrongly told players to check their connection
  // even though the map had already drawn correctly. V8 isolates this so
  // a storage problem can never masquerade as a map-load failure, and the
  // game stays fully playable (just without persistence) if it happens.
  try {
    loadHighScore();
    renderHistory();
  } catch (err) {
    console.warn("Non-fatal: history/high-score init failed, continuing without it.", err);
  }
}).catch((err) => {
  console.error("Failed to load or parse map data:", err);
  els.promptCountry.textContent = "⚠️";
  showToast("Map data failed to load — check your connection and reload the page", "bad");
});

/* ---------- Graph coloring: no two neighboring countries share a color ---------- */

function assignColors() {
  const colorIndexOf = new Array(features.length).fill(-1);
  const order = features.map((_, i) => i)
    .sort((a, b) => neighborsOf[b].length - neighborsOf[a].length);

  let nextExtra = PALETTE.length; // only used if a node's neighbors exhaust the whole palette

  order.forEach((i) => {
    const used = new Set(neighborsOf[i].map(n => colorIndexOf[n]).filter(c => c !== -1));

    // Countries with no neighbors (most islands) have nothing constraining
    // their color, so a fixed starting point would send all of them to the
    // same color. Rotate the starting point by each country's own index
    // instead, so islands spread across the whole palette.
    let c = i % PALETTE.length;
    let tries = 0;
    while (used.has(c) && tries < PALETTE.length) {
      c = (c + 1) % PALETTE.length;
      tries++;
    }
    if (used.has(c)) c = nextExtra++; // rare: more neighbors than palette colors

    colorIndexOf[i] = c;
  });

  // Dependencies/territories inherit their administering country's color,
  // so they read visually as part of that country rather than their own entity.
  parentIndexOf.forEach((parentI, i) => {
    if (parentI !== null && parentI !== undefined) colorIndexOf[i] = colorIndexOf[parentI];
  });

  features.forEach((f, i) => { f.__colorIndex = colorIndexOf[i]; });
}

/* ---------- Draw ---------- */

// V8: the hit-layer (which carries the tap/click handlers) is now drawn
// immediately after the visible countries, and BEFORE the disputed-region
// overlay. Previously the disputed-region draw happened first; if anything
// in that step ever threw, the function returned early and the hit-layer
// (and therefore every click handler) never got attached at all — the map
// would still look correct, because the countries had already been painted,
// but nothing would be clickable. Tapping now works even if the disputed
// overlay has a problem.
function drawMap() {
  projection.fitSize([width, height], { type: "Sphere" });

  // Visual layer — the countries themselves.
  countryLayer.selectAll("path.country")
    .data(features)
    .join("path")
    .attr("class", "country")
    .attr("d", path)
    .attr("fill", d => colorForIndex(d.__colorIndex))
    .attr("data-index", (d, i) => i);

  // Invisible hit layer on top of everything: a few extra screen-pixels of
  // tappable margin around each country's true border, so thin or tiny
  // shapes (Portugal, small islands) are easier to hit precisely.
  //
  // V8: uses pointerdown/pointerup tap-detection instead of the "click"
  // event. On touch devices, d3-zoom calls preventDefault() on touchstart
  // (to stop the page from scrolling while panning the map), and that also
  // suppresses the synthetic "click" event browsers normally fire after a
  // tap — so a plain .on("click", ...) handler here silently never fires
  // on phones/tablets, even though it works fine with a mouse. Listening
  // for the raw pointer events instead sidesteps that entirely.
  let pointerDownInfo = null;

  hitLayer.selectAll("path.hit-target")
    .data(features)
    .join("path")
    .attr("class", "hit-target")
    .attr("d", path)
    .attr("data-index", (d, i) => i)
    .on("pointerdown", (event, d) => {
      pointerDownInfo = {
        x: event.clientX,
        y: event.clientY,
        time: Date.now(),
        index: features.indexOf(d),
      };
    })
    .on("pointerup", (event, d) => {
      if (!pointerDownInfo) return;
      const dx = event.clientX - pointerDownInfo.x;
      const dy = event.clientY - pointerDownInfo.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const dt = Date.now() - pointerDownInfo.time;
      const idx = pointerDownInfo.index;
      pointerDownInfo = null;
      // Only counts as a tap/click if the pointer didn't move far and
      // wasn't held down for a drag/long-press — otherwise it was panning.
      if (dist <= TAP_MAX_MOVE_PX && dt <= TAP_MAX_DURATION_MS) {
        handleCountryClick(idx);
      }
    })
    .on("pointercancel", () => { pointerDownInfo = null; });

  // Disputed regions: drawn with India's color, clear borders, visual grouping.
  // Not part of the quiz (excluded from questions and not clickable).
  // Wrapped in try/catch: this is a cosmetic overlay, so if it ever fails
  // (e.g. an unexpected India lookup miss) it shouldn't take the rest of
  // the map — which is already drawn and clickable above — down with it.
  try {
    const indiaIndex = features.findIndex(f => f.properties.name === "India");
    indiaColorIndex = indiaIndex >= 0 ? features[indiaIndex].__colorIndex : 0;

    disputedLayer.selectAll("path.disputed-region")
      .data(disputedFeatureCollection.features)
      .join("path")
      .attr("class", "disputed-region")
      .attr("d", path)
      .attr("fill", colorForIndex(indiaColorIndex));
  } catch (err) {
    console.warn("Non-fatal: disputed-region overlay failed to draw.", err);
  }
}

/* ---------- Game flow ---------- */

els.newGameBtn.addEventListener("click", startGame);
els.playAgainBtn.addEventListener("click", () => { closeResult(); startGame(); });
els.closeResultBtn.addEventListener("click", closeResult);
els.skipBtn.addEventListener("click", () => {
  if (!game.active) return;
  game.mistakes++;
  showToast(`It was ${nameOf[game.targetIndex]}`, "bad");
  revealCountry(game.targetIndex);
  finishTurn(false);
});

function startGame() {
  if (!sovereignIndices.length) return;
  game = {
    active: true,
    score: 0,
    mistakes: 0,
    targetIndex: null,
    remaining: sovereignIndices.slice(),
    asked: [],
  };
  els.skipBtn.disabled = false;
  updateLiveStats();
  pickNext();
}

function pickNext() {
  if (!game.remaining.length) { endGame("completed"); return; }

  const prev = game.targetIndex;
  let pool;

  if (prev === null) {
    pool = game.remaining;
  } else {
    const sameContinent = game.remaining.filter(i => continentOf[i] === continentOf[prev]);
    const jump = Math.random() > SAME_CONTINENT_PROBABILITY || sameContinent.length === 0;
    pool = jump ? game.remaining : sameContinent;
  }

  const next = pool[Math.floor(Math.random() * pool.length)];
  game.targetIndex = next;
  game.remaining = game.remaining.filter(i => i !== next);
  game.asked.push(next);

  els.promptCountry.textContent = nameOf[next];
  updateLiveStats();
}

function handleCountryClick(clickedIndex) {
  if (!game.active) return;
  if (clickedIndex === null || clickedIndex === undefined || clickedIndex < 0) return;

  const target = game.targetIndex;
  const resolved = resolveSovereignIndex(clickedIndex); // a territory click counts as its parent country
  const isCorrect = resolved === target;

  if (isCorrect) {
    game.score++;
    showToast("Correct!", "good");
    const el = countryLayer.select(`path[data-index="${clickedIndex}"]`);
    el.classed("correct-flash", true);
    setTimeout(() => el.classed("correct-flash", false), 500);
    finishTurn(true);
  } else {
    game.mistakes++;
    const wrongEl = countryLayer.select(`path[data-index="${clickedIndex}"]`);
    wrongEl.classed("wrong-flash", true);
    setTimeout(() => wrongEl.classed("wrong-flash", false), 650);
    showToast(`That was ${nameOf[resolved]} — here's ${nameOf[target]}`, "bad");
    revealCountry(target);
    finishTurn(false);
  }
}

/* Pans/zooms the map to center on a country and pulses its border, so a
   miss or skip visibly points at the right answer rather than just naming it. */
function revealCountry(index) {
  const feature = features[index];
  const el = countryLayer.select(`path[data-index="${index}"]`);
  el.raise().classed("reveal-pulse", true);
  setTimeout(() => el.classed("reveal-pulse", false), REVEAL_HOLD_MS - 50);

  const bounds = path.bounds(feature);
  const [[x0, y0], [x1, y1]] = bounds;
  const bw = x1 - x0, bh = y1 - y0;
  if (!bw || !bh) return;

  const pad = 90;
  const scale = Math.max(1, Math.min(MAX_SCALE * 0.7, 0.9 / Math.max(bw / (width - pad), bh / (height - pad))));
  const tx = width / 2 - scale * (x0 + bw / 2);
  const ty = height / 2 - scale * (y0 + bh / 2);

  svg.transition().duration(REVEAL_ZOOM_MS).call(
    zoomBehavior.transform,
    d3.zoomIdentity.translate(tx, ty).scale(scale)
  );
}

function finishTurn(wasCorrect) {
  updateLiveStats();
  const delay = wasCorrect ? 500 : REVEAL_HOLD_MS;

  setTimeout(() => {
    if (game.mistakes >= MAX_MISTAKES) {
      endGame("mistakes");
      return;
    }
    if (!game.remaining.length) {
      endGame("completed");
      return;
    }
    if (!wasCorrect) {
      svg.transition().duration(500).call(zoomBehavior.transform, d3.zoomIdentity);
    }
    pickNext();
  }, delay);
}

function endGame(reason) {
  game.active = false;
  els.skipBtn.disabled = true;
  els.promptCountry.textContent = reason === "completed" ? "🏆" : "🏁";

  saveResult(game.score, game.mistakes, sovereignIndices.length, reason === "completed");
  showResult(reason);
}

function updateLiveStats() {
  els.liveScore.textContent = game.score;
  els.liveMistakes.textContent = `${game.mistakes} / ${MAX_MISTAKES}`;
  els.liveRemaining.textContent = game.active ? game.remaining.length : "—";
}

function showToast(msg, kind) {
  els.feedbackToast.textContent = msg;
  els.feedbackToast.className = `feedback-toast show ${kind}`;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    els.feedbackToast.classList.remove("show");
  }, 900);
}

/* ---------- Result overlay ---------- */

function showResult(reason) {
  els.resultTitle.textContent = reason === "completed" ? "You placed every country!" : "Game over — 5 misses";
  els.resultScore.textContent = `${game.score} / ${sovereignIndices.length}`;
  els.resultCopy.textContent = reason === "completed"
    ? "Every country on the map, found. That's a full round."
    : "Every round sharpens your map sense. Go again?";
  els.resultOverlay.classList.add("show");
}
function closeResult() { els.resultOverlay.classList.remove("show"); }

/* ---------- Persistence ---------- */

// V8: localStorage can throw (private browsing, strict cookie/privacy
// settings, some embedded/in-app browsers) instead of just being empty.
// V6/V7 called it directly, so that exception could escape all the way up
// to the map-load .catch() and show a false "map failed to load" message
// even though the map was fine. Now every localStorage touch goes through
// these helpers, which fall back to an in-memory copy for the current
// session (history/high score just won't persist across reloads) instead
// of throwing.
let storageAvailable = true;
let memoryHistory = [];
let memoryHighScore = 0;

(function checkStorage() {
  try {
    const testKey = "__geoGame_storage_test__";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
  } catch (err) {
    storageAvailable = false;
    console.warn("localStorage is unavailable — history and high score will not persist across reloads this session.", err);
  }
})();

function readHistory() {
  if (!storageAvailable) return memoryHistory;
  try {
    return JSON.parse(localStorage.getItem(STORAGE_HISTORY_KEY) || "[]");
  } catch (err) {
    console.warn("Non-fatal: could not read saved history.", err);
    return memoryHistory;
  }
}

function writeHistory(history) {
  memoryHistory = history;
  if (!storageAvailable) return;
  try {
    localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(history));
  } catch (err) {
    console.warn("Non-fatal: could not save history.", err);
  }
}

function readHighScore() {
  if (!storageAvailable) return memoryHighScore;
  try {
    return Number(localStorage.getItem(STORAGE_HIGH_KEY) || 0);
  } catch (err) {
    console.warn("Non-fatal: could not read saved high score.", err);
    return memoryHighScore;
  }
}

function writeHighScore(value) {
  memoryHighScore = value;
  if (!storageAvailable) return;
  try {
    localStorage.setItem(STORAGE_HIGH_KEY, String(value));
  } catch (err) {
    console.warn("Non-fatal: could not save high score.", err);
  }
}

function saveResult(score, mistakes, total, completed) {
  const history = readHistory();
  history.unshift({ score, mistakes, total, completed, date: new Date().toISOString() });
  writeHistory(history.slice(0, 10));

  const high = readHighScore();
  if (score > high) writeHighScore(score);

  renderHistory();
  loadHighScore();
}

function loadHighScore() {
  const high = readHighScore();
  els.highScoreNumber.textContent = high;
  els.highScoreOutof.textContent = `of ${sovereignIndices.length || "—"} countries`;
}

function renderHistory() {
  const history = readHistory();
  if (!history.length) {
    els.historyList.innerHTML = `<li class="history-empty">No games yet — play one to see it here.</li>`;
    return;
  }
  els.historyList.innerHTML = history.map(h => {
    const d = new Date(h.date);
    const dateStr = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const cls = h.completed ? "completed" : "";
    return `<li class="${cls}"><span class="history-score">${h.score}</span><span class="history-date">${dateStr}</span></li>`;
  }).join("");
}

/* ---------- Secondary drawer (hamburger): High score + About only ---------- */

function openDrawer() {
  els.drawer.classList.add("open");
  els.drawerScrim.classList.add("show");
}
function closeDrawer() {
  els.drawer.classList.remove("open");
  els.drawerScrim.classList.remove("show");
}
els.menuToggle.addEventListener("click", openDrawer);
els.drawerClose.addEventListener("click", closeDrawer);
els.drawerScrim.addEventListener("click", closeDrawer);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });
