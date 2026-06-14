// ── CRUX · data, constants, utils, icons ─────────────────────────────────────
const { useState, useEffect, useRef } = React;

// ── THEMES ───────────────────────────────────────────────────────────────────
const THEMES = {
  pure: {
    bg: '#FFFFFF', surface: '#F7F7F7', card: '#FFFFFF',
    border: '#EBEBEB', borderStrong: '#D0D0D0',
    text: '#111111', textSub: '#888888', textMuted: '#BBBBBB',
    accent: '#111111', accentText: '#FFFFFF',
    accentSoft: '#F0F0F0', accentSoftText: '#111111',
    success: '#1A7A4A', successBg: '#E8F5EE',
    danger: '#C0392B', dangerBg: '#FCECEA',
    warning: '#D4780A', warningBg: '#FEF3E2',
    railBg: '#FAFAFA', appBackdrop: '#E9E9E9',
    tabBg: '#FFFFFF', tabBorder: '#EBEBEB',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    shadowMd: '0 4px 12px rgba(0,0,0,0.08)',
    radius: '12px', radiusSm: '8px', radiusLg: '16px',
  },
  stone: {
    bg: '#F2ECE4', surface: '#EAE2D8', card: '#F7F2EC',
    border: '#D8CFBF', borderStrong: '#BFB4A0',
    text: '#2A2219', textSub: '#7A6E62', textMuted: '#B0A69A',
    accent: '#5C4A35', accentText: '#F7F2EC',
    accentSoft: '#E0D5C5', accentSoftText: '#5C4A35',
    success: '#3A7D44', successBg: '#E4F0E6',
    danger: '#B5391B', dangerBg: '#F8E8E4',
    warning: '#C47A1A', warningBg: '#FAF0DC',
    railBg: '#EEE6DB', appBackdrop: '#DDD2C2',
    tabBg: '#EAE2D8', tabBorder: '#D0C7B8',
    shadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05)',
    shadowMd: '0 4px 12px rgba(0,0,0,0.10)',
    radius: '12px', radiusSm: '8px', radiusLg: '16px',
  },
  night: {
    bg: '#141414', surface: '#1E1E1E', card: '#1E1E1E',
    border: '#2C2C2C', borderStrong: '#3A3A3A',
    text: '#F0F0F0', textSub: '#888888', textMuted: '#4A4A4A',
    accent: '#C8FF00', accentText: '#141414',
    accentSoft: '#2A3300', accentSoftText: '#C8FF00',
    success: '#3EC97A', successBg: '#0D2818',
    danger: '#FF5C5C', dangerBg: '#2A0D0D',
    warning: '#FFAA33', warningBg: '#2A1A00',
    railBg: '#1A1A1A', appBackdrop: '#000000',
    tabBg: '#1E1E1E', tabBorder: '#2C2C2C',
    shadow: '0 1px 3px rgba(0,0,0,0.4)',
    shadowMd: '0 4px 16px rgba(0,0,0,0.5)',
    radius: '12px', radiusSm: '8px', radiusLg: '16px',
  }
};

// ── GRADE / HOLD / WALL DATA ──────────────────────────────────────────────────
const V_GRADES = ['VB','V0','V1','V2','V3','V4','V5','V6','V7','V8','V9','V10','V11','V12'];
const FONT_GRADES = ['4','5','5+','6A','6A+','6B','6B+','6C','6C+','7A','7A+','7B','7B+','7C','7C+','8A','8A+','8B','8B+','8C'];

const WALL_TYPES = [
  { id:'slab',     label:'Slab',     angle:'< 90°' },
  { id:'vert',     label:'Vert',     angle:'90°' },
  { id:'overhang', label:'Overhang', angle:'> 90°' },
  { id:'cave',     label:'Cave',     angle:'> 135°' },
];

const HOLD_COLORS = [
  { id:'red',    label:'Red',    hex:'#E53E3E' },
  { id:'orange', label:'Orange', hex:'#E87C2B' },
  { id:'yellow', label:'Yellow', hex:'#D4AC0D' },
  { id:'green',  label:'Green',  hex:'#38A169' },
  { id:'lime',   label:'Lime',   hex:'#84CC16' },
  { id:'blue',   label:'Blue',   hex:'#3182CE' },
  { id:'purple', label:'Purple', hex:'#805AD5' },
  { id:'pink',   label:'Pink',   hex:'#D53F8C' },
  { id:'white',  label:'White',  hex:'#E8E8E8' },
  { id:'black',  label:'Black',  hex:'#2D2D2D' },
  { id:'grey',   label:'Grey',   hex:'#9E9E9E' },
];

const ROCK_TYPES = [
  { id:'limestone', label:'Limestone' },
  { id:'sandstone', label:'Sandstone' },
  { id:'granite',   label:'Granite' },
  { id:'gritstone', label:'Gritstone' },
  { id:'quartzite', label:'Quartzite' },
  { id:'other',     label:'Other' },
];

const CONDITIONS = [
  { id:'perfect', label:'Perfect' },
  { id:'dry',     label:'Dry' },
  { id:'damp',    label:'Damp' },
  { id:'wet',     label:'Wet' },
];

// ── UTILS ──────────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);
const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
const fmtDate = (ts) => new Date(ts).toLocaleDateString('en-GB', {weekday:'short', day:'numeric', month:'short'});
const fmtTime = (ts) => new Date(ts).toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit'});
const fmtRest = (s) => s>=60 ? (s%60===0 ? `${s/60}m` : `${Math.floor(s/60)}m ${s%60}s`) : `${s}s`;

function loadLS(key, def) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; }
}
function saveLS(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// Monday-based week index since epoch
function weekIndex(ts) {
  const d = new Date(ts);
  const day = (d.getDay() + 6) % 7; // Mon=0
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() - day);
  return Math.round(d.getTime() / 604800000);
}

const isSend = (c) => c.outcome === 'sent' || c.outcome === 'flash';

// ── DERIVED STATS ────────────────────────────────────────────────────────────
function computeDerived(sessions, active) {
  const all = active ? [...sessions, active] : [...sessions];
  const climbs = all.flatMap(s => s.climbs || []);
  const sent = climbs.filter(isSend);
  const flashes = climbs.filter(c => c.outcome === 'flash');
  const wallTypes = new Set(climbs.map(c => c.wallType).filter(Boolean));
  const holdColors = new Set(climbs.map(c => c.holdColor).filter(Boolean));
  let maxV = -1, maxFont = -1;
  sent.forEach(c => {
    if (c.grade?.system === 'v') { const i = V_GRADES.indexOf(c.grade.grade); if (i > maxV) maxV = i; }
    if (c.grade?.system === 'font') { const i = FONT_GRADES.indexOf(c.grade.grade); if (i > maxFont) maxFont = i; }
  });
  const hasProject = sent.some(c => (c.attempts || 1) >= 5);

  const weeks = new Set(all.map(s => weekIndex(s.startTime)));
  const cur = weekIndex(Date.now());
  let start = weeks.has(cur) ? cur : (weeks.has(cur-1) ? cur-1 : null);
  let weekStreak = 0;
  if (start !== null) { let w = start; while (weeks.has(w)) { weekStreak++; w--; } }
  const weeklyCount = all.filter(s => weekIndex(s.startTime) === cur).length;
  const weeklyClimbs = all.filter(s => weekIndex(s.startTime) === cur).reduce((n, s) => n + (s.climbs?.length || 0), 0);
  const outdoorSessions = sessions.filter(s => s.type === 'outdoor').length;

  return {
    totalClimbs: climbs.length, totalSends: sent.length, totalFlashes: flashes.length,
    totalAttempts: climbs.length - sent.length,
    sendRate: climbs.length ? Math.round(sent.length / climbs.length * 100) : 0,
    wallTypes, holdColors, maxV, maxFont, hasProject, weekStreak, weeklyCount,
    weeklyClimbs, outdoorSessions, totalSessions: sessions.length,
  };
}

// ── ACHIEVEMENTS ───────────────────────────────────────────────────────────────
const ACHIEVEMENTS = [
  { id:'first_climb', icon:'mountain', label:'First Steps',     desc:'Log your first climb',            test:d=>d.totalClimbs>=1 },
  { id:'first_send',  icon:'check',    label:'On the Board',    desc:'Send your first problem',          test:d=>d.totalSends>=1 },
  { id:'first_flash', icon:'flash',    label:'Flash!',          desc:'Flash a problem first try',        test:d=>d.totalFlashes>=1 },
  { id:'v3',          icon:'stats',    label:'Stepping Up',     desc:'Send V3 or harder',                test:d=>d.maxV>=V_GRADES.indexOf('V3') },
  { id:'project',     icon:'target',   label:'Project Crusher', desc:'Send after 5+ attempts',           test:d=>d.hasProject },
  { id:'all_angles',  icon:'mountain', label:'All Angles',      desc:'Climb slab, vert, overhang & cave',test:d=>d.wallTypes.size>=4 },
  { id:'rainbow',     icon:'holds',    label:'Rainbow',         desc:'Log 6+ hold colours',              test:d=>d.holdColors.size>=6 },
  { id:'streak3',     icon:'flame',    label:'Consistent',      desc:'3-week climbing streak',           test:d=>d.weekStreak>=3 },
  { id:'v5',          icon:'medal',    label:'Strong',          desc:'Send V5 or harder',                test:d=>d.maxV>=V_GRADES.indexOf('V5') },
  { id:'fifty',         icon:'history',  label:'Half Century',    desc:'Log 50 climbs',                     test:d=>d.totalClimbs>=50 },
  { id:'first_outdoor', icon:'tree',     label:'Into the Wild',   desc:'Complete your first outdoor session', test:d=>d.outdoorSessions>=1 },
  { id:'sessions10',    icon:'calendar', label:'Regular Sender',  desc:'Complete 10 sessions',               test:d=>d.totalSessions>=10 },
  { id:'sends25',       icon:'arrowUp',  label:'On a Roll',       desc:'Send 25 problems',                   test:d=>d.totalSends>=25 },
];
const evalAchievements = (d) => ACHIEVEMENTS.map(a => ({ ...a, earned: a.test(d) }));

// ── ICONS ──────────────────────────────────────────────────────────────────────
const Icon = ({ name, size=20, color='currentColor' }) => {
  const s = { width: size, height: size, display:'block', flexShrink:0 };
  const I = {
    plus: <path d="M12 5v14M5 12h14"/>,
    check: <polyline points="20 6 9 17 4 12"/>,
    x: <path d="M18 6 6 18M6 6l12 12"/>,
    timer: <g><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9.5 3h5M12 3v2"/></g>,
    mountain: <path d="M8 3l4 8 5-5 5 15H2L8 3z"/>,
    history: <g><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></g>,
    stats: <g><rect x="3" y="12" width="4" height="9"/><rect x="10" y="7" width="4" height="14"/><rect x="17" y="3" width="4" height="18"/></g>,
    flash: <path d="M13 2L4.5 13H11L10 22L19.5 11H13L13 2Z"/>,
    play: <polygon points="6 4 20 12 6 20"/>,
    pause: <g><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></g>,
    reset: <g><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></g>,
    camera: <g><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></g>,
    trash: <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>,
    chevRight: <polyline points="9 18 15 12 9 6"/>,
    chevDown: <polyline points="6 9 12 15 18 9"/>,
    chevLeft: <polyline points="15 18 9 12 15 6"/>,
    location: <g><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></g>,
    user: <g><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></g>,
    gear: <g><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></g>,
    target: <g><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></g>,
    medal: <g><circle cx="12" cy="14" r="6"/><path d="M8.2 8.5 5 2h5l2 4M15.8 8.5 19 2h-5l-2 4"/><path d="M12 12l1 2 2 .2-1.4 1.4.4 2-2-1-2 1 .4-2L9 14.2l2-.2 1-2z"/></g>,
    flame: <path d="M12 2c1 4 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 1.5-4 .5 2 1.5 2.5 2.5 2.5C10 8 11 5 12 2z"/>,
    edit: <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>,
    download: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>,
    note: <g><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h8M8 17h5"/></g>,
    calendar: <g><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></g>,
    holds: <g><circle cx="7" cy="7" r="3"/><circle cx="17" cy="9" r="2.5"/><circle cx="9" cy="17" r="2.5"/></g>,
    arrowUp: <path d="M12 19V5M5 12l7-7 7 7"/>,
    logo: <path d="M6 20 12 4l6 16M8.5 14h7"/>,
    home: <g><path d="M3 9l9-6 9 6v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></g>,
    tree: <g><polygon points="12 2 20 18 4 18"/><rect x="10" y="18" width="4" height="4"/></g>,
  };
  return (
    <svg style={s} viewBox="0 0 24 24" fill={['flash','play','pause','logo'].includes(name)?color:'none'} stroke={['flash','play','pause'].includes(name)?'none':color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {I[name] || null}
    </svg>
  );
};

Object.assign(window, {
  THEMES, V_GRADES, FONT_GRADES, WALL_TYPES, HOLD_COLORS, ROCK_TYPES, CONDITIONS,
  uid, fmt, fmtDate, fmtTime, fmtRest, loadLS, saveLS, weekIndex, isSend,
  computeDerived, ACHIEVEMENTS, evalAchievements, Icon,
});
