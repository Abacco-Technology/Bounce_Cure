// client/src/pages/Campaign/pages/editorConstants.js
//
// Leaf module: imports nothing, so it can never take part in an import cycle.
//
// These used to live in EditorPage.jsx, but EditorPage imports CanvasArea,
// Toolbox and PropertiesPanel, and those three import back from EditorPage.
// That cycle is harmless for values read during render (like the `T` palette)
// but fatal for values used at module-evaluation time — CanvasArea does
// `const EDITABLE_TYPES = [...TEXT_TYPES, ...SHAPE_TYPES]` at the top level,
// which ran before EditorPage had finished initialising and threw
// "Cannot access 'SHAPE_TYPES' before initialization".
//
// Anything consumed at module scope belongs here, not in EditorPage.

/** Shapes that can hold text and an image fill. */
export const SHAPE_TYPES = ["rectangle", "square", "circle", "triangle"];

/** Border styles offered for those shapes. */
export const BORDER_STYLES = ["solid", "dashed", "dotted", "double", "none"];

/** Element types whose content is editable by double-click. */
export const TEXT_TYPES = ["heading", "subheading", "paragraph", "blockquote", "button"];

/** Link colour on the canvas. Keep in sync with inlineHtml() in server/routes/campaigns.js. */
export const LINK_COLOR = "#1155cc";