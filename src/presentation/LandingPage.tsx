import "./theme/tokens.css";
import { Hero } from "./organisms/Hero";
import { RolesSection } from "./organisms/RolesSection";
import { RulesSection } from "./organisms/RulesSection";
import { SiteFooter } from "./organisms/SiteFooter";

/**
 * The presentational landing page: hero + roles (#cartas) + rules (#reglas) +
 * footer. Pure presentation — no game logic lives here.
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
      <RolesSection />
      <RulesSection />
      <SiteFooter />
    </div>
  );
}
