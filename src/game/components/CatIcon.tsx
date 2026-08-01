interface CatIconProps {
  stroke: string;
  size?: number;
}

/**
 * The little pencil-drawn cat head used on player tiles, reproduced from the
 * design's inline SVG.
 */
export function CatIcon({ stroke, size = 20 }: CatIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      style={{ width: size, height: size, flex: "none" }}
      fill="none"
      stroke={stroke}
      strokeWidth="1.2"
      filter="url(#lykPencilSoft)"
      aria-hidden="true"
    >
      <path d="M5 20 L8.5 7 l2.6 3.4 h2 L15.5 7 L19 20z" />
      <circle cx="10.2" cy="14.4" r=".9" />
      <circle cx="13.8" cy="14.4" r=".9" />
    </svg>
  );
}
