// ── CRUX · profile, settings, goals, onboarding ──────────────────────────────
const { useState: pState, useRef: pRef } = React;

// ── AVATAR ───────────────────────────────────────────────────────────────────
function Avatar({ profile, th, size=72, onPick }) {
  const fileRef = pRef();
  const initials = (profile.name || 'You').trim().split(/\s+/).map(w => w[0]).slice(0,2).join('').toUpperCase();
  const handle = (e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = ev => onPick(ev.target.result); r.readAsDataURL(f); };
  return (
    <div style={{ position:'relative', width:size, height:size }}>
      <div style={{ width:size, height:size, borderRadius:'50%', overflow:'hidden', background:th.accentSoft, display:'flex', alignItems:'center', justifyContent:'center', border:`1px solid ${th.border}` }}>
        {profile.avatar ? <img src={profile.avatar} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt=""/> : <span style={{ fontSize:size*0.34, fontWeight:700, color:th.accentSoftText }}>{initials}</span>}
      </div>
      {onPick && <>
        <button onClick={() => fileRef.current.click()} style={{ position:'absolute', bottom:-2, right:-2, width:size*0.36, height:size*0.36, borderRadius:'50%', background:th.accent, border:`2px solid ${th.bg}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          <Icon name="camera" size={size*0.18} color={th.accentText}/>
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handle}/>
      </>}
    </div>
  );
}

// ── PROFILE ──────────────────────────────────────────────────────────────────
function ProfileScreen({ sessions, currentSession, profile, setProfile, goals, setGoals, tweaks, onOpenSettings }) {
  const th = THEMES[tweaks.theme];
  const d = computeDerived(sessions, currentSession);
  const achievements = evalAchievements(d);
  const earned = achievements.filter(a => a.earned).length;
  const [editing, setEditing] = pState(false);
  const [name, setName] = pState(profile.name);
  const [gym, setGym] = pState(profile.homeGym);
  const weeklyDone = sessions.filter(s => weekIndex(s.startTime) === weekIndex(Date.now())).length + (currentSession ? (weekIndex(currentSession.startTime)===weekIndex(Date.now())?1:0) : 0);

  const maxVLabel = d.maxV >= 0 ? V_GRADES[d.maxV] : '—';
  const maxFontLabel = d.maxFont >= 0 ? FONT_GRADES[d.maxFont] : '—';
  const saveProfile = () => { setProfile({ ...profile, name, homeGym: gym }); setEditing(false); };

  return (
    <div className="screen-pad scroll">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:22 }}>
        <Avatar profile={profile} th={th} size={72} onPick={(a) => setProfile({ ...profile, avatar:a })}/>
        <div style={{ flex:1, minWidth:0 }}>
          {editing ? (
            <input value={name} onChange={e => setName(e.target.value)} autoFocus placeholder="Your name" style={{ fontSize:22, fontWeight:700, color:th.text, background:th.surface, border:`1px solid ${th.border}`, borderRadius:th.radiusSm, padding:'4px 8px', width:'100%', fontFamily:'DM Sans', outline:'none' }}/>
          ) : (
            <h1 style={{ fontSize:24, fontWeight:700, color:th.text, letterSpacing:'-0.02em', overflow:'hidden', textOverflow:'ellipsis' }}>{profile.name || 'Your name'}</h1>
          )}
          <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:3 }}>
            <Icon name="location" size={13} color={th.textSub}/>
            {editing ? (
              <input value={gym} onChange={e => setGym(e.target.value)} placeholder="Home gym" style={{ fontSize:13, color:th.textSub, background:th.surface, border:`1px solid ${th.border}`, borderRadius:6, padding:'2px 6px', fontFamily:'DM Sans', outline:'none', flex:1 }}/>
            ) : (
              <span style={{ fontSize:13, color:th.textSub }}>{profile.homeGym || 'Set your home gym'}</span>
            )}
          </div>
        </div>
        <button className="icon-btn" onClick={() => editing ? saveProfile() : setEditing(true)} style={{ background:th.surface, border:`1px solid ${th.border}` }}>
          <Icon name={editing ? 'check' : 'edit'} size={16} color={editing ? th.success : th.textSub}/>
        </button>
      </div>

      {/* Streak + grade strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(96px, 1fr))', gap:10, marginBottom:14 }}>
        <div style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:th.radius, padding:'14px', boxShadow:th.shadow, display:'flex', alignItems:'center', gap:8 }}>
          <Icon name="flame" size={20} color={d.weekStreak>0?th.warning:th.textMuted}/>
          <div><p style={{ fontSize:20, fontWeight:800, color:th.text, lineHeight:1 }}>{d.weekStreak}</p><p style={{ fontSize:11, color:th.textSub }}>wk streak</p></div>
        </div>
        <div style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:th.radius, padding:'14px', boxShadow:th.shadow }}>
          <p style={{ fontSize:20, fontWeight:800, color:th.text, lineHeight:1, fontFamily:"'DM Mono', monospace" }}>{maxVLabel}</p><p style={{ fontSize:11, color:th.textSub, marginTop:2 }}>top V</p>
        </div>
        <div style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:th.radius, padding:'14px', boxShadow:th.shadow }}>
          <p style={{ fontSize:20, fontWeight:800, color:th.text, lineHeight:1, fontFamily:"'DM Mono', monospace" }}>{maxFontLabel}</p><p style={{ fontSize:11, color:th.textSub, marginTop:2 }}>top Font</p>
        </div>
      </div>

      {/* Totals */}
      <div style={{ display:'flex', background:th.card, border:`1px solid ${th.border}`, borderRadius:th.radius, marginBottom:14, boxShadow:th.shadow, overflow:'hidden' }}>
        {[{l:'Climbs',v:d.totalClimbs,c:th.text},{l:'Sends',v:d.totalSends,c:th.success},{l:'Flashes',v:d.totalFlashes,c:th.warning}].map((s,i) => (
          <div key={i} style={{ flex:1, textAlign:'center', padding:'16px 4px', borderRight:i<2?`1px solid ${th.border}`:'none' }}>
            <p style={{ fontSize:24, fontWeight:800, color:s.c }}>{s.v}</p><p style={{ fontSize:11, color:th.textSub, marginTop:2 }}>{s.l}</p>
          </div>
        ))}
      </div>

      {/* Weekly goal */}
      <div style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:th.radius, padding:'16px', marginBottom:14, boxShadow:th.shadow }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <Ring value={weeklyDone} max={goals.weeklySessions} size={52} color={weeklyDone>=goals.weeklySessions?th.success:th.accent} track={th.surface}>
            <span style={{ fontSize:13, fontWeight:800, color:th.text }}>{weeklyDone}/{goals.weeklySessions}</span>
          </Ring>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:14, fontWeight:700, color:th.text }}>Weekly goal</p>
            <p style={{ fontSize:12, color:th.textSub }}>{weeklyDone>=goals.weeklySessions ? 'Smashed it this week! 🎉' : `${goals.weeklySessions-weeklyDone} more session${goals.weeklySessions-weeklyDone!==1?'s':''} to go`}</p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:14, paddingTop:14, borderTop:`1px solid ${th.border}` }}>
          <span style={{ fontSize:13, color:th.textSub, flex:1 }}>Sessions per week</span>
          <div style={{ display:'flex', alignItems:'center', border:`1px solid ${th.border}`, borderRadius:th.radiusSm, overflow:'hidden' }}>
            <button onClick={() => setGoals({ ...goals, weeklySessions: Math.max(1, goals.weeklySessions-1) })} style={{ background:th.surface, border:'none', padding:'6px 12px', cursor:'pointer', fontSize:16, color:th.text, fontWeight:700 }}>−</button>
            <span style={{ padding:'6px 6px', fontSize:15, fontWeight:700, color:th.text, minWidth:28, textAlign:'center', fontFamily:"'DM Mono', monospace" }}>{goals.weeklySessions}</span>
            <button onClick={() => setGoals({ ...goals, weeklySessions: Math.min(14, goals.weeklySessions+1) })} style={{ background:th.surface, border:'none', padding:'6px 12px', cursor:'pointer', fontSize:16, color:th.text, fontWeight:700 }}>+</button>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', margin:'8px 2px 12px' }}>
        <p style={{ fontSize:13, fontWeight:700, color:th.text }}>Achievements</p>
        <p style={{ fontSize:12, color:th.textSub }}>{earned} of {achievements.length}</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(100px, 1fr))', gap:10, marginBottom:20 }}>
        {achievements.map(a => (
          <div key={a.id} style={{ background:a.earned?th.card:'transparent', border:`1px solid ${a.earned?th.border:th.border}`, borderRadius:th.radius, padding:'14px 10px', textAlign:'center', opacity:a.earned?1:0.5, boxShadow:a.earned?th.shadow:'none' }}>
            <div style={{ width:38, height:38, borderRadius:'50%', background:a.earned?th.accentSoft:th.surface, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 8px' }}>
              <Icon name={a.icon} size={18} color={a.earned?th.accentSoftText:th.textMuted}/>
            </div>
            <p style={{ fontSize:12, fontWeight:700, color:a.earned?th.text:th.textSub, lineHeight:1.2 }}>{a.label}</p>
            <p style={{ fontSize:10, color:th.textSub, marginTop:3, lineHeight:1.3 }}>{a.desc}</p>
          </div>
        ))}
      </div>

      <button onClick={onOpenSettings} style={{ width:'100%', padding:'14px', borderRadius:th.radius, border:`1px solid ${th.border}`, background:th.surface, color:th.text, fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
        <Icon name="gear" size={18} color={th.text}/> Settings
      </button>
    </div>
  );
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────
function SettingsScreen({ tweaks, setTweaks, sessions, setSessions, setCurrentSession, onClose, onSignOut }) {
  const th = THEMES[tweaks.theme];
  const set = (k, v) => setTweaks({ ...tweaks, [k]: v });
  const REST = [60,120,180,240,300];

  const exportData = () => {
    const data = { sessions, profile: loadLS('crux_profile',{}), goals: loadLS('crux_goals',{}), tweaks, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `crux-export-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url);
  };
  const clearAll = () => { if (confirm('Delete ALL sessions and climbs? This cannot be undone.')) { setSessions([]); setCurrentSession(null); } };

  const Row = ({ children }) => <div style={{ marginBottom:24 }}>{children}</div>;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 20px', borderBottom:`1px solid ${th.border}` }}>
        <button className="icon-btn" onClick={onClose} style={{ background:th.surface, border:`1px solid ${th.border}` }}><Icon name="chevLeft" size={18} color={th.text}/></button>
        <span style={{ fontSize:18, fontWeight:700, color:th.text }}>Settings</span>
      </div>

      <div className="screen-pad scroll" style={{ flex:1 }}>
        <Row>
          <Label th={th}>Preferred grade system</Label>
          <div style={{ display:'flex', gap:8 }}>
            {[['v','V-Scale'],['font','Font'],['both','Both']].map(([k,l]) => (
              <button key={k} onClick={() => set('gradePref', k)} style={{ flex:1, padding:'12px 0', borderRadius:th.radius, border:`1.5px solid ${tweaks.gradePref===k?th.accent:th.border}`, background:tweaks.gradePref===k?th.accentSoft:th.surface, color:tweaks.gradePref===k?th.accentSoftText:th.text, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans' }}>{l}</button>
            ))}
          </div>
        </Row>

        <Row>
          <Label th={th}>Default rest time</Label>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {REST.map(s => (
              <button key={s} onClick={() => set('defaultRestSeconds', s)} style={{ flex:'1 1 60px', padding:'12px 0', borderRadius:th.radius, border:`1.5px solid ${tweaks.defaultRestSeconds===s?th.accent:th.border}`, background:tweaks.defaultRestSeconds===s?th.accentSoft:th.surface, color:tweaks.defaultRestSeconds===s?th.accentSoftText:th.text, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans' }}>{fmtRest(s)}</button>
            ))}
          </div>
        </Row>

        <Row>
          <Label th={th}>Theme</Label>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[['pure','Pure White','#FFFFFF','#111111'],['stone','Stone & Chalk','#F2ECE4','#5C4A35'],['night','Night Mode','#141414','#C8FF00']].map(([k,l,bg,ac]) => (
              <button key={k} onClick={() => set('theme', k)} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:th.radius, border:`1.5px solid ${tweaks.theme===k?th.accent:th.border}`, background:th.surface, cursor:'pointer' }}>
                <div style={{ display:'flex' }}>
                  <div style={{ width:20, height:20, borderRadius:'50%', background:bg, border:`1px solid ${th.border}` }}/>
                  <div style={{ width:20, height:20, borderRadius:'50%', background:ac, marginLeft:-6, border:`1px solid ${th.border}` }}/>
                </div>
                <span style={{ flex:1, textAlign:'left', fontSize:14, fontWeight:600, color:th.text }}>{l}</span>
                {tweaks.theme===k && <Icon name="check" size={18} color={th.accent}/>}
              </button>
            ))}
          </div>
        </Row>

        <Row>
          <Label th={th}>Data</Label>
          <button onClick={exportData} style={{ width:'100%', padding:'13px', borderRadius:th.radius, border:`1px solid ${th.border}`, background:th.surface, color:th.text, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans', display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:8 }}>
            <Icon name="download" size={16} color={th.text}/> Export my data (JSON)
          </button>
          <button onClick={clearAll} style={{ width:'100%', padding:'13px', borderRadius:th.radius, border:`1px solid ${th.dangerBg}`, background:th.dangerBg, color:th.danger, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            <Icon name="trash" size={16} color={th.danger}/> Clear all data
          </button>
        </Row>

        {onSignOut && (
          <Row>
            <button onClick={onSignOut} style={{ width:'100%', padding:'13px', borderRadius:th.radius, border:`1px solid ${th.border}`, background:th.surface, color:th.textSub, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              Sign out
            </button>
          </Row>
        )}

        <p style={{ textAlign:'center', fontSize:12, color:th.textMuted, marginTop:8 }}>CRUX · climbing tracker</p>
      </div>
    </div>
  );
}

// ── ONBOARDING ──────────────────────────────────────────────────────────────────
function Onboarding({ tweaks, setTweaks, profile, setProfile, goals, setGoals, onDone }) {
  const th = THEMES[tweaks.theme];
  const [step, setStep] = pState(0);
  const [name, setName] = pState('');
  const [gym, setGym] = pState('');
  const [pref, setPref] = pState('both');
  const [weekly, setWeekly] = pState(3);

  const finish = () => {
    setProfile({ ...profile, name: name.trim() || 'Climber', homeGym: gym.trim() });
    setTweaks({ ...tweaks, gradePref: pref, gymName: gym.trim() || tweaks.gymName });
    setGoals({ ...goals, weeklySessions: weekly });
    onDone();
  };

  const steps = [
    // Welcome
    <div key="0" style={{ textAlign:'center' }}>
      <div style={{ width:72, height:72, borderRadius:20, background:th.accent, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px' }}>
        <Icon name="logo" size={40} color={th.accentText}/>
      </div>
      <h1 style={{ fontSize:32, fontWeight:800, color:th.text, letterSpacing:'-0.03em', marginBottom:10 }}>CRUX</h1>
      <p style={{ fontSize:16, color:th.textSub, lineHeight:1.5, maxWidth:300, margin:'0 auto' }}>Track every boulder, time your rests, and watch your grades climb.</p>
    </div>,
    // Name + gym
    <div key="1">
      <h2 style={{ fontSize:24, fontWeight:700, color:th.text, marginBottom:6 }}>Who's climbing?</h2>
      <p style={{ fontSize:14, color:th.textSub, marginBottom:24 }}>So we can personalise your profile.</p>
      <Label th={th}>Your name</Label>
      <input value={name} onChange={e => setName(e.target.value)} autoFocus placeholder="e.g. Alex" style={{ width:'100%', padding:'14px', borderRadius:th.radius, border:`1px solid ${th.border}`, background:th.surface, fontSize:16, color:th.text, fontFamily:'DM Sans', outline:'none', marginBottom:18 }}/>
      <Label th={th}>Home gym</Label>
      <input value={gym} onChange={e => setGym(e.target.value)} placeholder="e.g. The Climbing Hangar" style={{ width:'100%', padding:'14px', borderRadius:th.radius, border:`1px solid ${th.border}`, background:th.surface, fontSize:16, color:th.text, fontFamily:'DM Sans', outline:'none' }}/>
    </div>,
    // Grade pref
    <div key="2">
      <h2 style={{ fontSize:24, fontWeight:700, color:th.text, marginBottom:6 }}>Which grades?</h2>
      <p style={{ fontSize:14, color:th.textSub, marginBottom:24 }}>Pick the system you use most.</p>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {[['v','V-Scale','V0, V1, V2 …'],['font','Fontainebleau','6A, 6B, 7A …'],['both','Both','switch any time']].map(([k,l,sub]) => (
          <button key={k} onClick={() => setPref(k)} style={{ display:'flex', alignItems:'center', gap:12, padding:'16px', borderRadius:th.radius, border:`1.5px solid ${pref===k?th.accent:th.border}`, background:pref===k?th.accentSoft:th.surface, cursor:'pointer', textAlign:'left' }}>
            <div style={{ flex:1 }}><p style={{ fontSize:15, fontWeight:700, color:pref===k?th.accentSoftText:th.text }}>{l}</p><p style={{ fontSize:12, color:th.textSub, fontFamily:"'DM Mono', monospace" }}>{sub}</p></div>
            {pref===k && <Icon name="check" size={20} color={th.accent}/>}
          </button>
        ))}
      </div>
    </div>,
    // Weekly goal
    <div key="3" style={{ textAlign:'center' }}>
      <h2 style={{ fontSize:24, fontWeight:700, color:th.text, marginBottom:6 }}>Set a weekly goal</h2>
      <p style={{ fontSize:14, color:th.textSub, marginBottom:32 }}>How many sessions per week?</p>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:24, marginBottom:12 }}>
        <button onClick={() => setWeekly(w => Math.max(1, w-1))} className="round-btn" style={{ width:52, height:52, background:th.surface, border:`1px solid ${th.border}`, fontSize:24, color:th.text, fontWeight:700 }}>−</button>
        <div style={{ minWidth:80 }}><p style={{ fontSize:56, fontWeight:800, color:th.text, lineHeight:1, fontFamily:"'DM Mono', monospace" }}>{weekly}</p><p style={{ fontSize:13, color:th.textSub }}>per week</p></div>
        <button onClick={() => setWeekly(w => Math.min(14, w+1))} className="round-btn" style={{ width:52, height:52, background:th.surface, border:`1px solid ${th.border}`, fontSize:24, color:th.text, fontWeight:700 }}>+</button>
      </div>
    </div>,
  ];

  const canNext = step !== 1 || name.trim().length > 0;
  const last = step === steps.length - 1;

  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, background:th.bg, display:'flex', flexDirection:'column' }}>
      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'24px 28px', maxWidth:480, margin:'0 auto', width:'100%' }}>
        {steps[step]}
      </div>
      <div style={{ padding:'20px 28px 32px', maxWidth:480, margin:'0 auto', width:'100%' }}>
        <div style={{ display:'flex', gap:6, justifyContent:'center', marginBottom:18 }}>
          {steps.map((_,i) => <div key={i} style={{ width:i===step?22:7, height:7, borderRadius:4, background:i===step?th.accent:th.border, transition:'width 0.3s' }}/>)}
        </div>
        <div style={{ display:'flex', gap:12 }}>
          {step > 0 && <button onClick={() => setStep(step-1)} style={{ padding:'15px 22px', borderRadius:th.radius, border:`1px solid ${th.border}`, background:th.surface, color:th.text, fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans' }}>Back</button>}
          <button onClick={() => last ? finish() : (canNext && setStep(step+1))} disabled={!canNext} style={{ flex:1, padding:'15px', borderRadius:th.radius, border:'none', background: canNext?th.accent:th.borderStrong, color: canNext?th.accentText:th.textMuted, fontSize:16, fontWeight:700, cursor: canNext?'pointer':'not-allowed', fontFamily:'DM Sans' }}>
            {last ? "Let's climb" : 'Continue'}
          </button>
        </div>
        {step === 0 && <button onClick={finish} style={{ width:'100%', marginTop:12, background:'none', border:'none', color:th.textSub, fontSize:13, cursor:'pointer', fontFamily:'DM Sans' }}>Skip setup</button>}
      </div>
    </div>
  );
}

// ── TWEAKS PANEL (toolbar) ──────────────────────────────────────────────────────
function TweaksPanel({ tweaks, setTweaks, onClose }) {
  const th = THEMES[tweaks.theme];
  const update = (key, val) => { const next = { ...tweaks, [key]: val }; setTweaks(next); window.parent.postMessage({ type:'__edit_mode_set_keys', edits: next }, '*'); };
  return (
    <div style={{ position:'fixed', bottom:20, right:20, background:th.bg, border:`1px solid ${th.border}`, borderRadius:th.radius, padding:'16px', boxShadow:th.shadowMd, zIndex:400, width:240 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <span style={{ fontSize:14, fontWeight:700, color:th.text }}>Tweaks</span>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer' }}><Icon name="x" size={16} color={th.textSub}/></button>
      </div>
      <Label th={th} style={{ fontSize:11 }}>Theme</Label>
      <div style={{ marginBottom:14 }}>
        {[['pure','Pure White'],['stone','Stone & Chalk'],['night','Night Mode']].map(([k,l]) => (
          <button key={k} onClick={() => update('theme', k)} style={{ width:'100%', padding:'8px 10px', marginBottom:4, textAlign:'left', borderRadius:th.radiusSm, border:`1px solid ${tweaks.theme===k?th.accent:th.border}`, background:tweaks.theme===k?th.accentSoft:th.surface, color:tweaks.theme===k?th.accentSoftText:th.text, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'DM Sans' }}>{l}</button>
        ))}
      </div>
      <Label th={th} style={{ fontSize:11 }}>Grade system</Label>
      <div style={{ display:'flex', gap:6 }}>
        {[['v','V'],['font','Font'],['both','Both']].map(([k,l]) => (
          <button key={k} onClick={() => update('gradePref', k)} style={{ flex:1, padding:'7px 0', borderRadius:th.radiusSm, border:`1px solid ${tweaks.gradePref===k?th.accent:th.border}`, background:tweaks.gradePref===k?th.accentSoft:th.surface, color:tweaks.gradePref===k?th.accentSoftText:th.text, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans' }}>{l}</button>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { Avatar, ProfileScreen, SettingsScreen, Onboarding, TweaksPanel });
