import { DIR_ALIAS, DIRS, type Dir } from "./types";

export type Parsed = {
  verb: string;
  noun: string;
  noun2: string;
  raw: string;
};

const ARTICLES = new Set([
  "de",
  "het",
  "een",
  "the",
  "a",
  "an",
  "naar",
  "to",
  "at",
  "on",
  "van",
  "from",
  "met",
  "with",
  "op",
  "bij",
  "door",
]);

const VERB_MAP: Record<string, string> = {
  kijk: "kijk",
  look: "kijk",
  l: "kijk",
  x: "bekijk",
  bekijk: "bekijk",
  examine: "bekijk",
  inspect: "bekijk",
  inspecteer: "bekijk",
  ga: "ga",
  go: "ga",
  loop: "ga",
  walk: "ga",
  neem: "neem",
  take: "neem",
  pak: "neem",
  get: "neem",
  grab: "neem",
  drop: "leg",
  leg: "leg",
  laat: "leg",
  gebruik: "gebruik",
  use: "gebruik",
  doe: "gebruik",
  zet: "gebruik",
  praat: "praat",
  talk: "praat",
  spreek: "praat",
  zeg: "praat",
  ask: "praat",
  vraag: "praat",
  open: "open",
  sluit: "sluit",
  close: "sluit",
  lees: "lees",
  read: "lees",
  inventaris: "inventaris",
  inventory: "inventaris",
  i: "inventaris",
  inv: "inventaris",
  help: "help",
  hulp: "help",
  save: "save",
  opslaan: "save",
  load: "load",
  laad: "load",
  wacht: "wacht",
  wait: "wacht",
  search: "doorzoek",
  doorzoek: "doorzoek",
  zoek: "doorzoek",
  geef: "geef",
  give: "geef",
  drink: "drink",
  drinken: "drink",
  bel: "bel",
  call: "bel",
  answer: "bel",
  beantwoord: "bel",
  druk: "druk",
  flip: "druk",
  schakel: "druk",
  luister: "luister",
  listen: "luister",
  teken: "teken",
  sign: "teken",
  zegel: "zegel",
  seal: "zegel",
  herschrijf: "herschrijf",
  rewrite: "herschrijf",
  word: "word",
  become: "word",
  restart: "restart",
  opnieuw: "restart",
  draai: "open",
};

export function parse(input: string): Parsed {
  const raw = input.trim();
  let s = raw.toLowerCase().replace(/['’]/g, " ").replace(/[^a-z0-9àáäèéëïöüñç \-]/gi, " ");
  s = s.replace(/\s+/g, " ").trim();
  const tokens = s.split(" ").filter(Boolean);

  if (tokens.length === 0) return { verb: "", noun: "", noun2: "", raw };

  if (tokens.length === 1 && DIR_ALIAS[tokens[0]]) {
    return { verb: "ga", noun: DIR_ALIAS[tokens[0]], noun2: "", raw };
  }

  let verbTok = tokens[0];
  const rest = tokens.slice(1);

  if (verbTok === "kijk" && rest[0] === "rond") {
    return { verb: "kijk", noun: "", noun2: "", raw };
  }
  if ((verbTok === "kijk" || verbTok === "look") && rest.length) {
    verbTok = "bekijk";
  }

  const verb = VERB_MAP[verbTok] ?? verbTok;
  const stripped = rest.filter((t) => !ARTICLES.has(t));

  let noun = "";
  let noun2 = "";

  const opIdx = stripped.findIndex((t) => t === "op" || t === "on" || t === "aan");
  if (opIdx > 0) {
    noun = stripped.slice(0, opIdx).join(" ");
    noun2 = stripped.slice(opIdx + 1).join(" ");
  } else if (stripped.length >= 2 && (verb === "geef" || verb === "gebruik")) {
    noun = stripped[0];
    noun2 = stripped.slice(1).join(" ");
  } else {
    noun = stripped.join(" ");
  }

  if (DIR_ALIAS[noun]) noun = DIR_ALIAS[noun];

  if (!noun) {
    const dirTok = rest.find((t) => DIR_ALIAS[t]);
    if (dirTok) noun = DIR_ALIAS[dirTok];
  }

  return { verb, noun, noun2, raw };
}

export function isDir(s: string): s is Dir {
  return (DIRS as string[]).includes(s) || Boolean(DIR_ALIAS[s]);
}
