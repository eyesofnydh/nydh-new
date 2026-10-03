// Fix Nav
const navBar = document.querySelector(".nav");
const navHeight = navBar.getBoundingClientRect().height;

window.addEventListener("scroll", () => {
  const scrollHeight = window.scrollY;
  if (scrollHeight > navHeight) {
    navBar.classList.add("fix-nav");
  } else {
    navBar.classList.remove("fix-nav");
  }
});

// Smooth Scroll Function
function smoothScroll(target, duration) {
  const targetElement = document.getElementById(target.slice(1));
  if (!targetElement) return;
  const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY;
  const startPosition = window.scrollY;
  const distance = targetPosition - startPosition;
  let startTime = null;

  function animation(currentTime) {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const run = ease(Math.min(timeElapsed, duration), startPosition, distance, duration);
    window.scrollTo(0, run);
    if (timeElapsed < duration) requestAnimationFrame(animation);
  }

  function ease(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t + b;
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
  }

  requestAnimationFrame(animation);
}


// Smooth Scroll for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = this.getAttribute('href');
    if (!target || target === '#' || !document.getElementById(target.slice(1))) return;
    e.preventDefault();
    setMenuOpen(false);
    smoothScroll(target, 100); // Adjust duration as needed
  });
});


// Toggle Menu
const menu = document.querySelector(".menu");
const navOpen = document.querySelector(".hamburger");
const navClose = document.querySelector(".close");

function setMenuOpen(open) {
  [menu, document.body, navBar].forEach(element => element.classList.toggle('show', open));
  navOpen.setAttribute('aria-expanded', String(open));
}
navOpen.addEventListener('click', () => setMenuOpen(true));
navClose.addEventListener('click', () => setMenuOpen(false));
[navOpen, navClose].forEach(control => control.addEventListener('keydown', event => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    control.click();
  }
}));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') setMenuOpen(false);
});
window.addEventListener('resize', () => {
  if (window.innerWidth > 768) setMenuOpen(false);
});


// Glidejs

const glide = document.querySelector(".glide");

if (glide && window.Glide)
  new Glide(glide, {
    type: "carousel",
    startAt: 0,
    perView: 3,
    gap: 30,
    hoverpause: true,
    autoplay: 2000,
    animationDuration: 800,
    animationTimingFunc: "linear",
    breakpoints: {
      996: {
        perView: 2,
      },
      768: {
        perView: 1,
      },
    },
  }).mount();

if (window.AOS) AOS.init();
else document.querySelectorAll('[data-aos]').forEach(element => {
  element.style.opacity = '1';
  element.style.transform = 'none';
});

if (window.TypeIt) new TypeIt("#type1", {
  speed: 120,
  loop: true,
  waitUntilVisible: true,
})
  .type("Quality Analyst", { delay: 400 })
  .pause(500)
  .delete(20)
  .type("coder", { delay: 400 })
  .pause(400)
  .delete(18)
  .go();

if (window.TypeIt) new TypeIt("#type2", {
  speed: 120,
  loop: true,
  waitUntilVisible: true,
})
  .type("QA Automation Tester", { delay: 400 })
  .pause(500)
  .delete(20)
  .type("Developer ", { delay: 400 })
  .pause(500)
  .delete(18)
  .go();



if (window.gsap) {
gsap.from(".logo", { opacity: 0, duration: 1, delay: 0.5, y: -10 });
gsap.from(".hamburger", { opacity: 0, duration: 1, delay: 0.8, x: 20 });
gsap.from(".banner", { opacity: 0, duration: 1, delay: 1.1, x: -200 });
gsap.from(".hero h3", { opacity: 0, duration: 1, delay: 1.4, y: -50 });
gsap.from(".hero h1", { opacity: 0, duration: 1, delay: 1.7, y: -45 });
gsap.from(".hero h4", { opacity: 0, duration: 1, delay: 2.1, y: -30 });
gsap.from(".hero a", { opacity: 0, duration: 1, delay: 2.4, y: -10 });

gsap.from(".nav-item", {
  opacity: 0,
  duration: 1,
  delay: 1,
  y: 30,
  stagger: 0.2,
});

gsap.from(".icons span", {
  opacity: 0,
  duration: 1,
  delay: 2.5,
  x: -30,
  stagger: 0.2,
});
}



