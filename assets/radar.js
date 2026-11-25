import { STYLE_COLOR, esc, radarCard } from "./radar-render.js";
import { reveal } from "./motion.js";

const AXIS_COPY = [
  ["Serve", "Half the ace rate, half the share of points won on the first serve. Points won, not how often the first serve lands in."],
  ["Return", "Half the share of return points won, half the rate of breaking serve."],
  ["Safety", "Half the share of points won on the second serve, half the double-fault rate. Fewer double faults rank higher."],
  ["Winners", "Charted winners per point, ranked among players with at least 40 charted matches."],
  ["Control", "The reverse of charted unforced errors per point, among the same 40-match group. Fewer errors sit farther out."],
];

/** First style rules (playing_style / radar), including all-court. Not the Styles page set. */
const STYLE_DEFS = [
  ["attacker", "Serve percentile is at least 0.70 and ahead of the return. A counterpuncher whose charted winners rank in the top 30%, or an all-court player in the top 10%, is an attacker too."],
  ["counterpuncher", "Return percentile is at least 0.72, serve is under 0.60, and dominance ranks in the top 15%. Or both wings are in the top quarter, the return is clearly higher, and charted winners are below the middle."],
  ["grinder", "Return percentile is at least 0.55 and serve is under 0.50, without a pusher's safe second serve or a counterpuncher's dominance."],
  ["pusher", "Serve percentile is 0.40 or lower, the second serve is safe, and dominance is not high. Or, in 40 or more charted matches, long rallies and the opponent's errors both rank near the top, and winners do not."],
  ["all-court", "Serve and return are both in the top quarter, or none of the specialist rules match."],
];

function panelBody(tour, data) {
  const big = data.big3.map((p) => radarCard(p, { group: "big3" })).join("");
  const top = data.top20.map((p) => radarCard(p, { group: "top20" })).join("");
  const lede = tour === "atp"
    ? "Big 3 is Federer, Nadal, and Djokovic. Top 20 uses the latest ranking in a match since 2025."
    : "Big 3 is Serena Williams, Venus Williams, and Maria Sharapova — the three Open Era names with career style stats in this warehouse. Top 20 uses the latest ranking in a match since 2025.";
  return `<p class="panel-lede">${esc(lede)}</p>
    <h3 class="radar-group">Big 3</h3>
    <div class="radar-grid big3">${big}</div>
    <h3 class="radar-group">Active top 20</h3>
    <div class="radar-grid top20">${top}</div>`;
}

function bindTabs() {
  const tabs = [...document.querySelectorAll('.radar-page [role="tab"]')];
  const panels = {
    "tab-atp": document.getElementById("panel-atp"),
    "tab-wta": document.getElementById("panel-wta"),
  };
  function show(id) {
    tabs.forEach((tab) => {
      const on = tab.id === id;
      tab.setAttribute("aria-selected", on ? "true" : "false");
      const panel = panels[tab.id];
      if (panel) panel.hidden = !on;
    });
    const hash = id === "tab-wta" ? "#wta" : "#atp";
    if (location.hash !== hash) history.replaceState(null, "", hash);
  }
  tabs.forEach((tab) => tab.addEventListener("click", () => show(tab.id)));
  show(location.hash === "#wta" ? "tab-wta" : "tab-atp");
}

const root = document.getElementById("radar-root");
const legend = document.getElementById("radar-legend");
const method = document.getElementById("radar-method");
const styleDefs = document.getElementById("radar-style-defs");

if (legend) {
  legend.innerHTML = Object.entries(STYLE_COLOR).map(([style, color]) =>
    `<li><i style="background:${color}"></i>${esc(style)}</li>`
  ).join("");
}
if (method) {
  method.innerHTML = AXIS_COPY.map(([name, text]) =>
    `<div><dt>${esc(name)}</dt><dd>${esc(text)}</dd></div>`
  ).join("");
}
if (styleDefs) {
  styleDefs.innerHTML = STYLE_DEFS.map(([name, text]) =>
    `<div><dt><i class="swatch" style="background:${STYLE_COLOR[name] || "#5c6b5e"}"></i>${esc(name)}</dt><dd>${esc(text)}</dd></div>`
  ).join("");
}

fetch("../data/radar.json")
  .then((res) => { if (!res.ok) throw new Error(String(res.status)); return res.json(); })
  .then((data) => {
    if (!root) return;
    root.innerHTML = `
      <section class="tab-panel" id="panel-atp" role="tabpanel" aria-labelledby="tab-atp" data-tour="atp">
        ${panelBody("atp", data.atp)}
      </section>
      <section class="tab-panel" id="panel-wta" role="tabpanel" aria-labelledby="tab-wta" data-tour="wta" hidden>
        ${panelBody("wta", data.wta)}
      </section>`;
    bindTabs();
    reveal(document.querySelectorAll(".method-block[data-reveal], .style-defs-block[data-reveal]"));
  })
  .catch((err) => {
    if (root) root.innerHTML = `<p class="load-error">The radar data could not be loaded.</p>`;
    console.error(err);
  });
