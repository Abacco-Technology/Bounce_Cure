// PhotosTab.jsx — FINAL FIXED VERSION
import { useEffect, useState, useRef } from "react";
import { T, SLabel } from "../../pages/EditorPage";

const API_URL = import.meta.env.VITE_API_URL;

export default function PhotosTab({ addElement }) {
  const [urlInput, setUrlInput] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  const token = localStorage.getItem("token");

  // ---------------- FETCH IMAGES ----------------
  const fetchImages = async () => {
    try {
      const res = await fetch(`${API_URL}/files/images`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch images");

      const data = await res.json();

      console.log("Fetched images:", data);

      // backend returns array directly
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

      const res = await fetch(`${API_URL}/files/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();

      console.log("Upload response:", data);

      if (data.success) {
        setImages(data.images); // backend returns updated list
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

      {/* Uploaded Images */}
      <SLabel>Your Uploaded Photos</SLabel>

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

        {images.map((img) => (
          <img
            key={img.id}
            src={img.url}
            alt=""
            onClick={() => addElement("image", { src: img.url })}
            style={{
              width: "100%",
              height: 72,
              objectFit: "cover",
              borderRadius: 7,
              cursor: "pointer",
              border: "1.5px solid transparent",
              transition: "all .14s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = `1.5px solid ${T.gold}`;
              e.currentTarget.style.opacity = ".85";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = "1.5px solid transparent";
              e.currentTarget.style.opacity = "1";
            }}
          />
        ))}
      </div>
    </div>
  );
}