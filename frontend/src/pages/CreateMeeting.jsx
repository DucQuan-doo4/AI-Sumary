import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import axiosClient from "../api/axiosClient.js";

export default function CreateMeeting() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    content: "",
    meeting_date: "",
    category: "",
    tags: "",
    participant_user_ids: [],
  });
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axiosClient.get("/users")
      .then((res) => setUsers(res.data))
      .catch((err) => setError(err.response?.data?.detail || "Failed to load users"));
  }, []);

  const toggleParticipant = (userId) => {
    setForm((current) => {
      const exists = current.participant_user_ids.includes(userId);
      return {
        ...current,
        participant_user_ids: exists
          ? current.participant_user_ids.filter((id) => id !== userId)
          : [...current.participant_user_ids, userId],
      };
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await axiosClient.post("/meetings", {
        title: form.title,
        description: form.description || null,
        content: form.content || null,
        meeting_date: form.meeting_date || null,
        category: form.category || null,
        tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        participant_user_ids: form.participant_user_ids,
      });
      navigate(`/meetings/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || "Create meeting failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-slate-900">Create meeting</h1>
      {error && <div className="mt-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      <form onSubmit={submit} className="mt-4 space-y-4 rounded-lg border border-slate-200 bg-white p-4">
        <Field label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
        <Field label="Description" value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
        <label className="block text-sm font-medium text-slate-700">
          Meeting content
          <textarea className="mt-1 min-h-36 w-full rounded-md border border-slate-300 px-3 py-2" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        </label>
        <Field label="Meeting date" type="datetime-local" value={form.meeting_date} onChange={(value) => setForm({ ...form, meeting_date: value })} />
        <Field label="Category" value={form.category} onChange={(value) => setForm({ ...form, category: value })} />
        <Field label="Tags" value={form.tags} onChange={(value) => setForm({ ...form, tags: value })} />
        <div>
          <p className="text-sm font-medium text-slate-700">Participants</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {users.map((user) => (
              <label key={user.id} className="flex items-start gap-2 rounded-md border border-slate-200 p-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={form.participant_user_ids.includes(user.id)}
                  onChange={() => toggleParticipant(user.id)}
                />
                <span>
                  <span className="block font-medium text-slate-900">{user.full_name || user.email}</span>
                  <span className="text-xs text-slate-500">{user.email} · {user.role}</span>
                </span>
              </label>
            ))}
          </div>
          {!users.length && <p className="mt-2 text-sm text-slate-500">No users available.</p>}
        </div>
        <button disabled={loading} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60">
          {loading ? "Creating..." : "Create"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input type={type} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
