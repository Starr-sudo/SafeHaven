const stripTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

const KNOWN_BACKEND_URL = "https://safehaven-ute4.onrender.com";

const isSafeHavenFrontendHost = (host: string): boolean => {
  return (
    host === "project-safehaven.vercel.app" ||
    /^project-safehaven-.*\.vercel\.app$/i.test(host)
  );
};

const getHostname = (value: string): string | null => {
  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
};

const resolveApiBaseUrl = (): string => {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim();

  if (configuredUrl) {
    const normalizedConfiguredUrl = stripTrailingSlash(configuredUrl);
    const configuredHost = getHostname(normalizedConfiguredUrl);

    // Guard against accidentally pointing VITE_API_URL at the Vercel frontend URL.
    if (configuredHost && isSafeHavenFrontendHost(configuredHost)) {
      console.warn(
        `VITE_API_URL points to frontend host (${configuredHost}). Using ${KNOWN_BACKEND_URL} instead.`
      );
      return KNOWN_BACKEND_URL;
    }

    return normalizedConfiguredUrl;
  }

  if (import.meta.env.DEV) {
    return "http://localhost:3001";
  }

  const currentHost =
    typeof window !== "undefined" ? window.location.hostname : "";

  if (isSafeHavenFrontendHost(currentHost)) {
    return KNOWN_BACKEND_URL;
  }

  console.warn(
    "VITE_API_URL is not set. Falling back to same-origin /api requests. Set VITE_API_URL in your frontend deployment for a separate backend."
  );

  // In production, fall back to same-origin so deployments can use rewrites/proxies.
  return "";
};

export const API_BASE_URL = resolveApiBaseUrl();
