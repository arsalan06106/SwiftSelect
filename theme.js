if (!window.SwiftSelect) window.SwiftSelect = {};

if (!window.SwiftSelect.theme) {
  window.SwiftSelect.theme = {
    currentUserTheme: "glass", // Default

    init: function () {
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(
          ["userTheme", "glassThemeMigrated"],
          (data) => {
            // MIGRATION: Force "glass" theme once for all users (new & existing)
            if (!data.glassThemeMigrated) {
              this.currentUserTheme = "glass";
              this.applyTheme("glass");
              chrome.storage.local.set({
                userTheme: "glass",
                glassThemeMigrated: true,
              });
            } else if (data.userTheme) {
              // Map old light/dark themes to adaptive standard
              if (data.userTheme === "light" || data.userTheme === "dark") {
                this.currentUserTheme = "standard";
              } else {
                this.currentUserTheme = data.userTheme;
              }
              this.applyTheme(this.currentUserTheme);
            } else {
              // Fallback for new users
              this.applyTheme(this.currentUserTheme);
            }
          },
        );
      }

      // Listener for System/Browser Theme Changes
      if (window.matchMedia) {
        window
          .matchMedia("(prefers-color-scheme: dark)")
          .addEventListener("change", () => {
            this.applyTheme(this.currentUserTheme);
          });
      }

      // Observer for Site Theme Changes (Class/Style updates)
      const observer = new MutationObserver(() => {
        // Apply theme whenever page changes might affect detected theme
        this.applyTheme(this.currentUserTheme);
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
    },

    handleThemeToggle: function () {
      // Toggle only between Standard Adaptive and Glass Adaptive
      if (this.currentUserTheme === "glass") {
        this.currentUserTheme = "standard";
      } else {
        this.currentUserTheme = "glass";
      }
      this.applyTheme(this.currentUserTheme);
      chrome.storage.local.set({ userTheme: this.currentUserTheme });
    },

    applyTheme: function (theme) {
      const guideEl = window.SwiftSelect.ui?.guideEl;
      const hudEl = window.SwiftSelect.ui?.hudEl;
      const statusEl = window.SwiftSelect.ui?.statusEl;
      const boxEl = window.SwiftSelect.ui?.box;
      const overlayEl = window.SwiftSelect.ui?.overlay;

      // Reset classes first
      const elements = [guideEl, statusEl, hudEl, boxEl, overlayEl];
      elements.forEach((el) => {
        if (el) {
          el.classList.remove(
            "qs-theme-dark",
            "qs-theme-glass",
            "qs-theme-glass-dark",
          );
        }
      });

      const isDarkSite = this.isPageDark();

      if (theme === "standard") {
        if (isDarkSite) {
          elements.forEach((el) => {
            if (el) el.classList.add("qs-theme-dark");
          });
        }
        // light is default, no classes needed
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
    },

    shouldUseDarkMode: function () {
      return this.isPageDark();
    },

    isPageDark: function () {
      try {
        // ── LEVEL 1: EXPLICIT CSS SIGNALS ──
        const roots = [document.documentElement, document.body];
        if (
          roots.some(
            (r) => r && window.getComputedStyle(r).colorScheme === "dark",
          )
        )
          return true;

        // ── LEVEL 2: VISUAL STACK "X-RAY" ──
        // Get the entire stack of elements at the center of the screen.
        // This handles z-index layers and absolute positioning correctly.
        const x = window.innerWidth / 2;
        const y = window.innerHeight / 2;
        const stack = document.elementsFromPoint(x, y);

        for (const el of stack) {
          // 1. Ignore our own UI and small noisy elements (icons/buttons)
          if (
            el.className &&
            typeof el.className === "string" &&
            el.className.includes("qs-")
          )
            continue;
          if (el.clientWidth < 100 || el.clientHeight < 100) continue;

          // 2. Check Background Color
          const style = window.getComputedStyle(el);
          const bgLuma = this._parseLuma(style.backgroundColor);

          // If we find a SOLID, OPAQUE background on a large element, we trust it.
          if (bgLuma !== null) {
            if (bgLuma < 100) return true; // Dark Background found
            if (bgLuma > 200) return false; // Light Background found
            // If it's mid-grey or semi-transparent, we continue down the stack
          }
        }

        // ── LEVEL 3: TEXT CONTRAST FALLBACK ──
        // If we are here, the background is effectively transparent (or an Image/Canvas).
        // We look at the Text Color of the topmost content element.
        for (const el of stack) {
          // Find the first element with actual text content
          if (el.innerText && el.innerText.trim().length > 0) {
            const textLuma = this._parseLuma(window.getComputedStyle(el).color);
            if (textLuma !== null) {
              if (textLuma > 200) return true; // White Text = Dark Mode
              if (textLuma < 80) return false; // Black Text = Light Mode
            }
            break; // We only care about the top layer's text
          }
        }

        // ── LEVEL 4: SYSTEM DEFAULT ──
        return (
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches
        );
      } catch (e) {
        return false;
      }
    },

    // Refined Luma Parser (Stricter transparency)
    _parseLuma: function (colorStr) {
      if (!colorStr) return null;

      // Handle "transparent" keyword
      if (colorStr === "transparent" || colorStr === "rgba(0, 0, 0, 0)")
        return null;

      // Handle simple Hex
      if (colorStr.startsWith("#")) {
        const hex = colorStr.slice(1);
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return 0.299 * r + 0.587 * g + 0.114 * b;
      }

      // Handle rgb/rgba
      const match = colorStr.match(/(\d+(\.\d+)?)/g);
      if (!match || match.length < 3) return null;

      const r = parseFloat(match[0]);
      const g = parseFloat(match[1]);
      const b = parseFloat(match[2]);
      const a = match.length > 3 ? parseFloat(match[3]) : 1;

      if (a < 0.1) return null; // Treat low opacity as no color

      return 0.299 * r + 0.587 * g + 0.114 * b;
    },
  };
}
