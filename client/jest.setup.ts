import "@testing-library/jest-dom";
import { afterAll, afterEach, beforeAll } from "@jest/globals";
import { TextDecoder, TextEncoder } from "node:util";
import { ReadableStream, TransformStream, WritableStream } from "node:stream/web";
import { BroadcastChannel, MessagePort } from "node:worker_threads";

Object.assign(globalThis, {
  TextDecoder,
  TextEncoder,
  ReadableStream,
  TransformStream,
  WritableStream,
  MessagePort,
  BroadcastChannel,
});

const fetchGlobals = require("undici");
Object.assign(globalThis, {
  fetch: fetchGlobals.fetch,
  Headers: fetchGlobals.Headers,
  Request: fetchGlobals.Request,
  Response: fetchGlobals.Response,
  FormData: fetchGlobals.FormData,
  File: fetchGlobals.File,
});

export let server: Awaited<ReturnType<typeof createServer>>;

async function createServer() {
  const { setupServer } = await import("msw/node");
  return setupServer();
}

beforeAll(async () => {
  server = await createServer();
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  server?.resetHandlers();
});

afterAll(() => {
  server?.close();
});
