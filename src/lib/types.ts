export type Level = {
	id: string;
	time: string;
	lvl: number | null;
	sb: number | null;
	bb: number | null;
	note: string;
	stopp: boolean;
};

export type Player = {
	id: string;
	name: string;
	out: boolean;
};

export type AppState = {
	tournamentName: string;
	levelDurationSec: number;
	structure: Level[];
	currentLevelIndex: number;
	timer: {
		running: boolean;
		levelStartedAt: number | null;
		elapsedBeforePauseMs: number;
	};
	pot: number;
	players: Player[];
	confettiNonce: number;
	displayScale: number;
};

export type Action =
	| { type: "timer.toggle" }
	| { type: "timer.reset" }
	| { type: "level.next" }
	| { type: "level.advance" }
	| { type: "level.prev" }
	| { type: "level.jump"; payload: { index: number } }
	| { type: "pot.adjust"; payload: { delta: number } }
	| { type: "pot.set"; payload: { value: number } }
	| { type: "player.add"; payload: { name: string } }
	| { type: "player.remove"; payload: { id: string } }
	| { type: "player.rename"; payload: { id: string; name: string } }
	| { type: "player.toggleOut"; payload: { id: string } }
	| { type: "structure.update"; payload: { levels: Level[] } }
	| { type: "confetti.fire" }
	| { type: "display.scale"; payload: { value: number } }
	| { type: "display.scaleAdjust"; payload: { delta: number } }
	| {
			type: "settings.update";
			payload: { levelDurationSec?: number; tournamentName?: string };
	  };

export type ServerEvent = { type: "state"; state: AppState };
