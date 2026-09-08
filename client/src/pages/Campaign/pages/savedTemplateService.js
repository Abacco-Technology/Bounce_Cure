// client/src/pages/Campaign/pages/savedTemplateService.js
//
// One client for the shared saved_templates table.
// `type` decides which gallery a row belongs to:
//   "canvas" → Template Studio  (content = array of canvas elements)
//   "text"   → Text Editor      (content = markdown string)

const API_URL = import.meta.env.VITE_VRI_URL;

export const TEMPLATE_TYPES = { CANVAS: "canvas", TEXT: "text" };

export function currentUserId() {
  const id = localStorage.getItem("userId");
  return id ? Number(id) : null;
}

async function asJson(res) {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { msg = (await res.json()).error || msg; } catch { /* non-JSON body */ }
    throw new Error(msg);
  }
  return res.json();
}

/** List a user's saved templates. type: "canvas" | "text" | "all". */
export async function listSavedTemplates(type = TEMPLATE_TYPES.CANVAS) {
  const userId = currentUserId();
  if (!userId) return [];
  return asJson(await fetch(`${API_URL}/api/saved-templates/${userId}?type=${type}`));
}

/**
 * Create or overwrite a saved template.
 * Canvas: { content: [...elements], canvasBackgroundColor }
 * Text:   { content: "markdown", format, subject }
 */
export async function saveTemplate({
  templateId, name, type, category = "Saved", preview = "",
  content, format, subject, canvasBackgroundColor,
}) {
  const userId = currentUserId();
  if (!userId) throw new Error("You need to be signed in to save templates");

  return asJson(await fetch(`${API_URL}/api/saved-templates/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId, templateId, name, type, category, preview,
      content, format, subject, canvasBackgroundColor,
    }),
  }));
}

export async function deleteSavedTemplate(templateId) {
  const userId = currentUserId();
  if (!userId) throw new Error("Not signed in");
  return asJson(await fetch(`${API_URL}/api/saved-templates/${userId}/${templateId}`, {
    method: "DELETE",
  }));
}

export async function renameSavedTemplate(templateId, name) {
  const userId = currentUserId();
  if (!userId) throw new Error("Not signed in");
  return asJson(await fetch(`${API_URL}/api/saved-templates/update`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, templateId, name }),
  }));
}

/** Browser-native UUID with a fallback for non-secure origins. */
export function newTemplateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}