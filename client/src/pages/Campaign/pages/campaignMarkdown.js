// client/src/pages/Campaign/pages/campaignMarkdown.js
//
// Markdown used by the Campaign Text Editor and its template gallery.
// Block level : # ## ###, > quote, --- rule, and three list styles
// Inline      : **bold**  *italic*  __underline__  ~~strike~~  `code`  [text](url)
//
// Content is escaped before any markup runs, so a user typing raw HTML into
// the textarea can never inject it into the preview or the sent email.

export const LIST_MARKERS = {
  bullet: { test: /^(\s*)[-*]\s+(.*)$/,               marker: () => "- ",                       tag: "ul", attrs: "" },
  number: { test: /^(\s*)(\d+)[.)]\s+(.*)$/,          marker: (i) => `${i + 1}. `,              tag: "ol", attrs: "" },
  roman:  { test: /^(\s*)([IVXLCDM]+)[.)]\s+(.*)$/,   marker: (i) => `${toRoman(i + 1)}. `,     tag: "ol", attrs: ' type="I"' },
};

export function toRoman(n) {
  const map = [[1000,"M"],[900,"CM"],[500,"D"],[400,"CD"],[100,"C"],[90,"XC"],
               [50,"L"],[40,"XL"],[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]];
  let out = "", num = Math.max(1, n);
  for (const [v, s] of map) while (num >= v) { out += s; num -= v; }
  return out;
}

/** Which list style a single line uses, or null. */
export function lineListKind(line) {
  // roman before number: "I." and "1." can't collide, but check the stricter one first
  if (LIST_MARKERS.roman.test.test(line))  return "roman";
  if (LIST_MARKERS.number.test.test(line)) return "number";
  if (LIST_MARKERS.bullet.test.test(line)) return "bullet";
  return null;
}

/** Remove any list marker from a line, returning the bare text. */
export function stripMarker(line) {
  const kind = lineListKind(line);
  if (!kind) return line;
  const m = LIST_MARKERS[kind].test.exec(line);
  return kind === "bullet" ? m[2] : m[3];
}

const escapeHtml = (s) => String(s ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Inline markup for one line of already-escaped text. */
function inline(text) {
  return text
    .replace(/`([^`]+)`/g, '<code style="background:#f1f1f1;padding:1px 5px;border-radius:3px;font-family:monospace;font-size:.9em;">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<u>$1</u>")
    .replace(/~~(.+?)~~/g, "<s>$1</s>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
      const safe = /^(https?:|mailto:|tel:)/i.test(href) ? href : `https://${href}`;
      return `<a href="${safe}" target="_blank" rel="noopener noreferrer" style="color:#1155cc;text-decoration:underline;">${label}</a>`;
    });
}

/**
 * Markdown → HTML. Consecutive list lines are grouped into a single
 * <ul>/<ol>, which is what makes markers render correctly in email.
 */
export function renderMarkdown(md) {
  const lines = String(md || "").split(/\r?\n/);
  let html = "";
  let openList = null;   // "bullet" | "number" | "roman"

  const closeList = () => {
    if (!openList) return;
    html += LIST_MARKERS[openList].tag === "ul" ? "</ul>" : "</ol>";
    openList = null;
  };

  for (const raw of lines) {
    const line = escapeHtml(raw);
    const kind = lineListKind(raw);

    if (kind) {
      if (openList !== kind) {
        closeList();
        const { tag, attrs } = LIST_MARKERS[kind];
        const style = tag === "ul"
          ? "margin:8px 0;padding-left:26px;list-style-type:disc;"
          : `margin:8px 0;padding-left:26px;list-style-type:${kind === "roman" ? "upper-roman" : "decimal"};`;
        html += `<${tag}${attrs} style="${style}">`;
        openList = kind;
      }
      html += `<li style="margin:3px 0;">${inline(escapeHtml(stripMarker(raw)))}</li>`;
      continue;
    }

    closeList();

    let m;
    if ((m = /^###\s+(.*)$/.exec(line)))      { html += `<h3 style="margin:14px 0 6px;">${inline(m[1])}</h3>`; continue; }
    if ((m = /^##\s+(.*)$/.exec(line)))       { html += `<h2 style="margin:16px 0 8px;">${inline(m[1])}</h2>`; continue; }
    if ((m = /^#\s+(.*)$/.exec(line)))        { html += `<h1 style="margin:18px 0 10px;">${inline(m[1])}</h1>`; continue; }
    if (/^(-{3,}|\*{3,})\s*$/.test(line))     { html += `<hr style="border:none;border-top:1px solid #ddd;margin:18px 0;"/>`; continue; }
    if ((m = /^&gt;\s?(.*)$/.exec(line)))     { html += `<blockquote style="margin:10px 0;padding:6px 0 6px 14px;border-left:3px solid #ccc;color:#555;font-style:italic;">${inline(m[1])}</blockquote>`; continue; }
    if (!line.trim())                          { html += "<br/>"; continue; }

    html += `${inline(line)}<br/>`;
  }

  closeList();
  return html;
}

/** Inline CSS built from the editor's paragraph-level style state. */
export function formatToStyle(f) {
  return {
    fontFamily:    f.fontFamily,
    fontSize:      f.fontSize,
    textAlign:     f.align,
    lineHeight:    f.lineHeight,
    letterSpacing: f.letterSpacing,
    fontWeight:    f.fontWeight,
    color:         f.color,
    backgroundColor: f.backgroundColor === "transparent" ? undefined : f.backgroundColor,
    textTransform: f.textTransform,
  };
}