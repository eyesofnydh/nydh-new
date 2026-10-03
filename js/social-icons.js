window.addEventListener('DOMContentLoaded', () => {
    const icons = document.querySelector('.icons1234');
    if (icons && window.innerWidth <= 767) {
      setTimeout(() => {
        icons.classList.add('show');
      }, 300); // delay for slide-in effect
    }
  });
