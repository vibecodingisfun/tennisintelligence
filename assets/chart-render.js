import { PLOT, VB, n, esc, lastName } from "./chart-config.js";

export const THEMES = {
  export: {
    bg: "#ffffff", plotFill: "none", grid: null,
    frame: "rgba(26,46,36,0.35)", tick: "#3d4f44", axis: "#14241c",
    label: "#14241c", halo: "#ffffff", leader: "rgba(26,46,36,0.45)",
    dot: "#1a2e24", star: "#c6e000", dotRing: "rgba(26,46,36,0.35)", onStroke: "#1a2e24", ring: null, dotOpacity: 0.72,
  },
  page: {
    bg: null, plotFill: "rgba(255,253,247,0.62)", grid: "rgba(16,33,23,0.07)",
    frame: "rgba(16,33,23,0.32)", tick: "#3a4c40", axis: "#102117",
    label: "#102117", halo: "#f8f5ed", leader: "rgba(16,33,23,0.42)",
    dot: "#3b5646", star: "#d2ea2c", dotRing: "rgba(16,33,23,0.5)", onStroke: "#102117", ring: "#102117", dotOpacity: 0.58,
  },
};

const FONTS = {
  full: { name: 2.4, sel: 2.8, tick: 2.8, axis: 3.3 },
  compact: { name: 3.3, sel: 3.9, tick: 3.4, axis: 3.8 },
};
const COMPACT_LABELS = 9;

export function playerDotColor(name, theme) {
  const text = String(name || "");
  if (/^na li$/i.test(text.trim())) return "#e10600";
  if (/alcaraz|sinner|federer|nadal|djokovic|agassi|sampras/i.test(text)) return theme.star;
  if (/swiatek|sabalenka|osaka|barty|kerber|sharapova|rybakina|clijsters/i.test(text)) return theme.star;
  if (/serena williams|venus williams/i.test(text)) return theme.star;
  return theme.dot;
}
function displayNames(players) {
  const lasts = players.map((p) => lastName(p.name));
  const counts = {};
  lasts.forEach((name) => { counts[name] = (counts[name] || 0) + 1; });
  return players.map((p, i) => {
    if (counts[lasts[i]] < 2) return lasts[i];
    const first = String(p.name || "").split(" ")[0] || "";
    return `${first.slice(0, 1)} ${lasts[i]}`;
  });
}
function nameBox(x, y, anchor, text, font, charW = 0.54) {
  const w = Math.max(font * 1.6, text.length * font * charW);
  const h = font * 1.2;
  let l = x;
  if (anchor === "middle") l = x - w / 2;
  if (anchor === "end") l = x - w;
  return { l, r: l + w, t: y - h / 2, b: y + h / 2 };
}
function boxesOverlap(a, b, pad) {
  return a.l < b.r + pad && a.r > b.l - pad && a.t < b.b + pad && a.b > b.t - pad;
}
function placeNames(items) {
  const dots = items.map((it) => ({ l: it.x - it.r, r: it.x + it.r, t: it.y - it.r, b: it.y + it.r }));
  const placed = [];
  const angles = [];
  for (let k = 0; k < 12; k += 1) angles.push((k * Math.PI) / 6);
  const order = items.slice().sort((a, b) => (b.selected - a.selected) || ((a.rank ?? 0) - (b.rank ?? 0)));
  order.forEach((it) => {
    const text = String(it.name);
    let best = null;
    let bestScore = Infinity;
    [0, 5, 8, 11, 15, 19].forEach((dist) => {
      angles.forEach((ang) => {
        const extra = Math.max(it.minDist || 0, dist === 0 ? it.r + 1.6 : dist);
        const dx = Math.cos(ang) * extra;
        const dy = Math.sin(ang) * extra;
        const anchor = Math.abs(dx) < 1.2 ? "middle" : (dx > 0 ? "start" : "end");
        const x = it.x + (anchor === "middle" ? 0 : dx);
        const y = it.y + dy;
        const box = nameBox(x, y, anchor, text, it.font, it.charW);
        if (box.l < 16 || box.r > 116 || box.t < 2 || box.b > 100) return;
        let score = extra * 0.05;
        dots.forEach((o) => { if (boxesOverlap(box, o, 0.3)) score += 8; });
        placed.forEach((o) => { if (boxesOverlap(box, o.box, 0.4)) score += 7; });
        if (score < bestScore) {
          bestScore = score;
          best = { i: it.i, x, y, anchor, box, leader: extra > it.r + 1.8, px: it.x, py: it.y, pr: it.r, text, selected: it.selected };
        }
      });
    });
    if (!best) {
      const x = Math.min(112, it.x + it.r + 1.6);
      const y = Math.min(98, Math.max(4, it.y));
      best = { i: it.i, x, y, anchor: "start", box: nameBox(x, y, "start", text, it.font, it.charW), leader: true, px: it.x, py: it.y, pr: it.r, text, selected: it.selected };
    }
    placed.push(best);
  });
  return placed;
}
function leaderSvg(lab, theme) {
  const box = lab.box;
  const vx = Math.max(box.l, Math.min(lab.px, box.r)) - lab.px;
  const vy = Math.max(box.t, Math.min(lab.py, box.b)) - lab.py;
  const len = Math.hypot(vx, vy) || 1;
  const start = lab.pr + 0.35;
  const end = len - 0.3;
  if (end <= start + 0.35) return "";
  const x1 = lab.px + (vx / len) * start;
  const y1 = lab.py + (vy / len) * start;
  const x2 = lab.px + (vx / len) * end;
  const y2 = lab.py + (vy / len) * end;
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${theme.leader}" stroke-width="0.38" stroke-linecap="round" />`;
}
function rankedBy(players, key) {
  return players.map((p, i) => [p[key], i]).sort((a, b) => b[0] - a[0]);
}
function findAlways(spec, players, name) {
  return players.findIndex((p) => spec.exact ? p.name === name : (p.name === name || lastName(p.name) === lastName(name)));
}
function fullLabelSet(spec, players, points, index, sized) {
  const labeled = new Set([index]);
  const lists = [rankedBy(players, spec.x), rankedBy(players, spec.y)];
  if (sized) lists.push(rankedBy(players, spec.size));
  lists.forEach((list) => list.slice(0, 4).forEach((item) => labeled.add(item[1])));
  const dist = points.map((pt) => {
    const px = (pt.x - PLOT.left) / PLOT.size;
    const py = (PLOT.top + PLOT.size - pt.y) / PLOT.size;
    return px * px + py * py;
  });
  dist.map((d, i) => [d, i]).sort((a, b) => a[0] - b[0]).slice(0, 5).forEach((item) => labeled.add(item[1]));
  players.forEach((p, i) => { if (p.rank != null && p.rank <= 10) labeled.add(i); });
  spec.always.forEach((name) => {
    const i = findAlways(spec, players, name);
    if (i >= 0) labeled.add(i);
  });
  return labeled;
}
function compactLabelSet(spec, players, index, sized) {
  const labeled = new Set([index]);
  const lists = [rankedBy(players, spec.x), rankedBy(players, spec.y)];
  if (sized) lists.push(rankedBy(players, spec.size));
  lists.forEach((list) => labeled.add(list[0][1]));
  for (const name of spec.always) {
    if (labeled.size >= COMPACT_LABELS) break;
    const i = findAlways(spec, players, name);
    if (i >= 0) labeled.add(i);
  }
  return labeled;
}

export function renderSvg(spec, players, index, options = {}) {
  const theme = THEMES[options.theme || "export"];
  const compact = Boolean(options.compact);
  const font = compact ? FONTS.compact : FONTS.full;
  const names = displayNames(players);
  const xs = players.map((p) => p[spec.x]);
  const ys = players.map((p) => p[spec.y]);
  const sized = Boolean(spec.size);
  const sizes = sized ? players.map((p) => p[spec.size]) : [1];
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const sMin = Math.min(...sizes);
  const sMax = Math.max(...sizes);
  const nx = (v) => (xMax === xMin ? 0.5 : (v - xMin) / (xMax - xMin));
  const ny = (v) => (yMax === yMin ? 0.5 : (v - yMin) / (yMax - yMin));
  const nr = (v) => (sMax === sMin ? 0.5 : (v - sMin) / (sMax - sMin));
  const points = players.map((p) => ({
    x: PLOT.left + nx(p[spec.x]) * PLOT.size,
    y: PLOT.top + (1 - ny(p[spec.y])) * PLOT.size,
    r: sized ? 1.2 + nr(p[spec.size]) * 2.6 : 1.7,
  }));
  const labeled = compact ? compactLabelSet(spec, players, index, sized) : fullLabelSet(spec, players, points, index, sized);
  const items = [...labeled].map((i) => {
    const pt = points[i];
    return { i, x: pt.x, y: pt.y, r: pt.r, name: names[i], rank: null, font: i === index ? font.sel : font.name, selected: i === index ? 1 : 0, minDist: pt.r + 4.4, charW: compact ? 0.64 : 0.54 };
  });
  const labels = placeNames(items);
  const dots = players.map((p, i) => {
    const pt = points[i];
    const on = i === index;
    return `<g><circle cx="${pt.x}" cy="${pt.y}" r="${pt.r + 2.4}" fill="transparent"></circle><circle cx="${pt.x}" cy="${pt.y}" r="${pt.r}" fill="${playerDotColor(p.name, theme)}" fill-opacity="${on ? 1 : theme.dotOpacity}" stroke="${on ? theme.onStroke : theme.dotRing}" stroke-width="${on ? 0.5 : 0.28}"></circle></g>`;
  }).join("");
  const sel = points[index];
  const ring = theme.ring && sel ? `<circle class="sel-ring" cx="${sel.x}" cy="${sel.y}" r="${sel.r + 1.5}" fill="none" stroke="${theme.ring}" stroke-width="0.32"/>` : "";
  const right = PLOT.left + PLOT.size;
  const bottom = PLOT.top + PLOT.size;
  const yDigits = spec.yDigits == null ? 1 : spec.yDigits;
  const grid = theme.grid ? [0.25, 0.5, 0.75].map((f) => {
    const gx = PLOT.left + f * PLOT.size;
    const gy = PLOT.top + f * PLOT.size;
    return `<line x1="${gx}" y1="${PLOT.top}" x2="${gx}" y2="${bottom}" stroke="${theme.grid}" stroke-width="0.25"/><line x1="${PLOT.left}" y1="${gy}" x2="${right}" y2="${gy}" stroke="${theme.grid}" stroke-width="0.25"/>`;
  }).join("") : "";
  const label = esc(options.label || spec.title);
  const bg = theme.bg ? `\n    <rect x="0" y="0" width="${VB}" height="${VB}" fill="${theme.bg}"/>` : "";
  const svg = `<svg viewBox="0 0 ${VB} ${VB}" role="img" aria-label="${label}">${bg}
    <rect x="${PLOT.left}" y="${PLOT.top}" width="${PLOT.size}" height="${PLOT.size}" fill="${theme.plotFill}" stroke="${theme.frame}" stroke-width="0.4"/>${grid}
    <text x="${PLOT.left}" y="${bottom + 4.6}" text-anchor="middle" fill="${theme.tick}" font-size="${font.tick}" font-family="IBM Plex Mono, monospace">${n(xMin, 1)}</text>
    <text x="${right}" y="${bottom + 4.6}" text-anchor="middle" fill="${theme.tick}" font-size="${font.tick}" font-family="IBM Plex Mono, monospace">${n(xMax, 1)}</text>
    <text x="${PLOT.left + PLOT.size / 2}" y="${bottom + 11}" text-anchor="middle" fill="${theme.axis}" font-size="${font.axis}" font-family="Syne, sans-serif">${esc(spec.xLabel)}</text>
    <text x="${PLOT.left - 1.6}" y="${PLOT.top + 1.2}" text-anchor="end" fill="${theme.tick}" font-size="${font.tick}" font-family="IBM Plex Mono, monospace">${n(yMax, yDigits)}</text>
    <text x="${PLOT.left - 1.6}" y="${bottom - 0.4}" text-anchor="end" fill="${theme.tick}" font-size="${font.tick}" font-family="IBM Plex Mono, monospace">${n(yMin, yDigits)}</text>
    <text x="7.2" y="${PLOT.top + PLOT.size / 2}" text-anchor="middle" fill="${theme.axis}" font-size="${font.axis}" font-family="Syne, sans-serif" transform="rotate(-90 7.2 ${PLOT.top + PLOT.size / 2})">${esc(spec.yLabel)}</text>
    ${labels.map((lab) => leaderSvg(lab, theme)).join("")}
    ${dots}${ring}
    ${labels.map((lab) => `<text x="${lab.x}" y="${lab.y}" text-anchor="${lab.anchor}" dominant-baseline="middle" fill="${theme.label}" stroke="${theme.halo}" stroke-width="0.95" paint-order="stroke" stroke-linejoin="round" font-size="${lab.selected ? font.sel : font.name}" font-family="Syne, sans-serif">${esc(lab.text)}</text>`).join("")}
  </svg>`;
  return { svg, points };
}

export function nearestPoint(points, x, y) {
  let best = 0;
  let bestD = Infinity;
  points.forEach((pt, i) => {
    const d = (pt.x - x) ** 2 + (pt.y - y) ** 2;
    if (d < bestD) { bestD = d; best = i; }
  });
  return bestD < 64 ? best : -1;
}
