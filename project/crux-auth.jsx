// ── CRUX · Authentication screens ─────────────────────────────────────────────
// Login · Sign up · Forgot password · Set new password.
// Styling matches the app's onboarding (THEMES tokens, DM Sans / DM Mono).
// Wired to the `Auth` helper in crux-supabase.jsx.
const { useState: auState, useEffect: auEffect } = React;

// local label (named to avoid colliding with crux-ui.jsx's Label in the full app)
const AuthLabel = ({ th, children }) => (
  <p style={{ fontSize:12, fontWeight:600, color:th.textSub, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8 }}>{children}</p>
);

const inputStyle = (th, invalid) => ({
  width:'100%', padding:'14px', borderRadius:th.radius,
  border:`1px solid ${invalid ? th.danger : th.border}`, background:th.surface,
  fontSize:16, color:th.text, fontFamily:'DM Sans', outline:'none',
});

function AuthField({ th, label, type='text', value, onChange, placeholder, autoFocus, onEnter, autoComplete }) {
  const [focus, setFocus] = auState(false);
  return (
    <div style={{ marginBottom:16 }}>
      <AuthLabel th={th}>{label}</AuthLabel>
      <input
        type={type} value={value} placeholder={placeholder} autoFocus={autoFocus} autoComplete={autoComplete}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && onEnter) onEnter(); }}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{ ...inputStyle(th), border:`1px solid ${focus ? th.accent : th.border}`, transition:'border-color 0.15s' }}
      />
    </div>
  );
}

function PrimaryBtn({ th, onClick, disabled, busy, children }) {
  const on = !disabled && !busy;
  return (
    <button onClick={on ? onClick : undefined} disabled={!on}
      style={{ width:'100%', padding:'15px', borderRadius:th.radius, border:'none',
        background: on ? th.accent : th.borderStrong, color: on ? th.accentText : th.textMuted,
        fontSize:16, fontWeight:700, cursor: on ? 'pointer' : 'not-allowed', fontFamily:'DM Sans',
        display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
      {busy && <span className="au-spin" style={{ width:16, height:16, border:`2px solid ${th.accentText}`, borderTopColor:'transparent', borderRadius:'50%', display:'inline-block' }}/>}
      {children}
    </button>
  );
}

function OAuthBtn({ th, onClick, icon, children }) {
  return (
    <button onClick={onClick}
      style={{ flex:1, padding:'13px', borderRadius:th.radius, border:`1px solid ${th.border}`, background:th.surface,
        color:th.text, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans',
        display:'flex', alignItems:'center', justifyContent:'center', gap:9 }}>
      {icon}{children}
    </button>
  );
}

const GoogleMark = () => (
  <svg width="17" height="17" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.5h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.6z"/><path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.9 10.7a5.4 5.4 0 0 1 0-3.4V5H.9a9 9 0 0 0 0 8l3-2.3z"/><path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6A9 9 0 0 0 .9 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6z"/></svg>
);
const AppleMark = ({ color }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={color}><path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.8-3.5.8-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.2 0 2-1.1 2.8-2.2.9-1.3 1.2-2.5 1.3-2.6-.1 0-2.5-1-2.5-3.8zM14.2 5.6c.6-.8 1-1.9.9-3-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.8-1 2.8 1 .1 2.1-.5 2.8-1.2z"/></svg>
);

// ── the flow ──────────────────────────────────────────────────────────────────
// view: 'login' | 'signup' | 'forgot' | 'sent' | 'reset' | 'done'
function AuthFlow({ onAuthed, startView='login' }) {
  const savedTheme = (() => { try { return JSON.parse(localStorage.getItem('crux_tweaks'))?.theme; } catch { return null; } })();
  const th = THEMES[savedTheme && THEMES[savedTheme] ? savedTheme : 'pure'];

  const [view, setView] = auState(startView);
  const [name, setName] = auState('');
  const [email, setEmail] = auState('');
  const [pw, setPw] = auState('');
  const [pw2, setPw2] = auState('');
  const [busy, setBusy] = auState(false);
  const [err, setErr] = auState('');
  const [showPw, setShowPw] = auState(false);

  const go = (v) => { setErr(''); setBusy(false); setView(v); };
  const guard = async (fn) => { setErr(''); setBusy(true); try { await fn(); } catch (e) { setErr(e.message || 'Something went wrong.'); } finally { setBusy(false); } };

  // arrive via password-reset email → jump to the reset screen
  auEffect(() => {
    if (typeof Auth === 'undefined') return;
    const unsub = Auth.onPasswordRecovery(() => go('reset'));
    if (new URLSearchParams(location.search).get('reset')) go('reset');
    return unsub;
  }, []);

  const doLogin   = () => guard(async () => { await Auth.signIn(email, pw); go('done'); onAuthed && onAuthed({ email }); });
  const doSignup  = () => guard(async () => { const r = await Auth.signUp(email, pw, name); r.needsConfirmation ? go('sent') : (go('done'), onAuthed && onAuthed({ email })); });
  const doForgot  = () => guard(async () => { await Auth.sendPasswordReset(email); go('sent'); });
  const doReset   = () => guard(async () => { if (pw !== pw2) throw new Error('Passwords don’t match.'); await Auth.updatePassword(pw); go('login'); setPw(''); setPw2(''); });
  const oauth     = (p) => guard(() => Auth.signInWithProvider(p));

  const linkBtn = { background:'none', border:'none', color:th.textSub, fontSize:13.5, cursor:'pointer', fontFamily:'DM Sans', padding:0 };
  const accentLink = { ...linkBtn, color:th.accent, fontWeight:700 };

  // ── headings per view ──
  const heads = {
    login:  ['Welcome back', 'Log in to pick up where you left off.'],
    signup: ['Create your account', 'Back up your logbook and climb on any device.'],
    forgot: ['Reset your password', 'Enter your email and we’ll send you a reset link.'],
    sent:   [view==='sent' && email ? 'Check your email' : 'Check your email', 'We’ve sent a link to ' + (email || 'your inbox') + '.'],
    reset:  ['Set a new password', 'Choose a new password for your account.'],
    done:   ['You’re in 🎉', 'In the live app, CRUX would load right here.'],
  };
  const [title, sub] = heads[view] || heads.login;

  return (
    <div style={{ minHeight:'100vh', width:'100%', background:th.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', overflowY:'auto' }}>
      <style>{`@keyframes auSpin{to{transform:rotate(360deg)}} .au-spin{animation:auSpin .7s linear infinite}
        .au-card{animation:auIn .35s cubic-bezier(.22,1,.36,1)} @keyframes auIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>

      <div className="au-card" style={{ width:'100%', maxWidth:380 }}>
        {/* brand */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:28 }}>
          <div style={{ width:60, height:60, borderRadius:18, background:th.accent, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18 }}>
            <Icon name="logo" size={34} color={th.accentText}/>
          </div>
          <h1 style={{ fontSize:24, fontWeight:700, color:th.text, letterSpacing:'-0.02em', marginBottom:6, textAlign:'center' }}>{title}</h1>
          <p style={{ fontSize:14.5, color:th.textSub, textAlign:'center', lineHeight:1.5, maxWidth:300 }}>{sub}</p>
        </div>

        {/* error */}
        {err && (
          <div style={{ background:th.dangerBg, border:`1px solid ${th.danger}33`, borderRadius:th.radius, padding:'11px 14px', marginBottom:16, display:'flex', gap:9, alignItems:'flex-start' }}>
            <Icon name="x" size={15} color={th.danger}/>
            <span style={{ fontSize:13, color:th.danger, lineHeight:1.45 }}>{err}</span>
          </div>
        )}

        {/* ── LOGIN ── */}
        {view === 'login' && (
          <div>
            <AuthField th={th} label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoFocus autoComplete="email" onEnter={doLogin}/>
            <div style={{ marginBottom:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                <AuthLabel th={th}>Password</AuthLabel>
                <button onClick={() => setShowPw(s => !s)} style={{ ...linkBtn, fontSize:11.5, marginBottom:8 }}>{showPw ? 'Hide' : 'Show'}</button>
              </div>
              <input type={showPw ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••" autoComplete="current-password"
                onKeyDown={e => e.key === 'Enter' && doLogin()} style={inputStyle(th)}/>
            </div>
            <div style={{ textAlign:'right', marginBottom:18 }}>
              <button onClick={() => go('forgot')} style={linkBtn}>Forgot password?</button>
            </div>
            <PrimaryBtn th={th} onClick={doLogin} busy={busy} disabled={!email || !pw}>Log in</PrimaryBtn>

            <Divider th={th}/>
            <div style={{ display:'flex', gap:10 }}>
              <OAuthBtn th={th} onClick={() => oauth('google')} icon={<GoogleMark/>}>Google</OAuthBtn>
              <OAuthBtn th={th} onClick={() => oauth('apple')} icon={<AppleMark color={th.text}/>}>Apple</OAuthBtn>
            </div>

            <p style={{ textAlign:'center', marginTop:24, fontSize:13.5, color:th.textSub }}>
              New to CRUX? <button onClick={() => go('signup')} style={accentLink}>Create an account</button>
            </p>
          </div>
        )}

        {/* ── SIGN UP ── */}
        {view === 'signup' && (
          <div>
            <AuthField th={th} label="Name" value={name} onChange={setName} placeholder="e.g. Alex" autoFocus autoComplete="name"/>
            <AuthField th={th} label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email"/>
            <div style={{ marginBottom:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                <AuthLabel th={th}>Password</AuthLabel>
                <button onClick={() => setShowPw(s => !s)} style={{ ...linkBtn, fontSize:11.5, marginBottom:8 }}>{showPw ? 'Hide' : 'Show'}</button>
              </div>
              <input type={showPw ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" style={inputStyle(th)}/>
            </div>
            <p style={{ fontSize:12, color:th.textMuted, marginBottom:18, lineHeight:1.45 }}>By continuing you agree to our Terms &amp; Privacy Policy.</p>
            <PrimaryBtn th={th} onClick={doSignup} busy={busy} disabled={!email || !pw || !name}>Create account</PrimaryBtn>

            <Divider th={th}/>
            <div style={{ display:'flex', gap:10 }}>
              <OAuthBtn th={th} onClick={() => oauth('google')} icon={<GoogleMark/>}>Google</OAuthBtn>
              <OAuthBtn th={th} onClick={() => oauth('apple')} icon={<AppleMark color={th.text}/>}>Apple</OAuthBtn>
            </div>

            <p style={{ textAlign:'center', marginTop:24, fontSize:13.5, color:th.textSub }}>
              Already have an account? <button onClick={() => go('login')} style={accentLink}>Log in</button>
            </p>
          </div>
        )}

        {/* ── FORGOT ── */}
        {view === 'forgot' && (
          <div>
            <AuthField th={th} label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoFocus autoComplete="email" onEnter={doForgot}/>
            <div style={{ marginTop:8 }}>
              <PrimaryBtn th={th} onClick={doForgot} busy={busy} disabled={!email}>Send reset link</PrimaryBtn>
            </div>
            <p style={{ textAlign:'center', marginTop:22, fontSize:13.5 }}>
              <button onClick={() => go('login')} style={accentLink}>← Back to log in</button>
            </p>
          </div>
        )}

        {/* ── SENT (signup confirm OR reset email) ── */}
        {view === 'sent' && (
          <div style={{ textAlign:'center' }}>
            <div style={{ width:56, height:56, borderRadius:'50%', background:th.successBg, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
              <Icon name="check" size={26} color={th.success}/>
            </div>
            <p style={{ fontSize:14, color:th.textSub, lineHeight:1.6, marginBottom:24 }}>
              Open the email and follow the link. Didn’t get it? Check spam, or
            </p>
            <button onClick={() => go(email ? 'forgot' : 'signup')} style={{ ...accentLink, fontSize:14 }}>try a different email</button>

            {typeof DEMO_MODE !== 'undefined' && DEMO_MODE && (
              <div style={{ marginTop:28, paddingTop:20, borderTop:`1px dashed ${th.border}` }}>
                <p style={{ fontSize:11, color:th.textMuted, marginBottom:10, fontFamily:"'DM Mono', monospace", letterSpacing:'0.05em' }}>DEMO — the email link would open:</p>
                <button onClick={() => go('reset')} style={{ ...accentLink, fontSize:13.5 }}>Set-new-password screen →</button>
              </div>
            )}

            <p style={{ marginTop:24, fontSize:13.5 }}>
              <button onClick={() => go('login')} style={linkBtn}>Back to log in</button>
            </p>
          </div>
        )}

        {/* ── RESET (set new password) ── */}
        {view === 'reset' && (
          <div>
            <div style={{ marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                <AuthLabel th={th}>New password</AuthLabel>
                <button onClick={() => setShowPw(s => !s)} style={{ ...linkBtn, fontSize:11.5, marginBottom:8 }}>{showPw ? 'Hide' : 'Show'}</button>
              </div>
              <input type={showPw ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} placeholder="At least 8 characters" autoFocus autoComplete="new-password" style={inputStyle(th)}/>
            </div>
            <AuthField th={th} label="Confirm password" type={showPw ? 'text' : 'password'} value={pw2} onChange={setPw2} placeholder="Re-enter password" onEnter={doReset}/>
            <div style={{ marginTop:8 }}>
              <PrimaryBtn th={th} onClick={doReset} busy={busy} disabled={!pw || !pw2}>Update password</PrimaryBtn>
            </div>
          </div>
        )}

        {/* ── DONE (demo) ── */}
        {view === 'done' && (
          <div style={{ textAlign:'center' }}>
            <PrimaryBtn th={th} onClick={() => go('login')}>Back to start</PrimaryBtn>
          </div>
        )}
      </div>

      {/* footer brand mark */}
      <div style={{ marginTop:32, display:'flex', alignItems:'center', gap:7, opacity:0.6 }}>
        <Icon name="logo" size={13} color={th.textSub}/>
        <span style={{ fontSize:11, color:th.textSub, letterSpacing:'0.14em', fontFamily:"'DM Mono', monospace", textTransform:'uppercase' }}>CRUX Climbing</span>
      </div>
    </div>
  );
}

function Divider({ th }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, margin:'20px 0' }}>
      <div style={{ flex:1, height:1, background:th.border }}/>
      <span style={{ fontSize:11.5, color:th.textMuted, letterSpacing:'0.06em' }}>or continue with</span>
      <div style={{ flex:1, height:1, background:th.border }}/>
    </div>
  );
}

Object.assign(window, { AuthFlow });

// mount if a host root exists (standalone demo)
if (document.getElementById('auth-root')) {
  ReactDOM.createRoot(document.getElementById('auth-root')).render(<AuthFlow/>);
}
