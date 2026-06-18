import { useEffect, useState } from "react";

import axiosClient from "../api/axiosClient.js";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    axiosClient.get("/notifications")
      .then((res) => setNotifications(res.data))
      .catch((err) => setError(err.response?.data?.detail || "Failed to load notifications"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id) => {
    setError("");
    try {
      await axiosClient.patch(`/notifications/${id}/read`);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to mark notification as read");
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
      {error && <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      {loading && <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">Loading notifications...</div>}
      <div className="space-y-3">
        {notifications.map((notification) => (
          <div key={notification.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <p className="font-semibold text-slate-900">{notification.title}</p>
                <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                <p className="mt-2 text-xs text-slate-500">{new Date(notification.created_at).toLocaleString()}</p>
              </div>
              <button
                onClick={() => markRead(notification.id)}
                disabled={notification.is_read}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
              >
                {notification.is_read ? "Read" : "Mark read"}
              </button>
            </div>
          </div>
        ))}
      </div>
      {!loading && !notifications.length && <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">No notifications.</div>}
    </div>
  );
}
