import { useEffect, useRef, useState } from "react";
import { makeInitialState } from "./defaultState";
import type { AppState, ServerEvent } from "./types";

const CACHE_KEY = "poker:state:v1";

function normalize(state: AppState): AppState {
	if (typeof state.displayScale !== "number") state.displayScale = 1;
	if (typeof state.confettiNonce !== "number") state.confettiNonce = 0;
	return state;
}

function readCache(): AppState | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = window.localStorage.getItem(CACHE_KEY);
		if (!raw) return null;
		return normalize(JSON.parse(raw) as AppState);
	} catch {
		return null;
	}
}

function writeCache(state: AppState): void {
	try {
		window.localStorage.setItem(CACHE_KEY, JSON.stringify(state));
	} catch {
		// storage quota / private mode — ignore
	}
}

export function useAppState(): { state: AppState; connected: boolean } {
	const [state, setState] = useState<AppState>(
		() => readCache() ?? makeInitialState(),
	);
	const [connected, setConnected] = useState(false);
	const sourceRef = useRef<EventSource | null>(null);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const es = new EventSource("/api/events");
		sourceRef.current = es;

		es.onopen = () => setConnected(true);
		es.onerror = () => setConnected(false);
		es.onmessage = (event) => {
			try {
				const parsed = JSON.parse(event.data) as ServerEvent;
				if (parsed.type === "state") {
					const next = normalize(parsed.state);
					setState(next);
					writeCache(next);
				}
			} catch {
				// ignore malformed frames
			}
		};

		return () => {
			es.close();
			sourceRef.current = null;
		};
	}, []);

	return { state, connected };
}

export function computeTimeLeft(
	state: AppState,
	now: number = Date.now(),
): number {
	const durationMs = state.levelDurationSec * 1000;
	const running = state.timer.running && state.timer.levelStartedAt != null;
	const elapsed =
		state.timer.elapsedBeforePauseMs +
		(running ? Math.max(0, now - (state.timer.levelStartedAt as number)) : 0);
	const remaining = Math.max(0, Math.ceil((durationMs - elapsed) / 1000));
	return remaining;
}

export function useCountdown(state: AppState): number {
	const [timeLeft, setTimeLeft] = useState(() => computeTimeLeft(state));

	useEffect(() => {
		setTimeLeft(computeTimeLeft(state));
		if (!state.timer.running) return;
		const id = window.setInterval(() => {
			setTimeLeft(computeTimeLeft(state));
		}, 250);
		return () => window.clearInterval(id);
	}, [state]);

	return timeLeft;
}

export function useWallClock(): string {
	const [now, setNow] = useState(() => new Date());
	useEffect(() => {
		const id = window.setInterval(() => setNow(new Date()), 1000);
		return () => window.clearInterval(id);
	}, []);
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}
