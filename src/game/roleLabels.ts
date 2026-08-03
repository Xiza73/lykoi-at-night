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
    case "seer":
      return {
        name: "Vidente del Alféizar",
        faction: "Vecindario",
        tone: "var(--lyk-gold)",
        desc: "Cada noche miras a un gato y sabes si ronronea de verdad.",
      };
    case "guardian":
      return {
        name: "Curandero del Callejón",
        faction: "Vecindario",
        tone: "var(--lyk-gold)",
        desc: "Cada noche curás a un gato y sobrevive a un ataque. Nunca a vos mismo, ni al mismo dos noches seguidas.",
      };
    case "hunter":
      return {
        name: "Cazador de Sombras",
        faction: "Vecindario",
        tone: "var(--lyk-gold)",
        desc: "Si cae, se lleva a otro gato con él. Rencoroso incluso muerto.",
      };
    case "mayor":
      return {
        name: "Alcalde del Callejón",
        faction: "Vecindario",
        tone: "var(--lyk-gold)",
        desc: "Cuando el destierro queda empatado, tu palabra pesa doble e inclina la balanza.",
      };
    case "cupid":
      return {
        name: "Cupido del Callejón",
        faction: "Vecindario",
        tone: "var(--lyk-gold)",
        desc: "La primera noche enlaza a dos gatos enamorados. Si uno cae, el otro lo sigue.",
      };
    case "witch":
      return {
        name: "La Bruja del Callejón",
        faction: "Vecindario",
        tone: "var(--lyk-gold)",
        desc: "Guardás dos frascos, uno por partida: una poción de vida que salva a quien la manada marque, y un veneno que mata aunque lo estén curando.",
      };
    case "littleRed":
      return {
        name: "Caperuza del Callejón",
        faction: "Vecindario",
        tone: "var(--lyk-gold)",
        desc: "Mientras el Cazador respire, los Lykoi no pueden llevarte en la noche. No tenés nada que hacer: solo dormir a salvo.",
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
