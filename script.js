/*
  WHERE IN THE WORLD
  Version 4

  Major changes:
  - 197 quiz countries
  - 193 UN members + Palestine + Holy See + Kosovo + Taiwan
  - Territories are grouped with their sovereign country
  - Uses world-atlas 10m geometry
  - Direct country-path selection
  - No transparent global hit-target layer
  - Kashmir gameplay region is assigned to India
  - Compact question card
*/

(() => {
  "use strict";

  /* =========================================================
     CONFIGURATION
  ========================================================= */

  const MAP_URL =
    "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-10m.json";

  const TOTAL_COUNTRIES = 197;
  const MAX_MISTAKES = 5;

  const STORAGE_HISTORY = "where-in-the-world-history-v4";
  const STORAGE_HIGH_SCORE = "where-in-the-world-high-score-v4";

  const MAX_ZOOM = 40;

  /*
    Graph colouring palette.
    Colours are deliberately soft enough to keep country
    borders visible.
  */
  const MAP_COLOURS = [
    "#d88949",
    "#4f8c88",
    "#8b9f72",
    "#c56d5a",
    "#6f88a6",
    "#b58c64",
    "#718a76",
    "#9c7894",
    "#4e879d",
    "#b07b54",
    "#7c8d9a",
    "#a28b68"
  ];

  /* =========================================================
     197 QUIZ COUNTRIES
  ========================================================= */

  const QUIZ_COUNTRIES = [
    ["004", "Afghanistan"],
    ["008", "Albania"],
    ["012", "Algeria"],
    ["020", "Andorra"],
    ["024", "Angola"],
    ["028", "Antigua and Barbuda"],
    ["032", "Argentina"],
    ["051", "Armenia"],
    ["036", "Australia"],
    ["040", "Austria"],
    ["031", "Azerbaijan"],
    ["044", "Bahamas"],
    ["048", "Bahrain"],
    ["050", "Bangladesh"],
    ["052", "Barbados"],
    ["112", "Belarus"],
    ["056", "Belgium"],
    ["084", "Belize"],
    ["204", "Benin"],
    ["064", "Bhutan"],
    ["068", "Bolivia"],
    ["070", "Bosnia and Herzegovina"],
    ["072", "Botswana"],
    ["076", "Brazil"],
    ["096", "Brunei"],
    ["100", "Bulgaria"],
    ["854", "Burkina Faso"],
    ["108", "Burundi"],
    ["132", "Cabo Verde"],
    ["116", "Cambodia"],
    ["120", "Cameroon"],
    ["124", "Canada"],
    ["140", "Central African Republic"],
    ["148", "Chad"],
    ["152", "Chile"],
    ["156", "China"],
    ["170", "Colombia"],
    ["174", "Comoros"],
    ["178", "Congo"],
    ["188", "Costa Rica"],
    ["384", "Côte d'Ivoire"],
    ["191", "Croatia"],
    ["192", "Cuba"],
    ["196", "Cyprus"],
    ["203", "Czechia"],
    ["180", "Democratic Republic of the Congo"],
    ["208", "Denmark"],
    ["262", "Djibouti"],
    ["212", "Dominica"],
    ["214", "Dominican Republic"],
    ["218", "Ecuador"],
    ["818", "Egypt"],
    ["222", "El Salvador"],
    ["226", "Equatorial Guinea"],
    ["232", "Eritrea"],
    ["233", "Estonia"],
    ["748", "Eswatini"],
    ["231", "Ethiopia"],
    ["242", "Fiji"],
    ["246", "Finland"],
    ["250", "France"],
    ["266", "Gabon"],
    ["270", "Gambia"],
    ["268", "Georgia"],
    ["276", "Germany"],
    ["288", "Ghana"],
    ["300", "Greece"],
    ["308", "Grenada"],
    ["320", "Guatemala"],
    ["324", "Guinea"],
    ["624", "Guinea-Bissau"],
    ["328", "Guyana"],
    ["332", "Haiti"],
    ["340", "Honduras"],
    ["348", "Hungary"],
    ["352", "Iceland"],
    ["356", "India"],
    ["360", "Indonesia"],
    ["364", "Iran"],
    ["368", "Iraq"],
    ["372", "Ireland"],
    ["376", "Israel"],
    ["380", "Italy"],
    ["388", "Jamaica"],
    ["392", "Japan"],
    ["400", "Jordan"],
    ["398", "Kazakhstan"],
    ["404", "Kenya"],
    ["296", "Kiribati"],
    ["414", "Kuwait"],
    ["417", "Kyrgyzstan"],
    ["418", "Laos"],
    ["428", "Latvia"],
    ["422", "Lebanon"],
    ["426", "Lesotho"],
    ["430", "Liberia"],
    ["434", "Libya"],
    ["438", "Liechtenstein"],
    ["440", "Lithuania"],
    ["442", "Luxembourg"],
    ["450", "Madagascar"],
    ["454", "Malawi"],
    ["458", "Malaysia"],
    ["462", "Maldives"],
    ["466", "Mali"],
    ["470", "Malta"],
    ["584", "Marshall Islands"],
    ["478", "Mauritania"],
    ["480", "Mauritius"],
    ["484", "Mexico"],
    ["583", "Micronesia"],
    ["498", "Moldova"],
    ["492", "Monaco"],
    ["496", "Mongolia"],
    ["499", "Montenegro"],
    ["504", "Morocco"],
    ["508", "Mozambique"],
    ["104", "Myanmar"],
    ["516", "Namibia"],
    ["520", "Nauru"],
    ["524", "Nepal"],
    ["528", "Netherlands"],
    ["554", "New Zealand"],
    ["558", "Nicaragua"],
    ["562", "Niger"],
    ["566", "Nigeria"],
    ["408", "North Korea"],
    ["807", "North Macedonia"],
    ["578", "Norway"],
    ["512", "Oman"],
    ["586", "Pakistan"],
    ["585", "Palau"],
    ["591", "Panama"],
    ["598", "Papua New Guinea"],
    ["600", "Paraguay"],
    ["604", "Peru"],
    ["608", "Philippines"],
    ["616", "Poland"],
    ["620", "Portugal"],
    ["634", "Qatar"],
    ["642", "Romania"],
    ["643", "Russia"],
    ["646", "Rwanda"],
    ["659", "Saint Kitts and Nevis"],
    ["662", "Saint Lucia"],
    ["670", "Saint Vincent and the Grenadines"],
    ["882", "Samoa"],
    ["674", "San Marino"],
    ["678", "São Tomé and Príncipe"],
    ["682", "Saudi Arabia"],
    ["686", "Senegal"],
    ["688", "Serbia"],
    ["690", "Seychelles"],
    ["694", "Sierra Leone"],
    ["702", "Singapore"],
    ["703", "Slovakia"],
    ["705", "Slovenia"],
    ["090", "Solomon Islands"],
    ["706", "Somalia"],
    ["710", "South Africa"],
    ["410", "South Korea"],
    ["728", "South Sudan"],
    ["724", "Spain"],
    ["144", "Sri Lanka"],
    ["729", "Sudan"],
    ["740", "Suriname"],
    ["752", "Sweden"],
    ["756", "Switzerland"],
    ["760", "Syria"],
    ["762", "Tajikistan"],
    ["834", "Tanzania"],
    ["764", "Thailand"],
    ["626", "Timor-Leste"],
    ["768", "Togo"],
    ["776", "Tonga"],
    ["780", "Trinidad and Tobago"],
    ["788", "Tunisia"],
    ["792", "Türkiye"],
    ["795", "Turkmenistan"],
    ["798", "Tuvalu"],
    ["800", "Uganda"],
    ["804", "Ukraine"],
    ["784", "United Arab Emirates"],
    ["826", "United Kingdom"],
    ["840", "United States"],
    ["858", "Uruguay"],
    ["860", "Uzbekistan"],
    ["548", "Vanuatu"],
    ["336", "Holy See (Vatican City)"],
    ["862", "Venezuela"],
    ["704", "Vietnam"],
    ["887", "Yemen"],
    ["894", "Zambia"],
    ["716", "Zimbabwe"],
    ["275", "Palestine"],

    /* Two additional commonly counted sovereign entities */
    ["383", "Kosovo"],
    ["158", "Taiwan"]
  ];

  /* =========================================================
     TERRITORY → SOVEREIGN COUNTRY
  ========================================================= */

  /*
    These are deliberately NOT separate quiz countries.

    The map may contain dependent/overseas territories.
    They are assigned to their sovereign country for gameplay.
  */

  const TERRITORY_PARENT = {
    "016": "840", // American Samoa → United States
    "660": "826", // Anguilla → United Kingdom
    "533": "528", // Aruba → Netherlands
    "060": "826", // Bermuda → United Kingdom
    "535": "528", // Bonaire etc. → Netherlands
    "074": "578", // Bouvet → Norway
    "086": "826", // British Indian Ocean Territory → UK
    "092": "826", // British Virgin Islands → UK
    "136": "826", // Cayman Islands → UK
    "162": "036", // Christmas Island → Australia
    "166": "036", // Cocos Islands → Australia
    "184": "554", // Cook Islands → New Zealand
    "531": "528", // Curaçao → Netherlands
    "234": "208", // Faroe Islands → Denmark
    "238": "826", // Falkland Islands → UK
    "254": "250", // French Guiana → France
    "258": "250", // French Polynesia → France
    "260": "250", // French Southern Territories → France
    "292": "826", // Gibraltar → UK
    "304": "208", // Greenland → Denmark
    "312": "250", // Guadeloupe → France
    "316": "840", // Guam → US
    "334": "036", // Heard & McDonald → Australia
    "344": "156", // Hong Kong → China
    "833": "826", // Isle of Man → UK
    "831": "826", // Guernsey → UK
    "832": "826", // Jersey → UK
    "446": "156", // Macao → China
    "474": "250", // Martinique → France
    "175": "250", // Mayotte → France
    "500": "826", // Montserrat → UK
    "540": "250", // New Caledonia → France
    "570": "554", // Niue → New Zealand
    "574": "036", // Norfolk Island → Australia
    "580": "840", // Northern Mariana Islands → US
    "612": "826", // Pitcairn → UK
    "630": "840", // Puerto Rico → US
    "638": "250", // Réunion → France
    "652": "250", // Saint Barthélemy → France
    "654": "826", // Saint Helena → UK
    "663": "250", // Saint Martin → France
    "666": "250", // Saint Pierre and Miquelon → France
    "534": "528", // Sint Maarten → Netherlands
    "239": "826", // South Georgia → UK
    "744": "578", // Svalbard and Jan Mayen → Norway
    "772": "554", // Tokelau → New Zealand
    "796": "826", // Turks and Caicos → UK
    "581": "840", // US Minor Outlying Islands → US
    "850": "840", // US Virgin Islands → US
    "876": "250", // Wallis and Futuna → France
    "248": "246"  // Åland Islands → Finland
  };

  /* =========================================================
     KASHMIR GAMEPLAY REGION
  ========================================================= */

  /*
    This is a GAMEPLAY overlay, not a statement about
    international legal boundaries.

    The user requested the wider Jammu & Kashmir + Ladakh +
    Aksai Chin + Shaksgam Valley + Pakistan-administered
    Kashmir gameplay area to use India's colour.

    The polygons below intentionally use clear, chosen
    gameplay boundaries.
  */

  const KASHMIR_GAMEPLAY_FEATURE = {
    type: "Feature",
    properties: {
      name: "India gameplay region"
    },
    geometry: {
      type: "MultiPolygon",
      coordinates: [

        /*
          Western / north-western Kashmir gameplay region
        */
        [[
          [73.30, 35.05],
          [73.85, 36.00],
          [74.80, 36.55],
          [75.85, 36.85],
          [76.70, 36.60],
          [77.35, 35.95],
          [77.05, 35.15],
          [76.40, 34.45],
          [75.35, 33.80],
          [74.25, 33.80],
          [73.55, 34.25],
          [73.30, 35.05]
        ]],

        /*
          Aksai Chin gameplay region
        */
        [[
          [77.00, 35.10],
          [78.05, 35.85],
          [79.35, 35.85],
          [80.45, 35.45],
          [80.70, 34.55],
          [80.15, 33.80],
          [78.90, 33.85],
          [77.75, 34.25],
          [77.00, 35.10]
        ]],

        /*
          Shaksgam Valley gameplay region
        */
        [[
          [75.70, 36.65],
          [76.45, 37.15],
          [77.55, 37.20],
          [78.15, 36.65],
          [77.70, 35.95],
          [76.75, 35.95],
          [75.70, 36.65]
        ]]
      ]
    }
  };

  /* =========================================================
     OPTIONAL FALLBACK POINTS
  ========================================================= */

  /*
    These make extremely tiny countries easier to select if
    the map geometry is too small on a phone.

    They only appear when a country's actual map geometry
    is missing.
  */

  const FALLBACK_POINTS = {
    "020": [1.60, 42.55],
    "336": [12.45, 41.90],
    "438": [9.55, 47.14],
    "492": [7.42, 43.74],
    "674": [12.46, 43.94],
    "702": [103.82, 1.35],
    "470": [14.38, 35.94],
    "659": [-62.78, 17.30],
    "662": [-60.98, 13.91],
    "670": [-61.22, 13.16],
    "308": [-61.68, 12.12],
    "052": [-59.54, 13.19],
    "044": [-77.39, 25.03],
    "028": [-61.80, 17.06],
    "212": [-61.37, 15.42],
    "776": [-175.20, -21.18],
    "882": [-172.10, -13.76],
    "584": [171.18, 7.13],
    "583": [158.16, 6.92],
    "585": [134.62, 7.51],
    "296": [173.00, 1.87],
    "520": [166.93, -0.53],
    "798": [179.19, -8.52]
  };

  /* =========================================================
     CONTINENTS
  ========================================================= */

  const CONTINENT_BY_ID = {
    "004": "Asia",
    "008": "Europe",
    "012": "Africa",
    "020": "Europe",
    "024": "Africa",
    "028": "North America",
    "032": "South America",
    "051": "Asia",
    "036": "Oceania",
    "040": "Europe",
    "031": "Asia",
    "044": "North America",
    "048": "Asia",
    "050": "Asia",
    "052": "North America",
    "112": "Europe",
    "056": "Europe",
    "084": "North America",
    "204": "Africa",
    "064": "Asia",
    "068": "South America",
    "070": "Europe",
    "072": "Africa",
    "076": "South America",
    "096": "Asia",
    "100": "Europe",
    "854": "Africa",
    "108": "Africa",
    "132": "Africa",
    "116": "Asia",
    "120": "Africa",
    "124": "North America",
    "140": "Africa",
    "148": "Africa",
    "152": "South America",
    "156": "Asia",
    "170": "South America",
    "174": "Africa",
    "178": "Africa",
    "188": "North America",
    "384": "Africa",
    "191": "Europe",
    "192": "North America",
    "196": "Asia",
    "203": "Europe",
    "180": "Africa",
    "208": "Europe",
    "262": "Africa",
    "212": "North America",
    "214": "North America",
    "218": "South America",
    "818": "Africa",
    "222": "North America",
    "226": "Africa",
    "232": "Africa",
    "233": "Europe",
    "748": "Africa",
    "231": "Africa",
    "242": "Oceania",
    "246": "Europe",
    "250": "Europe",
    "266": "Africa",
    "270": "Africa",
    "268": "Asia",
    "276": "Europe",
    "288": "Africa",
    "300": "Europe",
    "308": "North America",
    "320": "North America",
    "324": "Africa",
    "624": "Africa",
    "328": "South America",
    "332": "North America",
    "340": "North America",
    "348": "Europe",
    "352": "Europe",
    "356": "Asia",
    "360": "Asia",
    "364": "Asia",
    "368": "Asia",
    "372": "Europe",
    "376": "Asia",
    "380": "Europe",
    "388": "North America",
    "392": "Asia",
    "400": "Asia",
    "398": "Asia",
    "404": "Africa",
    "296": "Oceania",
    "414": "Asia",
    "417": "Asia",
    "418": "Asia",
    "428": "Europe",
    "422": "Asia",
    "426": "Africa",
    "430": "Africa",
    "434": "Africa",
    "438": "Europe",
    "440": "Europe",
    "442": "Europe",
    "450": "Africa",
    "454": "Africa",
    "458": "Asia",
    "462": "Asia",
    "466": "Africa",
    "470": "Europe",
    "584": "Oceania",
    "478": "Africa",
    "480": "Africa",
    "484": "North America",
    "583": "Oceania",
    "498": "Europe",
    "492": "Europe",
    "496": "Asia",
    "499": "Europe",
    "504": "Africa",
    "508": "Africa",
    "104": "Asia",
    "516": "Africa",
    "520": "Oceania",
    "524": "Asia",
    "528": "Europe",
    "554": "Oceania",
    "558": "North America",
    "562": "Africa",
    "566": "Africa",
    "408": "Asia",
    "807": "Europe",
    "578": "Europe",
    "512": "Asia",
    "586": "Asia",
    "585": "Oceania",
    "591": "North America",
    "598": "Oceania",
    "600": "South America",
    "604": "South America",
    "608": "Asia",
    "616": "Europe",
    "620": "Europe",
    "634": "Asia",
    "642": "Europe",
    "643": "Europe",
    "646": "Africa",
    "659": "North America",
    "662": "North America",
    "670": "North America",
    "882": "Oceania",
    "674": "Europe",
    "678": "Africa",
    "682": "Asia",
    "686": "Africa",
    "688": "Europe",
    "690": "Africa",
    "694": "Africa",
    "702": "Asia",
    "703": "Europe",
    "705": "Europe",
    "090": "Oceania",
    "706": "Africa",
    "710": "Africa",
    "410": "Asia",
    "728": "Africa",
    "724": "Europe",
    "144": "Asia",
    "729": "Africa",
    "740": "South America",
    "752": "Europe",
    "756": "Europe",
    "760": "Asia",
    "762": "Asia",
    "834": "Africa",
    "764": "Asia",
    "626": "Asia",
    "768": "Africa",
    "776": "Oceania",
    "780": "North America",
    "788": "Africa",
    "792": "Asia",
    "795": "Asia",
    "798": "Oceania",
    "800": "Africa",
    "804": "Europe",
    "784": "Asia",
    "826": "Europe",
    "840": "North America",
    "858": "South America",
    "860": "Asia",
    "548": "Oceania",
    "336": "Europe",
    "862": "South America",
    "704": "Asia",
    "887": "Asia",
    "894": "Africa",
    "716": "Africa",
    "275": "Asia",
    "383": "Europe",
    "158": "Asia"
  };

  /* =========================================================
     DOM
  ========================================================= */

  const svg = d3.select("#world-map");

  const mapLoading = document.getElementById("map-loading");

  const newGameBtn = document.getElementById("new-game-btn");
  const playAgainBtn = document.getElementById("play-again-btn");

  const foundCountEl = document.getElementById("found-count");
  const missedCountEl = document.getElementById("missed-count");
  const remainingCountEl = document.getElementById("remaining-count");

  const promptCard = document.getElementById("prompt-card");
  const promptCountry = document.getElementById("prompt-country");
  const skipBtn = document.getElementById("skip-btn");

  const feedbackToast = document.getElementById("feedback-toast");

  const historyStrip = document.getElementById("history-strip");

  const menuBtn = document.getElementById("menu-btn");
  const drawer = document.getElementById("drawer");
  const drawerClose = document.getElementById("drawer-close");
  const drawerBackdrop = document.getElementById("drawer-backdrop");

  const highScoreValue = document.getElementById("high-score-value");

  const resultOverlay = document.getElementById("result-overlay");
  const resultIcon = document.getElementById("result-icon");
  const resultTitle = document.getElementById("result-title");
  const resultFound = document.getElementById("result-found");
  const resultMissed = document.getElementById("result-missed");
  const resultTotal = document.getElementById("result-total");

  const zoomInBtn = document.getElementById("zoom-in");
  const zoomOutBtn = document.getElementById("zoom-out");
  const zoomResetBtn = document.getElementById("zoom-reset");

  /* =========================================================
     STATE
  ========================================================= */

  let rawFeatures = [];
  let rawGeometries = [];

  let countryGroups = [];
  let groupById = new Map();

  let projection;
  let pathGenerator;

  let mapWidth = 0;
  let mapHeight = 0;

  let currentZoom = d3.zoomIdentity;

  let gameActive = false;
  let currentTargetIndex = -1;

  let found = 0;
  let missed = 0;

  let remaining = new Set();

  let discovered = new Set();

  let continentMisses = 0;

  let feedbackTimer = null;

  let mapReady = false;

  /* =========================================================
     MAP LAYERS
  ========================================================= */

  const rootGroup = svg.append("g")
    .attr("class", "map-root");

  const countryLayer = rootGroup.append("g")
    .attr("class", "country-layer");

  const indiaLayer = rootGroup.append("g")
    .attr("class", "india-layer");

  const fallbackLayer = rootGroup.append("g")
    .attr("class", "fallback-layer");

  /* =========================================================
     INITIALISE
  ========================================================= */

  document.addEventListener("DOMContentLoaded", () => {
    resultTotal.textContent = TOTAL_COUNTRIES;
    remainingCountEl.textContent = TOTAL_COUNTRIES;

    renderHistory();
    updateHighScore();

    setupControls();
    setupZoom();

    loadWorld();
  });

  /* =========================================================
     CONTROLS
  ========================================================= */

  function setupControls() {

    newGameBtn.addEventListener("click", () => {
      if (!mapReady) return;
      startGame();
    });

    playAgainBtn.addEventListener("click", () => {
      closeResultOverlay();

      if (mapReady) {
        startGame();
      }
    });

    skipBtn.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();

      if (!gameActive) return;

      skipCurrentCountry();
    });

    menuBtn.addEventListener("click", toggleDrawer);

    drawerClose.addEventListener("click", closeDrawer);

    drawerBackdrop.addEventListener("click", closeDrawer);
  }

  /* =========================================================
     DRAWER
  ========================================================= */

  function toggleDrawer() {
    if (drawer.classList.contains("open")) {
      closeDrawer();
    } else {
      openDrawer();
    }
  }

  function openDrawer() {
    drawer.classList.add("open");
    drawerBackdrop.classList.add("open");
    menuBtn.classList.add("active");

    menuBtn.setAttribute("aria-expanded", "true");
    drawer.setAttribute("aria-hidden", "false");
  }

  function closeDrawer() {
    drawer.classList.remove("open");
    drawerBackdrop.classList.remove("open");
    menuBtn.classList.remove("active");

    menuBtn.setAttribute("aria-expanded", "false");
    drawer.setAttribute("aria-hidden", "true");
  }

  /* =========================================================
     LOAD MAP
  ========================================================= */

  async function loadWorld() {

    try {

      const world = await d3.json(MAP_URL);

      if (!world || !world.objects || !world.objects.countries) {
        throw new Error("World map data is unavailable.");
      }

      rawGeometries = world.objects.countries.geometries;

      const featureCollection =
        topojson.feature(
          world,
          world.objects.countries
        );

      rawFeatures = featureCollection.features;

      buildCountryGroups();

      buildAdjacencyGraph();

      setupProjection();

      drawCountries();

      drawIndiaGameplayRegion();

      drawFallbackPoints();

      setupMapZoom();

      mapReady = true;

      mapLoading.classList.add("hidden");

      newGameBtn.disabled = false;

      updateStats();

    } catch (error) {

      console.error(error);

      mapLoading.innerHTML = `
        <span>Unable to load the map.</span>
        <button
          id="map-retry"
          class="primary-button"
          type="button"
          style="margin-top:8px">
          Try again
        </button>
      `;

      const retry = document.getElementById("map-retry");

      if (retry) {
        retry.addEventListener("click", loadWorld);
      }
    }
  }

  /* =========================================================
     BUILD COUNTRY GROUPS
  ========================================================= */

  function buildCountryGroups() {

    countryGroups = [];
    groupById = new Map();

    QUIZ_COUNTRIES.forEach(([id, name], index) => {

      const group = {
        id,
        name,
        index,

        featureIndexes: [],
        geometryFeatures: [],

        neighbours: new Set(),

        continent: CONTINENT_BY_ID[id] || "Other",

        colourIndex: index % MAP_COLOURS.length
      };

      countryGroups.push(group);
      groupById.set(id, group);
    });

    rawFeatures.forEach((feature, rawIndex) => {

      const rawId = normalizeId(feature.id);

      let parentId = null;

      if (groupById.has(rawId)) {
        parentId = rawId;
      } else if (TERRITORY_PARENT[rawId]) {
        parentId = TERRITORY_PARENT[rawId];
      }

      if (!parentId || !groupById.has(parentId)) {
        return;
      }

      const group = groupById.get(parentId);

      group.featureIndexes.push(rawIndex);
      group.geometryFeatures.push({
        feature,
        rawIndex,
        isTerritory: rawId !== parentId
      });
    });

    /*
      Add Kashmir gameplay feature to India geometry so
      India's reveal area includes the extended region.
    */

    const indiaGroup = groupById.get("356");

    if (indiaGroup) {
      indiaGroup.geometryFeatures.push({
        feature: KASHMIR_GAMEPLAY_FEATURE,
        rawIndex: -1,
        isTerritory: false,
        isGameplayOverlay: true
      });
    }

    /*
      Check that all 197 quiz countries have a map feature.
    */

    const missing = countryGroups.filter(group => {
      return group.geometryFeatures.length === 0;
    });

    if (missing.length) {
      console.warn(
        "Countries without map geometry:",
        missing.map(d => `${d.id} ${d.name}`)
      );
    }
  }

  /* =========================================================
     NORMALISE ISO ID
  ========================================================= */

  function normalizeId(value) {

    if (value === null || value === undefined) {
      return "";
    }

    const numeric = Number(value);

    if (!Number.isFinite(numeric)) {
      return String(value).padStart(3, "0");
    }

    return String(numeric).padStart(3, "0");
  }

  /* =========================================================
     ADJACENCY GRAPH
  ========================================================= */

  function buildAdjacencyGraph() {

    const neighbourArrays =
      topojson.neighbors(rawGeometries);

    rawGeometries.forEach((geometry, rawIndex) => {

      const rawId = normalizeId(geometry.id);

      let parentId = null;

      if (groupById.has(rawId)) {
        parentId = rawId;
      } else if (TERRITORY_PARENT[rawId]) {
        parentId = TERRITORY_PARENT[rawId];
      }

      if (!parentId || !groupById.has(parentId)) {
        return;
      }

      const group = groupById.get(parentId);

      const neighbours =
        neighbourArrays[rawIndex] || [];

      neighbours.forEach(neighbourRawIndex => {

        const neighbourGeometry =
          rawGeometries[neighbourRawIndex];

        if (!neighbourGeometry) return;

        const neighbourRawId =
          normalizeId(neighbourGeometry.id);

        let neighbourParentId = null;

        if (groupById.has(neighbourRawId)) {
          neighbourParentId = neighbourRawId;
        } else if (TERRITORY_PARENT[neighbourRawId]) {
          neighbourParentId =
            TERRITORY_PARENT[neighbourRawId];
        }

        if (!neighbourParentId) return;

        if (
          neighbourParentId !== parentId &&
          groupById.has(neighbourParentId)
        ) {
          group.neighbours.add(
            groupById.get(neighbourParentId).index
          );
        }
      });
    });

    /*
      Greedy graph colouring.
      Adjacent countries are given different colours.
    */

    const ordered =
      [...countryGroups]
        .sort(
          (a, b) =>
            b.neighbours.size - a.neighbours.size
        );

    ordered.forEach(group => {

      const used = new Set();

      group.neighbours.forEach(neighbourIndex => {

        const neighbour =
          countryGroups[neighbourIndex];

        if (neighbour) {
          used.add(neighbour.colourIndex);
        }
      });

      let colour = 0;

      while (used.has(colour)) {
        colour++;

        if (colour >= MAP_COLOURS.length) {
          colour = 0;
          break;
        }
      }

      group.colourIndex = colour;
    });
  }

  /* =========================================================
     PROJECTION
  ========================================================= */

  function setupProjection() {

    resizeMap();

    window.addEventListener("resize", resizeMap);
  }

  function resizeMap() {

    const rect =
      document.querySelector(".map-area").getBoundingClientRect();

    mapWidth = Math.max(1, rect.width);
    mapHeight = Math.max(1, rect.height);

    svg
      .attr("viewBox", `0 0 ${mapWidth} ${mapHeight}`)
      .attr("width", mapWidth)
      .attr("height", mapHeight);

    projection =
      d3.geoNaturalEarth1()
        .fitExtent(
          [
            [10, 10],
            [mapWidth - 10, mapHeight - 10]
          ],
          {
            type: "Sphere"
          }
        );

    pathGenerator =
      d3.geoPath()
        .projection(projection);

    redrawAll();
  }

  /* =========================================================
     DRAW COUNTRIES
  ========================================================= */

  function drawCountries() {

    const renderFeatures = [];

    countryGroups.forEach(group => {

      group.geometryFeatures.forEach(item => {

        renderFeatures.push({
          ...item.feature,

          __groupIndex: group.index,
          __groupId: group.id,
          __isTerritory: item.isTerritory,
          __isGameplayOverlay: item.isGameplayOverlay || false
        });
      });
    });

    countryLayer
      .selectAll("path.country")
      .data(renderFeatures, d => {
        return `${d.__groupId}-${d.id}-${d.__isTerritory}`;
      })
      .join("path")
      .attr("class", d => {
        return d.__isTerritory
          ? "country territory-part"
          : "country";
      })
      .attr("d", d => pathGenerator(d))
      .attr("fill", d => {

        const group =
          countryGroups[d.__groupIndex];

        return colourForGroup(group);
      })
      .attr("data-country-id", d => d.__groupId)
      .attr("aria-label", d => {
        const group =
          countryGroups[d.__groupIndex];

        return group ? group.name : "";
      })
      .on("click", function(event, d) {

        /*
          IMPORTANT:
          Direct click handler on the visible country path.

          This intentionally replaces the previous transparent
          hit-target approach that could intercept touch events.
        */

        event.preventDefault();
        event.stopPropagation();

        handleCountryClick(d.__groupIndex);
      });
  }

  /* =========================================================
     INDIA EXTENSION
  ========================================================= */

  function drawIndiaGameplayRegion() {

    const indiaGroup = groupById.get("356");

    if (!indiaGroup) return;

    indiaLayer
      .selectAll("path.india-extension")
      .data([KASHMIR_GAMEPLAY_FEATURE])
      .join("path")
      .attr("class", "india-extension")
      .attr("d", d => pathGenerator(d))
      .attr("fill", colourForGroup(indiaGroup))
      .attr("data-country-id", "356")
      .attr("aria-label", "India gameplay region")
      .on("click", function(event) {

        event.preventDefault();
        event.stopPropagation();

        handleCountryClick(indiaGroup.index);
      });
  }

  /* =========================================================
     FALLBACK MICROSTATE POINTS
  ========================================================= */

  function drawFallbackPoints() {

    const missingGroups =
      countryGroups.filter(
        group => group.geometryFeatures.length === 0
      );

    fallbackLayer
      .selectAll("circle")
      .data(missingGroups, d => d.id)
      .join("circle")
      .attr("r", 9)
      .attr("fill", group => colourForGroup(group))
      .attr("stroke", "#fffdf8")
      .attr("stroke-width", 1.5)
      .attr("cx", group => {

        const point = FALLBACK_POINTS[group.id];

        return point
          ? projection(point)[0]
          : -100;
      })
      .attr("cy", group => {

        const point = FALLBACK_POINTS[group.id];

        return point
          ? projection(point)[1]
          : -100;
      })
      .style("cursor", "pointer")
      .on("click", function(event, group) {

        event.preventDefault();
        event.stopPropagation();

        handleCountryClick(group.index);
      });
  }

  /* =========================================================
     REDRAW
  ========================================================= */

  function redrawAll() {

    if (!projection || !pathGenerator) {
      return;
    }

    countryLayer
      .selectAll("path.country")
      .attr("d", d => pathGenerator(d));

    indiaLayer
      .selectAll("path.india-extension")
      .attr("d", d => pathGenerator(d));

    fallbackLayer
      .selectAll("circle")
      .attr("cx", group => {

        const point = FALLBACK_POINTS[group.id];

        return point
          ? projection(point)[0]
          : -100;
      })
      .attr("cy", group => {

        const point = FALLBACK_POINTS[group.id];

        return point
          ? projection(point)[1]
          : -100;
      });
  }

  /* =========================================================
     COLOUR
  ========================================================= */

  function colourForGroup(group) {

    if (!group) {
      return "#c5bcb1";
    }

    return MAP_COLOURS[
      group.colourIndex % MAP_COLOURS.length
    ];
  }

  /* =========================================================
     ZOOM
  ========================================================= */

  function setupMapZoom() {

    const zoom =
      d3.zoom()
        .scaleExtent([1, MAX_ZOOM])
        .translateExtent([
          [-mapWidth * 2, -mapHeight * 2],
          [mapWidth * 3, mapHeight * 3]
        ])
        .on("zoom", event => {

          currentZoom = event.transform;

          rootGroup.attr(
            "transform",
            event.transform
          );
        });

    svg.call(zoom);

    window.__worldMapZoom = zoom;

    resetMapZoom();
  }

  function setupZoom() {

    zoomInBtn.addEventListener("click", () => {

      if (!window.__worldMapZoom) return;

      svg
        .transition()
        .duration(180)
        .call(
          window.__worldMapZoom.scaleBy,
          1.5
        );
    });

    zoomOutBtn.addEventListener("click", () => {

      if (!window.__worldMapZoom) return;

      svg
        .transition()
        .duration(180)
        .call(
          window.__worldMapZoom.scaleBy,
          1 / 1.5
        );
    });

    zoomResetBtn.addEventListener("click", () => {
      resetMapZoom();
    });
  }

  function resetMapZoom() {

    if (!window.__worldMapZoom) {
      rootGroup.attr("transform", null);
      return;
    }

    svg
      .transition()
      .duration(220)
      .call(
        window.__worldMapZoom.transform,
        d3.zoomIdentity
      );
  }

  /* =========================================================
     START GAME
  ========================================================= */

  function startGame() {

    closeDrawer();
    closeResultOverlay();

    gameActive = true;

    found = 0;
    missed = 0;

    continentMisses = 0;

    discovered = new Set();

    remaining =
      new Set(
        countryGroups.map(group => group.index)
      );

    currentTargetIndex = -1;

    resetMapZoom();

    resetCountryVisuals();

    promptCard.style.display = "flex";

    chooseNextCountry();

    updateStats();
  }

  /* =========================================================
     CHOOSE NEXT COUNTRY
  ========================================================= */

  function chooseNextCountry() {

    if (!gameActive) return;

    if (remaining.size === 0) {
      finishGame(true);
      return;
    }

    let candidates =
      [...remaining];

    /*
      Mild same-continent bias.
      This keeps rounds feeling geographically coherent
      without forcing an entire continent.
    */

    if (
      currentTargetIndex >= 0 &&
      Math.random() < 0.72
    ) {

      const previous =
        countryGroups[currentTargetIndex];

      if (previous) {

        const sameContinent =
          candidates.filter(index => {

            const group =
              countryGroups[index];

            return (
              group &&
              group.continent === previous.continent
            );
          });

        if (sameContinent.length > 0) {
          candidates = sameContinent;
        }
      }
    }

    const randomIndex =
      Math.floor(
        Math.random() * candidates.length
      );

    currentTargetIndex =
      candidates[randomIndex];

    promptCountry.textContent =
      countryGroups[currentTargetIndex].name;

    updateStats();
  }

  /* =========================================================
     COUNTRY CLICK
  ========================================================= */

  function handleCountryClick(groupIndex) {

    if (!gameActive) {
      return;
    }

    if (
      groupIndex === undefined ||
      groupIndex === null ||
      !countryGroups[groupIndex]
    ) {
      return;
    }

    const clicked =
      countryGroups[groupIndex];

    const target =
      countryGroups[currentTargetIndex];

    if (!target) {
      return;
    }

    /*
      Already found countries cannot be selected again.
    */

    if (discovered.has(groupIndex)) {
      showFeedback(
        "Already found",
        "incorrect"
      );

      return;
    }

    if (groupIndex === currentTargetIndex) {

      handleCorrect(groupIndex);

    } else {

      handleIncorrect(groupIndex);
    }
  }

  /* =========================================================
     CORRECT
  ========================================================= */

  function handleCorrect(groupIndex) {

    const group =
      countryGroups[groupIndex];

    discovered.add(groupIndex);
    remaining.delete(groupIndex);

    found++;

    continentMisses = 0;

    highlightGroup(
      groupIndex,
      "correct"
    );

    showFeedback(
      `✓ ${group.name}`,
      "correct"
    );

    updateStats();

    window.setTimeout(() => {

      if (!gameActive) return;

      chooseNextCountry();

    }, 430);
  }

  /* =========================================================
     INCORRECT
  ========================================================= */

  function handleIncorrect(groupIndex) {

    const clicked =
      countryGroups[groupIndex];

    const target =
      countryGroups[currentTargetIndex];

    missed++;

    continentMisses++;

    highlightGroup(
      groupIndex,
      "incorrect"
    );

    showFeedback(
      `Try again — that's ${clicked.name}`,
      "incorrect"
    );

    updateStats();

    if (missed >= MAX_MISTAKES) {

      window.setTimeout(() => {

        finishGame(false);

      }, 500);

      return;
    }

    /*
      Do not immediately change the question after a wrong
      answer. This makes it clear which country the user
      needs to find.
    */

    window.setTimeout(() => {

      clearTemporaryHighlight();

    }, 600);
  }

  /* =========================================================
     SKIP
  ========================================================= */

  function skipCurrentCountry() {

    const target =
      countryGroups[currentTargetIndex];

    if (!target) return;

    /*
      Skipping counts as a miss, but does not permanently
      mark the country as discovered.
    */

    missed++;

    showFeedback(
      `Skipped — ${target.name}`,
      "incorrect"
    );

    updateStats();

    if (missed >= MAX_MISTAKES) {

      window.setTimeout(() => {
        finishGame(false);
      }, 500);

      return;
    }

    window.setTimeout(() => {

      clearTemporaryHighlight();

      chooseNextCountry();

    }, 350);
  }

  /* =========================================================
     HIGHLIGHT
  ========================================================= */

  function highlightGroup(groupIndex, type) {

    const selector =
      `[data-country-id="${countryGroups[groupIndex].id}"]`;

    const selection =
      countryLayer
        .selectAll(selector);

    selection
      .attr(
        "data-feedback",
        type
      )
      .style(
        "filter",
        type === "correct"
          ? "brightness(1.16)"
          : "brightness(0.82)"
      )
      .style(
        "stroke-width",
        type === "correct"
          ? "2"
          : "1.7"
      );

    /*
      India extension uses a separate layer.
    */

    if (countryGroups[groupIndex].id === "356") {

      indiaLayer
        .selectAll(".india-extension")
        .attr("data-feedback", type)
        .style(
          "filter",
          type === "correct"
            ? "brightness(1.16)"
            : "brightness(0.82)"
        )
        .style(
          "stroke-width",
          type === "correct"
            ? "2.2"
            : "1.8"
        );
    }
  }

  function clearTemporaryHighlight() {

    countryLayer
      .selectAll("[data-feedback]")
      .style("filter", null)
      .style("stroke-width", null)
      .attr("data-feedback", null);

    indiaLayer
      .selectAll("[data-feedback]")
      .style("filter", null)
      .style("stroke-width", null)
      .attr("data-feedback", null);
  }

  function resetCountryVisuals() {

    countryLayer
      .selectAll("path.country")
      .style("filter", null)
      .style("stroke-width", null)
      .attr("data-feedback", null);

    indiaLayer
      .selectAll(".india-extension")
      .style("filter", null)
      .style("stroke-width", null)
      .attr("data-feedback", null);
  }

  /* =========================================================
     FEEDBACK
  ========================================================= */

  function showFeedback(message, type) {

    if (feedbackTimer) {
      clearTimeout(feedbackTimer);
    }

    feedbackToast.textContent = message;

    feedbackToast.className =
      `feedback-toast show ${type}`;

    feedbackTimer =
      setTimeout(() => {

        feedbackToast.classList.remove("show");

      }, 1100);
  }

  /* =========================================================
     STATS
  ========================================================= */

  function updateStats() {

    foundCountEl.textContent = found;
    missedCountEl.textContent = missed;

    remainingCountEl.textContent =
      Math.max(0, remaining.size);
  }

  /* =========================================================
     FINISH GAME
  ========================================================= */

  function finishGame(completedAll) {

    if (!gameActive) return;

    gameActive = false;

    clearTemporaryHighlight();

    const finalFound = found;
    const finalMissed = missed;

    resultFound.textContent = finalFound;
    resultMissed.textContent = finalMissed;
    resultTotal.textContent = TOTAL_COUNTRIES;

    if (completedAll) {

      resultIcon.textContent = "🏆";
      resultTitle.textContent = "Perfect round";

    } else {

      resultIcon.textContent = "🏁";
      resultTitle.textContent = "Game over";
    }

    saveResult(
      finalFound,
      finalMissed
    );

    updateHighScore();

    resultOverlay.classList.add("open");
    resultOverlay.setAttribute("aria-hidden", "false");
  }

  /* =========================================================
     RESULT OVERLAY
  ========================================================= */

  function closeResultOverlay() {

    resultOverlay.classList.remove("open");
    resultOverlay.setAttribute("aria-hidden", "true");
  }

  /* =========================================================
     LOCAL STORAGE
  ========================================================= */

  function saveResult(foundScore, missedScore) {

    const history =
      getHistory();

    history.unshift({
      found: foundScore,
      missed: missedScore,
      total: TOTAL_COUNTRIES,
      date: Date.now()
    });

    const trimmed =
      history.slice(0, 10);

    localStorage.setItem(
      STORAGE_HISTORY,
      JSON.stringify(trimmed)
    );

    const currentHigh =
      Number(
        localStorage.getItem(
          STORAGE_HIGH_SCORE
        ) || 0
      );

    if (foundScore > currentHigh) {

      localStorage.setItem(
        STORAGE_HIGH_SCORE,
        String(foundScore)
      );
    }

    renderHistory();
  }

  function getHistory() {

    try {

      const raw =
        localStorage.getItem(
          STORAGE_HISTORY
        );

      if (!raw) return [];

      const parsed =
        JSON.parse(raw);

      return Array.isArray(parsed)
        ? parsed
        : [];

    } catch {

      return [];
    }
  }

  /* =========================================================
     HISTORY UI
  ========================================================= */

  function renderHistory() {

    const history =
      getHistory();

    historyStrip.innerHTML = "";

    if (!history.length) {

      historyStrip.innerHTML =
        `<div class="history-empty">No games yet</div>`;

      return;
    }

    history.forEach(game => {

      const item =
        document.createElement("div");

      item.className =
        "history-item " +
        (
          game.found >= 100
            ? "good"
            : "bad"
        );

      item.textContent =
        `${game.found}/${game.total}`;

      historyStrip.appendChild(item);
    });
  }

  /* =========================================================
     HIGH SCORE
  ========================================================= */

  function updateHighScore() {

    const highScore =
      Number(
        localStorage.getItem(
          STORAGE_HIGH_SCORE
        ) || 0
      );

    highScoreValue.textContent =
      highScore;
  }

  /* =========================================================
     KEYBOARD ACCESS
  ========================================================= */

  document.addEventListener("keydown", event => {

    if (event.key === "Escape") {

      if (drawer.classList.contains("open")) {
        closeDrawer();
      }

      if (resultOverlay.classList.contains("open")) {
        closeResultOverlay();
      }
    }
  });

})();