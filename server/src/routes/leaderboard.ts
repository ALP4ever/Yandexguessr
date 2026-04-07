import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { leaderboardQuerySchema } from "../lib/contracts.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const query = leaderboardQuerySchema.parse(req.query);

    const games = await prisma.game.findMany({
      where: {
        mode: query.mode,
      },
      orderBy: [
        { totalScore: "desc" },
        { totalDistanceKm: "asc" },
        { playedAt: "asc" },
      ],
      include: {
        player: true,
      },
      take: query.limit,
    });

    res.json({
      items: games.map((game) => ({
        id: game.id,
        playerName: game.player.name,
        mode: game.mode,
        totalScore: game.totalScore,
        averageScore: game.averageScore,
        totalDistanceKm: game.totalDistanceKm,
        playedAt: game.playedAt.toISOString(),
      })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
