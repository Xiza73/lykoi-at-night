import "./theme/tokens.css";
import { Hero } from "./organisms/Hero";
import { PartidaSection } from "./organisms/PartidaSection";
import { RolesSection } from "./organisms/RolesSection";
import { RulesSection } from "./organisms/RulesSection";
import { SiteFooter } from "./organisms/SiteFooter";

/**
 * The presentational landing page: hero + interactive game (#partida) + roles
 * (#cartas) + rules (#reglas) + footer. The game screen owns its own state.
 */
export function LandingPage() {
  return (
    <div
      className="lyk-root"
      style={{
        background: "var(--lyk-bg)",
        color: "var(--lyk-ink)",
        fontFamily: "var(--lyk-sans)",
        fontWeight: 300,
        overflowX: "hidden",
      }}
    >
      <Hero />
      <PartidaSection />
      <RolesSection />
      <RulesSection />
      <SiteFooter />
    </div>
  );
}
