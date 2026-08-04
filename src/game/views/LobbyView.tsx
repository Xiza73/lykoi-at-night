import { useState } from "react";
import {
  countSpecials,
  MAX_PLAYERS,
  MAX_VILLAGERS,
  MIN_PLAYERS,
  type RoleConfig,
  type Seat,
} from "../../domain/game/player";
import {
  balanceBand,
  configBalance,
  type BalanceBand,
} from "../../domain/game/balance";
import { roleWeight } from "../../domain/game/roles";
import { PrimaryButton } from "../components/PrimaryButton";
import { CatIcon } from "../components/CatIcon";
import { maxWolves } from "../roleLabels";
import {
  COMING_SOON_ROLES,
  defaultName,
  isPresetAvailable,
  PRESETS,
  presetConfig,
  type PresetId,
} from "../presets";

interface LobbyViewProps {
  /** Deals the roster: hands the finished seats and role config to the game. */
  onDeal: (seats: readonly Seat[], roleConfig: RoleConfig) => void;
}

/** The wizard's three sub-steps, walked in order (with back navigation). */
type SubStep = "count" | "preset" | "table";

const DEFAULT_COUNT = 6;

/** Builds a roster of `count` names, prefilled from the cat-name pool. */
function buildNames(count: number): string[] {
  return Array.from({ length: count }, (_, index) => defaultName(index));
}

/**
 * Pass-and-play lobby, reworked into a player-count-first presets wizard. It owns
 * all lobby state internally (count, chosen config, roster) and only reaches out
 * to the game at the very end, when the roles are dealt. No room code — this is
 * one shared device.
 */
export function LobbyView({ onDeal }: LobbyViewProps) {
  const [subStep, setSubStep] = useState<SubStep>("count");
  const [count, setCount] = useState(DEFAULT_COUNT);
  const [config, setConfig] = useState<RoleConfig>(() =>
    presetConfig("beginner", DEFAULT_COUNT),
  );
  const [preset, setPreset] = useState<PresetId>("beginner");
  const [names, setNames] = useState<string[]>(() => buildNames(DEFAULT_COUNT));

  const setCountTo = (next: number) => {
    const clamped = Math.min(Math.max(next, MIN_PLAYERS), MAX_PLAYERS);
    setCount(clamped);
    // Resize the roster, keeping any names the user already edited.
    setNames((prev) =>
      Array.from({ length: clamped }, (_, index) => prev[index] ?? defaultName(index)),
    );
  };

  const choosePreset = (chosen: PresetId) => {
    setPreset(chosen);
    // Clamp the resolved config's werewolves into the valid band for this count.
    const resolved = presetConfig(chosen, count);
    const upper = maxWolves(count);
    setConfig({
      ...resolved,
      werewolves: Math.min(Math.max(1, resolved.werewolves), upper),
    });
    setSubStep("table");
  };

  const handleDeal = () => {
    const seats: Seat[] = names.map((name, index) => ({
      id: `p${index + 1}`,
      name: name.trim() || defaultName(index),
    }));
    onDeal(seats, config);
  };

  if (subStep === "count") {
    return (
      <CountStep
        count={count}
        onChange={setCountTo}
        onNext={() => setSubStep("preset")}
      />
    );
  }

  if (subStep === "preset") {
    return (
      <PresetStep
        count={count}
        onPick={choosePreset}
        onBack={() => setSubStep("count")}
      />
    );
  }

  return (
    <TableStep
      count={count}
      preset={preset}
      config={config}
      names={names}
      onConfigChange={setConfig}
      onRename={(index, name) =>
        setNames((prev) => prev.map((value, i) => (i === index ? name : value)))
      }
      onEditCount={() => setSubStep("count")}
      onDeal={handleDeal}
    />
  );
}

const headingStyle = {
  margin: 0,
  fontFamily: "var(--lyk-serif)",
  fontWeight: 400,
  fontSize: "clamp(24px, 6.5vw, 30px)",
  lineHeight: 1.1,
  color: "var(--lyk-ink-strong)",
} as const;

const subtitleStyle = {
  margin: 0,
  fontSize: "13.5px",
  lineHeight: 1.55,
  color: "var(--lyk-muted-2)",
  textWrap: "pretty",
} as const;

/** Sub-step 1: pick how many cats play tonight. */
function CountStep({
  count,
  onChange,
  onNext,
}: {
  count: number;
  onChange: (next: number) => void;
  onNext: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <h3 style={headingStyle}>¿Cuántos gatos esta noche?</h3>
        <p style={subtitleStyle}>
          Un solo teléfono, se pasa de mano en mano. Empieza por cuántos se sientan
          a la mesa.
        </p>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "22px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "26px" }}>
          <StepButton
            label="Menos gatos"
            disabled={count <= MIN_PLAYERS}
            onClick={() => onChange(count - 1)}
          >
            −
          </StepButton>
          <span
            aria-label="Número de gatos"
            style={{
              fontFamily: "var(--lyk-serif)",
              fontSize: "clamp(64px, 22vw, 92px)",
              lineHeight: 1,
              color: "var(--lyk-gold)",
              minWidth: "1.4em",
              textAlign: "center",
            }}
          >
            {count}
          </span>
          <StepButton
            label="Más gatos"
            disabled={count >= MAX_PLAYERS}
            onClick={() => onChange(count + 1)}
          >
            +
          </StepButton>
        </div>
        <span
          style={{
            fontSize: "11px",
            letterSpacing: ".2em",
            textTransform: "uppercase",
            color: "var(--lyk-faint)",
          }}
        >
          {MIN_PLAYERS} a {MAX_PLAYERS} gatos
        </span>
      </div>

      <div style={{ marginTop: "auto" }}>
        <PrimaryButton onClick={onNext} style={{ width: "100%" }}>
          Siguiente
        </PrimaryButton>
      </div>
    </div>
  );
}

/**
 * Compact Spanish names for the special roles, used to summarise a preset's
 * hand on its card. The reveal cards in `roleInfo` carry the fuller titles.
 */
const SPECIAL_LABELS: { key: keyof RoleConfig; label: string }[] = [
  { key: "seer", label: "Vidente" },
  { key: "guardian", label: "Curandero" },
  { key: "hunter", label: "Cazador" },
  { key: "mayor", label: "Alcalde" },
  { key: "cupid", label: "Cupido" },
  { key: "witch", label: "Gata del Bosque" },
  { key: "littleRed", label: "Caperuza" },
];

/** A one-line summary of what a preset deals at the current player count. */
function presetSummary(preset: PresetId, count: number): string {
  if (preset === "custom") {
    return "Arma tu propia mano, rol por rol.";
  }
  const config = presetConfig(preset, count);
  const wolves = `${config.werewolves} Lykoi`;
  const specials = SPECIAL_LABELS.filter(({ key }) => config[key]).map(
    ({ label }) => label,
  );
  if (specials.length === 0) {
    return `${wolves} · Solo Lykoi y gatos honestos.`;
  }
  return [wolves, ...specials].join(" · ");
}

/** Sub-step 2: choose a preset (Básico / Clásico / Avanzado / Personalizado). */
function PresetStep({
  count,
  onPick,
  onBack,
}: {
  count: number;
  onPick: (preset: PresetId) => void;
  onBack: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <h3 style={headingStyle}>Elige el modo</h3>
        <p style={subtitleStyle}>
          Para {count} gatos. Puedes ajustar la mano en el siguiente paso.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          overflowY: "auto",
          paddingRight: "2px",
        }}
      >
        {PRESETS.map((meta) => {
          const available = isPresetAvailable(meta.id, count);
          return (
            <PresetCard
              key={meta.id}
              title={meta.name}
              detail={
                available
                  ? presetSummary(meta.id, count)
                  : `Desde ${meta.minPlayers} gatos.`
              }
              disabled={!available}
              onSelect={available ? () => onPick(meta.id) : undefined}
            />
          );
        })}
      </div>

      <div style={{ marginTop: "auto" }}>
        <PrimaryButton variant="ghost" onClick={onBack} style={{ width: "100%" }}>
          Volver
        </PrimaryButton>
      </div>
    </div>
  );
}

function PresetCard({
  title,
  detail,
  badge,
  disabled = false,
  onSelect,
}: {
  title: string;
  detail: string;
  badge?: string;
  disabled?: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={title}
      disabled={disabled}
      onClick={onSelect}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "6px",
        padding: "14px 16px",
        textAlign: "left",
        background: "rgba(255,255,255,.015)",
        border: "1px solid #2a2d33",
        color: "var(--lyk-ink)",
        opacity: disabled ? 0.42 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "border-color .2s, background .2s",
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontFamily: "var(--lyk-serif)",
          fontSize: "18px",
          color: disabled ? "var(--lyk-muted-2)" : "var(--lyk-gold)",
        }}
      >
        {title}
        {badge ? (
          <span
            style={{
              fontFamily: "var(--lyk-sans)",
              fontSize: "9px",
              letterSpacing: ".18em",
              textTransform: "uppercase",
              padding: "2px 7px",
              border: "1px solid #3a3833",
              color: "var(--lyk-faint)",
            }}
          >
            {badge}
          </span>
        ) : null}
      </span>
      <span style={{ fontSize: "12.5px", lineHeight: 1.5, color: "var(--lyk-muted-2)" }}>
        {detail}
      </span>
    </button>
  );
}

/** Sub-step 3: confirm and edit the resolved hand, then deal. */
function TableStep({
  count,
  preset,
  config,
  names,
  onConfigChange,
  onRename,
  onEditCount,
  onDeal,
}: {
  count: number;
  preset: PresetId;
  config: RoleConfig;
  names: readonly string[];
  onConfigChange: (config: RoleConfig) => void;
  onRename: (index: number, name: string) => void;
  onEditCount: () => void;
  onDeal: () => void;
}) {
  // Only the werewolves are wolf-aligned now, so the pack is exactly the
  // werewolf count for both the strict-minority check and the specials-fit check.
  const wolfCount = config.werewolves;
  const upper = maxWolves(count);
  const specials = countSpecials(config);
  const villagers = count - specials;
  const town = count - wolfCount;
  const configValid =
    config.werewolves >= 1 &&
    wolfCount < town &&
    specials <= count &&
    villagers <= MAX_VILLAGERS;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <h3 style={headingStyle}>La mesa</h3>
        <p style={subtitleStyle}>
          Confirma la mano y anota a cada gato. Después, a repartir.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          overflowY: "auto",
          paddingRight: "2px",
        }}
      >
        <CountLabel count={count} onEdit={onEditCount} />

        <BalanceBar config={config} count={count} />

        <RolePicker
          config={config}
          upper={upper}
          showComingSoon={preset === "custom"}
          onChange={onConfigChange}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {names.map((name, index) => (
            <SeatRow
              key={index}
              index={index}
              name={name}
              onRename={(value) => onRename(index, value)}
            />
          ))}
        </div>
      </div>

      <div style={{ marginTop: "auto" }}>
        <PrimaryButton onClick={onDeal} disabled={!configValid} style={{ width: "100%" }}>
          Repartir los roles
        </PrimaryButton>
      </div>
    </div>
  );
}

/** The player-count reminder with a control to go back and change it. */
function CountLabel({ count, onEdit }: { count: number; onEdit: () => void }) {
  return (
    <button
      type="button"
      aria-label="Cambiar la cantidad de gatos"
      onClick={onEdit}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "10px 14px",
        background: "rgba(217,164,76,.04)",
        border: "1px dashed #3a3833",
        color: "var(--lyk-ink)",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span style={{ fontSize: "12.5px", color: "var(--lyk-muted-2)" }}>
        {count} gatos · ¿Es la cantidad correcta?
      </span>
      <span
        style={{
          fontSize: "10px",
          letterSpacing: ".18em",
          textTransform: "uppercase",
          color: "var(--lyk-gold)",
        }}
      >
        Cambiar
      </span>
    </button>
  );
}

/** The Spanish label shown for each balance band. */
const BAND_LABELS: Record<BalanceBand, string> = {
  wolfHeavy: "Muy a favor de los Lykoi",
  experienced: "Para veteranos",
  even: "Parejo",
  beginner: "Para principiantes",
  townHeavy: "Muy a favor del pueblo",
};

/** The accent colour for each band: wolf-red for negative, gold for town, neutral at even. */
const BAND_COLORS: Record<BalanceBand, string> = {
  wolfHeavy: "var(--lyk-blood-bright)",
  experienced: "var(--lyk-blood-bright)",
  even: "var(--lyk-muted-2)",
  beginner: "var(--lyk-gold)",
  townHeavy: "var(--lyk-gold)",
};

/** Renders a signed total with a real minus sign and an explicit plus. */
function formatSigned(total: number): string {
  if (total > 0) return `+${total}`;
  if (total < 0) return `−${Math.abs(total)}`;
  return "0";
}

/**
 * Live balance readout: sums the hand's role weights and shows the signed total,
 * coloured and labelled by band, so players can tune the game before dealing.
 * Presentational — it only calls the two pure domain functions.
 */
function BalanceBar({ config, count }: { config: RoleConfig; count: number }) {
  const total = configBalance(config, count);
  const band = balanceBand(total);
  const color = BAND_COLORS[band];

  return (
    <div
      aria-label="Equilibrio de la partida"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        padding: "10px 14px",
        border: "1px dashed #3a3833",
        background: "rgba(217,164,76,.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <span
          style={{
            fontSize: "10px",
            letterSpacing: ".26em",
            textTransform: "uppercase",
            color: "var(--lyk-faint)",
          }}
        >
          Equilibrio
        </span>
        <span
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "12.5px", color: "var(--lyk-muted-2)" }}>
            {BAND_LABELS[band]}
          </span>
          <span
            style={{
              fontFamily: "var(--lyk-serif)",
              fontSize: "26px",
              lineHeight: 1,
              color,
              minWidth: "1.6em",
              textAlign: "right",
            }}
          >
            {formatSigned(total)}
          </span>
        </span>
      </div>
      <span
        style={{
          fontSize: "11px",
          lineHeight: 1.4,
          color: "var(--lyk-faint)",
        }}
      >
        El punto justo está entre −3 y +3.
      </span>
    </div>
  );
}

function RolePicker({
  config,
  upper,
  showComingSoon,
  onChange,
}: {
  config: RoleConfig;
  upper: number;
  showComingSoon: boolean;
  onChange: (config: RoleConfig) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        padding: "12px 16px",
        border: "1px dashed #3a3833",
        background: "rgba(217,164,76,.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "8px",
            fontSize: "10px",
            letterSpacing: ".26em",
            textTransform: "uppercase",
            color: "var(--lyk-faint)",
          }}
        >
          Lykoi
          <RoleWeight weight={roleWeight("werewolf")} suffix=" c/u" />
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <StepButton
            label="Menos Lykoi"
            disabled={config.werewolves <= 1}
            onClick={() => onChange({ ...config, werewolves: config.werewolves - 1 })}
          >
            −
          </StepButton>
          <span
            aria-label="Número de Lykoi"
            style={{
              fontFamily: "var(--lyk-serif)",
              fontSize: "26px",
              color: "var(--lyk-gold)",
              minWidth: "20px",
              textAlign: "center",
            }}
          >
            {config.werewolves}
          </span>
          <StepButton
            label="Más Lykoi"
            disabled={config.werewolves >= upper}
            onClick={() => onChange({ ...config, werewolves: config.werewolves + 1 })}
          >
            +
          </StepButton>
        </div>
      </div>

      <RoleToggle
        label="Vidente"
        weight={roleWeight("seer")}
        active={config.seer}
        onToggle={() => onChange({ ...config, seer: !config.seer })}
      />
      <RoleToggle
        label="Curandero de la Camada"
        weight={roleWeight("guardian")}
        active={config.guardian}
        onToggle={() => onChange({ ...config, guardian: !config.guardian })}
      />
      <RoleToggle
        label="Cazador de Sombras"
        weight={roleWeight("hunter")}
        active={config.hunter ?? false}
        onToggle={() => onChange({ ...config, hunter: !config.hunter })}
      />
      <RoleToggle
        label="Alcalde del Tejado"
        weight={roleWeight("mayor")}
        active={config.mayor ?? false}
        onToggle={() => onChange({ ...config, mayor: !config.mayor })}
      />
      <RoleToggle
        label="Cupido"
        weight={roleWeight("cupid")}
        active={config.cupid ?? false}
        onToggle={() => onChange({ ...config, cupid: !config.cupid })}
      />
      <RoleToggle
        label="La Gata del Bosque"
        weight={roleWeight("witch")}
        active={config.witch ?? false}
        onToggle={() => onChange({ ...config, witch: !config.witch })}
      />
      <RoleToggle
        label="Caperuza"
        weight={roleWeight("littleRed")}
        active={config.littleRed ?? false}
        onToggle={() => onChange({ ...config, littleRed: !config.littleRed })}
      />

      {showComingSoon
        ? COMING_SOON_ROLES.map((role) => <RoleToggle key={role} label={role} comingSoon />)
        : null}
    </div>
  );
}

/**
 * A subtle signed balance weight (e.g. "+7", "−2"), rendered in the muted style
 * so it reads as a hint next to a role control without crowding it. The optional
 * suffix carries "per unit" wording for the repeatable Lykoi stepper.
 */
function RoleWeight({ weight, suffix = "" }: { weight: number; suffix?: string }) {
  return (
    <span
      aria-hidden="true"
      style={{
        fontSize: "10px",
        fontVariantNumeric: "tabular-nums",
        letterSpacing: "0",
        textTransform: "none",
        color: "var(--lyk-faint)",
      }}
    >
      {formatSigned(weight)}
      {suffix}
    </span>
  );
}

function RoleToggle({
  label,
  weight,
  active = false,
  comingSoon = false,
  onToggle,
}: {
  label: string;
  /** The role's signed balance weight, shown as a subtle hint. */
  weight?: number;
  active?: boolean;
  comingSoon?: boolean;
  onToggle?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={comingSoon ? undefined : active}
      disabled={comingSoon}
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "9px 12px",
        background: active ? "rgba(198,161,90,.08)" : "rgba(255,255,255,.015)",
        border: `1px solid ${active ? "var(--lyk-gold)" : "#2a2d33"}`,
        color: active ? "var(--lyk-gold)" : "var(--lyk-muted-2)",
        fontFamily: "var(--lyk-sans)",
        fontSize: "12.5px",
        opacity: comingSoon ? 0.42 : 1,
        cursor: comingSoon ? "not-allowed" : "pointer",
        transition: "border-color .2s, color .2s, background .2s",
      }}
    >
      <span style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
        {label}
        {weight !== undefined ? <RoleWeight weight={weight} /> : null}
      </span>
      <span
        style={{
          fontSize: "10px",
          letterSpacing: ".18em",
          textTransform: "uppercase",
        }}
      >
        {comingSoon ? "Próximamente" : active ? "En juego" : "Fuera"}
      </span>
    </button>
  );
}

function StepButton({
  children,
  label,
  disabled,
  onClick,
}: {
  children: string;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: "40px",
        height: "40px",
        background: "none",
        border: "1px solid #3a3833",
        color: disabled ? "#4a463f" : "var(--lyk-ink)",
        fontSize: "22px",
        lineHeight: 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

function SeatRow({
  index,
  name,
  onRename,
}: {
  index: number;
  name: string;
  onRename: (value: string) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <CatIcon stroke="#b9b2a4" size={18} />
      <input
        aria-label={`Nombre del gato ${index + 1}`}
        value={name}
        placeholder={defaultName(index)}
        onChange={(event) => onRename(event.target.value)}
        style={{
          flex: 1,
          minWidth: 0,
          padding: "9px 10px",
          background: "rgba(255,255,255,.015)",
          border: "1px solid #23252a",
          color: "var(--lyk-ink)",
          fontFamily: "var(--lyk-sans)",
          fontSize: "13px",
        }}
      />
    </div>
  );
}
