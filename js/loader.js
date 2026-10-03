function hideLoader() {
  document.querySelector('.loading-section').style.display = 'none';
}
window.addEventListener('load', hideLoader, { once: true });
// A slow external resource must not block access to the portfolio.
setTimeout(hideLoader, 5000);
