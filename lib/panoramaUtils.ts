import type { YandexPanorama } from "./yandexMapsTypes.ts";

/**
 * Yandex panoramas expose markers (building addresses) and connection arrows by default.
 * There is no official flag to disable them; clearing these methods is a common workaround.
 */
export const stripPanoramaGameOverlays = (panorama: YandexPanorama) => {
  try {
    const pano = panorama as YandexPanorama & {
      getMarkers?: () => unknown[];
      getConnectionMarkers?: () => unknown[];
      getConnectionArrows?: () => unknown[];
      getGraph?: () => unknown;
    };

    pano.getMarkers = () => [];
    pano.getConnectionMarkers = () => [];
    pano.getConnectionArrows = () => [];
    pano.getGraph = () => null;
  } catch {
    /* Panorama instance may be sealed in future API versions */
  }
};
