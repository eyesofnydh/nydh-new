import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { createGuestbookHandler, deliverNotification, readEntries } from '../server/guestbook.mjs';
import { createNotifier } from '../server/notify.mjs';
import { createFileStore } from '../server/file-store.mjs';
import { resolve } from 'node:path';

function memoryStore() {
  let value = null, version = 0;
  return {
    async getWithMetadata() { return value ? { data: structuredClone(value), etag: String(version) } : null; },
    async setJSON(key, data, options) {
      if ((options.onlyIfNew && value) || (options.onlyIfMatch && options.onlyIfMatch !== String(version))) return { modified: false };
      value = structuredClone(data); version++; return { modified: true };
    }
  };
}
const entry = extra => ({ id: randomUUID(), deleteToken: randomBytes(32).toString('hex'), author: 'Visitor', text: 'Hello!', reaction: '👍', ...extra });
const request = (method, body, origin = 'https://portfolio.example') => new Request('https://portfolio.example/api/guestbook', {
  method, headers: { Origin: origin, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {})
});

test('shared entries survive a new handler and expose no private tokens', async () => {
  const store = memoryStore();
  let notifications = 0;
  const handler = createGuestbookHandler({ store, notify: async () => { notifications++; return 'accepted'; } });
  const body = entry();
  assert.equal((await handler(request('POST', body))).status, 201);
  const otherVisitor = createGuestbookHandler({ store });
  const data = await (await otherVisitor(request('GET'))).json();
  assert.equal(data.messages[0].text, 'Hello!');
  assert.equal(data.messages[0].deleteHash, undefined);
  assert.equal(data.messages[0].clientHash, undefined);
  assert.equal(data.messages[0].notification, undefined);
  assert.equal(notifications, 1);
});
test('same submission can be retried without duplicate entries or emails', async () => {
  const store = memoryStore(); let notifications = 0;
  const handler = createGuestbookHandler({ store, notify: async () => { notifications++; return 'accepted'; } });
  const body = entry();
  await handler(request('POST', body)); await handler(request('POST', body));
  assert.equal((await readEntries(store)).messages.length, 1);
  assert.equal(notifications, 1);
});
test('concurrent writers preserve both notes', async () => {
  const store = memoryStore(); const handler = createGuestbookHandler({ store });
  const results = await Promise.all([handler(request('POST', entry()), { ip: 'one' }), handler(request('POST', entry()), { ip: 'two' })]);
  assert.deepEqual(results.map(item => item.status), [201, 201]);
  assert.equal((await readEntries(store)).messages.length, 2);
});
test('deletion requires the visitor secret', async () => {
  const store = memoryStore(), handler = createGuestbookHandler({ store }), body = entry();
  await handler(request('POST', body));
  assert.equal((await handler(request('DELETE', { ...body, deleteToken: randomBytes(32).toString('hex') }))).status, 403);
  assert.equal((await handler(request('DELETE', body))).status, 200);
  assert.equal((await readEntries(store)).messages.length, 0);
});
test('rejects empty messages, large requests, invalid reactions, spam, cross-origin writes, and flooding', async () => {
  const handler = createGuestbookHandler({ store: memoryStore() });
  for (const change of [{ text: '  ' }, { text: 'a'.repeat(2001) }, { reaction: '<img>' }, { website: 'bot' }, { author: 'a'.repeat(101) }]) {
    assert.equal((await handler(request('POST', entry(change)))).status, 400);
  }
  assert.equal((await handler(request('POST', entry({ text: 'a'.repeat(17000) })))).status, 413);
  assert.equal((await handler(request('POST', entry(), 'https://other.example'))).status, 403);
  assert.equal((await handler(request('POST', entry()))).status, 201);
  assert.equal((await handler(request('POST', entry()))).status, 429);
});
test('email failure preserves the note and can be retried without reposting', async () => {
  const store = memoryStore(), body = entry();
  const handler = createGuestbookHandler({ store, notify: async () => { throw new Error('offline'); } });
  const result = await (await handler(request('POST', body))).json();
  assert.equal(result.notification, 'pending');
  assert.equal((await readEntries(store)).messages.length, 1);
  await deliverNotification(store, body.id, async () => 'accepted');
  assert.equal((await readEntries(store)).messages[0].notification.status, 'accepted');
});
test('file adapter persists notes across server instances', async () => {
  const directory = resolve('test-results', `guestbook-${randomUUID()}`);
  const handler = createGuestbookHandler({ store: createFileStore(directory) });
  await handler(request('POST', entry()));
  assert.equal((await readEntries(createFileStore(directory))).messages.length, 1);
});
test('notification payload contains the entry and preview does not send mail', async () => {
  let payload;
  const fetchImpl = async (url, options) => { payload = JSON.parse(options.body); return Response.json({ success: 'true' }); };
  const note = { ...entry(), timestamp: new Date().toISOString() };
  assert.equal(await createNotifier({ enabled: true, fetchImpl })(note), 'accepted');
  assert.equal(payload.message, note.text);
  payload = null;
  assert.equal(await createNotifier({ enabled: false, fetchImpl })(note), 'disabled');
  assert.equal(payload, null);
});
