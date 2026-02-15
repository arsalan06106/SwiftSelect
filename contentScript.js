/**
 * main content script entry point
 */

if (window.__swiftSelectInjected_v2) {
  // Already injected
} else {
  window.SwiftSelect = window.SwiftSelect || {};
  window.__swiftSelectInjected_v2 = true;

  (async () => {
    // We use dynamic imports for the bundled ES modules
    const theme = await import(chrome.runtime.getURL("src/theme.js"));
    const ui = await import(chrome.runtime.getURL("src/ui.js"));
    const events = await import(chrome.runtime.getURL("src/events.js"));
    const region = await import(chrome.runtime.getURL("src/capture/region.js"));
    const fullpage = await import(
      chrome.runtime.getURL("src/capture/fullpage.js")
    );

    // Initialize namespace bridge
    window.SwiftSelect.theme = theme;
    window.SwiftSelect.ui = ui;
    window.SwiftSelect.events = events;
    window.SwiftSelect.capture = { ...region, ...fullpage };

    // Initial theme setup
    theme.init();

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "start-selection") {
        ui.ensureUi();
        events.addListeners();
      } else if (message.type === "capture-download") {
        region.handleCaptureAndDownload();
      } else if (message.type === "capture-full") {
        fullpage.handleCaptureFullPage();
      } else if (message.type === "fullpage-progress") {
        // Progress from background/offscreen
        const ps = document.querySelector(".qs-progress-text");
        if (ps) ps.textContent = `${message.progress}%`;
        chrome.runtime.sendMessage({
          type: "update-badge",
          text: `${message.progress}%`,
        });
      } else if (message.type === "fullpage-action") {
        const { action, data } = message;
        if (action === "unroll-page") {
          sendResponse(fullpage.handleUnrollPage());
        } else if (action === "update-unroll") {
          sendResponse(fullpage.handleUpdateUnroll(data.scrollTop));
        } else if (action === "restore-unroll") {
          fullpage.handleRestoreUnroll();
          sendResponse({ success: true });
        }
        return true; // async for fullpage-action
      }
    });
  })();
}
