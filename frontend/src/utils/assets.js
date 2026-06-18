export function resolveAssetUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
  if (apiUrl.startsWith("http://") || apiUrl.startsWith("https://")) {
    return `${apiUrl}${path}`;
  }
  return path;
}
