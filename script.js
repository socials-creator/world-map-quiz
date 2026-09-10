/* ============================================================
   Where in the World — geography pointing game (V2)
   Data: Natural Earth via world-atlas (CDN), TopoJSON
   ============================================================ */

const WORLD_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const MAX_MISTAKES = 5;
const SAME_CONTINENT_PROBABILITY = 0.72; // chance the next country stays in-region

const STORAGE_HISTORY_KEY = "geoGame.history.v2";
const STORAGE_HIGH_KEY = "geoGame.highScore.v2";

/* ---------- Rough, simplified outlines for regions whose sovereignty is
   disputed between neighboring countries. Drawn as a neutral grey overlay,
   excluded from the quiz. Coordinates are deliberately simplified — this is
   a gameplay aid, not a legal/political boundary reference. ---------- */

const DISPUTED_REGIONS = [
  {
    name: "Aksai Chin",
    coordinates: [[[
      [78.35, 34.95], [78.85, 34.35], [79.45, 34.05], [80.15, 34.25],
      [80.45, 34.85], [80.05, 35.35], [79.35, 35.55], [78.65, 35.30],
      [78.35, 34.95]
    ]]]
  },
  {
    name: "Pakistan-administered Kashmir",
    coordinates: [[[
      [73.00, 33.75], [73.95, 33.35], [74.85, 33.55], [75.75, 34.30],
      [76.85, 34.95], [77.05, 35.95], [76.55, 36.75], [75.55, 36.95],
      [74.35, 36.75], [73.35, 36.00], [72.75, 34.85], [73.00, 33.75]
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

/* ---------- DOM refs ---------- */

const els = {
  map: document.getElementById("map"),
  liveScore: document.getElementById("live-score"),
  liveMistakes: document.getElementById("live-mistakes"),
  liveRemaining: document.getElementById("live-remaining"),
  newGameBtn: document.getElementById("new-game-btn"),
  skipBtn: document.getElementById("skip-btn"),
  promptLabel: document.getElementById("prompt-label"),
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

/* ---------- Map setup ---------- */

let width = els.map.clientWidth;
let height = els.map.clientHeight;

const svg = d3.select("#map").append("svg")
  .attr("viewBox", `0 0 ${width} ${height}`);

const g = svg.append("g");
const countryLayer = g.append("g").attr("class", "country-layer");
const disputedLayer = g.append("g").attr("class", "disputed-layer");

const projection = d3.geoNaturalEarth1();
const path = d3.geoPath(projection);

const zoomBehavior = d3.zoom()
  .scaleExtent([1, 10])
  .on("zoom", (event) => g.attr("transform", event.transform));

svg.call(zoomBehavior).on("dblclick.zoom", null);

els.zoomIn.addEventListener("click", () => svg.transition().duration(200).call(zoomBehavior.scaleBy, 1.5));
els.zoomOut.addEventListener("click", () => svg.transition().duration(200).call(zoomBehavior.scaleBy, 1 / 1.5));
els.zoomReset.addEventListener("click", () => svg.transition().duration(300).call(zoomBehavior.transform, d3.zoomIdentity));

window.addEventListener("resize", () => {
  width = els.map.clientWidth;
  height = els.map.clientHeight;
  svg.attr("viewBox", `0 0 ${width} ${height}`);
  projection.fitSize([width, height], { type: "Sphere" });
  countryLayer.selectAll("path.country").attr("d", path);
  disputedLayer.selectAll("path.disputed-region").attr("d", path);
});

/* ---------- Palette for neighbor-safe coloring ---------- */

const PALETTE = [
  "#D97757", "#2E6B63", "#E8B04B", "#7C6FB0",
  "#5A9BD5", "#C97A9E", "#8AAE5C", "#E0664E",
  "#4C9A8E", "#D4A24C", "#9B7EDE", "#6FA8DC",
];

function colorForIndex(i) {
  if (i < PALETTE.length) return PALETTE[i];
  const hue = (i * 47) % 360;
  return `hsl(${hue} 55% 55%)`;
}

/* ---------- Rough continent bucket from centroid, used only to bias question order ---------- */

function continentFromCentroid([lon, lat]) {
  if (lon < -30) return lat > 15 ? "North America" : "South America";
  if (lon < 60) return lat > 30 ? "Europe" : "Africa";
  if (lon < 170) return lat > -10 ? "Asia" : "Oceania";
  return "Oceania";
}

/* ---------- Game state ---------- */

let features = [];      // array of geojson features, index = id
let neighborsOf = [];    // array of neighbor index arrays
let continentOf = [];    // array of continent strings
let nameOf = [];

let game = {
  active: false,
  score: 0,
  mistakes: 0,
  targetIndex: null,
  remaining: [],   // indices not yet asked this round
  asked: [],       // indices already asked this round
};

/* ---------- Load data ---------- */

d3.json(WORLD_URL).then((world) => {
  const objectKey = Object.keys(world.objects)[0];
  const collection = topojson.feature(world, world.objects[objectKey]);
  const rawNeighbors = topojson.neighbors(world.objects[objectKey].geometries);

  // Filter out entries with no renderable geometry / Antarctica for playability
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

  assignColors();
  drawMap();
  loadHighScore();
  renderHistory();
});

/* ---------- Graph coloring: no two neighboring countries share a color ---------- */

function assignColors() {
  const colorIndexOf = new Array(features.length).fill(-1);
  const order = features.map((_, i) => i)
    .sort((a, b) => neighborsOf[b].length - neighborsOf[a].length);

  order.forEach((i) => {
    const used = new Set(neighborsOf[i].map(n => colorIndexOf[n]).filter(c => c !== -1));
    let c = 0;
    while (used.has(c)) c++;
    colorIndexOf[i] = c;
  });

  features.forEach((f, i) => { f.__colorIndex = colorIndexOf[i]; });
}

/* ---------- Draw ---------- */

function drawMap() {
  projection.fitSize([width, height], { type: "Sphere" });

  countryLayer.selectAll("path.country")
    .data(features)
    .join("path")
    .attr("class", "country")
    .attr("d", path)
    .attr("fill", d => colorForIndex(d.__colorIndex))
    .attr("data-index", (d, i) => i)
    .on("click", (event, d) => handleCountryClick(features.indexOf(d)));

  // Disputed regions: drawn on top, grey, purely visual (clicks pass through
  // to the country beneath so gameplay is unaffected).
  disputedLayer.selectAll("path.disputed-region")
    .data(disputedFeatureCollection.features)
    .join("path")
    .attr("class", "disputed-region")
    .attr("d", path);
}

/* ---------- Game flow ---------- */

els.newGameBtn.addEventListener("click", startGame);
els.playAgainBtn.addEventListener("click", () => { closeResult(); startGame(); });
els.closeResultBtn.addEventListener("click", closeResult);
els.skipBtn.addEventListener("click", () => {
  if (!game.active) return;
  showToast(`It was ${nameOf[game.targetIndex]}`, "bad");
  game.mistakes++;
  advance();
});

function startGame() {
  if (!features.length) return;
  game = {
    active: true,
    score: 0,
    mistakes: 0,
    targetIndex: null,
    remaining: features.map((_, i) => i),
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

  els.promptLabel.textContent = `Country ${game.asked.length} of ${features.length}`;
  els.promptCountry.textContent = nameOf[next];
  updateLiveStats();
}

function handleCountryClick(clickedIndex) {
  if (!game.active) return;

  const target = game.targetIndex;
  const el = countryLayer.select(`path[data-index="${clickedIndex}"]`);

  if (clickedIndex === target) {
    game.score++;
    showToast("Correct!", "good");
    el.classed("correct-flash", true);
    setTimeout(() => el.classed("correct-flash", false), 500);
  } else {
    game.mistakes++;
    showToast(`That was ${nameOf[clickedIndex]} — target was ${nameOf[target]}`, "bad");
    el.classed("wrong-flash", true);
    countryLayer.select(`path[data-index="${target}"]`).classed("answer-flash", true);
    setTimeout(() => {
      el.classed("wrong-flash", false);
      countryLayer.select(`path[data-index="${target}"]`).classed("answer-flash", false);
    }, 650);
  }

  advance();
}

function advance() {
  updateLiveStats();
  if (game.mistakes >= MAX_MISTAKES) {
    setTimeout(() => endGame("mistakes"), 500);
  } else if (!game.remaining.length) {
    setTimeout(() => endGame("completed"), 500);
  } else {
    setTimeout(pickNext, 500);
  }
}

function endGame(reason) {
  game.active = false;
  els.skipBtn.disabled = true;
  els.promptLabel.textContent = reason === "completed" ? "All countries found!" : "Game over";
  els.promptCountry.textContent = reason === "completed" ? "🏆" : "🏁";

  saveResult(game.score, game.mistakes, features.length, reason === "completed");
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
  els.resultScore.textContent = `${game.score} / ${features.length}`;
  els.resultCopy.textContent = reason === "completed"
    ? "Every country on the map, found. That's a full round."
    : "Every round sharpens your map sense. Go again?";
  els.resultOverlay.classList.add("show");
}
function closeResult() { els.resultOverlay.classList.remove("show"); }

/* ---------- Persistence ---------- */

function saveResult(score, mistakes, total, completed) {
  const history = JSON.parse(localStorage.getItem(STORAGE_HISTORY_KEY) || "[]");
  history.unshift({ score, mistakes, total, completed, date: new Date().toISOString() });
  localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(history.slice(0, 10)));

  const high = Number(localStorage.getItem(STORAGE_HIGH_KEY) || 0);
  if (score > high) localStorage.setItem(STORAGE_HIGH_KEY, String(score));

  renderHistory();
  loadHighScore();
}

function loadHighScore() {
  const high = Number(localStorage.getItem(STORAGE_HIGH_KEY) || 0);
  els.highScoreNumber.textContent = high;
  els.highScoreOutof.textContent = `of ${features.length || "—"} countries`;
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem(STORAGE_HISTORY_KEY) || "[]");
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
