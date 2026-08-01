# CLAUDE.md — Lykoi at Night

Instrucciones del equipo para trabajar en este proyecto con Claude Code.
Este archivo se commitea y lo lee Claude Code automáticamente en cada sesión.

## Contexto del proyecto

**Lykoi at Night** es una adaptación digital del juego de mesa **Salem 1692**, con
temática felina (los "Lykoi" — gatos con aspecto de hombre lobo). Es un juego de
**deducción social** (party game estilo Werewolf/Mafia): un grupo de jugadores
intenta descubrir quiénes son las brujas antes de que las acusaciones falsas
destruyan al pueblo.

El objetivo es que el juego corra **cross-platform** (móvil y escritorio) sobre
un mismo código, empaquetado con **Tauri v2**.

## Usuarios y alcance (MVP)

- **Usuarios**: grupos de amigos / jugadores casuales que quieren jugar juntos,
  presencialmente o a distancia.
- **Modos de juego** (con complejidad MUY distinta — importa para el orden del MVP):
  - **Local "pass-and-play"** — todos los jugadores comparten un solo dispositivo
    y se lo van pasando. **Sin backend, sin auth.** Es el MVP.
  - **Multiplayer online** — cada jugador en su dispositivo, estado sincronizado
    por red. Requiere servidor + Auth. **Fase 2, no MVP.**
- **MVP mínimo acordado**:
  1. Motor de reglas del juego (roles, fases día/noche, acusaciones, condiciones
     de victoria) — agnóstico de la UI y 100% testeable.
  2. Modo local pass-and-play jugable de principio a fin en un dispositivo.
  3. UI temática felina básica pero clara.
- **Fuera del MVP**: online multiplayer, cuentas de usuario, persistencia en la
  nube, matchmaking, ranking.

## Stack y herramientas

- **Frontend**: React + TypeScript, bundler **Vite**.
- **Shell multiplataforma**: **Tauri v2** (core en Rust; WebView del sistema).
  Soporta desktop (macOS/Windows/Linux) y móvil (iOS/Android).
- **Gestor de paquetes y runner de scripts**: **Bun** (`bun install`, `bun run …`).
- **Testing**: **Vitest** (unit + componentes con React Testing Library), ejecutado con `bun run test`.
- **Lenguaje**: TypeScript en modo estricto para el frontend; Rust para el core Tauri.
- **Estructura**: single-package (no monorepo). El frontend vive en la raíz;
  el core Tauri en `src-tauri/`.

## Comandos clave

> Estándar del stack Tauri + Vite. Ajustar en `package.json` cuando exista.

| Acción       | Comando                |
| ------------ | ---------------------- |
| Dev (web)    | `bun run dev`          |
| Dev (Tauri)  | `bun run tauri dev`    |
| Build (web)  | `bun run build`        |
| Build (app)  | `bun run tauri build`  |
| Tests        | `bun run test`         |
| Tests (watch)| `bun run test:watch`   |
| Lint         | `bun run lint`         |
| Typecheck    | `bun run typecheck`    |

## Convenciones de código

- **Idioma del código**: identificadores, comentarios y UI copy en **inglés**.
- **TypeScript estricto**: sin `any` implícito; tipar los contratos del dominio.
- **Componentes**: funcionales + hooks. Separar **container / presentational**.
- **Diseño de UI**: atomic design (atoms → molecules → organisms).
- **Dominio primero**: el motor de reglas del juego NO depende de React ni de
  Tauri. Vive aislado y se testea solo (arquitectura hexagonal / screaming).
- **Tests**: comportamiento sobre implementación. Todo el motor de reglas cubierto.
- **Commits**: **Conventional Commits** (`feat:`, `fix:`, `chore:`, `test:`,
  `refactor:`, `docs:`). Sin atribución de IA en los mensajes.

## Estructura del repositorio

```
lykoi-at-night/
├── src/                    # Frontend React
│   ├── domain/             # Motor de reglas del juego (sin UI) ← corazón del MVP
│   ├── components/         # UI (atomic design: atoms/molecules/organisms)
│   ├── features/           # Casos de uso por feature (local play, etc.)
│   └── main.tsx            # Entry point Vite
├── src-tauri/              # Core Tauri (Rust): comandos, permisos, config
├── .claude/                # Config de Claude Code (este proyecto)
├── CLAUDE.md               # Instrucciones del equipo (este archivo)
└── package.json
```

## Integraciones externas

- **Auth** — SOLO para el multiplayer online (Fase 2). El MVP local no la usa.
  Proveedor a decidir (Supabase Auth / Clerk / Auth0). **No integrar todavía.**

## Reglas de trabajo con Claude

**Hacé:**
- Entender el concepto ANTES de escribir código. Los fundamentos primero.
- Mantener el motor de reglas aislado de la UI y totalmente testeado.
- Proponer alternativas con tradeoffs cuando haya una decisión real.
- Verificar afirmaciones técnicas contra el código antes de darlas por ciertas.
- Usar Conventional Commits.

**NO hagas:**
- NO agregues online multiplayer ni Auth hasta cerrar el MVP local.
- NO metas lógica de juego dentro de componentes React.
- NO agregues dependencias pesadas sin justificar el tradeoff.
- NO uses `cat`/`grep`/`find`/`ls`; usá `bat`/`rg`/`fd`/`eza`.
- NO agregues atribución de IA a los commits.
