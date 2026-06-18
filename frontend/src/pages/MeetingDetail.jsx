import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import axiosClient from "../api/axiosClient.js";
import StatusBadge from "../components/StatusBadge.jsx";
import TaskTable from "../components/TaskTable.jsx";
import UserAvatar from "../components/UserAvatar.jsx";

const priorities = ["LOW", "MEDIUM", "HIGH"];

export default function MeetingDetail() {
  const { id } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [previewTasks, setPreviewTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAi, setLoadingAi] = useState(false);
  const [savingTasks, setSavingTasks] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    Promise.all([
      axiosClient.get(`/meetings/${id}`),
      axiosClient.get(`/tasks?meeting_id=${id}`),
      axiosClient.get("/users"),
    ])
      .then(([meetingRes, tasksRes, usersRes]) => {
        setMeeting(meetingRes.data);
        setTasks(tasksRes.data);
        setUsers(usersRes.data);
      })
      .catch((err) => {
        setError(err.response?.data?.detail || "Failed to load meeting");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, [id]);

  const analyze = async () => {
    setLoadingAi(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await axiosClient.post(`/meetings/${id}/analyze`);
      setAnalysis(data);
      setPreviewTasks(data.tasks.map((task) => ({ ...task, source: "AI" })));
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "AI analysis failed");
    } finally {
      setLoadingAi(false);
    }
  };

  const updatePreviewTask = (index, field, value) => {
    setPreviewTasks((current) =>
      current.map((task, taskIndex) => (taskIndex === index ? { ...task, [field]: value || null } : task)),
    );
  };

  const savePreviewTasks = async () => {
    setSavingTasks(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        tasks: previewTasks
          .filter((task) => task.title?.trim())
          .map((task) => ({
            title: task.title,
            description: task.description || null,
            assignee_id: task.assignee_id ? Number(task.assignee_id) : null,
            assignee_name: task.assignee_name || null,
            deadline: task.deadline || null,
            priority: task.priority || "MEDIUM",
            source: "AI",
          })),
      };
      await axiosClient.post(`/meetings/${id}/tasks/bulk`, payload);
      setSuccess("AI preview tasks saved.");
      setAnalysis(null);
      setPreviewTasks([]);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save preview tasks");
    } finally {
      setSavingTasks(false);
    }
  };

  if (loading && !meeting) return <p className="text-sm text-slate-500">Loading meeting...</p>;
  if (!meeting) return <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error || "Meeting not found"}</div>;

  return (
    <div className="space-y-6">
      {error && <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      {success && <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>}
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{meeting.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {meeting.meeting_date ? new Date(meeting.meeting_date).toLocaleString() : "No date"}
            </p>
          </div>
          <button
            onClick={analyze}
            disabled={loadingAi}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {loadingAi ? "Analyzing..." : "Analyze with AI"}
          </button>
        </div>
        <p className="mt-4 whitespace-pre-wrap text-sm text-slate-700">
          {meeting.content || meeting.description || "No content"}
        </p>
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <Info label="Category" value={meeting.category || "-"} />
          <Info label="Tags" value={meeting.tags?.length ? meeting.tags.join(", ") : "-"} />
        </div>
        <div className="mt-4">
          <p className="text-xs uppercase text-slate-500">Participants</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {meeting.participants?.map((participant) => (
              <span key={participant.id} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                <UserAvatar user={participant} size="small" />
                <span>{participant.full_name || participant.email}</span>
              </span>
            ))}
          </div>
        </div>
        {meeting.summary && <div className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">{meeting.summary}</div>}
      </section>

      {analysis && (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">AI suggested tasks</h2>
              <p className="text-sm text-slate-500">Review and edit before saving to the task list.</p>
            </div>
            <button
              type="button"
              onClick={savePreviewTasks}
              disabled={savingTasks || !previewTasks.length}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {savingTasks ? "Saving..." : "Confirm Save Tasks"}
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {previewTasks.map((task, index) => (
              <div key={`${task.title}-${index}`} className="rounded-md border border-slate-200 p-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700">
                    Title
                    <input
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                      value={task.title || ""}
                      onChange={(event) => updatePreviewTask(index, "title", event.target.value)}
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Priority
                    <select
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                      value={task.priority || "MEDIUM"}
                      onChange={(event) => updatePreviewTask(index, "priority", event.target.value)}
                    >
                      {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-slate-700 md:col-span-2">
                    Description
                    <textarea
                      className="mt-1 min-h-20 w-full rounded-md border border-slate-300 px-3 py-2"
                      value={task.description || ""}
                      onChange={(event) => updatePreviewTask(index, "description", event.target.value)}
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Assignee
                    <select
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                      value={task.assignee_id || ""}
                      onChange={(event) => {
                        const assigneeId = event.target.value ? Number(event.target.value) : null;
                        const assignee = users.find((user) => user.id === assigneeId);
                        updatePreviewTask(index, "assignee_id", assigneeId);
                        updatePreviewTask(index, "assignee_name", assignee?.full_name || assignee?.email || null);
                      }}
                    >
                      <option value="">Unassigned</option>
                      {meeting.participants?.map((participant) => (
                        <option key={participant.id} value={participant.id}>
                          {participant.full_name || participant.email}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Deadline
                    <input
                      type="date"
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                      value={task.deadline || ""}
                      onChange={(event) => updatePreviewTask(index, "deadline", event.target.value)}
                    />
                  </label>
                </div>
                <div className="mt-3">
                  <StatusBadge value="AI" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Tasks</h2>
        <TaskTable tasks={tasks} onStatusChange={load} onDelete={load} />
      </section>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-900">{value}</p>
    </div>
  );
}
