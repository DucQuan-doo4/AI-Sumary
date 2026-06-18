import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import axiosClient from "../api/axiosClient.js";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", full_name: "" });
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await axiosClient.post("/auth/register", { ...form, role: "MEMBER" });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.detail || "Register failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Create account</h1>
        {error && <div className="mt-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
        <label className="mt-5 block text-sm font-medium text-slate-700">Full name<input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></label>
        <label className="mt-4 block text-sm font-medium text-slate-700">Email<input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label className="mt-4 block text-sm font-medium text-slate-700">Password<input type="password" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        <button className="mt-6 w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">Register</button>
        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account? <Link className="font-medium text-slate-900 hover:underline" to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
