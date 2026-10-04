import { createHash, timingSafeEqual } from 'node:crypto';

const KEY = 'entries-v1';
const REACTIONS = new Set(['👍', '🔥', '💡', '❤️', '🚀']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TOKEN = /^[0-9a-f]{64}$/;
const hash = value => createHash('sha256').update(value).digest('hex');
const publicEntry = ({ id, author, text, reaction, timestamp }) => ({ id, author, text, reaction, timestamp });
const response = (body, status = 200) => Response.json(body, {
  status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
});
class InputError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
export async function readEntries(store) {
  const entry = await store.getWithMetadata(KEY, { type: 'json', consistency: 'strong' });
  return { etag: entry?.etag, messages: entry?.data?.messages || [] };
}
// Conditional writes keep concurrent visitors from overwriting one another.
export async function updateEntries(store, change) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const state = await readEntries(store);
    const result = change(state.messages);
    if (result.unchanged) return result.value;
    const saved = await store.setJSON(KEY, { messages: result.messages },
      state.etag ? { onlyIfMatch: state.etag } : { onlyIfNew: true });
    if (saved.modified) return result.value;
  }
  throw new InputError('The guestbook is busy. Please try again in a moment.', 503);
}
export async function deliverNotification(store, id, notify, now = Date.now()) {
  const message = await updateEntries(store, messages => {
    const entry = messages.find(item => item.id === id);
    if (!entry || ['accepted', 'disabled'].includes(entry.notification?.status) ||
        (entry.notification?.status === 'sending' && now - entry.notification.updatedAt < 600000) ||
        entry.notification?.attempts >= 5) return { unchanged: true, value: null };
    entry.notification = { status: 'sending', attempts: (entry.notification?.attempts || 0) + 1, updatedAt: now };
    return { messages, value: publicEntry(entry) };
  });
  if (!message) return 'unchanged';
  let status = 'pending';
  try { status = await notify(message); } catch { /* Keep the outbox entry for a scheduled retry. */ }
  if (!['accepted', 'disabled'].includes(status)) status = 'pending';
  await updateEntries(store, messages => {
    const entry = messages.find(item => item.id === id);
    if (!entry) return { unchanged: true };
    entry.notification.status = status;
    return { messages };
  });
  return status;
}
export function createGuestbookHandler({ store, notify = async () => 'disabled', mode = 'preview', now = Date.now }) {
  return async (request, { ip = 'local' } = {}) => {
    try {
      if (request.method === 'GET') {
        const { messages } = await readEntries(store);
        return response({ messages: messages.slice(0, 200).map(publicEntry), mode });
      }
      if (!['POST', 'DELETE'].includes(request.method)) return response({ error: 'Method not allowed.' }, 405);
      const origin = request.headers.get('origin');
      if (origin && origin !== new URL(request.url).origin) throw new InputError('Please submit from this website.', 403);
      if (!request.headers.get('content-type')?.includes('application/json')) throw new InputError('JSON is required.', 415);
      if (Number(request.headers.get('content-length')) > 16384) throw new InputError('Message is too large.', 413);
      const raw = await request.text();
      if (Buffer.byteLength(raw) > 16384) throw new InputError('Message is too large.', 413);
      let body;
      try { body = JSON.parse(raw); } catch { throw new InputError('Invalid message.'); }
      if (!body || typeof body !== 'object' || typeof body.id !== 'string' || typeof body.deleteToken !== 'string' || !UUID.test(body.id) || !TOKEN.test(body.deleteToken)) {
        throw new InputError('Invalid message identity. Please refresh and try again.');
      }
      const deleteHash = hash(body.deleteToken);
      if (request.method === 'DELETE') {
        await updateEntries(store, messages => {
          const entry = messages.find(item => item.id === body.id);
          if (!entry) return { unchanged: true };
          if (!timingSafeEqual(Buffer.from(entry.deleteHash), Buffer.from(deleteHash))) throw new InputError('You can only delete your own entries.', 403);
          return { messages: messages.filter(item => item.id !== body.id) };
        });
        return response({ deleted: true });
      }
      if (body.website) throw new InputError('Unable to accept this message.');
      const author = typeof body.author === 'string' ? body.author.trim() : '';
      const text = typeof body.text === 'string' ? body.text.trim() : '';
      if (!text || text.length > 2000 || author.length > 100 || !REACTIONS.has(body.reaction)) {
        throw new InputError('Enter a message of 1–2,000 characters and choose a reaction.');
      }
      const time = now();
      const clientHash = hash(ip);
      const result = await updateEntries(store, messages => {
        const existing = messages.find(item => item.id === body.id);
        if (existing) {
          if (existing.deleteHash !== deleteHash || existing.text !== text || existing.author !== (author || 'Anonymous') || existing.reaction !== body.reaction) {
            throw new InputError('Message identity already used.', 409);
          }
          return { unchanged: true, value: publicEntry(existing) };
        }
        if (messages.some(item => item.clientHash === clientHash && time - Date.parse(item.timestamp) < 30000)) {
          throw new InputError('Thanks! Please wait 30 seconds before posting again.', 429);
        }
        const message = { id: body.id, author: author || 'Anonymous', text, reaction: body.reaction,
          timestamp: new Date(time).toISOString(), deleteHash, clientHash,
          notification: { status: 'pending', attempts: 0, updatedAt: time } };
        return { messages: [message, ...messages], value: publicEntry(message) };
      });
      // Publication succeeds even if the email provider temporarily fails.
      let notification = 'pending';
      try { notification = await deliverNotification(store, result.id, notify, time); } catch {}
      return response({ message: result, notification, mode }, 201);
    } catch (error) {
      if (error instanceof InputError) return response({ error: error.message }, error.status);
      console.error('Guestbook storage unavailable:', error.message);
      return response({ error: 'The guestbook is temporarily unavailable. Your message has not been cleared; please retry.' }, 503);
    }
  };
}
