import {
  SAVE_BACKUP_KEY,
  SAVE_KEY,
  SAVE_VERSION,
  type Flags,
  type GameState,
  type ItemId,
  type RoomId,
} from "./types";

const DEFAULT_FLAGS: Flags = {
  bezocht: {},
  telefoonBeantwoord: false,
  portierDoorzocht: false,
  kantoorOpen: false,
  briefGelezen: false,
  bureauDoorzocht: false,
  zaklampAan: false,
  stroomAan: false,
  filmBekeken: false,
  putBekeken: false,
  catalogusGesproken: false,
  kluisOpen: false,
  grootboekOpen: false,
  thermosGegeven: false,
  kluisKeuze: "",
};

const DEFAULT_ITEMS: Record<ItemId, RoomId | "inv" | "gone"> = {
  messing_sleutel: "leeszaal",
  zaklamp: "kantoor",
  brief: "kantoor",
  thermos: "kantoor",
  sleutelkaart: "kantoor",
  filmrol: "microfilm",
  cijferwiel: "stacks_b",
  waszegel: "voorvertrek",
  charter: "stacks_b",
  grootboek: "kluis",
};

export function newState(): GameState {
  return {
    version: SAVE_VERSION,
    room: "balie",
    inventory: [],
    itemLoc: { ...DEFAULT_ITEMS },
    flags: {
      ...DEFAULT_FLAGS,
      bezocht: {},
    },
    moves: 0,
    ended: null,
    startedAt: Date.now(),
  };
}

function migrate(raw: GameState): GameState {
  const base = newState();
  const flags = { ...base.flags, ...(raw.flags ?? {}) };
  flags.bezocht = { ...base.flags.bezocht, ...(raw.flags?.bezocht ?? {}) };
  return {
    ...base,
    ...raw,
    version: SAVE_VERSION,
    flags,
    itemLoc: { ...base.itemLoc, ...(raw.itemLoc ?? {}) },
    inventory: Array.isArray(raw.inventory) ? raw.inventory : [],
    ended: raw.ended ?? null,
  };
}

export function loadSave(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed || typeof parsed !== "object") return null;
    return migrate(parsed);
  } catch {
    try {
      const bak = localStorage.getItem(SAVE_BACKUP_KEY);
      if (!bak) return null;
      return migrate(JSON.parse(bak) as GameState);
    } catch {
      return null;
    }
  }
}

export function writeSave(state: GameState) {
  try {
    const prev = localStorage.getItem(SAVE_KEY);
    if (prev) localStorage.setItem(SAVE_BACKUP_KEY, prev);
    const blob: GameState = { ...state, version: SAVE_VERSION };
    localStorage.setItem(SAVE_KEY, JSON.stringify(blob));
  } catch {
    // private mode / quota — keep playing in memory
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(SAVE_BACKUP_KEY);
  } catch {
    /* ignore */
  }
}

export function hasSave(): boolean {
  try {
    return Boolean(localStorage.getItem(SAVE_KEY));
  } catch {
    return false;
  }
}
