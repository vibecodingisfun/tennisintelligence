import { COPY, ORDER, VB, WTA_LEDE, esc, lastName, pickIndex } from "./chart-config.js";
import { nearestPoint, renderSvg } from "./chart-render.js";
import { saveChart } from "./chart-export.js";
import { pulse, reveal } from "./motion.js";

const state = {};
const phone = window.matchMedia("(max-width: 640px)");
const announce = document.getElementById("announce");

function say(text) {
  if (announce) announce.textContent = text;
}
function renderChart(id) {
  const spec = COPY[id];
  const bucket = state[id];
  const root = document.getElementById("chart-" + id);
  const selected = bucket.players[bucket.index];
  const { svg, points } = renderSvg(spec, bucket.players, bucket.index, {
    theme: "page",
    compact: phone.matches,
    label: `${spec.title}. ${bucket.players.length} players. Selected: ${selected.name}.`,
  });
  bucket.points = points;
  root.querySelector(".map").innerHTML = svg;
  root.querySelector(".readout").innerHTML = `<p class="kicker">Selected player</p><h3>${esc(selected.name)}</h3><ul class="facts">${spec.meta(selected).split(" · ").map((fact) => `<li>${esc(fact)}</li>`).join("")}</ul>`;
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
    <figcaption class="hint">${esc(spec.lede)}</figcaption>
  </figure>
  <div class="chapter-notes">
    <div>
      <div class="readout"></div>
      <p class="actions"><button type="button" class="button save">Save PNG</button><span class="status" role="status"></span></p>
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
    renderChart(id);
    pulse(article.querySelector(".readout"));
    say(`${state[id].players[hit].name} selected on ${spec.title}.`);
  });
  const button = article.querySelector(".save");
  const status = article.querySelector(".status");
  button.addEventListener("click", async () => {
    button.disabled = true;
    status.textContent = "Preparing…";
    try {
      await saveChart(spec, state[id].players, state[id].index);
      status.textContent = "Image saved.";
    } catch (err) {
      status.textContent = "Could not save the image.";
    } finally {
      button.disabled = false;
    }
  });
  return article;
}
function chartingNames() {
  const names = new Set();
  Object.values(state).forEach((bucket) => bucket.players.forEach((p) => names.add(p.name)));
  return [...names].sort((a, b) => a.localeCompare(b, "en"));
}
function findChartingName(query) {
  const q = String(query || "").trim().replace(/\s+/g, " ").toLowerCase();
  if (!q) return { empty: true };
  const names = chartingNames();
  const fold = (name) => name.trim().replace(/\s+/g, " ").toLowerCase();
  const exact = names.filter((name) => fold(name) === q);
  if (exact.length === 1) return { name: exact[0] };
  if (exact.length > 1) return { many: true };
  const lasts = [...new Set(names.filter((name) => lastName(name).toLowerCase() === q))];
  if (lasts.length === 1) return { name: lasts[0] };
  if (lasts.length > 1) return { many: true };
  return { missing: true };
}
function selectPlayer(name) {
  let count = 0;
  Object.keys(state).forEach((id) => {
    const index = state[id].players.findIndex((p) => p.name === name);
    if (index < 0) return;
    state[id].index = index;
    renderChart(id);
    count += 1;
  });
  return count;
}
function bindFinder() {
  const form = document.getElementById("finder");
  const input = document.getElementById("player");
  const note = document.getElementById("finder-note");
  const list = document.getElementById("player-names");
  if (!form || !input || !note || !list) return;
  list.innerHTML = chartingNames().map((name) => `<option value="${esc(name)}"></option>`).join("");
  const show = (query) => {
    const found = findChartingName(query);
    if (found.empty) {
      note.textContent = "Type a charting name.";
      return;
    }
    if (found.missing) {
      note.textContent = "That name is not on these charts.";
      return;
    }
    if (found.many) {
      note.textContent = "More than one player has that name. Use the full charting name.";
      return;
    }
    const count = selectPlayer(found.name);
    input.value = found.name;
    note.textContent = `${found.name} is selected on ${count} ${count === 1 ? "chart" : "charts"}.`;
    const url = new URL(window.location.href);
    url.searchParams.set("player", found.name);
    history.replaceState(null, "", url.pathname + url.search + url.hash);
  };
  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    show(input.value);
  });
  const initial = new URLSearchParams(window.location.search).get("player");
  if (initial) {
    input.value = initial;
    show(initial);
  }
}
function bindToc(chapters) {
  const links = new Map([...document.querySelectorAll(".toc a")].map((a) => [a.getAttribute("href").slice(1), a]));
  const mark = (id) => links.forEach((a, key) => {
    if (key === id) a.setAttribute("aria-current", "true");
    else a.removeAttribute("aria-current");
  });
  if (!("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => { if (entry.isIntersecting) mark(entry.target.id); });
  }, { rootMargin: "-40% 0px -55% 0px" });
  chapters.forEach((chapter) => io.observe(chapter));
}
function scrollToHash() {
  const match = /^#chart-(\w+)$/.exec(window.location.hash);
  if (!match || !state[match[1]]) return null;
  document.getElementById("chart-" + match[1]).scrollIntoView({ block: "start", behavior: "instant" });
  return window.scrollY;
}

reveal(document.querySelectorAll(".tour-head"));
fetch("../data/charts.json")
  .then((res) => { if (!res.ok) throw new Error(String(res.status)); return res.json(); })
  .then((rows) => {
    document.getElementById("wta-lede").textContent = WTA_LEDE;
    const byId = Object.fromEntries(rows.map((row) => [row.id, row]));
    const chapters = ORDER.filter((id) => byId[id]).map((id) => {
      state[id] = { players: byId[id].players, index: pickIndex(id, byId[id].players), points: [] };
      return mount(id, ORDER.indexOf(id) + 1);
    });
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
    document.getElementById("atp").innerHTML = `<p class="load-error">The charts could not be loaded.</p>`;
    console.error(err);
  });
