import { toggleCursor, getSmartFilename } from "./utils.js";
import { setLastBlob } from "./download.js";

let _unrollStyle = null;
let _unrollScrollStyle = null;
let _originalScrollTop = 0;
let _hiddenStickyElements = [];
let _innerScrollContainer = null;
let _innerScrollOriginalStyles = null;
let _abortCapture = false;

export function neutralizeStickyElements() {
  _hiddenStickyElements = [];
  const candidates = [];
  const scrollY = window.scrollY || document.documentElement.scrollTop;
  const scrollX = window.scrollX || document.documentElement.scrollLeft;

  // Faster scan using TreeWalker
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node) => {
        const tag = node.tagName;
        if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT")
          return NodeFilter.FILTER_REJECT;
        if (node.hasAttribute("data-swiftselect-unroll"))
          return NodeFilter.FILTER_REJECT;
        if (node.id === "swift-select-filters") return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    },
  );

  // Phase 1: Batch READS
  let el;
  while ((el = walker.nextNode())) {
    const style = window.getComputedStyle(el);
    const pos = style.position;

    if (pos === "fixed" || pos === "sticky") {
      candidates.push({
        el,
        style,
        pos,
        rect: el.getBoundingClientRect(),
      });
    }
  }

  // Phase 2: Batch WRITES
  for (const cand of candidates) {
    const { el, style, pos, rect } = cand;

    _hiddenStickyElements.push({
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

    el.style.setProperty("position", "absolute", "important");
    el.style.setProperty("margin", "0", "important");
    el.style.setProperty("right", "auto", "important");
    el.style.setProperty("bottom", "auto", "important");
    el.style.setProperty("width", `${rect.width}px`, "important");
    el.style.setProperty("height", `${rect.height}px`, "important");

    // Calculate document-relative coordinates
    const docTop = rect.top + scrollY;
    const docLeft = rect.left + scrollX;

    // Use a secondary pass for top/left if we wanted to be perfectly thrash-free,
    // but computing top/left relative to offsetParent usually needs offsetParent.docTop.
    // We can approximate or accept one layout break here if candidates are few.
    let offParent = el.offsetParent || document.body;
    let parentRect = offParent.getBoundingClientRect();
    let parentDocTop = parentRect.top + scrollY;
    let parentDocLeft = parentRect.left + scrollX;

    el.style.setProperty("top", `${docTop - parentDocTop}px`, "important");
    el.style.setProperty("left", `${docLeft - parentDocLeft}px`, "important");
  }
}

export function restoreStickyElements() {
  for (const entry of _hiddenStickyElements) {
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
  _hiddenStickyElements = [];
}

export function findInnerScrollContainer() {
  const winH = window.innerHeight;
  const winW = window.innerWidth;

  // Deep scan all potential scrolling containers to catch Gemini's custom elements
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node) => {
        const tag = node.tagName;
        if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT")
          return NodeFilter.FILTER_REJECT;
        if (node.id === "swift-select-filters") return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    },
  );

  let bestElement = null;
  let bestArea = 0;

  let el = document.body;
  const candidates = [document.body];

  while ((el = walker.nextNode())) {
    candidates.push(el);
  }

  for (const cand of candidates) {
    if (
      !cand ||
      cand.clientWidth < winW * 0.3 ||
      cand.clientHeight < winH * 0.3
    )
      continue;

    const style = window.getComputedStyle(cand);
    const overflowY = style.overflowY;
    const overflow = style.overflow;

    if (
      (overflowY === "auto" ||
        overflowY === "scroll" ||
        overflow === "auto" ||
        overflow === "scroll") &&
      cand.scrollHeight > cand.clientHeight + 50
    ) {
      const r = cand.getBoundingClientRect();
      const area = r.width * r.height;

      // Weight the container by how much screen space it takes up.
      // E.g., a main chat wrapper will be huge.
      if (area > bestArea && area > winH * winW * 0.2) {
        bestArea = area;
        bestElement = cand;
      }
    }
  }

  return bestElement;
}

export function measureFullContentHeight() {
  const docSH = document.documentElement.scrollHeight;
  const bodySH = document.body.scrollHeight;
  const winH = window.innerHeight;

  const innerScroller = findInnerScrollContainer();
  if (innerScroller) {
    _innerScrollContainer = innerScroller;
    innerScroller.scrollTo({ top: 0, behavior: "instant" });
    const nonScrollerHeight = winH - innerScroller.clientHeight;
    return innerScroller.scrollHeight + nonScrollerHeight;
  }

  _innerScrollContainer = null;
  if (docSH > winH + 50 || bodySH > winH + 50) {
    return Math.max(docSH, bodySH);
  }
  return Math.max(docSH, bodySH, winH);
}

export function applyUnrollCSS(contentHeight) {
  _originalScrollTop = window.scrollY || document.documentElement.scrollTop;
  document.scrollingElement?.scrollTo({ top: 0, behavior: "instant" });

  _unrollStyle = document.createElement("style");
  _unrollStyle.setAttribute("data-swiftselect-unroll", "true");

  const heightCSS = contentHeight
    ? `height: ${contentHeight}px !important;`
    : "";
  const innerScroller = _innerScrollContainer;

  if (innerScroller) {
    _innerScrollOriginalStyles = {
      overflow: innerScroller.style.overflow,
      overflowY: innerScroller.style.overflowY,
      maxHeight: innerScroller.style.maxHeight,
      height: innerScroller.style.height,
    };

    innerScroller.style.setProperty("overflow", "visible", "important");
    innerScroller.style.setProperty("overflow-y", "visible", "important");
    innerScroller.style.setProperty("max-height", "none", "important");
    innerScroller.style.setProperty(
      "height",
      innerScroller.scrollHeight + "px",
      "important",
    );
    innerScroller.scrollTo({ top: 0, behavior: "instant" });
  }

  _unrollStyle.textContent = `
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
    html::-webkit-scrollbar, body::-webkit-scrollbar, *::-webkit-scrollbar {
      display: none !important; 
      width: 0 !important; 
      height: 0 !important;
      opacity: 0 !important;
    }
    html, body, * { 
      scrollbar-width: none !important; 
      -ms-overflow-style: none !important; 
    }
  `;
  document.head.appendChild(_unrollStyle);
  neutralizeStickyElements();
}

export function removeUnrollCSS() {
  restoreStickyElements();
  if (_innerScrollContainer && _innerScrollOriginalStyles) {
    const el = _innerScrollContainer;
    const orig = _innerScrollOriginalStyles;
    el.style.overflow = orig.overflow;
    el.style.overflowY = orig.overflowY;
    el.style.maxHeight = orig.maxHeight;
    el.style.height = orig.height;
    _innerScrollContainer = null;
    _innerScrollOriginalStyles = null;
  }
  if (_unrollStyle) {
    _unrollStyle.remove();
    _unrollStyle = null;
  }
  if (_unrollScrollStyle) {
    _unrollScrollStyle.remove();
    _unrollScrollStyle = null;
  }
  window.scrollTo(0, _originalScrollTop);
}

export function setUnrollPosition(scrollTop) {
  if (_unrollScrollStyle) _unrollScrollStyle.remove();
  _unrollScrollStyle = document.createElement("style");
  _unrollScrollStyle.setAttribute("data-swiftselect-unroll-scroll", "true");
  _unrollScrollStyle.textContent = `html { --scroll-top: ${-scrollTop}px !important; }`;
  document.head.appendChild(_unrollScrollStyle);
}

export function handleUnrollPage() {
  toggleCursor(true);
  document.activeElement?.blur();
  const hovered = document.querySelectorAll(":hover");
  hovered.forEach((el) => {
    el.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
    el.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
  });
  document.documentElement.dispatchEvent(
    new MouseEvent("mouseleave", { bubbles: true, clientX: -1, clientY: -1 }),
  );

  const contentHeight = measureFullContentHeight();
  applyUnrollCSS(contentHeight);

  const rect = document.documentElement.getBoundingClientRect();
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
    rect: { height: rect.height, bottom: rect.bottom, width: rect.width },
    rectBottom: rect.bottom,
    bgColor,
    abort: _abortCapture,
  };
}

export function handleUpdateUnroll(scrollTop) {
  if (_abortCapture) return { abort: true };
  setUnrollPosition(scrollTop);
  const rect = document.documentElement.getBoundingClientRect();
  return {
    rectBottom: rect.bottom,
    rect: { height: rect.height, bottom: rect.bottom },
  };
}

export function handleRestoreUnroll() {
  toggleCursor(false);
  removeUnrollCSS();
}

export async function handleCaptureFullPage() {
  let originalIcon = null;
  _abortCapture = false;

  const onAbortKey = (e) => {
    if (e.key === "Escape") {
      _abortCapture = true;
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
    window.SwiftSelect.ui.updateBadge("0%");

    originalIcon = btn?.cloneNode(true);
    if (btn) {
      btn.classList.add("qs-loading");
      while (btn.firstChild) btn.removeChild(btn.firstChild);
      const ps = document.createElement("span");
      ps.className = "qs-progress-text";
      ps.textContent = "0%";
      btn.appendChild(ps);
    }

    if (window.SwiftSelect.ui.guideHost) {
      window.SwiftSelect.ui.guideHost.style.display = "none";
    }
    if (window.SwiftSelect.ui.overlayHost) {
      window.SwiftSelect.ui.overlayHost.style.display = "none";
    }
    if (typeof window.SwiftSelect.ui.releaseFreeze === "function") {
      window.SwiftSelect.ui.releaseFreeze();
    }

    const tCursor =
      "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=), auto";
    document.documentElement.style.setProperty("cursor", tCursor, "important");
    document.body.style.setProperty("cursor", tCursor, "important");

    await new Promise((r) => requestAnimationFrame(r));
    document.activeElement?.blur();

    // Notify background
    const result = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: "start-fullpage-capture",
          frameInterval: 15,
          format: "image/jpeg",
          quality: 0.9,
        },
        resolve,
      );
    });

    if (_abortCapture || result?.abort) throw new Error("Capture Aborted");
    if (!result || !result.success)
      throw new Error(result?.error || "Full page capture failed");

    const response = await fetch(result.blobUrl);
    const blob = await response.blob();
    setLastBlob(blob);

    // Revoke now that we've fetched the blob into memory (as a Blob object)
    URL.revokeObjectURL(result.blobUrl);

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

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = getSmartFilename("fullpage", "jpg");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    document.documentElement.style.cursor = "";
    document.body.style.cursor = "";
    window.SwiftSelect.ui.cleanup();
    window.SwiftSelect.events.removeListeners();
    window.removeEventListener("keydown", onAbortKey, true);

    const statusMsg = result.clipboardSuccess
      ? "Page Saved & Copied"
      : "Page Saved";
    // Now that the UI has been securely torn down (including any previous toasts),
    // we can safely generate the new success toast without `cleanup()` immediately destroying it.
    window.SwiftSelect.ui.setStatus(statusMsg, 3000, "saved");
    window.SwiftSelect.ui.updateBadge("✓", "#198754");
    setTimeout(() => window.SwiftSelect.ui.updateBadge(""), 3000);
  } catch (err) {
    console.error("Full page capture error:", err);
    handleRestoreUnroll();
    window.SwiftSelect.ui.updateBadge("ERR", "#DC3545");
    setTimeout(() => window.SwiftSelect.ui.updateBadge(""), 3000);
    // Cleanup button and UI
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
}
