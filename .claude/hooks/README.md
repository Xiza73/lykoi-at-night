# Hooks (opcional)

Scripts que Claude Code puede ejecutar automáticamente antes o después de ciertos
eventos (por ejemplo `PreToolUse`, `PostToolUse`, `Stop`).

Los hooks se **registran en `.claude/settings.json`** bajo la clave `"hooks"`;
esta carpeta es solo para guardar los scripts que esos hooks invocan.

## Ejemplo — lint automático tras editar

En `.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": ".claude/hooks/lint-staged.sh" }
        ]
      }
    ]
  }
}
```

Y un script `lint-staged.sh` en esta carpeta que corra `bun run lint`.

> Ningún hook está activo por defecto. Es una carpeta de arranque, opcional.
