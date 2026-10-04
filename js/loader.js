function hideLoader() {
  document.querySelector('.loading-section').style.display = 'none';
}
if (document.readyState === 'complete') hideLoader();
else window.addEventListener('load', hideLoader, { once: true });
// A slow external resource must not block access to the portfolio.
setTimeout(hideLoader, 5000);
