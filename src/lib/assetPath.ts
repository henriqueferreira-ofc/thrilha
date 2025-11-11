export function withBasePath(path: string) {
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  const base = (import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
  return `${base}${normalized}`;
}
