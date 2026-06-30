// offscreen.js — Full page capture engine
// Runs in an offscreen document context where getUserMedia + ImageCapture are available.

// ─── Frame Detection ─────────────────────────────────────────────────
// Downsamples each frame to 10x10 and compares pixel data to detect
// whether the tab has actually repainted after a CSS scroll-top change.
class FrameDetector {
  constructor(w = 10, h = 10) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    this.ctx = c.getContext("2d", { alpha: false, willReadFrequently: true });
    this.w = w;
    this.h = h;
    this.prev = null;
  }

  /** Returns true if frame is IDENTICAL to previous (no change yet). */
  detect(imageBitmap) {
    this.ctx.drawImage(
      imageBitmap,
      0,
      0,
      imageBitmap.width,
      imageBitmap.height,
      0,
      0,
      this.w,
      this.h,
    );
    const cur = this.ctx.getImageData(0, 0, this.w, this.h);
    const prev = this.prev;
    this.prev = cur;
    if (!prev) return false; // first frame always "changed"
    const a = prev.data,
      b = cur.data;
    for (let i = a.length - 1; i >= 0; i--) {
      if (a[i] !== b[i]) return false;
    }
    return true; // identical
  }
}

// ─── Frame Grabber ───────────────────────────────────────────────────
// Wraps ImageCapture with frame detection and blob conversion.
class FrameGrabber {
  constructor(videoTrack) {
    this.ic = new ImageCapture(videoTrack);
    this.detector = new FrameDetector(10, 10);
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("bitmaprenderer", { alpha: false });
  }

  /** Grab a frame, retrying up to 3 times if the frame hasn't changed. */
  async grabFrame() {
    let attempts = 0;
    let frame;
    do {
      attempts++;
      frame = await this.ic.grabFrame();
      if (!this.detector.detect(frame) || attempts >= 20) break;
      await new Promise((r) => setTimeout(r, 16));
    } while (true);
    return frame;
  }

  /** Convert an ImageBitmap to a Blob (zero-copy transfer). */
  async frameToBlob(frame, format = "image/png", quality = 1.0) {
    this.canvas.width = frame.width;
    this.canvas.height = frame.height;
    this.ctx.transferFromImageBitmap(frame);
    return new Promise((r) => this.canvas.toBlob(r, format, quality));
  }
}

// ─── Clipboard Helper ────────────────────────────────────────────────

/**
 * Silently attempt to write to the clipboard.
 * No logging or focus-stealing; just a best-effort attempt.
 */
async function writeToClipboardSilent(blob) {
  try {
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    return true;
  } catch (e) {
    console.debug("offscreen: Silent clipboard write failed:", e);
    return false;
  }
}

async function dataUrlToBlob(dataUrl) {
  const response = await fetch(dataUrl);
  return response.blob();
}

// ─── Main Capture Logic ──────────────────────────────────────────────

/**
 * Send a message to the content script (via background relay) and wait for response.
 */
function sendToContent(tabId, action, data = {}) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timeout waiting for content script (${action})`));
    }, 10000);

    chrome.runtime.sendMessage(
      { type: "offscreen-to-content", tabId, action, data },
      (response) => {
        clearTimeout(timeout);
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      },
    );
  });
}

/**
 * Get a tab capture MediaStream using getUserMedia.
 */
async function getTabStream(streamId, width, height) {
  return navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "tab",
        chromeMediaSourceId: streamId,
        minWidth: width,
        maxWidth: width,
        minHeight: height,
        maxHeight: height,
        chromeMediaSourceCursor: "never",
      },
      cursor: "never",
    },
  });
}

/**
 * Perform the full page capture using CSS unrolling.
 * Matches the reference extension's approach exactly:
 * - Uses rect.height (post-CSS) for total frame count
 * - Uses rect.bottom for loop termination
 * - No scrollHeight dependency
 *
 * Flow:
 * 1. Tell content script to "unroll" the page (CSS transform instead of scroll)
 * 2. Open getUserMedia stream for the tab
 * 3. Loop: update --scroll-top → wait → grab frame → store
 * 4. Tell content script to restore
 * 5. Stitch frames on canvas → return Blob as data URL
 */
async function captureFullPage(
  streamId,
  tabId,
  frameInterval = 50,
  format = "image/png",
  quality = 1.0,
) {
  // 1. Unroll the page — CSS is applied first, then rect is measured
  const meta = await sendToContent(tabId, "unroll-page");
  if (!meta)
    throw new Error("unroll-page failed — no response from content script");

  const { innerWidth, innerHeight, devicePixelRatio: dpr } = meta;

  // Use rect.height (measured AFTER CSS injection) for the true content height.
  // This works because html has overflow:hidden + min-height:100vh, so
  // getBoundingClientRect().height = full content height.
  const rectHeight = meta.rect?.height || meta.scrollHeight || innerHeight;

  console.log("[offscreen] meta:", {
    innerWidth,
    innerHeight,
    dpr,
    rectHeight,
    scrollHeight: meta.scrollHeight,
    rectBottom: meta.rectBottom,
  });

  // Calculate stream dimensions (must be even for video codec)
  const rawW = Math.ceil(innerWidth * dpr);
  const rawH = Math.ceil(innerHeight * dpr);
  const streamW = rawW % 2 === 0 ? rawW : rawW + 1;
  const streamH = rawH % 2 === 0 ? rawH : rawH + 1;

  // Offsets if we had to pad to even
  const sx = streamW > rawW ? 1 : 0;
  const sy = streamH > rawH ? 1 : 0;
  const contentW = streamW > rawW ? rawW - 2 : rawW;
  const contentH = rawH;

  // 2. Get tab capture stream
  let stream;
  try {
    stream = await getTabStream(streamId, streamW, streamH);
  } catch (err) {
    await sendToContent(tabId, "restore-unroll");
    throw new Error("getUserMedia failed: " + err.message);
  }

  const grabber = new FrameGrabber(stream.getVideoTracks()[0]);

  // Wait a moment for the stream to start producing frames
  await new Promise((r) => setTimeout(r, 10));

  // The viewport height in logical pixels (used as step size)
  const C = innerHeight;

  // Overlap consecutive frames by 2px to prevent black seam lines.
  // CSS translate3d can create sub-pixel rendering artifacts at exact
  // frame boundaries, so a small overlap ensures no gaps.
  const OVERLAP = 2;
  const step = C - OVERLAP;

  // Total frames estimated from rect height
  const totalFrames = Math.ceil(rectHeight / step);

  // 3. Capture loop — matches reference extension logic exactly
  // Reference: uses f (logicalY), checks v.rect.bottom <= h for termination
  const frames = [];
  let logicalY = 0;
  let isDone = false;

  try {
    for (let frameIdx = 0; !isDone; frameIdx++) {
      // Update CSS --scroll-top
      const updateResult = await sendToContent(tabId, "update-unroll", {
        scrollTop: logicalY,
      });

      if (!updateResult || updateResult.abort) {
        isDone = true;
        break;
      }

      // Wait for repaint
      await new Promise((r) => setTimeout(r, frameInterval));

      // Grab frame
      const frame = await grabber.grabFrame();
      // Use PNG for intermediate frames to avoid compression artifacts during stitching
      const blob = await grabber.frameToBlob(frame, "image/png");

      frames.push({
        blob,
        sx,
        sy,
        sw: contentW,
        sh: contentH,
        dy: Math.floor(logicalY * dpr),
      });

      // Report progress
      const progress = Math.min(
        100,
        Math.round(((logicalY + C) / rectHeight) * 100),
      );
      chrome.runtime.sendMessage({
        type: "offscreen-progress",
        tabId,
        progress,
        current: frames.length,
        total: totalFrames,
      });

      // Calculate next scroll position using rect.bottom (reference approach)
      let nextY = logicalY + step;
      const rectBottom = updateResult.rectBottom ?? updateResult.rect?.bottom;

      // Reference termination: v.rect.bottom <= h
      // When the bottom of <html> has scrolled into viewport, we're done
      if (rectBottom !== undefined && rectBottom <= innerHeight) {
        isDone = true;
        break;
      }

      // Also handle case where rectBottom tells us the remaining distance
      if (rectBottom !== undefined && rectBottom - innerHeight < innerHeight) {
        // Last partial frame — adjust position so bottom aligns
        nextY = logicalY + (rectBottom - innerHeight);
      }

      if (nextY <= logicalY) {
        isDone = true;
        break;
      }

      // Safety: don't exceed estimated total
      if (frameIdx >= totalFrames + 5) {
        isDone = true;
        break;
      }

      logicalY = nextY;
    }
  } catch (err) {
    console.error("[offscreen] Capture loop error:", err);
    // Continue to stitching if we have some frames, or cleanup and rethrow
    if (frames.length === 0) {
      stream.getTracks().forEach((t) => t.stop());
      await sendToContent(tabId, "restore-unroll");
      throw err;
    }
  }
  // 5. Stitch frames onto canvas
  if (frames.length === 0) {
    stream.getTracks().forEach((t) => t.stop());
    await sendToContent(tabId, "restore-unroll");
    throw new Error("No frames captured");
  }

  // Strictly clamp the canvas height to the actual passed rectHeight
  // (Prevents the final overlapped frame from dragging the canvas logic downward)
  const canvasHeight = Math.ceil(rectHeight * dpr);

  const canvas = document.createElement("canvas");
  canvas.width = contentW;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d", { alpha: false });

  if (meta.bgColor) {
    ctx.fillStyle = meta.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  for (const f of frames) {
    const bitmap = await createImageBitmap(f.blob);
    const drawH = Math.min(f.sh, canvasHeight - f.dy);
    if (drawH > 0) {
      ctx.drawImage(bitmap, f.sx, f.sy, f.sw, drawH, 0, f.dy, f.sw, drawH);
    }
    bitmap.close();
  }

  // --- Internal Clipboard Write (Silent Attempt) ---
  let clipboardSuccess = false;
  try {
    const pngBlob = await new Promise((r) => canvas.toBlob(r, "image/png"));
    if (pngBlob) {
      clipboardSuccess = await writeToClipboardSilent(pngBlob);
    }
  } catch (err) {
    // Silently fail
  }

  // 6. Cleanup stream and page
  stream.getTracks().forEach((t) => t.stop());
  await sendToContent(tabId, "restore-unroll");

  // Final Blob for download
  const blob = await new Promise((r) => canvas.toBlob(r, format, quality));
  const blobUrl = URL.createObjectURL(blob);

  // Note: We don't revoke here because the UI process needs time to fetch/download it.
  // Revocation should happen after download or when capture finishes in fullpage.js.

  return { blobUrl, clipboardSuccess };
}

// ─── Message Listener ────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "write-image-clipboard") {
    (async () => {
      try {
        const blob = await dataUrlToBlob(msg.dataUrl);
        const success = await writeToClipboardSilent(blob);
        sendResponse({ success });
      } catch (err) {
        console.error("Offscreen clipboard write error:", err);
        sendResponse({ success: false, error: err.message });
      }
    })();

    return true;
  }

  if (msg.type === "start-offscreen-capture") {
    const { streamId, tabId, frameInterval, format, quality } = msg;
    captureFullPage(
      streamId,
      tabId,
      frameInterval || 50,
      format || "image/png",
      quality || 1.0,
    )
      .then((result) => {
        sendResponse({ success: true, ...result });
      })
      .catch((err) => {
        console.error("Offscreen capture error:", err);
        sendResponse({ success: false, error: err.message });
      });
    return true; // async response
  }
});
