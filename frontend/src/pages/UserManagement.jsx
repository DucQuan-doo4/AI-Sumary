import { useEffect, useState } from "react";

import axiosClient from "../api/axiosClient.js";

export default function UserManagement() {
  const storedUser = JSON.parse(localStorage.getItem("current_user") || "null");
  const [user, setUser] = useState(storedUser);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    axiosClient.get("/auth/me").then(async (res) => {
      setUser(res.data);
      localStorage.setItem("current_user", JSON.stringify(res.data));
      const usersRes = await axiosClient.get("/users");
      setUsers(usersRes.data);
    });
  }, []);

  if (user?.role !== "ADMIN") {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        User Management is available only for ADMIN users.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">User Management</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-600">Users</p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">ID</th>
                <th className="py-2">Email</th>
                <th className="py-2">Name</th>
                <th className="py-2">Role</th>
                <th className="py-2">Active</th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="py-2">{item.id}</td>
                  <td className="py-2">{item.email}</td>
                  <td className="py-2">{item.full_name || "-"}</td>
                  <td className="py-2">{item.role}</td>
                  <td className="py-2">{item.is_active ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
