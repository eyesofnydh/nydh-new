(() => {
  'use strict';
  const form = document.getElementById('guestbook-form');
  const list = document.getElementById('messages');
  const empty = document.getElementById('no-messages');
  const count = document.getElementById('message-count');
  const status = document.getElementById('guestbook-status');
  const nameInput = document.getElementById('author-name');
  const textInput = document.getElementById('message-text');
  const submit = form.querySelector('[type="submit"]');
  const refreshButton = document.getElementById('guestbook-refresh');
  const moreButton = document.getElementById('guestbook-more');
  const readLocal = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
  };
  const writeLocal = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
  let owned = readLocal('guestbook-owned-v1', {});
  if (!owned || typeof owned !== 'object' || Array.isArray(owned)) owned = {};
  let messages = [], visibleCount = 10, busy = false, refreshing = false, refreshVersion = 0, pending;
  const setStatus = (message, type = '') => { status.textContent = message; status.dataset.state = type; };
  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };
  async function api(method = 'GET', body) {
    let result;
    try {
      result = await fetch('/api/guestbook', { method, cache: 'no-store', signal: AbortSignal.timeout(15000),
        ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) });
    } catch { throw new Error('Could not reach the guestbook. Your message is still here—please try again.'); }
    let data;
    try { data = await result.json(); } catch { throw new Error('The shared guestbook is not available yet. Please try again shortly.'); }
    if (!result.ok) throw new Error(data.error || 'The guestbook is busy. Please try again shortly.');
    return data;
  }
  function showMode(mode) {
    document.getElementById('guestbook-note').textContent = mode === 'preview'
      ? 'Preview guestbook: notes are shared within this preview. No email is sent.'
      : 'Your name, message, and reaction will be public. Nidhin receives an email notification.';
  }
  function updateDraft() {
    document.getElementById('guestbook-character-count').textContent = textInput.value.length.toLocaleString();
    writeLocal('guestbook-draft-v1', { author: nameInput.value, text: textInput.value,
      reaction: form.querySelector('[name="reaction"]:checked').value });
  }
  function render() {
    list.replaceChildren();
    count.textContent = messages.length;
    empty.classList.toggle('hidden', messages.length > 0);
    list.classList.toggle('hidden', messages.length === 0);
    empty.querySelector('p').textContent = 'No notes yet. Leave the first hello!';
    moreButton.hidden = messages.length <= visibleCount;
    for (const message of messages.slice(0, visibleCount)) {
      const item = make('li', 'message-item');
      item.dataset.id = message.id;
      const header = make('div', 'message-header');
      const time = make('time', 'message-timestamp', new Date(message.timestamp).toLocaleString(undefined,
        { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
      time.dateTime = message.timestamp;
      header.append(make('span', 'message-author', message.author), time);
      const footer = make('div', 'message-footer');
      footer.append(make('span', 'message-reaction', message.reaction));
      if (typeof owned[message.id] === 'string') {
        const remove = make('button', 'delete-btn', 'Delete my note');
        remove.type = 'button';
        remove.addEventListener('click', async () => {
          remove.disabled = true;
          try {
            await api('DELETE', { id: message.id, deleteToken: owned[message.id] });
            refreshVersion++;
            delete owned[message.id]; writeLocal('guestbook-owned-v1', owned);
            messages = messages.filter(entry => entry.id !== message.id);
            render(); setStatus('Your note was deleted.');
          } catch (error) { setStatus(error.message, 'error'); remove.disabled = false; }
        });
        footer.append(remove);
      }
      item.append(header, make('div', 'message-text', message.text), footer);
      list.append(item);
    }
  }
  async function refresh(manual = false) {
    if (busy || refreshing) return;
    refreshing = true; refreshButton.disabled = true;
    const version = ++refreshVersion;
    try {
      const data = await api();
      if (version !== refreshVersion) return;
      messages = data.messages; showMode(data.mode); render();
      if (manual) setStatus('Visitor notes are up to date.');
    } catch (error) {
      if (version === refreshVersion) {
        setStatus(error.message, 'error');
        if (!messages.length) empty.querySelector('p').textContent = 'Notes could not load. Use Refresh to try again.';
      }
    } finally { refreshing = false; refreshButton.disabled = false; }
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !form.reportValidity()) return;
    const text = textInput.value.trim();
    if (!text) { setStatus('Write a message before posting.', 'error'); textInput.focus(); return; }
    const content = { author: nameInput.value.trim(), text, reaction: form.querySelector('[name="reaction"]:checked').value };
    const fingerprint = JSON.stringify(content);
    if (pending?.fingerprint !== fingerprint) {
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      pending = { fingerprint, id: crypto.randomUUID(), deleteToken: Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('') };
    }
    busy = true; refreshVersion++; submit.disabled = true; form.setAttribute('aria-busy', 'true');
    submit.querySelector('span').textContent = 'Posting…'; setStatus('Saving your note…');
    owned[pending.id] = pending.deleteToken; writeLocal('guestbook-owned-v1', owned);
    try {
      const data = await api('POST', { ...content, id: pending.id, deleteToken: pending.deleteToken, website: form.elements.website.value });
      messages = [data.message, ...messages.filter(message => message.id !== data.message.id)];
      visibleCount = Math.max(10, visibleCount); render(); showMode(data.mode);
      form.reset(); pending = null; updateDraft();
      setStatus(data.mode === 'preview' ? 'Posted to the preview guestbook. No email was sent.' :
        data.notification === 'pending' ? 'Your note is public. The email notification will be retried.' : 'Your note is posted. Thanks for stopping by!', 'success');
    } catch (error) { setStatus(error.message, 'error'); }
    finally { busy = false; submit.disabled = false; form.removeAttribute('aria-busy'); submit.querySelector('span').textContent = 'Post your message'; }
  });
  form.addEventListener('input', updateDraft);
  form.addEventListener('change', updateDraft);
  refreshButton.addEventListener('click', () => refresh(true));
  moreButton.addEventListener('click', () => { visibleCount += 10; render(); });
  const draft = readLocal('guestbook-draft-v1', {});
  if (typeof draft.author === 'string') nameInput.value = draft.author.slice(0, 100);
  if (typeof draft.text === 'string') textInput.value = draft.text.slice(0, 2000);
  for (const input of form.querySelectorAll('[name="reaction"]')) if (input.value === draft.reaction) input.checked = true;
  updateDraft(); refresh();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  // Refresh only while the section is in view to keep background work small.
  let visible = false;
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }).observe(document.getElementById('guestbook'));
  setInterval(() => { if (visible && !document.hidden) refresh(); }, 60000);
})();
