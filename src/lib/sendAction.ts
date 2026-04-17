import type { Action } from "./types";

export async function sendAction(action: Action): Promise<void> {
	try {
		await fetch("/api/action", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(action),
		});
	} catch (e) {
		console.error("[poker] sendAction failed", e);
	}
}

export const fmtNum = (n: number | null | undefined): string =>
	n == null ? "—" : Number(n).toLocaleString("sv-SE");

export const fmtTime = (s: number): string =>
	`${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
