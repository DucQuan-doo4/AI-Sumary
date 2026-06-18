import { resolveAssetUrl } from "../utils/assets.js";

export default function UserAvatar({ user, size = "normal" }) {
  const imageUrl = resolveAssetUrl(user?.avatar_url);
  const initials = (user?.full_name || user?.email || "U").slice(0, 2).toUpperCase();
  const sizeClass = size === "large" ? "h-24 w-24 text-2xl" : size === "small" ? "h-6 w-6 text-xs" : "h-9 w-9 text-sm";

  if (imageUrl) {
    return <img src={imageUrl} alt="" className={`${sizeClass} rounded-full object-cover ring-1 ring-slate-200`} />;
  }

  return (
    <div className={`${sizeClass} flex items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-700`}>
      {initials}
    </div>
  );
}
