if (!window.SwiftSelect) window.SwiftSelect = {};

if (!window.SwiftSelect.events) {
  window.SwiftSelect.events = {
    dragging: false,
    isMoving: false,
    isSpacePressed: false,
    startX: 0,
    startY: 0,
    lastMouseX: 0,
    lastMouseY: 0,
    rect: { left: 0, top: 0, width: 0, height: 0 },
    snapTimer: null,
    highlightedRect: null,
    initialized: false,

    init: function () {
      if (this.initialized) return;
      this.initialized = true;
      // Bound versions for listeners
      this.onMouseDown = this.onMouseDown.bind(this);
      this.onMouseMove = this.onMouseMove.bind(this);
      this.onMouseUp = this.onMouseUp.bind(this);
      this.onKeyDown = this.onKeyDown.bind(this);
      this.onKeyUp = this.onKeyUp.bind(this);
      this.stopProp = this.stopProp.bind(this);
      this.preventAll = this.preventAll.bind(this);
    },

    onMouseDown: function (e) {
      if (e.button !== 0) return;

      const path = e.composedPath();
      const isOnGuide = path.some(
        (el) =>
          el === window.SwiftSelect.ui.guideHost ||
          (el.classList && el.classList.contains("qs-guide-btn")),
      );

      if (isOnGuide) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      this.dragging = true;
      this.isMoving = false;
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.lastMouseX = this.startX;
      this.lastMouseY = this.startY;
      this.rect.left = this.startX;
      this.rect.top = this.startY;
      this.rect.width = 0;
      this.rect.height = 0;

      if (!window.SwiftSelect.ui.boxHost) {
        const { host, el } = window.SwiftSelect.ui.makeShadowOverlay(
          "div",
          "qs-box",
        );
        window.SwiftSelect.ui.boxHost = host;
        window.SwiftSelect.ui.box = el;
      }
      window.SwiftSelect.ui.updateBox(this.rect);
    },

    onMouseMove: function (e) {
      const x = e.clientX;
      const y = e.clientY;

      if (this.dragging && this.isSpacePressed) {
        if (!this.isMoving) {
          this.isMoving = true;
        }
        const dx = x - this.lastMouseX;
        const dy = y - this.lastMouseY;

        this.rect.left += dx;
        this.rect.top += dy;
        this.startX += dx;
        this.startY += dy;

        this.lastMouseX = x;
        this.lastMouseY = y;

        window.SwiftSelect.ui.updateBox(this.rect);
        window.SwiftSelect.ui.updateHud(this.rect, x, y);
        return;
      } else {
        this.isMoving = false;
        this.lastMouseX = x;
        this.lastMouseY = y;
      }

      if (!this.dragging) {
        if (window.SwiftSelect.ui.box)
          window.SwiftSelect.ui.box.style.display = "none";
        if (this.snapTimer) clearTimeout(this.snapTimer);

        const isSnapping = e.ctrlKey || e.metaKey;
        if (!isSnapping) {
          if (window.SwiftSelect.ui.highlighterEl)
            window.SwiftSelect.ui.highlighterEl.style.display = "none";
          this.highlightedRect = null;
          if (window.SwiftSelect.ui.hudEl)
            window.SwiftSelect.ui.hudEl.style.display = "none";
          return;
        }

        this.snapTimer = setTimeout(() => {
          const elements = document.elementsFromPoint(x, y);
          let bestCandidate = null;

          const isSignificant = (el) => {
            const r = el.getBoundingClientRect();
            const vw = window.innerWidth;
            const vh = window.innerHeight;

            if (r.width < 50 || r.height < 50) return false;
            if (
              r.top < -1 ||
              r.left < -1 ||
              r.bottom > vh + 1 ||
              r.right > vw + 1
            )
              return false;

            const tagName = el.tagName.toUpperCase();
            if (tagName === "BODY" || tagName === "HTML") return false;

            const isMedia = [
              "IMG",
              "VIDEO",
              "SVG",
              "CANVAS",
              "IFRAME",
              "EMBED",
              "OBJECT",
            ].includes(tagName);
            const isInteractive = [
              "INPUT",
              "TEXTAREA",
              "SELECT",
              "BUTTON",
              "A",
            ].includes(tagName);

            if (!isMedia) {
              if (r.width > vw * 0.95 || r.height > vh * 0.95) return false;
            }

            const style = window.getComputedStyle(el);
            if (
              style.display === "none" ||
              style.visibility === "hidden" ||
              style.opacity === "0"
            )
              return false;

            if (isMedia || isInteractive) return true;

            const hasBgImage = style.backgroundImage !== "none";
            const hasBgColor =
              style.backgroundColor !== "rgba(0, 0, 0, 0)" &&
              style.backgroundColor !== "transparent";
            const hasBorder =
              style.borderWidth !== "0px" &&
              style.borderStyle !== "none" &&
              style.borderColor !== "transparent";
            const hasBoxShadow = style.boxShadow !== "none";

            if (r.width > 300 && r.height > 300) {
              if (!hasBorder && !hasBgImage && !hasBoxShadow) {
                const text = el.innerText ? el.innerText.trim() : "";
                if (text.length < 10) return false;
              }
            }

            if (hasBgImage || hasBgColor || hasBorder || hasBoxShadow)
              return true;
            if (el.innerText && el.innerText.trim().length > 0) return true;
            return false;
          };

          for (const candidate of elements) {
            const isExtensionUi =
              candidate === window.SwiftSelect.ui.guideHost ||
              candidate === window.SwiftSelect.ui.statusHost ||
              candidate === window.SwiftSelect.ui.overlayHost ||
              candidate === window.SwiftSelect.ui.boxHost ||
              candidate === window.SwiftSelect.ui.highlighterHost ||
              candidate.closest?.(".qs-guide") ||
              candidate.closest?.(".qs-status") ||
              candidate.classList?.contains("qs-ovl");

            if (!isExtensionUi) {
              if (isSignificant(candidate)) {
                bestCandidate = candidate;
                break;
              }
            }
          }

          if (bestCandidate && window.SwiftSelect.ui.highlighterEl) {
            const r = bestCandidate.getBoundingClientRect();
            window.SwiftSelect.ui.highlighterEl.style.display = "block";
            window.SwiftSelect.ui.highlighterEl.style.left = r.left + "px";
            window.SwiftSelect.ui.highlighterEl.style.top = r.top + "px";
            window.SwiftSelect.ui.highlighterEl.style.width = r.width + "px";
            window.SwiftSelect.ui.highlighterEl.style.height = r.height + "px";
            this.highlightedRect = r;
            window.SwiftSelect.ui.updateHud(r, x, y);
          } else {
            if (window.SwiftSelect.ui.highlighterEl)
              window.SwiftSelect.ui.highlighterEl.style.display = "none";
            this.highlightedRect = null;
            if (window.SwiftSelect.ui.hudEl)
              window.SwiftSelect.ui.hudEl.style.display = "none";
          }
        }, 150);

        return;
      }

      if (window.SwiftSelect.ui.highlighterEl)
        window.SwiftSelect.ui.highlighterEl.style.display = "none";
      this.highlightedRect = null;
      if (window.SwiftSelect.ui.box)
        window.SwiftSelect.ui.box.style.display = "block";

      let width, height;

      if (e.shiftKey) {
        const rawW = Math.abs(x - this.startX);
        const rawH = Math.abs(y - this.startY);
        const size = Math.max(rawW, rawH);
        width = size;
        height = size;
        this.rect.left = x < this.startX ? this.startX - size : this.startX;
        this.rect.top = y < this.startY ? this.startY - size : this.startY;
      } else {
        const left = Math.min(this.startX, x);
        const top = Math.min(this.startY, y);
        width = Math.abs(x - this.startX);
        height = Math.abs(y - this.startY);
        this.rect.left = left;
        this.rect.top = top;
      }

      this.rect.width = width;
      this.rect.height = height;
      window.SwiftSelect.ui.updateBox(this.rect);
      window.SwiftSelect.ui.updateHud(this.rect, x, y);
    },

    onMouseUp: function (e) {
      if (e.button !== 0) return;
      if (!this.dragging) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      this.dragging = false;
      window.SwiftSelect.ui.updateBox(this.rect);

      if (this.rect.width < 5 || this.rect.height < 5) {
        if (this.highlightedRect) {
          window.SwiftSelect.capture
            .captureAndCrop(this.highlightedRect)
            .finally(() => {
              this.cleanup(); // Local cleanup
              window.SwiftSelect.ui.cleanup();
              window.SwiftSelect.ui.triggerFlash(this.highlightedRect);
              window.SwiftSelect.ui.setStatus(
                "Copied to clipboard",
                5000,
                "success",
              );
            });
          return;
        }

        window.SwiftSelect.ui.setStatus("Canceled", 1500);
        this.cleanup();
        window.SwiftSelect.ui.cleanup();
        return;
      }

      window.SwiftSelect.capture.captureAndCrop(this.rect).finally(() => {
        this.cleanup();
        window.SwiftSelect.ui.cleanup();
        window.SwiftSelect.ui.setStatus("Copied to clipboard", 5000, "success");
      });
    },

    onKeyDown: function (e) {
      if (e.key === "Escape") {
        e.preventDefault();
        window.SwiftSelect.ui.setStatus("Canceled", 900);
        this.cleanup();
        window.SwiftSelect.ui.cleanup();
      }
      if (e.code === "Space") {
        this.isSpacePressed = true;
        if (this.dragging) e.preventDefault();
      }
    },

    onKeyUp: function (e) {
      if (e.code === "Space") {
        this.isSpacePressed = false;
        this.isMoving = false;
      }
    },

    stopProp: function (e) {
      const path = e.composedPath();
      if (
        window.SwiftSelect.ui.guideHost &&
        path.includes(window.SwiftSelect.ui.guideHost)
      )
        return;
      if (
        window.SwiftSelect.ui.statusHost &&
        path.includes(window.SwiftSelect.ui.statusHost)
      )
        return;
      e.stopPropagation();
      e.stopImmediatePropagation();
    },

    preventAll: function (e) {
      const path = e.composedPath();
      if (
        window.SwiftSelect.ui.guideHost &&
        path.includes(window.SwiftSelect.ui.guideHost)
      )
        return;
      if (
        window.SwiftSelect.ui.statusHost &&
        path.includes(window.SwiftSelect.ui.statusHost)
      )
        return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    },

    addListeners: function () {
      this.init(); // Ensure methods are bound (idempotent if handled correctly)
      document.addEventListener("mousedown", this.onMouseDown, true);
      document.addEventListener("mousemove", this.onMouseMove, true);
      document.addEventListener("mouseup", this.onMouseUp, true);
      document.addEventListener("keydown", this.onKeyDown, true);
      document.addEventListener("keyup", this.onKeyUp, true);

      document.addEventListener("pointerdown", this.stopProp, true);
      document.addEventListener("pointerup", this.stopProp, true);
      document.addEventListener("click", this.preventAll, true);
      document.addEventListener("dblclick", this.preventAll, true);
      document.addEventListener("contextmenu", this.preventAll, true);
    },

    removeListeners: function () {
      document.removeEventListener("mousedown", this.onMouseDown, true);
      document.removeEventListener("mousemove", this.onMouseMove, true);
      document.removeEventListener("mouseup", this.onMouseUp, true);
      document.removeEventListener("keydown", this.onKeyDown, true);
      document.removeEventListener("keyup", this.onKeyUp, true);

      document.removeEventListener("pointerdown", this.stopProp, true);
      document.removeEventListener("pointerup", this.stopProp, true);
      document.removeEventListener("click", this.preventAll, true);
      document.removeEventListener("dblclick", this.preventAll, true);
      document.removeEventListener("contextmenu", this.preventAll, true);
    },

    cleanup: function () {
      this.dragging = false;
      this.isMoving = false;
      this.removeListeners();
    },
  };
}
