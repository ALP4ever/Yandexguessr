import React, { useEffect, useRef } from "react";
import type { LatLng } from "../../lib/gameTypes.ts";
import { stripPanoramaGameOverlays } from "../../lib/panoramaUtils.ts";
import type { YandexPanorama, YandexMapsApi, YandexPanoramaPlayer } from "../../lib/yandexMaps.ts";

type StreetViewProps = {
  ymaps: YandexMapsApi;
  location: LatLng;
  panorama?: YandexPanorama | null;
  hidden?: boolean;
};

const PANORAMA_UNAVAILABLE_MESSAGE =
  "<div style='display:flex;align-items:center;justify-content:center;height:100%;color:#e2e8f0;font-weight:600;'>Панорама недоступна</div>";

const StreetView = ({ ymaps, location, panorama, hidden = false }: StreetViewProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YandexPanoramaPlayer | null>(null);
  const wrapperClassName = hidden
    ? "pointer-events-none absolute -left-[9999px] top-0 h-[360px] w-[640px] opacity-0"
    : "relative h-full w-full";

  useEffect(() => {
    if (!ymaps || !containerRef.current) {
      return;
    }

    let cancelled = false;

    const createPlayer = async () => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      try {
        container.innerHTML = "";

        const panoramaToRender =
          panorama ??
          (await ymaps.panorama.locate([location.lat, location.lng], {
            radius: 1000,
            layer: "yandex#panorama",
          }))?.[0];

        if (!panoramaToRender) {
          throw new Error("Panorama not found");
        }

        stripPanoramaGameOverlays(panoramaToRender);

        const player = new ymaps.panorama.Player(container, panoramaToRender, {
          controls: [],
          direction: [0, 0],
          span: [90, 60],
          addressControl: false,
          showRoadLabels: false,
          hotkeysEnabled: false,
          suppressMapOpenBlock: true,
        });

        try {
          player.events.add("panoramachange", () => {
            stripPanoramaGameOverlays(player.getPanorama());
          });
        } catch {
          /* panoramachange is undocumented; safe to skip */
        }

        if (!cancelled) {
          playerRef.current = player;
        } else {
          player.destroy();
        }
      } catch {
        if (!cancelled) {
          container.innerHTML = PANORAMA_UNAVAILABLE_MESSAGE;
        }
      }
    };

    createPlayer();

    return () => {
      cancelled = true;
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [location.lat, location.lng, panorama, ymaps]);

  return (
    <div className={wrapperClassName} aria-hidden={hidden}>
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
};

export default StreetView;
