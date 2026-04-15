export interface AICallbacks {
  readonly onChunk: (text: string) => void;
  readonly onDone: () => void;
  readonly onError: (message: string) => void;
}

type StreamState = 'continue' | 'done' | 'error';

type NdjsonMessage =
  | { chunk: string }
  | { done: true }
  | { error: string };

const processLines = (lines: string[], callbacks: AICallbacks): StreamState =>
  lines.reduce<StreamState>((state, line) => {
    if (state !== 'continue') return state;
    const trimmed = line.trim();
    if (!trimmed) return 'continue';
    const msg = JSON.parse(trimmed) as NdjsonMessage;
    if ('error' in msg) { callbacks.onError(msg.error); return 'error'; }
    if ('done' in msg)  { callbacks.onDone();           return 'done'; }
    if ('chunk' in msg) { callbacks.onChunk(msg.chunk);  }
    return 'continue';
  }, 'continue');

const readStream = async (
  reader: ReadableStreamDefaultReader<string>,
  buffer: string,
  callbacks: AICallbacks,
  signal?: AbortSignal
): Promise<void> => {
  if (signal?.aborted) return;
  const { done, value } = await reader.read();
  if (done) return;
  const full = buffer + (value);
  const lines = full.split('\n');
  const remaining = lines.at(-1) ?? '';
  const state = processLines(lines.slice(0, -1), callbacks);
  if (state !== 'continue') return;
  return readStream(reader, remaining, callbacks, signal);
};

export const generatePackText = async (
  prompt: string,
  currentPack: string,
  callbacks: AICallbacks,
  signal?: AbortSignal,
  mode: 'generate' | 'append' = 'generate',
): Promise<void> => {
  try {
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, currentPack, mode }),
      signal,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null) as { error?: string } | null;
      callbacks.onError(body?.error ?? `Server error: ${response.statusText}`);
      return;
    }
    if (!response.body) {
      callbacks.onError('No response body');
      return;
    }

    const reader = response.body
    .pipeThrough(new TextDecoderStream())
    .getReader();

    await readStream(reader, '', callbacks, signal);
  } catch (err) {
    if (err instanceof  DOMException && err.name === "AbortError") {
      return;
    }
    callbacks.onError(err instanceof Error ? err.message : 'Unknown error');
  }
};