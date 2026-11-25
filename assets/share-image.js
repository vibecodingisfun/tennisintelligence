/** Share a PNG as an image (Messages, WeChat, etc.), not a generic download file. */

function asPngFile(blob, filename) {
  const name = String(filename || "chart.png").endsWith(".png")
    ? String(filename || "chart.png")
    : `${filename || "chart"}.png`;
  const png = blob.type === "image/png" ? blob : new Blob([blob], { type: "image/png" });
  return new File([png], name, { type: "image/png", lastModified: Date.now() });
}

function downloadFile(file) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function canSharePayload(payload) {
  if (typeof navigator.share !== "function") return false;
  if (typeof navigator.canShare === "function") {
    try {
      return navigator.canShare(payload);
    } catch {
      return false;
    }
  }
  return true;
}

async function tryShare(payload) {
  if (!canSharePayload(payload)) return null;
  try {
    await navigator.share(payload);
    return "shared";
  } catch (err) {
    if (err && err.name === "AbortError") return "aborted";
    return null;
  }
}

/**
 * Prefer the system share sheet with a real image/png File.
 * Fall back to clipboard (desktop) or a download.
 * Call this from a click handler with a blob already prepared —
 * awaiting heavy work before share() drops the user gesture on iOS.
 * @returns {"shared"|"copied"|"saved"|"aborted"}
 */
export async function shareImage(blob, { filename, title = "Tennis Intelligence" } = {}) {
  if (!blob) throw new Error("No image");
  const file = asPngFile(blob, filename);

  // Title only when possible — url/text makes many targets treat this as a link.
  // Some phones reject title+files; retry files-only.
  let result = await tryShare({ files: [file], title });
  if (result == null) result = await tryShare({ files: [file] });
  if (result === "shared" || result === "aborted") return result;

  const desktop = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (desktop && window.isSecureContext && navigator.clipboard && typeof ClipboardItem !== "undefined") {
    try {
      const item = new ClipboardItem({ "image/png": Promise.resolve(file) });
      await navigator.clipboard.write([item]);
      return "copied";
    } catch {
      // Fall through.
    }
  }

  downloadFile(file);
  return "saved";
}
