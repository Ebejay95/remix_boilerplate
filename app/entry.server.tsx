import { PassThrough } from "node:stream";
import type { AppLoadContext, EntryContext } from "@remix-run/node";
import { createReadableStreamFromReadable } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { connectDB } from "./db.server";
import { ensureMasterUser } from "./services/master-user.server";

const ABORT_DELAY = 5_000;

let initPromise = Promise.all([
	connectDB(),
	ensureMasterUser()
	]).catch(console.error);

	export default async function handleRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	remixContext: EntryContext,
	loadContext: AppLoadContext
	) {
	// Wichtig: Warte auf die Initialisierung
	await initPromise;

	return isbot(request.headers.get("user-agent") || "")
		? handleBotRequest(
			request,
			responseStatusCode,
			responseHeaders,
			remixContext
		)
		: handleBrowserRequest(
			request,
			responseStatusCode,
			responseHeaders,
			remixContext
		);
	}

function handleBotRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	remixContext: EntryContext
) {
	return new Promise((resolve, reject) => {
	let shellRendered = false;
	const { pipe, abort } = renderToPipeableStream(
		<RemixServer
		context={remixContext}
		url={request.url}
		abortDelay={ABORT_DELAY}
		/>,
		{
		onAllReady() {
			shellRendered = true;
			const body = new PassThrough();
			const stream = createReadableStreamFromReadable(body);

			responseHeaders.set("Content-Type", "text/html");

			resolve(
			new Response(stream, {
				headers: responseHeaders,
				status: responseStatusCode,
			})
			);

			pipe(body);
		},
		onShellError(error: unknown) {
			reject(error);
		},
		onError(error: unknown) {
			responseStatusCode = 500;
			if (shellRendered) {
			console.error(error);
			}
		},
		}
	);

	setTimeout(abort, ABORT_DELAY);
	});
}

function handleBrowserRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	remixContext: EntryContext
) {
	return new Promise((resolve, reject) => {
	let shellRendered = false;
	const { pipe, abort } = renderToPipeableStream(
		<RemixServer
		context={remixContext}
		url={request.url}
		abortDelay={ABORT_DELAY}
		/>,
		{
		onShellReady() {
			shellRendered = true;
			const body = new PassThrough();
			const stream = createReadableStreamFromReadable(body);

			responseHeaders.set("Content-Type", "text/html");

			resolve(
			new Response(stream, {
				headers: responseHeaders,
				status: responseStatusCode,
			})
			);

			pipe(body);
		},
		onShellError(error: unknown) {
			reject(error);
		},
		onError(error: unknown) {
			responseStatusCode = 500;
			if (shellRendered) {
			console.error(error);
			}
		},
		}
	);

	setTimeout(abort, ABORT_DELAY);
	});
}
