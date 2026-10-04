(() => {
  const trigger = document.getElementById('box123-knowMoreBtn');
  const popup = document.getElementById('box123-popup');
  const content = popup.querySelector('[role="dialog"]');
  const closeButton = popup.querySelector('.box123-close-btn');
  const close = () => {
    popup.classList.add('box123-hidden');
    document.body.classList.remove('dialog-open');
    trigger.focus({ preventScroll: true });
  };
  trigger.addEventListener('click', () => {
    popup.classList.remove('box123-hidden');
    document.body.classList.add('dialog-open');
    closeButton.focus({ preventScroll: true });
  });
  closeButton.addEventListener('click', close);
  closeButton.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); close(); }
  });
  popup.addEventListener('click', event => { if (!content.contains(event.target)) close(); });
  popup.addEventListener('keydown', event => {
    if (event.key === 'Escape') close();
    if (event.key !== 'Tab') return;
    const controls = [...content.querySelectorAll('a[href], button, [tabindex="0"]')];
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
})();
