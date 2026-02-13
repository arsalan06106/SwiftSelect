// contentScript.js - Orchestrator
(() => {
  if (window.__qsInjected) return;
  // Guard ensures init only runs once. Re-activation is handled by
  // "start-selection" message listener below.
  window.__qsInjected = true;

  // Initialize Modules
  if (window.SwiftSelect && window.SwiftSelect.theme) {
    window.SwiftSelect.theme.init();
  }
  if (window.SwiftSelect && window.SwiftSelect.events) {
    window.SwiftSelect.events.init();
  }

  function startSelection() {
    window.SwiftSelect.ui.ensureUi();
    window.SwiftSelect.events.addListeners();
  }

  // Auto-start if needed (e.g. re-injection) but usually triggered by message
  // startSelection();

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!request || !request.type) return;
    try {
      if (request.type === "start-selection") {
        startSelection();
        sendResponse({ success: true });
      } else if (request.type === "capture-visible") {
        window.SwiftSelect.capture.handleCaptureVisible();
        sendResponse({ success: true });
      } else if (request.type === "capture-download") {
        window.SwiftSelect.capture.handleCaptureAndDownload();
        sendResponse({ success: true });
      } else if (request.type === "capture-full") {
        window.SwiftSelect.capture.handleCaptureFullPage();
        sendResponse({ success: true });
      } else if (request.type === "fullpage-action") {
        const { action, data } = request;
        if (action === "unroll-page") {
          const result = window.SwiftSelect.capture.handleUnrollPage();
          sendResponse(result);
        } else if (action === "update-unroll") {
          const result = window.SwiftSelect.capture.handleUpdateUnroll(
            data.scrollTop,
          );
          sendResponse(result);
        } else if (action === "restore-unroll") {
          window.SwiftSelect.capture.handleRestoreUnroll();
          sendResponse({ ok: true });
        } else {
          sendResponse(null);
        }
      } else if (request.type === "fullpage-progress") {
        const { progress } = request;
        window.SwiftSelect.ui.updateBadge(progress + "%");

        // Update UI button text if visible
        const btn = window.SwiftSelect.ui.guideShadow?.querySelector(
          '[data-action="capture-full"]',
        );
        if (btn) {
          const span = btn.querySelector(".qs-progress-text");
          if (span) span.textContent = progress + "%";
        }
      }
    } catch (e) {
      console.error("SwiftSelect Message Error:", e);
      sendResponse({ success: false, error: e.message });
    }
  });

  console.log("SwiftSelect Content Script Orchestrator Loaded");
})();
