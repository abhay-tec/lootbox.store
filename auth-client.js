(() => {
  const config = window.RECLAIM_REVIEWS_CONFIG || {};
  const apiUrl = String(config.url || "").replace(/\/$/, "");
  const apiKey = String(config.anonKey || "");
  const storageKey = "lootbox-supabase-session";
  let session = null;

  try { session = JSON.parse(localStorage.getItem(storageKey) || "null"); } catch { session = null; }

  const persist = value => {
    session = value;
    try {
      if (value) localStorage.setItem(storageKey, JSON.stringify(value));
      else localStorage.removeItem(storageKey);
    } catch {}
  };
  const apiHeaders = (extra = {}) => ({
    apikey: apiKey,
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    ...extra
  });
  const readResponse = async response => {
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.msg || body.message || body.error_description || body.error || "Request failed. Please try again.");
    return body;
  };
  const authRequest = async (path, body) => readResponse(await fetch(`${apiUrl}/auth/v1/${path}`, {
    method: "POST",
    headers: { apikey: apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  }));
  const refresh = async () => {
    if (!session?.refresh_token) return null;
    if (session.expires_at && session.expires_at > Date.now() / 1000 + 30) return session;
    try {
      const next = await authRequest("token?grant_type=refresh_token", { refresh_token: session.refresh_token });
      persist({ ...next, expires_at: Math.floor(Date.now() / 1000) + Number(next.expires_in || 3600) });
      return session;
    } catch {
      persist(null);
      return null;
    }
  };
  const saveSession = result => {
    persist({ ...result, expires_at: Math.floor(Date.now() / 1000) + Number(result.expires_in || 3600) });
    return session;
  };

  window.LootboxBackend = {
    get session() { return session; },
    async ready() { return refresh(); },
    async sendEmailCode(email) {
      return authRequest("otp", { email: email.trim().toLowerCase(), create_user: true });
    },
    async verifyEmailCode(email, token) {
      return saveSession(await authRequest("verify", { email: email.trim().toLowerCase(), token: token.trim(), type: "email" }));
    },
    async signInSeller(email, password) {
      return saveSession(await authRequest("token?grant_type=password", { email: email.trim().toLowerCase(), password }));
    },
    async signOut() {
      await refresh();
      if (session?.access_token) {
        await fetch(`${apiUrl}/auth/v1/logout`, { method: "POST", headers: apiHeaders() }).catch(() => {});
      }
      persist(null);
    },
    async request(path, options = {}) {
      await refresh();
      const response = await fetch(`${apiUrl}/rest/v1/${path}`, {
        ...options,
        headers: apiHeaders(options.headers || {})
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || body.details || body.hint || `Database request failed (${response.status}).`);
      }
      return response.status === 204 ? null : response.json();
    }
  };
})();
