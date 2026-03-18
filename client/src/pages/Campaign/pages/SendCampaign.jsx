// client/src/pages/Campaign/pages/SendCampaign.jsx
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CheckCircle, ChevronDown, ChevronUp, Send, Users, Settings,
  FileText, Check, Clock, Calendar, AlertCircle,
  Mail, RefreshCw, LogOut
} from "lucide-react";
import ShuffleSubjectModal from "../Components/ShuffleSubjectModal";
import { Shuffle } from "lucide-react";

// ✅ FIX: Was VITE_VRI_URL (typo) — now correctly VITE_API_URL
const API_URL = import.meta.env.VITE_VRI_URL; 

const steps = [
  { id: "recipients", title: "To",       description: "Choose who to send to",  icon: Users    },
  { id: "setup",      title: "From",     description: "Set up your email",       icon: Settings },
  { id: "template",   title: "Template", description: "Choose a template",       icon: FileText },
  { id: "schedule",   title: "Schedule", description: "Schedule your campaign",  icon: Clock    },
  { id: "confirm",    title: "Confirm",  description: "Review and send",         icon: Check    },
];

/* ─── Error Boundary ──────────────────────────────────────── */
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(e, info) { console.error("EmailPreview Error:", e, info); }
  render() {
    if (this.state.hasError)
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-medium">Preview Error</h3>
          <p className="text-red-600 text-sm mt-1">Unable to display email preview.</p>
        </div>
      );
    return this.props.children;
  }
}

/* ─── Canvas dimensions ───────────────────────────────────── */
const CANVAS_WIDTH = 800;



/* ─── Preview element renderer ───────────────────────────── */
function renderPreviewElement(el) {
  const base = {
    fontFamily:     el.fontFamily     || "Arial, sans-serif",
    color:          el.color          || "#333",
    fontSize:       `${el.fontSize || 16}px`,
    fontWeight:     el.fontWeight     || "normal",
    fontStyle:      el.fontStyle      || "normal",
    textDecoration: el.textDecoration || "none",
    lineHeight:     el.lineHeight     || 1.4,
    textAlign:      el.textAlign      || "left",
    backgroundColor:el.backgroundColor|| "transparent",
    wordWrap:       "break-word",
    whiteSpace:     "pre-wrap",
    overflow:       "hidden",
    width:          "100%",
    height:         "100%",
    boxSizing:      "border-box",
  };

  switch (el.type) {
    case "heading":
      return <div style={{ ...base, fontWeight:el.fontWeight||"700", fontSize:`${el.fontSize||28}px` }}
                  dangerouslySetInnerHTML={{ __html:el.content||"Heading" }} />;
    case "subheading":
      return <div style={{ ...base, fontWeight:el.fontWeight||"600", fontSize:`${el.fontSize||20}px` }}
                  dangerouslySetInnerHTML={{ __html:el.content||"Subheading" }} />;
    case "paragraph":
      return <div style={base} dangerouslySetInnerHTML={{ __html:el.content||"" }} />;
    case "blockquote":
      return <div style={{ ...base,paddingLeft:"12px", fontStyle:"italic" }}
                  dangerouslySetInnerHTML={{ __html:el.content||"" }} />;

    case "image": {
      const src = el.src;
      // blob: and data: URLs are local-only — can't be sent in email
      if (!src || src.startsWith("blob:")) {
        return (
          <div style={{ width:"100%", height:"100%", background:"#2a2a2a",
                        display:"flex", flexDirection:"column", alignItems:"center",
                        justifyContent:"center", borderRadius:`${el.borderRadius||0}px`,
                        color:"#ff6b6b", fontSize:11, textAlign:"center", gap:4, padding:8 }}>
            <span style={{ fontSize:20 }}>⚠</span>
            <span>Upload image to server<br/>so it shows in email</span>
          </div>
        );
      }
      return (
        <img src={src} alt={el.alt||"Image"}
              style={{ width:"100%", height:"100%", objectFit:el.objectFit||"cover",
              borderRadius:`${el.borderRadius||0}px`,
              border:el.borderWidth?`${el.borderWidth}px solid ${el.borderColor}`:"none",
              display:"block" }} />
      );
    }

    case "button":
      return (
        <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center",
                      justifyContent:el.textAlign==="right"?"flex-end":el.textAlign==="center"?"center":"flex-start" }}>
          <a href={el.email?`mailto:${el.email}`:(el.link||"#")}
             style={{ display:"inline-block", padding:el.padding||"10px 18px",
                      background:el.backgroundColor||"#c2831f", color:el.color||"#fff",
                      borderRadius:`${el.borderRadius||6}px`, textDecoration:"none",
                      fontWeight:el.fontWeight||"700", fontSize:`${el.fontSize||16}px`,
                      fontFamily:el.fontFamily||"Arial, sans-serif", whiteSpace:"nowrap" }}>
            {el.content||"Click Me"}
          </a>
        </div>
      );

    case "line":
      return (
        <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center" }}>
          <hr style={{ border:"none", height:`${el.strokeWidth||1}px`,
                       background:el.strokeColor||"#ddd", width:"100%", margin:0 }} />
        </div>
      );

    case "rectangle":
      return <div style={{ width:"100%", height:"100%",
                           backgroundColor:el.backgroundColor||"#4ECDC4",
                           border:el.borderWidth?`${el.borderWidth}px solid ${el.borderColor}`:"none",
                           borderRadius:`${el.borderRadius||4}px` }} />;

    case "circle":
      return <div style={{ width:"100%", height:"100%",
                           backgroundColor:el.backgroundColor||"#FF6B6B",
                           border:el.borderWidth?`${el.borderWidth}px solid ${el.borderColor}`:"none",
                           borderRadius:"50%" }} />;

    case "triangle":
      return <div style={{ width:0, height:0,
                           borderLeft:`${(el.width||50)/2}px solid transparent`,
                           borderRight:`${(el.width||50)/2}px solid transparent`,
                           borderBottom:`${el.height||86}px solid ${el.backgroundColor||"#FF9F43"}` }} />;

    case "star":
      return <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center",
                           justifyContent:"center",
                           fontSize:`${Math.min(el.width||40,el.height||40)*0.9}px`,
                           color:el.backgroundColor||el.color||"#FFD93D" }}>★</div>;

    case "hexagon":
      return <div style={{ width:"100%", height:"100%", backgroundColor:el.backgroundColor||"#6C5CE7",
                           clipPath:"polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)" }} />;

    case "arrow":
      return <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center",
                           justifyContent:"center",
                           fontSize:`${Math.min(el.width||40,el.height||40)*0.8}px`,
                           color:el.color||"#00CEC9" }}>→</div>;

      case "social": {
        return (
          <a
            href={el.link || "#"}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "block", width: "100%", height: "100%" }}
          >
            <img
              src={el.src || ""}
              alt={el.platform || ""}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </a>
        );
      }

    /* ── Emoji icons ── */
    case "emoji-icon": {
      const emoji    = el.emoji    || "⭐";
      const fSize    = el.fontSize || Math.min(el.width || 40, el.height || 40) * 0.7;
      return (
        <div style={{ width:"100%", height:"100%", display:"flex",
                      alignItems:"center", justifyContent:"center",
                      fontSize:`${fSize}px`, lineHeight:1, userSelect:"none" }}>
          {emoji}
        </div>
      );
    }

    case "icon": {
      const map = { Star:"★", Heart:"♥", Check:"✓", Arrow:"→", Home:"⌂",
                    User:"👤", Settings:"⚙", Mail:"✉" };
      const sym = map[el.name]||"•";
      return (
        <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center",
                      justifyContent:"center", fontSize:`${el.fontSize||24}px`,
                      color:el.color||"#000" }}>
          {el.link ? <a href={el.link} style={{ color:"inherit", textDecoration:"none" }}>{sym}</a> : sym}
        </div>
      );
    }

    default:
      return null;
  }
}

/* ─── EmailPreview component ──────────────────────────────── */
function EmailPreview({ pages, activePage, canvasBackgroundColor, previewRef }) {
  if (!pages?.length || activePage === undefined || activePage >= pages.length)
    return (
      <div className="flex items-center justify-center h-full bg-white rounded-lg p-8">
        <div className="text-center text-gray-400">
          <div className="text-5xl mb-3">📧</div>
          <p className="text-gray-600 font-medium">No content to preview</p>
        </div>
      </div>
    );

  const currentPage = pages[activePage];
  if (!currentPage?.elements?.length)
    return (
      <div className="flex items-center justify-center h-full bg-white rounded-lg p-8">
        <div className="text-center text-gray-400">
          <div className="text-5xl mb-3">📧</div>
          <p className="text-gray-600 font-medium">Empty canvas</p>
        </div>
      </div>
    );

  const elements        = currentPage.elements;
  const backgroundColor = canvasBackgroundColor || "#FFFFFF";
  const canvasHeight    = elements.reduce((m, el) => Math.max(m, (Number(el.y)||0)+(Number(el.height)||0)), 0);

  return (
    <div style={{ background:"#e5e7eb", overflowY:"auto", height:"100%" }}>
      <div style={{ display:"flex", justifyContent:"center", padding:"12px" }}>
        <div
          style={{ width:"100%", overflow:"hidden", boxShadow:"0 4px 24px rgba(0,0,0,0.15)",
                   borderRadius:"8px", lineHeight:0 }}
          ref={(wrapper) => {
            if (!wrapper) return;
            const scaleEl    = wrapper.querySelector("[data-scale-inner]");
            if (!scaleEl) return;
            const scale      = Math.min(1, (wrapper.offsetWidth||CANVAS_WIDTH) / CANVAS_WIDTH);
            scaleEl.style.transform       = `scale(${scale})`;
            scaleEl.style.transformOrigin = "top left";
            wrapper.style.height          = `${canvasHeight * scale}px`;
          }}
        >
          {/* ↓ This div is captured by html2canvas */}
          <div data-scale-inner="true" ref={previewRef}
               style={{ width:`${CANVAS_WIDTH}px`, transformOrigin:"top left" }}>
            <div style={{ position:"relative", width:`${CANVAS_WIDTH}px`,
                          height:`${canvasHeight}px`, backgroundColor }}>
              {elements.map((el, idx) => (
                <div key={el.id||idx}
                     style={{
                       position:  "absolute",
                       left:      `${Number(el.x)||0}px`,
                       top:       `${Number(el.y)||0}px`,
                       width:     `${Number(el.width)||300}px`,
                       height:    `${Number(el.height)||80}px`,
                       transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                       opacity:   el.opacity !== undefined ? el.opacity : 1,
                       overflow:  "hidden",
                       boxSizing: "border-box",
                       padding:   el.padding && el.type !== "button" ? el.padding : undefined,
                     }}>
                  {renderPreviewElement(el)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════ */
export default function CampaignBuilder() {
  const location = useLocation();
  const navigate = useNavigate();

  /* ── refs ───────────────────────────────────────────────── */
  // Points directly at the unscaled canvas div inside EmailPreview
  const canvasPreviewRef = useRef(null);

  /* ── state ─────────────────────────────────────────────── */
  const [expanded,       setExpanded]       = useState("setup");
  const [completedSteps, setCompletedSteps] = useState([]);
  const [formData,       setFormData]       = useState({
    recipients:        "",
    fromEmail:         "",
    fromName:          "",
    replyToEmail:      "",
    fromAddress:       "",
    subject:           "",
    sendTime:          "",
    template:          "basic",
    designContent:     "",
    scheduleType:      "immediate",
    scheduledDate:     "",
    scheduledTime:     "",
    timezone:          Intl.DateTimeFormat().resolvedOptions().timeZone,
    recurringFrequency:"daily",
    recurringDays:     [],
    recurringEndDate:  "",
  });

  const [isSending,               setIsSending]               = useState(false);
  const [sendStatus,               setSendStatus]               = useState(null);
  const [contacts,                 setContacts]                 = useState([]);
  const [canvasPages,              setCanvasPages]              = useState([{ id:1, elements:[] }]);
  const [canvasActivePage,         setCanvasActivePage]         = useState(0);
  const [canvasZoomLevel,          setCanvasZoomLevel]          = useState(0.6);
  const [authError,                setAuthError]                = useState(false);
  // const [batchProgress,            setBatchProgress]            = useState({ current:0, total:0 });
  const [credits,                  setCredits]                  = useState(0);
  const [recipientError,           setRecipientError]           = useState("");
  const [isCheckingEmail,          setIsCheckingEmail]          = useState(false);
  const [emailVerificationStatus,  setEmailVerificationStatus]  = useState(null);
  const [showShuffleModal,         setShowShuffleModal]         = useState(false);
  const [canvasBackgroundColor,    setCanvasBackgroundColor]    = useState(location.state?.canvasBackgroundColor||"#FFFFFF");
  const [showExitModal,            setShowExitModal]            = useState(false);
  const [previewWidth,             setPreviewWidth]             = useState(500);
  const [isDragging,               setIsDragging]               = useState(false);

  const getAuthToken = () => localStorage.getItem("token");
  const [batchProgress, setBatchProgress] = useState({
    campaignId: null,
    batchCurrent: 0,
    batchTotal: 0,
    sentCount: 0,
    totalRecipients: 0,
    percentComplete: 0,
    estimatedMinutesRemaining: 0,
    status: null,
  });

  // ── Poll batch progress when a campaign is running ───────────
useEffect(() => {
  if (!batchProgress.campaignId) return;
  if (batchProgress.status === "completed" || batchProgress.status === "failed") return;

  const interval = setInterval(async () => {
    try {
      const res  = await fetch(`${API_URL}/api/campaigns/${batchProgress.campaignId}/batch-progress`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.success) return;

      setBatchProgress((prev) => ({
        ...prev,
        batchCurrent:              data.batchCurrent,
        batchTotal:                data.batchTotal,
        sentCount:                 data.sentCount,
        totalRecipients:           data.totalRecipients,
        percentComplete:           data.percentComplete,
        estimatedMinutesRemaining: data.estimatedMinutesRemaining,
        status:                    data.status,
      }));

      if (data.status === "completed" || data.status === "failed") {
        clearInterval(interval);
      }
    } catch { /* ignore polling errors */ }
  }, 10000); // poll every 10 s

  return () => clearInterval(interval);
}, [batchProgress.campaignId, batchProgress.status]);

  /* ── draggable preview panel ────────────────────────────── */
  useEffect(() => {
    const onMove = (e) => {
      if (!isDragging) return;
      const w = window.innerWidth - e.clientX;
      if (w > 350 && w < 900) setPreviewWidth(w);
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => { window.removeEventListener("mousemove",onMove); window.removeEventListener("mouseup",onUp); };
  }, [isDragging]);

  /* ── load canvas data from editor ──────────────────────── */
  useEffect(() => {
    if (!location.state?.canvasData) return;
    const norm = location.state.canvasData.map(el => ({
      // ✅ Spread ALL original props first — preserves src, iconName, iconColor, platform, strokeColor, etc.
      ...el,
      // Then normalize numeric/missing fields
      x:              Number(el.x)      || 0,
      y:              Number(el.y)      || 0,
      width:          Number(el.width)  || (el.type==="image"?250:300),
      height:         Number(el.height) || (el.type==="paragraph"?40:80),
      fontSize:       Number(el.fontSize)||16,
      fontFamily:     el.fontFamily     || "Arial, sans-serif",
      fontWeight:     el.fontWeight     || "normal",
      fontStyle:      el.fontStyle      || "normal",
      textDecoration: el.textDecoration || "none",
      color:          el.color          || "#333",
      backgroundColor:el.backgroundColor|| "transparent",
      lineHeight:     el.lineHeight     || 1.6,
      borderRadius:   Number(el.borderRadius)  || 0,
      borderWidth:    Number(el.borderWidth)   || 0,
      borderColor:    el.borderColor    || "#000",
      zIndex:         el.zIndex         || 1,
      rotation:       el.rotation       || 0,
      opacity:        el.opacity        ?? 1,
    }));
    setCanvasPages([{ id:1, elements:norm }]);
    setCanvasActivePage(0);
    setCompletedSteps(prev => [...new Set([...prev,"design","template"])]);
    setFormData(prev => ({ ...prev, subject: location.state.subject || prev.subject }));
  }, [location.state]);

  /* ── fetch contacts ─────────────────────────────────────── */
  useEffect(() => { fetchContacts(); }, []);
  const fetchContacts = async () => {
    try {
      const token   = getAuthToken();
      const headers = { "Content-Type":"application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/api/campaigncontacts`, { headers });
      if (res.status === 401) { setAuthError(true); return; }
      if (res.ok) setContacts(await res.json());
    } catch (err) { console.error("fetchContacts error:", err); }
  };

  /* ── fetch credits ──────────────────────────────────────── */
  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch(`${API_URL}/api/campaigns/credits`, {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
        if (!res.ok) { setCredits(0); return; }
        const data = await res.json();
        const c    = data?.emailSendCredits ?? 0;
        setCredits(c);
        localStorage.setItem("totalEmails", c);
      } catch { setCredits(0); }
    };
    load();
  }, []);

  /* ── helpers ────────────────────────────────────────────── */
  const getRecipientCount = () => {
    if (formData.recipients==="all-subscribers") return contacts.length;
    if (formData.recipients==="new-customers")  return contacts.filter(c=>c.type==="new-customer").length;
    if (formData.recipients==="vip-clients")    return contacts.filter(c=>c.type==="vip-client").length;
    if (formData.recipients==="manual")
      return (formData.manualEmails||"").split(/[\n,]+/).filter(e=>e.trim()&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())).length;
    if (formData.recipients==="file") return (formData.bulkFileEmails||[]).length;
    return 0;
  };

  const toggleExpand = (id) => setExpanded(expanded===id ? null : id);
  const markComplete = (id) => {
    if (!completedSteps.includes(id)) setCompletedSteps(p=>[...p,id]);
    setExpanded(null);
  };
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const emails = ev.target.result.split(/\r?\n|,/).map(l=>l.trim()).filter(l=>l.includes("@"));
      setFormData(p=>({...p, bulkFileEmails:emails}));
    };
    reader.readAsText(file);
  };

  const handleTemplateSelect = (t) => { setFormData({...formData,template:t}); markComplete("template"); };
  const handleRecurringDaysChange = (day) => {
    const days = formData.recurringDays||[];
    setFormData({...formData, recurringDays: days.includes(day)?days.filter(d=>d!==day):[...days,day]});
  };

  /* ── email verification ─────────────────────────────────── */
  const checkEmailVerification = async (email) => {
    if (!email?.includes("@")) { setEmailVerificationStatus(null); return; }
    setIsCheckingEmail(true); setEmailVerificationStatus(null);
    try {
      const res  = await fetch(`${API_URL}/api/campaigns/verify-email`, {
        method:"POST",
        headers:{ "Content-Type":"application/json", Authorization:`Bearer ${getAuthToken()}` },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setEmailVerificationStatus(res.ok ? data.verified===true : false);
    } catch { setEmailVerificationStatus(false); }
    finally  { setIsCheckingEmail(false); }
  };
  const handleEmailBlur = (e) => { if (e.target.name==="fromEmail") checkEmailVerification(e.target.value); };

  /* ── pre-convert all cross-origin img srcs to base64 so html2canvas works ── */
  const convertImagesToBase64 = async (containerEl) => {
    const imgs = containerEl.querySelectorAll("img");
    await Promise.allSettled(Array.from(imgs).map(async (img) => {
      const src = img.src;
      if (!src || src.startsWith("data:") || src.startsWith("blob:")) return;
      try {
        const res = await fetch(src, { mode: "cors" });
        const blob = await res.blob();
        const reader = new FileReader();
        await new Promise((resolve) => {
          reader.onload = () => { img.src = reader.result; resolve(); };
          reader.readAsDataURL(blob);
        });
      } catch {
        // If CORS fails, try loading via image element with crossOrigin
        try {
          await new Promise((resolve, reject) => {
            const tmp = new Image();
            tmp.crossOrigin = "anonymous";
            tmp.onload = () => {
              const c = document.createElement("canvas");
              c.width = tmp.naturalWidth || 64;
              c.height = tmp.naturalHeight || 64;
              const ctx = c.getContext("2d");
              ctx.drawImage(tmp, 0, 0);
              img.src = c.toDataURL();
              resolve();
            };
            tmp.onerror = reject;
            tmp.src = src + (src.includes("?") ? "&" : "?") + "_cb=" + Date.now();
          });
        } catch {
          // Leave as-is if conversion fails
        }
      }
    }));
  };

  /* ── capture canvas snapshot ────────────────────────────── */
  const captureSnapshot = async () => {
    try {
      const target = canvasPreviewRef.current;
      if (!target) { console.warn("⚠️ canvasPreviewRef not set"); return null; }

      console.log("📸 Pre-converting images to base64…");
      // Clone the target so we can modify img srcs without affecting the UI
      const clone = target.cloneNode(true);
      clone.style.position = "fixed";
      clone.style.top = "-99999px";
      clone.style.left = "-99999px";
      clone.style.zIndex = "-1";
      document.body.appendChild(clone);

      await convertImagesToBase64(clone);

      console.log("📸 Capturing snapshot…");
      const html2canvas = (await import("html2canvas")).default;

      const canvas = await html2canvas(clone, {
        scale:           2,
        useCORS:         true,
        allowTaint:      true,
        backgroundColor: canvasBackgroundColor || "#ffffff",
        logging:         false,
        imageTimeout:    15000,
        onclone:         (doc) => {
          // Ensure all images in cloned doc have crossOrigin set
          doc.querySelectorAll("img").forEach(img => {
            img.crossOrigin = "anonymous";
          });
        },
      });

      document.body.removeChild(clone);

      const base64 = canvas.toDataURL("image/png");
      console.log(`✅ Snapshot ready — ${Math.round(base64.length/1024)} KB`);
      return base64;
    } catch (err) {
      console.error("❌ Snapshot capture failed:", err);
      return null;
    }
  };

  /* ── upload snapshot to server ──────────────────────────── */
  const uploadSnapshot = async (base64) => {
    try {
      const res  = await fetch(`${API_URL}/api/upload/snapshot`, {
        method:  "POST",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${getAuthToken()}` },
        body:    JSON.stringify({ imageBase64: base64 }),
      });
      const data = await res.json();
      if (res.ok && data.url) { console.log("✅ Snapshot URL:", data.url); return data.url; }
    } catch (err) { console.warn("⚠️ Snapshot upload failed, using JSON fallback:", err); }
    return null;
  };

  /* ── send campaign ──────────────────────────────────────── */
  const handleSendCampaign = async () => {
    setIsSending(true);
    setSendStatus(null);

    try {
      const token   = getAuthToken();
      const headers = { "Content-Type":"application/json", Authorization:`Bearer ${token}` };

      if (Number(credits) <= 0) {
        setSendStatus({ success:false, message:"⚠️ You have 0 email credits. Please upgrade your plan." });
        setIsSending(false); return;
      }

      // ── fetch recipients ─────────────────────────────────
      const cRes = await fetch(`${API_URL}/api/campaigncontacts`, { headers });
      if (!cRes.ok) throw new Error("Failed to fetch contacts");
      const allContacts = await cRes.json();

      let recipientsList = [];
      if      (formData.recipients==="all-subscribers") recipientsList = allContacts;
      else if (formData.recipients==="new-customers")  recipientsList = allContacts.filter(c=>c.type==="new-customer");
      else if (formData.recipients==="vip-clients")    recipientsList = allContacts.filter(c=>c.type==="vip-client");
      else if (formData.recipients==="manual")
        recipientsList = (formData.manualEmails||"").split(/[\n,]+/)
          .map(e=>({ email:e.trim() })).filter(c=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email));
      else if (formData.recipients==="file")
        recipientsList = (formData.bulkFileEmails||[])
          .map(e=>({ email:e })).filter(c=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email));

      if (recipientsList.length===0) {
        setSendStatus({ success:false, message:"❌ No valid recipients found." });
        setIsSending(false); return;
      }
      if (recipientsList.length > Number(credits)) {
        setSendStatus({ success:false, message:`❌ Need ${recipientsList.length} credits, have ${credits}.` });
        setIsSending(false); return;
      }

      // ── capture + upload snapshot ────────────────────────
      setSendStatus({ success:true, message:"📸 Capturing email design…" });
      const base64      = await captureSnapshot();
      let   snapshotUrl = null;

      if (base64) {
        setSendStatus({ success:true, message:"☁️ Uploading design snapshot…" });
        snapshotUrl = await uploadSnapshot(base64);
      }

      setSendStatus({ success:true, message:"📤 Sending campaign…" });

      // ── build payload ────────────────────────────────────
      const payload = {
        campaignName:        formData.subject,
        subject:             formData.subject,
        fromEmail:           formData.fromEmail,
        fromName:            formData.fromName,
        replyToEmail:        formData.replyToEmail,
        fromAddress:         formData.fromAddress,
        recipients:          recipientsList,
        canvasData:          canvasPages[0].elements,
        canvasBackgroundColor: canvasBackgroundColor||"#ffffff",
        snapshotUrl,          // ✅ pixel-perfect snapshot
        scheduleType:        formData.scheduleType,
      };

      if (formData.scheduleType==="scheduled") {
        payload.scheduledDate = formData.scheduledDate;
        payload.scheduledTime = formData.scheduledTime;
        payload.timezone      = formData.timezone;
        if (new Date(`${formData.scheduledDate}T${formData.scheduledTime}`) <= new Date()) {
          setSendStatus({ success:false, message:"❌ Scheduled time must be in the future." });
          setIsSending(false); return;
        }
      } else if (formData.scheduleType==="recurring") {
        payload.scheduledDate      = formData.scheduledDate;
        payload.scheduledTime      = formData.scheduledTime;
        payload.timezone           = formData.timezone;
        payload.recurringFrequency = formData.recurringFrequency;
        payload.recurringDays      = formData.recurringDays||[];
        payload.recurringEndDate   = formData.recurringEndDate||null;
      }

      // ✅ FIX: For large campaigns (>100 recipients), the backend sends emails
      // asynchronously — navigating only after all emails are done would time out.
      // Instead: create the campaign (status=sending), navigate immediately to
      // Analytics so the user can watch live progress via the polling table.
      const isLargeCampaign = recipientsList.length > 100;

     if (formData.scheduleType === "immediate") {
        // All immediate sends now respond instantly (batch or not)
        // POST and capture the campaignId immediately
        setSendStatus({ success: true, message: "🚀 Launching campaign…" });

        try {
          const r    = await fetch(`${API_URL}/api/campaigns/send`, { method: "POST", headers, body: JSON.stringify(payload) });
          const data = await r.json().catch(() => ({}));

          if (!r.ok) {
            const msg = data?.error || data?.message || `Server error ${r.status}`;
            if (data?.creditLimitReached || r.status === 403) {
              setSendStatus({ success: false, message: `⚠️ ${msg}. Please upgrade.` });
              setCredits(data?.available ?? 0);
            } else {
              setSendStatus({ success: false, message: `❌ ${msg}` });
            }
            setIsSending(false);
            return;
          }

          const cid          = data.campaignId;
          const batchTotal   = data.batchTotal   || 1;
          const batchSize    = data.batchSize    || 2000;
          const estMinutes   = data.estimatedMinutes || 0;
          const total        = data.recipientCount || recipientsList.length;

          // Seed batch progress for the polling hook
          setBatchProgress({
            campaignId:                cid,
            batchCurrent:              1,
            batchTotal,
            sentCount:                 0,
            totalRecipients:           total,
            percentComplete:           0,
            estimatedMinutesRemaining: estMinutes,
            status:                    "sending",
          });

          const msg = batchTotal > 1
            ? `🚀 ${total.toLocaleString()} emails split into ${batchTotal} batch(es) of ${batchSize.toLocaleString()}. ` +
              `Estimated ~${estMinutes} min. Redirecting to live progress…`
            : `🚀 Campaign started! Sending ${total.toLocaleString()} emails. Redirecting…`;

          setSendStatus({ success: true, message: msg });
          setTimeout(() => navigate(`/analytics${cid ? `?campaignId=${cid}` : ""}`), 2000);

        } catch (fetchErr) {
          setSendStatus({ success: false, message: `❌ ${fetchErr.message}` });
          setIsSending(false);
        }
        return;
      }

      // ── NORMAL SEND (small campaign or scheduled) ────────────────────
      const res  = await fetch(`${API_URL}/api/campaigns/send`, { method:"POST", headers, body:JSON.stringify(payload) });
      let   data;
      try { data = await res.json(); } catch { data = null; }

      if (!res.ok) {
        const msg = data?.error||data?.message||`Server error ${res.status}`;
        if (data?.creditLimitReached||res.status===403) {
          setSendStatus({ success:false, message:`⚠️ ${msg}. Please upgrade.` });
          setCredits(data?.available??0);
        } else {
          setSendStatus({ success:false, message:`❌ ${msg}` });
        }
        setIsSending(false); return;
      }

      if (formData.scheduleType==="immediate") {
        const ok  = data.results?.failed?.length===0;
        const msg = ok
          ? `✅ Campaign sent! Delivered: ${data.results.success.length}`
          : `⚠️ Sent: ${data.results.success.length}, Failed: ${data.results.failed.length}`;
        setSendStatus({ success:ok, message:msg });
        if (data.creditsRemaining!==undefined) {
          setCredits(data.creditsRemaining);
          localStorage.setItem("totalEmails", data.creditsRemaining);
        }
        // ✅ Navigate with campaignId so Analytics can highlight the new campaign
        const cid = data.campaignId || "";
        setTimeout(() => navigate(`/analytics${cid ? `?campaignId=${cid}` : ""}`), 1500);
      } else {
        setSendStatus({
          success: true,
          message: formData.scheduleType==="scheduled"
            ? `✅ Scheduled for ${formData.scheduledDate} at ${formData.scheduledTime} (${formData.timezone}).`
            : `✅ Recurring campaign created (${formData.recurringFrequency}).`,
        });
        setTimeout(()=>navigate("/automation"), 4000);
      }

    } catch (err) {
      console.error("❌ handleSendCampaign error:", err);
      setSendStatus({ success:false, message:`❌ ${err.message}` });
    } finally {
      setIsSending(false);
      setBatchProgress({ current:0, total:0 });
    }
  };

  const getMinDate = () => new Date().toISOString().slice(0,10);

  /* ── auth error screen ──────────────────────────────────── */
  if (authError)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6">
        <div className="max-w-md w-full bg-gray-900 rounded-lg p-8 border border-gray-800">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Authentication Error</h2>
          <p className="text-gray-300 mb-6">Please log in to access this feature.</p>
          <button onClick={()=>navigate("/login")}
                  className="w-full py-3 bg-[#c2831f] hover:bg-[#d09025] text-white rounded-md font-medium">
            Go to Login
          </button>
        </div>
      </div>
    );

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="bg-black border-b border-gray-800 px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-white">Send Campaign</h1>

          <ShuffleSubjectModal
            isOpen={showShuffleModal}
            onClose={()=>setShowShuffleModal(false)}
            canvasPages={canvasPages}
            fromEmail={formData.fromEmail}
            fromName={formData.fromName}
            fromAddress={formData.fromAddress}
            credits={credits}
            onCreditsUpdate={(c)=>{ setCredits(c); localStorage.setItem("totalEmails",c); }}
          />

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={()=>setShowShuffleModal(true)}
                      className="px-4 py-2 text-sm text-white bg-transparent border border-[#d99c2b] rounded-md hover:bg-[#d99c2b] hover:text-black transition-all duration-300">
                <Shuffle size={16}/> Shuffle
              </button>
            </div>

            <span className="text-sm text-gray-300 bg-gray-900 px-3 py-1.5 rounded-md border border-gray-700">
              Send Email: <span className="text-[#d99c2b] font-semibold">{credits||0}</span>
            </span>

            <button onClick={()=>navigate("/texteditor")}
                    className="px-4 py-2 text-sm text-white bg-transparent border border-[#d99c2b] rounded-md hover:bg-[#d99c2b] hover:text-black transition-all duration-300">
              Text Editor Page
            </button>

            <button onClick={()=>navigate("/all-templates")}
                    className="px-4 py-2 text-sm text-white bg-transparent border border-[#d99c2b] rounded-md hover:bg-[#d99c2b] hover:text-black transition-all duration-300">
              Choose Templates
            </button>

            <button
              onClick={handleSendCampaign}
              disabled={credits<=0||!completedSteps.includes("recipients")||!completedSteps.includes("setup")||!completedSteps.includes("template")||!completedSteps.includes("schedule")||isSending}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all duration-300 shadow-md ${
                !completedSteps.includes("recipients")||!completedSteps.includes("setup")||!completedSteps.includes("template")||!completedSteps.includes("schedule")||isSending
                  ? "bg-gray-800 cursor-not-allowed text-gray-500 border border-gray-700"
                  : "bg-[#c2831f] hover:bg-[#d99c2b] text-black shadow-lg hover:shadow-[#d99c2b]/30"
              }`}
            >
              {formData.scheduleType==="immediate" ? <Send size={16}/> : <Calendar size={16}/>}
              {isSending ? "Processing…" : formData.scheduleType==="immediate" ? "Send Now" : "Schedule Campaign"}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ─────────────────────────────────────── */}
        <div className="w-64 bg-black border-r border-gray-800 p-6 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-gray-400 tracking-wider">Campaign Steps</h2>
          </div>
          <div className="relative">
            <div className="absolute left-5 top-8 bottom-0 w-0.5 bg-gray-700"></div>
            <div className="space-y-8">
              {steps.map(({id,title,description,icon:Icon})=>{
                const isCompleted = completedSteps.includes(id);
                const isExp       = expanded===id;
                return (
                  <div key={id} className="relative flex items-start">
                    <div className={`relative z-10 flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full ${isCompleted?"bg-[#c2831f]":"bg-gray-800"}`}>
                      {isCompleted ? <CheckCircle size={20} className="text-white"/> : <Icon size={18} className="text-gray-400"/>}
                    </div>
                    <div className="ml-4 pt-1">
                      <button onClick={()=>toggleExpand(id)}
                              className={`text-left ${isExp?"text-[#c2831f]":"hover:text-gray-300"}`}>
                        <div className="font-medium">{title}</div>
                        <div className="text-xs text-gray-400 mt-1">{description}</div>
                      </button>
                      {isCompleted && (
                        <div className="mt-2 text-xs text-[#c2831f] flex items-center">
                          <div className="w-2 h-2 rounded-full bg-[#c2831f] mr-1"></div>
                          Completed
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Exit */}
          <div className="mt-20 pt-6 border-t border-gray-800">
            <button onClick={()=>setShowExitModal(true)}
                    className="flex items-center gap-2 text-gray-400 hover:text-[#c2831f] transition-colors duration-300">
              <LogOut size={18}/>
              <span className="text-sm font-medium">Exit Campaign</span>
            </button>
            {showExitModal && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                <div className="bg-[#111] border border-gray-800 rounded-xl p-8 w-[90%] max-w-md text-center shadow-xl">
                  <h2 className="text-lg font-semibold text-white mb-3">Exit Campaign Setup?</h2>
                  <p className="text-gray-400 text-sm mb-6">All unsaved progress will be lost.</p>
                  <div className="flex justify-center gap-4">
                    <button onClick={()=>setShowExitModal(false)}
                            className="px-4 py-2 rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800">Cancel</button>
                    <button onClick={()=>navigate("/dashboard")}
                            className="px-4 py-2 rounded-md bg-[#c2831f] text-black font-semibold hover:bg-[#d99c2b]">Yes, Exit</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Main Content ─────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 bg-black">
          <div className="max-w-3xl mx-auto">
            {steps.map(({id,title,description})=>{
              const isExp       = expanded===id;
              const isCompleted = completedSteps.includes(id);
              return (
                <div key={id}
                     className={`mb-8 border border-gray-800 rounded-lg overflow-hidden transition-all ${isExp?"shadow-lg":""}`}>
                  <button onClick={()=>toggleExpand(id)}
                          className="flex justify-between items-center w-full px-6 py-4 bg-black hover:bg-gray-900 focus:outline-none">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${isCompleted?"bg-[#c2831f]/20 text-[#c2831f]":"bg-gray-800 text-gray-400"}`}>
                        {isCompleted ? <CheckCircle size={16}/> : <div className="w-2 h-2 bg-gray-500 rounded-full"></div>}
                      </div>
                      <div className="ml-4 text-left">
                        <div className="text-lg font-medium text-white">{title}</div>
                        <div className="text-sm text-gray-400">{description}</div>
                      </div>
                    </div>
                    {isExp ? <ChevronUp className="text-gray-400"/> : <ChevronDown className="text-gray-400"/>}
                  </button>

                  {isExp && (
                    <div className="px-6 py-5 bg-gray-900 border-t border-gray-800">

                      {/* ── RECIPIENTS ── */}
                      {id==="recipients" && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Choose an audience</label>
                            <select name="recipients"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c2831f] text-white"
                                    value={formData.recipients}
                                    onChange={e=>{ handleChange(e); setRecipientError(""); }}>
                              <option value="">Select an option</option>
                              <option value="manual">Manual (paste emails)</option>
                              <option value="file">Upload File (CSV)</option>
                            </select>

                            {formData.recipients==="manual" && (
                              <div className="mt-3">
                                <label className="block text-sm text-gray-300 mb-1">Paste emails (comma or newline)</label>
                                <textarea rows={4}
                                          className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white"
                                          value={formData.manualEmails}
                                          onChange={e=>{ setFormData({...formData,manualEmails:e.target.value}); setRecipientError(""); }}
                                          placeholder="example1@email.com, example2@email.com"/>
                              </div>
                            )}
                            {formData.recipients==="file" && (
                              <div className="mt-3">
                                <label className="block text-sm text-gray-300 mb-1">Upload CSV file</label>
                                <input type="file" accept=".csv" className="block w-full text-gray-300"
                                       onChange={e=>{ handleFileUpload(e); setRecipientError(""); }}/>
                              </div>
                            )}
                          </div>

                          {formData.recipients && (
                            <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">Recipients selected:</span>
                                <span className="text-lg font-bold text-white">{getRecipientCount()}</span>
                              </div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">Available credits:</span>
                                <span className={`text-lg font-bold ${credits>=getRecipientCount()?"text-green-400":"text-red-400"}`}>{credits}</span>
                              </div>
                              <div className="h-px bg-gray-700 my-2"></div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-400">Credits needed:</span>
                                <span className="text-lg font-bold text-[#c2831f]">{getRecipientCount()}</span>
                              </div>
                              {getRecipientCount()>credits && (
                                <div className="mt-3 p-3 bg-red-900/30 border border-red-700 rounded-md">
                                  <div className="flex items-start gap-2">
                                    <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={18}/>
                                    <div>
                                      <p className="text-red-400 font-medium text-sm">Insufficient Credits</p>
                                      <p className="text-red-300 text-xs mt-1">
                                        Need <strong>{getRecipientCount()}</strong> but have <strong>{credits}</strong>.{" "}
                                        <a href="/pricing" className="underline hover:text-red-200">Purchase more.</a>
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {credits===0 && (
                                <div className="mt-3 p-3 bg-yellow-900/30 border border-yellow-700 rounded-md">
                                  <div className="flex items-start gap-2">
                                    <AlertCircle className="text-yellow-400 flex-shrink-0 mt-0.5" size={18}/>
                                    <div>
                                      <p className="text-yellow-400 font-medium text-sm">No Credits Available</p>
                                      <p className="text-yellow-300 text-xs mt-1">
                                        <a href="/pricing" className="underline hover:text-yellow-200">Upgrade your plan.</a>
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {recipientError && (
                            <div className="mt-3 p-3 bg-red-900/30 border border-red-700 rounded-md">
                              <p className="text-red-400 text-sm">{recipientError}</p>
                            </div>
                          )}

                          <button
                            onClick={()=>{
                              const count = getRecipientCount();
                              if (!formData.recipients) { setRecipientError("Please select an audience type"); return; }
                              if (count===0) { setRecipientError("Add at least one valid email"); return; }
                              if (count>credits) { setRecipientError(`Need ${count} credits, have ${credits}.`); return; }
                              if (credits===0) { setRecipientError("You have 0 credits. Upgrade your plan."); return; }
                              setRecipientError(""); markComplete(id);
                            }}
                            className="mt-2 px-4 py-2 rounded-md bg-[#c2831f] hover:bg-[#d09025] text-white transition-colors">
                            Save and Continue
                          </button>
                        </div>
                      )}

                      {/* ── FROM / SETUP ── */}
                      {id==="setup" && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">From Email Address</label>
                            <div className="relative">
                              <input type="email" name="fromEmail" required
                                     value={formData.fromEmail} onChange={handleChange} onBlur={handleEmailBlur}
                                     className={`w-full bg-gray-800 border rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 text-white ${
                                       emailVerificationStatus===true?"border-green-500 focus:ring-green-500":
                                       emailVerificationStatus===false?"border-red-500 focus:ring-red-500":
                                       "border-gray-700 focus:ring-[#c2831f]"}`}
                                     placeholder="Enter verified sender email"/>
                              {isCheckingEmail && <div className="absolute right-3 top-1/2 -translate-y-1/2"><RefreshCw className="animate-spin text-gray-400" size={18}/></div>}
                              {!isCheckingEmail && emailVerificationStatus===true  && <div className="absolute right-3 top-1/2 -translate-y-1/2"><CheckCircle className="text-green-500" size={20}/></div>}
                              {!isCheckingEmail && emailVerificationStatus===false && <div className="absolute right-3 top-1/2 -translate-y-1/2"><AlertCircle className="text-red-500" size={20}/></div>}
                            </div>
                            {emailVerificationStatus===true && (
                              <div className="mt-2 p-3 bg-green-900/30 border border-green-700 rounded-md">
                                <div className="flex items-start gap-2">
                                  <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={18}/>
                                  <p className="text-green-400 font-medium text-sm">Email Verified ✓</p>
                                </div>
                              </div>
                            )}
                            {emailVerificationStatus===false && (
                              <div className="mt-2 p-3 bg-red-900/30 border border-red-700 rounded-md">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={18}/>
                                  <div>
                                    <p className="text-red-400 font-medium text-sm">Email Not Verified ✗</p>
                                    <p className="text-red-300 text-xs mt-1">
                                      <a href="/email-campaign" className="text-[#c2831f] underline">Request verification here.</a>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">From Name</label>
                            <input type="text" name="fromName" required value={formData.fromName} onChange={handleChange}
                                   className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c2831f] text-white"
                                   placeholder="Your sender name"/>
                          </div>

                          <div className="mt-4">
                            <label className="block text-sm text-gray-400 mb-1">Reply To Email</label>
                            <input type="email" name="replyToEmail" value={formData.replyToEmail} onChange={handleChange}
                                   placeholder="reply@yourdomain.com"
                                   className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c2831f] text-white"/>
                          </div>

                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-300 mb-1">Sender Address</label>
                            <input type="text" name="fromAddress" value={formData.fromAddress||""} onChange={handleChange}
                                   placeholder="Example: 151 14th St NW #2143, Atlanta, GA 30318 USA"
                                   className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c2831f] text-white"/>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Subject Line</label>
                            <input type="text" name="subject" required value={formData.subject} onChange={handleChange}
                                   className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c2831f] text-white"
                                   placeholder="Enter your email subject"/>
                          </div>

                          <button
                            onClick={()=>{
                              if (!formData.fromEmail||!formData.fromName) return;
                              if (emailVerificationStatus!==true) {
                                alert('Please use a verified email. Click "Request verification here" to verify.');
                                return;
                              }
                              markComplete(id);
                            }}
                            disabled={!formData.fromEmail||!formData.fromName||emailVerificationStatus!==true||isCheckingEmail}
                            className={`mt-4 px-4 py-2 rounded-md ${!formData.fromEmail||!formData.fromName||emailVerificationStatus!==true||isCheckingEmail?"bg-gray-700 cursor-not-allowed text-gray-400":"bg-[#c2831f] hover:bg-[#d09025] text-white"}`}>
                            {isCheckingEmail ? "Checking email…" : "Save and Continue"}
                          </button>
                        </div>
                      )}

                      {/* ── TEMPLATE ── */}
                      {id==="template" && (
                        <div className="space-y-4">
                          {canvasPages[0]?.elements?.length > 0 ? (
                            <div className="space-y-3">
                              <div className="flex items-start gap-3 p-4 bg-green-900/20 border border-green-700 rounded-lg">
                                <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={20}/>
                                <div>
                                  <p className="text-green-400 font-semibold text-sm">Canvas Design Ready</p>
                                  <p className="text-green-300 text-xs mt-1">
                                    {canvasPages[0].elements.length} elements loaded. The email will be sent as a pixel-perfect image matching your design exactly.
                                  </p>
                                </div>
                              </div>
                              <div className="p-3 bg-gray-800 rounded-lg border border-gray-700 text-xs text-gray-400">
                                <p className="font-medium text-gray-300 mb-1">📸 Snapshot mode active</p>
                                <p>Your canvas will be captured as an image before sending — fonts, icons, images and layout will all look exactly as in the preview.</p>
                              </div>
                              <button onClick={()=>markComplete(id)}
                                      className="mt-2 px-4 py-2 rounded-md bg-[#c2831f] hover:bg-[#d09025] text-white transition-colors">
                                Confirm &amp; Continue
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <label className="block text-sm font-medium text-gray-300 mb-3">
                                No canvas design detected. Choose a template or go to the editor.
                              </label>
                              <div className="grid grid-cols-3 gap-4">
                                {["basic","newsletter","promotion"].map(t=>(
                                  <div key={t}
                                       onClick={()=>handleTemplateSelect(t)}
                                       className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${formData.template===t?"border-[#c2831f] bg-[#c2831f]/10":"border-gray-700 hover:border-gray-600"}`}>
                                    <div className="h-32 bg-gray-800 rounded mb-2 flex items-center justify-center">
                                      <span className="text-sm text-gray-400">{t.charAt(0).toUpperCase()+t.slice(1)}</span>
                                    </div>
                                    <div className="text-sm font-medium text-center text-white">{t.charAt(0).toUpperCase()+t.slice(1)}</div>
                                  </div>
                                ))}
                              </div>
                              <button onClick={()=>navigate("/editor")}
                                      className="mt-2 px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-sm">
                                ← Go to Canvas Editor
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── SCHEDULE ── */}
                      {id==="schedule" && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-3">When to send</label>
                            <div className="space-y-3">
                              <label className="flex items-center">
                                <input type="radio" name="scheduleType" value="immediate"
                                       checked={formData.scheduleType==="immediate"} onChange={handleChange}
                                       className="mr-3 accent-[#c2831f]"/>
                                <div>
                                  <div className="font-medium text-white">Send Immediately</div>
                                  <div className="text-sm text-gray-400">Send as soon as you confirm</div>
                                </div>
                              </label>
                              <label className="flex items-center">
                                <input type="radio" name="scheduleType" value="scheduled"
                                       checked={formData.scheduleType==="scheduled"} onChange={handleChange}
                                       className="mr-3 accent-[#c2831f]"/>
                                <div>
                                  <div className="font-medium text-white">Schedule for Later</div>
                                  <div className="text-sm text-gray-400">Pick a specific date and time</div>
                                </div>
                              </label>
                            </div>
                          </div>

                          {formData.scheduleType==="scheduled" && (
                            <div className="mt-4 p-4 bg-gray-800 rounded-lg space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
                                  <input type="date" name="scheduledDate" min={getMinDate()}
                                         className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                                         value={formData.scheduledDate} onChange={handleChange}/>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-1">Time</label>
                                  <input type="time" name="scheduledTime"
                                         className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                                         value={formData.scheduledTime} onChange={handleChange}/>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Timezone</label>
                                <select name="timezone"
                                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                                        value={formData.timezone} onChange={handleChange}>
                                  <option value="America/New_York">Eastern Time</option>
                                  <option value="America/Chicago">Central Time</option>
                                  <option value="America/Denver">Mountain Time</option>
                                  <option value="America/Los_Angeles">Pacific Time</option>
                                  <option value="Europe/London">London</option>
                                  <option value="Europe/Paris">Paris</option>
                                  <option value="Asia/Tokyo">Tokyo</option>
                                  <option value="Asia/Kolkata">India</option>
                                </select>
                              </div>
                            </div>
                          )}

                          <button
                            onClick={()=>markComplete(id)}
                            disabled={formData.scheduleType==="scheduled"&&(!formData.scheduledDate||!formData.scheduledTime)}
                            className={`mt-2 px-4 py-2 rounded-md ${formData.scheduleType==="scheduled"&&(!formData.scheduledDate||!formData.scheduledTime)?"bg-gray-700 cursor-not-allowed":"bg-[#c2831f] hover:bg-[#d09025] text-white"}`}>
                            Save and Continue
                          </button>
                        </div>
                      )}

                      {/* ── CONFIRM ── */}
                      {id==="confirm" && (
                        <div className="space-y-6">
                          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                            <h3 className="font-medium text-white mb-3">Campaign Summary</h3>
                            <div className="space-y-2 text-sm">
                              {[
                                ["Campaign",   formData.subject||"Untitled Campaign"],
                                ["Recipients", formData.recipients==="all-subscribers" ? `All Subscribers (${contacts.length})` :
                                               formData.recipients==="new-customers"   ? `New Customers (${contacts.filter(c=>c.type==="new-customer").length})` :
                                               formData.recipients==="vip-clients"     ? `VIP Clients (${contacts.filter(c=>c.type==="vip-client").length})` :
                                               formData.recipients==="manual"           ? `Manual (${getRecipientCount()})` :
                                               formData.recipients==="file"             ? `File Upload (${getRecipientCount()})` : "Not selected"],
                                ["From",       `${formData.fromName} <${formData.fromEmail}>`],
                                ["Subject",    formData.subject||"Not set"],
                                ["Template",   canvasPages[0]?.elements?.length ? "Canvas Design (snapshot)" : formData.template],
                                ["Schedule",   formData.scheduleType==="immediate" ? "Send Immediately" :
                                               formData.scheduleType==="scheduled" ? `${formData.scheduledDate} at ${formData.scheduledTime}` : "Not set"],
                              ].map(([label,val])=>(
                                <div key={label} className="flex">
                                  <span className="w-32 text-gray-400">{label}:</span>
                                  <span className="font-medium text-white">{val}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {sendStatus && (
                            <div className={`mt-4 p-3 rounded ${sendStatus.success?"bg-green-900/30 text-green-400":"bg-yellow-900/30 text-yellow-400"}`}>
                              {sendStatus.message}
                            </div>
                          )}

                         {/* ── Batch Progress Panel ── */}
                          {batchProgress.batchTotal > 0 && batchProgress.status === "sending" && (
                            <div className="mt-4 p-4 rounded-lg bg-gray-800 border border-gray-700 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-[#d99c2b]">
                                  📦 Batch {batchProgress.batchCurrent} of {batchProgress.batchTotal}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {batchProgress.estimatedMinutesRemaining > 0
                                    ? `~${batchProgress.estimatedMinutesRemaining} min remaining`
                                    : "Finishing up…"}
                                </span>
                              </div>

                              {/* Overall progress bar */}
                              <div>
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                  <span>{batchProgress.sentCount.toLocaleString()} sent</span>
                                  <span>{batchProgress.totalRecipients.toLocaleString()} total</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2.5">
                                  <div
                                    className="bg-[#c2831f] h-2.5 rounded-full transition-all duration-500"
                                    style={{ width: `${batchProgress.percentComplete}%` }}
                                  />
                                </div>
                                <p className="text-xs text-gray-500 mt-1 text-right">{batchProgress.percentComplete}% complete</p>
                              </div>

                              {/* Batch strip */}
                              <div className="flex gap-1 flex-wrap">
                                {Array.from({ length: batchProgress.batchTotal }, (_, i) => {
                                  const n         = i + 1;
                                  const isDone    = n < batchProgress.batchCurrent;
                                  const isActive  = n === batchProgress.batchCurrent;
                                  return (
                                    <div
                                      key={n}
                                      title={`Batch ${n}`}
                                      className={`h-2 flex-1 min-w-[8px] rounded-sm transition-all duration-300 ${
                                        isDone   ? "bg-green-500" :
                                        isActive ? "bg-[#c2831f] animate-pulse" :
                                                  "bg-gray-600"
                                      }`}
                                    />
                                  );
                                })}
                              </div>

                              <p className="text-xs text-gray-500">
                                Each batch of 2,000 emails is spread evenly over 30 minutes to protect deliverability.
                              </p>
                            </div>
                          )}

                          {/* Completed banner */}
                          {batchProgress.batchTotal > 0 && batchProgress.status === "completed" && (
                            <div className="mt-4 p-3 rounded bg-green-900/30 text-green-400 text-sm">
                              ✅ All {batchProgress.batchTotal} batch(es) complete — {batchProgress.sentCount.toLocaleString()} emails delivered!
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Preview + drag handle ──────────────────────── */}
        <div style={{ display:"flex", flexDirection:"row", height:"100%", userSelect:"none" }}>
          <div onMouseDown={()=>setIsDragging(true)}
               style={{ width:"6px", cursor:"col-resize", background:"#222", zIndex:50, transition:"background 0.2s" }}
               onMouseEnter={e=>e.target.style.background="#444"}
               onMouseLeave={e=>e.target.style.background="#222"}/>

          <div style={{ width:previewWidth, minWidth:"350px", maxWidth:"900px",
                        borderLeft:"1px solid #333", background:"#1a1a1a",
                        display:"flex", flexDirection:"column", maxHeight:"100vh" }}>
            <div className="p-4 border-b border-gray-800">
              <h3 className="font-bold text-lg text-white">Email Preview</h3>
              <p className="text-xs text-gray-500 mt-0.5">This is exactly how it will look in the inbox</p>
            </div>

            <div className="flex-1 p-4" style={{ overflowY:"auto" }}>
              <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-auto">
                <ErrorBoundary>
                  <EmailPreview
                    pages={canvasPages}
                    activePage={canvasActivePage}
                    zoomLevel={canvasZoomLevel}
                    formData={formData}
                    canvasBackgroundColor={canvasBackgroundColor}
                    previewRef={canvasPreviewRef}   /* ← ref for html2canvas */
                  />
                </ErrorBoundary>
              </div>
            </div>

            <div className="p-4 border-t border-gray-800">
              <button
                onClick={handleSendCampaign}
                disabled={credits<=0||!completedSteps.includes("recipients")||!completedSteps.includes("setup")||!completedSteps.includes("template")||!completedSteps.includes("schedule")||isSending}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-md text-white ${
                  !completedSteps.includes("recipients")||!completedSteps.includes("setup")||!completedSteps.includes("template")||!completedSteps.includes("schedule")||isSending
                    ? "bg-gray-800 cursor-not-allowed"
                    : "bg-[#c2831f] hover:bg-[#d09025]"
                }`}>
                {formData.scheduleType==="immediate" ? <Send size={16}/> : <Calendar size={16}/>}
                {isSending ? "Processing…" : formData.scheduleType==="immediate" ? "Send Now" : "Schedule Campaign"}
              </button>
            </div>
          </div>

          <div onMouseDown={()=>setIsDragging(true)}
               style={{ width:"6px", cursor:"col-resize", background:"#222" }}
               onMouseEnter={e=>e.target.style.background="#444"}
               onMouseLeave={e=>e.target.style.background="#222"}/>
        </div>

      </div>
    </div>
  );
}