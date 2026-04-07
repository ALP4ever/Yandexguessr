import { z } from "zod";

export const gameModeSchema = z.enum(["YAKUTSK", "SAKHA"]);

export const roundSubmissionSchema = z.object({
  roundNumber: z.number().int().min(1).max(5),
  score: z.number().int().min(0).max(5000),
  distanceKm: z.number().nonnegative(),
});

export const createGameSchema = z.object({
  playerName: z
    .string()
    .trim()
    .min(2, "Player name is too short")
    .max(24, "Player name is too long"),
  mode: gameModeSchema,
  rounds: z.array(roundSubmissionSchema).min(1).max(5),
}).superRefine((payload, ctx) => {
  const seenRounds = new Set<number>();

  for (const round of payload.rounds) {
    if (seenRounds.has(round.roundNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Round ${round.roundNumber} is duplicated`,
        path: ["rounds"],
      });
      return;
    }

    seenRounds.add(round.roundNumber);
  }
});

export const leaderboardQuerySchema = z.object({
  mode: gameModeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type GameMode = z.infer<typeof gameModeSchema>;
export type RoundSubmission = z.infer<typeof roundSubmissionSchema>;
export type CreateGameInput = z.infer<typeof createGameSchema>;
export type LeaderboardQuery = z.infer<typeof leaderboardQuerySchema>;

export const normalizePlayerName = (value: string) => value.trim().replace(/\s+/g, " ");

export const toPlayerKey = (value: string) => normalizePlayerName(value).toLowerCase();

export const calculateGameSummary = (rounds: RoundSubmission[]) => {
  const totalScore = rounds.reduce((sum, round) => sum + round.score, 0);
  const totalDistanceKm = Number(rounds.reduce((sum, round) => sum + round.distanceKm, 0).toFixed(3));
  const averageScore = rounds.length > 0 ? Math.round(totalScore / rounds.length) : 0;

  return {
    totalScore,
    totalDistanceKm,
    averageScore,
  };
};
