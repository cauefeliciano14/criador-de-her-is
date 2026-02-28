import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Run data audit in DEV mode (console output)
import "./data/index.ts";
import { runSpellCanonAudit } from "./dev/runSpellCanonAudit";

if (import.meta.env.DEV) {
  runSpellCanonAudit();
}

// Handle deploy races where HTML points to a newer chunk version than the cached app shell.
// Vite dispatches `vite:preloadError` for failed dynamic imports. We force a single hard reload
// to recover from stale chunk URLs without trapping users in a reload loop.
if (typeof window !== "undefined") {
  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();

    const reloadKey = "vite-preload-reload-attempted";
    const alreadyReloaded = window.sessionStorage.getItem(reloadKey) === "1";

    if (alreadyReloaded) {
      console.error("Failed to recover from dynamic import preload error.", event);
      return;
    }

    window.sessionStorage.setItem(reloadKey, "1");
    window.location.reload();
  });

  window.addEventListener("load", () => {
    window.sessionStorage.removeItem("vite-preload-reload-attempted");
  });
}

createRoot(document.getElementById("root")!).render(<App />);
