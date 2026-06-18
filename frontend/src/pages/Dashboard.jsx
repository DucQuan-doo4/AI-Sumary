import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import axiosClient from "../api/axiosClient.js";
import TaskTable from "../components/TaskTable.jsx";

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [statusData, setStatusData] = useState([]);
  const [userData, setUserData] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([
      axiosClient.get("/dashboard/overview"),
      axiosClient.get("/dashboard/tasks-by-status"),
      axiosClient.get("/dashboard/tasks-by-user"),
      axiosClient.get("/dashboard/upcoming-deadlines"),
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
  }, []);

  const cards = [
    ["Meetings", overview?.total_meetings],
    ["Tasks", overview?.total_tasks],
    ["Todo", overview?.todo_tasks],
    ["In progress", overview?.in_progress_tasks],
    ["Done", overview?.done_tasks],
    ["Overdue", overview?.overdue_tasks],
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
      {error && <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      {loading && <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">Loading dashboard...</div>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{value ?? "-"}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Tasks by status" data={statusData} xKey="status" />
        <ChartCard title="Tasks by user" data={userData} xKey="name" />
      </div>
      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Upcoming deadlines</h2>
        <TaskTable tasks={upcoming} />
      </section>
    </div>
  );
}

function ChartCard({ title, data, xKey }) {
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
            <Bar dataKey="count" fill="#0f172a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
