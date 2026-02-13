if (!window.SwiftSelect) window.SwiftSelect = {};

if (!window.SwiftSelect.capture) {
  window.SwiftSelect.capture = {
    lastBlob: null,

    // Internal Full Page State
    _unrollStyle: null,
    _unrollScrollStyle: null,
    _originalScrollTop: 0,

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
        window.SwiftSelect.ui.setButtonLoading("capture-visible", false);
      }
    },

    handleCaptureAndDownload: async function () {
      try {
        window.SwiftSelect.ui.setButtonLoading("capture-download", true);
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
        window.SwiftSelect.ui.setButtonLoading("capture-download", false);
      }
    },

    captureAndCrop: async function (viewRect) {
      try {
        await window.SwiftSelect.ui.hideUiForCapture();

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
      }
    },

    // ─── Full Page Helpers ───

    measureFullContentHeight: function () {
      const docSH = document.documentElement.scrollHeight;
      const bodySH = document.body.scrollHeight;
      const winH = window.innerHeight;

      if (docSH > winH + 50 || bodySH > winH + 50) {
        return Math.max(docSH, bodySH);
      }

      const allElements = document.querySelectorAll("*");
      let bestHeight = 0;
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
            if (area > bestArea && area > winH * window.innerWidth * 0.2) {
              bestArea = area;
              bestHeight = el.scrollHeight;
              bestElement = el;
            }
          }
        }
      }

      if (bestElement) {
        bestElement.scrollTo({ top: 0, behavior: "instant" });
        const nonScrollerHeight = winH - bestElement.clientHeight;
        return bestHeight + nonScrollerHeight;
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

      this._unrollStyle.textContent = `
      * {
        transition: none !important;
        animation-play-state: paused !important;
        box-shadow: none !important;
        cursor: none !important;
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

    removeUnrollCSS: function () {
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

    handleUnrollPage: function () {
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
      };
    },

    handleUpdateUnroll: function (scrollTop) {
      this.setUnrollPosition(scrollTop);
      const rect = document.documentElement.getBoundingClientRect();
      return {
        rectBottom: rect.bottom,
        rect: { height: rect.height, bottom: rect.bottom },
      };
    },

    handleRestoreUnroll: function () {
      this.removeUnrollCSS();
    },

    handleCaptureFullPage: async function () {
      let originalIcon = null;
      let scrollbarStyle = null;
      const btn = window.SwiftSelect.ui.guideShadow?.querySelector(
        '[data-action="capture-full"]',
      );

      try {
        window.SwiftSelect.ui.ensureUi();
        window.SwiftSelect.ui.removeCrosshairCursor();
        window.SwiftSelect.events.removeListeners();
        // dragging = false; // Need to access dragging state in events or reset via cleanup

        window.SwiftSelect.ui.updateBadge("0%");

        originalIcon = btn?.innerHTML;
        if (btn) {
          btn.classList.add("qs-loading");
          const ps = document.createElement("span");
          ps.className = "qs-progress-text";
          ps.textContent = "0%";
          btn.appendChild(ps);
        }

        if (window.SwiftSelect.ui.guideHost)
          window.SwiftSelect.ui.guideHost.style.display = "none";

        document.documentElement.style.cursor = "none !important";
        document.body.style.cursor = "none !important";

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

        if (!result || !result.success) {
          throw new Error(result?.error || "Full page capture failed");
        }

        const response = await fetch(result.dataUrl);
        this.lastBlob = await response.blob();

        try {
          // Try to write JPEG directly (Chrome 76+)
          await navigator.clipboard.write([
            new ClipboardItem({ [this.lastBlob.type]: this.lastBlob }),
          ]);
        } catch (clipboardErr) {
          console.warn(
            "JPEG Clipboard write failed. Falling back to PNG...",
            clipboardErr,
          );

          try {
            // Fallback: Convert JPEG Blob -> Image -> Canvas -> PNG Blob
            const img = await this.loadImage(
              URL.createObjectURL(this.lastBlob),
            );
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);

            const pngBlob = await new Promise((res, rej) =>
              canvas.toBlob(
                (b) => (b ? res(b) : rej(new Error("PNG conversion failed"))),
                "image/png",
              ),
            );

            await navigator.clipboard.write([
              new ClipboardItem({ "image/png": pngBlob }),
            ]);
            console.log("Fallback to PNG clipboard successful");
          } catch (fallbackErr) {
            console.error("Clipboard fallback failed:", fallbackErr);
            window.SwiftSelect.ui.setStatus(
              "Saved to file (Clipboard failed)",
              5000,
              "saved",
            );
            // Non-fatal, we still download the file
          }
        }

        window.SwiftSelect.ui.updateBadge("100%");
        if (btn) {
          btn.classList.remove("qs-loading");
          btn.querySelector(".qs-progress-text")?.remove();
          btn.classList.add("qs-success");
          btn.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg><span>Full Page</span>';
          setTimeout(() => {
            btn.classList.remove("qs-success");
            if (originalIcon) btn.innerHTML = originalIcon;
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

        window.SwiftSelect.ui.updateBadge("✓", "#198754");
        window.SwiftSelect.ui.setStatus(
          "Page Saved Successfully",
          5000,
          "saved",
        );
        setTimeout(() => window.SwiftSelect.ui.updateBadge(""), 3000);

        document.documentElement.style.cursor = "";
        document.body.style.cursor = "";

        window.SwiftSelect.ui.cleanup();
        window.SwiftSelect.events.removeListeners();
      } catch (err) {
        console.error("Full page capture error:", err);
        this.removeUnrollCSS();
        window.SwiftSelect.ui.updateBadge("ERR", "#DC3545");
        setTimeout(() => window.SwiftSelect.ui.updateBadge(""), 3000);

        if (btn) {
          btn.classList.remove("qs-loading");
          btn.classList.remove("qs-success");
          btn.querySelector(".qs-progress-text")?.remove();
          if (originalIcon) btn.innerHTML = originalIcon;
        }

        document.documentElement.style.cursor = "";
        document.body.style.cursor = "";

        window.SwiftSelect.ui.setStatus("Capture Failed", 3000, "error");
        if (window.SwiftSelect.ui.guideHost)
          window.SwiftSelect.ui.guideHost.style.display = "flex";
      }
    },
  };
}
