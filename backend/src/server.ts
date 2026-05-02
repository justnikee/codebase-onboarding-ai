/**
 * Express Server
 * Main entry point for the AI Onboarding Assistant backend
 */

import "dotenv/config";
import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import compression from "compression";
import analyzeRoutes from "./routes/analyze.js";
import chatRoutes from "./routes/chat.js";
import insightsRoutes from "./routes/insights.js";
import progressRoutes from "./routes/progress.js";
import uploadRoutes from "./routes/upload.js";
import authRoutes from "./routes/auth.js";
import historyRoutes from "./routes/history.js";
import { extractUser } from "./middleware/auth.js";
import { AppError } from "./types/index.js";
import { validateEnvironment } from "./utils/validators.js";

// Validate required environment variables
try {
  validateEnvironment();
} catch (error) {
  console.error("Environment validation failed:", error);
  process.exit(1);
}

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);

// Gzip/deflate all responses — biggest single perf win for JSON APIs
app.use(compression());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`,
    );
  });
  next();
});

// Attach userId + githubToken to every request
app.use(extractUser);

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/analyze", analyzeRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/insights", insightsRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/history", historyRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.path,
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
  }

  // Handle validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  // Handle unexpected errors
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log("=".repeat(50));
  console.log("🚀 AI Developer Onboarding Assistant");
  console.log("=".repeat(50));
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`,
  );
  console.log("=".repeat(50));
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  process.exit(0);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

export default app;

// Made with Bob
