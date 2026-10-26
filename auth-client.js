(() => {
  const config = window.RECLAIM_REVIEWS_CONFIG || {};
  const apiUrl = String(config.url || "").replace(/\/$/, "");
  const apiKey = String(config.anonKey || "");
  const storageKey = "lootbox-supabase-session";
  const verifierKey = "lootbox-google-pkce-verifier";
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
      persist({ ...next, pending_email_otp: Boolean(session.pending_email_otp), email_otp_sent: Boolean(session.email_otp_sent), expires_at: Math.floor(Date.now() / 1000) + Number(next.expires_in || 3600) });
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
  const base64Url = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  const randomToken = () => {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return base64Url(bytes);
  };
  const finishGoogleCallback = async () => {
    const callbackUrl = new URL(window.location.href);
    const code = callbackUrl.searchParams.get("code");
    const oauthError = callbackUrl.searchParams.get("error_description") || callbackUrl.searchParams.get("error");
    if (oauthError) {
      localStorage.removeItem(verifierKey);
      callbackUrl.searchParams.delete("error");
      callbackUrl.searchParams.delete("error_description");
      window.history.replaceState({}, "", callbackUrl);
      throw new Error(oauthError);
    }
    if (!code) return null;
    const verifier = localStorage.getItem(verifierKey);
    if (!verifier) {
      throw new Error("Google sign-in expired. Please try again.");
    }
    const result = await authRequest("token?grant_type=pkce", { auth_code: code, code_verifier: verifier });
    localStorage.removeItem(verifierKey);
    saveSession({ ...result, pending_email_otp: true, email_otp_sent: false });
    callbackUrl.searchParams.delete("code");
    window.history.replaceState({}, "", callbackUrl);
    return session;
  };

  window.LootboxBackend = {
    get session() { return session; },
    async ready() { return (await finishGoogleCallback()) || refresh(); },
    async signInWithGoogle() {
      if (!apiUrl || !apiKey) throw new Error("Sign-in is not configured yet.");
      const verifier = randomToken() + randomToken();
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
      const challenge = base64Url(new Uint8Array(digest));
      localStorage.setItem(verifierKey, verifier);
      const redirectTo = `${window.location.origin}${window.location.pathname}`;
      const authorizeUrl = new URL(`${apiUrl}/auth/v1/authorize`);
      authorizeUrl.search = new URLSearchParams({
        provider: "google",
        scopes: "email profile",
        redirect_to: redirectTo,
        code_challenge: challenge,
        code_challenge_method: "s256",
        apikey: apiKey
      }).toString();
      window.location.assign(authorizeUrl.toString());
    },
    get requiresEmailOtp() { return Boolean(session?.pending_email_otp); },
    async sendGoogleEmailCode() {
      if (!session?.pending_email_otp || !session.user?.email) throw new Error("Sign in with Google first.");
      if (!session.email_otp_sent) {
        await authRequest("otp", { email: session.user.email, create_user: false });
        persist({ ...session, email_otp_sent: true });
      }
      return session.user.email;
    },
    async resendGoogleEmailCode() {
      if (!session?.pending_email_otp || !session.user?.email) throw new Error("Sign in with Google first.");
      await authRequest("otp", { email: session.user.email, create_user: false });
      persist({ ...session, email_otp_sent: true });
      return session.user.email;
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
