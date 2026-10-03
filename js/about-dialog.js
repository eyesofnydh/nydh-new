const btn123 = document.getElementById("box123-knowMoreBtn");
  const popup123 = document.getElementById("box123-popup");
  const closeBtn123 = document.querySelector(".box123-close-btn");

  btn123.addEventListener("click", () => {
    popup123.classList.remove("box123-hidden");
  });

  closeBtn123.addEventListener("click", () => {
    popup123.classList.add("box123-hidden");
  });

  window.addEventListener("click", (e) => {
    if (e.target === popup123) {
      popup123.classList.add("box123-hidden");
    }
  });

closeBtn123.addEventListener('keydown', event => {
  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); closeBtn123.click(); }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') popup123.classList.add('box123-hidden');
});
