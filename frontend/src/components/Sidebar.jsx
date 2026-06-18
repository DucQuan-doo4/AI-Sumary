import { NavLink } from "react-router-dom";

const items = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/meetings", label: "Meetings" },
  { to: "/tasks", label: "Tasks" },
  { to: "/notifications", label: "Notifications" },
  { to: "/users", label: "Users" },
];

export default function Sidebar() {
  return (
    <aside className="border-b border-slate-200 bg-white md:min-h-screen md:w-64 md:border-b-0 md:border-r">
      <nav className="flex gap-2 overflow-x-auto p-3 md:flex-col md:p-4">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium",
                isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              ].join(" ")
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
