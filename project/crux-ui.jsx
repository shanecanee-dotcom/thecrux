// ── CRUX · UI widgets ────────────────────────────────────────────────────────
const { useState: uState, useEffect: uEffect, useRef: uRef } = React;

const Label = ({ th, children, style }) => (
  <p style={{ fontSize:12, fontWeight:600, color:th.textSub, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10, ...style }}>{children}</p>
);

// ── REST TIMER ────────────────────────────────────────────────────────────────
function RestTimer({ tweaks, onClose }) {
  const th = THEMES[tweaks.theme];
  const [target, setTarget] = uState(tweaks.defaultRestSeconds);
  const [remaining, setRemaining] = uState(tweaks.defaultRestSeconds);
  const [running, setRunning] = uState(false);
  const [editing, setEditing] = uState(false);
  const [customMins, setCustomMins] = uState(Math.floor(tweaks.defaultRestSeconds/60));
  const [customSecs, setCustomSecs] = uState(tweaks.defaultRestSeconds%60);
  const interval = uRef(null);

  uEffect(() => {
    if (running) {
      interval.current = setInterval(() => {
        setRemaining(r => { if (r <= 1) { clearInterval(interval.current); setRunning(false); return 0; } return r-1; });
      }, 1000);
    } else clearInterval(interval.current);
    return () => clearInterval(interval.current);
  }, [running]);

  const reset = () => { setRunning(false); setRemaining(target); };
  const setTo = (s) => { setTarget(s); setRemaining(s); setRunning(false); setCustomMins(Math.floor(s/60)); setCustomSecs(s%60); };
  const applyCustom = () => { const t = (parseInt(customMins)||0)*60 + (parseInt(customSecs)||0); if (t>0){ setTo(t); setEditing(false); } };
  const progress = target ? remaining / target : 0;
  const r = 54, circ = 2 * Math.PI * r;
  const PRESETS = [60, 90, 120, 180, 240, 300];
  const done = remaining === 0;

  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" style={{ background: th.bg }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 20px 0' }}>
          <span style={{ fontSize:16, fontWeight:700, color:th.text }}>Rest Timer</span>
          <button className="icon-btn" onClick={onClose} style={{ background:th.surface }}><Icon name="x" size={16} color={th.textSub}/></button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'24px 0 8px' }}>
          <div style={{ position:'relative', width:148, height:148 }}>
            <svg width="148" height="148" style={{ transform:'rotate(-90deg)' }}>
              <circle cx="74" cy="74" r={r} fill="none" stroke={th.border} strokeWidth="7"/>
              <circle cx="74" cy="74" r={r} fill="none" stroke={done ? th.success : th.accent} strokeWidth="7"
                strokeDasharray={circ} strokeDashoffset={circ * (1-progress)} strokeLinecap="round"
                style={{ transition:'stroke-dashoffset 0.5s linear, stroke 0.3s' }}/>
            </svg>
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:32, fontWeight:700, color:done?th.success:th.text, fontFamily:"'DM Mono', monospace" }}>{fmt(remaining)}</span>
              <span style={{ fontSize:11, color:th.textSub, marginTop:2 }}>{done ? 'rest over' : 'remaining'}</span>
            </div>
          </div>

          <div style={{ display:'flex', gap:16, marginTop:22, alignItems:'center' }}>
            <button className="round-btn" onClick={reset} style={{ width:44, height:44, background:th.surface, border:`1px solid ${th.border}` }}>
              <Icon name="reset" size={18} color={th.textSub}/>
            </button>
            <button className="round-btn" onClick={() => setRunning(r => !r)} style={{ width:62, height:62, background:th.accent, border:'none' }}>
              <Icon name={running ? 'pause' : 'play'} size={24} color={th.accentText}/>
            </button>
            <button className="round-btn" onClick={() => setEditing(e => !e)} style={{ width:44, height:44, background: editing?th.accentSoft:th.surface, border:`1px solid ${editing?th.accent:th.border}`, fontSize:12, color:editing?th.accentSoftText:th.textSub, fontWeight:700 }}>
              SET
            </button>
          </div>
        </div>

        {editing && (
          <div style={{ padding:'8px 20px 0' }}>
            <Label th={th} style={{ textAlign:'center', fontSize:11 }}>Quick presets</Label>
            <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap', marginBottom:18 }}>
              {PRESETS.map(s => (
                <button key={s} onClick={() => { setTo(s); setEditing(false); }}
                  style={{ background: target===s ? th.accent : th.surface, color: target===s ? th.accentText : th.text, border:`1px solid ${target===s ? th.accent : th.border}`, borderRadius:th.radiusSm, padding:'8px 14px', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'DM Sans' }}>
                  {fmtRest(s)}
                </button>
              ))}
            </div>
            <Label th={th} style={{ textAlign:'center', fontSize:11 }}>Custom</Label>
            <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'center', paddingBottom:8 }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <input type="number" min="0" max="99" value={customMins} onChange={e => setCustomMins(e.target.value)} className="num-in" style={{ background:th.surface, border:`1px solid ${th.border}`, color:th.text }}/>
                <span style={{ fontSize:11, color:th.textSub }}>min</span>
              </div>
              <span style={{ fontSize:24, fontWeight:700, color:th.textMuted, marginBottom:18 }}>:</span>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <input type="number" min="0" max="59" value={customSecs} onChange={e => setCustomSecs(e.target.value)} className="num-in" style={{ background:th.surface, border:`1px solid ${th.border}`, color:th.text }}/>
                <span style={{ fontSize:11, color:th.textSub }}>sec</span>
              </div>
              <button onClick={applyCustom} style={{ background:th.accent, color:th.accentText, border:'none', borderRadius:th.radiusSm, padding:'10px 16px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'DM Sans', marginBottom:18 }}>Set</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── GRADE SELECTOR ──────────────────────────────────────────────────────────────
function GradeSelector({ value, onChange, th, pref }) {
  const [system, setSystem] = uState(value?.system || (pref === 'font' ? 'font' : 'v'));
  const grades = system === 'v' ? V_GRADES : FONT_GRADES;
  const current = value?.system === system ? value?.grade : null;
  const showToggle = pref !== 'v' && pref !== 'font';

  return (
    <div>
      {showToggle && (
        <div style={{ display:'flex', gap:6, marginBottom:14 }}>
          {[['v','V-Scale'],['font','Fontainebleau']].map(([sys,lbl]) => (
            <button key={sys} onClick={() => setSystem(sys)} style={{ flex:1, padding:'8px 0', borderRadius:th.radiusSm, border:`1px solid ${system===sys ? th.accent : th.border}`, background: system===sys ? th.accent : th.surface, color: system===sys ? th.accentText : th.textSub, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans' }}>
              {lbl}
            </button>
          ))}
        </div>
      )}
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        {grades.map(g => (
          <button key={g} onClick={() => onChange({ system, grade: g })} style={{ padding:'7px 12px', borderRadius:th.radiusSm, border:`1px solid ${current===g ? th.accent : th.border}`, background: current===g ? th.accent : th.surface, color: current===g ? th.accentText : th.text, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:"'DM Mono', monospace", minWidth:44 }}>
            {g}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── ADD CLIMB MODAL ──────────────────────────────────────────────────────────────
function AddClimbModal({ tweaks, onSave, onClose, outdoor = false }) {
  const th = THEMES[tweaks.theme];
  const [grade, setGrade] = uState(null);
  const [outcome, setOutcome] = uState(null);
  const [holdColor, setHoldColor] = uState(null);
  const [wallType, setWallType] = uState(null);
  const [routeName, setRouteName] = uState('');
  const [photo, setPhoto] = uState(null);
  const fileRef = uRef();

  const handlePhoto = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target.result);
    reader.readAsDataURL(file);
  };
  const canSave = grade && outcome;
  const save = () => onSave({
    id: uid(), grade, outcome, attempts: 1, wallType,
    ...(outdoor ? { routeName: routeName.trim() || undefined } : { holdColor }),
    photo, notes: '', time: Date.now(),
  });

  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet scroll" style={{ background:th.bg }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 0' }}><div style={{ width:36, height:4, background:th.borderStrong, borderRadius:2 }}/></div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 20px 0' }}>
          <span style={{ fontSize:17, fontWeight:700, color:th.text }}>Log a climb</span>
          <button className="icon-btn" onClick={onClose} style={{ background:th.surface }}><Icon name="x" size={16} color={th.textSub}/></button>
        </div>

        <div style={{ padding:'20px 20px 0' }}>
          {outdoor && (
            <div style={{ marginBottom:22 }}>
              <Label th={th}>Route name <span style={{ fontWeight:400, color:th.textMuted }}>(optional)</span></Label>
              <input value={routeName} onChange={e => setRouteName(e.target.value)} placeholder="e.g. The Ace, Karma, Alchemy…"
                style={{ width:'100%', background:th.surface, border:`1px solid ${th.border}`, borderRadius:th.radius, padding:'12px 14px', fontSize:15, color:th.text, outline:'none', fontFamily:'DM Sans', display:'block' }}/>
            </div>
          )}

          <div style={{ marginBottom:22 }}>
            <Label th={th}>Grade</Label>
            <GradeSelector value={grade} onChange={setGrade} th={th} pref={tweaks.gradePref}/>
          </div>

          <div style={{ marginBottom:22 }}>
            <Label th={th}>Result</Label>
            <div style={{ display:'flex', gap:8 }}>
              {[
                { key:'flash', icon:'flash', label:'Flash', color:th.warning, bg:th.warningBg },
                { key:'sent',  icon:'check', label:'Sent',  color:th.success, bg:th.successBg },
                { key:'attempt', icon:'x', label:'Attempt', color:th.danger, bg:th.dangerBg },
              ].map(o => (
                <button key={o.key} onClick={() => setOutcome(o.key)} style={{ flex:1, padding:'10px 4px', borderRadius:th.radius, border:`1.5px solid ${outcome===o.key ? o.color : th.border}`, background: outcome===o.key ? o.bg : th.surface, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                  <Icon name={o.icon} size={18} color={outcome===o.key ? o.color : th.textSub}/>
                  <span style={{ fontSize:12, fontWeight:600, color:outcome===o.key ? o.color : th.textSub }}>{o.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom:22 }}>
            <Label th={th}>Wall Type</Label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {WALL_TYPES.map(w => (
                <button key={w.id} onClick={() => setWallType(wallType===w.id ? null : w.id)} style={{ padding:'10px 12px', borderRadius:th.radius, border:`1.5px solid ${wallType===w.id ? th.accent : th.border}`, background: wallType===w.id ? th.accentSoft : th.surface, cursor:'pointer', textAlign:'left' }}>
                  <div style={{ fontSize:13, fontWeight:700, color: wallType===w.id ? th.accentSoftText : th.text }}>{w.label}</div>
                  <div style={{ fontSize:11, color:th.textSub, marginTop:1 }}>{w.angle}</div>
                </button>
              ))}
            </div>
          </div>

          {!outdoor && (
            <div style={{ marginBottom:22 }}>
              <Label th={th}>Hold Colour</Label>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                {HOLD_COLORS.map(c => (
                  <button key={c.id} onClick={() => setHoldColor(holdColor===c.id ? null : c.id)} title={c.label} style={{ width:36, height:36, borderRadius:'50%', background:c.hex, border:`3px solid ${holdColor===c.id ? th.text : 'transparent'}`, cursor:'pointer', outline: holdColor===c.id ? `2px solid ${th.bg}` : 'none', outlineOffset:-4 }}/>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom:28 }}>
            <Label th={th}>Photo</Label>
            {photo ? (
              <div style={{ position:'relative', borderRadius:th.radius, overflow:'hidden', height:160 }}>
                <img src={photo} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="climb"/>
                <button className="round-btn" onClick={() => setPhoto(null)} style={{ position:'absolute', top:8, right:8, width:28, height:28, background:'rgba(0,0,0,0.6)', border:'none' }}><Icon name="x" size={14} color="#fff"/></button>
              </div>
            ) : (
              <button onClick={() => fileRef.current.click()} style={{ width:'100%', height:84, border:`2px dashed ${th.border}`, borderRadius:th.radius, background:th.surface, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6, cursor:'pointer' }}>
                <Icon name="camera" size={20} color={th.textMuted}/>
                <span style={{ fontSize:12, color:th.textMuted }}>Add photo</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display:'none' }} onChange={handlePhoto}/>
          </div>

          <button onClick={save} disabled={!canSave} style={{ width:'100%', padding:'16px', borderRadius:th.radius, border:'none', background: canSave ? th.accent : th.borderStrong, color: canSave ? th.accentText : th.textMuted, fontSize:16, fontWeight:600, cursor: canSave ? 'pointer' : 'not-allowed', marginBottom:8, fontFamily:'DM Sans' }}>
            Log Climb
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CLIMB CARD ──────────────────────────────────────────────────────────────────
function ClimbCard({ climb, th, onDelete, onUpdate, onOpen }) {
  const hc = HOLD_COLORS.find(c => c.id === climb.holdColor);
  const wt = WALL_TYPES.find(w => w.id === climb.wallType);
  const isAttempting = climb.outcome === 'attempt';
  const attempts = climb.attempts || 1;
  const outcomeMap = {
    flash:   { label:'Flash', color:th.warning, bg:th.warningBg },
    sent:    { label:'Sent',  color:th.success, bg:th.successBg },
    attempt: { label:`${attempts} attempt${attempts!==1?'s':''}`, color:th.danger, bg:th.dangerBg },
  };
  const oc = outcomeMap[climb.outcome] || { label:'?', color:th.textSub, bg:th.surface };
  const stop = (e) => e.stopPropagation();

  return (
    <div style={{ background:th.card, border:`1.5px solid ${isAttempting ? th.danger+'44' : th.border}`, borderRadius:th.radius, overflow:'hidden', boxShadow:th.shadow }}>
      <div onClick={onOpen} style={{ padding:'12px 14px', display:'flex', alignItems:'center', gap:10, cursor: onOpen?'pointer':'default' }}>
        {climb.routeName
          ? <span style={{ fontSize:13, fontWeight:600, color:th.textSub, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:110 }}>{climb.routeName}</span>
          : hc && <div style={{ width:9, height:9, borderRadius:'50%', background:hc.hex, flexShrink:0, border:`1px solid ${th.border}` }}/>
        }
        <span style={{ fontFamily:"'DM Mono', monospace", fontSize:15, fontWeight:600, color:th.text, minWidth:34 }}>{climb.grade?.grade || '?'}</span>
        {wt && <span style={{ fontSize:11, color:th.textSub, background:th.surface, border:`1px solid ${th.border}`, borderRadius:4, padding:'1px 6px' }}>{wt.label}</span>}
        {climb.notes && <Icon name="note" size={13} color={th.textMuted}/>}
        <div style={{ flex:1 }}/>
        <span style={{ fontSize:12, fontWeight:600, color:oc.color, background:oc.bg, padding:'3px 8px', borderRadius:th.radiusSm, whiteSpace:'nowrap' }}>{oc.label}</span>
        {climb.photo && <img src={climb.photo} style={{ width:28, height:28, borderRadius:th.radiusSm, objectFit:'cover' }} alt=""/>}
        {onDelete && <button onClick={(e)=>{stop(e);onDelete();}} style={{ background:'none', border:'none', padding:2, cursor:'pointer' }}><Icon name="trash" size={15} color={th.textMuted}/></button>}
      </div>

      {isAttempting && onUpdate && (
        <div onClick={stop} style={{ borderTop:`1px solid ${th.danger}33`, background:th.dangerBg, padding:'10px 14px', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', border:`1px solid ${th.danger}55`, borderRadius:th.radiusSm, overflow:'hidden' }}>
            <button onClick={() => onUpdate({ attempts: Math.max(1, attempts-1) })} style={{ background:'none', border:'none', padding:'6px 10px', cursor:'pointer', fontSize:16, color:th.danger, fontWeight:700, lineHeight:1 }}>−</button>
            <span style={{ padding:'6px 4px', fontSize:13, fontWeight:700, color:th.danger, minWidth:24, textAlign:'center', fontFamily:"'DM Mono', monospace" }}>{attempts}</span>
            <button onClick={() => onUpdate({ attempts: attempts+1 })} style={{ background:'none', border:'none', padding:'6px 10px', cursor:'pointer', fontSize:16, color:th.danger, fontWeight:700, lineHeight:1 }}>+</button>
          </div>
          <span style={{ fontSize:11, color:th.danger, flex:1 }}>attempts — mark as:</span>
          <button onClick={() => onUpdate({ outcome:'sent' })} style={{ background:th.successBg, border:`1px solid ${th.success}44`, borderRadius:th.radiusSm, padding:'6px 12px', fontSize:12, fontWeight:700, color:th.success, cursor:'pointer', fontFamily:'DM Sans' }}>Sent ✓</button>
          <button onClick={() => onUpdate({ outcome:'flash', attempts:1 })} style={{ background:th.warningBg, border:`1px solid ${th.warning}44`, borderRadius:th.radiusSm, padding:'6px 12px', fontSize:12, fontWeight:700, color:th.warning, cursor:'pointer', fontFamily:'DM Sans' }}>Flash ⚡</button>
        </div>
      )}
    </div>
  );
}

// ── CLIMB DETAIL ──────────────────────────────────────────────────────────────────
function ClimbDetailModal({ climb, tweaks, onClose, onUpdate, onDelete }) {
  const th = THEMES[tweaks.theme];
  const hc = HOLD_COLORS.find(c => c.id === climb.holdColor);
  const wt = WALL_TYPES.find(w => w.id === climb.wallType);
  const [notes, setNotes] = uState(climb.notes || '');
  const attempts = climb.attempts || 1;
  const outcomeMap = {
    flash:   { label:'Flash', color:th.warning, bg:th.warningBg },
    sent:    { label:'Sent',  color:th.success, bg:th.successBg },
    attempt: { label:`${attempts} attempt${attempts!==1?'s':''}`, color:th.danger, bg:th.dangerBg },
  };
  const oc = outcomeMap[climb.outcome];
  const saveNotes = () => onUpdate({ notes });

  return (
    <div className="sheet-wrap" onClick={() => { saveNotes(); onClose(); }}>
      <div className="sheet scroll" style={{ background:th.bg }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 0' }}><div style={{ width:36, height:4, background:th.borderStrong, borderRadius:2 }}/></div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'14px 20px 16px' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontFamily:"'DM Mono', monospace", fontSize:24, fontWeight:700, color:th.text }}>{climb.grade?.grade}</span>
              <span style={{ fontSize:12, color:th.textSub }}>{climb.grade?.system==='v'?'V-Scale':'Font'}</span>
            </div>
            {climb.routeName && <p style={{ fontSize:15, fontWeight:600, color:th.text, marginTop:3 }}>{climb.routeName}</p>}
          </div>
          <span style={{ fontSize:13, fontWeight:700, color:oc.color, background:oc.bg, padding:'5px 12px', borderRadius:th.radiusSm, flexShrink:0 }}>{oc.label}</span>
        </div>

        {climb.photo && <div style={{ padding:'0 20px 16px' }}><img src={climb.photo} style={{ width:'100%', borderRadius:th.radius, maxHeight:280, objectFit:'cover' }} alt="climb"/></div>}

        <div style={{ padding:'0 20px', display:'flex', gap:10, flexWrap:'wrap', marginBottom:18 }}>
          {wt && <div style={{ flex:'1 1 40%', background:th.surface, border:`1px solid ${th.border}`, borderRadius:th.radius, padding:'10px 14px' }}>
            <p style={{ fontSize:11, color:th.textSub }}>Wall</p>
            <p style={{ fontSize:14, fontWeight:700, color:th.text }}>{wt.label} <span style={{ fontWeight:400, color:th.textSub, fontSize:12 }}>{wt.angle}</span></p>
          </div>}
          {hc && <div style={{ flex:'1 1 40%', background:th.surface, border:`1px solid ${th.border}`, borderRadius:th.radius, padding:'10px 14px' }}>
            <p style={{ fontSize:11, color:th.textSub }}>Hold</p>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}><div style={{ width:14, height:14, borderRadius:'50%', background:hc.hex, border:`1px solid ${th.border}` }}/><p style={{ fontSize:14, fontWeight:700, color:th.text }}>{hc.label}</p></div>
          </div>}
          <div style={{ flex:'1 1 40%', background:th.surface, border:`1px solid ${th.border}`, borderRadius:th.radius, padding:'10px 14px' }}>
            <p style={{ fontSize:11, color:th.textSub }}>Attempts</p>
            <p style={{ fontSize:14, fontWeight:700, color:th.text }}>{attempts}</p>
          </div>
          <div style={{ flex:'1 1 40%', background:th.surface, border:`1px solid ${th.border}`, borderRadius:th.radius, padding:'10px 14px' }}>
            <p style={{ fontSize:11, color:th.textSub }}>Logged</p>
            <p style={{ fontSize:14, fontWeight:700, color:th.text }}>{fmtTime(climb.time)}</p>
          </div>
        </div>

        <div style={{ padding:'0 20px 18px' }}>
          <Label th={th}>Notes</Label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} onBlur={saveNotes} placeholder="Beta, how it felt, what to try next time…"
            style={{ width:'100%', minHeight:80, resize:'vertical', background:th.surface, border:`1px solid ${th.border}`, borderRadius:th.radius, padding:'12px 14px', fontSize:14, color:th.text, outline:'none', fontFamily:'DM Sans', lineHeight:1.5 }}/>
        </div>

        {climb.outcome === 'attempt' && (
          <div style={{ padding:'0 20px 16px', display:'flex', gap:10 }}>
            <button onClick={() => { onUpdate({ outcome:'sent' }); onClose(); }} style={{ flex:1, padding:'13px', borderRadius:th.radius, border:`1px solid ${th.success}44`, background:th.successBg, color:th.success, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'DM Sans' }}>Mark Sent ✓</button>
            <button onClick={() => { onUpdate({ outcome:'flash', attempts:1 }); onClose(); }} style={{ flex:1, padding:'13px', borderRadius:th.radius, border:`1px solid ${th.warning}44`, background:th.warningBg, color:th.warning, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'DM Sans' }}>Flash ⚡</button>
          </div>
        )}

        <div style={{ padding:'0 20px 32px' }}>
          <button onClick={() => { onDelete(); onClose(); }} style={{ width:'100%', padding:'12px', borderRadius:th.radius, border:`1px solid ${th.border}`, background:'none', color:th.danger, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            <Icon name="trash" size={16} color={th.danger}/> Delete climb
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Label, RestTimer, GradeSelector, AddClimbModal, ClimbCard, ClimbDetailModal });
