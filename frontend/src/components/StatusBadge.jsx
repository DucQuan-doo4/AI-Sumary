const styles = {
  TODO: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  DONE: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-rose-100 text-rose-700",
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  HIGH: "bg-red-100 text-red-700",
  AI: "bg-violet-100 text-violet-700",
  MANUAL: "bg-cyan-100 text-cyan-700",
};

export default function StatusBadge({ value }) {
  return (
    <span className={`inline-flex rounded px-2 py-1 text-xs font-semibold ${styles[value] || "bg-slate-100 text-slate-700"}`}>
      {value || "N/A"}
    </span>
  );
}
