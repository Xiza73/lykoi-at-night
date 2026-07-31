interface RuleStepProps {
  /** Two-digit step number, e.g. "01". */
  number: string;
  title: string;
  description: string;
  /** Whether this is the last step (adds a bottom border, per the design). */
  last?: boolean;
}

/**
 * A single numbered step in the #reglas "Cómo se juega" list.
 */
export function RuleStep({ number, title, description, last }: RuleStepProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: "18px",
        padding: "22px 0",
        borderTop: "1px solid var(--lyk-line)",
        borderBottom: last ? "1px solid var(--lyk-line)" : undefined,
      }}
    >
      <span
        style={{
          fontFamily: "var(--lyk-serif)",
          fontSize: "22px",
          color: "var(--lyk-gold)",
          flex: "none",
          width: "38px",
        }}
      >
        {number}
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <h3
          style={{
            margin: 0,
            fontSize: "17px",
            fontWeight: 400,
            color: "var(--lyk-ink-strong)",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            lineHeight: 1.6,
            color: "var(--lyk-muted-2)",
          }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}
