import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import ReactConfetti from "react-confetti";
import { fmtNum, fmtTime } from "../lib/sendAction";
import type { Level, Player } from "../lib/types";
import { useAppState, useCountdown, useWallClock } from "../lib/useAppState";

export const Route = createFileRoute("/")({ component: DisplayPage });

function DisplayPage() {
	const { state } = useAppState();
	const timeLeft = useCountdown(state);
	const wallClock = useWallClock();

	const current = state.structure[state.currentLevelIndex];
	const next = state.structure[state.currentLevelIndex + 1];
	const aliveCount = state.players.filter((p) => !p.out).length;

	const timerClass = current?.stopp
		? "pk-timer pk-timer--danger"
		: timeLeft <= 30
			? "pk-timer pk-timer--danger"
			: timeLeft <= 60
				? "pk-timer pk-timer--warn"
				: "pk-timer";

	const half = Math.ceil(state.players.length / 2);
	const left = state.players.slice(0, half);
	const right = state.players.slice(half);

	return (
		<div className="relative z-[1] flex h-screen flex-col">
			<ConfettiOverlay
				levelKey={state.currentLevelIndex}
				nonce={state.confettiNonce}
				pot={state.pot}
				stopp={!!current?.stopp}
			/>
			<div className="pk-bg-diamonds" />
			<div className="pk-bg-glow" />
			<div
				className="pk-corner-suit"
				style={{ top: -20, left: -10, transform: "rotate(-10deg)" }}
			>
				♠
			</div>
			<div
				className="pk-corner-suit"
				style={{ bottom: -20, right: -10, transform: "rotate(170deg)" }}
			>
				♥
			</div>

			<header className="relative z-[1] flex items-center justify-between border-b border-[var(--pk-border-gold)] bg-black/40 px-8 py-3 backdrop-blur">
				<div className="flex items-center gap-4">
					<div className="pk-tournament-title text-lg">
						<span className="opacity-50 text-sm">♠</span> {state.tournamentName}{" "}
						<span className="opacity-50 text-sm">♥</span>
					</div>
					<div className="pk-level-pill">
						<div className="pk-level-dot" />
						<span>
							{current?.stopp ? "SLUT" : `NIVÅ ${current?.lvl ?? "—"}`}
						</span>
					</div>
				</div>
				<div className="flex items-center gap-5">
					<div className="text-xs uppercase tracking-[2px] text-[var(--pk-muted)]">
						Kvar:{" "}
						<span className="pk-mono text-[var(--pk-text)]">
							{aliveCount} / {state.players.length}
						</span>
					</div>
					<div className="pk-mono text-sm font-semibold tracking-[3px]">
						{wallClock}
					</div>
				</div>
			</header>

			{current?.note && !current.stopp ? (
				<div className="pk-note-banner relative z-[1]">★ {current.note}</div>
			) : null}

			<main
				className="relative z-[1] flex flex-1 items-center justify-center px-6 py-4"
				style={{ zoom: state.displayScale }}
			>
				<div className="grid w-full max-w-[1600px] grid-cols-[minmax(180px,1fr)_auto_minmax(180px,1fr)] items-center gap-6">
					<PlayerColumn players={left} side="left" />

					<div className="flex flex-col items-center gap-4">
						<TimerBlock
							label={fmtTime(timeLeft)}
							stopp={!!current?.stopp}
							timerClass={timerClass}
						/>
						{!current?.stopp ? (
							<div className="flex items-center justify-center">
								<div className="pk-blind-card">
									<div className="pk-blind-card-label">Liten blind</div>
									<div className="pk-blind-card-val text-[clamp(26px,4.5vw,44px)]">
										{fmtNum(current?.sb ?? null)}
									</div>
								</div>
								<div className="pk-blind-sep text-[clamp(28px,5vw,52px)] mx-2 mt-4">
									/
								</div>
								<div className="pk-blind-card">
									<div className="pk-blind-card-label">Stor blind</div>
									<div className="pk-blind-card-val text-[clamp(26px,4.5vw,44px)]">
										{fmtNum(current?.bb ?? null)}
									</div>
								</div>
							</div>
						) : null}
						<NextHint next={next} stoppCurrent={!!current?.stopp} />
						<div className="text-center">
							<div className="pk-pot-label text-[11px]">♣ Pott</div>
							<div className="pk-pot-amount text-[clamp(32px,6vw,64px)]">
								{fmtNum(state.pot)} kr
							</div>
						</div>
					</div>

					<PlayerColumn players={right} side="right" />
				</div>
			</main>

			<ScheduleBar
				structure={state.structure}
				currentIndex={state.currentLevelIndex}
			/>
		</div>
	);
}

function TimerBlock({
	label,
	stopp,
	timerClass,
}: {
	label: string;
	stopp: boolean;
	timerClass: string;
}) {
	return (
		<div className="relative flex items-center justify-center">
			<div
				className="pk-ring absolute"
				style={{
					width: "clamp(220px,28vw,340px)",
					height: "clamp(220px,28vw,340px)",
				}}
			/>
			<div
				className="pk-ring pk-ring--inner absolute"
				style={{
					width: "clamp(200px,25vw,310px)",
					height: "clamp(200px,25vw,310px)",
				}}
			/>
			<div
				className={`${timerClass} relative z-[1] text-[clamp(64px,13vw,128px)]`}
			>
				{stopp ? "STOPP" : label}
			</div>
		</div>
	);
}

function NextHint({
	next,
	stoppCurrent,
}: {
	next: Level | undefined;
	stoppCurrent: boolean;
}) {
	if (!next || stoppCurrent) return null;
	return (
		<div className="pk-mono text-[13px] tracking-[1.5px] text-[var(--pk-muted)]">
			{next.stopp
				? `▸ Nästa: STOPP kl ${next.time}`
				: `▸ Nästa: ${fmtNum(next.sb)} / ${fmtNum(next.bb)} kl ${next.time}`}
		</div>
	);
}

function PlayerColumn({
	players,
	side,
}: {
	players: Player[];
	side: "left" | "right";
}) {
	return (
		<ul
			className={`flex flex-col gap-1 ${side === "left" ? "items-start text-left" : "items-end text-right"}`}
		>
			{players.map((p) => {
				const icon = p.out ? (
					<span className="pk-player-x">✕</span>
				) : (
					<span className="pk-player-check">✓</span>
				);
				return (
					<li
						key={p.id}
						className={`pk-player pk-display text-lg tracking-wide ${p.out ? "pk-player--out" : ""}`}
					>
						{side === "left" ? (
							<>
								<span>{p.name}</span>
								{icon}
							</>
						) : (
							<>
								{icon}
								<span>{p.name}</span>
							</>
						)}
					</li>
				);
			})}
		</ul>
	);
}

function ScheduleBar({
	structure,
	currentIndex,
}: {
	structure: Level[];
	currentIndex: number;
}) {
	const ref = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const max = el.scrollWidth - el.clientWidth;
		if (max <= 0) return;
		const steps = Math.max(1, structure.length - 1);
		const target = Math.round((max * currentIndex) / steps);
		el.scrollTo({ left: target, behavior: "smooth" });
	}, [currentIndex, structure.length]);

	return (
		<div ref={ref} className="pk-schedule-bar relative z-[1]">
			{structure.map((s, i) => {
				const classes = [
					"pk-chip",
					i === currentIndex
						? "pk-chip--active"
						: i < currentIndex
							? "pk-chip--done"
							: "",
					s.stopp ? "pk-chip--stopp" : "",
				]
					.filter(Boolean)
					.join(" ");
				const label = s.stopp
					? `${s.time} ✕`
					: `${s.time}  ${fmtNum(s.sb)}/${fmtNum(s.bb)}`;
				return (
					<div key={s.id} className={classes}>
						{label}
					</div>
				);
			})}
		</div>
	);
}

function ConfettiOverlay({
	levelKey,
	nonce,
	pot,
	stopp,
}: {
	levelKey: number;
	nonce: number;
	pot: number;
	stopp: boolean;
}) {
	const [burstKey, setBurstKey] = useState(0);
	const [size, setSize] = useState({ w: 0, h: 0 });
	const hasMounted = useRef(false);
	const lastLevel = useRef(levelKey);
	const lastNonce = useRef(nonce);
	const lastPot = useRef(pot);

	useEffect(() => {
		const update = () =>
			setSize({ w: window.innerWidth, h: window.innerHeight });
		update();
		window.addEventListener("resize", update);
		return () => window.removeEventListener("resize", update);
	}, []);

	useEffect(() => {
		// Skip the first render so we don't fire on initial page load.
		if (!hasMounted.current) {
			hasMounted.current = true;
			lastLevel.current = levelKey;
			lastNonce.current = nonce;
			lastPot.current = pot;
			return;
		}
		const levelChanged = levelKey !== lastLevel.current && !stopp;
		const nonceBumped = nonce !== lastNonce.current;
		const potChanged = pot !== lastPot.current;
		lastLevel.current = levelKey;
		lastNonce.current = nonce;
		lastPot.current = pot;
		if (levelChanged || nonceBumped || potChanged) setBurstKey((k) => k + 1);
	}, [levelKey, nonce, pot, stopp]);

	if (burstKey === 0 || size.w === 0) return null;

	return (
		<div className="pointer-events-none fixed inset-0 z-50">
			<ReactConfetti
				key={burstKey}
				width={size.w}
				height={size.h}
				numberOfPieces={500}
				recycle={false}
				gravity={0.25}
				tweenDuration={6000}
			/>
		</div>
	);
}
