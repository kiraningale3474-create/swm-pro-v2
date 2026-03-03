import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Middleware to protect routes and require authentication
 */
export async function protectRoute(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    (req as any).user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Middleware to require admin role
 */
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = (req as any).user;

    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Middleware to require worker role
 */
export async function requireWorker(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = (req as any).user;

    if (!user || user.role !== "WORKER") {
      return res.status(403).json({ error: "Forbidden: Worker access required" });
    }

    next();
  } catch (error) {
    console.error("Worker middleware error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Middleware to validate GPS data
 */
export function validateGPS(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { latitude, longitude, accuracy } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "Missing GPS coordinates" });
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: "Invalid GPS coordinates" });
    }

    // Check accuracy
    if (accuracy && accuracy > 100) {
      return res.status(400).json({
        error: "GPS accuracy too low. Please try again.",
      });
    }

    next();
  } catch (error) {
    console.error("GPS validation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Middleware to rate limit requests
 */
const requestCounts = new Map<string, number[]>();

export function rateLimit(
  windowMs: number = 60000,
  maxRequests: number = 100
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || "unknown";
    const now = Date.now();

    if (!requestCounts.has(ip)) {
      requestCounts.set(ip, []);
    }

    const timestamps = requestCounts.get(ip)!;
    const recentRequests = timestamps.filter((t) => now - t < windowMs);

    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({ error: "Too many requests" });
    }

    recentRequests.push(now);
    requestCounts.set(ip, recentRequests);

    next();
  };
}

/**
 * Middleware to log API requests
 */
export function logRequest(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
    );
  });

  next();
}
