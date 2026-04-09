import type { GameMode } from "./gameTypes.ts";

export type GameRoundPayload = {
  roundNumber: number;
  score: number;
  distanceKm: number;
};

export type SubmitGamePayload = {
  playerName: string;
  mode: GameMode;
  rounds: GameRoundPayload[];
};

export type SubmitGameResponse = {
  id: string;
  playerName: string;
  mode: GameMode;
  totalScore: number;
  averageScore: number;
  totalDistanceKm: number;
  playedAt: string;
};

export type LeaderboardEntry = {
  id: string;
  playerName: string;
  mode: GameMode;
  totalScore: number;
  averageScore: number;
  totalDistanceKm: number;
  playedAt: string;
};

export type LeaderboardResponse = {
  items: LeaderboardEntry[];
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ?? "";

const buildApiUrl = (path: string) => `${API_BASE_URL}${path}`;

const parseJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const data = (await response.json()) as { message?: string };
      if (data.message) {
        message = data.message;
      }
    } catch {
      // Ignore JSON parsing errors and fall back to the generic message.
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
};

export const submitGameResult = async (payload: SubmitGamePayload) =>
  parseJson<SubmitGameResponse>(
    await fetch(buildApiUrl("/api/games"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
  );

export const fetchLeaderboard = async (options: { mode?: GameMode; limit?: number } = {}) => {
  const params = new URLSearchParams();

  if (options.mode) {
    params.set("mode", options.mode);
  }

  if (options.limit) {
    params.set("limit", String(options.limit));
  }

  const query = params.toString();
  const path = query ? `/api/leaderboard?${query}` : "/api/leaderboard";
  return parseJson<LeaderboardResponse>(await fetch(buildApiUrl(path)));
};
