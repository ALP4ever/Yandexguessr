import type { Bounds, GameMode, SeedLocation } from "./gameTypes.ts";

export const TOTAL_ROUNDS = 5;
export const APP_TITLE = "Sakhaguessr";

export const BOUNDS_BY_MODE: Record<GameMode, Bounds> = {
  YAKUTSK: {
    minLat: 61.95,
    maxLat: 62.1,
    minLng: 129.55,
    maxLng: 129.85,
  },
  SAKHA: {
    minLat: 55.0,
    maxLat: 72.0,
    minLng: 105.0,
    maxLng: 160.0,
  },
};

export const SAKHA_LOCATION_SEEDS: SeedLocation[] = [
  { lat: 62.0272, lng: 129.7326, radiusMeters: 12000 },
  { lat: 61.4844, lng: 129.1481, radiusMeters: 8000 },
  { lat: 56.6546, lng: 124.7203, radiusMeters: 9000 },
  { lat: 58.6031, lng: 125.3894, radiusMeters: 9000 },
  { lat: 59.6483, lng: 112.7415, radiusMeters: 9000 },
  { lat: 60.726, lng: 114.9541, radiusMeters: 9000 },
  { lat: 63.7553, lng: 121.6247, radiusMeters: 7000 },
  { lat: 63.286, lng: 118.3319, radiusMeters: 7000 },
  { lat: 60.3742, lng: 120.435, radiusMeters: 7000 },
  { lat: 58.9681, lng: 126.2871, radiusMeters: 7000 },
  { lat: 61.4626, lng: 128.4747, radiusMeters: 6000 },
];

export const YAKUTSK_LOCATION_SEEDS: SeedLocation[] = [
  { lat: 62.0272, lng: 129.7326, radiusMeters: 2500 },
  { lat: 62.035, lng: 129.675, radiusMeters: 2200 },
  { lat: 62.05, lng: 129.71, radiusMeters: 2200 },
  { lat: 62.01, lng: 129.69, radiusMeters: 2200 },
  { lat: 62.015, lng: 129.765, radiusMeters: 2000 },
  { lat: 61.995, lng: 129.735, radiusMeters: 1800 },
];

export const ALLOWED_PLACE_TYPES = new Set([
  "locality",
  "political",
  "sublocality",
  "neighborhood",
  "administrative_area_level_3",
]);
