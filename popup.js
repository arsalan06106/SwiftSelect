document.addEventListener("DOMContentLoaded", () => {
  const btnVisible = document.getElementById("btn-visible");
  const btnDownload = document.getElementById("btn-download");
  const btnFull = document.getElementById("btn-full");
  const container = document.body;

  function showUnsupported() {
    container.innerHTML = `
      <div style="padding: 12px; color: #d93025; font-size: 13px; text-align: center; width: 200px;">
        SwiftSelect cannot run on system pages or the Chrome Web Store.
      </div>
    `;
  }

  function checkUrl(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.url) return;

      if (
        tab.url.startsWith("chrome://") ||
        tab.url.startsWith("edge://") ||
        tab.url.startsWith("https://chrome.google.com/webstore") ||
        tab.url.startsWith("https://chromewebstore.google.com")
      ) {
        showUnsupported();
      } else {
        callback(tab);
      }
    });
  }

  function sendMessage(type, closeWindow = true) {
    checkUrl((tab) => {
      chrome.tabs.sendMessage(tab.id, { type: type }, (response) => {
        if (chrome.runtime.lastError) {
          if (
            chrome.runtime.lastError.message.includes(
              "Receiving end does not exist",
            )
          ) {
            chrome.scripting.executeScript(
              {
                target: { tabId: tab.id },
                files: ["contentScript.js"],
              },
              () => {
                if (chrome.runtime.lastError) {
                  console.error("Injection failed:", chrome.runtime.lastError);
                  return;
                }
                setTimeout(() => {
                  chrome.tabs.sendMessage(tab.id, { type: type });
                  if (closeWindow) window.close();
                }, 150);
              },
            );
          } else {
            console.error("Message failed:", chrome.runtime.lastError);
          }
        } else {
          if (closeWindow) window.close();
        }
      });
    });
  }

  // Auto-activate
  sendMessage("start-selection", false);

  if (btnVisible)
    btnVisible.addEventListener("click", () => sendMessage("capture-visible"));
  if (btnDownload)
    btnDownload.addEventListener("click", () =>
      sendMessage("capture-download"),
    );
  if (btnFull)
    btnFull.addEventListener("click", () => sendMessage("capture-full"));
});
