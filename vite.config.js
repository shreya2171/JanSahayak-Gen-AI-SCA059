import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The dev server forwards every /api request to the FastAPI backend,
// so the browser sees one origin and no CORS problems occur.
const backend = process.env.VITE_BACKEND_URL || "http://localhost:8000";
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { "/api": backend } },
  preview: { port: 5173, proxy: { "/api": backend } },
});
