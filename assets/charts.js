const PLOT = { left: 18, top: 10, size: 88 };
const VB = 118;
const FH_ALWAYS = [
  "Novak Djokovic", "Rafael Nadal", "Roger Federer", "Andy Murray",
  "Juan Martin Del Potro", "Stan Wawrinka", "Dominic Thiem", "Grigor Dimitrov",
  "Tomas Berdych", "Milos Raonic",
];
const WTA_ALWAYS = [
  "Serena Williams", "Venus Williams", "Maria Sharapova", "Kim Clijsters",
  "Angelique Kerber", "Ashleigh Barty", "Naomi Osaka", "Iga Swiatek",
  "Aryna Sabalenka", "Elena Rybakina",
  "Coco Gauff", "Jessica Pegula", "Mirra Andreeva", "Madison Keys",
  "Na Li", "Anna Kalinskaya",
];
const MEN = FH_ALWAYS.concat(["Andre Agassi", "Pete Sampras"]);
const COPY = {
  drop: {
    group: "atp", title: "Drop shots", caption: "Dropshot Quality", file: "dropshot-quality.png",
    lede: "Men's charting, all recorded matches. A player needs at least 40 charted matches. Each point is a player. Tap one.",
    x: "freq", y: "win", size: "won_per_100", yDigits: 0,
    xLabel: "Drop shots per 100 points →", yLabel: "Drop-shot points won",
    defLede: "A drop shot here is the Match Charting Project shot type Dr. The count is points that ended on that shot, not every drop hit during a rally.",
    defs: [
      ["Horizontal axis", "Drop-shot points / all charted points, then × 100. Charted points are serve points plus return points from the match overview."],
      ["Vertical axis", "Of those drop-shot points, the share that the player won. Won means a drop-shot winner or a forced error induced by the drop. Unforced errors on the drop count against this rate."],
      ["Point size", "Drop-shot points won / all charted points, then × 100. Carlos Alcaraz is the largest point in this group."],
    ],
    always: ["Novak Djokovic", "Rafael Nadal", "Roger Federer"], exact: true,
    meta: (p) => `${p.charts} charted matches · ${p.drop_n} drop-shot points · ${n(p.freq, 2)} per 100 points · ${n(p.win, 1)}% won · ${n(p.won_per_100, 2)} won per 100 points`,
  },
  fh: {
    group: "atp", title: "Forehands", caption: "Forehand Quality", file: "forehand-quality.png",
    lede: "Drive forehands from men's charting, 40+ matches. Speed is a published average, not Match Charting. Current players use TennisViz 52-week ATP (slams out). Famous names without that series use GIG Australian Open Hawk-Eye. Tap a player.",
    x: "speed", y: "point_win", size: "winner_pct",
    xLabel: "Forehand speed, mph →", yLabel: "Points won on the drive forehand",
    defLede: "A drive forehand here is Match Charting Project shot type F, not slice. Speed is joined from published tracking. Only players with both a speed and 40 charted matches appear.",
    defs: [
      ["Horizontal axis", "Average forehand speed in mph. Current: TennisViz 52-week means at ATP events, Grand Slams excluded, as published. Historical: GIG Hawk-Eye from Australian Open 2012–16, one source so Federer, Nadal, Djokovic, and Murray sit on the same scale. Faster is farther right."],
      ["Vertical axis", "Of those drive-forehand shots, the share that sat in a point the player won. This is not winner rate; a rally you eventually win still counts."],
      ["Point size", "Drive-forehand winners / drive-forehand shots, then × 100. The largest point is the highest winner rate in this group."],
    ],
    always: FH_ALWAYS,
    meta: (p) => `${p.charts} charted matches · ${p.shots} drive forehands · ${n(p.speed, 1)} mph · winner ${n(p.winner_pct, 1)}% · won the point ${n(p.point_win, 1)}% · ${p.speed_source === "current" ? "TennisViz 52-week" : "GIG AO Hawk-Eye"}`,
  },
  fhpts: {
    group: "atp", title: "Forehand points", caption: "Forehand Points", file: "forehand-points.png",
    lede: "Men's charting, all recorded matches. A player needs at least 40 charted matches. No speed here — only drive-forehand results. Each point is a player. Tap one.",
    x: "winner_pct", y: "point_win", size: "winners_per_100",
    xLabel: "Forehand winner % →", yLabel: "Points won on the drive forehand",
    defLede: "A drive forehand here is Match Charting Project shot type F, not slice. This chart uses only the charts, not published tracking speeds.",
    defs: [
      ["Horizontal axis", "Drive-forehand winners / drive-forehand shots, then × 100. A winner is a ball the opponent never got a racket on."],
      ["Vertical axis", "Of those drive-forehand shots, the share that sat in a point the player won. This is not winner rate; a rally you eventually win still counts."],
      ["Point size", "Drive-forehand winners / all charted points, then × 100. Charted points are serve points plus return points from the match overview."],
    ],
    always: FH_ALWAYS,
    meta: (p) => `${p.charts} charted matches · ${p.shots} drive forehands · winner ${n(p.winner_pct, 1)}% · won the point ${n(p.point_win, 1)}% · ${n(p.winners_per_100, 2)} winners per 100 points`,
  },
  bh: {
    group: "atp", title: "Backhand quality", caption: "Backhand Quality", file: "backhand-quality.png",
    lede: "Men's charting, all recorded matches. A player needs at least 40 charted matches. Drive backhands only — no slice, no published speed. Each point is a player. Tap one.",
    x: "winner_pct", y: "point_win", size: "winners_per_100",
    xLabel: "Backhand winner % →", yLabel: "Points won on the drive backhand",
    defLede: "A drive backhand here is Match Charting Project shot type B, not slice. Same three numbers as the forehand-points chart. Ivo Karlovic is left off this chart.",
    defs: [
      ["Horizontal axis", "Drive-backhand winners / drive-backhand shots, then × 100. A winner is a ball the opponent never got a racket on."],
      ["Vertical axis", "Of those drive-backhand shots, the share that sat in a point the player won. This is not winner rate; a rally you eventually win still counts."],
      ["Point size", "Drive-backhand winners / all charted points, then × 100. Charted points are serve points plus return points from the match overview."],
    ],
    always: MEN,
    meta: (p) => `${p.charts} charted matches · ${p.shots} drive backhands · winner ${n(p.winner_pct, 1)}% · won the point ${n(p.point_win, 1)}% · ${n(p.winners_per_100, 2)} winners per 100 points`,
  },
  serve: {
    group: "atp", title: "Serve quality", caption: "Serve Quality", file: "serve-quality.png",
    lede: "Men's charting, all recorded matches. A player needs at least 40 charted matches. Each point is a player. Tap one.",
    x: "free_pct", y: "second_won", size: "serve_won",
    xLabel: "Aces + unreturned % →", yLabel: "Second-serve points won",
    defLede: "Free points come from Match Charting Project ServeBasics: aces plus unreturned serves. Second-serve points won uses the match overview: serve points minus first serves in.",
    defs: [
      ["Horizontal axis", "(Aces + unreturned serves) / serve points, then × 100. An unreturned serve is one the returner never put in play, not counting aces. Together these are free points."],
      ["Vertical axis", "Points won on the second serve / second-serve attempts, then × 100. Attempts are serve points minus first serves in. Double faults count against this rate."],
      ["Point size", "Serve points won / serve points, then × 100. This is holding the serve point, not first-serve in."],
    ],
    always: MEN,
    meta: (p) => `${p.charts} charted matches · ${p.serve_pts} serve points · aces+unreturned ${n(p.free_pct, 1)}% · second serve ${n(p.second_won, 1)}% · points won ${n(p.serve_won, 1)}%`,
  },
  first: {
    group: "atp", title: "First serve", caption: "First Serve", file: "first-serve.png",
    lede: "Men's charting, all recorded matches. A player needs at least 40 charted matches. Dots are the same size. Tap one.",
    x: "first_won_pct", y: "first_in_pct",
    xLabel: "1st-serve points won →", yLabel: "1st serves in",
    defLede: "Both numbers are from the Match Charting Project match overview.",
    defs: [
      ["Horizontal axis", "Points won on the first serve / first serves in, then × 100. The first serve has to land in before this counts. This is not how often the first serve lands in."],
      ["Vertical axis", "First serves in / serve points, then × 100. A double fault is a serve point that never became a first serve in."],
    ],
    always: MEN,
    meta: (p) => `${p.charts} charted matches · ${p.serve_pts} serve points · won ${n(p.first_won_pct, 1)}% when the first serve landed · first serve in ${n(p.first_in_pct, 1)}%`,
  },
  wtaFh: {
    group: "wta", title: "WTA forehand points", caption: "WTA Forehand Points", file: "wta-forehand-points.png",
    lede: "Drive forehands only — no slice, no published speed. Each point is a player. Tap one.",
    x: "winner_pct", y: "point_win", size: "winners_per_100",
    xLabel: "Forehand winner % →", yLabel: "Points won on the drive forehand",
    defLede: "A drive forehand here is Match Charting Project shot type F, not slice. Same three numbers as the men's forehand-points chart.",
    defs: [
      ["Horizontal axis", "Drive-forehand winners / drive-forehand shots, then × 100. A winner is a ball the opponent never got a racket on."],
      ["Vertical axis", "Of those drive-forehand shots, the share that sat in a point the player won. This is not winner rate; a rally you eventually win still counts."],
      ["Point size", "Drive-forehand winners / all charted points, then × 100. Charted points are serve points plus return points from the match overview."],
    ],
    always: WTA_ALWAYS,
    meta: (p) => `${p.charts} charted matches · ${p.shots} drive forehands · winner ${n(p.winner_pct, 1)}% · won the point ${n(p.point_win, 1)}% · ${n(p.winners_per_100, 2)} winners per 100 points`,
  },
  wtaBh: {
    group: "wta", title: "WTA backhand quality", caption: "WTA Backhand Quality", file: "wta-backhand-quality.png",
    lede: "Drive backhands only, no slice. Each point is a player. Tap one.",
    x: "winner_pct", y: "point_win", size: "winners_per_100",
    xLabel: "Backhand winner % →", yLabel: "Points won on the drive backhand",
    defLede: "A drive backhand here is Match Charting Project shot type B, not slice. Same three numbers as the men's backhand chart.",
    defs: [
      ["Horizontal axis", "Drive-backhand winners / drive-backhand shots, then × 100. A winner is a ball the opponent never got a racket on."],
      ["Vertical axis", "Of those drive-backhand shots, the share that sat in a point the player won. This is not winner rate; a rally you eventually win still counts."],
      ["Point size", "Drive-backhand winners / all charted points, then × 100. Charted points are serve points plus return points from the match overview."],
    ],
    always: WTA_ALWAYS,
    meta: (p) => `${p.charts} charted matches · ${p.shots} drive backhands · winner ${n(p.winner_pct, 1)}% · won the point ${n(p.point_win, 1)}% · ${n(p.winners_per_100, 2)} winners per 100 points`,
  },
  wtaSv: {
    group: "wta", title: "WTA serve quality", caption: "WTA Serve Quality", file: "wta-serve-quality.png",
    lede: "Aces plus unreturned serves, against second-serve points won. Each point is a player. Tap one.",
    x: "free_pct", y: "second_won", size: "serve_won",
    xLabel: "Aces + unreturned % →", yLabel: "Second-serve points won",
    defLede: "Free points come from Match Charting Project ServeBasics: aces plus unreturned serves. Second-serve points won uses the match overview: serve points minus first serves in.",
    defs: [
      ["Horizontal axis", "(Aces + unreturned serves) / serve points, then × 100. An unreturned serve is one the returner never put in play, not counting aces. Together these are free points."],
      ["Vertical axis", "Points won on the second serve / second-serve attempts, then × 100. Attempts are serve points minus first serves in. Double faults count against this rate."],
      ["Point size", "Serve points won / serve points, then × 100. This is holding the serve point, not first-serve in."],
    ],
    always: WTA_ALWAYS,
    meta: (p) => `${p.charts} charted matches · ${p.serve_pts} serve points · aces+unreturned ${n(p.free_pct, 1)}% · second serve ${n(p.second_won, 1)}% · points won ${n(p.serve_won, 1)}%`,
  },
  wtaFs: {
    group: "wta", title: "WTA first serve", caption: "WTA First Serve", file: "wta-first-serve.png",
    lede: "Same two numbers as the men's first-serve chart. Dots are the same size. Tap one.",
    x: "first_won_pct", y: "first_in_pct",
    xLabel: "1st-serve points won →", yLabel: "1st serves in",
    defLede: "Both numbers are from the Match Charting Project match overview.",
    defs: [
      ["Horizontal axis", "Points won on the first serve / first serves in, then × 100. The first serve has to land in before this counts. This is not how often the first serve lands in."],
      ["Vertical axis", "First serves in / serve points, then × 100. A double fault is a serve point that never became a first serve in."],
    ],
    always: WTA_ALWAYS,
    meta: (p) => `${p.charts} charted matches · ${p.serve_pts} serve points · won ${n(p.first_won_pct, 1)}% when the first serve landed · first serve in ${n(p.first_in_pct, 1)}%`,
  },
};
const WTA_LEDE = "Active: current rank 50 or better, a match since 2025, and at least 20 charted matches. Plus anyone with 3 or more Grand Slam singles titles who has a charted match since October 2016. Na Li is included. The numbers use all of their charted matches.";
const state = {};

function n(value, digits) { return Number(value).toFixed(digits); }
function esc(value) {
  return String(value ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}
function lastName(name) {
  const parts = String(name || "").split(" ");
  return parts[parts.length - 1] || name;
}
function playerDotColor(name) {
  const text = String(name || "");
  if (/^na li$/i.test(text.trim())) return "#e10600";
  if (/alcaraz|sinner|federer|nadal|djokovic|agassi|sampras/i.test(text)) return "#c6e000";
  if (/swiatek|sabalenka|osaka|barty|kerber|sharapova|rybakina|clijsters/i.test(text)) return "#c6e000";
  if (/serena williams|venus williams/i.test(text)) return "#c6e000";
  return "#1a2e24";
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
function nameBox(x, y, anchor, text, font) {
  const w = Math.max(font * 1.6, text.length * font * 0.54);
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
  const byIndex = {};
  items.forEach((it) => { byIndex[it.i] = it; });
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
        const box = nameBox(x, y, anchor, text, it.font);
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
      best = { i: it.i, x, y, anchor: "start", box: nameBox(x, y, "start", text, it.font), leader: true, px: it.x, py: it.y, pr: it.r, text, selected: it.selected };
    }
    placed.push(best);
  });
  return placed;
}
function leaderSvg(lab) {
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
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(26,46,36,0.45)" stroke-width="0.38" stroke-linecap="round" />`;
}
function pickIndex(id, players) {
  if (id === "fh") {
    const al = players.findIndex((p) => /alcaraz/i.test(p.name));
    const fed = players.findIndex((p) => /federer/i.test(p.name));
    return al >= 0 ? al : (fed >= 0 ? fed : 0);
  }
  const pattern = id.startsWith("wta") ? /swiatek/i : /alcaraz/i;
  const found = players.findIndex((p) => pattern.test(p.name));
  return found >= 0 ? found : 0;
}
function renderChart(id) {
  const spec = COPY[id];
  const bucket = state[id];
  const players = bucket.players;
  const root = document.getElementById("chart-" + id);
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
  bucket.points = players.map((p) => ({
    x: PLOT.left + nx(p[spec.x]) * PLOT.size,
    y: PLOT.top + (1 - ny(p[spec.y])) * PLOT.size,
    r: sized ? 1.2 + nr(p[spec.size]) * 2.6 : 1.7,
  }));
  const labeled = new Set([bucket.index]);
  const lists = [
    players.map((p, i) => [p[spec.x], i]).sort((a, b) => b[0] - a[0]),
    players.map((p, i) => [p[spec.y], i]).sort((a, b) => b[0] - a[0]),
  ];
  if (sized) lists.push(players.map((p, i) => [p[spec.size], i]).sort((a, b) => b[0] - a[0]));
  lists.forEach((list) => list.slice(0, 4).forEach((item) => labeled.add(item[1])));
  const dist = bucket.points.map((pt) => {
    const px = (pt.x - PLOT.left) / PLOT.size;
    const py = (PLOT.top + PLOT.size - pt.y) / PLOT.size;
    return px * px + py * py;
  });
  dist.map((d, i) => [d, i]).sort((a, b) => a[0] - b[0]).slice(0, 5).forEach((item) => labeled.add(item[1]));
  players.forEach((p, i) => { if (p.rank != null && p.rank <= 10) labeled.add(i); });
  spec.always.forEach((name) => {
    const i = players.findIndex((p) => spec.exact ? p.name === name : (p.name === name || lastName(p.name) === lastName(name)));
    if (i >= 0) labeled.add(i);
  });
  const items = [...labeled].map((i) => {
    const pt = bucket.points[i];
    return { i, x: pt.x, y: pt.y, r: pt.r, name: names[i], rank: null, font: i === bucket.index ? 2.8 : 2.4, selected: i === bucket.index ? 1 : 0, minDist: pt.r + 4.4 };
  });
  const labels = placeNames(items);
  const dots = players.map((p, i) => {
    const pt = bucket.points[i];
    const on = i === bucket.index;
    return `<g><circle cx="${pt.x}" cy="${pt.y}" r="${pt.r + 2.4}" fill="transparent"></circle><circle cx="${pt.x}" cy="${pt.y}" r="${pt.r}" fill="${playerDotColor(p.name)}" fill-opacity="${on ? 1 : 0.72}" stroke="${on ? "#1a2e24" : "rgba(26,46,36,0.35)"}" stroke-width="${on ? 0.5 : 0.28}"></circle></g>`;
  }).join("");
  const right = PLOT.left + PLOT.size;
  const bottom = PLOT.top + PLOT.size;
  const yDigits = spec.yDigits == null ? 1 : spec.yDigits;
  root.querySelector(".map").innerHTML = `<svg viewBox="0 0 ${VB} ${VB}" role="img" aria-label="${esc(spec.title)}">
    <rect x="0" y="0" width="${VB}" height="${VB}" fill="#ffffff"/>
    <rect x="${PLOT.left}" y="${PLOT.top}" width="${PLOT.size}" height="${PLOT.size}" fill="none" stroke="rgba(26,46,36,0.35)" stroke-width="0.4"/>
    <text x="${PLOT.left}" y="${bottom + 4.6}" text-anchor="middle" fill="#3d4f44" font-size="2.8" font-family="IBM Plex Mono, monospace">${n(xMin, 1)}</text>
    <text x="${right}" y="${bottom + 4.6}" text-anchor="middle" fill="#3d4f44" font-size="2.8" font-family="IBM Plex Mono, monospace">${n(xMax, 1)}</text>
    <text x="${PLOT.left + PLOT.size / 2}" y="${bottom + 11}" text-anchor="middle" fill="#14241c" font-size="3.3" font-family="Syne, sans-serif">${esc(spec.xLabel)}</text>
    <text x="${PLOT.left - 1.6}" y="${PLOT.top + 1.2}" text-anchor="end" fill="#3d4f44" font-size="2.8" font-family="IBM Plex Mono, monospace">${n(yMax, yDigits)}</text>
    <text x="${PLOT.left - 1.6}" y="${bottom - 0.4}" text-anchor="end" fill="#3d4f44" font-size="2.8" font-family="IBM Plex Mono, monospace">${n(yMin, yDigits)}</text>
    <text x="7.2" y="${PLOT.top + PLOT.size / 2}" text-anchor="middle" fill="#14241c" font-size="3.3" font-family="Syne, sans-serif" transform="rotate(-90 7.2 ${PLOT.top + PLOT.size / 2})">${esc(spec.yLabel)}</text>
    ${labels.map(leaderSvg).join("")}
    ${dots}
    ${labels.map((lab) => `<text x="${lab.x}" y="${lab.y}" text-anchor="${lab.anchor}" dominant-baseline="middle" fill="#14241c" stroke="#ffffff" stroke-width="0.95" paint-order="stroke" stroke-linejoin="round" font-size="${lab.selected ? 2.8 : 2.4}" font-family="Syne, sans-serif">${esc(lab.text)}</text>`).join("")}
  </svg>`;
  const selected = players[bucket.index];
  root.querySelector(".detail").innerHTML = `<h3>${esc(selected.name)}</h3><p class="meta">${esc(spec.meta(selected))}</p>`;
}
function mount(id) {
  const spec = COPY[id];
  const article = document.createElement("article");
  article.className = "chart";
  article.id = "chart-" + id;
  article.innerHTML = `<h2>${esc(spec.title)}</h2><p class="note">${esc(spec.lede)}</p><div class="map"></div><div class="detail"></div><div class="defs"><p>${esc(spec.defLede)}</p>${spec.defs.map(([term, text]) => `<p><b>${esc(term)}.</b> ${esc(text)}</p>`).join("")}</div><div class="row"><button type="button" class="save">Save</button><span class="status"></span></div>`;
  document.getElementById(spec.group).appendChild(article);
  renderChart(id);
  article.querySelector(".map").addEventListener("click", (ev) => {
    const svg = article.querySelector("svg");
    const rect = svg.getBoundingClientRect();
    const x = ((ev.clientX - rect.left) / rect.width) * VB;
    const y = ((ev.clientY - rect.top) / rect.height) * VB;
    let best = 0;
    let bestD = Infinity;
    state[id].points.forEach((pt, i) => {
      const d = (pt.x - x) ** 2 + (pt.y - y) ** 2;
      if (d < bestD) { bestD = d; best = i; }
    });
    if (bestD < 64) {
      state[id].index = best;
      renderChart(id);
    }
  });
  article.querySelector(".save").addEventListener("click", () => saveChart(id, article));
}
function drawLogo(ctx, width, height) {
  const label = "Tennis Intelligence";
  ctx.save();
  ctx.font = "700 22px Syne, sans-serif";
  ctx.fillStyle = "#14241c";
  ctx.textBaseline = "middle";
  const textW = ctx.measureText(label).width;
  const courtW = 62;
  const gap = 12;
  const right = width - 28;
  const midY = height - 32;
  const courtX = right - courtW;
  const textX = courtX - gap - textW;
  ctx.fillText(label, textX, midY);
  ctx.translate(courtX, midY - 17);
  ctx.scale(62 / 54, 62 / 54);
  ctx.strokeStyle = "#14241c";
  ctx.lineWidth = 1.6;
  ctx.strokeRect(1, 1, 52, 28);
  ctx.beginPath();
  ctx.moveTo(27, 1);
  ctx.lineTo(27, 29);
  ctx.moveTo(13, 15);
  ctx.lineTo(41, 15);
  ctx.stroke();
  ctx.strokeRect(13, 6, 28, 18);
  ctx.restore();
}
function shareNotes(spec) {
  const labels = { "Horizontal axis": "X", "Vertical axis": "Y", "Point size": "Size" };
  return spec.defs.map(([term, text]) => `${labels[term] || term} · ${text}`);
}
function wrapText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return [text];
  const words = String(text).split(" ");
  const lines = [];
  let cur = "";
  for (const word of words) {
    const next = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && cur) {
      lines.push(cur);
      cur = word;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}
async function saveChart(id, article) {
  const spec = COPY[id];
  const button = article.querySelector(".save");
  const status = article.querySelector(".status");
  button.disabled = true;
  status.textContent = "Preparing…";
  try {
    await document.fonts.ready;
    const svg = article.querySelector("svg");
    const clone = svg.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const scale = 8;
    const w = VB;
    const h = VB;
    clone.setAttribute("width", String(w * scale));
    clone.setAttribute("height", String(h * scale));
    const xml = new XMLSerializer().serializeToString(clone);
    const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("chart image"));
      el.src = url;
    });
    const width = w * scale;
    const chartH = h * scale;
    const measure = document.createElement("canvas").getContext("2d");
    measure.font = "400 18px IBM Plex Mono, ui-monospace, monospace";
    const lines = [];
    shareNotes(spec).forEach((line, i) => {
      if (i) lines.push("");
      wrapText(measure, line, width - 56).forEach((part) => lines.push(part));
    });
    const lineH = 26;
    const notesH = 12 + lines.length * lineH + 8;
    const logoH = 64;
    const captionH = 64;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = captionH + chartH + notesH + logoH;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, captionH, width, chartH);
    ctx.fillStyle = "rgba(26,46,36,0.28)";
    ctx.fillRect(28, captionH + chartH + 4, width - 56, 1);
    ctx.font = "400 18px IBM Plex Mono, ui-monospace, monospace";
    ctx.fillStyle = "#3d5246";
    ctx.textBaseline = "top";
    lines.forEach((line, i) => ctx.fillText(line, 28, captionH + chartH + 12 + i * lineH));
    drawLogo(ctx, width, canvas.height);
    ctx.fillStyle = "#14241c";
    ctx.font = "600 28px Syne, sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText(spec.caption, 28, captionH / 2);
    URL.revokeObjectURL(url);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    const fileUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = spec.file;
    a.click();
    URL.revokeObjectURL(fileUrl);
    status.textContent = "Image saved.";
  } catch (err) {
    status.textContent = "Could not save the image.";
  } finally {
    button.disabled = false;
  }
}
fetch("../data/charts.json")
  .then((res) => { if (!res.ok) throw new Error(String(res.status)); return res.json(); })
  .then((rows) => {
    document.getElementById("wta-lede").textContent = WTA_LEDE;
    rows.forEach((row) => {
      state[row.id] = { players: row.players, index: pickIndex(row.id, row.players), points: [] };
      mount(row.id);
    });
  })
  .catch((err) => {
    document.getElementById("atp").textContent = "The charts could not be loaded.";
    console.error(err);
  });
