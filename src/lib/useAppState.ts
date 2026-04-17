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

		const applyFrame = (next: AppState) => {
			const n = normalize(next);
			setState(n);
			writeCache(n);
		};

		const openStream = () => {
			sourceRef.current?.close();
			const es = new EventSource("/api/events");
			sourceRef.current = es;
			es.onopen = () => setConnected(true);
			es.onerror = () => setConnected(false);
			es.onmessage = (event) => {
				try {
					const parsed = JSON.parse(event.data) as ServerEvent;
					if (parsed.type === "state") applyFrame(parsed.state);
				} catch {
					// ignore malformed frames
				}
			};
		};

		const refetch = async () => {
			try {
				const res = await fetch("/api/state", { cache: "no-store" });
				if (res.ok) applyFrame((await res.json()) as AppState);
			} catch {
				// offline — the SSE reconnect will catch up when we are online again
			}
		};

		openStream();

		const onVisibility = () => {
			if (document.visibilityState !== "visible") return;
			// Mobile browsers often suspend EventSource when backgrounded and don't
			// resume cleanly. Pull a fresh snapshot immediately, then make sure the
			// stream is live again.
			refetch();
			const es = sourceRef.current;
			if (!es || es.readyState === EventSource.CLOSED) openStream();
		};
		const onOnline = () => {
			refetch();
			openStream();
		};

		document.addEventListener("visibilitychange", onVisibility);
		window.addEventListener("focus", onVisibility);
		window.addEventListener("online", onOnline);

		return () => {
			document.removeEventListener("visibilitychange", onVisibility);
			window.removeEventListener("focus", onVisibility);
			window.removeEventListener("online", onOnline);
			sourceRef.current?.close();
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

		const resync = () => {
			if (document.visibilityState === "visible")
				setTimeLeft(computeTimeLeft(state));
		};
		document.addEventListener("visibilitychange", resync);
		window.addEventListener("focus", resync);

		return () => {
			window.clearInterval(id);
			document.removeEventListener("visibilitychange", resync);
			window.removeEventListener("focus", resync);
		};
	}, [state]);

	return timeLeft;
}

export function useWallClock(): string {
	const [now, setNow] = useState(() => new Date());
	useEffect(() => {
		const id = window.setInterval(() => setNow(new Date()), 1000);
		const resync = () => {
			if (document.visibilityState === "visible") setNow(new Date());
		};
		document.addEventListener("visibilitychange", resync);
		window.addEventListener("focus", resync);
		return () => {
			window.clearInterval(id);
			document.removeEventListener("visibilitychange", resync);
			window.removeEventListener("focus", resync);
		};
	}, []);
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}
