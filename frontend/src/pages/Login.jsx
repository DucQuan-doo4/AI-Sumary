import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import axiosClient from "../api/axiosClient.js";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "admin@example.com", password: "admin123" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await axiosClient.post("/auth/login", form);
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("current_user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Sign in</h1>
        <p className="mt-1 text-sm text-slate-500">Access meeting action tracking.</p>
        {error && <div className="mt-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
        <label className="mt-5 block text-sm font-medium text-slate-700">
          Email
          <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Password
          <input type="password" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>
        <button disabled={loading} className="mt-6 w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60">
          {loading ? "Signing in..." : "Login"}
        </button>
        <p className="mt-4 text-center text-sm text-slate-500">
          No account? <Link className="font-medium text-slate-900 hover:underline" to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}
