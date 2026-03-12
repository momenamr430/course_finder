/* ── STATE ─────────────────────────────── */
let currentPage  = 0;
let currentQuery = "";
let activeFilter = "all";
let allCards     = [];

/* ── ELEMENTS ──────────────────────────── */
const form        = document.getElementById("searchForm");
const input       = document.getElementById("searchInput");
const searchBtn   = document.getElementById("searchBtn");
const btnText     = searchBtn.querySelector(".btn-text");
const btnLoader   = searchBtn.querySelector(".btn-loader");
const main        = document.getElementById("main");
const grid        = document.getElementById("cardsGrid");
const statsText   = document.getElementById("statsText");
const pills       = document.getElementById("platformPills");
const loadWrap    = document.getElementById("loadMoreWrap");
const loadBtn     = document.getElementById("loadMoreBtn");
const emptyState  = document.getElementById("emptyState");
const filterBtns  = document.querySelectorAll(".filter-btn");
const cardTpl     = document.getElementById("cardTpl");

/* ── SEARCH ────────────────────────────── */
form.addEventListener("submit", e => {
  e.preventDefault();
  const q = input.value.trim();
  if (!q) { shakeInput(); return; }
  if (q === currentQuery) { resetGrid(); }
  currentQuery = q;
  currentPage  = 0;
  allCards     = [];
  resetGrid();
  fetchResults();
});

loadBtn.addEventListener("click", fetchResults);

async function fetchResults() {
  setLoading(true);

  try {
    const res  = await fetch(`/search?q=${encodeURIComponent(currentQuery)}&page=${currentPage}`);
    const data = await res.json();

    if (data.error) throw new Error(data.error);

    if (currentPage === 0) {
      grid.innerHTML = "";
      pills.innerHTML = "";
      allCards = [];
      setFilter("all", false);
    }

    if (data.results.length === 0 && currentPage === 0) {
      emptyState.hidden = false;
      loadWrap.hidden   = true;
    } else {
      emptyState.hidden = true;
      renderCards(data.results);
      currentPage++;
      updateStats();
      loadWrap.hidden = data.results.length < 5;
    }

    main.hidden = false;
    if (currentPage === 1) {
      main.scrollIntoView({ behavior: "smooth", block: "start" });
    }

  } catch (err) {
    statsText.textContent = `Error: ${err.message}`;
    statsText.style.color = "#FF5370";
  } finally {
    setLoading(false);
  }
}

/* ── RENDER CARDS ──────────────────────── */
function renderCards(results) {
  const counts = {};

  results.forEach((r, i) => {
    const node = cardTpl.content.cloneNode(true);
    const card = node.querySelector(".card");

    card.dataset.platform = r.key;
    card.style.animationDelay = `${i * 40}ms`;

    card.querySelector(".card-platform").textContent  = r.platform;
    card.querySelector(".card-platform").style.color  = r.color;
    card.querySelector(".card-title").textContent     = r.title;
    card.querySelector(".card-domain").textContent    = r.domain;
    card.querySelector(".card-snippet").textContent   = r.snippet;

    const link = card.querySelector(".card-link");
    link.href = r.link;

    // Apply active filter
    if (activeFilter !== "all" && activeFilter !== r.key) {
      card.hidden = true;
    }

    grid.appendChild(node);
    allCards.push(grid.lastElementChild);

    // Count per platform
    counts[r.key] = (counts[r.key] || 0) + 1;
  });

  updatePills(counts);
}

/* ── PILLS ─────────────────────────────── */
const PLATFORM_COLORS = {
  coursera: "#0056D2", udemy: "#A435F0",
  edx: "#00B8A9",     udacity: "#02B3E4",
  linkedin: "#0A66C2", youtube: "#FF4444",
};

function updatePills(counts) {
  Object.entries(counts).forEach(([key, n]) => {
    const existing = pills.querySelector(`[data-key="${key}"]`);
    if (existing) {
      existing.textContent = `${key.charAt(0).toUpperCase()+key.slice(1)}  ${n}`;
    } else {
      const pill = document.createElement("span");
      pill.className = "pill";
      pill.dataset.key = key;
      const c = PLATFORM_COLORS[key] || "#888";
      pill.style.color = c;
      pill.style.borderColor = c + "44";
      pill.style.background  = c + "11";
      pill.textContent = `${key.charAt(0).toUpperCase()+key.slice(1)}  ${n}`;
      pills.appendChild(pill);
    }
  });
}

/* ── FILTER ────────────────────────────── */
filterBtns.forEach(btn => {
  btn.addEventListener("click", () => setFilter(btn.dataset.filter));
});

function setFilter(filter, updateBtn = true) {
  activeFilter = filter;

  if (updateBtn) {
    filterBtns.forEach(b => b.classList.toggle("active", b.dataset.filter === filter));
  }

  allCards.forEach(card => {
    card.hidden = filter !== "all" && card.dataset.platform !== filter;
  });
}

/* ── STATS ─────────────────────────────── */
function updateStats() {
  const visible = allCards.length;
  statsText.textContent = `${visible} result${visible !== 1 ? "s" : ""} for "${currentQuery}"`;
  statsText.style.color = "";
}

/* ── UTILS ─────────────────────────────── */
function setLoading(on) {
  searchBtn.disabled = on;
  btnText.hidden     = on;
  btnLoader.hidden   = !on;
  loadBtn.disabled   = on;
  if (on) loadBtn.textContent = "Loading...";
  else    loadBtn.innerHTML   = `Load More Results <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>`;
}

function resetGrid() {
  grid.innerHTML   = "";
  allCards         = [];
  pills.innerHTML  = "";
  emptyState.hidden = true;
  loadWrap.hidden  = true;
}

function shakeInput() {
  input.style.transition = "transform .08s";
  const steps = [[-6,0],[6,0],[-4,0],[4,0],[0,0]];
  steps.reduce((p, [x], i) =>
    p.then(() => new Promise(r => setTimeout(() => {
      input.style.transform = `translateX(${x}px)`; r();
    }, 80))),
  Promise.resolve()).then(() => input.style.transform = "");
  input.focus();
}
