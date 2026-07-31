/**
 * Core domain types for the social-deduction game.
 *
 * This module is UI- and platform-agnostic: it MUST NOT import React or Tauri.
 * The rules engine lives here so it can be unit-tested in isolation.
 */

/** A player's secret allegiance in a game of Lykoi at Night. */
export type Role = "villager" | "witch";

/** Whether a given role belongs to the witch faction. */
export function isWitch(role: Role): boolean {
  return role === "witch";
}
