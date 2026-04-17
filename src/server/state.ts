import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { makeInitialState } from "../lib/defaultState";
import type { Action, AppState } from "../lib/types";
import { applyAction } from "./actions";

const STATE_FILE = path.resolve(
	process.env.POKER_STATE_PATH || path.join(process.cwd(), ".state.json"),
);

type G = typeof globalThis & {
	__POKER_STATE__?: AppState;
	__POKER_SUBS__?: Set<(s: AppState) => void>;
};
const g = globalThis as G;

function load(): AppState {
	try {
		if (existsSync(STATE_FILE)) {
			const raw = readFileSync(STATE_FILE, "utf8");
			const parsed = JSON.parse(raw) as AppState;
			if (typeof parsed.confettiNonce !== "number") parsed.confettiNonce = 0;
			if (typeof parsed.displayScale !== "number") parsed.displayScale = 1;
			// Safety: if timer was running at shutdown, resume paused to avoid ghost time
			if (parsed.timer?.running && parsed.timer.levelStartedAt) {
				const elapsed =
					parsed.timer.elapsedBeforePauseMs +
					(Date.now() - parsed.timer.levelStartedAt);
				parsed.timer = {
					running: false,
					levelStartedAt: null,
					elapsedBeforePauseMs: elapsed,
				};
			}
			return parsed;
		}
	} catch (e) {
		console.error("[poker] failed to load state, using defaults", e);
	}
	return makeInitialState();
}

function persist(state: AppState): void {
	try {
		writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
	} catch (e) {
		console.error("[poker] failed to persist state", e);
	}
}

if (!g.__POKER_STATE__) g.__POKER_STATE__ = load();
if (!g.__POKER_SUBS__) g.__POKER_SUBS__ = new Set();

export function getState(): AppState {
	return g.__POKER_STATE__!;
}

export function dispatch(action: Action): AppState {
	const next = applyAction(g.__POKER_STATE__!, action);
	if (next === g.__POKER_STATE__) return next;
	g.__POKER_STATE__ = next;
	persist(next);
	for (const cb of g.__POKER_SUBS__!) {
		try {
			cb(next);
		} catch (e) {
			console.error("[poker] subscriber failed", e);
		}
	}
	return next;
}

export function subscribe(cb: (s: AppState) => void): () => void {
	g.__POKER_SUBS__!.add(cb);
	return () => {
		g.__POKER_SUBS__!.delete(cb);
	};
}
