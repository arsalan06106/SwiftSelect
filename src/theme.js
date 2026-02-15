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

export function shouldUseDarkMode() {
  return isPageDark();
}

export function isPageDark() {
  try {
    const roots = [document.documentElement, document.body];
    if (
      roots.some((r) => r && window.getComputedStyle(r).colorScheme === "dark")
    )
      return true;

    const x = window.innerWidth / 2;
    const y = window.innerHeight / 2;
    const stack = document.elementsFromPoint(x, y);

    for (const el of stack) {
      if (
        el.className &&
        typeof el.className === "string" &&
        el.className.includes("qs-")
      )
        continue;
      if (el.clientWidth < 100 || el.clientHeight < 100) continue;

      const style = window.getComputedStyle(el);
      const bgLuma = _parseLuma(style.backgroundColor);

      if (bgLuma !== null) {
        if (bgLuma < 100) return true;
        if (bgLuma > 200) return false;
      }
    }

    for (const el of stack) {
      if (el.innerText && el.innerText.trim().length > 0) {
        const textLuma = _parseLuma(window.getComputedStyle(el).color);
        if (textLuma !== null) {
          if (textLuma > 200) return true;
          if (textLuma < 80) return false;
        }
        break;
      }
    }

    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  } catch (e) {
    return false;
  }
}

function _parseLuma(colorStr) {
  if (!colorStr) return null;
  if (colorStr === "transparent" || colorStr === "rgba(0, 0, 0, 0)")
    return null;

  if (colorStr.startsWith("#")) {
    const hex = colorStr.slice(1);
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }

  const match = colorStr.match(/(\d+(\.\d+)?)/g);
  if (!match || match.length < 3) return null;

  const r = parseFloat(match[0]);
  const g = parseFloat(match[1]);
  const b = parseFloat(match[2]);
  const a = match.length > 3 ? parseFloat(match[3]) : 1;

  if (a < 0.1) return null;

  return 0.299 * r + 0.587 * g + 0.114 * b;
}
