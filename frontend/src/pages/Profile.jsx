import { useEffect, useState } from "react";

import axiosClient from "../api/axiosClient.js";
import UserAvatar from "../components/UserAvatar.jsx";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    axiosClient.get("/users/me/profile")
      .then((res) => {
        setProfile(res.data);
        localStorage.setItem("current_user", JSON.stringify(res.data));
      })
      .catch((err) => setError(err.response?.data?.detail || "Failed to load profile"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const uploadAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    setSuccess("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await axiosClient.patch("/users/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfile(data);
      localStorage.setItem("current_user", JSON.stringify(data));
      setSuccess("Avatar updated.");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to upload avatar");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  if (loading && !profile) return <p className="text-sm text-slate-500">Loading profile...</p>;

  return (
    <div className="max-w-4xl space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
      {error && <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      {success && <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>}
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <UserAvatar user={profile} size="large" />
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-slate-900">{profile?.full_name || profile?.email}</h2>
            <p className="text-sm text-slate-500">{profile?.email}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{profile?.role}</p>
            <label className="mt-4 inline-flex cursor-pointer rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
              {uploading ? "Uploading..." : "Change avatar"}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={uploadAvatar} disabled={uploading} />
            </label>
          </div>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        <Info label="Department" value={profile?.department || "-"} />
        <Info label="Room" value={profile?.room || "-"} />
        <Info label="Personal information" value={profile?.personal_info || "-"} wide />
        <Info label="Education" value={profile?.education || "-"} wide />
      </section>
    </div>
  );
}

function Info({ label, value, wide = false }) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-white p-4 ${wide ? "sm:col-span-2" : ""}`}>
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}
