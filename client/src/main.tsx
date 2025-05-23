import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Override default styles to match the design
document.documentElement.style.setProperty("--primary", "207 90% 54%");
document.documentElement.style.setProperty("--primary-foreground", "211 100% 99%");

createRoot(document.getElementById("root")!).render(<App />);
