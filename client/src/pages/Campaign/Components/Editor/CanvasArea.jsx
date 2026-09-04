/**
 * CanvasArea.jsx  — CENTRE CANVAS  (v2 — fixed)
 *
 * FIXES:
 *  ① Undo/Redo now works for EVERY action (move, resize, edit, delete, add)
 *     — drag/resize commit to undo stack on mouseUp, not on every mousemove
 *  ② Bottom-right corner drag handle extends canvas height dynamically
 *     (drag down = taller page; drag up = shorter page, min 400px)
 *  ③ Elements can move freely anywhere on the extended canvas
 */
import React, { useRef, useState, useCallback, useEffect } from "react";
import { T } from "../../pages/EditorPage";
import { sanitizeInlineHtml, contentToHtml, safeHref, listKind } from "./richText";

const TEXT_TYPES = ["heading","subheading","paragraph","blockquote","button"];

// Link colour shown on canvas. Keep in sync with inlineHtml() in
// server/routes/campaigns.js so the canvas matches the sent email.
export const LINK_COLOR = "#1155cc";

const HANDLES = [
  { id:"nw", cx:0,   cy:0,   cursor:"nw-resize" },
  { id:"n",  cx:.5,  cy:0,   cursor:"n-resize"  },
  { id:"ne", cx:1,   cy:0,   cursor:"ne-resize" },
  { id:"e",  cx:1,   cy:.5,  cursor:"e-resize"  },
  { id:"se", cx:1,   cy:1,   cursor:"se-resize" },
  { id:"s",  cx:.5,  cy:1,   cursor:"s-resize"  },
  { id:"sw", cx:0,   cy:1,   cursor:"sw-resize" },
  { id:"w",  cx:0,   cy:.5,  cursor:"w-resize"  },
];

const CANVAS_W   = 800;
const MIN_H      = 400;
const DEFAULT_H  = 600;

export default function CanvasArea({
  pages, activePage, setActivePage,
  selected, setSelected,
  updateEl, updateMultiEl,
  saveUndo,
  deleteEl, duplicateEl,
  bringForward, sendBackward,
  zoom, showGrid,
  addPage, removePage,
}) {
  const canvasRef     = useRef();
  const scrollRef     = useRef();

  // Expose view center getter for smart element spawning
  const getViewCenter = () => {
    if (!scrollRef.current || !canvasRef.current) return null;
    const scroll = scrollRef.current;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const scrollRect = scroll.getBoundingClientRect();
    const visibleLeft = Math.max(0, scrollRect.left - canvasRect.left) / zoom;
    const visibleTop  = Math.max(0, scrollRect.top  - canvasRect.top)  / zoom;
    const visibleW = scrollRect.width  / zoom;
    const visibleH = scrollRect.height / zoom;
    return {
      x: Math.max(20, visibleLeft + visibleW  * 0.35),
      y: Math.max(20, visibleTop  + visibleH  * 0.35),
    };
  };
  CanvasArea.getViewCenter = getViewCenter;

  const [editing,     setEditing]    = useState(null);
  const dragRef       = useRef(null);
  const resizeRef     = useRef(null);
  const [dragging,    setDragging]   = useState(false);
  const [resizing,    setResizing]   = useState(false);
  const [pageHeights, setPageHeights]= useState({});
  const [manualHeights, setManualHeights] = useState({}); // tracks pages where user manually resized
  const heightDragRef = useRef(null);
  const [heightDragging, setHeightDragging] = useState(false);
  const [ctxMenu,     setCtxMenu]    = useState(null);

  const elements = pages[activePage]?.elements || [];
  const bgColor  = pages[activePage]?.bgColor  || "#ffffff";
  const pageId   = pages[activePage]?.id;

  // Auto-calculate canvas height from element bounds (only if user hasn't manually resized this page)
  const autoHeight = React.useMemo(() => {
    if (!elements.length) return DEFAULT_H;
    let maxBottom = DEFAULT_H;
    elements.forEach(el => {
      const bottom = (el.y || 0) + (el.height || 0);
      if (bottom > maxBottom) maxBottom = bottom;
    });
    return Math.max(MIN_H, maxBottom + 60); // 60px padding at bottom
  }, [elements]);

  const canvasH = manualHeights[pageId] !== undefined ? manualHeights[pageId] : autoHeight;

  const toCanvas = useCallback((clientX, clientY) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x:0, y:0 };
    return { x:(clientX-rect.left)/zoom, y:(clientY-rect.top)/zoom };
  }, [zoom]);

  useEffect(() => {
    const onMove = (e) => {
      if (dragRef.current) {
        const { id, offX, offY, groupId, groupOffsets } = dragRef.current;
        const c = toCanvas(e.clientX, e.clientY);
        if (groupOffsets && groupId) {
          // Move all group elements together
          const updates = groupOffsets.map(({ id: gid, offX: gox, offY: goy }) => ({
            id: gid,
            x: Math.max(0, c.x - gox),
            y: Math.max(0, c.y - goy),
          }));
          updateMultiEl(updates);
        } else {
          updateEl(id, {
            x: Math.max(0, c.x - offX),
            y: Math.max(0, c.y - offY),
          });
        }
      }
      if (resizeRef.current) {
        const { id, handle, startX, startY, origEl } = resizeRef.current;
        const c  = toCanvas(e.clientX, e.clientY);
        const dx = c.x - startX;
        const dy = c.y - startY;
        let { x, y, width, height } = origEl;
        let nx=x, ny=y, nw=width, nh=height;
        if (handle.includes("e"))  nw = Math.max(20, width  + dx);
        if (handle.includes("s"))  nh = Math.max(10, height + dy);
        if (handle.includes("w")) { nw = Math.max(20, width  - dx); nx = x + (width - nw); }
        if (handle.includes("n")) { nh = Math.max(10, height - dy); ny = y + (height- nh); }
        updateEl(id, { x:nx, y:ny, width:nw, height:nh });
      }
      if (heightDragRef.current) {
        const { startY, startH, pageId: dragPageId } = heightDragRef.current;
        const newH = Math.max(MIN_H, startH + (e.clientY - startY));
        setManualHeights(mh => ({ ...mh, [dragPageId]: newH }));
      }
    };

    const onUp = () => {
      if (dragRef.current || resizeRef.current) saveUndo();
      dragRef.current   = null;
      resizeRef.current = null;
      setDragging(false);
      setResizing(false);
      if (heightDragRef.current) {
        heightDragRef.current = null;
        setHeightDragging(false);
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
  }, [toCanvas, updateEl, saveUndo, pageId]);

  const startEdit = (el) => {
    if (!TEXT_TYPES.includes(el.type)) return;
    dragRef.current = null;
    setDragging(false);
    setSelected(el.id);
    setEditing({ id:el.id, text:el.content||"" });
  };

  const onElMouseDown = (e, el) => {
    if (editing?.id === el.id) return;
    e.preventDefault();
    e.stopPropagation();
    // Second click of a double-click — go straight to editing, never drag
    if (e.detail >= 2 && TEXT_TYPES.includes(el.type)) { startEdit(el); return; }
    setSelected(el.id);
    setCtxMenu(null);
    const c = toCanvas(e.clientX, e.clientY);
    // If element belongs to a group, drag the whole group
    const groupEls = el.groupId
      ? elements.filter(x => x.groupId === el.groupId)
      : null;
    dragRef.current = {
      id: el.id,
      offX: c.x - el.x,
      offY: c.y - el.y,
      groupId: el.groupId || null,
      groupOffsets: groupEls
        ? groupEls.map(x => ({ id: x.id, offX: c.x - x.x, offY: c.y - x.y }))
        : null,
    };
    setDragging(true);
  };

  const onHandleMouseDown = (e, el, handleId) => {
    e.preventDefault();
    e.stopPropagation();
    const c = toCanvas(e.clientX, e.clientY);
    resizeRef.current = { id:el.id, handle:handleId, startX:c.x, startY:c.y, origEl:{ ...el } };
    setResizing(true);
  };

  const onElDblClick = (e, el) => {
    e.stopPropagation();
    startEdit(el);
  };

  // Receives sanitised HTML from the inline editor
  const commitEdit = (html) => {
    if (!editing) return;
    const next = typeof html === "string" ? html : (editing.text || "");
    if (next !== (editing.text || "")) {
      updateEl(editing.id, { content: next });
      saveUndo();
    }
    setEditing(null);
  };

  const onRightClick = (e, el) => {
    e.preventDefault();
    setCtxMenu({ x:e.clientX, y:e.clientY, id:el.id });
    setSelected(el.id);
  };

  const onHeightDragStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    heightDragRef.current = { startY:e.clientY, startH:canvasH, pageId };
    setHeightDragging(true);
  };

  const closeCtx = () => setCtxMenu(null);

  return (
    <div style={{ display:"flex", flexDirection:"column", flex:1, overflow:"hidden" }} onClick={closeCtx}>

      <style>{`
        .bc-text a, .bc-edit a {
          color: ${LINK_COLOR};
          text-decoration: underline;
          cursor: text;
        }
        .bc-text ul, .bc-text ol, .bc-edit ul, .bc-edit ol {
          margin: 0.25em 0;
          padding-left: 1.6em;
          text-align: inherit;
        }
        .bc-text ul, .bc-edit ul { list-style-type: disc; }
        .bc-text ol, .bc-edit ol { list-style-type: decimal; }
        .bc-text ol[type="I"], .bc-edit ol[type="I"] { list-style-type: upper-roman; }
        .bc-text li, .bc-edit li { margin: 0.15em 0; }
        .bc-text b, .bc-text strong, .bc-edit b, .bc-edit strong { font-weight: 700; }
        .bc-text i, .bc-text em, .bc-edit i, .bc-edit em { font-style: italic; }
        .bc-edit:empty:before {
          content: attr(data-placeholder);
          color: ${T.muted};
        }
      `}</style>

      {/* Scrollable canvas area */}
      <div ref={scrollRef} style={{ flex:1, overflow:"auto", display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"24px 28px 48px", background:T.bg }}>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>

          {/* Info bar */}
          <div style={{ fontSize:11, color:T.muted, display:"flex", gap:14, userSelect:"none" }}>
            <span style={{ color:T.goldDim }}>Page {activePage+1}/{pages.length}</span>
            <span>·</span>
            <span>{elements.length} element{elements.length!==1?"s":""}</span>
            <span>·</span>
            <span>{CANVAS_W} × {canvasH}px</span>
            {heightDragging && <span style={{ color:T.gold }}>↕ resizing…</span>}
          </div>

          {/* Canvas + grip wrapper */}
          <div style={{ position:"relative" }}>

            {/* Canvas */}
            <div
              ref={canvasRef}
              onMouseDown={(e) => {
                // If click is NOT inside an element
                const clickedElement = e.target.closest("[data-canvas-element]");
                if (!clickedElement) {
                  setSelected(null);
                }
              }}
              style={{
                position:"relative",
                width:  CANVAS_W * zoom,
                height: canvasH  * zoom,
                background: bgColor,
                borderRadius: 8,
                boxShadow:`0 8px 48px rgba(0,0,0,.7), 0 0 0 1px ${T.border}`,
                overflow:"hidden",
                cursor: dragging ? "grabbing" : resizing ? "crosshair" : "default",
                userSelect:"none",
              }}
            >
              {/* Grid */}
              {showGrid && (
                <div style={{
                  position:"absolute", inset:0, pointerEvents:"none", zIndex:0,
                  backgroundImage:`linear-gradient(${T.goldDim}22 1px,transparent 1px),linear-gradient(90deg,${T.goldDim}22 1px,transparent 1px)`,
                  backgroundSize:`${20*zoom}px ${20*zoom}px`,
                }}/>
              )}

              {/* Empty state */}
              {elements.length === 0 && (
                <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", pointerEvents:"none", gap:8 }}>
                  <div style={{ fontSize:38, opacity:.25 }}>✦</div>
                  <div style={{ fontSize:15, fontWeight:600, color:T.goldDim, fontFamily:"Georgia" }}>Canvas is empty</div>
                  <div style={{ fontSize:12, color:T.muted }}>Click elements in the left panel to add them</div>
                </div>
              )}

              {/* Elements — scaled to zoom, height NOT clipped so elements can exist anywhere */}
              <div style={{ position:"absolute", inset:0, transform:`scale(${zoom})`, transformOrigin:"top left", width:CANVAS_W, height:canvasH }}>
                {elements.map(el => (
                  <CanvasEl
                    key={el.id}
                    el={el}
                    selected={selected === el.id}
                    editing={editing?.id === el.id}
                    editText={editing?.text}
                    onEditBlur={commitEdit}
                    onAutoGrow={h => updateEl(el.id, { height: h })}
                    onMouseDown={onElMouseDown}
                    onDblClick={onElDblClick}
                    onEditStart={startEdit}
                    onHandleDown={onHandleMouseDown}
                    onRightClick={onRightClick}
                  />
                ))}
              </div>
            </div>

            {/* ↕ Height resize grip — bottom-right corner */}
            <HeightGrip onMouseDown={onHeightDragStart} active={heightDragging} />

            {/* Height label while dragging */}
            {heightDragging && (
              <div style={{
                position:"absolute", bottom:-26, left:"50%", transform:"translateX(-50%)",
                fontSize:11, color:"#0000", background:T.panel, padding:"2px 10px", borderRadius:6,
                border:`1px solid ${T.goldDim}`, pointerEvents:"none", whiteSpace:"nowrap",
              }}>
                {canvasH}px — drag ↕ to resize
              </div>
            )}
          </div>

          {/* Tip: drag hint */}
          <div style={{ fontSize:10, color:T.muted, opacity:.6, display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ color:T.goldDim }}>↕</span>
            <span>Drag the gold handle (bottom-right of canvas) to extend page height</span>
          </div>
        </div>
      </div>

      {/* Page Tabs */}
      <div style={{
        height:52, flexShrink:0, display:"flex", alignItems:"center",
        borderTop:`1px solid ${T.border}`, background:T.panel,
        padding:"0 16px", gap:8, overflowX:"auto",
      }}>
        {pages.map((pg, i) => (
          <div key={pg.id} style={{ position:"relative", flexShrink:0 }}>
            <button
              onClick={() => { setActivePage(i); setSelected(null); }}
              style={{
                padding:"6px 18px", borderRadius:7, fontSize:12, fontWeight:600, cursor:"pointer",
                border:`1.5px solid ${activePage===i ? T.gold : T.border}`,
                background: activePage===i ? `${T.gold}22` : T.surface,
                color: activePage===i ? T.gold : T.txtDim,
                fontFamily:"inherit", transition:"all .13s",
              }}>
              Page {i+1}
            </button>
            {pages.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); removePage(i); }}
                title="Remove page"
                style={{ position:"absolute", top:-6, right:-6, width:17, height:17, borderRadius:"50%", background:T.danger, border:`2px solid ${T.bg}`, cursor:"pointer", color:"#fff", fontSize:11, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, lineHeight:1 }}>
                ×
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addPage}
          style={{
            padding:"6px 14px", borderRadius:7, fontSize:12, fontWeight:700, cursor:"pointer",
            border:`1.5px dashed ${T.gold}`, background:`${T.gold}0A`,
            color:T.gold, fontFamily:"inherit", display:"flex", alignItems:"center", gap:5,
            transition:"all .13s", flexShrink:0,
          }}
          onMouseOver={e  => e.currentTarget.style.background=`${T.gold}22`}
          onMouseOut={e   => e.currentTarget.style.background=`${T.gold}0A`}
        >
          + Add page
        </button>
      </div>

      {/* Context Menu */}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x} y={ctxMenu.y}
          onDuplicate={() => { duplicateEl(ctxMenu.id); closeCtx(); }}
          onDelete={()    => { deleteEl(ctxMenu.id);    closeCtx(); }}
          onForward={()   => { bringForward();           closeCtx(); }}
          onBackward={()  => { sendBackward();           closeCtx(); }}
          onClose={closeCtx}
        />
      )}
    </div>
  );
}

// ── Height grip component ─────────────────────────────────────────────────────
function HeightGrip({ onMouseDown, active }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title="Drag down to make the page taller"
      style={{
        position:"absolute", bottom:-14, right:-14,
        width:28, height:28, borderRadius:"50%",
        background:  active||hov ? T.gold : T.panel,
        border:     `2px solid ${active||hov ? T.goldBright : T.goldDim}`,
        cursor:      "ns-resize",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:13, color:active||hov ? T.bg : T.gold,
        boxShadow:   active ? `0 0 14px ${T.gold}88` : "0 2px 8px rgba(0,0,0,.6)",
        transition:  "all .15s",
        userSelect:  "none",
        zIndex:20,
      }}
    >↕</div>
  );
}



// ── Single canvas element ─────────────────────────────────────────────────────
function CanvasEl({ el, selected, editing, editText, onEditBlur, onAutoGrow, onMouseDown, onDblClick, onEditStart, onHandleDown, onRightClick }) {
  const isText = TEXT_TYPES.includes(el.type);

  return (
    <div
      style={{
        position:"absolute",
        left: el.x, top: el.y,
        width: el.width, height: el.height,
        transform:`rotate(${el.rotation||0}deg)`,
        opacity: el.opacity ?? 1,
        cursor: selected ? "move" : "pointer",
        outline:`2px solid ${selected ? T.gold : "transparent"}`,
        outlineOffset:2,
        boxSizing:"border-box",
        zIndex: el.zIndex || 1,
        userSelect:"none",
      }}
      onMouseDown={e => onMouseDown(e, el)}
      onDoubleClick={e => onDblClick(e, el)}
      onContextMenu={e => onRightClick(e, el)}
    >
      {/* 8 resize handles */}
      {selected && HANDLES.map(h => (
        <div
          key={h.id}
          onMouseDown={e => { e.stopPropagation(); e.preventDefault(); onHandleDown(e, el, h.id); }}
          style={{
            position:"absolute",
            left:`calc(${h.cx*100}% - 5px)`, top:`calc(${h.cy*100}% - 5px)`,
            width:10, height:10,
            background:T.gold, border:`2px solid ${T.bg}`,
            borderRadius:2, cursor:h.cursor, zIndex:10,
            boxShadow:"0 1px 4px rgba(0,0,0,.7)",
          }}
        />
      ))}

      {/* Edit button — the reliable way in; double-click still works too */}
      {selected && !editing && isText && (
        <button
          title={/<(ul|ol)\b/i.test(el.content || "") ? "Edit list items" : "Edit text"}
          onMouseDown={e => { e.stopPropagation(); e.preventDefault(); }}
          onClick={e => { e.stopPropagation(); onEditStart(el); }}
          onDoubleClick={e => e.stopPropagation()}
          style={{
            position:"absolute", top:-26, right:0,
            width:24, height:22, lineHeight:"20px", padding:0,
            background:T.panel, color:T.gold,
            border:`1px solid ${T.gold}`, borderRadius:5,
            fontSize:11, cursor:"pointer", zIndex:16,
            boxShadow:"0 2px 8px rgba(0,0,0,.6)",
          }}
          onMouseOver={e => { e.currentTarget.style.background = T.gold; e.currentTarget.style.color = T.bg; }}
          onMouseOut={e  => { e.currentTarget.style.background = T.panel; e.currentTarget.style.color = T.gold; }}
        >✏️</button>
      )}

      {/* Tooltip */}
      {selected && !editing && (
        <div style={{
          position:"absolute", top:-24, left:"50%", transform:"translateX(-50%)",
          background:T.panel, border:`1px solid ${T.goldDim}`,
          borderRadius:5, padding:"2px 8px",
          fontSize:9, color:T.gold, whiteSpace:"nowrap", pointerEvents:"none", zIndex:15,
        }}>
          {isText ? "drag · resize · ✏️ or dbl-click to edit" : "drag · handles to resize"}
        </div>
      )}

      {/* Inline rich-text editor */}
      {editing && (
        <InlineRichEditor el={el} initialHtml={editText} onCommit={onEditBlur} onAutoGrow={onAutoGrow} />
      )}

      {/* Renderers */}
      {!editing && el.type==="image" && (
        <img src={el.src} alt="" draggable={false}
          style={{ width:"100%", height:"100%", objectFit:el.objectFit||"cover", borderRadius:el.borderRadius||4, display:"block", pointerEvents:"none" }} />
      )}
      {!editing && el.type==="social" && (
        <img src={el.src} alt={el.platform} draggable={false}
          style={{ width:"100%", height:"100%", objectFit:"contain", display:"block", pointerEvents:"none" }} />
      )}
      {!editing && el.type==="emoji-icon" && (
        <div style={{
          width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center",
          fontSize: el.fontSize || Math.min(el.width, el.height) * 0.7,
          lineHeight:1, pointerEvents:"none", userSelect:"none",
        }}>
          {el.emoji || "⭐"}
        </div>
      )}
      {!editing && el.type==="line" && (
        <div style={{ position:"absolute", top:"50%", left:0, transform:"translateY(-50%)", width:"100%", height:el.strokeWidth||3, background:el.strokeColor||T.gold, borderRadius:999 }} />
      )}
      {!editing && el.type==="star" && (
        <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:el.width*.72, lineHeight:1, color:el.backgroundColor||T.goldBright, pointerEvents:"none" }}>★</div>
      )}
      {!editing && (el.type==="circle"||el.type==="rectangle") && (
        <div style={{
          width:"100%", height:"100%",
          background: el.backgroundImage ? el.backgroundImage : (el.backgroundColor||T.gold),
          backgroundSize: el.backgroundSize || (el.backgroundImage ? "28px 28px" : undefined),
          borderRadius: el.type==="circle" ? "50%" : `${el.borderRadius||6}px`,
          border: el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor}` : "none",
          boxSizing:"border-box",
        }} />
      )}
      {!editing && isText && (
        <div style={{
          width:"100%", height:"100%", display:"flex", alignItems:"center",
          justifyContent: el.textAlign==="center"?"center":el.textAlign==="right"?"flex-end":"flex-start",
          padding: el.type==="button" ? "0 14px" : "4px 6px",
          background: el.backgroundColor||"transparent",
          borderRadius: el.borderRadius ? `${el.borderRadius}px` : (el.type==="button"?6:0),
          boxSizing:"border-box",
        }}>
          <div className="bc-text" style={{
            fontFamily:el.fontFamily||"Georgia", fontSize:el.fontSize||16,
            fontWeight:el.fontWeight||"normal", fontStyle:el.fontStyle||"normal",
            textDecoration:el.textDecoration||"none", color:el.color||T.gold,
            textAlign:el.textAlign||"left", lineHeight:el.lineHeight||1.4,
            width:"100%", wordBreak:"break-word", whiteSpace: "pre-line",
          }}
            dangerouslySetInnerHTML={{ __html: contentToHtml(el.content) }}
          />
        </div>
      )}
    </div>
  );
}

// ── Inline rich-text editor (bold / italic / link) ────────────────────────────
function InlineRichEditor({ el, initialHtml, onCommit, onAutoGrow }) {
  const ref        = React.useRef(null);
  const barRef     = React.useRef(null);
  const savedRange = React.useRef(null);
  const [linkOpen, setLinkOpen] = React.useState(false);
  const [linkUrl,  setLinkUrl]  = React.useState("");
  const [active,   setActive]   = React.useState({ bold:false, italic:false, link:false, list:null });

  // Seed the DOM once. Uncontrolled on purpose — re-rendering on every
  // keystroke would reset the caret to the start of the box.
  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.innerHTML = contentToHtml(initialHtml);
    node.focus();
    const r = document.createRange();
    r.selectNodeContents(node);
    r.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
    try { document.execCommand("styleWithCSS", false, false); } catch { /* older browsers */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commit = () => onCommit(sanitizeInlineHtml(ref.current?.innerHTML || ""));

  /* Grow the element as items are added, so nothing is clipped.
     Never shrinks — the user's own resize handles stay authoritative. */
  const grow = React.useCallback(() => {
    const node = ref.current;
    if (!node || !onAutoGrow) return;
    const needed = Math.ceil(node.scrollHeight) + 12;   // + frame padding/border
    if (needed > (el.height || 0)) onAutoGrow(needed);
  }, [onAutoGrow, el.height]);

  // Re-measure whenever the box could have changed height
  React.useEffect(() => { grow(); });

  const inEditor = (node) => !!node && !!ref.current && ref.current.contains(node.nodeType === 3 ? node.parentNode : node);

  const refreshActive = () => {
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode || !inEditor(sel.anchorNode)) return;
    let node = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentNode : sel.anchorNode;
    let link = false;
    while (node && node !== ref.current) {
      if (node.tagName === "A") { link = true; break; }
      node = node.parentNode;
    }
    setActive({
      bold:   document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      link,
      list:   listKind(closestList()),
    });
  };

  /** Nearest <ul>/<ol> enclosing the caret, or null. */
  const closestList = () => {
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode || !inEditor(sel.anchorNode)) return null;
    let node = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentNode : sel.anchorNode;
    while (node && node !== ref.current) {
      if (node.tagName === "UL" || node.tagName === "OL") return node;
      node = node.parentNode;
    }
    return null;
  };

  /**
   * Toggle the caret's block between plain text and a list of the given kind.
   * Clicking the active kind turns the list off; clicking a different kind
   * converts in place, so bullet -> numbered -> roman never loses the items.
   */
  const applyList = (kind) => {
    ref.current?.focus();
    const current = listKind(closestList());

    if (current === kind) {                                  // toggle off
      document.execCommand(kind === "bullet" ? "insertUnorderedList" : "insertOrderedList");
      refreshActive(); grow();
      return;
    }

    if (!current) {                                          // plain text -> list
      document.execCommand(kind === "bullet" ? "insertUnorderedList" : "insertOrderedList");
    } else if ((current === "bullet") !== (kind === "bullet")) {
      // Crossing the ul/ol boundary needs both commands: drop then rebuild
      document.execCommand(current === "bullet" ? "insertUnorderedList" : "insertOrderedList");
      document.execCommand(kind === "bullet" ? "insertUnorderedList" : "insertOrderedList");
    }

    // number <-> roman is just the numbering attribute on the same <ol>
    const list = closestList();
    if (list && list.tagName === "OL") {
      list.setAttribute("type", kind === "roman" ? "I" : "1");
    }
    refreshActive(); grow();
  };

  const rememberSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && inEditor(sel.anchorNode)) savedRange.current = sel.getRangeAt(0).cloneRange();
  };

  const restoreSelection = () => {
    const r = savedRange.current;
    if (!r) return false;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
    return true;
  };

  const exec = (cmd, value = null) => {
    ref.current?.focus();
    document.execCommand(cmd, false, value);
    refreshActive();
  };

  const openLink = () => {
    rememberSelection();
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;          // need a selection to link
    let node = sel.anchorNode?.nodeType === 3 ? sel.anchorNode.parentNode : sel.anchorNode;
    while (node && node !== ref.current && node.tagName !== "A") node = node.parentNode;
    setLinkUrl(node && node.tagName === "A" ? node.getAttribute("href") || "" : "");
    setLinkOpen(true);
  };

  const applyLink = () => {
    const href = safeHref(linkUrl);
    ref.current?.focus();
    restoreSelection();
    if (href) document.execCommand("createLink", false, href);
    else      document.execCommand("unlink", false, null);
    setLinkOpen(false);
    setLinkUrl("");
    refreshActive();
  };

  /** The <li> the caret sits in, or null. */
  const closestLi = () => {
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode || !inEditor(sel.anchorNode)) return null;
    let node = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentNode : sel.anchorNode;
    while (node && node !== ref.current) {
      if (node.tagName === "LI") return node;
      node = node.parentNode;
    }
    return null;
  };

  /** Append a fresh item to the end of the current list and put the caret in it. */
  const addListItem = () => {
    ref.current?.focus();
    const list = closestList();
    if (!list) { applyList("bullet"); return; }   // not a list yet — make one
    const li = document.createElement("li");
    li.appendChild(document.createElement("br"));
    list.appendChild(li);
    const r = document.createRange();
    r.setStart(li, 0);
    r.collapse(true);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
    refreshActive();
    grow();
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") { e.preventDefault(); commit(); return; }

    if (e.key === "Enter" && !e.shiftKey) {
      const li = closestLi();
      // Enter on an empty item exits the list, like Word and Google Docs
      if (li && !li.textContent.trim()) {
        e.preventDefault();
        document.execCommand("outdent");
        if (closestLi()) {
          const list = closestList();
          document.execCommand(
            list && list.tagName === "UL" ? "insertUnorderedList" : "insertOrderedList"
          );
        }
        refreshActive();
        return;
      }
      // Otherwise let the browser insert the next <li> natively
      setTimeout(() => { refreshActive(); grow(); }, 0);
      return;
    }
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === "b") { e.preventDefault(); exec("bold"); }
    if (mod && e.key.toLowerCase() === "i") { e.preventDefault(); exec("italic"); }
    if (mod && e.key.toLowerCase() === "k") { e.preventDefault(); openLink(); }
    if (mod && e.key === "Enter")           { e.preventDefault(); commit(); }
    if (mod && e.shiftKey && e.key === "8")  { e.preventDefault(); applyList("bullet"); }
    if (mod && e.shiftKey && e.key === "7")  { e.preventDefault(); applyList("number"); }
    // Tab indents / outdents inside a list instead of leaving the editor
    if (e.key === "Tab" && closestList()) {
      e.preventDefault();
      document.execCommand(e.shiftKey ? "outdent" : "indent");
      refreshActive();
    }
  };

  // Paste as plain text so Word/web markup can never break the box
  const onPaste = (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  // Clicking the toolbar must not blur the editor and lose the selection
  const hold = (e) => e.preventDefault();

  const btn = (on) => ({
    width:24, height:24, lineHeight:"22px", textAlign:"center",
    background: on ? T.gold : "transparent",
    color:      on ? T.bg   : T.gold,
    border:`1px solid ${T.goldDim}`, borderRadius:4,
    fontSize:12, cursor:"pointer", padding:0, fontFamily:"Georgia,serif",
  });

  return (
    <>
      {/* Floating toolbar */}
      <div
        ref={barRef}
        onMouseDown={hold}
        style={{
          position:"absolute", bottom:"100%", left:0, marginBottom:6,
          display:"flex", alignItems:"center", gap:4,
          background:T.panel, border:`1px solid ${T.goldDim}`,
          borderRadius:6, padding:"4px 5px", zIndex:30,
          boxShadow:"0 4px 16px rgba(0,0,0,.6)", whiteSpace:"nowrap",
        }}
      >
        <button style={{ ...btn(active.bold),   fontWeight:700 }}                 onClick={() => exec("bold")}   title="Bold (Ctrl+B)">B</button>
        <button style={{ ...btn(active.italic), fontStyle:"italic" }}             onClick={() => exec("italic")} title="Italic (Ctrl+I)">I</button>
        <button style={{ ...btn(active.link),   fontSize:11 }}                    onClick={openLink}             title="Link (Ctrl+K)">🔗</button>
        {active.link && (
          <button style={{ ...btn(false), fontSize:11 }} onClick={() => exec("unlink")} title="Remove link">⛓️‍💥</button>
        )}
        <span style={{ width:1, height:16, background:T.goldDim, margin:"0 2px" }} />
        <button style={{ ...btn(active.list==="bullet"), fontSize:13 }} onClick={() => applyList("bullet")} title="Bullet list">•</button>
        <button style={{ ...btn(active.list==="number"), fontSize:10 }} onClick={() => applyList("number")} title="Numbered list">1.</button>
        <button style={{ ...btn(active.list==="roman"),  fontSize:10 }} onClick={() => applyList("roman")}  title="Roman numeral list">I.</button>
        {active.list && (
          <button
            style={{ ...btn(false), width:"auto", padding:"0 7px", fontSize:10 }}
            onClick={addListItem}
            title="Add another item (or just press Enter)"
          >+ Item</button>
        )}
        <span style={{ width:1, height:16, background:T.goldDim, margin:"0 2px" }} />
        <button style={{ ...btn(false), fontSize:10 }} onClick={() => exec("removeFormat")} title="Clear formatting">Tx</button>

        {linkOpen && (
          <div
            onMouseDown={hold}
            style={{
              position:"absolute", top:"100%", left:0, marginTop:5,
              display:"flex", gap:4, background:T.panel,
              border:`1px solid ${T.goldDim}`, borderRadius:6, padding:5, zIndex:31,
            }}
          >
            <input
              autoFocus
              value={linkUrl}
              placeholder="https://example.com"
              onChange={e => setLinkUrl(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter")  { e.preventDefault(); applyLink(); }
                if (e.key === "Escape") { e.preventDefault(); setLinkOpen(false); }
              }}
              style={{
                width:180, padding:"4px 7px", fontSize:11,
                background:T.surface, color:T.txt,
                border:`1px solid ${T.goldDim}`, borderRadius:4, outline:"none",
              }}
            />
            <button style={{ ...btn(true), width:"auto", padding:"0 8px", fontSize:11 }} onClick={applyLink}>OK</button>
          </div>
        )}
      </div>

      {/* Outer frame handles centring + scrolling.
          The contentEditable inside is a plain block, which is what lets the
          browser do native list editing (Enter = next <li>, Backspace on an
          empty item leaves the list, arrow keys walk items). */}
      <div
        style={{
          position:"absolute", inset:0, width:"100%", height:"100%",
          display:"flex", flexDirection:"column", justifyContent:"center",
          border:`2px dashed ${T.gold}`, borderRadius:4,
          padding: el.type === "button" ? "0 12px" : "4px 6px",
          boxSizing:"border-box", overflow:"auto",
          background:"transparent", cursor:"text", zIndex:20,
        }}
        onMouseDown={e => { if (e.target === e.currentTarget) ref.current?.focus(); }}
      >
        <div
          ref={ref}
          className="bc-edit"
          contentEditable
          suppressContentEditableWarning
          onBlur={e => {
            // Ignore blur caused by clicking our own toolbar
            if (barRef.current?.contains(e.relatedTarget)) return;   // toolbar click, stay in edit mode
            commit();
          }}
          onInput={grow}
          onKeyUp={refreshActive}
          onMouseUp={refreshActive}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          style={{
            display:"block", width:"100%",
            fontSize:el.fontSize, fontFamily:el.fontFamily, fontWeight:el.fontWeight,
            color:el.color, background:"transparent",
            outline:"none", cursor:"text",
            lineHeight:el.lineHeight || 1.4,
            fontStyle:el.fontStyle, textDecoration:el.textDecoration,
            textAlign:el.textAlign, whiteSpace:"pre-line",
            wordBreak:"break-word", userSelect:"text",
          }}
        />
      </div>
    </>
  );
}

// ── Right-click context menu ──────────────────────────────────────────────────
function ContextMenu({ x, y, onDuplicate, onDelete, onForward, onBackward, onClose }) {
  return (
    <>
      <div style={{ position:"fixed", inset:0, zIndex:9998 }} onClick={onClose}/>
      <div style={{ position:"fixed", left:x, top:y, zIndex:9999, background:T.panel, border:`1px solid ${T.gold}44`, borderRadius:9, boxShadow:"0 8px 32px rgba(0,0,0,.8)", padding:"6px 0", minWidth:174 }}>
        {[
          { label:"⎘  Duplicate",     fn:onDuplicate },
          { label:"↑  Bring Forward", fn:onForward },
          { label:"↓  Send Backward", fn:onBackward },
          { label:"🗑  Delete",        fn:onDelete, danger:true },
        ].map(item => (
          <button key={item.label} onClick={item.fn}
            style={{ display:"block", width:"100%", padding:"9px 16px", background:"transparent", border:"none", textAlign:"left", cursor:"pointer", fontSize:13, color:item.danger?T.danger:T.txt, fontFamily:"inherit" }}
            onMouseOver={e => e.currentTarget.style.background=`${T.gold}18`}
            onMouseOut={e  => e.currentTarget.style.background="transparent"}
          >{item.label}</button>
        ))}
      </div>
    </>
  );
}