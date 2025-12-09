// background.js - Fixed full page capture implementation

chrome.action.onClicked.addListener((tab) => {
  if (!tab?.id) return;
  injectAndStart(tab);
});

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "activate-selection" && tab?.id) {
    injectAndStart(tab);
  }
});

async function injectAndStart(tab) {
  try {
    const url = tab.url || "";
    if (
      !url ||
      url.startsWith("chrome://") ||
      url.startsWith("edge://") ||
      url.startsWith("about:") ||
      url.startsWith("chrome-extension://")
    ) {
      console.warn("Quick Select Copy cannot run on this page:", url);
      return;
    }

    const tabId = tab.id;
    await chrome.scripting.executeScript({ target: { tabId }, files: ["contentScript.js"] });

    chrome.tabs.sendMessage(tabId, { type: "start-selection" }, () => {
      if (chrome.runtime.lastError) {
        console.warn("sendMessage (start-selection) warning:", chrome.runtime.lastError.message);
      }
    });
  } catch (err) {
    console.error("injectAndStart error:", err);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "capture-visible-tab") {
    const tab = sender.tab;
    if (!tab) {
       sendResponse({ success: false, error: "No tab info" });
       return true;
    }
    
    // Check if the tab is still active
    if (!tab.active) {
       sendResponse({ success: false, error: "Tab is no longer active" });
       return true;
    }

    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, dataUrl });
      }
    });
    return true;
  }

  if (message.type === "update-badge") {
    chrome.action.setBadgeText({ text: message.text });
    if (message.color) {
      chrome.action.setBadgeBackgroundColor({ color: message.color });
    }
  }


});
