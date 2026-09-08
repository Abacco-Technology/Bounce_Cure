// client/src/pages/Campaign/pages/TextTemplates.jsx
//
// Text-campaign counterpart to Templets.jsx.
// Templets.jsx builds canvas elements and navigates to /editor;
// this one carries markdown content and navigates to /texteditor.

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Pencil, Search, Trash2, FileText } from "lucide-react";
import {
  listSavedTemplates, deleteSavedTemplate, TEMPLATE_TYPES,
} from "./savedTemplateService";
import { renderMarkdown } from "./campaignMarkdown";
import {
  textTemplates, TEMPLATE_CATEGORIES, CATEGORY_ACCENT, TEXT_CATEGORY_COUNTS,
} from "./textTemplateData";

const CATEGORIES = ["All", ...TEMPLATE_CATEGORIES, "Saved"];

export default function TextTemplates() {
  const navigate = useNavigate();
  const [preview,  setPreview]  = useState(null);
  const [category, setCategory] = useState("All");
  const [search,   setSearch]   = useState("");
  const [saved,    setSaved]    = useState([]);
  const [loading,  setLoading]  = useState(true);

  /* Saved rows come from the shared saved_templates table, filtered to
     type="text" so canvas designs never appear in this gallery. */
  const loadSaved = useCallback(() => {
    setLoading(true);
    listSavedTemplates(TEMPLATE_TYPES.TEXT)
      .then((rows) => setSaved(rows.map((r) => ({
        id:          r.templateId,
        name:        r.name,
        category:    r.category,
        description: `Saved ${new Date(r.updatedAt).toLocaleDateString()}`,
        content:     typeof r.content === "string" ? r.content : "",
        format:      r.format || { fontFamily: "Arial", fontSize: "16px", align: "left" },
        subject:     r.subject || r.name,
        icon:        FileText,
        isSaved:     true,
      }))))
      .catch(() => setSaved([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadSaved(); }, [loadSaved]);

  const removeSaved = async (tpl, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${tpl.name}"? This can't be undone.`)) return;
    setSaved((rows) => rows.filter((r) => r.id !== tpl.id));   // optimistic
    try { await deleteSavedTemplate(tpl.id); } catch { loadSaved(); }
  };

  const allTemplates = [...saved, ...textTemplates];

  const visible = allTemplates.filter((t) => {
    const inCategory =
      category === "All" ||
      (category === "Saved" ? !!t.isSaved : t.category === category);
    const q = search.trim().toLowerCase();
    const matches = !q
      || t.name.toLowerCase().includes(q)
      || t.description.toLowerCase().includes(q)
      || t.category.toLowerCase().includes(q);
    return inCategory && matches;
  });

  /** Hand the template to the text editor via router state. */
  const useTemplate = (tpl) => {
    navigate("/texteditor", {
      state: {
        textTemplate: {
          id: tpl.id,
          name: tpl.name,
          content: tpl.content,
          format: tpl.format,
          subject: tpl.name,
        },
      },
    });
  };

  const startBlank = () => navigate("/texteditor", { state: { textTemplate: null } });

  return (
    <div className="text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Text Campaign Templates</h2>
          <p className="text-gray-400 text-sm mt-1">
            Plain-text campaigns that land in the inbox, not the promotions tab.
            Your saved text templates appear here alongside the built-in ones.
          </p>
        </div>
        <button
          onClick={startBlank}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#c2831f] hover:bg-[#d99c2b] text-black font-semibold rounded-lg transition-colors whitespace-nowrap"
        >
          <Plus size={18} />
          Start from Blank
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search text templates..."
          className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#c2831f]"
        />
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map((c) => {
          const active = category === c;
          const count =
            c === "All"     ? allTemplates.length :
            c === "Saved"   ? saved.length :
            (TEXT_CATEGORY_COUNTS[c] || 0) + saved.filter((s) => s.category === c).length;
          return (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                active
                  ? "text-white border-transparent"
                  : "bg-gray-900 text-gray-300 border-gray-800 hover:bg-gray-800 hover:text-white"
              }`}
              style={active ? { backgroundColor: CATEGORY_ACCENT[c] || "#c2831f" } : undefined}
            >
              {c}
              <span className={`ml-2 text-xs ${active ? "opacity-80" : "text-gray-500"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visible.map((tpl) => {
          const Icon = tpl.icon;
          return (
            <div
              key={tpl.id}
              className="group bg-[#0a0a0a] border border-gray-800 rounded-2xl overflow-hidden hover:border-[#c2831f] transition-colors flex flex-col"
            >
              {/* Live text preview instead of a stock photo — this is a text
                  campaign, so the type itself is the thumbnail. */}
              <div className="relative h-44 bg-white overflow-hidden">
                <div
                  className="p-5 text-gray-800 pointer-events-none"
                  style={{
                    fontFamily: tpl.format.fontFamily,
                    fontSize: 11,
                    textAlign: tpl.format.align,
                    lineHeight: 1.5,
                  }}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(tpl.content) }}
                />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
                <span
                  className="absolute top-3 left-3 px-3 py-1 text-xs font-medium rounded-full text-white"
                  style={{ backgroundColor: CATEGORY_ACCENT[tpl.category] || "#c2831f" }}
                >
                  {tpl.category}
                </span>
                {tpl.isSaved && (
                  <>
                    <span className="absolute top-3 right-11 px-2 py-1 text-xs font-medium rounded-full bg-gray-900/80 text-gray-200">
                      Saved
                    </span>
                    <button
                      onClick={(e) => removeSaved(tpl, e)}
                      title="Delete this saved template"
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-900/80 text-gray-300 hover:text-red-400 hover:bg-gray-900 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>

              {/* Meta */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start gap-3 mb-2">
                  <Icon size={18} style={{ color: CATEGORY_ACCENT[tpl.category] || "#c2831f" }} className="mt-0.5 shrink-0" />
                  <h3 className="text-lg font-semibold text-white">{tpl.name}</h3>
                </div>
                <p className="text-sm text-gray-400 flex-1">{tpl.description}</p>

                <div className="flex gap-2 mt-5">
                  <button
                    onClick={() => setPreview(tpl)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Eye size={16} /> View
                  </button>
                  <button
                    onClick={() => useTemplate(tpl)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#c2831f] hover:bg-[#d99c2b] text-black rounded-lg text-sm font-semibold transition-colors"
                  >
                    <Pencil size={16} /> Edit
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {loading && visible.length === 0 && (
        <div className="text-center py-16 text-gray-500 text-sm">Loading your saved templates…</div>
      )}

      {!loading && visible.length === 0 && (
        <div className="text-center py-16 border border-gray-800 rounded-2xl bg-[#0a0a0a]">
          <p className="text-gray-400 font-medium mb-1">No templates match that</p>
          <p className="text-gray-600 text-sm mb-5">Try a different category, or start with a blank page.</p>
          <button
            onClick={startBlank}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#c2831f] hover:bg-[#d99c2b] text-black font-semibold rounded-lg transition-colors"
          >
            <Plus size={16} /> Start from Blank
          </button>
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setPreview(null)}
          />
          <div className="relative bg-[#111] border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <div>
                <h3 className="text-lg font-semibold text-white">{preview.name}</h3>
                <p className="text-xs text-gray-500">{preview.description}</p>
              </div>
              <button
                onClick={() => setPreview(null)}
                className="text-gray-400 hover:text-white text-xl leading-none px-2"
                aria-label="Close preview"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="bg-white rounded-lg shadow-xl">
                <div className="bg-gray-100 px-6 py-3 border-b border-gray-200 text-sm text-gray-600 rounded-t-lg">
                  Subject: {preview.name}
                </div>
                <div
                  className="px-8 py-6 text-gray-800"
                  style={{
                    fontFamily: preview.format.fontFamily,
                    fontSize: preview.format.fontSize,
                    textAlign: preview.format.align,
                    lineHeight: 1.6,
                  }}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(preview.content) }}
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-800 flex gap-3">
              <button
                onClick={() => setPreview(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => useTemplate(preview)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#c2831f] hover:bg-[#d99c2b] text-black font-semibold transition-colors"
              >
                <Pencil size={16} /> Edit this template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}