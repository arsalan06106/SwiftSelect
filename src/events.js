/**
 * Event handling for SwiftSelect
 */

import { captureAndCrop } from "./capture/region.js";

export let dragging = false;
export let isMoving = false;
export let isSpacePressed = false;
export let startX = 0;
export let startY = 0;
export let lastMouseX = 0;
export let lastMouseY = 0;
export let rect = { left: 0, top: 0, width: 0, height: 0 };
export let snapTimer = null;
export let lastSnapTime = 0;
export let highlightedRect = null;
export let initialized = false;

export function init() {
  if (initialized) return;
  initialized = true;
  // Listeners are added via addListeners
}

export function onPointerDown(e) {
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

  window.SwiftSelect.ui.ensureUi();

  dragging = true;
  isMoving = false;
  startX = e.clientX;
  startY = e.clientY;
  lastMouseX = startX;
  lastMouseY = startY;
  rect.left = startX;
  rect.top = startY;
  rect.width = 0;
  rect.height = 0;

  window.SwiftSelect.ui.updateSelection(rect);
  window.SwiftSelect.ui.setSelecting(true);
}

export function onPointerMove(e) {
  const x = e.clientX;
  const y = e.clientY;

  if (dragging && isSpacePressed) {
    if (!isMoving) isMoving = true;
    const dx = x - lastMouseX;
    const dy = y - lastMouseY;

    rect.left += dx;
    rect.top += dy;
    startX += dx;
    startY += dy;

    lastMouseX = x;
    lastMouseY = y;

    window.SwiftSelect.ui.updateSelection(rect);
    return;
  } else {
    isMoving = false;
    lastMouseX = x;
    lastMouseY = y;
  }

  if (!dragging) {
    if (window.SwiftSelect.ui.box)
      window.SwiftSelect.ui.box.style.display = "none";
    if (snapTimer) clearTimeout(snapTimer);

    const isSnapping = e.ctrlKey || e.metaKey;
    if (!isSnapping) {
      if (window.SwiftSelect.ui.highlighterEl)
        window.SwiftSelect.ui.highlighterEl.style.display = "none";
      highlightedRect = null;
      if (window.SwiftSelect.ui.hudEl)
        window.SwiftSelect.ui.hudEl.style.display = "none";
      return;
    }

    const now = Date.now();
    if (now - lastSnapTime < 100) return;
    lastSnapTime = now;

    if (snapTimer) {
      clearTimeout(snapTimer);
      snapTimer = null;
    }

    const runSnap = () => {
      let elements = [];
      try {
        elements = document.elementsFromPoint(x, y);
      } catch (e) {
        console.warn("SwiftSelect: elementsFromPoint failed", e);
        return;
      }
      let bestCandidate = null;

      const isSignificant = (el) => {
        const r = el.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        if (r.width < 50 || r.height < 50) return false;
        if (r.top < -1 || r.left < -1 || r.bottom > vh + 1 || r.right > vw + 1)
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

        if (hasBgImage || hasBgColor || hasBorder || hasBoxShadow) return true;
        if (el.innerText && el.innerText.trim().length > 0) return true;
        return false;
      };

      for (const candidate of elements) {
        const isExtensionUi =
          candidate === window.SwiftSelect.ui.guideHost ||
          candidate === window.SwiftSelect.ui.statusHost ||
          candidate === window.SwiftSelect.ui.overlayHost ||
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
        highlightedRect = r;
        window.SwiftSelect.ui.updateSelection(r);
      } else {
        if (window.SwiftSelect.ui.highlighterEl)
          window.SwiftSelect.ui.highlighterEl.style.display = "none";
        highlightedRect = null;
        if (window.SwiftSelect.ui.hudEl)
          window.SwiftSelect.ui.hudEl.style.display = "none";
      }
    };

    runSnap();
    snapTimer = setTimeout(runSnap, 200);
    return;
  }

  if (window.SwiftSelect.ui.highlighterEl)
    window.SwiftSelect.ui.highlighterEl.style.display = "none";
  highlightedRect = null;
  if (window.SwiftSelect.ui.box)
    window.SwiftSelect.ui.box.style.display = "block";

  let width, height;

  if (e.shiftKey) {
    const rawW = Math.abs(x - startX);
    const rawH = Math.abs(y - startY);
    const size = Math.max(rawW, rawH);
    width = size;
    height = size;
    rect.left = x < startX ? startX - size : startX;
    rect.top = y < startY ? startY - size : startY;
  } else {
    const left = Math.min(startX, x);
    const top = Math.min(startY, y);
    width = Math.abs(x - startX);
    height = Math.abs(y - startY);
    rect.left = left;
    rect.top = top;
  }

  rect.width = width;
  rect.height = height;
  window.SwiftSelect.ui.updateSelection(rect);
}

export function onPointerUp(e) {
  if (e.button !== 0) return;
  if (!dragging) return;

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  dragging = false;
  window.SwiftSelect.ui.updateSelection(rect);
  window.SwiftSelect.ui.setSelecting(false);

  if (rect.width < 5 || rect.height < 5) {
    if (highlightedRect) {
      captureAndCrop(highlightedRect).finally(() => {
        cleanup();
        window.SwiftSelect.ui.cleanup();
        window.SwiftSelect.ui.triggerFlash(highlightedRect);
        window.SwiftSelect.ui.setStatus("Copied to clipboard", 5000, "success");
      });
      return;
    }

    window.SwiftSelect.ui.setStatus("Canceled", 1500);
    cleanup();
    window.SwiftSelect.ui.cleanup();
    return;
  }

  captureAndCrop(rect).finally(() => {
    cleanup();
    window.SwiftSelect.ui.cleanup();
    window.SwiftSelect.ui.setStatus("Copied to clipboard", 5000, "success");
  });
}

export function onKeyDown(e) {
  if (e.key === "Escape") {
    e.preventDefault();
    window.SwiftSelect.ui.setStatus("Canceled", 900);
    cleanup();
    window.SwiftSelect.ui.cleanup();
  }
  if (e.code === "Space") {
    isSpacePressed = true;
    if (dragging) e.preventDefault();
  }
}

export function onKeyUp(e) {
  if (e.code === "Space") {
    isSpacePressed = false;
    isMoving = false;
  }
}

export function preventAll(e) {
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
}

const boundPointerDown = onPointerDown;
const boundPointerMove = onPointerMove;
const boundPointerUp = onPointerUp;
const boundKeyDown = onKeyDown;
const boundKeyUp = onKeyUp;
const boundPreventAll = preventAll;

export function addListeners() {
  init();
  document.addEventListener("pointerdown", boundPointerDown, true);
  document.addEventListener("pointermove", boundPointerMove, true);
  document.addEventListener("pointerup", boundPointerUp, true);
  document.addEventListener("keydown", boundKeyDown, true);
  document.addEventListener("keyup", boundKeyUp, true);

  document.addEventListener("click", boundPreventAll, true);
  document.addEventListener("dblclick", boundPreventAll, true);
  document.addEventListener("contextmenu", boundPreventAll, true);
}

export function removeListeners() {
  document.removeEventListener("pointerdown", boundPointerDown, true);
  document.removeEventListener("pointermove", boundPointerMove, true);
  document.removeEventListener("pointerup", boundPointerUp, true);
  document.removeEventListener("keydown", boundKeyDown, true);
  document.removeEventListener("keyup", boundKeyUp, true);

  document.removeEventListener("click", boundPreventAll, true);
  document.removeEventListener("dblclick", boundPreventAll, true);
  document.removeEventListener("contextmenu", boundPreventAll, true);
}

export function cleanup() {
  dragging = false;
  isMoving = false;
  window.SwiftSelect.ui.setSelecting(false);
  removeListeners();
}
