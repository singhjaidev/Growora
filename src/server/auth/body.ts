export class RequestSizeError extends Error {}
export async function readFields(
  request: Request,
  maxBytes = 4096,
  timeoutMs = 10000,
): Promise<Record<string, unknown>> {
  const reader = request.body?.getReader();
  if (!reader) throw Error('Empty body');
  let size = 0;
  const chunks: Uint8Array[] = [];
  let finished = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error('Request body timed out')), timeoutMs);
  });
  try {
    for (;;) {
      const { done, value } = await Promise.race([reader.read(), deadline]);
      if (done) {
        finished = true;
        break;
      }
      size += value.length;
      if (size > maxBytes) throw new RequestSizeError('Body too large');
      chunks.push(value);
    }
    const fields = JSON.parse(Buffer.concat(chunks).toString());
    if (!fields || typeof fields !== 'object' || Array.isArray(fields)) throw Error('Invalid body');
    return fields;
  } finally {
    clearTimeout(timer);
    // Cancellation itself must not let an uncooperative stream keep the request alive.
    if (!finished) void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
