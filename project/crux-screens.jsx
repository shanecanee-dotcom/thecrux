// ── CRUX · core screens ──────────────────────────────────────────────────────
const { useState: sState, useEffect: sEffect } = React;

// Small reusable progress ring
function Ring({ value, max, size=44, stroke=5, color, track, children }) {
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  const p = max ? Math.min(value / max, 1) : 0;
  return (
    <div style={{ position:'relative', width:size, height:size }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={track} strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={circ*(1-p)} strokeLinecap="round" style={{ transition:'stroke-dashoffset 0.5s' }}/>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>{children}</div>
    </div>
  );
}

// ── SESSION ──────────────────────────────────────────────────────────────────
function SessionScreen({ sessions, setSessions, currentSession, setCurrentSession, tweaks, goals }) {
  const th = THEMES[tweaks.theme];
  const [showAdd, setShowAdd] = sState(false);
  const [showTimer, setShowTimer] = sState(false);
  const [detail, setDetail] = sState(null);
  const [gymInput, setGymInput] = sState(tweaks.gymName);

  const startSession = () => setCurrentSession({ id: uid(), gym: gymInput, startTime: Date.now(), climbs: [] });
  const endSession = () => { setSessions(prev => [{ ...currentSession, endTime: Date.now() }, ...prev]); setCurrentSession(null); };
  const addClimb = (climb) => { setCurrentSession(s => ({ ...s, climbs: [...(s.climbs||[]), climb] })); setShowAdd(false); setShowTimer(true); };
  const deleteClimb = (id) => setCurrentSession(s => ({ ...s, climbs: s.climbs.filter(c => c.id !== id) }));
  const updateClimb = (id, ch) => setCurrentSession(s => ({ ...s, climbs: s.climbs.map(c => c.id === id ? { ...c, ...ch } : c) }));

  const climbs = currentSession?.climbs || [];
  const sends = climbs.filter(isSend).length;
  const weeklyDone = sessions.filter(s => weekIndex(s.startTime) === weekIndex(Date.now())).length;

  // ── No active session ──
  if (!currentSession) return (
    <div className="screen-pad">
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:30, fontWeight:700, color:th.text, lineHeight:1.05, letterSpacing:'-0.02em' }}>Ready to climb?</h1>
        <p style={{ fontSize:15, color:th.textSub, marginTop:6 }}>Start a session to track your boulders.</p>
      </div>

      {/* Weekly goal */}
      {goals.weeklySessions > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:14, background:th.card, border:`1px solid ${th.border}`, borderRadius:th.radius, padding:'14px 16px', marginBottom:16, boxShadow:th.shadow }}>
          <Ring value={weeklyDone} max={goals.weeklySessions} size={48} color={weeklyDone>=goals.weeklySessions?th.success:th.accent} track={th.surface}>
            <Icon name={weeklyDone>=goals.weeklySessions?'check':'target'} size={18} color={weeklyDone>=goals.weeklySessions?th.success:th.accent}/>
          </Ring>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:14, fontWeight:700, color:th.text }}>Weekly goal</p>
            <p style={{ fontSize:13, color:th.textSub }}>{weeklyDone} of {goals.weeklySessions} sessions this week</p>
          </div>
        </div>
      )}

      <Label th={th}>Gym</Label>
      <div style={{ display:'flex', alignItems:'center', gap:10, background:th.surface, borderRadius:th.radius, border:`1px solid ${th.border}`, padding:'12px 14px', marginBottom:16 }}>
        <Icon name="location" size={16} color={th.textSub}/>
        <input value={gymInput} onChange={e => setGymInput(e.target.value)} placeholder="Gym name" style={{ background:'none', border:'none', outline:'none', fontSize:15, color:th.text, flex:1, fontFamily:'DM Sans' }}/>
      </div>

      <button onClick={startSession} style={{ width:'100%', padding:'16px', borderRadius:th.radius, background:th.accent, color:th.accentText, fontSize:16, fontWeight:700, border:'none', cursor:'pointer', fontFamily:'DM Sans' }}>Start Session</button>

      {sessions.length > 0 && (
        <div style={{ marginTop:30 }}>
          <Label th={th}>Last session</Label>
          <div style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:th.radius, padding:'14px 16px', boxShadow:th.shadow }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div><p style={{ fontSize:14, fontWeight:600, color:th.text }}>{sessions[0].gym}</p><p style={{ fontSize:12, color:th.textSub, marginTop:2 }}>{fmtDate(sessions[0].startTime)}</p></div>
              <div style={{ textAlign:'right' }}><p style={{ fontSize:20, fontWeight:700, color:th.text }}>{sessions[0].climbs?.length||0}</p><p style={{ fontSize:11, color:th.textSub }}>problems</p></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── Active session ──
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ padding:'18px 20px 14px', borderBottom:`1px solid ${th.border}` }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:th.success, boxShadow:`0 0 0 3px ${th.successBg}` }}/>
              <span style={{ fontSize:12, fontWeight:600, color:th.success }}>Session active</span>
            </div>
            <p style={{ fontSize:17, fontWeight:700, color:th.text }}>{currentSession.gym}</p>
            <p style={{ fontSize:12, color:th.textSub }}>Started {fmtTime(currentSession.startTime)}</p>
          </div>
          <div style={{ textAlign:'right' }}><p style={{ fontSize:26, fontWeight:800, color:th.text }}>{climbs.length}</p><p style={{ fontSize:11, color:th.textSub }}>{sends}/{climbs.length} sent</p></div>
        </div>
      </div>

      <div className="scroll" style={{ flex:1, padding:'16px 20px' }}>
        {climbs.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:160, gap:8 }}>
            <Icon name="mountain" size={32} color={th.textMuted}/>
            <p style={{ fontSize:14, color:th.textMuted }}>No climbs yet — add your first!</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[...climbs].reverse().map(c => (
              <ClimbCard key={c.id} climb={c} th={th} onDelete={() => deleteClimb(c.id)} onUpdate={(ch) => updateClimb(c.id, ch)} onOpen={() => setDetail(c)}/>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding:'12px 20px 18px', borderTop:`1px solid ${th.border}` }}>
        <div style={{ display:'flex', gap:10, marginBottom:10 }}>
          <button onClick={() => setShowTimer(true)} style={{ flex:1, padding:'13px 0', borderRadius:th.radius, border:`1px solid ${th.border}`, background:th.surface, color:th.text, fontSize:14, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:8, cursor:'pointer', fontFamily:'DM Sans' }}>
            <Icon name="timer" size={16} color={th.text}/> Rest Timer
          </button>
          <button onClick={() => setShowAdd(true)} style={{ flex:2, padding:'13px 0', borderRadius:th.radius, border:'none', background:th.accent, color:th.accentText, fontSize:14, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:8, cursor:'pointer', fontFamily:'DM Sans' }}>
            <Icon name="plus" size={18} color={th.accentText}/> Add Climb
          </button>
        </div>
        <button onClick={endSession} style={{ width:'100%', padding:'13px', borderRadius:th.radius, border:`1px solid ${th.dangerBg}`, background:th.dangerBg, color:th.danger, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans' }}>End Session</button>
      </div>

      {showAdd && <AddClimbModal tweaks={tweaks} onSave={addClimb} onClose={() => setShowAdd(false)}/>}
      {showTimer && <RestTimer tweaks={tweaks} onClose={() => setShowTimer(false)}/>}
      {detail && <ClimbDetailModal climb={climbs.find(c=>c.id===detail.id)||detail} tweaks={tweaks} onClose={() => setDetail(null)} onUpdate={(ch) => updateClimb(detail.id, ch)} onDelete={() => deleteClimb(detail.id)}/>}
    </div>
  );
}

// ── HISTORY ──────────────────────────────────────────────────────────────────
function HistoryScreen({ sessions, setSessions, tweaks }) {
  const th = THEMES[tweaks.theme];
  const [expanded, setExpanded] = sState(null);
  const [detail, setDetail] = sState(null);

  if (sessions.length === 0) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', padding:40, gap:12 }}>
      <Icon name="history" size={40} color={th.textMuted}/>
      <p style={{ fontSize:15, color:th.textMuted, textAlign:'center' }}>No sessions yet.<br/>Start climbing to build your history!</p>
    </div>
  );

  return (
    <div className="screen-pad scroll">
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {sessions.map(s => {
          const sends = s.climbs?.filter(isSend).length||0;
          const flashes = s.climbs?.filter(c => c.outcome==='flash').length||0;
          const isOpen = expanded === s.id;
          const duration = s.endTime ? Math.round((s.endTime - s.startTime)/60000) : null;
          return (
            <div key={s.id} style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:th.radius, overflow:'hidden', boxShadow:th.shadow }}>
              <button onClick={() => setExpanded(isOpen ? null : s.id)} style={{ width:'100%', padding:'14px 16px', background:'none', border:'none', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', textAlign:'left' }}>
                <div><p style={{ fontSize:15, fontWeight:700, color:th.text, marginBottom:2 }}>{s.gym}</p><p style={{ fontSize:12, color:th.textSub }}>{fmtDate(s.startTime)}{duration ? ` · ${duration}min` : ''}</p></div>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ textAlign:'right' }}><p style={{ fontSize:18, fontWeight:700, color:th.text }}>{s.climbs?.length||0}</p><p style={{ fontSize:11, color:th.textSub }}>problems</p></div>
                  <Icon name={isOpen ? 'chevDown' : 'chevRight'} size={16} color={th.textSub}/>
                </div>
              </button>
              {isOpen && (
                <div style={{ borderTop:`1px solid ${th.border}` }}>
                  <div style={{ display:'flex', borderBottom:`1px solid ${th.border}` }}>
                    {[{l:'Sent',v:sends,c:th.success},{l:'Flashed',v:flashes,c:th.warning},{l:'Attempts',v:(s.climbs?.length||0)-sends,c:th.danger}].map((st,i) => (
                      <div key={i} style={{ flex:1, textAlign:'center', padding:'10px 4px', borderRight: i<2 ? `1px solid ${th.border}` : 'none' }}>
                        <p style={{ fontSize:18, fontWeight:700, color:st.c }}>{st.v}</p><p style={{ fontSize:11, color:th.textSub }}>{st.l}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:8 }}>
                    {s.climbs?.map(c => <ClimbCard key={c.id} climb={c} th={th} onOpen={() => setDetail({ ...c, _sid:s.id })}/>)}
                  </div>
                  <div style={{ padding:'0 14px 12px' }}>
                    <button onClick={() => setSessions(prev => prev.filter(x => x.id !== s.id))} style={{ width:'100%', padding:'10px', borderRadius:th.radiusSm, border:`1px solid ${th.dangerBg}`, background:th.dangerBg, color:th.danger, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans' }}>Delete session</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {detail && <ClimbDetailModal climb={detail} tweaks={tweaks} onClose={() => setDetail(null)}
        onUpdate={(ch) => setSessions(prev => prev.map(s => s.id===detail._sid ? { ...s, climbs: s.climbs.map(c => c.id===detail.id ? {...c,...ch} : c) } : s))}
        onDelete={() => setSessions(prev => prev.map(s => s.id===detail._sid ? { ...s, climbs: s.climbs.filter(c => c.id!==detail.id) } : s))}/>}
    </div>
  );
}

// ── STATS ──────────────────────────────────────────────────────────────────────
function StatsScreen({ sessions, tweaks }) {
  const th = THEMES[tweaks.theme];
  const d = computeDerived(sessions);
  const allClimbs = sessions.flatMap(s => s.climbs || []);

  const vGradeCounts = {};
  allClimbs.filter(c => c.grade?.system==='v').forEach(c => {
    const g = c.grade.grade;
    if (!vGradeCounts[g]) vGradeCounts[g] = { sent:0, attempt:0 };
    if (isSend(c)) vGradeCounts[g].sent++; else vGradeCounts[g].attempt++;
  });
  const pyramid = V_GRADES.filter(g => vGradeCounts[g]);
  const maxVal = Math.max(...pyramid.map(g => vGradeCounts[g].sent + vGradeCounts[g].attempt), 1);

  if (d.totalClimbs === 0) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', padding:40, gap:12 }}>
      <Icon name="stats" size={40} color={th.textMuted}/>
      <p style={{ fontSize:15, color:th.textMuted, textAlign:'center' }}>No data yet.<br/>Log some climbs to see stats!</p>
    </div>
  );

  return (
    <div className="screen-pad scroll">
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:10, marginBottom:20 }}>
        {[
          { label:'Sessions', value:d.totalSessions, color:th.text },
          { label:'Problems', value:d.totalClimbs, color:th.text },
          { label:'Sends', value:d.totalSends, color:th.success },
          { label:'Send Rate', value:`${d.sendRate}%`, color: d.sendRate>60?th.success:d.sendRate>40?th.warning:th.danger },
        ].map(st => (
          <div key={st.label} style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:th.radius, padding:'16px', boxShadow:th.shadow }}>
            <p style={{ fontSize:28, fontWeight:800, color:st.color }}>{st.value}</p>
            <p style={{ fontSize:12, color:th.textSub, marginTop:2 }}>{st.label}</p>
          </div>
        ))}
      </div>

      {d.totalFlashes > 0 && (
        <div style={{ background:th.warningBg, border:`1px solid ${th.warning}22`, borderRadius:th.radius, padding:'12px 16px', marginBottom:20, display:'flex', alignItems:'center', gap:12 }}>
          <Icon name="flash" size={20} color={th.warning}/>
          <div><p style={{ fontSize:16, fontWeight:700, color:th.warning }}>{d.totalFlashes} Flash{d.totalFlashes!==1?'es':''}</p><p style={{ fontSize:12, color:th.textSub }}>First-attempt sends</p></div>
        </div>
      )}

      {pyramid.length > 0 && (
        <div style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:th.radius, padding:'16px', marginBottom:20, boxShadow:th.shadow }}>
          <p style={{ fontSize:13, fontWeight:700, color:th.text, marginBottom:16 }}>Grade Pyramid (V-Scale)</p>
          <div style={{ display:'flex', flexDirection:'column-reverse', gap:5 }}>
            {pyramid.map(g => {
              const dd = vGradeCounts[g]; const total = dd.sent + dd.attempt;
              return (
                <div key={g} style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontFamily:"'DM Mono', monospace", fontSize:12, color:th.textSub, width:28, textAlign:'right' }}>{g}</span>
                  <div style={{ flex:1, height:22, background:th.surface, borderRadius:4, overflow:'hidden', position:'relative' }}>
                    <div style={{ position:'absolute', inset:0, width:`${(total/maxVal)*100}%`, background:th.accentSoft, display:'flex' }}>
                      <div style={{ height:'100%', width:`${(dd.sent/total)*100}%`, background:th.accent }}/>
                    </div>
                  </div>
                  <span style={{ fontSize:12, color:th.textSub, width:20 }}>{total}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display:'flex', gap:16, marginTop:14, paddingTop:12, borderTop:`1px solid ${th.border}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}><div style={{ width:12, height:12, borderRadius:2, background:th.accent }}/><span style={{ fontSize:12, color:th.textSub }}>Sent</span></div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}><div style={{ width:12, height:12, borderRadius:2, background:th.accentSoft }}/><span style={{ fontSize:12, color:th.textSub }}>Attempt</span></div>
          </div>
        </div>
      )}

      <div style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:th.radius, padding:'16px', boxShadow:th.shadow }}>
        <p style={{ fontSize:13, fontWeight:700, color:th.text, marginBottom:14 }}>Recent Sessions</p>
        {sessions.slice(0,8).map((s,i) => {
          const c = s.climbs?.length||0;
          const sr = c > 0 ? Math.round((s.climbs.filter(isSend).length/c)*100) : 0;
          return (
            <div key={s.id} style={{ display:'flex', alignItems:'center', gap:10, paddingBottom:i<Math.min(sessions.length,8)-1?10:0, marginBottom:i<Math.min(sessions.length,8)-1?10:0, borderBottom:i<Math.min(sessions.length,8)-1?`1px solid ${th.border}`:'none' }}>
              <div style={{ flex:1 }}><p style={{ fontSize:13, fontWeight:600, color:th.text }}>{fmtDate(s.startTime)}</p><p style={{ fontSize:11, color:th.textSub }}>{s.gym} · {c} problems</p></div>
              <div style={{ textAlign:'right' }}><p style={{ fontSize:13, fontWeight:700, color: sr>60?th.success:sr>40?th.warning:th.danger }}>{sr}%</p><p style={{ fontSize:11, color:th.textSub }}>sent</p></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { Ring, SessionScreen, HistoryScreen, StatsScreen });
