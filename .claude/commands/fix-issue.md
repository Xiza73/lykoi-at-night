---
description: Workflow para resolver un bug — reproducir, aislar, arreglar con test
argument-hint: "<número o descripción del issue>"
allowed-tools: Read, Edit, Grep, Glob, Bash(git diff:*), Bash(git status:*), Bash(bun run test:*), Bash(bun run lint:*)
---

Resolvé el siguiente bug: $ARGUMENTS

Seguí este workflow (concepto antes que código):
1. **Entender**: leé el issue y el código relacionado. Explicá la causa raíz
   probable ANTES de tocar nada.
2. **Reproducir**: escribí primero un test que falle y demuestre el bug (TDD).
3. **Aislar**: identificá el punto exacto del fallo. Si toca el motor de reglas
   (`src/domain/`), el fix debe quedar cubierto por tests de dominio.
4. **Arreglar**: hacé el cambio mínimo que hace pasar el test.
5. **Verificar**: `bun run test` y `bun run lint` en verde.
6. Proponé un mensaje de commit en formato Conventional Commits (`fix: ...`).
   NO commitees hasta que te den el OK.
