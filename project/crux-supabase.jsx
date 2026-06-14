// ── CRUX · Supabase client + auth helpers ────────────────────────────────────
// This is the ONLY file you touch to go live. The auth screens call into `Auth`
// below; today those calls are faked (DEMO_MODE) so the UI is clickable with no
// backend. To ship for real:
//
//   1. Create a project at supabase.com  (choose the London / eu-west-2 region)
//   2. Settings → API → copy the Project URL and the "anon public" key
//   3. Paste them below, set DEMO_MODE = false, and load the Supabase SDK
//      (the <script> tag is already in the HTML, commented with a note)
//
// The anon key is SAFE to expose in the browser — Row-Level Security in the
// database is what actually protects each user's data. Never ship the
// "service_role" key to the client.

const SUPABASE_URL      = 'https://psbgsdxfjbrdhhuuquln.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzYmdzZHhmamJyZGhodXVxdWxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMzU2NTQsImV4cCI6MjA5NjYxMTY1NH0.bQQtMWOupm4BWgQEqMYG7x1knszxlHgWJqWVGxHubjs';

const DEMO_MODE = false;

// ── client (created lazily, only when live) ──────────────────────────────────
let _client = null;
function sb() {
  if (DEMO_MODE) return null;
  if (!_client) {
    if (!window.supabase) throw new Error('Supabase SDK not loaded — uncomment the <script> in the HTML <head>.');
    _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _client;
}

const _wait = (ms) => new Promise(r => setTimeout(r, ms));

// ── auth API — what the screens call ──────────────────────────────────────────
// Each method maps 1:1 to a Supabase Auth call. The backend logic (sending
// emails, hashing passwords, expiring reset tokens) is handled by Supabase —
// we only collect input and surface the result.
const Auth = {

  // Register. Supabase emails a confirmation link automatically.
  async signUp(email, password, name) {
    if (DEMO_MODE) {
      await _wait(750);
      if (!email || !password) throw new Error('Please fill in every field.');
      if (password.length < 8) throw new Error('Use at least 8 characters.');
      return { needsConfirmation: true };
    }
    const { data, error } = await sb().auth.signUp({
      email, password,
      options: { data: { display_name: name }, emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
    return { needsConfirmation: !data.session, data };
  },

  // Email + password sign-in.
  async signIn(email, password) {
    if (DEMO_MODE) {
      await _wait(750);
      if (password.length < 8) throw new Error('Invalid email or password.');
      return { user: { email } };
    }
    const { data, error } = await sb().auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  // Magic link — passwordless sign-in via email.
  async signInWithMagicLink(email) {
    if (DEMO_MODE) { await _wait(700); if (!email) throw new Error('Enter your email.'); return; }
    const { error } = await sb().auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    if (error) throw error;
  },

  // OAuth (Google / Apple). Redirects out and back.
  async signInWithProvider(provider) {
    if (DEMO_MODE) { await _wait(500); throw new Error(`${provider} sign-in works once the project is connected.`); }
    const { error } = await sb().auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } });
    if (error) throw error;
  },

  // Forgot password → Supabase emails a reset link. No token logic to write.
  async sendPasswordReset(email) {
    if (DEMO_MODE) { await _wait(750); if (!email) throw new Error('Enter your email.'); return; }
    const { error } = await sb().auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/?reset=1',
    });
    if (error) throw error;
  },

  // The reset link lands the user back here logged into a recovery session;
  // this sets the new password on that session.
  async updatePassword(password) {
    if (DEMO_MODE) { await _wait(750); if (password.length < 8) throw new Error('Use at least 8 characters.'); return; }
    const { error } = await sb().auth.updateUser({ password });
    if (error) throw error;
  },

  async signOut() { if (DEMO_MODE) return; await sb().auth.signOut(); },

  async getSession() {
    if (DEMO_MODE) return null;
    const { data } = await sb().auth.getSession();
    return data.session;
  },

  // Fires when the user arrives via a recovery (password-reset) email link.
  onPasswordRecovery(cb) {
    if (DEMO_MODE) return () => {};
    const { data } = sb().auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') cb();
    });
    return () => data.subscription.unsubscribe();
  },
};

// ── database API ─────────────────────────────────────────────────────────────
const DB = {
  async loadProfile(userId) {
    if (DEMO_MODE) return null;
    const { data, error } = await sb().from('profiles').select('*').eq('user_id', userId).maybeSingle();
    if (error) { console.error('DB.loadProfile:', error); return null; }
    return data;
  },

  async upsertProfile(userId, profileData, goals, tweaks, onboarded) {
    if (DEMO_MODE) return;
    const { error } = await sb().from('profiles').upsert(
      { user_id: userId, profile_data: profileData, goals, tweaks, onboarded, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
    if (error) console.error('DB.upsertProfile:', error);
  },

  async loadSessions(userId) {
    if (DEMO_MODE) return null;
    const { data, error } = await sb().from('sessions').select('id, data').eq('user_id', userId);
    if (error) { console.error('DB.loadSessions:', error); return null; }
    return (data || []).map(r => r.data);
  },

  async upsertSession(userId, session) {
    if (DEMO_MODE) return;
    const { error } = await sb().from('sessions').upsert(
      { id: session.id, user_id: userId, data: session, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    );
    if (error) console.error('DB.upsertSession:', error);
  },

  async deleteSession(userId, sessionId) {
    if (DEMO_MODE) return;
    const { error } = await sb().from('sessions').delete().eq('id', sessionId).eq('user_id', userId);
    if (error) console.error('DB.deleteSession:', error);
  },
};

Object.assign(window, { Auth, DB, DEMO_MODE, SUPABASE_URL });
