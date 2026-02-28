import express from "express";
import cors from "cors";
import helmet from "helmet";

import { authRouter } from "./routes/auth";
import { aiRouter } from "./routes/ai";
import { chatRouter } from "./routes/chat";
import { reviewRouter } from "./routes/review";
import { householdRouter } from "./routes/household";
import { accountRouter } from "./routes/account";
import { stripeRouter } from "./routes/stripe";
import { webhooksRouter } from "./routes/webhooks";
import { adminRouter } from "./routes/admin";
import { errorHandler } from "./middleware/errorHandler";
import { startCronJobs } from "./cron/digest";

const app = express();
const PORT = process.env.PORT || 3001;

// ── Stripe webhook must receive the raw body for signature verification ──────
// Mount this BEFORE express.json() so the raw Buffer is preserved.
app.use("/webhooks/stripe", express.raw({ type: "application/json" }));

// ── Global middleware ─────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = [
        process.env.APP_URL,
        "http://localhost:3000",
        "http://localhost:8081", // Expo dev server
        "https://kinpath-web.vercel.app", // Keep during transition
        "https://kinpath.family",
        "https://www.kinpath.family",
      ].filter(Boolean);

      // Allow requests with no origin (mobile apps, Postman, cURL)
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  })
);
app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/auth", authRouter);
app.use("/ai", aiRouter);
app.use("/chat", chatRouter);
app.use("/review", reviewRouter);
app.use("/household", householdRouter);
app.use("/account", accountRouter);
app.use("/stripe", stripeRouter);
app.use("/webhooks", webhooksRouter);
app.use("/admin", adminRouter);

// ── Error handler (must be last) ──────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`KinPath API running on port ${PORT}`);
  startCronJobs();
});

export default app;
