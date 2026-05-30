/**
 * Google Analytics 4 (gtag.js) helper.
 *
 * Set VITE_GA_MEASUREMENT_ID (e.g. "G-XXXXXXXXXX") in the project env.
 * Tracking is automatically disabled on Lovable preview/sandbox hosts so
 * the production property only receives real visitor traffic.
 */

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function isTrackableHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  // Skip localhost and Lovable preview/sandbox domains.
  if (host === "localhost" || host === "127.0.0.1") return false;
  if (host.endsWith(".sandbox.lovable.dev")) return false;
  if (host.includes("id-preview--")) return false;
  return true;
}

let initialized = false;

export function initAnalytics(): void {
  if (initialized) return;
  if (!MEASUREMENT_ID) return;
  if (!isTrackableHost()) return;
  if (typeof window === "undefined" || typeof document === "undefined") return;

  initialized = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag("js", new Date());
  // Disable automatic page_view — the SPA router fires them via trackPageView.
  window.gtag("config", MEASUREMENT_ID, { send_page_view: false });
}

export function trackPageView(path: string, title?: string): void {
  if (!MEASUREMENT_ID || !window.gtag) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: title ?? document.title,
  });
}

export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (!MEASUREMENT_ID || !window.gtag) return;
  window.gtag("event", name, params ?? {});
}
