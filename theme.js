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
              // Normal behavior after migration: Respect user choice
              this.currentUserTheme = data.userTheme;
              this.applyTheme(this.currentUserTheme);
            } else {
              // Fallback for new users (post-migration logic)
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
            if (this.currentUserTheme === "glass") {
              this.applyTheme("glass");
            }
          });
      }

      // Observer for Site Theme Changes (Class/Style updates)
      const observer = new MutationObserver(() => {
        if (this.currentUserTheme === "glass") {
          // Debounce/Throttle could be added here if needed, but applyTheme is relatively cheap
          this.applyTheme("glass");
        }
      });

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class", "style", "data-theme"],
      });
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ["class", "style", "data-theme"],
      });
    },

    handleThemeToggle: function () {
      if (this.currentUserTheme === "light") {
        this.currentUserTheme = "dark";
      } else if (this.currentUserTheme === "dark") {
        this.currentUserTheme = "glass";
      } else {
        this.currentUserTheme = "light";
      }
      this.applyTheme(this.currentUserTheme);
      chrome.storage.local.set({ userTheme: this.currentUserTheme });
    },

    applyTheme: function (theme) {
      const guideEl = window.SwiftSelect.ui?.guideEl;
      const hudEl = window.SwiftSelect.ui?.hudEl;
      const statusEl = window.SwiftSelect.ui?.statusEl;
      const boxEl = window.SwiftSelect.ui?.box;

      // if (!guideEl) return; // Allow updating status/hud even if guide is missing

      // Reset classes first
      const elements = [guideEl, statusEl, hudEl, boxEl];
      elements.forEach((el) => {
        if (el) {
          el.classList.remove(
            "qs-theme-dark",
            "qs-theme-glass",
            "qs-theme-glass-dark",
            "qs-glass-contrast",
          );
        }
      });

      if (theme === "dark") {
        elements.forEach((el) => {
          if (el) el.classList.add("qs-theme-dark");
        });
      } else if (theme === "glass") {
        // Adaptive Glass: Check Site Theme
        const isDarkSite = this.isPageDark();

        if (isDarkSite) {
          // Glass Dark
          elements.forEach((el) => {
            if (el) el.classList.add("qs-theme-glass", "qs-theme-glass-dark");
          });
        } else {
          // Glass Light
          elements.forEach((el) => {
            if (el) el.classList.add("qs-theme-glass");
          });
        }
      }
      // 'light' is default (no classes added)
    },

    shouldUseDarkMode: function () {
      if (this.currentUserTheme === "dark") return true;
      if (this.currentUserTheme === "glass" && this.isPageDark()) return true;
      return false;
    },

    isPageDark: function () {
      // 1. Check Page Brightness via Computed Style
      try {
        const getBrightness = (el) => {
          if (!el) return null;
          const style = window.getComputedStyle(el);
          const color = style.backgroundColor;
          const rgb = color.match(/\d+/g);
          if (rgb && rgb.length >= 3) {
            const a = rgb.length > 3 ? parseFloat(rgb[3]) : 1;
            if (a < 0.1) return null; // Transparent
            return (
              0.2126 * parseInt(rgb[0]) +
              0.7152 * parseInt(rgb[1]) +
              0.0722 * parseInt(rgb[2])
            );
          }
          return null;
        };

        let luma = getBrightness(document.body);
        if (luma === null) luma = getBrightness(document.documentElement);

        if (luma !== null) {
          return luma < 128; // < 128 is Dark
        }

        // 2. Fallback: Prefers-Color-Scheme
        if (
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches
        ) {
          return true;
        }
      } catch (e) {
        console.error("isPageDark error:", e);
      }
      return false; // Default to Light
    },
  };
}
