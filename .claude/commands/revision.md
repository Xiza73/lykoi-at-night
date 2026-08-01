---
description: Revisión de código del diff actual — correctitud, dominio del juego y convenciones
argument-hint: "[ruta o descripción opcional del alcance]"
allowed-tools: Read, Grep, Glob, Bash(git diff:*), Bash(git status:*), Bash(bun run test:*), Bash(bun run lint:*)
---

Revisá los cambios pendientes en la rama actual.

Alcance: $ARGUMENTS (si está vacío, revisá todo el diff sin commitear).

Pasos:
1. Ejecutá `git status` y `git diff` para ver qué cambió.
2. Revisá contra las convenciones de `CLAUDE.md`:
   - El motor de reglas del juego (`src/domain/`) NO debe importar React ni Tauri.
   - Componentes funcionales, separación container/presentational.
   - TypeScript estricto, sin `any`.
   - Nombres e identificadores en inglés.
3. Buscá bugs de correctitud, edge cases del dominio (roles, fases, victoria) y
   estado mal manejado.
4. Corré `bun run lint` y `bun run test` si hay lógica tocada.
5. Reportá hallazgos ordenados por severidad. NO cambies código salvo que te lo pidan.
