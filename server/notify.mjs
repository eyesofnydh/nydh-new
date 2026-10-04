// Reuse the site's existing mail provider. The owner must activate FormSubmit once.
export function createNotifier({ email = 'nidhinxnarayanan@gmail.com', enabled = false, siteURL = '', fetchImpl = fetch } = {}) {
  return async message => {
    if (!enabled) return 'disabled';
    const response = await fetchImpl(`https://formsubmit.co/ajax/${encodeURIComponent(email)}`, {
      method: 'POST', signal: AbortSignal.timeout(8000),
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: `New portfolio guestbook entry from ${message.author}`,
        _template: 'table', _url: siteURL, name: message.author,
        message: message.text, reaction: message.reaction,
        posted_at: message.timestamp, entry_id: message.id
      })
    });
    if (!response.ok) throw new Error('Notification provider unavailable');
    const result = await response.json();
    if (result.success !== true && result.success !== 'true') throw new Error('Notification was not accepted');
    return 'accepted';
  };
}
