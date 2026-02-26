import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

const API_URL = import.meta.env.VITE_VRI_URL;

export default function SaveTemplateModal({ userId, canvasData, canvasBackground, onClose }) {
  const [mode, setMode] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [newName, setNewName] = useState("");

useEffect(() => {
  fetchTemplates();
}, [userId]);

const fetchTemplates = async () => {
  if (!userId) {
    console.error("❌ No userId — cannot fetch templates");
    return;
  }
  try {
    const res = await fetch(`${API_URL}/api/saved-templates/${userId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    console.log("✅ Fetched templates in modal:", data); // add this to see what comes back
    setTemplates(data);
  } catch (err) {
    console.error("Failed to fetch templates:", err);
  }
};

  // SAVE EXISTING
  const handleSave = async () => {
    if (!selectedTemplateId) return alert("Select template");

    const selected = templates.find(t => t.templateId === selectedTemplateId);

    await fetch(`${API_URL}/api/saved-templates/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        templateId: selected.templateId,
        name: selected.name,
        category: selected.category,
        preview: "",
        content: canvasData
      }),
    });

    alert("Template Updated");
    onClose();
  };

  // SAVE AS NEW
  const handleSaveAs = async () => {
    if (!newName) return alert("Enter template name");

    // ✅ Bug 1 fix: was "/api/savedTemplates/save" — wrong URL, missing API_URL
    await fetch(`${API_URL}/api/saved-templates/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        templateId: uuidv4(),
        name: newName,
        category: "Saved",
        preview: "",
        content: canvasData,
        canvasBackgroundColor: canvasBackground  // ✅ add this
      }),
    });

    alert("Template Saved Successfully");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
      <div className="bg-white w-[500px] p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-4 text-blue-900">Save Template</h2>

        {!mode && (
          <div className="flex gap-4">
            <button onClick={() => setMode("save")} className="flex-1 bg-blue-600 text-white py-2 rounded">
              Save
            </button>
            <button onClick={() => setMode("saveAs")} className="flex-1 bg-green-600 text-white py-2 rounded">
              Save As Template
            </button>
          </div>
        )}

        {mode === "save" && (
          <>
            <select
              className="w-full border text-blue-900 p-2 mt-4 rounded"
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
            >
              <option value="">Select Template</option>
              {templates.map((tpl) => (
                <option key={tpl.templateId} value={tpl.templateId}>
                  {tpl.name}
                </option>
              ))}
            </select>
            <button onClick={handleSave} className="w-full bg-blue-600 text-white py-2 mt-4 rounded">
              Update Template
            </button>
          </>
        )}

        {mode === "saveAs" && (
          <>
            <input
              type="text"
              placeholder="Template Name"
              className="w-full border p-2 mt-4 rounded text-blue-900"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button onClick={handleSaveAs} className="w-full bg-green-600 text-white py-2 mt-4 rounded">
              Save New Template
            </button>
          </>
        )}

        <button onClick={onClose} className="text-gray-500 mt-6 text-sm">
          Cancel
        </button>
      </div>
    </div>
  );
}