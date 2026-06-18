import { useEffect, useState } from "react";

import axiosClient from "../api/axiosClient.js";
import TaskTable from "../components/TaskTable.jsx";

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({ status: "", priority: "", meeting_id: "", overdue: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    axiosClient.get(`/tasks?${params.toString()}`)
      .then((res) => setTasks(res.data))
      .catch((err) => setError(err.response?.data?.detail || "Failed to load tasks"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Tasks</h1>
      {error && <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-5">
        <Select label="Status" value={filters.status} options={["", "TODO", "IN_PROGRESS", "DONE", "CANCELLED"]} onChange={(value) => setFilters({ ...filters, status: value })} />
        <Select label="Priority" value={filters.priority} options={["", "LOW", "MEDIUM", "HIGH"]} onChange={(value) => setFilters({ ...filters, priority: value })} />
        <label className="text-sm font-medium text-slate-700">Meeting ID<input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={filters.meeting_id} onChange={(e) => setFilters({ ...filters, meeting_id: e.target.value })} /></label>
        <Select label="Overdue" value={filters.overdue} options={["", "true", "false"]} onChange={(value) => setFilters({ ...filters, overdue: value })} />
        <button onClick={load} className="self-end rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">Apply</button>
      </div>
      {loading ? <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">Loading tasks...</div> : <TaskTable tasks={tasks} />}
    </div>
  );
}

function Select({ label, value, options, onChange }) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => <option key={option || "all"} value={option}>{option || "All"}</option>)}
      </select>
    </label>
  );
}
