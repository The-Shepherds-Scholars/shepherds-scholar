// Reports API.Bible FUMS views. Required whenever API.Bible text is shown in a
// web view, which includes the Capacitor Android app.
// Script and call shape: https://care.api.bible/article/417-understanding-fums
import { useEffect } from "react";

const FUMS_SRC = "https://pkg.api.bible/fumsV3.min.js";

declare global {
  interface Window {
    fumsData?: unknown[];
    fums?: (...args: unknown[]) => void;
  }
}

function ensureFumsLoaded(): void {
  if (window.fums) return;
  window.fumsData = window.fumsData || [];
  // Queue calls until the real tracker loads and drains fumsData.
  window.fums = function (...args: unknown[]) {
    window.fumsData!.push(args);
  };
  const script = document.createElement("script");
  script.src = FUMS_SRC;
  script.async = true;
  document.body.appendChild(script);
}

/** Call with the passage's fums_token. Local (Douay-Rheims) passages have none, so nothing is sent. */
export function useFums(fumsToken: string | null | undefined): void {
  useEffect(() => {
    if (!fumsToken) return;
    ensureFumsLoaded();
    window.fums!("trackView", fumsToken);
  }, [fumsToken]);
}
