/* ============================================================
   Where in the World — geography pointing game
   Data: Natural Earth via world-atlas (CDN), TopoJSON
   ============================================================ */

const WORLD_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const QUESTIONS_PER_GAME = 15;
const SAME_CONTINENT_PROBABILITY = 0.72; // chance the next country stays in-region

const STORAGE_HISTORY_KEY = "geoGame.history.v1";
const STORAGE_HIGH_KEY = "geoGame.highScore.v1";

/* ---------- DOM refs ---------- */

const els = {
  map: document.getElementById("map"),
  liveScore: document.getElementById("live-score"),
  liveQuestion: document.getElementById("live-question"),
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
  sidebar: document.getElementById("sidebar"),
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
  g.selectAll("path.country").attr("d", path);
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
  answered: 0,
  targetIndex: null,
  order: [],
};

/* ---------- Load data ---------- */

d3.json(WORLD_URL).then((world) => {
  const objectKey = Object.keys(world.objects)[0];
  const collection = topojson.feature(world, world.objects[objectKey]);
  const rawNeighbors = topojson.neighbors(world.objects[objectKey].geometries);

  // Filter out entries with no renderable geometry / Antarctica for playability
  features = collection.features.filter(f => f.geometry && f.properties.name !== "Antarctica");

  // Rebuild neighbor indices to match filtered feature list
  const keepIndex = [];
  collection.features.forEach((f, i) => {
    if (f.geometry && f.properties.name !== "Antarctica") keepIndex.push(i);
  });
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

  g.selectAll("path.country")
    .data(features)
    .join("path")
    .attr("class", "country")
    .attr("d", path)
    .attr("fill", d => colorForIndex(d.__colorIndex))
    .attr("data-index", (d, i) => i)
    .on("click", (event, d) => handleCountryClick(features.indexOf(d)));
}

/* ---------- Game flow ---------- */

els.newGameBtn.addEventListener("click", startGame);
els.playAgainBtn.addEventListener("click", () => { closeResult(); startGame(); });
els.closeResultBtn.addEventListener("click", closeResult);
els.skipBtn.addEventListener("click", () => {
  if (!game.active) return;
  showToast(`It was ${nameOf[game.targetIndex]}`, "bad");
  advance();
});

function startGame() {
  if (!features.length) return;
  game = { active: true, score: 0, answered: 0, targetIndex: null, order: [] };
  els.skipBtn.disabled = false;
  updateLiveStats();
  pickNext(true);
}

function pickNext(isFirst) {
  const allIndices = features.map((_, i) => i);
  let pool;

  if (isFirst || game.targetIndex === null) {
    pool = allIndices;
  } else {
    const sameContinent = allIndices.filter(
      i => continentOf[i] === continentOf[game.targetIndex] && !game.order.includes(i)
    );
    const jump = Math.random() > SAME_CONTINENT_PROBABILITY || sameContinent.length === 0;
    const candidates = jump
      ? allIndices.filter(i => !game.order.includes(i))
      : sameContinent;
    pool = candidates.length ? candidates : allIndices.filter(i => !game.order.includes(i));
  }

  if (!pool.length) pool = allIndices;
  const next = pool[Math.floor(Math.random() * pool.length)];
  game.targetIndex = next;
  game.order.push(next);

  els.promptLabel.textContent = `Find country ${game.order.length} of ${QUESTIONS_PER_GAME}`;
  els.promptCountry.textContent = nameOf[next];
  updateLiveStats();
}

function handleCountryClick(clickedIndex) {
  if (!game.active) return;

  const target = game.targetIndex;
  const el = g.select(`path[data-index="${clickedIndex}"]`);

  if (clickedIndex === target) {
    game.score++;
    showToast("Correct!", "good");
    el.classed("correct-flash", true);
    setTimeout(() => el.classed("correct-flash", false), 500);
  } else {
    showToast(`That was ${nameOf[clickedIndex]} — target was ${nameOf[target]}`, "bad");
    el.classed("wrong-flash", true);
    g.select(`path[data-index="${target}"]`).classed("answer-flash", true);
    setTimeout(() => {
      el.classed("wrong-flash", false);
      g.select(`path[data-index="${target}"]`).classed("answer-flash", false);
    }, 650);
  }

  game.answered++;
  advance();
}

function advance() {
  updateLiveStats();
  if (game.order.length >= QUESTIONS_PER_GAME) {
    setTimeout(endGame, 500);
  } else {
    setTimeout(() => pickNext(false), 500);
  }
}

function endGame() {
  game.active = false;
  els.skipBtn.disabled = true;
  els.promptLabel.textContent = "Game complete";
  els.promptCountry.textContent = "🏁";

  saveResult(game.score, QUESTIONS_PER_GAME);
  showResult();
}

function updateLiveStats() {
  els.liveScore.textContent = `${game.score} / ${game.answered}`;
  els.liveQuestion.textContent = `${Math.min(game.order.length, QUESTIONS_PER_GAME)} / ${QUESTIONS_PER_GAME}`;
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

function showResult() {
  const pct = Math.round((game.score / QUESTIONS_PER_GAME) * 100);
  els.resultTitle.textContent = pct === 100 ? "Perfect round!" : "Game complete";
  els.resultScore.textContent = `${game.score} / ${QUESTIONS_PER_GAME}`;
  els.resultCopy.textContent =
    pct >= 80 ? "Excellent geography instincts." :
    pct >= 50 ? "Solid round — try another to beat it." :
    "Every round sharpens your map sense. Go again?";
  els.resultOverlay.classList.add("show");
}
function closeResult() { els.resultOverlay.classList.remove("show"); }

/* ---------- Persistence ---------- */

function saveResult(score, total) {
  const history = JSON.parse(localStorage.getItem(STORAGE_HISTORY_KEY) || "[]");
  history.unshift({ score, total, date: new Date().toISOString() });
  localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(history.slice(0, 10)));

  const high = Number(localStorage.getItem(STORAGE_HIGH_KEY) || 0);
  if (score > high) localStorage.setItem(STORAGE_HIGH_KEY, String(score));

  renderHistory();
  loadHighScore();
}

function loadHighScore() {
  const high = Number(localStorage.getItem(STORAGE_HIGH_KEY) || 0);
  els.highScoreNumber.textContent = high;
  els.highScoreOutof.textContent = `/ ${QUESTIONS_PER_GAME}`;
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
    return `<li><span class="history-score">${h.score} / ${h.total}</span><span class="history-date">${dateStr}</span></li>`;
  }).join("");
}

/* ---------- Mobile sidebar toggle ---------- */

els.menuToggle.addEventListener("click", () => els.sidebar.classList.toggle("open"));
els.map.addEventListener("pointerdown", () => els.sidebar.classList.remove("open"));
