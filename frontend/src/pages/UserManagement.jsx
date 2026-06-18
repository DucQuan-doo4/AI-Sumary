import { useEffect, useState } from "react";

import axiosClient from "../api/axiosClient.js";
import UserAvatar from "../components/UserAvatar.jsx";

const emptyCreateForm = {
  email: "",
  password: "",
  full_name: "",
  role: "MEMBER",
  department: "",
  room: "",
  personal_info: "",
  education: "",
};

export default function UserManagement() {
  const storedUser = JSON.parse(localStorage.getItem("current_user") || "null");
  const [user, setUser] = useState(storedUser);
  const [users, setUsers] = useState([]);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setError("");
    const meRes = await axiosClient.get("/auth/me");
    setUser(meRes.data);
    localStorage.setItem("current_user", JSON.stringify(meRes.data));
    const usersRes = await axiosClient.get("/users");
    setUsers(usersRes.data);
  };

  useEffect(() => {
    load().catch((err) => setError(err.response?.data?.detail || "Failed to load users"));
  }, []);

  if (user?.role !== "ADMIN") {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        User Management is available only for ADMIN users.
      </div>
    );
  }

  const createUser = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    try {
      await axiosClient.post("/users", {
        ...createForm,
        department: createForm.department || null,
        room: createForm.room || null,
        personal_info: createForm.personal_info || null,
        education: createForm.education || null,
      });
      setCreateForm(emptyCreateForm);
      setShowCreateForm(false);
      setSuccess("Account created.");
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create account");
    }
  };

  const startEdit = async (item) => {
    setError("");
    const { data } = await axiosClient.get(`/users/${item.id}/profile`);
    setEditingUser(data);
    setEditForm({
      full_name: data.full_name || "",
      role: data.role,
      department: data.department || "",
      room: data.room || "",
      personal_info: data.personal_info || "",
      education: data.education || "",
      is_active: data.is_active,
    });
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    try {
      await axiosClient.patch(`/users/${editingUser.id}/profile`, {
        ...editForm,
        department: editForm.department || null,
        room: editForm.room || null,
        personal_info: editForm.personal_info || null,
        education: editForm.education || null,
      });
      setEditingUser(null);
      setSuccess("Profile updated.");
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update profile");
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">User Management</h1>
      {error && <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      {success && <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowCreateForm((visible) => !visible)}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          {showCreateForm ? "Close create account" : "Create account"}
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={createUser} className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">Create account</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Field label="Email" value={createForm.email} onChange={(value) => setCreateForm({ ...createForm, email: value })} />
            <Field label="Password" type="password" value={createForm.password} onChange={(value) => setCreateForm({ ...createForm, password: value })} />
            <Select label="Role" value={createForm.role} options={["MEMBER", "MANAGER", "ADMIN"]} onChange={(value) => setCreateForm({ ...createForm, role: value })} />
            <Field label="Full name" value={createForm.full_name} onChange={(value) => setCreateForm({ ...createForm, full_name: value })} />
            <Field label="Department" value={createForm.department} onChange={(value) => setCreateForm({ ...createForm, department: value })} />
            <Field label="Room" value={createForm.room} onChange={(value) => setCreateForm({ ...createForm, room: value })} />
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <TextArea label="Personal information" value={createForm.personal_info} onChange={(value) => setCreateForm({ ...createForm, personal_info: value })} />
            <TextArea label="Education" value={createForm.education} onChange={(value) => setCreateForm({ ...createForm, education: value })} />
          </div>
          <button className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">Create</button>
        </form>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-slate-900">Users</p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">User</th>
                <th className="py-2">Department</th>
                <th className="py-2">Room</th>
                <th className="py-2">Role</th>
                <th className="py-2">Active</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="py-2">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={item} />
                      <div>
                        <p className="font-medium text-slate-900">{item.full_name || "-"}</p>
                        <p className="text-xs text-slate-500">{item.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2">{item.department || "-"}</td>
                  <td className="py-2">{item.room || "-"}</td>
                  <td className="py-2">{item.role}</td>
                  <td className="py-2">{item.is_active ? "Yes" : "No"}</td>
                  <td className="py-2">
                    <button type="button" onClick={() => startEdit(item)} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium hover:bg-slate-50">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingUser && (
        <form onSubmit={saveProfile} className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">Edit {editingUser.email}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Field label="Full name" value={editForm.full_name} onChange={(value) => setEditForm({ ...editForm, full_name: value })} />
            <Select label="Role" value={editForm.role} options={["MEMBER", "MANAGER", "ADMIN"]} onChange={(value) => setEditForm({ ...editForm, role: value })} />
            <Select label="Active" value={String(editForm.is_active)} options={["true", "false"]} onChange={(value) => setEditForm({ ...editForm, is_active: value === "true" })} />
            <Field label="Department" value={editForm.department} onChange={(value) => setEditForm({ ...editForm, department: value })} />
            <Field label="Room" value={editForm.room} onChange={(value) => setEditForm({ ...editForm, room: value })} />
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <TextArea label="Personal information" value={editForm.personal_info} onChange={(value) => setEditForm({ ...editForm, personal_info: value })} />
            <TextArea label="Education" value={editForm.education} onChange={(value) => setEditForm({ ...editForm, education: value })} />
          </div>
          <div className="mt-4 flex gap-2">
            <button className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">Save</button>
            <button type="button" onClick={() => setEditingUser(null)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <input type={type} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <textarea className="mt-1 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Select({ label, value, options, onChange }) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}
