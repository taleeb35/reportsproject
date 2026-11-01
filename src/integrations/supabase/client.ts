// Self-hosted replacement for the Supabase client.
// Implements the subset of the supabase-js API this app uses, backed by /api on our own server.

const SESSION_KEY = "ar_session";

type Result = { data: any; error: { message: string; code?: string } | null; count?: number | null };
type Session = { access_token: string; expires_at: number; user: { id: string; email: string } };

function getSession(): Session | null {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    return s && s.expires_at * 1000 > Date.now() ? s : null;
  } catch {
    return null;
  }
}

const authHeader = (): Record<string, string> => {
  const s = getSession();
  return s ? { Authorization: `Bearer ${s.access_token}` } : {};
};

async function api(path: string, body?: unknown): Promise<Result> {
  try {
    const res = await fetch(`/api${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(body ?? {}),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) return { data: null, error: { message: json?.error || res.statusText, code: json?.code }, count: null };
    return { data: json?.data ?? null, error: null, count: json?.count ?? null };
  } catch (e: any) {
    return { data: null, error: { message: e?.message || "Network error" }, count: null };
  }
}

class QueryBuilder implements PromiseLike<Result> {
  private q: Record<string, any>;

  constructor(table: string) {
    this.q = { table, op: "select", columns: "*", filters: [], order: [] };
  }

  select(columns = "*", opts: { count?: string; head?: boolean } = {}) {
    if (this.q.op === "select") this.q.columns = columns;
    else this.q.returning = columns;
    if (opts.count) this.q.count = opts.count;
    if (opts.head) this.q.head = true;
    return this;
  }
  insert(values: any) { Object.assign(this.q, { op: "insert", values }); return this; }
  upsert(values: any) { Object.assign(this.q, { op: "upsert", values }); return this; }
  update(values: any) { Object.assign(this.q, { op: "update", values }); return this; }
  delete() { this.q.op = "delete"; return this; }

  private f(col: string, op: string, val: any) { this.q.filters.push([col, op, val]); return this; }
  eq(col: string, val: any) { return this.f(col, "eq", val); }
  neq(col: string, val: any) { return this.f(col, "neq", val); }
  gt(col: string, val: any) { return this.f(col, "gt", val); }
  gte(col: string, val: any) { return this.f(col, "gte", val); }
  lt(col: string, val: any) { return this.f(col, "lt", val); }
  lte(col: string, val: any) { return this.f(col, "lte", val); }
  in(col: string, val: any[]) { return this.f(col, "in", val); }
  is(col: string, val: any) { return this.f(col, "is", val); }
  like(col: string, val: string) { return this.f(col, "like", val); }
  ilike(col: string, val: string) { return this.f(col, "ilike", val); }
  match(obj: Record<string, any>) { Object.entries(obj).forEach(([k, v]) => this.f(k, "eq", v)); return this; }

  order(col: string, opts: { ascending?: boolean } = {}) { this.q.order.push([col, opts.ascending !== false]); return this; }
  limit(n: number) { this.q.limit = n; return this; }
  range(from: number, to: number) { this.q.offset = from; this.q.limit = to - from + 1; return this; }
  single() { this.q.single = "one"; return this; }
  maybeSingle() { this.q.single = "maybe"; return this; }

  then<T1 = Result, T2 = never>(ok?: ((v: Result) => T1 | PromiseLike<T1>) | null, bad?: ((e: any) => T2 | PromiseLike<T2>) | null) {
    return api("/query", this.q).then(ok, bad);
  }
}

const encodePath = (p: string) => p.split("/").map(encodeURIComponent).join("/");

// Realtime is not used on this server; channels are inert so components still mount and clean up.
const channelStub = () => {
  const ch: any = { on: () => ch, subscribe: () => ch, unsubscribe: async () => "ok" };
  return ch;
};

export const supabase: any = {
  from: (table: string) => new QueryBuilder(table),
  channel: channelStub,
  removeChannel: async () => "ok",

  auth: {
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const r = await api("/auth/login", { email, password });
      if (r.error) return { data: { user: null, session: null }, error: r.error };
      localStorage.setItem(SESSION_KEY, JSON.stringify(r.data));
      return { data: { user: r.data.user, session: r.data }, error: null };
    },
    async signOut() {
      localStorage.removeItem(SESSION_KEY);
      return { error: null };
    },
    async getSession() {
      return { data: { session: getSession() }, error: null };
    },
    async getUser() {
      return { data: { user: getSession()?.user ?? null }, error: null };
    },
    async updateUser({ password }: { password?: string }) {
      const r = await api("/auth/password", { password });
      return { data: { user: getSession()?.user ?? null }, error: r.error };
    },
    async resetPasswordForEmail() {
      return {
        data: null,
        error: { message: "Password reset by email is not available. Please contact the site administrator." },
      };
    },
    onAuthStateChange() {
      return { data: { subscription: { unsubscribe() {} } } };
    },
  },

  storage: {
    from: (bucket: string) => ({
      async upload(path: string, file: Blob, opts: { upsert?: boolean } = {}) {
        try {
          const res = await fetch(`/storage/v1/object/${bucket}/${encodePath(path)}`, {
            method: "POST",
            headers: { ...authHeader(), "x-upsert": opts.upsert ? "true" : "false", "Content-Type": file.type || "application/octet-stream" },
            body: file,
          });
          const json = await res.json().catch(() => null);
          if (!res.ok) return { data: null, error: { message: json?.error || `Upload failed (${res.status})` } };
          return { data: { path, fullPath: `${bucket}/${path}` }, error: null };
        } catch (e: any) {
          return { data: null, error: { message: e?.message || "Upload failed" } };
        }
      },
      getPublicUrl(path: string) {
        return { data: { publicUrl: `${window.location.origin}/storage/v1/object/public/${bucket}/${encodePath(path)}` } };
      },
      async remove(paths: string[]) {
        const res = await fetch(`/storage/v1/object/${bucket}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json", ...authHeader() },
          body: JSON.stringify({ prefixes: paths }),
        });
        return res.ok ? { data: paths.map((name) => ({ name })), error: null } : { data: null, error: { message: "Delete failed" } };
      },
    }),
  },
};
