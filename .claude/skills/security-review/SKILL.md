---
name: security-review
description: Auditoría de seguridad para una app Tauri v2 + React. Se activa al revisar permisos/capabilities de Tauri, comandos IPC, manejo de secretos, validación de input del dominio del juego, o antes de un release. Trigger cuando el usuario menciona seguridad, permisos, capabilities, IPC o exposición de datos.
---

# Security Review — Lykoi at Night

Revisión de seguridad enfocada en el stack **Tauri v2 + React**.

## Cuándo aplicar
- Cambios en `src-tauri/` (comandos, `tauri.conf.json`, capabilities/permissions).
- Antes de empaquetar un release.
- Cuando entre Auth o multiplayer online (Fase 2).

## Checklist

### Tauri core
- **Capabilities mínimas**: cada ventana expone SOLO los permisos que necesita.
  Nada de habilitar plugins/comandos "por las dudas".
- **Comandos IPC**: todo comando `#[tauri::command]` valida y sanitiza sus inputs.
  Nunca confiar en datos que vienen del WebView.
- **allowlist / CSP**: revisar la Content Security Policy en `tauri.conf.json`.
  Sin `unsafe-inline` ni orígenes remotos innecesarios.
- **Filesystem / shell**: si se usan los plugins `fs` o `shell`, limitar scopes.

### Dominio del juego
- El estado autoritativo de roles ocultos (quién es bruja) NO debe filtrarse al
  cliente cuando exista modo online. En pass-and-play local es aceptable, pero
  documentar el límite.
- Validar transiciones de fase e input de jugador contra el motor de reglas.

### Secretos y Auth (Fase 2)
- Ningún secreto/API key en el frontend ni en el bundle.
- Tokens de Auth en almacenamiento seguro del OS, no en `localStorage`.

## Salida
Reportá hallazgos por severidad (crítico / alto / medio / bajo) con archivo,
línea y remediación concreta. No apliques cambios salvo que te lo pidan.
