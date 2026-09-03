import { create } from "zustand";
import { act, enterGame } from "./engine";
import { clearSave, hasSave, loadSave, newState, writeSave } from "./save";
import type { GameState, Line, LineKind } from "./types";

type Screen = "title" | "play";

type Store = {
  screen: Screen;
  hasSave: boolean;
  state: GameState;
  lines: Line[];
  suggestions: string[];
  skipType: number;
  boot: () => void;
  newGame: () => void;
  continueGame: () => void;
  submit: (raw: string) => void;
  skipTyping: () => void;
};

let seq = 0;
function line(kind: LineKind, text: string): Line {
  seq += 1;
  return { id: `l${seq}`, kind, text };
}

export const useGame = create<Store>((set, get) => ({
  screen: "title",
  hasSave: false,
  state: newState(),
  lines: [],
  suggestions: [],
  skipType: 0,
  boot: () => set({ hasSave: hasSave() }),
  skipTyping: () => set({ skipType: get().skipType + 1 }),
  newGame: () => {
    clearSave();
    const state = newState();
    const intro = enterGame(state);
    writeSave(state);
    set({
      screen: "play",
      hasSave: true,
      state,
      suggestions: intro.suggestions ?? [],
      skipType: 0,
      lines: [
        line(
          "story",
          "03:17. Het Stadsarchief is op slot van binnenuit. Jij bent de nachtwaker. Het inschrijfboek heeft jouw naam twee keer.",
        ),
        line("story", intro.text),
      ],
    });
  },
  continueGame: () => {
    const loaded = loadSave();
    if (!loaded) {
      get().newGame();
      return;
    }
    const intro = enterGame(loaded);
    set({
      screen: "play",
      hasSave: true,
      state: loaded,
      suggestions: intro.suggestions ?? [],
      skipType: 0,
      lines: [
        line("system", "Je slaat het boek weer open waar je het liet liggen."),
        line("story", intro.text),
      ],
    });
  },
  submit: (raw) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const { state, result } = act(get().state, trimmed);
    if (result.text === "OPNIEUW") {
      get().newGame();
      return;
    }
    const extra: Line[] = [line("command", trimmed), line(result.kind, result.text)];
    set({
      state,
      lines: [...get().lines, ...extra].slice(-80),
      suggestions: result.suggestions ?? [],
    });
  },
}));
