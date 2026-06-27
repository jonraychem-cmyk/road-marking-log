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
      if (next === CORRECT_PIN) {
        localStorage.setItem("rml_auth", "1");
        onUnlock();
      } else {
        setShake(true);
        setTimeout(() => { setShake(false); setEntered(""); }, 600);
      }
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
        <div style={{ fontWeight:800, fontSize:22, letterSpacing:-0.5, color:"#e0e0e0", marginBottom:6 }}>Road Marking Log</div>
        <div style={{ color:"#444", fontSize:13 }}>Enter PIN to continue</div>
      </div>
      <div style={{ display:"flex", gap:16, marginBottom:40, animation: shake ? "shake 0.5s" : "none" }}>
        {dots}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 72px)", gap:12 }}>
        {keys.flat().map((k, i) => (
          <button key={i} onClick={() => k === "\u232b" ? del() : k ? press(k) : null} style={{ width:72, height:72, borderRadius:16, background: k ? "#1a1a1a" : "transparent", border: k ? "1px solid #2a2a2a" : "none", color: k === "\u232b" ? "#666" : "#e0e0e0", fontSize: k === "\u232b" ? 20 : 26, fontWeight:600, cursor: k ? "pointer" : "default", display:"flex", alignItems:"center", justifyContent:"center" }}>
            {k}
          </button>
        ))}
      </div>
      <style>{"@keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-8px)} 80%{transform:translateX(8px)} }"}</style>
    </div>
  );
}

// ── Google Sheets via Apps Script ────────────────────────────────────────────
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx9XY9aVWNCBdH0fIzz5dFJQKiF1kNHx5Qspn_UrFvrF6-7J9-Obh5lCETvnh3Lw0_XZg/exec";

async function appendToSheet(row, type="log") {
  await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, row }),
  });
}

async function saveProjectsToSheet(projects) {
  await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "saveProjects", projects }),
  });
}

async function loadProjectsFromSheet() {
  const res = await fetch(APPS_SCRIPT_URL + "?action=getProjects");
  if (!res.ok) throw new Error("Failed to load");
  return res.json();
}

async function appendHoursToSheet(row) {
  await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "hours", row }),
  });
}

async function postComment(row) {
  await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "comment", row }),
  });
}

async function loadComments(projectId) {
  const res = await fetch(APPS_SCRIPT_URL + "?action=getComments");
  if (!res.ok) return [];
  const all = await res.json();
  return all.filter((r) => String(r[1]) === String(projectId)).map((r) => ({
    timestamp: r[0], name: r[2], message: r[3],
  }));
}

// ── Constants ─────────────────────────────────────────────────────────────────
const REGIONS = ["South", "Rest of Iceland"];
const SUB_REGIONS = {
  "Rest of Iceland": ["Akureyri", "North", "West"],
  South: [],
};
const STENCIL_OPTIONS = ["Fatladur","Rafhledsla","Or","BUS","Ruta","Gongukall","Hjolhysi","Hjol","Other"];
const ZEBRA_SIZES = ["50x300","50x250","50x240","50x200","50x120","Custom"];
const WORK_TYPES = ["Linur","Midlinur","Stencil","Blue Square (Fatladur)","Green Square (Rafhledsla)","Gangbraut","Þríhyrningar"];
const CARS = ["Car 1","Car 2","Unassigned"];
const CHECKLIST_PRESETS = {
  "Stencils": ["Fatladur","Rafhledsla","Or","BUS","Ruta","Gongukall","Hjolhysi","Hjol"],
  "Þríhyrningar": ["Þríhyrningar (shark's teeth)"],
  "Paint": ["White paint","Yellow paint","Blue paint (Fatladur)","Green paint (Rafhledsla)","Red paint"],
  "Equipment": ["Line machine","Stencil sprayer","Compressor","Tape","Primer","Cleaning solvent"],
};

// ── Styles ────────────────────────────────────────────────────────────────────
const inputStyle = {
  width:"100%", background:"#0d0d0d", border:"1px solid #333",
  borderRadius:6, color:"#e0e0e0", padding:"8px 10px",
  fontSize:14, boxSizing:"border-box", outline:"none",
};
const selectStyle = { ...inputStyle, cursor:"pointer" };
const labelStyle = { color:"#888", fontSize:12, display:"block", marginBottom:4 };
const sectionLabel = { color:"#666", fontSize:12, marginBottom:6, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5 };
const btnPrimary = { background:"#e8f0e8", color:"#111", border:"none", borderRadius:6, padding:"8px 16px", fontWeight:700, fontSize:13, cursor:"pointer" };
const btnSecondary = { background:"none", color:"#888", border:"1px solid #333", borderRadius:6, padding:"8px 16px", fontSize:13, cursor:"pointer" };
const btnSuccess = { background:"#1a3a1a", color:"#4a9a4a", border:"1px solid #2a5a2a", borderRadius:6, padding:"8px 16px", fontSize:13, cursor:"pointer" };

// ── Demo data ─────────────────────────────────────────────────────────────────
const initialProjects = [
  {
    id:1, name:"Keflavik Airport", region:"South", subRegion:"", assignedTo:"Car 1",
    finished:false, notes:"Annual refresh of all markings",
    drawings:[], contacts:[], checklist:[],
    locations:[
      { id:1, name:"Terminal Parking", workItems:[], address:"" },
      { id:2, name:"Staff Parking", workItems:[], address:"" },
    ],
  },
  {
    id:2, name:"Akureyri Town", region:"Rest of Iceland", subRegion:"Akureyri",
    assignedTo:"", finished:false, notes:"", drawings:[], contacts:[], checklist:[],
    locations:[
      { id:1, name:"Church", workItems:[], address:"" },
      { id:2, name:"Sports Area", workItems:[], address:"" },
      { id:3, name:"School", workItems:[], address:"" },
    ],
  },
];

// ── Sync status badge ─────────────────────────────────────────────────────────
function SyncBadge({ status }) {
  if (!status) return null;
  const isError = status.startsWith("error");
  const isOk = status === "ok";
  const bg = isOk ? "#0f1a0f" : isError ? "#2a0f0f" : "#1a2a3a";
  const color = isOk ? "#4a9a4a" : isError ? "#c05050" : "#6aacf0";
  const text = isOk ? "✓ Logged to sheet" : isError ? "⚠ " + status.replace("error:", "") : "Syncing…";
  return (
    <span style={{ background:bg, color, borderRadius:4, padding:"2px 8px", fontSize:11, marginLeft:8, wordBreak:"break-all" }}>
      {text}
    </span>
  );
}

// ── Notes Section ─────────────────────────────────────────────────────────────
function NotesSection({ notes, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(notes || "");
  const save = () => { onUpdate(draft); setEditing(false); };
  const cancel = () => { setDraft(notes || ""); setEditing(false); };
  return (
    <div style={{ marginBottom:14 }}>
      <div style={sectionLabel}>Notes</div>
      {editing ? (
        <div>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. Repaint everything but the section to the right — change to 5 spots not 6"
            style={{ ...inputStyle, height:80, resize:"vertical", marginBottom:8 }} autoFocus />
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={save} style={btnPrimary}>Save</button>
            <button onClick={cancel} style={btnSecondary}>Cancel</button>
          </div>
        </div>
      ) : (
        <div onClick={() => setEditing(true)} style={{
          background:"#111", border:"1px solid #2a2a2a", borderRadius:8,
          padding:"10px 12px", cursor:"text", minHeight:40,
          color:notes ? "#aaa" : "#3a3a3a", fontSize:13, fontStyle:notes ? "italic" : "normal", lineHeight:1.5,
        }}>
          {notes || "Tap to add notes…"}
        </div>
      )}
    </div>
  );
}

// ── Checklist Section ─────────────────────────────────────────────────────────
function ChecklistSection({ checklist=[], onUpdate }) {
  const [showPresets, setShowPresets] = useState(false);
  const [customText, setCustomText] = useState("");
  const [activeCategory, setActiveCategory] = useState("Stencils");

  const toggle = (id) => onUpdate(checklist.map((i) => i.id===id ? {...i,done:!i.done} : i));
  const remove = (id) => onUpdate(checklist.filter((i) => i.id!==id));
  const addPreset = (label) => {
    if (checklist.some((i) => i.label===label)) return;
    onUpdate([...checklist, { id:Date.now()+Math.random(), label, done:false }]);
  };
  const addCustom = () => {
    if (!customText.trim()) return;
    onUpdate([...checklist, { id:Date.now(), label:customText.trim(), done:false }]);
    setCustomText("");
  };
  const clearDone = () => onUpdate(checklist.filter((i) => !i.done));
  const doneCount = checklist.filter((i) => i.done).length;

  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
        <div style={sectionLabel}>Checklist {checklist.length>0 && `· ${doneCount}/${checklist.length}`}</div>
        {doneCount>0 && <button onClick={clearDone} style={{ background:"none", border:"none", color:"#555", fontSize:11, cursor:"pointer", padding:0 }}>Clear done</button>}
      </div>
      {checklist.length===0 && !showPresets && <div style={{ color:"#444", fontSize:13, marginBottom:8 }}>No items yet</div>}
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
        <input type="text" value={customText} onChange={(e) => setCustomText(e.target.value)} onKeyDown={(e) => e.key==="Enter" && addCustom()} placeholder="Add item…" style={{ ...inputStyle, flex:1, fontSize:13, padding:"6px 10px" }} />
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
              return (
                <button key={label} onClick={() => addPreset(label)} style={{ background:already?"#1a2a1a":"#1a1a1a", color:already?"#4a7a4a":"#bbb", border:`1px solid ${already?"#2a4a2a":"#333"}`, borderRadius:6, padding:"5px 10px", fontSize:12, cursor:already?"default":"pointer" }}>
                  {already?"✓ ":""}{label}
                </button>
              );
            })}
          </div>
          <button onClick={() => setShowPresets(false)} style={{ ...btnSecondary, fontSize:11, padding:"4px 10px", marginTop:10 }}>Done</button>
        </div>
      ) : (
        <button onClick={() => setShowPresets(true)} style={{ ...btnSecondary, fontSize:12, padding:"5px 12px" }}>+ From presets</button>
      )}
    </div>
  );
}

// ── Contact Section ───────────────────────────────────────────────────────────
function ContactSection({ contacts=[], onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [role, setRole] = useState("");
  const add = () => {
    if (!name.trim() && !phone.trim()) return;
    onUpdate([...contacts, { id:Date.now(), name:name.trim(), phone:phone.trim(), role:role.trim() }]);
    setName(""); setPhone(""); setRole(""); setShowForm(false);
  };
  const remove = (id) => onUpdate(contacts.filter((c) => c.id!==id));
  const telHref = (num) => "tel:" + num.replace(/[\s\-().]/g,"");
  return (
    <div style={{ marginBottom:14 }}>
      <div style={sectionLabel}>Contacts</div>
      {contacts.length===0 && !showForm && <div style={{ color:"#444", fontSize:13, marginBottom:8 }}>No contacts added</div>}
      {contacts.map((c) => (
        <div key={c.id} style={{ background:"#0f1a0f", border:"1px solid #1e3a1e", borderRadius:8, padding:"10px 12px", marginBottom:8, display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"baseline", gap:6, flexWrap:"wrap" }}>
              {c.name && <span style={{ color:"#d0e8d0", fontSize:14, fontWeight:600 }}>{c.name}</span>}
              {c.role && <span style={{ color:"#4a7a4a", fontSize:12 }}>{c.role}</span>}
            </div>
            {c.phone && (
              <a href={telHref(c.phone)} style={{ display:"inline-flex", alignItems:"center", gap:5, color:"#4a9a4a", fontSize:15, fontWeight:700, textDecoration:"none", marginTop:3, letterSpacing:0.3 }}>
                <span style={{ fontSize:13, opacity:0.7 }}>📞</span>{c.phone}
              </a>
            )}
          </div>
          <button onClick={() => remove(c.id)} style={{ background:"none", border:"none", color:"#444", cursor:"pointer", fontSize:16, padding:"0 4px", flexShrink:0 }}>×</button>
        </div>
      ))}
      {showForm ? (
        <div style={{ background:"#1a1a1a", border:"1px solid #333", borderRadius:8, padding:12, marginTop:6 }}>
          <div style={{ marginBottom:8 }}><label style={labelStyle}>Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Gunnar" style={inputStyle} /></div>
          <div style={{ marginBottom:8 }}><label style={labelStyle}>Phone number</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +354 555 1234" style={inputStyle} /></div>
          <div style={{ marginBottom:10 }}><label style={labelStyle}>Role / note (optional)</label><input type="text" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Site manager" style={inputStyle} /></div>
          <div style={{ display:"flex", gap:8 }}><button onClick={add} style={btnPrimary}>Add</button><button onClick={() => setShowForm(false)} style={btnSecondary}>Cancel</button></div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} style={{ ...btnSecondary, fontSize:12, padding:"5px 12px" }}>+ Add contact</button>
      )}
    </div>
  );
}

// ── Þríhyrningar Mode ────────────────────────────────────────────────────────
function TriangleMode({ onDone, onCancel }) {
  const [count, setCount] = useState(0);
  const [stops, setStops] = useState([]); // [{stop, count}]

  const adjust = (n) => setCount(Math.max(0, Math.min(10, count + n)));
  const total = stops.reduce((s, x) => s + x.count, 0);

  const logStop = () => {
    if (count === 0) return;
    setStops([...stops, { stop: stops.length + 1, count }]);
    setCount(0);
  };

  const finish = () => {
    if (stops.length === 0 && count === 0) { onCancel(); return; }
    // If there's an unlogged count, log it first
    const finalStops = count > 0 ? [...stops, { stop: stops.length + 1, count }] : stops;
    const finalTotal = finalStops.reduce((s, x) => s + x.count, 0);
    const stopSummary = finalStops.map((s) => `Stop ${s.stop}: ${s.count}`).join(", ");
    const item = {
      id: Date.now(),
      type: "Þríhyrningar",
      quantity: finalTotal,
      stops: finalStops,
      label: `Þríhyrningar: ${finalTotal} total (${stopSummary})`,
    };
    onDone(item);
  };

  return (
    <div style={{ background:"#1a1a1a", border:"1px solid #333", borderRadius:8, padding:16, marginTop:8 }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:14 }}>
        <div style={{ fontWeight:700, color:"#e0e0e0", fontSize:14 }}>Þríhyrningar</div>
        <div style={{ color:"#555", fontSize:12 }}>
          {stops.length > 0 && `${stops.length} stop${stops.length!==1?"s":""} · ${total} total`}
        </div>
      </div>

      {/* Stop log */}
      {stops.length > 0 && (
        <div style={{ marginBottom:12, display:"flex", flexWrap:"wrap", gap:6 }}>
          {stops.map((s) => (
            <span key={s.stop} style={{ background:"#111", border:"1px solid #2a2a2a", borderRadius:6, color:"#888", fontSize:12, padding:"3px 8px" }}>
              Stop {s.stop}: {s.count}
            </span>
          ))}
        </div>
      )}

      {/* Counter */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:20, marginBottom:16 }}>
        <button
          onClick={() => adjust(-1)}
          style={{ width:56, height:56, borderRadius:"50%", background:count>0?"#2a2a2a":"#111", border:"2px solid #333", color:"#e0e0e0", fontSize:28, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:300 }}
        >−</button>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:52, fontWeight:800, color:"#e0e0e0", lineHeight:1 }}>{count}</div>
          <div style={{ color:"#555", fontSize:11, marginTop:4 }}>this stop</div>
        </div>
        <button
          onClick={() => adjust(1)}
          style={{ width:56, height:56, borderRadius:"50%", background:count<10?"#2a3a2a":"#111", border:"2px solid #333", color:count<10?"#4a9a4a":"#444", fontSize:28, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:300 }}
        >+</button>
      </div>

      {/* Quick tap buttons 1-10 */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:6, justifyContent:"center", marginBottom:14 }}>
        {[1,2,3,4,5,6,7,8,9,10].map((n) => (
          <button key={n} onClick={() => setCount(n)} style={{ width:38, height:38, borderRadius:8, background:count===n?"#e8f0e8":"#111", color:count===n?"#111":"#666", border:`1px solid ${count===n?"#e8f0e8":"#2a2a2a"}`, fontSize:14, fontWeight:count===n?700:400, cursor:"pointer" }}>
            {n}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display:"flex", gap:8 }}>
        <button
          onClick={logStop}
          disabled={count===0}
          style={{ flex:1, background:count>0?"#1a2a3a":"#111", color:count>0?"#6aacf0":"#444", border:`1px solid ${count>0?"#2a4a6a":"#222"}`, borderRadius:6, padding:"10px", fontSize:13, fontWeight:700, cursor:count>0?"pointer":"default" }}
        >
          Log stop →
        </button>
        <button
          onClick={finish}
          disabled={stops.length===0 && count===0}
          style={{ flex:1, background:stops.length>0||count>0?"#e8f0e8":"#111", color:stops.length>0||count>0?"#111":"#444", border:"none", borderRadius:6, padding:"10px", fontSize:13, fontWeight:700, cursor:stops.length>0||count>0?"pointer":"default" }}
        >
          Done · {total + count} total
        </button>
      </div>
      <button onClick={onCancel} style={{ ...{background:"none", color:"#555", border:"none", fontSize:12, cursor:"pointer", marginTop:10, width:"100%", textAlign:"center"} }}>Cancel</button>
    </div>
  );
}

// ── Work Item Form ────────────────────────────────────────────────────────────
function WorkItemForm({ onAdd, onCancel }) {
  const [type, setType] = useState("Linur");
  const [meters, setMeters] = useState("");
  const [stencilType, setStencilType] = useState("Fatladur");
  const [stencilOther, setStencilOther] = useState("");
  const [quantity, setQuantity] = useState("");
  const [zebraSize, setZebraSize] = useState("50x300");
  const [zebraCustom, setZebraCustom] = useState("");
  const [zebraQty, setZebraQty] = useState("");

  const handleAdd = () => {
    let item = { type, id:Date.now() };
    if (type==="Linur"||type==="Midlinur") {
      if (!meters) return;
      item.meters=meters; item.label=type+": "+meters+"m";
    } else if (type==="Stencil") {
      if (!quantity) return;
      const st = stencilType==="Other" ? stencilOther : stencilType;
      item.stencilType=st; item.quantity=quantity; item.label="Stencil - "+st+" x "+quantity;
    } else if (type==="Blue Square (Fatladur)"||type==="Green Square (Rafhledsla)") {
      if (!quantity) return;
      item.quantity=quantity; item.label=type+" x "+quantity;
    } else if (type==="Gangbraut") {
      if (!zebraQty) return;
      const sz = zebraSize==="Custom" ? zebraCustom : zebraSize;
      item.size=sz; item.quantity=zebraQty; item.label="Gangbraut "+sz+"cm x "+zebraQty;
    } else if (type==="Þríhyrningar") {
      // Handled by TriangleMode — shouldn't reach here
      return;
    }
    onAdd(item);
  };

  if (type === "Þríhyrningar") {
    return <TriangleMode onDone={onAdd} onCancel={onCancel} />;
  }

  return (
    <div style={{ background:"#1a1a1a", border:"1px solid #333", borderRadius:8, padding:16, marginTop:8 }}>
      <div style={{ marginBottom:10 }}><label style={labelStyle}>Work Type</label><select value={type} onChange={(e) => setType(e.target.value)} style={selectStyle}>{WORK_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
      {(type==="Linur"||type==="Midlinur") && <div style={{ marginBottom:10 }}><label style={labelStyle}>Meters</label><input type="number" value={meters} onChange={(e) => setMeters(e.target.value)} placeholder="e.g. 150" style={inputStyle} /></div>}
      {type==="Stencil" && (
        <div>
          <div style={{ marginBottom:10 }}><label style={labelStyle}>Stencil Type</label><select value={stencilType} onChange={(e) => setStencilType(e.target.value)} style={selectStyle}>{STENCIL_OPTIONS.map((s) => <option key={s}>{s}</option>)}</select></div>
          {stencilType==="Other" && <div style={{ marginBottom:10 }}><input type="text" value={stencilOther} onChange={(e) => setStencilOther(e.target.value)} placeholder="Describe stencil" style={inputStyle} /></div>}
          <div style={{ marginBottom:10 }}><label style={labelStyle}>Quantity</label><input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="e.g. 4" style={inputStyle} /></div>
        </div>
      )}
      {(type==="Blue Square (Fatladur)"||type==="Green Square (Rafhledsla)") && <div style={{ marginBottom:10 }}><label style={labelStyle}>Quantity</label><input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="e.g. 2" style={inputStyle} /></div>}
      {type==="Gangbraut" && (
        <div>
          <div style={{ marginBottom:10 }}><label style={labelStyle}>Size (cm)</label><select value={zebraSize} onChange={(e) => setZebraSize(e.target.value)} style={selectStyle}>{ZEBRA_SIZES.map((s) => <option key={s}>{s}</option>)}</select></div>
          {zebraSize==="Custom" && <div style={{ marginBottom:10 }}><input type="text" value={zebraCustom} onChange={(e) => setZebraCustom(e.target.value)} placeholder="e.g. 50x180" style={inputStyle} /></div>}
          <div style={{ marginBottom:10 }}><label style={labelStyle}>Quantity</label><input type="number" value={zebraQty} onChange={(e) => setZebraQty(e.target.value)} placeholder="e.g. 3" style={inputStyle} /></div>
        </div>
      )}
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={handleAdd} style={btnPrimary}>Add</button>
        <button onClick={onCancel} style={btnSecondary}>Cancel</button>
      </div>
    </div>
  );
}

// ── Drawings Section ──────────────────────────────────────────────────────────
function DrawingsSection({ drawings, onUpdate }) {
  const [newLabel, setNewLabel] = useState(""); const [newUrl, setNewUrl] = useState(""); const [showForm, setShowForm] = useState(false);
  const addDrawing = () => {
    if (!newLabel.trim() && !newUrl.trim()) return;
    onUpdate([...drawings, { id:Date.now(), label:newLabel.trim()||newUrl.trim(), url:newUrl.trim() }]);
    setNewLabel(""); setNewUrl(""); setShowForm(false);
  };
  const removeDrawing = (id) => onUpdate(drawings.filter((d) => d.id!==id));
  return (
    <div style={{ marginBottom:14 }}>
      <div style={sectionLabel}>Drawings</div>
      {drawings.length===0 && !showForm && <div style={{ color:"#444", fontSize:13, marginBottom:8 }}>No drawings attached</div>}
      {drawings.map((d) => (
        <div key={d.id} style={{ display:"flex", alignItems:"center", gap:8, background:"#1a1a1a", borderRadius:6, padding:"7px 10px", marginBottom:6 }}>
          <span style={{ color:"#666", fontSize:13 }}>[+]</span>
          {d.url ? <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ color:"#7ab8f5", fontSize:13, flex:1, textDecoration:"none", wordBreak:"break-all" }}>{d.label}</a> : <span style={{ color:"#ccc", fontSize:13, flex:1 }}>{d.label}</span>}
          <button onClick={() => removeDrawing(d.id)} style={{ background:"none", border:"none", color:"#555", cursor:"pointer", fontSize:16, padding:"0 4px" }}>×</button>
        </div>
      ))}
      {showForm ? (
        <div style={{ background:"#1a1a1a", border:"1px solid #333", borderRadius:8, padding:12, marginTop:6 }}>
          <div style={{ marginBottom:8 }}><label style={labelStyle}>Label (optional)</label><input type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="e.g. Terminal layout" style={inputStyle} /></div>
          <div style={{ marginBottom:10 }}><label style={labelStyle}>Link (optional)</label><input type="url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://drive.google.com/..." style={inputStyle} /></div>
          <div style={{ display:"flex", gap:8 }}><button onClick={addDrawing} style={btnPrimary}>Add</button><button onClick={() => setShowForm(false)} style={btnSecondary}>Cancel</button></div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} style={{ ...btnSecondary, fontSize:12, padding:"5px 12px" }}>+ Add drawing</button>
      )}
    </div>
  );
}

// ── Location Log ──────────────────────────────────────────────────────────────
function openMaps(address) {
  const encoded = encodeURIComponent(address);
  // Opens Apple Maps on iOS, Google Maps on Android/desktop
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const url = isIos
    ? `maps://maps.apple.com/?q=${encoded}`
    : `https://www.google.com/maps/search/?api=1&query=${encoded}`;
  window.open(url, "_blank");
}

function LocationLog({ location, project, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressDraft, setAddressDraft] = useState(location.address || "");

  const addItem = useCallback(async (item) => {
    // Update local state immediately
    onUpdate({ ...location, workItems:[...location.workItems, item] });
    setShowForm(false);

    // Sync to Google Sheets
    setSyncStatus("syncing");
    const now = new Date();
    const timestamp = now.toLocaleString("en-GB", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" });
    const row = [
      timestamp,
      project.name,
      project.region + (project.subRegion ? " > " + project.subRegion : ""),
      project.assignedTo || "",
      location.name,
      item.type,
      item.label,
      item.meters || item.quantity || item.zebraQty || "",
      item.size || "",
    ];
    appendToSheet(row).catch(console.error);
    setSyncStatus("ok");
    setTimeout(() => setSyncStatus(null), 3000);
  }, [location, project, onUpdate]);

  const removeItem = (id) => onUpdate({ ...location, workItems:location.workItems.filter((i) => i.id!==id) });

  const saveAddress = () => {
    onUpdate({ ...location, address: addressDraft });
    setEditingAddress(false);
  };

  return (
    <div style={{ background:"#111", border:"1px solid #2a2a2a", borderRadius:8, padding:14, marginBottom:10 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontWeight:600, color:"#e0e0e0", fontSize:15 }}>{location.name}</span>
          <SyncBadge status={syncStatus} />
        </div>
        {location.address ? (
          <button onClick={() => openMaps(location.address)} style={{ background:"#1a2a1a", border:"1px solid #2a4a2a", borderRadius:6, color:"#4a9a4a", fontSize:12, padding:"4px 10px", cursor:"pointer", flexShrink:0 }}>
            📍 Navigate
          </button>
        ) : (
          <button onClick={() => setEditingAddress(true)} style={{ background:"none", border:"1px solid #2a2a2a", borderRadius:6, color:"#555", fontSize:11, padding:"3px 8px", cursor:"pointer", flexShrink:0 }}>
            + Address
          </button>
        )}
      </div>
      {editingAddress && (
        <div style={{ marginBottom:10 }}>
          <input
            type="text" value={addressDraft}
            onChange={(e) => setAddressDraft(e.target.value)}
            onKeyDown={(e) => e.key==="Enter" && saveAddress()}
            placeholder="e.g. Keflavíkurflugvöllur, Iceland"
            style={{ ...inputStyle, fontSize:13, marginBottom:6 }}
            autoFocus
          />
          <div style={{ display:"flex", gap:6 }}>
            <button onClick={saveAddress} style={{ ...btnPrimary, fontSize:12, padding:"5px 12px" }}>Save</button>
            <button onClick={() => setEditingAddress(false)} style={{ ...btnSecondary, fontSize:12, padding:"5px 12px" }}>Cancel</button>
            {location.address && <button onClick={() => { setAddressDraft(""); onUpdate({ ...location, address:"" }); setEditingAddress(false); }} style={{ ...btnSecondary, fontSize:12, padding:"5px 12px", color:"#7a3a3a" }}>Remove</button>}
          </div>
        </div>
      )}
      {location.address && !editingAddress && (
        <div onClick={() => { setAddressDraft(location.address); setEditingAddress(true); }} style={{ color:"#555", fontSize:11, marginBottom:8, cursor:"pointer" }}>
          {location.address}
        </div>
      )}
      {location.workItems.length===0 && <div style={{ color:"#444", fontSize:13, marginBottom:8 }}>No work logged yet</div>}
      {location.workItems.map((item) => (
        <div key={item.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"#1a1a1a", borderRadius:6, padding:"6px 10px", marginBottom:6, fontSize:13, color:"#ccc" }}>
          <span>{item.label}</span>
          <button onClick={() => removeItem(item.id)} style={{ background:"none", border:"none", color:"#555", cursor:"pointer", fontSize:16, lineHeight:1, padding:"0 4px" }}>×</button>
        </div>
      ))}
      {showForm ? (
        <WorkItemForm onAdd={addItem} onCancel={() => setShowForm(false)} />
      ) : (
        <button onClick={() => setShowForm(true)} style={{ ...btnSecondary, fontSize:12, padding:"5px 12px" }}>+ Log work</button>
      )}
    </div>
  );
}

// ── Comments Section ─────────────────────────────────────────────────────────
function CommentsSection({ project }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(() => localStorage.getItem("rml_name") || "");
  const [message, setMessage] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    loadComments(project.id)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [project.id]);

  const post = async () => {
    if (!message.trim() || !name.trim()) return;
    localStorage.setItem("rml_name", name.trim());
    setPosting(true);
    const now = new Date().toLocaleString("en-GB", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" });
    const entry = { timestamp: now, name: name.trim(), message: message.trim(), projectId: String(project.id) };
    setComments((prev) => [...prev, entry]);
    setMessage("");
    await postComment([now, String(project.id), name.trim(), message.trim()]).catch(console.error);
    setPosting(false);
  };

  return (
    <div style={{ marginBottom:14 }}>
      <div style={sectionLabel}>Comments</div>

      {loading && <div style={{ color:"#444", fontSize:13, marginBottom:8 }}>Loading…</div>}

      {!loading && comments.length === 0 && (
        <div style={{ color:"#444", fontSize:13, marginBottom:8 }}>No comments yet</div>
      )}

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
        {!localStorage.getItem("rml_name") && (
          <div style={{ marginBottom:8 }}>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Your name" style={{ ...inputStyle, fontSize:13 }} />
          </div>
        )}
        <div style={{ display:"flex", gap:6 }}>
          <input type="text" value={message} onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key==="Enter" && post()}
            placeholder="Write a comment…"
            style={{ ...inputStyle, flex:1, fontSize:13 }} />
          <button onClick={post} disabled={!message.trim()||!name.trim()||posting}
            style={{ ...btnPrimary, padding:"8px 14px", opacity:message.trim()&&name.trim()?1:0.4 }}>
            {posting ? "…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Hours Tracker ────────────────────────────────────────────────────────────
function roundDown15(date) {
  const d = new Date(date);
  d.setMinutes(Math.floor(d.getMinutes() / 15) * 15, 0, 0);
  return d;
}
function roundUp15(date) {
  const d = new Date(date);
  const m = d.getMinutes();
  const rem = m % 15;
  if (rem === 0) return d;
  d.setMinutes(m + (15 - rem), 0, 0);
  return d;
}
function fmtTime(date) {
  return date.toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" });
}
function diffHours(a, b) {
  return ((b - a) / 3600000).toFixed(2);
}

function HoursTracker({ onClose }) {
  const [name, setName] = useState("");
  const [clockedIn, setClockedIn] = useState(null); // { raw, rounded, name }
  const [log, setLog] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  const clockIn = () => {
    if (!name.trim()) return;
    const now = new Date();
    setClockedIn({ raw: now, rounded: roundDown15(now), name: name.trim() });
    setSynced(false);
  };

  const clockOut = async () => {
    if (!clockedIn) return;
    const now = new Date();
    const roundedOut = roundUp15(now);
    const hours = diffHours(clockedIn.rounded, roundedOut);
    const today = now.toLocaleDateString("en-GB");
    const entry = {
      date: today,
      name: clockedIn.name,
      clockIn: fmtTime(clockedIn.rounded),
      clockOut: fmtTime(roundedOut),
      hours,
    };
    setLog([...log, entry]);
    setSyncing(true);
    appendHoursToSheet([entry.date, entry.name, entry.clockIn, entry.clockOut, entry.hours]).catch(console.error);
    setTimeout(() => { setSyncing(false); setSynced(true); }, 1000);
    setClockedIn(null);
  };

  return (
    <div style={{ background:"#161616", border:"1px solid #2a2a2a", borderRadius:10, marginBottom:16, overflow:"hidden" }}>
      <div style={{ padding:"14px 16px", borderBottom:"1px solid #1a1a1a", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontWeight:700, fontSize:15 }}>⏱ Hours</div>
        <button onClick={onClose} style={{ background:"none", border:"none", color:"#555", fontSize:18, cursor:"pointer" }}>×</button>
      </div>
      <div style={{ padding:"14px 16px" }}>
        {!clockedIn ? (
          <div>
            <div style={{ marginBottom:10 }}>
              <label style={labelStyle}>Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jón" style={inputStyle} />
            </div>
            <button onClick={clockIn} disabled={!name.trim()} style={{ ...btnSuccess, width:"100%", padding:"12px", fontSize:14, fontWeight:700, opacity:name.trim()?1:0.4 }}>
              Clock in
            </button>
          </div>
        ) : (
          <div style={{ textAlign:"center" }}>
            <div style={{ color:"#555", fontSize:12, marginBottom:4 }}>{clockedIn.name} · clocked in</div>
            <div style={{ fontSize:36, fontWeight:800, color:"#4a9a4a", marginBottom:2 }}>{fmtTime(clockedIn.rounded)}</div>
            <div style={{ color:"#444", fontSize:11, marginBottom:16 }}>rounded from {fmtTime(clockedIn.raw)}</div>
            <button onClick={clockOut} style={{ background:"#e8f0e8", color:"#111", border:"none", borderRadius:8, padding:"12px 32px", fontSize:14, fontWeight:700, cursor:"pointer", width:"100%" }}>
              Clock out
            </button>
          </div>
        )}

        {log.length > 0 && (
          <div style={{ marginTop:14, borderTop:"1px solid #1a1a1a", paddingTop:12 }}>
            {log.map((e, i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#888", marginBottom:6 }}>
                <span>{e.name}</span>
                <span>{e.clockIn} → {e.clockOut}</span>
                <span style={{ color:"#4a9a4a" }}>{e.hours}h</span>
              </div>
            ))}
            {syncing && <div style={{ color:"#6aacf0", fontSize:11, textAlign:"center" }}>Syncing…</div>}
            {synced && !syncing && <div style={{ color:"#4a9a4a", fontSize:11, textAlign:"center" }}>✓ Logged to sheet</div>}
          </div>
        )}
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

  // Merge and deduplicate checklists
  const mergedChecklist = [];
  const seen = new Set();
  selectedProjects.forEach((p) => {
    (p.checklist||[]).forEach((item) => {
      if (!seen.has(item.label)) {
        seen.add(item.label);
        mergedChecklist.push({ ...item, id: Date.now() + Math.random() });
      }
    });
  });

  const totalItems = selectedProjects.reduce((s, p) => s + p.locations.reduce((ls, l) => ls + l.workItems.length, 0), 0);

  return (
    <div style={{ background:"#161616", border:"1px solid #2a2a2a", borderRadius:10, marginBottom:16, overflow:"hidden" }}>
      <div style={{ padding:"14px 16px", borderBottom:"1px solid #1a1a1a", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontWeight:700, fontSize:15 }}>🗺 Trip planner</div>
        <button onClick={onClose} style={{ background:"none", border:"none", color:"#555", fontSize:18, cursor:"pointer" }}>×</button>
      </div>
      <div style={{ padding:"14px 16px" }}>
        {!showChecklist ? (
          <div>
            <div style={{ marginBottom:10 }}>
              <label style={labelStyle}>Trip name (optional)</label>
              <input type="text" value={tripName} onChange={(e) => setTripName(e.target.value)} placeholder="e.g. Monday run" style={inputStyle} />
            </div>
            <div style={{ color:"#666", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>Select projects</div>
            {projects.filter((p) => !p.finished).map((p) => (
              <div key={p.id} onClick={() => toggle(p.id)} style={{ display:"flex", alignItems:"center", gap:10, background:selected.includes(p.id)?"#0f1a0f":"#111", border:`1px solid ${selected.includes(p.id)?"#1e3a1e":"#222"}`, borderRadius:8, padding:"10px 12px", marginBottom:6, cursor:"pointer" }}>
                <div style={{ width:18, height:18, borderRadius:4, border:`2px solid ${selected.includes(p.id)?"#4a9a4a":"#444"}`, background:selected.includes(p.id)?"#1a4a1a":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {selected.includes(p.id) && <span style={{ color:"#4a9a4a", fontSize:12 }}>✓</span>}
                </div>
                <div>
                  <div style={{ color:"#e0e0e0", fontSize:13, fontWeight:600 }}>{p.name}</div>
                  <div style={{ color:"#555", fontSize:11 }}>{p.region}{p.subRegion?" > "+p.subRegion:""} · {(p.checklist||[]).length} checklist items</div>
                </div>
              </div>
            ))}
            {selected.length > 0 && (
              <button onClick={() => setShowChecklist(true)} style={{ ...btnPrimary, width:"100%", marginTop:8, padding:"10px" }}>
                View combined checklist ({mergedChecklist.length} items) →
              </button>
            )}
          </div>
        ) : (
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              <button onClick={() => setShowChecklist(false)} style={{ background:"none", border:"none", color:"#888", fontSize:13, cursor:"pointer", padding:0 }}>← Back</button>
              <div style={{ fontWeight:700, color:"#e0e0e0" }}>{tripName || "Trip"} checklist</div>
            </div>
            <div style={{ color:"#555", fontSize:12, marginBottom:10 }}>
              {selectedProjects.length} projects · {totalItems} items logged · {mergedChecklist.length} things to bring
            </div>
            {mergedChecklist.map((item) => (
              <div key={item.id} style={{ display:"flex", alignItems:"center", gap:10, background:"#111", border:"1px solid #222", borderRadius:7, padding:"9px 12px", marginBottom:6 }}>
                <div style={{ width:18, height:18, borderRadius:4, border:"2px solid #444", flexShrink:0 }} />
                <span style={{ fontSize:13, color:"#ccc" }}>{item.label}</span>
              </div>
            ))}
            {mergedChecklist.length === 0 && (
              <div style={{ color:"#444", fontSize:13, textAlign:"center", padding:"20px 0" }}>No checklist items on selected projects</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Work Mode ─────────────────────────────────────────────────────────────────
function WorkMode({ project, onUpdate, onExit }) {
  const updateLocation = (loc) => onUpdate({ ...project, locations:project.locations.map((l) => l.id===loc.id ? loc : l) });
  const hasDrawings = (project.drawings||[]).length > 0;

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0a", color:"#e0e0e0", fontFamily:"'Inter', system-ui, sans-serif", maxWidth:600, margin:"0 auto", padding:"0 0 40px" }}>
      {/* Header */}
      <div style={{ padding:"16px 16px 14px", borderBottom:"1px solid #1a1a1a", position:"sticky", top:0, background:"#0a0a0a", zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={onExit} style={{ background:"none", border:"1px solid #333", borderRadius:8, color:"#888", fontSize:13, padding:"6px 12px", cursor:"pointer", flexShrink:0 }}>
            ← Back
          </button>
          <div style={{ minWidth:0 }}>
            <div style={{ fontWeight:800, fontSize:16, letterSpacing:-0.3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{project.name}</div>
            <div style={{ color:"#444", fontSize:11 }}>Work mode · {project.assignedTo||"Unassigned"}</div>
          </div>
          {!project.finished && (
            <button onClick={() => onUpdate({ ...project, finished:true })} style={{ ...{background:"#1a3a1a", color:"#4a9a4a", border:"1px solid #2a5a2a", borderRadius:6, padding:"6px 12px", fontSize:12, cursor:"pointer"}, marginLeft:"auto", flexShrink:0 }}>
              ✓ Finish
            </button>
          )}
        </div>
      </div>

      <div style={{ padding:"14px 16px 0" }}>
        {/* Notes if present */}
        {project.notes && (
          <div style={{ background:"#111", border:"1px solid #2a2a2a", borderRadius:8, padding:"10px 12px", marginBottom:14, color:"#888", fontSize:13, fontStyle:"italic", lineHeight:1.5 }}>
            {project.notes}
          </div>
        )}

        {/* Drawings if present */}
        {hasDrawings && (
          <div style={{ marginBottom:14 }}>
            <div style={{ color:"#666", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>Drawings</div>
            {project.drawings.map((d) => (
              <div key={d.id} style={{ display:"flex", alignItems:"center", gap:8, background:"#1a1a1a", borderRadius:6, padding:"9px 12px", marginBottom:6 }}>
                <span style={{ color:"#555", fontSize:13 }}>[+]</span>
                {d.url ? (
                  <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ color:"#7ab8f5", fontSize:14, flex:1, textDecoration:"none", fontWeight:600 }}>{d.label}</a>
                ) : (
                  <span style={{ color:"#ccc", fontSize:14, flex:1 }}>{d.label}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Divider */}
        {(project.notes || hasDrawings) && <div style={{ borderTop:"1px solid #1a1a1a", marginBottom:14 }} />}

        {/* Locations — logging only */}
        <div style={{ color:"#666", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5, marginBottom:10 }}>Locations</div>
        {project.locations.map((loc) => (
          <LocationLog key={loc.id} location={loc} project={project} onUpdate={updateLocation} />
        ))}
      </div>
    </div>
  );
}

// ── Project Card ──────────────────────────────────────────────────────────────
function ProjectCard({ project, onUpdate, onDelete, onStartWork }) {
  const [expanded, setExpanded] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [showAddLocation, setShowAddLocation] = useState(false);

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

  return (
    <div style={{ background:"#161616", border:project.finished?"1px solid #2a3a2a":"1px solid #2a2a2a", borderRadius:10, marginBottom:12, overflow:"hidden" }}>
      <div onClick={() => setExpanded(!expanded)} style={{ padding:"14px 16px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontWeight:700, color:project.finished?"#4a7a4a":"#e0e0e0", fontSize:15 }}>{project.name}</div>
          <div style={{ color:"#555", fontSize:12, marginTop:2 }}>
            {project.region}{project.subRegion?" > "+project.subRegion:""}
            {project.assignedTo?" · "+project.assignedTo:""}
            {" · "}{totalItems} item{totalItems!==1?"s":""}
            {contactCount>0?" · "+contactCount+" contact"+(contactCount!==1?"s":""):""}
            {checklist.length>0?` · ${checkDone}/${checklist.length} checked`:""}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {project.finished && <span style={{ background:"#1a3a1a", color:"#4a9a4a", borderRadius:4, padding:"2px 8px", fontSize:11 }}>Done</span>}
          <span style={{ color:"#555", fontSize:18 }}>{expanded?"∧":"∨"}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding:"0 16px 16px" }}>
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
            <LocationLog key={loc.id} location={loc} project={project} onUpdate={updateLocation} />
          ))}

          {showAddLocation ? (
            <div style={{ display:"flex", gap:8, marginTop:8 }}>
              <input type="text" value={newLocationName} onChange={(e) => setNewLocationName(e.target.value)} placeholder="Location name" style={{ ...inputStyle, flex:1 }} onKeyDown={(e) => e.key==="Enter" && addLocation()} />
              <button onClick={addLocation} style={btnPrimary}>Add</button>
              <button onClick={() => setShowAddLocation(false)} style={btnSecondary}>×</button>
            </div>
          ) : (
            <button onClick={() => setShowAddLocation(true)} style={{ ...btnSecondary, fontSize:12, marginTop:4 }}>+ Add location</button>
          )}

          <div style={{ display:"flex", gap:8, marginTop:14, paddingTop:14, borderTop:"1px solid #222", flexWrap:"wrap" }}>
            <button onClick={onStartWork} style={{ background:"#1a2a3a", color:"#6aacf0", border:"1px solid #2a4a6a", borderRadius:6, padding:"8px 16px", fontSize:13, cursor:"pointer", fontWeight:700 }}>
              ▶ Start work
            </button>
            <button onClick={() => onUpdate({ ...project, finished:!project.finished })} style={project.finished?btnSecondary:btnSuccess}>
              {project.finished?"Reopen":"Mark finished"}
            </button>
            <button onClick={() => onDelete(project.id)} style={{ ...btnSecondary, color:"#7a3a3a" }}>Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── New Project Form ──────────────────────────────────────────────────────────
function NewProjectForm({ onAdd, onCancel }) {
  const [name, setName] = useState(""); const [region, setRegion] = useState("South");
  const [subRegion, setSubRegion] = useState(""); const [assignedTo, setAssignedTo] = useState("Unassigned");
  const [notes, setNotes] = useState("");
  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({ id:Date.now(), name:name.trim(), region, subRegion, assignedTo, notes, finished:false, drawings:[], locations:[], contacts:[], checklist:[] });
  };
  return (
    <div style={{ background:"#161616", border:"1px solid #333", borderRadius:10, padding:16, marginBottom:16 }}>
      <div style={{ fontWeight:700, color:"#e0e0e0", marginBottom:14 }}>New Project</div>
      <div style={{ marginBottom:10 }}><label style={labelStyle}>Project Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Keflavik Airport" style={inputStyle} /></div>
      <div style={{ marginBottom:10 }}><label style={labelStyle}>Region</label><select value={region} onChange={(e) => { setRegion(e.target.value); setSubRegion(""); }} style={selectStyle}>{REGIONS.map((r) => <option key={r}>{r}</option>)}</select></div>
      {SUB_REGIONS[region]&&SUB_REGIONS[region].length>0 && <div style={{ marginBottom:10 }}><label style={labelStyle}>Sub-region</label><select value={subRegion} onChange={(e) => setSubRegion(e.target.value)} style={selectStyle}><option value="">None</option>{SUB_REGIONS[region].map((s) => <option key={s}>{s}</option>)}</select></div>}
      {region==="South" && <div style={{ marginBottom:10 }}><label style={labelStyle}>Assign to</label><select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} style={selectStyle}>{CARS.map((c) => <option key={c}>{c}</option>)}</select></div>}
      <div style={{ marginBottom:14 }}><label style={labelStyle}>Notes</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Special instructions…" style={{ ...inputStyle, height:70, resize:"vertical" }} /></div>
      <div style={{ display:"flex", gap:8 }}><button onClick={handleAdd} style={btnPrimary}>Create project</button><button onClick={onCancel} style={btnSecondary}>Cancel</button></div>
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
  const [workMode, setWorkMode] = useState(null);
  const [showHours, setShowHours] = useState(false);
  const [showTrips, setShowTrips] = useState(false);

  // Load projects from sheet on startup
  useEffect(() => {
    loadProjectsFromSheet()
      .then((data) => { if (Array.isArray(data) && data.length > 0) setProjects(data); else setProjects(initialProjects); })
      .catch(() => setProjects(initialProjects))
      .finally(() => setLoading(false));
  }, []);

  // Save projects to sheet whenever they change
  useEffect(() => {
    if (!loading) saveProjectsToSheet(projects).catch(console.error);
  }, [projects, loading]);

  const addProject = (p) => { setProjects((prev) => [p,...prev]); setShowNew(false); };
  const updateProject = (p) => setProjects((prev) => prev.map((x) => x.id===p.id ? p : x));
  const deleteProject = (id) => setProjects((prev) => prev.filter((p) => p.id!==id));

  const filtered = projects.filter((p) => {
    const matchesFilter = filter==="all"||(filter==="active"&&!p.finished)||(filter==="finished"&&p.finished);
    const matchesSearch = !search||p.name.toLowerCase().includes(search.toLowerCase())||(p.subRegion&&p.subRegion.toLowerCase().includes(search.toLowerCase()));
    const matchesCar = carFilter==="all"||p.assignedTo===carFilter;
    return matchesFilter && matchesSearch && matchesCar;
  });

  const workProject = workMode ? projects.find((p) => p.id===workMode) : null;

  if (!authed) {
    return <PinScreen onUnlock={() => setAuthed(true)} />;
  }

  if (loading) {
    return (
      <div style={{ minHeight:"100vh", background:"#0a0a0a", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Inter', system-ui, sans-serif" }}>
        <div style={{ color:"#444", fontSize:14 }}>Loading projects…</div>
      </div>
    );
  }

  if (workProject) {
    return (
      <WorkMode
        project={workProject}
        onUpdate={updateProject}
        onExit={() => setWorkMode(null)}
      />
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0a", color:"#e0e0e0", fontFamily:"'Inter', system-ui, sans-serif", maxWidth:600, margin:"0 auto", padding:"0 0 40px" }}>
      <div style={{ padding:"20px 16px 16px", borderBottom:"1px solid #1a1a1a", position:"sticky", top:0, background:"#0a0a0a", zIndex:10 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div>
            <div style={{ fontWeight:800, fontSize:18, letterSpacing:-0.5 }}>Road Marking Log</div>
            <div style={{ color:"#444", fontSize:12 }}>
              {projects.filter((p) => !p.finished).length} active · {projects.filter((p) => p.finished).length} finished
            </div>
          </div>
          <button onClick={() => setShowNew(!showNew)} style={{ ...btnPrimary, borderRadius:20, padding:"8px 18px", fontSize:13 }}>
            {showNew?"Cancel":"+ Project"}
          </button>
        </div>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects..." style={{ ...inputStyle, marginBottom:10 }} />
        <div style={{ display:"flex", gap:6, marginBottom:8 }}>
          {["active","finished","all"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{ background:filter===f?"#e8f0e8":"none", color:filter===f?"#111":"#666", border:filter===f?"none":"1px solid #222", borderRadius:16, padding:"5px 14px", fontSize:12, cursor:"pointer", fontWeight:filter===f?700:400, textTransform:"capitalize" }}>{f}</button>
          ))}
        </div>
        <div style={{ display:"flex", gap:6, alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            <span style={{ color:"#444", fontSize:11, marginRight:2 }}>View:</span>
            {["all","Car 1","Car 2"].map((c) => (
              <button key={c} onClick={() => setCarFilter(c)} style={{ background:carFilter===c?"#1a2a3a":"none", color:carFilter===c?"#6aacf0":"#555", border:carFilter===c?"1px solid #2a4a6a":"1px solid #222", borderRadius:16, padding:"4px 12px", fontSize:12, cursor:"pointer", fontWeight:carFilter===c?700:400 }}>
                {c==="all" ? "All cars" : c}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", gap:6 }}>
            <button onClick={() => { setShowTrips(!showTrips); setShowHours(false); }} style={{ background:showTrips?"#1a2a1a":"none", color:showTrips?"#4a9a4a":"#555", border:`1px solid ${showTrips?"#2a4a2a":"#222"}`, borderRadius:16, padding:"4px 10px", fontSize:12, cursor:"pointer" }}>🗺</button>
            <button onClick={() => { setShowHours(!showHours); setShowTrips(false); }} style={{ background:showHours?"#1a2a3a":"none", color:showHours?"#6aacf0":"#555", border:`1px solid ${showHours?"#2a4a6a":"#222"}`, borderRadius:16, padding:"4px 10px", fontSize:12, cursor:"pointer" }}>⏱</button>
          </div>
        </div>
      </div>
      <div style={{ padding:"16px 16px 0" }}>
        {showHours && <HoursTracker onClose={() => setShowHours(false)} />}
        {showTrips && <TripsView projects={projects} onClose={() => setShowTrips(false)} />}
        {showNew && <NewProjectForm onAdd={addProject} onCancel={() => setShowNew(false)} />}
        {filtered.length===0 && <div style={{ textAlign:"center", color:"#444", padding:"40px 20px", fontSize:14 }}>{search?"No projects match your search":"No projects here yet"}</div>}
        {filtered.map((p) => <ProjectCard key={p.id} project={p} onUpdate={updateProject} onDelete={deleteProject} onStartWork={() => setWorkMode(p.id)} />)}
      </div>
    </div>
  );
}
