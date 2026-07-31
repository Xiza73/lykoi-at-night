/**
 * Hidden SVG <defs> that expose the hand-drawn "pencil" displacement filters
 * used across the art. Render this once near the app root; the art SVGs then
 * reference the filters via `filter="url(#lykPencil)"` / `url(#lykPencilSoft)`.
 */
export function PencilFilters() {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: "absolute" }}
      aria-hidden="true"
    >
      <defs>
        <filter id="lykPencil">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.045"
            numOctaves="3"
            seed="7"
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale="2.4"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <filter id="lykPencilSoft">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.07"
            numOctaves="2"
            seed="3"
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale="1.3"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
