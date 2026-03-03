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

const TEXT_TYPES = ["heading","subheading","paragraph","blockquote","button"];

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

  const onElMouseDown = (e, el) => {
    if (editing?.id === el.id) return;
    e.preventDefault();
    e.stopPropagation();
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
    if (TEXT_TYPES.includes(el.type)) {
      dragRef.current = null;
      setDragging(false);
      setEditing({ id:el.id, text:el.content||"" });
    }
  };

  const commitEdit = () => {
    if (editing) {
      updateEl(editing.id, { content:editing.text });
      saveUndo();
      setEditing(null);
    }
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
                    onEditChange={text => setEditing(ed => ({ ...ed, text }))}
                    onEditBlur={commitEdit}
                    onMouseDown={onElMouseDown}
                    onDblClick={onElDblClick}
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
function CanvasEl({ el, selected, editing, editText, onEditChange, onEditBlur, onMouseDown, onDblClick, onHandleDown, onRightClick }) {
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

      {/* Tooltip */}
      {selected && (
        <div style={{
          position:"absolute", top:-24, left:"50%", transform:"translateX(-50%)",
          background:T.panel, border:`1px solid ${T.goldDim}`,
          borderRadius:5, padding:"2px 8px",
          fontSize:9, color:T.gold, whiteSpace:"nowrap", pointerEvents:"none", zIndex:15,
        }}>
          drag · handles to resize · dbl-click to edit
        </div>
      )}

      {/* Inline editor */}
      {editing && (
        <textarea
          autoFocus
          value={editText}
          onChange={e => onEditChange(e.target.value)}
          onBlur={onEditBlur}
          onKeyDown={e => { if (e.key==="Escape") onEditBlur(); }}
          style={{
            position:"absolute", inset:0, width:"100%", height:"100%",
            fontSize:el.fontSize, fontFamily:el.fontFamily, fontWeight:el.fontWeight,
            color:el.color, background:"transparent", border:`2px dashed ${T.gold}`,
            borderRadius:4, padding:6, resize:"none", outline:"none",
            lineHeight:el.lineHeight||1.4,
            fontStyle:el.fontStyle, textDecoration:el.textDecoration, textAlign:el.textAlign,
            zIndex:20,
          }}
        />
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
          <span style={{
            fontFamily:el.fontFamily||"Georgia", fontSize:el.fontSize||16,
            fontWeight:el.fontWeight||"normal", fontStyle:el.fontStyle||"normal",
            textDecoration:el.textDecoration||"none", color:el.color||T.gold,
            textAlign:el.textAlign||"left", lineHeight:el.lineHeight||1.4,
            width:"100%", wordBreak:"break-word", whiteSpace: "pre-line",
          }}>
            {el.content}
          </span>
        </div>
      )}
    </div>
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