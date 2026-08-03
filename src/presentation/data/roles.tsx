import type { ReactNode } from "react";

/**
 * The roles of "Lykoi at Night" — a loose Werewolf adaptation with a
 * gothic-cat voice.
 *
 * All are wired into the playable engine, so none are marked "Próximamente" in
 * the gallery any more.
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
    name: "Curandero de la Camada",
    faction: "Vecindario",
    description:
      "Cura a un gato cada noche y lo hace sobrevivir a un ataque. Nunca a sí mismo, ni al mismo dos noches seguidas.",
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
    id: "cupido",
    name: "Cupido",
    faction: "Vecindario",
    description:
      "La primera noche enlaza a dos gatos enamorados. Si uno cae, el otro lo sigue a la misma suerte.",
    implemented: true,
    art: (
      <>
        <path d="M12 20 C6 15 3 11 3 8 A3 3 0 0 1 9 6.5 L12 9 L15 6.5 A3 3 0 0 1 21 8 C21 11 18 15 12 20z" />
        <path d="M4 6 L20 18" opacity=".5" />
        <path d="M18 4 l3 -1 l-1 3z" opacity=".7" />
      </>
    ),
  },
  {
    id: "bruja",
    name: "La Gata del Bosque",
    faction: "Vecindario",
    description:
      "Guarda dos frascos para toda la partida: una poción que revive a quien la manada marque, y un veneno que mata aunque lo estén curando.",
    implemented: true,
    art: (
      <>
        <path d="M12 2 L15 8 H9 z" />
        <path d="M6 8 h12 l-2 6 h-8 z" />
        <path d="M7 14 q5 4 10 0 l1 5 h-12 z" />
        <path d="M9 17.5 q3 1.5 6 0" opacity=".5" />
        <path d="M12 8 v6" opacity=".45" />
      </>
    ),
  },
  {
    id: "caperuza",
    name: "Caperuza",
    faction: "Vecindario",
    description:
      "Mientras el Cazador respire, los Lykoi no pueden llevársela en la noche. Duerme a salvo, sin nada que hacer.",
    implemented: true,
    art: (
      <>
        <path d="M12 3 q-5 1 -5 7 v6 q0 3 5 4 q5 -1 5 -4 v-6 q0 -6 -5 -7z" />
        <path d="M8 8 q4 -2 8 0" opacity=".55" />
        <path d="M9.5 12 h0 M14.5 12 h0" strokeWidth="2" strokeLinecap="round" />
        <path d="M10 15.5 q2 1.5 4 0" opacity=".6" />
      </>
    ),
  },
  {
    id: "alcalde",
    name: "Alcalde del Tejado",
    faction: "Vecindario",
    description:
      "Cuando el destierro del día queda empatado, su palabra pesa doble e inclina la balanza.",
    implemented: true,
    art: (
      <>
        <path d="M12 4 v15" />
        <path d="M5 8 h14" />
        <path d="M5 8 l-2.5 4 h5 z" />
        <path d="M19 8 l-2.5 4 h5 z" />
        <path d="M8.5 19 h7" opacity=".55" />
        <path d="M12 4 l0 0" strokeWidth="2.4" strokeLinecap="round" />
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
