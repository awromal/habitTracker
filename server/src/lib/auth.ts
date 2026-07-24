import "dotenv/config";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not set in .env");

export const COOKIE_NAME = "token";

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET!, { expiresIn: "7d" });
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,   // 'as const' required — express types reject plain string
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// Reads the JWT from the HTTP-only cookie (or an Authorization: Bearer header
// as a fallback) and puts the user id on req.userId.
export function requireAuth(req, res, next) {
  let token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    const header = req.headers.authorization;
    if (header?.startsWith("Bearer ")) token = header.slice(7);
  }
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const payload = jwt.verify(token, JWT_SECRET!) as jwt.JwtPayload;
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
