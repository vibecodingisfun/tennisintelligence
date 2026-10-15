import { VB } from "./chart-config.js";
import { renderSvg } from "./chart-render.js";

function drawLogo(ctx, width, height) {
  const label = "TennisIntelligence.Org";
  ctx.save();
  ctx.font = "700 22px Syne, sans-serif";
  ctx.fillStyle = "#14241c";
  ctx.textBaseline = "middle";
  const textW = ctx.measureText(label).width;
  const courtW = 62;
  const gap = 12;
  const right = width - 28;
  const midY = height - 28;
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

export async function exportPng(spec, players, index) {
  await document.fonts.ready;
  const scale = 8;
  const width = VB * scale;
  const chartH = VB * scale;
  const { svg } = renderSvg(spec, players, index, { theme: "export" });
  const xml = svg.replace("<svg ", `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${chartH}" `);
  const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("chart image"));
      el.src = url;
    });
    const measure = document.createElement("canvas").getContext("2d");
    measure.font = "400 18px IBM Plex Mono, ui-monospace, monospace";
    const lines = [];
    shareNotes(spec).forEach((line, i) => {
      if (i) lines.push("");
      wrapText(measure, line, width - 56).forEach((part) => lines.push(part));
    });
    const lineH = 26;
    const notesH = 12 + lines.length * lineH + 8;
    const logoH = 40;
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
    return await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function saveChart(spec, players, index) {
  const blob = await exportPng(spec, players, index);
  const fileUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = fileUrl;
  a.download = spec.file;
  a.click();
  setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
}
