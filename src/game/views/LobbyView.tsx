import { useState } from "react";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  type RoleConfig,
  type Seat,
} from "../../domain/game/player";
import { PrimaryButton } from "../components/PrimaryButton";
import { CatIcon } from "../components/CatIcon";
import { maxWolves } from "../roleLabels";
import {
  COMING_SOON_ROLES,
  defaultName,
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
    presetConfig("classic", DEFAULT_COUNT),
  );
  const [preset, setPreset] = useState<PresetId>("classic");
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
          Un solo teléfono, se pasa de mano en mano. Empezá por cuántos se sientan
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
  const wolves = presetConfig("basic", count).werewolves;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <h3 style={headingStyle}>Elegí el modo</h3>
        <p style={subtitleStyle}>
          Para {count} gatos. Podés ajustar la mano en el siguiente paso.
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
        <PresetCard
          title="Básico"
          detail={`Solo Lykoi (${wolves}) y gatos honestos.`}
          onSelect={() => onPick("basic")}
        />
        <PresetCard
          title="Clásico"
          detail={`${wolves} Lykoi, Vidente y Guardián del Umbral.`}
          onSelect={() => onPick("classic")}
        />
        <PresetCard
          title="Avanzado"
          detail="Clásico + el Cazador de Sombras y la Madre Camada."
          onSelect={() => onPick("advanced")}
        />
        <PresetCard
          title="Personalizado"
          detail="Armá tu propia mano, rol por rol."
          onSelect={() => onPick("custom")}
        />
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
  // The Madre Camada and the Ronroneo Falso are wolf-aligned, so they count
  // toward the pack for both the strict-minority check and the specials-fit check
  // (mirrors the domain).
  const wolfSpecials = (config.infector ? 1 : 0) + (config.trickster ? 1 : 0);
  const wolfCount = config.werewolves + wolfSpecials;
  // The werewolves stepper bound leaves room for the wolf-aligned specials when
  // they are in play, so the pack (werewolves + infector + trickster) never
  // reaches the strict-minority ceiling maxWolves enforces.
  const upper = Math.max(1, maxWolves(count) - wolfSpecials);
  const specials =
    wolfCount +
    (config.seer ? 1 : 0) +
    (config.guardian ? 1 : 0) +
    (config.hunter ? 1 : 0);
  const town = count - wolfCount;
  const configValid =
    config.werewolves >= 1 && wolfCount < town && specials <= count;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <h3 style={headingStyle}>La mesa</h3>
        <p style={subtitleStyle}>
          Confirmá la mano y anotá a cada gato. Después, a repartir.
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
            fontSize: "10px",
            letterSpacing: ".26em",
            textTransform: "uppercase",
            color: "var(--lyk-faint)",
          }}
        >
          Lykoi
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
        active={config.seer}
        onToggle={() => onChange({ ...config, seer: !config.seer })}
      />
      <RoleToggle
        label="Guardián del Umbral"
        active={config.guardian}
        onToggle={() => onChange({ ...config, guardian: !config.guardian })}
      />
      <RoleToggle
        label="Cazador de Sombras"
        active={config.hunter ?? false}
        onToggle={() => onChange({ ...config, hunter: !config.hunter })}
      />
      <RoleToggle
        label="Madre Camada"
        active={config.infector ?? false}
        onToggle={() => onChange({ ...config, infector: !config.infector })}
      />
      <RoleToggle
        label="Ronroneo Falso"
        active={config.trickster ?? false}
        onToggle={() => onChange({ ...config, trickster: !config.trickster })}
      />

      {showComingSoon
        ? COMING_SOON_ROLES.map((role) => <RoleToggle key={role} label={role} comingSoon />)
        : null}
    </div>
  );
}

function RoleToggle({
  label,
  active = false,
  comingSoon = false,
  onToggle,
}: {
  label: string;
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
      <span>{label}</span>
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
