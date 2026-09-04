/**
 * PropertiesPanel.jsx  — RIGHT PROPERTIES PANEL
 * Context-sensitive: shows relevant controls for selected element type.
 * Dark Gold & Black theme.
 * ✅ UPDATED: Image upload to server so images work in sent emails
 */
import React, { useState, useRef } from "react";
import { T, SLabel, PRow, inputStyle, selectStyle, COLORS, FONTS } from "../../pages/EditorPage";
import { convertContentToList, getContentListKind } from "./richText";

const API_URL = import.meta.env.VITE_VRI_URL;

const ANIMATIONS = [
  { value:"none",   label:"None"    },
  { value:"fade",   label:"Fade In" },
  { value:"slide",  label:"Slide"   },
  { value:"bounce", label:"Bounce"  },
  { value:"zoom",   label:"Zoom"    },
  { value:"pulse",  label:"Pulse"   },
];

const FIT_OPTIONS = ["cover","contain","fill","scale-down"];

// ✅ Upload image file to server, returns hosted https:// URL
async function uploadImageToServer(file) {
  const formData = new FormData();
  formData.append("image", file);
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/api/upload/image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Upload failed: ${res.status}`);
  }
  const data = await res.json();
  return data.url;
}

export default function PropertiesPanel({ selectedEl, updateEl, bringForward, sendBackward, deleteEl, duplicateEl }) {
  const u = (k,v) => updateEl(selectedEl.id, { [k]:v });
  const isText   = selectedEl && ["heading","subheading","paragraph","blockquote","button"].includes(selectedEl.type);
  const isShape  = selectedEl && ["rectangle","circle","star"].includes(selectedEl.type);
  const isLine   = selectedEl && selectedEl.type==="line";
  const isImage  = selectedEl && selectedEl.type==="image";
  const isSocial = selectedEl && selectedEl.type==="social";
  const isButton = selectedEl && selectedEl.type==="button";
  const isEmoji  = selectedEl && selectedEl.type==="emoji-icon";

  // ── Image upload state ──────────────────────────────────────
  const [uploading, setUploading]     = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const url = await uploadImageToServer(file);
      u("src", url);
    } catch (err) {
      console.error("Image upload failed:", err);
      setUploadError("Upload failed. Check server /api/upload/image");
      // Fallback: blob preview only (won't work in email)
      const blobUrl = URL.createObjectURL(file);
      u("src", blobUrl);
    } finally {
      setUploading(false);
      // Reset file input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Determine if current image src is email-safe
  const imgSrc = selectedEl?.src || "";
  const isEmailSafe = imgSrc.startsWith("http://") || imgSrc.startsWith("https://");
  const isBlob      = imgSrc.startsWith("blob:");
  const isBase64    = imgSrc.startsWith("data:");

  return (
    <aside style={{
      width:260, minWidth:220, background:T.panel, borderLeft:`1px solid ${T.border}`,
      display:"flex", flexDirection:"column", overflow:"hidden", flexShrink:0,
    }}>
      {/* Header */}
      <div style={{ padding:"12px 16px", borderBottom:`1px solid ${T.border}`, flexShrink:0, display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:15, color:T.gold }}>⚙</span>
        <span style={{ fontWeight:700, fontSize:14, color:T.gold, fontFamily:"Georgia", flex:1 }}>Properties</span>
        {selectedEl && (
          <span style={{ fontSize:10, padding:"2px 8px", borderRadius:99, background:`${T.gold}22`, color:T.gold, fontWeight:700, border:`1px solid ${T.goldDim}` }}>
            {selectedEl.type}
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ flex:1, overflowY:"auto", padding:"14px 14px" }}>

        {/* Empty state */}
        {!selectedEl && (
          <div style={{ textAlign:"center", padding:"48px 0 0", color:T.muted }}>
            <div style={{ fontSize:40, marginBottom:12, opacity:.4 }}>✦</div>
            <div style={{ fontSize:14, fontWeight:600, color:T.goldDim, marginBottom:6, fontFamily:"Georgia" }}>Nothing selected</div>
            <div style={{ fontSize:12, opacity:.6, lineHeight:1.6 }}>Click any element on the canvas to see and edit its properties here.</div>
          </div>
        )}

        {/* Selected element */}
        {selectedEl && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Quick actions */}
            <div>
              <SLabel>Quick Actions</SLabel>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7, marginBottom:7 }}>
                <ActionBtn onClick={duplicateEl} title="Ctrl+D">⎘ Duplicate</ActionBtn>
                <ActionBtn onClick={deleteEl} danger title="Del">🗑 Delete</ActionBtn>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
                <ActionBtn onClick={bringForward}>↑ Forward</ActionBtn>
                <ActionBtn onClick={sendBackward}>↓ Backward</ActionBtn>
              </div>
            </div>

            <Divider/>



            {/* ── TEXT PROPERTIES ── */}
            {isText && (
              <div>
                {/* <SLabel>Text</SLabel>

                <div style={{ fontSize:11, color:T.muted, marginBottom:10, padding:"7px 10px", background:T.surface, borderRadius:7, border:`1px solid ${T.border}` }}>
                  ✏ Double-click the element on canvas to edit text content
                </div> */}

                {selectedEl.headingTag && (
                  <PRow label="Heading Tag">
                    <select value={selectedEl.headingTag||"H1"} onChange={e=>{
                      const sizes={H1:{fontSize:40,fontWeight:"800"},H2:{fontSize:32,fontWeight:"700"},H3:{fontSize:26,fontWeight:"700"},H4:{fontSize:22,fontWeight:"600"},H5:{fontSize:18,fontWeight:"600"},H6:{fontSize:15,fontWeight:"600"}};
                      const s=sizes[e.target.value];
                      updateEl(selectedEl.id,{headingTag:e.target.value,...s});
                    }} style={selectStyle}>
                      {["H1","H2","H3","H4","H5","H6"].map(t=><option key={t}>{t}</option>)}
                    </select>
                  </PRow>
                )}
                <PRow label="Font Family">
                  <select value={selectedEl.fontFamily||"Georgia"} onChange={e=>u("fontFamily",e.target.value)} style={selectStyle}>
                    {FONTS.map(f=><option key={f} value={f}>{f.replace(/'/g,"")}</option>)}
                  </select>
                </PRow>

                 {/* BUTTON EXTRAS */}

                {isButton && (
                  <div>
                    <SLabel>Button</SLabel>

                    <PRow label="Link URL">
                      <input
                        type="url"
                        placeholder="https://..."
                        value={selectedEl.link || ""}
                        onChange={e => {
                          u("link", e.target.value);
                          if (e.target.value) u("email", "");
                        }}
                        style={inputStyle}
                      />
                    </PRow>

                    <PRow label="Email Address">
                      <input
                        type="email"
                        placeholder="example@email.com"
                        value={selectedEl.link?.startsWith("mailto:")
                          ? selectedEl.link.replace("mailto:", "")
                          : ""}
                        onChange={(e) => {
                          let value = e.target.value.trim();

                          if (!value) {
                            u("link", "");
                            return;
                          }

                          u("link", `mailto:${value}`);
                        }}
                        style={inputStyle}
                      />
                    </PRow>

                    <PRow label={`Corner Radius (${selectedEl.borderRadius || 6}px)`}>
                      <input
                        type="range"
                        min={0}
                        max={50}
                        value={selectedEl.borderRadius || 6}
                        onChange={e => u("borderRadius", +e.target.value)}
                        style={{ width: "100%" }}
                      />
                    </PRow>

                  </div>
                )}

                <PRow label={`Font Size  (${selectedEl.fontSize||16}px)`}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <input type="range" min={8} max={120} value={selectedEl.fontSize||16} onChange={e=>u("fontSize",+e.target.value)} style={{ flex:1 }} />
                    <input type="number" min={8} max={120} value={selectedEl.fontSize||16} onChange={e=>u("fontSize",+e.target.value)} style={{ ...inputStyle, width:52, padding:"5px 6px", fontSize:12 }} />
                  </div>
                </PRow>

                <PRow label="Style">
                  <div style={{ display:"flex", gap:6 }}>
                    {[["B","fontWeight","bold","normal"],["I","fontStyle","italic","normal"],["U","textDecoration","underline","none"]].map(([lbl,prop,on,off])=>(
                      <StyleBtn key={lbl} active={selectedEl[prop]===on} onClick={()=>u(prop,selectedEl[prop]===on?off:on)}>{lbl}</StyleBtn>
                    ))}
                  </div>
                </PRow>

                <PRow label="Alignment">
                  <div style={{ display:"flex", gap:6 }}>
                    {[["◀","left"],["▬","center"],["▶","right"]].map(([ic,al])=>(
                      <StyleBtn key={al} active={selectedEl.textAlign===al} onClick={()=>u("textAlign",al)} wide>{ic}</StyleBtn>
                    ))}
                  </div>
                </PRow>

                {!isButton && (
                  <PRow label="List">
                    <div style={{ display:"flex", gap:6 }}>
                      {[["•","bullet","Bulleted list"],["1.","number","Numbered list"],["I.","roman","Roman numeral list"]].map(([ic,kind,title])=>(
                        <StyleBtn
                          key={kind}
                          wide
                          active={getContentListKind(selectedEl.content)===kind}
                          onClick={()=>u("content", convertContentToList(selectedEl.content, kind))}
                        >
                          <span title={title}>{ic}</span>
                        </StyleBtn>
                      ))}
                    </div>
                  </PRow>
                )}

                <PRow label="Text Color">
                  <ColorPicker value={selectedEl.color||"#F0C040"} onChange={v=>u("color",v)} />
                </PRow>

                <PRow label="Background Color">
                  <ColorPicker value={selectedEl.backgroundColor||"transparent"} onChange={v=>u("backgroundColor",v)} allowTransparent />
                </PRow>

                <PRow label={`Line Height (${selectedEl.lineHeight||1.4})`}>
                  <input type="range" min={1} max={3} step={0.1} value={selectedEl.lineHeight||1.4} onChange={e=>u("lineHeight",+e.target.value)} style={{ width:"100%" }} />
                </PRow>
              </div>
            )}

            {/* ── BUTTON EXTRAS ──
            {isButton && (
              <div>
                <SLabel>Button</SLabel>

                <PRow label="Link URL">
                  <input
                    type="url"
                    placeholder="https://..."
                    value={selectedEl.link || ""}
                    onChange={e => {
                      u("link", e.target.value);
                      if (e.target.value) u("email", "");
                    }}
                    style={inputStyle}
                  />
                </PRow>

                <PRow label="Email Address">
                  <input
                    type="email"
                    placeholder="example@email.com"
                    value={selectedEl.email || ""}
                    onChange={e => {
                      u("email", e.target.value);
                      if (e.target.value) u("link", "");
                    }}
                    style={inputStyle}
                  />
                </PRow>

                <PRow label={`Corner Radius (${selectedEl.borderRadius || 6}px)`}>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    value={selectedEl.borderRadius || 6}
                    onChange={e => u("borderRadius", +e.target.value)}
                    style={{ width: "100%" }}
                  />
                </PRow>

              </div>
            )} */}

            {/* ── SHAPE PROPERTIES ── */}
            {isShape && (
              <div>
                <SLabel>Shape</SLabel>
                <PRow label="Fill Color">
                  <ColorPicker value={selectedEl.backgroundColor||T.gold} onChange={v=>u("backgroundColor",v)} />
                </PRow>
                {selectedEl.type==="rectangle" && (
                  <>
                    <PRow label={`Corner Radius (${selectedEl.borderRadius||6}px)`}>
                      <input type="range" min={0} max={100} value={selectedEl.borderRadius||6} onChange={e=>u("borderRadius",+e.target.value)} style={{ width:"100%" }} />
                    </PRow>
                    <PRow label="Border Color">
                      <ColorPicker value={selectedEl.borderColor||"transparent"} onChange={v=>u("borderColor",v)} allowTransparent />
                    </PRow>
                    <PRow label={`Border Width (${selectedEl.borderWidth||0}px)`}>
                      <input type="range" min={0} max={20} value={selectedEl.borderWidth||0} onChange={e=>u("borderWidth",+e.target.value)} style={{ width:"100%" }} />
                    </PRow>
                  </>
                )}
              </div>
            )}

            {/* ── LINE PROPERTIES ── */}
            {isLine && (
              <div>
                <SLabel>Line</SLabel>
                <PRow label="Color">
                  <ColorPicker value={selectedEl.strokeColor||T.gold} onChange={v=>u("strokeColor",v)} />
                </PRow>
                <PRow label={`Thickness (${selectedEl.strokeWidth||3}px)`}>
                  <input type="range" min={1} max={30} value={selectedEl.strokeWidth||3} onChange={e=>{ u("strokeWidth",+e.target.value); u("height",+e.target.value); }} style={{ width:"100%" }} />
                </PRow>
              </div>
            )}

            {/* ── IMAGE PROPERTIES ── */}
            {isImage && (
              <div>
                <SLabel>Image</SLabel>

                {/* ✅ EMAIL STATUS BADGE */}
                {imgSrc && (
                  <div style={{
                    marginBottom:10,
                    padding:"7px 10px",
                    borderRadius:7,
                    fontSize:11,
                    fontWeight:600,
                    border:`1px solid ${isEmailSafe ? "#2a5" : "#a52"}`,
                    background: isEmailSafe ? "#0a2a0a" : "#2a0a0a",
                    color: isEmailSafe ? "#4caf50" : "#ff6b6b",
                    lineHeight:1.5,
                  }}>
                    {isEmailSafe && "✅ Hosted image — will display in email"}
                    {isBlob      && "⚠️ Local blob URL — upload to server so it shows in email"}
                    {isBase64    && "⚠️ Base64 image — upload to server so it shows in email"}
                    {!imgSrc     && "No image set"}
                      <div>
                        <SLabel>Image Link</SLabel>

                        <PRow label="URL">
                          <input
                            type="url"
                            placeholder="https://example.com"
                            value={selectedEl.link || ""}
                            onChange={(e) => u("link", e.target.value)}
                            style={inputStyle}
                          />
                        </PRow>
                      </div>
                  </div>
                  
                )}

                {/* ✅ FILE UPLOAD — uploads to server immediately */}
                {/* <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:11, color:T.muted, marginBottom:5, fontWeight:600 }}>
                    Upload Image
                  </div>

              
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    style={{ display:"none" }}
                    id="img-file-upload"
                  />

               
                  <label htmlFor="img-file-upload" style={{
                    display:"flex",
                    alignItems:"center",
                    justifyContent:"center",
                    gap:8,
                    padding:"9px 12px",
                    borderRadius:7,
                    border:`1.5px dashed ${uploading ? T.goldDim : T.gold}`,
                    background: uploading ? `${T.gold}08` : `${T.gold}12`,
                    color: uploading ? T.goldDim : T.gold,
                    cursor: uploading ? "not-allowed" : "pointer",
                    fontSize:12,
                    fontWeight:600,
                    transition:"all .15s",
                    userSelect:"none",
                  }}>
                    {uploading ? (
                      <>
                        <span style={{ animation:"spin 1s linear infinite", display:"inline-block" }}>⟳</span>
                        Uploading...
                      </>
                    ) : (
                      <>📁 Choose Image File</>
                    )}
                  </label>

                  {uploadError && (
                    <div style={{ marginTop:6, fontSize:11, color:"#ff6b6b", padding:"5px 8px", background:"#2a0a0a", borderRadius:5, border:"1px solid #a52" }}>
                      ❌ {uploadError}
                    </div>
                  )}

                  {uploading && (
                    <div style={{ marginTop:6, fontSize:11, color:T.muted }}>
                      Uploading to server...
                    </div>
                  )}
                </div> */}

                {/* OR paste URL directly */}
                <PRow label="Or Paste Image URL">
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={isEmailSafe ? imgSrc : ""}
                    onChange={e => u("src", e.target.value.trim())}
                    style={{ ...inputStyle, fontSize:11 }}
                  />
                </PRow>

                {/* Current preview */}
                {imgSrc && (
                  <div style={{ marginBottom:8 }}>
                    <div style={{ fontSize:11, color:T.muted, marginBottom:5 }}>Current Preview</div>
                    <div style={{
                      width:"100%", height:100, borderRadius:7, overflow:"hidden",
                      border:`1px solid ${T.border}`, background:"#111",
                    }}>
                      <img
                        src={imgSrc}
                        alt="preview"
                        style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
                        onError={e => { e.target.style.display = "none"; }}
                      />
                    </div>
                  </div>
                )}

                <PRow label={`Corner Radius (${selectedEl.borderRadius||4}px)`}>
                  <input type="range" min={0} max={100} value={selectedEl.borderRadius||4} onChange={e=>u("borderRadius",+e.target.value)} style={{ width:"100%" }} />
                </PRow>
                <PRow label="Object Fit">
                  <select value={selectedEl.objectFit||"cover"} onChange={e=>u("objectFit",e.target.value)} style={selectStyle}>
                    {FIT_OPTIONS.map(o=><option key={o}>{o}</option>)}
                  </select>
                </PRow>
                <PRow label="Alt Text">
                  <input type="text" placeholder="Describe the image..." value={selectedEl.alt||""} onChange={e=>u("alt",e.target.value)} style={inputStyle} />
                </PRow>
              </div>
            )}

            {/* ── SOCIAL PROPERTIES ── */}
            {isSocial && (
              <div>
                <SLabel>Social Icon</SLabel>
                <div style={{ fontSize:12, color:T.muted, marginBottom:8 }}>
                  Platform: <strong style={{color:T.gold}}>{selectedEl.platform}</strong>
                </div>
                <PRow label="Link URL">
                  <input type="url" placeholder="https://..." value={selectedEl.link||""} onChange={e=>u("link",e.target.value)} style={inputStyle} />
                </PRow>
              </div>
            )}

            {/* ── EMOJI ICON PROPERTIES ── */}
            {isEmoji && (
              <div>
                <SLabel>Emoji Icon</SLabel>
                <div style={{ fontSize:32, textAlign:"center", marginBottom:8 }}>{selectedEl.emoji||"⭐"}</div>
                <PRow label="Emoji">
                  <input
                    type="text"
                    value={selectedEl.emoji||"⭐"}
                    onChange={e=>u("emoji", e.target.value)}
                    placeholder="Paste any emoji e.g. 🔥"
                    style={{ ...inputStyle, fontSize:18, textAlign:"center" }}
                  />
                </PRow>
                <PRow label="Font Size">
                  <input type="number" value={selectedEl.fontSize||32} onChange={e=>u("fontSize",+e.target.value)}
                    style={inputStyle} min={8} max={200} />
                </PRow>
              </div>
            )}

            <Divider/>

            {/* ── POSITION & SIZE ── */}
            <div>
              <SLabel>Position & Size</SLabel>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {[["X","x"],["Y","y"],["W","width"],["H","height"]].map(([lbl,prop])=>(
                  <div key={prop}>
                    <div style={{ fontSize:10, color:T.muted, marginBottom:3 }}>{lbl}</div>
                    <input type="number" value={Math.round(selectedEl[prop]||0)} onChange={e=>u(prop,+e.target.value)} style={{ ...inputStyle, padding:"6px 8px", fontSize:12 }} />
                  </div>
                ))}
              </div>
            </div>

            <Divider/>

            {/* ── TRANSFORM ── */}
            <div>
              <SLabel>Transform</SLabel>
              <PRow label={`Rotation ${selectedEl.rotation||0}°`}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <input type="range" min={0} max={360} value={selectedEl.rotation||0} onChange={e=>u("rotation",+e.target.value)} style={{ flex:1 }} />
                  <span style={{ fontSize:11, color:T.muted, minWidth:32 }}>{selectedEl.rotation||0}°</span>
                </div>
              </PRow>
              <PRow label={`Opacity ${Math.round((selectedEl.opacity??1)*100)}%`}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <input type="range" min={0} max={1} step={0.01} value={selectedEl.opacity??1} onChange={e=>u("opacity",+e.target.value)} style={{ flex:1 }} />
                  <span style={{ fontSize:11, color:T.muted, minWidth:32 }}>{Math.round((selectedEl.opacity??1)*100)}%</span>
                </div>
              </PRow>
            </div>

            <Divider/>

            {/* ── ANIMATION ── */}
            <div>
              <SLabel>Animation</SLabel>
              <PRow label="Type">
                <select value={selectedEl.animation||"none"} onChange={e=>u("animation",e.target.value)} style={selectStyle}>
                  {ANIMATIONS.map(a=><option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </PRow>
              {selectedEl.animation && selectedEl.animation!=="none" && (
                <>
                  <PRow label={`Duration ${selectedEl.animationDuration||1}s`}>
                    <input type="range" min={0.1} max={5} step={0.1} value={selectedEl.animationDuration||1} onChange={e=>u("animationDuration",+e.target.value)} style={{ width:"100%" }} />
                  </PRow>
                  <PRow label={`Delay ${selectedEl.animationDelay||0}s`}>
                    <input type="range" min={0} max={5} step={0.1} value={selectedEl.animationDelay||0} onChange={e=>u("animationDelay",+e.target.value)} style={{ width:"100%" }} />
                  </PRow>
                </>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Layers mini-list */}
      <LayersList />

      {/* ✅ Spin animation for upload button */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </aside>
  );
}

// ── Layers mini list embedded in bottom of panel ──────────────────────────
function LayersList() {
  return null;
}

// ── Sub-components ──────────────────────────────────────────────────────────
function Divider() {
  return <div style={{ height:1, background:T.border, margin:"0 -2px" }} />;
}

function ActionBtn({ children, onClick, danger, title }) {
  return (
    <button onClick={onClick} title={title}
      style={{
        padding:"7px 6px", borderRadius:7, fontSize:11, fontWeight:600, cursor:"pointer",
        border:`1px solid ${danger?T.danger+"55":T.border}`,
        background: danger?`${T.danger}14`:T.surface,
        color: danger?T.danger:T.txt,
        fontFamily:"inherit", transition:"all .12s",
      }}
      onMouseOver={e=>{ e.currentTarget.style.background = danger?`${T.danger}2A`:`${T.gold}1A`; e.currentTarget.style.borderColor=danger?T.danger:T.gold; }}
      onMouseOut={e=>{ e.currentTarget.style.background = danger?`${T.danger}14`:T.surface; e.currentTarget.style.borderColor=danger?T.danger+"55":T.border; }}
    >{children}</button>
  );
}

function StyleBtn({ children, active, onClick, wide }) {
  return (
    <button onClick={onClick}
      style={{
        flex:wide?1:undefined, width:wide?undefined:34, height:32, borderRadius:7,
        border:`1px solid ${active?T.gold:T.border}`,
        background: active?`${T.gold}22`:T.surface,
        color: active?T.gold:T.txt,
        cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:"inherit",
        transition:"all .12s",
      }}>
      {children}
    </button>
  );
}

function ColorPicker({ value, onChange, allowTransparent }) {
  return (
    <div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:6 }}>
        {allowTransparent && (
          <button title="Transparent" onClick={()=>onChange("transparent")}
            style={{ width:22, height:22, borderRadius:4, border:`2px solid ${value==="transparent"?T.gold:T.border}`, background:"white", cursor:"pointer", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom right,white 45%,red 45%,red 55%,white 55%)" }}/>
          </button>
        )}
        {COLORS.map(c=>(
          <button key={c} onClick={()=>onChange(c)} title={c}
            style={{ width:22, height:22, borderRadius:4, background:c, border:`2px solid ${value===c?T.gold:T.border+"66"}`, cursor:"pointer", transition:"transform .1s" }}
            onMouseOver={e=>e.currentTarget.style.transform="scale(1.25)"}
            onMouseOut={e=>e.currentTarget.style.transform="scale(1)"}
          />
        ))}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <input type="color"
          value={value==="transparent"?"#C9A84C":value}
          onChange={e=>onChange(e.target.value)}
          style={{ width:28, height:26, borderRadius:5, border:`1px solid ${T.border}`, background:"none", padding:0 }}
        />
        <input type="text" value={value} onChange={e=>onChange(e.target.value)}
          style={{ ...inputStyle, flex:1, fontSize:11, padding:"5px 8px" }}
          placeholder="#rrggbb"
        />
      </div>
    </div>
  );
}