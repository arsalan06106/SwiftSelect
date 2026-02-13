if (!window.SwiftSelect) window.SwiftSelect = {};

if (!window.SwiftSelect.ui) {
  window.SwiftSelect.ui = {
    overlayHost: null,
    boxHost: null,
    statusHost: null,
    guideHost: null,
    highlighterHost: null,
    hudHost: null,
    overlay: null,
    box: null,
    statusEl: null,
    guideEl: null,
    guideShadow: null,
    highlighterEl: null,
    hudEl: null,

    // Track timers
    hideStatusTimer: null,
    currentStatus: null,

    // Shared CSS Sheet
    qsSheet: null,

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
      if (!this.qsSheet) {
        this.qsSheet = new CSSStyleSheet();
        this.qsSheet.replaceSync(window.SwiftSelect.styles.SHADOW_CSS);
      }
      shadow.adoptedStyleSheets = [this.qsSheet];

      return { host, el, shadow };
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
        const { host, el } = this.makeShadowOverlay("div", "qs-ovl");
        this.overlayHost = host;
        this.overlay = el;
        this.overlayHost.style.pointerEvents = "auto";
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

      if (!this.hudHost) {
        const { host, el } = this.makeShadowOverlay("div", "qs-hud");
        this.hudHost = host;
        this.hudEl = el;
        this.hudEl.style.borderBottomRightRadius = "6px";
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

        this.guideEl.innerHTML = `
        <div class="qs-guide-buttons">
          <div class="qs-segmented">
            <button class="qs-guide-btn" data-action="capture-visible" data-tooltip="Copy Visible">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path class="eye-lid" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                <circle class="eye-pupil" cx="12" cy="12" r="3"/>
              </svg>
              <span>Visible Area</span>
            </button>
            <button class="qs-guide-btn" data-action="capture-download" data-tooltip="Save & Copy">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path class="dl-arrow" d="M19 9h-4V3H9v6H5l7 7 7-7z"/>
                <path class="dl-bar" d="M5 18v2h14v-2H5z"/>
              </svg>
            </button>
          </div>
          <button class="qs-guide-btn" data-action="capture-full" data-tooltip="Save Full Page">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
              <path class="fp-corner fp-tl" d="M67-743.87V-933h189.13v73H140v116.13H67Z"/>
              <path class="fp-corner fp-tr" d="M893-743.87V-933H703.87v73H820v116.13h73Z"/>
              <path class="fp-corner fp-br" d="M893-216.13V-27H703.87v-73H820v-116.13h73Z"/>
              <path class="fp-corner fp-bl" d="M67-216.13V-27H256.13v-73H140v-116.13H67Z"/>
              <path class="fp-box" d="M273-233h414v-494H273v494Zm0 79.22q-31.38 0-55.3-23.92-23.92-23.92-23.92-55.3v-494q0-31.38 23.92-55.3 23.92-23.92 55.3-23.92h414q31.38 0 55.3 23.92 23.92 23.92 23.92 55.3v494q0 31.38-23.92 55.3-23.92 23.92-55.3 23.92H273Z"/>
              <path class="fp-inner-lines" d="M367.74-567.74h225.09v-65.09H367.74v65.09Zm0 120h225.09v-65.09H367.74v65.09Zm0 120h225.09v-65.09H367.74v65.09Z"/>
            </svg>
            <span>Full Page</span>
          </button>
          <button class="qs-guide-btn qs-theme-toggle" data-action="toggle-theme" data-tooltip="Toggle Theme">
            <svg class="qs-icon-moon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-5.4-5.4 5.4 5.4 0 0 1 1.76-3.79A8.93 8.93 0 0 0 12 3Z"/>
            </svg>
            <svg class="qs-icon-sun" xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 24 24">
              <path d="M10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 2a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-15a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0V1a1 1 0 0 1 1-1zm0 16a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0v-2a1 1 0 0 1 1-1zM1 9h2a1 1 0 1 1 0 2H1a1 1 0 0 1 0-2zm16 0h2a1 1 0 0 1 0 2h-2a1 1 0 0 1 0-2zm.071-6.071a1 1 0 0 1 0 1.414l-1.414 1.414a1 1 0 1 1-1.414-1.414l1.414-1.414a1 1 0 0 1 1.414 0zM5.757 14.243a1 1 0 0 1 0 1.414L4.343 17.07a1 1 0 1 1-1.414-1.414l1.414-1.414a1 1 0 0 1 1.414 0zM4.343 2.929l1.414 1.414a1 1 0 0 1-1.414 1.414L2.93 4.343A1 1 0 0 1 4.343 2.93zm11.314 11.314l1.414 1.414a1 1 0 0 1-1.414 1.414l-1.414-1.414a1 1 0 1 1 1.414-1.414z"/>
            </svg>
          </button>
        </div>
      `;

        // Add listeners using window.SwiftSelect.capture
        const visibleBtn = this.guideShadow.querySelector(
          '[data-action="capture-visible"]',
        );
        visibleBtn.onclick = () =>
          window.SwiftSelect.capture.handleCaptureVisible();

        const downloadBtn = this.guideShadow.querySelector(
          '[data-action="capture-download"]',
        );
        downloadBtn.onclick = () =>
          window.SwiftSelect.capture.handleCaptureAndDownload();

        const fullBtn = this.guideShadow.querySelector(
          '[data-action="capture-full"]',
        );
        fullBtn.onclick = () =>
          window.SwiftSelect.capture.handleCaptureFullPage();

        const themeBtn = this.guideShadow.querySelector(
          '[data-action="toggle-theme"]',
        );
        themeBtn.onclick = () => window.SwiftSelect.theme.handleThemeToggle();
      }

      // Ensure guide is visible AND RESET ANIMATION CLASS
      if (this.guideHost) {
        this.guideHost.style.display = "flex";
        this.guideEl.classList.remove("qs-hiding");

        // Apply initial theme
        window.SwiftSelect.theme.applyTheme(
          window.SwiftSelect.theme.currentUserTheme,
        );

        // Force Reflow
        void this.guideEl.offsetWidth;
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

      this.statusEl.innerHTML = "";
      const iconEl = document.createElement("div");
      iconEl.className = "qs-status-icon";

      // Select Icon based on Type/Message
      let iconSvg = "";
      // Info / Default
      iconSvg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21.17,15.4l-5.91-9.85C14.48,4.25,13.3,3.51,12,3.51S9.52,4.25,8.74,5.54L2.83,15.4c-0.44,0.73-0.66,1.49-0.66,2.21c0,0.57,0.14,1.13,0.42,1.62C3.23,20.35,4.47,21,6,21h12c1.53,0,2.77-0.65,3.41-1.77c0.28-0.49,0.42-1.02,0.42-1.58C21.84,16.91,21.62,16.14,21.17,15.4z M12,8.45c0.85,0,1.55,0.7,1.55,1.55c0,0.85-0.69,1.55-1.55,1.55c-0.85,0-1.55-0.7-1.55-1.55C10.45,9.14,11.14,8.45,12,8.45z M13.69,16.91c-0.03,0.04-0.8,0.92-2.07,0.92l-0.15,0c-0.51-0.03-0.93-0.25-1.18-0.63c-0.31-0.47-0.36-1.11-0.12-1.82l0.41-1.22c0.23-0.68,0.01-0.79-0.11-0.85l-0.14-0.02c-0.25,0-0.6,0.15-0.71,0.21c-0.1,0.05-0.23,0.03-0.31-0.07c-0.07-0.1-0.07-0.23,0.01-0.32c0.03-0.04,0.87-0.99,2.22-0.91c0.51,0.03,0.93,0.25,1.18,0.63c0.32,0.47,0.36,1.11,0.12,1.83l-0.41,1.22c-0.23,0.68-0.01,0.79,0.11,0.85l0.14,0.02c0.25,0,0.6-0.15,0.71-0.2c0.11-0.06,0.23-0.03,0.31,0.07C13.77,16.69,13.77,16.82,13.69,16.91z"/></svg>';

      if (type === "error") {
        iconSvg =
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 51.976 51.976"><path d="M44.373,7.603c-10.137-10.137-26.632-10.138-36.77,0c-10.138,10.138-10.137,26.632,0,36.77s26.632,10.138,36.77,0C54.51,34.235,54.51,17.74,44.373,7.603z M36.241,36.241c-0.781,0.781-2.047,0.781-2.828,0l-7.425-7.425l-7.778,7.778c-0.781,0.781-2.047,0.781-2.828,0c-0.781-0.781-0.781-2.047,0-2.828l7.778-7.778l-7.425-7.425c-0.781-0.781-0.781-2.048,0-2.828c0.781-0.781,2.047-0.781,2.828,0l7.425,7.425l7.071-7.071c0.781-0.781,2.047-0.781,2.828,0c0.781,0.781,0.781,2.047,0,2.828l-7.071,7.071l7.425,7.425C37.022,34.194,37.022,35.46,36.241,36.241z"/></svg>';
      } else if (type === "success" || type === "saved") {
        // Tick SVG
        iconSvg =
          '<svg width="100%" height="100%" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" version="1.1" fill="none" stroke="var(--qs-icon-fill)" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="m1.75 9.75 2.5 2.5m3.5-4 2.5-2.5m-4.5 4 2.5 2.5 6-6.5"/></svg>';
      }

      iconEl.innerHTML = iconSvg;
      const svgEl = iconEl.querySelector("svg");
      if (svgEl) {
        if (iconSvg.includes("var(--qs-icon-fill)")) {
          svgEl.style.width = "28px";
          svgEl.style.height = "28px";
          svgEl.style.paddingBottom = "2px";
        } else {
          svgEl.style.width = "100%";
          svgEl.style.height = "100%";
        }
        if (!iconSvg.includes("var(--qs-icon-fill")) {
          if (iconSvg.includes("stroke") && !iconSvg.includes("fill")) {
            svgEl.style.fill = "none";
            svgEl.style.stroke = "currentColor";
          } else {
            svgEl.style.fill = "currentColor";
          }
        }
      }

      this.statusEl.appendChild(iconEl);

      const textSpan = document.createElement("span");
      textSpan.textContent = msg;
      this.statusEl.appendChild(textSpan);

      if (type === "success") {
        this.statusEl.classList.add("qs-success");
        const saveBtn = document.createElement("button");
        saveBtn.className = "qs-save-btn";
        saveBtn.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path class="dl-arrow" d="M19 9h-4V3H9v6H5l7 7 7-7z"/><path class="dl-bar" d="M5 18v2h14v-2H5z"/></svg>';
        const downSvg = saveBtn.querySelector("svg");
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

      this.statusHost.style.display = "";
      this.statusEl.style.display = "flex";

      if (window.SwiftSelect.theme.shouldUseDarkMode()) {
        this.statusEl.classList.add("qs-theme-dark");
      } else {
        this.statusEl.classList.remove("qs-theme-dark");
      }
      if (window.SwiftSelect.theme.currentUserTheme === "glass") {
        this.statusEl.classList.add("qs-theme-glass");
      } else {
        this.statusEl.classList.remove("qs-theme-glass");
      }

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

    updateHud: function (rect, x, y) {
      if (!this.hudEl || !this.hudHost) return;

      const gap = 8;
      const hudHeight = 26;
      let top = rect.top + gap;
      let left = rect.left + gap;

      if (rect.width < 100 || rect.height < 40) {
        top = rect.top - hudHeight - gap;
      }

      this.hudEl.style.top = top + "px";
      this.hudEl.style.left = left + "px";
      this.hudEl.style.transform = "";

      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      this.hudEl.textContent = `${w} x ${h}`;
      this.hudEl.style.display = "block";
      this.hudHost.style.display = "block";
    },

    updateBox: function (rect) {
      if (!this.boxHost) {
        const { host, el } = this.makeShadowOverlay("div", "qs-box");
        this.boxHost = host;
        this.box = el;
      }
      if (!this.box) return;
      this.box.style.left = rect.left + "px";
      this.box.style.top = rect.top + "px";
      this.box.style.width = rect.width + "px";
      this.box.style.height = rect.height + "px";
      this.box.style.display = "block";
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
      if (this.boxHost) this.boxHost.style.display = "none";
      if (this.highlighterHost) this.highlighterHost.style.display = "none";
      if (this.hudHost) this.hudHost.style.display = "none";
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => setTimeout(r, 100));
    },

    // Cleanup UI elements ONLY
    cleanup: function () {
      this.removeCrosshairCursor();

      if (this.boxHost && this.boxHost.parentNode)
        this.boxHost.parentNode.removeChild(this.boxHost);
      this.boxHost = null;
      this.box = null;

      if (this.overlayHost && this.overlayHost.parentNode)
        this.overlayHost.parentNode.removeChild(this.overlayHost);
      this.overlayHost = null;
      this.overlay = null;

      if (this.highlighterHost && this.highlighterHost.parentNode)
        this.highlighterHost.parentNode.removeChild(this.highlighterHost);
      this.highlighterHost = null;
      this.highlighterEl = null;

      if (this.hudHost && this.hudHost.parentNode)
        this.hudHost.parentNode.removeChild(this.hudHost);
      this.hudHost = null;
      this.hudEl = null;

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
