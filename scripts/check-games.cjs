// State/lifecycle regression tests; canvas drawing is stubbed, not visually tested.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function environment() {
  const timers = new Map();
  const frames = new Map();
  let timerId = 0, frameId = 0, focusCount = 0;
  const drawing = new Proxy({}, { get: (_, name) => name.startsWith('create') ? () => ({ addColorStop() {} }) : () => {} });
  class Element {
    constructor() {
      this.style = {}; this.dataset = {}; this.attrs = {}; this.events = {}; this.tagName = 'DIV';
      this.width = 800; this.height = 500; this.textContent = ''; this.value = '150';
      this.classList = { add() {}, remove() {} }; this.paused = true;
    }
    addEventListener(type, fn) { (this.events[type] ||= []).push(fn); }
    emit(type, event = {}) { for (const fn of this.events[type] || []) fn({ target: this, preventDefault() {}, ...event }); }
    getContext() { return drawing; }
    setAttribute(name, value) { this.attrs[name] = value; }
    focus(options) { assert.equal(options?.preventScroll, true, 'User-triggered focus must not jump the page'); focusCount++; }
    querySelector() { return begin; }
    contains(element) { return element === this || element === begin; }
    appendChild() {} remove() {} play() { return Promise.resolve(); }
  }
  const nodes = new Map();
  const get = id => { if (!nodes.has(id)) nodes.set(id, new Element()); return nodes.get(id); };
  const start = new Element(), begin = new Element();
  const direction = ['up', 'down', 'left', 'right'].map(value => { const element = new Element(); element.dataset.direction = value; return element; });
  const document = new Element();
  document.getElementById = get;
  document.querySelector = selector => get(selector);
  document.querySelectorAll = selector => selector === '[data-snake-start]' ? [start] : selector === '[data-snake-begin]' ? [begin] : direction;
  document.createElement = () => new Element();
  get('mode').value = 'boxless';
  const window = new Element();
  const deterministicMath = Object.create(Math);
  deterministicMath.random = () => 0.25;
  const context = vm.createContext({ document, window, Math: deterministicMath, console,
    localStorage: { getItem() { throw new Error('Storage blocked'); }, setItem() { throw new Error('Storage blocked'); } },
    setTimeout(fn) { const id = ++timerId; timers.set(id, fn); return id; },
    clearTimeout(id) { timers.delete(id); },
    requestAnimationFrame(fn) { const id = ++frameId; frames.set(id, fn); return id; },
    cancelAnimationFrame(id) { frames.delete(id); }
  });
  return { context, get, start, begin, document, direction, timers, frames, focusCount: () => focusCount };
}
function run(file, env) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), env.context, { filename: file });
}
const snake = environment();
run('js/snake-game.js', snake);
assert.equal(snake.focusCount(), 0, 'Snake must not take focus on load');
assert.equal(snake.timers.size, 0, 'Snake must not run on load');
snake.start.emit('click'); snake.begin.emit('click');
assert.equal(snake.timers.size, 1, 'Starting creates one game loop');
snake.start.emit('click'); snake.begin.emit('click');
assert.equal(snake.timers.size, 1, 'Restart must replace the game loop');
snake.get('snake-pause').emit('click');
assert.equal(snake.timers.size, 0, 'Pause stops the timer');
assert.equal(snake.get('pauseOverlay').style.display, 'block');
snake.get('snake-pause').emit('click');
assert.equal(snake.timers.size, 1, 'Resume starts one timer');
snake.document.hidden = true; snake.document.emit('visibilitychange');
assert.equal(snake.timers.size, 0, 'Background tab pauses the game');
const dino = environment();
run('js/dino-game.js', dino);
assert.equal(dino.focusCount(), 0, 'Dinosaur must not take focus on load');
assert.equal(dino.frames.size, 0, 'Dinosaur must not run on load');
dino.get('myr-dino-game').emit('keydown', { code: 'Space' });
assert.equal(dino.frames.size, 1, 'Dinosaur starts one animation loop');
dino.get('myr-dino-game').emit('keydown', { code: 'Space' });
assert.equal(dino.frames.size, 1, 'Repeated start does not duplicate the loop');
let prevented = false;
dino.get('myr-dino-game').emit('keydown', { code: 'Tab', preventDefault() { prevented = true; } });
assert.equal(prevented, false, 'Dinosaur does not trap keyboard navigation');
console.log('PASS: no automatic game focus, no autoplay, single game loops, pause/resume, background pause, blocked storage, and Tab navigation.');
