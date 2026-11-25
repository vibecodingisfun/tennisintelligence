import { COPY, ORDER, VB, WTA_LEDE, esc, lastName, pickIndex } from "./chart-config.js";
import { nearestPoint, renderSvg } from "./chart-render.js?v=16";
import { saveChart } from "./chart-export.js?v=2";
import { pulse, reveal } from "./motion.js";

const state = {};
const phone = window.matchMedia("(max-width: 640px)");
const announce = document.getElementById("announce");
let activeTour = "atp";

function say(text) {
  if (announce) announce.textContent = text;
}
function syncFinderClear() {
  const input = document.getElementById("player");
  const clear = document.getElementById("player-clear");
  if (!clear) return;
  clear.hidden = !(input && input.value.trim());
}
function clearFinder({ deselect = false } = {}) {
  const input = document.getElementById("player");
  const note = document.getElementById("finder-note");
  if (input) input.value = "";
  if (note) note.textContent = "";
  const url = new URL(window.location.href);
  if (url.searchParams.has("player")) {
    url.searchParams.delete("player");
    history.replaceState(null, "", url.pathname + url.search + url.hash);
  }
  if (deselect) {
    Object.keys(state).forEach((id) => {
      if (COPY[id].group !== activeTour) return;
      state[id].index = -1;
      state[id].absent = null;
      renderChart(id);
    });
  }
  syncFinderClear();
}
function showTour(tour, { updateHash = false, resetFinder = false } = {}) {
  const prev = activeTour;
  activeTour = tour === "wta" ? "wta" : "atp";
  const atpOn = activeTour === "atp";
  const tabAtp = document.getElementById("tab-atp");
  const tabWta = document.getElementById("tab-wta");
  const panelAtp = document.getElementById("panel-atp");
  const panelWta = document.getElementById("panel-wta");
  const tocAtp = document.querySelector(".toc-atp");
  const tocWta = document.querySelector(".toc-wta");
  if (tabAtp) tabAtp.setAttribute("aria-selected", atpOn ? "true" : "false");
  if (tabWta) tabWta.setAttribute("aria-selected", atpOn ? "false" : "true");
  if (panelAtp) panelAtp.hidden = !atpOn;
  if (panelWta) panelWta.hidden = atpOn;
  if (tocAtp) tocAtp.hidden = !atpOn;
  if (tocWta) tocWta.hidden = atpOn;
  if (resetFinder && prev !== activeTour) clearFinder();
  refreshFinderList();
  if (updateHash) {
    const hash = window.location.hash;
    if (!hash || hash === "#atp" || hash === "#wta") {
      history.replaceState(null, "", `#${activeTour}`);
    }
  }
}
function bindTabs() {
  document.querySelectorAll('.plots-page [role="tab"]').forEach((tab) => {
    tab.addEventListener("click", () => {
      const tour = tab.id === "tab-wta" ? "wta" : "atp";
      showTour(tour, { updateHash: true, resetFinder: true });
      window.scrollTo({ top: 0, behavior: "instant" });
    });
  });
}
function renderChart(id) {
  const spec = COPY[id];
  const bucket = state[id];
  const root = document.getElementById("chart-" + id);
  if (!root || !bucket) return;
  const selected = bucket.index >= 0 ? bucket.players[bucket.index] : null;
  const label = selected
    ? `${spec.title}. ${bucket.players.length} players. Selected: ${selected.name}.`
    : `${spec.title}. ${bucket.players.length} players. ${bucket.absent || "No player"} is not on this plot.`;
  const { svg, points } = renderSvg(spec, bucket.players, selected ? bucket.index : -1, {
    theme: "page",
    compact: phone.matches,
    label,
  });
  bucket.points = points;
  root.querySelector(".map").innerHTML = svg;
  const saveBtn = root.querySelector(".save");
  if (selected) {
    root.querySelector(".readout").innerHTML = `<p class="kicker">Selected player</p><h3>${esc(selected.name)}</h3><ul class="facts">${spec.meta(selected).split(" · ").map((fact) => `<li>${esc(fact)}</li>`).join("")}</ul>`;
    if (saveBtn) saveBtn.disabled = false;
  } else {
    const who = bucket.absent || "That player";
    const why = id === "fh"
      ? `${who} is not on this plot. Forehand speeds needs a published average forehand speed, and only 19 men have one in this set.`
      : `${who} is not on this plot.`;
    root.querySelector(".readout").innerHTML = `<p class="kicker">Not on this plot</p><h3>${esc(who)}</h3><ul class="facts"><li>${esc(why)}</li></ul>`;
    if (saveBtn) saveBtn.disabled = true;
  }
}
function mount(id, number) {
  const spec = COPY[id];
  const article = document.createElement("article");
  article.className = "chapter";
  article.id = "chart-" + id;
  article.dataset.tour = spec.group;
  article.setAttribute("aria-labelledby", `chart-${id}-title`);
  article.innerHTML = `<p class="chapter-no kicker"><span class="num">${String(number).padStart(2, "0")}</span>${spec.group === "wta" ? "WTA · Women" : "ATP · Men"}</p>
<h2 id="chart-${id}-title">${esc(spec.title)}</h2>
<p class="premise">${esc(spec.blurb)}</p>
<div class="chapter-body">
  <figure class="figure">
    <div class="map"></div>
    <p class="actions chart-share"><button type="button" class="button save">Share</button><span class="status" role="status"></span></p>
    <figcaption class="hint">${esc(spec.lede)}</figcaption>
  </figure>
  <div class="chapter-notes">
    <div>
      <div class="readout"></div>
    </div>
    <div class="method">
      <p class="kicker">How it is measured</p>
      <p>${esc(spec.defLede)}</p>
      <dl>${spec.defs.map(([term, text]) => `<dt>${esc(term)}</dt><dd>${esc(text)}</dd>`).join("")}</dl>
    </div>
  </div>
</div>`;
  document.getElementById(spec.group).appendChild(article);
  renderChart(id);
  article.querySelector(".map").addEventListener("click", (ev) => {
    const svg = article.querySelector(".map svg");
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((ev.clientX - rect.left) / rect.width) * VB;
    const y = ((ev.clientY - rect.top) / rect.height) * VB;
    const hit = nearestPoint(state[id].points, x, y);
    if (hit < 0 || hit === state[id].index) return;
    state[id].index = hit;
    state[id].absent = null;
    renderChart(id);
    pulse(article.querySelector(".readout"));
    say(`${state[id].players[hit].name} selected on ${spec.title}.`);
  });
  const button = article.querySelector(".save");
  const status = article.querySelector(".status");
  button.addEventListener("click", async () => {
    if (state[id].index < 0) {
      status.textContent = "Choose a player on this plot first.";
      return;
    }
    button.disabled = true;
    status.textContent = "Preparing…";
    try {
      const result = await saveChart(spec, state[id].players, state[id].index);
      status.textContent = result === "shared" ? "Opened the share sheet."
        : result === "copied" ? "Image copied."
        : result === "aborted" ? ""
        : "Image saved.";
    } catch (err) {
      status.textContent = "Could not share the image.";
    } finally {
      button.disabled = false;
    }
  });
  return article;
}
function chartingNames(tour = activeTour) {
  const names = new Set();
  Object.keys(state).forEach((id) => {
    if (COPY[id].group !== tour) return;
    state[id].players.forEach((p) => names.add(p.name));
  });
  return [...names].sort((a, b) => a.localeCompare(b, "en"));
}
function refreshFinderList() {
  const list = document.getElementById("player-names");
  const input = document.getElementById("player");
  if (!list) return;
  list.innerHTML = chartingNames(activeTour).map((name) => `<option value="${esc(name)}"></option>`).join("");
  if (input) {
    input.placeholder = activeTour === "wta" ? "WTA charting name" : "ATP charting name";
  }
}
function findChartingName(query, tour = activeTour) {
  const q = String(query || "").trim().replace(/\s+/g, " ").toLowerCase();
  if (!q) return { empty: true };
  const names = chartingNames(tour);
  const fold = (name) => name.trim().replace(/\s+/g, " ").toLowerCase();
  const exact = names.filter((name) => fold(name) === q);
  if (exact.length === 1) return { name: exact[0], tour };
  if (exact.length > 1) return { many: true };
  const lasts = [...new Set(names.filter((name) => lastName(name).toLowerCase() === q))];
  if (lasts.length === 1) return { name: lasts[0], tour };
  if (lasts.length > 1) return { many: true };
  return { missing: true };
}
function findChartingNameAny(query) {
  const here = findChartingName(query, activeTour);
  if (!here.missing && !here.empty) return here;
  const other = activeTour === "atp" ? "wta" : "atp";
  const there = findChartingName(query, other);
  if (!there.missing && !there.empty) return there;
  return here.missing ? there : here;
}
function selectPlayer(name, tour = activeTour) {
  let count = 0;
  Object.keys(state).forEach((id) => {
    if (COPY[id].group !== tour) return;
    const index = state[id].players.findIndex((p) => p.name === name);
    if (index < 0) {
      state[id].index = -1;
      state[id].absent = name;
    } else {
      state[id].index = index;
      state[id].absent = null;
      count += 1;
    }
    renderChart(id);
  });
  return count;
}
function bindFinder() {
  const form = document.getElementById("finder");
  const input = document.getElementById("player");
  const note = document.getElementById("finder-note");
  const clearBtn = document.getElementById("player-clear");
  if (!form || !input || !note) return;
  refreshFinderList();
  const show = (query, { anyTour = false } = {}) => {
    const found = anyTour ? findChartingNameAny(query) : findChartingName(query);
    if (found.empty) {
      note.textContent = "Type a charting name.";
      syncFinderClear();
      return;
    }
    if (found.missing) {
      note.textContent = activeTour === "wta"
        ? "That name is not on the WTA charts."
        : "That name is not on the ATP charts.";
      syncFinderClear();
      return;
    }
    if (found.many) {
      note.textContent = "More than one player has that name. Use the full charting name.";
      syncFinderClear();
      return;
    }
    if (found.tour && found.tour !== activeTour) showTour(found.tour);
    const count = selectPlayer(found.name, found.tour || activeTour);
    input.value = found.name;
    note.textContent = `${found.name} is selected on ${count} ${count === 1 ? "chart" : "charts"}.`;
    const url = new URL(window.location.href);
    url.searchParams.set("player", found.name);
    history.replaceState(null, "", url.pathname + url.search + url.hash);
    syncFinderClear();
  };
  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    show(input.value);
  });
  input.addEventListener("input", syncFinderClear);
  input.addEventListener("focus", () => {
    if (!input.value) return;
    // Select the whole name so the next keystroke clears it (iOS needs a short delay).
    setTimeout(() => {
      try { input.setSelectionRange(0, input.value.length); }
      catch (_) { input.select(); }
    }, 0);
  });
  if (clearBtn) {
    clearBtn.addEventListener("pointerdown", (ev) => ev.preventDefault());
    clearBtn.addEventListener("click", (ev) => {
      ev.preventDefault();
      clearFinder({ deselect: true });
      input.focus();
    });
  }
  const initial = new URLSearchParams(window.location.search).get("player");
  if (initial) {
    input.value = initial;
    show(initial, { anyTour: true });
  } else {
    syncFinderClear();
  }
}
function bindToc(chapters) {
  const links = new Map([...document.querySelectorAll(".toc a")].map((a) => [a.getAttribute("href").slice(1), a]));
  const mark = (id) => links.forEach((a, key) => {
    if (key === id) a.setAttribute("aria-current", "true");
    else a.removeAttribute("aria-current");
  });
  document.querySelectorAll(".toc a").forEach((a) => {
    a.addEventListener("click", () => {
      const id = a.getAttribute("href").slice(1).replace(/^chart-/, "");
      if (COPY[id]) showTour(COPY[id].group);
    });
  });
  if (!("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const tour = entry.target.dataset.tour;
      if (tour && tour !== activeTour) return;
      mark(entry.target.id);
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  chapters.forEach((chapter) => io.observe(chapter));
}
function scrollToHash() {
  const hash = window.location.hash;
  if (hash === "#wta" || hash === "#atp") {
    showTour(hash.slice(1));
    return null;
  }
  const match = /^#chart-(\w+)$/.exec(hash);
  if (!match || !state[match[1]]) return null;
  showTour(COPY[match[1]].group);
  document.getElementById("chart-" + match[1]).scrollIntoView({ block: "start", behavior: "instant" });
  return window.scrollY;
}

bindTabs();
fetch("../data/charts.json")
  .then((res) => { if (!res.ok) throw new Error(String(res.status)); return res.json(); })
  .then((rows) => {
    const lede = document.getElementById("wta-lede");
    if (lede) lede.textContent = WTA_LEDE;
    const byId = Object.fromEntries(rows.map((row) => [row.id, row]));
    const tourIndex = { atp: 0, wta: 0 };
    const chapters = ORDER.filter((id) => byId[id]).map((id) => {
      state[id] = { players: byId[id].players, index: pickIndex(id, byId[id].players), points: [] };
      const tour = COPY[id].group;
      tourIndex[tour] += 1;
      return mount(id, tourIndex[tour]);
    });
    if (window.location.hash === "#wta") showTour("wta");
    else showTour("atp");
    bindFinder();
    bindToc(chapters);
    reveal(chapters.map((chapter) => chapter.querySelector(".chapter-body")));
    phone.addEventListener("change", () => Object.keys(state).forEach(renderChart));
    const landed = scrollToHash();
    document.fonts.ready.then(() => {
      if (landed != null && Math.abs(window.scrollY - landed) < 4) scrollToHash();
      document.documentElement.classList.add("smooth");
    });
  })
  .catch((err) => {
    const atp = document.getElementById("atp");
    if (atp) atp.innerHTML = `<p class="load-error">The charts could not be loaded.</p>`;
    console.error(err);
  });
