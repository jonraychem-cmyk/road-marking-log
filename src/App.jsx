import { useState, useCallback } from "react";

// ── Google Sheets config v2 ───────────────────────────────────────────────────
const SHEET_ID = "1-Lj53Phr5u7ILgXuBe5HtvDEP-XEA4PzQIFUa92a90c";
const API_KEY  = "AIzaSyC1YPAvTCz1wPraNpRFEapMvjfQp5HkBhw";
const SHEET_NAME = "Log";

async function appendToSheet(row) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}:append?valueInputOption=USER_ENTERED&key=${API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ values: [row] }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || res.statusText);
  }
  return res.json();
}

// ── Constants ─────────────────────────────────────────────────────────────────
const REGIONS = ["South", "Rest of Iceland"];
const SUB_REGIONS = {
  "Rest of Iceland": ["Akureyri", "North", "West"],
  South: [],
};
const STENCIL_OPTIONS = ["Fatladur","Rafhledsla","Or","BUS","Ruta","Gongukall","Hjolhysi","Hjol","Other"];
const ZEBRA_SIZES = ["50x300","50x250","50x240","50x200","50x120","Custom"];
const WORK_TYPES = ["Linur","Midlinur","Stencil","Blue Square (Fatladur)","Green Square (Rafhledsla)","Gangbraut"];
const CARS = ["Car 1","Car 2","Unassigned"];
const CHECKLIST_PRESETS = {
  "Stencils": ["Fatladur","Rafhledsla","Or","BUS","Ruta","Gongukall","Hjolhysi","Hjol"],
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
      { id:1, name:"Terminal Parking", workItems:[] },
      { id:2, name:"Staff Parking", workItems:[] },
    ],
  },
  {
    id:2, name:"Akureyri Town", region:"Rest of Iceland", subRegion:"Akureyri",
    assignedTo:"", finished:false, notes:"", drawings:[], contacts:[], checklist:[],
    locations:[
      { id:1, name:"Church", workItems:[] },
      { id:2, name:"Sports Area", workItems:[] },
      { id:3, name:"School", workItems:[] },
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
    }
    onAdd(item);
  };

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
function LocationLog({ location, project, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

  const addItem = useCallback(async (item) => {
    // Update local state immediately
    onUpdate({ ...location, workItems:[...location.workItems, item] });
    setShowForm(false);

    // Sync to Google Sheets
    setSyncStatus("syncing");
    try {
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
      await appendToSheet(row);
      setSyncStatus("ok");
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (e) {
      console.error("Sheet sync error:", e);
      setSyncStatus("error:" + e.message);
      setTimeout(() => setSyncStatus(null), 12000);
    }
  }, [location, project, onUpdate]);

  const removeItem = (id) => onUpdate({ ...location, workItems:location.workItems.filter((i) => i.id!==id) });

  return (
    <div style={{ background:"#111", border:"1px solid #2a2a2a", borderRadius:8, padding:14, marginBottom:10 }}>
      <div style={{ display:"flex", alignItems:"center", marginBottom:8 }}>
        <span style={{ fontWeight:600, color:"#e0e0e0", fontSize:15 }}>{location.name}</span>
        <SyncBadge status={syncStatus} />
      </div>
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

// ── Project Card ──────────────────────────────────────────────────────────────
function ProjectCard({ project, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [showAddLocation, setShowAddLocation] = useState(false);

  const addLocation = () => {
    if (!newLocationName.trim()) return;
    onUpdate({ ...project, locations:[...project.locations, { id:Date.now(), name:newLocationName.trim(), workItems:[] }] });
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

          <div style={{ display:"flex", gap:8, marginTop:14, paddingTop:14, borderTop:"1px solid #222" }}>
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
  const [projects, setProjects] = useState(initialProjects);
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState("active");
  const [search, setSearch] = useState("");

  const addProject = (p) => { setProjects([p,...projects]); setShowNew(false); };
  const updateProject = (p) => setProjects(projects.map((x) => x.id===p.id ? p : x));
  const deleteProject = (id) => setProjects(projects.filter((p) => p.id!==id));

  const filtered = projects.filter((p) => {
    const matchesFilter = filter==="all"||(filter==="active"&&!p.finished)||(filter==="finished"&&p.finished);
    const matchesSearch = !search||p.name.toLowerCase().includes(search.toLowerCase())||(p.subRegion&&p.subRegion.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

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
        <div style={{ display:"flex", gap:6 }}>
          {["active","finished","all"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{ background:filter===f?"#e8f0e8":"none", color:filter===f?"#111":"#666", border:filter===f?"none":"1px solid #222", borderRadius:16, padding:"5px 14px", fontSize:12, cursor:"pointer", fontWeight:filter===f?700:400, textTransform:"capitalize" }}>{f}</button>
          ))}
        </div>
      </div>
      <div style={{ padding:"16px 16px 0" }}>
        {showNew && <NewProjectForm onAdd={addProject} onCancel={() => setShowNew(false)} />}
        {filtered.length===0 && <div style={{ textAlign:"center", color:"#444", padding:"40px 20px", fontSize:14 }}>{search?"No projects match your search":"No projects here yet"}</div>}
        {filtered.map((p) => <ProjectCard key={p.id} project={p} onUpdate={updateProject} onDelete={deleteProject} />)}
      </div>
    </div>
  );
}
