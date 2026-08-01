import { MAX_PLAYERS, MIN_PLAYERS } from "../../domain/game/player";
import { PrimaryButton } from "../components/PrimaryButton";
import { CatIcon } from "../components/CatIcon";

/** Bounds for the number of Lykoi/witches the host can pick. */
export const MIN_WITCHES = 2;
export const MAX_WITCHES = 5;

interface LobbyViewProps {
  names: readonly string[];
  witchCount: number;
  onAddSeat: () => void;
  onRemoveSeat: (index: number) => void;
  onRenameSeat: (index: number, name: string) => void;
  onWitchCountChange: (witchCount: number) => void;
  onDeal: () => void;
}

/**
 * Pass-and-play lobby: edit the roster (4-12 seats) and choose how many Lykoi
 * hide among them, then deal. No room code — this is one shared device.
 */
export function LobbyView({
  names,
  witchCount,
  onAddSeat,
  onRemoveSeat,
  onRenameSeat,
  onWitchCountChange,
  onDeal,
}: LobbyViewProps) {
  const count = names.length;
  const canAdd = count < MAX_PLAYERS;
  const canRemove = count > MIN_PLAYERS;
  const allNamed = names.every((name) => name.trim().length > 0);
  const canDeal = count >= MIN_PLAYERS && witchCount < count && allNamed;

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}
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
          El callejón se llena
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: "13.5px",
            lineHeight: 1.55,
            color: "var(--lyk-muted-2)",
          }}
        >
          Un solo teléfono, se pasa de mano en mano. Anota a cada gato antes de
          repartir.
        </p>
      </div>

      <WitchPicker value={witchCount} max={count} onChange={onWitchCountChange} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          overflowY: "auto",
          paddingRight: "2px",
        }}
      >
        {names.map((name, index) => (
          <SeatRow
            key={index}
            index={index}
            name={name}
            canRemove={canRemove}
            onRename={(value) => onRenameSeat(index, value)}
            onRemove={() => onRemoveSeat(index)}
          />
        ))}
      </div>

      <PrimaryButton variant="ghost" onClick={onAddSeat} disabled={!canAdd}>
        + Añadir gato
      </PrimaryButton>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "12px",
            color: "var(--lyk-faint)",
          }}
        >
          <span>
            {count} de {MAX_PLAYERS} gatos
          </span>
          <span>
            {witchCount} Lykoi entre ellos
          </span>
        </div>
        <PrimaryButton onClick={onDeal} disabled={!canDeal}>
          Repartir los roles
        </PrimaryButton>
      </div>
    </div>
  );
}

function WitchPicker({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  // Witches must stay below the player count; the domain rejects >= count.
  const upper = Math.min(MAX_WITCHES, Math.max(MIN_WITCHES, max - 1));
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "12px 16px",
        border: "1px dashed #3a3833",
        background: "rgba(217,164,76,.04)",
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
          disabled={value <= MIN_WITCHES}
          onClick={() => onChange(value - 1)}
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
          {value}
        </span>
        <StepButton
          label="Más Lykoi"
          disabled={value >= upper}
          onClick={() => onChange(value + 1)}
        >
          +
        </StepButton>
      </div>
    </div>
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
        width: "30px",
        height: "30px",
        background: "none",
        border: "1px solid #3a3833",
        color: disabled ? "#4a463f" : "var(--lyk-ink)",
        fontSize: "18px",
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
  canRemove,
  onRename,
  onRemove,
}: {
  index: number;
  name: string;
  canRemove: boolean;
  onRename: (value: string) => void;
  onRemove: () => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <CatIcon stroke="#b9b2a4" size={18} />
      <input
        aria-label={`Nombre del gato ${index + 1}`}
        value={name}
        placeholder={`Gato ${index + 1}`}
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
      <button
        type="button"
        aria-label={`Quitar a ${name || `gato ${index + 1}`}`}
        disabled={!canRemove}
        onClick={onRemove}
        style={{
          width: "30px",
          height: "34px",
          flex: "none",
          background: "none",
          border: "1px solid #23252a",
          color: canRemove ? "var(--lyk-muted-2)" : "#3a3833",
          fontSize: "16px",
          lineHeight: 1,
          cursor: canRemove ? "pointer" : "not-allowed",
        }}
      >
        ×
      </button>
    </div>
  );
}
