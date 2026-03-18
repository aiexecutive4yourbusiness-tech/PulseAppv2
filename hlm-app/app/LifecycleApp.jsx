"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════════
   HOUSEHOLD LIFECYCLE MANAGER v4 — VOICE + AI ASSISTANT
   Features: Voice I/O, AI Assistant, Themes, Calendar Sync,
   Family Dashboard, Expense Tracking, Doc Scan, Gift Profiling
   ═══════════════════════════════════════════════════════════════════ */

// ─── THEMES ───────────────────────────────────────────────────────
const THEMES={
  swiss:{name:"Swiss",pr:"#D52B1E",se:"#1A1A2E",ac:"#E8C547",bg:"#F5F3EF",cd:"#FFF",tx:"#1A1A2E",mt:"#7B8794",bd:"#E4E1DB",hg:"linear-gradient(135deg,#D52B1E 0%,#A31D16 50%,#1A1A2E 100%)"},
  ocean:{name:"Ocean",pr:"#0077B6",se:"#023E8A",ac:"#48CAE4",bg:"#F0F7FA",cd:"#FFF",tx:"#023047",mt:"#6B8FA3",bd:"#D4E6F0",hg:"linear-gradient(135deg,#0077B6 0%,#023E8A 60%,#001D3D 100%)"},
  sunset:{name:"Sunset",pr:"#E85D04",se:"#9D0208",ac:"#FFBA08",bg:"#FFF8F0",cd:"#FFF",tx:"#370617",mt:"#8B7355",bd:"#F0DCC8",hg:"linear-gradient(135deg,#E85D04 0%,#DC2F02 50%,#9D0208 100%)"},
  forest:{name:"Forest",pr:"#2D6A4F",se:"#1B4332",ac:"#95D5B2",bg:"#F0F5F1",cd:"#FFF",tx:"#1B4332",mt:"#6B8F7B",bd:"#D4E5DA",hg:"linear-gradient(135deg,#2D6A4F 0%,#1B4332 60%,#081C15 100%)"},
  teal:{name:"Teal",pr:"#20918F",se:"#02051D",ac:"#4ECDC4",bg:"#F2F4F3",cd:"#FFF",tx:"#1A1D23",mt:"#7B8794",bd:"#E4E8EC",hg:"linear-gradient(135deg,#20918F 0%,#0E6463 60%,#02051D 100%)"},
};
const DK={bg:"#0F1117",cd:"#1A1D27",tx:"#E4E8EC",mt:"#6B7280",bd:"#2A2E3A"};
const CATS={insurance:{l:"Insurance",i:"🛡️",c:"#20918F"},contracts:{l:"Contracts",i:"📝",c:"#3D7EE8"},kids:{l:"Kids & School",i:"🎒",c:"#E8853D"},birthdays:{l:"Birthdays",i:"🎂",c:"#C24B8B"},home:{l:"Home",i:"🏠",c:"#5B6ABF"},tax:{l:"Tax & Finance",i:"📊",c:"#4A5568"},subscriptions:{l:"Subscriptions",i:"📱",c:"#6B8E6B"},health:{l:"Health",i:"🏥",c:"#D32F2F"},vehicle:{l:"Vehicle",i:"🚗",c:"#8B6914"},other:{l:"Other",i:"📌",c:"#7B7B8B"}};
const GA=[{k:"interests",l:"Main Interests",p:"e.g. cooking, hiking"},{k:"style",l:"Style",p:"e.g. minimalist"},{k:"ageGroup",l:"Age Group",p:"e.g. 30s, kid"},{k:"budget",l:"Budget CHF",p:"e.g. 50-100"},{k:"avoid",l:"Avoid",p:"e.g. no chocolate"}];
const GDB={cooking:["Olive oil set","Cookbook","Cooking class","Japanese knife"],hiking:["Merino socks","Trail snacks","Thermos","Headlamp"],tech:["Wireless earbuds","Smart gadget","USB-C hub"],reading:["Book gift card","Book light","Bookmark"],music:["Concert tickets","Bluetooth speaker"],sports:["Massage gun","Gym bag","Watch band"],wellness:["Spa voucher","Essential oils","Sleep mask"],kid:["LEGO set","Board game","Art supplies","Science kit"],teenager:["Gift card","Tech accessory","Experience voucher"],default:["Gift card","Experience voucher","Photo gift","Swiss chocolate","Flowers"]};

const today=new Date(),todayISO=today.toISOString().split("T")[0];
const toISO=d=>d.toISOString().split("T")[0];
const MO=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DH=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const dU=ds=>{const t=new Date(ds+"T00:00:00"),n=new Date(today.toDateString());return Math.ceil((t-n)/864e5)};
const uL=d=>d<0?"overdue":d<=7?"critical":d<=30?"warning":d<=60?"upcoming":"relaxed";
const uC={overdue:"#D32F2F",critical:"#E53935",warning:"#E8853D",upcoming:"#20918F",relaxed:"#94A3A8"};
function gG(a){const s=new Set();[...(a.interests||"").toLowerCase().split(/[,;]+/),...(a.style||"").toLowerCase().split(/[,;]+/),...(a.ageGroup||"").toLowerCase().split(/[,;]+/)].filter(Boolean).forEach(k=>Object.entries(GDB).forEach(([dk,gs])=>{if(k.includes(dk)||dk.includes(k))gs.forEach(g=>s.add(g))}));if(s.size<3)GDB.default.forEach(g=>s.add(g));const av=(a.avoid||"").toLowerCase();return[...s].filter(g=>!av||!av.split(/[,;]+/).some(x=>g.toLowerCase().includes(x.trim()))).slice(0,8)}
const ld=(k,d)=>{try{const v=localStorage.getItem("hlm4_"+k);return v?JSON.parse(v):d}catch{return d}};
const sv=(k,v)=>{try{localStorage.setItem("hlm4_"+k,JSON.stringify(v))}catch{}};

// Fonts and base styles are handled by layout.js + globals.css

// ─── Style helpers ────────────────────────────────────────────────
const iS=t=>({width:"100%",padding:"10px 12px",borderRadius:"10px",border:`1.5px solid ${t.bd}`,fontSize:"14px",fontFamily:"'DM Sans',sans-serif",background:t.cd,color:t.tx,boxSizing:"border-box"});
const b1=t=>({width:"100%",padding:"12px",borderRadius:"12px",border:"none",background:t.hg,color:"#fff",fontSize:"15px",fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",marginTop:"8px"});
const b2=t=>({width:"100%",padding:"10px",borderRadius:"10px",border:"none",background:"transparent",color:t.mt,fontSize:"13px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",marginTop:"4px"});

// ─── Shared components ────────────────────────────────────────────
const Ov=({onClose,children,title,sub,t})=>(<div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(3px)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:200}}><div onClick={e=>e.stopPropagation()} style={{background:t.cd,color:t.tx,borderRadius:"24px 24px 0 0",padding:"24px 22px 32px",width:"100%",maxWidth:"520px",maxHeight:"88vh",overflowY:"auto",boxShadow:"0 -8px 40px rgba(0,0,0,0.2)"}}><div style={{width:"36px",height:"4px",background:t.bd,borderRadius:"2px",margin:"0 auto 16px"}}/>{title&&<h3 style={{fontFamily:"'Fraunces',serif",fontSize:"20px",fontWeight:700,marginBottom:"2px"}}>{title}</h3>}{sub&&<p style={{fontSize:"12px",color:t.mt,marginBottom:"16px"}}>{sub}</p>}{children}</div></div>);
const FL=({label,children})=>(<div style={{marginBottom:"14px"}}><label style={{fontSize:"11px",fontWeight:600,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:"5px"}}>{label}</label>{children}</div>);
const Em=({text,t})=>(<div style={{textAlign:"center",padding:"44px 20px",color:t.mt}}><div style={{fontSize:"36px",marginBottom:"10px"}}>📭</div><div style={{fontSize:"14px",lineHeight:1.5}}>{text}</div></div>);
const FP=({a,o,children,t})=><button onClick={o} style={{padding:"5px 8px",borderRadius:"14px",fontSize:"12px",border:a?`1.5px solid ${t.pr}`:"1.5px solid transparent",background:a?t.pr+"18":t.cd,color:a?t.pr:t.mt,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>{children}</button>;

// ═══════════════════════════════════════════════════════════════════
// VOICE INPUT HOOK (Web Speech API)
// ═══════════════════════════════════════════════════════════════════
function useVoice() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recRef = useRef(null);

  const startListening = useCallback((onResult) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Speech recognition not supported in this browser. Try Chrome."); return; }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = ""; // auto-detect
    rec.onstart = () => setListening(true);
    rec.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join("");
      setTranscript(t);
      if (e.results[0].isFinal && onResult) onResult(t);
    };
    rec.onerror = () => { setListening(false); setTranscript(""); };
    rec.onend = () => { setListening(false); };
    recRef.current = rec;
    rec.start();
  }, []);

  const stopListening = useCallback(() => {
    if (recRef.current) recRef.current.stop();
    setListening(false);
  }, []);

  return { listening, transcript, startListening, stopListening };
}

// ═══════════════════════════════════════════════════════════════════
// TEXT-TO-SPEECH
// ═══════════════════════════════════════════════════════════════════
function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  // Try to pick a good voice
  const voices = window.speechSynthesis.getVoices();
  const enVoice = voices.find(v => v.lang.startsWith("en") && v.name.includes("Google")) || voices.find(v => v.lang.startsWith("en"));
  if (enVoice) u.voice = enVoice;
  u.rate = 1.0;
  u.pitch = 1.0;
  window.speechSynthesis.speak(u);
}

// ═══════════════════════════════════════════════════════════════════
// MIC BUTTON (reusable)
// ═══════════════════════════════════════════════════════════════════
function MicBtn({ onResult, t, size = 32 }) {
  const { listening, transcript, startListening, stopListening } = useVoice();
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: "6px" }}>
      <button
        onClick={() => listening ? stopListening() : startListening(onResult)}
        className={listening ? "mic-pulse" : ""}
        style={{
          width: `${size}px`, height: `${size}px`, borderRadius: "50%",
          background: listening ? "#D32F2F" : t.pr + "18",
          color: listening ? "#fff" : t.pr, border: "none",
          cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: `${size * 0.45}px`,
          transition: "all 0.2s", flexShrink: 0,
        }}
        title={listening ? "Stop" : "Speak"}
      >🎙️</button>
      {listening && transcript && (
        <div style={{
          position: "absolute", bottom: `${size + 6}px`, left: "50%", transform: "translateX(-50%)",
          background: t.cd, color: t.tx, padding: "8px 12px", borderRadius: "10px",
          fontSize: "12px", boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          border: `1px solid ${t.bd}`, whiteSpace: "nowrap", maxWidth: "250px",
          overflow: "hidden", textOverflow: "ellipsis", zIndex: 50,
        }}>{transcript}</div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// AI ASSISTANT PANEL
// ═══════════════════════════════════════════════════════════════════
function AIAssistant({ items, contacts, family, t, onClose }) {
  const [msgs, setMsgs] = useState([{ role: "assistant", text: "Hi! I'm your Pulse assistant. Ask me anything about your events, expenses, birthdays, or schedules. You can also speak to me! 🎙️" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef();
  const { listening, transcript, startListening, stopListening } = useVoice();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs]);

  const buildContext = () => {
    const evtSummary = items.map(i => `- ${i.title} | ${i.date} | ${CATS[i.category]?.l || i.category} | ${i.assignedTo ? family.find(f => f.id === i.assignedTo)?.name || "?" : "unassigned"} | CHF ${i.expense || 0}${i.recurring ? " (yearly)" : ""}${i.notes ? " | Notes: " + i.notes : ""}`).join("\n");
    const contactSummary = contacts.map(c => `- ${c.name} | ${c.relationship || "?"} | Birthday: ${c.birthday || "?"} | Interests: ${c.interests || "?"}`).join("\n");
    const familySummary = family.map(f => f.name).join(", ");
    const totalExpense = items.reduce((s, i) => s + (i.expense || 0), 0);
    return `You are a helpful household lifecycle assistant. Answer questions about the user's events, contacts, expenses, and schedules. Be concise and friendly. Today is ${todayISO}.

EVENTS (${items.length} total, CHF ${totalExpense} total expenses):
${evtSummary || "No events yet."}

CONTACTS (${contacts.length}):
${contactSummary || "No contacts yet."}

FAMILY MEMBERS: ${familySummary || "None set up yet."}

Answer naturally. If asked about gifts, use contact profiles. If asked about costs, sum up relevant expenses. Always be specific with dates and amounts.`;
  };

  const send = async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: "user", text: text.trim() };
    const updatedMsgs = [...msgs, userMsg];
    setMsgs(updatedMsgs);
    setInput("");
    setLoading(true);
    try {
      // Build full conversation history (skip the initial assistant greeting)
      const history = updatedMsgs
        .filter(m => !(m.role === "assistant" && updatedMsgs.indexOf(m) === 0))
        .map(m => ({ role: m.role, content: m.text }));
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          system: buildContext(),
          messages: history,
        }),
      });
      const data = await res.json();
      const reply = data.content?.map(c => c.text || "").join("") || "Sorry, I couldn't process that.";
      setMsgs(p => [...p, { role: "assistant", text: reply }]);
      speak(reply);
    } catch {
      setMsgs(p => [...p, { role: "assistant", text: "Sorry, something went wrong. Try again." }]);
    }
    setLoading(false);
  };

  const handleVoiceResult = (text) => { if (text) send(text); };

  return (
    <div style={{ position: "fixed", bottom: 0, right: 0, width: "100%", maxWidth: "400px", height: "60vh", maxHeight: "500px", background: t.cd, borderRadius: "20px 20px 0 0", boxShadow: "0 -8px 40px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", zIndex: 250, border: `1px solid ${t.bd}` }}>
      {/* Header */}
      <div style={{ padding: "14px 18px", borderBottom: `1px solid ${t.bd}`, display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: t.hg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>🤖</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: t.tx }}>Pulse Assistant</div>
          <div style={{ fontSize: "10px", color: t.mt }}>Ask anything · Voice enabled</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: t.mt }}>✕</button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "14px 18px" }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: "10px" }}>
            <div style={{
              maxWidth: "85%", padding: "10px 14px", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              background: m.role === "user" ? t.pr : t.bd + "60",
              color: m.role === "user" ? "#fff" : t.tx, fontSize: "13px", lineHeight: 1.5,
            }}>
              {m.text}
              {m.role === "assistant" && i > 0 && (
                <button onClick={() => speak(m.text)} style={{ display: "block", marginTop: "6px", background: "none", border: "none", fontSize: "11px", color: t.pr, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                  🔊 Listen
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && <div className="pl" style={{ fontSize: "13px", color: t.mt, padding: "8px 0" }}>🤖 Thinking...</div>}
      </div>

      {/* Input */}
      <div style={{ padding: "12px 18px", borderTop: `1px solid ${t.bd}`, display: "flex", gap: "8px", alignItems: "center" }}>
        <input
          value={listening ? transcript : input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send(input)}
          placeholder={listening ? "Listening..." : "Ask me anything..."}
          style={{ flex: 1, padding: "10px 14px", borderRadius: "12px", border: `1.5px solid ${listening ? "#D32F2F" : t.bd}`, fontSize: "14px", fontFamily: "'DM Sans',sans-serif", background: listening ? "#D32F2F08" : t.cd, color: t.tx }}
        />
        <button
          onClick={() => listening ? stopListening() : startListening(handleVoiceResult)}
          className={listening ? "mic-pulse" : ""}
          style={{
            width: "40px", height: "40px", borderRadius: "50%",
            background: listening ? "#D32F2F" : t.pr + "15",
            color: listening ? "#fff" : t.pr, border: "none",
            cursor: "pointer", fontSize: "18px", flexShrink: 0,
          }}
        >🎙️</button>
        <button
          onClick={() => send(input)}
          disabled={loading}
          style={{ width: "40px", height: "40px", borderRadius: "50%", background: t.hg, color: "#fff", border: "none", cursor: "pointer", fontSize: "16px", flexShrink: 0 }}
        >→</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// EVENT CARD
// ═══════════════════════════════════════════════════════════════════
function EC({item,exp,onT,onD,family,t,onE}) {
  const days=dU(item.date),urg=uL(days),uc=uC[urg],cat=CATS[item.category]||CATS.other;
  const dt=days<0?`${Math.abs(days)}d overdue`:days===0?"Today!":days===1?"Tomorrow":`${days}d`;
  const ds=new Date(item.date+"T00:00:00").toLocaleDateString("en-CH",{day:"numeric",month:"short"});
  const asgn=item.assignedTo?family.find(f=>f.id===item.assignedTo):null;
  return(<div className="fu" onClick={onT} style={{background:t.cd,borderRadius:"14px",marginBottom:"10px",boxShadow:exp?"0 6px 20px rgba(0,0,0,0.07)":"0 1px 3px rgba(0,0,0,0.04)",border:`1px solid ${urg==="overdue"||urg==="critical"?uc+"25":t.bd}`,cursor:"pointer",overflow:"hidden",transition:"all 0.2s"}}>
    <div style={{display:"flex",alignItems:"center",gap:"12px",padding:"14px 16px"}}>
      <div style={{width:"40px",height:"40px",borderRadius:"12px",background:cat.c+"14",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",flexShrink:0}}>{cat.i}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:"14px",fontWeight:600,lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:t.tx}}>{item.title}</div>
        <div style={{fontSize:"11px",color:t.mt,marginTop:"3px",display:"flex",gap:"6px",alignItems:"center",flexWrap:"wrap"}}>
          <span>{ds}</span>{item.recurring&&<span style={{background:t.pr+"18",color:t.pr,padding:"1px 6px",borderRadius:"4px",fontSize:"9px",fontWeight:600}}>↻</span>}
          {asgn&&<span>· 👤 {asgn.name}</span>}{item.expense>0&&<span>· CHF {item.expense}</span>}
        </div></div>
      <div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:"14px",fontWeight:700,color:uc}}>{dt}</div><div style={{fontSize:"9px",textTransform:"uppercase",letterSpacing:"0.5px",color:uc,fontWeight:600,marginTop:"2px"}}>{urg}</div></div>
    </div>
    {exp&&(<div style={{padding:"0 16px 16px",borderTop:`1px solid ${t.bd}`}}>
      {item.notes&&<p style={{fontSize:"13px",color:t.mt,marginTop:"12px",lineHeight:1.6}}>{item.notes}</p>}
      {item.preResearch&&<div style={{background:t.pr+"0A",borderRadius:"10px",padding:"14px",marginTop:"12px",border:`1px solid ${t.pr}20`}}><div style={{fontSize:"11px",fontWeight:700,color:t.pr,textTransform:"uppercase",letterSpacing:"0.7px",marginBottom:"6px"}}>💡 Pre-Research</div><div style={{fontSize:"12.5px",lineHeight:1.6,color:t.tx}}>{item.preResearch}</div></div>}
      {item.attachmentName&&<div style={{marginTop:"10px",padding:"8px 12px",background:t.bd+"50",borderRadius:"8px",fontSize:"12px"}}>📎 {item.attachmentName}</div>}
      <div style={{display:"flex",gap:"8px",marginTop:"14px",justifyContent:"flex-end"}}>
        <button onClick={e=>{e.stopPropagation();onE(item)}} style={{fontSize:"11px",padding:"5px 14px",borderRadius:"8px",background:t.pr+"12",color:t.pr,border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>Edit</button>
        <button onClick={e=>{e.stopPropagation();onD(item.id)}} style={{fontSize:"11px",padding:"5px 14px",borderRadius:"8px",background:"#FFF0F0",color:"#D32F2F",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>Remove</button>
      </div></div>)}
  </div>);
}

// ═══════════════════════════════════════════════════════════════════
// ADD/EDIT EVENT MODAL (with voice)
// ═══════════════════════════════════════════════════════════════════
function EvModal({onClose,onSave,contacts,family,t,editItem}) {
  const[f,sF]=useState(editItem||{title:"",category:"insurance",date:"",notes:"",preResearch:"",contactId:"",assignedTo:"",recurring:false,expense:0,attachmentName:""});
  const set=(k,v)=>sF(p=>({...p,[k]:v}));
  const fR=useRef();
  const[voiceParsing,setVP]=useState(false);

  // Voice: parse natural language into form fields
  const handleVoice=async(text)=>{
    setVP(true);
    try{
      const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:`Parse this spoken input into event fields. Return ONLY JSON: {title,category(insurance|contracts|kids|birthdays|home|tax|subscriptions|health|vehicle|other),date(YYYY-MM-DD),notes,expense(number),recurring(boolean)}. Use year ${today.getFullYear()} if not specified. Input: "${text}"`}]})});
      const d=await res.json();const txt=d.content?.map(c=>c.text||"").join("")||"{}";
      const parsed=JSON.parse(txt.replace(/```json|```/g,"").trim());
      if(parsed.title)set("title",parsed.title);if(parsed.category)set("category",parsed.category);
      if(parsed.date)set("date",parsed.date);if(parsed.notes)set("notes",parsed.notes);
      if(parsed.expense)set("expense",parsed.expense);if(parsed.recurring!==undefined)set("recurring",parsed.recurring);
    }catch{}setVP(false);
  };

  return(<Ov onClose={onClose} title={editItem?"Edit Event":"Add Event"} sub="Fill in manually or tap 🎙️ to speak" t={t}>
    {/* Voice input banner */}
    <div style={{background:t.pr+"0A",borderRadius:"12px",padding:"14px",marginBottom:"16px",display:"flex",alignItems:"center",gap:"12px",border:`1px solid ${t.pr}18`}}>
      <MicBtn onResult={handleVoice} t={t} size={38}/>
      <div><div style={{fontSize:"13px",fontWeight:600,color:t.tx}}>{voiceParsing?"Parsing your input...":"Speak to fill in the form"}</div><div style={{fontSize:"11px",color:t.mt}}>e.g. "Car insurance renewal on January 1st, costs 1200 francs yearly"</div></div>
    </div>
    <FL label="Title *"><input style={iS(t)} placeholder="e.g. Car insurance" value={f.title} onChange={e=>set("title",e.target.value)}/></FL>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
      <FL label="Category"><select style={{...iS(t),cursor:"pointer"}} value={f.category} onChange={e=>set("category",e.target.value)}>{Object.entries(CATS).map(([k,v])=><option key={k} value={k}>{v.i} {v.l}</option>)}</select></FL>
      <FL label="Date *"><input style={iS(t)} type="date" value={f.date} onChange={e=>set("date",e.target.value)}/></FL>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
      <FL label="Assign to"><select style={{...iS(t),cursor:"pointer"}} value={f.assignedTo} onChange={e=>set("assignedTo",e.target.value)}><option value="">— Unassigned —</option>{family.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></FL>
      <FL label="Cost (CHF)"><input style={iS(t)} type="number" placeholder="0" value={f.expense||""} onChange={e=>set("expense",parseFloat(e.target.value)||0)}/></FL>
    </div>
    <label style={{display:"flex",alignItems:"center",gap:"6px",fontSize:"13px",cursor:"pointer",color:t.tx,marginBottom:"14px"}}><input type="checkbox" checked={f.recurring} onChange={e=>set("recurring",e.target.checked)} style={{accentColor:t.pr}}/> Recurring (yearly)</label>
    <FL label="Notes"><textarea style={{...iS(t),minHeight:"50px",resize:"vertical"}} value={f.notes} onChange={e=>set("notes",e.target.value)}/></FL>
    <FL label="Pre-Research"><textarea style={{...iS(t),minHeight:"50px",resize:"vertical"}} value={f.preResearch} onChange={e=>set("preResearch",e.target.value)}/></FL>
    <FL label="Attach Document"><input ref={fR} type="file" style={{display:"none"}} onChange={e=>{if(e.target.files?.[0])set("attachmentName",e.target.files[0].name)}}/><button onClick={()=>fR.current.click()} style={{...iS(t),cursor:"pointer",textAlign:"left",color:f.attachmentName?t.tx:t.mt}}>{f.attachmentName?`📎 ${f.attachmentName}`:"📎 Click to attach..."}</button></FL>
    <button style={b1(t)} onClick={()=>{if(!f.title||!f.date)return;onSave(f);onClose()}}>{editItem?"Save Changes":"Add Event"}</button>
    <button style={b2(t)} onClick={onClose}>Cancel</button>
  </Ov>);
}

// ═══════════════════════════════════════════════════════════════════
// SCAN MODAL
// ═══════════════════════════════════════════════════════════════════
function ScModal({onClose,t,onAll}) {
  const fR=useRef();const[prev,sP]=useState(null);const[res,sR]=useState(null);const[proc,sPr]=useState(false);
  const handle=file=>{if(!file)return;sP(URL.createObjectURL(file));sPr(true);sR(null);const r=new FileReader();r.onload=async e=>{const b64=e.target.result.split(",")[1];try{const resp=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:[{type:"image",source:{type:"base64",media_type:file.type||"image/jpeg",data:b64}},{type:"text",text:`Extract events/deadlines from this image. Return JSON array: [{title,date(YYYY-MM-DD),category(insurance|contracts|kids|birthdays|home|tax|subscriptions|health|vehicle|other),notes,expense(number or 0)}]. ONLY JSON. If none:[].`}]}]})});const d=await resp.json();sR(JSON.parse((d.content?.map(c=>c.text||"").join("")||"[]").replace(/```json|```/g,"").trim()))}catch{sR([])}sPr(false)};r.readAsDataURL(file)};
  return(<Ov onClose={onClose} title="Scan Document" sub="Photo or upload" t={t}>
    {!prev&&!proc&&<div><input ref={fR} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handle(e.target.files?.[0])}/><button onClick={()=>{fR.current.setAttribute("capture","environment");fR.current.click()}} style={{...b1(t),marginTop:0}}>📸 Take Photo</button><button onClick={()=>{fR.current.removeAttribute("capture");fR.current.click()}} style={{...b1(t),background:t.cd,color:t.tx,border:`1.5px solid ${t.bd}`}}>📁 Upload</button></div>}
    {prev&&<div style={{marginBottom:"14px"}}><img src={prev} alt="" style={{width:"100%",borderRadius:"12px",maxHeight:"200px",objectFit:"cover"}}/></div>}
    {proc&&<div className="pl" style={{textAlign:"center",padding:"24px",color:t.pr}}>🔍 Analyzing...</div>}
    {res&&!proc&&(res.length===0?<div style={{textAlign:"center",padding:"20px",color:t.mt}}>🤷 No events found.<button onClick={()=>sP(null)} style={{...b1(t),marginTop:"14px"}}>Try Again</button></div>
    :<div>{res.map((ev,i)=>{const cat=CATS[ev.category]||CATS.other;return(<div key={i} style={{background:t.pr+"08",borderRadius:"10px",padding:"12px",marginBottom:"8px",borderLeft:`3px solid ${cat.c}`}}><div style={{fontSize:"14px",fontWeight:600,color:t.tx}}>{cat.i} {ev.title}</div><div style={{fontSize:"12px",color:t.mt}}>{ev.date}{ev.expense?` · CHF ${ev.expense}`:""}</div></div>)})}<button style={b1(t)} onClick={()=>onAll(res)}>Add All</button></div>)}
    <button style={b2(t)} onClick={onClose}>Close</button>
  </Ov>);
}

// ═══════════════════════════════════════════════════════════════════
// CONTACTS MODAL (with voice add)
// ═══════════════════════════════════════════════════════════════════
function CtModal({onClose,contacts,onAdd,onDel,onEd,onGf,addItem,t}) {
  const[show,setShow]=useState(false);
  const[f,sF]=useState({name:"",birthday:"",relationship:"",interests:"",style:"",ageGroup:"",budget:"",avoid:""});
  const set=(k,v)=>sF(p=>({...p,[k]:v}));
  const[vp,setVP]=useState(false);

  const handleVoice=async(text)=>{
    setVP(true);setShow(true);
    try{const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:`Parse this spoken input about a person into contact fields. Return ONLY JSON: {name,birthday(YYYY-MM-DD or ""),relationship,interests,style,ageGroup,budget,avoid}. Input: "${text}"`}]})});
      const d=await res.json();const parsed=JSON.parse((d.content?.map(c=>c.text||"").join("")||"{}").replace(/```json|```/g,"").trim());
      sF(p=>({...p,...Object.fromEntries(Object.entries(parsed).filter(([_,v])=>v))}));
    }catch{}setVP(false);
  };

  const submit=()=>{if(!f.name)return;onAdd({...f});if(f.birthday){const bd=new Date(f.birthday+"T00:00:00");let nb=new Date(today.getFullYear(),bd.getMonth(),bd.getDate());if(nb<today)nb=new Date(today.getFullYear()+1,nb.getMonth(),nb.getDate());addItem({title:`${f.name}'s Birthday`,category:"birthdays",date:toISO(nb),notes:`${f.relationship||"Contact"}.`,preResearch:gG(f).join(" · "),recurring:true})}sF({name:"",birthday:"",relationship:"",interests:"",style:"",ageGroup:"",budget:"",avoid:""});setShow(false)};

  return(<Ov onClose={onClose} title="People & Birthdays" t={t}>
    {/* Voice add */}
    <div style={{background:t.pr+"0A",borderRadius:"12px",padding:"14px",marginBottom:"14px",display:"flex",alignItems:"center",gap:"12px",border:`1px solid ${t.pr}18`}}>
      <MicBtn onResult={handleVoice} t={t} size={38}/>
      <div><div style={{fontSize:"13px",fontWeight:600,color:t.tx}}>{vp?"Parsing...":"Speak to add a contact"}</div><div style={{fontSize:"11px",color:t.mt}}>e.g. "Sarah, my sister, born March 15 1990, likes cooking and hiking, budget 50 francs"</div></div>
    </div>
    {!show&&<button onClick={()=>setShow(true)} style={{...b1(t),marginTop:0,marginBottom:"16px"}}>+ Add Manually</button>}
    {show&&<div style={{background:t.bd+"30",borderRadius:"14px",padding:"16px",marginBottom:"16px",border:`1px solid ${t.bd}`}}>
      <FL label="Name *"><input style={iS(t)} value={f.name} onChange={e=>set("name",e.target.value)}/></FL>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}><FL label="Birthday"><input style={iS(t)} type="date" value={f.birthday} onChange={e=>set("birthday",e.target.value)}/></FL><FL label="Relationship"><input style={iS(t)} value={f.relationship} onChange={e=>set("relationship",e.target.value)}/></FL></div>
      <div style={{fontSize:"12px",fontWeight:700,color:t.pr,margin:"10px 0 8px",textTransform:"uppercase"}}>🎁 Gift Profile</div>
      {GA.map(a=><FL key={a.k} label={a.l}><input style={iS(t)} placeholder={a.p} value={f[a.k]} onChange={e=>set(a.k,e.target.value)}/></FL>)}
      <button style={b1(t)} onClick={submit}>Save</button><button style={b2(t)} onClick={()=>setShow(false)}>Cancel</button>
    </div>}
    {!contacts.length&&!show&&<Em text="No contacts yet." t={t}/>}
    {contacts.map(c=>{let dL=null;if(c.birthday){const bd=new Date(c.birthday+"T00:00:00");let nb=new Date(today.getFullYear(),bd.getMonth(),bd.getDate());if(nb<today)nb=new Date(today.getFullYear()+1,nb.getMonth(),nb.getDate());dL=dU(toISO(nb))}
      return(<div key={c.id} style={{background:t.cd,borderRadius:"12px",padding:"12px",marginBottom:"8px",border:`1px solid ${t.bd}`,display:"flex",alignItems:"center",gap:"10px"}}>
        <div style={{width:"38px",height:"38px",borderRadius:"50%",background:t.pr+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",fontWeight:700,color:t.pr}}>{c.name.charAt(0).toUpperCase()}</div>
        <div style={{flex:1,minWidth:0}}><div style={{fontSize:"14px",fontWeight:600,color:t.tx}}>{c.name}</div><div style={{fontSize:"11px",color:t.mt}}>{c.relationship||""}{dL!==null?` · 🎂 ${dL===0?"Today!":`${dL}d`}`:""}</div></div>
        <div style={{display:"flex",gap:"4px"}}><button onClick={()=>onGf(c)} style={{width:"28px",height:"28px",borderRadius:"7px",border:`1px solid ${t.pr}20`,background:t.pr+"08",cursor:"pointer",fontSize:"11px",display:"flex",alignItems:"center",justifyContent:"center"}}>🎁</button><button onClick={()=>onEd(c.id)} style={{width:"28px",height:"28px",borderRadius:"7px",border:`1px solid ${t.pr}20`,background:t.pr+"08",cursor:"pointer",fontSize:"11px",display:"flex",alignItems:"center",justifyContent:"center"}}>✏️</button><button onClick={()=>onDel(c.id)} style={{width:"28px",height:"28px",borderRadius:"7px",border:"1px solid #D32F2F20",background:"#D32F2F08",cursor:"pointer",fontSize:"11px",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button></div>
      </div>)})}
    <button style={b2(t)} onClick={onClose}>Close</button>
  </Ov>);
}

// ─── Edit Contact ─────────────────────────────────────────────────
function EdCtModal({onClose,contact,onUpdate,t}) {
  const[f,sF]=useState({...contact});const set=(k,v)=>sF(p=>({...p,[k]:v}));if(!contact)return null;
  return(<Ov onClose={onClose} title={`Edit: ${contact.name}`} t={t}><FL label="Name"><input style={iS(t)} value={f.name} onChange={e=>set("name",e.target.value)}/></FL><FL label="Birthday"><input style={iS(t)} type="date" value={f.birthday||""} onChange={e=>set("birthday",e.target.value)}/></FL><FL label="Relationship"><input style={iS(t)} value={f.relationship||""} onChange={e=>set("relationship",e.target.value)}/></FL><div style={{fontSize:"12px",fontWeight:700,color:t.pr,margin:"10px 0 8px",textTransform:"uppercase"}}>🎁 Gift Profile</div>{GA.map(a=><FL key={a.k} label={a.l}><input style={iS(t)} placeholder={a.p} value={f[a.k]||""} onChange={e=>set(a.k,e.target.value)}/></FL>)}<button style={b1(t)} onClick={()=>{onUpdate(contact.id,f);onClose()}}>Save</button><button style={b2(t)} onClick={onClose}>Cancel</button></Ov>);
}

// ─── Gift Modal ───────────────────────────────────────────────────
function GfModal({onClose,contact,t}) {
  const sug=useMemo(()=>gG(contact),[contact]);const[aiG,setAG]=useState(null);const[aiL,setAL]=useState(false);
  const fetchAI=async()=>{setAL(true);try{const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:`Gift profile: ${contact.name}, Interests:${contact.interests||"?"}, Style:${contact.style||"?"}, Age:${contact.ageGroup||"?"}, Budget:${contact.budget||"flexible"}CHF, Avoid:${contact.avoid||"none"}. Switzerland. 6 gifts as JSON:[{name,price,reason}]. ONLY JSON.`}]})});const d=await r.json();setAG(JSON.parse((d.content?.map(c=>c.text||"").join("")||"[]").replace(/```json|```/g,"").trim()))}catch{setAG([])}setAL(false)};
  return(<Ov onClose={onClose} title={`Gifts for ${contact.name}`} t={t}>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"16px"}}>{sug.map((g,i)=><div key={i} style={{background:t.cd,borderRadius:"10px",padding:"10px",border:`1px solid ${t.bd}`,fontSize:"12px",color:t.tx}}>{["🎯","✨","💝","🎀","🌟","💫","🎊","🎁"][i%8]} {g}</div>)}</div>
    <button onClick={fetchAI} disabled={aiL} style={{...b1(t),marginTop:0,background:aiL?t.mt:"linear-gradient(135deg,#7B5EA7,#5B3E87)"}}>{aiL?"✨ Generating...":"✨ AI Gift Ideas"}</button>
    {aiG&&aiG.length>0&&<div style={{marginTop:"14px"}}>{aiG.map((g,i)=><div key={i} style={{background:t.pr+"08",borderRadius:"10px",padding:"12px",marginBottom:"8px"}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:"13px",fontWeight:600,color:t.tx}}>{g.name}</span>{g.price&&<span style={{fontSize:"12px",fontWeight:600,color:t.pr}}>~CHF {g.price}</span>}</div>{g.reason&&<div style={{fontSize:"11px",color:t.mt,marginTop:"4px"}}>{g.reason}</div>}</div>)}</div>}
    <button style={b2(t)} onClick={onClose}>Back</button>
  </Ov>);
}

// ═══════════════════════════════════════════════════════════════════
// SETTINGS MODAL
// ═══════════════════════════════════════════════════════════════════
function SetModal({onClose,t,theme,setTheme,dark,setDark,family,setFamily,cc,setCC,onSync}) {
  const[nm,setNm]=useState("");
  return(<Ov onClose={onClose} title="Settings" t={t}>
    <div style={{fontSize:"12px",fontWeight:700,color:t.pr,textTransform:"uppercase",marginBottom:"10px"}}>🎨 Theme</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginBottom:"14px"}}>{Object.entries(THEMES).map(([k,v])=><button key={k} onClick={()=>setTheme(k)} style={{padding:"12px 8px",borderRadius:"12px",border:theme===k?`2px solid ${v.pr}`:`2px solid ${t.bd}`,background:theme===k?v.pr+"15":t.cd,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",textAlign:"center"}}><div style={{width:"24px",height:"24px",borderRadius:"50%",background:v.hg,margin:"0 auto 6px"}}/><div style={{fontSize:"11px",fontWeight:theme===k?700:500,color:theme===k?v.pr:t.tx}}>{v.name}</div></button>)}</div>
    <FL label="Custom Color"><div style={{display:"flex",gap:"8px",alignItems:"center"}}><input type="color" value={cc||t.pr} onChange={e=>setCC(e.target.value)} style={{width:"40px",height:"36px",borderRadius:"8px",border:`1px solid ${t.bd}`,cursor:"pointer"}}/><input style={{...iS(t),flex:1}} value={cc||""} onChange={e=>setCC(e.target.value)} placeholder="#20918F"/>{cc&&<button onClick={()=>setCC("")} style={{fontSize:"11px",color:t.mt,border:"none",background:"none",cursor:"pointer"}}>Reset</button>}</div></FL>
    <label style={{display:"flex",alignItems:"center",gap:"10px",fontSize:"14px",cursor:"pointer",marginBottom:"18px",color:t.tx}}><div onClick={()=>setDark(!dark)} style={{width:"44px",height:"24px",borderRadius:"12px",background:dark?t.pr:t.bd,position:"relative",cursor:"pointer"}}><div style={{width:"20px",height:"20px",borderRadius:"50%",background:"#fff",position:"absolute",top:"2px",left:dark?"22px":"2px",transition:"all .2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/></div>{dark?"🌙 Dark":"☀️ Light"}</label>
    <div style={{fontSize:"12px",fontWeight:700,color:t.pr,textTransform:"uppercase",marginBottom:"10px"}}>👨‍👩‍👧‍👦 Family</div>
    <div style={{display:"flex",gap:"8px",marginBottom:"12px"}}><input style={{...iS(t),flex:1}} placeholder="Name" value={nm} onChange={e=>setNm(e.target.value)} onKeyDown={e=>e.key==="Enter"&&nm.trim()&&(setFamily(p=>[...p,{id:Date.now(),name:nm.trim()}]),setNm(""))}/><button onClick={()=>{if(!nm.trim())return;setFamily(p=>[...p,{id:Date.now(),name:nm.trim()}]);setNm("")}} style={{padding:"8px 16px",borderRadius:"10px",background:t.pr,color:"#fff",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>+</button></div>
    {family.map(m=><div key={m.id} style={{display:"flex",alignItems:"center",gap:"10px",padding:"8px 12px",background:t.bd+"30",borderRadius:"8px",marginBottom:"6px"}}><span style={{flex:1,fontSize:"14px",color:t.tx}}>{m.name}</span><button onClick={()=>setFamily(p=>p.filter(x=>x.id!==m.id))} style={{border:"none",background:"none",color:"#D32F2F",cursor:"pointer"}}>✕</button></div>)}
    <div style={{fontSize:"12px",fontWeight:700,color:t.pr,textTransform:"uppercase",marginBottom:"10px",marginTop:"18px"}}>📅 Calendar Sync</div>
    <button onClick={()=>onSync("google")} style={{...b1(t),marginTop:0}}>📅 Sync to Google Calendar</button>
    <button onClick={()=>onSync("ics")} style={{...b1(t),background:t.cd,color:t.tx,border:`1.5px solid ${t.bd}`}}>📲 Download .ics (Samsung / Any)</button>
    <p style={{fontSize:"11px",color:t.mt,textAlign:"center",marginTop:"6px"}}>The .ics file works with Samsung Calendar, Apple Calendar, Outlook, and more</p>
    <button style={b2(t)} onClick={onClose}>Close</button>
  </Ov>);
}

// ═══════════════════════════════════════════════════════════════════
// CALENDAR VIEW
// ═══════════════════════════════════════════════════════════════════
function CalV({cM,cY,setCM,setCY,items,t}) {
  const[sel,setSel]=useState(null);
  const prev=()=>{if(cM===0){setCM(11);setCY(cY-1)}else setCM(cM-1)};const next=()=>{if(cM===11){setCM(0);setCY(cY+1)}else setCM(cM+1)};
  const first=new Date(cY,cM,1),lastD=new Date(cY,cM+1,0).getDate();let sD=first.getDay()-1;if(sD<0)sD=6;
  const cells=[];for(let i=0;i<sD;i++)cells.push(null);for(let d=1;d<=lastD;d++)cells.push(d);
  const map={};items.forEach(i=>{const d=new Date(i.date+"T00:00:00");if(d.getMonth()===cM&&d.getFullYear()===cY){const day=d.getDate();if(!map[day])map[day]=[];map[day].push(i)}});
  const tD=today.getMonth()===cM&&today.getFullYear()===cY?today.getDate():null;
  return(<div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"14px"}}><button onClick={prev} style={{width:"32px",height:"32px",borderRadius:"8px",border:`1px solid ${t.bd}`,background:t.cd,fontSize:"16px",cursor:"pointer",color:t.tx,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button><span style={{fontFamily:"'Fraunces',serif",fontSize:"18px",fontWeight:600,color:t.tx}}>{MO[cM]} {cY}</span><button onClick={next} style={{width:"32px",height:"32px",borderRadius:"8px",border:`1px solid ${t.bd}`,background:t.cd,fontSize:"16px",cursor:"pointer",color:t.tx,display:"flex",alignItems:"center",justifyContent:"center"}}>›</button></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"2px",marginBottom:"4px"}}>{DH.map(d=><div key={d} style={{textAlign:"center",fontSize:"10px",fontWeight:600,color:t.mt,textTransform:"uppercase",padding:"4px 0"}}>{d}</div>)}</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"3px"}}>{cells.map((day,i)=>{if(!day)return<div key={`e${i}`}/>;const evts=map[day]||[];const isT=day===tD,isS=day===sel;return(<div key={day} onClick={()=>setSel(sel===day?null:day)} style={{background:isS?t.pr:isT?t.pr+"15":t.cd,borderRadius:"10px",padding:"6px 4px",minHeight:"48px",cursor:evts.length?"pointer":"default",border:isT&&!isS?`1.5px solid ${t.pr}`:`1px solid ${t.bd}`}}><div style={{fontSize:"12px",fontWeight:isT?700:400,color:isS?"#fff":isT?t.pr:t.tx,textAlign:"center"}}>{day}</div>{evts.length>0&&<div style={{display:"flex",justifyContent:"center",gap:"2px",marginTop:"4px",flexWrap:"wrap"}}>{evts.slice(0,3).map((ev,j)=><div key={j} style={{width:"6px",height:"6px",borderRadius:"50%",background:isS?"rgba(255,255,255,0.8)":(CATS[ev.category]?.c||"#999")}}/>)}{evts.length>3&&<span style={{fontSize:"8px",color:isS?"#fff":t.mt}}>+</span>}</div>}</div>)})}</div>
    {sel&&map[sel]&&<div style={{marginTop:"16px"}}>{map[sel].map(item=>{const cat=CATS[item.category]||CATS.other;return(<div key={item.id} style={{background:t.cd,borderRadius:"12px",padding:"12px",marginBottom:"8px",borderLeft:`4px solid ${cat.c}`}}><div style={{fontSize:"14px",fontWeight:600,color:t.tx}}>{cat.i} {item.title}</div>{item.notes&&<div style={{fontSize:"12px",color:t.mt,marginTop:"4px"}}>{item.notes}</div>}</div>)})}</div>}
  </div>);
}

// ─── Category View ────────────────────────────────────────────────
function CatV({items,eid,setEid,del,family,t,onE}) {
  const g={};items.forEach(i=>{if(!g[i.category])g[i.category]=[];g[i.category].push(i)});
  const a=Object.keys(CATS).filter(k=>g[k]?.length);if(!a.length)return<Em text="No events." t={t}/>;
  return a.map(k=>{const cat=CATS[k];return(<div key={k} style={{marginBottom:"20px"}}><div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"10px",padding:"8px 12px",background:cat.c+"0A",borderRadius:"10px",borderLeft:`4px solid ${cat.c}`}}><span style={{fontSize:"18px"}}>{cat.i}</span><span style={{fontSize:"14px",fontWeight:700,color:cat.c}}>{cat.l}</span><span style={{fontSize:"11px",color:t.mt,marginLeft:"auto"}}>{g[k].length}</span></div>{g[k].map(item=><EC key={item.id} item={item} exp={eid===item.id} onT={()=>setEid(eid===item.id?null:item.id)} onD={del} family={family} t={t} onE={onE}/>)}</div>)});
}

// ─── Family Dashboard ─────────────────────────────────────────────
function FamD({items,family,t}) {
  const tot=items.reduce((s,i)=>s+(i.expense||0),0);
  return(<div>
    <div style={{background:t.cd,borderRadius:"14px",padding:"16px",border:`1px solid ${t.bd}`,marginBottom:"14px"}}><div style={{fontSize:"12px",color:t.mt,textTransform:"uppercase",marginBottom:"4px"}}>Total Tracked Expenses</div><div style={{fontFamily:"'Fraunces',serif",fontSize:"28px",fontWeight:700,color:t.pr}}>CHF {tot.toLocaleString()}</div></div>
    {!family.length&&<Em text="Add family members in ⚙️ Settings." t={t}/>}
    {family.map(m=>{const my=items.filter(i=>i.assignedTo===m.id),od=my.filter(i=>dU(i.date)<0).length,up=my.filter(i=>{const d=dU(i.date);return d>=0&&d<=30}).length,ex=my.reduce((s,i)=>s+(i.expense||0),0);
      return(<div key={m.id} style={{background:t.cd,borderRadius:"12px",padding:"14px",border:`1px solid ${t.bd}`,marginBottom:"10px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px"}}><div style={{width:"36px",height:"36px",borderRadius:"50%",background:t.pr+"18",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color:t.pr}}>{m.name.charAt(0)}</div><div><div style={{fontSize:"15px",fontWeight:600,color:t.tx}}>{m.name}</div><div style={{fontSize:"11px",color:t.mt}}>{my.length} tasks · CHF {ex}</div></div></div>
        <div style={{display:"flex",gap:"8px"}}><div style={{flex:1,padding:"8px",borderRadius:"8px",background:"#D32F2F10",textAlign:"center"}}><div style={{fontSize:"18px",fontWeight:700,color:"#D32F2F"}}>{od}</div><div style={{fontSize:"9px",color:t.mt}}>Overdue</div></div><div style={{flex:1,padding:"8px",borderRadius:"8px",background:t.pr+"10",textAlign:"center"}}><div style={{fontSize:"18px",fontWeight:700,color:t.pr}}>{up}</div><div style={{fontSize:"9px",color:t.mt}}>30 days</div></div><div style={{flex:1,padding:"8px",borderRadius:"8px",background:t.bd+"50",textAlign:"center"}}><div style={{fontSize:"18px",fontWeight:700,color:t.tx}}>{my.length}</div><div style={{fontSize:"9px",color:t.mt}}>Total</div></div></div>
      </div>)})}
    {items.filter(i=>!i.assignedTo).length>0&&<div style={{background:t.cd,borderRadius:"12px",padding:"14px",border:`1px dashed ${t.bd}`}}><div style={{fontSize:"13px",fontWeight:600,color:t.mt}}>📌 {items.filter(i=>!i.assignedTo).length} unassigned events</div></div>}
  </div>);
}

// ═══════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════
export default function App() {
  const[items,setItems]=useState(()=>ld("items",[]));
  const[contacts,setCts]=useState(()=>ld("contacts",[]));
  const[family,setFamRaw]=useState(()=>ld("family",[]));
  const[thK,setThKRaw]=useState(()=>ld("theme","teal"));
  const[dark,setDkRaw]=useState(()=>ld("dark",false));
  const[cc,setCCRaw]=useState(()=>ld("cc",""));
  const[view,setView]=useState("dashboard");
  const[filter,setFilter]=useState("all");
  const[eid,setEid]=useState(null);
  const[modal,setModal]=useState(null);
  const[cM,setCM]=useState(today.getMonth());
  const[cY,setCY]=useState(today.getFullYear());
  const[search,setSearch]=useState("");
  const[showAI,setShowAI]=useState(false);
  const[syncSt,setSyncSt]=useState(null);

  const setThK=v=>{setThKRaw(v);sv("theme",v)};const setDk=v=>{setDkRaw(v);sv("dark",v)};const setCC=v=>{setCCRaw(v);sv("cc",v)};
  const setFam=v=>{const nv=typeof v==="function"?v(family):v;setFamRaw(nv);sv("family",nv)};
  useEffect(()=>sv("items",items),[items]);useEffect(()=>sv("contacts",contacts),[contacts]);

  const base=THEMES[thK]||THEMES.teal;
  const t=useMemo(()=>{let th={...base};if(cc){th.pr=cc;th.hg=`linear-gradient(135deg,${cc} 0%,${th.se} 100%)`}if(dark)th={...th,...DK};return th},[thK,dark,cc]);

  const addItem=useCallback(i=>setItems(p=>[...p,{...i,id:Date.now()+Math.random()}]),[]);
  const delItem=useCallback(id=>setItems(p=>p.filter(i=>i.id!==id)),[]);
  const updItem=useCallback((id,d)=>setItems(p=>p.map(i=>i.id===id?{...i,...d}:i)),[]);
  const addCt=useCallback(c=>setCts(p=>[...p,{...c,id:Date.now()+Math.random()}]),[]);
  const updCt=useCallback((id,d)=>setCts(p=>p.map(c=>c.id===id?{...c,...d}:c)),[]);
  const delCt=useCallback(id=>setCts(p=>p.filter(c=>c.id!==id)),[]);

  const stats=useMemo(()=>{const o=items.filter(i=>dU(i.date)<0).length,s=items.filter(i=>{const d=dU(i.date);return d>=0&&d<=30}).length,n=items.filter(i=>{const d=dU(i.date);return d>30&&d<=90}).length;return{o,s,n,t:items.length}},[items]);
  const filtered=useMemo(()=>{let l=[...items];if(filter!=="all")l=l.filter(i=>i.category===filter);if(search.trim()){const q=search.toLowerCase();l=l.filter(i=>i.title.toLowerCase().includes(q)||(i.notes||"").toLowerCase().includes(q))}return l.sort((a,b)=>dU(a.date)-dU(b.date))},[items,filter,search]);

  const handleSync=async(type)=>{
    if(type==="ics"){let ics="BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//HLM//EN\n";items.forEach(i=>{const d=i.date.replace(/-/g,"");ics+=`BEGIN:VEVENT\nDTSTART;VALUE=DATE:${d}\nSUMMARY:${i.title}\nDESCRIPTION:${(i.notes||"").replace(/\n/g,"\\n")}\n${i.recurring?"RRULE:FREQ=YEARLY\n":""}END:VEVENT\n`});ics+="END:VCALENDAR";const blob=new Blob([ics],{type:"text/calendar"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="lifecycle-events.ics";a.click();setSyncSt("ics");setTimeout(()=>setSyncSt(null),3000)}
    else if(type==="google"){setSyncSt("syncing");try{const evts=items.slice(0,25).map(i=>({title:i.title,date:i.date,notes:i.notes||"",recurring:i.recurring||false}));const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2000,messages:[{role:"user",content:`Please add these household events to my Google Calendar. Create one event per item using the date and title. Add the notes as the event description. Events:\n${JSON.stringify(evts,null,2)}`}],mcp_servers:[{type:"url",url:"https://gcal.mcp.claude.com/mcp",name:"google-calendar"}]})});if(res.ok)setSyncSt("done");else setSyncSt("err")}catch{setSyncSt("err")}setTimeout(()=>setSyncSt(null),4000)}
  };

  return(
    <div className="app-container" style={{fontFamily:"'DM Sans',sans-serif",background:t.bg,minHeight:"100vh",color:t.tx,maxWidth:"600px",margin:"0 auto",transition:"background .3s,color .3s"}}>
      {/* Header */}
      <header style={{background:t.hg,color:"#fff",padding:"20px 20px 16px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,right:0,bottom:0,width:"50%",background:"radial-gradient(circle at 70% 40%,rgba(255,255,255,0.06) 0%,transparent 60%)",pointerEvents:"none"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",position:"relative",zIndex:1}}>
          <div><h1 style={{fontFamily:"'Fraunces',serif",fontSize:"21px",fontWeight:700}}>Pulse</h1><p style={{fontSize:"11px",opacity:0.55,marginTop:"2px"}}>{today.toLocaleDateString("en-CH",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p></div>
          <div style={{display:"flex",gap:"6px"}}>
            {[{m:"contact",i:"👥"},{m:"scan",i:"📷"},{m:"settings",i:"⚙️"}].map(b=><button key={b.m} onClick={()=>setModal(b.m)} style={{width:"34px",height:"34px",borderRadius:"9px",background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",color:"#fff",fontSize:"15px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{b.i}</button>)}
          </div>
        </div>
        {syncSt&&<div style={{marginTop:"8px",padding:"8px 12px",borderRadius:"8px",background:"rgba(255,255,255,0.15)",fontSize:"12px",textAlign:"center",position:"relative",zIndex:1}}>{syncSt==="syncing"?"📅 Syncing...":syncSt==="done"?"✅ Synced!":syncSt==="err"?"⚠️ Error — try .ics":syncSt==="ics"?"✅ .ics downloaded!":""}</div>}
        <div style={{display:"flex",gap:"8px",marginTop:"12px",position:"relative",zIndex:1}}>{[{n:stats.o,l:"Overdue",c:"#FF6B6B"},{n:stats.s,l:"30d",c:"#FFD93D"},{n:stats.n,l:"90d",c:"rgba(255,255,255,0.7)"},{n:stats.t,l:"Total",c:"rgba(255,255,255,0.5)"}].map((s,i)=><div key={i} style={{flex:1,textAlign:"center",padding:"9px 4px",background:"rgba(255,255,255,0.08)",borderRadius:"11px"}}><div style={{fontFamily:"'Fraunces',serif",fontSize:"20px",fontWeight:700,color:s.c}}>{s.n}</div><div style={{fontSize:"9px",opacity:0.6,textTransform:"uppercase"}}>{s.l}</div></div>)}</div>
        <div style={{display:"flex",gap:"3px",marginTop:"11px",background:"rgba(0,0,0,0.2)",borderRadius:"10px",padding:"3px",position:"relative",zIndex:1}}>
          {[{id:"dashboard",l:"Timeline",i:"📋"},{id:"calendar",l:"Calendar",i:"📅"},{id:"category",l:"Category",i:"🏷️"},{id:"family",l:"Family",i:"👨‍👩‍👧‍👦"}].map(v=><button key={v.id} onClick={()=>setView(v.id)} style={{flex:1,padding:"7px 4px",borderRadius:"8px",border:"none",background:view===v.id?"rgba(255,255,255,0.18)":"transparent",color:view===v.id?"#fff":"rgba(255,255,255,0.5)",fontSize:"11px",fontWeight:view===v.id?600:400,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{v.i} {v.l}</button>)}
        </div>
      </header>

      {/* Search */}
      {view!=="family"&&<div style={{padding:"12px 16px 8px",display:"flex",gap:"8px",flexWrap:"wrap",alignItems:"center"}}>
        <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:"1 1 140px",padding:"8px 12px",borderRadius:"10px",border:`1.5px solid ${t.bd}`,fontSize:"13px",fontFamily:"'DM Sans',sans-serif",background:t.cd,color:t.tx,minWidth:"100px"}}/>
        <div style={{display:"flex",gap:"3px",flexWrap:"wrap"}}><FP a={filter==="all"} o={()=>setFilter("all")} t={t}>All</FP>{Object.entries(CATS).map(([k,v])=><FP key={k} a={filter===k} o={()=>setFilter(k)} t={t}>{v.i}</FP>)}</div>
      </div>}

      {/* Content */}
      <div style={{padding:view==="family"?"16px 16px 120px":"0 16px 120px"}}>
        {view==="dashboard"&&(!filtered.length?<Em text="No events yet. Tap + or 📷 or ask the 🤖 assistant." t={t}/>:filtered.map(i=><EC key={i.id} item={i} exp={eid===i.id} onT={()=>setEid(eid===i.id?null:i.id)} onD={delItem} family={family} t={t} onE={item=>setModal({type:"edit",item})}/>))}
        {view==="calendar"&&<CalV cM={cM} cY={cY} setCM={setCM} setCY={setCY} items={items} t={t}/>}
        {view==="category"&&<CatV items={filtered} eid={eid} setEid={setEid} del={delItem} family={family} t={t} onE={item=>setModal({type:"edit",item})}/>}
        {view==="family"&&<FamD items={items} family={family} t={t}/>}
      </div>

      {/* FABs */}
      <button onClick={()=>setShowAI(!showAI)} style={{position:"fixed",bottom:"24px",left:"24px",width:"50px",height:"50px",borderRadius:"50%",background:showAI?"#D32F2F":"linear-gradient(135deg,#7B5EA7,#5B3E87)",color:"#fff",border:"none",fontSize:"22px",cursor:"pointer",boxShadow:"0 4px 20px rgba(123,94,167,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>{showAI?"✕":"🤖"}</button>
      <button onClick={()=>setModal("add")} style={{position:"fixed",bottom:"24px",right:"24px",width:"56px",height:"56px",borderRadius:"50%",background:t.hg,color:"#fff",border:"none",fontSize:"28px",cursor:"pointer",boxShadow:`0 4px 20px ${t.pr}55`,display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>+</button>

      {/* AI Assistant */}
      {showAI&&<AIAssistant items={items} contacts={contacts} family={family} t={t} onClose={()=>setShowAI(false)}/>}

      {/* Modals */}
      {modal==="add"&&<EvModal onClose={()=>setModal(null)} onSave={addItem} contacts={contacts} family={family} t={t}/>}
      {modal?.type==="edit"&&<EvModal onClose={()=>setModal(null)} onSave={d=>{updItem(modal.item.id,d)}} contacts={contacts} family={family} t={t} editItem={modal.item}/>}
      {modal==="scan"&&<ScModal onClose={()=>setModal(null)} t={t} onAll={evts=>{evts.forEach(addItem);setModal(null)}}/>}
      {modal==="contact"&&<CtModal onClose={()=>setModal(null)} contacts={contacts} onAdd={addCt} onDel={delCt} onEd={id=>setModal({type:"ec",id})} onGf={c=>setModal({type:"g",contact:c})} addItem={addItem} t={t}/>}
      {modal?.type==="ec"&&<EdCtModal onClose={()=>setModal("contact")} contact={contacts.find(c=>c.id===modal.id)} onUpdate={updCt} t={t}/>}
      {modal?.type==="g"&&<GfModal onClose={()=>setModal("contact")} contact={modal.contact} t={t}/>}
      {modal==="settings"&&<SetModal onClose={()=>setModal(null)} t={t} theme={thK} setTheme={setThK} dark={dark} setDark={setDk} family={family} setFamily={setFam} cc={cc} setCC={setCC} onSync={handleSync}/>}
    </div>
  );
}
