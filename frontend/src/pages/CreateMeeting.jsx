import { useState } from "react";
import { useNavigate } from "react-router-dom";

import axiosClient from "../api/axiosClient.js";

export default function CreateMeeting() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    content: "",
    meeting_date: "",
    participant_user_ids: "1",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const participantIds = form.participant_user_ids
        .split(",")
        .map((id) => Number(id.trim()))
        .filter(Boolean);
      const { data } = await axiosClient.post("/meetings", {
        title: form.title,
        description: form.description || null,
        content: form.content || null,
        meeting_date: form.meeting_date || null,
        participant_user_ids: participantIds,
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
        <Field label="Participant user IDs" value={form.participant_user_ids} onChange={(value) => setForm({ ...form, participant_user_ids: value })} />
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
