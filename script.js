/* ============================================================
   Where in the World — geography pointing game (V13)
   V13 changes:
   - Swapped the world boundary data source from world-atlas@2
     (Natural Earth) to the cB-Abhinav-Gautam/World-Map-India-Complete
     topology, which already draws India's boundary to its full
     claim (Aksai Chin, Shaksgam Valley, Siachen, PoK) with matching
     shared borders against Pakistan and China. WORLD_URL now points
     at a local file, world-topo.json, shipped alongside this repo
     instead of a CDN.
   - Removed the DISPUTED_REGIONS overlay hack (Jammu & Kashmir,
     Ladakh, Aksai Chin, Shaksgam Valley, Pakistan-administered
     Kashmir polygons drawn in India's color on top of the map).
     It's no longer needed: the new topology already encodes India's
     boundary correctly at the source, so there's nothing left to
     patch over.
   - Country name property changed from properties.name (lowercase,
     Natural Earth convention) to properties.NAME (uppercase,
     matching this dataset's convention). Every place that reads a
     feature's name was updated to match.
   - Added "Somaliland" to EXCLUDE_FROM_QUIZ / DEPENDENCY_PARENT:
     this dataset includes it as its own polygon, but it's an
     unrecognized breakaway region, not a playable country, so it's
     colored and treated the same way the existing map already
     treats Northern Cyprus.
   Everything else — palette, zoom levels (MAX_SCALE, click
   distances), tap-detection thresholds, continent-jump logic,
   scoring, history/high-score persistence, portrait/landscape
   layouts — is untouched from V11.
   ============================================================ */

const WORLD_URL = "./world-topo.json";
const MAX_MISTAKES = 5;
const SAME_CONTINENT_PROBABILITY = 0.72;
const REVEAL_ZOOM_MS = 650;
const REVEAL_HOLD_MS = 1700;

// Islands mode plays the reveal in slow motion — a longer pan/zoom and a
// longer hold — so a missed or skipped island has time to actually sink in
// before the round moves on to the next one.
const ISLAND_REVEAL_ZOOM_MS = 1500;
const ISLAND_REVEAL_HOLD_MS = 3400;

// Tap detection: these thresholds work for both mouse and touch.
// We use SVG-space coordinates now (see handlePointerUp) so movement
// thresholds don't need to compensate for device-pixel-ratio differences.
const TAP_MAX_MOVE_PX = 12;
const TAP_MAX_DURATION_MS = 600;

const STORAGE_HISTORY_KEY = "geoGame.history.v6";
const STORAGE_HIGH_KEY = "geoGame.highScore.v6";

/* ---------- Territories excluded from quiz ---------- */

const EXCLUDE_FROM_QUIZ = new Set([
  "Greenland","Puerto Rico","French Guiana","Guadeloupe","Martinique",
  "Mayotte","Réunion","Reunion","French Polynesia","New Caledonia",
  "Saint Pierre and Miquelon","Wallis and Futuna","Saint Barthelemy",
  "Saint Martin","Fr. S. Antarctic Lands","French Southern and Antarctic Lands",
  "Hong Kong","Hong Kong S.A.R.","Macao","Macau","Macau S.A.R.",
  "Faroe Islands","Faroe Is.","Bermuda","Cayman Islands","Cayman Is.",
  "British Virgin Islands","British Virgin Is.","Turks and Caicos Islands",
  "Turks and Caicos Is.","Falkland Islands","Falkland Is.","Gibraltar",
  "Isle of Man","Jersey","Guernsey","Anguilla","Montserrat",
  "Saint Helena","Saint Helena, Ascension and Tristan da Cunha",
  "British Indian Ocean Territory","Pitcairn Islands","Pitcairn",
  "South Georgia and the Islands","South Georgia and South Sandwich Islands",
  "Aruba","Curaçao","Curacao","Sint Maarten","Bonaire","Sint Eustatius",
  "American Samoa","Guam","Northern Mariana Islands","N. Mariana Islands",
  "United States Virgin Islands","U.S. Virgin Islands","U.S. Virgin Is.",
  "Norfolk Island","Christmas Island","Cocos Islands","Cocos (Keeling) Islands",
  "Cook Islands","Niue","Tokelau","Svalbard","Svalbard and Jan Mayen",
  "Åland","Aland","Åland Islands",
  "Western Sahara","W. Sahara","Somaliland","N. Cyprus","Northern Cyprus",
  "Akrotiri and Dhekelia","Bouvet Island","Heard Island and McDonald Islands",
  "French Southern Territories",
]);

const DEPENDENCY_PARENT = {
  "Greenland":"Denmark","Faroe Islands":"Denmark","Faroe Is.":"Denmark",
  "Puerto Rico":"United States of America",
  "American Samoa":"United States of America",
  "Guam":"United States of America",
  "Northern Mariana Islands":"United States of America","N. Mariana Islands":"United States of America",
  "United States Virgin Islands":"United States of America",
  "U.S. Virgin Islands":"United States of America","U.S. Virgin Is.":"United States of America",
  "French Guiana":"France","Guadeloupe":"France","Martinique":"France",
  "Mayotte":"France","Réunion":"France","Reunion":"France",
  "French Polynesia":"France","New Caledonia":"France",
  "Saint Pierre and Miquelon":"France","Wallis and Futuna":"France",
  "Saint Barthelemy":"France","Saint Martin":"France",
  "Fr. S. Antarctic Lands":"France","French Southern and Antarctic Lands":"France",
  "Hong Kong":"China","Hong Kong S.A.R.":"China",
  "Macao":"China","Macau":"China","Macau S.A.R.":"China",
  "Bermuda":"United Kingdom","Cayman Islands":"United Kingdom","Cayman Is.":"United Kingdom",
  "British Virgin Islands":"United Kingdom","British Virgin Is.":"United Kingdom",
  "Turks and Caicos Islands":"United Kingdom","Turks and Caicos Is.":"United Kingdom",
  "Falkland Islands":"United Kingdom","Falkland Is.":"United Kingdom",
  "Gibraltar":"United Kingdom","Isle of Man":"United Kingdom",
  "Jersey":"United Kingdom","Guernsey":"United Kingdom",
  "Anguilla":"United Kingdom","Montserrat":"United Kingdom",
  "Saint Helena":"United Kingdom","Saint Helena, Ascension and Tristan da Cunha":"United Kingdom",
  "British Indian Ocean Territory":"United Kingdom",
  "Pitcairn Islands":"United Kingdom","Pitcairn":"United Kingdom",
  "South Georgia and the Islands":"United Kingdom",
  "South Georgia and South Sandwich Islands":"United Kingdom",
  "Aruba":"Netherlands","Curaçao":"Netherlands","Curacao":"Netherlands",
  "Sint Maarten":"Netherlands","Bonaire":"Netherlands","Sint Eustatius":"Netherlands",
  "Norfolk Island":"Australia","Christmas Island":"Australia",
  "Cocos Islands":"Australia","Cocos (Keeling) Islands":"Australia",
  "Cook Islands":"New Zealand","Niue":"New Zealand","Tokelau":"New Zealand",
  "Svalbard":"Norway","Svalbard and Jan Mayen":"Norway",
  "Åland":"Finland","Aland":"Finland","Åland Islands":"Finland",
  "Somaliland":"Somalia",
};

/* ---------- Islands game mode ---------- */

// Names here must match properties.NAME in world-topo.json exactly.
// This roughly follows a "biggest to smallest" spread — Australia (the
// largest landmass entirely surrounded by ocean) down through the island
// nations of the Pacific — but note the underlying map data only includes
// islands large enough to render at this resolution, so true micro-states
// like Nauru or Tuvalu aren't present as separate shapes and can't be
// included here.
const ISLAND_NAMES = new Set([
  "Australia", "New Zealand", "Papua New Guinea", "Indonesia", "Philippines",
  "Japan", "United Kingdom", "Ireland", "Iceland", "Cuba", "Sri Lanka",
  "Taiwan", "Madagascar", "Dominican Rep.", "Haiti", "Bahamas", "Jamaica",
  "Trinidad and Tobago", "Timor-Leste", "Cyprus", "Fiji", "Vanuatu",
  "Solomon Is.", "New Caledonia",
]);

/* ---------- DOM refs ---------- */

const els = {
  map: document.getElementById("map"),
  // Portrait stats
  liveScore: document.getElementById("live-score"),
  liveMistakes: document.getElementById("live-mistakes"),
  liveRemaining: document.getElementById("live-remaining"),
  // Portrait prompt
  promptLabel: document.getElementById("prompt-label"),
  promptCountry: document.getElementById("prompt-country"),
  skipBtn: document.getElementById("skip-btn"),
  newGameBtn: document.getElementById("new-game-btn"),
  modeCountriesBtn: document.getElementById("mode-countries-btn"),
  modeIslandsBtn: document.getElementById("mode-islands-btn"),
  // Landscape stats
  lsScore: document.getElementById("ls-score"),
  lsMistakes: document.getElementById("ls-mistakes"),
  lsRemaining: document.getElementById("ls-remaining"),
  lsPromptLabel: document.getElementById("ls-prompt-label"),
  lsPromptCountry: document.getElementById("ls-prompt-country"),
  lsSkipBtn: document.getElementById("skip-btn-ls"),
  lsNewGameBtn: document.getElementById("new-game-btn-ls"),
  lsPromptSection: document.getElementById("ls-prompt-section"),
  landscapeSidebar: document.getElementById("landscape-sidebar"),
  sidebarToggle: document.getElementById("sidebar-toggle"),
  modeCountriesBtnLs: document.getElementById("mode-countries-btn-ls"),
  modeIslandsBtnLs: document.getElementById("mode-islands-btn-ls"),
  // Shared
  feedbackToast: document.getElementById("feedback-toast"),
  highScoreNumber: document.getElementById("high-score-number"),
  highScoreOutof: document.getElementById("high-score-outof"),
  historyListPortrait: document.getElementById("history-list-portrait"),
  historyListLandscape: document.getElementById("history-list-landscape"),
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

/* ---------- Orientation / landscape detection ---------- */

function isLandscape() {
  if (window.matchMedia) {
    return window.matchMedia("(orientation: landscape)").matches;
  }
  return window.innerWidth > window.innerHeight;
}

let landscapeSidebarCollapsed = false;

function applySidebarState() {
  if (landscapeSidebarCollapsed) {
    els.landscapeSidebar.classList.add("collapsed");
  } else {
    els.landscapeSidebar.classList.remove("collapsed");
  }
}

els.sidebarToggle.addEventListener("click", () => {
  landscapeSidebarCollapsed = !landscapeSidebarCollapsed;
  applySidebarState();
  setTimeout(handleResize, 260);
});

/* ---------- Map setup ---------- */

let width = 0;
let height = 0;

const svg = d3.select("#map").append("svg");
const g = svg.append("g");
const countryLayer = g.append("g").attr("class", "country-layer");
const hitLayer = g.append("g").attr("class", "hit-layer");

const projection = d3.geoNaturalEarth1();
const path = d3.geoPath(projection);

const MAX_SCALE = 4000;

const zoomBehavior = d3.zoom()
  .scaleExtent([1, MAX_SCALE])
  .clickDistance(5)
  .on("zoom", (event) => g.attr("transform", event.transform));

svg.call(zoomBehavior).on("dblclick.zoom", null);

els.zoomIn.addEventListener("click", () =>
  svg.transition().duration(200).call(zoomBehavior.scaleBy, 1.7));
els.zoomOut.addEventListener("click", () =>
  svg.transition().duration(200).call(zoomBehavior.scaleBy, 1 / 1.7));
els.zoomReset.addEventListener("click", () =>
  svg.transition().duration(300).call(zoomBehavior.transform, d3.zoomIdentity));

/* ---------- Resize handler ---------- */

function handleResize() {
  width = els.map.clientWidth;
  height = els.map.clientHeight;
  if (!width || !height) return;

  svg.attr("viewBox", `0 0 ${width} ${height}`)
     .attr("width", width)
     .attr("height", height);

  projection.fitSize([width, height], { type: "Sphere" });

  countryLayer.selectAll("path.country").attr("d", path);
  hitLayer.selectAll("path.hit-target").attr("d", path);

  svg.call(zoomBehavior.transform, d3.zoomIdentity);
}

window.addEventListener("orientationchange", () => {
  setTimeout(handleResize, 150);
});

window.addEventListener("resize", () => {
  clearTimeout(handleResize._t);
  handleResize._t = setTimeout(handleResize, 80);
});

/* ---------- Palette ---------- */

const PALETTE = [
  "#D97757","#3D5A80","#E8B04B","#7C6FB0",
  "#4A7FA5","#C9425A","#588157","#E0664E",
  "#B5651D","#8E44AD","#D4A24C","#2F4858",
];

function colorForIndex(i) {
  if (i >= 0 && i < PALETTE.length) return PALETTE[i];
  if (i < 0) return PALETTE[0];
  const hue = (i * 47) % 360;
  return `hsl(${hue} 55% 55%)`;
}

/* ---------- Continent from centroid ---------- */

function continentFromCentroid([lon, lat]) {
  if (lon >= 110 || lon <= -130) return lat > 15 ? "Asia" : "Oceania";
  if (lon < -30) return lat > 15 ? "North America" : "South America";
  if (lon < 60) return lat > 30 ? "Europe" : "Africa";
  return lat > -10 ? "Asia" : "Oceania";
}

/* ---------- Game state ---------- */

let features = [];
let neighborsOf = [];
let continentOf = [];
let nameOf = [];
let sovereignIndices = [];
let islandIndices = [];
let parentIndexOf = [];

let currentMode = "countries"; // "countries" | "islands"

let game = {
  active: false,
  mode: "countries",
  score: 0,
  mistakes: 0,
  targetIndex: null,
  remaining: [],
  asked: [],
};

function poolForMode(mode) {
  return mode === "islands" ? islandIndices : sovereignIndices;
}

function resolveSovereignIndex(i) {
  const p = parentIndexOf[i];
  return (p !== null && p !== undefined) ? p : i;
}

// In Countries mode, tapping a dependency (e.g. Puerto Rico) should count
// as its sovereign parent (the United States). In Islands mode the
// dependency itself is often the actual quiz target (e.g. New Caledonia),
// so it must NOT be collapsed into its parent or a correct tap would
// register as wrong.
function resolveIndexForMode(i, mode) {
  return mode === "islands" ? i : resolveSovereignIndex(i);
}

/* ---------- Load data ---------- */

d3.json(WORLD_URL).then((world) => {
  const objectKey = Object.keys(world.objects)[0];
  const collection = topojson.feature(world, world.objects[objectKey]);
  const rawNeighbors = topojson.neighbors(world.objects[objectKey].geometries);

  const keepIndex = [];
  collection.features.forEach((f, i) => {
    if (f.geometry && f.properties.NAME !== "Antarctica") keepIndex.push(i);
  });
  features = keepIndex.map(i => collection.features[i]);

  const oldToNew = new Map(keepIndex.map((oldI, newI) => [oldI, newI]));
  neighborsOf = keepIndex.map((oldI) =>
    rawNeighbors[oldI].filter(n => oldToNew.has(n)).map(n => oldToNew.get(n))
  );

  nameOf = features.map(f => f.properties.NAME);
  continentOf = features.map(f => continentFromCentroid(d3.geoCentroid(f)));

  const nameToIndex = new Map(nameOf.map((n, i) => [n, i]));
  parentIndexOf = nameOf.map((name) => {
    const parentName = DEPENDENCY_PARENT[name];
    return (parentName && nameToIndex.has(parentName)) ? nameToIndex.get(parentName) : null;
  });
  sovereignIndices = features.map((_, i) => i).filter(i => !EXCLUDE_FROM_QUIZ.has(nameOf[i]));
  islandIndices = features.map((_, i) => i).filter(i => ISLAND_NAMES.has(nameOf[i]));

  if (!features.length) throw new Error("Zero renderable features after parse.");

  try {
    initialRender();
  } catch (err) {
    console.error("Map data loaded, but rendering failed:", err);
    showToast("map", "bad");
    setTimeout(() => {
      try {
        initialRender();
        showToast("Map ready", "good");
      } catch (err2) {
        console.error("Retry render also failed:", err2);
        els.promptCountry.textContent = "🌏";
      }
    }, 300);
  }

  try {
    loadHighScore();
    renderHistory();
  } catch (err) {
    console.warn("Non-fatal: history/high-score init failed.", err);
  }
}).catch((err) => {
  console.error("Failed to load or parse map data:", err);
  els.promptCountry.textContent = "⚠️";
  showToast("Map data failed to load — check your connection and reload", "bad");
});

function initialRender() {
  assignColors();
  drawMap();
  handleResize();
}

/* ---------- Graph coloring ---------- */

function assignColors() {
  const colorIndexOf = new Array(features.length).fill(-1);
  const order = features.map((_, i) => i)
    .sort((a, b) => neighborsOf[b].length - neighborsOf[a].length);

  let nextExtra = PALETTE.length;
  const colorOffset = Math.floor(Math.random() * PALETTE.length);

  order.forEach((i) => {
    const used = new Set(neighborsOf[i].map(n => colorIndexOf[n]).filter(c => c !== -1));
    let c = (i + colorOffset) % PALETTE.length;
    let tries = 0;
    while (used.has(c) && tries < PALETTE.length) { c = (c + 1) % PALETTE.length; tries++; }
    if (used.has(c)) c = nextExtra++;
    colorIndexOf[i] = c;
  });

  parentIndexOf.forEach((parentI, i) => {
    if (parentI !== null && parentI !== undefined) colorIndexOf[i] = colorIndexOf[parentI];
  });

  features.forEach((f, i) => { f.__colorIndex = colorIndexOf[i]; });
}

/* ---------- Draw ---------- */

function drawMap() {
  width = els.map.clientWidth || window.innerWidth;
  height = els.map.clientHeight || window.innerHeight;

  if (!width || !height) {
    setTimeout(() => { try { initialRender(); } catch (e) { console.error(e); } }, 200);
    return;
  }

  svg.attr("viewBox", `0 0 ${width} ${height}`)
     .attr("width", width)
     .attr("height", height);

  projection.fitSize([width, height], { type: "Sphere" });

  countryLayer.selectAll("path.country")
    .data(features)
    .join("path")
    .attr("class", "country")
    .attr("d", path)
    .attr("fill", d => colorForIndex(d.__colorIndex))
    .attr("data-index", (d, i) => i);

  let pointerDownInfo = null;

  hitLayer.selectAll("path.hit-target")
    .data(features)
    .join("path")
    .attr("class", "hit-target")
    .attr("d", path)
    .attr("data-index", (d, i) => i)
    .on("pointerdown", (event, d) => {
      const svgPoint = clientToSVGPoint(event.clientX, event.clientY);
      pointerDownInfo = {
        svgX: svgPoint.x,
        svgY: svgPoint.y,
        time: Date.now(),
        index: features.indexOf(d),
      };
    })
    .on("pointerup", (event, d) => {
      if (!pointerDownInfo) return;
      const svgPoint = clientToSVGPoint(event.clientX, event.clientY);
      const dx = svgPoint.x - pointerDownInfo.svgX;
      const dy = svgPoint.y - pointerDownInfo.svgY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const dt = Date.now() - pointerDownInfo.time;
      const idx = pointerDownInfo.index;
      pointerDownInfo = null;
      if (dist <= TAP_MAX_MOVE_PX && dt <= TAP_MAX_DURATION_MS) {
        handleCountryClick(idx);
      }
    })
    .on("pointercancel", () => { pointerDownInfo = null; })
    .on("pointerleave", () => { pointerDownInfo = null; });
}

function clientToSVGPoint(clientX, clientY) {
  const svgEl = svg.node();
  const pt = svgEl.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  try {
    return pt.matrixTransform(svgEl.getScreenCTM().inverse());
  } catch (e) {
    return { x: clientX, y: clientY };
  }
}

/* ---------- Prompt / stats sync ---------- */

function syncPrompt(name) {
  if (els.promptCountry) els.promptCountry.textContent = name;
  if (els.lsPromptCountry) els.lsPromptCountry.textContent = name;
}

function syncStats() {
  const scoreVal = game.score;
  const mistakesVal = `${game.mistakes} / ${MAX_MISTAKES}`;
  const remVal = game.active ? game.remaining.length : "—";

  if (els.liveScore) els.liveScore.textContent = scoreVal;
  if (els.liveMistakes) els.liveMistakes.textContent = mistakesVal;
  if (els.liveRemaining) els.liveRemaining.textContent = remVal;

  if (els.lsScore) els.lsScore.textContent = scoreVal;
  if (els.lsMistakes) els.lsMistakes.textContent = mistakesVal;
  if (els.lsRemaining) els.lsRemaining.textContent = remVal;
}

function syncSkipDisabled(disabled) {
  if (els.skipBtn) els.skipBtn.disabled = disabled;
  if (els.lsSkipBtn) els.lsSkipBtn.disabled = disabled;
}

function syncModeButtonsDisabled(disabled) {
  [els.modeCountriesBtn, els.modeCountriesBtnLs, els.modeIslandsBtn, els.modeIslandsBtnLs]
    .forEach(btn => { if (btn) btn.disabled = disabled; });
}

/* ---------- Game flow ---------- */

function doSkip() {
  if (!game.active) return;
  game.mistakes++;
  showToast(`It was ${nameOf[game.targetIndex]}`, "bad");
  revealCountry(game.targetIndex);
  finishTurn(false);
}

els.newGameBtn.addEventListener("click", () => startGame());
els.lsNewGameBtn.addEventListener("click", () => startGame());
els.playAgainBtn.addEventListener("click", () => { closeResult(); startGame(); });
els.closeResultBtn.addEventListener("click", closeResult);
els.skipBtn.addEventListener("click", doSkip);
els.lsSkipBtn.addEventListener("click", doSkip);

/* ---------- Mode switching ---------- */

function setMode(mode) {
  if (mode !== "countries" && mode !== "islands") return;
  currentMode = mode;

  [els.modeCountriesBtn, els.modeCountriesBtnLs].forEach(btn => {
    if (btn) btn.classList.toggle("active", mode === "countries");
  });
  [els.modeIslandsBtn, els.modeIslandsBtnLs].forEach(btn => {
    if (btn) btn.classList.toggle("active", mode === "islands");
  });

  const label = mode === "islands" ? "Find this island" : "Find this country";
  if (els.promptLabel) els.promptLabel.textContent = label;
  if (els.lsPromptLabel) els.lsPromptLabel.textContent = label;

  loadHighScore();
  renderHistory();
}

[els.modeCountriesBtn, els.modeCountriesBtnLs].forEach(btn => {
  if (btn) btn.addEventListener("click", () => { if (!game.active) setMode("countries"); });
});
[els.modeIslandsBtn, els.modeIslandsBtnLs].forEach(btn => {
  if (btn) btn.addEventListener("click", () => { if (!game.active) setMode("islands"); });
});

function startGame(mode = currentMode) {
  const pool = poolForMode(mode);
  if (!pool.length) return;

  setMode(mode);

  assignColors();
  countryLayer.selectAll("path.country").attr("fill", d => colorForIndex(d.__colorIndex));

  game = {
    active: true,
    mode,
    score: 0,
    mistakes: 0,
    targetIndex: null,
    remaining: pool.slice(),
    asked: [],
  };
  syncSkipDisabled(false);
  syncModeButtonsDisabled(true);
  syncStats();
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

  syncPrompt(nameOf[next]);
  syncStats();
}

function handleCountryClick(clickedIndex) {
  if (!game.active) return;
  if (clickedIndex === null || clickedIndex === undefined || clickedIndex < 0) return;

  const target = game.targetIndex;
  const resolved = resolveIndexForMode(clickedIndex, game.mode);
  const isCorrect = resolved === target;

  if (isCorrect) {
    game.score++;
    showToast("Correct! ✓", "good");
    const el = countryLayer.select(`path[data-index="${clickedIndex}"]`);
    el.classed("correct-flash", true);
    setTimeout(() => el.classed("correct-flash", false), 500);
    finishTurn(true);
  } else {
    game.mistakes++;
    const wrongEl = countryLayer.select(`path[data-index="${clickedIndex}"]`);
    wrongEl.classed("wrong-flash", true);
    setTimeout(() => wrongEl.classed("wrong-flash", false), 650);
    showToast(`${nameOf[resolved]} — here's ${nameOf[target]}`, "bad");
    revealCountry(target);
    finishTurn(false);
  }
}

function revealCountry(index) {
  const slow = game.mode === "islands";
  const zoomMs = slow ? ISLAND_REVEAL_ZOOM_MS : REVEAL_ZOOM_MS;
  const holdMs = slow ? ISLAND_REVEAL_HOLD_MS : REVEAL_HOLD_MS;
  const pulseClass = slow ? "reveal-pulse-slow" : "reveal-pulse";

  const feature = features[index];
  const el = countryLayer.select(`path[data-index="${index}"]`);
  el.raise().classed(pulseClass, true);
  setTimeout(() => el.classed(pulseClass, false), holdMs - 50);

  const bounds = path.bounds(feature);
  const [[x0, y0], [x1, y1]] = bounds;
  const bw = x1 - x0, bh = y1 - y0;
  if (!bw || !bh) return;

  const pad = 80;
  const scale = Math.max(1, Math.min(MAX_SCALE * 0.7,
    0.9 / Math.max(bw / (width - pad), bh / (height - pad))
  ));
  const tx = width / 2 - scale * (x0 + bw / 2);
  const ty = height / 2 - scale * (y0 + bh / 2);

  svg.transition().duration(zoomMs).call(
    zoomBehavior.transform,
    d3.zoomIdentity.translate(tx, ty).scale(scale)
  );
}

function finishTurn(wasCorrect) {
  syncStats();
  const holdMs = game.mode === "islands" ? ISLAND_REVEAL_HOLD_MS : REVEAL_HOLD_MS;
  const delay = wasCorrect ? 500 : holdMs;

  setTimeout(() => {
    if (game.mistakes >= MAX_MISTAKES) { endGame("mistakes"); return; }
    if (!game.remaining.length) { endGame("completed"); return; }
    if (!wasCorrect) {
      svg.transition().duration(400).call(zoomBehavior.transform, d3.zoomIdentity);
    }
    pickNext();
  }, delay);
}

function endGame(reason) {
  game.active = false;
  syncSkipDisabled(true);
  syncModeButtonsDisabled(false);
  const endEmoji = reason === "completed" ? "🏆" : "🏁";
  syncPrompt(endEmoji);

  const total = poolForMode(game.mode).length;
  saveResult(game.score, game.mistakes, total, reason === "completed", game.mode);
  showResult(reason);
}

/* ---------- Toast ---------- */

function showToast(msg, kind) {
  els.feedbackToast.textContent = msg;
  els.feedbackToast.className = `feedback-toast show ${kind}`;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    els.feedbackToast.classList.remove("show");
  }, 1100);
}

/* ---------- Result overlay ---------- */

function showResult(reason) {
  const noun = game.mode === "islands" ? "island" : "country";
  const total = poolForMode(game.mode).length;
  els.resultTitle.textContent =
    reason === "completed" ? `You placed every ${noun}!` : "Game over — 5 misses";
  els.resultScore.textContent = `${game.score} / ${total}`;
  els.resultCopy.textContent = reason === "completed"
    ? `Every ${noun} on the map, found. That's a full round.`
    : "Every round sharpens your map sense. Go again?";
  els.resultOverlay.classList.add("show");
}
function closeResult() { els.resultOverlay.classList.remove("show"); }

/* ---------- Persistence ---------- */

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
    console.warn("localStorage unavailable — no persistence this session.", err);
  }
})();

// Islands mode keeps its own history + high score, separate from Countries
// mode, so switching modes doesn't clobber either scoreboard. Countries
// mode keeps the original (unsuffixed) keys so existing players' saved
// scores carry over unchanged.
let memoryHistoryByMode = { countries: [], islands: [] };
let memoryHighScoreByMode = { countries: 0, islands: 0 };

function historyKey(mode) {
  return mode === "islands" ? `${STORAGE_HISTORY_KEY}.islands` : STORAGE_HISTORY_KEY;
}
function highKey(mode) {
  return mode === "islands" ? `${STORAGE_HIGH_KEY}.islands` : STORAGE_HIGH_KEY;
}

function readHistory(mode = currentMode) {
  if (!storageAvailable) return memoryHistoryByMode[mode] || [];
  try { return JSON.parse(localStorage.getItem(historyKey(mode)) || "[]"); }
  catch (err) { return memoryHistoryByMode[mode] || []; }
}

function writeHistory(history, mode = currentMode) {
  memoryHistoryByMode[mode] = history;
  if (!storageAvailable) return;
  try { localStorage.setItem(historyKey(mode), JSON.stringify(history)); }
  catch (err) { console.warn("Could not save history.", err); }
}

function readHighScore(mode = currentMode) {
  if (!storageAvailable) return memoryHighScoreByMode[mode] || 0;
  try { return Number(localStorage.getItem(highKey(mode)) || 0); }
  catch (err) { return memoryHighScoreByMode[mode] || 0; }
}

function writeHighScore(value, mode = currentMode) {
  memoryHighScoreByMode[mode] = value;
  if (!storageAvailable) return;
  try { localStorage.setItem(highKey(mode), String(value)); }
  catch (err) { console.warn("Could not save high score.", err); }
}

function saveResult(score, mistakes, total, completed, mode = currentMode) {
  const history = readHistory(mode);
  history.unshift({ score, mistakes, total, completed, date: new Date().toISOString() });
  writeHistory(history.slice(0, 10), mode);
  const high = readHighScore(mode);
  if (score > high) writeHighScore(score, mode);
  renderHistory();
  loadHighScore();
}

function loadHighScore() {
  const high = readHighScore(currentMode);
  const total = poolForMode(currentMode).length;
  const noun = currentMode === "islands" ? "islands" : "countries";
  els.highScoreNumber.textContent = high;
  els.highScoreOutof.textContent = `of ${total || "—"} ${noun}`;
}

function renderHistory() {
  const history = readHistory(currentMode);
  const empty = `<li class="history-empty">No games yet.</li>`;
  if (!history.length) {
    els.historyListPortrait.innerHTML = empty;
    els.historyListLandscape.innerHTML = empty;
    return;
  }
  const html = history.map(h => {
    const d = new Date(h.date);
    const dateStr = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const cls = h.completed ? "completed" : "";
    return `<li class="${cls}"><span class="history-score">${h.score}</span><span class="history-date">${dateStr}</span></li>`;
  }).join("");
  els.historyListPortrait.innerHTML = html;
  els.historyListLandscape.innerHTML = html;
}

/* ---------- Drawer (hamburger) ---------- */

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
