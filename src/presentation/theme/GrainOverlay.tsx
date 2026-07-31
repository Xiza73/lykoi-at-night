/**
 * Fixed film-grain overlay reproduced from the design. It sits above the whole
 * page (z-index 90), is non-interactive, and blends with `overlay` for a subtle
 * texture. The grain image is an inline SVG turbulence encoded as a data URI.
 */
const GRAIN_DATA_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

export function GrainOverlay() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 90,
        opacity: 0.09,
        mixBlendMode: "overlay",
        backgroundImage: `url("${GRAIN_DATA_URI}")`,
      }}
    />
  );
}
