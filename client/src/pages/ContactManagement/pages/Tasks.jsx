// tasks.jsx
import React, { useState, useEffect } from "react";
import {
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  Edit2,
  Trash2,
  Search as SearchIcon,
} from "lucide-react";

const API_URL = import.meta.env.VITE_VRI_URL;

function Tasks() {
  // Auth helper function
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Initial tasks
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form and UI states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newTask, setNewTask] = useState({
    title: "",
    due: "",
    status: "Pending",
    priority: "Medium",
    notes: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [sortKey, setSortKey] = useState("due"); // sort by due date or priority

  // Badge style for statuses
  const badgeStyle = {
    Pending: "bg-yellow-900/40 text-yellow-400 border border-yellow-700",
    "In Progress": "bg-blue-900/40 text-blue-400 border border-blue-700",
    Completed: "bg-green-900/40 text-green-400 border border-green-700",
  };

  // Handle form submit (add or edit)
  const handleAddOrEditTask = async (e) => {
    e.preventDefault();

    if (!newTask.title.trim()) return;

    try {
      if (editingId) {
        // EDIT existing task (PUT)
        const res = await fetch(`${API_URL}/api/tasks/${editingId}`, {
          method: "PUT",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json"
          },
          body: JSON.stringify(newTask),
        });

        if (!res.ok) throw new Error("Failed to update task");

        // Update task locally
        setTasks((prev) =>
          prev.map((t) => (t.id === editingId ? { ...t, ...newTask } : t))
        );

        setEditingId(null);
      } else {
        // ADD new task (POST)
        const res = await fetch(`${API_URL}/api/tasks`, {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json"
          },
          body: JSON.stringify(newTask),
        });

        if (!res.ok) throw new Error("Failed to add task");

        const createdTask = await res.json();

        // Add returned task from backend (with real ID)
        setTasks((prev) => [...prev, createdTask]);
      }

      // Clear form
      setNewTask({
        title: "",
        due: "",
        status: "Pending",
        priority: "Medium",
        notes: "",
      });

      setShowForm(false);
    } catch (error) {
      setError(error.message);
      console.error("Failed to save task:", error);
    }
  };

  // Delete task
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      const res = await fetch(`${API_URL}/api/tasks/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });

      if (!res.ok) throw new Error("Failed to delete task");

      // Remove from local state
      setTasks((prev) => prev.filter((t) => t.id !== id));

      // Close form if deleting currently edited task
      if (editingId === id) {
        setEditingId(null);
        setShowForm(false);
      }
    } catch (error) {
      setError(error.message);
      console.error("Error deleting task:", error);
    }
  };

  // Edit task - populate form
  const handleEdit = (task) => {
    setNewTask({
      title: task.title,
      due: task.due,
      status: task.status,
      priority: task.priority,
      notes: task.notes || "",
    });
    setEditingId(task.id);
    setShowForm(true);
  };

  // Toggle task completion status
  const toggleComplete = (id) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
            ...t,
            status: t.status === "Completed" ? "Pending" : "Completed",
          }
          : t
      )
    );
  };

  // Bulk selection states
  const [selectedTasks, setSelectedTasks] = useState(new Set());

  const toggleSelectTask = (id) => {
    setSelectedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const selectAllTasks = () => {
    setSelectedTasks(new Set(filteredTasks.map((t) => t.id)));
  };

  const deselectAllTasks = () => {
    setSelectedTasks(new Set());
  };

  const bulkDelete = () => {
    if (selectedTasks.size === 0) return alert("No tasks selected");
    if (window.confirm("Delete selected tasks?")) {
      setTasks((prev) => prev.filter((t) => !selectedTasks.has(t.id)));
      setSelectedTasks(new Set());
    }
  };

  const bulkMarkCompleted = () => {
    if (selectedTasks.size === 0) return alert("No tasks selected");
    setTasks((prev) =>
      prev.map((t) =>
        selectedTasks.has(t.id) ? { ...t, status: "Completed" } : t
      )
    );
    setSelectedTasks(new Set());
  };

  // Filter and search
  const filteredTasks = Array.isArray(tasks) 
    ? tasks
      .filter((t) =>
        t.title && t.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter((t) => (filterStatus === "All" ? true : t.status === filterStatus))
      .filter((t) =>
        filterPriority === "All" ? true : t.priority === filterPriority
      )
    : [];

  // Sorting
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortKey === "due") {
      if (!a.due) return 1;
      if (!b.due) return -1;
      return new Date(a.due) - new Date(b.due);
    } else if (sortKey === "priority") {
      const order = { High: 1, Medium: 2, Low: 3 };
      return order[a.priority] - order[b.priority];
    }
    return 0;
  });

  // Helper: Check if task is overdue or upcoming (within 3 days)
  const isOverdue = (due) => {
    if (!due) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(due);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const isUpcoming = (due) => {
    if (!due) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(due);
    dueDate.setHours(0, 0, 0, 0);
    const diffDays = (dueDate - today) / (1000 * 3600 * 24);
    return diffDays >= 0 && diffDays <= 3;
  };

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const res = await fetch(`${API_URL}/api/tasks`, {
          headers: getAuthHeaders()
        });
        
        if (!res.ok) {
          throw new Error(`Failed to fetch tasks: ${res.status}`);
        }
        
        const data = await res.json();
        setTasks(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching tasks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-3xl font-bold text-yellow-400 flex items-center gap-2">
          <CheckCircle2 className="w-7 h-7 text-yellow-400" /> Tasks
        </h1>

        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setNewTask({
                title: "",
                due: "",
                status: "Pending",
                priority: "Medium",
                notes: "",
              });
            }}
            className="flex items-center gap-2 bg-yellow-500 text-black px-4 py-2 rounded-xl font-medium hover:bg-yellow-400"
          >
            <Plus className="w-4 h-4" /> {showForm ? "Close" : "Add Task"}
          </button>

          {/* Bulk actions */}
          {selectedTasks.size > 0 && (
            <div className="flex gap-2">
              <button
                onClick={bulkMarkCompleted}
                className="px-3 py-1 bg-green-600 rounded-lg text-sm font-medium hover:bg-green-500"
              >
                Mark Completed ({selectedTasks.size})
              </button>
              <button
                onClick={bulkDelete}
                className="px-3 py-1 bg-red-600 rounded-lg text-sm font-medium hover:bg-red-500"
              >
                Delete Selected ({selectedTasks.size})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          Error: {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mx-auto"></div>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading tasks...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tasks by title..."
                className="w-full pl-10 pr-3 py-2 rounded-lg text-sm bg-zinc-800 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none"
              />
              <SearchIcon
                className="absolute left-3 top-2.5 w-5 h-5 text-zinc-500 pointer-events-none"
                strokeWidth={1.5}
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm bg-zinc-800 border border-zinc-700 text-zinc-200"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm bg-zinc-800 border border-zinc-700 text-zinc-200"
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm bg-zinc-800 border border-zinc-700 text-zinc-200"
            >
              <option value="due">Sort by Due Date</option>
              <option value="priority">Sort by Priority</option>
            </select>
          </div>

          {/* Add/Edit Task Form */}
          {showForm && (
            <form
              onSubmit={handleAddOrEditTask}
              className="bg-zinc-900/60 p-5 rounded-xl border border-zinc-800 space-y-4"
            >
              <div>
                <label className="block text-sm text-zinc-400">Task Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg outline-none text-sm"
                  placeholder="Enter task title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400">Due Date</label>
                <input
                  type="date"
                  value={newTask.due}
                  onChange={(e) =>
                    setNewTask({ ...newTask, due: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg outline-none text-sm"
                  required
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-zinc-400">Status</label>
                  <select
                    value={newTask.status}
                    onChange={(e) =>
                      setNewTask({ ...newTask, status: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg outline-none text-sm"
                  >
                    <option>Pending</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-zinc-400">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask({ ...newTask, priority: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg outline-none text-sm"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400">Notes</label>
                <textarea
                  value={newTask.notes}
                  onChange={(e) =>
                    setNewTask({ ...newTask, notes: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg outline-none text-sm resize-y"
                  placeholder="Additional notes (optional)"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-yellow-500 text-black py-2 rounded-lg font-medium hover:bg-yellow-400"
              >
                {editingId ? "Update Task" : "Save Task"}
              </button>
            </form>
          )}

          {/* Task List */}
          <div className="space-y-4">
            {sortedTasks.length === 0 ? (
              <p className="text-center text-zinc-400">No tasks found.</p>
            ) : (
              sortedTasks.map((task) => {
                const overdue = isOverdue(task.due);
                const upcoming = isUpcoming(task.due);
                const isSelected = selectedTasks.has(task.id);

                return (
                  <div
                    key={task.id}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between bg-zinc-900/60 border border-zinc-800 rounded-lg px-4 py-3 hover:bg-zinc-900/80 ${overdue
                      ? "border-red-600 bg-red-900/50"
                      : upcoming
                        ? "border-yellow-600 bg-yellow-900/40"
                        : ""
                      }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectTask(task.id)}
                        className="w-4 h-4 rounded cursor-pointer"
                      />

                      {/* Status Icon */}
                      {task.status === "Completed" ? (
                        <CheckCircle2
                          onClick={() => toggleComplete(task.id)}
                          className="w-5 h-5 text-green-400 cursor-pointer"
                          title="Toggle Complete"
                        />
                      ) : task.status === "In Progress" ? (
                        <Clock className="w-5 h-5 text-blue-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-yellow-400" />
                      )}

                      <div>
                        <p className="font-medium text-zinc-200">{task.title}</p>
                        <p className="text-xs text-zinc-400">
                          Due: {task.due || "No date"}
                        </p>
                        {task.notes && (
                          <p className="text-xs text-zinc-500 italic mt-1 max-w-md break-words">
                            Notes: {task.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-3 sm:mt-0">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${badgeStyle[task.status]}`}
                      >
                        {task.status}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full border border-zinc-700 text-zinc-400">
                        {task.priority} Priority
                      </span>

                      <button
                        onClick={() => handleEdit(task)}
                        title="Edit task"
                        className="p-1 rounded hover:bg-yellow-700"
                      >
                        <Edit2 className="w-4 h-4 text-yellow-400" />
                      </button>

                      <button
                        onClick={() => handleDelete(task.id)}
                        title="Delete task"
                        className="p-1 rounded hover:bg-red-700"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Tasks;