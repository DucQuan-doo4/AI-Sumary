import { Link } from "react-router-dom";

import axiosClient from "../api/axiosClient.js";
import StatusBadge from "./StatusBadge.jsx";
import UserAvatar from "./UserAvatar.jsx";

const statuses = ["TODO", "IN_PROGRESS", "DONE", "CANCELLED"];

export default function TaskTable({ tasks, onStatusChange, onDelete }) {
  const currentUser = JSON.parse(localStorage.getItem("current_user") || "null");
  const isAdmin = currentUser?.role === "ADMIN";
  const isManager = currentUser?.role === "MANAGER";
  const canChangeStatus = (task) => {
    if (isAdmin || isManager) return true;
    return task.status !== "DONE";
  };
  const canDeleteTask = (task) => {
    if (isAdmin) return true;
    const finished = ["DONE", "CANCELLED"].includes(task.status);
    return finished && (isManager || task.created_by === currentUser?.id);
  };

  const updateStatus = async (taskId, status) => {
    await axiosClient.patch(`/tasks/${taskId}/status`, { status });
    onStatusChange?.();
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;
    await axiosClient.delete(`/tasks/${taskId}`);
    onDelete?.();
  };

  if (!tasks?.length) {
    return <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">No tasks found.</div>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Task</th>
            <th className="px-4 py-3">Assignee</th>
            <th className="px-4 py-3">Assigned / deadline</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tasks.map((task) => (
            <tr key={task.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <Link className="font-medium text-slate-900 hover:underline" to={`/tasks/${task.id}`}>
                  {task.title}
                </Link>
                <p className="text-xs text-slate-500">Meeting #{task.meeting_id}</p>
              </td>
              <td className="px-4 py-3 text-slate-600"><AssigneeCell task={task} /></td>
              <td className="px-4 py-3 text-slate-600">
                <p className="text-xs text-slate-500">Assigned {formatDate(task.created_at)}</p>
                <p className="mt-1 font-medium text-slate-800">{task.deadline || "No deadline"}</p>
              </td>
              <td className="px-4 py-3"><StatusBadge value={task.priority} /></td>
              <td className="px-4 py-3">
                {onStatusChange && canChangeStatus(task) ? (
                  <select
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusSelectClass(task.status)}`}
                    value={task.status}
                    onChange={(event) => updateStatus(task.id, event.target.value)}
                  >
                    {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                ) : (
                  <StatusBadge value={task.status} />
                )}
              </td>
              <td className="px-4 py-3">
                {canDeleteTask(task) && onDelete && (
                  <button
                    type="button"
                    onClick={() => deleteTask(task.id)}
                    className="rounded-md border border-rose-200 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AssigneeCell({ task }) {
  const assignee = task.assignee;
  if (!assignee) return <span>{task.assignee_name || "Unassigned"}</span>;

  return (
    <div className="group relative inline-flex items-center gap-2">
      <UserAvatar user={assignee} size="small" />
      <span className="font-medium text-slate-800">{assignee.full_name || assignee.email}</span>
      <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-56 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg group-hover:block">
        <p className="font-semibold text-slate-900">{assignee.full_name || assignee.email}</p>
        <p className="mt-1 text-slate-500">{assignee.email}</p>
        <p className="mt-2 text-slate-600">{assignee.department || "No department"} · {assignee.room || "No room"}</p>
        <p className="mt-1 text-slate-500">{assignee.role}</p>
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

function statusSelectClass(status) {
  const classes = {
    TODO: "border-slate-200 bg-slate-50 text-slate-700",
    IN_PROGRESS: "border-blue-200 bg-blue-50 text-blue-700",
    DONE: "border-emerald-200 bg-emerald-50 text-emerald-700",
    CANCELLED: "border-rose-200 bg-rose-50 text-rose-700",
  };
  return classes[status] || classes.TODO;
}
