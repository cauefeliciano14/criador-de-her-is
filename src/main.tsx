import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Run data audit in DEV mode (console output)
import "./data/index.ts";
import { runSpellCanonAudit } from "./dev/runSpellCanonAudit";

if (import.meta.env.DEV) {
  runSpellCanonAudit();
}

createRoot(document.getElementById("root")!).render(<App />);
