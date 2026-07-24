import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.ts";
import habitRoutes from "./routes/habits.ts";
import logRoutes from "./routes/logs.ts";
import analyticsRoutes from "./routes/analytics.ts";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173", // Vite dev server (Phase 3)
    credentials: true, // allow the auth cookie
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/analytics", analyticsRoutes);

// In production the API also serves the built client, so the app lives on a
// single origin and the sameSite=lax auth cookie works without CORS.
if (process.env.NODE_ENV === "production") {
  const clientDist = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../client/dist"
  );
  app.use(express.static(clientDist));
  // SPA fallback: any GET that isn't an API route gets index.html.
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// Central error handler — async route errors land here via Express 5.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
