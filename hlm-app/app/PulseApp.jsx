"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { dbLoad, dbSave, subscribeToKey } from "./lib/supabase";

/* ═══════════════════════════════════════════════════════════════════
   PULSE — OBSIDIAN AMETHYST DESIGN SYSTEM
   "The Digital Heirloom" — Dark, Glass, Pink-Purple
   ═══════════════════════════════════════════════════════════════════ */

// ─── Theme tokens ─────────────────────────────────────────────────
const T = {
  bg:          "#000000",
  card:        "rgba(255,255,255,0.06)",
  cardHi:      "rgba(255,255,255,0.10)",
  border:      "rgba(255,255,255,0.10)",
  gradient:    "linear-gradient(135deg,#D63384 0%,#6F42C1 100%)",
  pink:        "#D63384",
  purple:      "#7B4FD4",
  teal:        "#4EC9B0",
  amber:       "#F59E0B",
  text:        "#FFFFFF",
  sub:         "rgba(255,255,255,0.75)",
  muted:       "rgba(255,255,255,0.40)",
  nav:         "rgba(0,0,0,0.85)",
  input:       "rgba(255,255,255,0.07)",
  inputBorder: "rgba(255,255,255,0.15)",
  schedBorder: "#4EC9B0",
};

// ─── Data helpers ─────────────────────────────────────────────────
const today    = new Date();
const todayISO = today.toISOString().split("T")[0];
const toISO    = d => d.toISOString().split("T")[0];
const MO  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DH  = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const dU = ds => {
  const t2 = new Date(ds + "T00:00:00"), n = new Date(today.toDateString());
  return Math.ceil((t2 - n) / 864e5);
};

const ld = (k, d) => { try { const v = localStorage.getItem("pulse5_" + k); return v ? JSON.parse(v) : d; } catch { return d; } };
const sv = (k, v) => { try { localStorage.setItem("pulse5_" + k, JSON.stringify(v)); } catch {} };

// ─── Categories ───────────────────────────────────────────────────
const CATS = {
  insurance:     { l: "Insurance",     i: "🛡️", c: "#20918F" },
  medical:       { l: "Medical",       i: "🏥", c: "#D32F2F" },
  finances:      { l: "Finances",      i: "💳", c: "#E8853D" },
  ids:           { l: "IDs & Docs",    i: "🪪", c: "#5B6ABF" },
  contracts:     { l: "Contracts",     i: "📝", c: "#3D7EE8" },
  kids:          { l: "Kids & School", i: "🎒", c: "#F59E0B" },
  birthdays:     { l: "Birthdays",     i: "🎂", c: "#C24B8B" },
  home:          { l: "Home",          i: "🏠", c: "#6B8E6B" },
  tax:           { l: "Tax & Finance", i: "📊", c: "#4A5568" },
  subscriptions: { l: "Subscriptions", i: "📱", c: "#8B6BD8" },
  vehicle:       { l: "Vehicle",       i: "🚗", c: "#8B6914" },
  other:         { l: "Other",         i: "📌", c: "#7B7B8B" },
};

// ─── Vault folder definitions (the 2×2 grid) ─────────────────────
const VAULT_FOLDERS = [
  { key: "insurance", label: "Insurance", icon: "🛡️", color: "#20918F",
    cats: ["insurance"] },
  { key: "medical",   label: "Medical",   icon: "🏥", color: "#D32F2F",
    cats: ["medical", "health"] },
  { key: "finances",  label: "Finances",  icon: "💳", color: "#E8853D",
    cats: ["finances", "tax", "subscriptions"] },
  { key: "ids",       label: "IDs & Docs",icon: "🪪", color: "#5B6ABF",
    cats: ["ids", "contracts"] },
];

// ─── Gift helpers (preserved from original) ───────────────────────
const GA = [
  { k: "interests", l: "Main Interests", p: "e.g. cooking, hiking" },
  { k: "style",     l: "Style",          p: "e.g. minimalist" },
  { k: "ageGroup",  l: "Age Group",      p: "e.g. 30s, kid" },
  { k: "budget",    l: "Budget",         p: "e.g. 50-100" },
  { k: "avoid",     l: "Avoid",          p: "e.g. no chocolate" },
];
const GDB = {
  cooking: ["Olive oil set","Cookbook","Cooking class","Japanese knife"],
  hiking:  ["Merino socks","Trail snacks","Thermos","Headlamp"],
  tech:    ["Wireless earbuds","Smart gadget","USB-C hub"],
  reading: ["Book gift card","Book light","Bookmark"],
  music:   ["Concert tickets","Bluetooth speaker"],
  sports:  ["Massage gun","Gym bag","Watch band"],
  wellness:["Spa voucher","Essential oils","Sleep mask"],
  kid:     ["LEGO set","Board game","Art supplies","Science kit"],
  teenager:["Gift card","Tech accessory","Experience voucher"],
  default: ["Gift card","Experience voucher","Photo gift","Flowers"],
};
function gG(a) {
  const s = new Set();
  [...(a.interests||"").toLowerCase().split(/[,;]+/),
   ...(a.style||"").toLowerCase().split(/[,;]+/),
   ...(a.ageGroup||"").toLowerCase().split(/[,;]+/)]
    .filter(Boolean)
    .forEach(k => Object.entries(GDB).forEach(([dk, gs]) => {
      if (k.includes(dk) || dk.includes(k)) gs.forEach(g => s.add(g));
    }));
  if (s.size < 3) GDB.default.forEach(g => s.add(g));
  const av = (a.avoid || "").toLowerCase();
  return [...s].filter(g => !av || !av.split(/[,;]+/).some(x => g.toLowerCase().includes(x.trim()))).slice(0, 8);
}

/* ═══════════════════════════════════════════════════════════════════
   UI PRIMITIVES — Obsidian Amethyst
   ═══════════════════════════════════════════════════════════════════ */

// Glass surface
const glass = (extra = {}) => ({
  background:           T.card,
  backdropFilter:       "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border:               `1px solid ${T.border}`,
  borderRadius:         "16px",
  ...extra,
});

// Input field
const iS = () => ({
  width: "100%", padding: "12px 14px", borderRadius: "12px",
  border: `1.5px solid ${T.inputBorder}`, fontSize: "14px",
  fontFamily: "'Manrope', sans-serif", background: T.input,
  color: T.text, boxSizing: "border-box",
});

// Primary button (gradient)
const b1 = (extra = {}) => ({
  width: "100%", padding: "14px", borderRadius: "14px", border: "none",
  background: T.gradient, color: "#fff", fontSize: "15px", fontWeight: 700,
  cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
  marginTop: "8px", ...extra,
});

// Ghost button
const b2 = () => ({
  width: "100%", padding: "11px", borderRadius: "12px", border: "none",
  background: "transparent", color: T.muted, fontSize: "13px",
  cursor: "pointer", fontFamily: "'Manrope', sans-serif", marginTop: "4px",
});

// Form label wrapper
const FL = ({ label, children }) => (
  <div style={{ marginBottom: "14px" }}>
    <label style={{
      fontSize: "10px", fontWeight: 700, color: T.muted,
      textTransform: "uppercase", letterSpacing: "0.12em",
      display: "block", marginBottom: "6px",
      fontFamily: "'Manrope', sans-serif",
    }}>{label}</label>
    {children}
  </div>
);

// Bottom-sheet overlay
const Ov = ({ onClose, children, title, sub }) => (
  <div onClick={onClose} style={{
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)",
    backdropFilter: "blur(8px)", display: "flex",
    alignItems: "flex-end", justifyContent: "center", zIndex: 300,
  }}>
    <div onClick={e => e.stopPropagation()} style={{
      ...glass({
        borderRadius: "24px 24px 0 0",
        padding: "24px 22px 44px",
        width: "100%", maxWidth: "520px",
        maxHeight: "92vh", overflowY: "auto",
        boxShadow: "0 -12px 60px rgba(214,51,132,0.18)",
      }),
    }}>
      <div style={{ width: "36px", height: "4px", background: T.border, borderRadius: "2px", margin: "0 auto 22px" }} />
      {title && (
        <h3 style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: "20px", fontWeight: 700, color: T.text, marginBottom: "2px",
        }}>{title}</h3>
      )}
      {sub && (
        <p style={{
          fontSize: "12px", color: T.muted, marginBottom: "18px",
          fontFamily: "'Manrope', sans-serif",
        }}>{sub}</p>
      )}
      {children}
    </div>
  </div>
);

// Empty state
const Em = ({ text }) => (
  <div style={{ textAlign: "center", padding: "52px 20px", color: T.muted }}>
    <div style={{ fontSize: "36px", marginBottom: "12px" }}>📭</div>
    <div style={{ fontSize: "13px", lineHeight: 1.6, fontFamily: "'Manrope', sans-serif" }}>{text}</div>
  </div>
);

// Headline
const H1 = ({ children }) => (
  <h1 style={{
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: "28px", fontWeight: 700, color: T.text, lineHeight: 1.1,
  }}>{children}</h1>
);

// Section label
const SectionLabel = ({ children }) => (
  <h2 style={{
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: "11px", fontWeight: 700, color: T.muted,
    textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px",
  }}>{children}</h2>
);

/* ═══════════════════════════════════════════════════════════════════
   VOICE INPUT
   ═══════════════════════════════════════════════════════════════════ */
function useVoice() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recRef = useRef(null);
  const startListening = useCallback((onResult) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Speech recognition not supported. Try Chrome."); return; }
    const rec = new SR();
    rec.continuous = false; rec.interimResults = true; rec.lang = "";
    rec.onstart  = () => setListening(true);
    rec.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join("");
      setTranscript(t);
      if (e.results[0].isFinal && onResult) onResult(t);
    };
    rec.onerror = () => { setListening(false); setTranscript(""); };
    rec.onend   = () => setListening(false);
    recRef.current = rec; rec.start();
  }, []);
  const stopListening = useCallback(() => {
    if (recRef.current) recRef.current.stop();
    setListening(false);
  }, []);
  return { listening, transcript, startListening, stopListening };
}

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const v = voices.find(v => v.lang.startsWith("en") && v.name.includes("Google")) || voices.find(v => v.lang.startsWith("en"));
  if (v) u.voice = v; u.rate = 1.0; u.pitch = 1.0;
  window.speechSynthesis.speak(u);
}

function MicBtn({ onResult, size = 34 }) {
  const { listening, transcript, startListening, stopListening } = useVoice();
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <button
        onClick={() => listening ? stopListening() : startListening(onResult)}
        className={listening ? "mic-pulse" : ""}
        style={{
          width: `${size}px`, height: `${size}px`, borderRadius: "50%",
          background: listening ? "#D32F2F" : "rgba(214,51,132,0.18)",
          color: listening ? "#fff" : T.pink,
          border: "none", cursor: "pointer", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: `${size * 0.44}px`, transition: "all 0.2s",
        }}
        title={listening ? "Stop" : "Speak"}
      >🎙️</button>
      {listening && transcript && (
        <div style={{
          position: "absolute", bottom: `${size + 8}px`, left: "50%",
          transform: "translateX(-50%)",
          ...glass({ padding: "8px 12px", fontSize: "12px", color: T.text,
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            whiteSpace: "nowrap", maxWidth: "260px",
            overflow: "hidden", textOverflow: "ellipsis", zIndex: 50 }),
        }}>{transcript}</div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   AI ASSISTANT PANEL
   ═══════════════════════════════════════════════════════════════════ */
function AIAssistant({ items, contacts, family, onClose }) {
  const [msgs, setMsgs] = useState([{
    role: "assistant",
    text: "Hi! I'm your Pulse assistant. Ask me anything about your events, tasks, or schedules. 🎙️",
  }]);
  const [input, setInput]   = useState("");
  const [loading, setLoad]  = useState(false);
  const scrollRef           = useRef();
  const { listening, transcript, startListening, stopListening } = useVoice();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs]);

  const buildCtx = () => {
    const evts = items.map(i => `- ${i.title} | ${i.date} | ${CATS[i.category]?.l || i.category} | ${i.assignedTo ? family.find(f => f.id === i.assignedTo)?.name || "?" : "unassigned"}`).join("\n");
    const cts  = contacts.map(c => `- ${c.name} | ${c.relationship || "?"} | Birthday: ${c.birthday || "?"}`).join("\n");
    return `You are a helpful household assistant for Pulse. Today: ${todayISO}.\nEVENTS:\n${evts || "None."}\nCONTACTS:\n${cts || "None."}\nFAMILY: ${family.map(f => f.name).join(", ") || "None."}`;
  };

  const send = async (text) => {
    if (!text.trim()) return;
    const userMsg  = { role: "user", text: text.trim() };
    const updated  = [...msgs, userMsg];
    setMsgs(updated); setInput(""); setLoad(true);
    try {
      const history = updated.filter((_, i) => i > 0).map(m => ({ role: m.role, content: m.text }));
      const res  = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 800, system: buildCtx(), messages: history }),
      });
      const data  = await res.json();
      const reply = data.content?.map(c => c.text || "").join("") || "Sorry, try again.";
      setMsgs(p => [...p, { role: "assistant", text: reply }]);
      speak(reply);
    } catch {
      setMsgs(p => [...p, { role: "assistant", text: "Something went wrong." }]);
    }
    setLoad(false);
  };

  return (
    <div style={{
      position: "fixed", bottom: 0, right: 0, width: "100%", maxWidth: "420px",
      height: "58vh", maxHeight: "480px",
      ...glass({ borderRadius: "24px 24px 0 0", boxShadow: "0 -8px 60px rgba(111,66,193,0.35)" }),
      display: "flex", flexDirection: "column", zIndex: 400, border: `1px solid ${T.border}`,
    }}>
      <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: T.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>🤖</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: T.text, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Pulse Assistant</div>
          <div style={{ fontSize: "10px", color: T.muted, fontFamily: "'Manrope', sans-serif" }}>Voice enabled · Ask anything</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: T.muted }}>✕</button>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "14px 18px" }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: "10px" }}>
            <div style={{
              maxWidth: "85%", padding: "10px 14px",
              borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              background: m.role === "user" ? T.gradient : "rgba(255,255,255,0.08)",
              color: "#fff", fontSize: "13px", lineHeight: 1.5,
              fontFamily: "'Manrope', sans-serif",
            }}>
              {m.text}
              {m.role === "assistant" && i > 0 && (
                <button onClick={() => speak(m.text)} style={{ display: "block", marginTop: "6px", background: "none", border: "none", fontSize: "11px", color: T.pink, cursor: "pointer", fontFamily: "'Manrope', sans-serif" }}>🔊 Listen</button>
              )}
            </div>
          </div>
        ))}
        {loading && <div className="pl" style={{ fontSize: "13px", color: T.muted, padding: "8px 0", fontFamily: "'Manrope', sans-serif" }}>🤖 Thinking...</div>}
      </div>

      <div style={{ padding: "12px 18px", borderTop: `1px solid ${T.border}`, display: "flex", gap: "8px", alignItems: "center" }}>
        <input
          value={listening ? transcript : input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send(input)}
          placeholder={listening ? "Listening..." : "Ask me anything..."}
          style={{
            flex: 1, padding: "10px 14px", borderRadius: "12px",
            border: `1.5px solid ${listening ? "#D32F2F" : T.inputBorder}`,
            fontSize: "14px", fontFamily: "'Manrope', sans-serif",
            background: listening ? "rgba(211,47,47,0.08)" : T.input, color: T.text,
          }}
        />
        <button onClick={() => listening ? stopListening() : startListening(send)}
          className={listening ? "mic-pulse" : ""}
          style={{ width: "40px", height: "40px", borderRadius: "50%", background: listening ? "#D32F2F" : "rgba(214,51,132,0.18)", color: listening ? "#fff" : T.pink, border: "none", cursor: "pointer", fontSize: "18px", flexShrink: 0 }}>🎙️</button>
        <button onClick={() => send(input)} disabled={loading}
          style={{ width: "40px", height: "40px", borderRadius: "50%", background: T.gradient, color: "#fff", border: "none", cursor: "pointer", fontSize: "16px", flexShrink: 0 }}>→</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ADD / EDIT EVENT MODAL
   ═══════════════════════════════════════════════════════════════════ */
function EvModal({ onClose, onSave, contacts, family, editItem }) {
  const [f, sF] = useState(editItem || {
    title: "", category: "insurance", date: "", notes: "",
    preResearch: "", assignedTo: "", recurring: false,
    expense: 0, taskStatus: "todo",
  });
  const set     = (k, v) => sF(p => ({ ...p, [k]: v }));
  const fR      = useRef();
  const [vp, setVP] = useState(false);

  const handleVoice = async (text) => {
    setVP(true);
    try {
      const res  = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 600,
          messages: [{ role: "user", content: `Parse into JSON: {title,category(${Object.keys(CATS).join("|")}),date(YYYY-MM-DD),notes,expense(number),recurring(boolean)}. Input: "${text}"` }],
        }),
      });
      const d      = await res.json();
      const parsed = JSON.parse((d.content?.map(c => c.text || "").join("") || "{}").replace(/```json|```/g, "").trim());
      Object.entries(parsed).forEach(([k, v]) => { if (v !== undefined && v !== "") set(k, v); });
    } catch {}
    setVP(false);
  };

  return (
    <Ov onClose={onClose} title={editItem ? "Edit Event" : "Add Event"} sub="Fill in manually or speak 🎙️">
      <div style={{ ...glass({ padding: "14px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px" }) }}>
        <MicBtn onResult={handleVoice} size={38} />
        <div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: T.text, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{vp ? "Parsing your voice..." : "Speak to fill the form"}</div>
          <div style={{ fontSize: "11px", color: T.muted, fontFamily: "'Manrope', sans-serif" }}>e.g. "Car insurance on Jan 1st, costs 1200 yearly"</div>
        </div>
      </div>

      <FL label="Title *">
        <input style={iS()} placeholder="e.g. Car Insurance Renewal" value={f.title} onChange={e => set("title", e.target.value)} />
      </FL>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <FL label="Category">
          <select style={{ ...iS(), cursor: "pointer" }} value={f.category} onChange={e => set("category", e.target.value)}>
            {Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v.i} {v.l}</option>)}
          </select>
        </FL>
        <FL label="Date *">
          <input style={iS()} type="date" value={f.date} onChange={e => set("date", e.target.value)} />
        </FL>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <FL label="Start Time">
          <input style={iS()} type="time" value={f.time || ""} onChange={e => set("time", e.target.value)} />
        </FL>
        <FL label="End Time">
          <input style={iS()} type="time" value={f.timeEnd || ""} onChange={e => set("timeEnd", e.target.value)} />
        </FL>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <FL label="Assign to">
          <select style={{ ...iS(), cursor: "pointer" }} value={f.assignedTo} onChange={e => set("assignedTo", e.target.value)}>
            <option value="">— Unassigned —</option>
            {family.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </FL>
        <FL label="Task Status">
          <select style={{ ...iS(), cursor: "pointer" }} value={f.taskStatus || "todo"} onChange={e => set("taskStatus", e.target.value)}>
            <option value="todo">To Do</option>
            <option value="discuss">To Discuss</option>
            <option value="assigned">Assigned</option>
          </select>
        </FL>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <FL label="Cost">
          <input style={iS()} type="number" placeholder="0" value={f.expense || ""} onChange={e => set("expense", parseFloat(e.target.value) || 0)} />
        </FL>
        <FL label="Recurring">
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer", color: T.text, height: "44px", fontFamily: "'Manrope', sans-serif" }}>
            <input type="checkbox" checked={f.recurring} onChange={e => set("recurring", e.target.checked)} style={{ accentColor: T.pink, width: "16px", height: "16px" }} />
            Yearly
          </label>
        </FL>
      </div>
      <FL label="Notes">
        <textarea style={{ ...iS(), minHeight: "64px", resize: "vertical" }} value={f.notes} onChange={e => set("notes", e.target.value)} />
      </FL>
      <FL label="Pre-Research">
        <textarea style={{ ...iS(), minHeight: "48px", resize: "vertical" }} value={f.preResearch || ""} onChange={e => set("preResearch", e.target.value)} />
      </FL>
      <FL label="Attach Document">
        <input ref={fR} type="file" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) set("attachmentName", e.target.files[0].name); }} />
        <button onClick={() => fR.current.click()} style={{ ...iS(), cursor: "pointer", textAlign: "left", color: f.attachmentName ? T.text : T.muted, border: `1.5px solid ${T.inputBorder}` }}>
          {f.attachmentName ? `📎 ${f.attachmentName}` : "📎 Click to attach..."}
        </button>
      </FL>
      <button style={b1()} onClick={() => { if (!f.title || !f.date) return; onSave(f); onClose(); }}>
        {editItem ? "Save Changes" : "Add Event"}
      </button>
      <button style={b2()} onClick={onClose}>Cancel</button>
    </Ov>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCAN MODAL
   ═══════════════════════════════════════════════════════════════════ */
function ScModal({ onClose, onAll }) {
  const fR = useRef();
  const [prev, sP] = useState(null);
  const [res,  sR] = useState(null);
  const [proc, sPr] = useState(false);

  const handle = file => {
    if (!file) return;
    sP(URL.createObjectURL(file)); sPr(true); sR(null);
    const r = new FileReader();
    r.onload = async e => {
      const b64 = e.target.result.split(",")[1];
      try {
        const resp = await fetch("/api/chat", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514", max_tokens: 800,
            messages: [{ role: "user", content: [
              { type: "image", source: { type: "base64", media_type: file.type || "image/jpeg", data: b64 } },
              { type: "text", text: `Extract events/deadlines. Return JSON: [{title,date(YYYY-MM-DD),category(${Object.keys(CATS).join("|")}),notes,expense(number)}]. ONLY JSON. If none:[].` },
            ] }],
          }),
        });
        const d = await resp.json();
        sR(JSON.parse((d.content?.map(c => c.text || "").join("") || "[]").replace(/```json|```/g, "").trim()));
      } catch { sR([]); }
      sPr(false);
    };
    r.readAsDataURL(file);
  };

  return (
    <Ov onClose={onClose} title="Scan Document" sub="Photo or upload — extract events instantly">
      {!prev && !proc && (
        <div>
          <input ref={fR} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handle(e.target.files?.[0])} />
          <button onClick={() => { fR.current.setAttribute("capture", "environment"); fR.current.click(); }} style={b1()}>📸 Take Photo</button>
          <button onClick={() => { fR.current.removeAttribute("capture"); fR.current.click(); }} style={b1({ background: "rgba(255,255,255,0.08)", color: T.text, marginTop: "8px" })}>📁 Upload File</button>
        </div>
      )}
      {prev && <div style={{ marginBottom: "14px" }}><img src={prev} alt="" style={{ width: "100%", borderRadius: "12px", maxHeight: "180px", objectFit: "cover" }} /></div>}
      {proc && <div className="pl" style={{ textAlign: "center", padding: "28px", color: T.pink, fontSize: "14px", fontFamily: "'Manrope', sans-serif" }}>🔍 Analysing document...</div>}
      {res && !proc && (
        res.length === 0
          ? <div style={{ textAlign: "center", padding: "20px", color: T.muted, fontFamily: "'Manrope', sans-serif" }}>
              No events detected.
              <button onClick={() => sP(null)} style={b1()}>Try Again</button>
            </div>
          : <div>
              {res.map((ev, i) => {
                const cat = CATS[ev.category] || CATS.other;
                return (
                  <div key={i} style={{ ...glass({ padding: "12px", marginBottom: "8px", borderLeft: `3px solid ${cat.c}` }), borderRadius: "12px" }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: T.text, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{cat.i} {ev.title}</div>
                    <div style={{ fontSize: "11px", color: T.muted, fontFamily: "'Manrope', sans-serif" }}>{ev.date}{ev.expense ? ` · ${ev.expense}` : ""}</div>
                  </div>
                );
              })}
              <button style={b1()} onClick={() => { onAll(res); onClose(); }}>Add All Events</button>
            </div>
      )}
      <button style={b2()} onClick={onClose}>Close</button>
    </Ov>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CONTACTS MODAL
   ═══════════════════════════════════════════════════════════════════ */
function CtModal({ onClose, contacts, onAdd, onDel, onEd, onGf, addItem }) {
  const [show, setShow] = useState(false);
  const [f, sF]         = useState({ name: "", birthday: "", relationship: "", interests: "", style: "", ageGroup: "", budget: "", avoid: "" });
  const set             = (k, v) => sF(p => ({ ...p, [k]: v }));
  const [vp, setVP]     = useState(false);

  const handleVoice = async (text) => {
    setVP(true); setShow(true);
    try {
      const res  = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 600,
          messages: [{ role: "user", content: `Parse contact info into JSON: {name,birthday(YYYY-MM-DD or ""),relationship,interests,style,ageGroup,budget,avoid}. Input: "${text}"` }],
        }),
      });
      const d      = await res.json();
      const parsed = JSON.parse((d.content?.map(c => c.text || "").join("") || "{}").replace(/```json|```/g, "").trim());
      sF(p => ({ ...p, ...Object.fromEntries(Object.entries(parsed).filter(([_, v]) => v)) }));
    } catch {}
    setVP(false);
  };

  const submit = () => {
    if (!f.name) return;
    onAdd({ ...f });
    if (f.birthday) {
      const bd = new Date(f.birthday + "T00:00:00");
      let nb   = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
      if (nb < today) nb = new Date(today.getFullYear() + 1, nb.getMonth(), nb.getDate());
      addItem({ title: `${f.name}'s Birthday`, category: "birthdays", date: toISO(nb), notes: `${f.relationship || "Contact"}.`, preResearch: gG(f).join(" · "), recurring: true, taskStatus: "todo" });
    }
    sF({ name: "", birthday: "", relationship: "", interests: "", style: "", ageGroup: "", budget: "", avoid: "" });
    setShow(false);
  };

  return (
    <Ov onClose={onClose} title="People & Birthdays">
      <div style={{ ...glass({ padding: "14px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "12px" }) }}>
        <MicBtn onResult={handleVoice} size={38} />
        <div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: T.text, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{vp ? "Parsing..." : "Speak to add a contact"}</div>
          <div style={{ fontSize: "11px", color: T.muted, fontFamily: "'Manrope', sans-serif" }}>e.g. "Sarah, my sister, born March 15, likes cooking"</div>
        </div>
      </div>

      {!show && <button onClick={() => setShow(true)} style={b1({ marginTop: 0, marginBottom: "14px" })}>+ Add Manually</button>}
      {show && (
        <div style={{ ...glass({ padding: "16px", marginBottom: "14px" }) }}>
          <FL label="Name *"><input style={iS()} value={f.name} onChange={e => set("name", e.target.value)} /></FL>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <FL label="Birthday"><input style={iS()} type="date" value={f.birthday} onChange={e => set("birthday", e.target.value)} /></FL>
            <FL label="Relationship"><input style={iS()} value={f.relationship} onChange={e => set("relationship", e.target.value)} /></FL>
          </div>
          <div style={{ fontSize: "11px", fontWeight: 700, color: T.pink, margin: "10px 0 8px", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Manrope', sans-serif" }}>🎁 Gift Profile</div>
          {GA.map(a => <FL key={a.k} label={a.l}><input style={iS()} placeholder={a.p} value={f[a.k]} onChange={e => set(a.k, e.target.value)} /></FL>)}
          <button style={b1()} onClick={submit}>Save Contact</button>
          <button style={b2()} onClick={() => setShow(false)}>Cancel</button>
        </div>
      )}

      {!contacts.length && !show && <Em text="No contacts yet." />}
      {contacts.map(c => {
        let dL = null;
        if (c.birthday) {
          const bd = new Date(c.birthday + "T00:00:00");
          let nb   = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
          if (nb < today) nb = new Date(today.getFullYear() + 1, nb.getMonth(), nb.getDate());
          dL = dU(toISO(nb));
        }
        return (
          <div key={c.id} style={{ ...glass({ padding: "12px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "10px" }) }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: T.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", fontWeight: 700, color: "#fff" }}>{c.name.charAt(0).toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "14px", fontWeight: 600, color: T.text, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{c.name}</div>
              <div style={{ fontSize: "11px", color: T.muted, fontFamily: "'Manrope', sans-serif" }}>{c.relationship || ""}{dL !== null ? ` · 🎂 ${dL === 0 ? "Today!" : `${dL}d`}` : ""}</div>
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
              <button onClick={() => onGf(c)} style={{ width: "28px", height: "28px", borderRadius: "8px", border: "1px solid rgba(214,51,132,0.2)", background: "rgba(214,51,132,0.1)", cursor: "pointer", fontSize: "12px" }}>🎁</button>
              <button onClick={() => onEd(c.id)} style={{ width: "28px", height: "28px", borderRadius: "8px", border: `1px solid ${T.border}`, background: T.card, cursor: "pointer", fontSize: "12px" }}>✏️</button>
              <button onClick={() => onDel(c.id)} style={{ width: "28px", height: "28px", borderRadius: "8px", border: "1px solid rgba(211,47,47,0.2)", background: "rgba(211,47,47,0.08)", cursor: "pointer", fontSize: "12px" }}>✕</button>
            </div>
          </div>
        );
      })}
      <button style={b2()} onClick={onClose}>Close</button>
    </Ov>
  );
}

function EdCtModal({ onClose, contact, onUpdate }) {
  const [f, sF] = useState({ ...contact });
  const set = (k, v) => sF(p => ({ ...p, [k]: v }));
  if (!contact) return null;
  return (
    <Ov onClose={onClose} title={`Edit: ${contact.name}`}>
      <FL label="Name"><input style={iS()} value={f.name} onChange={e => set("name", e.target.value)} /></FL>
      <FL label="Birthday"><input style={iS()} type="date" value={f.birthday || ""} onChange={e => set("birthday", e.target.value)} /></FL>
      <FL label="Relationship"><input style={iS()} value={f.relationship || ""} onChange={e => set("relationship", e.target.value)} /></FL>
      <div style={{ fontSize: "11px", fontWeight: 700, color: T.pink, margin: "10px 0 8px", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Manrope', sans-serif" }}>🎁 Gift Profile</div>
      {GA.map(a => <FL key={a.k} label={a.l}><input style={iS()} placeholder={a.p} value={f[a.k] || ""} onChange={e => set(a.k, e.target.value)} /></FL>)}
      <button style={b1()} onClick={() => { onUpdate(contact.id, f); onClose(); }}>Save</button>
      <button style={b2()} onClick={onClose}>Cancel</button>
    </Ov>
  );
}

function GfModal({ onClose, contact }) {
  const sug = useMemo(() => gG(contact), [contact]);
  const [aiG, setAG] = useState(null);
  const [aiL, setAL] = useState(false);

  const fetchAI = async () => {
    setAL(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 800,
          messages: [{ role: "user", content: `Gift ideas for ${contact.name}. Interests:${contact.interests || "?"}, Style:${contact.style || "?"}, Age:${contact.ageGroup || "?"}, Budget:${contact.budget || "flexible"}, Avoid:${contact.avoid || "none"}. Return JSON:[{name,price,reason}]. ONLY JSON.` }],
        }),
      });
      const d = await r.json();
      setAG(JSON.parse((d.content?.map(c => c.text || "").join("") || "[]").replace(/```json|```/g, "").trim()));
    } catch { setAG([]); }
    setAL(false);
  };

  return (
    <Ov onClose={onClose} title={`Gifts for ${contact.name}`}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
        {sug.map((g, i) => (
          <div key={i} style={{ ...glass({ padding: "10px", fontSize: "12px", color: T.sub, fontFamily: "'Manrope', sans-serif" }) }}>
            {["🎯","✨","💝","🎀","🌟","💫","🎊","🎁"][i % 8]} {g}
          </div>
        ))}
      </div>
      <button onClick={fetchAI} disabled={aiL} style={b1({ marginTop: 0 })}>{aiL ? "✨ Generating..." : "✨ AI Gift Ideas"}</button>
      {aiG && aiG.length > 0 && (
        <div style={{ marginTop: "14px" }}>
          {aiG.map((g, i) => (
            <div key={i} style={{ ...glass({ padding: "12px", marginBottom: "8px" }) }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: T.text, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{g.name}</span>
                {g.price && <span style={{ fontSize: "12px", fontWeight: 700, color: T.pink }}>~{g.price}</span>}
              </div>
              {g.reason && <div style={{ fontSize: "11px", color: T.muted, marginTop: "4px", fontFamily: "'Manrope', sans-serif" }}>{g.reason}</div>}
            </div>
          ))}
        </div>
      )}
      <button style={b2()} onClick={onClose}>Back</button>
    </Ov>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SETTINGS MODAL
   ═══════════════════════════════════════════════════════════════════ */
function SetModal({ onClose, family, setFamily, onSync, syncSt, currentUser, setCurrentUser }) {
  const [nm, setNm] = useState("");
  return (
    <Ov onClose={onClose} title="Settings">
      <div style={{ fontSize: "10px", fontWeight: 700, color: T.pink, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px", fontFamily: "'Manrope', sans-serif" }}>👤 My Identity</div>
      <FL label="Who are you? (for My Tasks)">
        <select style={{ ...iS(), cursor: "pointer" }} value={currentUser} onChange={e => setCurrentUser(e.target.value)}>
          <option value="">— Select —</option>
          {family.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </FL>

      <div style={{ fontSize: "10px", fontWeight: 700, color: T.pink, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px", marginTop: "8px", fontFamily: "'Manrope', sans-serif" }}>👨‍👩‍👧‍👦 Family Members</div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        <input
          style={{ ...iS(), flex: 1 }} placeholder="Add member name" value={nm}
          onChange={e => setNm(e.target.value)}
          onKeyDown={e => e.key === "Enter" && nm.trim() && (setFamily(p => [...p, { id: Date.now(), name: nm.trim() }]), setNm(""))}
        />
        <button onClick={() => { if (!nm.trim()) return; setFamily(p => [...p, { id: Date.now(), name: nm.trim() }]); setNm(""); }} style={{ padding: "8px 16px", borderRadius: "12px", background: T.gradient, color: "#fff", border: "none", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}>+</button>
      </div>
      {family.map(m => (
        <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", ...glass({ marginBottom: "6px", borderRadius: "12px" }) }}>
          <span style={{ flex: 1, fontSize: "14px", color: T.text, fontFamily: "'Manrope', sans-serif" }}>{m.name}</span>
          <button onClick={() => setFamily(p => p.filter(x => x.id !== m.id))} style={{ border: "none", background: "none", color: "#D32F2F", cursor: "pointer", fontSize: "16px" }}>✕</button>
        </div>
      ))}

      <div style={{ fontSize: "10px", fontWeight: 700, color: T.pink, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px", marginTop: "18px", fontFamily: "'Manrope', sans-serif" }}>📅 Calendar Export</div>
      <button onClick={() => onSync("ics")} style={b1({ marginTop: 0 })}>📲 Download .ics File</button>
      <p style={{ fontSize: "11px", color: T.muted, textAlign: "center", marginTop: "6px", fontFamily: "'Manrope', sans-serif" }}>Works with Apple Calendar, Samsung, Outlook & more</p>
      {syncSt === "ics" && <div style={{ fontSize: "12px", color: T.pink, textAlign: "center", marginTop: "6px" }}>✅ Downloaded!</div>}
      <button style={b2()} onClick={onClose}>Close</button>
    </Ov>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCREEN 1: HOME — DASHBOARD
   ═══════════════════════════════════════════════════════════════════ */
function HomeScreen({ items, family }) {
  const [dayTab, setDayTab] = useState("day");
  const todayItems = useMemo(() => items.filter(i => i.date === todayISO), [items]);
  const upcoming   = useMemo(() => items.filter(i => { const d = dU(i.date); return d > 0 && d <= 7; }).sort((a,b) => dU(a.date)-dU(b.date)), [items]);
  const topFocus   = useMemo(() => items.filter(i => dU(i.date) >= 0).sort((a,b) => dU(a.date)-dU(b.date)).slice(0,2), [items]);

  const dateStr = today.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  // Icon mapping per category type
  const catIcon = (cat) => {
    if (!cat) return null;
    const icons = { insurance:"🛡️", medical:"🏥", finances:"💳", ids:"🪪", contracts:"📝", kids:"🎒", birthdays:"🎂", home:"🏠", tax:"📊", subscriptions:"📱", vehicle:"🚗", other:"📌" };
    return icons[cat] || "📌";
  };

  // Schedule row with colored left border + time + avatar + icon (Stitch style)
  const ScheduleRow = ({ item }) => {
    const cat  = CATS[item.category] || CATS.other;
    const asgn = item.assignedTo ? family.find(f => f.id === item.assignedTo) : null;
    const colors = [T.pink, T.purple, T.teal];
    const avColor = colors[Math.abs((item.title||"").charCodeAt(0)) % colors.length];
    // Border color: teal for first priority, pink for others
    const borderColor = T.teal;
    return (
      <div className="fu" style={{
        display: "flex", alignItems: "center", gap: "0",
        marginBottom: "8px",
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        border: `1px solid rgba(255,255,255,0.08)`,
        borderRadius: "14px", overflow: "hidden",
      }}>
        {/* Colored left border accent */}
        <div style={{ width: "3px", alignSelf: "stretch", background: borderColor, borderRadius: "3px 0 0 3px", flexShrink: 0 }} />
        {/* Time */}
        <div style={{ padding: "14px 10px", minWidth: "62px", flexShrink: 0, textAlign: "right" }}>
          {item.time ? (
            <>
              <div style={{ fontSize: "12px", fontWeight: 700, color: T.text, fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.2 }}>{item.time}</div>
              <div style={{ fontSize: "10px", color: T.muted, fontFamily: "'Manrope', sans-serif" }}>
                {item.timeEnd ? `- ${item.timeEnd}` : ""}
              </div>
            </>
          ) : (
            <div style={{ fontSize: "10px", fontWeight: 600, color: T.muted, fontFamily: "'Manrope', sans-serif", lineHeight: 1.4, paddingTop: "4px" }}>All<br/>Day</div>
          )}
        </div>
        {/* Details */}
        <div style={{ flex: 1, padding: "14px 8px 14px 4px" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: T.text, fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: "2px" }}>{item.title}</div>
          {item.notes && <div style={{ fontSize: "11px", color: T.muted, fontFamily: "'Manrope', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.notes}</div>}
        </div>
        {/* Avatar chip */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", paddingRight: "14px", flexShrink: 0 }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "50%",
            background: avColor, border: "1.5px solid rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "11px", fontWeight: 700, color: "#fff",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            {asgn ? asgn.name.charAt(0).toUpperCase() : cat.i}
          </div>
          {/* Category icon */}
          <div style={{ fontSize: "14px", opacity: 0.7 }}>{catIcon(item.category)}</div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: "0 16px 140px" }}>
      {/* Spacer for fixed top bar */}
      <div style={{ height: "68px" }} />

      {/* Header card — Today date + weather + Day/Week toggle */}
      <div style={{
        padding: "20px 20px 18px", borderRadius: "24px", marginBottom: "24px",
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 8px 40px rgba(214,51,132,0.12), 0 2px 0 rgba(255,255,255,0.05) inset",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "38px", fontWeight: 800, color: T.text, lineHeight: 1 }}>Today</h1>
            <p style={{ fontSize: "13px", color: T.muted, marginTop: "4px", fontFamily: "'Manrope', sans-serif" }}>{dateStr}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "22px", fontWeight: 700, color: T.text, fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1 }}>—°C</div>
            <div style={{ fontSize: "20px", marginTop: "2px" }}>🌤️</div>
          </div>
        </div>
        {/* Day / Week pill toggle + Full View */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.07)", borderRadius: "22px", padding: "3px" }}>
            <button onClick={() => setDayTab("day")} style={{
              padding: "6px 18px", borderRadius: "18px", border: "none", cursor: "pointer",
              background: dayTab === "day" ? T.gradient : "transparent",
              color: dayTab === "day" ? "#fff" : T.muted,
              fontSize: "13px", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>Day</button>
            <span style={{ color: T.muted, fontSize: "13px", padding: "0 2px" }}>/</span>
            <button onClick={() => setDayTab("week")} style={{
              padding: "6px 18px", borderRadius: "18px", border: "none", cursor: "pointer",
              background: dayTab === "week" ? T.gradient : "transparent",
              color: dayTab === "week" ? "#fff" : T.muted,
              fontSize: "13px", fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>Week</button>
          </div>
          <button style={{
            padding: "6px 14px", borderRadius: "14px",
            background: "rgba(255,255,255,0.08)",
            border: `1px solid ${T.border}`,
            color: T.sub, fontSize: "12px", fontWeight: 600,
            fontFamily: "'Manrope', sans-serif", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "5px",
          }}>
            FULL VIEW
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>
      </div>

      {/* Daily Schedule */}
      <h2 style={{ fontFamily: "'Manrope', sans-serif", fontSize: "10px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>Daily Schedule</h2>
      {todayItems.length === 0
        ? <div style={{ ...glass({ padding: "20px", textAlign: "center", borderRadius: "14px", marginBottom: "24px" }) }}>
            <p style={{ color: T.muted, fontSize: "13px", fontFamily: "'Manrope', sans-serif" }}>No events today — enjoy your day! ✨</p>
          </div>
        : <div style={{ marginBottom: "24px" }}>
            {todayItems.map(item => <ScheduleRow key={item.id} item={item} />)}
          </div>
      }

      {/* Upcoming this week */}
      {upcoming.length > 0 && dayTab === "week" && (
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ fontFamily: "'Manrope', sans-serif", fontSize: "10px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>Coming This Week</h2>
          {upcoming.slice(0,5).map(item => <ScheduleRow key={item.id} item={item} />)}
        </div>
      )}

      {/* Top Focus pills */}
      {topFocus.length > 0 && (
        <div>
          <h2 style={{ fontFamily: "'Manrope', sans-serif", fontSize: "10px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>Top Focus</h2>
          <div style={{ display: "flex", gap: "10px" }}>
            {topFocus.map((item, idx) => {
              const bg = idx === 0 ? T.gradient : "linear-gradient(135deg,rgba(111,66,193,0.6) 0%,rgba(75,45,140,0.6) 100%)";
              const days = dU(item.date);
              return (
                <div key={item.id} style={{
                  flex: 1, padding: "16px 18px", borderRadius: "22px",
                  background: bg, position: "relative", overflow: "hidden",
                  border: idx === 0 ? "none" : `1px solid rgba(180,120,255,0.25)`,
                }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.3 }}>{item.title}</div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", marginTop: "4px", fontFamily: "'Manrope', sans-serif" }}>
                    {days < 0 ? "Overdue" : days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days} days`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {items.length === 0 && <Em text="No events yet. Tap + to add one, or ask the 🤖 assistant." />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCREEN 2: HOUSEHOLD VAULT
   ═══════════════════════════════════════════════════════════════════ */
function VaultScreen({ items }) {
  const [search, setSearch]           = useState("");
  const [activeFolder, setFolder]     = useState(null);

  const folderItems = useMemo(() => {
    const map = {};
    VAULT_FOLDERS.forEach(f => { map[f.key] = items.filter(i => f.cats.includes(i.category)); });
    return map;
  }, [items]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return items.filter(i => i.title.toLowerCase().includes(q) || (CATS[i.category]?.l || "").toLowerCase().includes(q));
  }, [items, search]);

  const activeFolderDef = VAULT_FOLDERS.find(f => f.key === activeFolder);

  return (
    <div style={{ padding: "0 16px 140px" }}>
      <div style={{ padding: "52px 0 20px" }}>
        <H1>Household Vault</H1>
        <p style={{ fontSize: "12px", color: T.muted, marginTop: "4px", fontFamily: "'Manrope', sans-serif" }}>Your family's documents & records</p>
      </div>

      {/* Search bar */}
      <div style={{ position: "relative", marginBottom: "24px" }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search Household..."
          style={{ ...iS(), padding: "14px 16px 14px 46px", borderRadius: "16px", fontSize: "15px" }}
        />
        <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "18px", opacity: 0.45 }}>🔍</span>
        {search && (
          <button onClick={() => setSearch("")} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: "16px" }}>✕</button>
        )}
      </div>

      {/* Search results */}
      {search.trim() ? (
        searchResults.length === 0
          ? <div style={{ textAlign: "center", padding: "28px", color: T.muted, fontFamily: "'Manrope', sans-serif", fontSize: "13px" }}>No results found for "{search}"</div>
          : searchResults.map(item => {
              const cat  = CATS[item.category] || CATS.other;
              const days = dU(item.date);
              return (
                <div key={item.id} className="fu" style={{ ...glass({ padding: "12px 14px", marginBottom: "8px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "12px" }) }}>
                  <div style={{ fontSize: "20px" }}>{cat.i}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: T.text, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{item.title}</div>
                    <div style={{ fontSize: "11px", color: T.muted, fontFamily: "'Manrope', sans-serif" }}>{cat.l} · {item.date}</div>
                  </div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: days < 0 ? T.pink : days <= 7 ? "#F59E0B" : T.muted }}>
                    {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Today" : days <= 30 ? `${days}d` : ""}
                  </div>
                </div>
              );
            })
      ) : (
        <>
          {/* 2×2 Folder grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
            {VAULT_FOLDERS.map(folder => {
              const count    = folderItems[folder.key]?.length || 0;
              const isActive = activeFolder === folder.key;
              return (
                <div key={folder.key}
                  onClick={() => setFolder(isActive ? null : folder.key)}
                  style={{
                    position: "relative", padding: "20px 16px",
                    borderRadius: "20px", cursor: "pointer", overflow: "hidden",
                    background: isActive
                      ? `linear-gradient(145deg,${folder.color}55,${folder.color}22)`
                      : T.card,
                    border: `1px solid ${isActive ? folder.color + "70" : T.border}`,
                    backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
                    transition: "all 0.22s",
                    boxShadow: isActive ? `0 8px 32px ${folder.color}25` : "none",
                  }}>
                  {/* Metallic sheen */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(to bottom,rgba(255,255,255,0.07),transparent)", borderRadius: "20px 20px 0 0", pointerEvents: "none" }} />
                  <div style={{ fontSize: "30px", marginBottom: "10px" }}>{folder.icon}</div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: T.text, fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: "4px" }}>{folder.label}</div>
                  <div style={{ fontSize: "11px", color: isActive ? "rgba(255,255,255,0.65)" : T.muted, fontFamily: "'Manrope', sans-serif" }}>{count} {count === 1 ? "item" : "items"}</div>
                </div>
              );
            })}
          </div>

          {/* Active folder contents */}
          {activeFolder && (
            <div className="fu">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <SectionLabel>{activeFolderDef?.label}</SectionLabel>
                <button onClick={() => setFolder(null)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: "18px" }}>✕</button>
              </div>
              {(folderItems[activeFolder] || []).length === 0
                ? <Em text={`No ${activeFolderDef?.label?.toLowerCase()} documents yet. Tap + to add.`} />
                : (folderItems[activeFolder] || []).map(item => {
                    const cat  = CATS[item.category] || CATS.other;
                    const days = dU(item.date);
                    return (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px", marginBottom: "8px", ...glass({ borderRadius: "14px", borderLeft: `2px solid ${cat.c}` }) }}>
                        <div style={{ fontSize: "22px" }}>{cat.i}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "14px", fontWeight: 600, color: T.text, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{item.title}</div>
                          <div style={{ fontSize: "11px", color: T.muted, fontFamily: "'Manrope', sans-serif" }}>{item.date}{item.recurring ? " · Yearly" : ""}</div>
                        </div>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: days < 0 ? T.pink : days <= 7 ? "#F59E0B" : T.muted }}>
                          {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Today" : days <= 30 ? `${days}d` : ""}
                        </div>
                      </div>
                    );
                  })
              }
            </div>
          )}

          {/* Recents (no active folder) */}
          {!activeFolder && items.length > 0 && (
            <div>
              <SectionLabel>Recent Items</SectionLabel>
              {items.sort((a, b) => dU(a.date) - dU(b.date)).slice(0, 8).map(item => {
                const cat  = CATS[item.category] || CATS.other;
                const days = dU(item.date);
                return (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", marginBottom: "8px", ...glass({ borderRadius: "12px" }) }}>
                    <div style={{ fontSize: "18px" }}>{cat.i}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: T.text, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{item.title}</div>
                      <div style={{ fontSize: "11px", color: T.muted, fontFamily: "'Manrope', sans-serif" }}>{cat.l} · {item.date}</div>
                    </div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: days < 0 ? T.pink : days <= 7 ? "#F59E0B" : T.muted }}>
                      {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Today" : days <= 30 ? `${days}d` : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {items.length === 0 && <Em text="No documents yet. Tap + to add your first item." />}
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCREEN 3: FAMILY CALENDAR
   ═══════════════════════════════════════════════════════════════════ */
function CalendarScreen({ items }) {
  const [cM, setCM]       = useState(today.getMonth());
  const [cY, setCY]       = useState(today.getFullYear());
  const [selDay, setSel]  = useState(null);
  const [daily, setDaily] = useState(false);

  const prev = () => { if (cM === 0) { setCM(11); setCY(cY - 1); } else setCM(cM - 1); };
  const next = () => { if (cM === 11) { setCM(0);  setCY(cY + 1); } else setCM(cM + 1); };

  const firstDay = new Date(cY, cM, 1);
  const lastDate = new Date(cY, cM + 1, 0).getDate();
  let   startDay = firstDay.getDay() - 1; if (startDay < 0) startDay = 6;
  const cells    = []; for (let i = 0; i < startDay; i++) cells.push(null); for (let d = 1; d <= lastDate; d++) cells.push(d);

  const dayMap = {};
  items.forEach(i => {
    const d = new Date(i.date + "T00:00:00");
    if (d.getMonth() === cM && d.getFullYear() === cY) {
      const day = d.getDate();
      if (!dayMap[day]) dayMap[day] = [];
      dayMap[day].push(i);
    }
  });

  const todayDay     = today.getMonth() === cM && today.getFullYear() === cY ? today.getDate() : null;
  const monthEvents  = useMemo(() => items.filter(i => { const d = new Date(i.date + "T00:00:00"); return d.getMonth() === cM && d.getFullYear() === cY; }).sort((a, b) => new Date(a.date) - new Date(b.date)), [items, cM, cY]);
  const selItems     = selDay ? dayMap[selDay] || [] : [];

  // Daily filtered view (Screen 6)
  if (daily && selDay) {
    const selDate    = new Date(cY, cM, selDay);
    const selDateStr = selDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    return (
      <div style={{ padding: "0 16px 140px" }}>
        <div style={{ padding: "52px 0 16px", display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => setDaily(false)} style={{ ...glass({ padding: "8px 14px", borderRadius: "12px", border: "none", cursor: "pointer", color: T.text, fontFamily: "'Manrope', sans-serif", fontSize: "13px", fontWeight: 600 }) }}>← Month</button>
          <div>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "20px", fontWeight: 700, color: T.text }}>{selDateStr.split(",")[0]}</h1>
            <p style={{ fontSize: "11px", color: T.muted, fontFamily: "'Manrope', sans-serif" }}>{selDateStr.split(",").slice(1).join(",").trim()}</p>
          </div>
        </div>
        {selItems.length === 0
          ? <Em text="No events on this day." />
          : selItems.map(item => {
              const cat = CATS[item.category] || CATS.other;
              return (
                <div key={item.id} className="fu" style={{ ...glass({ padding: "16px", marginBottom: "10px", borderRadius: "14px", borderLeft: `3px solid ${cat.c}` }) }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ fontSize: "24px" }}>{cat.i}</div>
                    <div>
                      <div style={{ fontSize: "15px", fontWeight: 700, color: T.text, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{item.title}</div>
                      <div style={{ fontSize: "11px", color: T.muted, fontFamily: "'Manrope', sans-serif" }}>{cat.l}{item.expense ? ` · ${item.expense}` : ""}{item.recurring ? " · Yearly" : ""}</div>
                    </div>
                  </div>
                  {item.notes && <div style={{ fontSize: "12px", color: T.sub, marginTop: "10px", lineHeight: 1.6, fontFamily: "'Manrope', sans-serif" }}>{item.notes}</div>}
                </div>
              );
            })
        }
      </div>
    );
  }

  return (
    <div style={{ padding: "0 16px 140px" }}>
      <div style={{ padding: "52px 0 20px" }}>
        <H1>Calendar</H1>
        <p style={{ fontSize: "12px", color: T.muted, marginTop: "4px", fontFamily: "'Manrope', sans-serif" }}>Family schedule</p>
      </div>

      {/* Month grid */}
      <div style={{ ...glass({ padding: "16px", marginBottom: "20px", borderRadius: "20px" }) }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <button onClick={prev} style={{ width: "32px", height: "32px", borderRadius: "10px", background: "rgba(255,255,255,0.08)", border: `1px solid ${T.border}`, color: T.text, fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "18px", fontWeight: 700, color: T.text }}>{MO[cM]} {cY}</span>
          <button onClick={next} style={{ width: "32px", height: "32px", borderRadius: "10px", background: "rgba(255,255,255,0.08)", border: `1px solid ${T.border}`, color: T.text, fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "2px", marginBottom: "6px" }}>
          {DH.map(d => <div key={d} style={{ textAlign: "center", fontSize: "10px", fontWeight: 700, color: T.muted, textTransform: "uppercase", padding: "4px 0", fontFamily: "'Manrope', sans-serif", letterSpacing: "0.05em" }}>{d}</div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "4px" }}>
          {cells.map((day, i) => {
            if (!day) return <div key={`e${i}`} />;
            const evts  = dayMap[day] || [];
            const isT   = day === todayDay;
            const isS   = day === selDay;
            return (
              <div key={day}
                onClick={() => { setSel(day === selDay ? null : day); setDaily(day !== selDay); }}
                style={{
                  borderRadius: "10px", padding: "6px 4px", minHeight: "44px", cursor: "pointer",
                  background: isS ? T.gradient : isT ? "rgba(214,51,132,0.15)" : "transparent",
                  border: isT && !isS ? `1px solid ${T.pink}` : "1px solid transparent",
                  transition: "all 0.15s",
                }}>
                <div style={{ fontSize: "12px", fontWeight: isT ? 700 : 500, color: isS ? "#fff" : isT ? T.pink : T.text, textAlign: "center", fontFamily: "'Manrope', sans-serif" }}>{day}</div>
                {evts.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "center", gap: "2px", marginTop: "4px", flexWrap: "wrap" }}>
                    {evts.slice(0, 3).map((ev, j) => (
                      <div key={j} style={{ width: "5px", height: "5px", borderRadius: "50%", background: isS ? "rgba(255,255,255,0.8)" : (CATS[ev.category]?.c || T.pink) }} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly event list (chronological scroll) */}
      <SectionLabel>{MO[cM]} {cY} — All Events</SectionLabel>
      {monthEvents.length === 0
        ? <Em text="No events this month." />
        : monthEvents.map(item => {
            const cat    = CATS[item.category] || CATS.other;
            const d      = new Date(item.date + "T00:00:00");
            const dayNum = d.getDate();
            return (
              <div key={item.id} style={{ display: "flex", gap: "12px", marginBottom: "10px", cursor: "pointer" }}
                onClick={() => { setSel(dayNum); setDaily(true); }}>
                <div style={{ width: "44px", flexShrink: 0, textAlign: "center", paddingTop: "4px" }}>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: T.text, fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1 }}>{dayNum}</div>
                  <div style={{ fontSize: "9px", color: T.muted, fontFamily: "'Manrope', sans-serif", textTransform: "uppercase" }}>{MO[d.getMonth()]}</div>
                </div>
                <div style={{ flex: 1, ...glass({ padding: "12px", borderRadius: "12px", borderLeft: `2px solid ${cat.c}` }) }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: T.text, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{cat.i} {item.title}</div>
                  <div style={{ fontSize: "11px", color: T.muted, fontFamily: "'Manrope', sans-serif", marginTop: "2px" }}>{cat.l}{item.expense ? ` · ${item.expense}` : ""}</div>
                </div>
              </div>
            );
          })
      }
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCREEN 4: TASKS (Kanban + My Tasks)
   ═══════════════════════════════════════════════════════════════════ */
function TasksScreen({ items, family, currentUser }) {
  const [tab, setTab] = useState("family");

  const COLS = [
    { id: "todo",     label: "To Do",      color: T.pink },
    { id: "discuss",  label: "To Discuss", color: "#F59E0B" },
    { id: "assigned", label: "Assigned",   color: T.purple },
  ];

  const byStatus = useMemo(() => ({
    todo:     items.filter(i => !i.taskStatus || i.taskStatus === "todo"),
    discuss:  items.filter(i => i.taskStatus === "discuss"),
    assigned: items.filter(i => i.taskStatus === "assigned"),
  }), [items]);

  const myItems = useMemo(() =>
    currentUser
      ? items.filter(i => i.assignedTo === currentUser && (!i.taskStatus || i.taskStatus === "todo"))
      : [],
  [items, currentUser]);

  const TaskCard = ({ item }) => {
    const cat  = CATS[item.category] || CATS.other;
    const asgn = item.assignedTo ? family.find(f => f.id === item.assignedTo) : null;
    const days = dU(item.date);
    return (
      <div className="fu" style={{ ...glass({ padding: "12px", marginBottom: "8px", borderRadius: "12px" }) }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
          <div style={{ fontSize: "16px", flexShrink: 0 }}>{cat.i}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: T.text, fontFamily: "'Plus Jakarta Sans', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
            <div style={{ display: "flex", gap: "5px", alignItems: "center", marginTop: "4px", flexWrap: "wrap" }}>
              {asgn && (
                <div style={{ background: T.gradient, borderRadius: "50%", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>{asgn.name.charAt(0)}</div>
              )}
              <span style={{ fontSize: "10px", color: days < 0 ? T.pink : days <= 3 ? "#F59E0B" : T.muted, fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>
                {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Today" : days === 1 ? "Tmrw" : `${days}d`}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: "0 0 140px" }}>
      {/* Header */}
      <div style={{ padding: "52px 16px 20px" }}>
        <H1>Tasks</H1>
        <p style={{ fontSize: "12px", color: T.muted, marginTop: "4px", fontFamily: "'Manrope', sans-serif" }}>Family coordination</p>
      </div>

      {/* Toggle */}
      <div style={{ display: "flex", margin: "0 16px 20px", background: "rgba(255,255,255,0.05)", borderRadius: "14px", padding: "4px", border: `1px solid ${T.border}` }}>
        {[{ id: "family", l: "Family Board" }, { id: "mine", l: "My Tasks" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "10px", borderRadius: "10px", border: "none",
            background: tab === t.id ? T.gradient : "transparent",
            color: tab === t.id ? "#fff" : T.muted,
            fontSize: "13px", fontWeight: 700, cursor: "pointer",
            fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.2s",
          }}>{t.l}</button>
        ))}
      </div>

      {/* Kanban — vertical stacked columns */}
      {tab === "family" && (
        <div style={{ padding: "0 16px" }}>
          {COLS.map(col => (
            <div key={col.id} style={{ marginBottom: "28px" }}>
              {/* Column header */}
              <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                marginBottom: "10px", padding: "8px 12px",
                background: `${col.color}18`,
                borderRadius: "10px",
                border: `1px solid ${col.color}35`,
              }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: col.color, flexShrink: 0, boxShadow: `0 0 6px ${col.color}` }} />
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "12px", fontWeight: 700, color: T.text, letterSpacing: "0.05em" }}>{col.label}</span>
                <div style={{ marginLeft: "auto", background: col.color, borderRadius: "10px", padding: "1px 8px", fontSize: "11px", fontWeight: 700, color: "#fff" }}>{byStatus[col.id].length}</div>
              </div>
              {byStatus[col.id].length === 0
                ? <div style={{ ...glass({ padding: "14px", textAlign: "center", borderRadius: "12px", border: `1px dashed ${T.border}` }) }}>
                    <p style={{ fontSize: "12px", color: T.muted, fontFamily: "'Manrope', sans-serif" }}>Nothing here yet</p>
                  </div>
                : byStatus[col.id].map(item => <TaskCard key={item.id} item={item} />)
              }
            </div>
          ))}
        </div>
      )}

      {/* My Tasks */}
      {tab === "mine" && (
        <div style={{ padding: "0 16px" }}>
          {!currentUser
            ? <div style={{ ...glass({ padding: "28px", textAlign: "center", borderRadius: "18px" }) }}>
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>👤</div>
                <p style={{ color: T.muted, fontSize: "13px", fontFamily: "'Manrope', sans-serif", lineHeight: 1.7 }}>Set your name in ⚙️ Settings to see your personal task list.</p>
              </div>
            : myItems.length === 0
              ? <Em text="No tasks assigned to you. Great job! 🎉" />
              : myItems.map(item => {
                  const cat  = CATS[item.category] || CATS.other;
                  const days = dU(item.date);
                  return (
                    <div key={item.id} className="fu" style={{
                      ...glass({ padding: "14px", marginBottom: "10px", borderRadius: "14px", borderLeft: `3px solid ${days < 0 ? T.pink : days <= 3 ? "#F59E0B" : T.purple}` }),
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ fontSize: "22px" }}>{cat.i}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "14px", fontWeight: 700, color: T.text, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{item.title}</div>
                          <div style={{ fontSize: "11px", color: T.muted, fontFamily: "'Manrope', sans-serif", marginTop: "2px" }}>{cat.l} · {item.date}</div>
                        </div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: days < 0 ? T.pink : days <= 3 ? "#F59E0B" : T.sub, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          {days < 0 ? `${Math.abs(days)}d late` : days === 0 ? "Today!" : days === 1 ? "Tmrw" : `${days}d`}
                        </div>
                      </div>
                      {item.notes && <div style={{ fontSize: "12px", color: T.sub, marginTop: "8px", lineHeight: 1.6, fontFamily: "'Manrope', sans-serif" }}>{item.notes}</div>}
                    </div>
                  );
                })
          }
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════════ */
export default function App() {
  const [items,       setItems]   = useState(() => ld("items", []));
  const [contacts,    setCts]     = useState(() => ld("contacts", []));
  const [family,      setFamRaw]  = useState(() => ld("family", []));
  const [currentUser, setCURaw]   = useState(() => ld("currentUser", ""));
  const [syncSt,      setSyncSt]  = useState(null);
  const dbReady = useRef(false);

  useEffect(() => {
    Promise.all([dbLoad("items", []), dbLoad("contacts", []), dbLoad("family", [])]).then(([it, ct, fm]) => {
      setItems(it); setCts(ct); setFamRaw(fm);
      setTimeout(() => { dbReady.current = true; }, 100);
    });
    const s1 = subscribeToKey("items",    v => { setItems(v);  sv("items", v); });
    const s2 = subscribeToKey("contacts", v => { setCts(v);    sv("contacts", v); });
    const s3 = subscribeToKey("family",   v => { setFamRaw(v); sv("family", v); });
    return () => { s1.unsubscribe(); s2.unsubscribe(); s3.unsubscribe(); };
  }, []);

  const [view,   setView]   = useState("home");
  const [modal,  setModal]  = useState(null);
  const [showAI, setShowAI] = useState(false);

  const setFam = v => { const nv = typeof v === "function" ? v(family) : v; setFamRaw(nv); sv("family", nv); if (dbReady.current) dbSave("family", nv); };
  const setCU  = v => { setCURaw(v); sv("currentUser", v); };

  useEffect(() => { sv("items",    items);    if (dbReady.current) dbSave("items",    items);    }, [items]);
  useEffect(() => { sv("contacts", contacts); if (dbReady.current) dbSave("contacts", contacts); }, [contacts]);

  const addItem = useCallback(i => setItems(p => [...p, { ...i, id: Date.now() + Math.random(), taskStatus: i.taskStatus || "todo" }]), []);
  const delItem = useCallback(id => setItems(p => p.filter(i => i.id !== id)), []);
  const updItem = useCallback((id, d) => setItems(p => p.map(i => i.id === id ? { ...i, ...d } : i)), []);
  const addCt   = useCallback(c => setCts(p => [...p, { ...c, id: Date.now() + Math.random() }]), []);
  const updCt   = useCallback((id, d) => setCts(p => p.map(c => c.id === id ? { ...c, ...d } : c)), []);
  const delCt   = useCallback(id => setCts(p => p.filter(c => c.id !== id)), []);

  const handleSync = (type) => {
    if (type === "ics") {
      let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Pulse//EN\n";
      items.forEach(i => {
        const d = i.date.replace(/-/g, "");
        ics += `BEGIN:VEVENT\nDTSTART;VALUE=DATE:${d}\nSUMMARY:${i.title}\nDESCRIPTION:${(i.notes || "").replace(/\n/g, "\\n")}\n${i.recurring ? "RRULE:FREQ=YEARLY\n" : ""}END:VEVENT\n`;
      });
      ics += "END:VCALENDAR";
      const blob = new Blob([ics], { type: "text/calendar" });
      const a    = document.createElement("a");
      a.href     = URL.createObjectURL(blob);
      a.download = "pulse-events.ics";
      a.click();
      setSyncSt("ics"); setTimeout(() => setSyncSt(null), 3000);
    }
  };

  const NAV = [
    { id: "home",     icon: "home",    label: "Home"            },
    { id: "vault",    icon: "vault",   label: "Household Vault" },
    { id: "calendar", icon: "cal",    label: "Calendar"        },
    { id: "tasks",    icon: "tasks",   label: "Task List"       },
  ];

  // SVG nav icons
  const NavIcon = ({ type, active }) => {
    const c = active ? T.pink : "rgba(255,255,255,0.38)";
    if (type === "home")  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/><path d="M9 21V12h6v9" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/></svg>;
    if (type === "vault") return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke={c} strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke={c} strokeWidth="1.8"/><path d="M12 9V7M12 17v-2M15 12h2M7 12h2" stroke={c} strokeWidth="1.6" strokeLinecap="round"/></svg>;
    if (type === "cal")   return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="2" stroke={c} strokeWidth="1.8"/><path d="M3 10h18M8 3v4M16 3v4" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>;
    if (type === "tasks") return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>;
    return null;
  };

  // Family avatar initials (top header)
  const headerFamily = family.slice(0, 3);


  return (
    <div className="app-container" style={{
      fontFamily: "'Manrope', sans-serif",
      background: T.bg, minHeight: "100vh",
      color: T.text, maxWidth: "600px", margin: "0 auto",
      position: "relative",
    }}>

      {/* Pure black base + subtle ambient glows (Obsidian Amethyst) */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", background: "#000000" }} />
      <div style={{ position: "fixed", top: "-20%", left: "-10%", width: "70vw", height: "70vw", background: "radial-gradient(circle,rgba(111,66,193,0.18) 0%,transparent 60%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", top: "5%", right: "-20%", width: "55vw", height: "55vw", background: "radial-gradient(circle,rgba(214,51,132,0.08) 0%,transparent 60%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: "15%", left: "-5%", width: "40vw", height: "40vw", background: "radial-gradient(circle,rgba(78,201,176,0.05) 0%,transparent 60%)", pointerEvents: "none", zIndex: 0 }} />

      {/* Global top bar: Pulse wordmark + avatar cluster + settings */}
      <div style={{
        position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: "600px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 18px", zIndex: 120,
        background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)",
      }}>
        {/* Pulse wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "22px", fontWeight: 800, letterSpacing: "-0.03em",
            background: T.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>Pulse</span>
          {/* Avatar cluster */}
          {headerFamily.length > 0 && (
            <div style={{ display: "flex", marginLeft: "4px" }}>
              {headerFamily.map((m, i) => {
                const colors = [T.pink, T.purple, T.teal];
                return (
                  <div key={m.id} style={{
                    width: "28px", height: "28px", borderRadius: "50%",
                    background: colors[i % colors.length],
                    border: "2px solid rgba(0,0,0,0.6)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "11px", fontWeight: 700, color: "#fff",
                    marginLeft: i > 0 ? "-6px" : 0, zIndex: 3 - i,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}>{m.name.charAt(0).toUpperCase()}</div>
                );
              })}
            </div>
          )}
        </div>
        {/* Settings gear */}
        <button onClick={() => setModal("settings")} style={{
          width: "36px", height: "36px", borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
          border: `1px solid ${T.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
        }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="rgba(255,255,255,0.75)" strokeWidth="1.8"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="rgba(255,255,255,0.75)" strokeWidth="1.8"/>
          </svg>
        </button>
      </div>

      {/* Screen content */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {view === "home"     && <HomeScreen     items={items} family={family} />}
        {view === "vault"    && <VaultScreen    items={items} />}
        {view === "calendar" && <CalendarScreen items={items} />}
        {view === "tasks"    && <TasksScreen    items={items} family={family} currentUser={currentUser} />}
      </div>

      {/* FAB — Add (pink gradient, bottom right) */}
      <button onClick={() => setModal("add")} style={{
        position: "fixed", bottom: "92px", right: "18px",
        width: "56px", height: "56px", borderRadius: "50%",
        background: T.gradient, color: "#fff", border: "none",
        fontSize: "30px", cursor: "pointer",
        boxShadow: "0 6px 28px rgba(214,51,132,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 200, fontWeight: 300, lineHeight: 1,
        transition: "transform 0.15s",
      }}>+</button>

      {/* FAB — AI */}
      <button onClick={() => setShowAI(!showAI)} style={{
        position: "fixed", bottom: "92px", left: "18px",
        width: "46px", height: "46px", borderRadius: "50%",
        background: showAI ? "rgba(211,47,47,0.85)" : "linear-gradient(135deg,#6F42C1,#4B2D8C)",
        color: "#fff", border: "none", fontSize: "20px", cursor: "pointer",
        boxShadow: "0 4px 20px rgba(111,66,193,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 200,
      }}>{showAI ? "✕" : "🤖"}</button>

      {/* Bottom navigation */}
      <nav style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: "600px",
        background: T.nav, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        borderTop: `1px solid ${T.border}`,
        display: "flex", padding: "10px 0 28px", zIndex: 150,
      }}>
        {NAV.map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)} style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", gap: "4px",
            background: "none", border: "none", cursor: "pointer",
            padding: "0", transition: "color 0.2s",
          }}>
            <NavIcon type={tab.icon} active={view === tab.id} />
            <span style={{
              fontSize: "9px", fontFamily: "'Manrope', sans-serif",
              fontWeight: 700, letterSpacing: "0.04em",
              color: view === tab.id ? T.pink : "rgba(255,255,255,0.38)",
              whiteSpace: "nowrap",
            }}>
              {tab.id === "vault" ? "Household Vault" : tab.label}
            </span>
            <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: view === tab.id ? T.pink : "transparent", transition: "background 0.2s" }} />
          </button>
        ))}
      </nav>

      {/* AI panel */}
      {showAI && <AIAssistant items={items} contacts={contacts} family={family} onClose={() => setShowAI(false)} />}

      {/* Modals */}
      {modal === "add"       && <EvModal onClose={() => setModal(null)} onSave={addItem} contacts={contacts} family={family} />}
      {modal?.type === "edit"&& <EvModal onClose={() => setModal(null)} onSave={d => updItem(modal.item.id, d)} contacts={contacts} family={family} editItem={modal.item} />}
      {modal === "scan"      && <ScModal onClose={() => setModal(null)} onAll={evts => { evts.forEach(addItem); setModal(null); }} />}
      {modal === "contact"   && <CtModal onClose={() => setModal(null)} contacts={contacts} onAdd={addCt} onDel={delCt} onEd={id => setModal({ type: "ec", id })} onGf={c => setModal({ type: "g", contact: c })} addItem={addItem} />}
      {modal?.type === "ec"  && <EdCtModal onClose={() => setModal("contact")} contact={contacts.find(c => c.id === modal.id)} onUpdate={updCt} />}
      {modal?.type === "g"   && <GfModal onClose={() => setModal("contact")} contact={modal.contact} />}
      {modal === "settings"  && <SetModal onClose={() => setModal(null)} family={family} setFamily={setFam} onSync={handleSync} syncSt={syncSt} currentUser={currentUser} setCurrentUser={setCU} />}
    </div>
  );
}
