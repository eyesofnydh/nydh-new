class GuestbookManager {
  constructor() {
    this.storageKey = 'premium_guestbook_messages';
    this.messages = this.loadMessages();
    this.form = document.getElementById('guestbook-form');
    this.messagesList = document.getElementById('messages');
    this.noMessagesEl = document.getElementById('no-messages');
    this.messageCountEl = document.getElementById('message-count');

    this.init();
  }

  init() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    this.renderMessages();
    this.updateMessageCount();
    this.addSubmitAnimation();
  }

  loadMessages() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      const messages = stored ? JSON.parse(stored) : [];
      return Array.isArray(messages) ? messages.filter(message => message &&
        typeof message.id === 'number' && Number.isFinite(message.id) &&
        typeof message.author === 'string' && typeof message.text === 'string' &&
        typeof message.reaction === 'string' && Number.isFinite(Date.parse(message.timestamp))) : [];
    } catch (error) {
      console.error('Error loading messages:', error);
      return [];
    }
  }

  saveMessages() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.messages));
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  }

  addSubmitAnimation() {
    const submitBtn = this.form.querySelector('.submit-btn');
    submitBtn.addEventListener('click', () => {
      submitBtn.style.transform = 'scale(0.98)';
      setTimeout(() => {
        submitBtn.style.transform = '';
      }, 150);
    });
  }

  handleSubmit(e) {
    e.preventDefault();

    const messageText = document.getElementById('message-text').value.trim();
    const authorName = document.getElementById('author-name').value.trim();
    const reactionInput = this.form.querySelector('input[name="reaction"]:checked');
    const reaction = reactionInput ? reactionInput.value : '👍';

    if (!messageText) return;

    const message = {
      id: Date.now() + Math.random(),
      text: messageText,
      author: authorName || 'Anonymous',
      reaction: reaction,
      timestamp: new Date().toISOString()
    };

    this.addMessage(message);
    this.form.reset();

    // Reset reaction to first option
    const firstReaction = this.form.querySelector('input[name="reaction"]');
    if (firstReaction) firstReaction.checked = true;
  }

  addMessage(message) {
    this.messages.unshift(message);
    this.saveMessages();
    this.renderMessages();
    this.updateMessageCount();
  }

  deleteMessage(id) {
    this.messages = this.messages.filter(msg => msg.id !== id);
    this.saveMessages();
    this.renderMessages();
    this.updateMessageCount();
  }

  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  renderMessages() {
    if (this.messages.length === 0) {
      this.messagesList.replaceChildren();
      this.messagesList.classList.add('hidden');
      this.noMessagesEl.classList.remove('hidden');
      return;
    }

    this.messagesList.classList.remove('hidden');
    this.noMessagesEl.classList.add('hidden');

    this.messagesList.innerHTML = this.messages.map(message => `
      <li class="message-item" data-id="${message.id}">
        <div class="message-header">
          <span class="message-author">${this.escapeHtml(message.author)}</span>
          <span class="message-timestamp">${this.formatTimestamp(message.timestamp)}</span>
        </div>
        <div class="message-text">${this.escapeHtml(message.text)}</div>
        <div class="message-footer">
          <span class="message-reaction">${this.escapeHtml(message.reaction)}</span>
          <button class="delete-btn" onclick="guestbook.deleteMessage(${message.id})">
            Delete
          </button>
        </div>
      </li>
    `).join('');
  }

  updateMessageCount() {
    this.messageCountEl.textContent = this.messages.length;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize the premium guestbook
const guestbook = new GuestbookManager();

// Auto-refresh timestamps
setInterval(() => {
  guestbook.renderMessages();
}, 60000);
