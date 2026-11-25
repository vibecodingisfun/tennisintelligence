import { shareImage } from "./share-image.js";

const COLS = [
  ["ace", "Ace %", "pct"],
  ["first_won", "1st-serve points won", "pct"],
  ["return_won", "Return points won", "pct"],
  ["break_pct", "Break %", "pct"],
  ["second_won", "2nd-serve points won", "pct"],
  ["df", "Double faults", "pct"],
  ["dominance", "Dominance ratio", "ratio"],
  ["winners", "Winners / point", "rate"],
  ["long_share", "10+ shot rallies", "pct"],
  ["opp_ufe", "Opp. unforced errors / point", "rate"],
];

const SCORE_KEYS = ["attacker", "counterpuncher", "grinder", "pusher"];

const STYLE_COLOR = {
  attacker: "#6a7a12",
  counterpuncher: "#2f6b4a",
  grinder: "#b85a28",
  pusher: "#5a6b5e",
};

const COPY = {
  activeNote: "A player needs a completed ATP match on or after 1 Jan 2025, a rank of 100 or better on that most recent match, and at least 20 matches with serve and return stats since 1 Oct 2016. The table keeps the first 50, ordered by that latest rank and then by ranking points. Rank is the rank on the latest match, so the same number can appear twice. The percentile in each cell is against every ATP player with at least 20 stat matches since 1 Oct 2016, all surfaces together, not against these 50. Winners / point, 10+ shot rallies, and Opp. unforced errors / point are ranked only among players with at least 40 charted matches.",
  famousNote: "Twenty hand-picked ATP players, not the twenty best ranks. Peak is the best ATP rank in a completed match since 1 Oct 2016. The rates and the percentiles use the same window and the same comparison group as the active table: every ATP player with at least 20 stat matches since 1 Oct 2016, not these 20. The three charted columns are ranked among players with at least 40 charted matches.",
  activeScoreNote: "Same 50 players as the first table. Each score runs from 0 to 100, and the highest one is marked. Counterpuncher loses 1.6 points for every winners-percentile point above 50. A blank score means that style's charted inputs are missing.",
  famousScoreNote: "Same twenty players as the notable table, and the same four scores as the active score table.",
  scoreFormulaNote: "Each input is a 0–100 percentile. A missing charted input is left out, and the remaining weights in that formula are divided by their total. Serve score and return score are required.",
  scoreFormulas: [
    ["Attacker", "0.50 × serve score + 0.20 × serve lead + 0.30 × winners percentile. Serve lead = 50 + serve score − return score, kept between 0 and 100."],
    ["Counterpuncher", "0.40 × return score + 0.25 × return lead + 0.15 × dominance percentile + 0.20 × 10+ shot rallies percentile, then − 1.6 × max(0, winners percentile − 50). The result stays between 0 and 100. Return lead = 50 + return score − serve score, kept between 0 and 100."],
    ["Grinder", "The average of (100 − serve score), return score, the 10+ shot rallies percentile, and (100 − winners percentile)."],
    ["Pusher", "0.35 × 10+ shot rallies percentile + 0.35 × opponent unforced errors percentile + 0.30 × (100 − winners percentile)."],
  ],
  changesNote: "Same rules on both windows. Each table lists the players in that group whose style label changed, or who have fewer than 20 stat matches since 1 Oct 2021. Sinner and Djokovic are in both because they are on the active table and the notable table.",
  fiveNote: "Same players and the same rules as the ten-year tables. Rates, percentiles, and Peak are recomputed from 1 Oct 2021. Federer and del Potro are absent from the notable table: each has fewer than 20 stat matches in this window.",
  fiveActiveNote: "A player needs a completed ATP match on or after 1 Jan 2025, a rank of 100 or better on that most recent match, and at least 20 matches with serve and return stats since 1 Oct 2021. Percentiles are among every ATP player with at least 20 stat matches since 1 Oct 2021.",
  fiveFamousNote: "The same hand-picked ATP players. Peak is the best ATP rank in a completed match since 1 Oct 2021. Players under 20 stat matches are left out.",
  stylesNote: "Checked in this order. The first rule that fits is the label. The two charted overrides run after that and can replace it. Serve score is the average of the Ace % percentile and the 1st-serve points won percentile. Return score is the average of the Return points won percentile and the Break % percentile. Safety score is the average of the 2nd-serve points won percentile and the percentile for fewer double faults. These scores are 0 to 100.",
  styleDefs: [
    ["Attacker", "Serve score is 70 or higher, and the serve score is at least as high as the return score. The winners percentile must be missing or at least 15."],
    ["Pusher", "Serve score is 40 or lower, safety score is 55 or higher, and the dominance-ratio percentile is under 75."],
    ["Counterpuncher", "Return score is 72 or higher, serve score is under 60, and the dominance-ratio percentile is 85 or higher."],
    ["Style scores", "Attacker is half the serve score, 20 percent how far serve leads return, and 30 percent the winners percentile. Counterpuncher is 40 percent return score, 25 percent how far return leads serve, 15 percent dominance, and 20 percent 10+ shot rallies. Then it loses 1.6 points for every winners-percentile point above 50. Grinder is the average of a low serve score, return score, 10+ shot rallies, and a low winners percentile. Pusher is 35 percent 10+ shot rallies, 35 percent opponent unforced errors, and 30 percent a low winners percentile. A missing charted input is left out and the other weights are rescaled."],
    ["Grinder", "Return score is 55 or higher, and serve score is under 50."],
    ["If none of those fit", "Pusher, when the serve score is 55 or lower, the return score is at most 5 points above the serve score, the safety score is 55 or higher, the dominance-ratio percentile is under 70, and the winners percentile is under 55 or missing. Otherwise attacker, when the serve score is at least the return score, the serve score is 50 or higher, and the winners percentile is missing or at least 15. Otherwise counterpuncher, when the return score is above the serve score and the return score is 70 or higher. This counterpuncher rule does not require the dominance-ratio percentile of 85. Otherwise grinder."],
    ["Low winners", "When the winners percentile exists and is under 15, both attacker rules are skipped. A blank winners cell does not trigger this. The later rules assign the label."],
    ["Charted override, pusher", "At least 40 charted matches, the 10+ shot rallies percentile is 90 or higher, the opponent unforced-error percentile is 85 or higher, and the winners percentile is under 55 or missing. This can replace an attacker label."],
    ["Charted override, attacker", "The label so far is counterpuncher, and the winners percentile is 70 or higher. The label becomes attacker."],
  ],
  defs: [
    ["How to read a cell", "The first number is the absolute value. The number in parentheses is the percentile, 0 to 100, with 100 the highest. Match-stat percentiles are among ATP players with at least 20 matches that have serve and return stats in that table's window, all surfaces combined. The ten-year tables start on 1 Oct 2016. The five-year tables start on 1 Oct 2021. Winners / point, 10+ shot rallies, and Opp. unforced errors / point use only players with at least 40 charted matches. Those three cells are blank below 40 charted matches."],
    ["Ace %", "Aces ÷ serve points. A serve point is every point the player serves, including double faults. An ace is a serve that lands in and the returner does not touch."],
    ["1st-serve points won", "Points won on first serves that landed in ÷ first serves in. This is not first-serve percentage, which is first serves in ÷ serve points."],
    ["Return points won", "Points won on the opponent's serve ÷ the opponent's serve points. The same figure is 1 minus the opponent's serve-points-won rate."],
    ["Break %", "Service games broken ÷ the opponent's service games. A break is a return game the player wins."],
    ["2nd-serve points won", "Points won when the player hits a second serve ÷ second serves played. Second serves played are serve points minus first serves in."],
    ["Double faults", "Double faults ÷ serve points. The percentile rises with the rate, so 100 is the most double faults in the group, not the fewest."],
    ["Safety score", "The average of two percentiles: 2nd-serve points won, and fewer double faults. Fewer double faults ranks the double-fault rate from low to high, so 100 is the fewest double faults. That is the opposite of the Double faults column, where 100 is the most. Safety score is not its own column."],
    ["Dominance ratio", "Return points won ÷ the share of the player's serve points that the opponent wins. That denominator is 1 minus the player's serve points won. It is a ratio, not a percentage. 1.00 means the two rates are equal."],
    ["Winners / point", "Winners ÷ charted points, from the Match Charting Project match overview. Charted points are that file's serve points plus return points. Ace % is a separate count from the match-stat file."],
    ["10+ shot rallies", "Points in the Match Charting Project rally bin labeled 10 ÷ all charted points. That bin is rallies of 10 shots or longer."],
    ["Opp. unforced errors / point", "Unforced errors by the opponent ÷ all charted points."],
  ],
  counts: (c) => `attacker ${c.attacker || 0} · counterpuncher ${c.counterpuncher || 0} · grinder ${c.grinder || 0} · pusher ${c.pusher || 0}`,
  fewer: "fewer than 20 stat matches",
  tenYears: "Ten years",
  fiveYears: "Five years",
  saved: "Image saved.",
};

const shareState = { token: 0 };
let roster = null;

function esc(v) {
  return String(v ?? "—").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

function cell(metric, kind) {
  if (!metric || metric.v == null || metric.p == null) return "—";
  const pct = Math.round(metric.p * 100);
  const n = Number(metric.v);
  let abs = n.toFixed(3);
  if (kind === "pct") abs = (n * 100).toFixed(1) + "%";
  if (kind === "ratio") abs = n.toFixed(2);
  return `${abs} (${pct})`;
}

function scoreText(value) {
  return value == null ? "—" : Number(value).toFixed(1);
}

function bestScoreKey(scores) {
  let best = null;
  SCORE_KEYS.forEach((key) => {
    if (scores[key] == null) return;
    if (best == null || scores[key] > scores[best]) best = key;
  });
  return best;
}

function rateTable(rows, rankKey) {
  const rankLabel = rankKey === "peak" ? "Peak" : "Rank";
  const head = `<tr><th class="rank">${rankLabel}</th><th class="player">Player</th><th>Style</th>${COLS.map((col) => `<th>${esc(col[1])}</th>`).join("")}</tr>`;
  const body = rows.map((row) => {
    const rank = rankKey === "peak" ? row.peak : row.rank;
    const metrics = COLS.map((col) => `<td>${esc(cell(row[col[0]], col[2]))}</td>`).join("");
    return `<tr><td class="rank">${esc(rank)}</td><td class="player">${esc(row.name)}</td><td class="style ${esc(row.style)}">${esc(row.style)}</td>${metrics}</tr>`;
  }).join("");
  return `<table class="rates"><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

function scoreTable(rows, rankKey) {
  const rankLabel = rankKey === "peak" ? "Peak" : "Rank";
  const head = `<tr><th class="rank">${rankLabel}</th><th class="player">Player</th><th>Style</th>${SCORE_KEYS.map((key) => `<th>${esc(key)}</th>`).join("")}</tr>`;
  const body = rows.map((row) => {
    const best = bestScoreKey(row.scores);
    const rank = rankKey === "peak" ? row.peak : row.rank;
    const cells = SCORE_KEYS.map((key) => {
      const mark = key === best ? " best" : "";
      return `<td class="score ${key}${mark}">${esc(scoreText(row.scores[key]))}</td>`;
    }).join("");
    return `<tr><td class="rank">${esc(rank)}</td><td class="player">${esc(row.name)}</td><td class="style ${esc(row.style)}">${esc(row.style)}</td>${cells}</tr>`;
  }).join("");
  return `<table class="scores"><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

function changesTable(rows) {
  const head = `<tr><th class="player">Player</th><th class="left">${esc(COPY.tenYears)}</th><th class="left">${esc(COPY.fiveYears)}</th></tr>`;
  const body = rows.map((row) => {
    const five = row.five
      ? `<td class="left style ${esc(row.five)}">${esc(row.five)}</td>`
      : `<td class="left">${esc(COPY.fewer)}</td>`;
    return `<tr><td class="player">${esc(row.name)}</td><td class="left style ${esc(row.ten)}">${esc(row.ten)}</td>${five}</tr>`;
  }).join("");
  return `<table class="fit"><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

function fillDl(id, pairs) {
  document.getElementById(id).innerHTML = pairs.map(([term, text]) =>
    `<dt>${esc(term)}</dt><dd>${esc(text)}</dd>`
  ).join("");
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function fitScale(width, height) {
  const maxSide = 8192;
  const maxArea = 16000000;
  const cap = 2;
  const scale = Math.min(cap, maxSide / width, maxSide / height, Math.sqrt(maxArea / (width * height)));
  if (!Number.isFinite(scale) || scale < 1) return 1;
  return Math.round(scale * 100) / 100;
}

async function drawGrid(headers, body, title, markCols, leftCols) {
  await document.fonts.ready;
  const measure = document.createElement("canvas").getContext("2d");
  measure.font = '13px "IBM Plex Mono", ui-monospace, monospace';
  const basePad = 10;
  const baseRow = 28;
  const baseWidths = headers.map((header, i) => {
    let width = measure.measureText(header).width;
    body.forEach((row) => { width = Math.max(width, measure.measureText(row[i]).width); });
    return Math.ceil(width + basePad * 2);
  });
  const baseWidth = baseWidths.reduce((sum, item) => sum + item, 0);
  const baseHeight = 44 + baseRow * (body.length + 1);
  const scale = fitScale(baseWidth, baseHeight);
  const font = `${13 * scale}px "IBM Plex Mono", ui-monospace, monospace`;
  measure.font = font;
  const padX = basePad * scale;
  const rowH = baseRow * scale;
  const widths = headers.map((header, i) => {
    let width = measure.measureText(header).width;
    body.forEach((row) => { width = Math.max(width, measure.measureText(row[i]).width); });
    return Math.ceil(width + padX * 2);
  });
  const width = widths.reduce((sum, item) => sum + item, 0);
  const captionH = 44 * scale;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = captionH + rowH * (body.length + 1);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = font;
  ctx.textBaseline = "middle";
  const paint = (values, y, header, style) => {
    let x = 0;
    values.forEach((value, i) => {
      const left = i < (leftCols == null ? 2 : leftCols);
      let fill = "#102117";
      if (header) fill = "#4c5e52";
      else if (STYLE_COLOR[value]) fill = STYLE_COLOR[value];
      else if (i === style) fill = "#6a7a12";
      ctx.fillStyle = fill;
      ctx.textAlign = left ? "left" : "right";
      const textX = left ? x + padX : x + widths[i] - padX;
      ctx.fillText(value, textX, y + rowH / 2);
      x += widths[i];
    });
    ctx.strokeStyle = "rgba(16, 33, 23, 0.16)";
    ctx.beginPath();
    ctx.moveTo(0, y + rowH - 0.5);
    ctx.lineTo(width, y + rowH - 0.5);
    ctx.stroke();
  };
  ctx.fillStyle = "#102117";
  ctx.font = `${18 * scale}px Syne, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(title, padX, captionH / 2);
  ctx.font = font;
  paint(headers, captionH, true, null);
  body.forEach((row, i) => paint(row, captionH + rowH * (i + 1), false, markCols ? markCols[i] : 2));
  return await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

async function tableToPng(rows, rankKey, title) {
  const headers = [rankKey === "peak" ? "Peak" : "Rank", "Player", "Style", ...COLS.map((col) => col[1])];
  const body = rows.map((row) => {
    const rank = rankKey === "peak" ? row.peak : row.rank;
    return [String(rank ?? "—"), row.name, row.style, ...COLS.map((col) => cell(row[col[0]], col[2]))];
  });
  return drawGrid(headers, body, title, body.map(() => 2));
}

async function scoreToPng(rows, rankKey, title) {
  const headers = [rankKey === "peak" ? "Peak" : "Rank", "Player", "Style", ...SCORE_KEYS];
  const body = rows.map((row) => {
    const rank = rankKey === "peak" ? row.peak : row.rank;
    return [String(rank ?? "—"), row.name, row.style, ...SCORE_KEYS.map((key) => scoreText(row.scores[key]))];
  });
  const marks = rows.map((row) => {
    const best = bestScoreKey(row.scores);
    return best == null ? -1 : SCORE_KEYS.indexOf(best) + 3;
  });
  return drawGrid(headers, body, title, marks);
}

async function changesToPng(rows, title) {
  const headers = ["Player", COPY.tenYears, COPY.fiveYears];
  const body = rows.map((row) => [row.name, row.ten, row.five || COPY.fewer]);
  return drawGrid(headers, body, title, body.map(() => -1), headers.length);
}

function prepareShares() {
  const token = shareState.token + 1;
  shareState.token = token;
  const keys = [
    "active", "famous", "activeScore", "famousScore",
    "fiveActive", "fiveFamous", "changesActive", "changesFamous",
  ];
  keys.forEach((key) => { shareState[key] = null; });
  [
    "save-active", "save-famous", "save-active-score", "save-famous-score",
    "save-five-active", "save-five-famous", "save-changes-active", "save-changes-famous",
  ].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) btn.disabled = true;
  });

  const arm = (key, buttonId, filename, title, draw) => {
    draw().then((blob) => {
      if (shareState.token !== token || !blob) return;
      shareState[key] = { blob, filename, title };
      const btn = document.getElementById(buttonId);
      if (btn) btn.disabled = false;
    }).catch(() => {});
  };

  arm("active", "save-active", "atp-active-top-50.png", "Active top 50 · ten years · ATP",
    () => tableToPng(roster.ten.active, "rank", "Active top 50 · ten years · ATP"));
  arm("famous", "save-famous", "atp-notable-20.png", "Notable players · ten years · ATP",
    () => tableToPng(roster.ten.famous, "peak", "Notable players · ten years · ATP"));
  arm("activeScore", "save-active-score", "atp-active-scores.png", "Active top 50 scores · ten years · ATP",
    () => scoreToPng(roster.ten.active, "rank", "Active top 50 scores · ten years · ATP"));
  arm("famousScore", "save-famous-score", "atp-notable-scores.png", "Notable player scores · ten years · ATP",
    () => scoreToPng(roster.ten.famous, "peak", "Notable player scores · ten years · ATP"));
  arm("fiveActive", "save-five-active", "atp-active-top-50-5y.png", "Active top 50 · five years · ATP",
    () => tableToPng(roster.five.active, "rank", "Active top 50 · five years · ATP"));
  arm("fiveFamous", "save-five-famous", "atp-notable-5y.png", "Notable players · five years · ATP",
    () => tableToPng(roster.five.famous, "peak", "Notable players · five years · ATP"));
  arm("changesActive", "save-changes-active", "atp-active-style-changes.png", "What changed · Active top 50 · ATP",
    () => changesToPng(roster.changes.filter((row) => row.table === "active"), "What changed · Active top 50 · ATP"));
  arm("changesFamous", "save-changes-famous", "atp-notable-style-changes.png", "What changed · Notable players · ATP",
    () => changesToPng(roster.changes.filter((row) => row.table === "famous"), "What changed · Notable players · ATP"));
}

async function saveImage(ready) {
  if (!ready) return;
  await shareImage(ready.blob, {
    filename: ready.filename,
    title: ready.title || "Tennis Intelligence",
  });
}

function bindSaves() {
  const map = {
    "save-active": "active",
    "save-famous": "famous",
    "save-active-score": "activeScore",
    "save-famous-score": "famousScore",
    "save-five-active": "fiveActive",
    "save-five-famous": "fiveFamous",
    "save-changes-active": "changesActive",
    "save-changes-famous": "changesFamous",
  };
  Object.entries(map).forEach(([id, key]) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.textContent = "Share";
    btn.onclick = () => saveImage(shareState[key]);
  });
}

function bindTabs() {
  const tabs = [...document.querySelectorAll('.tabs [role="tab"]')];
  const panels = {
    "tab-ten": "panel-ten",
    "tab-scores": "panel-scores",
    "tab-changes": "panel-changes",
    "tab-five": "panel-five",
    "tab-method": "panel-method",
  };
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.setAttribute("aria-selected", t === tab ? "true" : "false"));
      Object.entries(panels).forEach(([tabId, panelId]) => {
        document.getElementById(panelId).hidden = tabId !== tab.id;
      });
    });
  });
}

function render() {
  if (!roster) return;
  document.getElementById("ten-counts").textContent = COPY.counts(roster.ten.counts);
  document.getElementById("five-counts").textContent = COPY.counts(roster.five.counts);
  document.getElementById("active").innerHTML = rateTable(roster.ten.active, "rank");
  document.getElementById("famous").innerHTML = rateTable(roster.ten.famous, "peak");
  document.getElementById("active-score").innerHTML = scoreTable(roster.ten.active, "rank");
  document.getElementById("famous-score").innerHTML = scoreTable(roster.ten.famous, "peak");
  document.getElementById("changes-active").innerHTML = changesTable(roster.changes.filter((r) => r.table === "active"));
  document.getElementById("changes-famous").innerHTML = changesTable(roster.changes.filter((r) => r.table === "famous"));
  document.getElementById("five-active").innerHTML = rateTable(roster.five.active, "rank");
  document.getElementById("five-famous").innerHTML = rateTable(roster.five.famous, "peak");

  setText("active-note", COPY.activeNote);
  setText("famous-note", COPY.famousNote);
  setText("active-score-note", COPY.activeScoreNote);
  setText("famous-score-note", COPY.famousScoreNote);
  setText("score-formula-note", COPY.scoreFormulaNote);
  setText("changes-note", COPY.changesNote);
  setText("five-note", COPY.fiveNote);
  setText("five-active-note", COPY.fiveActiveNote);
  setText("five-famous-note", COPY.fiveFamousNote);
  setText("styles-note", COPY.stylesNote);
  fillDl("score-formulas", COPY.scoreFormulas);
  fillDl("style-defs", COPY.styleDefs);
  fillDl("defs", COPY.defs);
  prepareShares();
}

bindTabs();
bindSaves();

fetch("../data/styles.json")
  .then((res) => {
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  })
  .then((data) => {
    roster = data;
    render();
  })
  .catch(() => {
    document.getElementById("error").hidden = false;
  });
