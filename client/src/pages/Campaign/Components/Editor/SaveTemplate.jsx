// client/src/pages/Campaign/Components/Editor/SaveTemplateModal.jsx
//
// One modal, both template types. Template Studio passes type="canvas" with an
// element array; the Campaign Text Editor passes type="text" with markdown.
// The category picker is what lets saved templates sit alongside the built-in
// library instead of all landing in a single "Saved" bucket.

import { useEffect, useState } from "react";
import { X, Save, FilePlus2, Loader2 } from "lucide-react";
import {
  listSavedTemplates, saveTemplate, newTemplateId, TEMPLATE_TYPES,
} from "../../pages/savedTemplateService";
import { TEMPLATE_CATEGORIES } from "../../pages/campaignTemplateData";

const CATEGORY_OPTIONS = ["Saved", ...TEMPLATE_CATEGORIES];

export default function SaveTemplateModal({
  type = TEMPLATE_TYPES.CANVAS,
  content,                 // array (canvas) | markdown string (text)
  canvasBackground,        // canvas only
  format,                  // text only
  subject,                 // text only
  defaultName = "",
  onClose,
  onSaved,                 // optional: (savedRow) => void
}) {
  const isText = type === TEMPLATE_TYPES.TEXT;
  const label  = isText ? "Text Template" : "Canvas Template";

  const [mode, setMode]           = useState(null);   // null | "overwrite" | "new"
  const [existing, setExisting]   = useState([]);
  const [selectedId, setSelected] = useState("");
  const [name, setName]           = useState(defaultName);
  const [category, setCategory]   = useState("Saved");
  const [busy, setBusy]           = useState(false);
  const [error, setError]         = useState("");

  // Only ever list templates of the same type — you can't overwrite a
  // canvas design with markdown, or the gallery renderer breaks.
  useEffect(() => {
    let cancelled = false;
    listSavedTemplates(type)
      .then((rows) => { if (!cancelled) setExisting(rows); })
      .catch((e)  => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [type]);

  const hasContent = isText
    ? typeof content === "string" && content.trim().length > 0
    : Array.isArray(content) && content.length > 0;

  const commit = async (payload) => {
    setBusy(true);
    setError("");
    try {
      const row = await saveTemplate({
        type,
        content,
        format:  isText ? format  : undefined,
        subject: isText ? subject : undefined,
        canvasBackgroundColor: isText ? undefined : canvasBackground,
        ...payload,
      });
      onSaved?.(row);
      onClose();
    } catch (e) {
      setError(e.message || "Save failed");
      setBusy(false);
    }
  };

  const handleOverwrite = () => {
    const target = existing.find((t) => t.templateId === selectedId);
    if (!target) return setError("Pick a template to overwrite");
    commit({ templateId: target.templateId, name: target.name, category: target.category });
  };

  const handleNew = () => {
    if (!name.trim()) return setError("Give the template a name");
    commit({ templateId: newTemplateId(), name: name.trim(), category });
  };

  const field = "w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#c2831f]";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={busy ? undefined : onClose} />

      <div className="relative w-full max-w-md bg-[#111] border border-gray-800 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-white">Save {label}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isText ? "Stored under Text Campaigns" : "Stored under Canvas Templates"}
            </p>
          </div>
          <button onClick={onClose} disabled={busy}
                  className="text-gray-400 hover:text-white disabled:opacity-40" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {!hasContent && (
            <p className="text-sm text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded-lg px-3 py-2">
              There's nothing to save yet — add some content first.
            </p>
          )}

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {!mode && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setMode("new"); setError(""); }}
                disabled={!hasContent}
                className="flex flex-col items-center gap-2 px-4 py-5 rounded-xl bg-[#c2831f] hover:bg-[#d99c2b] text-black font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <FilePlus2 size={20} /> Save as New
              </button>
              <button
                onClick={() => { setMode("overwrite"); setError(""); }}
                disabled={!hasContent || existing.length === 0}
                className="flex flex-col items-center gap-2 px-4 py-5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Save size={20} /> Overwrite
              </button>
              {existing.length === 0 && hasContent && (
                <p className="col-span-2 text-xs text-gray-600 text-center">
                  No saved {isText ? "text" : "canvas"} templates yet — start with "Save as New".
                </p>
              )}
            </div>
          )}

          {mode === "new" && (
            <>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Template name</label>
                <input autoFocus value={name} onChange={(e) => setName(e.target.value)}
                       onKeyDown={(e) => e.key === "Enter" && handleNew()}
                       placeholder="e.g. Spring Show Announcement" className={field} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={field}>
                  {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <p className="text-xs text-gray-600 mt-1.5">
                  Picking a category files it with the built-in templates for that group.
                </p>
              </div>
            </>
          )}

          {mode === "overwrite" && (
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Replace which template?</label>
              <select autoFocus value={selectedId} onChange={(e) => setSelected(e.target.value)} className={field}>
                <option value="">Select a template…</option>
                {existing.map((t) => (
                  <option key={t.templateId} value={t.templateId}>
                    {t.name} — {t.category}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-600 mt-1.5">This replaces its content. The name and category stay.</p>
            </div>
          )}
        </div>

        {mode && (
          <div className="px-6 py-4 border-t border-gray-800 flex gap-3">
            <button onClick={() => { setMode(null); setError(""); }} disabled={busy}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-40 transition-colors">
              Back
            </button>
            <button
              onClick={mode === "new" ? handleNew : handleOverwrite}
              disabled={busy}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#c2831f] hover:bg-[#d99c2b] text-black font-semibold disabled:opacity-60 transition-colors"
            >
              {busy && <Loader2 size={16} className="animate-spin" />}
              {busy ? "Saving…" : mode === "new" ? "Save Template" : "Overwrite"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}