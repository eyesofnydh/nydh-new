(() => {
  const toggle = document.getElementById('sound-toggle');
  const audio = [...document.querySelectorAll('audio')];
  let muted = false;
  try { muted = localStorage.getItem('portfolio-muted') === 'true'; } catch {}
  function applySoundPreference() {
    audio.forEach(sound => { sound.muted = muted; });
    toggle.textContent = muted ? 'Sound: off' : 'Sound: on';
    toggle.setAttribute('aria-pressed', String(muted));
    toggle.setAttribute('aria-label', muted ? 'Unmute sound effects' : 'Mute sound effects');
  }
  applySoundPreference();
  toggle.addEventListener('click', () => {
    muted = !muted;
    applySoundPreference();
    try { localStorage.setItem('portfolio-muted', String(muted)); } catch {}
  });
  const peekImage = document.getElementById('peekImage');
  const clickSound = document.getElementById('clickSound');
  peekImage.addEventListener('mouseenter', () => {
    if (muted) return;
    clickSound.currentTime = 0.1;
    clickSound.play().catch(() => {});
  });
})();
