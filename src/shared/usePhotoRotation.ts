import type { ImageSource } from "expo-image";
import { useEffect, useState } from "react";

export function usePhotoRotation(
  sources: readonly (ImageSource | number)[],
  intervalMs = 6000,
) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (sources.length < 2) return;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % sources.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [sources.length, intervalMs]);

  return sources[index % sources.length];
}
