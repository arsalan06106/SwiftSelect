if (!window.SwiftSelect) window.SwiftSelect = {};

if (!window.SwiftSelect.ui) {
  window.SwiftSelect.ui = {
    overlayHost: null,
    statusHost: null,
    guideHost: null,
    highlighterHost: null,
    overlay: null,
    box: null,
    statusEl: null,
    guideEl: null,
    highlighterEl: null,
    hudEl: null,
    curtains: [],
    overlayShadow: null,

    // Track timers
    hideStatusTimer: null,
    currentStatus: null,

    // Shared CSS Sheet
    qsSheet: null,
    stylePromise: null,
    safetyListenersAdded: false,

    loadStyles: async function () {
      if (this.stylePromise) return this.stylePromise;
      this.stylePromise = (async () => {
        try {
          const url = chrome.runtime.getURL("styles.css");
          const response = await fetch(url);
          const cssText = await response.text();
          this.qsSheet = new CSSStyleSheet();
          await this.qsSheet.replace(cssText);
        } catch (err) {
          console.error("SwiftSelect: Failed to load styles.css", err);
          // Fallback or handle error
        }
      })();
      return this.stylePromise;
    },

    addSafetyListeners: function () {
      if (this.safetyListenersAdded) return;
      this.safetyListenersAdded = true;
      const cleanup = () => this.removeCrosshairCursor();
      window.addEventListener("beforeunload", cleanup);
      window.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") cleanup();
      });
    },

    // Animation frames
    updateFrameId: null,
    isUpdating: false,
    lastHudText: "",
    pendingRect: null,

    makeShadowOverlay: function (tag, className, innerHTML = "") {
      const host = document.createElement("div");
      host.style.position = "fixed";
      host.style.zIndex = "2147483647";
      host.style.pointerEvents = "none";
      host.style.inset = "0";
      document.body.appendChild(host);

      const shadow = host.attachShadow({ mode: "open" });
      const el = document.createElement(tag);
      el.className = className;
      if (innerHTML) el.innerHTML = innerHTML;
      shadow.appendChild(el);

      // Optimize: Use adoptedStyleSheets
      (async () => {
        await this.loadStyles();
        if (this.qsSheet) {
          shadow.adoptedStyleSheets = [this.qsSheet];
        } else if (
          window.SwiftSelect.styles &&
          window.SwiftSelect.styles.SHADOW_CSS
        ) {
          // Absolute fallback if fetch fails but styles.js is still there (temporary)
          const fallbackSheet = new CSSStyleSheet();
          fallbackSheet.replaceSync(window.SwiftSelect.styles.SHADOW_CSS);
          shadow.adoptedStyleSheets = [fallbackSheet];
        }
      })();

      return { host, el, shadow };
    },

    createSvg: function (viewBox, pathData, className = "") {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", viewBox);
      if (className) svg.setAttribute("class", className);

      const parts = Array.isArray(pathData) ? pathData : [pathData];
      parts.forEach((p) => {
        const path = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path",
        );
        for (const [attr, val] of Object.entries(p)) {
          path.setAttribute(attr, val);
        }
        svg.appendChild(path);
      });
      return svg;
    },

    setCrosshairCursor: function () {
      document.body.style.cursor = "crosshair";
      document.documentElement.style.cursor = "crosshair";
    },

    removeCrosshairCursor: function () {
      document.body.style.cursor = "";
      document.documentElement.style.cursor = "";
    },

    ensureUi: function () {
      this.setCrosshairCursor();

      if (!this.overlayHost) {
        const { host, el, shadow } = this.makeShadowOverlay("div", "qs-ovl");
        this.overlayHost = host;
        this.overlay = el;
        this.overlayShadow = shadow;
        this.overlayHost.style.pointerEvents = "auto";

        // Create 1 Curtain for Spotlight Blur inside the SAME shadow DOM
        this.curtains = [];
        const c = document.createElement("div");
        c.className = "qs-curtain";
        this.overlay.appendChild(c);
        this.curtains.push(c);

        // Create Selection Box inside the SAME shadow DOM
        this.box = document.createElement("div");
        this.box.className = "qs-box";
        this.overlay.appendChild(this.box);

        // Create HUD inside the SAME shadow DOM
        this.hudEl = document.createElement("div");
        this.hudEl.className = "qs-hud";
        this.box.style.display = "none";
        if (this.hudEl) this.hudEl.style.display = "none";
        this.overlay.appendChild(this.hudEl);
      }
      if (!this.statusHost) {
        const { host, el } = this.makeShadowOverlay("div", "qs-status");
        this.statusHost = host;
        this.statusEl = el;
        this.statusHost.style.display = "none";
      }

      if (!this.highlighterHost) {
        const { host, el } = this.makeShadowOverlay("div", "qs-highlighter");
        this.highlighterHost = host;
        this.highlighterEl = el;
      }

      // Apply Theme to HUD immediately
      if (this.hudEl) {
        if (window.SwiftSelect.theme.shouldUseDarkMode()) {
          this.hudEl.classList.add("qs-theme-dark");
        } else {
          this.hudEl.classList.remove("qs-theme-dark");
        }
      }

      if (!this.guideHost) {
        const { host, el, shadow } = this.makeShadowOverlay("div", "qs-guide");
        this.guideHost = host;
        this.guideEl = el;
        this.guideShadow = shadow;

        this.guideShadow = shadow;

        const surface = document.createElement("div");
        surface.className = "qs-glass-surface";
        this.guideEl.appendChild(surface);

        const buttonsSet = document.createElement("div");
        buttonsSet.className = "qs-guide-buttons";
        this.guideEl.appendChild(buttonsSet);

        const segmented = document.createElement("div");
        segmented.className = "qs-segmented";
        buttonsSet.appendChild(segmented);

        // 1. Visible Area
        const visibleBtn = document.createElement("button");
        visibleBtn.className = "qs-guide-btn";
        visibleBtn.dataset.action = "capture-visible";
        visibleBtn.dataset.tooltip = "Copy Visible";

        const eyeSvg = this.createSvg("0 0 24 24", [
          {
            class: "eye-lid",
            d: "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z",
          },
          {
            class: "eye-pupil",
            d: "M 12 12 m -3 0 a 3 3 0 1 0 6 0 a 3 3 0 1 0 -6 0",
            isCircle: true,
          }, // Mocking circle with path for helper simplicity or use specialized one
        ]);
        // Special case for circle in eyeSvg
        const eyePupil = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "circle",
        );
        eyePupil.setAttribute("class", "eye-pupil");
        eyePupil.setAttribute("cx", "12");
        eyePupil.setAttribute("cy", "12");
        eyePupil.setAttribute("r", "3");
        eyeSvg.querySelector(".eye-pupil")?.remove();
        eyeSvg.appendChild(eyePupil);

        const visibleSpan = document.createElement("span");
        visibleSpan.textContent = "Visible Area";
        visibleBtn.appendChild(eyeSvg);
        visibleBtn.appendChild(visibleSpan);
        segmented.appendChild(visibleBtn);

        // 2. Download (Save & Copy)
        const downloadBtn = document.createElement("button");
        downloadBtn.className = "qs-guide-btn";
        downloadBtn.dataset.action = "capture-download";
        downloadBtn.dataset.tooltip = "Save & Copy";
        const dlSvg = this.createSvg("0 0 24 24", [
          { class: "dl-arrow", d: "M19 9h-4V3H9v6H5l7 7 7-7z" },
          { class: "dl-bar", d: "M5 18v2h14v-2H5z" },
        ]);
        downloadBtn.appendChild(dlSvg);
        segmented.appendChild(downloadBtn);

        // 3. Full Page
        const fullBtn = document.createElement("button");
        fullBtn.className = "qs-guide-btn";
        fullBtn.dataset.action = "capture-full";
        fullBtn.dataset.tooltip = "Save Full Page";
        const fpSvg = this.createSvg("0 -960 960 960", [
          {
            class: "fp-corner fp-tl",
            d: "M67-743.87V-933h189.13v73H140v116.13H67Z",
          },
          {
            class: "fp-corner fp-tr",
            d: "M893-743.87V-933H703.87v73H820v116.13h73Z",
          },
          {
            class: "fp-corner fp-br",
            d: "M893-216.13V-27H703.87v-73H820v-116.13h73Z",
          },
          {
            class: "fp-corner fp-bl",
            d: "M67-216.13V-27H256.13v-73H140v-116.13H67Z",
          },
          {
            class: "fp-box",
            d: "M273-233h414v-494H273v494Zm0 79.22q-31.38 0-55.3-23.92-23.92-23.92-23.92-55.3v-494q0-31.38 23.92-55.3 23.92-23.92 55.3-23.92h414q31.38 0 55.3 23.92 23.92 23.92 23.92 55.3v494q0 31.38-23.92 55.3-23.92 23.92-55.3 23.92H273Z",
          },
          {
            class: "fp-inner-lines",
            d: "M367.74-567.74h225.09v-65.09H367.74v65.09Zm0 120h225.09v-65.09H367.74v65.09Zm0 120h225.09v-65.09H367.74v65.09Z",
          },
        ]);
        const fpSpan = document.createElement("span");
        fpSpan.textContent = "Full Page";
        fullBtn.appendChild(fpSvg);
        fullBtn.appendChild(fpSpan);
        buttonsSet.appendChild(fullBtn);

        // 4. Theme Toggle
        const themeBtn = document.createElement("button");
        themeBtn.className = "qs-guide-btn qs-theme-toggle";
        themeBtn.dataset.action = "toggle-theme";
        themeBtn.dataset.tooltip = "Toggle Theme";
        const moonSvg = this.createSvg(
          "0 0 24 24",
          {
            d: "M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-5.4-5.4 5.4 5.4 0 0 1 1.76-3.79A8.93 8.93 0 0 0 12 3Z",
          },
          "qs-icon-moon",
        );
        const sunSvg = this.createSvg(
          "-2 -2 24 24",
          {
            d: "M10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 2a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-15a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0V1a1 1 0 0 1 1-1zm0 16a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0v-2a1 1 0 0 1 1-1zM1 9h2a1 1 0 1 1 0 2H1a1 1 0 0 1 0-2zm16 0h2a1 1 0 0 1 0 2h-2a1 1 0 0 1 0-2zm.071-6.071a1 1 0 0 1 0 1.414l-1.414 1.414a1 1 0 1 1-1.414-1.414l1.414-1.414a1 1 0 0 1 1.414 0zM5.757 14.243a1 1 0 0 1 0 1.414L4.343 17.07a1 1 0 1 1-1.414-1.414l1.414-1.414a1 1 0 0 1 1.414 0zM4.343 2.929l1.414 1.414a1 1 0 0 1-1.414 1.414L2.93 4.343A1 1 0 0 1 4.343 2.93zm11.314 11.314l1.414 1.414a1 1 0 0 1-1.414 1.414l-1.414-1.414a1 1 0 1 1 1.414-1.414z",
          },
          "qs-icon-sun",
        );
        themeBtn.appendChild(moonSvg);
        themeBtn.appendChild(sunSvg);
        buttonsSet.appendChild(themeBtn);

        // Add listeners directly to the elements we just created
        visibleBtn.onclick = () =>
          window.SwiftSelect.capture.handleCaptureVisible();

        downloadBtn.onclick = () =>
          window.SwiftSelect.capture.handleCaptureAndDownload();

        fullBtn.onclick = () =>
          window.SwiftSelect.capture.handleCaptureFullPage();

        themeBtn.onclick = () => window.SwiftSelect.theme.handleThemeToggle();
      }

      // Ensure guide is visible AND RESET ANIMATION CLASS
      if (this.guideHost) {
        // Apply initial theme BEFORE showing to prevent flash
        window.SwiftSelect.theme.applyTheme(
          window.SwiftSelect.theme.currentUserTheme,
        );

        this.guideHost.style.display = "flex";
        this.guideEl.classList.remove("qs-hiding");

        // Force Reflow
        void this.guideEl.offsetWidth;
      }
    },

    setSelecting: function (isSelecting) {
      if (!this.overlay) return;
      if (isSelecting) {
        this.overlay.classList.add("qs-selecting");
      } else {
        this.overlay.classList.remove("qs-selecting");
        this.curtains.forEach((c) => (c.style.display = "none"));
        if (this.box) this.box.style.display = "none";
        if (this.hudEl) this.hudEl.style.display = "none";
      }
    },

    setStatus: function (msg, timeout = 1500, type = "info", noAnim = false) {
      if (!msg || !msg.trim()) return;

      if (!this.statusHost || !this.statusEl) {
        const { host, el } = this.makeShadowOverlay("div", "qs-status");
        this.statusHost = host;
        this.statusEl = el;
      }

      if (this.hideStatusTimer) clearTimeout(this.hideStatusTimer);

      // Reset classes
      this.statusEl.className = "qs-status";
      this.statusEl.classList.remove("qs-hiding");
      if (noAnim) this.statusEl.classList.add("no-anim");

      while (this.statusEl.firstChild)
        this.statusEl.removeChild(this.statusEl.firstChild);
      const iconEl = document.createElement("div");
      iconEl.className = "qs-status-icon";

      // Select Icon based on Type/Message
      let iconSvg = null;
      let hasCustomStroke = false;
      // Info / Default
      if (type === "info" || (!type && !msg.includes("Copied"))) {
        iconSvg = this.createSvg("0 0 24 24", {
          d: "M21.17,15.4l-5.91-9.85C14.48,4.25,13.3,3.51,12,3.51S9.52,4.25,8.74,5.54L2.83,15.4c-0.44,0.73-0.66,1.49-0.66,2.21c0,0.57,0.14,1.13,0.42,1.62C3.23,20.35,4.47,21,6,21h12c1.53,0,2.77-0.65,3.41-1.77c0.28-0.49,0.42-1.02,0.42-1.58C21.84,16.91,21.62,16.14,21.17,15.4z M12,8.45c0.85,0,1.55,0.7,1.55,1.55c0,0.85-0.69,1.55-1.55,1.55c-0.85,0-1.55-0.7-1.55-1.55C10.45,9.14,11.14,8.45,12,8.45z M13.69,16.91c-0.03,0.04-0.8,0.92-2.07,0.92l-0.15,0c-0.51-0.03-0.93-0.25-1.18-0.63c-0.31-0.47-0.36-1.11-0.12-1.82l0.41-1.22c0.23-0.68,0.01-0.79-0.11-0.85l-0.14-0.02c-0.25,0-0.6,0.15-0.71,0.21c-0.1,0.05-0.23,0.03-0.31-0.07c-0.07-0.1-0.07-0.23,0.01-0.32c0.03-0.04,0.87-0.99,2.22-0.91c0.51,0.03,0.93,0.25,1.18,0.63c0.32,0.47,0.36,1.11,0.12,1.83l-0.41,1.22c-0.23,0.68-0.01-0.79,0.11,0.85l0.14,0.02c0.25,0,0.6-0.15,0.71-0.2c0.11-0.06,0.23-0.03,0.31,0.07C13.77,16.69,13.77,16.82,13.69,16.91z",
        });
      }

      if (type === "error") {
        iconSvg = this.createSvg("0 0 51.976 51.976", {
          d: "M44.373,7.603c-10.137-10.137-26.632-10.138-36.77,0c-10.138,10.138-10.137,26.632,0,36.77s26.632,10.138,36.77,0C54.51,34.235,54.51,17.74,44.373,7.603z M36.241,36.241c-0.781,0.781-2.047,0.781-2.828,0l-7.425-7.425l-7.778,7.778c-0.781,0.781-2.047,0.781-2.828,0c-0.781-0.781-0.781-2.047,0-2.828l7.778-7.778l-7.425-7.425c-0.781-0.781-0.781-2.048,0-2.828c0.781-0.781,2.047-0.781,2.828,0l7.425,7.425l7.071-7.071c0.781-0.781,2.047-0.781,2.828,0c0.781,0.781,0.781,2.047,0,2.828l-7.071,7.071l7.425,7.425C37.022,34.194,37.022,35.46,36.241,36.241z",
        });
      } else if (type === "success" || type === "saved") {
        iconSvg = this.createSvg("0 0 16 16", {
          d: "m1.75 9.75 2.5 2.5m3.5-4 2.5-2.5m-4.5 4 2.5 2.5 6-6.5",
        });
        iconSvg.setAttribute("fill", "none");
        iconSvg.setAttribute("stroke", "var(--qs-icon-fill)");
        iconSvg.setAttribute("stroke-linecap", "round");
        iconSvg.setAttribute("stroke-linejoin", "round");
        iconSvg.setAttribute("stroke-width", "1.5");
        hasCustomStroke = true;
      }

      const svgEl = iconSvg;
      if (svgEl) {
        if (hasCustomStroke) {
          svgEl.style.width = "28px";
          svgEl.style.height = "28px";
          svgEl.style.paddingBottom = "2px";
        } else {
          svgEl.style.width = "100%";
          svgEl.style.height = "100%";

          if (iconSvg.getAttribute("stroke") && !iconSvg.getAttribute("fill")) {
            svgEl.style.fill = "none";
            svgEl.style.stroke = "currentColor";
          } else {
            svgEl.style.fill = "currentColor";
          }
        }
        iconEl.appendChild(svgEl);
      }

      this.statusEl.appendChild(iconEl);

      const textSpan = document.createElement("span");
      textSpan.textContent = msg;
      this.statusEl.appendChild(textSpan);

      if (type === "success") {
        this.statusEl.classList.add("qs-success");
        const saveBtn = document.createElement("button");
        saveBtn.className = "qs-save-btn";
        const dlIcon = this.createSvg("0 0 24 24", [
          { class: "dl-arrow", d: "M19 9h-4V3H9v6H5l7 7 7-7z" },
          { class: "dl-bar", d: "M5 18v2h14v-2H5z" },
        ]);
        saveBtn.appendChild(dlIcon);
        const downSvg = dlIcon;
        if (downSvg) {
          downSvg.style.width = "20px";
          downSvg.style.height = "20px";
          downSvg.style.fill = "currentColor";
        }

        saveBtn.onclick = () => window.SwiftSelect.capture.handleSaveAction();
        this.statusEl.appendChild(saveBtn);
        timeout = 5000;
      } else if (type === "saved") {
        this.statusEl.classList.add("qs-saved");
        timeout = 2500;
      } else if (type === "error") {
        this.statusEl.classList.add("qs-error");
        timeout = 2500;
      }

      // Apply theme using central logic BEFORE display
      window.SwiftSelect.theme.applyTheme(
        window.SwiftSelect.theme.currentUserTheme,
      );

      this.statusHost.style.display = "";
      this.statusEl.style.display = "flex";

      this.currentStatus = type;

      if (timeout > 0) {
        this.hideStatusTimer = setTimeout(() => {
          this.statusEl.classList.add("qs-hiding");
          setTimeout(() => {
            if (this.statusEl.classList.contains("qs-hiding")) {
              this.statusEl.style.display = "none";
              this.statusHost.style.display = "none";
              this.statusEl.classList.remove("qs-hiding");
              this.currentStatus = null;
            }
          }, 300);
        }, timeout);
      }
    },

    updateSelection: function (rect) {
      if (!this.overlay || !this.box || !this.hudEl) return;

      this.pendingRect = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      };

      if (this.isUpdating) return;
      this.isUpdating = true;

      this.updateFrameId = requestAnimationFrame(() => {
        this.isUpdating = false;

        // Always render the ABSOLUTE LATEST coordinates
        const r = this.pendingRect;
        // Guard: Check if UI was cleaned up while frame was pending
        if (!r || !this.box || !this.hudEl) return;

        const x1 = r.left;
        const y1 = r.top;
        const x2 = r.left + r.width;
        const y2 = r.top + r.height;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // Flash Prevention: Only show UI if drag is meaningful (> 2px)
        const isVisible = r.width > 2 || r.height > 2;
        if (!isVisible) {
          this.box.style.display = "none";
          this.hudEl.style.display = "none";
          if (this.curtains) {
            this.curtains.forEach((c) => (c.style.display = "none"));
          }
          return;
        }

        // 1. Box Position (Atomic updates are faster than cssText)
        this.box.style.display = "block";
        this.box.style.width = r.width + "px";
        this.box.style.height = r.height + "px";
        this.box.style.transform = `translate3d(${x1}px, ${y1}px, 0)`;

        // 2. HUD Position (Atomic)
        const gap = 10;
        const hudHeight = 24;
        let hudTop = y1 - hudHeight - gap;
        let hudLeft = x1;

        // Flip to below if no space above
        if (hudTop < 10) {
          hudTop = y2 + gap;
        }

        const dpr = window.devicePixelRatio || 1;
        const w = Math.round(r.width * dpr);
        const h = Math.round(r.height * dpr);
        const hudText = `${w} x ${h}`;
        if (this.lastHudText !== hudText) {
          this.hudEl.textContent = hudText;
          this.lastHudText = hudText;
        }
        this.hudEl.style.display = "block";
        this.hudEl.style.transform = `translate3d(${hudLeft}px, ${hudTop}px, 0)`;

        // 3. Curtain Spotlight (Massive Border Strategy)
        if (this.curtains && this.curtains.length === 1) {
          const curtain = this.curtains[0];

          if (r.width < 2 && r.height < 2) {
            curtain.style.display = "none";
          } else {
            curtain.style.display = "block";
            curtain.style.width = r.width + "px";
            curtain.style.height = r.height + "px";
            // Offset by the massive 4000px border defined in CSS
            curtain.style.transform = `translate3d(${x1 - 4000}px, ${y1 - 4000}px, 0)`;
          }
        }
      });
    },

    updateHud: function () {
      /* Legacy - Redirected */
    },
    updateBox: function () {
      /* Legacy - Redirected */
    },

    triggerFlash: function (targetRect = null) {
      const { host, el } = this.makeShadowOverlay("div", "qs-flash");

      if (!window.SwiftSelect.theme.isPageDark()) {
        el.classList.add("qs-flash-inverse");
      }

      if (targetRect) {
        el.style.left = targetRect.left + "px";
        el.style.top = targetRect.top + "px";
        el.style.width = targetRect.width + "px";
        el.style.height = targetRect.height + "px";
        el.style.position = "absolute";
        el.style.borderRadius = "6px";
      } else {
        el.style.inset = "0";
        el.style.borderRadius = "0";
      }

      setTimeout(() => {
        if (host && host.parentNode) host.parentNode.removeChild(host);
      }, 450);
    },

    setButtonLoading: function (action, loading) {
      if (!this.guideShadow) return;
      const btn = this.guideShadow.querySelector(`[data-action="${action}"]`);
      if (btn) {
        if (loading) {
          btn.classList.add("qs-loading");
          btn.disabled = true;
        } else {
          btn.classList.remove("qs-loading");
          btn.disabled = false;
        }
      }
    },

    hideUiForCapture: async function () {
      if (this.guideHost) this.guideHost.style.display = "none";
      if (this.statusHost) this.statusHost.style.display = "none";
      if (this.overlayHost) this.overlayHost.style.display = "none";
      if (this.highlighterHost) this.highlighterHost.style.display = "none";
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => setTimeout(r, 100));
    },

    // Cleanup UI elements ONLY
    cleanup: function () {
      this.removeCrosshairCursor();

      // Cancel any pending animation frame
      if (this.updateFrameId) {
        cancelAnimationFrame(this.updateFrameId);
        this.updateFrameId = null;
      }
      this.isUpdating = false;
      this.pendingRect = null;
      this.addSafetyListeners();

      if (this.overlay) {
        this.overlay.classList.remove("qs-selecting");
        this.overlay.style.clipPath = "";
      }

      if (this.overlayHost && this.overlayHost.parentNode)
        this.overlayHost.parentNode.removeChild(this.overlayHost);
      this.overlayHost = null;
      this.overlay = null;
      this.box = null;
      this.hudEl = null;

      this.curtains = [];

      if (this.highlighterHost && this.highlighterHost.parentNode)
        this.highlighterHost.parentNode.removeChild(this.highlighterHost);
      this.highlighterHost = null;
      this.highlighterEl = null;

      if (this.guideEl && this.guideHost) {
        this.guideEl.classList.add("qs-hiding");
        setTimeout(() => {
          if (this.guideHost && this.guideHost.parentNode)
            this.guideHost.parentNode.removeChild(this.guideHost);
          this.guideHost = null;
          this.guideEl = null;
          this.guideShadow = null;
        }, 300);
      } else {
        if (this.guideHost && this.guideHost.parentNode)
          this.guideHost.parentNode.removeChild(this.guideHost);
        this.guideHost = null;
        this.guideEl = null;
      }
    },

    updateBadge: function (text, color = "#ff6a61") {
      chrome.runtime.sendMessage({ type: "update-badge", text, color });
    },
  };
}
