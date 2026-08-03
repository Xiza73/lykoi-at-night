import type { ReactNode } from "react";

/**
 * The nine roles of "Lykoi at Night" — a loose Werewolf adaptation with a
 * gothic-cat voice.
 *
 * Five of them are wired into the playable engine (Lykoi, Vidente del Alféizar,
 * Guardián del Umbral, Cazador de Sombras, Gato Doméstico). The other four are
 * part of the design's roster but not implemented yet; the gallery marks those
 * "Próximamente".
 *
 * Each role carries its hand-drawn SVG art (paths only, wrapped by <RoleCard>).
 */

export type Faction = "Maldito" | "Vecindario";

export interface Role {
  id: string;
  name: string;
  faction: Faction;
  /** How many copies of this role sit in a full deck, when it is more than one. */
  count?: number;
  description: string;
  /** The card's SVG art body (paths only, wrapped by <RoleCard>). */
  art: ReactNode;
  /** Whether the game engine already supports this role. */
  implemented: boolean;
}

/** Stroke color for the art per faction, mirroring the design. */
export const FACTION_STROKE: Record<Faction, string> = {
  Maldito: "#c0563f",
  Vecindario: "#b9b2a4",
};

export const roles: Role[] = [
  {
    id: "lykoi",
    name: "Lykoi",
    faction: "Maldito",
    count: 3,
    description:
      "Cada noche, con los suyos, eligen a quién se lleva la oscuridad. De día se lamen la pata y fingen sueño.",
    implemented: true,
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
    id: "madre-camada",
    name: "Madre Camada",
    faction: "Maldito",
    description:
      "Una vez por partida, convierte a un inocente en uno de los suyos. Él se entera al despertar. Ella, al ver su cara.",
    implemented: false,
    art: (
      <>
        <path d="M3 17 q9 -9 18 0" />
        <circle cx="7" cy="19" r="2.2" />
        <circle cx="12" cy="19.6" r="2.2" />
        <circle cx="17" cy="19" r="2.2" />
        <path d="M12 8 v-3 M9 9 l-2 -2 M15 9 l2 -2" opacity=".55" />
      </>
    ),
  },
  {
    id: "ronroneo-falso",
    name: "Ronroneo Falso",
    faction: "Maldito",
    description:
      "Un Lykoi que, ante la Vidente, aparece limpio. Ha practicado ese ronroneo frente al espejo durante años.",
    implemented: false,
    art: (
      <>
        <path d="M4 7 h16 v6 q0 6 -8 8 q-8 -2 -8 -8z" />
        <path d="M7.5 11 q1.8 -2.2 3.6 0 q-1.8 2.2 -3.6 0z M12.9 11 q1.8 -2.2 3.6 0 q-1.8 2.2 -3.6 0z" />
        <path d="M9 15.5 q3 2 6 0" opacity=".6" />
      </>
    ),
  },
  {
    id: "vidente",
    name: "Vidente del Alféizar",
    faction: "Vecindario",
    description:
      "Cada noche mira a un gato y sabe si ronronea de verdad. No sabe explicar cómo.",
    implemented: true,
    art: (
      <>
        <path d="M2 12 q10 -8 20 0 q-10 8 -20 0z" />
        <circle cx="12" cy="12" r="4" />
        <path d="M12 9 v6" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M12 4 v-2 M4 6 l-1.4 -1.4 M20 6 l1.4 -1.4" opacity=".5" />
      </>
    ),
  },
  {
    id: "guardian",
    name: "Guardián del Umbral",
    faction: "Vecindario",
    description:
      "Vela la puerta que elija; quien esté detrás, sobrevive esa noche. Nunca se elige a sí mismo.",
    implemented: true,
    art: (
      <>
        <path d="M6 3 h12 v18 h-12z" />
        <circle cx="9" cy="12" r="1.8" />
        <path d="M9 13.6 v3" />
        <path d="M6 3 q6 -2 12 0" opacity=".5" />
      </>
    ),
  },
  {
    id: "cazador",
    name: "Cazador de Sombras",
    faction: "Vecindario",
    description:
      "Si cae, se lleva a otro gato con él. Rencoroso incluso muerto.",
    implemented: true,
    art: (
      <>
        <path
          d="M5 4 q3 8 2 16 M11 3 q2.5 9 1.5 17 M17 4 q2 8 1 15"
          strokeLinecap="round"
        />
        <path d="M3 19 q9 3 18 -1" opacity=".45" />
      </>
    ),
  },
  {
    id: "insomne",
    name: "El Insomne",
    faction: "Vecindario",
    description:
      "No duerme: oye cuántos pasos hubo esa noche, nunca de quién.",
    implemented: false,
    art: (
      <>
        <path d="M9 21 h6 v-9 h-6z" />
        <path d="M12 12 q-3 -3 0 -6 q3 3 0 6z" stroke="#d9a44c" />
        <path d="M7 21 h10" />
        <path d="M12 3 v1.5" opacity=".5" />
      </>
    ),
  },
  {
    id: "chismosa",
    name: "La Chismosa",
    faction: "Vecindario",
    description:
      "Puede espiar el rol de un gato que ya no está. Y contarlo. O mentir sobre ello.",
    implemented: false,
    art: (
      <>
        <circle cx="12" cy="13" r="7" />
        <path
          d="M6 10 q6 5 12 1 M7 17 q5 -6 10 -3 M9 19.5 q1 -8 6 -9"
          opacity=".7"
        />
        <path d="M18 7 l4 -4" strokeLinecap="round" />
      </>
    ),
  },
  {
    id: "domestico",
    name: "Gato Doméstico",
    faction: "Vecindario",
    count: 4,
    description: "Sin poderes. Su única arma es la palabra y el voto.",
    implemented: true,
    art: (
      <>
        <path d="M4 14 q8 6 16 0" />
        <path d="M4 14 h16" opacity=".6" />
        <path d="M8 10 q4 -3 8 0" opacity=".4" />
        <path d="M12 6 q-2 -2 0 -3 q2 1 0 3z" stroke="#d9a44c" opacity=".8" />
      </>
    ),
  },
];
