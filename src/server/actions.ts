import { makeId } from "../lib/defaultState";
import type { Action, AppState } from "../lib/types";

const clampScale = (v: number): number =>
	Math.max(0.5, Math.min(2.5, Number.isFinite(v) ? v : 1));

export function applyAction(state: AppState, action: Action): AppState {
	switch (action.type) {
		case "timer.toggle": {
			const cur = state.structure[state.currentLevelIndex];
			if (!cur || cur.stopp) return state;
			if (state.timer.running) {
				const elapsed =
					state.timer.elapsedBeforePauseMs +
					(state.timer.levelStartedAt
						? Date.now() - state.timer.levelStartedAt
						: 0);
				return {
					...state,
					timer: {
						running: false,
						levelStartedAt: null,
						elapsedBeforePauseMs: elapsed,
					},
				};
			}
			return {
				...state,
				timer: {
					running: true,
					levelStartedAt: Date.now(),
					elapsedBeforePauseMs: state.timer.elapsedBeforePauseMs,
				},
			};
		}

		case "timer.reset":
			return {
				...state,
				timer: {
					running: false,
					levelStartedAt: null,
					elapsedBeforePauseMs: 0,
				},
			};

		case "level.next": {
			const nextIndex = Math.min(
				state.currentLevelIndex + 1,
				state.structure.length - 1,
			);
			if (nextIndex === state.currentLevelIndex) return state;
			return {
				...state,
				currentLevelIndex: nextIndex,
				timer: { running: false, levelStartedAt: null, elapsedBeforePauseMs: 0 },
			};
		}

		case "level.advance": {
			const nextIndex = Math.min(
				state.currentLevelIndex + 1,
				state.structure.length - 1,
			);
			if (nextIndex === state.currentLevelIndex) return state;
			const next = state.structure[nextIndex];
			return {
				...state,
				currentLevelIndex: nextIndex,
				timer: next?.stopp
					? { running: false, levelStartedAt: null, elapsedBeforePauseMs: 0 }
					: { running: true, levelStartedAt: Date.now(), elapsedBeforePauseMs: 0 },
			};
		}

		case "level.prev": {
			const prevIndex = Math.max(state.currentLevelIndex - 1, 0);
			if (prevIndex === state.currentLevelIndex) return state;
			return {
				...state,
				currentLevelIndex: prevIndex,
				timer: {
					running: false,
					levelStartedAt: null,
					elapsedBeforePauseMs: 0,
				},
			};
		}

		case "level.jump": {
			const i = Math.max(
				0,
				Math.min(action.payload.index, state.structure.length - 1),
			);
			return {
				...state,
				currentLevelIndex: i,
				timer: {
					running: false,
					levelStartedAt: null,
					elapsedBeforePauseMs: 0,
				},
			};
		}

		case "pot.adjust":
			return { ...state, pot: Math.max(0, state.pot + action.payload.delta) };

		case "pot.set":
			return {
				...state,
				pot: Math.max(0, Math.floor(action.payload.value) || 0),
			};

		case "player.add": {
			const name = action.payload.name.trim();
			if (!name) return state;
			return {
				...state,
				players: [...state.players, { id: makeId(), name, out: false }],
			};
		}

		case "player.remove":
			return {
				...state,
				players: state.players.filter((p) => p.id !== action.payload.id),
			};

		case "player.rename": {
			const name = action.payload.name.trim();
			if (!name) return state;
			return {
				...state,
				players: state.players.map((p) =>
					p.id === action.payload.id ? { ...p, name } : p,
				),
			};
		}

		case "player.toggleOut":
			return {
				...state,
				players: state.players.map((p) =>
					p.id === action.payload.id ? { ...p, out: !p.out } : p,
				),
			};

		case "structure.update": {
			const levels = action.payload.levels.map((l) => ({
				...l,
				id: l.id || makeId(),
			}));
			if (levels.length === 0) return state;
			return {
				...state,
				structure: levels,
				currentLevelIndex: Math.min(state.currentLevelIndex, levels.length - 1),
			};
		}

		case "confetti.fire":
			return { ...state, confettiNonce: state.confettiNonce + 1 };

		case "display.scale": {
			const v = Math.round(action.payload.value * 100) / 100;
			return { ...state, displayScale: clampScale(v) };
		}

		case "display.scaleAdjust":
			return {
				...state,
				displayScale: clampScale(
					Math.round((state.displayScale + action.payload.delta) * 100) / 100,
				),
			};

		case "settings.update": {
			let next = state;
			if (
				typeof action.payload.levelDurationSec === "number" &&
				action.payload.levelDurationSec > 0
			) {
				next = { ...next, levelDurationSec: action.payload.levelDurationSec };
			}
			if (typeof action.payload.tournamentName === "string") {
				next = { ...next, tournamentName: action.payload.tournamentName };
			}
			return next;
		}

		default:
			return state;
	}
}
