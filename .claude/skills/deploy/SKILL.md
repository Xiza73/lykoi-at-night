---
name: deploy
description: Guía de build y empaquetado multiplataforma con Tauri v2 (desktop, Android, iOS) para Lykoi at Night. Trigger cuando el usuario quiere empaquetar, buildear, releasear, firmar o distribuir la app.
---

# Deploy — Lykoi at Night (Tauri v2)

Empaquetado multiplataforma de la app.

## Pre-flight (siempre)
1. `bun run lint` en verde.
2. `bun run test` — suite completa pasando.
3. `bun run build` — el frontend Vite compila sin errores.
4. Versión bumpeada en `package.json` y `src-tauri/tauri.conf.json` (deben coincidir).

## Targets

| Target   | Comando                      | Requisitos                          |
| -------- | ---------------------------- | ----------------------------------- |
| Desktop  | `bun run tauri build`        | Toolchain Rust del host             |
| Android  | `bun run tauri android build`| Android SDK + NDK, Java             |
| iOS      | `bun run tauri ios build`    | Xcode + certificado de firma Apple  |

## Firma de código (code signing)
- **macOS**: Developer ID + notarización para distribuir fuera de la App Store.
- **Windows**: certificado de firma (Authenticode).
- **móvil**: keystore Android / provisioning profile iOS.
- Los secretos de firma van en variables de entorno CI, **nunca** commiteados.

## Salida
Reportá los artefactos generados y su ruta en `src-tauri/target/`.
