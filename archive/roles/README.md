# Archived roles

These four roles were removed from the active game to slim it down to a
five-role core (`werewolf`, `seer`, `guardian`, `hunter`, `villager`). The files
here are a **snapshot** kept for possible future re-implementation.

> **Not compiled.** `archive/` is excluded from `tsconfig.json` and from the
> ESLint config, so nothing here is type-checked, linted, built, or run as a
> test. These files will drift from the active domain APIs over time; treat them
> as a reference, not as drop-in code.

## Roles

### Madre Camada — `infector`
- **Mechanic:** once per game, a living infector converts one townsperson into a
  werewolf during the night. The victim learns at dawn; the pack gains a member.
- **Where its logic used to live:**
  - `src/domain/game/roles.ts` — counted as a wolf in `alignmentOf`.
  - `src/domain/game/player.ts` — `RoleConfig.infector`, dealt in `dealRoles`,
    counted into `wolfCount`.
  - `src/domain/game/game.ts` — `infectionUsed` flag on `Game`/`createGame`, plus
    the infection block and the 4th `infectTargetId` parameter of `resolveNight`.
  - `src/game/views/NightView.tsx` — the Madre Camada turn (`infector-gate` /
    `infector-pick` steps) and the `TurnedView` "you were turned" gate.
  - `src/game/GameScreen.tsx` — the `"turned"` step, `turnedName` /
    `infectTargetId` state, and the pre/post role-flip diff after `resolveNight`.
  - Test snapshot: `archive/roles/infector.test.ts`.

### Ronroneo Falso — `trickster`
- **Mechanic:** a werewolf-aligned role that reads as town to the seer (a false
  purr). It is a wolf for win conditions but disguised under investigation.
- **Where its logic used to live:**
  - `src/domain/game/roles.ts` — counted as a wolf in `alignmentOf`, and the
    reason `seerReadingOf` existed (it returned `"town"` for the trickster).
  - `src/domain/game/player.ts` — `RoleConfig.trickster`, dealt in `dealRoles`,
    counted into `wolfCount`.
  - `src/domain/game/game.ts` — `investigate` used `seerReadingOf` to disguise it.
  - `src/game/presets.ts` — part of the Avanzado ladder (`min: 9`, `wolf: true`).
  - Test snapshot: `archive/roles/trickster.test.ts`.

### El Insomne — `insomniac`
- **Mechanic:** each dawn the insomniac hears how many Lykoi still prowl (the
  count of living wolves), never who they are.
- **Where its logic used to live:**
  - `src/domain/game/roles.ts` — a plain town role in `alignmentOf`.
  - `src/domain/game/player.ts` — `RoleConfig.insomniac`, dealt in `dealRoles`.
  - `src/domain/game/game.ts` — `nightFootsteps` returned the living-wolf count.
  - `src/game/GameScreen.tsx` — the `"insomniac"` step and its dawn gate.
  - `src/game/views/InsomniacView.tsx` — the private footsteps reading UI
    (snapshot at `archive/roles/InsomniacView.tsx`).
  - Test snapshot: `archive/roles/insomniac.test.ts`.

### La Chismosa — `gossip`
- **Mechanic:** peeks the true role of a fallen (dead) cat during the night, then
  may share it truthfully — or lie about it.
- **Where its logic used to live:**
  - `src/domain/game/roles.ts` — a plain town role in `alignmentOf`.
  - `src/domain/game/player.ts` — `RoleConfig.gossip`, dealt in `dealRoles`.
  - `src/domain/game/game.ts` — `peekRole` returned the true role of a target.
  - `src/game/views/NightView.tsx` — the La Chismosa turn (`gossip-gate` /
    `gossip-pick` steps).
  - `src/game/GameScreen.tsx` — the `gossipTargetId` state and gossip gating.
  - `src/game/presets.ts` — part of the Avanzado ladder (`min: 8`).
  - Test snapshot: `archive/roles/gossip.test.ts`.
