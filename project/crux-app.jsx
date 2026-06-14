// ── CRUX · app shell (responsive) ────────────────────────────────────────────
const { useState: aState, useEffect: aEffect, useRef: aRef, useCallback: aCallback } = React;

const NAV = [
  { id:'session', icon:'mountain', label:'Session' },
  { id:'history', icon:'history',  label:'History' },
  { id:'stats',   icon:'stats',    label:'Stats' },
  { id:'profile', icon:'user',     label:'Profile' },
];

function useViewport() {
  const [w, setW] = aState(window.innerWidth);
  aEffect(() => { const f = () => setW(window.innerWidth); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, []);
  return w;
}

function App({ onSignOut, userId, initialDbData }) {
  const db = initialDbData || {};
  const [tweaks, setTweaks] = aState(() => ({ theme:'pure', defaultRestSeconds:240, gymName:'The Climbing Hangar', gradePref:'both', ...loadLS('crux_tweaks', {}), ...(db.profile?.tweaks || {}) }));
  const [sessions, setSessionsRaw] = aState(() => {
    const dbSessions = db.sessions || [];
    const lsSessions = loadLS('crux_sessions', []);
    if (dbSessions.length === 0) return lsSessions;
    const dbIds = new Set(dbSessions.map(s => s.id));
    const lsOnly = lsSessions.filter(s => !dbIds.has(s.id));
    return lsOnly.length > 0 ? [...dbSessions, ...lsOnly] : dbSessions;
  });

  // IDs deleted this session — prevents the sync from re-adding a session before
  // its DB delete resolves (race: visibilitychange fires while delete is in-flight).
  const deletedIdsRef = aRef(new Set());

  // Wrapped setter: fires DB upserts/deletes at the point of each state change
  // so there's no async race between migration uploads and deletions.
  const setSessions = aCallback(update => {
    setSessionsRaw(prev => {
      const next = typeof update === 'function' ? update(prev) : update;
      if (userId && typeof DB !== 'undefined') {
        const prevMap = new Map(prev.map(s => [s.id, JSON.stringify(s)]));
        const nextIds = new Set(next.map(s => s.id));
        next.forEach(s => { if (prevMap.get(s.id) !== JSON.stringify(s)) DB.upsertSession(userId, s).catch(console.error); });
        prev.forEach(s => { if (!nextIds.has(s.id)) { deletedIdsRef.current.add(s.id); DB.deleteSession(userId, s.id).catch(console.error); } });
      }
      return next;
    });
  }, [userId]);
  const [currentSession, setCurrentSession] = aState(() => loadLS('crux_session', null));
  const [profile, setProfile] = aState(() => db.profile?.profile_data || loadLS('crux_profile', { name:'', homeGym:'', avatar:null }));
  const [goals, setGoals] = aState(() => db.profile?.goals || loadLS('crux_goals', { weeklySessions:3 }));
  const [onboarded, setOnboarded] = aState(() => db.profile?.onboarded ?? loadLS('crux_onboarded', false));
  const [tab, setTab] = aState(() => loadLS('crux_tab', 'session'));
  const [showSettings, setShowSettings] = aState(false);
  const [showTweaks, setShowTweaks] = aState(false);
  const [toastQueue, setToastQueue] = aState([]);
  const earnedAchRef = aRef(null);

  aEffect(() => {
    const d = computeDerived(sessions, currentSession);
    if (earnedAchRef.current === null) {
      const earned = new Set(evalAchievements(d).filter(a => a.earned).map(a => a.id));
      earnedAchRef.current = new Set([...new Set(loadLS('crux_earned_ach', [])), ...earned]);
      saveLS('crux_earned_ach', [...earnedAchRef.current]);
      return;
    }
    const newly = evalAchievements(d).filter(a => a.earned && !earnedAchRef.current.has(a.id));
    if (newly.length > 0) {
      newly.forEach(a => earnedAchRef.current.add(a.id));
      saveLS('crux_earned_ach', [...earnedAchRef.current]);
      setToastQueue(q => [...q, ...newly]);
    }
  }, [sessions, currentSession]); // eslint-disable-line

  const th = THEMES[tweaks.theme];
  const w = useViewport();
  const isDesktop = w >= 900;

  aEffect(() => saveLS('crux_tweaks', tweaks), [tweaks]);
  aEffect(() => saveLS('crux_sessions', sessions), [sessions]);
  aEffect(() => saveLS('crux_session', currentSession), [currentSession]);
  aEffect(() => saveLS('crux_profile', profile), [profile]);
  aEffect(() => saveLS('crux_goals', goals), [goals]);
  aEffect(() => saveLS('crux_onboarded', onboarded), [onboarded]);
  aEffect(() => saveLS('crux_tab', tab), [tab]);
  aEffect(() => { document.body.style.background = th.appBackdrop; }, [th]);

  // ── Supabase DB sync ────────────────────────────────────────────────────────

  // On mount: upload any sessions not yet in DB (new device merge / first login).
  // The setSessions wrapper handles all future changes.
  aEffect(() => {
    if (!userId || typeof DB === 'undefined') return;
    const dbIds = new Set((db.sessions || []).map(s => s.id));
    sessions.filter(s => !dbIds.has(s.id)).forEach(s => DB.upsertSession(userId, s).catch(console.error));
    if (!db.profile) {
      DB.upsertProfile(userId, loadLS('crux_profile', {}), loadLS('crux_goals', {}), loadLS('crux_tweaks', {}), loadLS('crux_onboarded', false)).catch(console.error);
    }
  }, []); // eslint-disable-line

  // Re-sync from DB when page becomes visible (mobile tab switch, app foreground).
  // Uses initialDbIds to distinguish "deleted on another device" from "not yet uploaded".
  aEffect(() => {
    if (!userId || typeof DB === 'undefined') return;
    const initialDbIds = new Set((db.sessions || []).map(s => s.id));

    const sync = () => {
      if (document.visibilityState !== 'visible') return;
      DB.loadSessions(userId).then(dbSessions => {
        if (!dbSessions) return;
        const dbIds = new Set(dbSessions.map(s => s.id));
        setSessionsRaw(prev => {
          const localIds = new Set(prev.map(s => s.id));
          const toAdd    = dbSessions.filter(s => !localIds.has(s.id) && !deletedIdsRef.current.has(s.id));
          const toRemove = new Set(prev.filter(s => initialDbIds.has(s.id) && !dbIds.has(s.id)).map(s => s.id));
          // Re-try any local sessions that haven't reached DB yet
          prev.filter(s => !dbIds.has(s.id) && !initialDbIds.has(s.id))
            .forEach(s => DB.upsertSession(userId, s).catch(console.error));
          toAdd.forEach(s => initialDbIds.add(s.id));
          if (toAdd.length === 0 && toRemove.size === 0) return prev;
          return [...prev.filter(s => !toRemove.has(s.id)), ...toAdd];
        });
      }).catch(console.error);
    };

    document.addEventListener('visibilitychange', sync);
    window.addEventListener('focus', sync);
    return () => {
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('focus', sync);
    };
  }, [userId]); // eslint-disable-line

  // Debounced sync for profile, goals, tweaks, onboarded
  const profileTimerRef = aRef(null);
  aEffect(() => {
    if (!userId || typeof DB === 'undefined') return;
    clearTimeout(profileTimerRef.current);
    profileTimerRef.current = setTimeout(() =>
      DB.upsertProfile(userId, profile, goals, tweaks, onboarded).catch(console.error), 800);
  }, [profile, goals, tweaks, onboarded]);

  // Tweaks toolbar integration
  aEffect(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode') setShowTweaks(true);
      if (e.data?.type === '__deactivate_edit_mode') setShowTweaks(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type:'__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const pageTitle = { session:'Session', history:'History', stats:'Stats', profile:'Profile' }[tab];

  const renderScreen = () => {
    if (showSettings) return <SettingsScreen tweaks={tweaks} setTweaks={setTweaks} sessions={sessions} setSessions={setSessions} setCurrentSession={setCurrentSession} onClose={() => setShowSettings(false)} onSignOut={onSignOut}/>;
    switch (tab) {
      case 'session': return <SessionScreen sessions={sessions} setSessions={setSessions} currentSession={currentSession} setCurrentSession={setCurrentSession} tweaks={tweaks} goals={goals} onNavigate={setTab}/>;
      case 'history': return <HistoryScreen sessions={sessions} setSessions={setSessions} tweaks={tweaks} onNavigate={setTab}/>;
      case 'stats':   return <StatsScreen sessions={sessions} tweaks={tweaks} onNavigate={setTab}/>;
      case 'profile': return <ProfileScreen sessions={sessions} currentSession={currentSession} profile={profile} setProfile={setProfile} goals={goals} setGoals={setGoals} tweaks={tweaks} onOpenSettings={() => setShowSettings(true)}/>;
    }
  };

  if (!onboarded) return <Onboarding tweaks={tweaks} setTweaks={setTweaks} profile={profile} setProfile={setProfile} goals={goals} setGoals={setGoals} onDone={() => setOnboarded(true)}/>;

  const Wordmark = ({ size=18 }) => (
    <div style={{ display:'flex', alignItems:'center', gap:7 }}>
      <Icon name="logo" size={size} color={th.accent}/>
      <span style={{ fontSize:size*0.9, fontWeight:800, color:th.text, letterSpacing:'-0.04em' }}>CRUX</span>
    </div>
  );

  // ── DESKTOP: side rail + content ──
  if (isDesktop) return (
    <div style={{ display:'flex', width:'100%', height:'100%', background:th.bg }}>
      <nav style={{ width:240, flexShrink:0, background:th.railBg, borderRight:`1px solid ${th.border}`, display:'flex', flexDirection:'column', padding:'24px 16px' }}>
        <div style={{ padding:'0 8px 28px' }}><Wordmark size={22}/></div>
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => { setTab(n.id); setShowSettings(false); }} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:th.radius, border:'none', background: (tab===n.id&&!showSettings)?th.accentSoft:'transparent', color:(tab===n.id&&!showSettings)?th.accentSoftText:th.textSub, fontSize:15, fontWeight:(tab===n.id&&!showSettings)?700:500, cursor:'pointer', fontFamily:'DM Sans', textAlign:'left' }}>
              <Icon name={n.icon} size={20} color={(tab===n.id&&!showSettings)?th.accentSoftText:th.textSub}/> {n.label}
            </button>
          ))}
        </div>
        <div style={{ flex:1 }}/>
        <button onClick={() => setShowSettings(true)} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:th.radius, border:'none', background:showSettings?th.accentSoft:'transparent', color:showSettings?th.accentSoftText:th.textSub, fontSize:15, fontWeight:showSettings?700:500, cursor:'pointer', fontFamily:'DM Sans', textAlign:'left' }}>
          <Icon name="gear" size={20} color={showSettings?th.accentSoftText:th.textSub}/> Settings
        </button>
      </nav>
      <main style={{ flex:1, display:'flex', justifyContent:'center', overflow:'hidden' }}>
        <div style={{ width:'100%', maxWidth:720, height:'100%', display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {renderScreen()}
        </div>
      </main>
      {showTweaks && <TweaksPanel tweaks={tweaks} setTweaks={setTweaks} onClose={() => setShowTweaks(false)}/>}
      {toastQueue[0] && <AchievementToast key={toastQueue[0].id} achievement={toastQueue[0]} tweaks={tweaks} onDismiss={() => setToastQueue(q => q.slice(1))}/>}
    </div>
  );

  // ── MOBILE: top bar + content + bottom nav ──
  return (
    <div style={{ display:'flex', flexDirection:'column', width:'100%', maxWidth:480, height:'100%', margin:'0 auto', background:th.bg, position:'relative', boxShadow: w>480?th.shadowMd:'none' }}>
      <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px 10px', flexShrink:0 }}>
        <span style={{ fontSize:18, fontWeight:700, color:th.text, letterSpacing:'-0.01em' }}>{showSettings ? '' : pageTitle}</span>
        <Wordmark size={17}/>
      </header>

      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {renderScreen()}
      </div>

      {!showSettings && (
        <nav style={{ background:th.tabBg, borderTop:`1px solid ${th.tabBorder}`, padding:'8px 0 22px', display:'flex', flexShrink:0 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)} style={{ flex:1, background:'none', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'6px 0' }}>
              <Icon name={n.icon} size={22} color={tab===n.id?th.accent:th.textMuted}/>
              <span style={{ fontSize:10, fontWeight:tab===n.id?700:400, color:tab===n.id?th.accent:th.textMuted }}>{n.label}</span>
            </button>
          ))}
        </nav>
      )}

      {showTweaks && <TweaksPanel tweaks={tweaks} setTweaks={setTweaks} onClose={() => setShowTweaks(false)}/>}
      {toastQueue[0] && <AchievementToast key={toastQueue[0].id} achievement={toastQueue[0]} tweaks={tweaks} onDismiss={() => setToastQueue(q => q.slice(1))}/>}
    </div>
  );
}

function AppRoot() {
  const [user, setUser] = aState(() => loadLS('crux_auth_user', null));
  const [dbData, setDbData] = aState(null);
  const [loading, setLoading] = aState(() => !!loadLS('crux_auth_user', null));

  aEffect(() => {
    document.body.style.overflow = (user && !loading) ? 'hidden' : '';
  }, [user, loading]);

  // Load DB data whenever we have a confirmed user ID
  aEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    Promise.all([DB.loadProfile(user.id), DB.loadSessions(user.id)])
      .then(([profile, sessions]) => setDbData({ profile, sessions }))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.id]);

  // Resolve user ID from Supabase session — handles page reload, email
  // confirmation redirects, and sign-ins that didn't pass an ID.
  aEffect(() => {
    if (user?.id) return;
    if (typeof Auth === 'undefined') { setLoading(false); return; }
    Auth.getSession().then(session => {
      if (session?.user) {
        const updated = { authed: true, email: session.user.email || '', id: session.user.id, ...(user || {}) };
        saveLS('crux_auth_user', updated);
        setUser(updated);
      } else {
        setLoading(false);
      }
    }).catch(() => setLoading(false));
  }, [!!user]);

  const handleAuthed = (u) => {
    const stored = { authed: true, ...(u?.email && { email: u.email }), ...(u?.id && { id: u.id }) };
    saveLS('crux_auth_user', stored);
    setUser(stored);
    setLoading(true);
  };

  const handleSignOut = async () => {
    try { await Auth.signOut(); } catch(e) {}
    saveLS('crux_auth_user', null);
    setDbData(null);
    setLoading(false);
    setUser(null);
    document.body.style.overflow = '';
  };

  if (!user && !loading) return <AuthFlow onAuthed={handleAuthed}/>;

  if (loading) {
    const th = THEMES[loadLS('crux_tweaks', {})?.theme || 'pure'];
    return (
      <div style={{ minHeight:'100vh', background:th.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
          <div className="au-spin" style={{ width:28, height:28, border:`3px solid ${th.border}`, borderTopColor:th.accent, borderRadius:'50%' }}/>
          <span style={{ fontSize:13, color:th.textSub, fontFamily:"'DM Sans', sans-serif" }}>Loading…</span>
        </div>
      </div>
    );
  }

  return <App userId={user.id} initialDbData={dbData} onSignOut={handleSignOut}/>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<AppRoot/>);
