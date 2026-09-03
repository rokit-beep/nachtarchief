import type { Dir, GameState, ItemId, RoomId } from "./types";

export type RoomDef = {
  id: RoomId;
  name: string;
  exits: Partial<Record<Dir, RoomId>>;
  dark?: boolean;
};

export type ItemDef = {
  id: ItemId;
  name: string;
  aliases: string[];
  portable: boolean;
};

export const ROOMS: Record<RoomId, RoomDef> = {
  balie: {
    id: "balie",
    name: "Nachtbalie",
    exits: { noord: "leeszaal", west: "telefoon", oost: "kantoor", zuid: "balie", omhoog: "trap" },
  },
  telefoon: {
    id: "telefoon",
    name: "Telefoonhok",
    exits: { oost: "balie" },
  },
  leeszaal: {
    id: "leeszaal",
    name: "Leeszaal",
    exits: {
      zuid: "balie",
      noord: "stacks_a",
      oost: "microfilm",
      west: "binnenplaats",
      omlaag: "kelder",
    },
  },
  stacks_a: {
    id: "stacks_a",
    name: "Open magazijn",
    exits: { zuid: "leeszaal", noord: "stacks_b", omhoog: "trap" },
  },
  stacks_b: {
    id: "stacks_b",
    name: "Beperkt magazijn",
    exits: { zuid: "stacks_a", west: "voorvertrek" },
  },
  microfilm: {
    id: "microfilm",
    name: "Microfilmkamer",
    exits: { west: "leeszaal" },
  },
  kantoor: {
    id: "kantoor",
    name: "Directiekantoor",
    exits: { west: "balie", omhoog: "trap" },
  },
  binnenplaats: {
    id: "binnenplaats",
    name: "Binnenplaats",
    exits: { oost: "leeszaal" },
  },
  kelder: {
    id: "kelder",
    name: "Ketelkelder",
    dark: true,
    exits: { omhoog: "leeszaal", oost: "trap" },
  },
  trap: {
    id: "trap",
    name: "Diensttrap",
    exits: {
      omlaag: "kelder",
      zuid: "balie",
      oost: "kantoor",
      west: "stacks_a",
      omhoog: "dak",
    },
  },
  voorvertrek: {
    id: "voorvertrek",
    name: "Voorvertrek van de kluis",
    exits: { oost: "stacks_b", in: "kluis", west: "kluis" },
  },
  kluis: {
    id: "kluis",
    name: "Kluis",
    exits: { uit: "voorvertrek", oost: "voorvertrek" },
  },
  dak: {
    id: "dak",
    name: "Dakluik",
    exits: { omlaag: "trap" },
  },
};

export const ITEMS: Record<ItemId, ItemDef> = {
  messing_sleutel: {
    id: "messing_sleutel",
    name: "messing sleutel",
    aliases: ["sleutel", "messing", "brass", "key", "portsleutel", "kantoorsleutel"],
    portable: true,
  },
  zaklamp: {
    id: "zaklamp",
    name: "zaklamp",
    aliases: ["lamp", "licht", "flashlight", "torch"],
    portable: true,
  },
  brief: {
    id: "brief",
    name: "verszegelde brief",
    aliases: ["brief", "letter", "enveloppe", "envelop"],
    portable: true,
  },
  thermos: {
    id: "thermos",
    name: "thermoskan",
    aliases: ["thermos", "koffie", "kan", "coffee"],
    portable: true,
  },
  sleutelkaart: {
    id: "sleutelkaart",
    name: "sleutelkaart",
    aliases: ["kaart", "keycard", "pas", "toegangspas"],
    portable: true,
  },
  filmrol: {
    id: "filmrol",
    name: "filmrol 1987",
    aliases: ["film", "rol", "reel", "microfilm", "1987"],
    portable: true,
  },
  cijferwiel: {
    id: "cijferwiel",
    name: "cijferwiel",
    aliases: ["wiel", "cipher", "cijfer", "codewiel", "schijf"],
    portable: true,
  },
  waszegel: {
    id: "waszegel",
    name: "waszegel",
    aliases: ["zegel", "was", "seal", "lakzegel"],
    portable: true,
  },
  charter: {
    id: "charter",
    name: "charterfragment",
    aliases: ["charter", "fragment", "perkament", "stuk"],
    portable: true,
  },
  grootboek: {
    id: "grootboek",
    name: "Grootboek der Namen",
    aliases: ["grootboek", "boek", "ledger", "namen", "register"],
    portable: false,
  },
};

export function itemsHere(state: GameState, room = state.room): ItemId[] {
  return (Object.keys(state.itemLoc) as ItemId[]).filter((id) => state.itemLoc[id] === room);
}

export function carrying(state: GameState, id: ItemId) {
  return state.itemLoc[id] === "inv";
}

export function visibleItem(state: GameState, id: ItemId) {
  return carrying(state, id) || state.itemLoc[id] === state.room;
}

export function clockLabel(moves: number) {
  const total = 3 * 60 + 17 + moves;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function isDark(state: GameState, room = state.room) {
  const def = ROOMS[room];
  if (!def.dark) return false;
  return !(state.flags.zaklampAan && carrying(state, "zaklamp"));
}

export function lookRoom(state: GameState, verbose: boolean): string {
  const room = ROOMS[state.room];
  if (isDark(state)) {
    return "Het is te donker om iets te zien. Alleen het tikken van water, ergens verderop.";
  }

  const extra = describeExtras(state);
  const first = !state.flags.bezocht[state.room] || verbose;
  const body = first ? roomLook[state.room](state) : roomBrief[state.room];
  const stuff = listStuff(state);
  return [body, extra, stuff].filter(Boolean).join("\n\n");
}

function listStuff(state: GameState): string {
  const ids = itemsHere(state).filter((id) => {
    if (id === "messing_sleutel" && !state.flags.portierDoorzocht) return false;
    if (id === "sleutelkaart" && !state.flags.bureauDoorzocht) return false;
    if (id === "filmrol" && !state.flags.stroomAan) return false;
    if (id === "grootboek") return true;
    return true;
  });
  if (!ids.length) return "";
  const names = ids.map((id) => ITEMS[id].name);
  if (names.length === 1) return `Je ziet hier: ${names[0]}.`;
  return `Je ziet hier: ${names.slice(0, -1).join(", ")} en ${names[names.length - 1]}.`;
}

function describeExtras(state: GameState): string {
  switch (state.room) {
    case "leeszaal":
      return state.flags.thermosGegeven
        ? "De portier zit rechtop. Hij knikt, alsof hij al jaren op deze koffie wachtte."
        : "Op de middelste bank slaapt de nachsportier, jas over zijn gezicht.";
    case "stacks_a":
      return state.flags.catalogusGesproken
        ? "De catalograaf is nergens. Alleen een lege kruk en een warme plek op het blad."
        : "Iemand zit tussen de rekken, een catalogus op schoot. Ze hoort hier niet te zijn.";
    case "balie":
      return state.flags.telefoonBeantwoord
        ? "De telefoon is stil. Het inschrijfboek ligt open op jouw naam — twee keer."
        : "De zwarte telefoon rinkelt, geduldig, alsof hij nooit is begonnen.";
    case "kelder":
      return state.flags.stroomAan
        ? "De zekeringkast bromt zacht. Een groen lampje brandt."
        : "De zekeringkast staat open. Alle hendels staan op nul.";
    case "voorvertrek":
      return state.flags.kluisOpen
        ? "De kluisdeur staat op een kier. Koude lucht lekt naar buiten."
        : "Een stalen deur met een combinatieslot. Vier schijven, koud als een grafsteen.";
    default:
      return "";
  }
}

const roomBrief: Record<RoomId, string> = {
  balie: "De nachtbalie. Inschrijfboek, stempelkussen, de zware voordeur op slot.",
  telefoon: "Het telefoonhok. Een plank met vergulde nummers en de geur van oud plastic.",
  leeszaal: "De leeszaal. Lange tafels, groene lampen, stof in de lucht.",
  stacks_a: "Open magazijn. Ruggen tot het plafond, de geur van lijm en vocht.",
  stacks_b: "Beperkt magazijn. Hier mag niemand zonder pas.",
  microfilm: "De microfilmkamer. Machines als slapende dieren.",
  kantoor: "Het directiekantoor. Eén raam, geblindeerd. Een bureau van donker hout.",
  binnenplaats: "De binnenplaats. Een put in het midden, regen in de goten.",
  kelder: "De ketelkelder. Leidingen, een zekeringkast, plassen.",
  trap: "De diensttrap. Beton, ijzer, echo.",
  voorvertrek: "Het voorvertrek van de kluis.",
  kluis: "De kluis. Het Grootboek ligt open op een lessenaar.",
  dak: "Het dakluik. De stad daaronder, te ver.",
};

const roomLook: Record<RoomId, (s: GameState) => string> = {
  balie: () =>
    "De nachtbalie van het Stadsarchief. Het inschrijfboek ligt open. Jouw naam staat erin, netjes, en daaronder nog eens — in een hand die de jouwe nét niet is.\n\nAchter je is de voordeur verzegeld met een verse wasafdruk. Noord leidt naar de leeszaal. West het telefoonhok. Oost het kantoor van de directeur. De diensttrap gaat omhoog.",
  telefoon: () =>
    "Een hok zo smal dat je schouders de wanden raken. De huistelefoon is een zwaar bakelieten ding. Op de plank: een interne lijst. Directie. Ketelhuis. Kluis. Alles doorgestreept behalve één regel: NIGHT DESK — BEL NIET TERUG.",
  leeszaal: () =>
    "Hoge ramen, zwart van binnenuit. Groene bankierslampen branden op de tafels ofschoon niemand leest. In het midden een bank. De nachsportier slaapt daar, jas over zijn gezicht, adem zo dun dat je ernaar moet luisteren.\n\nNoord: magazijn. Oost: microfilm. West: binnenplaats. Beneden: kelder.",
  stacks_a: () =>
    "Rekken in rijen, zo strak dat de gang een keel wordt. Op een kruk zit een vrouw in een grijze jas, catalogus op schoot. Ze bladert zonder te kijken. Als je haar aankijkt, bladert ze door.\n\nNoord is het beperkte magazijn (pas vereist). De diensttrap gaat omhoog.",
  stacks_b: (s) =>
    s.flags.kluisOpen
      ? "Het beperkte magazijn ademt kouder sinds de kluis openstaat. West: het voorvertrek."
      : "Stof. Verboden banden. Een karretje met een messing cijferwiel, alsof iemand midden in een berekening is weggelopen. Tussen twee dozen steekt een strook perkament.\n\nWest: het voorvertrek van de kluis.",
  microfilm: (s) =>
    s.flags.stroomAan
      ? "De machines zoemen. In de lade van de linker viewer ligt een rol met het jaartal 1987 in potlood. Door het raam zie je de put op de binnenplaats."
      : "Dode kijkers. Zonder stroom zijn het alleen kasten. In de lade: niets tot de machines wakker worden. Het raam kijkt uit op de binnenplaats.",
  kantoor: (s) =>
    s.flags.briefGelezen
      ? "Op het bureau: een ingedeuk kussen van het nachtdiensthoofd. De la zit niet helemaal dicht."
      : "Een bureau. Een verszegelde brief tegen de inktpot. Een thermoskan, nog warm. In de hoek een zware zaklamp, de soort waarmee men kelders straft.",
  binnenplaats: () =>
    "Vier muren, geen hemel die je vertrouwt. In het midden een put met een ijzeren krans. Als je stilstaat hoor je water, dieper dan deze stad zou moeten zijn.",
  kelder: (s) =>
    s.flags.zaklampAan
      ? "Leidingen zweten. De zekeringkast hangt open aan de oostwand. Hendels in een rij, alle op nul — behalve als jij ze zet. Water tot over de zolen."
      : "Duister, en het geluid van water.",
  trap: () =>
    "Betonnen spil. Beneden ruikt het naar ketelhuis. Ter hoogte van de balie een deur zuid. Oost een deur naar het kantoor. West naar het magazijn. Helemaal boven een dakluik.",
  voorvertrek: () =>
    "Een kleine kamer van steen. Geen raam. De kluisdeur is ouder dan het gebouw eromheen — alsof men het archief eromheen heeft gemetseld. Naast het slot ligt een waszegel, ongebruikt, nog zacht.",
  kluis: () =>
    "De kluis is groter van binnen. In het midden een lessenaar. Daarop het Grootboek der Namen, open op een blad dat nog nat is van inkt. Jouw naam staat er, half af. De andere helft wacht.",
  dak: () =>
    "Het luik is van binnen te openen maar de nachtlucht is verkeerd: te stil, te dichtbij. Onder je de daken van de stad. De straatnamen op de bordjes beneden zijn leeg.",
};

export function itemExamine(state: GameState, id: ItemId): string {
  switch (id) {
    case "messing_sleutel":
      return "Kort, zwaar, het stempel van het archief in de kop. Labeltje: DIR. KANTOOR.";
    case "zaklamp":
      return state.flags.zaklampAan
        ? "De zaklamp brandt. De bundel is geel en ouderwets, een gat in het donker."
        : "Zwaar als een wapenstok. De schakelaar is stijf. Uit.";
    case "brief":
      return state.flags.briefGelezen
        ? "Je hebt hem gelezen. De zin die blijft hangen: De put onthoudt de combinatie. De rol toont het jaar."
        : "Een brief van de directeur. Het zegel is al gebroken. Je kunt hem lezen.";
    case "thermos":
      return "Koffie, zwart, te sterk. Nog warm. De nachsportier zou dit herkennen.";
    case "sleutelkaart":
      return "Verbleekt plastic. MAGAZIJN B / KLUISGANG. De foto is van niemand die je kent, en toch van jou.";
    case "filmrol":
      return state.flags.filmBekeken
        ? "Op de film: een plechtigheid bij de put, 1987. Iemand draait vier schijven. 4 — 8 — 1 — 3."
        : "Potlood op de doos: 1987 — PUT. Je kunt hem bekijken op een viewer, als er stroom is.";
    case "cijferwiel":
      return "Vier messing schijven, 0 tot 9. Een handleiding in één zin, gegraveerd: EERST HET JAAR, DAN DE PUT.";
    case "waszegel":
      return "Roodachtige was, nog kneedbaar. Het stempel van het archief. Bedoeld om te sluiten wat open had moeten blijven.";
    case "charter":
      return "Perkament, afgescheurd. …het boek mag herschrijven wat de stad vergeet, mits een nachtwaker tekent met zijn ware naam…";
    case "grootboek":
      return state.flags.grootboekOpen
        ? "Bladzijden als huid. Jouw naam, en een tweede, identiek, die ademt."
        : "Gebonden in iets dat geen leer wil heten. Het ligt open. Je kunt het lezen.";
    default:
      return "Niets bijzonders.";
  }
}

export const HELP_TEXT = `Typ wat je wilt doen. Voorbeelden:\n\n  kijk                 — de kamer\n  ga noord             — of: n, z, o, w, omhoog, omlaag\n  bekijk [ding]        — nader\n  neem [ding]\n  gebruik [ding]\n  gebruik [ding] op [iets]\n  praat met [iemand]\n  lees [iets]\n  open [iets]\n  inventaris           — wat je draagt\n  save / load\n  help\n\nNederlands en Engels worden allebei begrepen. Tik een suggestie aan als je vingers moe zijn.`;
