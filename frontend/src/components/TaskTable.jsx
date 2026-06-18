import { Link } from "react-router-dom";

import StatusBadge from "./StatusBadge.jsx";

export default function TaskTable({ tasks }) {
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
            <th className="px-4 py-3">Deadline</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Status</th>
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
              <td className="px-4 py-3 text-slate-600">{task.assignee_name || task.assignee_id || "Unassigned"}</td>
              <td className="px-4 py-3 text-slate-600">{task.deadline || "No deadline"}</td>
              <td className="px-4 py-3"><StatusBadge value={task.priority} /></td>
              <td className="px-4 py-3"><StatusBadge value={task.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
