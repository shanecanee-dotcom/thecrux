// ── CRUX · training screen (hangboard / finger training) ──────────────────────
const { useState: tState, useEffect: tEffect } = React;

// ── HANG TIMER OVERLAY ────────────────────────────────────────────────────────
function HangTimerOverlay({ hangTime, restTime, sets, tweaks, onComplete, onClose }) {
  const th = THEMES[tweaks.theme];
  const [timer, setTimer] = tState({ phase: 'ready', timeLeft: hangTime, set: 1 });

  tEffect(() => {
    if (timer.phase === 'ready' || timer.phase === 'done') return;
    const id = setInterval(() => {
      setTimer(prev => {
        if (prev.timeLeft > 1) return { ...prev, timeLeft: prev.timeLeft - 1 };
        if (prev.phase === 'hanging') {
          navigator.vibrate?.([200, 100, 200]);
          if (prev.set >= sets) return { phase: 'done', timeLeft: 0, set: prev.set };
          if (restTime > 0) return { phase: 'resting', timeLeft: restTime, set: prev.set };
          return { phase: 'hanging', timeLeft: hangTime, set: prev.set + 1 };
        }
        if (prev.phase === 'resting') {
          navigator.vibrate?.([100]);
          return { phase: 'hanging', timeLeft: hangTime, set: prev.set + 1 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timer.phase]);

  tEffect(() => {
    if (timer.phase === 'done') onComplete?.();
  }, [timer.phase]);

  const start = () => { navigator.vibrate?.([50]); setTimer({ phase: 'hanging', timeLeft: hangTime, set: 1 }); };

  const skip = () => setTimer(prev => {
    if (prev.phase === 'hanging') {
      if (prev.set >= sets) return { ...prev, phase: 'done', timeLeft: 0 };
      return restTime > 0 ? { phase: 'resting', timeLeft: restTime, set: prev.set }
                          : { phase: 'hanging', timeLeft: hangTime, set: prev.set + 1 };
    }
    if (prev.phase === 'resting') return { phase: 'hanging', timeLeft: hangTime, set: prev.set + 1 };
    return prev;
  });

  const isHanging = timer.phase === 'hanging';
  const isResting = timer.phase === 'resting';
  const isDone    = timer.phase === 'done';
  const isReady   = timer.phase === 'ready';
  const phaseColor = isHanging ? th.danger : isResting ? th.success : isDone ? th.success : th.accent;
  const phaseLabel = isReady ? 'READY' : isHanging ? 'HANG' : isResting ? 'REST' : 'DONE';
  const displayTime = isReady ? hangTime : timer.timeLeft;
  const maxTime = isResting ? restTime : hangTime;

  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" style={{ background:th.bg, padding:'20px 20px 32px' }} onClick={e => e.stopPropagation()}>
        {/* Set progress dots */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div style={{ display:'flex', gap:8 }}>
            {Array.from({ length: sets }, (_, i) => {
              const n = i + 1;
              const done = n < timer.set || isDone;
              const current = n === timer.set && !isDone && !isReady;
              return <div key={i} style={{ width:10, height:10, borderRadius:'50%', background:(done||current)?phaseColor:th.border }}/>;
            })}
          </div>
          <button className="icon-btn" onClick={onClose} style={{ background:th.surface }}><Icon name="x" size={16} color={th.textSub}/></button>
        </div>

        {/* Timer ring */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:28 }}>
          <Ring value={isDone ? maxTime : displayTime} max={maxTime} size={184} stroke={13} color={phaseColor} track={th.border}>
            <div style={{ textAlign:'center' }}>
              <p style={{ fontSize:isDone?44:60, fontWeight:800, color:phaseColor, fontFamily:"'DM Mono', monospace", lineHeight:1 }}>
                {isDone ? '✓' : displayTime}
              </p>
              <p style={{ fontSize:12, fontWeight:700, letterSpacing:'0.14em', color:phaseColor, marginTop:5 }}>{phaseLabel}</p>
            </div>
          </Ring>
          <p style={{ fontSize:13, color:th.textSub, marginTop:18 }}>
            {isDone ? 'All sets complete!' : `Set ${timer.set} of ${sets}`}
          </p>
        </div>

        {/* Action buttons */}
        {isReady && (
          <button onClick={start} style={{ width:'100%', padding:'18px', borderRadius:th.radius, background:th.accent, color:th.accentText, fontSize:16, fontWeight:700, border:'none', cursor:'pointer', fontFamily:'DM Sans' }}>
            Start
          </button>
        )}
        {isDone && (
          <button onClick={onClose} style={{ width:'100%', padding:'18px', borderRadius:th.radius, background:th.success, color:'#fff', fontSize:16, fontWeight:700, border:'none', cursor:'pointer', fontFamily:'DM Sans' }}>
            Done
          </button>
        )}
        {(isHanging || isResting) && (
          <button onClick={skip} style={{ width:'100%', padding:'15px', borderRadius:th.radius, background:th.surface, border:`1px solid ${th.border}`, color:th.textSub, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans' }}>
            {isHanging ? (timer.set >= sets ? 'Skip → Finish' : 'Skip → Rest') : 'Skip → Next Set'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── SET STEPPER ───────────────────────────────────────────────────────────────
function TrainStepper({ label, value, onChange, min, max, th }) {
  return (
    <div>
      <p style={{ fontSize:11, fontWeight:700, color:th.textSub, marginBottom:6, textAlign:'center', letterSpacing:'0.06em', textTransform:'uppercase' }}>{label}</p>
      <div style={{ display:'flex', alignItems:'center', border:`1px solid ${th.border}`, borderRadius:th.radiusSm, overflow:'hidden', background:th.surface }}>
        <button onClick={() => onChange(v => Math.max(min, v - 1))} style={{ background:'none', border:'none', padding:'7px 10px', cursor:'pointer', fontSize:16, color:th.text, fontWeight:700 }}>−</button>
        <span style={{ flex:1, textAlign:'center', fontSize:16, fontWeight:700, color:th.text, fontFamily:"'DM Mono', monospace" }}>{value}</span>
        <button onClick={() => onChange(v => Math.min(max, v + 1))} style={{ background:'none', border:'none', padding:'7px 10px', cursor:'pointer', fontSize:16, color:th.text, fontWeight:700 }}>+</button>
      </div>
    </div>
  );
}

// ── ADD SET SHEET ─────────────────────────────────────────────────────────────
function AddSetSheet({ tweaks, onSave, onClose }) {
  const th = THEMES[tweaks.theme];
  const [edgeSize, setEdgeSize] = tState(20);
  const [customEdge, setCustomEdge] = tState('');
  const [gripType, setGripType] = tState('half');
  const [hangTime, setHangTime] = tState(7);
  const [restTime, setRestTime] = tState(90);
  const [sets, setSets] = tState(3);
  const [weight, setWeight] = tState(0);
  const [notes, setNotes] = tState('');
  const [showHangTimer, setShowHangTimer] = tState(false);

  const effectiveEdge = customEdge ? (parseInt(customEdge) || edgeSize) : edgeSize;

  const buildExercise = () => ({
    id: uid(), edgeSize: effectiveEdge, gripType, hangTime, restTime, sets,
    weight: weight || 0, notes: notes.trim() || undefined, time: Date.now(),
  });

  const handleSave = () => { onSave(buildExercise()); onClose(); };
  const handleTimerComplete = () => { onSave(buildExercise()); onClose(); };

  return (<>
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet scroll" style={{ background:th.bg }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 0' }}>
          <div style={{ width:36, height:4, background:th.borderStrong, borderRadius:2 }}/>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 20px 4px' }}>
          <span style={{ fontSize:17, fontWeight:700, color:th.text }}>Log Set</span>
          <button className="icon-btn" onClick={onClose} style={{ background:th.surface }}><Icon name="x" size={16} color={th.textSub}/></button>
        </div>

        <div style={{ padding:'14px 20px 0' }}>
          {/* Edge size */}
          <Label th={th}>Edge size (mm)</Label>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
            {EDGE_SIZES.map(s => (
              <button key={s} onClick={() => { setEdgeSize(s); setCustomEdge(''); }}
                style={{ padding:'7px 11px', borderRadius:th.radiusSm, border:`1.5px solid ${edgeSize===s&&!customEdge?th.accent:th.border}`, background:edgeSize===s&&!customEdge?th.accentSoft:th.surface, color:edgeSize===s&&!customEdge?th.accentSoftText:th.text, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Mono', monospace" }}>
                {s}
              </button>
            ))}
            <input type="number" value={customEdge}
              onChange={e => { setCustomEdge(e.target.value); setEdgeSize(0); }}
              placeholder="other"
              style={{ width:60, padding:'7px 8px', borderRadius:th.radiusSm, border:`1.5px solid ${customEdge?th.accent:th.border}`, background:customEdge?th.accentSoft:th.surface, color:th.text, fontSize:13, fontWeight:600, outline:'none', fontFamily:"'DM Mono', monospace", textAlign:'center' }}/>
          </div>

          {/* Grip type */}
          <Label th={th}>Grip type</Label>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
            {GRIP_TYPES.map(g => (
              <button key={g.id} onClick={() => setGripType(g.id)}
                style={{ padding:'7px 12px', borderRadius:th.radiusSm, border:`1.5px solid ${gripType===g.id?th.accent:th.border}`, background:gripType===g.id?th.accentSoft:th.surface, color:gripType===g.id?th.accentSoftText:th.text, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans' }}>
                {g.label}
              </button>
            ))}
          </div>

          {/* Hang / Sets / Rest */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:16 }}>
            <TrainStepper label="Hang (s)" value={hangTime} onChange={setHangTime} min={1} max={60} th={th}/>
            <TrainStepper label="Sets"     value={sets}     onChange={setSets}     min={1} max={20} th={th}/>
            <TrainStepper label="Rest (s)" value={restTime} onChange={setRestTime} min={0} max={600} th={th}/>
          </div>

          {/* Weight */}
          <Label th={th}>Weight <span style={{ fontWeight:400, color:th.textMuted }}>(+added · −assisted)</span></Label>
          <div style={{ display:'flex', alignItems:'center', border:`1px solid ${th.border}`, borderRadius:th.radius, background:th.surface, marginBottom:14, overflow:'hidden' }}>
            <button onClick={() => setWeight(w => Math.round((w - 2.5)*10)/10)} style={{ background:'none', border:'none', padding:'10px 16px', cursor:'pointer', fontSize:18, color:th.text, fontWeight:700 }}>−</button>
            <span style={{ flex:1, textAlign:'center', fontSize:16, fontWeight:700, color:th.text, fontFamily:"'DM Mono', monospace" }}>
              {weight === 0 ? '0 kg' : `${weight > 0 ? '+' : ''}${weight} kg`}
            </span>
            <button onClick={() => setWeight(w => Math.round((w + 2.5)*10)/10)} style={{ background:'none', border:'none', padding:'10px 16px', cursor:'pointer', fontSize:18, color:th.text, fontWeight:700 }}>+</button>
          </div>

          {/* Notes */}
          <Label th={th}>Notes <span style={{ fontWeight:400, color:th.textMuted }}>(optional)</span></Label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. felt strong, cramped on set 3…"
            style={{ width:'100%', background:th.surface, borderRadius:th.radius, border:`1px solid ${th.border}`, padding:'10px 14px', fontSize:14, color:th.text, fontFamily:'DM Sans', resize:'none', outline:'none', height:60, marginBottom:16, display:'block' }}/>

          <div style={{ display:'flex', gap:10, marginBottom:8 }}>
            <button onClick={() => setShowHangTimer(true)} style={{ flex:1, padding:'14px 0', borderRadius:th.radius, border:`1px solid ${th.border}`, background:th.surface, color:th.text, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              <Icon name="timer" size={16} color={th.text}/> Start Timer
            </button>
            <button onClick={handleSave} style={{ flex:1, padding:'14px 0', borderRadius:th.radius, border:'none', background:th.accent, color:th.accentText, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'DM Sans' }}>
              Log Set
            </button>
          </div>
        </div>
      </div>
    </div>
    {showHangTimer && (
      <HangTimerOverlay hangTime={hangTime} restTime={restTime} sets={sets} tweaks={tweaks}
        onComplete={handleTimerComplete} onClose={() => setShowHangTimer(false)}/>
    )}
  </>);
}

// ── TRAINING SCREEN ───────────────────────────────────────────────────────────
function TrainingScreen({ sessions, setSessions, currentSession, setCurrentSession, tweaks, onNavigate }) {
  const th = THEMES[tweaks.theme];
  const [showAdd, setShowAdd] = tState(false);
  const [showTimer, setShowTimer] = tState(false);
  const [elapsed, setElapsed] = tState(0);

  const isTrainingActive = currentSession?.type === 'training';
  const isClimbingActive = currentSession && !isTrainingActive;
  const trainingSessions = sessions.filter(s => s.type === 'training');

  tEffect(() => {
    if (!isTrainingActive) { setElapsed(0); return; }
    const tick = () => setElapsed(Math.floor((Date.now() - currentSession.startTime) / 1000));
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [isTrainingActive, currentSession?.startTime]);

  const fmtE = s => { const h=Math.floor(s/3600), m=Math.floor((s%3600)/60); return h>0?`${h}h ${m}m`:`${m}m`; };

  const startTraining = () => setCurrentSession({ id:uid(), type:'training', startTime:Date.now(), exercises:[] });
  const endTraining = () => { setSessions(prev => [{ ...currentSession, endTime:Date.now() }, ...prev]); setCurrentSession(null); };
  const addExercise = ex => setCurrentSession(s => ({ ...s, exercises:[...(s.exercises||[]), ex] }));
  const deleteEx = id => setCurrentSession(s => ({ ...s, exercises:(s.exercises||[]).filter(e=>e.id!==id) }));

  // ── Conflict: climbing session is active ──
  if (isClimbingActive) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', padding:40, gap:14, textAlign:'center' }}>
      <Icon name="mountain" size={40} color={th.textMuted}/>
      <p style={{ fontSize:16, fontWeight:700, color:th.text }}>Climbing session active</p>
      <p style={{ fontSize:14, color:th.textSub }}>End your climbing session before starting a training session.</p>
      <button onClick={() => onNavigate?.('session')} style={{ padding:'12px 24px', borderRadius:th.radius, background:th.surface, border:`1px solid ${th.border}`, color:th.text, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans' }}>Go to Session →</button>
    </div>
  );

  // ── Active training session ──
  if (isTrainingActive) {
    const exercises = currentSession.exercises || [];
    return (
      <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
        <div style={{ padding:'16px 20px 14px', borderBottom:`1px solid ${th.border}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:th.success, boxShadow:`0 0 0 3px ${th.successBg}` }}/>
                <span style={{ fontSize:12, fontWeight:600, color:th.success }}>Training active</span>
                {elapsed > 0 && <span style={{ fontSize:12, color:th.textSub, marginLeft:2 }}>· {fmtE(elapsed)}</span>}
              </div>
              <p style={{ fontSize:17, fontWeight:700, color:th.text }}>Hangboard session</p>
              <p style={{ fontSize:12, color:th.textSub }}>Started {fmtTime(currentSession.startTime)}</p>
            </div>
            <div style={{ textAlign:'right' }}>
              <p style={{ fontSize:26, fontWeight:800, color:th.text }}>{exercises.length}</p>
              <p style={{ fontSize:11, color:th.textSub }}>sets logged</p>
            </div>
          </div>
        </div>

        <div className="scroll" style={{ flex:1, padding:'14px 20px', display:'flex', flexDirection:'column', gap:8 }}>
          {exercises.length === 0 ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:160, gap:8 }}>
              <Icon name="barbell" size={32} color={th.textMuted}/>
              <p style={{ fontSize:14, color:th.textMuted }}>No sets yet — log your first!</p>
            </div>
          ) : (
            [...exercises].reverse().map(ex => <ExerciseCard key={ex.id} exercise={ex} th={th} onDelete={() => deleteEx(ex.id)}/>)
          )}
        </div>

        <div style={{ padding:'12px 20px 18px', borderTop:`1px solid ${th.border}` }}>
          <div style={{ display:'flex', gap:10, marginBottom:10 }}>
            <button onClick={() => setShowTimer(true)} style={{ flex:1, padding:'13px 0', borderRadius:th.radius, border:`1px solid ${th.border}`, background:th.surface, color:th.text, fontSize:14, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:8, cursor:'pointer', fontFamily:'DM Sans' }}>
              <Icon name="timer" size={16} color={th.text}/> Rest Timer
            </button>
            <button onClick={() => setShowAdd(true)} style={{ flex:2, padding:'13px 0', borderRadius:th.radius, border:'none', background:th.accent, color:th.accentText, fontSize:14, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:8, cursor:'pointer', fontFamily:'DM Sans' }}>
              <Icon name="plus" size={18} color={th.accentText}/> Add Set
            </button>
          </div>
          <button onClick={endTraining} style={{ width:'100%', padding:'13px', borderRadius:th.radius, border:`1px solid ${th.dangerBg}`, background:th.dangerBg, color:th.danger, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans' }}>End Training</button>
        </div>

        {showAdd && <AddSetSheet tweaks={tweaks} onSave={addExercise} onClose={() => setShowAdd(false)}/>}
        {showTimer && <RestTimer tweaks={tweaks} onClose={() => setShowTimer(false)}/>}
      </div>
    );
  }

  // ── Dashboard ──
  const last = trainingSessions[0];
  const totalSets = trainingSessions.reduce((n, s) => n + (s.exercises?.length || 0), 0);

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div className="screen-pad scroll" style={{ flex:1 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
          {[{ val:trainingSessions.length, label:'training sessions' }, { val:totalSets, label:'total sets logged' }].map(s => (
            <div key={s.label} style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:th.radius, padding:'14px 16px', boxShadow:th.shadow }}>
              <p style={{ fontSize:26, fontWeight:800, color:th.text }}>{s.val}</p>
              <p style={{ fontSize:12, color:th.textSub, marginTop:2 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {last ? (
          <div style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:th.radius, padding:'14px 16px', boxShadow:th.shadow }}>
            <p style={{ fontSize:11, fontWeight:700, color:th.textSub, letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:10 }}>Last training</p>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div>
                <p style={{ fontSize:14, fontWeight:700, color:th.text }}>Hangboard session</p>
                <p style={{ fontSize:12, color:th.textSub }}>{fmtDate(last.startTime)}</p>
              </div>
              <div style={{ textAlign:'right' }}>
                <p style={{ fontSize:22, fontWeight:800, color:th.text }}>{last.exercises?.length || 0}</p>
                <p style={{ fontSize:11, color:th.textSub }}>sets</p>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {(last.exercises || []).slice(0, 3).map(ex => <ExerciseCard key={ex.id} exercise={ex} th={th}/>)}
            </div>
            {(last.exercises?.length || 0) > 3 && (
              <p style={{ fontSize:12, color:th.textSub, textAlign:'center', marginTop:10 }}>+ {last.exercises.length - 3} more</p>
            )}
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'52px 20px', gap:14, textAlign:'center' }}>
            <Icon name="barbell" size={44} color={th.textMuted}/>
            <div>
              <p style={{ fontSize:16, fontWeight:700, color:th.text }}>No training sessions yet</p>
              <p style={{ fontSize:14, color:th.textSub, marginTop:4 }}>Track hangboard work and finger training below.</p>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding:'12px 20px 20px', borderTop:`1px solid ${th.border}`, background:th.bg, flexShrink:0 }}>
        <button onClick={startTraining} style={{ width:'100%', padding:'18px', borderRadius:th.radius, background:th.accent, color:th.accentText, fontSize:17, fontWeight:700, border:'none', cursor:'pointer', fontFamily:'DM Sans', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
          <Icon name="plus" size={20} color={th.accentText}/> Start Training
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { TrainingScreen });
