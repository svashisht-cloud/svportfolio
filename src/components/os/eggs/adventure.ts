import type { CommandResult, TermLine } from "../commands";
import type { AppKind } from "../types";

/**
 * `adventure`: a tiny text adventure in the Terminal. Find coffee and a keycard to
 * get into the corner office, where the résumé (or Mail) is waiting.
 * Pure state machine: each answer returns the next prompt with the new state.
 */

type Dir = "north" | "south" | "east" | "west";
type RoomId = "lobby" | "lab" | "server" | "cafe" | "gym" | "office";
type Item = "coffee" | "keycard";

interface Room {
  name: string;
  text: string;
  exits: Partial<Record<Dir, RoomId>>;
  item?: Item;
}

const ROOMS: Record<RoomId, Room> = {
  lobby: {
    name: "Lobby",
    text: "The lobby of Shubh HQ. A faint Aqua glow comes from every screen. A sign reads: 'Corner office, through the lab.'",
    exits: { north: "lab", east: "cafe", west: "gym" },
  },
  lab: {
    name: "Robotics Lab",
    text: "Sensor rigs, a whiteboard full of path-planning doodles, and a robot politely waiting for a firmware update. The office door is to the east.",
    exits: { south: "lobby", north: "server", east: "office" },
  },
  server: {
    name: "Server Room",
    text: "Racks blink in the cold. A sticky note on one says: 'It was a race condition. It's always a race condition.'",
    exits: { south: "lab" },
    item: "keycard",
  },
  cafe: {
    name: "Café",
    text: "It smells like espresso and deadlines. Someone left a mug on the counter.",
    exits: { west: "lobby" },
    item: "coffee",
  },
  gym: {
    name: "Gym",
    text: "Someone is setting up a barbell squat. It's leg day. It is always leg day here.",
    exits: { east: "lobby" },
  },
  office: {
    name: "Corner Office",
    text: "A tidy desk. On it: a printed résumé and a mail app open to a new message. Type 'take resume' or 'hire'.",
    exits: { west: "lab" },
  },
};

const ITEM_NAMES: Record<Item, string> = {
  coffee: "a mug of coffee",
  keycard: "a keycard",
};

interface State {
  room: RoomId;
  inventory: Item[];
  /** Items already picked up, so rooms don't offer them again. */
  taken: Item[];
}

const HELP: TermLine[] = [
  { text: "Commands: look, n/s/e/w (or 'go north'), take <item>, inventory, help, quit", tone: "dim" },
];

const SHORT: Record<string, Dir> = { n: "north", s: "south", e: "east", w: "west" };

function describe(state: State): TermLine[] {
  const room = ROOMS[state.room];
  const lines: TermLine[] = [{ text: `— ${room.name} —`, tone: "title" }, { text: room.text }];
  if (room.item && !state.taken.includes(room.item)) {
    lines.push({ text: `You see ${ITEM_NAMES[room.item]}.`, tone: "accent" });
  }
  lines.push({ text: `Exits: ${Object.keys(room.exits).join(", ")}`, tone: "dim" });
  return lines;
}

function next(state: State, lines: TermLine[], launch: (kind: AppKind) => void): CommandResult {
  return { lines, prompt: { label: ">", handle: (input) => step(state, input, launch) } };
}

function step(state: State, raw: string, launch: (kind: AppKind) => void): CommandResult {
  const words = raw.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const [verb, ...rest] = words;
  const obj = rest.join(" ");

  if (!verb) return next(state, [], launch);
  if (verb === "quit" || verb === "exit" || verb === "q") {
    return { lines: [{ text: "You leave Shubh HQ. Come back any time.", tone: "dim" }] };
  }
  if (verb === "help" || verb === "?") return next(state, HELP, launch);
  if (verb === "look" || verb === "l") return next(state, describe(state), launch);
  if (verb === "inventory" || verb === "i" || verb === "inv") {
    const items = state.inventory.map((i) => ITEM_NAMES[i]);
    return next(state, [{ text: items.length ? `You carry: ${items.join(", ")}.` : "Your pockets are empty." }], launch);
  }

  // Movement: "n", "north", "go north".
  const dirWord = verb === "go" || verb === "walk" ? rest[0] : verb;
  const dir = SHORT[dirWord] ?? (["north", "south", "east", "west"].includes(dirWord) ? (dirWord as Dir) : undefined);
  if (dir) {
    const to = ROOMS[state.room].exits[dir];
    if (!to) return next(state, [{ text: "You can't go that way.", tone: "err" }], launch);
    if (to === "office") {
      if (!state.inventory.includes("keycard")) {
        return next(state, [{ text: "The office door has a keycard reader. It blinks red at you.", tone: "err" }], launch);
      }
      if (!state.inventory.includes("coffee")) {
        return next(
          state,
          [{ text: "The keycard works, but a sign on the door says: 'No entry before coffee.' Fair.", tone: "err" }],
          launch,
        );
      }
    }
    const moved = { ...state, room: to };
    return next(moved, describe(moved), launch);
  }

  if (verb === "take" || verb === "get" || verb === "grab") {
    if (state.room === "office" && /r[eé]sum[eé]|cv/.test(obj)) {
      window.setTimeout(() => launch("resume"), 400);
      return {
        lines: [
          { text: "You pick up the résumé. Excellent taste.", tone: "ok" },
          { text: "*** You win! *** Opening Résumé…", tone: "title" },
        ],
      };
    }
    const item = ROOMS[state.room].item;
    if (item && !state.taken.includes(item) && (!obj || obj.includes(item) || ITEM_NAMES[item].includes(obj))) {
      const got = { ...state, inventory: [...state.inventory, item], taken: [...state.taken, item] };
      return next(got, [{ text: `Taken: ${ITEM_NAMES[item]}.`, tone: "ok" }], launch);
    }
    return next(state, [{ text: obj ? `There's no ${obj} here.` : "Take what?", tone: "err" }], launch);
  }

  if (state.room === "office" && (verb === "hire" || verb === "mail" || verb === "email" || verb === "contact")) {
    window.setTimeout(() => launch("contact"), 400);
    return {
      lines: [
        { text: "You start typing a message. Bold move. The right one.", tone: "ok" },
        { text: "*** You win! *** Opening Mail…", tone: "title" },
      ],
    };
  }

  return next(state, [{ text: "I don't understand that. Type 'help'.", tone: "err" }], launch);
}

/** Start the adventure. */
export function adventure(launch: (kind: AppKind) => void): CommandResult {
  const state: State = { room: "lobby", inventory: [], taken: [] };
  return next(
    state,
    [
      { text: "SHUBH HQ: A TEXT ADVENTURE", tone: "title" },
      { text: "Goal: reach the corner office. Type 'quit' to leave.", tone: "dim" },
      { text: "" },
      ...describe(state),
    ],
    launch,
  );
}
