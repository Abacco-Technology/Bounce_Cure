// PhotosTab.jsx — with single + bulk delete
import { useEffect, useState, useRef } from "react";
import { T, SLabel } from "../../pages/EditorPage";

const API_URL = import.meta.env.VITE_VRI_URL;

export default function PhotosTab({ addElement }) {
  const [urlInput, setUrlInput] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(new Set()); // selected image ids
  const [deleting, setDeleting] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const fileRef = useRef(null);

  const token = localStorage.getItem("token");

  // ---------------- FETCH IMAGES ----------------
  const fetchImages = async () => {
    try {
      const res = await fetch(`${API_URL}/api/files/images`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch images");
      const data = await res.json();
      setImages(Array.isArray(data) ? data : data.images || []);
    } catch (err) {
      console.error("Fetch images error:", err);
      setImages([]);
    }
  };

  useEffect(() => {
    if (token) fetchImages();
  }, [token]);

  // ---------------- UPLOAD IMAGE ----------------
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/files/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      if (data.success) {
        setImages(data.images);
      } else {
        fetchImages();
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // ---------------- ADD URL IMAGE ----------------
  const handleUrlAdd = () => {
    if (!urlInput.trim()) return;
    addElement("image", { src: urlInput });
    setUrlInput("");
  };

  // ---------------- SELECTION HELPERS ----------------
  const toggleSelect = (id, e) => {
    e.stopPropagation(); // don't addElement when clicking checkbox
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const isAllSelected = images.length > 0 && selected.size === images.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(images.map((img) => img.id)));
    }
  };

  // ---------------- DELETE SINGLE ----------------
  const handleDeleteSingle = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this image?")) return;
    try {
      const res = await fetch(`${API_URL}/api/files/images/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      setImages((prev) => prev.filter((img) => img.id !== id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // ---------------- DELETE SELECTED (BULK) ----------------
  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} selected image(s)?`)) return;
    try {
      setDeleting(true);
      const res = await fetch(`${API_URL}/api/files/images`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      if (!res.ok) throw new Error("Bulk delete failed");
      setImages((prev) => prev.filter((img) => !selected.has(img.id)));
      setSelected(new Set());
    } catch (err) {
      console.error("Bulk delete error:", err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* Upload Section */}
      <div style={{ marginBottom: 16 }}>
        <SLabel>Upload Image</SLabel>

        <button
          onClick={() => fileRef.current?.click()}
          style={{
            width: "100%",
            padding: "12px 0",
            borderRadius: 8,
            border: `1.5px dashed ${T.gold}`,
            background: `${T.gold}0A`,
            color: T.gold,
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 13,
            marginBottom: 8,
          }}
        >
          {loading ? "Uploading..." : "↑ Choose File"}
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileUpload}
        />

        <div style={{ fontSize: 11, color: T.muted, marginBottom: 5 }}>
          Or paste image URL:
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://..."
            style={{
              fontSize: 11,
              padding: "6px 8px",
              flex: 1,
              borderRadius: 7,
              border: `1px solid ${T.border}`,
            }}
            onKeyDown={(e) => e.key === "Enter" && handleUrlAdd()}
          />
          <button
            onClick={handleUrlAdd}
            style={{
              padding: "6px 10px",
              borderRadius: 7,
              border: `1px solid ${T.gold}`,
              background: `${T.gold}22`,
              color: T.gold,
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            Add
          </button>
        </div>
      </div>

      {/* Header row: label + select-all + bulk delete */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <SLabel style={{ margin: 0 }}>Your Uploaded Photos</SLabel>

        {images.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Select All toggle */}
            <button
              onClick={toggleSelectAll}
              style={{
                fontSize: 11,
                padding: "3px 8px",
                borderRadius: 5,
                border: `1px solid ${T.border}`,
                background: isAllSelected ? `${T.gold}22` : "transparent",
                color: isAllSelected ? T.gold : T.muted,
                cursor: "pointer",
              }}
            >
              {isAllSelected ? "Deselect All" : "Select All"}
            </button>

            {/* Bulk delete — visible only when something selected */}
            {selected.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={deleting}
                style={{
                  fontSize: 11,
                  padding: "3px 8px",
                  borderRadius: 5,
                  border: "1px solid #e05555",
                  background: "#e0555522",
                  color: "#e05555",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {deleting ? "Deleting..." : `Delete (${selected.size})`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Image Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 7,
        }}
      >
        {images.length === 0 && (
          <div style={{ fontSize: 12, color: T.muted }}>
            No images uploaded yet
          </div>
        )}

        {images.map((img) => {
          const isChecked = selected.has(img.id);
          const isHovered = hoveredId === img.id;
          // Show overlays when: hovered OR already selected
          const showOverlay = isHovered || isChecked;

          return (
            <div
              key={img.id}
              style={{ position: "relative" }}
              onMouseEnter={() => setHoveredId(img.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => addElement("image", { src: img.url })}
            >
              <img
                src={img.url}
                alt=""
                style={{
                  width: "100%",
                  height: 72,
                  objectFit: "cover",
                  borderRadius: 7,
                  cursor: "pointer",
                  border: isChecked
                    ? `1.5px solid ${T.gold}`
                    : isHovered
                    ? `1.5px solid ${T.gold}`
                    : "1.5px solid transparent",
                  opacity: isHovered && !isChecked ? 0.85 : 1,
                  transition: "all .14s",
                  display: "block",
                }}
              />

              {/* Checkbox (top-left) — only visible on hover or when selected */}
              {showOverlay && (
                <div
                  onClick={(e) => toggleSelect(img.id, e)}
                  style={{
                    position: "absolute",
                    top: 4,
                    left: 4,
                    width: 15,
                    height: 15,
                    borderRadius: 3,
                    border: `1.5px solid ${isChecked ? T.gold : "#ffffffbb"}`,
                    background: isChecked ? T.gold : "#00000066",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all .12s",
                  }}
                >
                  {isChecked && (
                    <span style={{ color: "#000", fontSize: 9, fontWeight: 900, lineHeight: 1 }}>
                      ✓
                    </span>
                  )}
                </div>
              )}

              {/* Single delete (top-right) — only visible on hover or when selected */}
              {showOverlay && (
                <div
                  onClick={(e) => handleDeleteSingle(img.id, e)}
                  title="Delete image"
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 17,
                    height: 17,
                    borderRadius: 3,
                    background: "#00000077",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: 10,
                    color: "#ffaaaa",
                    fontWeight: 700,
                    transition: "background .12s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#e05555cc")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#00000077")
                  }
                >
                  ✕
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}