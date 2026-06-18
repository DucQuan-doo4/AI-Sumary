import { Outlet } from "react-router-dom";

import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="md:flex">
        <Sidebar />
        <main className="min-w-0 flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
