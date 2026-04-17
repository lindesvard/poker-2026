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
	__POKER_TIMEOUT__?: ReturnType<typeof setTimeout> | null;
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

function remainingMs(state: AppState): number {
	const durationMs = state.levelDurationSec * 1000;
	const running = state.timer.running && state.timer.levelStartedAt != null;
	const elapsed =
		state.timer.elapsedBeforePauseMs +
		(running ? Date.now() - (state.timer.levelStartedAt as number) : 0);
	return Math.max(0, durationMs - elapsed);
}

function scheduleAutoAdvance(state: AppState): void {
	if (g.__POKER_TIMEOUT__) {
		clearTimeout(g.__POKER_TIMEOUT__);
		g.__POKER_TIMEOUT__ = null;
	}
	const current = state.structure[state.currentLevelIndex];
	const atLast = state.currentLevelIndex >= state.structure.length - 1;
	if (!state.timer.running || !current || current.stopp || atLast) return;
	const ms = remainingMs(state);
	g.__POKER_TIMEOUT__ = setTimeout(() => {
		g.__POKER_TIMEOUT__ = null;
		// Only advance if the timer is still running and has actually run out.
		const s = g.__POKER_STATE__;
		if (!s || !s.timer.running) return;
		if (remainingMs(s) > 0) {
			scheduleAutoAdvance(s);
			return;
		}
		dispatch({ type: "level.advance" });
	}, ms);
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
	scheduleAutoAdvance(next);
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
