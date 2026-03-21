import { readFile } from "node:fs/promises";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const apiKeyFilePath = path.resolve(__dirname, "api-key.txt");

const apiKeyBridgePlugin = () => ({
  name: "api-key-bridge",
  configureServer(server: any) {
    server.middlewares.use("/api-key.txt", async (_req: any, res: any) => {
      try {
        const apiKey = await readFile(apiKeyFilePath, "utf8");
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.end(apiKey);
      } catch {
        res.statusCode = 500;
        res.end("Unable to read api-key.txt");
      }
    });
  },
  async generateBundle() {
    const apiKey = await readFile(apiKeyFilePath, "utf8");
    this.emitFile({
      type: "asset",
      fileName: "api-key.txt",
      source: apiKey,
    });
  },
});

export default defineConfig({
  plugins: [react(), apiKeyBridgePlugin()],
  server: {
    port: 5173,
  },
});
