const STORAGE_KEY = "ti-board-delete-tokens";
const ADMIN_KEY = "ti-board-admin-secret";

const listEl = document.getElementById("request-list");
const form = document.getElementById("request-form");
const statusEl = document.getElementById("request-status");
const submitBtn = document.getElementById("request-submit");
const adminBtn = document.getElementById("board-admin");
const adminStatus = document.getElementById("board-admin-status");

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

function readTokens() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function writeTokens(map) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function saveToken(id, token) {
  if (!id || !token) return;
  const map = readTokens();
  map[id] = token;
  writeTokens(map);
}

function clearToken(id) {
  const map = readTokens();
  delete map[id];
  writeTokens(map);
}

function getAdminSecret() {
  return sessionStorage.getItem(ADMIN_KEY) || "";
}

function setAdminSecret(value) {
  if (value) sessionStorage.setItem(ADMIN_KEY, value);
  else sessionStorage.removeItem(ADMIN_KEY);
  paintAdminStatus();
}

function paintAdminStatus() {
  if (!adminStatus) return;
  adminStatus.textContent = getAdminSecret() ? "Admin mode on — you can delete any post." : "";
  if (adminBtn) adminBtn.textContent = getAdminSecret() ? "Exit admin" : "Admin";
}

function formatWhen(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function canDelete(id) {
  return Boolean(getAdminSecret() || readTokens()[id]);
}

function renderList(requests) {
  if (!listEl) return;
  if (!requests.length) {
    listEl.innerHTML = `<p class="hint">No requests yet. Be the first.</p>`;
    return;
  }
  listEl.innerHTML = `<ol class="request-items">${requests.map((row) => {
    const who = row.name ? esc(row.name) : "Anonymous";
    const del = canDelete(row.id)
      ? `<button type="button" class="text-btn delete" data-id="${esc(row.id)}">Delete</button>`
      : "";
    return `<li>
      <header>
        <span class="who">${who}</span>
        <span class="meta">
          <time datetime="${esc(row.created_at)}">${esc(formatWhen(row.created_at))}</time>
          ${del}
        </span>
      </header>
      <p>${esc(row.body)}</p>
    </li>`;
  }).join("")}</ol>`;
}

async function loadList() {
  if (!listEl) return;
  listEl.innerHTML = `<p class="hint">Loading…</p>`;
  try {
    const res = await fetch("/api/requests", { headers: { accept: "application/json" } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.statusText);
    renderList(data.requests || []);
  } catch (err) {
    listEl.innerHTML = `<p class="load-error">Could not load the board.</p>`;
    console.error(err);
  }
}

async function deletePost(id) {
  const headers = {
    accept: "application/json",
    "content-type": "application/json",
  };
  const admin = getAdminSecret();
  const token = readTokens()[id];
  if (admin) headers["x-admin-secret"] = admin;
  if (token) headers["x-delete-token"] = token;
  const res = await fetch(`/api/requests?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers,
    body: JSON.stringify({ id, delete_token: token || undefined }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not delete.");
  clearToken(id);
}

async function onSubmit(event) {
  event.preventDefault();
  if (!form || !submitBtn) return;
  const fd = new FormData(form);
  const payload = {
    name: String(fd.get("name") || ""),
    body: String(fd.get("body") || ""),
    website: String(fd.get("website") || ""),
  };
  submitBtn.disabled = true;
  if (statusEl) statusEl.textContent = "Posting…";
  try {
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Could not post.");
    if (data.id && data.delete_token) saveToken(data.id, data.delete_token);
    form.reset();
    if (statusEl) {
      statusEl.textContent = "Posted. You can delete this post from this browser.";
    }
    await loadList();
  } catch (err) {
    if (statusEl) statusEl.textContent = err.message || "Could not post.";
  } finally {
    submitBtn.disabled = false;
  }
}

if (listEl) {
  listEl.addEventListener("click", async (event) => {
    const btn = event.target.closest("button.delete");
    if (!btn) return;
    const id = btn.getAttribute("data-id");
    if (!id) return;
    if (!window.confirm("Delete this request?")) return;
    btn.disabled = true;
    try {
      await deletePost(id);
      await loadList();
    } catch (err) {
      window.alert(err.message || "Could not delete.");
      btn.disabled = false;
    }
  });
}

if (adminBtn) {
  adminBtn.addEventListener("click", () => {
    if (getAdminSecret()) {
      setAdminSecret("");
      loadList();
      return;
    }
    const value = window.prompt("Admin secret");
    if (!value) return;
    setAdminSecret(value.trim());
    loadList();
  });
}

// Optional: /data/#admin=<secret> unlocks admin once, then strips the hash.
if (location.hash.startsWith("#admin=")) {
  const secret = decodeURIComponent(location.hash.slice("#admin=".length));
  if (secret) {
    setAdminSecret(secret);
    history.replaceState(null, "", `${location.pathname}${location.search}#request`);
  }
}

if (form) form.addEventListener("submit", onSubmit);
paintAdminStatus();
loadList();
