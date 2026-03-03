import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  Briefcase,
  User,
  Calendar,
  DollarSign,
  BarChart3,
} from "lucide-react";
import { PipelineChart, ConversionChart } from "../../../components/DealCharts";
import { FaEdit } from "react-icons/fa";
import { AiFillDelete } from "react-icons/ai";
const API_URL = import.meta.env.VITE_VRI_URL;

function Deals() {
  const [deals, setDeals] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [newDeal, setNewDeal] = useState({
    name: "",
    client: "",
    stage: "Negotiation",
    value: "",
    closing: "",
    status: "Open",
  });

  const [editingId, setEditingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const dealsPerPage = 10;

  const handleAddOrUpdateDeal = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!newDeal.name.trim() || !newDeal.client.trim()) {
      alert("Please fill in both name and client fields.");
      return;
    }

    // Get token from localStorage
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You are not authenticated. Please log in.");
      return;
    }

    // Prepare headers with token
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    try {
      let res;
      if (editingId) {
        // Update existing deal
        res = await fetch(`${API_URL}/api/deals/${editingId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            ...newDeal,
            name: newDeal.name.trim(),
            client: newDeal.client.trim(),
          }),
        });

        if (!res.ok) {
          throw new Error(`Failed to update deal: ${res.status} ${res.statusText}`);
        }

        const updated = await res.json();

        setDeals((prev) =>
          prev.map((deal) => (deal.id === editingId ? updated : deal))
        );
        setEditingId(null);
      } else {
        // Add new deal
        res = await fetch(`${API_URL}/api/deals`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            ...newDeal,
            name: newDeal.name.trim(),
            client: newDeal.client.trim(),
          }),
        });

        if (!res.ok) {
          throw new Error(`Failed to create deal: ${res.status} ${res.statusText}`);
        }

        const created = await res.json();
        setDeals((prev) => [...prev, created]);
      }

      // Reset form
      setNewDeal({
        name: "",
        client: "",
        stage: "Negotiation",
        value: "",
        closing: "",
        status: "Open",
      });
      setShowForm(false);
    } catch (err) {
      console.error("Error saving deal:", err);
      alert(`Failed to save deal. ${err.message || "Check backend or authentication."}`);
    }
  };





  const badgeStyle = {
    Open: "bg-blue-900/40 text-blue-400 border border-blue-700",
    Won: "bg-green-900/40 text-green-400 border border-green-700",
    Lost: "bg-red-900/40 text-red-400 border border-red-700",
  };

  // const handleAddDeal = async (e) => {
  //   e.preventDefault();
  //   if (!newDeal.name.trim() || !newDeal.client.trim()) return;

  //   try {
  //     const res = await fetch(`${API_URL}/api/deals`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(newDeal),
  //     });

  //     const created = await res.json();

  //     setDeals((prev) => [...prev, created]);
  //     setNewDeal({
  //       name: "",
  //       client: "",
  //       stage: "Negotiation",
  //       value: "",
  //       closing: "",
  //       status: "Open",
  //     });
  //     setShowForm(false);
  //   } catch (err) {
  //     console.error("Error adding deal:", err);
  //     alert("Failed to add deal. Check backend.");
  //   }
  // };



  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this deal?")) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/api/deals/${id}`, {
        method: "DELETE",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to delete deal: ${res.status}`);
      }

      setDeals((prev) => prev.filter((d) => d.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setShowForm(false);
      }
    } catch (err) {
      console.error("Error deleting deal:", err);
      alert("Failed to delete deal. Check backend or authentication.");
    }
  };


  const handleEdit = (deal) => {
    setNewDeal({
      ...deal,
      value: String(deal.value).replace(/[^0-9.]/g, ""),
    });
    setEditingId(deal.id);
    setShowForm(true);
  };



  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          alert("No authentication token found. Please log in.");
          return;
        }

        const res = await fetch(`${API_URL}/api/deals`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch deals: ${res.status}`);
        }

        const data = await res.json();
        setDeals(data);
      } catch (err) {
        console.error("Error fetching deals:", err);
        alert("Failed to load deals. Check backend or authentication.");
      }
    };

    fetchDeals();
  }, []);



  // Filter deals
  const filteredDeals = deals
    .filter(
      (deal) =>
        deal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.client.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.id - a.id); // Newest on top

  // Pagination
  const indexOfLastDeal = currentPage * dealsPerPage;
  const indexOfFirstDeal = indexOfLastDeal - dealsPerPage;
  const currentDeals = filteredDeals.slice(indexOfFirstDeal, indexOfLastDeal);
  const totalPages = Math.ceil(filteredDeals.length / dealsPerPage);


  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-yellow-400 flex items-center gap-2">
          <Briefcase className="w-7 h-7 text-yellow-400" /> Deals
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-yellow-500 text-black px-4 py-2 rounded-xl font-medium hover:bg-yellow-400"
        >
          <Plus className="w-4 h-4" /> {showForm ? "Close" : "New Deal"}
        </button>
      </div>

      {/* Add Deal Form */}
      {showForm && (
        <form
          onSubmit={handleAddOrUpdateDeal}
          className="bg-zinc-900/60 p-6 rounded-xl border border-zinc-800 space-y-4"
        >
          <div>
            <label className="block text-sm text-zinc-400">Deal Name</label>
            <input
              type="text"
              value={newDeal.name}
              onChange={(e) => setNewDeal({ ...newDeal, name: e.target.value })}
              placeholder="Enter deal name"
              className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400">Client</label>
            <input
              type="text"
              value={newDeal.client}
              onChange={(e) => setNewDeal({ ...newDeal, client: e.target.value })}
              placeholder="Enter client name"
              className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400">Stage</label>
              <select
                value={newDeal.stage}
                onChange={(e) => setNewDeal({ ...newDeal, stage: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
              >
                <option>Negotiation</option>
                <option>Proposal Sent</option>
                <option>Closed Won</option>
                <option>Closed Lost</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400">Value ($)</label>
              <input
                type="number"
                value={newDeal.value}
                onChange={(e) => setNewDeal({ ...newDeal, value: `${e.target.value}` })}
                placeholder="Enter value"
                className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400">Closing Date</label>
              <input
                type="date"
                value={newDeal.closing}
                onChange={(e) => setNewDeal({ ...newDeal, closing: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400">Status</label>
              <select
                value={newDeal.status}
                onChange={(e) => setNewDeal({ ...newDeal, status: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
              >
                <option>Open</option>
                <option>Won</option>
                <option>Lost</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-yellow-500 text-black py-2 rounded-lg font-medium hover:bg-yellow-400"
          >
            Save Deal
          </button>

          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setNewDeal({
                  name: "",
                  client: "",
                  stage: "Negotiation",
                  value: "",
                  closing: "",
                  status: "Open",
                });
                setShowForm(false);
              }}
              className="w-full mt-2 bg-zinc-700 text-white py-2 rounded-lg hover:bg-zinc-600"
            >
              Cancel Edit
            </button>
          )}

        </form>
      )}

      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // reset to first page on search
          }}
          placeholder="Search by deal name or client"
          className="w-full sm:w-64 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white"
        />
      </div>

      {/* Deals Table */}
      <div className="overflow-x-auto border border-zinc-800 rounded-xl">
        <table className="table-auto w-full text-sm">
          <thead>
            <tr className="bg-zinc-900/60 text-zinc-400 border-b border-zinc-800">
              {["Deal Name", "Client", "Stage", "Value", "Closing Date", "Status", "Action"].map(
                (header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left whitespace-nowrap"
                  >
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {currentDeals.map((d) => (

              <tr
                key={d.id}
                className="border-b border-zinc-800 hover:bg-zinc-900/40"
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-zinc-200">
                    <Briefcase className="w-4 h-4 text-yellow-400" />
                    {d.name}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <User className="w-4 h-4 text-zinc-400" />
                    {d.client}
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                  {d.stage}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1 text-zinc-300">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    {d.value}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-zinc-400">
                  {d.closing}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${badgeStyle[d.status]}`}
                  >
                    {d.status}
                  </span>
                </td>
                <td className="px-1 py-3 flex">
                  <button
                    onClick={() => handleEdit(d)}
                    className="text-blue-400 hover:underline mr-3 flex gap-1 items-center font-bold"
                  >
                    <FaEdit /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="text-red-400 hover:underline flex gap-1 items-center font-bold"
                  >
                    <AiFillDelete /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <p className="text-sm text-zinc-400">
          Showing {indexOfFirstDeal + 1}-{Math.min(indexOfLastDeal, filteredDeals.length)} of {filteredDeals.length}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm rounded bg-zinc-700 text-white hover:bg-zinc-600 disabled:opacity-40"
          >
            First
          </button>
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm rounded bg-zinc-700 text-white hover:bg-zinc-600 disabled:opacity-40"
          >
            Prev
          </button>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm rounded bg-zinc-700 text-white hover:bg-zinc-600 disabled:opacity-40"
          >
            Next
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm rounded bg-zinc-700 text-white hover:bg-zinc-600 disabled:opacity-40"
          >
            Last
          </button>
        </div>
      </div>


      {/* Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 w-[96vw]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-zinc-900/60 p-6 rounded-xl border border-zinc-800">
            <h2 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-yellow-400" /> Pipeline Overview
            </h2>
            <PipelineChart deals={deals} />
          </div>

          <div className="bg-zinc-900/60 p-6 rounded-xl border border-zinc-800">
            <h2 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-yellow-400" /> Deal Conversion Rate
            </h2>
            <ConversionChart deals={deals} />
          </div>
        </div>

      </div>
    </div>
  );
}

export default Deals;
