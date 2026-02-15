// background.js - Full page capture with tab capture stream + offscreen document

chrome.action.onClicked.addListener((tab) => {
  if (!tab?.id) return;
  injectAndStart(tab, "start-selection");
});

chrome.commands.onCommand.addListener((command, tab) => {
  if (!tab?.id) return;

  if (command === "activate-selection") {
    injectAndStart(tab, "start-selection");
  } else if (command === "capture-visible-download") {
    injectAndStart(tab, "capture-download");
  } else if (command === "capture-full-page") {
    injectAndStart(tab, "capture-full");
  }
});

async function injectAndStart(tab, messageType) {
  try {
    const url = tab.url || "";
    if (
      !url ||
      url.startsWith("chrome://") ||
      url.startsWith("edge://") ||
      url.startsWith("about:") ||
      url.startsWith("chrome-extension://") ||
      url.startsWith("https://chrome.google.com/webstore") ||
      url.startsWith("https://chromewebstore.google.com")
    ) {
      console.warn("Quick Select Copy cannot run on this page:", url);
      return;
    }

    const tabId = tab.id;
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["contentScript.js"],
    });

    chrome.tabs.sendMessage(tabId, { type: messageType }, () => {
      if (chrome.runtime.lastError) {
        console.warn(
          `sendMessage (${messageType}) warning:`,
          chrome.runtime.lastError.message,
        );
      }
    });
  } catch (err) {
    if (err.message.includes("extensions gallery cannot be scripted")) {
      console.warn("Cannot run on extension gallery page.");
    } else {
      console.error("injectAndStart error:", err);
    }
  }
}

// ─── Offscreen Document Management ───────────────────────────────────

let offscreenCreating = null;

async function ensureOffscreen() {
  const existing = await chrome.offscreen.hasDocument();
  if (existing) return;

  if (offscreenCreating) {
    await offscreenCreating;
    return;
  }

  offscreenCreating = chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: ["USER_MEDIA", "CLIPBOARD"],
    justification:
      "Tab capture for full page screenshot and clipboard write support",
  });

  await offscreenCreating;
  offscreenCreating = null;
}

async function closeOffscreen() {
  try {
    const existing = await chrome.offscreen.hasDocument();
    if (existing) {
      await chrome.offscreen.closeDocument();
    }
  } catch (e) {
    // ignore
  }
}

// ─── Message Handler ─────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // --- Legacy: capture-visible-tab (used for region capture) ---
  if (message?.type === "capture-visible-tab") {
    const tab = sender.tab;
    if (!tab) {
      sendResponse({ success: false, error: "No tab info" });
      return true;
    }
    if (!tab.active) {
      sendResponse({ success: false, error: "Tab is no longer active" });
      return true;
    }

    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message,
        });
      } else {
        sendResponse({ success: true, dataUrl });
      }
    });
    return true;
  }

  // --- New: Start full page capture via offscreen document ---
  if (message?.type === "start-fullpage-capture") {
    const tabId = sender.tab?.id;
    if (!tabId) {
      sendResponse({ success: false, error: "No tab ID" });
      return true;
    }

    (async () => {
      try {
        // 1. Get a media stream ID for this tab
        const streamId = await chrome.tabCapture.getMediaStreamId({
          targetTabId: tabId,
        });

        // 2. Ensure offscreen document is open
        await ensureOffscreen();

        // 3. Send capture request to offscreen document
        const result = await chrome.runtime.sendMessage({
          type: "start-offscreen-capture",
          streamId,
          tabId,
          frameInterval: message.frameInterval || 150,
          format: message.format,
          quality: message.quality,
        });

        sendResponse(result);
      } catch (err) {
        console.error("start-fullpage-capture error:", err);
        sendResponse({ success: false, error: err.message });
      } finally {
        // 4. Always close offscreen document
        await closeOffscreen();
      }
    })();

    return true; // async response
  }

  // --- Relay: offscreen → content script ---
  if (message?.type === "offscreen-to-content") {
    const { tabId, action, data } = message;
    chrome.tabs.sendMessage(
      tabId,
      { type: "fullpage-action", action, data },
      (response) => {
        if (chrome.runtime.lastError) {
          sendResponse(null);
        } else {
          sendResponse(response);
        }
      },
    );
    return true;
  }

  // --- Relay: progress from offscreen → content script ---
  if (message?.type === "offscreen-progress") {
    const { tabId, progress, current, total } = message;
    chrome.tabs.sendMessage(tabId, {
      type: "fullpage-progress",
      progress,
      current,
      total,
    });
    // No response needed
    return false;
  }

  // --- Badge updates ---
  if (message?.type === "update-badge") {
    chrome.action.setBadgeText({ text: message.text });
    if (message.color) {
      chrome.action.setBadgeBackgroundColor({ color: message.color });
    }
  }
});
