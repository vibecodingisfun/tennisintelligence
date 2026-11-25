const MAX_NAME = 80;
const MAX_BODY = 2000;
const LIST_LIMIT = 50;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX = 5;

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extra,
    },
  });
}

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  const allow = origin.endsWith("tennisintelligence.org")
    || origin.endsWith(".tennisintelligence.pages.dev")
    || origin.startsWith("http://127.0.0.1:")
    || origin.startsWith("http://localhost:");
  return allow
    ? {
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
      "access-control-allow-headers": "content-type, x-admin-secret, x-delete-token",
      vary: "Origin",
    }
    : {};
}

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const enc = new TextEncoder();
  const left = enc.encode(a);
  const right = enc.encode(b);
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left[i] ^ right[i];
  return diff === 0;
}

function clientIp(request) {
  return request.headers.get("CF-Connecting-IP")
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "";
}

function cleanName(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_NAME);
}

function cleanBody(value) {
  return String(value ?? "").replace(/\r\n/g, "\n").trim().slice(0, MAX_BODY);
}

async function ensureSchema(db) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS chart_requests (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL,
      created_at TEXT NOT NULL,
      ip_hash TEXT NOT NULL DEFAULT '',
      delete_token_hash TEXT NOT NULL DEFAULT ''
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_chart_requests_created
      ON chart_requests (created_at DESC)`),
  ]);
  try {
    await db.prepare(
      `ALTER TABLE chart_requests ADD COLUMN delete_token_hash TEXT NOT NULL DEFAULT ''`,
    ).run();
  } catch {
    // column already exists
  }
}

export async function onRequestOptions(context) {
  return new Response(null, { status: 204, headers: corsHeaders(context.request) });
}

export async function onRequestGet(context) {
  const headers = corsHeaders(context.request);
  const db = context.env.DB;
  if (!db) return json({ error: "Board storage is not configured." }, 503, headers);
  try {
    await ensureSchema(db);
    const { results } = await db.prepare(
      `SELECT id, name, body, created_at
       FROM chart_requests
       ORDER BY created_at DESC
       LIMIT ?`,
    ).bind(LIST_LIMIT).all();
    return json({ requests: results || [] }, 200, headers);
  } catch (err) {
    console.error("requests GET", err);
    return json({ error: "Could not load requests." }, 500, headers);
  }
}

export async function onRequestPost(context) {
  const headers = corsHeaders(context.request);
  const db = context.env.DB;
  if (!db) return json({ error: "Board storage is not configured." }, 503, headers);

  let payload;
  try {
    payload = await context.request.json();
  } catch {
    return json({ error: "Send JSON with a body field." }, 400, headers);
  }

  // Honeypot — bots fill hidden "website" field.
  if (payload.website) return json({ ok: true, id: "ok" }, 201, headers);

  const name = cleanName(payload.name);
  const body = cleanBody(payload.body);
  if (body.length < 8) return json({ error: "Write a bit more detail (at least a short sentence)." }, 400, headers);
  if (body.length > MAX_BODY) return json({ error: "That request is too long." }, 400, headers);

  try {
    await ensureSchema(db);
    const ip = clientIp(context.request);
    const ipHash = ip ? await sha256Hex(ip) : "";
    if (ipHash) {
      const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
      const row = await db.prepare(
        `SELECT COUNT(*) AS n FROM chart_requests
         WHERE ip_hash = ? AND created_at >= ?`,
      ).bind(ipHash, since).first();
      if (Number(row?.n || 0) >= RATE_MAX) {
        return json({ error: "Too many posts from this network. Try again later." }, 429, headers);
      }
    }

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const deleteToken = crypto.randomUUID();
    const deleteTokenHash = await sha256Hex(deleteToken);
    await db.prepare(
      `INSERT INTO chart_requests (id, name, body, created_at, ip_hash, delete_token_hash)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).bind(id, name, body, createdAt, ipHash, deleteTokenHash).run();

    return json({
      ok: true,
      id,
      created_at: createdAt,
      name,
      body,
      delete_token: deleteToken,
    }, 201, headers);
  } catch (err) {
    console.error("requests POST", err);
    return json({ error: "Could not save that request." }, 500, headers);
  }
}

export async function onRequestDelete(context) {
  const headers = corsHeaders(context.request);
  const db = context.env.DB;
  if (!db) return json({ error: "Board storage is not configured." }, 503, headers);

  const url = new URL(context.request.url);
  let id = url.searchParams.get("id") || "";
  let deleteToken = context.request.headers.get("x-delete-token") || "";
  const adminHeader = context.request.headers.get("x-admin-secret") || "";

  try {
    const contentType = context.request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const payload = await context.request.json().catch(() => ({}));
      if (!id && payload.id) id = String(payload.id);
      if (!deleteToken && payload.delete_token) deleteToken = String(payload.delete_token);
    }
  } catch {
    // ignore body parse errors
  }

  id = String(id || "").trim();
  if (!id) return json({ error: "Missing post id." }, 400, headers);

  const adminSecret = context.env.BOARD_ADMIN_SECRET || "";
  const isAdmin = adminSecret && timingSafeEqual(adminHeader, adminSecret);

  try {
    await ensureSchema(db);
    const row = await db.prepare(
      `SELECT id, delete_token_hash FROM chart_requests WHERE id = ?`,
    ).bind(id).first();
    if (!row) return json({ error: "Post not found." }, 404, headers);

    if (!isAdmin) {
      if (!deleteToken) return json({ error: "Missing delete token." }, 401, headers);
      const hash = await sha256Hex(deleteToken);
      if (!row.delete_token_hash || !timingSafeEqual(hash, row.delete_token_hash)) {
        return json({ error: "Not allowed to delete this post." }, 403, headers);
      }
    }

    await db.prepare(`DELETE FROM chart_requests WHERE id = ?`).bind(id).run();
    return json({ ok: true, id }, 200, headers);
  } catch (err) {
    console.error("requests DELETE", err);
    return json({ error: "Could not delete that request." }, 500, headers);
  }
}
