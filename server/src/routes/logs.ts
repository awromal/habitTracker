import { Router } from "express";
import { prisma } from "../lib/prisma.ts";
import { requireAuth } from "../lib/auth.ts";

const router = Router();
router.use(requireAuth);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES = ["COMPLETED", "SKIPPED"];

// Toggle a habit's log for a given date.
//   - no log yet            -> create one (default COMPLETED)
//   - log with same status  -> delete it (un-toggle)
//   - log with other status -> switch to the requested status
router.post("/", async (req, res) => {
  const { habitId, date, status = "COMPLETED" } = req.body ?? {};

  if (!habitId) return res.status(400).json({ error: "habitId is required" });
  if (!DATE_RE.test(date ?? "")) {
    return res.status(400).json({ error: "date must be YYYY-MM-DD" });
  }
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ error: "status must be COMPLETED or SKIPPED" });
  }

  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId: req.userId },
  });
  if (!habit) return res.status(404).json({ error: "Habit not found" });

  // @db.Date column — store as UTC midnight so the calendar date is unambiguous.
  const day = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(day.getTime())) {
    return res.status(400).json({ error: "Invalid date" });
  }

  const existing = await prisma.habitLog.findUnique({
    where: { habitId_date: { habitId, date: day } },
  });

  if (existing && existing.status === status) {
    await prisma.habitLog.delete({ where: { id: existing.id } });
    return res.json({ log: null, toggled: "removed" });
  }

  const log = await prisma.habitLog.upsert({
    where: { habitId_date: { habitId, date: day } },
    create: { habitId, date: day, status },
    update: { status, markedAt: new Date() },
  });
  res.json({ log, toggled: existing ? "updated" : "created" });
});

export default router;
