/**
 * EditorPage.jsx  — MAIN ORCHESTRATOR
 * Dark Gold & Black luxury theme
 * Imports: ToolsPanel, CanvasArea, PropertiesPanel
 */
import React, { useState, useRef, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ToolsPanel     from "./../Components/Editor/Toolbox";
import CanvasArea     from "../Components/Editor/CanvasArea";
import PropertiesPanel from "../Components/Editor/PropertiesPanel";
import SaveTemplateModal from "../Components/Editor/SaveTemplate";
import { TEMPLATE_TYPES } from "./savedTemplateService";

// ── Design tokens ──────────────────────────────────────────────────────────────
/* ── Editor themes ──────────────────────────────────────────────────────────
   `T` is a live object: switching mode rewrites its keys in place, so every
   `style={{ color: T.gold }}` in the editor picks up the new palette on the
   next render without threading a context through ~300 call sites.
   Only Template Studio uses it — leaving the editor restores dark.          */
export const THEMES = {
  dark: {
    bg:        "#0A0A0A",
    surface:   "#111111",
    panel:     "#161616",
    border:    "#2A2200",
    gold:      "#C9A84C",
    goldBright:"#F0C040",
    goldDim:   "#7A6020",
    muted:     "#5A5040",
    txt:       "#E8D8A0",
    txtDim:    "#8A7850",
    white:     "#F5EDD0",
    danger:    "#C04020",
    success:   "#40A060",
    canvasEdge:"rgba(0,0,0,.55)",
    grid:      "rgba(122,96,32,.22)",   // grid lines over the white page
    // Top bar and panel headers match the panels in dark mode
    bar:       "#161616",
    barTxt:    "#E8D8A0",
    barAccent: "#C9A84C",     // active/hover colour for controls on the bar
    barBorder: "#2A2200",
    label:     "#7A6020",     // section headings in the side panels
    header:    "transparent",
    headerTxt: "#C9A84C",
  },
  // Blue scheme: white panels, navy top bar, blue accent.
  // `gold` is really the accent slot — it carries blue here.
  light: {
    bg:        "#EDF3FB",   // workspace behind the page
    surface:   "#FFFFFF",
    panel:     "#FFFFFF",
    border:    "#D8E4F3",
    gold:      "#1A73E8",   // accent
    goldBright:"#1669D6",
    goldDim:   "#9CC2F0",
    muted:     "#7A93B2",
    txt:       "#132A47",
    txtDim:    "#5B7392",
    white:     "#FFFFFF",
    danger:    "#D93025",
    success:   "#188038",
    canvasEdge:"rgba(19,42,71,.14)",
    grid:      "rgba(26,115,232,.10)",
    // Navy top bar with white text, and a blue Properties header
    bar:       "#0D2B4E",
    barTxt:    "#FFFFFF",
    barAccent: "#7FB3F5",     // light blue reads on navy; T.gold would not
    barBorder: "#2C4E77",
    label:     "#1A73E8",
    header:    "#1A73E8",
    headerTxt: "#FFFFFF",
  },
};

export const T = { ...THEMES.dark };

export const THEME_KEY = "editorTheme";

/** Swap the live palette. Returns the mode applied. */
export function applyEditorTheme(mode) {
  const next = THEMES[mode] ? mode : "dark";
  Object.assign(T, THEMES[next]);
  return next;
}

// ── Element factory ────────────────────────────────────────────────────────────
/** Text-inside-shape defaults — shapes are containers, not just fills. */
const SHAPE_TEXT = {
  fontSize: 16, fontWeight: "600", fontFamily: "Arial",
  color: "#FFFFFF", textAlign: "center", verticalAlign: "middle",
  fontStyle: "normal", textDecoration: "none", lineHeight: 1.3,
  imageSrc: "", imageFit: "cover",
};

// Defined in editorConstants.js (a leaf module) to keep them out of the
// EditorPage <-> CanvasArea import cycle. Re-exported so existing imports
// of `SHAPE_TYPES` from this file keep working.
export { SHAPE_TYPES, BORDER_STYLES, TEXT_TYPES, LINK_COLOR } from "./editorConstants";

export function makeEl(type, opts = {}) {
  const base = {
    id:       crypto.randomUUID(),
    type,
    x:        80 + Math.random() * 60,
    y:        80 + Math.random() * 60,
    rotation: 0,
    opacity:  1,
    zIndex:   Date.now(),
    ...opts,
  };
  const defaults = {
    heading:    { content:"Add a Heading",   width:380, height:60,  fontSize:36, fontWeight:"bold",   color:"#000000", backgroundColor:"transparent", fontFamily:"Georgia", textAlign:"left", fontStyle:"normal", textDecoration:"none", lineHeight:1.3 },
    subheading: { content:"Add a Subheading",width:320, height:48,  fontSize:24, fontWeight:"600",    color:"#000000", backgroundColor:"transparent", fontFamily:"Georgia", textAlign:"left", fontStyle:"normal", textDecoration:"none", lineHeight:1.3 },
    paragraph:  { content:"Add paragraph text here. Click to edit and start typing your content.", width:360, height:80, fontSize:15, fontWeight:"normal", color:"#000000", backgroundColor:"transparent", fontFamily:"'Trebuchet MS'", textAlign:"left", fontStyle:"normal", textDecoration:"none", lineHeight:1.6 },
    blockquote: { content:'"An inspiring quote goes here."', width:340, height:90, fontSize:19, fontWeight:"normal", fontStyle:"italic", color:"#000000", backgroundColor:"transparent", fontFamily:"Georgia", textAlign:"center", lineHeight:1.5 },
    button:     { content:"Click Me", width:160, height:48, fontSize:15, fontWeight:"700", color:"#FFFFFF", backgroundColor:"#000000", borderRadius:6, fontFamily:"'Trebuchet MS'", textAlign:"center" },
    rectangle:  { content:"", width:220, height:130, backgroundColor:"#000000", borderRadius:6,  borderColor:"#000000", borderWidth:0, borderStyle:"solid", ...SHAPE_TEXT },
    square:     { content:"", width:160, height:160, backgroundColor:"#000000", borderRadius:6,  borderColor:"#000000", borderWidth:0, borderStyle:"solid", ...SHAPE_TEXT },
    circle:     { content:"", width:150, height:150, backgroundColor:"#000000", borderRadius:999, borderColor:"#000000", borderWidth:0, borderStyle:"solid", ...SHAPE_TEXT },
    triangle:   { content:"", width:170, height:150, backgroundColor:"#000000", borderRadius:0,  borderColor:"#000000", borderWidth:0, borderStyle:"solid", ...SHAPE_TEXT },
    star:       { content:"", width:90,  height:90,  backgroundColor:"#000000" },
    line:       { content:"", width:280, height:3,   strokeColor:"#000000", strokeWidth:3 },
    image:      { src: opts.src || "https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=260&fit=crop", width:300, height:190, borderRadius:4, objectFit:"cover" },
    social:     { src:opts.src, width:44, height:44, platform:opts.platform, link:opts.link||"#" },
    "emoji-icon": { emoji:opts.emoji||"⭐", fontSize:opts.fontSize||32, width:opts.width||48, height:opts.height||48 },
  };
  return { ...(defaults[type] || { width:150, height:50 }), ...base };
}

export const FONTS = ["Georgia","'Trebuchet MS'","'Times New Roman'","Verdana","'Palatino Linotype'","Impact","'Courier New'","'Comic Sans MS'"];
export const COLORS = ["#000000","#F0C040","#C9A84C","#7A6020","#2A2200","#0A0A0A","#1A1A1A","#FFFFFF","#F5EDD0","#C04020","#204060","#406020","#602040","#C8B880","#E8D8A0","#5A5040","#8A7850"];

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TemplateEditorPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const template = location.state?.template;

  // Pages: each page = { id, elements[], bgColor }
  const [pages,       setPages]       = useState([{ id: crypto.randomUUID(), elements:[], bgColor:"#ffffff" }]);
  const [activePage,  setActivePage]  = useState(0);
  const [selected,    setSelected]    = useState(null);   // element id
  const [zoom,        setZoom]        = useState(1);
  const [showGrid,    setShowGrid]    = useState(true);
  const [undoStack,   setUndoStack]   = useState([]);
  const [redoStack,   setRedoStack]   = useState([]);
  const [toast,       setToast]       = useState(null);
  const [showExit,    setShowExit]    = useState(false);

  const [themeMode, setThemeMode] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
    } catch { return "dark"; }   // private browsing
  });

  /* Re-assert the palette on EVERY render, not just once.

     `T` is a mutable module object, and the unmount cleanup below resets it to
     dark so other pages keep their own theme. React StrictMode mounts,
     unmounts and remounts in development, which fired that cleanup moments
     after the first mount — leaving T dark while themeMode still said "light".
     Nothing re-applied it, so the editor flipped back to gold as soon as
     anything re-rendered (clicking a tool tab, selecting an element, typing).

     Applying here is safe: it's an idempotent write of a constant, and doing
     it during render means the very next paint already uses the right colours,
     which an effect could not guarantee. */
  applyEditorTheme(themeMode);

  const toggleTheme = () => {
    setThemeMode(prev => {
      const next = prev === "dark" ? "light" : "dark";
      applyEditorTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch { /* private browsing */ }
      return next;
    });
  };

  // Template Studio only — restore dark when the editor is actually left
  useEffect(() => () => { applyEditorTheme("dark"); }, []);
  const [leftTab,     setLeftTab]     = useState("elements"); // "elements"|"photos"|"colors"
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [propOpen,    setPropOpen]    = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const userId = localStorage.getItem("userId");
  // Load template
  useEffect(() => {
    if (!template) return;
    if (template.content && Array.isArray(template.content)) {
      setPages([{ id: crypto.randomUUID(), elements: template.content, bgColor: template.canvasBackgroundColor || "#ffffff" }]);
    }
  }, [template]);

  // ── helpers ──
  const activeElements = pages[activePage]?.elements || [];
  const selectedEl     = activeElements.find(e => e.id === selected) || null;

  const showToast = (msg, type="gold") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2000);
  };

  // ── page bg ──
  const setPageBg = (color) => {
    setPages(ps => ps.map((p,i) => i===activePage ? { ...p, bgColor:color } : p));
  };

  // ── undo/redo ──
  // pagesRef always holds the latest pages so saveUndo can snapshot without stale closure
  const pagesRef = useRef(pages);
  useEffect(() => { pagesRef.current = pages; }, [pages]);

  // saveUndo — call AFTER a live update to snapshot the current state
  const saveUndo = useCallback(() => {
    setUndoStack(u => [...u.slice(-19), JSON.parse(JSON.stringify(pagesRef.current))]);
    setRedoStack([]);
  }, []);

  const commitPages = (newPages) => {
    setUndoStack(u => [...u.slice(-19), JSON.parse(JSON.stringify(pagesRef.current))]);
    setRedoStack([]);
    setPages(newPages);
  };

  const undo = () => {
    if (!undoStack.length) return;
    setRedoStack(r => [JSON.parse(JSON.stringify(pages)), ...r.slice(0,19)]);
    setPages(undoStack[undoStack.length-1]);
    setUndoStack(u => u.slice(0,-1));
    setSelected(null);
  };
  const redo = () => {
    if (!redoStack.length) return;
    setUndoStack(u => [...u.slice(-19), JSON.parse(JSON.stringify(pages))]);
    setPages(redoStack[0]);
    setRedoStack(r => r.slice(1));
    setSelected(null);
  };

  const getSpawnPos = () => {
    // Try to get the center of the visible canvas area
    if (typeof CanvasArea.getViewCenter === "function") {
      const c = CanvasArea.getViewCenter();
      if (c) return { x: c.x + Math.random() * 30 - 15, y: c.y + Math.random() * 30 - 15 };
    }
    return { x: 80 + Math.random() * 60, y: 80 + Math.random() * 60 };
  };

  // ── element CRUD ──
  const addElement = (type, opts={}) => {
    const pos = getSpawnPos();
    const el = type === "emoji-icon"
      ? { id:crypto.randomUUID(), type:"emoji-icon", x:pos.x, y:pos.y, rotation:0, opacity:1, zIndex:Date.now(), emoji:opts.emoji||"⭐", fontSize:opts.fontSize||32, width:opts.width||48, height:opts.height||48, ...opts }
      : makeEl(type, { x: pos.x, y: pos.y, ...opts });
    const np = pages.map((p,i) => i===activePage ? { ...p, elements:[...p.elements, el] } : p);
    commitPages(np);
    setSelected(el.id);
    showToast(`${type} added ✦`);
  };

  // addMultipleElements — used by card templates to drop a group of pre-built elements
  const addMultipleElements = (els) => {
    // Assign a shared groupId so the card can be moved as a group
    const groupId = crypto.randomUUID();

    // Offset the card to spawn near the current view center
    const pos = getSpawnPos();
    // Find the top-left of the card elements to use as reference
    const minX = Math.min(...els.map(e => e.x));
    const minY = Math.min(...els.map(e => e.y));
    const offsetX = pos.x - minX;
    const offsetY = pos.y - minY;

    const tagged = els.map(e => ({
      ...e,
      groupId,
      x: e.x + offsetX,
      y: e.y + offsetY,
    }));
    const np = pages.map((p,i) => i===activePage ? { ...p, elements:[...p.elements, ...tagged] } : p);
    commitPages(np);
    setSelected(tagged[0]?.id || null);
    showToast("Card added ✦");
  };

  const updateEl = (id, updates) => {
    setPages(ps => ps.map((p,i) => i!==activePage ? p : {
      ...p, elements: p.elements.map(e => e.id===id ? { ...e, ...updates } : e)
    }));
  };

  const updateMultiEl = (updates) => {
    // updates: [{id, ...fields}, ...]
    setPages(ps => ps.map((p,i) => i!==activePage ? p : {
      ...p, elements: p.elements.map(e => {
        const u = updates.find(x => x.id === e.id);
        return u ? { ...e, ...u } : e;
      })
    }));
  };

  const deleteEl = (id) => {
    const tid = id || selected;
    if (!tid) return;
    const np = pages.map((p,i) => i!==activePage ? p : { ...p, elements: p.elements.filter(e=>e.id!==tid) });
    commitPages(np);
    if (selected===tid) setSelected(null);
    showToast("Removed", "danger");
  };

  const duplicateEl = (id) => {
    const tid = id || selected;
    const el = activeElements.find(e=>e.id===tid);
    if (!el) return;
    const dup = { ...JSON.parse(JSON.stringify(el)), id:crypto.randomUUID(), x:el.x+22, y:el.y+22, zIndex:Date.now() };
    const np = pages.map((p,i) => i!==activePage ? p : { ...p, elements:[...p.elements, dup] });
    commitPages(np);
    setSelected(dup.id);
    showToast("Duplicated ✦");
  };

  const clearPage = () => {
    const np = pages.map((p,i) => i!==activePage ? p : { ...p, elements:[] });
    commitPages(np);
    setSelected(null);
    showToast("Canvas cleared", "danger");
  };

  // ── z-order ──
  const bringForward = () => {
    const idx = activeElements.findIndex(e=>e.id===selected);
    if (idx<activeElements.length-1) {
      const a=[...activeElements]; [a[idx],a[idx+1]]=[a[idx+1],a[idx]];
      setPages(ps=>ps.map((p,i)=>i!==activePage?p:{...p,elements:a}));
    }
  };
  const sendBackward = () => {
    const idx = activeElements.findIndex(e=>e.id===selected);
    if (idx>0) {
      const a=[...activeElements]; [a[idx],a[idx-1]]=[a[idx-1],a[idx]];
      setPages(ps=>ps.map((p,i)=>i!==activePage?p:{...p,elements:a}));
    }
  };

  // ── pages ──
  const addPage = () => {
    const np = [...pages, { id:crypto.randomUUID(), elements:[], bgColor:"#ffffff" }];
    setPages(np);
    setActivePage(np.length-1);
    setSelected(null);
    showToast(`Page ${np.length} added ✦`);
  };
  const removePage = (idx) => {
    if (pages.length===1) return showToast("Can't remove last page","danger");
    const np = pages.filter((_,i)=>i!==idx);
    setPages(np);
    setActivePage(Math.min(activePage, np.length-1));
    setSelected(null);
  };

  // ── keyboard ──
  useEffect(() => {
    const h = (e) => {
      if (["INPUT","TEXTAREA","SELECT"].includes(e.target.tagName)) return;
      if (e.target.isContentEditable || e.target.closest?.(".bc-edit")) return;
      if ((e.metaKey||e.ctrlKey)&&e.key==="z") { e.preventDefault(); undo(); }
      if ((e.metaKey||e.ctrlKey)&&e.key==="y") { e.preventDefault(); redo(); }
      if ((e.metaKey||e.ctrlKey)&&e.key==="d") { e.preventDefault(); duplicateEl(); }
      if (e.key==="Delete"||e.key==="Backspace") { e.preventDefault(); deleteEl(); }
    };
    window.addEventListener("keydown",h);
    return ()=>window.removeEventListener("keydown",h);
  });

  // ── send campaign ──
  const handleSend = () => {
navigate("/send-campaign", {
  state: { 
    canvasData: activeElements,
    canvasBackgroundColor: pages[activePage]?.bgColor,
    subject: "",
    timestamp: Date.now()
  }
});
  };

  // ── shared props passed down ──
  const canvasProps = {
    pages, activePage, setActivePage, selected, setSelected, zoom, showGrid,
    updateEl, updateMultiEl, saveUndo, deleteEl, duplicateEl, bringForward, sendBackward,
    clearPage, addPage, removePage,
  };
  const toolsProps = {
    leftTab, setLeftTab,
    addElement,
    addMultipleElements,
    zoom, setZoom,
    showGrid, setShowGrid,
    undoStack, redoStack, undo, redo,
    pagesBg: pages[activePage]?.bgColor,
    setPageBg,
    selected, selectedEl,
    deleteEl: ()=>deleteEl(),
    duplicateEl: ()=>duplicateEl(),
    clearPage,
  };
  const propProps = {
    selectedEl,
    updateEl,
    bringForward, sendBackward,
    deleteEl: ()=>deleteEl(),
    duplicateEl: ()=>duplicateEl(),
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:T.bg, color:T.txt, fontFamily:"'Trebuchet MS', Georgia, serif", overflow:"hidden" }}>

      {/* ── TOP NAV BAR ── */}
      <nav style={{
        height:52, display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 14px", background:T.bar, color:T.barTxt, borderBottom:`1px solid ${T.border}`,
        flexShrink:0, gap:10, zIndex:50,
        boxShadow:`0 1px 0 ${T.goldDim}44`,
      }}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
          <div style={{ width:30, height:30, borderRadius:7, background:`linear-gradient(135deg,${T.goldBright},${T.goldDim})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>✦</div>
          <span style={{ fontWeight:700, fontSize:15, color:T.barTxt, letterSpacing:".04em", fontFamily:"Georgia" }}>Template Studio</span>
        </div>

        {/* Centre toolbar */}
        <div style={{ display:"flex", alignItems:"center", gap:4, flex:1, justifyContent:"center", flexWrap:"wrap" }}>
          <TBtn title="Undo (Ctrl+Z)" disabled={!undoStack.length} onClick={undo}>↩</TBtn>
          <TBtn title="Redo (Ctrl+Y)" disabled={!redoStack.length} onClick={redo}>↪</TBtn>
          <Sep/>
          <TBtn title="Toggle Grid" active={showGrid} onClick={()=>setShowGrid(g=>!g)}>⊞</TBtn>
          <TBtn title="Clear Canvas" onClick={clearPage}>⊘</TBtn>
          <Sep/>
          <TBtn title="Zoom Out" onClick={()=>setZoom(z=>Math.max(.3,+(z-.1).toFixed(1)))}>−</TBtn>
          <span style={{ fontSize:12, minWidth:38, textAlign:"center", color:T.txtDim }}>{Math.round(zoom*100)}%</span>
          <TBtn title="Zoom In"  onClick={()=>setZoom(z=>Math.min(2,+(z+.1).toFixed(1)))}>+</TBtn>
          <TBtn title="Reset zoom" onClick={()=>setZoom(1)} style={{fontSize:10}}>1:1</TBtn>
          <Sep/>
          {/* Panel toggles */}
          <TBtn title="Toggle Tools" active={sidebarOpen} onClick={()=>setSidebarOpen(s=>!s)} style={{fontSize:11}}>☰</TBtn>
          <TBtn title="Toggle Properties" active={propOpen} onClick={()=>setPropOpen(p=>!p)} style={{fontSize:11}}>⚙</TBtn>
          <Sep/>
          <TBtn
            title={themeMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={toggleTheme}
            style={{ fontSize:13 }}
          >{themeMode === "dark" ? "☀" : "☾"}</TBtn>
        </div>

        {/* Right */}
        <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>

          <button
            onClick={() => setShowSaveModal(true)}
            style={{
              ...outlineBtn,
              borderColor: T.gold,
              color: T.gold
            }}
          >
            Save Templates
          </button>

          <button onClick={()=>setShowExit(true)} style={outlineBtn}>
            Exit
          </button>

          <button onClick={handleSend} style={primaryBtn}>
            Send →
          </button>

        </div>
        {showSaveModal && (
        // CORRECT ✅
        <SaveTemplateModal
          type={TEMPLATE_TYPES.CANVAS}
          content={pages[activePage]?.elements}
          canvasBackground={pages[activePage]?.bgColor}
          defaultName={template?.name || ""}
          onClose={() => setShowSaveModal(false)}
          onSaved={(row) => showToast(`Saved "${row.name}"`)}
        />
        )}
      </nav>

      {/* ── BODY ROW ── */}
      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

        {/* LEFT: ToolsPanel */}
        {sidebarOpen && (
          <ToolsPanel {...toolsProps} />
        )}

        {/* CENTRE: Canvas + page tabs */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>
          <CanvasArea
            {...canvasProps}
            pages={pages}
            activePage={activePage}
            setActivePage={setActivePage}
            addPage={addPage}
            removePage={removePage}
            zoom={zoom}
            showGrid={showGrid}
          />
        </div>

        {/* RIGHT: PropertiesPanel */}
        {propOpen && (
          <PropertiesPanel {...propProps} />
        )}
      </div>

      {/* ── TOAST ── */}
      {toast && (
        <div style={{
          position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
          padding:"9px 20px", borderRadius:8, fontWeight:600, fontSize:13, zIndex:9999,
          background: toast.type==="danger" ? T.danger : toast.type==="gold" ? T.gold : T.gold,
          color: toast.type==="danger" ? "#fff" : T.bg,
          boxShadow:"0 4px 24px rgba(0,0,0,.6)",
          border:`1px solid ${toast.type==="danger"?"#ff6040":T.goldBright}`,
          animation:"toastIn .2s ease",
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── EXIT MODAL ── */}
      {showExit && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999 }}>
          <div style={{ background:T.panel, border:`1px solid ${T.border}`, borderRadius:14, padding:32, width:320, textAlign:"center", boxShadow:`0 20px 60px rgba(0,0,0,.8), 0 0 0 1px ${T.goldDim}` }}>
            <div style={{ fontSize:36, marginBottom:10 }}>✦</div>
            <div style={{ fontSize:17, fontWeight:700, color:T.gold, marginBottom:6, fontFamily:"Georgia" }}>Leave the Editor?</div>
            <div style={{ fontSize:13, color:T.txtDim, marginBottom:24 }}>Unsaved changes will be lost.</div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setShowExit(false)} style={{ ...outlineBtn, flex:1, padding:"10px 0" }}>Stay</button>
              <button onClick={()=>navigate("/email-campaign")} style={{ ...primaryBtn, flex:1, padding:"10px 0", background:T.danger, borderColor:T.danger }}>Leave</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
        *,:before,:after { box-sizing:border-box; }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:${T.bg}; }
        ::-webkit-scrollbar-thumb { background:${T.goldDim}; border-radius:99px; }
        input[type=range] { accent-color:${T.gold}; cursor:pointer; }
        input[type=color] { cursor:pointer; }
      `}</style>
    </div>
  );
}

// ── Shared tiny components exported for use in child files ──
export function TBtn({ children, onClick, disabled, active, title, style }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      style={{
        width:30, height:30, borderRadius:6, border:`1px solid ${active?T.barAccent:T.barBorder}`,
        background: active ? `${T.barAccent}33` : "transparent",
        color: active ? T.barAccent : disabled ? T.muted : T.barTxt,
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize:14, display:"flex", alignItems:"center", justifyContent:"center",
        opacity: disabled ? .4 : 1, flexShrink:0, transition:"all .12s", ...style,
      }}
      onMouseOver={e=>{ if(!disabled){ e.currentTarget.style.borderColor=T.barAccent; e.currentTarget.style.color=T.barAccent; } }}
      onMouseOut={e=>{ e.currentTarget.style.borderColor=active?T.barAccent:T.barBorder; e.currentTarget.style.color=active?T.barAccent:disabled?T.muted:T.barTxt; }}
    >{children}</button>
  );
}
export function Sep() { return <div style={{ width:1, height:22, background:T.barBorder, margin:"0 2px" }} />; }
export function SLabel({ children }) {
  return <div style={{ fontSize:10, fontWeight:700, color:T.label, letterSpacing:".1em", textTransform:"uppercase", marginBottom:7 }}>{children}</div>;
}
export function PRow({ label, children }) {
  return (
    <div style={{ marginBottom:11 }}>
      <div style={{ fontSize:11, color:T.txtDim, marginBottom:3 }}>{label}</div>
      {children}
    </div>
  );
}
export const inputStyle = {
  width:"100%", padding:"7px 10px", borderRadius:7, fontSize:13, outline:"none",
  get border()     { return `1px solid ${T.border}`; },
  get background() { return T.surface; },
  get color()      { return T.txt; },
};
export const selectStyle = {
  width:"100%", padding:"7px 10px", borderRadius:7, fontSize:13, outline:"none",
  get border()     { return `1px solid ${T.border}`; },
  get background() { return T.surface; },
  get color()      { return T.txt; },
};
const primaryBtn = {
  padding:"7px 18px", borderRadius:7, fontWeight:700, cursor:"pointer",
  fontSize:13, fontFamily:"inherit",
  get border()     { return `1px solid ${T.gold}`; },
  get background() { return `linear-gradient(135deg,${T.gold},${T.goldDim})`; },
  get color()      { return T.bg; },
};
// Sits on the top bar, so it follows the bar tokens
const outlineBtn = {
  padding:"7px 14px", borderRadius:7, background:"transparent",
  cursor:"pointer", fontSize:13, fontFamily:"inherit",
  get border() { return `1px solid ${T.barBorder}`; },
  get color()  { return T.barTxt; },
};