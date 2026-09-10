/*
  WHERE IN THE WORLD — script.js (v4)

  Changes in this version:
  - Fix: countries are now clickable directly (the old invisible
    "hit-target" overlay layer was intercepting taps before they
    reached a country, so nothing was selectable). Click handlers
    now live straight on each visible country path.
  - The Jammu & Kashmir / Ladakh / Aksai Chin / Shaksgam Valley /
    Pakistan-administered Kashmir region is merged into India:
    same fill color, quizzed as "India", no separate grey overlay.
  - Exactly 197 quiz countries: the 193 UN member states plus
    Palestine, the Holy See, Kosovo, and Taiwan. Overseas
    territories (Greenland, Puerto Rico, Hong Kong, etc.) are
    folded into their sovereign country rather than quizzed
    separately.
  - Prompt card has no body copy (see index.html / style.css).
*/

(() => {
  "use strict";

  /* =========================================================
     CONFIGURATION
  ========================================================= */

  const MAP_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-10m.json";

  const TOTAL_COUNTRIES = 197;
  const MAX_MISTAKES = 5;
  const MAX_ZOOM = 40;
  const SAME_CONTINENT_PROBABILITY = 0.72;

  const STORAGE_HISTORY = "where-in-the-world-history-v4";
  const STORAGE_HIGH_SCORE = "where-in-the-world-high-score-v4";

  const PALETTE = [
    "#d88949", "#4f8c88", "#8b9f72", "#c56d5a",
    "#6f88a6", "#b58c64", "#718a76", "#9c7894",
    "#4e879d", "#b07b54", "#7c8d9a", "#a28b68"
  ];

  /* =========================================================
     197 QUIZ COUNTRIES  (ISO numeric id -> name)
  ========================================================= */

  const QUIZ_COUNTRIES = [
    ["004","Afghanistan"],["008","Albania"],["012","Algeria"],["020","Andorra"],
    ["024","Angola"],["028","Antigua and Barbuda"],["032","Argentina"],["051","Armenia"],
    ["036","Australia"],["040","Austria"],["031","Azerbaijan"],["044","Bahamas"],
    ["048","Bahrain"],["050","Bangladesh"],["052","Barbados"],["112","Belarus"],
    ["056","Belgium"],["084","Belize"],["204","Benin"],["064","Bhutan"],
    ["068","Bolivia"],["070","Bosnia and Herzegovina"],["072","Botswana"],["076","Brazil"],
    ["096","Brunei"],["100","Bulgaria"],["854","Burkina Faso"],["108","Burundi"],
    ["132","Cabo Verde"],["116","Cambodia"],["120","Cameroon"],["124","Canada"],
    ["140","Central African Republic"],["148","Chad"],["152","Chile"],["156","China"],
    ["170","Colombia"],["174","Comoros"],["178","Congo"],["188","Costa Rica"],
    ["384","Côte d'Ivoire"],["191","Croatia"],["192","Cuba"],["196","Cyprus"],
    ["203","Czechia"],["180","Democratic Republic of the Congo"],["208","Denmark"],["262","Djibouti"],
    ["212","Dominica"],["214","Dominican Republic"],["218","Ecuador"],["818","Egypt"],
    ["222","El Salvador"],["226","Equatorial Guinea"],["232","Eritrea"],["233","Estonia"],
    ["748","Eswatini"],["231","Ethiopia"],["242","Fiji"],["246","Finland"],
    ["250","France"],["266","Gabon"],["270","Gambia"],["268","Georgia"],
    ["276","Germany"],["288","Ghana"],["300","Greece"],["308","Grenada"],
    ["320","Guatemala"],["324","Guinea"],["624","Guinea-Bissau"],["328","Guyana"],
    ["332","Haiti"],["340","Honduras"],["348","Hungary"],["352","Iceland"],
    ["356","India"],["360","Indonesia"],["364","Iran"],["368","Iraq"],
    ["372","Ireland"],["376","Israel"],["380","Italy"],["388","Jamaica"],
    ["392","Japan"],["400","Jordan"],["398","Kazakhstan"],["404","Kenya"],
    ["296","Kiribati"],["414","Kuwait"],["417","Kyrgyzstan"],["418","Laos"],
    ["428","Latvia"],["422","Lebanon"],["426","Lesotho"],["430","Liberia"],
    ["434","Libya"],["438","Liechtenstein"],["440","Lithuania"],["442","Luxembourg"],
    ["450","Madagascar"],["454","Malawi"],["458","Malaysia"],["462","Maldives"],
    ["466","Mali"],["470","Malta"],["584","Marshall Islands"],["478","Mauritania"],
    ["480","Mauritius"],["484","Mexico"],["583","Micronesia"],["498","Moldova"],
    ["492","Monaco"],["496","Mongolia"],["499","Montenegro"],["504","Morocco"],
    ["508","Mozambique"],["104","Myanmar"],["516","Namibia"],["520","Nauru"],
    ["524","Nepal"],["528","Netherlands"],["554","New Zealand"],["558","Nicaragua"],
    ["562","Niger"],["566","Nigeria"],["408","North Korea"],["807","North Macedonia"],
    ["578","Norway"],["512","Oman"],["586","Pakistan"],["585","Palau"],
    ["591","Panama"],["598","Papua New Guinea"],["600","Paraguay"],["604","Peru"],
    ["608","Philippines"],["616","Poland"],["620","Portugal"],["634","Qatar"],
    ["642","Romania"],["643","Russia"],["646","Rwanda"],["659","Saint Kitts and Nevis"],
    ["662","Saint Lucia"],["670","Saint Vincent and the Grenadines"],["882","Samoa"],["674","San Marino"],
    ["678","São Tomé and Príncipe"],["682","Saudi Arabia"],["686","Senegal"],["688","Serbia"],
    ["690","Seychelles"],["694","Sierra Leone"],["702","Singapore"],["703","Slovakia"],
    ["705","Slovenia"],["090","Solomon Islands"],["706","Somalia"],["710","South Africa"],
    ["410","South Korea"],["728","South Sudan"],["724","Spain"],["144","Sri Lanka"],
    ["729","Sudan"],["740","Suriname"],["752","Sweden"],["756","Switzerland"],
    ["760","Syria"],["762","Tajikistan"],["834","Tanzania"],["764","Thailand"],
    ["626","Timor-Leste"],["768","Togo"],["776","Tonga"],["780","Trinidad and Tobago"],
    ["788","Tunisia"],["792","Türkiye"],["795","Turkmenistan"],["798","Tuvalu"],
    ["800","Uganda"],["804","Ukraine"],["784","United Arab Emirates"],["826","United Kingdom"],
    ["840","United States"],["858","Uruguay"],["860","Uzbekistan"],["548","Vanuatu"],
    ["336","Holy See (Vatican City)"],["862","Venezuela"],["704","Vietnam"],["887","Yemen"],
    ["894","Zambia"],["716","Zimbabwe"],["275","Palestine"],["383","Kosovo"],
    ["158","Taiwan"]
  ];

  /* =========================================================
     TERRITORY -> SOVEREIGN COUNTRY
     Not separate quiz answers; folded into the parent for
     both gameplay and coloring.
  ========================================================= */

  const TERRITORY_PARENT = {
    "016":"840","660":"826","533":"528","060":"826","535":"528","074":"578",
    "086":"826","092":"826","136":"826","162":"036","166":"036","184":"554",
    "531":"528","234":"208","238":"826","254":"250","258":"250","260":"250",
    "292":"826","304":"208","312":"250","316":"840","334":"036","344":"156",
    "833":"826","831":"826","832":"826","446":"156","474":"250","175":"250",
    "500":"826","540":"250","570":"554","574":"036","580":"840","612":"826",
    "630":"840","638":"250","652":"250","654":"826","663":"250","666":"250",
    "534":"528","239":"826","744":"578","772":"554","796":"826","581":"840",
    "850":"840","876":"250","248":"246"
  };

  /* =========================================================
     KASHMIR GAMEPLAY REGION -> merged into India
     Gameplay-only overlay, not a legal/political boundary claim.
  ========================================================= */

  const KASHMIR_FEATURE = {
    type: "Feature",
    properties: { name: "India gameplay region" },
    geometry: {
      type: "MultiPolygon",
      coordinates: [
        [[[73.30,35.05],[73.85,36.00],[74.80,36.55],[75.85,36.85],[76.70,36.60],
          [77.35,35.95],[77.05,35.15],[76.40,34.45],[75.35,33.80],[74.25,33.80],
          [73.55,34.25],[73.30,35.05]]],
        [[[77.00,35.10],[78.05,35.85],[79.35,35.85],[80.45,35.45],[80.70,34.55],
          [80.15,33.80],[78.90,33.85],[77.75,34.25],[77.00,35.10]]],
        [[[75.70,36.65],[76.45,37.15],[77.55,37.20],[78.15,36.65],[77.70,35.95],
          [76.75,35.95],[75.70,36.65]]]
      ]
    }
  };

  /* =========================================================
     FALLBACK POINTS for microstates that are too small to
     reliably hit at low zoom (or missing from map geometry)
  ========================================================= */

  const FALLBACK_POINTS = {
    "020":[1.60,42.55], "336":[12.45,41.90], "438":[9.55,47.14], "492":[7.42,43.74],
    "674":[12.46,43.94], "702":[103.82,1.35], "470":[14.38,35.94], "659":[-62.78,17.30],
    "662":[-60.98,13.91], "670":[-61.22,13.16], "308":[-61.68,12.12], "052":[-59.54,13.19],
    "044":[-77.39,25.03], "028":[-61.80,17.06], "212":[-61.37,15.42], "776":[-175.20,-21.18],
    "882":[-172.10,-13.76], "584":[171.18,7.13], "583":[158.16,6.92], "585":[134.62,7.51],
    "296":[173.00,1.87], "520":[166.93,-0.53], "798":[179.19,-8.52]
  };

  /* =========================================================
     CONTINENTS (for the "stay local" bias between rounds)
  ========================================================= */

  const CONTINENT_BY_ID = {
    "004":"Asia","008":"Europe","012":"Africa","020":"Europe","024":"Africa","028":"North America",
    "032":"South America","051":"Asia","036":"Oceania","040":"Europe","031":"Asia","044":"North America",
    "048":"Asia","050":"Asia","052":"North America","112":"Europe","056":"Europe","084":"North America",
    "204":"Africa","064":"Asia","068":"South America","070":"Europe","072":"Africa","076":"South America",
    "096":"Asia","100":"Europe","854":"Africa","108":"Africa","132":"Africa","116":"Asia",
    "120":"Africa","124":"North America","140":"Africa","148":"Africa","152":"South America","156":"Asia",
    "170":"South America","174":"Africa","178":"Africa","188":"North America","384":"Africa","191":"Europe",
    "192":"North America","196":"Asia","203":"Europe","180":"Africa","208":"Europe","262":"Africa",
    "212":"North America","214":"North America","218":"South America","818":"Africa","222":"North America","226":"Africa",
    "232":"Africa","233":"Europe","748":"Africa","231":"Africa","242":"Oceania","246":"Europe",
    "250":"Europe","266":"Africa","270":"Africa","268":"Asia","276":"Europe","288":"Africa",
    "300":"Europe","308":"North America","320":"North America","324":"Africa","624":"Africa","328":"South America",
    "332":"North America","340":"North America","348":"Europe","352":"Europe","356":"Asia","360":"Asia",
    "364":"Asia","368":"Asia","372":"Europe","376":"Asia","380":"Europe","388":"North America",
    "392":"Asia","400":"Asia","398":"Asia","404":"Africa","296":"Oceania","414":"Asia",
    "417":"Asia","418":"Asia","428":"Europe","422":"Asia","426":"Africa","430":"Africa",
    "434":"Africa","438":"Europe","440":"Europe","442":"Europe","450":"Africa","454":"Africa",
    "458":"Asia","462":"Asia","466":"Africa","470":"Europe","584":"Oceania","478":"Africa",
    "480":"Africa","484":"North America","583":"Oceania","498":"Europe","492":"Europe","496":"Asia",
    "499":"Europe","504":"Africa","508":"Africa","104":"Asia","516":"Africa","520":"Oceania",
    "524":"Asia","528":"Europe","554":"Oceania","558":"North America","562":"Africa","566":"Africa",
    "408":"Asia","807":"Europe","578":"Europe","512":"Asia","586":"Asia","585":"Oceania",
    "591":"North America","598":"Oceania","600":"South America","604":"South America","608":"Asia","616":"Europe",
    "620":"Europe","634":"Asia","642":"Europe","643":"Europe","646":"Africa","659":"North America",
    "662":"North America","670":"North America","882":"Oceania","674":"Europe","678":"Africa","682":"Asia",
    "686":"Africa","688":"Europe","690":"Africa","694":"Africa","702":"Asia","703":"Europe",
    "705":"Europe","090":"Oceania","706":"Africa","710":"Africa","410":"Asia","728":"Africa",
    "724":"Europe","144":"Asia","729":"Africa","740":"South America","752":"Europe","756":"Europe",
    "760":"Asia","762":"Asia","834":"Africa","764":"Asia","626":"Asia","768":"Africa",
    "776":"Oceania","780":"North America","788":"Africa","792":"Asia","795":"Asia","798":"Oceania",
    "800":"Africa","804":"Europe","784":"Asia","826":"Europe","840":"North America","858":"South America",
    "860":"Asia","548":"Oceania","336":"Europe","862":"South America","704":"Asia","887":"Asia",
    "894":"Africa","716":"Africa","275":"Asia","383":"Europe","158":"Asia"
  };

  /* =========================================================
     DOM
  ========================================================= */

  const mapEl = document.getElementById("map");
  const newGameBtn = document.getElementById("new-game-btn");
  const liveScoreEl = document.getElementById("live-score");
  const liveMistakesEl = document.getElementById("live-mistakes");
  const liveRemainingEl = document.getElementById("live-remaining");
  const historyList = document.getElementById("history-list");

  const promptCard = document.getElementById("prompt-card");
  const promptLabel = document.getElementById("prompt-label");
  const promptCountry = document.getElementById("prompt-country");
  const skipBtn = document.getElementById("skip-btn");
  const feedbackToast = document.getElementById("feedback-toast");

  const menuToggle = document.getElementById("menu-toggle");
  const sidebar = document.getElementById("sidebar");
  const drawerClose = document.getElementById("drawer-close");
  const drawerScrim = document.getElementById("drawer-scrim");

  const highScoreNumber = document.getElementById("high-score-number");
  const highScoreOutof = document.getElementById("high-score-outof");

  const resultOverlay = document.getElementById("result-overlay");
  const resultTitle = document.getElementById("result-title");
  const resultScore = document.getElementById("result-score");
  const resultCopy = document.getElementById("result-copy");
  const playAgainBtn = document.getElementById("play-again-btn");
  const closeResultBtn = document.getElementById("close-result-btn");

  const zoomInBtn = document.getElementById("zoom-in");
  const zoomOutBtn = document.getElementById("zoom-out");
  const zoomResetBtn = document.getElementById("zoom-reset");

  /* =========================================================
     STATE
  ========================================================= */

  let groups = [];
  let groupById = new Map();

  let projection, pathGenerator, zoomBehavior;
  let mapWidth = 0, mapHeight = 0;

  let mapReady = false;
  let gameActive = false;

  let remaining = new Set();
  let currentTargetIndex = -1;
  let found = 0;
  let missed = 0;

  let feedbackTimer = null;
  let busy = false; // true while a reveal/advance animation is running

  /* =========================================================
     SVG LAYERS
  ========================================================= */

  const svg = d3.select(mapEl).append("svg");
  const rootGroup = svg.append("g").attr("class", "map-root");
  const countryLayer = rootGroup.append("g").attr("class", "country-layer");
  const fallbackLayer = rootGroup.append("g").attr("class", "fallback-layer");

  /* =========================================================
     INIT
  ========================================================= */

  renderHistory();
  updateHighScore();
  setupUiControls();
  loadWorld();

  /* =========================================================
     LOAD MAP
  ========================================================= */

  async function loadWorld() {
    try {
      const world = await d3.json(MAP_URL);
      if (!world || !world.objects || !world.objects.countries) {
        throw new Error("World map data unavailable");
      }

      const rawGeometries = world.objects.countries.geometries;
      const featureCollection = topojson.feature(world, world.objects.countries);
      const rawFeatures = featureCollection.features;

      buildGroups(rawFeatures);
      buildAdjacencyAndColor(rawGeometries);
      setupProjection();
      drawCountries();
      drawFallbackPoints();
      setupZoomBehavior();

      mapReady = true;
      newGameBtn.disabled = false;
      newGameBtn.textContent = "New game";

    } catch (err) {
      console.error(err);
      newGameBtn.textContent = "Map failed to load — tap to retry";
      newGameBtn.disabled = false;
      newGameBtn.onclick = () => { newGameBtn.onclick = null; loadWorld(); };
    }
  }

  function normalizeId(value) {
    if (value === null || value === undefined) return "";
    const n = Number(value);
    return Number.isFinite(n) ? String(n).padStart(3, "0") : String(value).padStart(3, "0");
  }

  function resolveParentId(rawId) {
    if (groupById.has(rawId)) return rawId;
    if (TERRITORY_PARENT[rawId]) return TERRITORY_PARENT[rawId];
    return null;
  }

  /* =========================================================
     BUILD GROUPS (197 quiz countries + their territories)
  ========================================================= */

  function buildGroups(rawFeatures) {
    groups = QUIZ_COUNTRIES.map(([id, name], index) => ({
      id, name, index,
      continent: CONTINENT_BY_ID[id] || "Other",
      features: [],
      neighbours: new Set(),
      colorIndex: index % PALETTE.length
    }));
    groupById = new Map(groups.map(g => [g.id, g]));

    rawFeatures.forEach(feature => {
      const rawId = normalizeId(feature.id);
      const parentId = resolveParentId(rawId);
      if (!parentId) return;
      groupById.get(parentId).features.push(feature);
    });

    // Fold the Kashmir gameplay region into India.
    const india = groupById.get("356");
    if (india) india.features.push(KASHMIR_FEATURE);

    const missing = groups.filter(g => g.features.length === 0);
    if (missing.length) {
      console.warn("No map geometry for:", missing.map(g => `${g.id} ${g.name}`));
    }
  }

  /* =========================================================
     ADJACENCY + GRAPH COLORING
     (so no two neighboring countries share a color)
  ========================================================= */

  function buildAdjacencyAndColor(rawGeometries) {
    const neighborArrays = topojson.neighbors(rawGeometries);

    rawGeometries.forEach((geometry, rawIndex) => {
      const rawId = normalizeId(geometry.id);
      const parentId = resolveParentId(rawId);
      if (!parentId) return;
      const group = groupById.get(parentId);

      (neighborArrays[rawIndex] || []).forEach(neighborRawIndex => {
        const neighborGeom = rawGeometries[neighborRawIndex];
        if (!neighborGeom) return;
        const neighborParentId = resolveParentId(normalizeId(neighborGeom.id));
        if (neighborParentId && neighborParentId !== parentId) {
          group.neighbours.add(groupById.get(neighborParentId).index);
        }
      });
    });

    [...groups]
      .sort((a, b) => b.neighbours.size - a.neighbours.size)
      .forEach(group => {
        // Countries with no detected land neighbours (most island
        // nations) have nothing to conflict with — leave them on
        // their spread-out default color instead of collapsing
        // every one of them onto palette color 0.
        if (group.neighbours.size === 0) return;

        const used = new Set([...group.neighbours].map(i => groups[i].colorIndex));
        let color = 0;
        while (used.has(color) && color < PALETTE.length - 1) color++;
        group.colorIndex = color;
      });
  }

  function colorFor(group) {
    return group ? PALETTE[group.colorIndex % PALETTE.length] : "#c5bcb1";
  }

  /* =========================================================
     PROJECTION
  ========================================================= */

  function setupProjection() {
    resize();
    window.addEventListener("resize", resize);
  }

  function resize() {
    const rect = mapEl.getBoundingClientRect();
    mapWidth = Math.max(1, rect.width);
    mapHeight = Math.max(1, rect.height);

    svg.attr("viewBox", `0 0 ${mapWidth} ${mapHeight}`).attr("width", mapWidth).attr("height", mapHeight);

    projection = d3.geoNaturalEarth1().fitExtent(
      [[10, 10], [mapWidth - 10, mapHeight - 10]],
      { type: "Sphere" }
    );
    pathGenerator = d3.geoPath().projection(projection);

    countryLayer.selectAll("path").attr("d", d => pathGenerator(d));
    positionFallbackPoints();
  }

  /* =========================================================
     TAP DETECTION

     We deliberately do NOT use the "click" event. On touch
     devices, D3's pan/zoom behavior listens for the same
     pointer/touch gestures, and the browser's synthetic click
     that normally follows a tap is frequently suppressed by
     that combination — which is why answers weren't registering.
     Instead we track pointerdown -> pointerup ourselves and
     treat it as a tap only if the finger/mouse barely moved and
     didn't take too long, which works reliably alongside zoom.
  ========================================================= */

  let pointerDownInfo = null;
  const TAP_MAX_DISTANCE = 12; // px
  const TAP_MAX_DURATION = 700; // ms

  function attachTapHandler(selection, resolveGroupIndex) {
    selection
      .on("pointerdown", function(event) {
        pointerDownInfo = {
          x: event.clientX,
          y: event.clientY,
          time: Date.now(),
          el: this
        };
      })
      .on("pointerup", function(event, d) {
        if (!pointerDownInfo || pointerDownInfo.el !== this) {
          pointerDownInfo = null;
          return;
        }

        const dx = event.clientX - pointerDownInfo.x;
        const dy = event.clientY - pointerDownInfo.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const duration = Date.now() - pointerDownInfo.time;

        pointerDownInfo = null;

        if (dist <= TAP_MAX_DISTANCE && duration <= TAP_MAX_DURATION) {
          event.preventDefault();
          event.stopPropagation();
          onCountrySelected(resolveGroupIndex(d));
        }
      })
      .on("pointercancel", () => { pointerDownInfo = null; })
      .on("click", event => {
        // Swallow any click that does slip through so it can
        // never register as a second, duplicate selection.
        event.preventDefault();
        event.stopPropagation();
      });
  }

  /* =========================================================
     DRAW COUNTRIES — direct tap handlers, no overlay layer
  ========================================================= */

  function drawCountries() {
    const renderFeatures = [];
    groups.forEach(group => {
      group.features.forEach((feature, i) => {
        renderFeatures.push(Object.assign({}, feature, {
          __groupIndex: group.index,
          __groupId: group.id,
          __key: `${group.id}-${i}`
        }));
      });
    });

    const selection = countryLayer.selectAll("path.country")
      .data(renderFeatures, d => d.__key)
      .join("path")
      .attr("class", "country")
      .attr("d", d => pathGenerator(d))
      .attr("fill", d => colorFor(groups[d.__groupIndex]))
      .attr("data-group", d => d.__groupIndex)
      .attr("aria-label", d => groups[d.__groupIndex].name);

    attachTapHandler(selection, d => d.__groupIndex);
  }

  function drawFallbackPoints() {
    const missingGroups = groups.filter(g => g.features.length === 0 && FALLBACK_POINTS[g.id]);

    const selection = fallbackLayer.selectAll("circle")
      .data(missingGroups, d => d.id)
      .join("circle")
      .attr("r", 8)
      .attr("fill", g => colorFor(g))
      .attr("stroke", "#FBFAF6")
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .style("touch-action", "none");

    attachTapHandler(selection, g => g.index);

    positionFallbackPoints();
  }

  function positionFallbackPoints() {
    if (!projection) return;
    fallbackLayer.selectAll("circle")
      .attr("cx", g => (FALLBACK_POINTS[g.id] ? projection(FALLBACK_POINTS[g.id])[0] : -999))
      .attr("cy", g => (FALLBACK_POINTS[g.id] ? projection(FALLBACK_POINTS[g.id])[1] : -999));
  }

  /* =========================================================
     ZOOM
  ========================================================= */

  function setupZoomBehavior() {
    zoomBehavior = d3.zoom()
      .scaleExtent([1, MAX_ZOOM])
      .translateExtent([[-mapWidth * 2, -mapHeight * 2], [mapWidth * 3, mapHeight * 3]])
      .on("zoom", event => rootGroup.attr("transform", event.transform));

    svg.call(zoomBehavior);

    zoomInBtn.addEventListener("click", () => svg.transition().duration(180).call(zoomBehavior.scaleBy, 1.5));
    zoomOutBtn.addEventListener("click", () => svg.transition().duration(180).call(zoomBehavior.scaleBy, 1 / 1.5));
    zoomResetBtn.addEventListener("click", () => resetZoom());
  }

  function resetZoom() {
    svg.transition().duration(220).call(zoomBehavior.transform, d3.zoomIdentity);
  }

  function panZoomTo(feature) {
    if (!feature || !pathGenerator || !zoomBehavior) return;
    const bounds = pathGenerator.bounds(feature);
    const [[x0, y0], [x1, y1]] = bounds;
    const w = Math.max(1, x1 - x0);
    const h = Math.max(1, y1 - y0);
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;

    const scale = Math.min(MAX_ZOOM, Math.max(1.4, 0.55 * Math.min(mapWidth / w, mapHeight / h)));
    const translateX = mapWidth / 2 - scale * cx;
    const translateY = mapHeight / 2 - scale * cy;

    svg.transition().duration(650)
      .call(zoomBehavior.transform, d3.zoomIdentity.translate(translateX, translateY).scale(scale));
  }

  /* =========================================================
     UI CONTROLS
  ========================================================= */

  function setupUiControls() {
    newGameBtn.addEventListener("click", () => { if (mapReady) startGame(); });
    playAgainBtn.addEventListener("click", () => { closeResult(); if (mapReady) startGame(); });
    closeResultBtn.addEventListener("click", closeResult);

    skipBtn.addEventListener("click", e => {
      e.preventDefault();
      if (gameActive && !busy) skipCurrent();
    });

    menuToggle.addEventListener("click", () => setDrawer(!sidebar.classList.contains("open")));
    drawerClose.addEventListener("click", () => setDrawer(false));
    drawerScrim.addEventListener("click", () => setDrawer(false));

    document.addEventListener("keydown", e => {
      if (e.key === "Escape") {
        setDrawer(false);
        closeResult();
      }
    });
  }

  function setDrawer(open) {
    sidebar.classList.toggle("open", open);
    drawerScrim.classList.toggle("show", open);
  }

  /* =========================================================
     GAME FLOW
  ========================================================= */

  function startGame() {
    setDrawer(false);
    closeResult();

    gameActive = true;
    busy = false;
    found = 0;
    missed = 0;
    currentTargetIndex = -1;
    remaining = new Set(groups.map(g => g.index));

    resetZoom();
    clearAllHighlights();

    skipBtn.disabled = false;
    promptLabel.textContent = "";

    updateStats();
    nextCountry();
  }

  function nextCountry() {
    if (!gameActive) return;

    if (remaining.size === 0) {
      finishGame(true);
      return;
    }

    let candidates = [...remaining];

    if (currentTargetIndex >= 0 && Math.random() < SAME_CONTINENT_PROBABILITY) {
      const previous = groups[currentTargetIndex];
      const sameContinent = candidates.filter(i => groups[i].continent === previous.continent);
      if (sameContinent.length > 0) candidates = sameContinent;
    }

    currentTargetIndex = candidates[Math.floor(Math.random() * candidates.length)];
    promptCountry.textContent = groups[currentTargetIndex].name;
    updateStats();
  }

  function onCountrySelected(groupIndex) {
    if (!gameActive || busy) return;
    if (groupIndex === currentTargetIndex) {
      handleCorrect(groupIndex);
    } else {
      handleIncorrect(groupIndex);
    }
  }

  function handleCorrect(groupIndex) {
    busy = true;
    remaining.delete(groupIndex);
    found++;

    flashGroup(groupIndex, "correct-flash");
    showToast(`✓ ${groups[groupIndex].name}`, "good");
    updateStats();

    window.setTimeout(() => {
      clearFlash(groupIndex);
      busy = false;
      nextCountry();
    }, 500);
  }

  function handleIncorrect(groupIndex) {
    busy = true;
    const target = groups[currentTargetIndex];
    remaining.delete(currentTargetIndex);
    missed++;

    if (groupIndex >= 0) flashGroup(groupIndex, "wrong-flash");
    showToast(`That was ${target.name} — here's where it is`, "bad");
    updateStats();

    revealTarget(target, () => {
      clearFlash(groupIndex);
      busy = false;

      if (missed >= MAX_MISTAKES) {
        finishGame(false);
      } else {
        nextCountry();
      }
    });
  }

  function skipCurrent() {
    handleIncorrect(-1);
  }

  function revealTarget(target, done) {
    const featureToShow = target.features[target.features.length - 1] || target.features[0];
    if (featureToShow) {
      panZoomTo(featureToShow);
    }
    countryLayer.selectAll(`[data-group="${target.index}"]`).classed("reveal-pulse", true);

    window.setTimeout(() => {
      countryLayer.selectAll(`[data-group="${target.index}"]`).classed("reveal-pulse", false);
      if (typeof done === "function") done();
    }, 1650);
  }

  function finishGame(completedAll) {
    gameActive = false;
    busy = false;
    skipBtn.disabled = true;
    promptCountry.textContent = "🌍";

    saveResult(found, missed);
    updateHighScore();

    resultTitle.textContent = completedAll ? "Perfect round!" : "Game over";
    resultScore.textContent = `${found} / ${TOTAL_COUNTRIES}`;
    resultCopy.textContent = completedAll
      ? `You placed every country with ${missed} miss${missed === 1 ? "" : "es"}.`
      : `You placed ${found} countries before reaching ${MAX_MISTAKES} misses.`;

    resultOverlay.classList.add("show");
  }

  function closeResult() {
    resultOverlay.classList.remove("show");
  }

  /* =========================================================
     VISUAL FEEDBACK
  ========================================================= */

  function flashGroup(groupIndex, className) {
    countryLayer.selectAll(`[data-group="${groupIndex}"]`).classed(className, true);
  }

  function clearFlash(groupIndex) {
    countryLayer.selectAll(`[data-group="${groupIndex}"]`)
      .classed("correct-flash", false)
      .classed("wrong-flash", false);
  }

  function clearAllHighlights() {
    countryLayer.selectAll(".country")
      .classed("correct-flash", false)
      .classed("wrong-flash", false)
      .classed("reveal-pulse", false);
  }

  function showToast(message, type) {
    if (feedbackTimer) clearTimeout(feedbackTimer);
    feedbackToast.textContent = message;
    feedbackToast.className = `feedback-toast show ${type}`;
    feedbackTimer = window.setTimeout(() => feedbackToast.classList.remove("show"), 1500);
  }

  function updateStats() {
    liveScoreEl.textContent = found;
    liveMistakesEl.textContent = `${missed} / ${MAX_MISTAKES}`;
    liveRemainingEl.textContent = gameActive ? remaining.size : "—";
  }

  /* =========================================================
     LOCAL STORAGE — history + high score
  ========================================================= */

  function getHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_HISTORY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveResult(foundScore, missedScore) {
    const history = getHistory();
    history.unshift({
      found: foundScore,
      missed: missedScore,
      total: TOTAL_COUNTRIES,
      completed: foundScore === TOTAL_COUNTRIES,
      date: Date.now()
    });
    localStorage.setItem(STORAGE_HISTORY, JSON.stringify(history.slice(0, 10)));

    const currentHigh = Number(localStorage.getItem(STORAGE_HIGH_SCORE) || 0);
    if (foundScore > currentHigh) {
      localStorage.setItem(STORAGE_HIGH_SCORE, String(foundScore));
    }

    renderHistory();
  }

  function renderHistory() {
    const history = getHistory();
    historyList.innerHTML = "";

    if (!history.length) {
      historyList.innerHTML = `<li class="history-empty">No games yet — play one to see it here.</li>`;
      return;
    }

    history.forEach(game => {
      const li = document.createElement("li");
      if (game.completed) li.classList.add("completed");

      const date = new Date(game.date);
      const dateStr = isNaN(date) ? "" : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });

      li.innerHTML = `<span class="history-score">${game.found}/${game.total}</span><span class="history-date">${dateStr}</span>`;
      historyList.appendChild(li);
    });
  }

  function updateHighScore() {
    const high = Number(localStorage.getItem(STORAGE_HIGH_SCORE) || 0);
    highScoreNumber.textContent = high;
    highScoreOutof.textContent = `of ${TOTAL_COUNTRIES} countries`;
  }

})();
