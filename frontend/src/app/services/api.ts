const stripTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

const resolveApiBaseUrl = (): string => {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim();

  if (configuredUrl) {
    return stripTrailingSlash(configuredUrl);
  }

  if (import.meta.env.DEV) {
    return "http://localhost:3001";
  }

  console.warn(
    "VITE_API_URL is not set. Falling back to same-origin /api requests. Set VITE_API_URL in your frontend deployment for a separate backend."
  );

  // In production, fall back to same-origin so deployments can use rewrites/proxies.
  return "";
};

export const API_BASE_URL = resolveApiBaseUrl();
