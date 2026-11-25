/* SVG line, bar, and heatmap charts for /topics.
   Tokens match assets/chart-render.js THEMES.page / THEMES.export.
   Selection uses the journal yellow #e4ff5a. */

export const THEMES = {
  export: {
    bg: "#ffffff",
    plotFill: "none",
    grid: null,
    frame: "rgba(26,46,36,0.35)",
    tick: "#3d4f44",
    axis: "#14241c",
    label: "#14241c",
    halo: "#ffffff",
    leader: "rgba(26,46,36,0.45)",
    dot: "#1a2e24",
    star: "#c6e000",
    dotRing: "rgba(26,46,36,0.35)",
    sel: "#e4ff5a",
    onStroke: "#102117",
    ring: "#102117",
    dotOpacity: 0.72,
  },
  page: {
    bg: null,
    plotFill: "rgba(255,253,247,0.62)",
    grid: "rgba(16,33,23,0.07)",
    frame: "rgba(16,33,23,0.32)",
    tick: "#3a4c40",
    axis: "#102117",
    label: "#102117",
    halo: "#f8f5ed",
    leader: "rgba(16,33,23,0.42)",
    dot: "#3b5646",
    star: "#d2ea2c",
    dotRing: "rgba(16,33,23,0.5)",
    sel: "#e4ff5a",
    onStroke: "#102117",
    ring: "#102117",
    dotOpacity: 0.58,
  },
};

const TICK = "IBM Plex Mono, ui-monospace, monospace";
const AXIS = "Syne, Helvetica Neue, sans-serif";

export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

function useTheme(name) {
  return THEMES[name] || THEMES.page;
}

export function fmt(value, mode) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  if (mode === "int") return String(Math.round(n));
  if (mode === "pct" || mode === "1") {
    const rounded = Math.round(n * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  }
  const abs = Math.abs(n);
  if (abs >= 100) return String(Math.round(n));
  if (abs >= 10) return (Math.round(n * 10) / 10).toFixed(1);
  return (Math.round(n * 100) / 100).toFixed(2);
}

function quartileGrid(theme, left, top, width, height) {
  if (!theme.grid) return "";
  return [0.25, 0.5, 0.75].map((f) => {
    const x = left + f * width;
    const y = top + f * height;
    return `<line x1="${x}" y1="${top}" x2="${x}" y2="${top + height}" stroke="${theme.grid}" stroke-width="0.25"/>` +
      `<line x1="${left}" y1="${y}" x2="${left + width}" y2="${y}" stroke="${theme.grid}" stroke-width="0.25"/>`;
  }).join("");
}

function svgWrap(theme, width, height, label, body) {
  const bg = theme.bg ? `<rect x="0" y="0" width="${width}" height="${height}" fill="${theme.bg}"/>` : "";
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(label)}">${bg}${body}</svg>`;
}

function yDomain(values, spec) {
  const nums = values.filter((v) => Number.isFinite(v));
  if (!nums.length) return [0, 1];
  let lo = spec.yMin != null ? spec.yMin : Math.min(...nums);
  let hi = spec.yMax != null ? spec.yMax : Math.max(...nums);
  if (spec.yMin == null) {
    const pad = (hi - lo) * 0.08 || 1;
    lo -= pad;
  }
  if (spec.yMax == null) {
    const pad = (hi - lo) * 0.08 || 1;
    hi += pad;
  }
  if (hi <= lo) hi = lo + 1;
  return [lo, hi];
}

function xDomain(values) {
  const nums = values.filter((v) => Number.isFinite(v));
  if (!nums.length) return [0, 1];
  let lo = Math.min(...nums);
  let hi = Math.max(...nums);
  if (hi === lo) {
    lo -= 1;
    hi += 1;
  }
  return [lo, hi];
}

function pickTicks(values) {
  const xs = [...new Set(values.filter((v) => Number.isFinite(v)))].sort((a, b) => a - b);
  if (xs.length <= 12) return xs;
  const step = Math.ceil(xs.length / 10);
  const out = xs.filter((_, i) => i % step === 0);
  if (out[out.length - 1] !== xs[xs.length - 1]) out.push(xs[xs.length - 1]);
  return out;
}

function starTick(x, partialX) {
  const hit = (partialX || []).some((v) => Number(v) === Number(x));
  return hit ? `${x}*` : String(x);
}

/** Marker shapes for multi-series line charts (circle | square | triangle | diamond | star). */
export function markerSymbol(shape, cx, cy, r, fill, stroke) {
  const s = shape || "circle";
  const title = "";
  if (s === "square") {
    const d = r * 1.55;
    return `<rect x="${cx - d / 2}" y="${cy - d / 2}" width="${d}" height="${d}" fill="${fill}" stroke="${stroke}" stroke-width="0.28"/>`;
  }
  if (s === "triangle") {
    const h = r * 1.85;
    const w = r * 1.7;
    return `<polygon points="${cx},${cy - h * 0.65} ${cx - w},${cy + h * 0.45} ${cx + w},${cy + h * 0.45}" fill="${fill}" stroke="${stroke}" stroke-width="0.28" stroke-linejoin="round"/>`;
  }
  if (s === "diamond") {
    const d = r * 1.7;
    return `<polygon points="${cx},${cy - d} ${cx + d},${cy} ${cx},${cy + d} ${cx - d},${cy}" fill="${fill}" stroke="${stroke}" stroke-width="0.28" stroke-linejoin="round"/>`;
  }
  if (s === "star") {
    const outer = r * 1.85;
    const inner = r * 0.75;
    const pts = [];
    for (let i = 0; i < 5; i += 1) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      const b = a + Math.PI / 5;
      pts.push(`${cx + Math.cos(a) * outer},${cy + Math.sin(a) * outer}`);
      pts.push(`${cx + Math.cos(b) * inner},${cy + Math.sin(b) * inner}`);
    }
    return `<polygon points="${pts.join(" ")}" fill="${fill}" stroke="${stroke}" stroke-width="0.25" stroke-linejoin="round"/>`;
  }
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="0.28"/>${title}`;
}

function legendRowPlan(count, opts = {}) {
  if (Array.isArray(opts.rowSizes) && opts.rowSizes.length) {
    const rows = [];
    let left = count;
    for (const size of opts.rowSizes) {
      if (left <= 0) break;
      const n = Math.max(1, Math.min(Number(size) || 1, left));
      rows.push(n);
      left -= n;
    }
    if (left > 0) rows.push(left);
    return rows;
  }
  // Keep ≤4 items on one row so short multi-series legends (e.g. chart 11) do not wrap.
  const cols = opts.cols || (count <= 4 ? count : (count <= 6 ? 3 : 4));
  const rows = [];
  let left = count;
  while (left > 0) {
    const n = Math.min(cols, left);
    rows.push(n);
    left -= n;
  }
  return rows;
}

function onChartLegend(theme, items, left, top, plotW, mode, opts = {}) {
  const list = (items || []).filter((item) => item && item.name);
  if (!list.length) return { svg: "", height: 0 };
  const large = opts.size === "lg";
  const rowH = large ? 5.8 : 4.2;
  const rowSizes = legendRowPlan(list.length, opts);
  const padTop = large ? 1.6 : 1.2;
  const charW = large ? 1.55 : 1.28;
  const markGap = large ? 5.2 : 3.6;
  // One column grid for every row so later rows line up (e.g. Sinner under Nadal).
  const gridCols = Math.max(...rowSizes);
  const colW = plotW / gridCols;
  const maxChars = Math.max(8, Math.floor((colW - (large ? 7.2 : 5.2)) / charW));
  const fontSize = large ? (gridCols >= 4 ? 3.1 : 3.4) : (gridCols >= 4 ? 2.1 : 2.35);
  let cursor = 0;
  const blocks = rowSizes.map((cols, row) => {
    const chunk = list.slice(cursor, cursor + cols);
    cursor += cols;
    return chunk.map((item, col) => {
      const x = left + col * colW + 1.2;
      const y = top + padTop + row * rowH + (large ? 2.1 : 1.6);
      const color = item.color || theme.dot;
      const stroke = theme.dotRing;
      let mark;
      if (mode === "bar") {
        const bw = large ? 3.8 : 2.8;
        const bh = large ? 3.0 : 2.2;
        mark = `<rect x="${x}" y="${y - bh * 0.5}" width="${bw}" height="${bh}" fill="${color}" stroke="${stroke}" stroke-width="0.2"/>`;
      } else {
        mark = markerSymbol(item.shape || "circle", x + (large ? 1.6 : 1.2), y, large ? 1.45 : 1.05, color, stroke);
      }
      const raw = String(item.name);
      const label = raw.length > maxChars ? `${raw.slice(0, Math.max(1, maxChars - 1))}…` : raw;
      const textY = large ? y + 1.15 : y + 0.85;
      return `${mark}<text x="${x + markGap}" y="${textY}" fill="${theme.label}" font-size="${fontSize}" font-family="${AXIS}">${esc(label)}</text>`;
    }).join("");
  }).join("");
  const height = padTop + rowSizes.length * rowH + (large ? 2.0 : 1.4);
  return { svg: blocks, height };
}

export function renderLine(spec, themeName = "page") {
  const theme = useTheme(themeName);
  const series = spec.series || [];
  const points = series.flatMap((row) => row.points || []);
  const [xMin, xMax] = xDomain(points.map((p) => p.x));
  const [yMin, yMax] = yDomain(points.map((p) => p.y), spec);
  const left = 18;
  const right = 6;
  const legendItems = spec.legend || series.map((row) => ({ name: row.name, color: row.color, shape: row.shape }));
  const legend = onChartLegend(theme, legendItems, left, 2.2, 168 - left - right, "line", {
    cols: spec.legendCols,
    rowSizes: spec.legendRowSizes,
    size: spec.legendSize,
  });
  const top = 7 + legend.height;
  const bottom = 16;
  const width = 168;
  const height = 96 + legend.height;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  const sx = (x) => left + ((x - xMin) / (xMax - xMin)) * plotW;
  const sy = (y) => top + (1 - (y - yMin) / (yMax - yMin)) * plotH;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => {
    const value = yMax - f * (yMax - yMin);
    return `<text x="${left - 1.5}" y="${top + f * plotH + 0.8}" text-anchor="end" fill="${theme.tick}" font-size="2.5" font-family="${TICK}">${esc(fmt(value, spec.yFormat))}</text>`;
  }).join("");
  const xTicks = pickTicks(points.map((p) => p.x)).map((x) => {
    return `<text x="${sx(x)}" y="${top + plotH + 4.4}" text-anchor="middle" fill="${theme.tick}" font-size="2.5" font-family="${TICK}">${esc(starTick(x, spec.partialX))}</text>`;
  }).join("");
  const lines = series.map((row) => {
    const color = row.color || theme.dot;
    const stroke = row.highlight ? theme.onStroke : color;
    const widthPx = row.highlight ? 0.7 : 0.45;
    const shape = row.shape || "circle";
    const pts = (row.points || []).filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
    const d = pts.map((p, idx) => `${idx ? "L" : "M"}${sx(p.x).toFixed(2)},${sy(p.y).toFixed(2)}`).join("");
    const path = pts.length > 1 ? `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${widthPx}" stroke-linejoin="round" stroke-linecap="round"/>` : "";
    const dots = pts.map((p) => {
      const fill = row.highlight ? theme.sel : color;
      const title = p.title ? `<title>${esc(p.title)}</title>` : "";
      return `<g>${markerSymbol(shape, sx(p.x), sy(p.y), 1.05, fill, row.highlight ? theme.onStroke : theme.dotRing)}${title}</g>`;
    }).join("");
    return path + dots;
  }).join("");
  const axis = `<text x="${left + plotW / 2}" y="${height - 1.6}" text-anchor="middle" fill="${theme.axis}" font-size="3.1" font-family="${AXIS}">${esc(spec.xLabel || "")}</text>` +
    `<text x="3.4" y="${top + plotH / 2}" text-anchor="middle" fill="${theme.axis}" font-size="3.1" font-family="${AXIS}" transform="rotate(-90 3.4 ${top + plotH / 2})">${esc(spec.yLabel || "")}</text>`;
  const body = legend.svg +
    `<rect x="${left}" y="${top}" width="${plotW}" height="${plotH}" fill="${theme.plotFill}" stroke="${theme.frame}" stroke-width="0.4"/>` +
    quartileGrid(theme, left, top, plotW, plotH) + yTicks + xTicks + lines + axis;
  return svgWrap(theme, width, height, spec.title || spec.yLabel || "Line chart", body);
}

function barFill(theme, series, index) {
  if (series.highlights && series.highlights[index]) return { fill: theme.sel, stroke: theme.onStroke };
  return { fill: series.color || theme.dot, stroke: theme.dotRing };
}

export function renderBars(spec, themeName = "page") {
  if (spec.orient === "h") return renderHorizontalBars(spec, themeName);
  const theme = useTheme(themeName);
  const categories = spec.categories || [];
  const series = spec.series || [];
  const values = series.flatMap((row) => row.values || []).filter((v) => Number.isFinite(v));
  const [yMin, yMax] = yDomain(values, { yMin: spec.yMin != null ? spec.yMin : 0, yMax: spec.yMax });
  const n = Math.max(categories.length, 1);
  const k = Math.max(series.length, 1);
  const longLabel = categories.some((label) => String(label).length > 6);
  const rotate = categories.length > 8 && longLabel;
  const left = 18;
  const right = 5;
  const width = Math.max(168, left + right + n * (k > 2 ? 16 : 12));
  const legendItems = spec.legend === false
    ? []
    : (spec.legend || (series.length > 1 ? series.map((row) => ({ name: row.name, color: row.color })) : []));
  const legend = onChartLegend(theme, legendItems, left, 2.2, width - left - right, "bar", {
    cols: spec.legendCols,
    size: spec.legendSize,
  });
  const top = 7 + legend.height;
  const bottom = rotate ? 26 : 16;
  const height = (rotate ? 108 : 96) + legend.height;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  const groupW = plotW / n;
  const inner = groupW * 0.72;
  const barW = inner / k;
  const sy = (y) => top + (1 - (y - yMin) / (yMax - yMin)) * plotH;
  const base = sy(Math.max(yMin, Math.min(yMax, 0)));
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => {
    const value = yMax - f * (yMax - yMin);
    return `<text x="${left - 1.5}" y="${top + f * plotH + 0.8}" text-anchor="end" fill="${theme.tick}" font-size="2.5" font-family="${TICK}">${esc(fmt(value, spec.yFormat))}</text>`;
  }).join("");
  const bars = categories.map((label, i) => {
    const gx = left + i * groupW + (groupW - inner) / 2;
    const rects = series.map((row, s) => {
      const value = Number(row.values?.[i]);
      if (!Number.isFinite(value)) return "";
      const y = sy(value);
      const h = Math.max(0.35, Math.abs(base - y));
      const paint = barFill(theme, row, i);
      const title = `${label}: ${row.name || ""} ${fmt(value, spec.yFormat)}`;
      return `<rect x="${gx + s * barW}" y="${Math.min(y, base)}" width="${Math.max(barW - 0.35, 0.4)}" height="${h}" fill="${paint.fill}" stroke="${paint.stroke}" stroke-width="0.28"><title>${esc(title)}</title></rect>`;
    }).join("");
    const lx = left + i * groupW + groupW / 2;
    const ly = top + plotH + (rotate ? 1.4 : 4.2);
    const tick = rotate
      ? `<text x="${lx}" y="${ly}" text-anchor="end" fill="${theme.tick}" font-size="2.15" font-family="${TICK}" transform="rotate(-52 ${lx} ${ly})">${esc(label)}</text>`
      : `<text x="${lx}" y="${ly}" text-anchor="middle" fill="${theme.tick}" font-size="2.4" font-family="${TICK}">${esc(label)}</text>`;
    return rects + tick;
  }).join("");
  const axis = `<text x="${left + plotW / 2}" y="${height - 1.5}" text-anchor="middle" fill="${theme.axis}" font-size="3.1" font-family="${AXIS}">${esc(spec.xLabel || "")}</text>` +
    `<text x="3.4" y="${top + plotH / 2}" text-anchor="middle" fill="${theme.axis}" font-size="3.1" font-family="${AXIS}" transform="rotate(-90 3.4 ${top + plotH / 2})">${esc(spec.yLabel || "")}</text>`;
  const body = legend.svg +
    `<rect x="${left}" y="${top}" width="${plotW}" height="${plotH}" fill="${theme.plotFill}" stroke="${theme.frame}" stroke-width="0.4"/>` +
    quartileGrid(theme, left, top, plotW, plotH) + yTicks + bars + axis;
  return svgWrap(theme, width, height, spec.title || spec.yLabel || "Bar chart", body);
}

function renderHorizontalBars(spec, themeName) {
  const theme = useTheme(themeName);
  const categories = spec.categories || [];
  const series = spec.series || [];
  const values = series.flatMap((row) => row.values || []).filter((v) => Number.isFinite(v));
  const [xMin, xMax] = yDomain(values, { yMin: spec.yMin != null ? spec.yMin : 0, yMax: spec.yMax });
  const longest = categories.reduce((n, label) => Math.max(n, String(label).length), 4);
  const labelW = Math.max(32, longest * 1.55);
  const rowH = 4.8;
  const right = 8;
  const plotW = 86;
  const width = labelW + plotW + right;
  const legendItems = spec.legend === false
    ? []
    : (spec.legend || []);
  const legend = onChartLegend(theme, legendItems, labelW, 2.2, plotW, "bar", {
    cols: spec.legendCols,
    size: spec.legendSize,
  });
  const top = 8 + legend.height;
  const bottom = 12;
  const height = top + bottom + Math.max(categories.length, 1) * rowH;
  const sx = (v) => labelW + ((v - xMin) / (xMax - xMin)) * plotW;
  const base = sx(Math.max(xMin, Math.min(xMax, 0)));
  const tickY = Math.max(4.2, top - 2.4);
  const xTicks = [0, 0.5, 1].map((f) => {
    const value = xMin + f * (xMax - xMin);
    const x = labelW + f * plotW;
    return `<text x="${x}" y="${tickY}" text-anchor="middle" fill="${theme.tick}" font-size="2.4" font-family="${TICK}">${esc(fmt(value, spec.yFormat))}</text>`;
  }).join("");
  const rows = categories.map((label, i) => {
    const y = top + i * rowH;
    const value = Number(series[0]?.values?.[i]);
    const paint = barFill(theme, series[0] || {}, i);
    let rect = "";
    if (Number.isFinite(value)) {
      const x = sx(value);
      const w = Math.max(0.4, Math.abs(x - base));
      rect = `<rect x="${Math.min(x, base)}" y="${y + 0.7}" width="${w}" height="${rowH - 1.5}" fill="${paint.fill}" stroke="${paint.stroke}" stroke-width="0.28"><title>${esc(label)}</title></rect>`;
    }
    const text = `<text x="${labelW - 1.6}" y="${y + rowH / 2 + 0.7}" text-anchor="end" fill="${theme.tick}" font-size="2.35" font-family="${TICK}">${esc(label)}</text>`;
    return rect + text;
  }).join("");
  const grid = theme.grid ? [0.25, 0.5, 0.75].map((f) => {
    const x = labelW + f * plotW;
    return `<line x1="${x}" y1="${top}" x2="${x}" y2="${top + categories.length * rowH}" stroke="${theme.grid}" stroke-width="0.25"/>`;
  }).join("") : "";
  const axis = `<text x="${labelW + plotW / 2}" y="${height - 1.4}" text-anchor="middle" fill="${theme.axis}" font-size="3" font-family="${AXIS}">${esc(spec.xLabel || spec.yLabel || "")}</text>`;
  const body = legend.svg +
    `<rect x="${labelW}" y="${top}" width="${plotW}" height="${categories.length * rowH}" fill="${theme.plotFill}" stroke="${theme.frame}" stroke-width="0.4"/>` +
    grid + xTicks + rows + axis;
  return svgWrap(theme, width, height, spec.title || "Bar chart", body);
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function mixHex(a, b, t) {
  const pa = hexToRgb(a);
  const pb = hexToRgb(b);
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

export function renderHeatmap(spec, themeName = "page") {
  const theme = useTheme(themeName);
  const rows = spec.rows || [];
  const cols = spec.cols || [];
  const cells = spec.cells || [];
  const values = cells.map((cell) => Number(cell.value)).filter((v) => Number.isFinite(v));
  const lo = values.length ? Math.min(...values) : 0;
  const hi = values.length ? Math.max(...values) : 1;
  const span = hi === lo ? 1 : hi - lo;
  const longest = rows.reduce((n, label) => Math.max(n, String(label).length), 4);
  const left = Math.max(30, longest * 1.62);
  const top = 4;
  const cellW = 6.4;
  const cellH = 5.1;
  const bottom = 18;
  const right = 4;
  const width = left + Math.max(cols.length, 1) * cellW + right;
  const height = top + Math.max(rows.length, 1) * cellH + bottom;
  const lookup = new Map(cells.map((cell) => [`${cell.row}::${cell.col}`, cell]));
  const partial = new Set((spec.partialX || []).map((v) => String(v)));
  const rects = rows.map((row, r) => cols.map((col, c) => {
    const cell = lookup.get(`${row}::${col}`);
    const x = left + c * cellW;
    const y = top + r * cellH;
    if (!cell || !Number.isFinite(Number(cell.value))) {
      return `<rect x="${x + 0.15}" y="${y + 0.15}" width="${cellW - 0.3}" height="${cellH - 0.3}" fill="${theme.plotFill}" stroke="${theme.grid || theme.frame}" stroke-width="0.2"/>`;
    }
    const t = (Number(cell.value) - lo) / span;
    const fill = mixHex("#fbf8f1", "#102117", t);
    const label = cell.title || `${row} ${col}: ${fmt(cell.value, spec.yFormat)}`;
    return `<rect x="${x + 0.15}" y="${y + 0.15}" width="${cellW - 0.3}" height="${cellH - 0.3}" fill="${fill}" stroke="${theme.frame}" stroke-width="0.15"><title>${esc(label)}</title></rect>`;
  }).join("")).join("");
  const rowLabels = rows.map((row, r) => {
    const y = top + r * cellH + cellH / 2 + 0.7;
    return `<text x="${left - 1.3}" y="${y}" text-anchor="end" fill="${theme.tick}" font-size="2.15" font-family="${TICK}">${esc(row)}</text>`;
  }).join("");
  const colLabels = cols.map((col, c) => {
    const x = left + c * cellW + cellW / 2;
    const y = top + rows.length * cellH + 1.5;
    const text = partial.has(String(col)) ? `${col}*` : col;
    return `<text x="${x}" y="${y}" text-anchor="end" fill="${theme.tick}" font-size="2.05" font-family="${TICK}" transform="rotate(-55 ${x} ${y})">${esc(text)}</text>`;
  }).join("");
  const legendW = Math.min(36, cols.length * cellW);
  const legendX = left;
  const legendY = height - 6.2;
  const stops = [0, 0.25, 0.5, 0.75, 1].map((t) => {
    const x = legendX + t * legendW;
    return `<rect x="${x}" y="${legendY}" width="${legendW / 5 + 0.2}" height="2.2" fill="${mixHex("#fbf8f1", "#102117", t)}"/>`;
  }).join("");
  const legend = stops +
    `<text x="${legendX}" y="${legendY + 4.6}" text-anchor="start" fill="${theme.tick}" font-size="2.1" font-family="${TICK}">${esc(fmt(lo, spec.yFormat))}</text>` +
    `<text x="${legendX + legendW}" y="${legendY + 4.6}" text-anchor="end" fill="${theme.tick}" font-size="2.1" font-family="${TICK}">${esc(fmt(hi, spec.yFormat))}</text>` +
    `<text x="${legendX + legendW + 2}" y="${legendY + 1.7}" fill="${theme.axis}" font-size="2.3" font-family="${AXIS}">${esc(spec.yLabel || "")}</text>`;
  const frame = `<rect x="${left}" y="${top}" width="${cols.length * cellW}" height="${rows.length * cellH}" fill="none" stroke="${theme.frame}" stroke-width="0.4"/>`;
  return svgWrap(theme, width, height, spec.title || "Heatmap", rects + rowLabels + colLabels + frame + legend);
}
