# AGENTS.md — Nachtarchief

Dit is **Nachtarchief**, een standalone tekstavontuur-PWA.

**Niet** OpenNight. **Niet** NightFader. **Niet** NightForge Crime. **Niet** Omerta. **Niet** FranksFood.

## Juiste repo

| Product | Repo |
|---|---|
| **Deze game (bron)** | `rokit-beep/nachtarchief` ← jij bent hier |
| Live PWA (build only, niet bewerken) | `rokit-beep.github.io` |
| OpenNight / Pi / TV AI | `rokit-beep/OpenNigh` — **niet aanraken** vanuit dit werk |
| Verouderde kopie | `rokit-beep/text-bssed-game-pro` — **niet gebruiken** |

Bron van waarheid: deze repository. Wijzigingen gaan hierheen, daarna bouwt Pages de site.
Werk **niet** in `github.io` of `text-bssed-game-pro`.
Push **nooit** naar `OpenNigh` voor dit spel.

## Stack

Vite + React + Tailwind + PWA. Gamecode in `src/game/` en `src/components/game-shell.tsx`.
Voortgang: `localStorage`. Geen auth, geen database, geen Pi-deploy.
