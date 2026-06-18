import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import axiosClient from "../api/axiosClient.js";
import TaskTable from "../components/TaskTable.jsx";

export default function Dashboard() {
  const currentUser = JSON.parse(localStorage.getItem("current_user") || "null");
  const isMember = currentUser?.role === "MEMBER";
  const [overview, setOverview] = useState(null);
  const [statusData, setStatusData] = useState([]);
  const [userData, setUserData] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [filters, setFilters] = useState({ category: "", tag: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const query = params.toString();
    Promise.all([
      axiosClient.get(`/dashboard/overview?${query}`),
      axiosClient.get(`/dashboard/tasks-by-status?${query}`),
      axiosClient.get(`/dashboard/tasks-by-user?${query}`),
      axiosClient.get(`/dashboard/upcoming-deadlines?${query}`),
    ]).then(([overviewRes, statusRes, userRes, upcomingRes]) => {
      setOverview(overviewRes.data);
      setStatusData(statusRes.data);
      setUserData(userRes.data.map((item) => ({ ...item, name: item.assignee_name || `User ${item.assignee_id || "N/A"}` })));
      setUpcoming(upcomingRes.data);
    }).catch((err) => {
      setError(err.response?.data?.detail || "Failed to load dashboard");
    }).finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const cards = [
    ["Meetings", overview?.total_meetings, "text-slate-900"],
    ["Tasks", overview?.total_tasks, "text-slate-900"],
    ["Todo", overview?.todo_tasks, "text-slate-900"],
    ["In progress", overview?.in_progress_tasks, "text-blue-600"],
    ["Done", overview?.done_tasks, "text-emerald-600"],
    ["Overdue", overview?.overdue_tasks, "text-rose-600"],
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
      {!isMember && (
        <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-3">
          <Field label="Category" value={filters.category} onChange={(value) => setFilters({ ...filters, category: value })} />
          <Field label="Tag" value={filters.tag} onChange={(value) => setFilters({ ...filters, tag: value })} />
          <button onClick={load} className="self-end rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">Apply</button>
        </div>
      )}
      {error && <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      {loading && <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">Loading dashboard...</div>}
      <div className={`grid gap-4 sm:grid-cols-2 ${isMember ? "lg:grid-cols-2" : "lg:grid-cols-6"}`}>
        {(isMember ? [["Meetings", overview?.total_meetings, "text-slate-900"], ["Assigned tasks", overview?.total_tasks, "text-slate-900"]] : cards).map(([label, value, color]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase text-slate-500">{label}</p>
            <p className={`mt-2 text-2xl font-semibold ${color}`}>{value ?? "-"}</p>
          </div>
        ))}
      </div>
      {!isMember && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Tasks by status" data={statusData} xKey="status" colorByStatus />
            <ChartCard title="Tasks by user" data={userData} xKey="name" />
          </div>
          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Upcoming deadlines</h2>
            <TaskTable tasks={upcoming} />
          </section>
        </>
      )}
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

const statusColors = {
  DONE: "#16a34a",
  IN_PROGRESS: "#2563eb",
  TODO: "#64748b",
  CANCELLED: "#e11d48",
};

function ChartCard({ title, data, xKey, colorByStatus = false }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-4 text-sm font-semibold text-slate-900">{title}</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#0f172a" radius={[4, 4, 0, 0]}>
              {colorByStatus && data.map((entry) => (
                <Cell key={entry.status} fill={statusColors[entry.status] || "#0f172a"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
