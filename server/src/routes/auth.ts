import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.ts";
import { signToken, cookieOptions, COOKIE_NAME, requireAuth } from "../lib/auth.ts";

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;

router.post("/signup", async (req, res) => {
  const { email, username, password } = req.body ?? {};
  if (!EMAIL_RE.test(email ?? "")) {
    return res.status(400).json({ error: "A valid email is required" });
  }
  if (!USERNAME_RE.test(username ?? "")) {
    return res
      .status(400)
      .json({ error: "Username must be 3-30 characters (letters, numbers, underscores)" });
  }
  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  const normalized = username.toLowerCase();
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username: normalized }] },
  });
  if (existing) {
    return res.status(409).json({
      error: existing.email === email ? "Email already registered" : "Username already taken",
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, username: normalized, passwordHash },
    select: { id: true, email: true, username: true, createdAt: true },
  });

  const token = signToken(user.id);
  res.cookie(COOKIE_NAME, token, cookieOptions);
  res.status(201).json({ user, token });
});

router.post("/login", async (req, res) => {
  // `identifier` may be an email or a username; `email` still works for
  // backwards compatibility.
  const { identifier, email, password } = req.body ?? {};
  const id = identifier ?? email;
  if (!id || !password) {
    return res.status(400).json({ error: "Email/username and password are required" });
  }

  const user = await prisma.user.findFirst({
    where: id.includes("@") ? { email: id } : { username: id.toLowerCase() },
  });
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signToken(user.id);
  res.cookie(COOKIE_NAME, token, cookieOptions);
  res.json({
    user: { id: user.id, email: user.email, username: user.username, createdAt: user.createdAt },
    token,
  });
});

router.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: undefined });
  res.json({ ok: true });
});

// Session validation — lets the frontend restore auth state on page load.
router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, username: true, createdAt: true },
  });
  if (!user) return res.status(401).json({ error: "User no longer exists" });
  res.json({ user });
});

export default router;
