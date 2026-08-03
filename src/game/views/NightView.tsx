import type { Game } from "../../domain/game/game";
import { investigate, livingTown } from "../../domain/game/game";
import type { Player } from "../../domain/game/player";
import { isWolf } from "../../domain/game/roles";
import { roleInfo } from "../roleLabels";
import { PrimaryButton } from "../components/PrimaryButton";
import { CatIcon } from "../components/CatIcon";

/**
 * The night's sub-steps, owned by the container. The phone travels in SEAT
 * ORDER: each living player takes a "gate" (a hand-off named only by the seated
 * player, never by a role) and then an "action" dispatched by THAT player's own
 * role. When the last living player has acted the round resolves; the "dawn"
 * step reports the outcome. Because the flow is keyed on the seat's role — not
 * on which powers exist — a Básico game (only wolves + villagers) shows no
 * seer/guardian screens at all: those players simply pass.
 *
 * When a Cupido is in play, night 1 runs a SECOND seat-order pass after the
 * main one: each living player takes a "revealGate" hand-off and then a private
 * "reveal" screen telling a lover who their partner is (or a non-lover that they
 * are unpaired), so the pairing is disclosed without singling anyone out.
 */
export type NightSubStep =
  | "gate"
  | "action"
  | "revealGate"
  | "reveal"
  | "dawn";

interface NightViewProps {
  game: Game;
  /** Which sub-step the pass is on. */
  subStep: NightSubStep;
  /** The living player currently holding the phone (undefined at dawn). */
  seated: Player | undefined;
  /** The vote round: 1, or 2 after a first-round tie. */
  round: 1 | 2;
  /** The Curandero's warded player this night, or null for "nobody". */
  protectedId: string | null;
  /**
   * The player the Curandero warded LAST night, excluded from tonight's grid so
   * he cannot watch over the same cat two nights running. Null on the first
   * night / after an absent or illegal ward.
   */
  lastWarded: string | null;
  /** The Cazador's pre-committed shot this night, or null for "nobody". */
  hunterShotId: string | null;
  /** Votes cast so far this round, keyed by the voting wolf's id. */
  wolfVotes: Record<string, string>;
  /** The seer's chosen player for the current turn, if any. */
  seerTargetId: string | null;
  /** This wolf's chosen prey for the current turn, if any. */
  wolfTargetId: string | null;
  /**
   * Cupido's running selection this turn: the ids he has tapped so far (0, 1 or
   * 2). He confirms only at exactly two. Empty for every other role.
   */
  cupidPick: readonly string[];
  /** Whether La Bruja reserved her blind life potion this night. */
  healReserved: boolean;
  /** La Bruja's poison target this night, or null for "no envenenar". */
  witchPoisonId: string | null;
  /**
   * Every cat the night claimed, in narration order: the wolves' victim first
   * when there was one, then any other newly-dead by seat order (the Cazador's
   * shot, La Bruja's poison and/or a lover chained by the bond). Empty when the
   * night claimed nobody.
   */
  fallenNames: readonly string[];
  /** Whether the double-tie spared the night (nobody was chosen). */
  spared: boolean;
  onOpenGate: () => void;
  onSelectProtected: (playerId: string | null) => void;
  onSelectHunterShot: (playerId: string | null) => void;
  onSelectSeerTarget: (playerId: string) => void;
  onSelectWolfTarget: (playerId: string) => void;
  /** Toggles a candidate in Cupido's two-cat selection (tap to add / remove). */
  onToggleCupidPick: (playerId: string) => void;
  /** Toggles La Bruja's blind life-potion reservation for this night. */
  onToggleHealReserve: () => void;
  /** Sets La Bruja's poison target this night, or null to poison nobody. */
  onSelectWitchPoison: (playerId: string | null) => void;
  /** Confirms the current player's action and passes on (or resolves). */
  onConfirmAction: () => void;
  /** Advances the lovers-reveal pass to the next living seat (or resolves). */
  onRevealContinue: () => void;
  onDawnContinue: () => void;
}

/**
 * The seating-order night flow, rendered while `game.phase === "night"` (and
 * through dawn). It never computes deaths or protection itself — the container
 * collects the ward and the pack's votes and routes them through
 * `resolveWolfVotes` + `resolveNight`. This view only paints the pass-and-play
 * turns and reports the outcome at dawn.
 */
export function NightView({
  game,
  subStep,
  seated,
  round,
  protectedId,
  lastWarded,
  hunterShotId,
  wolfVotes,
  seerTargetId,
  wolfTargetId,
  cupidPick,
  healReserved,
  witchPoisonId,
  fallenNames,
  spared,
  onOpenGate,
  onSelectProtected,
  onSelectHunterShot,
  onSelectSeerTarget,
  onSelectWolfTarget,
  onToggleCupidPick,
  onToggleHealReserve,
  onSelectWitchPoison,
  onConfirmAction,
  onRevealContinue,
  onDawnContinue,
}: NightViewProps) {
  if (subStep === "dawn") {
    return (
      <Dawn fallenNames={fallenNames} spared={spared} onContinue={onDawnContinue} />
    );
  }

  // Both "gate" and "action" need a seated player; the container only routes
  // here with one while the pass is running.
  if (!seated) {
    return null;
  }

  if (subStep === "gate" || subStep === "revealGate") {
    const onGate = subStep === "gate" ? onOpenGate : onRevealContinue;
    return (
      <Frame
        title={`Le toca a ${seated.name}`}
        body={`Pásale el teléfono a ${seated.name}. Que los demás aparten la mirada.`}
      >
        <div style={{ marginTop: "auto" }}>
          <PrimaryButton onClick={onGate}>Ya lo tengo</PrimaryButton>
        </div>
      </Frame>
    );
  }

  if (subStep === "reveal") {
    // The lovers-reveal pass: this seat learns, privately, whether they were
    // linked and by whom — never singling anyone out (everyone taps through).
    const partnerId =
      game.lovers?.find((id) => id !== seated.id) ??
      // Guard: if somehow both entries equal this seat, treat as unpaired.
      null;
    const paired =
      game.lovers != null &&
      game.lovers.includes(seated.id) &&
      partnerId !== null;
    const partnerName = partnerId
      ? game.players.find((p) => p.id === partnerId)?.name
      : undefined;
    return (
      <Frame
        title={paired ? "Un lazo en la oscuridad" : "La noche sigue"}
        body={
          paired && partnerName
            ? `Estás enamorado de ${partnerName}. Si uno cae, el otro también.`
            : "No estás enamorado esta noche."
        }
      >
        <div style={{ marginTop: "auto" }}>
          <PrimaryButton onClick={onRevealContinue}>Listo</PrimaryButton>
        </div>
      </Frame>
    );
  }

  // subStep === "action": dispatched by the seated player's own role.
  return (
    <ActionTurn
      game={game}
      seated={seated}
      round={round}
      protectedId={protectedId}
      lastWarded={lastWarded}
      hunterShotId={hunterShotId}
      wolfVotes={wolfVotes}
      seerTargetId={seerTargetId}
      wolfTargetId={wolfTargetId}
      cupidPick={cupidPick}
      healReserved={healReserved}
      witchPoisonId={witchPoisonId}
      onSelectProtected={onSelectProtected}
      onSelectHunterShot={onSelectHunterShot}
      onSelectSeerTarget={onSelectSeerTarget}
      onSelectWolfTarget={onSelectWolfTarget}
      onToggleCupidPick={onToggleCupidPick}
      onToggleHealReserve={onToggleHealReserve}
      onSelectWitchPoison={onSelectWitchPoison}
      onConfirmAction={onConfirmAction}
    />
  );
}

/** The private action screen for the seated player, keyed on their role. */
function ActionTurn({
  game,
  seated,
  round,
  protectedId,
  lastWarded,
  hunterShotId,
  wolfVotes,
  seerTargetId,
  wolfTargetId,
  cupidPick,
  healReserved,
  witchPoisonId,
  onSelectProtected,
  onSelectHunterShot,
  onSelectSeerTarget,
  onSelectWolfTarget,
  onToggleCupidPick,
  onToggleHealReserve,
  onSelectWitchPoison,
  onConfirmAction,
}: {
  game: Game;
  seated: Player;
  round: 1 | 2;
  protectedId: string | null;
  lastWarded: string | null;
  hunterShotId: string | null;
  wolfVotes: Record<string, string>;
  seerTargetId: string | null;
  wolfTargetId: string | null;
  cupidPick: readonly string[];
  healReserved: boolean;
  witchPoisonId: string | null;
  onSelectProtected: (playerId: string | null) => void;
  onSelectHunterShot: (playerId: string | null) => void;
  onSelectSeerTarget: (playerId: string) => void;
  onSelectWolfTarget: (playerId: string) => void;
  onToggleCupidPick: (playerId: string) => void;
  onToggleHealReserve: () => void;
  onSelectWitchPoison: (playerId: string | null) => void;
  onConfirmAction: () => void;
}) {
  const living = game.players.filter((player) => player.alive);

  if (isWolf(seated.role)) {
    // On a second-round re-vote, a NON-wolf just passes: the pack alone re-votes,
    // so only wolves ever see this branch. (A non-wolf on round 2 is handled by
    // the villager branch below via the round guard.)
    const pack = game.players
      .filter((player) => isWolf(player.role) && player.id !== seated.id)
      .map((player) => player.name);
    // The wolves never target their own pack: candidates are living townsfolk.
    const candidates = livingTown(game);
    // The votes cast so far this round, rendered by voter and target name.
    const castLines = Object.entries(wolfVotes).map(([wolfId, targetId]) => {
      const wolf = game.players.find((player) => player.id === wolfId);
      const target = game.players.find((player) => player.id === targetId);
      return `${wolf?.name ?? "?"} votó por ${target?.name ?? "?"}`;
    });

    return (
      <Frame
        title="Eres un Lykoi"
        body="Vota a quién se lleva la oscuridad esta noche."
      >
        <Note tone="var(--lyk-blood-bright)">
          {pack.length > 0
            ? `La manada: ${pack.join(", ")}`
            : "Cazas en soledad esta noche."}
        </Note>
        {castLines.length > 0 ? (
          <Note tone="var(--lyk-gold)">
            {castLines.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </Note>
        ) : null}
        <PlayerGrid
          players={candidates}
          selectedId={wolfTargetId}
          actionLabel={(name) => `Votar por ${name}`}
          onSelect={onSelectWolfTarget}
        />
        <div style={{ marginTop: "auto" }}>
          <PrimaryButton onClick={onConfirmAction} disabled={wolfTargetId === null}>
            Confirmar voto
          </PrimaryButton>
        </div>
      </Frame>
    );
  }

  // On a re-vote round, non-wolves take no action: they just pass through.
  if (round === 2) {
    return (
      <Frame
        title="La manada volvió a dudar"
        body="Tú no votas — pasa."
      >
        <div style={{ marginTop: "auto" }}>
          <PrimaryButton onClick={onConfirmAction}>Siguiente</PrimaryButton>
        </div>
      </Frame>
    );
  }

  if (seated.role === "seer") {
    const target = seerTargetId
      ? game.players.find((player) => player.id === seerTargetId)
      : undefined;
    const reading = target ? investigate(game, target.id) : null;
    const readingText =
      target && reading
        ? reading === "wolves"
          ? `${target.name} esconde algo bajo el pelaje.`
          : `${target.name} ronronea de verdad.`
        : null;
    const readingTone =
      reading === "wolves" ? "var(--lyk-blood-bright)" : "var(--lyk-gold)";

    return (
      <Frame title="Eres la Vidente" body="Mira a un gato y sabe si ronronea de verdad.">
        <PlayerGrid
          players={living}
          selectedId={seerTargetId}
          actionLabel={(name) => `Mirar a ${name}`}
          onSelect={onSelectSeerTarget}
        />
        {readingText ? <Note tone={readingTone}>{readingText}</Note> : null}
        <div style={{ marginTop: "auto" }}>
          <PrimaryButton onClick={onConfirmAction}>Listo</PrimaryButton>
        </div>
      </Frame>
    );
  }

  if (seated.role === "guardian") {
    // The Curandero can never watch over himself, nor the same cat two nights
    // running: exclude both his own seat and last night's ward from the grid.
    // The "already warded" note is only meaningful when last night's ward is
    // still ALIVE — a dead cat is not a candidate anyway, so the note would just
    // point at an irrelevant exclusion.
    const lastWardedPlayer = lastWarded
      ? game.players.find((player) => player.id === lastWarded)
      : undefined;
    const lastWardedName =
      lastWardedPlayer && lastWardedPlayer.alive ? lastWardedPlayer.name : undefined;
    const candidates = living.filter(
      (player) => player.id !== seated.id && player.id !== lastWarded,
    );
    return (
      <Frame
        title="Eres el Curandero de la Camada"
        body="Cura a un gato esta noche y sobrevivirá a un ataque. Nunca a ti mismo."
      >
        {lastWardedName ? (
          <Note tone="var(--lyk-gold)">
            No puedes cuidar a {lastWardedName} otra vez: anoche ya lo curaste.
          </Note>
        ) : null}
        <PlayerGrid
          players={candidates}
          selectedId={protectedId}
          actionLabel={(name) => `Curar a ${name}`}
          onSelect={onSelectProtected}
        />
        <PassOption
          label="Nadie / pasar"
          selected={protectedId === null}
          onClick={() => onSelectProtected(null)}
        />
        <div style={{ marginTop: "auto" }}>
          <PrimaryButton onClick={onConfirmAction}>Listo</PrimaryButton>
        </div>
      </Frame>
    );
  }

  if (seated.role === "hunter") {
    // The Cazador PRE-COMMITS in his sleep: he never learns tonight whether he
    // died, so he picks now whom to take if the pack kills him. He can never
    // target himself, and "A nadie" leaves the shot empty.
    const candidates = living.filter((player) => player.id !== seated.id);
    return (
      <Frame
        title="Eres el Cazador de Sombras"
        body="Si esta noche te matan, ¿a quién te llevas contigo?"
      >
        <PlayerGrid
          players={candidates}
          selectedId={hunterShotId}
          actionLabel={(name) => `Llevarse a ${name}`}
          onSelect={onSelectHunterShot}
        />
        <PassOption
          label="A nadie"
          selected={hunterShotId === null}
          onClick={() => onSelectHunterShot(null)}
        />
        <div style={{ marginTop: "auto" }}>
          <PrimaryButton onClick={onConfirmAction}>Listo</PrimaryButton>
        </div>
      </Frame>
    );
  }

  // Cupido acts ONLY on the first night: he links two cats (himself allowed) as
  // lovers for the whole game. On any later night he has no action and just
  // passes (falls through to the villager screen below).
  if (seated.role === "cupid" && game.round === 1) {
    // Candidates are ALL the living cats, including Cupido himself. He taps to
    // select exactly two; a tap toggles, and once two are chosen a further tap
    // on a new cat replaces the oldest pick (see the container's toggle logic).
    const chosen = cupidPick
      .map((id) => game.players.find((p) => p.id === id)?.name)
      .filter((name): name is string => name !== undefined);
    return (
      <Frame
        title="Eres Cupido"
        body="Esta primera noche enlazas a dos gatos para toda la partida. Puedes incluirte. Si uno cae, el otro lo sigue."
      >
        {chosen.length > 0 ? (
          <Note tone="var(--lyk-gold)">
            {chosen.length === 2
              ? `Vas a enamorar a ${chosen[0]} y ${chosen[1]}.`
              : `Elegiste a ${chosen[0]}. Falta uno más.`}
          </Note>
        ) : null}
        <PlayerGrid
          players={living}
          selectedId={null}
          multiSelectedIds={cupidPick}
          actionLabel={(name) => `Enamorar a ${name}`}
          onSelect={onToggleCupidPick}
        />
        <div style={{ marginTop: "auto" }}>
          <PrimaryButton
            onClick={onConfirmAction}
            disabled={cupidPick.length !== 2}
          >
            Enamorar a estos dos
          </PrimaryButton>
        </div>
      </Frame>
    );
  }

  // La Bruja acts while she still holds at least one potion. The flags live in
  // `game` and persist across nights; when both are gone she falls through to the
  // plain sleep screen below (same as a villager). She never sees the pack's
  // victim — the life potion is reserved blind.
  if (seated.role === "witch" && (game.witchHeal || game.witchPoison)) {
    const poisonCandidates = living.filter((player) => player.id !== seated.id);
    return (
      <Frame
        title="Eres la Gata del Bosque"
        body="Dos frascos, uno por partida. Usa los que quieras esta noche."
      >
        {game.witchHeal ? (
          <>
            <Note tone="var(--lyk-gold)">
              La poción de vida se reserva a ciegas: salva a quien la manada
              marque esta noche. Si no cae nadie, vuelve a tu frasco.
            </Note>
            <PassOption
              label="Reservar la poción de vida esta noche"
              selected={healReserved}
              onClick={onToggleHealReserve}
            />
          </>
        ) : null}
        {game.witchPoison ? (
          <>
            <Note tone="var(--lyk-blood-bright)">
              El veneno mata sin remedio: ni el Curandero puede salvarlo.
            </Note>
            <PlayerGrid
              players={poisonCandidates}
              selectedId={witchPoisonId}
              actionLabel={(name) => `Envenenar a ${name}`}
              onSelect={onSelectWitchPoison}
            />
            <PassOption
              label="No envenenar"
              selected={witchPoisonId === null}
              onClick={() => onSelectWitchPoison(null)}
            />
          </>
        ) : null}
        <div style={{ marginTop: "auto" }}>
          <PrimaryButton onClick={onConfirmAction}>Listo</PrimaryButton>
        </div>
      </Frame>
    );
  }

  // villager (and Cupido on later nights, or La Bruja with no potions left): no
  // night action.
  return (
    <Frame
      title={`Eres ${roleInfo(seated.role).name}`}
      body="Duermes tranquilo, nada que hacer esta noche."
    >
      <div style={{ marginTop: "auto" }}>
        <PrimaryButton onClick={onConfirmAction}>Listo</PrimaryButton>
      </div>
    </Frame>
  );
}

/**
 * The dawn report. It lists every cat the night claimed WITHOUT implying a cause
 * between them — deaths can be independent now (La Bruja's poison kills on its
 * own, apart from the wolves' victim), so the old "se llevó consigo a" phrasing
 * would wrongly read as one death causing the others. The wolves' victim leads
 * when there was one; otherwise the first fallen cat leads. The copy is
 * gender-neutral.
 */
function Dawn({
  fallenNames,
  spared,
  onContinue,
}: {
  fallenNames: readonly string[];
  spared: boolean;
  onContinue: () => void;
}) {
  const fell = fallenNames.length > 0;
  const [first, ...rest] = fallenNames;
  // The trailing fallen, joined gender-neutrally: "B", "B y C", "B, C y D".
  const restJoined =
    rest.length <= 1
      ? (rest[0] ?? "")
      : `${rest.slice(0, -1).join(", ")} y ${rest[rest.length - 1]}`;
  const body = !fell
    ? "Amaneció sin bajas."
    : rest.length === 0
      ? `Amanece. ${first} no volvió al callejón.`
      : `Amanece. ${first} no volvió al callejón. ${restJoined} tampoco.`;
  return (
    <Frame title="Amanece" body={body}>
      <Note tone={fell ? "var(--lyk-blood-bright)" : "var(--lyk-gold)"}>
        {fell
          ? "El callejón cuenta sus ausencias al amanecer."
          : spared
            ? "La manada no se puso de acuerdo. Nadie cayó esta noche."
            : "El umbral resistió. Nadie cayó esta noche."}
      </Note>
      <div style={{ marginTop: "auto" }}>
        <PrimaryButton onClick={onContinue}>Volver al callejón</PrimaryButton>
      </div>
    </Frame>
  );
}

/** Shared night scaffold: title, body copy and a column of children. */
function Frame({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        height: "100%",
        animation: "lyk-rise .4s ease both",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <h3
          style={{
            margin: 0,
            fontFamily: "var(--lyk-serif)",
            fontWeight: 400,
            fontSize: "clamp(24px, 6.5vw, 30px)",
            lineHeight: 1.1,
            color: "var(--lyk-ink-strong)",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: "13.5px",
            lineHeight: 1.55,
            color: "var(--lyk-muted-2)",
            textWrap: "pretty",
          }}
        >
          {body}
        </p>
      </div>
      {children}
    </div>
  );
}

/** A small tinted note block used for readings, pack lists and vote tallies. */
function Note({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "12px 14px",
        borderLeft: `2px solid ${tone}`,
        background: "rgba(255,255,255,.03)",
        fontSize: "13px",
        lineHeight: 1.5,
        color: "var(--lyk-ink)",
      }}
    >
      {children}
    </div>
  );
}

/** The "nobody / pass" option shared by the ward turn. */
function PassOption({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      onClick={onClick}
      style={{
        padding: "12px",
        border: `1px solid ${selected ? "var(--lyk-gold)" : "#2a2d33"}`,
        background: "rgba(255,255,255,.015)",
        color: selected ? "var(--lyk-gold)" : "var(--lyk-ink)",
        fontSize: "12px",
        letterSpacing: ".14em",
        textTransform: "uppercase",
        cursor: "pointer",
        transition: "border-color .2s, color .2s",
      }}
    >
      {label}
    </button>
  );
}

/**
 * A grid of players. Tapping a tile selects it (highlight); the selected id is
 * controlled by the parent.
 */
function PlayerGrid({
  players,
  selectedId,
  multiSelectedIds,
  actionLabel,
  onSelect,
}: {
  players: readonly Player[];
  selectedId: string | null;
  /** When present, ANY id in this set is highlighted (multi-select grids). */
  multiSelectedIds?: readonly string[];
  actionLabel: (name: string) => string;
  onSelect: (playerId: string) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(112px, 1fr))",
        gap: "8px",
        overflowY: "auto",
        paddingRight: "2px",
      }}
    >
      {players.map((player) => {
        const selected =
          player.id === selectedId ||
          (multiSelectedIds?.includes(player.id) ?? false);
        const tone = selected ? "var(--lyk-gold)" : "var(--lyk-faint)";
        return (
          <button
            key={player.id}
            type="button"
            aria-label={actionLabel(player.name)}
            aria-pressed={selected}
            onClick={() => onSelect(player.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
              padding: "10px",
              border: `1px solid ${selected ? "var(--lyk-gold)" : "#2a2d33"}`,
              background: selected
                ? "rgba(198,161,90,.08)"
                : "rgba(255,255,255,.015)",
              cursor: "pointer",
              textAlign: "left",
              transition: "border-color .2s, background .2s",
            }}
          >
            <CatIcon stroke={tone} />
            <span
              style={{
                fontSize: "13px",
                color: "var(--lyk-ink)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                minWidth: 0,
              }}
            >
              {player.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
