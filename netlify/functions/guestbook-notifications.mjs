import { getStore } from '@netlify/blobs';
import { readEntries, deliverNotification } from '../../server/guestbook.mjs';
import { createNotifier } from '../../server/notify.mjs';

export default async () => {
  if (process.env.CONTEXT !== 'production') return new Response('Preview: notifications disabled');
  const store = getStore({ name: 'portfolio-guestbook', consistency: 'strong' });
  const notify = createNotifier({ enabled: true, email: process.env.GUESTBOOK_EMAIL || 'nidhinxnarayanan@gmail.com', siteURL: process.env.URL });
  const { messages } = await readEntries(store);
  const pending = messages.filter(message => ['pending', 'sending'].includes(message.notification?.status) &&
    message.notification.attempts < 5 && Date.now() - message.notification.updatedAt > 600000).slice(0, 3);
  await Promise.all(pending.map(message => deliverNotification(store, message.id, notify)));
  return new Response('Notification queue checked');
};
export const config = { schedule: '*/15 * * * *' };
