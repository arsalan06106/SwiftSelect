/**
 * Theme management for SwiftSelect
 */

export let currentUserTheme = "glass";

export function init() {
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(["userTheme", "glassThemeMigrated"], (data) => {
      if (!data.glassThemeMigrated) {
        currentUserTheme = "glass";
        applyTheme("glass");
        chrome.storage.local.set({
          userTheme: "glass",
          glassThemeMigrated: true,
        });
      } else if (data.userTheme) {
        if (data.userTheme === "light" || data.userTheme === "dark") {
          currentUserTheme = "standard";
        } else {
          currentUserTheme = data.userTheme;
        }
        applyTheme(currentUserTheme);
      } else {
        applyTheme(currentUserTheme);
      }
    });
  }

  if (window.matchMedia) {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => {
        applyTheme(currentUserTheme);
      });
  }

  let themeUpdatePending = false;
  const observer = new MutationObserver(() => {
    if (themeUpdatePending) return;
    themeUpdatePending = true;
    requestAnimationFrame(() => {
      applyTheme(currentUserTheme);
      themeUpdatePending = false;
    });
  });

  const config = {
    attributes: true,
    attributeFilter: [
      "class",
      "style",
      "data-theme",
      "data-mode",
      "data-color-mode",
      "data-color-scheme",
    ],
  };

  observer.observe(document.documentElement, config);
  observer.observe(document.body, config);
}

export function handleThemeToggle() {
  if (currentUserTheme === "glass") {
    currentUserTheme = "standard";
  } else {
    currentUserTheme = "glass";
  }
  applyTheme(currentUserTheme);
  chrome.storage.local.set({ userTheme: currentUserTheme });
}

export function applyTheme(theme) {
  const ui = window.SwiftSelect?.ui;
  if (!ui) return;

  const elements = [ui.guideEl, ui.statusEl, ui.hudEl, ui.box, ui.overlay];
  elements.forEach((el) => {
    if (el) {
      el.classList.remove(
        "qs-theme-dark",
        "qs-theme-glass",
        "qs-theme-glass-dark",
      );
    }
  });

  const isDarkSite = isPageDark();

  if (theme === "standard") {
    _applyStandardPalette(elements, isDarkSite);
    if (isDarkSite) {
      elements.forEach((el) => {
        if (el) el.classList.add("qs-theme-dark");
      });
    }
  } else if (theme === "glass") {
    if (isDarkSite) {
      elements.forEach((el) => {
        if (el) el.classList.add("qs-theme-glass", "qs-theme-glass-dark");
      });
    } else {
      elements.forEach((el) => {
        if (el) el.classList.add("qs-theme-glass");
      });
    }
  }
}

function _applyStandardPalette(elements, isDarkSite) {
  const pageSurface = _getPageSurfaceColor();
  const pageAccent = _getPageAccentColor();
  const neutralSurface =
    pageSurface && _chroma(pageSurface) < 80 ? pageSurface : null;

  const palette = isDarkSite
    ? _buildDarkStandardPalette(neutralSurface, pageAccent)
    : _buildLightStandardPalette(neutralSurface, pageAccent);

  elements.forEach((el) => {
    if (!el) return;
    Object.entries(palette).forEach(([name, value]) => {
      el.style.setProperty(name, value);
    });
  });
}

function _buildLightStandardPalette(surface, accent) {
  const base = surface && _luma(surface) > 130 ? surface : { r: 248, g: 249, b: 250 };
  const panel = _mix(base, { r: 255, g: 255, b: 255 }, 0.72);
  const panelHover = _mix(base, { r: 240, g: 241, b: 243 }, 0.5);
  const ink = { r: 28, g: 31, b: 36 };

  // Use page accent for interactive fills when detected (with safety bounds)
  const fill = accent && _luma(accent) > 35 && _luma(accent) < 195
    ? accent : ink;
  const fillText = _luma(fill) > 150
    ? { r: 28, g: 31, b: 36 }
    : { r: 255, g: 255, b: 255 };

  return {
    "--qs-standard-bg": _rgb(panel),
    "--qs-standard-bg-hover": _rgb(panelHover),
    "--qs-standard-text": _rgb(ink),
    "--qs-standard-border": accent
      ? `rgba(${fill.r}, ${fill.g}, ${fill.b}, 0.72)`
      : "rgba(28, 31, 36, 0.82)",
    "--qs-standard-border-soft": accent
      ? `rgba(${fill.r}, ${fill.g}, ${fill.b}, 0.14)`
      : "rgba(28, 31, 36, 0.16)",
    "--qs-standard-fill": _rgb(fill),
    "--qs-standard-fill-text": _rgb(fillText),
    "--qs-standard-shadow":
      "0 2px 6px 2px rgba(60, 64, 67, 0.15), 0 1px 2px 0 rgba(60, 64, 67, 0.3)",
    "--qs-standard-inner-shadow": "inset 0 1px 0 rgba(255, 255, 255, 0.82)",
  };
}

function _buildDarkStandardPalette(surface, accent) {
  const base = surface && _luma(surface) < 130 ? surface : { r: 24, g: 25, b: 28 };
  const panel = _mix(base, { r: 18, g: 19, b: 22 }, 0.68);
  const panelHover = _mix(base, { r: 36, g: 38, b: 43 }, 0.56);
  const ink = { r: 244, g: 246, b: 248 };

  // Use page accent for interactive fills when detected
  const fill = accent && _luma(accent) > 35 && _luma(accent) < 195
    ? accent : ink;
  const fillText = _luma(fill) > 150
    ? { r: 24, g: 25, b: 28 }
    : { r: 244, g: 246, b: 248 };

  return {
    "--qs-standard-bg": _rgb(panel),
    "--qs-standard-bg-hover": _rgb(panelHover),
    "--qs-standard-text": _rgb(ink),
    "--qs-standard-border": accent
      ? `rgba(${fill.r}, ${fill.g}, ${fill.b}, 0.72)`
      : "rgba(244, 246, 248, 0.82)",
    "--qs-standard-border-soft": accent
      ? `rgba(${fill.r}, ${fill.g}, ${fill.b}, 0.18)`
      : "rgba(244, 246, 248, 0.18)",
    "--qs-standard-fill": _rgb(fill),
    "--qs-standard-fill-text": _rgb(fillText),
    "--qs-standard-shadow":
      "0 8px 24px rgba(0, 0, 0, 0.45), 0 2px 8px rgba(0, 0, 0, 0.25)",
    "--qs-standard-inner-shadow": "inset 0 1px 0 rgba(255, 255, 255, 0.08)",
  };
}

function _getPageSurfaceColor() {
  const roots = [document.body, document.documentElement].filter(Boolean);
  for (const el of roots) {
    const color = _parseColor(window.getComputedStyle(el).backgroundColor);
    if (color && color.a >= 0.8) return color;
  }

  const vw = window.innerWidth || document.documentElement.clientWidth || 1;
  const vh = window.innerHeight || document.documentElement.clientHeight || 1;
  const points = [
    [vw * 0.5, vh * 0.5],
    [vw * 0.2, vh * 0.2],
    [vw * 0.8, vh * 0.2],
    [vw * 0.2, vh * 0.8],
    [vw * 0.8, vh * 0.8],
  ];

  for (const [rawX, rawY] of points) {
    const x = Math.max(0, Math.min(vw - 1, Math.round(rawX)));
    const y = Math.max(0, Math.min(vh - 1, Math.round(rawY)));
    const stack = document.elementsFromPoint(x, y);
    for (const el of stack) {
      if (!_isThemeSampleCandidate(el)) continue;
      const color = _parseColor(window.getComputedStyle(el).backgroundColor);
      if (color && color.a >= 0.8 && _chroma(color) < 80) return color;
    }
  }

  return null;
}

/**
 * Detect the page's dominant accent/brand color by sampling links and buttons.
 * Returns an {r, g, b} object if a confident accent is found, null otherwise.
 */
function _getPageAccentColor() {
  const samples = [];

  // 1) Sample link text colors — most reliable accent source on any page
  try {
    const links = document.querySelectorAll('a:not([class*="qs-"])');
    const linkLimit = Math.min(links.length, 20);
    for (let i = 0; i < linkLimit; i++) {
      const el = links[i];
      if (el.clientWidth < 1 || el.clientHeight < 1) continue;
      const c = _parseColor(window.getComputedStyle(el).color);
      if (c && c.a >= 0.7 && _chroma(c) > 50 && _luma(c) > 30 && _luma(c) < 220) {
        samples.push(c);
      }
    }
  } catch (e) { /* ignore */ }

  // 2) Sample button backgrounds for brand-colored CTAs
  try {
    const btns = document.querySelectorAll(
      'button:not([class*="qs-"]), [role="button"], input[type="submit"]'
    );
    const btnLimit = Math.min(btns.length, 10);
    for (let i = 0; i < btnLimit; i++) {
      const el = btns[i];
      if (el.clientWidth < 1 || el.clientHeight < 1) continue;
      const c = _parseColor(window.getComputedStyle(el).backgroundColor);
      if (c && c.a >= 0.7 && _chroma(c) > 50 && _luma(c) > 30 && _luma(c) < 220) {
        samples.push(c);
      }
    }
  } catch (e) { /* ignore */ }

  if (samples.length < 2) return null; // need at least 2 samples for confidence

  // Bucket by rounding to nearest 25 to find the dominant color
  const buckets = new Map();
  for (const c of samples) {
    const key = `${Math.round(c.r / 25) * 25},${Math.round(c.g / 25) * 25},${Math.round(c.b / 25) * 25}`;
    if (!buckets.has(key)) buckets.set(key, { count: 0, r: 0, g: 0, b: 0 });
    const b = buckets.get(key);
    b.count++;
    b.r += c.r;
    b.g += c.g;
    b.b += c.b;
  }

  let best = null;
  let bestCount = 0;
  for (const [, b] of buckets) {
    if (b.count > bestCount) {
      bestCount = b.count;
      best = {
        r: Math.round(b.r / b.count),
        g: Math.round(b.g / b.count),
        b: Math.round(b.b / b.count),
      };
    }
  }

  return best;
}

export function shouldUseDarkMode() {
  return isPageDark();
}

export function isPageDark() {
  try {
    const explicitTheme = _readExplicitPageTheme();
    if (explicitTheme) return explicitTheme === "dark";

    const vw = window.innerWidth || document.documentElement.clientWidth || 1;
    const vh = window.innerHeight || document.documentElement.clientHeight || 1;
    const points = [
      [vw * 0.5, vh * 0.5],
      [vw * 0.5, Math.min(96, vh * 0.2)],
      [Math.min(96, vw * 0.2), Math.min(96, vh * 0.2)],
      [Math.max(vw - 96, vw * 0.8), Math.min(96, vh * 0.2)],
      [vw * 0.25, vh * 0.35],
      [vw * 0.75, vh * 0.35],
      [vw * 0.25, vh * 0.75],
      [vw * 0.75, vh * 0.75],
    ];

    let darkScore = 0;
    let lightScore = 0;

    for (const [rawX, rawY] of points) {
      const x = Math.max(0, Math.min(vw - 1, Math.round(rawX)));
      const y = Math.max(0, Math.min(vh - 1, Math.round(rawY)));
      const stack = document.elementsFromPoint(x, y);
      const vote = _sampleStackTheme(stack);

      if (vote === "dark") darkScore += 1;
      if (vote === "light") lightScore += 1;
    }

    const rootVote = _sampleStackTheme([
      document.body,
      document.documentElement,
    ]);
    if (rootVote === "dark") darkScore += 2;
    if (rootVote === "light") lightScore += 2;

    if (lightScore || darkScore) {
      return darkScore > lightScore * 1.15;
    }

    const roots = [document.documentElement, document.body];
    const rootScheme = roots
      .map((r) => (r ? window.getComputedStyle(r).colorScheme : ""))
      .join(" ");
    if (/\bdark\b/i.test(rootScheme) && !/\blight\b/i.test(rootScheme))
      return true;

    return Boolean(
      window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches,
    );
  } catch (e) {
    return false;
  }
}

function _readExplicitPageTheme() {
  const nodes = [document.documentElement, document.body].filter(Boolean);

  for (const el of nodes) {
    const explicit = [
      el.getAttribute("data-theme"),
      el.getAttribute("data-mode"),
      el.getAttribute("data-color-mode"),
      el.getAttribute("data-color-scheme"),
      el.style?.colorScheme,
      window.getComputedStyle(el).colorScheme,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (/\blight\b/.test(explicit) && !/\bdark\b/.test(explicit))
      return "light";
    if (/\bdark\b/.test(explicit) && !/\blight\b/.test(explicit))
      return "dark";
  }

  return null;
}

function _sampleStackTheme(stack) {
  for (const el of stack) {
    if (!_isThemeSampleCandidate(el)) continue;

    const style = window.getComputedStyle(el);
    const bg = _parseColor(style.backgroundColor);

    if (bg && bg.a >= 0.35) {
      const surface = _classifySurfaceColor(bg);
      if (surface) return surface;
    }
  }

  for (const el of stack) {
    if (!_isThemeSampleCandidate(el)) continue;
    if (!el.innerText || !el.innerText.trim()) continue;

    const text = _parseColor(window.getComputedStyle(el).color);
    if (!text || text.a < 0.35) continue;

    const textLuma = _luma(text);
    if (textLuma > 220) return "dark";
    if (textLuma < 55) return "light";
  }

  return null;
}

function _isThemeSampleCandidate(el) {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
  if (
    el.className &&
    typeof el.className === "string" &&
    el.className.includes("qs-")
  )
    return false;
  if (el.clientWidth < 24 || el.clientHeight < 24) return false;
  return true;
}

function _parseColor(colorStr) {
  if (!colorStr) return null;
  if (colorStr === "transparent" || colorStr === "rgba(0, 0, 0, 0)")
    return null;

  if (colorStr.startsWith("#")) {
    let hex = colorStr.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((char) => char + char)
        .join("");
    }
    if (hex.length !== 6) return null;

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return { r, g, b, a: 1 };
  }

  const match = colorStr.match(/(\d+(\.\d+)?)/g);
  if (!match || match.length < 3) return null;

  const r = parseFloat(match[0]);
  const g = parseFloat(match[1]);
  const b = parseFloat(match[2]);
  const a = match.length > 3 ? parseFloat(match[3]) : 1;

  if (a < 0.1) return null;

  return { r, g, b, a };
}

function _classifySurfaceColor(color) {
  const luma = _luma(color);
  const chroma =
    Math.max(color.r, color.g, color.b) - Math.min(color.r, color.g, color.b);

  if (luma > 180) return "light";
  if (luma < 70 && chroma < 70) return "dark";

  // Saturated brand colors, such as Facebook blue buttons, are accents rather
  // than page theme surfaces. Treat them as neutral so they cannot dominate.
  if (chroma > 70) return null;

  if (luma < 105) return "dark";
  if (luma > 155) return "light";
  return null;
}

function _luma({ r, g, b }) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function _chroma({ r, g, b }) {
  return Math.max(r, g, b) - Math.min(r, g, b);
}

function _mix(c1, c2, t) {
  return {
    r: Math.round(c1.r + (c2.r - c1.r) * t),
    g: Math.round(c1.g + (c2.g - c1.g) * t),
    b: Math.round(c1.b + (c2.b - c1.b) * t),
  };
}

function _rgb({ r, g, b }) {
  return `rgb(${r}, ${g}, ${b})`;
}
