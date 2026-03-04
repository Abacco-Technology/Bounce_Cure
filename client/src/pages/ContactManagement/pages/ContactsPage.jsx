import React, { useState, useEffect, useMemo } from "react";
import {
  User,
  Search,
  Filter,
  Phone,
  Mail,
  Building2,
  BarChart3,
  Plus,
} from "lucide-react";
import { CSVLink } from "react-csv";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  Tooltip,
  Legend,
} from "recharts";

const API_URL = import.meta.env.VITE_VRI_URL;

const statusColors = {
  Active: "#22c55e",
  Inactive: "#ef4444",
  Prospect: "#3b82f6",
  Customer: "#eab308",
};

function ContactsPage() {
  // Auth helper function
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const badgeStyle = {
    Active: "bg-green-900/40 text-green-400 border border-green-700",
    Inactive: "bg-red-900/40 text-red-400 border border-red-700",
    Prospect: "bg-blue-900/40 text-blue-400 border border-blue-700",
    Customer: "bg-yellow-900/40 text-yellow-400 border border-yellow-700",
  };
  
  const [modalOpen, setModalOpen] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    status: "Prospect",
    priority: "new",
    last: "",
  });
  const [contacts, setContacts] = useState([]);
  const [allContacts, setAllContacts] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [editPriority, setEditPriority] = useState({});
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Chart data aggregation
  const chartData = useMemo(() => {
    return Object.entries(
      allContacts.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {})
    ).map(([status, count]) => ({ name: status, value: count }));
  }, [allContacts]);
  
  // Calculate stats from all contacts
  const stats = useMemo(() => {
    return {
      total: allContacts.length,
      active: allContacts.filter((c) => c.status === "Active").length,
      companies: new Set(allContacts.map((c) => c.company)).size,
      recent: allContacts.filter((c) => {
        if (!c.createdAt) return false;
        const addedDate = new Date(c.createdAt);
        const now = new Date();
        const diffDays = (now - addedDate) / (1000 * 60 * 60 * 24);
        return diffDays <= 7;
      }).length,
    };
  }, [allContacts]);

  const headers = [
    { label: "Name", key: "name" },
    { label: "Email", key: "email" },
    { label: "Phone", key: "phone" },
    { label: "Company", key: "company" },
    { label: "Status", key: "status" },
    { label: "Last Interaction", key: "last" },
  ];

  const handleImport = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      const res = await fetch(`${API_URL}/api/contact/import`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Import failed');
      }
      alert('Import successful!');
      e.target.reset();
      setPage(1);
      fetchAllContacts();
    } catch (err) {
      alert(`Import failed: ${err.message}`);
    }
  };

  const addContact = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newContact),
      });
      if (!res.ok) {
        throw new Error("Failed to add contact");
      }
      const created = await res.json();
      setPage(1);
      setModalOpen(false);
      fetchAllContacts();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const updatePriority = async (id) => {
    const newVal = editPriority[id];
    try {
      const res = await fetch(`${API_URL}/api/contact/${id}`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priority: newVal }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to update: ${res.status} ${text}`);
      }
      const updated = await res.json();
      setEditPriority((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      setPage(page);
      fetchAllContacts();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const deleteContact = async (id) => {
    if (!window.confirm("Are you sure you want to delete this contact?")) return;
    try {
      const res = await fetch(`${API_URL}/api/contact/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete contact");
      setContacts(contacts.filter((c) => c.id !== id));
      fetchAllContacts();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const fetchAllContacts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/contact?all=true`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error("Failed to fetch all contacts");
      const data = await res.json();
      setAllContacts(data.data || []);
    } catch (err) {
      setError(err.message);
      console.error("Failed to fetch all contacts:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch paginated contacts
        const res = await fetch(`${API_URL}/api/contact?page=${page}&search=${search}`, {
          headers: getAuthHeaders()
        });
        
        if (!res.ok) {
          throw new Error(`Failed to fetch contacts: ${res.status}`);
        }
        
        const data = await res.json();
        setContacts(data.data || []);
        setTotalPages(data.totalPages || 1);
        
        // Fetch all contacts for stats
        await fetchAllContacts();
      } catch (err) {
        setError(err.message);
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, search]);

  return (
    <div className="space-y-10 px-4 py-8 sm:px-6 lg:px-8 bg-black min-h-screen">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center gap-2">
          <User className="w-7 h-7 text-yellow-500" /> Contacts
        </h1>
        <p className="text-gray-400 mt-2 text-sm">
          Manage all your contacts, companies, and recent interactions in one
          place.
        </p>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Contacts", value: stats.total },
          { label: "Active Contacts", value: stats.active },
          { label: "Companies", value: stats.companies },
          { label: "Recently Added", value: stats.recent },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-gray-900 p-5 rounded-xl border border-gray-800 shadow-sm transition"
          >
            <p className="text-sm text-gray-400">{stat.label}</p>
            <p className="text-2xl font-bold text-white mt-1">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
      
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 w-full sm:w-1/3">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search contacts..."
            className="bg-transparent outline-none w-full text-sm text-white placeholder-gray-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800 transition">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
      </div>
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center gap-2">
            <User className="w-7 h-7 text-yellow-500" /> Contacts
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage all your contacts, companies, and interactions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CSVLink
            data={allContacts}
            headers={headers}
            filename={`contacts_export_${Date.now()}.csv`}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-500 transition"
          >
            Export CSV
          </CSVLink>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-4 py-2 rounded-lg hover:from-yellow-400 hover:to-yellow-500 transition"
          >
            <Plus className="w-4 h-4" /> Add Contact
          </button>
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg">
          Error: {error}
        </div>
      )}
      
      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading contacts...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Contacts Table */}
          <div className="overflow-x-auto border border-gray-800 rounded-xl shadow-sm">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-900 text-gray-400 border-b border-gray-800">
                  {[
                    "Name",
                    "Email",
                    "Phone",
                    "Company",
                    "Priority",
                    "Status",
                    "Last Interaction",
                    "Action"
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-left whitespace-nowrap"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contacts?.length > 0 ? (
                  contacts.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-gray-800 hover:bg-gray-900/50 transition"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-white">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-yellow-500" />
                          {c.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          {c.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          {c.phone}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-400">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-500" />
                          {c.company}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-400">
                        <select
                          value={editPriority[c.id] ?? c.priority}
                          onChange={(e) =>
                            setEditPriority({
                              ...editPriority,
                              [c.id]: e.target.value,
                            })
                          }
                          className="bg-gray-800 border border-gray-700 px-2 py-1 rounded text-white"
                        >
                          <option value="vip">VIP</option>
                          <option value="subscriber">Subscriber</option>
                          <option value="new">New</option>
                        </select>
                        <button
                          onClick={() => updatePriority(c.id)}
                          disabled={
                            editPriority[c.id] === undefined ||
                            editPriority[c.id] === c.priority
                          }
                          className={`ml-2 px-2 py-1 rounded ${editPriority[c.id] !== undefined &&
                            editPriority[c.id] !== c.priority
                            ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold"
                            : "bg-gray-700 text-gray-400 font-bold cursor-not-allowed"
                            }`}
                        >
                          Save
                        </button>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${badgeStyle[c.status]}`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                        {c.last}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => deleteContact(c.id)}
                          className="text-red-400 hover:text-red-300 text-sm font-bold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500">
                      No contacts found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="px-3 py-1 text-sm rounded bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                First
              </button>
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm rounded bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm rounded bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm rounded bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Last
              </button>
            </div>
          </div>
        </>
      )}
      
      {/* Bar Chart Insights */}
      <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-sm">
        <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-600 mb-4 flex items-center gap-2">
          <BarChart3 className="w-[1rem] h-5 text-yellow-500" /> Contacts by Status
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey="name" stroke="#FBBF24" />
              <YAxis stroke="#FBBF24" />
              <Legend />
              <Bar dataKey="value" fill="#F59E0B" barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Add Contact Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setModalOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-xl w-full max-w-md"
          >
            <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-600 mb-4">
              Add New Contact
            </h3>
            <form onSubmit={addContact} className="space-y-4">
              {["name", "email", "phone", "company", "priority", "status"].map(
                (field) => (
                  <div key={field} className="flex flex-col">
                    <label className="text-sm text-gray-400 mb-1 capitalize">
                      {field}
                    </label>
                    {field === "priority" ? (
                      <select
                        value={newContact[field]}
                        onChange={(e) =>
                          setNewContact({ ...newContact, [field]: e.target.value })
                        }
                        className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg outline-none text-white"
                      >
                        <option value="vip">VIP</option>
                        <option value="subscriber">Subscriber</option>
                        <option value="new">New</option>
                      </select>
                    ) : field === "status" ? (
                      <select
                        value={newContact[field]}
                        onChange={(e) =>
                          setNewContact({ ...newContact, [field]: e.target.value })
                        }
                        className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg outline-none text-white"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Prospect">Prospect</option>
                        <option value="Customer">Customer</option>
                      </select>
                    ) : (
                      <input
                        type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                        value={newContact[field]}
                        onChange={(e) =>
                          setNewContact({ ...newContact, [field]: e.target.value })
                        }
                        className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg outline-none text-white"
                      />
                    )}
                  </div>
                )
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-700 hover:bg-gray-800 transition text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-400 hover:to-yellow-500 transition"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      
      {/* Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {["Contact Growth", "Active vs Inactive", "Customer Conversion"].map(
          (title, i) => (
            <div
              key={i}
              className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-600 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-yellow-500" /> {title}
              </h2>
              <div className="h-40 flex items-center justify-center text-gray-500 text-sm border border-dashed border-gray-700 rounded-lg">
                📊 Chart Placeholder
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default ContactsPage;