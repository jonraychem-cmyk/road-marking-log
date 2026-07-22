// v3 — Icelandic translation, fold work items, projectType fix
import { useState, useCallback, useEffect } from "react";

// ── PIN Lock ──────────────────────────────────────────────────────────────────
const CORRECT_PIN = "180583";

function PinScreen({ onUnlock }) {
  const [entered, setEntered] = useState("");
  const [shake, setShake] = useState(false);
  const press = (val) => {
    if (entered.length >= CORRECT_PIN.length) return;
    const next = entered + val;
    setEntered(next);
    if (next.length === CORRECT_PIN.length) {
      if (next === CORRECT_PIN) { localStorage.setItem("rml_auth", "1"); onUnlock(); }
      else { setShake(true); setTimeout(() => { setShake(false); setEntered(""); }, 600); }
    }
  };
  const del = () => setEntered(entered.slice(0, -1));
  const dots = Array.from({ length: CORRECT_PIN.length }, (_, i) => (
    <div key={i} style={{ width:14, height:14, borderRadius:"50%", background: i < entered.length ? "#e8f0e8" : "transparent", border:"2px solid " + (i < entered.length ? "#e8f0e8" : "#444"), transition:"background 0.1s" }} />
  ));
  const keys = [["1","2","3"],["4","5","6"],["7","8","9"],["","0","\u232b"]];
  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0a", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"'Inter', system-ui, sans-serif", padding:24 }}>
      <div style={{ marginBottom:32, textAlign:"center" }}>
        <div style={{ fontWeight:800, fontSize:22, letterSpacing:-0.5, color:"#e0e0e0", marginBottom:6 }}>Vegmerkingar</div>
        <div style={{ color:"#444", fontSize:13 }}>Sláðu inn PIN</div>
      </div>
      <div style={{ display:"flex", gap:16, marginBottom:40, animation: shake ? "shake 0.5s" : "none" }}>{dots}</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 72px)", gap:12 }}>
        {keys.flat().map((k, i) => (
          <button key={i} onClick={() => k === "\u232b" ? del() : k ? press(k) : null} style={{ width:72, height:72, borderRadius:16, background: k ? "#1a1a1a" : "transparent", border: k ? "1px solid #2a2a2a" : "none", color: k === "\u232b" ? "#666" : "#e0e0e0", fontSize: k === "\u232b" ? 20 : 26, fontWeight:600, cursor: k ? "pointer" : "default", display:"flex", alignItems:"center", justifyContent:"center" }}>{k}</button>
        ))}
      </div>
      <style>{"@keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-8px)} 80%{transform:translateX(8px)} }"}</style>
    </div>
  );
}

// ── Google Sheets via Apps Script ────────────────────────────────────────────
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx9XY9aVWNCBdH0fIzz5dFJQKiF1kNHx5Qspn_UrFvrF6-7J9-Obh5lCETvnh3Lw0_XZg/exec";

async function appendToSheet(row, type="log") {
  await fetch(APPS_SCRIPT_URL, { method:"POST", mode:"no-cors", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ type, row }) });
}
async function saveProjectsToSheet(projects) {
  await fetch(APPS_SCRIPT_URL, { method:"POST", mode:"no-cors", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ type:"saveProjects", projects }) });
}
async function loadProjectsFromSheet() {
  const res = await fetch(APPS_SCRIPT_URL + "?action=getProjects");
  if (!res.ok) throw new Error("Failed to load");
  return res.json();
}
async function appendHoursToSheet(row) {
  await fetch(APPS_SCRIPT_URL, { method:"POST", mode:"no-cors", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ type:"hours", row }) });
}
async function postComment(row) {
  await fetch(APPS_SCRIPT_URL, { method:"POST", mode:"no-cors", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ type:"comment", row }) });
}
async function loadComments(projectId) {
  const res = await fetch(APPS_SCRIPT_URL + "?action=getComments");
  if (!res.ok) return [];
  const all = await res.json();
  return all.filter((r) => String(r[1]) === String(projectId)).map((r) => ({ timestamp:r[0], name:r[2], message:r[3] }));
}

// ── Constants ─────────────────────────────────────────────────────────────────
const DEFAULT_REGIONS = ["Suðurland", "Norðurland", "Vesturland", "Austurland", "Vestfirðir"];
const REGIONS = DEFAULT_REGIONS;
const DEFAULT_SUB_REGIONS = {
  "Suðurland": ["Reykjavík", "Keflavík", "Selfoss", "Hveragerði"],
  "Norðurland": ["Akureyri", "Dalvík", "Húsavík", "Sauðárkrókur", "Blönduós", "Hvammstangi", "Vopnafjörður"],
  "Vesturland": ["Borgarnes", "Patreksfjörður"],
  "Austurland": ["Egilsstaðir"],
  "Vestfirðir": ["Ísafjörður", "Bolungarvík"],
};
const SUB_REGIONS = DEFAULT_SUB_REGIONS;
const STENCIL_OPTIONS = ["Fatlaður","Rafhlöðsla","Ör","BUS","Rúta","Gangkall","Hjólhýsi","Hjól","Annað"];
const ZEBRA_SIZES = ["50x300","50x250","50x240","50x200","50x120","Sérsniðið"];
const THERMO_MODES = ["Mössun","Fræsun"];
const THERMO_KINDS = ["Línur","Gangbraut","Ör","Beygjuör"];
const THERMO_THICKNESS = ["10cm","15cm","20cm","30cm"];
const METER_TYPES = ["Bílastæðalínur","Bílastæðalínur + formerking","Miðlínur","Kantlínur","Gular línur","Gulur kantur","Skott","Formerking","Línur","Hvítar línur","Hvítar línur + formerking","Gul lína","Gular línur"];
const PIECE_TYPES = ["Blár ferningur","Blár bakgrunnur","Grænn bakgrunnur","Grænn ferningur"];
const STENCIL_NAMES = ["Fatlaður","Rafhlöðsla","Ör","BUS","Rúta","Gangkall","Hjólhýsi","Hjól","Annað"];
const DEFAULT_WORK_TYPES = ["Bílastæðalínur","Bílastæðalínur + formerking","Gular línur","Gulur kantur","Miðlínur","Kantlínur","Skott",...PIECE_TYPES,"Stencil","Gangbraut","Þríhyrningar","Ferningar 50x50","Formerking",...THERMO_MODES,"Annað"];
const WORK_TYPES = DEFAULT_WORK_TYPES;
try {
  const saved = JSON.parse(localStorage.getItem("rml_worktypes")||"null");
  if (saved && saved.includes("Línur") && !saved.includes("Bílastæðalínur")) localStorage.removeItem("rml_worktypes");
} catch(e) {}
const DEFAULT_CARS = ["Sprinter","Renault","Iveco","KK","Óúthlutað"];
const CARS = DEFAULT_CARS;
const VEHICLE_ICONS = {
  "Sprinter": { dot:"⚫" }, "Renault": { dot:"🔴" }, "Iveco": { dot:"⚫" }, "KK": { dot:"⚪" },
};
function VehicleBadge({ name, active }) {
  const v = VEHICLE_ICONS[name];
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:5, cursor:"pointer",
      background:active?"#1a2a3a":"none", border:`1px solid ${active?"#2a4a6a":"#222"}`,
      borderRadius:16, padding:"5px 12px", whiteSpace:"nowrap" }}>
      <span style={{ fontSize:9, opacity:active?1:0.5 }}>{v ? v.dot : "🚗"}</span>
      <span style={{ fontSize:12, color:active?"#6aacf0":"#666", fontWeight:active?700:400 }}>{name}</span>
    </div>
  );
}
const CHECKLIST_PRESETS = {
  "Stencil": ["Fatlaður","Rafhlöðsla","Ör","BUS","Rúta","Gangkall","Hjólhýsi","Hjól"],
  "Þríhyrningar": ["Þríhyrningar"],
  "Málning": ["Hvít málning","Gul málning","Blá málning (Fatlaðir)","Græn málning (Rafhlöðsla)","Rauð málning"],
  "Tæki": ["Línuvél","Stencil-úðari","Þjöppuveður","Límband","Primer","Hreinsiefni"],
};

// ── Styles ────────────────────────────────────────────────────────────────────
const inputStyle = { width:"100%", background:"#0d0d0d", border:"1px solid #333", borderRadius:6, color:"#e0e0e0", padding:"8px 10px", fontSize:14, boxSizing:"border-box", outline:"none" };
const selectStyle = { ...inputStyle, cursor:"pointer" };
const labelStyle = { color:"#888", fontSize:12, display:"block", marginBottom:4 };
const sectionLabel = { color:"#666", fontSize:12, marginBottom:6, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5 };
const btnPrimary = { background:"#e8f0e8", color:"#111", border:"none", borderRadius:6, padding:"8px 16px", fontWeight:700, fontSize:13, cursor:"pointer" };
const btnSecondary = { background:"none", color:"#888", border:"1px solid #333", borderRadius:6, padding:"8px 16px", fontSize:13, cursor:"pointer" };
const btnSuccess = { background:"#1a3a1a", color:"#4a9a4a", border:"1px solid #2a5a2a", borderRadius:6, padding:"8px 16px", fontSize:13, cursor:"pointer" };

// ── Demo data ─────────────────────────────────────────────────────────────────
const initialProjects = [
  { id:1, name:"Keflavík flugvöllur", region:"Suðurland", subRegion:"Keflavík", assignedTo:"Sprinter", finished:false, notes:"", drawings:[], contacts:[], checklist:[], projectType:"seasonal",
    locations:[ { id:1, name:"Aðalstæði", workItems:[], address:"" }, { id:2, name:"Starfsmannastæði", workItems:[], address:"" } ] },
];

// ── Sync badge ────────────────────────────────────────────────────────────────
function SyncBadge({ status }) {
  if (!status) return null;
  const isError = status.startsWith("error");
  const isOk = status === "ok";
  const bg = isOk ? "#0f1a0f" : isError ? "#2a0f0f" : "#1a2a3a";
  const color = isOk ? "#4a9a4a" : isError ? "#c05050" : "#6aacf0";
  const text = isOk ? "✓ Skráð" : isError ? "⚠ Villa" : "Sendi…";
  return <span style={{ background:bg, color, borderRadius:4, padding:"2px 8px", fontSize:11, marginLeft:8 }}>{text}</span>;
}

// ── Notes ─────────────────────────────────────────────────────────────────────
function NotesSection({ notes, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(notes || "");
  const save = () => { onUpdate(draft); setEditing(false); };
  const cancel = () => { setDraft(notes || ""); setEditing(false); };
  return (
    <div style={{ marginBottom:14 }}>
      <div style={sectionLabel}>Verklýsing</div>
      {editing ? (
        <div>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Bættu við verklýsingu…" style={{ ...inputStyle, height:80, resize:"vertical", marginBottom:8 }} autoFocus />
          <div style={{ display:"flex", gap:8 }}><button onClick={save} style={btnPrimary}>Vista</button><button onClick={cancel} style={btnSecondary}>Hætta við</button></div>
        </div>
      ) : (
        <div onClick={() => setEditing(true)} style={{ background:"#111", border:"1px solid #2a2a2a", borderRadius:8, padding:"10px 12px", cursor:"text", minHeight:40, color:notes ? "#aaa" : "#3a3a3a", fontSize:13, fontStyle:notes ? "italic" : "normal", lineHeight:1.5 }}>
          {notes || "Bættu við verklýsingu…"}
        </div>
      )}
    </div>
  );
}

// ── Checklist ─────────────────────────────────────────────────────────────────
function ChecklistSection({ checklist=[], onUpdate }) {
  const [showPresets, setShowPresets] = useState(false);
  const [customText, setCustomText] = useState("");
  const [activeCategory, setActiveCategory] = useState("Stencil");
  const toggle = (id) => onUpdate(checklist.map((i) => i.id===id ? {...i,done:!i.done} : i));
  const remove = (id) => onUpdate(checklist.filter((i) => i.id!==id));
  const addPreset = (label) => { if (checklist.some((i) => i.label===label)) return; onUpdate([...checklist, { id:Date.now()+Math.random(), label, done:false }]); };
  const addCustom = () => { if (!customText.trim()) return; onUpdate([...checklist, { id:Date.now(), label:customText.trim(), done:false }]); setCustomText(""); };
  const clearDone = () => onUpdate(checklist.filter((i) => !i.done));
  const doneCount = checklist.filter((i) => i.done).length;
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
        <div style={sectionLabel}>Tékklisti {checklist.length>0 && `· ${doneCount}/${checklist.length}`}</div>
        {doneCount>0 && <button onClick={clearDone} style={{ background:"none", border:"none", color:"#555", fontSize:11, cursor:"pointer", padding:0 }}>Hreinsa</button>}
      </div>
      {checklist.length===0 && !showPresets && <div style={{ color:"#444", fontSize:13, marginBottom:8 }}>Ekkert skráð</div>}
      {checklist.map((item) => (
        <div key={item.id} style={{ display:"flex", alignItems:"center", gap:10, background:item.done?"#0f1a0f":"#111", border:`1px solid ${item.done?"#1e3a1e":"#222"}`, borderRadius:7, padding:"8px 10px", marginBottom:6 }}>
          <div onClick={() => toggle(item.id)} style={{ width:18, height:18, borderRadius:4, flexShrink:0, cursor:"pointer", border:`2px solid ${item.done?"#4a9a4a":"#444"}`, background:item.done?"#1a4a1a":"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
            {item.done && <span style={{ color:"#4a9a4a", fontSize:12, lineHeight:1 }}>✓</span>}
          </div>
          <span style={{ flex:1, fontSize:13, color:item.done?"#4a7a4a":"#ccc", textDecoration:item.done?"line-through":"none" }}>{item.label}</span>
          <button onClick={() => remove(item.id)} style={{ background:"none", border:"none", color:"#3a3a3a", cursor:"pointer", fontSize:15, padding:"0 2px" }}>×</button>
        </div>
      ))}
      <div style={{ display:"flex", gap:6, marginBottom:8 }}>
        <input type="text" value={customText} onChange={(e) => setCustomText(e.target.value)} onKeyDown={(e) => e.key==="Enter" && addCustom()} placeholder="Bæta við…" style={{ ...inputStyle, flex:1, fontSize:13, padding:"6px 10px" }} />
        <button onClick={addCustom} style={{ ...btnPrimary, padding:"6px 12px", fontSize:13 }}>+</button>
      </div>
      {showPresets ? (
        <div style={{ background:"#111", border:"1px solid #2a2a2a", borderRadius:8, padding:12, marginTop:4 }}>
          <div style={{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap" }}>
            {Object.keys(CHECKLIST_PRESETS).map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{ background:activeCategory===cat?"#e8f0e8":"none", color:activeCategory===cat?"#111":"#666", border:activeCategory===cat?"none":"1px solid #333", borderRadius:12, padding:"4px 12px", fontSize:12, cursor:"pointer", fontWeight:activeCategory===cat?700:400 }}>{cat}</button>
            ))}
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {CHECKLIST_PRESETS[activeCategory].map((label) => {
              const already = checklist.some((i) => i.label===label);
              return <button key={label} onClick={() => addPreset(label)} style={{ background:already?"#1a2a1a":"#1a1a1a", color:already?"#4a7a4a":"#bbb", border:`1px solid ${already?"#2a4a2a":"#333"}`, borderRadius:6, padding:"5px 10px", fontSize:12, cursor:already?"default":"pointer" }}>{already?"✓ ":""}{label}</button>;
            })}
          </div>
          <button onClick={() => setShowPresets(false)} style={{ ...btnSecondary, fontSize:11, padding:"4px 10px", marginTop:10 }}>Loka</button>
        </div>
      ) : (
        <button onClick={() => setShowPresets(true)} style={{ ...btnSecondary, fontSize:12, padding:"5px 12px" }}>+ Af lista</button>
      )}
    </div>
  );
}

// ── Contacts ──────────────────────────────────────────────────────────────────
function ContactSection({ contacts=[], onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [role, setRole] = useState("");
  const add = () => { if (!name.trim() && !phone.trim()) return; onUpdate([...contacts, { id:Date.now(), name:name.trim(), phone:phone.trim(), role:role.trim() }]); setName(""); setPhone(""); setRole(""); setShowForm(false); };
  const remove = (id) => onUpdate(contacts.filter((c) => c.id!==id));
  const telHref = (num) => "tel:" + num.replace(/[\s\-().]/g,"");
  return (
    <div style={{ marginBottom:14 }}>
      <div style={sectionLabel}>Tengiliðir</div>
      {contacts.length===0 && !showForm && <div style={{ color:"#444", fontSize:13, marginBottom:8 }}>Engir tengiliðir</div>}
      {contacts.map((c) => (
        <div key={c.id} style={{ background:"#0f1a0f", border:"1px solid #1e3a1e", borderRadius:8, padding:"10px 12px", marginBottom:8, display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"baseline", gap:6, flexWrap:"wrap" }}>
              {c.name && <span style={{ color:"#d0e8d0", fontSize:14, fontWeight:600 }}>{c.name}</span>}
              {c.role && <span style={{ color:"#4a7a4a", fontSize:12 }}>{c.role}</span>}
            </div>
            {c.phone && <a href={telHref(c.phone)} style={{ display:"inline-flex", alignItems:"center", gap:5, color:"#4a9a4a", fontSize:15, fontWeight:700, textDecoration:"none", marginTop:3, letterSpacing:0.3 }}><span style={{ fontSize:13, opacity:0.7 }}>📞</span>{c.phone}</a>}
          </div>
          <button onClick={() => remove(c.id)} style={{ background:"none", border:"none", color:"#444", cursor:"pointer", fontSize:16, padding:"0 4px", flexShrink:0 }}>×</button>
        </div>
      ))}
      {showForm ? (
        <div style={{ background:"#1a1a1a", border:"1px solid #333", borderRadius:8, padding:12, marginTop:6 }}>
          <div style={{ marginBottom:8 }}><label style={labelStyle}>Nafn</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="t.d. Gunnar" style={inputStyle} /></div>
          <div style={{ marginBottom:8 }}><label style={labelStyle}>Símanúmer</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="t.d. +354 555 1234" style={inputStyle} /></div>
          <div style={{ marginBottom:10 }}><label style={labelStyle}>Hlutverk (valkvæmt)</label><input type="text" value={role} onChange={(e) => setRole(e.target.value)} placeholder="t.d. Verkstjóri" style={inputStyle} /></div>
          <div style={{ display:"flex", gap:8 }}><button onClick={add} style={btnPrimary}>Bæta við</button><button onClick={() => setShowForm(false)} style={btnSecondary}>Hætta við</button></div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} style={{ ...btnSecondary, fontSize:12, padding:"5px 12px" }}>+ Bæta við tengilið</button>
      )}
    </div>
  );
}

// ── Þríhyrningar / Ferningar counter ──────────────────────────────────────────
const TRI_KEY = "rml_triangle_session";
function TriangleMode({ onDone, onCancel, label="Þríhyrningar" }) {
  const storageKey = label === "Ferningar 50x50" ? "rml_ferningar_session" : TRI_KEY;
  const [count, setCount] = useState(() => { try { return JSON.parse(localStorage.getItem(storageKey))?.count || 0; } catch { return 0; } });
  const [stops, setStops] = useState(() => { try { return JSON.parse(localStorage.getItem(storageKey))?.stops || []; } catch { return []; } });
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const clockStr = now.toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" });
  const persist = (c, s) => localStorage.setItem(storageKey, JSON.stringify({ count:c, stops:s }));
  const adjust = (n) => { const next = Math.max(0, Math.min(10, count + n)); setCount(next); persist(next, stops); };
  const setCountVal = (n) => { setCount(n); persist(n, stops); };
  const total = stops.reduce((s, x) => s + x.count, 0);
  const logStop = () => {
    if (count === 0) return;
    const t = new Date().toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" });
    const newStops = [...stops, { stop: stops.length + 1, count, time: t }];
    setStops(newStops); setCount(0); persist(0, newStops);
  };
  const finish = () => {
    if (stops.length === 0 && count === 0) { localStorage.removeItem(storageKey); onCancel(); return; }
    const finalStops = count > 0 ? [...stops, { stop: stops.length + 1, count }] : stops;
    const finalTotal = finalStops.reduce((s, x) => s + x.count, 0);
    const stopSummary = finalStops.map((s) => `Stopp ${s.stop}: ${s.count}`).join(", ");
    const item = { id:Date.now(), type:label, quantity:finalTotal, stops:finalStops, label:`${label}: ${finalTotal} samtals (${stopSummary})`, timestamp:new Date().toISOString() };
    localStorage.removeItem(storageKey); onDone(item);
  };
  const wasRestored = stops.length > 0 || count > 0;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", zIndex:200, display:"flex", flexDirection:"column", padding:"20px 16px 32px", fontFamily:"'Inter', system-ui, sans-serif" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:10 }}>
          <div style={{ fontWeight:700, color:"#e0e0e0", fontSize:16 }}>{label}</div>
          <div style={{ color:"#4a9a4a", fontSize:18, fontWeight:700 }}>{clockStr}</div>
        </div>
        <button onClick={() => { localStorage.removeItem(storageKey); onCancel(); }} style={{ background:"none", border:"1px solid #444", borderRadius:8, color:"#888", fontSize:13, padding:"6px 14px", cursor:"pointer" }}>Hætta við</button>
      </div>
      {wasRestored && <div style={{ background:"#1a2a1a", border:"1px solid #2a4a2a", borderRadius:6, padding:"6px 10px", marginBottom:10, color:"#4a9a4a", fontSize:12 }}>↩ Lota endurheimt</div>}
      {stops.length > 0 && (
        <div style={{ marginBottom:12 }}>
          <div style={{ color:"#555", fontSize:12, marginBottom:6 }}>{stops.length} stopp · {total} samtals</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {stops.slice(-3).map((s) => <span key={s.stop} style={{ background:"#111", border:"1px solid #2a2a2a", borderRadius:6, color:"#888", fontSize:12, padding:"3px 8px" }}>{s.time && <span style={{ color:"#4a6a4a" }}>{s.time} · </span>}Stopp {s.stop}: {s.count}</span>)}
            {stops.length > 3 && <span style={{ color:"#444", fontSize:12, padding:"3px 4px" }}>← {stops.length - 3} fleiri</span>}
          </div>
        </div>
      )}
      <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
          <button onClick={() => adjust(-1)} style={{ width:64, height:64, borderRadius:"50%", background:count>0?"#2a2a2a":"#111", border:"2px solid #333", color:"#e0e0e0", fontSize:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>−</button>
          <div style={{ textAlign:"center", minWidth:48 }}><div style={{ fontSize:72, fontWeight:800, color:"#e0e0e0", lineHeight:1 }}>{count}</div></div>
          <button onClick={() => adjust(1)} style={{ width:64, height:64, borderRadius:"50%", background:count<10?"#2a3a2a":"#111", border:"2px solid #333", color:count<10?"#4a9a4a":"#444", fontSize:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>+</button>
          <div style={{ display:"flex", flexWrap:"wrap", gap:4, flex:1, justifyContent:"center" }}>
            {[1,2,3,4,5,6,7,8,9,10].map((n) => <button key={n} onClick={() => setCountVal(n)} style={{ width:40, height:40, borderRadius:8, background:count===n?"#e8f0e8":"#1a1a1a", color:count===n?"#111":"#666", border:`1px solid ${count===n?"#e8f0e8":"#2a2a2a"}`, fontSize:15, fontWeight:count===n?700:400, cursor:"pointer" }}>{n}</button>)}
          </div>
        </div>
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={logStop} disabled={count===0} style={{ flex:1, background:count>0?"#1a2a3a":"#111", color:count>0?"#6aacf0":"#444", border:`1px solid ${count>0?"#2a4a6a":"#222"}`, borderRadius:6, padding:"10px", fontSize:13, fontWeight:700, cursor:count>0?"pointer":"default" }}>Skrá stopp →</button>
        <button onClick={finish} disabled={stops.length===0 && count===0} style={{ flex:1, background:stops.length>0||count>0?"#e8f0e8":"#111", color:stops.length>0||count>0?"#111":"#444", border:"none", borderRadius:6, padding:"10px", fontSize:13, fontWeight:700, cursor:stops.length>0||count>0?"pointer":"default" }}>Lokið · {total + count}</button>
      </div>
    </div>
  );
}

// ── Work Item Form ────────────────────────────────────────────────────────────
function WorkItemForm({ onAdd, onCancel }) {
  const allTypes = JSON.parse(localStorage.getItem("rml_worktypes")||"null") || WORK_TYPES;
  const [type, setType] = useState(allTypes[0] || WORK_TYPES[0]);
  const [meters, setMeters] = useState("");
  const [quantity, setQuantity] = useState("");
  const [stencilType, setStencilType] = useState(STENCIL_NAMES[0]);
  const [stencilOther, setStencilOther] = useState("");
  const [zebraSize, setZebraSize] = useState("50x300");
  const [zebraCustom, setZebraCustom] = useState("");
  const [zebraQty, setZebraQty] = useState("");
  const [thermoKind, setThermoKind] = useState(THERMO_KINDS[0]);
  const [thermoThick, setThermoThick] = useState(THERMO_THICKNESS[1]);
  const [thermoAmount, setThermoAmount] = useState("");
  const [thermoZebra, setThermoZebra] = useState("50x300");
  const [otherDesc, setOtherDesc] = useState("");
  const [otherQty, setOtherQty] = useState("");
  const isMeter = METER_TYPES.includes(type);
  const isPiece = PIECE_TYPES.includes(type);
  const isStencil = type === "Stencil";
  const isGangbraut = type === "Gangbraut";
  const isTriangle = type === "Þríhyrningar" || type === "Ferningar 50x50";
  const isThermo = THERMO_MODES.includes(type);
  const isOther = type === "Annað";
  const handleAdd = () => {
    let item = { type, id:Date.now() };
    if (isMeter) { if (!meters) return; item.meters=meters; item.label=type+": "+meters+"m"; }
    else if (isPiece) { if (!quantity) return; item.quantity=quantity; item.label=type+" x "+quantity; }
    else if (isStencil) { if (!quantity) return; const st = stencilType==="Annað"?stencilOther:stencilType; item.stencilType=st; item.quantity=quantity; item.label="Stencil - "+st+" x "+quantity; }
    else if (isGangbraut) { if (!zebraQty) return; const sz = zebraSize==="Sérsniðið"?zebraCustom:zebraSize; item.size=sz; item.quantity=zebraQty; item.label="Gangbraut "+sz+"cm x "+zebraQty; }
    else if (isThermo) {
      if (!thermoAmount) return;
      item.thermoKind = thermoKind;
      if (thermoKind === "Línur") {
        item.thickness = thermoThick;
        item.meters = thermoAmount;
        item.label = type + " " + thermoKind + " " + thermoThick + ": " + thermoAmount + "m";
      } else if (thermoKind === "Gangbraut") {
        item.size = thermoZebra;
        item.quantity = thermoAmount;
        item.label = type + " Gangbraut " + thermoZebra + "cm x " + thermoAmount;
      } else {
        item.quantity = thermoAmount;
        item.label = type + " " + thermoKind + " x " + thermoAmount;
      }
    }
    else if (isOther) { if (!otherDesc.trim()) return; item.description=otherDesc.trim(); item.quantity=otherQty; item.label=otherDesc.trim()+(otherQty?" x "+otherQty:""); }
    onAdd(item);
  };
  if (isTriangle) return <TriangleMode onDone={onAdd} onCancel={onCancel} label={type} />;
  return (
    <div style={{ background:"#1a1a1a", border:"1px solid #333", borderRadius:8, padding:16, marginTop:8 }}>
      <div style={{ marginBottom:10 }}><label style={labelStyle}>Verktegund</label>
        <select value={type} onChange={(e) => { setType(e.target.value); setMeters(""); setQuantity(""); }} style={selectStyle}>{allTypes.map((t) => <option key={t}>{t}</option>)}</select>
      </div>
      {isMeter && <div style={{ marginBottom:10 }}><label style={labelStyle}>Metrar</label><input type="number" value={meters} onChange={(e) => setMeters(e.target.value)} placeholder="t.d. 150" style={inputStyle} /></div>}
      {isPiece && <div style={{ marginBottom:10 }}><label style={labelStyle}>Fjöldi</label><input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="t.d. 4" style={inputStyle} /></div>}
      {isStencil && (
        <div>
          <div style={{ marginBottom:10 }}><label style={labelStyle}>Tegund stencils</label><select value={stencilType} onChange={(e) => setStencilType(e.target.value)} style={selectStyle}>{STENCIL_NAMES.map((s) => <option key={s}>{s}</option>)}</select></div>
          {stencilType === "Annað" && <div style={{ marginBottom:10 }}><input type="text" value={stencilOther} onChange={(e) => setStencilOther(e.target.value)} placeholder="Lýstu stencil" style={inputStyle} /></div>}
          <div style={{ marginBottom:10 }}><label style={labelStyle}>Fjöldi</label><input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="t.d. 4" style={inputStyle} /></div>
        </div>
      )}
      {isThermo && (
        <div>
          <div style={{ marginBottom:10 }}><label style={labelStyle}>Tegund</label>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {THERMO_KINDS.map((k) => (
                <button key={k} onClick={() => { setThermoKind(k); setThermoAmount(""); }} style={{ flex:"1 1 auto", background:thermoKind===k?"#e8f0e8":"#111", color:thermoKind===k?"#111":"#666", border:`1px solid ${thermoKind===k?"#e8f0e8":"#333"}`, borderRadius:8, padding:"8px 10px", fontSize:13, fontWeight:thermoKind===k?700:400, cursor:"pointer" }}>{k}</button>
              ))}
            </div>
          </div>
          {thermoKind === "Línur" && (
            <div style={{ marginBottom:10 }}><label style={labelStyle}>Breidd</label>
              <select value={thermoThick} onChange={(e) => setThermoThick(e.target.value)} style={selectStyle}>{THERMO_THICKNESS.map((t) => <option key={t}>{t}</option>)}</select>
            </div>
          )}
          {thermoKind === "Gangbraut" && (
            <div style={{ marginBottom:10 }}><label style={labelStyle}>Stærð (cm)</label>
              <select value={thermoZebra} onChange={(e) => setThermoZebra(e.target.value)} style={selectStyle}>{ZEBRA_SIZES.filter((s) => s !== "Sérsniðið").map((s) => <option key={s}>{s}</option>)}</select>
            </div>
          )}
          <div style={{ marginBottom:10 }}>
            <label style={labelStyle}>{thermoKind === "Línur" ? "Metrar" : "Fjöldi"}</label>
            <input type="number" value={thermoAmount} onChange={(e) => setThermoAmount(e.target.value)} placeholder={thermoKind === "Línur" ? "t.d. 240" : "t.d. 4"} style={inputStyle} />
          </div>
        </div>
      )}

      {isOther && (
        <div>
          <div style={{ marginBottom:10 }}><label style={labelStyle}>Lýsing</label><input type="text" value={otherDesc} onChange={(e) => setOtherDesc(e.target.value)} placeholder="t.d. Instavolt primark logo" style={inputStyle} /></div>
          <div style={{ marginBottom:10 }}><label style={labelStyle}>Fjöldi (valkvæmt)</label><input type="number" value={otherQty} onChange={(e) => setOtherQty(e.target.value)} placeholder="t.d. 3" style={inputStyle} /></div>
        </div>
      )}
      {isGangbraut && (
        <div>
          <div style={{ marginBottom:10 }}><label style={labelStyle}>Stærð (cm)</label><select value={zebraSize} onChange={(e) => setZebraSize(e.target.value)} style={selectStyle}>{ZEBRA_SIZES.map((s) => <option key={s}>{s}</option>)}</select></div>
          {zebraSize === "Sérsniðið" && <div style={{ marginBottom:10 }}><input type="text" value={zebraCustom} onChange={(e) => setZebraCustom(e.target.value)} placeholder="t.d. 50x180" style={inputStyle} /></div>}
          <div style={{ marginBottom:10 }}><label style={labelStyle}>Fjöldi</label><input type="number" value={zebraQty} onChange={(e) => setZebraQty(e.target.value)} placeholder="t.d. 3" style={inputStyle} /></div>
        </div>
      )}
      <div style={{ display:"flex", gap:8 }}><button onClick={handleAdd} style={btnPrimary}>Bæta við</button><button onClick={onCancel} style={btnSecondary}>Hætta við</button></div>
    </div>
  );
}

// ── Drawings ──────────────────────────────────────────────────────────────────
function DrawingsSection({ drawings, onUpdate }) {
  const [newLabel, setNewLabel] = useState(""); const [newUrl, setNewUrl] = useState(""); const [showForm, setShowForm] = useState(false);
  const addDrawing = () => { if (!newLabel.trim() && !newUrl.trim()) return; onUpdate([...drawings, { id:Date.now(), label:newLabel.trim()||newUrl.trim(), url:newUrl.trim() }]); setNewLabel(""); setNewUrl(""); setShowForm(false); };
  const removeDrawing = (id) => onUpdate(drawings.filter((d) => d.id!==id));
  return (
    <div style={{ marginBottom:14 }}>
      <div style={sectionLabel}>Teikningar</div>
      {drawings.length===0 && !showForm && <div style={{ color:"#444", fontSize:13, marginBottom:8 }}>Engar teikningar</div>}
      {drawings.map((d) => (
        <div key={d.id} style={{ display:"flex", alignItems:"center", gap:8, background:"#1a1a1a", borderRadius:6, padding:"7px 10px", marginBottom:6 }}>
          <span style={{ color:"#666", fontSize:13 }}>[+]</span>
          {d.url ? <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ color:"#7ab8f5", fontSize:13, flex:1, textDecoration:"none", wordBreak:"break-all" }}>{d.label}</a> : <span style={{ color:"#ccc", fontSize:13, flex:1 }}>{d.label}</span>}
          <button onClick={() => removeDrawing(d.id)} style={{ background:"none", border:"none", color:"#555", cursor:"pointer", fontSize:16, padding:"0 4px" }}>×</button>
        </div>
      ))}
      {showForm ? (
        <div style={{ background:"#1a1a1a", border:"1px solid #333", borderRadius:8, padding:12, marginTop:6 }}>
          <div style={{ marginBottom:8 }}><label style={labelStyle}>Heiti (valkvæmt)</label><input type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="t.d. Yfirlitsmynd" style={inputStyle} /></div>
          <div style={{ marginBottom:10 }}><label style={labelStyle}>Hlekkur</label><input type="url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://drive.google.com/..." style={inputStyle} /></div>
          <div style={{ display:"flex", gap:8 }}><button onClick={addDrawing} style={btnPrimary}>Bæta við</button><button onClick={() => setShowForm(false)} style={btnSecondary}>Hætta við</button></div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} style={{ ...btnSecondary, fontSize:12, padding:"5px 12px" }}>+ Bæta við teikningu</button>
      )}
    </div>
  );
}

// ── Comments ──────────────────────────────────────────────────────────────────
function CommentsSection({ project }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(() => localStorage.getItem("rml_name") || "");
  const [message, setMessage] = useState("");
  const [posting, setPosting] = useState(false);
  useEffect(() => { loadComments(project.id).then(setComments).catch(() => setComments([])).finally(() => setLoading(false)); }, [project.id]);
  const post = async () => {
    if (!message.trim() || !name.trim()) return;
    localStorage.setItem("rml_name", name.trim());
    setPosting(true);
    const now = new Date().toLocaleString("en-GB", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" });
    setComments((prev) => [...prev, { timestamp:now, name:name.trim(), message:message.trim() }]);
    setMessage("");
    await postComment([now, String(project.id), name.trim(), message.trim()]).catch(console.error);
    setPosting(false);
  };
  return (
    <div style={{ marginBottom:14 }}>
      <div style={sectionLabel}>Athugasemdir</div>
      {loading && <div style={{ color:"#444", fontSize:13, marginBottom:8 }}>Hleður…</div>}
      {!loading && comments.length === 0 && <div style={{ color:"#444", fontSize:13, marginBottom:8 }}>Engar athugasemdir</div>}
      {comments.map((c, i) => (
        <div key={i} style={{ background:"#111", border:"1px solid #222", borderRadius:8, padding:"10px 12px", marginBottom:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:4 }}>
            <span style={{ color:"#6aacf0", fontSize:13, fontWeight:600 }}>{c.name}</span>
            <span style={{ color:"#444", fontSize:11 }}>{c.timestamp}</span>
          </div>
          <div style={{ color:"#ccc", fontSize:13, lineHeight:1.5 }}>{c.message}</div>
        </div>
      ))}
      <div style={{ marginTop:8 }}>
        {!localStorage.getItem("rml_name") && <div style={{ marginBottom:8 }}><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nafn þitt" style={{ ...inputStyle, fontSize:13 }} /></div>}
        <div style={{ display:"flex", gap:6 }}>
          <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key==="Enter" && post()} placeholder="Skrifa athugasemd…" style={{ ...inputStyle, flex:1, fontSize:13 }} />
          <button onClick={post} disabled={!message.trim()||!name.trim()||posting} style={{ ...btnPrimary, padding:"8px 14px", opacity:message.trim()&&name.trim()?1:0.4 }}>{posting ? "…" : "Senda"}</button>
        </div>
      </div>
    </div>
  );
}

// ── time ago helper ───────────────────────────────────────────────────────────
function timeAgo(isoString) {
  if (!isoString) return null;
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (diff < 60) return "rétt í þessu";
  if (diff < 3600) return `${Math.floor(diff/60)} mín síðan`;
  if (diff < 86400) return `${Math.floor(diff/3600)} klst síðan`;
  return `${Math.floor(diff/86400)} d síðan`;
}
function openMaps(address) {
  const encoded = encodeURIComponent(address);
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const url = isIos ? `maps://maps.apple.com/?q=${encoded}` : `https://www.google.com/maps/search/?api=1&query=${encoded}`;
  window.open(url, "_blank");
}

// ── Location Log ──────────────────────────────────────────────────────────────
function LocationLog({ location, project, onUpdate, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressDraft, setAddressDraft] = useState(location.address || "");
  const [showItems, setShowItems] = useState(false);

  const addItem = useCallback(async (item) => {
    item.timestamp = new Date().toISOString();
    onUpdate({ ...location, workItems:[...location.workItems, item] });
    setShowForm(false);
    setSyncStatus("syncing");
    const now = new Date();
    const timestamp = now.toLocaleString("en-GB", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" });
    const row = [timestamp, project.name, project.region + (project.subRegion ? " > " + project.subRegion : ""), project.assignedTo || "", location.name, item.type, item.label, item.meters || item.quantity || "", item.size || ""];
    appendToSheet(row).catch(console.error);
    setSyncStatus("ok");
    setTimeout(() => setSyncStatus(null), 3000);
  }, [location, project, onUpdate]);

  const removeItem = (id) => onUpdate({ ...location, workItems:location.workItems.filter((i) => i.id!==id) });
  const saveAddress = () => { onUpdate({ ...location, address: addressDraft }); setEditingAddress(false); };

  return (
    <div style={{ background:"#111", border:"1px solid #2a2a2a", borderRadius:8, padding:14, marginBottom:10 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontWeight:600, color:"#e0e0e0", fontSize:15 }}>{location.name}</span>
          <SyncBadge status={syncStatus} />
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          {location.address ? (
            <button onClick={() => openMaps(location.address)} style={{ background:"#1a2a1a", border:"1px solid #2a4a2a", borderRadius:6, color:"#4a9a4a", fontSize:12, padding:"4px 10px", cursor:"pointer", flexShrink:0 }}>📍 Rata</button>
          ) : (
            <button onClick={() => setEditingAddress(true)} style={{ background:"none", border:"1px solid #2a2a2a", borderRadius:6, color:"#555", fontSize:11, padding:"3px 8px", cursor:"pointer", flexShrink:0 }}>+ Heimilisfang</button>
          )}
          {onDelete && <button onClick={() => { if(window.confirm(`Eyða "${location.name}"?`)) onDelete(location.id); }} style={{ background:"none", border:"none", color:"#5a2a2a", cursor:"pointer", fontSize:16, padding:"0 4px" }}>🗑</button>}
        </div>
      </div>
      {editingAddress && (
        <div style={{ marginBottom:10 }}>
          <input type="text" value={addressDraft} onChange={(e) => setAddressDraft(e.target.value)} onKeyDown={(e) => e.key==="Enter" && saveAddress()} placeholder="t.d. Ráðhústorg, Akureyri" style={{ ...inputStyle, fontSize:13, marginBottom:6 }} autoFocus />
          <div style={{ display:"flex", gap:6 }}>
            <button onClick={saveAddress} style={{ ...btnPrimary, fontSize:12, padding:"5px 12px" }}>Vista</button>
            <button onClick={() => setEditingAddress(false)} style={{ ...btnSecondary, fontSize:12, padding:"5px 12px" }}>Hætta við</button>
            {location.address && <button onClick={() => { setAddressDraft(""); onUpdate({ ...location, address:"" }); setEditingAddress(false); }} style={{ ...btnSecondary, fontSize:12, padding:"5px 12px", color:"#7a3a3a" }}>Eyða</button>}
          </div>
        </div>
      )}
      {location.address && !editingAddress && <div onClick={() => { setAddressDraft(location.address); setEditingAddress(true); }} style={{ color:"#555", fontSize:11, marginBottom:8, cursor:"pointer" }}>{location.address}</div>}

      {location.workItems.length === 0 && <div style={{ color:"#444", fontSize:13, marginBottom:8 }}>Ekkert skráð enn</div>}
      {location.workItems.length > 0 && (
        <div style={{ marginBottom:8 }}>
          <div onClick={() => setShowItems(!showItems)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"#1a1a1a", borderRadius:6, padding:"7px 10px", cursor:"pointer", marginBottom: showItems ? 6 : 0 }}>
            <span style={{ color:"#888", fontSize:13 }}>
              {location.workItems.length} skráning{location.workItems.length !== 1 ? "ar" : ""}
              {location.workItems[location.workItems.length-1]?.timestamp && <span style={{ color:"#4a6a4a", fontSize:11, marginLeft:8 }}>⏱ {timeAgo(location.workItems[location.workItems.length-1].timestamp)}</span>}
            </span>
            <span style={{ color:"#555", fontSize:12 }}>{showItems ? "∧" : "∨"}</span>
          </div>
          {showItems && location.workItems.map((item, idx) => {
            const isLast = idx === location.workItems.length - 1;
            const ago = isLast && item.timestamp ? timeAgo(item.timestamp) : null;
            return (
              <div key={item.id} style={{ background:"#1a1a1a", borderRadius:6, padding:"6px 10px", marginBottom:4 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:13, color:"#ccc" }}>
                  <span>{item.label}</span>
                  <button onClick={() => removeItem(item.id)} style={{ background:"none", border:"none", color:"#555", cursor:"pointer", fontSize:16, lineHeight:1, padding:"0 4px" }}>×</button>
                </div>
                {ago && <div style={{ color:"#4a6a4a", fontSize:11, marginTop:2 }}>⏱ {ago}</div>}
              </div>
            );
          })}
        </div>
      )}
      {showForm ? <WorkItemForm onAdd={addItem} onCancel={() => setShowForm(false)} /> : <button onClick={() => setShowForm(true)} style={{ ...btnSecondary, fontSize:12, padding:"5px 12px" }}>+ Skrá vinnu</button>}
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────────────────
function SettingsPanel({ onClose }) {
  const [tab, setTab] = useState("towns");
  const [subRegions, setSubRegions] = useState(() => { try { return JSON.parse(localStorage.getItem("rml_subregions")) || DEFAULT_SUB_REGIONS; } catch { return DEFAULT_SUB_REGIONS; } });
  const [workTypes, setWorkTypes] = useState(() => { try { return JSON.parse(localStorage.getItem("rml_worktypes")) || DEFAULT_WORK_TYPES; } catch { return DEFAULT_WORK_TYPES; } });
  const [cars, setCars] = useState(() => { try { return JSON.parse(localStorage.getItem("rml_cars")) || DEFAULT_CARS; } catch { return DEFAULT_CARS; } });
  const regions = JSON.parse(localStorage.getItem("rml_regions")||"null") || DEFAULT_REGIONS;
  const [newItem, setNewItem] = useState("");
  const [selectedRegion, setSelectedRegion] = useState(regions[0] || "");
  const saveSubRegions = (sr) => { setSubRegions(sr); localStorage.setItem("rml_subregions", JSON.stringify(sr)); };
  const saveWorkTypes = (wt) => { setWorkTypes(wt); localStorage.setItem("rml_worktypes", JSON.stringify(wt)); };
  const saveCars = (c) => { setCars(c); localStorage.setItem("rml_cars", JSON.stringify(c)); };
  const addTown = () => { if (!newItem.trim() || !selectedRegion) return; saveSubRegions({ ...subRegions, [selectedRegion]: [...(subRegions[selectedRegion]||[]), newItem.trim()] }); setNewItem(""); };
  const removeTown = (region, town) => saveSubRegions({ ...subRegions, [region]: subRegions[region].filter((t) => t !== town) });
  const addWorkType = () => { if (!newItem.trim()) return; saveWorkTypes([...workTypes, newItem.trim()]); setNewItem(""); };
  const removeWorkType = (wt) => saveWorkTypes(workTypes.filter((w) => w !== wt));
  const addCar = () => { if (!newItem.trim()) return; saveCars([...cars, newItem.trim()]); setNewItem(""); };
  const removeCar = (c) => saveCars(cars.filter((x) => x !== c));
  const tabs = [{ id:"towns", label:"Bæir" }, { id:"worktypes", label:"Verktegundir" }, { id:"cars", label:"Bílar" }];
  return (
    <div style={{ background:"#161616", border:"1px solid #2a2a2a", borderRadius:10, marginBottom:16, overflow:"hidden" }}>
      <div style={{ padding:"14px 16px", borderBottom:"1px solid #1a1a1a", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontWeight:700, fontSize:15 }}>⚙️ Stillingar</div>
        <button onClick={onClose} style={{ background:"none", border:"none", color:"#555", fontSize:18, cursor:"pointer" }}>×</button>
      </div>
      <div style={{ display:"flex", gap:6, padding:"10px 16px", borderBottom:"1px solid #1a1a1a" }}>
        {tabs.map((t) => <button key={t.id} onClick={() => { setTab(t.id); setNewItem(""); }} style={{ background:tab===t.id?"#e8f0e8":"none", color:tab===t.id?"#111":"#666", border:tab===t.id?"none":"1px solid #222", borderRadius:16, padding:"5px 14px", fontSize:12, cursor:"pointer", fontWeight:tab===t.id?700:400 }}>{t.label}</button>)}
      </div>
      <div style={{ padding:"14px 16px" }}>
        {tab === "towns" && (
          <div>
            <div style={{ marginBottom:10 }}><label style={labelStyle}>Svæði</label><select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} style={selectStyle}>{regions.map((r) => <option key={r}>{r}</option>)}</select></div>
            {selectedRegion && (subRegions[selectedRegion]||[]).map((town) => <div key={town} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"#111", borderRadius:6, padding:"8px 12px", marginBottom:6, fontSize:13, color:"#ccc" }}>{town}<button onClick={() => removeTown(selectedRegion, town)} style={{ background:"none", border:"none", color:"#555", cursor:"pointer", fontSize:15 }}>×</button></div>)}
            <div style={{ display:"flex", gap:6, marginTop:8 }}><input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key==="Enter" && addTown()} placeholder="Nýr bær…" style={{ ...inputStyle, flex:1, fontSize:13 }} /><button onClick={addTown} style={{ ...btnPrimary, padding:"8px 12px" }}>+</button></div>
          </div>
        )}
        {tab === "worktypes" && (
          <div>
            {workTypes.map((wt) => <div key={wt} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"#111", borderRadius:6, padding:"8px 12px", marginBottom:6, fontSize:13, color:"#ccc" }}>{wt}<button onClick={() => removeWorkType(wt)} style={{ background:"none", border:"none", color:"#555", cursor:"pointer", fontSize:15 }}>×</button></div>)}
            <div style={{ display:"flex", gap:6, marginTop:8 }}><input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key==="Enter" && addWorkType()} placeholder="Ný verktegund…" style={{ ...inputStyle, flex:1, fontSize:13 }} /><button onClick={addWorkType} style={{ ...btnPrimary, padding:"8px 12px" }}>+</button></div>
          </div>
        )}
        {tab === "cars" && (
          <div>
            {cars.map((c) => <div key={c} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"#111", borderRadius:6, padding:"8px 12px", marginBottom:6, fontSize:13, color:"#ccc" }}>{c}<button onClick={() => removeCar(c)} style={{ background:"none", border:"none", color:"#555", cursor:"pointer", fontSize:15 }}>×</button></div>)}
            <div style={{ display:"flex", gap:6, marginTop:8 }}><input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key==="Enter" && addCar()} placeholder="Nýr bíll eða nafn…" style={{ ...inputStyle, flex:1, fontSize:13 }} /><button onClick={addCar} style={{ ...btnPrimary, padding:"8px 12px" }}>+</button></div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Hours ─────────────────────────────────────────────────────────────────────
function roundDown15(date) { const d = new Date(date); d.setMinutes(Math.floor(d.getMinutes()/15)*15, 0, 0); return d; }
function roundUp15(date) { const d = new Date(date); const m = d.getMinutes(); const rem = m % 15; if (rem === 0) return d; d.setMinutes(m + (15 - rem), 0, 0); return d; }
function fmtTime(date) { return date.toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" }); }
function diffHours(a, b) { return ((b - a) / 3600000).toFixed(2); }
function HoursTracker({ onClose }) {
  const [name, setName] = useState("");
  const [clockedIn, setClockedIn] = useState(null);
  const [breaks, setBreaks] = useState(0);
  const [log, setLog] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);
  const clockIn = () => { if (!name.trim()) return; const now = new Date(); setClockedIn({ raw:now, rounded:roundDown15(now), name:name.trim() }); setSynced(false); };
  const clockOut = async () => {
    if (!clockedIn) return;
    const now = new Date(); const roundedOut = roundUp15(now);
    const hours = diffHours(clockedIn.rounded, roundedOut);
    const today = now.toLocaleDateString("en-GB");
    const breakNote = breaks === 1 ? "Mínus matur" : breaks === 2 ? "Mínus matur x2" : "";
    const entry = { date:today, name:clockedIn.name, clockIn:fmtTime(clockedIn.rounded), clockOut:fmtTime(roundedOut), hours, breakNote };
    setLog([...log, entry]); setSyncing(true);
    appendHoursToSheet([entry.date, entry.name, entry.clockIn, entry.clockOut, entry.hours, breakNote]).catch(console.error);
    setTimeout(() => { setSyncing(false); setSynced(true); }, 1000);
    setClockedIn(null); setBreaks(0);
  };
  return (
    <div style={{ background:"#161616", border:"1px solid #2a2a2a", borderRadius:10, marginBottom:16, overflow:"hidden" }}>
      <div style={{ padding:"14px 16px", borderBottom:"1px solid #1a1a1a", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontWeight:700, fontSize:15 }}>⏱ Tímar</div>
        <button onClick={onClose} style={{ background:"none", border:"none", color:"#555", fontSize:18, cursor:"pointer" }}>×</button>
      </div>
      <div style={{ padding:"14px 16px" }}>
        {!clockedIn ? (
          <div>
            <div style={{ marginBottom:10 }}><label style={labelStyle}>Nafn</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="t.d. Jón" style={inputStyle} /></div>
            <button onClick={clockIn} disabled={!name.trim()} style={{ ...btnSuccess, width:"100%", padding:"12px", fontSize:14, fontWeight:700, opacity:name.trim()?1:0.4 }}>Stimpla inn</button>
          </div>
        ) : (
          <div style={{ textAlign:"center" }}>
            <div style={{ color:"#555", fontSize:12, marginBottom:4 }}>{clockedIn.name} · stimplað inn</div>
            <div style={{ fontSize:36, fontWeight:800, color:"#4a9a4a", marginBottom:2 }}>{fmtTime(clockedIn.rounded)}</div>
            <div style={{ color:"#444", fontSize:11, marginBottom:16 }}>af {fmtTime(clockedIn.raw)}</div>
            <div style={{ marginBottom:14 }}>
              <div style={{ color:"#666", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>Pása tekin?</div>
              <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
                {[{val:0,label:"Engin"},{val:1,label:"Matur"},{val:2,label:"Matur x2"}].map((b) => <button key={b.val} onClick={() => setBreaks(b.val)} style={{ background:breaks===b.val?"#e8f0e8":"#1a1a1a", color:breaks===b.val?"#111":"#666", border:`1px solid ${breaks===b.val?"#e8f0e8":"#333"}`, borderRadius:8, padding:"7px 14px", fontSize:12, fontWeight:breaks===b.val?700:400, cursor:"pointer" }}>{b.label}</button>)}
              </div>
            </div>
            <button onClick={clockOut} style={{ background:"#e8f0e8", color:"#111", border:"none", borderRadius:8, padding:"12px 32px", fontSize:14, fontWeight:700, cursor:"pointer", width:"100%" }}>Stimpla út</button>
          </div>
        )}
        {log.length > 0 && (
          <div style={{ marginTop:14, borderTop:"1px solid #1a1a1a", paddingTop:12 }}>
            {log.map((e, i) => (
              <div key={i} style={{ marginBottom:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#888" }}><span>{e.name}</span><span>{e.clockIn} → {e.clockOut}</span><span style={{ color:"#4a9a4a" }}>{e.hours}klst</span></div>
                {e.breakNote && <div style={{ color:"#7a5a2a", fontSize:11, marginTop:2 }}>{e.breakNote}</div>}
              </div>
            ))}
            {syncing && <div style={{ color:"#6aacf0", fontSize:11, textAlign:"center" }}>Sendi…</div>}
            {synced && !syncing && <div style={{ color:"#4a9a4a", fontSize:11, textAlign:"center" }}>✓ Skráð</div>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Private Checklist ─────────────────────────────────────────────────────────
const DEFAULT_ITEMS = ["Hleðslutæki", "Powerbank", "Bætiefni", "Nærföt", "Snyrtitaska", "Sundföt", "Heyrnartól", "Nesti"];
function PrivateChecklist({ onClose }) {
  const [items, setItems] = useState(() => { try { const saved = localStorage.getItem("rml_private_checklist"); return saved ? JSON.parse(saved) : DEFAULT_ITEMS.map((label, i) => ({ id:i, label, done:false })); } catch { return DEFAULT_ITEMS.map((label, i) => ({ id:i, label, done:false })); } });
  const [newItem, setNewItem] = useState("");
  const save = (updated) => { setItems(updated); localStorage.setItem("rml_private_checklist", JSON.stringify(updated)); };
  const toggle = (id) => save(items.map((i) => i.id===id ? {...i, done:!i.done} : i));
  const remove = (id) => save(items.filter((i) => i.id!==id));
  const add = () => { if (!newItem.trim()) return; save([...items, { id:Date.now(), label:newItem.trim(), done:false }]); setNewItem(""); };
  const reset = () => save(items.map((i) => ({...i, done:false})));
  const doneCount = items.filter((i) => i.done).length;
  return (
    <div style={{ background:"#161616", border:"1px solid #2a2a2a", borderRadius:10, marginBottom:16, overflow:"hidden" }}>
      <div style={{ padding:"14px 16px", borderBottom:"1px solid #1a1a1a", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontWeight:700, fontSize:15 }}>🎒 Minn listi <span style={{ color:"#555", fontSize:12, fontWeight:400 }}>{doneCount}/{items.length}</span></div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {doneCount > 0 && <button onClick={reset} style={{ background:"none", border:"none", color:"#555", fontSize:12, cursor:"pointer" }}>Núllstilla</button>}
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#555", fontSize:18, cursor:"pointer" }}>×</button>
        </div>
      </div>
      <div style={{ padding:"14px 16px" }}>
        {items.map((item) => (
          <div key={item.id} style={{ display:"flex", alignItems:"center", gap:10, background:item.done?"#0f1a0f":"#111", border:`1px solid ${item.done?"#1e3a1e":"#222"}`, borderRadius:7, padding:"9px 12px", marginBottom:6 }}>
            <div onClick={() => toggle(item.id)} style={{ width:18, height:18, borderRadius:4, flexShrink:0, cursor:"pointer", border:`2px solid ${item.done?"#4a9a4a":"#444"}`, background:item.done?"#1a4a1a":"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>{item.done && <span style={{ color:"#4a9a4a", fontSize:12 }}>✓</span>}</div>
            <span style={{ flex:1, fontSize:13, color:item.done?"#4a7a4a":"#ccc", textDecoration:item.done?"line-through":"none" }}>{item.label}</span>
            <button onClick={() => remove(item.id)} style={{ background:"none", border:"none", color:"#3a3a3a", cursor:"pointer", fontSize:15, padding:"0 2px" }}>×</button>
          </div>
        ))}
        <div style={{ display:"flex", gap:6, marginTop:8 }}><input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key==="Enter" && add()} placeholder="Bæta við…" style={{ ...inputStyle, flex:1, fontSize:13, padding:"6px 10px" }} /><button onClick={add} style={{ ...btnPrimary, padding:"6px 12px" }}>+</button></div>
      </div>
    </div>
  );
}

// ── Trips ─────────────────────────────────────────────────────────────────────
function TripsView({ projects, onClose }) {
  const [selected, setSelected] = useState([]);
  const [tripName, setTripName] = useState("");
  const [showChecklist, setShowChecklist] = useState(false);
  const toggle = (id) => setSelected(selected.includes(id) ? selected.filter((x) => x!==id) : [...selected, id]);
  const selectedProjects = projects.filter((p) => selected.includes(p.id));
  const mergedChecklist = []; const seen = new Set();
  selectedProjects.forEach((p) => (p.checklist||[]).forEach((item) => { if (!seen.has(item.label)) { seen.add(item.label); mergedChecklist.push({ ...item, id: Date.now() + Math.random() }); } }));
  const totalItems = selectedProjects.reduce((s, p) => s + p.locations.reduce((ls, l) => ls + l.workItems.length, 0), 0);
  return (
    <div style={{ background:"#161616", border:"1px solid #2a2a2a", borderRadius:10, marginBottom:16, overflow:"hidden" }}>
      <div style={{ padding:"14px 16px", borderBottom:"1px solid #1a1a1a", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontWeight:700, fontSize:15 }}>🗺 Ferðir</div>
        <button onClick={onClose} style={{ background:"none", border:"none", color:"#555", fontSize:18, cursor:"pointer" }}>×</button>
      </div>
      <div style={{ padding:"14px 16px" }}>
        {!showChecklist ? (
          <div>
            <div style={{ marginBottom:10 }}><label style={labelStyle}>Heiti ferðar (valkvæmt)</label><input type="text" value={tripName} onChange={(e) => setTripName(e.target.value)} placeholder="t.d. Mánudagsferð" style={inputStyle} /></div>
            <div style={{ color:"#666", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>Veldu verkefni</div>
            {projects.filter((p) => !p.finished).map((p) => (
              <div key={p.id} onClick={() => toggle(p.id)} style={{ display:"flex", alignItems:"center", gap:10, background:selected.includes(p.id)?"#0f1a0f":"#111", border:`1px solid ${selected.includes(p.id)?"#1e3a1e":"#222"}`, borderRadius:8, padding:"10px 12px", marginBottom:6, cursor:"pointer" }}>
                <div style={{ width:18, height:18, borderRadius:4, border:`2px solid ${selected.includes(p.id)?"#4a9a4a":"#444"}`, background:selected.includes(p.id)?"#1a4a1a":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{selected.includes(p.id) && <span style={{ color:"#4a9a4a", fontSize:12 }}>✓</span>}</div>
                <div><div style={{ color:"#e0e0e0", fontSize:13, fontWeight:600 }}>{p.name}</div><div style={{ color:"#555", fontSize:11 }}>{p.region}{p.subRegion?" > "+p.subRegion:""} · {(p.checklist||[]).length} atriði</div></div>
              </div>
            ))}
            {selected.length > 0 && <button onClick={() => setShowChecklist(true)} style={{ ...btnPrimary, width:"100%", marginTop:8, padding:"10px" }}>Sýna sameinaðan lista ({mergedChecklist.length}) →</button>}
          </div>
        ) : (
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}><button onClick={() => setShowChecklist(false)} style={{ background:"none", border:"none", color:"#888", fontSize:13, cursor:"pointer", padding:0 }}>← Til baka</button><div style={{ fontWeight:700, color:"#e0e0e0" }}>{tripName || "Ferð"}</div></div>
            <div style={{ color:"#555", fontSize:12, marginBottom:10 }}>{selectedProjects.length} verkefni · {totalItems} skráningar · {mergedChecklist.length} atriði</div>
            {mergedChecklist.map((item) => <div key={item.id} style={{ display:"flex", alignItems:"center", gap:10, background:"#111", border:"1px solid #222", borderRadius:7, padding:"9px 12px", marginBottom:6 }}><div style={{ width:18, height:18, borderRadius:4, border:"2px solid #444", flexShrink:0 }} /><span style={{ fontSize:13, color:"#ccc" }}>{item.label}</span></div>)}
            {mergedChecklist.length === 0 && <div style={{ color:"#444", fontSize:13, textAlign:"center", padding:"20px 0" }}>Engin atriði á völdum verkefnum</div>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Work Mode ─────────────────────────────────────────────────────────────────
function WorkMode({ project, onUpdate, onExit }) {
  const [newLocName, setNewLocName] = useState("");
  const [showAddLoc, setShowAddLoc] = useState(false);
  const updateLocation = (loc) => onUpdate({ ...project, locations:project.locations.map((l) => l.id===loc.id ? loc : l) });
  const addLocation = () => {
    if (!newLocName.trim()) return;
    onUpdate({ ...project, locations:[...project.locations, { id:Date.now(), name:newLocName.trim(), workItems:[], address:"" }] });
    setNewLocName(""); setShowAddLoc(false);
  };
  const hasDrawings = (project.drawings||[]).length > 0;
  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0a", color:"#e0e0e0", fontFamily:"'Inter', system-ui, sans-serif", maxWidth:600, margin:"0 auto", padding:"0 0 40px" }}>
      <div style={{ padding:"16px 16px 14px", borderBottom:"1px solid #1a1a1a", position:"sticky", top:0, background:"#0a0a0a", zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={onExit} style={{ background:"none", border:"1px solid #333", borderRadius:8, color:"#888", fontSize:13, padding:"6px 12px", cursor:"pointer", flexShrink:0 }}>← Til baka</button>
          <div style={{ minWidth:0 }}>
            <div style={{ fontWeight:800, fontSize:16, letterSpacing:-0.3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{project.name}</div>
            <div style={{ color:"#444", fontSize:11 }}>Í vinnslu · {project.assignedTo||"Óúthlutað"}</div>
          </div>
          {!project.finished && (
            <button onClick={() => onUpdate({ ...project, finished:true })} style={{ background:"#1a3a1a", color:"#4a9a4a", border:"1px solid #2a5a2a", borderRadius:6, padding:"6px 12px", fontSize:12, cursor:"pointer", marginLeft:"auto", flexShrink:0 }}>✓ Lokið</button>
          )}
        </div>
      </div>
      <div style={{ padding:"14px 16px 0" }}>
        {project.notes && <div style={{ background:"#111", border:"1px solid #2a2a2a", borderRadius:8, padding:"10px 12px", marginBottom:14, color:"#888", fontSize:13, fontStyle:"italic", lineHeight:1.5 }}>{project.notes}</div>}
        {hasDrawings && (
          <div style={{ marginBottom:14 }}>
            <div style={{ color:"#666", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>Teikningar</div>
            {project.drawings.map((d) => (
              <div key={d.id} style={{ display:"flex", alignItems:"center", gap:8, background:"#1a1a1a", borderRadius:6, padding:"9px 12px", marginBottom:6 }}>
                <span style={{ color:"#555", fontSize:13 }}>[+]</span>
                {d.url ? <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ color:"#7ab8f5", fontSize:14, flex:1, textDecoration:"none", fontWeight:600 }}>{d.label}</a> : <span style={{ color:"#ccc", fontSize:14, flex:1 }}>{d.label}</span>}
              </div>
            ))}
          </div>
        )}
        {(project.notes || hasDrawings) && <div style={{ borderTop:"1px solid #1a1a1a", marginBottom:14 }} />}
        <div style={{ color:"#666", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5, marginBottom:10 }}>Verkefni</div>
        {project.locations.length === 0 && <div style={{ color:"#444", fontSize:13, marginBottom:10 }}>Ekkert skráð enn — bættu við hér að neðan</div>}
        {project.locations.map((loc) => (
          <LocationLog key={loc.id} location={loc} project={project} onUpdate={updateLocation}
            onDelete={(id) => onUpdate({ ...project, locations:project.locations.filter((l) => l.id!==id) })} />
        ))}
        {showAddLoc ? (
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <input type="text" value={newLocName} onChange={(e) => setNewLocName(e.target.value)} onKeyDown={(e) => e.key==="Enter" && addLocation()} placeholder="Nafn verkefnis" style={{ ...inputStyle, flex:1 }} autoFocus />
            <button onClick={addLocation} style={btnPrimary}>Bæta við</button>
            <button onClick={() => setShowAddLoc(false)} style={btnSecondary}>×</button>
          </div>
        ) : (
          <button onClick={() => setShowAddLoc(true)} style={{ ...btnSecondary, fontSize:12, marginTop:4, width:"100%" }}>+ Bæta við verkefni</button>
        )}
      </div>
    </div>
  );
}

// ── Edit Project Form ─────────────────────────────────────────────────────────
function EditProjectForm({ project, onSave, onCancel }) {
  const savedRegions = JSON.parse(localStorage.getItem("rml_regions")||"null") || DEFAULT_REGIONS;
  const savedSubRegions = JSON.parse(localStorage.getItem("rml_subregions")||"null") || DEFAULT_SUB_REGIONS;
  const savedCars = JSON.parse(localStorage.getItem("rml_cars")||"null") || DEFAULT_CARS;
  const [name, setName] = useState(project.name);
  const [region, setRegion] = useState(project.region || savedRegions[0]);
  const [subRegion, setSubRegion] = useState(project.subRegion || "");
  const [assignedTo, setAssignedTo] = useState(project.assignedTo || "");
  const [client, setClient] = useState(project.client || "");
  const [projectType, setProjectType] = useState(project.projectType || "seasonal");
  const save = () => { if (!name.trim()) return; onSave({ ...project, name:name.trim(), region, subRegion, assignedTo, client:client.trim(), projectType }); };
  return (
    <div style={{ background:"#1a1a1a", border:"1px solid #333", borderRadius:8, padding:14, marginBottom:12 }}>
      <div style={{ fontWeight:600, color:"#e0e0e0", fontSize:13, marginBottom:12 }}>Breyta verkefni</div>
      <div style={{ marginBottom:10 }}><label style={labelStyle}>Nafn verkefnis</label><input type="text" value={name} onChange={(e)=>setName(e.target.value)} style={inputStyle} /></div>
      <div style={{ marginBottom:10 }}><label style={labelStyle}>Svæði</label>
        <select value={region} onChange={(e)=>{setRegion(e.target.value);setSubRegion("");}} style={selectStyle}>{savedRegions.map((r)=><option key={r}>{r}</option>)}</select>
      </div>
      {savedSubRegions[region]?.length > 0 && (
        <div style={{ marginBottom:10 }}><label style={labelStyle}>Bær</label>
          <select value={subRegion} onChange={(e)=>setSubRegion(e.target.value)} style={selectStyle}><option value="">Ekkert</option>{savedSubRegions[region].map((s)=><option key={s}>{s}</option>)}</select>
        </div>
      )}
      <div style={{ marginBottom:10 }}><label style={labelStyle}>Úthlutað á</label>
        <select value={assignedTo} onChange={(e)=>setAssignedTo(e.target.value)} style={selectStyle}><option value="">Óúthlutað</option>{savedCars.map((c)=><option key={c}>{c}</option>)}</select>
      </div>
      <div style={{ marginBottom:10 }}><label style={labelStyle}>Viðskiptavinur</label>
        <input type="text" value={client} onChange={(e)=>setClient(e.target.value)} placeholder="t.d. Krónan" style={inputStyle} list="rml-clients" />
      </div>
      <div style={{ marginBottom:12 }}><label style={labelStyle}>Tegund verkefnis</label>
        <div style={{ display:"flex", gap:8 }}>
          {[{val:"seasonal",label:"🔄 Árleg verk"},{val:"oneoff",label:"1️⃣ Einstök verk"}].map((t) => (
            <button key={t.val} onClick={() => setProjectType(t.val)} style={{ flex:1, background:projectType===t.val?"#e8f0e8":"#111", color:projectType===t.val?"#111":"#666", border:`1px solid ${projectType===t.val?"#e8f0e8":"#333"}`, borderRadius:8, padding:"8px", fontSize:12, fontWeight:projectType===t.val?700:400, cursor:"pointer" }}>{t.label}</button>
          ))}
        </div>
      </div>
      <div style={{ display:"flex", gap:8 }}><button onClick={save} style={btnPrimary}>Vista</button><button onClick={onCancel} style={btnSecondary}>Hætta við</button></div>
    </div>
  );
}

// ── Project Card ──────────────────────────────────────────────────────────────
function ProjectCard({ project, onUpdate, onDelete, onStartWork, onMoveUp, onMoveDown, isFirst, isLast }) {
  const [expanded, setExpanded] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [editingProject, setEditingProject] = useState(false);

  const addLocation = () => {
    if (!newLocationName.trim()) return;
    onUpdate({ ...project, locations:[...project.locations, { id:Date.now(), name:newLocationName.trim(), workItems:[], address:"" }] });
    setNewLocationName(""); setShowAddLocation(false);
  };
  const updateLocation = (loc) => onUpdate({ ...project, locations:project.locations.map((l) => l.id===loc.id ? loc : l) });
  const totalItems = project.locations.reduce((sum,l) => sum+l.workItems.length, 0);
  const contactCount = (project.contacts||[]).length;
  const checklist = project.checklist||[];
  const checkDone = checklist.filter((i) => i.done).length;
  const locSummary = project.locations.map((l) => l.workItems.length > 0 ? `${l.name} (${l.workItems.length})` : l.name).join(" · ");

  return (
    <div style={{ background:"#161616", border:project.finished?"1px solid #2a3a2a":"1px solid #2a2a2a", borderRadius:10, marginBottom:collapsed?6:12, overflow:"hidden" }}>
      <div style={{ padding:"10px 12px", display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:2, flexShrink:0 }}>
          <button onClick={(e) => { e.stopPropagation(); onMoveUp(); }} disabled={isFirst} style={{ background:"none", border:"none", color:isFirst?"#2a2a2a":"#555", cursor:isFirst?"default":"pointer", fontSize:13, padding:"1px 4px", lineHeight:1 }}>▲</button>
          <button onClick={(e) => { e.stopPropagation(); onMoveDown(); }} disabled={isLast} style={{ background:"none", border:"none", color:isLast?"#2a2a2a":"#555", cursor:isLast?"default":"pointer", fontSize:13, padding:"1px 4px", lineHeight:1 }}>▼</button>
        </div>
        <div onClick={() => { if (!collapsed) setExpanded(!expanded); }} style={{ flex:1, cursor:"pointer", minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontWeight:700, color:project.finished?"#4a7a4a":"#e0e0e0", fontSize:15, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{project.name}</span>
            <button onClick={(e) => { e.stopPropagation(); setExpanded(true); setEditingProject(!editingProject); }} style={{ background:"none", border:"none", color:"#444", cursor:"pointer", fontSize:12, padding:"0 2px", flexShrink:0 }}>✏️</button>
          </div>
          {collapsed ? (
            <div style={{ color:"#444", fontSize:11, marginTop:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
              {project.assignedTo && <span>{project.assignedTo} · </span>}<span>{totalItems} stk</span>{locSummary && <span> · {locSummary}</span>}
            </div>
          ) : (
            <div style={{ color:"#555", fontSize:12, marginTop:2 }}>
              {project.region}{project.subRegion?" > "+project.subRegion:""}
              {project.assignedTo?" · "+project.assignedTo:""}
              {" · "}{totalItems} skráning{totalItems!==1?"ar":""}
              {contactCount>0?" · "+contactCount+" tengiliðir":""}
              {checklist.length>0?` · ${checkDone}/${checklist.length}`:""}
            </div>
          )}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
          {project.onHold && !project.finished && <span style={{ background:"#2a2a10", color:"#c0a040", borderRadius:4, padding:"2px 6px", fontSize:11 }}>Í bið</span>}
          {project.finished && <span style={{ background:"#1a3a1a", color:"#4a9a4a", borderRadius:4, padding:"2px 6px", fontSize:11 }}>Lokið</span>}
          <button onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed); setExpanded(false); }} style={{ background:"none", border:"1px solid #2a2a2a", borderRadius:6, color:"#555", cursor:"pointer", fontSize:11, padding:"3px 8px" }}>{collapsed ? "▼ Opna" : "▲ Loka"}</button>
        </div>
      </div>

      {!collapsed && expanded && (
        <div style={{ padding:"0 16px 16px" }}>
          {editingProject && <EditProjectForm project={project} onSave={(updated) => { onUpdate(updated); setEditingProject(false); }} onCancel={() => setEditingProject(false)} />}
          {!project.finished && (
            <button onClick={onStartWork} style={{ background:"#1a2a3a", color:"#6aacf0", border:"1px solid #2a4a6a", borderRadius:8, padding:"12px 16px", fontSize:14, cursor:"pointer", fontWeight:700, width:"100%", marginBottom:14 }}>▶ Byrja vinnu</button>
          )}
          <NotesSection notes={project.notes} onUpdate={(notes) => onUpdate({ ...project, notes })} />
          <div style={{ borderTop:"1px solid #1a1a1a", marginTop:4, marginBottom:14 }} />
          <ChecklistSection checklist={project.checklist||[]} onUpdate={(checklist) => onUpdate({ ...project, checklist })} />
          <div style={{ borderTop:"1px solid #1a1a1a", marginBottom:14 }} />
          <div style={{ background:"#0c160c", border:"1px solid #1e3a1e", borderRadius:8, padding:"12px 14px", marginBottom:14 }}>
            <ContactSection contacts={project.contacts||[]} onUpdate={(contacts) => onUpdate({ ...project, contacts })} />
          </div>
          <DrawingsSection drawings={project.drawings||[]} onUpdate={(drawings) => onUpdate({ ...project, drawings })} />
          <div style={{ borderTop:"1px solid #1a1a1a", marginBottom:12 }} />
          <CommentsSection project={project} />
          <div style={{ borderTop:"1px solid #1a1a1a", marginBottom:12 }} />
          {project.locations.map((loc) => (
            <LocationLog key={loc.id} location={loc} project={project} onUpdate={updateLocation}
              onDelete={(id) => onUpdate({ ...project, locations:project.locations.filter((l) => l.id!==id) })} />
          ))}
          {showAddLocation ? (
            <div style={{ display:"flex", gap:8, marginTop:8 }}>
              <input type="text" value={newLocationName} onChange={(e) => setNewLocationName(e.target.value)} placeholder="Nafn verkefnis" style={{ ...inputStyle, flex:1 }} onKeyDown={(e) => e.key==="Enter" && addLocation()} />
              <button onClick={addLocation} style={btnPrimary}>Bæta við</button>
              <button onClick={() => setShowAddLocation(false)} style={btnSecondary}>×</button>
            </div>
          ) : (
            <button onClick={() => setShowAddLocation(true)} style={{ ...btnSecondary, fontSize:12, marginTop:4 }}>+ Bæta við verkefni</button>
          )}
          <div style={{ display:"flex", gap:8, marginTop:14, paddingTop:14, borderTop:"1px solid #222" }}>
            <button onClick={() => onUpdate({ ...project, finished:!project.finished })} style={project.finished?btnSecondary:btnSuccess}>{project.finished?"Enduropna":"Merkja lokið"}</button>
            <button onClick={() => onUpdate({ ...project, onHold:!project.onHold })} style={{ ...btnSecondary, color:project.onHold?"#c0a040":"#888", borderColor:project.onHold?"#5a4a10":"#333" }}>{project.onHold?"Taka úr bið":"Setja í bið"}</button>
            <button onClick={() => { if (window.confirm("Ertu viss um að þú viljir eyða þessu verkefni?")) onDelete(project.id); }} style={{ ...btnSecondary, color:"#7a3a3a" }}>Eyða</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── New Project Form ──────────────────────────────────────────────────────────
function NewProjectForm({ onAdd, onCancel }) {
  const savedRegions = JSON.parse(localStorage.getItem("rml_regions")||"null") || DEFAULT_REGIONS;
  const savedSubRegions = JSON.parse(localStorage.getItem("rml_subregions")||"null") || DEFAULT_SUB_REGIONS;
  const savedCars = JSON.parse(localStorage.getItem("rml_cars")||"null") || DEFAULT_CARS;
  const [name, setName] = useState("");
  const [region, setRegion] = useState(savedRegions[0]);
  const [subRegion, setSubRegion] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [client, setClient] = useState("");
  const [notes, setNotes] = useState("");
  const [projectType, setProjectType] = useState("seasonal");
  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({ id:Date.now(), name:name.trim(), region, subRegion, assignedTo, client:client.trim(), notes, finished:false, onHold:false, drawings:[], locations:[], contacts:[], checklist:[], projectType });
  };
  return (
    <div style={{ background:"#161616", border:"1px solid #333", borderRadius:10, padding:16, marginBottom:16 }}>
      <div style={{ fontWeight:700, color:"#e0e0e0", marginBottom:14 }}>Nýtt verkefni</div>
      <div style={{ marginBottom:10 }}><label style={labelStyle}>Nafn verkefnis</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="t.d. Akureyri Bílastæðasjóður" style={inputStyle} /></div>
      <div style={{ marginBottom:10 }}><label style={labelStyle}>Svæði</label>
        <select value={region} onChange={(e) => { setRegion(e.target.value); setSubRegion(""); }} style={selectStyle}>{savedRegions.map((r) => <option key={r}>{r}</option>)}</select>
      </div>
      {savedSubRegions[region]?.length > 0 && (
        <div style={{ marginBottom:10 }}><label style={labelStyle}>Bær</label>
          <select value={subRegion} onChange={(e) => setSubRegion(e.target.value)} style={selectStyle}><option value="">Ekkert</option>{savedSubRegions[region].map((s) => <option key={s}>{s}</option>)}</select>
        </div>
      )}
      <div style={{ marginBottom:10 }}><label style={labelStyle}>Úthlutað á</label>
        <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} style={selectStyle}><option value="">Óúthlutað</option>{savedCars.map((c) => <option key={c}>{c}</option>)}</select>
      </div>
      <div style={{ marginBottom:10 }}><label style={labelStyle}>Viðskiptavinur (valkvæmt)</label>
        <input type="text" value={client} onChange={(e) => setClient(e.target.value)} placeholder="t.d. Krónan" style={inputStyle} list="rml-clients" />
      </div>
      <div style={{ marginBottom:10 }}><label style={labelStyle}>Tegund verkefnis</label>
        <div style={{ display:"flex", gap:8 }}>
          {[{val:"seasonal",label:"🔄 Árleg verk"},{val:"oneoff",label:"1️⃣ Einstök verk"}].map((t) => (
            <button key={t.val} onClick={() => setProjectType(t.val)} style={{ flex:1, background:projectType===t.val?"#e8f0e8":"#111", color:projectType===t.val?"#111":"#666", border:`1px solid ${projectType===t.val?"#e8f0e8":"#333"}`, borderRadius:8, padding:"8px", fontSize:13, fontWeight:projectType===t.val?700:400, cursor:"pointer" }}>{t.label}</button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom:14 }}><label style={labelStyle}>Verklýsing</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Sérstakar leiðbeiningar…" style={{ ...inputStyle, height:70, resize:"vertical" }} /></div>
      <div style={{ display:"flex", gap:8 }}><button onClick={handleAdd} style={btnPrimary}>Búa til verkefni</button><button onClick={onCancel} style={btnSecondary}>Hætta við</button></div>
    </div>
  );
}

// ── New Season Modal ──────────────────────────────────────────────────────────
function NewSeasonModal({ onConfirm, onCancel }) {
  const [entered, setEntered] = useState("");
  const [error, setError] = useState(false);
  const SEASON_PIN = "180583";
  const press = (val) => {
    if (entered.length >= SEASON_PIN.length) return;
    const next = entered + val;
    setEntered(next);
    if (next.length === SEASON_PIN.length) {
      if (next === SEASON_PIN) onConfirm();
      else { setError(true); setTimeout(() => { setError(false); setEntered(""); }, 800); }
    }
  };
  const del = () => { setEntered(entered.slice(0, -1)); setError(false); };
  const keys = [["1","2","3"],["4","5","6"],["7","8","9"],["","0","\u232b"]];
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Inter', system-ui, sans-serif", padding:16 }}>
      <div style={{ background:"#161616", border:"1px solid #333", borderRadius:12, padding:24, width:300, textAlign:"center" }}>
        <div style={{ fontWeight:700, color:"#e0e0e0", fontSize:16, marginBottom:10 }}>🔄 Nýtt tímabil</div>
        <div style={{ color:"#666", fontSize:13, marginBottom:10, lineHeight:1.5, textAlign:"left" }}>Með því að velja nýtt tímabil hverfa allar skráðar tölur um vinnumagn frá síðasta tímabili. Allar aðrar upplýsingar, svo sem teikningar, tengiliðir og tékklistar haldast óbreyttar.</div>
        <div style={{ color:"#888", fontSize:12, marginBottom:16 }}>Sláðu inn PIN til að staðfesta</div>
        <div style={{ display:"flex", gap:12, justifyContent:"center", marginBottom:20 }}>
          {Array.from({length: SEASON_PIN.length}, (_, i) => (
            <div key={i} style={{ width:12, height:12, borderRadius:"50%", background: error ? "#c05050" : i < entered.length ? "#e8f0e8" : "transparent", border:`2px solid ${error ? "#c05050" : i < entered.length ? "#e8f0e8" : "#444"}`, transition:"all 0.15s" }} />
          ))}
        </div>
        {error && <div style={{ color:"#c05050", fontSize:12, marginBottom:10 }}>Rangt PIN</div>}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:8, marginBottom:14 }}>
          {keys.flat().map((k, i) => (
            <button key={i} onClick={() => k==="\u232b" ? del() : k ? press(k) : null} style={{ height:52, borderRadius:10, background:k?"#1a1a1a":"transparent", border:k?"1px solid #2a2a2a":"none", color:k==="\u232b"?"#666":"#e0e0e0", fontSize:k==="\u232b"?18:22, fontWeight:600, cursor:k?"pointer":"default" }}>{k}</button>
          ))}
        </div>
        <button onClick={onCancel} style={{ background:"none", border:"1px solid #333", borderRadius:8, color:"#666", fontSize:13, padding:"8px 24px", cursor:"pointer", width:"100%" }}>Hætta við</button>
      </div>
    </div>
  );
}

// ── App Root ──────────────────────────────────────────────────────────────────
export default function App() {
  const [authed, setAuthed] = useState(() => localStorage.getItem("rml_auth") === "1");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState("active");
  const [search, setSearch] = useState("");
  const [carFilter, setCarFilter] = useState("all");
  const [workMode, setWorkMode] = useState(() => localStorage.getItem("rml_workmode") || null);
  const [showHours, setShowHours] = useState(false);
  const [showTrips, setShowTrips] = useState(false);
  const [showPrivate, setShowPrivate] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [seasonFilter, setSeasonFilter] = useState("all");
  const [groupBy, setGroupBy] = useState(() => localStorage.getItem("rml_groupby") || "subRegion");
  const [openGroups, setOpenGroups] = useState(() => { try { return JSON.parse(localStorage.getItem("rml_opengroups")) || {}; } catch { return {}; } });
  const [showNewSeason, setShowNewSeason] = useState(false);

  useEffect(() => {
    if (!authed) return;
    loadProjectsFromSheet()
      .then((data) => { if (Array.isArray(data) && data.length > 0) setProjects(data); else setProjects(initialProjects); })
      .catch(() => setProjects(initialProjects))
      .finally(() => setLoading(false));
  }, [authed]);

  useEffect(() => {
    if (!loading && authed && projects.length > 0) saveProjectsToSheet(projects).catch(console.error);
  }, [projects, loading, authed]);

  const addProject = (p) => { setProjects((prev) => [p,...prev]); setShowNew(false); };
  const updateProject = (p) => setProjects((prev) => prev.map((x) => x.id===p.id ? p : x));
  const deleteProject = (id) => setProjects((prev) => prev.filter((p) => p.id!==id));

  const backupProjects = () => {
    const blob = new Blob([JSON.stringify(projects, null, 2)], { type:"application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vegmerkingar-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const newSeason = () => {
    setProjects((prev) => prev.map((p) => p.projectType !== "seasonal" ? p : ({ ...p, finished:false, locations:p.locations.map((l) => ({ ...l, workItems:[] })) })));
    setShowNewSeason(false);
  };

  const moveProject = (id, dir) => {
    setProjects((prev) => {
      const idx = prev.findIndex((p) => p.id===id);
      if (idx < 0) return prev;
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  };

  const filtered = projects.filter((p) => {
    const matchesFilter = filter==="all"||(filter==="active"&&!p.finished&&!p.onHold)||(filter==="onhold"&&p.onHold&&!p.finished)||(filter==="finished"&&p.finished);
    const q = search.toLowerCase();
    const matchesSearch = !search||p.name.toLowerCase().includes(q)||(p.subRegion&&p.subRegion.toLowerCase().includes(q))||(p.client&&p.client.toLowerCase().includes(q));
    const matchesCar = carFilter==="all"||p.assignedTo===carFilter;
    const matchesSeason = seasonFilter==="all"||(seasonFilter==="seasonal"&&p.projectType==="seasonal")||(seasonFilter==="oneoff"&&p.projectType==="oneoff");
    return matchesFilter && matchesSearch && matchesCar && matchesSeason;
  });

  const setGroupByPersist = (g) => { setGroupBy(g); localStorage.setItem("rml_groupby", g); };
  const toggleGroup = (key) => {
    setOpenGroups((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem("rml_opengroups", JSON.stringify(next));
      return next;
    });
  };

  const GROUP_LABELS = { subRegion:"Bær", assignedTo:"Bíll", client:"Viðskiptavinur" };
  const NO_GROUP = { subRegion:"Án bæjar", assignedTo:"Óúthlutað", client:"Án viðskiptavinar" };

  const grouped = (() => {
    const map = new Map();
    filtered.forEach((p) => {
      const key = (p[groupBy] || "").trim() || NO_GROUP[groupBy];
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    });
    return [...map.entries()].sort((a, b) => {
      const aNone = a[0] === NO_GROUP[groupBy], bNone = b[0] === NO_GROUP[groupBy];
      if (aNone !== bNone) return aNone ? 1 : -1;
      return a[0].localeCompare(b[0], "is");
    });
  })();

  const allClients = [...new Set(projects.map((p) => (p.client||"").trim()).filter(Boolean))].sort();

  const workProject = workMode ? projects.find((p) => String(p.id)===String(workMode)) : null;

  if (!authed) return <PinScreen onUnlock={() => setAuthed(true)} />;
  if (showNewSeason) return <NewSeasonModal onConfirm={newSeason} onCancel={() => setShowNewSeason(false)} />;

  if (loading) {
    return (
      <div style={{ minHeight:"100vh", background:"#0a0a0a", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Inter', system-ui, sans-serif" }}>
        <div style={{ color:"#444", fontSize:14 }}>Hleður verkefni…</div>
      </div>
    );
  }

  if (workProject) {
    return <WorkMode project={workProject} onUpdate={updateProject} onExit={() => { localStorage.removeItem("rml_workmode"); setWorkMode(null); }} />;
  }

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0a", color:"#e0e0e0", fontFamily:"'Inter', system-ui, sans-serif", maxWidth:600, margin:"0 auto", padding:"0 0 40px" }}>
      <div style={{ padding:"20px 16px 16px", borderBottom:"1px solid #1a1a1a", position:"sticky", top:0, background:"#0a0a0a", zIndex:10 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div>
            <div style={{ fontWeight:800, fontSize:18, letterSpacing:-0.5 }}>Vegmerkingar</div>
            <div style={{ color:"#444", fontSize:12 }}>{projects.filter((p) => !p.finished).length} virk · {projects.filter((p) => p.finished).length} lokið</div>
          </div>
          <button onClick={() => setShowNew(!showNew)} style={{ background:"#e8f0e8", color:"#111", border:"none", borderRadius:20, padding:"8px 18px", fontWeight:700, fontSize:13, cursor:"pointer" }}>{showNew ? "Hætta við" : "+ Verkefni"}</button>
        </div>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Leita að verkefnum…" style={{ ...inputStyle, marginBottom:10 }} />
        <div style={{ display:"flex", gap:6, marginBottom:8 }}>
          {["active","onhold","finished","all"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{ background:filter===f?"#e8f0e8":"none", color:filter===f?"#111":"#666", border:filter===f?"none":"1px solid #222", borderRadius:16, padding:"5px 12px", fontSize:12, cursor:"pointer", fontWeight:filter===f?700:400 }}>
              {f==="active"?"Virk":f==="onhold"?"Í bið":f==="finished"?"Lokið":"Öll"}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", gap:6, marginBottom:8, flexWrap:"wrap" }}>
          <div onClick={() => setCarFilter("all")} style={{ cursor:"pointer", display:"inline-flex", alignItems:"center", background:carFilter==="all"?"#1a2a3a":"none", border:`1px solid ${carFilter==="all"?"#2a4a6a":"#222"}`, borderRadius:16, padding:"5px 12px" }}>
            <span style={{ fontSize:12, color:carFilter==="all"?"#6aacf0":"#666", fontWeight:carFilter==="all"?700:400 }}>Allir</span>
          </div>
          {(JSON.parse(localStorage.getItem("rml_cars")||"null")||DEFAULT_CARS).filter(c=>c!=="Óúthlutað").map((c) => (
            <div key={c} onClick={() => setCarFilter(c)}><VehicleBadge name={c} active={carFilter===c} /></div>
          ))}
        </div>
        <div style={{ display:"flex", gap:6, justifyContent:"flex-end", marginBottom:8 }}>
          <button onClick={() => { setShowTrips(!showTrips); setShowHours(false); setShowPrivate(false); setShowSettings(false); }} style={{ background:showTrips?"#1a2a1a":"none", color:showTrips?"#4a9a4a":"#555", border:`1px solid ${showTrips?"#2a4a2a":"#222"}`, borderRadius:16, padding:"5px 12px", fontSize:12, cursor:"pointer" }}>🗺 Ferðir</button>
          <button onClick={() => { setShowHours(!showHours); setShowTrips(false); setShowPrivate(false); setShowSettings(false); }} style={{ background:showHours?"#1a2a3a":"none", color:showHours?"#6aacf0":"#555", border:`1px solid ${showHours?"#2a4a6a":"#222"}`, borderRadius:16, padding:"5px 12px", fontSize:12, cursor:"pointer" }}>⏱ Vinnustundir</button>
          <button onClick={() => { setShowPrivate(!showPrivate); setShowHours(false); setShowTrips(false); setShowSettings(false); }} style={{ background:showPrivate?"#2a1a2a":"none", color:showPrivate?"#a06ac0":"#555", border:`1px solid ${showPrivate?"#4a2a5a":"#222"}`, borderRadius:16, padding:"5px 12px", fontSize:12, cursor:"pointer" }}>🎒</button>
          <button onClick={() => { setShowSettings(!showSettings); setShowPrivate(false); setShowHours(false); setShowTrips(false); }} style={{ background:showSettings?"#2a2a1a":"none", color:showSettings?"#c0a040":"#555", border:`1px solid ${showSettings?"#5a4a10":"#222"}`, borderRadius:16, padding:"5px 12px", fontSize:12, cursor:"pointer" }}>⚙️</button>
        </div>
      </div>

      <div style={{ padding:"16px 16px 0" }}>
        {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
        {showPrivate && <PrivateChecklist onClose={() => setShowPrivate(false)} />}
        {showHours && <HoursTracker onClose={() => setShowHours(false)} />}
        {showTrips && <TripsView projects={projects} onClose={() => setShowTrips(false)} />}
        {showNew && <NewProjectForm onAdd={addProject} onCancel={() => setShowNew(false)} />}
        <datalist id="rml-clients">{allClients.map((cl) => <option key={cl} value={cl} />)}</datalist>

        {filtered.length===0 && (
          <div style={{ textAlign:"center", color:"#444", padding:"40px 20px", fontSize:14 }}>
            {search ? "Engin verkefni passa við leitina" : "Engin verkefni hér ennþá"}
          </div>
        )}

        {filtered.length > 0 && grouped.map(([groupKey, items]) => {
          const isOpen = !!openGroups[groupKey] || !!search;
          const activeCount = items.filter((p) => !p.finished && !p.onHold).length;
          return (
            <div key={groupKey} style={{ marginBottom:10 }}>
              <div onClick={() => toggleGroup(groupKey)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"#131313", border:"1px solid #222", borderRadius:8, padding:"11px 13px", cursor:"pointer" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:0 }}>
                  <span style={{ color:"#555", fontSize:12 }}>{isOpen ? "▾" : "▸"}</span>
                  <span style={{ fontWeight:700, fontSize:14, color:"#e0e0e0", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{groupKey}</span>
                </div>
                <span style={{ color:"#555", fontSize:11, flexShrink:0 }}>
                  {items.length} verkefni{activeCount>0 && activeCount!==items.length ? ` · ${activeCount} virk` : ""}
                </span>
              </div>
              {isOpen && (
                <div style={{ marginTop:8 }}>
                  {items.map((p, i) => (
                    <ProjectCard key={p.id} project={p} onUpdate={updateProject} onDelete={deleteProject}
                      onStartWork={() => { const id = String(p.id); localStorage.setItem("rml_workmode", id); setWorkMode(id); }}
                      onMoveUp={() => moveProject(p.id, -1)}
                      onMoveDown={() => moveProject(p.id, 1)}
                      isFirst={i===0} isLast={i===items.length-1}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div style={{ display:"flex", gap:6, alignItems:"center", marginTop:20, paddingTop:16, borderTop:"1px solid #1a1a1a", flexWrap:"wrap" }}>
          <span style={{ color:"#444", fontSize:11, marginRight:2 }}>Flokka eftir:</span>
          {["subRegion","assignedTo","client"].map((g) => (
            <button key={g} onClick={() => setGroupByPersist(g)} style={{ background:groupBy===g?"#1a2a3a":"none", color:groupBy===g?"#6aacf0":"#666", border:`1px solid ${groupBy===g?"#2a4a6a":"#222"}`, borderRadius:16, padding:"5px 10px", fontSize:11, cursor:"pointer", fontWeight:groupBy===g?700:400 }}>{GROUP_LABELS[g]}</button>
          ))}
        </div>
        <div style={{ display:"flex", gap:6, marginTop:10, flexWrap:"wrap" }}>
          {[{val:"all",label:"Öll"},{val:"seasonal",label:"🔄 Árleg"},{val:"oneoff",label:"1️⃣ Einstök"}].map((f) => (
            <button key={f.val} onClick={() => setSeasonFilter(f.val)} style={{ background:seasonFilter===f.val?"#e8f0e8":"none", color:seasonFilter===f.val?"#111":"#666", border:seasonFilter===f.val?"none":"1px solid #222", borderRadius:16, padding:"5px 10px", fontSize:11, cursor:"pointer", fontWeight:seasonFilter===f.val?700:400 }}>{f.label}</button>
          ))}
          <button onClick={backupProjects} style={{ marginLeft:"auto", background:"none", border:"1px solid #222", borderRadius:16, padding:"5px 10px", fontSize:11, color:"#555", cursor:"pointer" }}>💾 Backup</button>
          <button onClick={() => setShowNewSeason(true)} style={{ background:"#1a2a1a", border:"1px solid #2a4a2a", borderRadius:16, padding:"5px 10px", fontSize:11, color:"#4a9a4a", cursor:"pointer" }}>🔄 Nýtt tímabil</button>
        </div>
      </div>
    </div>
  );
}
