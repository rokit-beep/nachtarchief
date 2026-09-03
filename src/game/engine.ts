import { parse } from "./parser";
import type { ActionResult, Dir, EndingId, GameState, ItemId, RoomId } from "./types";
import { DIR_ALIAS, DIR_LABEL, DIRS } from "./types";
import {
  carrying,
  HELP_TEXT,
  isDark,
  itemExamine,
  ITEMS,
  itemsHere,
  lookRoom,
  ROOMS,
  visibleItem,
} from "./world";
import { writeSave } from "./save";

function ok(text: string, extra?: Partial<ActionResult>): ActionResult {
  return { text, kind: "story", ...extra };
}
function fail(text: string): ActionResult {
  return { text, kind: "fail" };
}
function sys(text: string): ActionResult {
  return { text, kind: "system" };
}

function clone(state: GameState): GameState {
  return {
    ...state,
    inventory: [...state.inventory],
    itemLoc: { ...state.itemLoc },
    flags: { ...state.flags, bezocht: { ...state.flags.bezocht } },
  };
}

function matchItem(state: GameState, noun: string, anywhere = false): ItemId | null {
  if (!noun) return null;
  const n = noun.trim();
  let best: { id: ItemId; score: number } | null = null;
  for (const id of Object.keys(ITEMS) as ItemId[]) {
    if (!anywhere && !visibleItem(state, id)) continue;
    if (id === "messing_sleutel" && !state.flags.portierDoorzocht && state.itemLoc[id] !== "inv")
      continue;
    if (id === "sleutelkaart" && !state.flags.bureauDoorzocht && state.itemLoc[id] !== "inv") continue;
    const def = ITEMS[id];
    const names = [def.name, ...def.aliases];
    let score = 0;
    for (const a of names) {
      if (a === n) score = Math.max(score, 100);
      else if (a.startsWith(n) && n.length >= 3) score = Math.max(score, 70 + n.length);
      else if (n.startsWith(a) && a.length >= 5) score = Math.max(score, 50 + a.length);
    }
    if (score > 0 && (!best || score > best.score)) best = { id, score };
  }
  return best?.id ?? null;
}

function takeItem(state: GameState, id: ItemId) {
  state.itemLoc[id] = "inv";
  if (!state.inventory.includes(id)) state.inventory.push(id);
}

function dropItem(state: GameState, id: ItemId) {
  state.itemLoc[id] = state.room;
  state.inventory = state.inventory.filter((x) => x !== id);
}

const ROOM_ALIAS: Record<string, RoomId> = {
  balie: "balie",
  nachtbalie: "balie",
  desk: "balie",
  leeszaal: "leeszaal",
  hall: "leeszaal",
  kantoor: "kantoor",
  office: "kantoor",
  kelder: "kelder",
  basement: "kelder",
  put: "binnenplaats",
  binnenplaats: "binnenplaats",
  courtyard: "binnenplaats",
  magazijn: "stacks_a",
  stacks: "stacks_a",
  kluis: "kluis",
  vault: "kluis",
  dak: "dak",
  roof: "dak",
  microfilm: "microfilm",
  trap: "trap",
  telefoon: "telefoon",
  telefoonhok: "telefoon",
};

function unique(arr: string[]) {
  return [...new Set(arr)];
}

export function suggestions(state: GameState): string[] {
  if (state.ended) return ["opnieuw"];
  const s: string[] = ["kijk"];
  if (!isDark(state)) {
    const room = ROOMS[state.room];
    for (const d of DIRS) {
      if (room.exits[d]) s.push(`ga ${DIR_LABEL[d]}`);
    }
    for (const id of itemsHere(state)) {
      if (id === "messing_sleutel" && !state.flags.portierDoorzocht) continue;
      if (id === "sleutelkaart" && !state.flags.bureauDoorzocht) continue;
      if (id === "filmrol" && !state.flags.stroomAan) continue;
      s.push(`bekijk ${ITEMS[id].name}`);
      if (ITEMS[id].portable && state.itemLoc[id] !== "inv") s.push(`neem ${ITEMS[id].name}`);
    }
    if (state.room === "leeszaal") {
      s.push(state.flags.portierDoorzocht ? "praat met portier" : "doorzoek portier");
    }
    if (state.room === "stacks_a" && !state.flags.catalogusGesproken) s.push("praat met catalograaf");
    if (state.room === "balie" && !state.flags.telefoonBeantwoord) s.push("beantwoord telefoon");
    if (state.room === "kelder" && !state.flags.stroomAan) s.push("schakel zekering");
    if (state.room === "voorvertrek" && !state.flags.kluisOpen) s.push("open kluis");
    if (state.room === "kluis" && !state.ended) {
      s.push("lees grootboek", "zegel het boek", "herschrijf mijn naam", "word het archief");
    }
    if (carrying(state, "zaklamp")) s.push("gebruik zaklamp");
  } else {
    if (carrying(state, "zaklamp")) s.push("gebruik zaklamp");
    s.push("ga omhoog");
  }
  s.push("inventaris", "help");
  return unique(s).slice(0, 10);
}

function tickDawn(state: GameState): ActionResult | null {
  if (state.ended) return null;
  if (state.moves >= 163) {
    state.ended = "dageraad";
    return { kind: "end", ended: "dageraad", text: ENDINGS.dageraad };
  }
  return null;
}

export const ENDINGS: Record<EndingId, string> = {
  zegel:
    "Je drukt het waszegel in het natte blad. De inkt stolt. De tweede naam stikt in de vezel.\n\nBuiten gaat een slot open dat je niet hebt aangeraakt. De voordeur ademt. Als je later het inschrijfboek ziet, staat jouw naam er één keer, in jouw hand.\n\nHet archief houdt zijn mond. Jij ook.\n\n— Einde: Het zegel —",
  naam:
    "Je schrijft jouw naam over de tweede heen, steviger, alsof inkt een claim is. De letters vloeien in elkaar. Even weet je niet welke van de twee jij bent.\n\n's Ochtends vindt de dagploeg een nachtwaker die alle procedures kent en niemand herinnert. Jij knikt. Jij glimlacht. Jij tekent met een hand die al jaren oefent.\n\n— Einde: De andere naam —",
  archief:
    "Je legt je palm op het blad. Het boek neemt je aan als een catalogus een titel aanneemt. Warmte. Dan: planken, stof, de geduldige woede van papier.\n\nMensen zullen 's nachts een stem horen tussen de rekken. Ze zullen denken dat het de wind is. Het is dat niet.\n\n— Einde: Het archief —",
  dageraad:
    "Zes uur. Sleutels in de voordeur. Stemmen. De dagploeg zet koffie alsof de nacht een gerucht was.\n\nHet Grootboek is dicht. Wat je niet hebt afgemaakt, maakt zichzelf af — ergens zonder jou. Jouw naam in het inschrijfboek is vervaagd tot een vlek.\n\n— Einde: Dageraad —",
  vlucht:
    "Je wringt het dakluik open en stapt de verkeerde lucht in. De straatnamen beneden zijn leeg. Je daalt af langs goot en steiger tot je op keien staat die jouw gewicht niet kennen.\n\nNiemand vraagt naar een nachtwaker. In het register van de stad bestond je vanochtend nog. Nu niet.\n\n— Einde: Ongeschreven —",
};

function go(state: GameState, dirRaw: string): ActionResult {
  const dir: Dir | undefined =
    DIR_ALIAS[dirRaw] ?? (DIRS.includes(dirRaw as Dir) ? (dirRaw as Dir) : undefined);
  if (!dir) {
    const named = ROOM_ALIAS[dirRaw];
    if (named) {
      const room = ROOMS[state.room];
      const found = (Object.entries(room.exits) as [Dir, RoomId][]).find(([, id]) => id === named);
      if (found) return go(state, found[0]);
      return fail("Van hier kun je daar niet heen.");
    }
    return fail("Welke kant op? Noord, oost, zuid, west, omhoog, omlaag.");
  }

  const dest = ROOMS[state.room].exits[dir];
  if (!dest) return fail("Die kant op is geen doorgang.");

  if (dest === "kantoor" && !state.flags.kantoorOpen) {
    return fail("Het kantoor is op slot. Een klein messing slot, netjes.");
  }
  if (dest === "stacks_b" && !carrying(state, "sleutelkaart")) {
    return fail("Het hek piept. Zonder sleutelkaart blijft MAGAZIJN B een woord op een bordje.");
  }
  if (dest === "kluis" && !state.flags.kluisOpen) {
    return fail("De kluis is dicht. Vier schijven kijken je aan.");
  }
  if (state.room === "balie" && dir === "zuid") {
    return fail(
      "De voordeur is verzegeld. Was, vers, het stempel van het huis. Hij gaat pas open als het boek dat toestaat.",
    );
  }

  state.room = dest;
  const first = !state.flags.bezocht[dest];
  const text = lookRoom(state, first);
  state.flags.bezocht[dest] = true;
  return ok(text);
}

function talk(state: GameState, noun: string): ActionResult {
  const n = noun;
  const isPorter = /portier|porter|man|slaap/.test(n) || n === "";
  const isCat = /catalog|vrouw|archiv/.test(n);
  const isPhone = /telefoon|stem|directeur/.test(n);

  if (state.room === "leeszaal" && (isPorter || /jas/.test(n))) {
    if (state.flags.thermosGegeven) {
      return ok(
        "„De put,” zegt hij, zonder zijn ogen te openen. „Vier, acht, een, drie. Niet omdat het een code is. Omdat het een datum is die we hebben laten vallen.” Hij sluit de zin af door te zwijgen.",
      );
    }
    return ok("Hij ademt. Meer niet. In de binnenzak van zijn jas tikt iets hards als je hem zou doorzoeken.");
  }
  if (state.room === "stacks_a" && (isCat || n === "")) {
    state.flags.catalogusGesproken = true;
    return ok(
      "„Je staat twee keer in de catalogus,” zegt ze, nog altijd zonder te kijken. „Eén record is van gisteravond. Het andere is van 1987. Alleen één van beide mag blijven.” Ze slaat de catalogus dicht. „Lees de brief. Kijk de rol. De put liegt niet.”\n\nAls je knippert is de kruk leeg.",
    );
  }
  if ((state.room === "balie" || state.room === "telefoon") && (isPhone || n === "telefoon" || n === "")) {
    return bel(state);
  }
  return fail("Niemand antwoordt.");
}

function bel(state: GameState): ActionResult {
  if (state.room !== "balie" && state.room !== "telefoon") {
    return fail("Hier is geen toestel.");
  }
  state.flags.telefoonBeantwoord = true;
  return ok(
    "Je neemt op. Geruis, dan een stem die te dicht op de microfoon zit.\n\n„Niet tekenen met de naam die ze je gaven. De brief ligt in mijn kantoor. De put onthoudt wat wij schrapten.”\n\nKlik. De lijn is een toon.",
  );
}

function search(state: GameState, noun: string): ActionResult {
  if (state.room === "leeszaal" && /portier|porter|man|jas|bank/.test(noun || "portier")) {
    if (state.flags.portierDoorzocht) return fail("Je hebt de jas al geopend. Hij heeft verder niets.");
    state.flags.portierDoorzocht = true;
    return ok("Je licht de jas. In de binnenzak: een messing sleutel, warm van zijn borst. Hij beweegt niet.");
  }
  if (state.room === "kantoor" && /bureau|desk|la|lade/.test(noun || "bureau")) {
    if (!state.flags.briefGelezen) {
      return fail("Je aarzelt. Eerst de brief — of de schaamte daarvan.");
    }
    if (state.flags.bureauDoorzocht) return fail("De la is leeg op een breuk in het hout na.");
    state.flags.bureauDoorzocht = true;
    return ok("Onder een stapel verlofkaarten: een sleutelkaart. De foto is bijna jij.");
  }
  if (state.room === "microfilm" && /lade|machine|viewer/.test(noun || "lade")) {
    if (!state.flags.stroomAan) return fail("Dood. Zonder stroom blijft de lade een lade.");
    return ok("In de lade van de linker viewer: filmrol 1987.");
  }
  return fail("Je vindt niets dat je nog niet zag.");
}

function useItem(state: GameState, id: ItemId, target: string): ActionResult {
  switch (id) {
    case "zaklamp": {
      if (!carrying(state, "zaklamp")) return fail("Je hebt geen zaklamp.");
      state.flags.zaklampAan = !state.flags.zaklampAan;
      if (state.flags.zaklampAan && state.room === "kelder") {
        return ok("Je klikt de zaklamp aan. De kelder geeft zich gewonnen: leidingen, plassen, de zekeringkast.");
      }
      return ok(state.flags.zaklampAan ? "De zaklamp gaat aan." : "Je klikt de zaklamp uit.");
    }
    case "messing_sleutel": {
      if (state.room !== "balie" && state.room !== "kantoor" && state.room !== "trap") {
        return fail("Hier is geen slot dat deze sleutel kent.");
      }
      if (state.flags.kantoorOpen) return fail("Het kantoor is al open.");
      state.flags.kantoorOpen = true;
      return ok("De sleutel draait alsof hij blij is. Het kantoor van de directeur geeft mee.");
    }
    case "sleutelkaart": {
      if (state.room === "stacks_a") {
        return ok(
          "Je houdt de pas bij de lezer. Het hek naar MAGAZIJN B zoemt en valt op een kier. Je kunt naar het noorden.",
        );
      }
      return fail("Hier is geen lezer.");
    }
    case "thermos": {
      if (state.room === "leeszaal" && /portier|man|hem/.test(target || "portier")) {
        return giveThermos(state);
      }
      return ok("Je drinkt. Bitter. Je bent wakkerder en eenzamer.");
    }
    case "filmrol": {
      if (state.room !== "microfilm") return fail("Je hebt een viewer nodig. Die staat in de microfilmkamer.");
      if (!state.flags.stroomAan) return fail("Geen stroom. De viewer blijft een dood oog.");
      state.flags.filmBekeken = true;
      return ok(
        "Stof, dan beeld. 1987. Mensen in jassen rond de put. Iemand — een nachtwaker, het bordje op zijn borst onleesbaar — draait vier schijven op een deur die deze kluis nog niet was.\n\n4. 8. 1. 3.\n\nDe laatste man kijkt in de camera alsof hij jou al kende.",
      );
    }
    case "cijferwiel":
    case "waszegel":
    case "charter":
      return ok(itemExamine(state, id));
    case "brief":
      return lees(state, "brief");
    case "grootboek":
      return lees(state, "grootboek");
    default:
      return fail("Dat levert niets op.");
  }
}

function giveThermos(state: GameState): ActionResult {
  if (!carrying(state, "thermos")) return fail("Je hebt de thermos niet.");
  state.flags.thermosGegeven = true;
  state.itemLoc.thermos = "gone";
  state.inventory = state.inventory.filter((x) => x !== "thermos");
  return ok(
    "Je schroeft de dop los. De geur is genoeg. De portier schuift de jas van zijn gezicht. Ogen als oude inkt.\n\n„Laat,” zegt hij. „Maar niet te laat.” Hij drinkt. „Vier acht een drie. De put. Zegel wat je niet wilt worden.”",
  );
}

function lees(state: GameState, noun: string): ActionResult {
  const id = matchItem(state, noun) ?? (noun.includes("boek") || noun.includes("groot") ? "grootboek" : null);
  if (id === "brief" && visibleItem(state, "brief")) {
    state.flags.briefGelezen = true;
    return ok(
      "„Als je dit leest, heeft het huis zich gesloten. Niet uit vijandschap. Uit honger.\n\nDe rol van 1987 toont de plechtigheid. De put onthoudt de combinatie. MAGAZIJN B eist de pas in mijn lade.\n\nTeken niet lichtvaardig. Het boek neemt wat je geeft en geeft wat je tekent.\n\n— A. Veld, directeur”",
    );
  }
  if (id === "charter" && visibleItem(state, "charter")) {
    return ok(itemExamine(state, "charter"));
  }
  if ((id === "grootboek" || /boek|groot|naam|ledger/.test(noun)) && state.room === "kluis") {
    state.flags.grootboekOpen = true;
    return ok(
      "Het blad is nat. Jouw naam, half. Daaronder dezelfde naam, in een oudere hand.\n\nDrie gebaren zijn mogelijk, en geen daarvan is niks doen:\n\n  zegel het boek      — sluit de tweede naam\n  herschrijf mijn naam — neem de andere aan\n  word het archief     — teken met je hand, niet met inkt\n\nDe inkt droogt langzaam. De klok ook.",
    );
  }
  if (state.room === "balie" && /boek|inschrijf/.test(noun)) {
    return ok("Jouw naam. Daaronder jouw naam. De tweede inkt is nog niet droog.");
  }
  return fail("Dat is niet te lezen, of niet hier.");
}

function openThing(state: GameState, noun: string): ActionResult {
  if (/kantoor|deur/.test(noun) && (state.room === "balie" || state.room === "kantoor" || state.room === "trap")) {
    if (carrying(state, "messing_sleutel")) return useItem(state, "messing_sleutel", "deur");
    return fail("Op slot.");
  }
  if (/kluis|slot|deur|kluisdeur|\d/.test(noun) && (state.room === "voorvertrek" || state.room === "kluis")) {
    return tryVault(state, noun);
  }
  if (/luik|dak/.test(noun) && state.room === "dak") {
    state.ended = "vlucht";
    return { kind: "end", ended: "vlucht", text: ENDINGS.vlucht };
  }
  if (/lade|bureau/.test(noun) && state.room === "kantoor") {
    return search(state, "bureau");
  }
  return fail("Dat gaat niet open.");
}

function tryVault(state: GameState, noun: string): ActionResult {
  if (state.flags.kluisOpen) {
    state.room = "kluis";
    state.flags.bezocht.kluis = true;
    return ok(lookRoom(state, true));
  }
  const hasCode = state.flags.filmBekeken || state.flags.putBekeken || state.flags.thermosGegeven;
  const typed = noun.match(/(\d)[\s.,-]*(\d)[\s.,-]*(\d)[\s.,-]*(\d)/);
  const said4813 = /4.*8.*1.*3/.test(noun) || noun.includes("4813");
  if (typed || said4813) {
    const nums = typed ? typed.slice(1).join("") : "4813";
    if (nums !== "4813") return fail("De schijven vallen terug. Verkeerde combinatie.");
    state.flags.kluisOpen = true;
    return ok("Vier klikken, als tanden. De kluisadem is koud. Je kunt naar binnen.");
  }
  if (carrying(state, "cijferwiel") && hasCode) {
    state.flags.kluisOpen = true;
    return ok(
      "Je legt het cijferwiel tegen de schijven. 4. 8. 1. 3. Het metaal herkent zichzelf. De deur geeft een centimeter, dan een deur.",
    );
  }
  if (hasCode) {
    return fail("Je weet de cijfers. Draai ze: open kluis 4 8 1 3.");
  }
  return fail("Vier schijven. Geen hint op de deur. Elders in het huis ligt het jaar, en de put.");
}

function lookAt(state: GameState, noun: string): ActionResult {
  if (!noun) return ok(lookRoom(state, true));

  if (/put|well|water/.test(noun)) {
    if (state.room !== "binnenplaats") return fail("De put is op de binnenplaats.");
    state.flags.putBekeken = true;
    const lit = state.flags.zaklampAan && carrying(state, "zaklamp");
    return ok(
      lit
        ? "Je laat de bundel in de schacht vallen. Onder het water: vier inkepingen in de steen, ouder dan het gebouw. 4  8  1  3."
        : "Donker water. Als je een licht had, zou de schacht misschien antwoorden.",
    );
  }
  if (/portier|man|jas/.test(noun) && state.room === "leeszaal") {
    return ok(
      state.flags.thermosGegeven
        ? "Hij is wakker in de zin waarin oude mensen wakker zijn: aanwezig, elders."
        : "Hij slaapt alsof slapen een taak is. In de jas tikt metaal.",
    );
  }
  if (/telefoon|toestel/.test(noun) && (state.room === "balie" || state.room === "telefoon")) {
    return ok(state.flags.telefoonBeantwoord ? "Stil. De hoorn is warm." : "Hij rinkelt. Hij heeft altijd gerinkeld.");
  }
  if (/zekering|kast|hendel/.test(noun) && state.room === "kelder") {
    return ok(state.flags.stroomAan ? "Groen lampje. De kast is tevreden." : "Alle hendels op nul. Eén grote, met een rood oog.");
  }
  if (/deur|zegel|was/.test(noun) && state.room === "balie") {
    return ok("De voordeur is vers verzegeld. Het huis wil niet dat je weggaat tot het boek klaar is.");
  }
  const id = matchItem(state, noun);
  if (id) return ok(itemExamine(state, id));
  return fail("Je ziet dat niet, of niet zo.");
}

function druk(state: GameState, _noun: string): ActionResult {
  if (state.room !== "kelder") return fail("Hier is niets te schakelen.");
  if (isDark(state)) return fail("In het donker tast je mis. Een lamp zou helpen.");
  if (state.flags.stroomAan) return fail("De stroom is er al. Het huis zoemt.");
  state.flags.stroomAan = true;
  return ok(
    "Je slaat de hoofdschakelaar om. Ergens boven starten machines met een hoest. In de microfilmkamer zal het leven zijn teruggekomen.",
  );
}

function endingVerb(state: GameState, verb: string): ActionResult | null {
  if (state.room !== "kluis") return null;
  if (verb === "zegel" || verb === "seal") {
    if (!carrying(state, "waszegel")) return fail("Je hebt geen waszegel. Het lag in het voorvertrek.");
    state.ended = "zegel";
    state.itemLoc.waszegel = "gone";
    return { kind: "end", ended: "zegel", text: ENDINGS.zegel };
  }
  if (verb === "herschrijf" || verb === "teken") {
    state.ended = "naam";
    return { kind: "end", ended: "naam", text: ENDINGS.naam };
  }
  if (verb === "word") {
    state.ended = "archief";
    return { kind: "end", ended: "archief", text: ENDINGS.archief };
  }
  return null;
}

function inventoryText(state: GameState): string {
  const ids = state.inventory.filter((id) => state.itemLoc[id] === "inv");
  if (!ids.length) return "Je zakken zijn leeg, op stof en plicht na.";
  return "Je draagt: " + ids.map((id) => ITEMS[id].name).join(", ") + ".";
}

export function enterGame(state: GameState): ActionResult {
  const text = lookRoom(state, true);
  state.flags.bezocht[state.room] = true;
  return { ...ok(text), suggestions: suggestions(state) };
}

export function act(prev: GameState, raw: string): { state: GameState; result: ActionResult } {
  const state = clone(prev);
  const parsed = parse(raw);
  const { verb, noun, noun2 } = parsed;

  if (!verb) {
    const result = fail("Zeg iets. `help` als je vastzit.");
    result.suggestions = suggestions(state);
    return { state, result };
  }

  if (state.ended && verb !== "restart" && verb !== "help" && verb !== "load") {
    const result = sys("Het is gedaan. Typ `opnieuw` om terug te keren naar de balie.");
    result.suggestions = ["opnieuw"];
    return { state, result };
  }

  let result: ActionResult;

  const endTry = endingVerb(state, verb);
  if (endTry) {
    result = endTry;
  } else {
    switch (verb) {
      case "help":
        result = sys(HELP_TEXT);
        break;
      case "kijk":
        result = ok(lookRoom(state, true));
        break;
      case "bekijk":
        result = lookAt(state, noun);
        break;
      case "ga":
        result = go(state, noun);
        break;
      case "neem": {
        const id = matchItem(state, noun);
        if (!id) {
          result = fail("Dat ligt hier niet.");
          break;
        }
        if (id === "grootboek") {
          result = fail("Het Grootboek weegt zoveel als een gebouw. Het blijft.");
          break;
        }
        if (state.itemLoc[id] === "inv") {
          result = fail("Dat heb je al.");
          break;
        }
        if (state.itemLoc[id] !== state.room) {
          result = fail("Dat ligt hier niet.");
          break;
        }
        if (id === "messing_sleutel" && !state.flags.portierDoorzocht) {
          result = fail("De sleutel zit in de jas van de portier. Doorzoek hem.");
          break;
        }
        if (id === "sleutelkaart" && !state.flags.bureauDoorzocht) {
          result = fail("Eerst de lade. Je moet het bureau doorzoeken.");
          break;
        }
        if (id === "filmrol" && !state.flags.stroomAan) {
          result = fail("De lade zit vast zolang de machines dood zijn.");
          break;
        }
        takeItem(state, id);
        result = ok(`Je neemt de ${ITEMS[id].name}.`);
        break;
      }
      case "leg": {
        const id = matchItem(state, noun, true);
        if (!id || !carrying(state, id)) {
          result = fail("Dat draag je niet.");
          break;
        }
        dropItem(state, id);
        result = ok(`Je legt de ${ITEMS[id].name} neer.`);
        break;
      }
      case "gebruik": {
        const id = matchItem(state, noun, true);
        if (!id) {
          if (/zekering|stroom|kast/.test(noun)) {
            result = druk(state, noun);
            break;
          }
          result = fail("Gebruik wat?");
          break;
        }
        result = useItem(state, id, noun2);
        break;
      }
      case "geef": {
        const id = matchItem(state, noun, true);
        if (id === "thermos") {
          result = giveThermos(state);
          break;
        }
        result = fail("Die wil dat niet.");
        break;
      }
      case "praat":
        result = talk(state, noun);
        break;
      case "bel":
        result = bel(state);
        break;
      case "doorzoek":
        result = search(state, noun);
        break;
      case "lees":
        result = lees(state, noun);
        break;
      case "open":
        result = openThing(state, noun);
        break;
      case "druk":
        result = druk(state, noun);
        break;
      case "inventaris":
        result = sys(inventoryText(state));
        break;
      case "wacht":
        result = ok("Je wacht. Het huis wacht harder.");
        break;
      case "luister":
        result = ok(
          state.room === "binnenplaats"
            ? "Water, diep. Iets telt, langzaam, in vieren."
            : "Papier. Leidingen. Jouw adem, te luid.",
        );
        break;
      case "drink":
        if (carrying(state, "thermos")) {
          result = ok("Je drinkt. Bitter. Wakkerder.");
        } else result = fail("Niets te drinken.");
        break;
      case "save":
        writeSave(state);
        result = sys("Opgeslagen in dit apparaat.");
        break;
      case "load":
        result = sys("Gebruik Verder spelen op het titelblad.");
        break;
      case "restart":
        result = sys("OPNIEUW");
        break;
      case "zegel":
      case "herschrijf":
      case "word":
      case "teken":
        result = endingVerb(state, verb) ?? fail("Hier is dat gebaar niets waard.");
        break;
      default:
        if (DIR_ALIAS[verb]) {
          result = go(state, verb);
        } else {
          result = fail("Dat werkwoord ken ik niet. `help` voor de lijst.");
        }
    }
  }

  const costsMove = !["help", "inventaris", "save", "load", "kijk", "bekijk", "restart"].includes(verb);
  if (costsMove && result.kind !== "fail" && !state.ended) {
    state.moves += 1;
  }

  const dawn = tickDawn(state);
  if (dawn) result = dawn;

  if (!state.ended && result.kind !== "system") {
    writeSave(state);
  }

  result.suggestions = suggestions(state);
  return { state, result };
}
