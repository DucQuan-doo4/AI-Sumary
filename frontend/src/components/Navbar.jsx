import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import axiosClient from "../api/axiosClient.js";
import UserAvatar from "./UserAvatar.jsx";

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("current_user") || "null");
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "" });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

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
    if (!window.confirm("Are you sure you want to log out?")) return;
    localStorage.removeItem("access_token");
    localStorage.removeItem("current_user");
    navigate("/login");
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    try {
      await axiosClient.patch("/auth/me/password", passwordForm);
      setPasswordForm({ current_password: "", new_password: "" });
      setPasswordSuccess("Password changed.");
    } catch (err) {
      setPasswordError(err.response?.data?.detail || "Failed to change password");
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <Link to="/dashboard" className="flex items-center gap-3 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">AI</span>
        <span>
          <span className="block text-sm font-semibold text-slate-900">AI Meeting Action Tracking</span>
          <span className="hidden text-xs text-slate-500 sm:block">Meeting tasks, AI suggestions, and follow-up visibility</span>
        </span>
      </Link>
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => (open ? closeNotifications() : setOpen(true))}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50"
            aria-label="Notifications"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M15 17H9m10-1.8c-.9-.9-1.4-2.1-1.4-3.4V9.5a5.6 5.6 0 0 0-11.2 0v2.3c0 1.3-.5 2.5-1.4 3.4L4 16h16l-1-0.8ZM13.8 19a2 2 0 0 1-3.6 0"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
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
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((visible) => !visible)}
            aria-label="Open account menu"
            className="rounded-full focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <UserAvatar user={user} />
          </button>
          {profileOpen && (
            <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
              <Link to="/profile" onClick={() => setProfileOpen(false)} className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Profile
              </Link>
              <button
                type="button"
                onClick={() => {
                  setPasswordOpen(true);
                  setProfileOpen(false);
                }}
                className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Change password
              </button>
              <button
                type="button"
                onClick={logout}
                className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-rose-700 hover:bg-rose-50"
              >
                Logout
              </button>
            </div>
          )}
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-900">{user?.full_name || user?.email}</p>
          <p className="text-xs text-slate-500">{user?.role}</p>
        </div>
      </div>
      {passwordOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/30 px-4">
          <form onSubmit={changePassword} className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Change password</h2>
              <button type="button" onClick={() => setPasswordOpen(false)} className="text-sm font-medium text-slate-500 hover:text-slate-900">Close</button>
            </div>
            {passwordError && <div className="mt-3 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{passwordError}</div>}
            {passwordSuccess && <div className="mt-3 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{passwordSuccess}</div>}
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Current password
              <input type="password" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={passwordForm.current_password} onChange={(event) => setPasswordForm({ ...passwordForm, current_password: event.target.value })} />
            </label>
            <label className="mt-3 block text-sm font-medium text-slate-700">
              New password
              <input type="password" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={passwordForm.new_password} onChange={(event) => setPasswordForm({ ...passwordForm, new_password: event.target.value })} />
            </label>
            <button className="mt-4 w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">Save password</button>
          </form>
        </div>
      )}
    </header>
  );
}
