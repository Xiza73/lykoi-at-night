---
description: Pasos de build y empaquetado multiplataforma con Tauri v2
argument-hint: "[desktop | android | ios | all]"
allowed-tools: Read, Bash(npm run build:*), Bash(npm run test:*), Bash(npm run lint:*), Bash(npm run tauri:*), Bash(cargo build:*)
---

Preparar el empaquetado de la app. Target: $ARGUMENTS (por defecto: desktop).

Pre-checks (obligatorios antes de empaquetar):
1. `npm run lint` — sin errores.
2. `npm run test` — toda la suite en verde.
3. `npm run build` — el frontend Vite compila limpio.

Empaquetado según target:
- **desktop**: `npm run tauri build` (genera binarios macOS/Windows/Linux según el host).
- **android**: `npm run tauri android build` (requiere Android SDK/NDK configurados).
- **ios**: `npm run tauri ios build` (requiere Xcode y firma configurada).
- **all**: correr los targets disponibles en el host actual.

Notas:
- La firma de código (code signing) para móvil/desktop se configura aparte;
  verificá certificados antes de un release real.
- Reportá los artefactos generados y su ubicación en `src-tauri/target/`.
