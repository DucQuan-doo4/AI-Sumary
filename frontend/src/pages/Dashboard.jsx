import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import axiosClient from "../api/axiosClient.js";
import TaskTable from "../components/TaskTable.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

export default function Dashboard() {
  const currentUser = JSON.parse(localStorage.getItem("current_user") || "null");
  const isMember = currentUser?.role === "MEMBER";
  const [overview, setOverview] = useState(null);
  const [statusData, setStatusData] = useState([]);
  const [userData, setUserData] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
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
      axiosClient.get(`/tasks?assignee_id=${currentUser?.id || ""}`),
      axiosClient.get("/meetings"),
    ]).then(([overviewRes, statusRes, userRes, upcomingRes, assignedRes, meetingsRes]) => {
      setOverview(overviewRes.data);
      setStatusData(statusRes.data);
      setUserData(userRes.data.map((item) => ({ ...item, name: item.assignee_name || `User ${item.assignee_id || "N/A"}` })));
      setUpcoming(upcomingRes.data);
      setAssignedTasks(assignedRes.data);
      const now = new Date();
      setUpcomingMeetings(
        meetingsRes.data
          .filter((meeting) => meeting.meeting_date && new Date(meeting.meeting_date) >= now)
          .sort((a, b) => new Date(a.meeting_date) - new Date(b.meeting_date))
          .slice(0, 4),
      );
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
  const groupedTasks = groupAssignedTasks(assignedTasks);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Welcome {currentUser?.full_name || currentUser?.email || "there"}</h1>
        <p className="mt-1 text-sm text-slate-500">Here is your meeting and task overview.</p>
      </div>
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
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Assigned tasks</h2>
            <p className="text-sm text-slate-500">Tasks currently assigned to you.</p>
          </div>
          <Link to="/tasks" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50">View all</Link>
        </div>
        <div className="mt-4 space-y-4">
          <TaskGroup title="Tasks assigned yesterday" tasks={groupedTasks.yesterday} />
          <TaskGroup title="Tasks assigned two days ago" tasks={groupedTasks.twoDaysAgo} />
          <TaskGroup title="Tasks nearing deadline" tasks={groupedTasks.upcomingDue} />
        </div>
        {!assignedTasks.length && <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500">No assigned tasks.</div>}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Upcoming meetings</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {upcomingMeetings.map((meeting) => (
            <div key={meeting.id} className="rounded-lg border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900">{meeting.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{new Date(meeting.meeting_date).toLocaleString()}</p>
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">{meeting.summary || meeting.description || "No summary yet"}</p>
              <Link to={`/meetings/${meeting.id}`} className="mt-3 inline-flex rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700">
                View detail
              </Link>
            </div>
          ))}
        </div>
        {!upcomingMeetings.length && <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500">No upcoming meetings.</div>}
      </section>
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

function TaskGroup({ title, tasks }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-2 grid gap-3 lg:grid-cols-2">
        {tasks.map((task) => <TaskBox key={task.id} task={task} />)}
      </div>
      {!tasks.length && <p className="mt-2 rounded-md bg-slate-50 p-3 text-sm text-slate-500">No tasks in this group.</p>}
    </div>
  );
}

function TaskBox({ task }) {
  return (
    <Link to={`/tasks/${task.id}`} className="block rounded-lg border border-slate-200 p-4 hover:border-slate-400">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">{task.title}</h3>
          <p className="mt-1 text-xs text-slate-500">Meeting #{task.meeting_id} · assigned {formatDate(task.created_at)}</p>
        </div>
        <StatusBadge value={task.status} />
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-slate-600">{task.description || "No description"}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
        <span>Deadline: {task.deadline || "No deadline"}</span>
        <StatusBadge value={task.priority} />
      </div>
    </Link>
  );
}

function groupAssignedTasks(tasks) {
  const now = new Date();
  const today = startOfDay(now);
  const yesterday = addDays(today, -1);
  const twoDaysAgo = addDays(today, -2);
  const nextWeek = addDays(today, 7);

  return {
    yesterday: tasks.filter((task) => sameDay(new Date(task.created_at), yesterday)),
    twoDaysAgo: tasks.filter((task) => sameDay(new Date(task.created_at), twoDaysAgo)),
    upcomingDue: tasks.filter((task) => {
      if (!task.deadline || ["DONE", "CANCELLED"].includes(task.status)) return false;
      const deadline = startOfDay(new Date(task.deadline));
      return deadline >= today && deadline <= nextWeek;
    }),
  };
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function sameDay(a, b) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
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
