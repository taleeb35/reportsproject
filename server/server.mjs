// Self-hosted backend for theannualreports.com
// Replaces Supabase: JSON document store (SQLite), admin auth, file storage, static site.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import bcrypt from "bcryptjs";

const PORT = Number(process.env.PORT || 3000);
const HOME = process.env.APP_HOME || "/home/theannualreports";
const DIST = process.env.DIST_DIR || path.join(HOME, "htdocs/theannualreports.com/current/dist");
const DATA = process.env.DATA_DIR || path.join(HOME, "data");
const FILES = process.env.FILES_DIR || path.join(HOME, "storage");
const SITE = process.env.SITE_URL || "https://theannualreports.com";
const OLD_PUBLIC = "https://jkairzdzetkianvzsgfc.supabase.co/storage/v1/object/public/";
const NEW_PUBLIC = SITE + "/storage/v1/object/public/";
const BUCKETS = new Set(["content-files"]);

fs.mkdirSync(DATA, { recursive: true });
fs.mkdirSync(FILES, { recursive: true });

const secretFile = path.join(DATA, "secret.key");
if (!fs.existsSync(secretFile)) fs.writeFileSync(secretFile, crypto.randomBytes(48).toString("hex"), { mode: 0o600 });
const SECRET = fs.readFileSync(secretFile, "utf8").trim();

const db = new DatabaseSync(path.join(DATA, "app.db"));
db.exec(`PRAGMA journal_mode=WAL;
  CREATE TABLE IF NOT EXISTS docs (tbl TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, PRIMARY KEY (tbl, id));
  CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT);`);

const TABLES = new Set(("about_advantage about_experience about_hero client_logos company_values content_categories " +
  "content_items faqs footer_settings home_hero home_service_section home_statistics infographics inquiries " +
  "portfolio_items profiles statistics testimonials timeline_items user_roles").split(" "));
const PRIVATE_READ = new Set(["inquiries", "profiles", "user_roles"]);
const PUBLIC_INSERT = new Set(["inquiries"]);

const getMeta = (k) => db.prepare("SELECT v FROM meta WHERE k=?").get(k)?.v ?? null;
const setMeta = (k, v) => db.prepare("INSERT INTO meta(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v").run(k, v);
const rowsOf = (t) => db.prepare("SELECT data FROM docs WHERE tbl=?").all(t).map((r) => JSON.parse(r.data));
const putRow = (t, row) => db.prepare("INSERT INTO docs(tbl,id,data) VALUES(?,?,?) ON CONFLICT(tbl,id) DO UPDATE SET data=excluded.data").run(t, String(row.id), JSON.stringify(row));
const delRow = (t, id) => db.prepare("DELETE FROM docs WHERE tbl=? AND id=?").run(t, String(id));
const tx = (fn) => { db.exec("BEGIN"); try { const r = fn(); db.exec("COMMIT"); return r; } catch (e) { db.exec("ROLLBACK"); throw e; } };

// ---------- auth ----------
const b64 = (s) => Buffer.from(s).toString("base64url");
const sign = (p) => crypto.createHmac("sha256", SECRET).update(p).digest("base64url");
function makeToken(user) {
  const payload = b64(JSON.stringify({ sub: user.id, email: user.email, exp: Math.floor(Date.now() / 1000) + 7 * 86400 }));
  return payload + "." + sign(payload);
}
function authUser(req) {
  const h = req.headers.authorization || "";
  const tok = h.startsWith("Bearer ") ? h.slice(7) : "";
  const [p, s] = tok.split(".");
  if (!p || !s || s.length !== sign(p).length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(sign(p)))) return null;
  const claims = JSON.parse(Buffer.from(p, "base64url").toString());
  if (claims.exp * 1000 < Date.now()) return null;
  return { id: claims.sub, email: claims.email };
}
const isAdmin = (u) => !!u && rowsOf("user_roles").some((r) => r.user_id === u.id && r.role === "admin");
const users = () => JSON.parse(getMeta("users") || "[]");

// ---------- query engine (dataset is tiny: filter in memory) ----------
const cmp = (a, b) => {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0;
};
const same = (a, b) => a === b || (a != null && b != null && String(a) === String(b));
function test(row, [col, op, val]) {
  const v = row[col];
  switch (op) {
    case "eq": return same(v, val);
    case "neq": return !same(v, val);
    case "gt": return v != null && cmp(v, val) > 0;
    case "gte": return v != null && cmp(v, val) >= 0;
    case "lt": return v != null && cmp(v, val) < 0;
    case "lte": return v != null && cmp(v, val) <= 0;
    case "in": return (val || []).some((x) => same(v, x));
    case "is": return val === null ? v == null : v === val;
    case "like": case "ilike": {
      const re = new RegExp("^" + String(val).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*").replace(/_/g, ".") + "$", op === "ilike" ? "i" : "");
      return v != null && re.test(String(v));
    }
    default: throw new Error("Unsupported filter " + op);
  }
}
// PostgREST-style select: "*, content_categories ( name )" embeds the many-to-one relation.
const EMBED_FK = { content_categories: "category_id" };
function splitTop(s) {
  const parts = []; let depth = 0, cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) { parts.push(cur.trim()); cur = ""; } else cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}
function pick(rows, cols) {
  if (!cols || cols.trim() === "*") return rows;
  const items = splitTop(cols).map((it) => {
    const m = /^(?:(\w+):)?\s*(\w+)\s*\(([\s\S]*)\)$/.exec(it);
    return m ? { embed: m[2], as: m[1] || m[2], cols: m[3] } : { col: it };
  });
  const related = {};
  for (const it of items) if (it.embed && TABLES.has(it.embed)) related[it.embed] = new Map(rowsOf(it.embed).map((r) => [String(r.id), r]));
  return rows.map((r) => {
    const out = {};
    for (const it of items) {
      if (it.col === "*") Object.assign(out, r);
      else if (it.col) out[it.col] = r[it.col] ?? null;
      else {
        const fk = EMBED_FK[it.embed];
        const target = fk && r[fk] != null ? related[it.embed]?.get(String(r[fk])) : null;
        out[it.as] = target ? pick([target], it.cols)[0] : null;
      }
    }
    return out;
  });
}
function withDefaults(t, row) {
  const now = new Date().toISOString();
  const defs = JSON.parse(getMeta("defaults") || "{}");
  const out = { ...row };
  if (out.id == null) out.id = crypto.randomUUID();
  if (out.created_at == null) out.created_at = now;
  if (t !== "user_roles" && out.updated_at == null) out.updated_at = now;
  for (const [k, v] of Object.entries(defs)) {
    const [tt, col] = k.split(".");
    if (tt === t && out[col] === undefined) out[col] = v;
  }
  return out;
}

function runQuery(q, user) {
  const t = q.table;
  if (!TABLES.has(t)) return [404, { error: "Unknown table " + t }];
  const admin = isAdmin(user);
  const op = q.op || "select";
  if (op === "select" && PRIVATE_READ.has(t) && !user) return [401, { error: "Not authenticated" }];
  if (op !== "select" && !admin && !(op === "insert" && PUBLIC_INSERT.has(t))) return [403, { error: "Not allowed" }];
  // a signed-in non-admin may only read their own role row
  const filters = q.filters || [];

  let result;
  if (op === "insert" || op === "upsert") {
    const list = (Array.isArray(q.values) ? q.values : [q.values]).map((v) => withDefaults(t, v));
    if (op === "insert" && !admin && PUBLIC_INSERT.has(t)) for (const r of list) { r.status = "Pending"; }
    tx(() => list.forEach((r) => {
      if (op === "upsert") { const old = rowsOf(t).find((x) => same(x.id, r.id)); if (old) Object.assign(r, { ...old, ...r, updated_at: new Date().toISOString() }); }
      putRow(t, r);
    }));
    result = list;
  } else {
    let rows = rowsOf(t).filter((r) => filters.every((f) => test(r, f)));
    if (op === "update") {
      if (!filters.length) return [400, { error: "UPDATE requires a filter" }];
      const now = new Date().toISOString();
      rows = rows.map((r) => ({ ...r, ...q.values, ...(t !== "user_roles" ? { updated_at: now } : {}) }));
      tx(() => rows.forEach((r) => putRow(t, r)));
    } else if (op === "delete") {
      if (!filters.length) return [400, { error: "DELETE requires a filter" }];
      tx(() => rows.forEach((r) => delRow(t, r.id)));
    }
    result = rows;
  }
  if (PRIVATE_READ.has(t) && !admin) result = result.filter((r) => op !== "select" || r.user_id === user?.id || r.id === user?.id);

  for (const [col, asc] of [...(q.order || [])].reverse()) result = [...result].sort((a, b) => (asc ? 1 : -1) * cmp(a[col], b[col]) || 0);
  const count = result.length;
  if (q.offset) result = result.slice(q.offset);
  if (q.limit != null) result = result.slice(0, q.limit);
  result = pick(result, op === "select" ? q.columns : q.returning);
  if (q.head) result = null;
  if (q.single === "one") {
    if (result.length !== 1) return [406, { error: "JSON object requested, multiple (or no) rows returned", code: "PGRST116" }];
    result = result[0];
  } else if (q.single === "maybe") {
    if (result.length > 1) return [406, { error: "multiple rows returned", code: "PGRST116" }];
    result = result[0] ?? null;
  }
  return [200, { data: result, count: q.count ? count : null }];
}

// ---------- helpers ----------
const MIME = { ".html": "text/html; charset=utf-8", ".js": "application/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".gif": "image/gif", ".ico": "image/x-icon", ".pdf": "application/pdf", ".mp4": "video/mp4",
  ".webm": "video/webm", ".mov": "video/quicktime", ".txt": "text/plain; charset=utf-8", ".woff2": "font/woff2", ".woff": "font/woff" };
function send(res, status, body, headers = {}) {
  const buf = Buffer.from(typeof body === "string" ? body : JSON.stringify(body));
  res.writeHead(status, { "content-type": typeof body === "string" ? "text/plain; charset=utf-8" : "application/json", "content-length": buf.length, ...headers });
  res.end(buf);
}
async function readJson(req, limit = 5e6) {
  let size = 0; const chunks = [];
  for await (const c of req) { size += c.length; if (size > limit) throw Object.assign(new Error("Body too large"), { status: 413 }); chunks.push(c); }
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};
}
function safeJoin(root, rel) {
  const p = path.normalize(path.join(root, rel));
  if (p !== root && !p.startsWith(root + path.sep)) return null;
  return p;
}
function serveFile(req, res, file, cache) {
  const st = fs.statSync(file);
  const type = MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
  const headers = { "content-type": type, "accept-ranges": "bytes", "last-modified": st.mtime.toUTCString(), "cache-control": cache };
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
  if (m && (m[1] || m[2])) {
    let start = m[1] ? Number(m[1]) : st.size - Number(m[2]);
    let end = m[1] && m[2] ? Number(m[2]) : st.size - 1;
    if (start < 0) start = 0;
    if (start >= st.size || end < start) { res.writeHead(416, { "content-range": `bytes */${st.size}` }); return res.end(); }
    end = Math.min(end, st.size - 1);
    res.writeHead(206, { ...headers, "content-range": `bytes ${start}-${end}/${st.size}`, "content-length": end - start + 1 });
    if (req.method === "HEAD") return res.end();
    return fs.createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { ...headers, "content-length": st.size });
  if (req.method === "HEAD") return res.end();
  fs.createReadStream(file).pipe(res);
}
const isFile = (p) => { try { return fs.statSync(p).isFile(); } catch { return false; } };

// ---------- migration (one-time import, protected by an import token fixed on first use) ----------
const sha = (s) => crypto.createHash("sha256").update(String(s)).digest("hex");
function importAllowed(req) {
  const tok = req.headers["x-import-token"];
  if (!tok || String(tok).length < 32) return false;
  const saved = getMeta("import_token_hash");
  if (!saved) { setMeta("import_token_hash", sha(tok)); return true; }
  return saved === sha(tok);
}
const fileSync = { running: false, total: 0, done: 0, skipped: 0, failed: [], bytes: 0 };
async function syncFiles(list) {
  if (fileSync.running) return;
  Object.assign(fileSync, { running: true, total: list.length, done: 0, skipped: 0, failed: [], bytes: 0 });
  const queue = [...list];
  const worker = async () => {
    for (let name; (name = queue.shift()) !== undefined;) {
      const dest = safeJoin(FILES, "content-files/" + name);
      try {
        if (!dest) throw new Error("bad path");
        if (isFile(dest)) { fileSync.skipped++; continue; }
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        const r = await fetch(OLD_PUBLIC + "content-files/" + name.split("/").map(encodeURIComponent).join("/"));
        if (!r.ok) throw new Error("HTTP " + r.status);
        const tmp = dest + ".part";
        const out = fs.createWriteStream(tmp);
        for await (const chunk of r.body) { if (!out.write(chunk)) await new Promise((ok) => out.once("drain", ok)); fileSync.bytes += chunk.length; }
        await new Promise((ok, bad) => out.end((e) => (e ? bad(e) : ok())));
        fs.renameSync(tmp, dest);
        fileSync.done++;
      } catch (e) { fileSync.failed.push(name + ": " + e.message); }
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
  fileSync.running = false;
}

// ---------- routes ----------
async function handle(req, res) {
  const url = new URL(req.url, "http://x");
  const p = decodeURIComponent(url.pathname);

  if (p === "/api/query" && req.method === "POST") {
    const [s, b] = runQuery(await readJson(req), authUser(req));
    return send(res, s, b);
  }
  if (p === "/api/auth/login" && req.method === "POST") {
    const { email, password } = await readJson(req);
    const u = users().find((x) => x.email.toLowerCase() === String(email || "").toLowerCase());
    if (!u || !bcrypt.compareSync(String(password || ""), u.hash)) return send(res, 400, { error: "Invalid login credentials" });
    const user = { id: u.id, email: u.email };
    return send(res, 200, { data: { access_token: makeToken(user), token_type: "bearer", expires_at: Math.floor(Date.now() / 1000) + 7 * 86400, user } });
  }
  if (p === "/api/auth/password" && req.method === "POST") {
    const user = authUser(req);
    if (!user) return send(res, 401, { error: "Not authenticated" });
    const { password } = await readJson(req);
    if (!password || String(password).length < 6) return send(res, 400, { error: "Password should be at least 6 characters" });
    const list = users().map((u) => (u.id === user.id ? { ...u, hash: bcrypt.hashSync(String(password), 10) } : u));
    setMeta("users", JSON.stringify(list));
    return send(res, 200, { data: { user } });
  }

  // storage: upload / delete
  let m = /^\/storage\/v1\/object\/([^/]+)\/(.+)$/.exec(p);
  if (m && !p.startsWith("/storage/v1/object/public/") && (req.method === "POST" || req.method === "PUT")) {
    if (!isAdmin(authUser(req))) return send(res, 403, { error: "Not allowed" });
    if (!BUCKETS.has(m[1])) return send(res, 404, { error: "Bucket not found" });
    const dest = safeJoin(FILES, m[1] + "/" + m[2]);
    if (!dest) return send(res, 400, { error: "Bad path" });
    const upsert = req.headers["x-upsert"] === "true" || req.method === "PUT";
    if (!upsert && isFile(dest)) return send(res, 409, { error: "The resource already exists", statusCode: "409" });
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const tmp = dest + "." + crypto.randomBytes(4).toString("hex") + ".part";
    await new Promise((ok, bad) => { const out = fs.createWriteStream(tmp); req.pipe(out); out.on("finish", ok); out.on("error", bad); req.on("error", bad); });
    fs.renameSync(tmp, dest);
    return send(res, 200, { Key: m[1] + "/" + m[2] });
  }
  m = /^\/storage\/v1\/object\/([^/]+)$/.exec(p);
  if (m && req.method === "DELETE") {
    if (!isAdmin(authUser(req))) return send(res, 403, { error: "Not allowed" });
    const { prefixes = [] } = await readJson(req);
    for (const rel of prefixes) { const f = safeJoin(FILES, m[1] + "/" + rel); if (f && isFile(f)) fs.unlinkSync(f); }
    return send(res, 200, prefixes.map((name) => ({ name })));
  }
  // storage: public read (falls back to the old Supabase copy until the file sync has finished)
  m = /^\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/.exec(p);
  if (m && (req.method === "GET" || req.method === "HEAD")) {
    const f = BUCKETS.has(m[1]) ? safeJoin(FILES, m[1] + "/" + m[2]) : null;
    if (f && isFile(f)) return serveFile(req, res, f, "public, max-age=86400");
    return send(res, 302, "", { location: OLD_PUBLIC + m[1] + "/" + m[2].split("/").map(encodeURIComponent).join("/") });
  }

  // one-time migration endpoints
  if (p === "/api/_import" && req.method === "POST") {
    if (!importAllowed(req)) return send(res, 403, { error: "Not allowed" });
    const body = JSON.parse(JSON.stringify(await readJson(req, 20e6)).split(OLD_PUBLIC).join(NEW_PUBLIC));
    tx(() => {
      for (const [t, rows] of Object.entries(body.tables || {})) {
        if (!TABLES.has(t)) continue;
        if (body.replace) db.prepare("DELETE FROM docs WHERE tbl=?").run(t);
        rows.forEach((r) => putRow(t, r));
      }
      if (body.users) setMeta("users", JSON.stringify(body.users));
      if (body.defaults) setMeta("defaults", JSON.stringify(body.defaults));
      setMeta("imported_at", new Date().toISOString());
    });
    if (body.files?.length) syncFiles(body.files);
    return send(res, 200, { ok: true });
  }
  if (p === "/api/_status" && req.method === "GET") {
    if (!importAllowed(req)) return send(res, 403, { error: "Not allowed" });
    const counts = Object.fromEntries([...TABLES].map((t) => [t, rowsOf(t).length]));
    let diskFreeGB = null; try { const s = fs.statfsSync(FILES); diskFreeGB = +((s.bavail * s.bsize) / 1e9).toFixed(1); } catch {}
    return send(res, 200, { imported_at: getMeta("imported_at"), users: users().length, counts, files: { ...fileSync, failed: fileSync.failed.slice(0, 20), failedCount: fileSync.failed.length }, diskFreeGB });
  }
  if (p.startsWith("/api/")) return send(res, 404, { error: "Not found" });

  // static site + SPA fallback
  if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, "Method not allowed");
  const f = safeJoin(DIST, p);
  if (f && isFile(f)) return serveFile(req, res, f, p.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "no-cache");
  if (path.extname(p) && !p.endsWith(".html")) return send(res, 404, "Not found");
  return serveFile(req, res, path.join(DIST, "index.html"), "no-cache");
}

http.createServer((req, res) => {
  handle(req, res).catch((e) => {
    console.error(req.method, req.url, e);
    if (!res.headersSent) send(res, e.status || 500, { error: e.status ? e.message : "Server error" });
    else res.destroy();
  });
}).listen(PORT, "0.0.0.0", () => console.log(`theannualreports server on :${PORT}`));
