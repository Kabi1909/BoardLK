// Apply the saved appearance before the first paint, including on direct links.
(() => {
  let preference;
  try {
    preference = localStorage.getItem('boardlk-theme');
  } catch {
    /* Storage may be blocked. */
  }
  const theme =
    preference === 'light' || preference === 'dark'
      ? preference
      : window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
})();
