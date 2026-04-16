/**
 * MSW 2.0+ polyfills for Jest/JSDOM.
 * Must run BEFORE any other imports.
 */
const { TextEncoder, TextDecoder } = require("node:util");
const { ReadableStream, WritableStream, TransformStream } = require("node:stream/web");
const { Blob, File } = require("node:buffer");
const { MessageChannel, MessagePort } = require("node:worker_threads");

// 1. Assign basic utilities used by other libraries
Object.defineProperties(globalThis, {
  TextEncoder: { value: TextEncoder },
  TextDecoder: { value: TextDecoder },
  ReadableStream: { value: ReadableStream },
  WritableStream: { value: WritableStream },
  TransformStream: { value: TransformStream },
  Blob: { value: Blob },
  File: { value: File },
  MessageChannel: { value: MessageChannel },
  MessagePort: { value: MessagePort },
});

// 2. Import undici AFTER basic utilities are in global scope
const { fetch, Headers, FormData, Request, Response } = require("undici");

// 3. Assign fetch primitives
Object.defineProperties(globalThis, {
  fetch: { value: fetch, writable: true },
  Headers: { value: Headers },
  FormData: { value: FormData },
  Request: { value: Request },
  Response: { value: Response },
});
