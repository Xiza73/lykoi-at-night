import type { ReactNode } from "react";

/**
 * The three identities of Salem 1692 (as retold in "Lykoi at Night").
 *
 * Salem has NO roster of special roles: every player is one of three
 * tryal-card types — la Bruja (Witch), No es bruja (Not-a-Witch), or el
 * Guardián (Constable). These three cards, plus their hand-drawn SVG art, are
 * the faithful presentation of that structure. Variety in the game lives in the
 * action-card deck (see actionCards.ts), not here.
 */

export type Faction = "Maldito" | "Vecindario";

export interface Identity {
  id: string;
  name: string;
  faction: Faction;
  /** The tryal card this identity carries (la Bruja / No es bruja / el Guardián). */
  tryal: string;
  description: string;
  /** The card's SVG art body (paths only, wrapped by <RoleCard>). */
  art: ReactNode;
}

/** Stroke color for the art per faction, mirroring the design. */
export const FACTION_STROKE: Record<Faction, string> = {
  Maldito: "#c0563f",
  Vecindario: "#b9b2a4",
};

export const identities: Identity[] = [
  {
    id: "lykoi",
    name: "Lykoi",
    faction: "Maldito",
    tryal: "la Bruja",
    description:
      "Tu carta de sombra lleva la marca. De noche, los Lykoi eligen a quién se lleva la oscuridad.",
    // Reused Lykoi cat SVG.
    art: (
      <>
        <path d="M4 21 L7.6 5 l3 4.2 h2.8 L16.4 5 L20 21z" />
        <path d="M8.6 13.6 q1.6 -2 3.2 0 q-1.6 2 -3.2 0z M12.6 13.6 q1.6 -2 3.2 0 q-1.6 2 -3.2 0z" />
        <path
          d="M10.2 13.6 v0 M14.2 13.6 v0"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="M9.5 17.6 l1.6 -1 l1.4 1 l1.5 -1" />
        <path d="M6 8 l2 1 M18 8 l-2 1" opacity=".5" />
      </>
    ),
  },
  {
    id: "vecindario",
    name: "Vecindario",
    faction: "Vecindario",
    tryal: "No es bruja",
    description:
      "Ninguna de tus cartas de sombra lleva la marca. Tu única arma es la palabra y el voto.",
    // Reused "Gato Doméstico" SVG — the plain neighborhood cat.
    art: (
      <>
        <path d="M4 14 q8 6 16 0" />
        <path d="M4 14 h16" opacity=".6" />
        <path d="M8 10 q4 -3 8 0" opacity=".4" />
        <path d="M12 6 q-2 -2 0 -3 q2 1 0 3z" stroke="#d9a44c" opacity=".8" />
      </>
    ),
  },
  {
    id: "guardian",
    name: "Guardián del Umbral",
    faction: "Vecindario",
    tryal: "el Guardián",
    description:
      "Tienes la carta del Guardián. Cada noche velas una puerta; quien esté detrás sobrevive. Si la revelan en un juicio, pierdes el poder.",
    // Reused Guardián del Umbral SVG.
    art: (
      <>
        <path d="M6 3 h12 v18 h-12z" />
        <circle cx="9" cy="12" r="1.8" />
        <path d="M9 13.6 v3" />
        <path d="M6 3 q6 -2 12 0" opacity=".5" />
      </>
    ),
  },
];
