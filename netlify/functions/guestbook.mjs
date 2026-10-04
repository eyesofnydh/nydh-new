import { getStore } from '@netlify/blobs';
import { createGuestbookHandler } from '../../server/guestbook.mjs';
import { createNotifier } from '../../server/notify.mjs';

export default async (request, context) => {
  const production = process.env.CONTEXT === 'production';
  return createGuestbookHandler({
    store: getStore({ name: production ? 'portfolio-guestbook' : `guestbook-preview-${process.env.DEPLOY_ID || 'local'}`, consistency: 'strong' }),
    mode: production ? 'live' : 'preview',
    notify: createNotifier({ enabled: production, email: process.env.GUESTBOOK_EMAIL || 'nidhinxnarayanan@gmail.com', siteURL: process.env.URL })
  })(request, { ip: context.ip });
};
export const config = {
  path: '/api/guestbook',
  rateLimit: { windowLimit: 30, windowSize: 60, aggregateBy: ['ip', 'domain'] }
};
