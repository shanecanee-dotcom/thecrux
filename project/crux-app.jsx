// ── CRUX · app shell (responsive) ────────────────────────────────────────────
const { useState: aState, useEffect: aEffect } = React;

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

function App() {
  const [tweaks, setTweaks] = aState(() => ({ theme:'pure', defaultRestSeconds:240, gymName:'The Climbing Hangar', gradePref:'both', ...loadLS('crux_tweaks', {}) }));
  const [sessions, setSessions] = aState(() => loadLS('crux_sessions', []));
  const [currentSession, setCurrentSession] = aState(() => loadLS('crux_session', null));
  const [profile, setProfile] = aState(() => loadLS('crux_profile', { name:'', homeGym:'', avatar:null }));
  const [goals, setGoals] = aState(() => loadLS('crux_goals', { weeklySessions:3 }));
  const [onboarded, setOnboarded] = aState(() => loadLS('crux_onboarded', false));
  const [tab, setTab] = aState(() => loadLS('crux_tab', 'session'));
  const [showSettings, setShowSettings] = aState(false);
  const [showTweaks, setShowTweaks] = aState(false);

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
    if (showSettings) return <SettingsScreen tweaks={tweaks} setTweaks={setTweaks} sessions={sessions} setSessions={setSessions} setCurrentSession={setCurrentSession} onClose={() => setShowSettings(false)}/>;
    switch (tab) {
      case 'session': return <SessionScreen sessions={sessions} setSessions={setSessions} currentSession={currentSession} setCurrentSession={setCurrentSession} tweaks={tweaks} goals={goals}/>;
      case 'history': return <HistoryScreen sessions={sessions} setSessions={setSessions} tweaks={tweaks}/>;
      case 'stats':   return <StatsScreen sessions={sessions} tweaks={tweaks}/>;
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
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
