# Nachtarchief

Tekstavontuur. Je bent nachtwaker in het Stadsarchief. Het huis is van binnenuit op slot. Jouw naam staat twee keer in het inschrijfboek.

Typ wat je doet. Nederlands en Engels worden allebei begrepen.

## Spelen

Live PWA: https://rokit-beep.github.io/

Lokaal:

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
npm run preview
```

In het spel:

```
kijk
ga noord
help
inventaris
```

Suggesties onder het invoerveld zijn tikbaar.

## Doel

Voor zes uur moet het Grootboek der Namen een keuze hebben:

- **zegel het boek** — sluit de tweede naam
- **herschrijf mijn naam** — word de andere
- **word het archief** — teken met je hand

Er is ook een uitgang via het dakluik. Die is geen overwinning.

## Commando’s

| | |
|---|---|
| `kijk` / `look` | kamer |
| `ga noord` / `n` `z` `o` `w` | lopen |
| `bekijk [ding]` | nader |
| `neem` `gebruik` `lees` `praat met` `doorzoek` | handelen |
| `save` | lokale autosave zit er al op |

Voortgang staat in `localStorage` op dit apparaat.

## Repo

Canonieke bron: deze repository.

- `src/game/` — parser, wereld, engine, save, store
- `src/components/game-shell.tsx` — schil
- `src/main.tsx` — Vite-entry

Oude werknaam `text-bssed-game-pro` is geen bron meer.
