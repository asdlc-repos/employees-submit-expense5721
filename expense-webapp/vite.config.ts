import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { astryxStylex } from "@astryxdesign/build/vite";

// No `base` — this app is served at its own gateway host root.
export default defineConfig({
  plugins: [...astryxStylex(), react()],
});
