import { COPY, VB, esc, pickIndex } from "./chart-config.js";
import { nearestPoint, renderSvg } from "./chart-render.js";
import { pulse, reveal } from "./motion.js";

const FEATURED = "fhpts";
const spec = COPY[FEATURED];
const map = document.getElementById("featured-map");
const readout = document.getElementById("featured-readout");
const open = document.getElementById("featured-open");
const announce = document.getElementById("announce");
const featured = { players: [], index: 0, points: [] };

reveal(document.querySelectorAll("[data-reveal]"));

function render() {
  const selected = featured.players[featured.index];
  const { svg, points } = renderSvg(spec, featured.players, featured.index, {
    theme: "page",
    compact: true,
    label: `${spec.title}. ${featured.players.length} players. Selected: ${selected.name}.`,
  });
  featured.points = points;
  map.innerHTML = svg;
  readout.innerHTML = `<p class="kicker">Selected player</p><h3>${esc(selected.name)}</h3><ul class="facts">${spec.meta(selected).split(" · ").map((fact) => `<li>${esc(fact)}</li>`).join("")}</ul>`;
  open.href = `charts/?player=${encodeURIComponent(selected.name)}#chart-${FEATURED}`;
}

if (map && readout && open) {
  fetch("data/charts.json")
    .then((res) => { if (!res.ok) throw new Error(String(res.status)); return res.json(); })
    .then((rows) => {
      const row = rows.find((r) => r.id === FEATURED);
      if (!row) throw new Error("missing featured chart");
      featured.players = row.players;
      featured.index = pickIndex(FEATURED, row.players);
      render();
      map.addEventListener("click", (ev) => {
        const svg = map.querySelector("svg");
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        const hit = nearestPoint(featured.points, ((ev.clientX - rect.left) / rect.width) * VB, ((ev.clientY - rect.top) / rect.height) * VB);
        if (hit < 0 || hit === featured.index) return;
        featured.index = hit;
        render();
        pulse(readout);
        if (announce) announce.textContent = `${featured.players[hit].name} selected on ${spec.title}.`;
      });
    })
    .catch((err) => {
      map.innerHTML = `<p class="load-error">The chart could not be loaded.</p>`;
      console.error(err);
    });
}
