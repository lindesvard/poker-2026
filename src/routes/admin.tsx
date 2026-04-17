import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { makeId } from "../lib/defaultState";
import { fmtNum, fmtTime, sendAction } from "../lib/sendAction";
import type { Level } from "../lib/types";
import { useAppState, useCountdown } from "../lib/useAppState";

export const Route = createFileRoute("/admin")({ component: AdminPage });

function AdminPage() {
	const { state, connected } = useAppState();
	const timeLeft = useCountdown(state);
	const current = state.structure[state.currentLevelIndex];

	return (
		<div className="relative z-[1] mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-4 pb-12 pt-4">
			<div className="pk-bg-diamonds" />

			<header className="flex items-center justify-between">
				<div>
					<div className="pk-tournament-title text-lg">♠ Admin</div>
					<div className="text-xs text-[var(--pk-muted)]">
						{state.tournamentName}
					</div>
				</div>
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-2 text-xs uppercase tracking-[2px] text-[var(--pk-muted)]">
						<span
							className={`pk-conn-dot ${connected ? "pk-conn-dot--on" : ""}`}
						/>
						{connected ? "live" : "ansluter…"}
					</div>
					<Link to="/" className="pk-btn pk-btn--ghost text-xs">
						Display
					</Link>
				</div>
			</header>

			<section className="pk-card">
				<div className="pk-card-title">
					Timer — nivå {current?.stopp ? "SLUT" : (current?.lvl ?? "—")}
				</div>
				<div className="flex flex-col items-center gap-3">
					<div
						className={`pk-timer text-[64px] ${
							current?.stopp
								? "pk-timer--danger"
								: timeLeft <= 30
									? "pk-timer--danger"
									: timeLeft <= 60
										? "pk-timer--warn"
										: ""
						}`}
					>
						{current?.stopp ? "STOPP" : fmtTime(timeLeft)}
					</div>
					<div className="pk-mono text-sm text-[var(--pk-gold)]">
						{current?.stopp
							? "—"
							: `${fmtNum(current?.sb ?? null)} / ${fmtNum(current?.bb ?? null)}`}
					</div>
					<div className="flex w-full flex-wrap items-center justify-center gap-2">
						<button
							type="button"
							className="pk-btn"
							onClick={() => sendAction({ type: "level.prev" })}
						>
							← Föregående
						</button>
						<button
							type="button"
							className="pk-btn pk-btn--primary"
							onClick={() => sendAction({ type: "timer.toggle" })}
							disabled={!!current?.stopp}
						>
							{state.timer.running ? "⏸  Pausa" : "▶  Starta"}
						</button>
						<button
							type="button"
							className="pk-btn"
							onClick={() => sendAction({ type: "level.next" })}
						>
							Nästa →
						</button>
					</div>
					<div className="flex flex-wrap items-center justify-center gap-2">
						<button
							type="button"
							className="pk-btn pk-btn--ghost text-xs"
							onClick={() => sendAction({ type: "timer.reset" })}
						>
							Nollställ timer
						</button>
						<button
							type="button"
							className="pk-btn pk-btn--gold text-xs"
							onClick={() => sendAction({ type: "confetti.fire" })}
						>
							🎉 Konfetti
						</button>
					</div>
				</div>
			</section>

			<section className="pk-card">
				<div className="pk-card-title">Hoppa till nivå</div>
				<div className="flex flex-wrap gap-2">
					{state.structure.map((s, i) => {
						const classes = [
							"pk-chip",
							i === state.currentLevelIndex
								? "pk-chip--active"
								: i < state.currentLevelIndex
									? "pk-chip--done"
									: "",
							s.stopp ? "pk-chip--stopp" : "",
						]
							.filter(Boolean)
							.join(" ");
						const label = s.stopp
							? `${s.time} ✕`
							: `N${s.lvl} · ${fmtNum(s.sb)}/${fmtNum(s.bb)}`;
						return (
							<button
								key={s.id}
								type="button"
								className={classes}
								onClick={() =>
									sendAction({ type: "level.jump", payload: { index: i } })
								}
							>
								{label}
							</button>
						);
					})}
				</div>
			</section>

			<DisplayScaleCard scale={state.displayScale} />

			<PotCard pot={state.pot} />

			<PlayersCard players={state.players} />

			<StructureCard
				structure={state.structure}
				levelDurationSec={state.levelDurationSec}
				tournamentName={state.tournamentName}
			/>
		</div>
	);
}

function DisplayScaleCard({ scale }: { scale: number }) {
	const pct = Math.round(scale * 100);
	return (
		<section className="pk-card">
			<div className="pk-card-title">Skärmskalning (TV)</div>
			<div className="flex items-center justify-center gap-3">
				<button
					type="button"
					className="pk-btn pk-btn--neg"
					onClick={() =>
						sendAction({ type: "display.scaleAdjust", payload: { delta: -0.1 } })
					}
					disabled={scale <= 0.5}
				>
					−
				</button>
				<div className="pk-mono min-w-[70px] text-center text-xl text-[var(--pk-gold)]">
					{pct}%
				</div>
				<button
					type="button"
					className="pk-btn pk-btn--pos"
					onClick={() =>
						sendAction({ type: "display.scaleAdjust", payload: { delta: 0.1 } })
					}
					disabled={scale >= 2.5}
				>
					+
				</button>
				<button
					type="button"
					className="pk-btn pk-btn--ghost text-xs"
					onClick={() => sendAction({ type: "display.scale", payload: { value: 1 } })}
				>
					100%
				</button>
			</div>
		</section>
	);
}

function PotCard({ pot }: { pot: number }) {
	const [draft, setDraft] = useState(String(pot));
	useEffect(() => setDraft(String(pot)), [pot]);

	return (
		<section className="pk-card">
			<div className="pk-card-title">Pott</div>
			<div className="flex flex-col gap-3">
				<div className="pk-pot-amount text-center text-4xl">
					{fmtNum(pot)} kr
				</div>
				<div className="flex flex-wrap gap-2">
					<button
						type="button"
						className="pk-btn pk-btn--neg"
						onClick={() =>
							sendAction({ type: "pot.adjust", payload: { delta: -500 } })
						}
					>
						−500
					</button>
					<button
						type="button"
						className="pk-btn pk-btn--neg"
						onClick={() =>
							sendAction({ type: "pot.adjust", payload: { delta: -100 } })
						}
					>
						−100
					</button>
					<button
						type="button"
						className="pk-btn pk-btn--pos"
						onClick={() =>
							sendAction({ type: "pot.adjust", payload: { delta: 100 } })
						}
					>
						+100
					</button>
					<button
						type="button"
						className="pk-btn pk-btn--pos"
						onClick={() =>
							sendAction({ type: "pot.adjust", payload: { delta: 500 } })
						}
					>
						+500
					</button>
					<button
						type="button"
						className="pk-btn pk-btn--ghost"
						onClick={() =>
							sendAction({ type: "pot.set", payload: { value: 0 } })
						}
					>
						Nolla
					</button>
				</div>
				<form
					className="flex gap-2"
					onSubmit={(e) => {
						e.preventDefault();
						const v = parseInt(draft, 10);
						sendAction({
							type: "pot.set",
							payload: { value: Number.isFinite(v) ? v : 0 },
						});
					}}
				>
					<input
						className="pk-input"
						inputMode="numeric"
						value={draft}
						onChange={(e) => setDraft(e.target.value)}
					/>
					<button
						type="submit"
						className="pk-btn pk-btn--gold whitespace-nowrap"
					>
						Sätt
					</button>
				</form>
			</div>
		</section>
	);
}

function PlayersCard({
	players,
}: {
	players: import("../lib/types").Player[];
}) {
	const [newName, setNewName] = useState("");
	const aliveCount = players.filter((p) => !p.out).length;

	return (
		<section className="pk-card">
			<div className="pk-card-title">
				Spelare — {aliveCount} / {players.length} kvar
			</div>
			<ul className="flex flex-col gap-1">
				{players.map((p) => (
					<PlayerRow key={p.id} id={p.id} name={p.name} out={p.out} />
				))}
			</ul>
			<form
				className="mt-3 flex gap-2"
				onSubmit={(e) => {
					e.preventDefault();
					const name = newName.trim();
					if (!name) return;
					sendAction({ type: "player.add", payload: { name } });
					setNewName("");
				}}
			>
				<input
					className="pk-input"
					placeholder="Lägg till spelare…"
					value={newName}
					onChange={(e) => setNewName(e.target.value)}
				/>
				<button type="submit" className="pk-btn pk-btn--gold whitespace-nowrap">
					Lägg till
				</button>
			</form>
		</section>
	);
}

function PlayerRow({
	id,
	name,
	out,
}: {
	id: string;
	name: string;
	out: boolean;
}) {
	const [draft, setDraft] = useState(name);
	useEffect(() => setDraft(name), [name]);

	return (
		<li className="flex items-center gap-2">
			<button
				type="button"
				className={`pk-btn ${out ? "pk-btn--pos" : "pk-btn--neg"} whitespace-nowrap text-xs`}
				style={{ minWidth: 88 }}
				onClick={() =>
					sendAction({ type: "player.toggleOut", payload: { id } })
				}
			>
				{out ? "↩ Tillbaka" : "✕ Ute"}
			</button>
			<input
				className={`pk-input ${out ? "line-through opacity-80" : ""}`}
				value={draft}
				onChange={(e) => setDraft(e.target.value)}
				onBlur={() => {
					const v = draft.trim();
					if (!v || v === name) {
						setDraft(name);
						return;
					}
					sendAction({ type: "player.rename", payload: { id, name: v } });
				}}
			/>
			<button
				type="button"
				className="pk-btn pk-btn--ghost whitespace-nowrap text-xs"
				onClick={() => {
					if (confirm(`Ta bort ${name}?`))
						sendAction({ type: "player.remove", payload: { id } });
				}}
			>
				🗑
			</button>
		</li>
	);
}

function StructureCard({
	structure,
	levelDurationSec,
	tournamentName,
}: {
	structure: Level[];
	levelDurationSec: number;
	tournamentName: string;
}) {
	const [open, setOpen] = useState(false);
	const [draft, setDraft] = useState<Level[]>(structure);
	const [duration, setDuration] = useState(
		String(Math.floor(levelDurationSec / 60)),
	);
	const [nameDraft, setNameDraft] = useState(tournamentName);

	useEffect(() => setDraft(structure), [structure]);
	useEffect(
		() => setDuration(String(Math.floor(levelDurationSec / 60))),
		[levelDurationSec],
	);
	useEffect(() => setNameDraft(tournamentName), [tournamentName]);

	const updateRow = (i: number, patch: Partial<Level>) => {
		setDraft((rows) =>
			rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
		);
	};
	const removeRow = (i: number) =>
		setDraft((rows) => rows.filter((_, idx) => idx !== i));
	const addRow = () => {
		setDraft((rows) => {
			const lastReal = [...rows].reverse().find((r) => !r.stopp);
			const insertAt = rows.at(-1)?.stopp ? rows.length - 1 : rows.length;
			const copy = rows.slice();
			copy.splice(insertAt, 0, {
				id: makeId(),
				time: "--:--",
				lvl: (lastReal?.lvl ?? 0) + 1,
				sb: null,
				bb: null,
				note: "",
				stopp: false,
			});
			return copy;
		});
	};

	return (
		<section className="pk-card">
			<button
				type="button"
				className="flex w-full items-center justify-between"
				onClick={() => setOpen((v) => !v)}
			>
				<span className="pk-card-title mb-0">Struktur & inställningar</span>
				<span className="text-[var(--pk-gold)]">{open ? "▾" : "▸"}</span>
			</button>

			{open ? (
				<div className="mt-4 flex flex-col gap-4">
					<div className="flex flex-wrap gap-3">
						<label className="flex flex-col gap-1 text-xs text-[var(--pk-muted)]">
							Minuter per nivå
							<input
								className="pk-input"
								inputMode="numeric"
								value={duration}
								onChange={(e) => setDuration(e.target.value)}
								style={{ width: 120 }}
							/>
						</label>
						<label className="flex flex-1 flex-col gap-1 text-xs text-[var(--pk-muted)]">
							Turneringsnamn
							<input
								className="pk-input"
								value={nameDraft}
								onChange={(e) => setNameDraft(e.target.value)}
							/>
						</label>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="text-left text-[10px] uppercase tracking-[2px] text-[var(--pk-muted)]">
									<th className="px-2 py-2">Tid</th>
									<th className="px-2 py-2">Nivå</th>
									<th className="px-2 py-2">SB</th>
									<th className="px-2 py-2">BB</th>
									<th className="px-2 py-2">Not</th>
									<th />
								</tr>
							</thead>
							<tbody>
								{draft.map((row, i) => (
									<tr
										key={row.id}
										className={row.stopp ? "bg-[rgba(255,82,82,0.04)]" : ""}
									>
										<td className="px-1 py-1">
											<input
												className="pk-input"
												value={row.time}
												onChange={(e) => updateRow(i, { time: e.target.value })}
											/>
										</td>
										<td className="px-1 py-1">
											<input
												className="pk-input"
												inputMode="numeric"
												value={row.lvl ?? ""}
												onChange={(e) =>
													updateRow(i, {
														lvl: e.target.value
															? parseInt(e.target.value, 10)
															: null,
													})
												}
											/>
										</td>
										<td className="px-1 py-1">
											<input
												className="pk-input"
												inputMode="numeric"
												disabled={row.stopp}
												value={row.sb ?? ""}
												onChange={(e) =>
													updateRow(i, {
														sb: e.target.value
															? parseInt(e.target.value, 10)
															: null,
													})
												}
											/>
										</td>
										<td className="px-1 py-1">
											<input
												className="pk-input"
												inputMode="numeric"
												disabled={row.stopp}
												value={row.bb ?? ""}
												onChange={(e) =>
													updateRow(i, {
														bb: e.target.value
															? parseInt(e.target.value, 10)
															: null,
													})
												}
											/>
										</td>
										<td className="px-1 py-1">
											<input
												className="pk-input"
												value={row.note}
												onChange={(e) => updateRow(i, { note: e.target.value })}
											/>
										</td>
										<td className="px-1 py-1">
											<button
												type="button"
												className="pk-btn pk-btn--ghost text-xs"
												onClick={() => removeRow(i)}
											>
												×
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<div className="flex flex-wrap gap-2">
						<button type="button" className="pk-btn" onClick={addRow}>
							+ Lägg till nivå
						</button>
						<div className="ml-auto flex gap-2">
							<button
								type="button"
								className="pk-btn pk-btn--ghost"
								onClick={() => {
									setDraft(structure);
									setDuration(String(Math.floor(levelDurationSec / 60)));
									setNameDraft(tournamentName);
								}}
							>
								Ångra
							</button>
							<button
								type="button"
								className="pk-btn pk-btn--gold"
								onClick={async () => {
									const minutes = parseInt(duration, 10);
									const levelDuration =
										Number.isFinite(minutes) && minutes > 0
											? minutes * 60
											: levelDurationSec;
									await sendAction({
										type: "structure.update",
										payload: { levels: draft },
									});
									await sendAction({
										type: "settings.update",
										payload: {
											levelDurationSec: levelDuration,
											tournamentName: nameDraft.trim() || tournamentName,
										},
									});
								}}
							>
								✓ Spara
							</button>
						</div>
					</div>
				</div>
			) : null}
		</section>
	);
}
