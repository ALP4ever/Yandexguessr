import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { calculateGameSummary, createGameSchema, normalizePlayerName, toPlayerKey } from "../lib/contracts.js";

const router = Router();

router.post("/", async (req, res, next) => {
  try {
    const payload = createGameSchema.parse(req.body);
    const playerName = normalizePlayerName(payload.playerName);
    const playerKey = toPlayerKey(playerName);
    const summary = calculateGameSummary(payload.rounds);

    const player = await prisma.player.upsert({
      where: {
        normalizedName: playerKey,
      },
      update: {
        name: playerName,
      },
      create: {
        name: playerName,
        normalizedName: playerKey,
      },
    });

    const game = await prisma.game.create({
      data: {
        playerId: player.id,
        mode: payload.mode,
        totalScore: summary.totalScore,
        averageScore: summary.averageScore,
        totalDistanceKm: summary.totalDistanceKm,
        rounds: {
          create: payload.rounds
            .slice()
            .sort((left, right) => left.roundNumber - right.roundNumber)
            .map((round) => ({
              roundNumber: round.roundNumber,
              score: round.score,
              distanceKm: round.distanceKm,
            })),
        },
      },
    });

    res.status(201).json({
      id: game.id,
      playerName: player.name,
      mode: game.mode,
      totalScore: game.totalScore,
      averageScore: game.averageScore,
      totalDistanceKm: game.totalDistanceKm,
      playedAt: game.playedAt.toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
