import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/game/",
  plugins: [react()],
  server: {
    allowedHosts: ["192.168.1.146.sslip.io"],
  },
});
