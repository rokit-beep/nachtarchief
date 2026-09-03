# Nachtarchief

Tekstavontuur. Je bent nachtwaker in het Stadsarchief. Het huis is van binnenuit op slot. Jouw naam staat twee keer in het inschrijfboek.

Typ wat je doet. Nederlands en Engels worden allebei begrepen.

## Spelen

Open de live preview, of in deze repo:

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
Broncode: `src/game/` (parser, wereld, engine) en `src/components/game-shell.tsx`.
Live PWA: https://rokit-beep.github.io/
