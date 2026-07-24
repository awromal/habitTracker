import { Router } from "express";
import { prisma } from "../lib/prisma.ts";
import { requireAuth } from "../lib/auth.ts";

const router = Router();
router.use(requireAuth);

function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

// GET /api/analytics — one data point per day for the last 30 days, ready to
// feed straight into a chart:
//   { date: "2026-07-18", completed: 2, active: 3, rate: 67 }
// "active" is how many habits existed on that day, so the rate stays fair for
// habits created partway through the window.
router.get("/", async (req, res) => {
  const days = 30;
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  const habits = await prisma.habit.findMany({
    where: { userId: req.userId },
    select: { id: true, createdAt: true },
  });

  const logs = await prisma.habitLog.findMany({
    where: {
      habit: { userId: req.userId },
      date: { gte: start, lte: end },
      status: "COMPLETED",
    },
    select: { date: true },
  });

  // Count completions per calendar day.
  const completedByDay = new Map();
  for (const log of logs) {
    const key = toISODate(log.date);
    completedByDay.set(key, (completedByDay.get(key) ?? 0) + 1);
  }

  const series = [];
  for (let i = 0; i < days; i++) {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + i);
    const key = toISODate(day);

    // A habit counts as active from the day it was created.
    const endOfDay = new Date(day);
    endOfDay.setUTCHours(23, 59, 59, 999);
    const active = habits.filter((h) => h.createdAt <= endOfDay).length;

    const completed = completedByDay.get(key) ?? 0;
    series.push({
      date: key,
      completed,
      active,
      rate: active > 0 ? Math.round((completed / active) * 100) : 0,
    });
  }

  const totalCompleted = series.reduce((sum, d) => sum + d.completed, 0);
  res.json({
    series,
    summary: {
      days,
      totalCompleted,
      habitCount: habits.length,
      averageRate: Math.round(series.reduce((s, d) => s + d.rate, 0) / days),
    },
  });
});

export default router;
