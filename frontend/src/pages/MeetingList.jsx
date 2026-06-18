import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import axiosClient from "../api/axiosClient.js";
import MeetingCard from "../components/MeetingCard.jsx";

export default function MeetingList() {
  const [meetings, setMeetings] = useState([]);
  const [filters, setFilters] = useState({ search: "", category: "", tag: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    axiosClient.get(`/meetings?${params.toString()}`)
      .then((res) => setMeetings(res.data))
      .catch((err) => setError(err.response?.data?.detail || "Failed to load meetings"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">Meetings</h1>
        <Link to="/meetings/new" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">New meeting</Link>
      </div>
      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-4">
        <Field label="Search" value={filters.search} onChange={(value) => setFilters({ ...filters, search: value })} />
        <Field label="Category" value={filters.category} onChange={(value) => setFilters({ ...filters, category: value })} />
        <Field label="Tag" value={filters.tag} onChange={(value) => setFilters({ ...filters, tag: value })} />
        <button onClick={load} className="self-end rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">Apply</button>
      </div>
      {error && <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      {loading && <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">Loading meetings...</div>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {meetings.map((meeting) => <MeetingCard key={meeting.id} meeting={meeting} />)}
      </div>
      {!loading && !meetings.length && <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">No meetings yet.</div>}
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
