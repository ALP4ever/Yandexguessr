import "dotenv/config";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ZodError } from "zod";
import { env } from "./lib/env.js";
import { prisma } from "./lib/prisma.js";
import gamesRouter from "./routes/games.js";
import leaderboardRouter from "./routes/leaderboard.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const clientDistPath = resolve(__dirname, "../../dist");

const app = express();

app.use(
  cors({
    origin:
      env.CORS_ORIGIN === "*"
        ? true
        : env.CORS_ORIGIN.split(",")
            .map((value) => value.trim())
            .filter(Boolean),
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

app.get("/api/health", async (_req, res, next) => {
  try {
    let databaseOk = false;

    if (env.DATABASE_URL) {
      await prisma.$queryRawUnsafe("SELECT 1");
      databaseOk = true;
    }

    res.json({
      status: "ok",
      databaseConfigured: Boolean(env.DATABASE_URL),
      databaseOk,
      serveStatic: env.SERVE_STATIC,
    });
  } catch (error) {
    next(error);
  }
});

app.use("/api/games", gamesRouter);
app.use("/api/leaderboard", leaderboardRouter);

if (env.SERVE_STATIC && existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      next();
      return;
    }

    res.sendFile(join(clientDistPath, "index.html"));
  });
}

app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    res.status(404).json({ message: "Route not found" });
    return;
  }

  res.status(404).json({
    message: "Frontend build not found. Build the client or set SERVE_STATIC=false for API-only mode.",
  });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      message: "Validation error",
      issues: error.issues,
    });
    return;
  }

  console.error(error);
  res.status(500).json({
    message: "Internal server error",
  });
});

const server = app.listen(env.PORT, env.HOST, () => {
  console.log(`Server listening on http://${env.HOST}:${env.PORT}`);
});

const shutdown = async () => {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGINT", () => {
  void shutdown();
});

process.on("SIGTERM", () => {
  void shutdown();
});
