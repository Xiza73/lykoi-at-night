/**
 * The landing footer: wordmark on the left, tagline on the right.
 */
export function SiteFooter() {
  return (
    <footer
      style={{
        padding: "clamp(30px, 6vw, 60px) clamp(16px, 5vw, 64px)",
        borderTop: "1px solid var(--lyk-line-2)",
        display: "flex",
        flexWrap: "wrap",
        gap: "16px",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <span
        style={{
          fontFamily: "var(--lyk-serif)",
          fontSize: "18px",
          color: "var(--lyk-faint)",
        }}
      >
        Lykoi <span style={{ fontStyle: "italic" }}>at Night</span>
      </span>
      <span
        style={{
          fontSize: "12px",
          letterSpacing: ".2em",
          textTransform: "uppercase",
          color: "#4a463f",
        }}
      >
        12 gatos · 3 mentiras · 1 callejón
      </span>
    </footer>
  );
}
