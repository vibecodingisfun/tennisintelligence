const STYLE_COLOR = {
  attacker: "#c9e21f",
  counterpuncher: "#245f86",
  grinder: "#c45a1a",
  pusher: "#3d8a4a",
  "all-court": "#5c6b5e",
};

const AXES = ["Serve", "Return", "Safety", "Winners", "Control"];

export function esc(v) {
  return String(v ?? "—").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

export function lastName(name) {
  const parts = String(name || "").split(" ");
  return parts[parts.length - 1] || name;
}

export function styleColor(style) {
  return STYLE_COLOR[style] || "#5c6b5e";
}

/** Values for the five spokes. Control is the reverse of unforced-error percentile. */
export function spokeValues(p) {
  return [
    p.serve_pct,
    p.return_pct,
    p.safety_pct,
    p.winner_pct,
    p.ufe_pct == null ? null : Math.max(0, 1 - p.ufe_pct),
  ];
}

export function radarSvg(p, { size = 220 } = {}) {
  const values = spokeValues(p);
  const cx = size / 2;
  const cy = size * 0.48;
  const radius = size * 0.26;
  const n = values.length;
  const at = (i, v) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const rr = radius * (v == null ? 0 : v);
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
  };
  const ring = (scale) => values.map((_, i) => at(i, scale).join(",")).join(" ");
  const poly = values.map((v, i) => at(i, v == null ? 0 : v).join(",")).join(" ");
  const color = styleColor(p.style);
  const spokes = values.map((_, i) => {
    const [x, y] = at(i, 1);
    return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="rgba(16,33,23,0.14)" stroke-width="1" />`;
  }).join("");
  const labels = values.map((v, i) => {
    const [x, y] = at(i, 1.38);
    const fill = v == null ? "rgba(76,94,82,0.45)" : "#4c5e52";
    return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" fill="${fill}" font-size="${size * 0.042}" font-family="IBM Plex Mono, monospace">${esc(AXES[i])}</text>`;
  }).join("");
  const who = lastName(p.name);
  const nameSize = who.length > 12 ? size * 0.038 : who.length > 8 ? size * 0.045 : size * 0.055;
  return `<svg class="radar" viewBox="0 0 ${size} ${size * 0.92}" role="img" aria-label="${esc(p.name)} playing-style radar">
    <polygon points="${ring(1)}" fill="none" stroke="rgba(16,33,23,0.22)" stroke-width="1" />
    <polygon points="${ring(0.5)}" fill="none" stroke="rgba(16,33,23,0.12)" stroke-width="1" />
    ${spokes}
    <polygon points="${poly}" fill="${color}" fill-opacity="0.38" stroke="${color}" stroke-width="1.8" />
    <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" fill="#102117" font-size="${nameSize}" font-family="Syne, sans-serif" font-weight="700">${esc(who)}</text>
    ${labels}
  </svg>`;
}

export function radarCard(p, { group } = {}) {
  const rank = p.rank != null ? `#${p.rank}` : group === "big3" ? "Big 3" : "";
  const bits = [rank, p.style, p.stability].filter(Boolean);
  return `<article class="radar-card" data-style="${esc(p.style)}">
    <div class="radar-fig">${radarSvg(p)}</div>
    <h3>${esc(p.name)}</h3>
    <p class="radar-meta"><i style="background:${styleColor(p.style)}"></i>${esc(bits.join(" · "))}</p>
  </article>`;
}

export { STYLE_COLOR, AXES };
