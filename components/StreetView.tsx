import React, { useEffect, useRef } from "react";

type LatLng = {
  lat: number;
  lng: number;
};

type StreetViewProps = {
  ymaps: any;
  location: LatLng;
  panorama?: any;
  hidden?: boolean;
};

const PANORAMA_UNAVAILABLE_MESSAGE =
  "<div style='display:flex;align-items:center;justify-content:center;height:100%;color:#e2e8f0;font-weight:600;'>ÐŸÐ°Ð½Ð¾Ñ€Ð°Ð¼Ð° Ð½ÐµÐ´Ð¾ÑÑ‚ÑƒÐ¿Ð½Ð°</div>";

const StreetView = ({ ymaps, location, panorama, hidden = false }: StreetViewProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);

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

        const player = new ymaps.panorama.Player(container, panoramaToRender, {
          controls: [],
          direction: [0, 0],
          span: [90, 60],
          addressControl: false,
          showRoadLabels: false,
          hotkeysEnabled: false,
        });

        if (!cancelled) {
          playerRef.current = player;
        } else {
          player.destroy();
        }
      } catch {
        if (!cancelled) {
          container.innerHTML =
            "<div style='display:flex;align-items:center;justify-content:center;height:100%;color:#e2e8f0;font-weight:600;'>Панорама недоступна</div>";
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
    <div
      ref={containerRef}
      className={hidden ? "pointer-events-none absolute -left-[9999px] top-0 h-[360px] w-[640px] opacity-0" : "h-full w-full"}
      aria-hidden={hidden}
    />
  );
};

export default StreetView;
