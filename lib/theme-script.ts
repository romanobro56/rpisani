// Light/dark toggle. The site's dark styles all live in
// `@media (prefers-color-scheme: dark)` blocks, so instead of duplicating them
// under a class, this rewrites those media conditions to force a theme:
// always-true for dark, never-true for light, original text to follow the system.
//
// It runs inline at the top of <body>, after the stylesheets, so the saved theme
// applies before first paint. ThemeSync re-applies it after client navigations
// (new pages can bring their own <style> blocks and a fresh toggle button).
export const themeScript = `(function () {
  var KEY = 'theme';
  var DARK_QUERY = /\\(\\s*prefers-color-scheme\\s*:\\s*dark\\s*\\)/;
  var FORCE = { dark: '(min-width: 0px)', light: '(prefers-color-scheme: none)' };
  var system = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function store(theme) {
    try { localStorage.setItem(KEY, theme); } catch (e) {}
  }

  function isDark() {
    var theme = stored();
    if (theme) return theme === 'dark';
    return !!(system && system.matches);
  }

  function rewriteRules(rules, theme) {
    for (var i = 0; i < rules.length; i++) {
      var rule = rules[i];
      if (rule.media) {
        if (rule.originalMedia === undefined) rule.originalMedia = rule.media.mediaText;
        if (DARK_QUERY.test(rule.originalMedia)) {
          rule.media.mediaText = theme
            ? rule.originalMedia.replace(DARK_QUERY, FORCE[theme])
            : rule.originalMedia;
        }
      }
      if (rule.cssRules) rewriteRules(rule.cssRules, theme);
    }
  }

  function apply() {
    var theme = stored();
    for (var i = 0; i < document.styleSheets.length; i++) {
      var rules;
      try { rules = document.styleSheets[i].cssRules; } catch (e) { continue; } // cross-origin CDN sheets
      if (rules) rewriteRules(rules, theme);
    }
    var toggles = document.querySelectorAll('.theme-toggle');
    for (var j = 0; j < toggles.length; j++) toggles[j].setAttribute('aria-checked', String(isDark()));
    document.documentElement.setAttribute('data-theme', isDark() ? 'dark' : 'light');
  }

  window.__siteTheme = { apply: apply };
  apply();

  document.addEventListener('DOMContentLoaded', apply);
  document.addEventListener('click', function (e) {
    var toggle = e.target && e.target.closest && e.target.closest('.theme-toggle');
    if (!toggle) return;
    store(isDark() ? 'light' : 'dark');
    apply();
  });

  if (system && system.addEventListener) system.addEventListener('change', apply);
})();`;
