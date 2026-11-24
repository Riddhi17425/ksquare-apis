import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { pingDb } from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { globalLimiter } from "./middleware/rateLimiters.js";
import routes from "./routes/index.js";
import { UPLOAD_ROOT } from "./services/image.service.js";

export const app = express();

// The Next.js server runs on the same host and forwards the real client IP in X-Forwarded-For.
// Only loopback peers are trusted for that header, so remote callers cannot spoof their IP.
app.set("trust proxy", "loopback");

app.use(helmet());
app.use(cors({ origin: env.corsOrigins, methods: ["GET", "POST", "PUT", "PATCH", "DELETE"], maxAge: 600 }));

// Uploaded images are public, read-only, and embeddable from the website/admin origins.
app.use(
  "/uploads",
  express.static(UPLOAD_ROOT, {
    index: false,
    dotfiles: "deny",
    maxAge: "7d",
    immutable: true, // file names are random and never reused
    setHeaders: (res) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("X-Content-Type-Options", "nosniff");
    },
  }),
);
app.use(morgan(env.isProd ? "combined" : "dev"));
app.use(express.json({ limit: "100kb" }));

app.get("/health", async (_req, res) => {
  try {
    await pingDb();
    res.json({ status: "ok" });
  } catch {
    res.status(503).json({ status: "database unavailable" });
  }
});

app.use("/api/v1", globalLimiter, routes);

app.use(notFound);
app.use(errorHandler);
