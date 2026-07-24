import { Router } from "express";
import { prisma } from "../lib/prisma.ts";
import { requireAuth } from "../lib/auth.ts";

const router = Router();
router.use(requireAuth);

const FREQUENCIES = ["DAILY", "WEEKLY"];

function validateHabitInput(body, { partial = false } = {}) {
  const { name, description, frequency } = body ?? {};
  const errors = [];

  if (!partial || name !== undefined) {
    if (typeof name !== "string" || !name.trim()) errors.push("name is required");
    else if (name.trim().length > 100) errors.push("name must be 100 characters or fewer");
  }
  if (description !== undefined && description !== null && typeof description !== "string") {
    errors.push("description must be a string");
  }
  if ((!partial && frequency !== undefined) || (partial && frequency !== undefined)) {
    if (!FREQUENCIES.includes(frequency)) errors.push("frequency must be DAILY or WEEKLY");
  }
  return errors;
}

router.post("/", async (req, res) => {
  const errors = validateHabitInput(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join("; ") });

  const { name, description, frequency } = req.body;
  const habit = await prisma.habit.create({
    data: {
      userId: req.userId,
      name: name.trim(),
      description: description?.trim() || null,
      frequency: frequency ?? "DAILY",
    },
  });
  res.status(201).json({ habit });
});

// Returns habits with their logs from the last 30 days so the dashboard can
// render the completion grid without a second request.
router.get("/", async (req, res) => {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 30);
  since.setUTCHours(0, 0, 0, 0);

  const habits = await prisma.habit.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "asc" },
    include: {
      logs: {
        where: { date: { gte: since } },
        orderBy: { date: "asc" },
        select: { id: true, date: true, status: true, markedAt: true },
      },
    },
  });
  res.json({ habits });
});

router.put("/:id", async (req, res) => {
  const errors = validateHabitInput(req.body, { partial: true });
  if (errors.length) return res.status(400).json({ error: errors.join("; ") });

  // Scoping the lookup by userId ensures users can only touch their own habits.
  const existing = await prisma.habit.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) return res.status(404).json({ error: "Habit not found" });

  const { name, description, frequency } = req.body;
  const habit = await prisma.habit.update({
    where: { id: existing.id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(frequency !== undefined && { frequency }),
    },
  });
  res.json({ habit });
});

router.delete("/:id", async (req, res) => {
  const existing = await prisma.habit.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) return res.status(404).json({ error: "Habit not found" });

  await prisma.habit.delete({ where: { id: existing.id } });
  res.json({ ok: true });
});

export default router;
