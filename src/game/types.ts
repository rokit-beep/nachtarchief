export type Dir = "noord" | "oost" | "zuid" | "west" | "omhoog" | "omlaag" | "in" | "uit";

export type EndingId = "zegel" | "naam" | "archief" | "dageraad" | "vlucht";

export type LineKind = "story" | "system" | "command" | "fail" | "end";

export type Line = {
  id: string;
  kind: LineKind;
  text: string;
};

export type ItemId =
  | "messing_sleutel"
  | "zaklamp"
  | "brief"
  | "thermos"
  | "sleutelkaart"
  | "filmrol"
  | "cijferwiel"
  | "waszegel"
  | "charter"
  | "grootboek";

export type RoomId =
  | "balie"
  | "telefoon"
  | "leeszaal"
  | "stacks_a"
  | "stacks_b"
  | "microfilm"
  | "kantoor"
  | "binnenplaats"
  | "kelder"
  | "trap"
  | "voorvertrek"
  | "kluis"
  | "dak";

export type Flags = {
  bezocht: Partial<Record<RoomId, boolean>>;
  telefoonBeantwoord: boolean;
  portierDoorzocht: boolean;
  kantoorOpen: boolean;
  briefGelezen: boolean;
  bureauDoorzocht: boolean;
  zaklampAan: boolean;
  stroomAan: boolean;
  filmBekeken: boolean;
  putBekeken: boolean;
  catalogusGesproken: boolean;
  kluisOpen: boolean;
  grootboekOpen: boolean;
  thermosGegeven: boolean;
  kluisKeuze: "" | EndingId;
};

export type GameState = {
  version: number;
  room: RoomId;
  inventory: ItemId[];
  itemLoc: Record<ItemId, RoomId | "inv" | "gone">;
  flags: Flags;
  moves: number;
  ended: EndingId | null;
  startedAt: number;
};

export type ActionResult = {
  text: string;
  kind: LineKind;
  ended?: EndingId;
  suggestions?: string[];
};

export const SAVE_VERSION = 1;
export const SAVE_KEY = "nachtarchief.save.v1";
export const SAVE_BACKUP_KEY = "nachtarchief.save.v1.bak";

export const DIRS: Dir[] = ["noord", "oost", "zuid", "west", "omhoog", "omlaag", "in", "uit"];

export const DIR_ALIAS: Record<string, Dir> = {
  n: "noord",
  noord: "noord",
  north: "noord",
  o: "oost",
  oost: "oost",
  e: "oost",
  east: "oost",
  z: "zuid",
  zuid: "zuid",
  s: "zuid",
  south: "zuid",
  w: "west",
  west: "west",
  omhoog: "omhoog",
  up: "omhoog",
  boven: "omhoog",
  omlaag: "omlaag",
  down: "omlaag",
  beneden: "omlaag",
  in: "in",
  inside: "in",
  uit: "uit",
  out: "uit",
  buiten: "uit",
};

export const DIR_LABEL: Record<Dir, string> = {
  noord: "noord",
  oost: "oost",
  zuid: "zuid",
  west: "west",
  omhoog: "omhoog",
  omlaag: "omlaag",
  in: "naar binnen",
  uit: "naar buiten",
};
