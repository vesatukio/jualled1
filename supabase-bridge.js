/* DUTA LED - Supabase analytics bridge
 * Katalog tetap menggunakan Google Apps Script sebagai sumber utama.
 * Supabase dipakai untuk analytics/order, bukan mengganti sumber katalog.
 */
(() => {
  "use strict";
  const SUPABASE_URL = "https://opgeeqnucxrdqcgwcuge.supabase.co";
  const SUPABASE_KEY = "sb_publishable_uqah55SK8ZjyugWprFnFMA_QnyVdCLA";
  const originalFetch = window.fetch.bind(window);

  // Visitor analytics: anonymous visitor/session IDs, no IP address stored.
  async function trackVisitor() {
    try {
      if (location.pathname.includes("admin.html")) return;
      const visitorKey = "DUTA_VISITOR_ID_V1", sessionKey = "DUTA_SESSION_ID_V1";
      let visitorId = localStorage.getItem(visitorKey), sessionId = sessionStorage.getItem(sessionKey);
      if (!visitorId) {
        visitorId = crypto.randomUUID();
        localStorage.setItem(visitorKey, visitorId);
      }
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem(sessionKey, sessionId);
      }
      const device = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
        ? "mobile"
        : /Tablet/i.test(navigator.userAgent) ? "tablet" : "desktop";
      await originalFetch(SUPABASE_URL + "/rest/v1/visitor_logs", {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: "Bearer " + SUPABASE_KEY,
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          visitor_id: visitorId,
          session_id: sessionId,
          path: location.pathname + location.search,
          title: document.title || null,
          referrer: document.referrer || null,
          device_type: device,
          user_agent: navigator.userAgent.slice(0, 300)
        })
      });
    } catch (error) {
      console.warn("Visitor analytics:", error?.message || error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(trackVisitor, 300));
  } else {
    setTimeout(trackVisitor, 300);
  }
})();
