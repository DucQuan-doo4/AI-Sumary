import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import axiosClient from "../api/axiosClient.js";
import UserAvatar from "../components/UserAvatar.jsx";

export default function CreateMeeting() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("current_user") || "null");
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
  const [participantSearch, setParticipantSearch] = useState("");
  const [participantPage, setParticipantPage] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const pageSize = 5;

  const filteredUsers = useMemo(() => {
    const keyword = participantSearch.trim().toLowerCase();
    if (!keyword) return users;
    return users.filter((user) =>
      [user.full_name, user.email, user.department, user.room]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword)),
    );
  }, [participantSearch, users]);

  const totalParticipantPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const visibleUsers = filteredUsers.slice((participantPage - 1) * pageSize, participantPage * pageSize);

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

  const changeSearch = (value) => {
    setParticipantSearch(value);
    setParticipantPage(1);
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

  if (!["ADMIN", "MANAGER"].includes(currentUser?.role)) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Only ADMIN or MANAGER users can create meetings.
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-slate-900">Create meeting</h1>
      {error && <div className="mt-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      <form onSubmit={submit} className="mt-4 space-y-4 rounded-lg border border-slate-200 bg-white p-4">
        <Field label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
        <Field label="Description" value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
        <section className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <h2 className="text-sm font-semibold text-blue-950">Schedule meeting ahead</h2>
          <p className="mt-1 text-xs text-blue-700">Choose a future date and time to show this meeting in Upcoming meetings and send reminders when it is close.</p>
          <Field label="Meeting date/time" type="datetime-local" value={form.meeting_date} onChange={(value) => setForm({ ...form, meeting_date: value })} />
        </section>
        <label className="block text-sm font-medium text-slate-700">
          Meeting content
          <textarea className="mt-1 min-h-36 w-full rounded-md border border-slate-300 px-3 py-2" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        </label>
        <Field label="Category" value={form.category} onChange={(value) => setForm({ ...form, category: value })} />
        <Field label="Tags" value={form.tags} onChange={(value) => setForm({ ...form, tags: value })} />
        <div className="rounded-lg border border-slate-200 p-3">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 text-sm font-medium text-slate-700">
              Participants
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                placeholder="Search by name, email, department, room"
                value={participantSearch}
                onChange={(event) => changeSearch(event.target.value)}
              />
            </label>
            <p className="text-xs text-slate-500">{form.participant_user_ids.length} selected</p>
          </div>
          <div className="mt-3 grid gap-2">
            {visibleUsers.map((user) => {
              const selected = form.participant_user_ids.includes(user.id);
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => toggleParticipant(user.id)}
                  className={`flex items-center gap-3 rounded-md border p-3 text-left transition ${
                    selected
                      ? "border-slate-900 bg-slate-100 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-400"
                  }`}
                >
                  <UserAvatar user={user} />
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm ${selected ? "font-semibold text-slate-950" : "font-medium text-slate-900"}`}>
                      {user.full_name || user.email}
                    </span>
                    <span className="block truncate text-xs text-slate-500">{user.email}</span>
                    <span className="block text-xs text-slate-400">{user.department || "-"} · {user.room || "-"}</span>
                  </span>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${selected ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}>
                    {selected ? "Selected" : "Select"}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              disabled={participantPage <= 1}
              onClick={() => setParticipantPage((page) => Math.max(1, page - 1))}
              className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium disabled:opacity-50"
            >
              Previous
            </button>
            <div className="flex flex-wrap justify-center gap-1">
              {Array.from({ length: totalParticipantPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setParticipantPage(page)}
                  className={`h-8 min-w-8 rounded-md px-2 text-xs font-semibold ${
                    page === participantPage ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={participantPage >= totalParticipantPages}
              onClick={() => setParticipantPage((page) => Math.min(totalParticipantPages, page + 1))}
              className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium disabled:opacity-50"
            >
              Next
            </button>
          </div>
          {!visibleUsers.length && <p className="mt-2 text-sm text-slate-500">No users found.</p>}
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
