import { createFileRoute } from "@tanstack/react-router";
import { getState } from "../server/state";

export const Route = createFileRoute("/api/state")({
	server: {
		handlers: {
			GET: async () => Response.json(getState()),
		},
	},
});
