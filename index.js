(() => {
  'use strict';
  const nav = document.querySelector('.nav');
  const menu = document.querySelector('.menu');
  const openButton = document.querySelector('.hamburger');
  const closeButton = document.querySelector('.close');
  const mobile = window.matchMedia('(max-width: 768px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function setMenuOpen(open, restoreFocus = false) {
    [menu, document.body, nav].forEach(element => element.classList.toggle('show', open));
    openButton.setAttribute('aria-expanded', String(open));
    menu.inert = mobile.matches && !open;
    if (open) closeButton.focus({ preventScroll: true });
    else if (restoreFocus) openButton.focus({ preventScroll: true });
  }
  openButton.addEventListener('click', () => setMenuOpen(true));
  closeButton.addEventListener('click', () => setMenuOpen(false, true));
  document.addEventListener('click', event => {
    if (menu.classList.contains('show') && !nav.contains(event.target)) setMenuOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (!menu.classList.contains('show')) return;
    if (event.key === 'Escape') setMenuOpen(false, true);
    if (event.key === 'Tab') {
      const controls = [...menu.querySelectorAll('button, a[href]')];
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  mobile.addEventListener('change', () => setMenuOpen(false));
  setMenuOpen(false);
  const updateNav = () => nav.classList.toggle('fix-nav', window.scrollY > 20);
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const section = document.getElementById(link.hash.slice(1));
      if (!section) return;
      event.preventDefault();
      setMenuOpen(false);
      section.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
    });
  });
  if (window.AOS && !reducedMotion.matches) AOS.init({ once: true, duration: 650, offset: 30 });
  else document.querySelectorAll('[data-aos]').forEach(element => {
    element.style.opacity = '1'; element.style.transform = 'none';
  });
  const title = document.getElementById('type2');
  if (window.TypeIt && title && !reducedMotion.matches) {
    title.textContent = '';
    new TypeIt(title, { speed: 120, loop: true, waitUntilVisible: true })
      .type('Quality Analyst').pause(1200).delete()
      .type('Developer').pause(1200).delete().go();
  }
  if (window.gsap && !reducedMotion.matches) {
    gsap.from('.logo', { opacity: 0, duration: 0.6, y: -10 });
    gsap.from('.nav-item', { opacity: 0, duration: 0.6, y: -10 });
  }
})();
