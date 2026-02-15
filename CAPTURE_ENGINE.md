# Capture Engine

SwiftSelect supports three capture modes. Each uses a different pipeline internally.

<br>

## Region Capture

Triggered when the user draws a selection box on the page.

### Pipeline

1. User drags to create a rectangle. `events.js` tracks pointer coordinates and updates the selection box in real time via `requestAnimationFrame`.
2. On `pointerup`, the selection rectangle (in viewport coordinates) is passed to `captureAndCrop()` in `region.js`.
3. `captureAndCrop()` sends a `capture-visible-tab` message to `background.js`.
4. `background.js` calls `chrome.tabs.captureVisibleTab()`, which returns a full-viewport PNG as a data URL.
5. The data URL is loaded into an `Image`, drawn onto a `<canvas>`, then cropped to the selection rectangle using `drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh)`.
6. The cropped canvas is converted to a PNG blob.
7. The blob is written to the clipboard via `navigator.clipboard.write()`.

### DPR Handling

Screen coordinates are multiplied by `window.devicePixelRatio` when mapping to the captured image, because `captureVisibleTab` captures at native resolution.

### Clipboard Fallback

If `navigator.clipboard.write()` fails (some pages block it), the extension falls back to an automatic file download and shows a status message indicating the clipboard was blocked.

<br>

## Visible Area Capture

Triggered via the toolbar eye button or `Alt+S` shortcut.

This is simpler than region capture: it grabs the entire viewport without cropping.

1. The UI is hidden (toolbar, overlay, highlighter all set to `display: none`).
2. A brief delay (`requestAnimationFrame` + 100ms) ensures the browser finishes painting without the extension UI.
3. `captureVisibleTab()` grabs the viewport.
4. The result is written to clipboard and/or downloaded.

<br>

## Full-Page Capture

Triggered via the toolbar scroll button or `Alt+F` shortcut. This is the most complex pipeline.

### Why Not Just ScrollY + CaptureVisibleTab?

Calling `captureVisibleTab` in a loop while scrolling with `window.scrollTo()` sounds straightforward, but it breaks on:

- SPAs that use internal scroll containers instead of the document body
- Pages with sticky/fixed headers and footers that appear in every frame
- Lazy-loaded content that has not rendered yet at scroll positions
- Canvas-heavy pages where `captureVisibleTab` timing is unpredictable

SwiftSelect solves these with a scroll-unroll + tab-capture-stream approach.

### Pipeline

1. `fullpage.js` sends `start-fullpage-capture` to `background.js`.
2. `background.js` creates an offscreen document (`offscreen.html` + `offscreen.js`) if one does not exist.
3. `offscreen.js` starts a `tabCapture` media stream via `chrome.tabCapture.getMediaStreamId()` → `navigator.mediaDevices.getUserMedia()`.
4. An `ImageCapture` instance is created from the video track.

### Sticky Element Neutralisation

Before scrolling begins, `fullpage.js` runs `neutralizeStickyElements()`:

- A `TreeWalker` scans every element on the page.
- Any element with `position: fixed` or `position: sticky` is converted to `position: absolute` at its current document-relative coordinates.
- Original styles are saved so they can be restored after capture.

This prevents headers, navbars, and floating buttons from appearing in every captured frame.

### The Scroll-and-Stitch Loop

1. The page is unrolled: overflow is set to visible, the scroll container height is measured.
2. The offscreen document scrolls the page by setting `scrollTop` via the content script.
3. After each scroll, `ImageCapture.grabFrame()` captures the current frame.
4. A `FrameDetector` class downsamples each frame to 10×10 pixels and compares it to the previous frame to confirm the browser has actually repainted. If the frame is identical, it retries.
5. Each frame is converted to a blob and stored.
6. Progress is reported back to the content script, which updates the on-page progress indicator and the extension badge.

### Stitching

After all frames are captured:

1. A full-height canvas is created matching the total scroll height.
2. Each frame is drawn at its corresponding vertical offset.
3. The final canvas is converted to a PNG blob.
4. The blob is downloaded as a file (full-page captures are too large for clipboard in most cases).

### Cleanup

After capture (success or failure):

- Sticky elements are restored to their original styles.
- The unroll styles are removed.
- The offscreen document is closed.
- The progress UI and badge are cleared.