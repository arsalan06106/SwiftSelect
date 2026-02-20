import { loadImage, toggleCursor } from "./utils.js";
import { setLastBlob } from "./download.js";

export async function captureFrame(retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const resp = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "capture-visible-tab" }, resolve);
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
}

export async function handleCaptureVisible() {
  try {
    window.SwiftSelect.ui.setButtonLoading("capture-visible", true);
    await window.SwiftSelect.ui.hideUiForCapture();
    window.SwiftSelect.ui.cleanup();
    window.SwiftSelect.events.removeListeners();

    const resp = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "capture-visible-tab" }, resolve);
    });
    if (!resp?.success) throw new Error(resp?.error || "Capture failed");

    const img = await loadImage(resp.dataUrl);

    // Mathematically crop out the native browser scrollbars
    const dpr = window.devicePixelRatio || 1;
    const cropW = Math.min(
      img.width,
      Math.round(document.documentElement.clientWidth * dpr),
    );
    const cropH = Math.min(
      img.height,
      Math.round(document.documentElement.clientHeight * dpr),
    );

    const canvas = document.createElement("canvas");
    canvas.width = cropW;
    canvas.height = cropH;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, cropW, cropH, 0, 0, cropW, cropH);

    const blob = await new Promise((res, rej) =>
      canvas.toBlob(
        (b) => (b ? res(b) : rej(new Error("toBlob failed"))),
        "image/png",
      ),
    );
    setLastBlob(blob);

    let clipboardSuccess = false;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      clipboardSuccess = true;
    } catch (clipErr) {
      console.debug("handleCaptureVisible: Clipboard write failed:", clipErr);
    }

    window.SwiftSelect.ui.triggerFlash();

    if (clipboardSuccess) {
      window.SwiftSelect.ui.setStatus("Copied to clipboard", 5000, "success");
    } else {
      // Fallback: Automatic download if clipboard fails
      const { handleSaveAction } = await import("./download.js");
      handleSaveAction();
      window.SwiftSelect.ui.setStatus(
        "Saved (Clipboard Blocked)",
        5000,
        "saved",
      );
    }
  } catch (err) {
    console.error("handleCaptureVisible error:", err);
    window.SwiftSelect.ui.setStatus("Capture failed", 3000, "error");
  } finally {
    toggleCursor(false);
    window.SwiftSelect.ui.setButtonLoading("capture-visible", false);
  }
}

export async function handleCaptureAndDownload() {
  try {
    window.SwiftSelect.ui.setButtonLoading("capture-download", true);
    await window.SwiftSelect.ui.hideUiForCapture();
    window.SwiftSelect.ui.cleanup();
    window.SwiftSelect.events.removeListeners();

    toggleCursor(true);
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r));

    const resp = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "capture-visible-tab" }, resolve);
    });
    if (!resp?.success) throw new Error(resp?.error || "Capture failed");

    const img = await loadImage(resp.dataUrl);

    // Mathematically crop out the native browser scrollbars
    const dpr = window.devicePixelRatio || 1;
    const cropW = Math.min(
      img.width,
      Math.round(document.documentElement.clientWidth * dpr),
    );
    const cropH = Math.min(
      img.height,
      Math.round(document.documentElement.clientHeight * dpr),
    );

    const canvas = document.createElement("canvas");
    canvas.width = cropW;
    canvas.height = cropH;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, cropW, cropH, 0, 0, cropW, cropH);

    const blob = await new Promise((res, rej) =>
      canvas.toBlob(
        (b) => (b ? res(b) : rej(new Error("toBlob failed"))),
        "image/png",
      ),
    );
    setLastBlob(blob);

    let clipboardSuccess = false;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      clipboardSuccess = true;
    } catch (clipErr) {
      console.debug(
        "handleCaptureAndDownload: Clipboard write failed:",
        clipErr,
      );
    }

    const { handleSaveAction } = await import("./download.js");
    handleSaveAction();

    window.SwiftSelect.ui.triggerFlash();
    const statusMsg = clipboardSuccess ? "Copied & Saved" : "Page Saved";
    window.SwiftSelect.ui.setStatus(
      statusMsg,
      5000,
      clipboardSuccess ? "saved" : "saved",
    );
  } catch (err) {
    console.error("handleCaptureAndDownload error:", err);
    window.SwiftSelect.ui.setStatus("Capture failed", 3000, "error");
  } finally {
    toggleCursor(false);
    window.SwiftSelect.ui.setButtonLoading("capture-download", false);
  }
}

export async function captureAndCrop(viewRect) {
  try {
    await window.SwiftSelect.ui.hideUiForCapture();

    toggleCursor(true);
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r));

    const resp = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "capture-visible-tab" }, resolve);
    });
    if (!resp?.success) throw new Error(resp?.error || "Capture failed");

    const img = await loadImage(resp.dataUrl);
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

    const blob = await new Promise((res, rej) =>
      canvas.toBlob(
        (b) => (b ? res(b) : rej(new Error("toBlob failed"))),
        "image/png",
      ),
    );
    setLastBlob(blob);

    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
    } catch (clipErr) {
      console.debug("captureAndCrop: Clipboard write failed:", clipErr);
      // Fallback: download if copy fails during selection
      const { handleSaveAction } = await import("./download.js");
      handleSaveAction();
      window.SwiftSelect.ui.setStatus(
        "Saved (Clipboard Blocked)",
        5000,
        "saved",
      );
    }
  } catch (err) {
    console.error("captureAndCrop error:", err);
    window.SwiftSelect.ui.setStatus("Capture failed", 3000, "error");
    throw err;
  } finally {
    toggleCursor(false);
  }
}
