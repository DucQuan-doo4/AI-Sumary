import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import axiosClient from "../api/axiosClient.js";
import StatusBadge from "../components/StatusBadge.jsx";
import UserAvatar from "../components/UserAvatar.jsx";

export default function TaskDetail() {
  const { id } = useParams();
  const currentUser = JSON.parse(localStorage.getItem("current_user") || "null");
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    axiosClient.get(`/tasks/${id}`)
      .then((res) => setTask(res.data))
      .catch((err) => setError(err.response?.data?.detail || "Failed to load task"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const updateStatus = async (status) => {
    setError("");
    try {
      const { data } = await axiosClient.patch(`/tasks/${id}/status`, { status });
      setTask(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update status");
    }
  };

  if (loading && !task) return <p className="text-sm text-slate-500">Loading task...</p>;
  if (!task) return <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error || "Task not found"}</div>;
  const lockedDone = task.status === "DONE" && !["ADMIN", "MANAGER"].includes(currentUser?.role);

  return (
    <div className="max-w-3xl space-y-4">
      {error && <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{task.title}</h1>
            <p className="mt-1 text-sm text-slate-500">Meeting #{task.meeting_id}</p>
          </div>
          <div className="flex gap-2">
            <StatusBadge value={task.priority} />
            <StatusBadge value={task.status} />
          </div>
        </div>
        <p className="mt-4 whitespace-pre-wrap text-sm text-slate-700">{task.description || "No description"}</p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <Info label="Assignee" value={<AssigneeInfo task={task} />} />
          <Info label="Assigned date" value={new Date(task.created_at).toLocaleString()} />
          <Info label="Deadline" value={task.deadline || "No deadline"} />
          <Info label="Source" value={task.source} />
          <Info label="Created by" value={`User ${task.created_by}`} />
        </dl>
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Update status</h2>
        {lockedDone && <p className="mt-2 text-sm text-slate-500">This task is completed and can no longer be changed by regular users.</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {["TODO", "IN_PROGRESS", "DONE", "CANCELLED"].map((status) => (
            <button key={status} disabled={lockedDone} onClick={() => updateStatus(status)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50">
              {status}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <dt className="text-xs uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function AssigneeInfo({ task }) {
  const assignee = task.assignee;
  if (!assignee) return task.assignee_name || task.assignee_id || "Unassigned";

  return (
    <span className="group relative inline-flex items-center gap-2">
      <UserAvatar user={assignee} size="small" />
      <span>{assignee.full_name || assignee.email}</span>
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-56 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg group-hover:block">
        <span className="block font-semibold text-slate-900">{assignee.full_name || assignee.email}</span>
        <span className="mt-1 block text-slate-500">{assignee.email}</span>
        <span className="mt-2 block text-slate-600">{assignee.department || "No department"} · {assignee.room || "No room"}</span>
      </span>
    </span>
  );
}
