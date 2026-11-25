import { renderBars, renderHeatmap, renderLine } from "../assets/topics-render.js";
import { shareImage } from "./share-image.js";
import { FAQ_BY_CHART, collectFaqItems, faqPageJsonLd } from "./topics-faq.js";

const ATP = "#102117";
const WTA = "#c45c26";
/** High-contrast series colors (charts 1, 2, 4, 11 and multi-series charts). */
const INK = ["#102117", "#c45c26", "#1f6b9a", "#1a7a4c", "#b8860b"];
const SHAPES = ["circle", "square", "triangle", "diamond", "star"];
const PLAYER_STYLE = {
  "Roger Federer": { color: INK[0], shape: "circle" },
  "Rafael Nadal": { color: INK[1], shape: "square" },
  "Novak Djokovic": { color: INK[2], shape: "triangle" },
  "Jannik Sinner": { color: INK[3], shape: "diamond" },
  "Carlos Alcaraz": { color: INK[4], shape: "star" },
};
/** Charts 1–2: Big 3 on legend row 1, Alcaraz + Sinner on row 2. */
const ERA_PLAYER_ORDER = [
  "Roger Federer",
  "Rafael Nadal",
  "Novak Djokovic",
  "Carlos Alcaraz",
  "Jannik Sinner",
];

function eraPlayers(series) {
  const seen = [...new Set((series || []).map((row) => row.player))];
  return ERA_PLAYER_ORDER.filter((name) => seen.includes(name))
    .concat(seen.filter((name) => !ERA_PLAYER_ORDER.includes(name)));
}
const ROUND = { 7: "R32", 8: "R16", 9: "QF", 10: "SF", 12: "F" };
const SLAM = {
  australian_open: "AO",
  french_open: "RG",
  wimbledon: "Wimbledon",
  us_open: "US Open",
};
const SLAM_ORDER = ["australian_open", "french_open", "wimbledon", "us_open"];
const EVENT_ORDER = [
  "australian_open", "french_open", "wimbledon", "us_open",
  "indian_wells", "miami", "monte_carlo", "madrid", "rome",
  "canada", "cincinnati", "shanghai", "paris",
  "doha", "dubai", "beijing", "wuhan", "guadalajara_2",
];
const SEASON_PARTIAL = {
  2016: "Analysis window opens 2016-10-01; not a full calendar season.",
  2020: "COVID-shortened tour calendar.",
  2025: "Incomplete US Open in warehouse.",
  2026: "Warehouse data through ~2026-09-30.",
};

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function pct(value) {
  return `${(Number(value) * 100).toFixed(1)}%`;
}

function num(value, digits = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return digits ? n.toFixed(digits) : String(Math.round(n));
}

function byTour(rows) {
  return {
    atp: (rows || []).filter((row) => row.tour === "atp"),
    wta: (rows || []).filter((row) => row.tour === "wta"),
  };
}

function seasonsOf(rows) {
  return [...new Set((rows || []).map((row) => row.season).filter((v) => v != null))].sort((a, b) => a - b);
}

function partialReasons(rows, { seasons = false } = {}) {
  const reasons = [];
  const seen = new Set();
  const add = (text) => {
    if (!text || seen.has(text)) return;
    seen.add(text);
    reasons.push(text);
  };
  const list = rows || [];
  const flagged = list.some((row) => Object.prototype.hasOwnProperty.call(row, "partial"));
  if (flagged) {
    list.forEach((row) => {
      if (row.partial) add(row.partial_reason);
    });
    return reasons;
  }
  if (seasons) {
    seasonsOf(list).forEach((season) => add(SEASON_PARTIAL[season]));
  }
  return reasons;
}

function starSeasons(rows) {
  return [...new Set((rows || []).filter((row) => row.partial).map((row) => row.season))];
}

function starLabel(season, partial) {
  return partial ? `${season}*` : String(season);
}

function panel(kicker, svg) {
  const head = kicker ? `<p class="kicker panel-kicker">${esc(kicker)}</p>` : "";
  const titleAttr = kicker ? ` data-panel-title="${esc(kicker)}"` : "";
  return `<div class="panel"${titleAttr}>${head}<div class="map">${svg}</div></div>`;
}

function slugPart(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "chart";
}

function playerStyle(name, index) {
  return PLAYER_STYLE[name] || { color: INK[index % INK.length], shape: SHAPES[index % SHAPES.length] };
}

function lineSpec(rows, yOf, name, color, extra) {
  const style = extra.style || {};
  return {
    name,
    color: style.color || color,
    shape: style.shape || extra.shape || "circle",
    points: rows.map((row) => ({
      x: extra.xOf ? extra.xOf(row) : row.season,
      y: yOf(row),
      title: extra.title ? extra.title(row) : `${name} ${row.season}: ${yOf(row)}`,
    })),
  };
}

function seasonBars(rows, fields, yLabel, yFormat) {
  const partial = new Set(starSeasons(rows));
  return {
    categories: rows.map((row) => starLabel(row.season, partial.has(row.season))),
    series: fields.map((field) => ({
      name: field.name,
      color: field.color,
      values: rows.map((row) => Number(row[field.key])),
    })),
    yLabel,
    yFormat,
    yMin: 0,
    xLabel: "Season",
  };
}

function maxBy(rows, key) {
  return (rows || []).reduce((best, row) => {
    if (!best || Number(row[key]) > Number(best[key])) return row;
    return best;
  }, null);
}

function readout(title, facts) {
  const items = (facts || []).filter(Boolean).map((fact) => `<li>${esc(fact)}</li>`).join("");
  return `<p class="kicker">Read</p><h3>${esc(title)}</h3><ul class="facts">${items}</ul>`;
}

function method(caveat, reasons, extra) {
  const partial = reasons.length
    ? reasons.map((reason) => esc(reason)).join(" ")
    : esc(extra || "No partial-season flag on this chart.");
  const star = reasons.length ? " An asterisk on an axis is a partial season." : "";
  return `<p class="kicker">Caveat</p><p>${esc(caveat || "")}</p><p class="kicker">Partial</p><p>${partial}${star}</p>`;
}

function hint(text) {
  return text ? `<p class="hint">${esc(text)}</p>` : "";
}

const BUILD = {
  era_winrate_by_age(data) {
    const players = eraPlayers(data.series);
    const series = players.map((player, i) => lineSpec(
      data.series.filter((row) => row.player === player),
      (row) => row.win_pct * 100,
      player,
      INK[i % INK.length],
      {
        xOf: (row) => row.age,
        title: (row) => `${player}, age ${row.age}: ${pct(row.win_pct)} in ${row.matches} matches`,
        style: playerStyle(player, i),
      },
    ));
    const best = maxBy(data.series, "win_pct");
    return {
      figure: panel("", renderLine({
        title: data.title,
        series,
        xLabel: "Age",
        yLabel: "Win %",
        yFormat: "pct",
        yMin: 0,
        yMax: 100,
        legendRowSizes: [3, 2],
      })) + hint("Win percentage by integer age. Walkovers and defaults are out; retirements count."),
      read: readout(best.player, [`Age ${best.age}`, `${pct(best.win_pct)} win rate`, `${best.matches} matches`]),
      reasons: [],
      partialExtra: "No partial-season flag. Big 3 peak years before 2016-10-01 are outside this warehouse.",
    };
  },
  era_elo_by_age(data) {
    const players = eraPlayers(data.series);
    const series = players.map((player, i) => lineSpec(
      data.series.filter((row) => row.player === player),
      (row) => row.elo,
      player,
      INK[i % INK.length],
      {
        xOf: (row) => row.age,
        title: (row) => `${player}, age ${row.age}: Elo ${num(row.elo, 0)} over ${row.matches} matches`,
        style: playerStyle(player, i),
      },
    ));
    const best = maxBy(data.series, "elo");
    return {
      figure: panel("", renderLine({
        title: data.title,
        series,
        xLabel: "Age",
        yLabel: "Elo",
        yFormat: "int",
        legendRowSizes: [3, 2],
      })) + hint("Mean pre-match Elo. Age bins with fewer than five matches are omitted."),
      read: readout(best.player, [`Age ${best.age}`, `Elo ${num(best.elo, 0)}`, `${best.matches} matches`]),
      reasons: [],
      partialExtra: "No partial-season flag. Elo here starts with the 2016-10-01 window, not a career rating.",
    };
  },
  era_vs_top10(data) {
    const rows = data.rows.slice().sort((a, b) => b.win_pct - a.win_pct);
    const series = [{ name: "Win % vs top 10", color: ATP, values: rows.map((row) => row.win_pct * 100) }];
    const best = rows[0];
    return {
      figure: panel("", renderBars({
        title: data.title,
        categories: rows.map((row) => row.player.split(" ").slice(-1)[0]),
        series,
        legend: false,
        xLabel: "Player",
        yLabel: "Win %",
        yFormat: "pct",
        yMin: 0,
        yMax: 100,
      })) + hint("In-window matches against opponents ranked 1–10. Walkovers and defaults excluded."),
      read: readout(best.player, [pct(best.win_pct), `${best.wins} wins`, `${best.matches} matches`]),
      reasons: [],
      partialExtra: "No partial-season flag. The rate is the whole window, not a season.",
    };
  },
  retire_wo_by_season(data) {
    const split = byTour(data.series);
    const fields = [
      { key: "retired", name: "Retired", color: INK[0] },
      { key: "walkover", name: "Walkover", color: INK[1] },
      { key: "defaulted", name: "Defaulted", color: INK[2] },
    ];
    const figure = ["atp", "wta"].map((tour) => {
      const rows = split[tour];
      return panel(tour === "atp" ? "ATP · Men" : "WTA · Women", renderBars({
        title: `${data.title} ${tour}`,
        ...seasonBars(rows, fields, "Matches", "int"),
        legend: fields,
        legendSize: "lg",
      }));
    }).join("") + hint("Main-tour matches. Counts, not rates.");
    const peak = maxBy(data.series, "retired");
    return {
      figure,
      read: readout(`${peak.tour.toUpperCase()} ${peak.season}`, [`${peak.retired} retirements`, `${peak.walkover} walkovers`, `${peak.defaulted} defaults`]),
      reasons: partialReasons(data.series),
    };
  },
  top20_load(data) {
    const totals = data.season_totals || [];
    const split = byTour(totals);
    const series = [
      lineSpec(split.atp, (row) => row.matches, "ATP matches", ATP, { shape: "circle", title: (row) => `ATP ${row.season}: ${row.matches} matches` }),
      lineSpec(split.wta, (row) => row.matches, "WTA matches", WTA, { shape: "square", title: (row) => `WTA ${row.season}: ${row.matches} matches` }),
    ];
    const hours = [
      lineSpec(split.atp, (row) => row.minutes / 60, "ATP hours", ATP, { shape: "circle", title: (row) => `ATP ${row.season}: ${num(row.minutes / 60, 0)} hours` }),
      lineSpec(split.wta, (row) => row.minutes / 60, "WTA hours", WTA, { shape: "square", title: (row) => `WTA ${row.season}: ${num(row.minutes / 60, 0)} hours` }),
    ];
    const partialX = starSeasons(totals);
    const peak = maxBy(totals, "minutes");
    return {
      figure: panel("Matches", renderLine({
        title: `${data.title} matches`,
        series,
        partialX,
        xLabel: "Season",
        yLabel: "Matches",
        yFormat: "int",
        yMin: 0,
        legendSize: "lg",
      })) + panel("Hours", renderLine({
        title: `${data.title} hours`,
        series: hours,
        partialX,
        xLabel: "Season",
        yLabel: "Hours",
        yFormat: "int",
        yMin: 0,
        legendSize: "lg",
      })) + hint("Year-end top 20 only. Seasons without a late-season (from 1 October) snapshot are omitted. Hours are minutes ÷ 60."),
      read: readout(`${peak.tour.toUpperCase()} ${peak.season}`, [`${num(peak.matches)} matches`, `${num(peak.minutes / 60)} hours`, `${peak.matches_with_minutes} matches with minutes`]),
      reasons: partialReasons(totals),
    };
  },
  top10_churn(data) {
    const split = byTour(data.series);
    const fields = [
      { key: "distinct_top10", name: "Distinct top 10", color: INK[0] },
      { key: "first_time_top10", name: "First time in window", color: INK[1] },
    ];
    const figure = ["atp", "wta"].map((tour) => panel(
      tour === "atp" ? "ATP · Men" : "WTA · Women",
      renderBars({
        title: data.title,
        ...seasonBars(split[tour], fields, "Players", "int"),
        legend: fields,
        legendSize: "lg",
      }),
    )).join("") + hint("First time means the first in-window match inside the top 10, not a career debut.");
    const peak = maxBy(data.series, "distinct_top10");
    return {
      figure,
      read: readout(`${peak.tour.toUpperCase()} ${peak.season}`, [`${peak.distinct_top10} distinct`, `${peak.first_time_top10} first time in window`]),
      reasons: partialReasons(data.series),
    };
  },
  top10_points_gap(data) {
    const split = byTour(data.series);
    const series = [
      lineSpec(split.atp, (row) => row.gap, "ATP", ATP, { shape: "circle", title: (row) => `ATP ${row.season}: ${row.rank1_player} ${row.rank1_points} vs ${row.rank10_player} ${row.rank10_points}` }),
      lineSpec(split.wta, (row) => row.gap, "WTA", WTA, { shape: "square", title: (row) => `WTA ${row.season}: ${row.rank1_player} ${row.rank1_points} vs ${row.rank10_player} ${row.rank10_points}` }),
    ];
    const peak = maxBy(data.series, "gap");
    return {
      figure: panel("", renderLine({
        title: data.title,
        series,
        partialX: starSeasons(data.series),
        xLabel: "Season",
        yLabel: "Points",
        yFormat: "int",
        yMin: 0,
        legendSize: "lg",
      })) + hint("Late-season snapshot from 1 October: last main-draw rank and points. Prefers the holders of rank 1 and rank 10."),
      read: readout(`${peak.tour.toUpperCase()} ${peak.season}`, [`Gap ${num(peak.gap)}`, peak.rank1_player, peak.rank10_player]),
      reasons: partialReasons(data.series),
    };
  },
  first_top10_age(data) {
    const ages = data.rows.map((row) => row.age);
    const lo = Math.min(...ages);
    const hi = Math.max(...ages);
    const bins = [];
    for (let age = lo; age <= hi; age += 1) bins.push(age);
    const series = [
      { name: "ATP", color: ATP, values: bins.map((age) => data.rows.filter((row) => row.tour === "atp" && row.age === age).length) },
      { name: "WTA", color: WTA, values: bins.map((age) => data.rows.filter((row) => row.tour === "wta" && row.age === age).length) },
    ];
    const already = data.rows.filter((row) => row.already_top10_at_window).length;
    return {
      figure: panel("", renderBars({
        title: data.title,
        categories: bins.map(String),
        series,
        xLabel: "Age",
        yLabel: "Players",
        yFormat: "int",
        yMin: 0,
        legendSize: "lg",
      })) + hint("One player, one age: the first main-tour match at rank 10 or better on or after 2016-10-01."),
      read: readout(`${already} already inside`, [`${data.rows.length} players`, "Left-censored at the window", "Not a career-debut cohort"]),
      reasons: [],
      partialExtra: `${already} players were already ranked 10 or better at their first in-window match. Those ages are not career debuts.`,
    };
  },
  zverev_gs_path(data) {
    const rows = data.rows.slice().sort((a, b) => a.season - b.season || SLAM_ORDER.indexOf(a.slam) - SLAM_ORDER.indexOf(b.slam));
    const labels = rows.map((row) => {
      const slam = SLAM[row.slam] || row.slam;
      const star = row.partial ? "*" : "";
      const last = row.champion.split(" ").slice(-1)[0];
      return `${row.season} ${slam}${star} · ${last}`;
    });
    const series = [{
      name: "Mean opponent rank",
      color: ATP,
      values: rows.map((row) => row.mean_opp_rank),
      highlights: rows.map((row) => row.highlight),
    }];
    const highlighted = rows.filter((row) => row.highlight);
    const legend = [
      { name: "Other champions", color: ATP },
      { name: "Alexander Zverev", color: "#e4ff5a" },
    ];
    return {
      figure: panel("", renderBars({
        title: data.title,
        orient: "h",
        categories: labels,
        series,
        legend,
        yLabel: "Mean opponent rank",
        yFormat: "1",
        yMin: 0,
        xLabel: "Mean opponent rank",
      })) + hint("Mean rank of opponents beaten on the way to the title. Early rounds pull the mean. Yellow bars are Zverev."),
      read: readout("Alexander Zverev", highlighted.map((row) => `${row.season} ${SLAM[row.slam] || row.slam} · rank ${num(row.mean_opp_rank, 1)} · ${row.matches} matches`)),
      reasons: partialReasons(rows),
    };
  },
  slam_champion_diversity(data) {
    const split = byTour(data.series);
    const series = [
      lineSpec(split.atp, (row) => row.distinct_champions, "ATP", ATP, { shape: "circle" }),
      lineSpec(split.wta, (row) => row.distinct_champions, "WTA", WTA, { shape: "square" }),
    ];
    const latest = Math.max(...data.series.map((row) => row.season));
    const at = (tour) => data.series.find((row) => row.tour === tour && row.season === latest);
    return {
      figure: panel("", renderLine({
        title: data.title,
        series,
        partialX: starSeasons(data.series),
        xLabel: "Season",
        yLabel: "Champions",
        yFormat: "int",
        yMin: 0,
        yMax: 4,
      })) + hint("Distinct singles champions, final only, ATP against WTA."),
      read: readout(String(latest), [`ATP ${at("atp")?.distinct_champions ?? "—"}`, `WTA ${at("wta")?.distinct_champions ?? "—"}`]),
      reasons: partialReasons(data.series),
    };
  },
  seed_upset_rate(data) {
    const rounds = [7, 8, 9, 10, 12];
    const keys = [
      { tour: "atp", level: "grand_slam", name: "ATP Grand Slam", color: INK[0] },
      { tour: "atp", level: "masters_1000", name: "ATP Masters", color: INK[2] },
      { tour: "wta", level: "grand_slam", name: "WTA Grand Slam", color: INK[1] },
      { tour: "wta", level: "masters_1000", name: "WTA Masters", color: INK[4] },
    ];
    const find = (key, round) => data.series.find((row) => row.tour === key.tour && row.level_norm === key.level && row.round_order === round);
    const series = keys.map((key) => ({
      name: key.name,
      color: key.color,
      values: rounds.map((round) => {
        const row = find(key, round);
        return row ? row.upset_rate * 100 : 0;
      }),
    }));
    const best = maxBy(data.series, "upset_rate");
    return {
      figure: panel("", renderBars({
        title: data.title,
        categories: rounds.map((round) => ROUND[round] || String(round)),
        series,
        legend: keys,
        legendCols: keys.length,
        xLabel: "Round",
        yLabel: "Upset %",
        yFormat: "pct",
        yMin: 0,
      })) + hint("Both seeds known, loser seeded better than the winner, completed matches only."),
      read: readout(`${best.tour.toUpperCase()} ${best.level_norm === "grand_slam" ? "Grand Slam" : "Masters"} ${ROUND[best.round_order] || ""}`.trim(), [pct(best.upset_rate), `${best.upsets} upsets`, `${best.seeded_vs_seeded} seeded matches`]),
      reasons: [],
      partialExtra: "No partial-season flag. The rate pools the whole window.",
    };
  },
  pace_heatmap_ace: (data) => paceHeatmap(data, "Ace %"),
  pace_heatmap_hold: (data) => paceHeatmap(data, "Hold %"),
};

function eventName(cells, key) {
  const counts = new Map();
  cells.forEach((cell) => {
    if (cell.event_key !== key) return;
    counts.set(cell.tourney_name, (counts.get(cell.tourney_name) || 0) + (cell.matches || 1));
  });
  const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return best ? best[0] : key;
}

function paceHeatmap(data, yLabel) {
  const seasons = seasonsOf(data.cells).map(String);
  const partialX = seasons.filter((season) => SEASON_PARTIAL[Number(season)]);
  const figure = ["atp", "wta"].map((tour) => {
    const cells = data.cells.filter((cell) => cell.tour === tour);
    const keys = [...new Set(cells.map((cell) => cell.event_key))].sort((a, b) => {
      const ia = EVENT_ORDER.indexOf(a);
      const ib = EVENT_ORDER.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
    });
    const rows = keys.map((key) => eventName(cells, key));
    const drawn = cells.map((cell) => ({
      row: eventName(cells, cell.event_key),
      col: String(cell.season),
      value: cell.value * 100,
      title: `${eventName(cells, cell.event_key)} ${cell.season}: ${(cell.value * 100).toFixed(1)}% · ${cell.matches} matches`,
    }));
    return panel(tour === "atp" ? "ATP · Men" : "WTA · Women", renderHeatmap({
      title: data.title,
      rows,
      cols: seasons,
      cells: drawn,
      partialX,
      yLabel,
      yFormat: "pct",
    }));
  }).join("");
  const peak = maxBy(data.cells, "value");
  return {
    figure: figure + hint(`${yLabel === "Ace %" ? "Ace rate" : "Hold rate"} by event and season. Grand Slams and Masters 1000. Blank cells are missing or under the match minimum (${data.min_matches}).`),
    read: readout(`${peak.tourney_name} ${peak.season}`, [pct(peak.value), `${peak.matches} matches`, peak.tour.toUpperCase()]),
    reasons: partialReasons(data.cells, { seasons: true }),
  };
}

function chapter(chart, number) {
  return `<article class="chapter" id="chart-${esc(chart.id)}" aria-labelledby="chart-${esc(chart.id)}-title">
    <p class="chapter-no kicker"><span class="num">${number}</span>Topics</p>
    <h2 id="chart-${esc(chart.id)}-title">${esc(chart.title)}</h2>
    <p class="premise">${esc(chart.premise)}</p>
    <div class="chapter-body">
      <figure class="figure">
        <div class="charts"><p class="hint">Loading…</p></div>
      </figure>
      <div class="chapter-notes">
        <div class="readout"></div>
        <div class="method"></div>
      </div>
    </div>
  </article>`;
}

function drawShareLogo(ctx, width, height, scale = 2) {
  const label = "TennisIntelligence.Org";
  const s = Math.max(1, scale);
  const fontPx = Math.round(11 * s);
  const courtW = Math.round(31 * s);
  const gap = Math.round(6 * s);
  const right = width - Math.round(14 * s);
  const midY = height - Math.round(14 * s);
  ctx.save();
  ctx.font = `700 ${fontPx}px Syne, sans-serif`;
  ctx.fillStyle = "#14241c";
  ctx.textBaseline = "middle";
  const textW = ctx.measureText(label).width;
  const courtX = right - courtW;
  const textX = courtX - gap - textW;
  ctx.fillText(label, textX, midY);
  ctx.translate(courtX, midY - courtW * (17 / 62));
  ctx.scale(courtW / 54, courtW / 54);
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

async function loadSvgImage(svg, width, height) {
  const clone = svg.cloneNode(true);
  if (!clone.getAttribute("xmlns")) clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  // Rasterize at the export pixel size (not the tiny viewBox), so text stays sharp.
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  const xml = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
  try {
    return await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("chart image"));
      el.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function wrapShareTitle(ctx, text, maxWidth) {
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
  return lines.slice(0, 3);
}

async function exportPanelPng(svg, title) {
  await document.fonts.ready;
  if (!svg) throw new Error("No chart");
  const rect = svg.getBoundingClientRect();
  const cssW = Math.max(1, rect.width || 640);
  const cssH = Math.max(1, rect.height || 360);
  // ~4× CSS size so WeChat/Messages stay sharp; cap for canvas limits.
  let scale = Math.max(3.5, Math.min(4.5, (window.devicePixelRatio || 1) * 2.25));
  let chartW = Math.round(cssW * scale);
  let chartH = Math.round(cssH * scale);
  const maxSide = 4096;
  if (Math.max(chartW, chartH) > maxSide) {
    const fit = maxSide / Math.max(chartW, chartH);
    chartW = Math.max(1, Math.round(chartW * fit));
    chartH = Math.max(1, Math.round(chartH * fit));
    scale = chartW / cssW;
  }
  const img = await loadSvgImage(svg, chartW, chartH);
  const pad = Math.round(14 * scale);
  const titleSize = Math.round(14 * scale);
  const lineH = Math.round(17 * scale);
  const measure = document.createElement("canvas").getContext("2d");
  measure.font = `600 ${titleSize}px Syne, sans-serif`;
  const lines = wrapShareTitle(measure, title || "Tennis Intelligence", chartW - pad * 2);
  const captionH = Math.max(Math.round(32 * scale), Math.round(12 * scale) + lines.length * lineH);
  const logoH = Math.round(20 * scale);
  const canvas = document.createElement("canvas");
  canvas.width = chartW;
  canvas.height = captionH + chartH + logoH;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#14241c";
  ctx.font = `600 ${titleSize}px Syne, sans-serif`;
  ctx.textBaseline = "top";
  lines.forEach((line, i) => ctx.fillText(line, pad, Math.round(9 * scale) + i * lineH));
  ctx.drawImage(img, 0, captionH, chartW, chartH);
  drawShareLogo(ctx, chartW, canvas.height, scale);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("png"))), "image/png");
  });
}

const shareReady = new WeakMap();
let shareSeq = 0;

function armButton(button, svg, title, filename) {
  if (!button || !svg) return;
  button.disabled = true;
  const seq = ++shareSeq;
  button.dataset.shareSeq = String(seq);
  shareReady.delete(button);
  exportPanelPng(svg, title).then((blob) => {
    if (button.dataset.shareSeq !== String(seq)) return;
    shareReady.set(button, { blob, filename, title });
    button.disabled = false;
  }).catch(() => {
    if (button.dataset.shareSeq !== String(seq)) return;
    shareReady.delete(button);
    button.disabled = true;
  });
}

function bindPanelShare(button, status, svg, title, filename) {
  if (!button || button.dataset.bound) return;
  button.dataset.bound = "1";
  button.addEventListener("click", async () => {
    const ready = shareReady.get(button);
    if (!ready?.blob) {
      status.textContent = "Preparing the image. Tap Share again.";
      armButton(button, svg, title, filename);
      return;
    }
    button.disabled = true;
    status.textContent = "";
    try {
      const result = await shareImage(ready.blob, {
        filename: ready.filename,
        title: ready.title || "Tennis Intelligence",
      });
      status.textContent = result === "shared" ? "Opened the share sheet."
        : result === "copied" ? "Image copied."
        : result === "aborted" ? ""
        : "Image saved.";
    } catch (err) {
      status.textContent = "Could not share the image.";
    } finally {
      button.disabled = !shareReady.get(button)?.blob;
    }
  });
  armButton(button, svg, title, filename);
}

function mountShares(article, chapterTitle) {
  const charts = article.querySelector(".figure .charts");
  if (!charts) return;
  const panels = [...charts.querySelectorAll(":scope > .panel")];
  const slug = (article.id || "topic").replace(/^chart-/, "");
  panels.forEach((panelEl) => {
    const svg = panelEl.querySelector(".map svg");
    if (!svg) return;
    let share = panelEl.querySelector(":scope > .chart-share");
    if (!share) {
      share = document.createElement("p");
      share.className = "actions chart-share";
      share.innerHTML = `<button type="button" class="button save">Share</button><span class="status" role="status"></span>`;
      panelEl.appendChild(share);
    }
    const kicker = panelEl.dataset.panelTitle
      || panelEl.querySelector(".panel-kicker")?.textContent?.trim()
      || "";
    const title = kicker ? `${chapterTitle} · ${kicker}` : chapterTitle;
    const filename = kicker ? `${slug}-${slugPart(kicker)}.png` : `${slug}.png`;
    bindPanelShare(
      share.querySelector(".save"),
      share.querySelector(".status"),
      svg,
      title || "Tennis Intelligence",
      filename,
    );
  });
}

function faqHtml(chartId) {
  const rows = FAQ_BY_CHART[chartId];
  if (!rows?.length) return "";
  const articles = rows.map((row) => `
    <article id="${esc(row.id)}">
      <h3>${esc(row.question)}</h3>
      <p>${esc(row.answer)}</p>
      <p class="source">From this chart · window from 2016-10-01 · TennisMyLife.</p>
    </article>`).join("");
  return `<div class="topic-faq" aria-label="FAQ"><p class="kicker">FAQ</p>${articles}</div>`;
}

function refreshTopicsFaqLd() {
  const ids = [...document.querySelectorAll(".stream .chapter .topic-faq")]
    .map((faq) => faq.closest(".chapter")?.id?.replace(/^chart-/, ""))
    .filter((id) => id && FAQ_BY_CHART[id]?.length);
  const items = collectFaqItems(ids);
  let tag = document.getElementById("topics-faq-ld");
  if (!items.length) {
    tag?.remove();
    return;
  }
  if (!tag) {
    tag = document.createElement("script");
    tag.type = "application/ld+json";
    tag.id = "topics-faq-ld";
    document.head.appendChild(tag);
  }
  tag.textContent = JSON.stringify(faqPageJsonLd(items));
}

function paint(article, data) {
  const build = BUILD[data.id];
  const charts = article.querySelector(".figure .charts");
  const notes = article.querySelector(".readout");
  const copy = article.querySelector(".method");
  if (!build) {
    charts.innerHTML = `<p class="load-error">This chart has no drawing.</p>`;
    return;
  }
  const view = build(data);
  charts.innerHTML = view.figure;
  notes.innerHTML = view.read;
  copy.innerHTML = method(data.caveat, view.reasons, view.partialExtra);
  mountShares(article, data.title);
  const oldFaq = article.querySelector(".topic-faq");
  if (oldFaq) oldFaq.remove();
  const faq = faqHtml(data.id);
  const body = article.querySelector(".chapter-body");
  if (body) body.insertAdjacentHTML("beforeend", faq);
  else article.insertAdjacentHTML("beforeend", faq);
  refreshTopicsFaqLd();
}

async function loadOne(chart) {
  const article = document.getElementById(`chart-${chart.id}`);
  try {
    const res = await fetch(`../data/hot/${chart.id}.json`);
    if (!res.ok) throw new Error(String(res.status));
    paint(article, await res.json());
  } catch (err) {
    const charts = article.querySelector(".figure .charts");
    if (charts) charts.innerHTML = `<p class="load-error">This chart could not be loaded.</p>`;
    else article.querySelector(".figure").innerHTML = `<p class="load-error">This chart could not be loaded.</p>`;
    article.querySelector(".method").innerHTML = method("Match data from TennisMyLife; analysis window starts 2016-10-01.", []);
  }
}

async function pool(items, size, fn) {
  const queue = items.slice();
  async function worker() {
    while (queue.length) await fn(queue.shift());
  }
  await Promise.all(Array.from({ length: size }, worker));
}

function bindToc() {
  const links = new Map([...document.querySelectorAll(".toc a")].map((a) => [a.getAttribute("href").slice(1), a]));
  const mark = (id) => links.forEach((a, key) => {
    if (key === id) a.setAttribute("aria-current", "true");
    else a.removeAttribute("aria-current");
  });
  if (!("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) mark(entry.target.id);
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  document.querySelectorAll(".chapter").forEach((chapterNode) => io.observe(chapterNode));
}

async function main() {
  const toc = document.getElementById("toc-list");
  const stream = document.getElementById("stream");
  const res = await fetch("../data/hot/index.json");
  if (!res.ok) throw new Error(String(res.status));
  const { charts } = await res.json();
  const count = document.querySelector(".opener .num");
  if (count) count.textContent = String(charts.length);
  toc.innerHTML = charts.map((chart, i) => `<li><a href="#chart-${esc(chart.id)}"><span class="num">${pad(i + 1)}</span>${esc(chart.title)}</a></li>`).join("");
  stream.innerHTML = charts.map((chart, i) => chapter(chart, pad(i + 1))).join("");
  bindToc();
  if (location.hash) {
    const target = document.getElementById(location.hash.slice(1));
    if (target) target.scrollIntoView({ block: "start" });
  }
  await pool(charts, 3, loadOne);
}

main().catch(() => {
  const stream = document.getElementById("stream");
  if (stream) stream.innerHTML = `<p class="load-error">The topics could not be loaded.</p>`;
});
