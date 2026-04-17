import { createFileRoute } from "@tanstack/react-router";
import type { Action } from "../lib/types";
import { dispatch } from "../server/state";

export const Route = createFileRoute("/api/action")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				let action: Action;
				try {
					action = (await request.json()) as Action;
				} catch {
					return Response.json({ error: "invalid json" }, { status: 400 });
				}
				if (
					!action ||
					typeof action !== "object" ||
					typeof action.type !== "string"
				) {
					return Response.json({ error: "invalid action" }, { status: 400 });
				}
				const next = dispatch(action);
				return Response.json({ ok: true, state: next });
			},
		},
	},
});
