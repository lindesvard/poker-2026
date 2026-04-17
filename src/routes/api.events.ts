import { createFileRoute } from "@tanstack/react-router";
import { getState, subscribe } from "../server/state";

const encoder = new TextEncoder();

function sseFrame(data: unknown): Uint8Array {
	return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
}

export const Route = createFileRoute("/api/events")({
	server: {
		handlers: {
			GET: async () => {
				let closed = false;
				let cleanup: (() => void) | null = null;

				const stream = new ReadableStream<Uint8Array>({
					start(controller) {
						const safeEnqueue = (chunk: Uint8Array) => {
							if (closed) return;
							try {
								controller.enqueue(chunk);
							} catch {
								closed = true;
							}
						};

						safeEnqueue(sseFrame({ type: "state", state: getState() }));

						const unsubscribe = subscribe((state) => {
							safeEnqueue(sseFrame({ type: "state", state }));
						});

						const heartbeat = setInterval(() => {
							safeEnqueue(encoder.encode(`: ping ${Date.now()}\n\n`));
						}, 15000);

						cleanup = () => {
							closed = true;
							clearInterval(heartbeat);
							unsubscribe();
						};
					},
					cancel() {
						cleanup?.();
					},
				});

				return new Response(stream, {
					headers: {
						"Content-Type": "text/event-stream",
						"Cache-Control": "no-cache, no-transform",
						Connection: "keep-alive",
						"X-Accel-Buffering": "no",
					},
				});
			},
		},
	},
});
