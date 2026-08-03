import type { Role } from "../domain/game/roles";

/** The largest werewolf count that keeps the pack below the townsfolk. */
export function maxWolves(playerCount: number): number {
  return Math.max(1, Math.floor((playerCount - 1) / 2));
}

/** Display data for a role: its themed name, faction, tone and power blurb. */
export interface RoleInfo {
  /** Themed Spanish name of the role. */
  readonly name: string;
  /** Faction label shown under the name. */
  readonly faction: string;
  /** CSS colour token used to tint the reveal card. */
  readonly tone: string;
  /** One-line description of the role's power. */
  readonly desc: string;
}

/** Resolves the reveal display data for a role. */
export function roleInfo(role: Role): RoleInfo {
  switch (role) {
    case "werewolf":
      return {
        name: "Lykoi",
        faction: "Maldito",
        tone: "var(--lyk-blood-bright)",
        desc: "Cada noche, con los otros Lykoi, eligen a quién se lleva la oscuridad.",
      };
    case "infector":
      return {
        name: "Madre Camada",
        faction: "Maldito",
        tone: "var(--lyk-blood-bright)",
        desc: "Una vez por partida, convierte a un inocente en uno de los suyos.",
      };
    case "seer":
      return {
        name: "Vidente del Alféizar",
        faction: "Vecindario",
        tone: "var(--lyk-gold)",
        desc: "Cada noche miras a un gato y sabes si ronronea de verdad.",
      };
    case "guardian":
      return {
        name: "Guardián del Umbral",
        faction: "Vecindario",
        tone: "var(--lyk-gold)",
        desc: "Cada noche velas una puerta; quien esté detrás, sobrevive.",
      };
    case "hunter":
      return {
        name: "Cazador de Sombras",
        faction: "Vecindario",
        tone: "var(--lyk-gold)",
        desc: "Si cae, se lleva a otro gato con él. Rencoroso incluso muerto.",
      };
    case "villager":
      return {
        name: "Gato Doméstico",
        faction: "Vecindario",
        tone: "var(--lyk-muted)",
        desc: "Sin poderes. Tu voz y tu voto son tu única arma.",
      };
  }
}
