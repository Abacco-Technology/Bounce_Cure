/**
 * richText.js — inline formatting support for text elements.
 *
 * Text elements store their content as a small, strictly limited subset of HTML:
 *   <b> <strong> <i> <em> <u> <s> <a href> <br>
 * Everything else is unwrapped (its text is kept, the tag is dropped) so a
 * paste from Word or a browser can never inject block-level markup, scripts,
 * inline styles or anything that would break the canvas box or the email.
 */

export const ALLOWED_TAGS = new Set([
  "B", "STRONG", "I", "EM", "U", "S", "A", "BR",
  "UL", "OL", "LI",
]);

/** Tags that mean "line break here" once unwrapped. */
const BLOCK_TAGS = new Set(["DIV", "P", "BLOCKQUOTE", "TR", "H1", "H2", "H3", "H4", "H5", "H6"]);

/** Ordered-list numbering styles the editor offers. */
export const LIST_TYPES = {
  bullet:  { tag: "UL", type: null, css: "disc" },
  number:  { tag: "OL", type: "1",  css: "decimal" },
  roman:   { tag: "OL", type: "I",  css: "upper-roman" },
};

/** Which of LIST_TYPES a DOM list element represents. */
export function listKind(node) {
  if (!node) return null;
  if (node.tagName === "UL") return "bullet";
  if (node.tagName === "OL") {
    const t = (node.getAttribute("type") || "1").toUpperCase();
    return t === "I" ? "roman" : "number";
  }
  return null;
}

/** Only http(s) and mailto/tel links survive — blocks javascript: and data: URLs. */
export function safeHref(raw) {
  const href = String(raw || "").trim();
  if (!href) return null;
  if (/^(https?:|mailto:|tel:)/i.test(href)) return href;
  // Bare domain typed by the user — assume https
  if (/^[\w-]+(\.[\w-]+)+([/?#].*)?$/.test(href)) return `https://${href}`;
  return null;
}

export function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Strip everything outside the allowlist. Runs in the browser (uses DOMParser).
 * Returns a string safe to hand to dangerouslySetInnerHTML.
 */
export function sanitizeInlineHtml(html) {
  if (typeof html !== "string" || !html) return "";
  if (typeof window === "undefined" || !window.DOMParser) return escapeHtml(html);

  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc?.body?.firstChild;
  if (!root || root.nodeType !== 1) return escapeHtml(html);   // parser gave us nothing usable

  const walk = (node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === 3) return;                 // text — keep as-is
      if (child.nodeType !== 1) { child.remove(); return; }

      const tag = child.tagName;

      if (tag === "SCRIPT" || tag === "STYLE") { child.remove(); return; }

      if (!ALLOWED_TAGS.has(tag)) {
        walk(child);
        const isBlock = BLOCK_TAGS.has(tag);
        // Unwrap: promote the children, add a <br> where a block used to be
        while (child.firstChild) node.insertBefore(child.firstChild, child);
        if (isBlock && child.nextSibling) node.insertBefore(doc.createElement("br"), child);
        child.remove();
        return;
      }

      // <li> only makes sense inside a list — otherwise unwrap it
      if (tag === "LI" && !["UL", "OL"].includes(node.tagName)) {
        walk(child);
        while (child.firstChild) node.insertBefore(child.firstChild, child);
        if (child.nextSibling) node.insertBefore(doc.createElement("br"), child);
        child.remove();
        return;
      }

      // Allowed tag — scrub every attribute except a safe href / list type
      const href = tag === "A" ? safeHref(child.getAttribute("href")) : null;
      const olType = tag === "OL"
        ? ((child.getAttribute("type") || "1").toUpperCase() === "I" ? "I" : "1")
        : null;
      Array.from(child.attributes).forEach((a) => child.removeAttribute(a.name));
      if (olType) child.setAttribute("type", olType);

      if (tag === "A") {
        if (!href) {                                     // unsafe link → keep the text only
          walk(child);
          while (child.firstChild) node.insertBefore(child.firstChild, child);
          child.remove();
          return;
        }
        child.setAttribute("href", href);
        child.setAttribute("target", "_blank");
        child.setAttribute("rel", "noopener noreferrer");
      }

      walk(child);
    });
  };

  walk(root);
  return root.innerHTML
    .replace(/(<br\s*\/?>){3,}/gi, "<br><br>")           // collapse runaway breaks
    .replace(/>\s*\n\s*</g, "><")                        // no stray newlines between list tags
    .replace(/<li\b[^>]*>(\s|&nbsp;|<br\s*\/?>)*<\/li>/gi, "")   // blank items left by exiting a list
    .replace(/<(ul|ol)([^>]*)>\s*<\/\1>/gi, "")          // drop empty lists
    .trim();
}

/** Legacy plain-text content → the HTML the editor expects. */
export function plainToHtml(text) {
  return escapeHtml(text).replace(/\r?\n/g, "<br>");
}

/** True if the stored content already uses inline markup. */
export function hasInlineMarkup(content) {
  return typeof content === "string" && /<(b|strong|i|em|u|s|a|br|ul|ol|li)\b/i.test(content);
}

/** True if the content contains a bullet/numbered/roman list. */
export function hasList(content) {
  return typeof content === "string" && /<(ul|ol)\b/i.test(content);
}

/** Normalise whatever is stored on the element into safe display HTML. */
export function contentToHtml(content) {
  if (!content) return "";
  return hasInlineMarkup(content)
    ? sanitizeInlineHtml(content)
    : plainToHtml(content);
}

/** HTML → plain text, for the text/plain MIME part and for alt copy. */
export function htmlToPlain(html) {
  return String(html || "")
    .replace(/<li\b[^>]*>/gi, "\n• ")
    .replace(/<\/(ul|ol)\s*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .trim();
}

/* ── Whole-element list helpers ────────────────────────────────────────────
   The inline toolbar formats the current selection. These operate on the
   element's entire stored content, which is what the Toolbox and the
   Properties panel need.                                                   */

/** Which list type the whole element is, or null if it isn't one. */
export function getContentListKind(content) {
  const m = /<(ul|ol)\b([^>]*)>/i.exec(String(content || ""));
  if (!m) return null;
  if (m[1].toLowerCase() === "ul") return "bullet";
  return /type\s*=\s*["']?i/i.test(m[2] || "") ? "roman" : "number";
}

/** Strip list markup, turning each item back into its own line. */
export function listToLines(content) {
  return String(content || "")
    .replace(/<\/li\s*>/gi, "<br>")
    .replace(/<li\b[^>]*>/gi, "")
    .replace(/<\/?(ul|ol)\b[^>]*>/gi, "")
    .replace(/(<br\s*\/?>\s*)+$/i, "");
}

/** Split plain-ish content into the lines that become <li> items. */
function contentToLines(content) {
  return String(content || "")
    .split(/<br\s*\/?>|\r?\n/i)
    .map((l) => l.trim())
    .filter((l) => l && l !== "&nbsp;");
}

/**
 * Convert an element's whole content to `kind` ("bullet" | "number" | "roman").
 * Passing the kind it already is toggles the list off.
 */
export function convertContentToList(content, kind) {
  const current = getContentListKind(content);

  if (current === kind) return sanitizeInlineHtml(listToLines(content));

  // Already a list — just retag, keeping every item intact
  if (current) {
    const items = String(content).match(/<li\b[^>]*>[\s\S]*?<\/li\s*>/gi) || [];
    return wrapList(items.join(""), kind);
  }

  const lines = contentToLines(hasInlineMarkup(content) ? content : plainToHtml(content));
  if (!lines.length) return wrapList("<li>List item</li>", kind);
  return wrapList(lines.map((l) => `<li>${l}</li>`).join(""), kind);
}

function wrapList(itemsHtml, kind) {
  if (kind === "bullet") return sanitizeInlineHtml(`<ul>${itemsHtml}</ul>`);
  const type = kind === "roman" ? "I" : "1";
  return sanitizeInlineHtml(`<ol type="${type}">${itemsHtml}</ol>`);
}

/** Starter content for a brand-new list element. */
export function newListContent(kind) {
  const items = ["list one", "list two", "list three"].map((t) => `<li>${t}</li>`).join("");
  return wrapList(items, kind);
}