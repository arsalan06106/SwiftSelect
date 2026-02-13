if (!window.SwiftSelect) window.SwiftSelect = {};

if (!window.SwiftSelect.theme) {
  window.SwiftSelect.theme = {
    currentUserTheme: "light", // Default

    init: function () {
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.get("userTheme", (data) => {
          if (data.userTheme) {
            this.currentUserTheme = data.userTheme;
          }
        });
      }
    },

    handleThemeToggle: function () {
      this.currentUserTheme =
        this.currentUserTheme === "light" ? "dark" : "light";
      this.applyTheme(this.currentUserTheme);
      chrome.storage.local.set({ userTheme: this.currentUserTheme });
    },

    applyTheme: function (theme) {
      const guideEl = window.SwiftSelect.ui?.guideEl;
      const hudEl = window.SwiftSelect.ui?.hudEl;

      if (!guideEl) return;
      if (theme === "dark") {
        guideEl.classList.add("qs-theme-dark");
        if (hudEl) hudEl.classList.add("qs-theme-dark");
      } else {
        guideEl.classList.remove("qs-theme-dark");
        if (hudEl) hudEl.classList.remove("qs-theme-dark");
      }
    },

    shouldUseDarkMode: function () {
      return this.currentUserTheme === "dark";
    },

    isPageDark: function () {
      // 1. Check Page Brightness.
      try {
        const bodyColor = window.getComputedStyle(
          document.body,
        ).backgroundColor;
        const rgb = bodyColor.match(/\d+/g);
        if (rgb && rgb.length >= 3) {
          // Luminance formula: 0.2126*R + 0.7152*G + 0.0722*B
          const r = parseInt(rgb[0]);
          const g = parseInt(rgb[1]);
          const b = parseInt(rgb[2]);
          const alpha = rgb.length > 3 ? parseFloat(rgb[3]) : 1;

          // If transparent, assume Light mode (most sites default to white bg)
          // OR check HTML tag? Let's check HTML tag if body is transparent.
          if (alpha < 0.1) {
            // Check html tag
            const htmlColor = window.getComputedStyle(
              document.documentElement,
            ).backgroundColor;
            const rgbH = htmlColor.match(/\d+/g);
            if (rgbH && rgbH.length >= 3) {
              const rH = parseInt(rgbH[0]);
              const gH = parseInt(rgbH[1]);
              const bH = parseInt(rgbH[2]);
              const lumaH = 0.2126 * rH + 0.7152 * gH + 0.0722 * bH;
              return lumaH < 128; // < 128 is Dark
            }
            // if html is also transparent, default to Light?
            // Users usually see White background if everything is transparent.
            return false;
          }

          const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          return luma < 128; // Dark Page -> Use Dark Mode UI (White Flash)
        }
      } catch (e) {
        console.error("isPageDark error:", e);
      }
      return false; // Default to Light Mode (Black Flash)
    },
  };
}
