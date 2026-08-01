import { Eyebrow } from "../atoms/Eyebrow";
import { RoleCard } from "../molecules/RoleCard";
import { HandCard } from "../molecules/HandCard";
import { identities } from "../data/identities";
import { actionGroups } from "../data/actionCards";

/**
 * The #cartas section, faithful to Salem 1692: the three identities (Lykoi,
 * Vecindario, Guardián del Umbral), then the action-card deck grouped by its
 * four colors (Rojas / Azules / Negras / Verdes).
 */
export function RolesSection() {
  return (
    <section
      id="cartas"
      style={{
        padding: "clamp(40px, 8vw, 100px) clamp(16px, 5vw, 64px)",
        borderTop: "1px solid var(--lyk-line-2)",
      }}
    >
      <div
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "clamp(26px, 5vw, 46px)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            maxWidth: "620px",
          }}
        >
          <Eyebrow>Identidades y cartas</Eyebrow>
          <h2
            style={{
              margin: 0,
              fontFamily: "var(--lyk-serif)",
              fontWeight: 400,
              fontSize: "clamp(32px, 8vw, 54px)",
              lineHeight: 1.02,
              color: "var(--lyk-ink-strong)",
            }}
          >
            Tres identidades.
            <br />
            Un mazo. Un callejón.
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(min(100%, 260px), 1fr))",
            gap: "clamp(12px, 2.2vw, 20px)",
          }}
        >
          {identities.map((identity) => (
            <RoleCard key={identity.id} identity={identity} />
          ))}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "clamp(20px, 4vw, 34px)",
            marginTop: "clamp(14px, 3vw, 30px)",
          }}
        >
          <Eyebrow>El mazo de acciones</Eyebrow>
          {actionGroups.map((group) => (
            <div
              key={group.color}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "12px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    letterSpacing: ".34em",
                    textTransform: "uppercase",
                    color: "var(--lyk-ink)",
                  }}
                >
                  {group.label}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--lyk-faint)",
                  }}
                >
                  {group.note}
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(min(100%, 200px), 1fr))",
                  gap: "clamp(12px, 2vw, 18px)",
                }}
              >
                {group.cards.map((card) => (
                  <HandCard key={card.id} card={card} color={group.color} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
