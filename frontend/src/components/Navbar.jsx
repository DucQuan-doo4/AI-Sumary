import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import axiosClient from "../api/axiosClient.js";
import UserAvatar from "./UserAvatar.jsx";

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("current_user") || "null");
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  const unread = notifications.filter((item) => !item.is_read);

  const loadNotifications = () => {
    axiosClient.get("/notifications")
      .then((res) => setNotifications(res.data))
      .catch(() => setNotifications([]));
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const closeNotifications = async () => {
    setOpen(false);
    if (!unread.length) return;
    await Promise.allSettled(unread.map((item) => axiosClient.patch(`/notifications/${item.id}/read`)));
    loadNotifications();
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("current_user");
    navigate("/login");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div>
        <p className="text-sm font-semibold text-slate-900">AI Meeting Action Tracking</p>
        <p className="text-xs text-slate-500">Meeting tasks, AI suggestions, and follow-up visibility</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => (open ? closeNotifications() : setOpen(true))}
            className="relative rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Alerts
            {unread.length > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-xs font-semibold text-white">
                {unread.length}
              </span>
            )}
          </button>
          {open && (
            <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Assigned tasks</p>
                <button type="button" onClick={closeNotifications} className="text-xs font-medium text-slate-500 hover:text-slate-900">Close</button>
              </div>
              <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
                {notifications.slice(0, 8).map((notification) => (
                  <Link
                    key={notification.id}
                    to={notification.task_id ? `/tasks/${notification.task_id}` : "/notifications"}
                    onClick={closeNotifications}
                    className={`block rounded-md border p-3 text-sm hover:bg-slate-50 ${
                      notification.is_read ? "border-slate-100" : "border-rose-100 bg-rose-50"
                    }`}
                  >
                    <p className="font-medium text-slate-900">{notification.title}</p>
                    <p className="mt-1 text-slate-600">{notification.message}</p>
                    <p className="mt-2 text-xs text-slate-500">{new Date(notification.created_at).toLocaleString()}</p>
                  </Link>
                ))}
                {!notifications.length && <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">No notifications.</p>}
              </div>
            </div>
          )}
        </div>
        <UserAvatar user={user} />
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-900">{user?.full_name || user?.email}</p>
          <p className="text-xs text-slate-500">{user?.role}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
