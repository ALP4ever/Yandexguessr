import React, { useEffect, useRef } from "react";

type LatLng = {
  lat: number;
  lng: number;
};

type StreetViewProps = {
  ymaps: any;
  location: LatLng;
};

const StreetView = ({ ymaps, location }: StreetViewProps) => {
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
        const panoramas = await ymaps.panorama.locate([location.lat, location.lng], {
          radius: 1000,
          layer: "yandex#panorama",
        });

        if (!panoramas || panoramas.length === 0) {
          throw new Error("Panorama not found");
        }

        const player = new ymaps.panorama.Player(container, panoramas[0], {
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
  }, [location.lat, location.lng, ymaps]);

  return <div ref={containerRef} className="h-full w-full" />;
};

export default StreetView;
