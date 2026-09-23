(() => {
  const root = document.documentElement;
  const modes = ['auto', 'light', 'dark'];
  const names = { auto: '自动', light: '浅色', dark: '深色' };
  let mode = 'auto';
  try { mode = localStorage.getItem('diary-theme') || 'auto'; } catch (_) {}
  if (!modes.includes(mode)) mode = 'auto';
  function apply() {
    if (mode === 'auto') root.removeAttribute('data-theme');
    else root.dataset.theme = mode;
  }
  apply();
  document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('.theme-toggle');
    function label() {
      button.querySelector('.theme-label').textContent = names[mode];
      const next = modes[(modes.indexOf(mode) + 1) % modes.length];
      button.setAttribute('aria-label', `当前${names[mode]}模式，切换为${names[next]}模式`);
      button.title = button.getAttribute('aria-label');
    }
    label();
    button.hidden = false;
    button.addEventListener('click', () => {
      mode = modes[(modes.indexOf(mode) + 1) % modes.length];
      apply();
      label();
      try { localStorage.setItem('diary-theme', mode); } catch (_) {}
    });
  });
})();
