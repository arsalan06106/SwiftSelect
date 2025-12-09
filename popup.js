document.addEventListener('DOMContentLoaded', () => {
  const btnVisible = document.getElementById('btn-visible');
  const btnDownload = document.getElementById('btn-download');
  const btnFull = document.getElementById('btn-full');

  function sendMessage(type, closeWindow = true) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab) {
        // Try sending message
        chrome.tabs.sendMessage(tab.id, { type: type }, (response) => {
          if (chrome.runtime.lastError) {
            // If content script is missing, inject it and retry
            if (chrome.runtime.lastError.message.includes("Receiving end does not exist")) {
              chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["contentScript.js"]
              }, () => {
                if (chrome.runtime.lastError) {
                  console.error("Injection failed:", chrome.runtime.lastError);
                  return;
                }
                // Retry message after injection
                setTimeout(() => {
                  chrome.tabs.sendMessage(tab.id, { type: type });
                  if (closeWindow) window.close();
                }, 100);
              });
            } else {
              console.error("Message failed:", chrome.runtime.lastError);
            }
          } else {
            if (closeWindow) window.close();
          }
        });
      }
    });
  }

  // Auto-activate selection mode when popup opens, BUT keep popup open
  sendMessage('start-selection', false);

  if (btnVisible) btnVisible.addEventListener('click', () => sendMessage('capture-visible'));
  if (btnDownload) btnDownload.addEventListener('click', () => sendMessage('capture-download'));
  if (btnFull) btnFull.addEventListener('click', () => sendMessage('capture-full'));
});
