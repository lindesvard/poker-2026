import type { AppState, Level, Player } from "./types";

export const makeId = (): string =>
	globalThis.crypto?.randomUUID?.() ??
	`id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const INITIAL_PLAYERS = [
	"Adam Andsberg",
	"Axel Sundberg",
	"Carl Johan Aru",
	"Carl-Gerhard Lindesvärd",
	"Christian Mandersson",
	"Christoffer Barholm",
	"Christoffer Christenson",
	"Daniel Apler",
	"Emil Nordander",
	"Fredrik Sundberg",
	"Jacob Wiström",
	"Johan Helgesson",
	"Karl Klackenberg",
	"Kirre Sakaria",
	"Leo Rummie Ljungdell",
	"Marcus Lotzman",
	"Marcus Österberg",
	"Markus Söderberg",
	"Måns Wihl",
	"Niclas Wallin",
	"Rasmus Fridheimer",
	"Sebastian Sjölin",
	"Wilhelm Sturesson",
];

const INITIAL_STRUCTURE: Array<Omit<Level, "id">> = [
	{ time: "19:00", lvl: 1, sb: 100, bb: 200, note: "Start", stopp: false },
	{ time: "19:20", lvl: 2, sb: 200, bb: 400, note: "", stopp: false },
	{ time: "19:40", lvl: 3, sb: 300, bb: 600, note: "", stopp: false },
	{ time: "20:00", lvl: 4, sb: 500, bb: 1000, note: "", stopp: false },
	{ time: "20:20", lvl: 5, sb: 800, bb: 1600, note: "", stopp: false },
	{ time: "20:40", lvl: 6, sb: 1000, bb: 2000, note: "", stopp: false },
	{
		time: "21:00",
		lvl: 7,
		sb: 1500,
		bb: 3000,
		note: "Re-buys stänger! Introducera Svarta (5 000)",
		stopp: false,
	},
	{ time: "21:20", lvl: 8, sb: 2500, bb: 5000, note: "", stopp: false },
	{ time: "21:40", lvl: 9, sb: 4000, bb: 8000, note: "", stopp: false },
	{
		time: "22:00",
		lvl: 10,
		sb: 6000,
		bb: 12000,
		note: "Finalspurten",
		stopp: false,
	},
	{ time: "22:15", lvl: 11, sb: 12000, bb: 24000, note: "", stopp: false },
	{
		time: "22:30",
		lvl: null,
		sb: null,
		bb: null,
		note: "STOPP! Räkna marker.",
		stopp: true,
	},
];

export function makeInitialPlayers(): Player[] {
	return INITIAL_PLAYERS.map((name) => ({ id: makeId(), name, out: false }));
}

export function makeInitialStructure(): Level[] {
	return INITIAL_STRUCTURE.map((l) => ({ ...l, id: makeId() }));
}

export function makeInitialState(): AppState {
	return {
		tournamentName: "M-I-G Poker after dark",
		levelDurationSec: 20 * 60,
		structure: makeInitialStructure(),
		currentLevelIndex: 0,
		timer: { running: false, levelStartedAt: null, elapsedBeforePauseMs: 0 },
		pot: 3000,
		players: makeInitialPlayers(),
		confettiNonce: 0,
		displayScale: 1,
	};
}
