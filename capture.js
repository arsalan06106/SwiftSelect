if (!window.SwiftSelect) window.SwiftSelect = {};

if (!window.SwiftSelect.capture) {
  window.SwiftSelect.capture = {
    lastBlob: null,

    // Internal Full Page State
    _unrollStyle: null,
    _unrollScrollStyle: null,
    _originalScrollTop: 0,
    _hiddenStickyElements: [],
    _innerScrollContainer: null,
    _innerScrollOriginalStyles: null,
    _abortCapture: false,
    _cursorStyleTag: null,

    loadImage: function (src) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    },

    getSmartFilename: function (type, ext = "png") {
      let title = document.title || "";
      title = title.replace(/[<>:"\/\\|?*\x00-\x1F]/g, " ");
      title = title.trim().replace(/\s+/g, " ");
      if (title.length > 100) title = title.substring(0, 100).trim();

      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[:T]/g, "-");
      return title
        ? `${title} - ${type} - ${timestamp}.${ext}`
        : `${type} - ${timestamp}.${ext}`;
    },

    toggleCursor: function (hide) {
      if (hide) {
        if (!this._cursorStyleTag) {
          this._cursorStyleTag = document.createElement("style");
          this._cursorStyleTag.id = "qs-cursor-hide";
          this._cursorStyleTag.textContent = `
            * { cursor: none !important; }
            .qs-ovl, .qs-guide, .qs-status-host { cursor: none !important; }
          `;
          (document.head || document.documentElement).appendChild(
            this._cursorStyleTag,
          );
        }
      } else {
        if (this._cursorStyleTag) {
          this._cursorStyleTag.remove();
          this._cursorStyleTag = null;
        }
      }
    },

    handleSaveAction: function () {
      if (!this.lastBlob) return;

      const url = URL.createObjectURL(this.lastBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = this.getSmartFilename("screenshot");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Transition Logic via UI
      const statusEl = window.SwiftSelect.ui.statusEl;
      if (statusEl) {
        const textSpan = statusEl.querySelector("span");
        const saveBtn = statusEl.querySelector(".qs-save-btn");

        if (textSpan && saveBtn) {
          textSpan.style.transition =
            "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
          saveBtn.style.transition = "all 0.3s ease-out";
          statusEl.style.transition =
            "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";

          statusEl.style.transform = "translate(-50%, -3px) scale(1.05)";
          saveBtn.style.opacity = "0";
          saveBtn.style.transform = "scale(0.7) translateX(10px)";

          setTimeout(() => {
            textSpan.style.transform = "scale(0.9)";
            textSpan.style.opacity = "0.3";

            setTimeout(() => {
              textSpan.textContent = "Image Saved";
              statusEl.classList.remove("qs-success");
              statusEl.classList.add("qs-saved");
              saveBtn.remove();

              textSpan.style.transform = "scale(1.1)";
              textSpan.style.opacity = "1";

              setTimeout(() => {
                textSpan.style.transform = "scale(1)";
                statusEl.style.transform = "translate(-50%, 0) scale(1)";
              }, 100);
            }, 150);
          }, 100);
        }

        if (window.SwiftSelect.ui.hideStatusTimer)
          clearTimeout(window.SwiftSelect.ui.hideStatusTimer);
        window.SwiftSelect.ui.hideStatusTimer = setTimeout(() => {
          if (statusEl) {
            statusEl.classList.add("qs-hiding");
            setTimeout(() => {
              statusEl.style.display = "none";
              window.SwiftSelect.ui.statusHost.style.display = "none";
              statusEl.classList.remove("qs-hiding");
              window.SwiftSelect.ui.currentStatus = null;
            }, 300);
          }
        }, 2500);
      }
    },

    captureFrame: async function (retries = 3) {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const resp = await new Promise((resolve) => {
            chrome.runtime.sendMessage(
              { type: "capture-visible-tab" },
              resolve,
            );
          });
          if (resp?.success) return resp.dataUrl;
          const errMsg = resp?.error || "capture-visible-tab failed";
          if (errMsg.includes("MAX_CAPTURE") && attempt < retries) {
            const delay = 600 * Math.pow(2, attempt);
            await new Promise((r) => setTimeout(r, delay));
            continue;
          }
          throw new Error(errMsg);
        } catch (err) {
          if (attempt >= retries) throw err;
          await new Promise((r) => setTimeout(r, 600 * Math.pow(2, attempt)));
        }
      }
    },

    handleCaptureVisible: async function () {
      try {
        window.SwiftSelect.ui.setButtonLoading("capture-visible", true);
        await window.SwiftSelect.ui.hideUiForCapture();
        window.SwiftSelect.ui.cleanup();
        window.SwiftSelect.events.removeListeners();

        const resp = await new Promise((resolve) => {
          chrome.runtime.sendMessage({ type: "capture-visible-tab" }, resolve);
        });
        if (!resp?.success) throw new Error(resp?.error || "Capture failed");

        const img = await this.loadImage(resp.dataUrl);
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        this.lastBlob = await new Promise((res, rej) =>
          canvas.toBlob(
            (b) => (b ? res(b) : rej(new Error("toBlob failed"))),
            "image/png",
          ),
        );

        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": this.lastBlob }),
        ]);
        window.SwiftSelect.ui.triggerFlash();
        window.SwiftSelect.ui.setStatus("Copied to clipboard", 5000, "success");
      } catch (err) {
        console.error("handleCaptureVisible error:", err);
        window.SwiftSelect.ui.setStatus("Capture failed", 3000, "error");
      } finally {
        this.toggleCursor(false); // Added
        window.SwiftSelect.ui.setButtonLoading("capture-visible", false);
      }
    },

    handleCaptureAndDownload: async function () {
      try {
        window.SwiftSelect.ui.setButtonLoading("capture-download", true);
        await window.SwiftSelect.ui.hideUiForCapture();
        window.SwiftSelect.ui.cleanup();
        window.SwiftSelect.events.removeListeners();

        this.toggleCursor(true); // Added
        // Give a tiny moment for the cursor to actually vanish from the OS/Browser render
        await new Promise((r) => setTimeout(r, 50)); // Added

        const resp = await new Promise((resolve) => {
          chrome.runtime.sendMessage({ type: "capture-visible-tab" }, resolve);
        });
        if (!resp?.success) throw new Error(resp?.error || "Capture failed");

        const img = await this.loadImage(resp.dataUrl);
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        this.lastBlob = await new Promise((res, rej) =>
          canvas.toBlob(
            (b) => (b ? res(b) : rej(new Error("toBlob failed"))),
            "image/png",
          ),
        );

        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": this.lastBlob }),
        ]);

        const url = URL.createObjectURL(this.lastBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = this.getSmartFilename("screenshot");
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        window.SwiftSelect.ui.triggerFlash();
        window.SwiftSelect.ui.setStatus("Copied & Saved", 5000, "saved");
      } catch (err) {
        console.error("handleCaptureAndDownload error:", err);
        window.SwiftSelect.ui.setStatus("Capture failed", 3000, "error");
      } finally {
        this.toggleCursor(false); // Added
        window.SwiftSelect.ui.setButtonLoading("capture-download", false);
      }
    },

    captureAndCrop: async function (viewRect) {
      try {
        await window.SwiftSelect.ui.hideUiForCapture();

        this.toggleCursor(true); // Added
        // Give a tiny moment for the cursor to actually vanish from the OS/Browser render
        await new Promise((r) => setTimeout(r, 50)); // Added

        const resp = await new Promise((resolve) => {
          chrome.runtime.sendMessage({ type: "capture-visible-tab" }, resolve);
        });
        if (!resp?.success) throw new Error(resp?.error || "Capture failed");

        const img = await this.loadImage(resp.dataUrl);
        const dpr = window.devicePixelRatio || 1;
        const sx = Math.round(viewRect.left * dpr);
        const sy = Math.round(viewRect.top * dpr);
        const sw = Math.round(viewRect.width * dpr);
        const sh = Math.round(viewRect.height * dpr);

        const canvas = document.createElement("canvas");
        const safeSw = Math.max(1, sw);
        const safeSh = Math.max(1, sh);

        canvas.width = safeSw;
        canvas.height = safeSh;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, safeSw, safeSh);

        this.lastBlob = await new Promise((res, rej) =>
          canvas.toBlob(
            (b) => (b ? res(b) : rej(new Error("toBlob failed"))),
            "image/png",
          ),
        );

        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": this.lastBlob }),
        ]);
      } catch (err) {
        console.error("captureAndCrop error:", err);
        window.SwiftSelect.ui.setStatus("Capture failed", 3000, "error");
        throw err;
      } finally {
        this.toggleCursor(false); // Added
      }
    },

    // ─── Full Page Helpers ───

    /**
     * Detect and neutralize all fixed/sticky elements so they
     * don't repeat in every captured frame.
     */
    neutralizeStickyElements: function () {
      this._hiddenStickyElements = [];
      const all = document.querySelectorAll("*");

      for (const el of all) {
        if (el.tagName === "STYLE" || el.tagName === "SCRIPT") continue;
        // Skip our own injected elements
        if (el.hasAttribute("data-swiftselect-unroll")) continue;
        if (el.hasAttribute("data-swiftselect-unroll-scroll")) continue;
        if (el.id === "swift-select-filters") continue;

        const style = window.getComputedStyle(el);
        const pos = style.position;

        if (pos === "fixed" || pos === "sticky") {
          const rect = el.getBoundingClientRect();
          const scrollY = window.scrollY || document.documentElement.scrollTop;
          const scrollX = window.scrollX || document.documentElement.scrollLeft;
          const docTop = rect.top + scrollY;
          const docLeft = rect.left + scrollX;

          this._hiddenStickyElements.push({
            element: el,
            originalPosition: el.style.position,
            originalTop: el.style.top,
            originalLeft: el.style.left,
            originalRight: el.style.right,
            originalBottom: el.style.bottom,
            originalWidth: el.style.width,
            originalHeight: el.style.height,
            originalZIndex: el.style.zIndex,
            originalVisibility: el.style.visibility,
            originalMargin: el.style.margin,
            computedPosition: pos,
          });

          // Convert to absolute
          el.style.setProperty("position", "absolute", "important");
          el.style.setProperty("margin", "0", "important");
          el.style.setProperty("right", "auto", "important");
          el.style.setProperty("bottom", "auto", "important");
          el.style.setProperty("width", `${rect.width}px`, "important");
          el.style.setProperty("height", `${rect.height}px`, "important");

          // Calculate relative top/left based on new offsetParent
          // We need a force reflow to get the new offsetParent after position change
          void el.offsetHeight;
          let offParent = el.offsetParent || document.body;
          let parentRect = offParent.getBoundingClientRect();
          let parentDocTop = parentRect.top + scrollY;
          let parentDocLeft = parentRect.left + scrollX;

          el.style.setProperty(
            "top",
            `${docTop - parentDocTop}px`,
            "important",
          );
          el.style.setProperty(
            "left",
            `${docLeft - parentDocLeft}px`,
            "important",
          );
        }
      }

      console.log(
        `[SwiftSelect] Neutralized ${this._hiddenStickyElements.length} sticky/fixed elements`,
      );
    },

    restoreStickyElements: function () {
      for (const entry of this._hiddenStickyElements) {
        const el = entry.element;
        if (!el.isConnected) continue;
        el.style.position = entry.originalPosition;
        el.style.top = entry.originalTop;
        el.style.left = entry.originalLeft;
        el.style.right = entry.originalRight;
        el.style.bottom = entry.originalBottom;
        el.style.width = entry.originalWidth;
        el.style.height = entry.originalHeight;
        el.style.zIndex = entry.originalZIndex;
        el.style.visibility = entry.originalVisibility;
        el.style.margin = entry.originalMargin || "";
      }
      this._hiddenStickyElements = [];
    },

    /**
     * Find the primary inner scroll container, if one exists.
     * Returns the element or null if the page scrolls at document level.
     */
    findInnerScrollContainer: function () {
      const winH = window.innerHeight;
      const winW = window.innerWidth;
      const allElements = document.querySelectorAll("*");
      let bestElement = null;
      let bestArea = 0;

      for (const el of allElements) {
        const style = window.getComputedStyle(el);
        if (
          (style.overflowY === "auto" || style.overflowY === "scroll") &&
          el.scrollHeight > el.clientHeight + 50
        ) {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) {
            const area = r.width * r.height;
            if (area > bestArea && area > winH * winW * 0.2) {
              bestArea = area;
              bestElement = el;
            }
          }
        }
      }

      return bestElement;
    },

    measureFullContentHeight: function () {
      const docSH = document.documentElement.scrollHeight;
      const bodySH = document.body.scrollHeight;
      const winH = window.innerHeight;

      // First check for inner scroll containers (SPAs like GitHub Copilot)
      const innerScroller = this.findInnerScrollContainer();
      if (innerScroller) {
        this._innerScrollContainer = innerScroller;
        innerScroller.scrollTo({ top: 0, behavior: "instant" });
        const nonScrollerHeight = winH - innerScroller.clientHeight;
        return innerScroller.scrollHeight + nonScrollerHeight;
      }

      this._innerScrollContainer = null;

      if (docSH > winH + 50 || bodySH > winH + 50) {
        return Math.max(docSH, bodySH);
      }

      return Math.max(docSH, bodySH, winH);
    },

    applyUnrollCSS: function (contentHeight) {
      this._originalScrollTop =
        window.scrollY || document.documentElement.scrollTop;
      document.scrollingElement?.scrollTo({ top: 0, behavior: "instant" });

      this._unrollStyle = document.createElement("style");
      this._unrollStyle.setAttribute("data-swiftselect-unroll", "true");

      const heightCSS = contentHeight
        ? `height: ${contentHeight}px !important;`
        : "";

      // If we have an inner scroll container, we need to unroll IT, not just html
      const innerScroller = this._innerScrollContainer;
      let innerScrollerCSS = "";

      if (innerScroller) {
        // Store original styles for restoration
        this._innerScrollOriginalStyles = {
          overflow: innerScroller.style.overflow,
          overflowY: innerScroller.style.overflowY,
          maxHeight: innerScroller.style.maxHeight,
          height: innerScroller.style.height,
        };

        // Flatten the inner scroller: remove overflow clipping,
        // let its full content render, so translate3d on <html>
        // can actually reveal it
        innerScroller.style.setProperty("overflow", "visible", "important");
        innerScroller.style.setProperty("overflow-y", "visible", "important");
        innerScroller.style.setProperty("max-height", "none", "important");
        innerScroller.style.setProperty(
          "height",
          innerScroller.scrollHeight + "px",
          "important",
        );

        // Also scroll it to top
        innerScroller.scrollTo({ top: 0, behavior: "instant" });
      }

      this._unrollStyle.textContent = `
      html, body {
        cursor: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=), auto !important;
      }
      * {
        transition: none !important;
        animation-play-state: paused !important;
        box-shadow: none !important;
        cursor: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=), auto !important;
        pointer-events: none !important;
      }
      html {
        transform: translate3d(0px, var(--scroll-top, 0px), 0px) !important;
        overflow: hidden !important;
        min-height: 100vh !important;
        max-height: none !important;
        ${heightCSS}
      }
      html::-webkit-scrollbar, body::-webkit-scrollbar {
        display: none !important; width: 0 !important; height: 0 !important;
      }
      html, body { scrollbar-width: none !important; }
      *::-webkit-scrollbar {
        display: none !important; width: 0 !important; height: 0 !important;
      }
      * { scrollbar-width: none !important; }
    `;
      document.head.appendChild(this._unrollStyle);

      // Neutralize sticky/fixed elements AFTER CSS is applied
      this.neutralizeStickyElements();
    },

    removeUnrollCSS: function () {
      // Restore sticky elements first
      this.restoreStickyElements();

      // Restore inner scroll container
      if (this._innerScrollContainer && this._innerScrollOriginalStyles) {
        const el = this._innerScrollContainer;
        const orig = this._innerScrollOriginalStyles;
        el.style.overflow = orig.overflow;
        el.style.overflowY = orig.overflowY;
        el.style.maxHeight = orig.maxHeight;
        el.style.height = orig.height;
        this._innerScrollContainer = null;
        this._innerScrollOriginalStyles = null;
      }

      if (this._unrollStyle) {
        this._unrollStyle.remove();
        this._unrollStyle = null;
      }
      if (this._unrollScrollStyle) {
        this._unrollScrollStyle.remove();
        this._unrollScrollStyle = null;
      }
      window.scrollTo(0, this._originalScrollTop);
    },

    setUnrollPosition: function (scrollTop) {
      if (this._unrollScrollStyle) this._unrollScrollStyle.remove();
      this._unrollScrollStyle = document.createElement("style");
      this._unrollScrollStyle.setAttribute(
        "data-swiftselect-unroll-scroll",
        "true",
      );
      this._unrollScrollStyle.textContent = `
      html { --scroll-top: ${-scrollTop}px !important; }
    `;
      document.head.appendChild(this._unrollScrollStyle);
    },

    handleUnrollPage: function () {
      this.toggleCursor(true); // Added
      document.activeElement?.blur();
      const hovered = document.querySelectorAll(":hover");
      hovered.forEach((el) => {
        el.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
        el.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
      });
      document.documentElement.dispatchEvent(
        new MouseEvent("mouseleave", {
          bubbles: true,
          clientX: -1,
          clientY: -1,
        }),
      );

      const contentHeight = this.measureFullContentHeight();
      this.applyUnrollCSS(contentHeight);

      const rect = document.documentElement.getBoundingClientRect();

      // Background color detection
      const bodyBg = window.getComputedStyle(document.body).backgroundColor;
      const htmlBg = window.getComputedStyle(
        document.documentElement,
      ).backgroundColor;
      const bgColor =
        bodyBg && bodyBg !== "rgba(0, 0, 0, 0)"
          ? bodyBg
          : htmlBg && htmlBg !== "rgba(0, 0, 0, 0)"
            ? htmlBg
            : null;

      return {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio || 1,
        scrollHeight: Math.max(contentHeight, rect.height),
        rect: { height: rect.height, bottom: rect.bottom },
        rectBottom: rect.bottom,
        bgColor,
        abort: this._abortCapture,
      };
    },

    handleUpdateUnroll: function (scrollTop) {
      if (this._abortCapture) return { abort: true };
      this.setUnrollPosition(scrollTop);
      const rect = document.documentElement.getBoundingClientRect();
      return {
        rectBottom: rect.bottom,
        rect: { height: rect.height, bottom: rect.bottom },
      };
    },

    handleRestoreUnroll: function () {
      this.toggleCursor(false); // Added
      this.removeUnrollCSS(); // Corrected from `moveUnrollCSS()`
    },

    handleCaptureFullPage: async function () {
      let originalIcon = null;
      let scrollbarStyle = null;
      this._abortCapture = false;

      const onAbortKey = (e) => {
        if (e.key === "Escape") {
          this._abortCapture = true;
          window.SwiftSelect.ui.setStatus("Aborting...", 1500);
        }
      };

      const btn = window.SwiftSelect.ui.guideShadow?.querySelector(
        '[data-action="capture-full"]',
      );

      try {
        window.addEventListener("keydown", onAbortKey, true);
        window.SwiftSelect.ui.ensureUi();
        window.SwiftSelect.ui.removeCrosshairCursor();
        window.SwiftSelect.events.removeListeners();
        // dragging = false; // Need to access dragging state in events or reset via cleanup

        window.SwiftSelect.ui.updateBadge("0%");

        originalIcon = btn?.cloneNode(true);
        if (btn) {
          btn.classList.add("qs-loading");
          // Clear children instead of innerHTML
          while (btn.firstChild) btn.removeChild(btn.firstChild);

          const ps = document.createElement("span");
          ps.className = "qs-progress-text";
          ps.textContent = "0%";
          btn.appendChild(ps);
        }

        if (window.SwiftSelect.ui.guideHost)
          window.SwiftSelect.ui.guideHost.style.display = "none";

        const tCursor =
          "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=), auto";
        document.documentElement.style.setProperty(
          "cursor",
          tCursor,
          "important",
        );
        document.body.style.setProperty("cursor", tCursor, "important");

        await new Promise((r) => requestAnimationFrame(r));

        document.activeElement?.blur();
        const hovered = document.querySelectorAll(":hover");
        hovered.forEach((el) => {
          el.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
          el.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
        });
        document.documentElement.dispatchEvent(
          new MouseEvent("mouseleave", {
            bubbles: true,
            clientX: -1,
            clientY: -1,
          }),
        );
        await new Promise((r) => setTimeout(r, 80));

        const result = await new Promise((resolve) => {
          chrome.runtime.sendMessage(
            {
              type: "start-fullpage-capture",
              frameInterval: 50,
              format: "image/jpeg",
              quality: 0.9,
            },
            resolve,
          );
        });

        if (this._abortCapture || result?.abort)
          throw new Error("Capture Aborted");

        if (!result || !result.success) {
          throw new Error(result?.error || "Full page capture failed");
        }

        const response = await fetch(result.dataUrl);
        this.lastBlob = await response.blob();

        window.SwiftSelect.ui.updateBadge("100%");
        if (btn) {
          btn.classList.remove("qs-loading");
          btn.querySelector(".qs-progress-text")?.remove();
          btn.classList.add("qs-success");

          const tick = window.SwiftSelect.ui.createSvg("0 -960 960 960", {
            d: "M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z",
          });
          const span = document.createElement("span");
          span.textContent = "Full Page";
          while (btn.firstChild) btn.removeChild(btn.firstChild);
          btn.appendChild(tick);
          btn.appendChild(span);

          setTimeout(() => {
            btn.classList.remove("qs-success");
            if (originalIcon) {
              while (btn.firstChild) btn.removeChild(btn.firstChild);
              originalIcon.childNodes.forEach((n) =>
                btn.appendChild(n.cloneNode(true)),
              );
            }
          }, 2000);
        }

        const url = URL.createObjectURL(this.lastBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = this.getSmartFilename("fullpage", "jpg");
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        const clipSuccess = result.clipboardSuccess;
        window.SwiftSelect.ui.updateBadge("✓", "#198754");

        const statusMsg = clipSuccess ? "Page Saved & Copied" : "Page Saved";
        window.SwiftSelect.ui.setStatus(statusMsg, 3000, "saved");
        setTimeout(() => window.SwiftSelect.ui.updateBadge(""), 3000);

        document.documentElement.style.cursor = "";
        document.body.style.cursor = "";

        window.SwiftSelect.ui.cleanup();
        window.SwiftSelect.events.removeListeners();
        window.removeEventListener("keydown", onAbortKey, true);
      } catch (err) {
        if (err.message?.includes("Extension context invalidated")) {
          window.SwiftSelect.ui.setStatus(
            "Extension updated. Please refresh this page.",
            8000,
            "error",
          );
          return;
        }
        console.error("Full page capture error:", err);
        this.handleRestoreUnroll();
        window.SwiftSelect.ui.updateBadge("ERR", "#DC3545");
        setTimeout(() => window.SwiftSelect.ui.updateBadge(""), 3000);

        if (btn) {
          btn.classList.remove("qs-loading");
          btn.classList.remove("qs-success");
          btn.querySelector(".qs-progress-text")?.remove();
          if (originalIcon) {
            while (btn.firstChild) btn.removeChild(btn.firstChild);
            originalIcon.childNodes.forEach((n) =>
              btn.appendChild(n.cloneNode(true)),
            );
          }
        }

        document.documentElement.style.cursor = "";
        document.body.style.cursor = "";

        window.SwiftSelect.ui.setStatus("Capture Failed", 3000, "error");
        if (window.SwiftSelect.ui.guideHost)
          window.SwiftSelect.ui.guideHost.style.display = "flex";
        window.removeEventListener("keydown", onAbortKey, true);
      }
    },
  };
}
