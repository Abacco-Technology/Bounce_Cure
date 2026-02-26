/**
 * ToolsPanel.jsx  — LEFT SIDEBAR  (v3)
 *
 * NEW FEATURES:
 *  ① Cards section — pre-built layouts (image+heading+para, promo, feature, testimonial, CTA)
 *  ② H1–H6 heading dropdown with correct font sizes
 *  ③ Lucide icon picker — searchable, any lucide icon name works, typed or from list
 *  ④ Social icons — URL input to add any custom icon image
 *
 * Tabs: Elements | Photos | Colors
 * Dark Gold & Black theme
 */
import React, { useRef, useState, useMemo } from "react";
import { T, SLabel, inputStyle, COLORS } from "../../pages/EditorPage";
import PhotosTab from "./PhotosTab";
// ─── Stock photos ─────────────────────────────────────────────────────────────


// ─── Social platform icons ────────────────────────────────────────────────────
const SOCIAL_PRESETS = [
  { label:"Facebook",  platform:"Facebook",  src:"https://cdn-icons-png.flaticon.com/512/733/733547.png",   color:"#1877F2" },
  { label:"Instagram", platform:"Instagram", src:"https://cdn-icons-png.flaticon.com/512/2111/2111463.png", color:"#E4405F" },
  { label:"Twitter",   platform:"Twitter",   src:"https://cdn-icons-png.flaticon.com/512/733/733579.png",   color:"#1DA1F2" },
  { label:"LinkedIn",  platform:"LinkedIn",  src:"https://cdn-icons-png.flaticon.com/512/145/145807.png",   color:"#0077B5" },
  { label:"YouTube",   platform:"YouTube",   src:"https://cdn-icons-png.flaticon.com/512/1384/1384060.png", color:"#FF0000" },
  { label:"TikTok",    platform:"TikTok",    src:"https://cdn-icons-png.flaticon.com/512/3046/3046126.png", color:"#010101" },
  { label:"WhatsApp",  platform:"WhatsApp",  src:"https://cdn-icons-png.flaticon.com/512/733/733585.png",   color:"#25D366" },
  { label:"Pinterest", platform:"Pinterest", src:"https://cdn-icons-png.flaticon.com/512/145/145808.png",   color:"#E60023" },
];

// ─── Heading tag sizes H1–H6 ─────────────────────────────────────────────────
const HEADING_TAGS = [
  { tag:"H1", fontSize:40, fontWeight:"800", hint:"Page title / hero heading" },
  { tag:"H2", fontSize:32, fontWeight:"700", hint:"Section heading" },
  { tag:"H3", fontSize:26, fontWeight:"700", hint:"Sub-section heading" },
  { tag:"H4", fontSize:22, fontWeight:"600", hint:"Card / widget heading" },
  { tag:"H5", fontSize:18, fontWeight:"600", hint:"Small heading" },
  { tag:"H6", fontSize:15, fontWeight:"600", hint:"Smallest heading / label" },
];

// ─── Lucide icon list (commonly used — all work via lucide CDN SVG URL) ───────
const LUCIDE_ICONS = [
  "home","user","settings","mail","phone","search","bell","bookmark",
  "calendar","camera","check","check-circle","chevron-right","clock",
  "cloud","code","credit-card","download","edit","eye","file","file-text",
  "filter","flag","folder","globe","grid","heart","help-circle","image",
  "info","key","layers","layout","link","list","lock","log-in","log-out",
  "map","map-pin","menu","message-circle","message-square","minus","monitor",
  "moon","more-horizontal","more-vertical","music","package","pause",
  "pen-tool","play","plus","plus-circle","power","printer","refresh-cw",
  "rss","save","send","share","shield","shopping-bag","shopping-cart","slash",
  "sliders","smartphone","smile","star","sun","tag","thumbs-up","trash",
  "trash-2","trending-up","truck","type","unlock","upload","user-check",
  "video","wifi","x","x-circle","zap","zoom-in","zoom-out","arrow-right",
  "arrow-left","arrow-up","arrow-down","alert-circle","alert-triangle",
  "activity","award","bar-chart","bar-chart-2","battery","bold","briefcase",
  "cast","clipboard","columns","compass","copy","cpu","database","disc",
  "divide","dollar-sign","droplet","external-link","feather","film",
  "hash","headphones","inbox","italic","maximize","minimize","navigation",
  "paperclip","percent","pie-chart","radio","repeat","rotate-cw","scissors",
  "sidebar","skip-back","skip-forward","speaker","square","terminal","toggle-left",
  "tool","underline","volume","volume-2","watch","wind","anchor","aperture",
];

// ─── Lucide CDN SVG URL helper ────────────────────────────────────────────────
// We render lucide icons as <img> using the unpkg CDN SVG endpoint
const lucideSrc = (name) =>
  `https://unpkg.com/lucide-static@latest/icons/${name}.svg`;

// ─── Card templates ───────────────────────────────────────────────────────────
const CARD_TEMPLATES = [
  {
    id:"img-head-para",
    label:"Image + Title + Text",
    icon:"🖼",
    preview:"bg+img+heading+paragraph",
    hint:"Classic card: image on top, heading, body text",
    build:(x,y)=>[
      // Card background
      { id:crypto.randomUUID(), type:"rectangle", x, y, width:280, height:320, backgroundColor:"#1A1A1A", borderRadius:12, borderColor:"#2A2200", borderWidth:1, zIndex:Date.now()+1 },
      // Image
      { id:crypto.randomUUID(), type:"image", x:x+10, y:y+10, width:260, height:150, borderRadius:8, objectFit:"cover", src:"https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=260&fit=crop", zIndex:Date.now()+2 },
      // Heading
      { id:crypto.randomUUID(), type:"heading", x:x+14, y:y+172, width:252, height:44, content:"Card Heading", fontSize:20, fontWeight:"bold", color:"#F0C040", backgroundColor:"transparent", fontFamily:"Georgia", textAlign:"left", rotation:0, opacity:1, zIndex:Date.now()+3 },
      // Paragraph
      { id:crypto.randomUUID(), type:"paragraph", x:x+14, y:y+222, width:252, height:80, content:"Add your description here. Click to edit this text and make it your own.", fontSize:13, fontWeight:"normal", color:"#000", backgroundColor:"transparent", fontFamily:"'Trebuchet MS'", textAlign:"left", lineHeight:1.5, rotation:0, opacity:1, zIndex:Date.now()+4 },
    ],
  },
  {
    id:"promo-card",
    label:"Promo / Sale Card",
    icon:"🏷",
    hint:"Bold promo: headline, badge, CTA button",
    build:(x,y)=>[
      { id:crypto.randomUUID(), type:"rectangle", x, y, width:280, height:200, backgroundColor:"#0A0A0A", borderRadius:10, borderColor:"#C9A84C", borderWidth:2, zIndex:Date.now()+1 },
      { id:crypto.randomUUID(), type:"circle", x:x+210, y:y+12, width:56, height:56, backgroundColor:"#C04020", zIndex:Date.now()+2 },
      { id:crypto.randomUUID(), type:"heading", x:x+12, y:y+18, width:190, height:50, content:"50% OFF", fontSize:32, fontWeight:"800", color:"#F0C040", backgroundColor:"transparent", fontFamily:"Impact", textAlign:"left", rotation:0, opacity:1, zIndex:Date.now()+3 },
      { id:crypto.randomUUID(), type:"paragraph", x:x+12, y:y+74, width:256, height:44, content:"Limited time offer. Don't miss out on this incredible deal!", fontSize:13, color:"#C8B880", backgroundColor:"transparent", fontFamily:"'Trebuchet MS'", textAlign:"left", lineHeight:1.5, rotation:0, opacity:1, zIndex:Date.now()+4 },
      { id:crypto.randomUUID(), type:"button", x:x+14, y:y+140, width:140, height:40, content:"Shop Now", fontSize:14, fontWeight:"700", color:"#0A0A0A", backgroundColor:"#C9A84C", borderRadius:6, fontFamily:"'Trebuchet MS'", textAlign:"center", rotation:0, opacity:1, zIndex:Date.now()+5 },
    ],
  },
  {
    id:"feature-card",
    label:"Feature / Icon Card",
    icon:"⚡",
    hint:"Icon + feature name + description",
    build:(x,y)=>[
      { id:crypto.randomUUID(), type:"rectangle", x, y, width:260, height:200, backgroundColor:"#161616", borderRadius:10, borderColor:"#2A2200", borderWidth:1, zIndex:Date.now()+1 },
      { id:crypto.randomUUID(), type:"circle", x:x+14, y:y+18, width:52, height:52, backgroundColor:"#C9A84C22", zIndex:Date.now()+2 },
      { id:crypto.randomUUID(), type:"lucide-icon", x:x+25, y:y+29, width:30, height:30, iconName:"zap", iconColor:"#000", zIndex:Date.now()+3 },
      { id:crypto.randomUUID(), type:"heading", x:x+76, y:y+22, width:172, height:40, content:"Feature Name", fontSize:18, fontWeight:"700", color:"#F0C040", backgroundColor:"transparent", fontFamily:"Georgia", textAlign:"left", rotation:0, opacity:1, zIndex:Date.now()+4 },
      { id:crypto.randomUUID(), type:"paragraph", x:x+14, y:y+86, width:232, height:96, content:"Describe this feature here. Explain the key benefit to the user in 2–3 sentences.", fontSize:13, color:"#C8B880", backgroundColor:"transparent", fontFamily:"'Trebuchet MS'", textAlign:"left", lineHeight:1.6, rotation:0, opacity:1, zIndex:Date.now()+5 },
    ],
  },
  {
    id:"testimonial-card",
    label:"Testimonial Card",
    icon:"💬",
    hint:"Quote + avatar placeholder + name",
    build:(x,y)=>[
      { id:crypto.randomUUID(), type:"rectangle", x, y, width:280, height:200, backgroundColor:"#111111", borderRadius:10, borderColor:"#C9A84C44", borderWidth:1, zIndex:Date.now()+1 },
      { id:crypto.randomUUID(), type:"blockquote", x:x+14, y:y+18, width:252, height:80, content:'"This product completely changed how I work. Highly recommended!"', fontSize:14, fontWeight:"normal", fontStyle:"italic", color:"#E8D8A0", backgroundColor:"transparent", fontFamily:"Georgia", textAlign:"center", lineHeight:1.6, rotation:0, opacity:1, zIndex:Date.now()+2 },
      { id:crypto.randomUUID(), type:"circle", x:x+116, y:y+108, width:40, height:40, backgroundColor:"#7A6020", zIndex:Date.now()+3 },
      { id:crypto.randomUUID(), type:"heading", x:x+14, y:y+158, width:252, height:30, content:"— Jane Doe, CEO", fontSize:13, fontWeight:"600", color:"#C9A84C", backgroundColor:"transparent", fontFamily:"Georgia", textAlign:"center", rotation:0, opacity:1, zIndex:Date.now()+4 },
    ],
  },
  {
    id:"cta-card",
    label:"CTA Banner Card",
    icon:"📣",
    hint:"Call-to-action with bold headline + two buttons",
    build:(x,y)=>[
      { id:crypto.randomUUID(), type:"rectangle", x, y, width:480, height:160, backgroundColor:"#0A0A0A", borderRadius:10, borderColor:"#C9A84C", borderWidth:1, zIndex:Date.now()+1 },
      { id:crypto.randomUUID(), type:"rectangle", x, y, width:480, height:160, backgroundColor:"", borderRadius:10, backgroundImage:"linear-gradient(135deg,#1A1000,#2A1800)", zIndex:Date.now()+1 },
      { id:crypto.randomUUID(), type:"heading", x:x+24, y:y+28, width:320, height:46, content:"Ready to get started?", fontSize:26, fontWeight:"800", color:"#F0C040", backgroundColor:"transparent", fontFamily:"Georgia", textAlign:"left", rotation:0, opacity:1, zIndex:Date.now()+2 },
      { id:crypto.randomUUID(), type:"paragraph", x:x+24, y:y+80, width:280, height:30, content:"Join thousands of happy customers today.", fontSize:14, color:"#C8B880", backgroundColor:"transparent", fontFamily:"'Trebuchet MS'", textAlign:"left", lineHeight:1.4, rotation:0, opacity:1, zIndex:Date.now()+3 },
      { id:crypto.randomUUID(), type:"button", x:x+320, y:y+44, width:130, height:40, content:"Get Started", fontSize:14, fontWeight:"700", color:"#0A0A0A", backgroundColor:"#C9A84C", borderRadius:6, fontFamily:"'Trebuchet MS'", textAlign:"center", rotation:0, opacity:1, zIndex:Date.now()+4 },
      { id:crypto.randomUUID(), type:"button", x:x+320, y:y+94, width:130, height:36, content:"Learn More", fontSize:13, fontWeight:"600", color:"#C9A84C", backgroundColor:"transparent", borderRadius:6, borderColor:"#C9A84C", borderWidth:1, fontFamily:"'Trebuchet MS'", textAlign:"center", rotation:0, opacity:1, zIndex:Date.now()+5 },
    ],
  },
  {
    id:"why-choose-card",
    label:"Why Choose Card",
    icon:"✅",
    hint:"Title + bullet features on left, product image on right (grid bg)",
    build:(x,y)=>{
      const gId = crypto.randomUUID();
      return [
      // Card solid background base
      { id:crypto.randomUUID(), groupId:gId, type:"rectangle", x, y, width:560, height:340, backgroundColor:"#F5F0E8", borderRadius:14, borderColor:"#D4C8A0", borderWidth:1, zIndex:Date.now()+1 },
      // Grid pattern overlay
      { id:crypto.randomUUID(), groupId:gId, type:"rectangle", x, y, width:560, height:340, backgroundColor:"transparent", backgroundImage:"repeating-linear-gradient(#C8BC9033 1px,transparent 1px),repeating-linear-gradient(90deg,#C8BC9033 1px,transparent 1px)", backgroundSize:"28px 28px", borderRadius:14, borderWidth:0, zIndex:Date.now()+2 },
      // Section title — left-aligned
      { id:crypto.randomUUID(), groupId:gId, type:"heading", x:x+20, y:y+18, width:330, height:42, content:"Why Choose Our Software?", fontSize:20, fontWeight:"800", color:"#1A1200", backgroundColor:"transparent", fontFamily:"Georgia", textAlign:"left", rotation:0, opacity:1, zIndex:Date.now()+3 },
      // Divider line under title
      { id:crypto.randomUUID(), groupId:gId, type:"line", x:x+20, y:y+65, width:300, height:2, strokeColor:"#C9A84C", strokeWidth:2, rotation:0, opacity:1, zIndex:Date.now()+4 },

      // Feature 1 — icon circle bg
      { id:crypto.randomUUID(), groupId:gId, type:"circle", x:x+20, y:y+84, width:36, height:36, backgroundColor:"#FFF8E0", borderColor:"#C9A84C", borderWidth:2, zIndex:Date.now()+5 },
      // Feature 1 — emoji centered inside circle
      { id:crypto.randomUUID(), groupId:gId, type:"paragraph", x:x+20, y:y+84, width:36, height:36, content:"⚡", fontSize:18, fontWeight:"normal", color:"#000", backgroundColor:"transparent", fontFamily:"'Trebuchet MS'", textAlign:"center", lineHeight:1.8, rotation:0, opacity:1, zIndex:Date.now()+6 },
      // Feature 1 — text
      { id:crypto.randomUUID(), groupId:gId, type:"paragraph", x:x+64, y:y+84, width:260, height:50, content:"Boost productivity with automations that remove repetitive tasks along with photorealistic 3D views", fontSize:12, fontWeight:"normal", color:"#1A1200", backgroundColor:"transparent", fontFamily:"'Trebuchet MS'", textAlign:"left", lineHeight:1.5, rotation:0, opacity:1, zIndex:Date.now()+7 },

      // Feature 2 — icon circle bg
      { id:crypto.randomUUID(), groupId:gId, type:"circle", x:x+20, y:y+150, width:36, height:36, backgroundColor:"#FFF8E0", borderColor:"#C9A84C", borderWidth:2, zIndex:Date.now()+8 },
      // Feature 2 — emoji
      { id:crypto.randomUUID(), groupId:gId, type:"paragraph", x:x+20, y:y+150, width:36, height:36, content:"🔒", fontSize:18, fontWeight:"normal", color:"#000", backgroundColor:"transparent", fontFamily:"'Trebuchet MS'", textAlign:"center", lineHeight:1.8, rotation:0, opacity:1, zIndex:Date.now()+9 },
      // Feature 2 — text
      { id:crypto.randomUUID(), groupId:gId, type:"paragraph", x:x+64, y:y+150, width:260, height:44, content:"Cloud Licensing keeps moving workstations a breeze", fontSize:12, fontWeight:"normal", color:"#1A1200", backgroundColor:"transparent", fontFamily:"'Trebuchet MS'", textAlign:"left", lineHeight:1.5, rotation:0, opacity:1, zIndex:Date.now()+10 },

      // Feature 3 — icon circle bg
      { id:crypto.randomUUID(), groupId:gId, type:"circle", x:x+20, y:y+212, width:36, height:36, backgroundColor:"#FFF8E0", borderColor:"#C9A84C", borderWidth:2, zIndex:Date.now()+11 },
      // Feature 3 — emoji
      { id:crypto.randomUUID(), groupId:gId, type:"paragraph", x:x+20, y:y+212, width:36, height:36, content:"🎯", fontSize:18, fontWeight:"normal", color:"#000", backgroundColor:"transparent", fontFamily:"'Trebuchet MS'", textAlign:"center", lineHeight:1.8, rotation:0, opacity:1, zIndex:Date.now()+12 },
      // Feature 3 — text
      { id:crypto.randomUUID(), groupId:gId, type:"paragraph", x:x+64, y:y+212, width:260, height:44, content:"Precision design tools built for professional cabinet makers", fontSize:12, fontWeight:"normal", color:"#1A1200", backgroundColor:"transparent", fontFamily:"'Trebuchet MS'", textAlign:"left", lineHeight:1.5, rotation:0, opacity:1, zIndex:Date.now()+13 },

      // CTA button
      { id:crypto.randomUUID(), groupId:gId, type:"button", x:x+20, y:y+280, width:160, height:38, content:"Learn More →", fontSize:13, fontWeight:"700", color:"#0A0A0A", backgroundColor:"#C9A84C", borderRadius:7, fontFamily:"'Trebuchet MS'", textAlign:"center", rotation:0, opacity:1, zIndex:Date.now()+14 },
      // Right: Product image
      { id:crypto.randomUUID(), groupId:gId, type:"image", x:x+340, y:y+70, width:200, height:230, borderRadius:10, objectFit:"cover", src:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=420&h=440&fit=crop", zIndex:Date.now()+15 },
      ];
    },
  },
  
  {
    id:"profile-card",
    label:"Profile Card",
    icon:"👤",
    hint:"Avatar + name + role + social links",
    build:(x,y)=>[
      { id:crypto.randomUUID(), type:"rectangle", x, y, width:240, height:280, backgroundColor:"#161616", borderRadius:12, borderColor:"#C9A84C33", borderWidth:1, zIndex:Date.now()+1 },
      { id:crypto.randomUUID(), type:"circle", x:x+80, y:y+20, width:80, height:80, backgroundColor:"#C9A84C33", zIndex:Date.now()+2 },
      { id:crypto.randomUUID(), type:"heading", x:x+20, y:y+116, width:200, height:36, content:"Your Name", fontSize:20, fontWeight:"700", color:"#F0C040", backgroundColor:"transparent", fontFamily:"Georgia", textAlign:"center", rotation:0, opacity:1, zIndex:Date.now()+3 },
      { id:crypto.randomUUID(), type:"paragraph", x:x+20, y:y+156, width:200, height:24, content:"Designer / Developer", fontSize:13, color:"#C9A84C", backgroundColor:"transparent", fontFamily:"'Trebuchet MS'", textAlign:"center", lineHeight:1.4, rotation:0, opacity:1, zIndex:Date.now()+4 },
      { id:crypto.randomUUID(), type:"line", x:x+40, y:y+192, width:160, height:2, strokeColor:"#2A2200", strokeWidth:2, rotation:0, opacity:1, zIndex:Date.now()+5 },
      { id:crypto.randomUUID(), type:"paragraph", x:x+20, y:y+204, width:200, height:56, content:"Short bio or description goes here. Click to edit.", fontSize:12, color:"#8A7850", backgroundColor:"transparent", fontFamily:"'Trebuchet MS'", textAlign:"center", lineHeight:1.5, rotation:0, opacity:1, zIndex:Date.now()+6 },
    ],
  },

  {
  id:"why-choose-left-card",
  label:"Why Choose Card (Image Left)",
  icon:"🖼",
  hint:"Product image on LEFT, bullet features on RIGHT — mirror of card above",
  build:(x,y)=>{
    const gId = crypto.randomUUID(); // shared groupId for all elements in this card
    // Image col: x+16 to x+216 (width 200) — 36% of 560
    // Text col: starts at x+232, width 308
    const imgX  = x + 16;
    const textX = x + 232;
    const textW = 308;
    return [
      // Card base background
      { id:crypto.randomUUID(), groupId:gId, type:"rectangle", x, y, width:560, height:340, backgroundColor:"#F5F0E8", borderRadius:14, borderColor:"#D4C8A0", borderWidth:1, zIndex:Date.now()+1 },
      // Grid overlay
      { id:crypto.randomUUID(), groupId:gId, type:"rectangle", x, y, width:560, height:340, backgroundColor:"transparent", backgroundImage:"repeating-linear-gradient(#C8BC9033 1px,transparent 1px),repeating-linear-gradient(90deg,#C8BC9033 1px,transparent 1px)", backgroundSize:"28px 28px", borderRadius:14, borderWidth:0, zIndex:Date.now()+2 },

      // LEFT — Image (width:200, starts at x+16)
      { id:crypto.randomUUID(), groupId:gId, type:"image", x:imgX, y:y+55, width:200, height:255, borderRadius:10, objectFit:"cover", src:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=420&h=440&fit=crop", zIndex:Date.now()+3 },

      // RIGHT — Section title
      { id:crypto.randomUUID(), groupId:gId, type:"heading", x:textX, y:y+18, width:textW-10, height:42, content:"Why Choose Our Software?", fontSize:19, fontWeight:"800", color:"#1A1200", backgroundColor:"transparent", fontFamily:"Georgia", textAlign:"left", rotation:0, opacity:1, zIndex:Date.now()+4 },
      // Divider
      { id:crypto.randomUUID(), groupId:gId, type:"line", x:textX, y:y+62, width:textW-20, height:2, strokeColor:"#C9A84C", strokeWidth:2, rotation:0, opacity:1, zIndex:Date.now()+5 },

      // Feature 1
      { id:crypto.randomUUID(), groupId:gId, type:"circle",    x:textX,    y:y+80, width:36, height:36, backgroundColor:"#FFF8E0", borderColor:"#C9A84C", borderWidth:2, zIndex:Date.now()+6 },
      { id:crypto.randomUUID(), groupId:gId, type:"paragraph", x:textX,    y:y+80, width:36, height:36, content:"⚡", fontSize:18, fontWeight:"normal", color:"#000", backgroundColor:"transparent", fontFamily:"'Trebuchet MS'", textAlign:"center", lineHeight:1.8, rotation:0, opacity:1, zIndex:Date.now()+7 },
      { id:crypto.randomUUID(), groupId:gId, type:"paragraph", x:textX+44, y:y+80, width:textW-50, height:50, content:"Boost productivity with automations that remove repetitive tasks along with photorealistic 3D views", fontSize:12, fontWeight:"normal", color:"#1A1200", backgroundColor:"transparent", fontFamily:"'Trebuchet MS'", textAlign:"left", lineHeight:1.5, rotation:0, opacity:1, zIndex:Date.now()+8 },

      // Feature 2
      { id:crypto.randomUUID(), groupId:gId, type:"circle",    x:textX,    y:y+148, width:36, height:36, backgroundColor:"#FFF8E0", borderColor:"#C9A84C", borderWidth:2, zIndex:Date.now()+9 },
      { id:crypto.randomUUID(), groupId:gId, type:"paragraph", x:textX,    y:y+148, width:36, height:36, content:"🔒", fontSize:18, fontWeight:"normal", color:"#000", backgroundColor:"transparent", fontFamily:"'Trebuchet MS'", textAlign:"center", lineHeight:1.8, rotation:0, opacity:1, zIndex:Date.now()+10 },
      { id:crypto.randomUUID(), groupId:gId, type:"paragraph", x:textX+44, y:y+148, width:textW-50, height:44, content:"Cloud Licensing keeps moving workstations a breeze", fontSize:12, fontWeight:"normal", color:"#1A1200", backgroundColor:"transparent", fontFamily:"'Trebuchet MS'", textAlign:"left", lineHeight:1.5, rotation:0, opacity:1, zIndex:Date.now()+11 },

      // Feature 3
      { id:crypto.randomUUID(), groupId:gId, type:"circle",    x:textX,    y:y+208, width:36, height:36, backgroundColor:"#FFF8E0", borderColor:"#C9A84C", borderWidth:2, zIndex:Date.now()+12 },
      { id:crypto.randomUUID(), groupId:gId, type:"paragraph", x:textX,    y:y+208, width:36, height:36, content:"🎯", fontSize:18, fontWeight:"normal", color:"#000", backgroundColor:"transparent", fontFamily:"'Trebuchet MS'", textAlign:"center", lineHeight:1.8, rotation:0, opacity:1, zIndex:Date.now()+13 },
      { id:crypto.randomUUID(), groupId:gId, type:"paragraph", x:textX+44, y:y+208, width:textW-50, height:44, content:"Precision design tools built for professional cabinet makers", fontSize:12, fontWeight:"normal", color:"#1A1200", backgroundColor:"transparent", fontFamily:"'Trebuchet MS'", textAlign:"left", lineHeight:1.5, rotation:0, opacity:1, zIndex:Date.now()+14 },

      // CTA button on right side
      { id:crypto.randomUUID(), groupId:gId, type:"button", x:textX, y:y+275, width:150, height:38, content:"Learn More →", fontSize:13, fontWeight:"700", color:"#0A0A0A", backgroundColor:"#C9A84C", borderRadius:7, fontFamily:"'Trebuchet MS'", textAlign:"center", rotation:0, opacity:1, zIndex:Date.now()+15 },
    ];
  },
}
];

// ─── Tabs config ─────────────────────────────────────────────────────────────
const TABS = [
  { id:"elements", label:"Elements", icon:"◆" },
  { id:"cards",    label:"Cards",    icon:"🃏" },
  { id:"photos",   label:"Photos",   icon:"🖼" },
  { id:"colors",   label:"Colors",   icon:"🎨" },
];

// ─── Main component ───────────────────────────────────────────────────────────
export default function ToolsPanel({
  leftTab, setLeftTab,
  addElement,
  addMultipleElements,  // new: adds a group of elements at once (for cards)
  zoom, setZoom,
  showGrid, setShowGrid,
  undoStack, redoStack, undo, redo,
  pagesBg, setPageBg,
  selected, selectedEl,
  deleteEl, duplicateEl, clearPage,
}) {
  const fileRef         = useRef();
  const [urlInput,      setUrlInput]      = useState("");
  const [headingOpen,   setHeadingOpen]   = useState(false);
  const [socialUrl,     setSocialUrl]     = useState("");
  const [socialLabel,   setSocialLabel]   = useState("");
  const [iconSearch,    setIconSearch]    = useState("");
  const [customIcon,    setCustomIcon]    = useState("");
  const [iconColor,     setIconColor]     = useState("#000000");

  // ── filtered lucide icons ──
  const filteredIcons = useMemo(() => {
    const q = iconSearch.toLowerCase().trim();
    return q ? LUCIDE_ICONS.filter(i => i.includes(q)) : LUCIDE_ICONS;
  }, [iconSearch]);

  // ── handlers ──
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => addElement("image", { src:reader.result });
    reader.readAsDataURL(file);
  };

  const handleUrlAdd = () => {
    if (urlInput.trim()) { addElement("image", { src:urlInput.trim() }); setUrlInput(""); }
  };

  const handleAddCard = (card) => {
    const x = 60 + Math.random() * 40;
    const y = 60 + Math.random() * 40;
    const elements = card.build(x, y);
    if (addMultipleElements) addMultipleElements(elements);
    else elements.forEach(el => addElement(el.type, el));
  };

  const handleAddHeading = (h) => {
    addElement("heading", {
      content: `${h.tag} Heading`,
      fontSize: h.fontSize,
      fontWeight: h.fontWeight,
      headingTag: h.tag,
    });
    setHeadingOpen(false);
  };

  const handleAddLucideIcon = (name) => {
    addElement("lucide-icon", {
      iconName:  name,
      iconColor: iconColor,
      width:     48,
      height:    48,
    });
  };

  const handleCustomIconAdd = () => {
    const name = customIcon.trim().toLowerCase().replace(/[<>/\s]/g,"");
    if (name) { handleAddLucideIcon(name); setCustomIcon(""); }
  };

  const handleSocialUrlAdd = () => {
    if (!socialUrl.trim()) return;
    addElement("social", {
      platform: socialLabel.trim() || "Custom",
      src:      socialUrl.trim(),
      link:     "#",
    });
    setSocialUrl("");
    setSocialLabel("");
  };

  return (
    <aside style={{
      width:234, minWidth:180, background:T.panel, borderRight:`1px solid ${T.border}`,
      display:"flex", flexDirection:"column", overflow:"hidden", flexShrink:0,
    }}>
      {/* Tab bar */}
      <div style={{ display:"flex", borderBottom:`1px solid ${T.border}`, flexShrink:0, overflowX:"auto" }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setLeftTab(tab.id)}
            style={{
              flex:1, minWidth:52, padding:"9px 2px", fontSize:10, fontWeight:700, border:"none", cursor:"pointer",
              borderBottom: leftTab===tab.id ? `2px solid ${T.gold}` : "2px solid transparent",
              background:"transparent",
              color: leftTab===tab.id ? T.gold : T.muted,
              transition:"all .14s", fontFamily:"inherit",
            }}>
            <div style={{ fontSize:14, marginBottom:2 }}>{tab.icon}</div>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div style={{ flex:1, overflowY:"auto", padding:"14px 10px" }}>

        {/* ══════════════════ ELEMENTS TAB ══════════════════ */}
        {leftTab==="elements" && (
          <div>
            {/* ── Heading H1–H6 dropdown ── */}
            <div style={{ marginBottom:16 }}>
              <SLabel>✏  Headings</SLabel>
              <div style={{ position:"relative" }}>
                <button
                  onClick={() => setHeadingOpen(o => !o)}
                  style={{
                    width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
                    padding:"9px 12px", borderRadius:8, border:`1px solid ${headingOpen ? T.gold : T.border}`,
                    background:T.surface, color:T.txt, cursor:"pointer", fontSize:13, fontWeight:600,
                    fontFamily:"inherit", transition:"all .13s",
                  }}
                  onMouseOver={e => e.currentTarget.style.borderColor=T.gold}
                  onMouseOut={e  => { if (!headingOpen) e.currentTarget.style.borderColor=T.border; }}
                >
                  <span>Add Heading (H1–H6)</span>
                  <span style={{ fontSize:10, color:T.gold, marginLeft:6 }}>{headingOpen ? "▲" : "▼"}</span>
                </button>
                {headingOpen && (
                  <div style={{
                    position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:100,
                    background:T.panel, border:`1px solid ${T.gold}55`, borderRadius:9,
                    boxShadow:`0 8px 28px rgba(0,0,0,.7)`, overflow:"hidden",
                  }}>
                    {HEADING_TAGS.map(h => (
                      <button key={h.tag}
                        onClick={() => handleAddHeading(h)}
                        title={h.hint}
                        style={{
                          display:"flex", alignItems:"baseline", gap:10,
                          width:"100%", padding:"9px 14px", border:"none",
                          background:"transparent", cursor:"pointer", textAlign:"left",
                          transition:"background .1s", borderBottom:`1px solid ${T.border}`,
                        }}
                        onMouseOver={e => e.currentTarget.style.background=`${T.gold}18`}
                        onMouseOut={e  => e.currentTarget.style.background="transparent"}
                      >
                        <span style={{ fontSize:10, fontWeight:700, color:T.goldDim, width:22 }}>{h.tag}</span>
                        <span style={{ fontSize:h.fontSize * 0.45 + 8, fontWeight:h.fontWeight, color:T.txt, fontFamily:"Georgia", lineHeight:1 }}>
                          Sample
                        </span>
                        <span style={{ fontSize:10, color:T.muted, marginLeft:"auto" }}>{h.fontSize}px</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Other text + shapes ── */}
            <div style={{ marginBottom:16 }}>
              <SLabel>✏  Text</SLabel>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
                {[
                  { label:"Subheading", type:"subheading", icon:"H·", hint:"Section title" },
                  { label:"Paragraph",  type:"paragraph",  icon:"¶",  hint:"Body text" },
                  { label:"Quote",      type:"blockquote", icon:'"',  hint:"Pull quote" },
                  { label:"Button",     type:"button",     icon:"▶",  hint:"Call-to-action" },
                ].map(item => (
                  <ElementChip key={item.type} item={item} onClick={() => addElement(item.type)} />
                ))}
              </div>
            </div>

            <div style={{ marginBottom:16 }}>
              <SLabel>◆  Shapes</SLabel>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
                {[
                  { label:"Rectangle", type:"rectangle", icon:"▭", hint:"Box / block" },
                  { label:"Circle",    type:"circle",    icon:"●", hint:"Round badge" },
                  { label:"Star",      type:"star",      icon:"★", hint:"Accent / rating" },
                  { label:"Line",      type:"line",      icon:"─", hint:"Divider" },
                ].map(item => (
                  <ElementChip key={item.type} item={item} onClick={() => addElement(item.type)} />
                ))}
              </div>
            </div>

            {/* ── Lucide Icons ── */}
            <div style={{ marginBottom:16 }}>
              <SLabel>🔷  Icons (Lucide)</SLabel>
              <div style={{ fontSize:10, color:T.muted, marginBottom:6, lineHeight:1.5 }}>
                Click any icon to add it, or type any icon name below.
                <br/>Only used icons are listed. All lucide names work.
              </div>

              {/* Icon color picker */}
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
                <span style={{ fontSize:10, color:T.txtDim, flexShrink:0 }}>Color:</span>
                <input type="color" value={iconColor} onChange={e => setIconColor(e.target.value)}
                  style={{ width:26, height:22, borderRadius:4, border:`1px solid ${T.border}`, padding:0, background:"none", cursor:"pointer" }} />
                <span style={{ fontSize:11, color:T.muted }}>{iconColor}</span>
              </div>

              {/* Search */}
              <input
                type="text" value={iconSearch} onChange={e => setIconSearch(e.target.value)}
                placeholder="Search icon name…"
                style={{ ...inputStyle, fontSize:11, padding:"6px 8px", marginBottom:8, width:"100%" }}
              />

              {/* Custom icon name input */}
              <div style={{ display:"flex", gap:5, marginBottom:8 }}>
                <input
                  type="text" value={customIcon} onChange={e => setCustomIcon(e.target.value)}
                  placeholder='Type any name e.g. "home"'
                  style={{ ...inputStyle, fontSize:11, padding:"6px 8px", flex:1 }}
                  onKeyDown={e => e.key==="Enter" && handleCustomIconAdd()}
                />
                <button onClick={handleCustomIconAdd}
                  style={{ padding:"6px 10px", borderRadius:7, border:`1px solid ${T.gold}`, background:`${T.gold}22`, color:T.gold, cursor:"pointer", fontSize:12, fontFamily:"inherit", flexShrink:0 }}>
                  +Add
                </button>
              </div>

              {/* Icon grid */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:5, maxHeight:180, overflowY:"auto" }}>
                {filteredIcons.slice(0, 60).map(name => (
                  <button
                    key={name}
                    onClick={() => handleAddLucideIcon(name)}
                    title={name}
                    style={{
                      padding:6, borderRadius:6, border:`1px solid ${T.border}`,
                      background:T.surface, cursor:"pointer",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      transition:"all .12s",
                    }}
                    onMouseOver={e => { e.currentTarget.style.borderColor=T.gold; e.currentTarget.style.background=`${T.gold}14`; }}
                    onMouseOut={e  => { e.currentTarget.style.borderColor=T.border; e.currentTarget.style.background=T.surface; }}
                  >
                    <img
                      src={lucideSrc(name)}
                      alt={name}
                      width={18} height={18}
                      style={{ filter:`invert(1) sepia(1) saturate(3) hue-rotate(20deg)`, opacity:.9, pointerEvents:"none" }}
                      onError={e => { e.currentTarget.style.display="none"; e.currentTarget.parentNode.innerHTML=`<span style="font-size:9px;color:${T.muted}">${name.slice(0,4)}</span>`; }}
                    />
                  </button>
                ))}
              </div>
              {filteredIcons.length > 60 && (
                <div style={{ fontSize:10, color:T.muted, marginTop:5, textAlign:"center" }}>
                  +{filteredIcons.length - 60} more — type in search to filter
                </div>
              )}
            </div>

            {/* ── Social Icons ── */}
            <div style={{ marginBottom:16 }}>
              <SLabel>🌐  Social Icons</SLabel>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:10 }}>
                {SOCIAL_PRESETS.map(s => (
                  <button key={s.platform}
                    onClick={() => addElement("social", { platform:s.platform, src:s.src })}
                    title={s.label}
                    style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:7, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3, transition:"all .12s" }}
                    onMouseOver={e => { e.currentTarget.style.borderColor=T.gold; e.currentTarget.style.background=`${T.gold}0D`; }}
                    onMouseOut={e  => { e.currentTarget.style.borderColor=T.border; e.currentTarget.style.background=T.surface; }}
                  >
                    <img src={s.src} alt={s.label} style={{ width:20, height:20, objectFit:"contain" }} />
                    <span style={{ fontSize:8, color:T.muted }}>{s.label}</span>
                  </button>
                ))}
              </div>

              {/* Custom social icon via URL */}
              <div style={{ background:T.surface, borderRadius:8, padding:"10px 10px", border:`1px solid ${T.border}` }}>
                <div style={{ fontSize:10, color:T.gold, fontWeight:700, marginBottom:7 }}>+ Custom Icon URL</div>
                <input
                  type="text" value={socialLabel} onChange={e => setSocialLabel(e.target.value)}
                  placeholder="Label (e.g. Discord)"
                  style={{ ...inputStyle, fontSize:11, padding:"5px 8px", marginBottom:5 }}
                />
                <div style={{ display:"flex", gap:5 }}>
                  <input
                    type="url" value={socialUrl} onChange={e => setSocialUrl(e.target.value)}
                    placeholder="Icon image URL"
                    style={{ ...inputStyle, fontSize:11, padding:"5px 8px", flex:1 }}
                    onKeyDown={e => e.key==="Enter" && handleSocialUrlAdd()}
                  />
                  <button onClick={handleSocialUrlAdd}
                    style={{ padding:"5px 10px", borderRadius:7, border:`1px solid ${T.gold}`, background:`${T.gold}22`, color:T.gold, cursor:"pointer", fontSize:12, fontFamily:"inherit", flexShrink:0 }}>
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            {selected && (
              <div style={{ marginTop:4, padding:"10px", background:T.surface, borderRadius:8, border:`1px solid ${T.border}` }}>
                <SLabel>Selected Element</SLabel>
                <div style={{ display:"flex", gap:6 }}>
                  <ActionChip onClick={duplicateEl} title="Duplicate (Ctrl+D)">⎘ Copy</ActionChip>
                  <ActionChip onClick={deleteEl} title="Delete (Del)" danger>🗑 Del</ActionChip>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════ CARDS TAB ══════════════════ */}
        {leftTab==="cards" && (
          <div>
            <div style={{ fontSize:11, color:T.muted, marginBottom:12, lineHeight:1.6 }}>
              Click any card template to add it to your canvas. Includes background, image, heading, and text — all editable.
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {CARD_TEMPLATES.map(card => (
                <CardTemplateChip key={card.id} card={card} onClick={() => handleAddCard(card)} />
              ))}
            </div>

            {/* Card tip */}
            <div style={{ marginTop:14, padding:"10px 12px", background:T.surface, borderRadius:8, border:`1px solid ${T.border}` }}>
              <div style={{ fontSize:10, color:T.gold, fontWeight:700, marginBottom:4 }}>✦ How to use cards</div>
              <div style={{ fontSize:10, color:T.muted, lineHeight:1.7 }}>
                Each card is a group of elements — background, image, heading, and text. Click any element to select and edit it individually. Drag the background rectangle to move the whole group.
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════ PHOTOS TAB ══════════════════ */}
        {/* {leftTab==="photos" && (
          <div>
            <div style={{ marginBottom:16 }}>
              <SLabel>Upload Image</SLabel>
              <button onClick={() => fileRef.current?.click()}
                style={{ width:"100%", padding:"12px 0", borderRadius:8, border:`1.5px dashed ${T.gold}`, background:`${T.gold}0A`, color:T.gold, fontWeight:700, cursor:"pointer", fontSize:13, fontFamily:"inherit", marginBottom:8 }}>
                ↑ Choose File
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleFileUpload} />
              <div style={{ fontSize:11, color:T.muted, marginBottom:5 }}>Or paste image URL:</div>
              <div style={{ display:"flex", gap:6 }}>
                <input type="text" value={urlInput} onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://..." style={{ ...inputStyle, fontSize:11, padding:"6px 8px", flex:1 }}
                  onKeyDown={e => e.key==="Enter" && handleUrlAdd()} />
                <button onClick={handleUrlAdd}
                  style={{ padding:"6px 10px", borderRadius:7, border:`1px solid ${T.gold}`, background:`${T.gold}22`, color:T.gold, cursor:"pointer", fontSize:12, fontFamily:"inherit" }}>
                  Add
                </button>
              </div>
            </div>
            <SLabel>Stock Photos</SLabel>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
              {STOCK.map((src,i) => (
                <img key={i} src={src} alt="stock"
                  onClick={() => addElement("image",{src})}
                  style={{ width:"100%", height:72, objectFit:"cover", borderRadius:7, cursor:"pointer", border:"1.5px solid transparent", transition:"all .14s", display:"block" }}
                  onMouseOver={e => { e.currentTarget.style.border=`1.5px solid ${T.gold}`; e.currentTarget.style.opacity=".85"; }}
                  onMouseOut={e  => { e.currentTarget.style.border="1.5px solid transparent"; e.currentTarget.style.opacity="1"; }}
                />
              ))}
            </div>
          </div>
        )} */}

        {leftTab === "photos" && (
          <PhotosTab addElement={addElement} />
        )}

        {/* ══════════════════ COLORS TAB ══════════════════ */}
        {leftTab==="colors" && (
          <div>
            <SLabel>Canvas Background</SLabel>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => setPageBg(c)} title={c}
                  style={{ width:24, height:24, borderRadius:5, background:c, border:`2px solid ${pagesBg===c?T.gold:T.border}`, cursor:"pointer", transition:"transform .12s" }}
                  onMouseOver={e => e.currentTarget.style.transform="scale(1.2)"}
                  onMouseOut={e  => e.currentTarget.style.transform="scale(1)"}
                />
              ))}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:18 }}>
              <input type="color" value={pagesBg||"#ffffff"} onChange={e => setPageBg(e.target.value)}
                style={{ width:32, height:28, borderRadius:6, border:`1px solid ${T.border}`, background:"none", padding:0 }} />
              <input type="text" value={pagesBg||"#ffffff"} onChange={e => setPageBg(e.target.value)}
                style={{ ...inputStyle, flex:1, fontSize:12, padding:"6px 8px" }} />
            </div>
            <SLabel>Preset Palettes</SLabel>
            {[
              { name:"Gold Noir",   colors:["#0A0A0A","#161616","#C9A84C","#F0C040","#F5EDD0"] },
              { name:"Crimson",     colors:["#1A0808","#C04020","#E06040","#F5EDD0","#FFFFFF"] },
              { name:"Ocean Deep",  colors:["#060E1A","#204060","#4080C0","#80B0E0","#F0F8FF"] },
              { name:"Forest",      colors:["#080F08","#204020","#40A060","#80D080","#F0FFF0"] },
              { name:"Rose Gold",   colors:["#1A0C0C","#6B3040","#C07080","#E8B0B8","#FFF0F0"] },
              { name:"Midnight",    colors:["#060618","#101030","#3040A0","#6080D0","#E0E8FF"] },
            ].map(pal => (
              <div key={pal.name} style={{ marginBottom:10 }}>
                <div style={{ fontSize:11, color:T.txtDim, marginBottom:4 }}>{pal.name}</div>
                <div style={{ display:"flex", gap:5 }}>
                  {pal.colors.map(c => (
                    <button key={c} onClick={() => setPageBg(c)}
                      style={{ flex:1, height:22, borderRadius:4, background:c, border:`1px solid ${T.border}`, cursor:"pointer" }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer tips */}
      <div style={{ padding:"8px 12px", borderTop:`1px solid ${T.border}`, flexShrink:0 }}>
        <div style={{ fontSize:9, color:T.muted, lineHeight:1.7 }}>
          <span style={{ color:T.goldDim }}>✦</span> Dbl-click text to edit · Drag to move · Del=delete · Ctrl+D=copy
        </div>
      </div>
    </aside>
  );
}

// ─── Card template chip ───────────────────────────────────────────────────────
function CardTemplateChip({ card, onClick }) {
  return (
    <button onClick={onClick} title={card.hint}
      style={{
        display:"flex", alignItems:"center", gap:10,
        padding:"11px 12px", borderRadius:9,
        border:`1px solid ${T.border}`, background:T.surface,
        cursor:"pointer", textAlign:"left", transition:"all .13s", fontFamily:"inherit",
        width:"100%",
      }}
      onMouseOver={e => { e.currentTarget.style.borderColor=T.gold; e.currentTarget.style.background=`${T.gold}0D`; }}
      onMouseOut={e  => { e.currentTarget.style.borderColor=T.border; e.currentTarget.style.background=T.surface; }}
    >
      <span style={{ fontSize:22, lineHeight:1, flexShrink:0 }}>{card.icon}</span>
      <div>
        <div style={{ fontSize:12, fontWeight:700, color:T.txt, marginBottom:2 }}>{card.label}</div>
        <div style={{ fontSize:10, color:T.muted, lineHeight:1.4 }}>{card.hint}</div>
      </div>
      <span style={{ marginLeft:"auto", fontSize:16, color:T.goldDim, flexShrink:0 }}>+</span>
    </button>
  );
}

// ─── Generic element chip ─────────────────────────────────────────────────────
function ElementChip({ item, onClick }) {
  return (
    <button onClick={onClick} title={item.hint}
      style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4, padding:"10px 4px", borderRadius:8, border:`1px solid ${T.border}`, background:T.surface, cursor:"pointer", fontSize:11, color:T.txt, fontWeight:600, transition:"all .13s", fontFamily:"inherit" }}
      onMouseOver={e => { e.currentTarget.style.borderColor=T.gold; e.currentTarget.style.color=T.gold; e.currentTarget.style.background=`${T.gold}0D`; }}
      onMouseOut={e  => { e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.txt; e.currentTarget.style.background=T.surface; }}
    >
      <span style={{ fontSize:17, lineHeight:1 }}>{item.icon}</span>
      <span>{item.label}</span>
    </button>
  );
}

// ─── Action chip ──────────────────────────────────────────────────────────────
function ActionChip({ children, onClick, danger, title }) {
  return (
    <button onClick={onClick} title={title}
      style={{ flex:1, padding:"6px 0", borderRadius:7, fontSize:12, fontWeight:600, cursor:"pointer", border:`1px solid ${danger?T.danger+"60":T.border}`, background:danger?`${T.danger}18`:T.panel, color:danger?T.danger:T.txt, fontFamily:"inherit", transition:"all .12s" }}
      onMouseOver={e => { e.currentTarget.style.background = danger?`${T.danger}33`:`${T.gold}18`; }}
      onMouseOut={e  => { e.currentTarget.style.background = danger?`${T.danger}18`:T.panel; }}
    >{children}</button>
  );
}

// Export lucide src helper for use in CanvasArea renderer
export { lucideSrc };