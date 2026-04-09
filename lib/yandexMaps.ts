import type { LatLng, PlaceResult } from "./gameTypes.ts";
import { getPlaceTypesFromYandexKind, metersToDelta } from "./mapUtils.ts";
import type { YandexGeoObject, YandexGeocoderMetaData, YandexMapsApi } from "./yandexMapsTypes.ts";

export type {
  YandexEvent,
  YandexGeoObjectCollectionMap,
  YandexGeocodeResponse,
  YandexGeocoderMetaData,
  YandexMapInstance,
  YandexMapsApi,
  YandexPanorama,
  YandexPanoramaPlayer,
  YandexPlacemark,
  YandexPolyline,
} from "./yandexMapsTypes.ts";

declare global {
  interface Window {
    ymaps?: YandexMapsApi;
  }
}

const YANDEX_MAPS_URL = "https://api-maps.yandex.ru/2.1/?lang=ru_RU";

export class StreetViewService {
  constructor(private readonly ymaps: YandexMapsApi) {}

  async getPanorama(request: { location: LatLng; radius: number; source: "OUTDOOR" }) {
    const panoramas = await this.ymaps.panorama.locate([request.location.lat, request.location.lng], {
      radius: request.radius,
      layer: "yandex#panorama",
    });

    if (!panoramas || panoramas.length === 0) {
      return { status: "ZERO_RESULTS" as const };
    }

    const panorama = panoramas[0];
    const position = panorama.getPosition();

    return {
      status: "OK" as const,
      location: { lat: position[0], lng: position[1] },
      panorama,
    };
  }
}

export class PlacesService {
  private readonly nearbyCache = new Map<string, { results: PlaceResult[]; status: "OK" | "ZERO_RESULTS" }>();

  constructor(private readonly ymaps: YandexMapsApi) {}

  async nearbySearch(request: { location: LatLng; radius: number }) {
    const cacheKey = [
      request.location.lat.toFixed(4),
      request.location.lng.toFixed(4),
      Math.round(request.radius),
    ].join(":");

    const cached = this.nearbyCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const { deltaLat, deltaLng } = metersToDelta(request.radius, request.location.lat);
    const bbox: [[number, number], [number, number]] = [
      [request.location.lat - deltaLat, request.location.lng - deltaLng],
      [request.location.lat + deltaLat, request.location.lng + deltaLng],
    ];

    const geocodeResponse = await this.ymaps.geocode([request.location.lat, request.location.lng], {
      results: 10,
      bbox,
      rspn: 1,
    });

    const results: PlaceResult[] = [];
    geocodeResponse.geoObjects.each((geoObject: YandexGeoObject) => {
      const meta = geoObject.properties.get("metaDataProperty.GeocoderMetaData") as YandexGeocoderMetaData | undefined;
      const kind = meta?.kind;
      const name = meta?.text || (geoObject.properties.get("name") as string | undefined) || "";
      const types = getPlaceTypesFromYandexKind(kind);
      results.push({ name, types });
    });

    const response = {
      results,
      status: results.length > 0 ? ("OK" as const) : ("ZERO_RESULTS" as const),
    };

    this.nearbyCache.set(cacheKey, response);
    return response;
  }
}

const getApiKeyCandidateUrls = () => {
  const candidates = [
    new URL("api-key.txt", document.baseURI).toString(),
    `${window.location.origin}/api-key.txt`,
  ];

  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    if (seen.has(candidate)) {
      return false;
    }

    seen.add(candidate);
    return true;
  });
};

const getYandexMapsApiKeyFromEnv = () => {
  const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY?.trim();
  if (!apiKey || apiKey === "your-yandex-maps-api-key") {
    return null;
  }

  return apiKey;
};

const getYandexMapsApiKey = async () => {
  const envApiKey = getYandexMapsApiKeyFromEnv();
  if (envApiKey) {
    return envApiKey;
  }

  const candidateUrls = getApiKeyCandidateUrls();

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        continue;
      }

      const apiKey = (await response.text()).trim();
      if (apiKey) {
        return apiKey;
      }
    } catch {
      continue;
    }
  }

  throw new Error(
    `Не удалось загрузить API-ключ. Укажите VITE_YANDEX_MAPS_API_KEY или файл api-key.txt. Проверенные пути: ${candidateUrls.join(", ")}`
  );
};

export const loadYandexMaps = async () => {
  if (window.ymaps) {
    return new Promise<YandexMapsApi>((resolve) => {
      window.ymaps?.ready(() => resolve(window.ymaps as YandexMapsApi));
    });
  }

  const apiKey = await getYandexMapsApiKey();
  const scriptSrc = `${YANDEX_MAPS_URL}&apikey=${encodeURIComponent(apiKey)}`;

  return new Promise<YandexMapsApi>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${scriptSrc}"]`) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => window.ymaps?.ready(() => resolve(window.ymaps as YandexMapsApi)));
      existing.addEventListener("error", () => reject(new Error("Yandex Maps failed to load")));
      return;
    }

    const script = document.createElement("script");
    script.src = scriptSrc;
    script.async = true;
    script.onload = () => window.ymaps?.ready(() => resolve(window.ymaps as YandexMapsApi));
    script.onerror = () => reject(new Error("Yandex Maps failed to load"));
    document.head.appendChild(script);
  });
};

export const extractAdminLevel1 = (geocodeResult: YandexGeoObject | null | undefined) => {
  const meta = geocodeResult?.properties?.get("metaDataProperty.GeocoderMetaData") as YandexGeocoderMetaData | undefined;
  const components = meta?.Address?.Components || [];

  for (const component of components) {
    if (component.kind === "province") {
      return component.name ?? null;
    }
  }

  for (const component of components) {
    if (component.kind === "area") {
      return component.name ?? null;
    }
  }

  return meta?.text ?? null;
};
