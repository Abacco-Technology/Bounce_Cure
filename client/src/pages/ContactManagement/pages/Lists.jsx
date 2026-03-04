import React, { useState, useEffect } from "react";
import {
  Plus, Search, Edit, Trash2, Eye, X, Database,
  Upload, FileText, Image, File
} from "lucide-react";
import Papa from "papaparse";

const API_URL = import.meta.env.VITE_VRI_URL;

// --- Create Modal ---
const CreateListModal = ({ onClose, onListCreated }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Create FormData from the form element:
    const formData = new FormData(e.target);

    try {
      const response = await fetch(`${API_URL}/api/lists`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to create list");

      const data = await response.json();
      onListCreated(); // re-fetch parent
      onClose();
    } catch (error) {
      console.error("❌ Error creating list:", error);
      alert(`Error creating list: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 text-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Create New List</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSave} className="space-y-4" encType="multipart/form-data">
          {/* inputs */}
          <input type="text" name="name" placeholder="List Name" required className="w-full px-3 py-2 border rounded-lg" />
          <input type="number" name="count" placeholder="Contacts Count" required className="w-full px-3 py-2 border rounded-lg" />
          <input type="email" name="email" placeholder="Email" required className="w-full px-3 py-2 border rounded-lg" />
          <input type="tel" name="phone" placeholder="Phone" required className="w-full px-3 py-2 border rounded-lg" />
          <input
            type="file"
            name="file"
            accept=".json,.csv,.txt,image/*"
            className="w-full px-3 py-2 border rounded-lg bg-white text-black"
          />
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-[#154c7c] text-white rounded-lg">
              {isSubmitting ? "Saving..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Lists = () => {
  const [lists, setLists] = useState([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Fetch from DB ---
  const fetchLists = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }
      
      const res = await fetch(`${API_URL}/api/lists`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Unauthorized. Please log in again.");
        }
        throw new Error(`Failed to fetch lists: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        console.error("API response is not an array:", data);
        setLists([]);
      } else {
        setLists(data);
      }
    } catch (err) {
      setError(err.message);
      console.error("❌ Error fetching lists:", err);
      setLists([]); // Set to empty array to prevent filter errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  // --- Delete ---
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this list?")) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }
      
      const res = await fetch(`${API_URL}/api/lists/${id}`, { 
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Unauthorized. Please log in again.");
        }
        throw new Error(`Failed to delete list: ${res.status}`);
      }
      
      fetchLists(); // ✅ refresh
    } catch (err) {
      setError(err.message);
      console.error("❌ Error deleting:", err);
    }
  };

  // --- View file ---
  const handleViewList = async (list) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }
      
      const res = await fetch(`${API_URL}/api/lists/files/${list.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Unauthorized. Please log in again.");
        }
        throw new Error(`Failed to fetch file: ${res.status}`);
      }

      const blob = await res.blob();
      const text = await blob.text();

      let fileData;

      try {
        // Try parsing as JSON
        const json = JSON.parse(text);
        fileData = { type: "json", data: json };
      } catch {
        // If not JSON, try parsing as CSV
        const csv = Papa.parse(text, { header: true });
        if (csv.data && csv.data.length > 0) {
          fileData = { type: "contacts", contacts: csv.data };
        } else {
          // Fallback: raw text
          fileData = { type: "text", raw: text };
        }
      }

      setViewData({ ...list, uploadedFile: fileData });
    } catch (err) {
      setError(err.message);
      console.error("❌ Error fetching file:", err);
      setViewData({ ...list, uploadedFile: { type: "error" } });
    }
  };

  // --- Filter ---
  const filtered = Array.isArray(lists) 
    ? lists.filter((l) =>
        [l.name, l.id, l.email, l.phone].some((f) =>
          f?.toLowerCase().includes(search.toLowerCase())
        )
      )
    : [];

  // --- Format date ---
  const formatDate = (date) => {
    const parsed = new Date(date);
    return isNaN(parsed) ? "-" : parsed.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  return (
    <div className="flex min-h-screen bg-black text-white">
      <div className="flex-1 flex flex-col p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center">
            <Database className="mr-2 text-[#EAA64D]" /> Your Lists
          </h2>
          <button onClick={() => setModalOpen(true)}
            className="flex items-center px-4 py-2 bg-[#154c7c] text-white rounded-lg">
            <Plus className="mr-2" size={18} /> New List
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-6">
            Error: {error}
          </div>
        )}

        {/* Search */}
        <input
          type="text"
          placeholder="Search lists..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 px-4 py-2 rounded-lg border bg-gray-900 text-white"
        />

        {/* Table */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mx-auto"></div>
              <p className="mt-4 text-zinc-400">Loading lists...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center py-8 text-zinc-400">No lists found</p>
        ) : (
          <table className="w-full bg-gray-900 rounded-lg">
            <thead>
              <tr className="bg-white text-black">
                <th className="px-3 py-2">ID</th>
                <th>Name</th>
                <th>Contacts</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((list) => (
                <tr key={list.id} className="border-t border-gray-700 hover:bg-gray-700">
                  <td className="px-3 py-2">{list.id}</td>
                  <td>{list.name}</td>
                  <td>{list.count}</td>
                  <td>{list.email}</td>
                  <td>{list.phone}</td>
                  <td>{formatDate(list.createdAt)}</td>
                  <td>
                    <button onClick={() => handleViewList(list)} className="mr-2 text-blue-400">View</button>
                    <button onClick={() => handleDelete(list.id)} className="text-red-400">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Create Modal */}
        {modalOpen && (
          <CreateListModal onClose={() => setModalOpen(false)} onListCreated={fetchLists} />
        )}

        {/* View Modal */}
        {viewData && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 overflow-auto"
            onClick={(e) => e.target === e.currentTarget && setViewData(null)}>

            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl text-black">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-[#154c7c]">📋 List Details</h3>
                <button onClick={() => setViewData(null)} className="text-gray-500 hover:text-red-500">
                  <X size={24} />
                </button>
              </div>

              {/* List Meta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
                <p><strong>ID:</strong> {viewData.id}</p>
                <p><strong>Name:</strong> {viewData.name}</p>
                <p><strong>Contacts:</strong> {viewData.count}</p>
                <p><strong>Email:</strong> {viewData.email}</p>
                <p><strong>Phone:</strong> {viewData.phone}</p>
                <p><strong>Created:</strong> {isNaN(Date.parse(viewData.createdAt)) ? "-" : formatDate(viewData.createdAt)}</p>
              </div>

              {/* Uploaded File Preview */}
              <div className="mt-6">
                <h4 className="text-md font-semibold text-[#154c7c] mb-2">📁 Uploaded File Preview</h4>

                {viewData.uploadedFile?.type === "json" && (
                  <pre className="bg-gray-100 text-sm p-3 rounded overflow-x-auto text-black">
                    {JSON.stringify(viewData.uploadedFile.data, null, 2)}
                  </pre>
                )}

                {viewData.uploadedFile?.type === "contacts" && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border border-gray-300">
                      <thead className="bg-[#154c7c] text-white">
                        <tr>
                          <th className="px-4 py-2">Name</th>
                          <th className="px-4 py-2">Email</th>
                          <th className="px-4 py-2">Phone</th>
                        </tr>
                      </thead>
                      <tbody className="text-black">
                        {viewData.uploadedFile.contacts.map((c, i) => (
                          <tr key={i} className={i % 2 === 0 ? "bg-gray-100" : "bg-white"}>
                            <td className="px-4 py-2">{c.name || "-"}</td>
                            <td className="px-4 py-2">{c.email || "-"}</td>
                            <td className="px-4 py-2">{c.phone || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {viewData.uploadedFile?.type === "text" && (
                  <pre className="bg-gray-100 text-sm p-3 rounded overflow-x-auto text-black">
                    {viewData.uploadedFile.raw}
                  </pre>
                )}

                {viewData.uploadedFile?.type === "error" && (
                  <p className="text-red-600 mt-2">❌ Failed to fetch or parse the file.</p>
                )}
              </div>

              {/* Close Button */}
              <div className="mt-6 text-right">
                <button onClick={() => setViewData(null)} className="px-4 py-2 bg-[#154c7c] text-white rounded-lg">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lists;