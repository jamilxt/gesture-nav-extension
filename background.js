// Two-Finger Gesture Navigation - Background Service Worker

importScripts('constants.js');

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'gesture') {
    handleGesture(message.action, sender.tab)
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // keep message channel open for async sendResponse
  }
});

// Handle navigation gestures
async function handleGesture(action, tab) {
  if (!tab || !tab.id) {
    throw new Error('No valid tab');
  }

  if (action === 'back') {
    await chrome.tabs.goBack(tab.id);
  } else if (action === 'forward') {
    await chrome.tabs.goForward(tab.id);
  }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({ ...DEFAULT_SETTINGS }, () => {
      if (chrome.runtime.lastError) {
        console.error('Failed to save default settings:', chrome.runtime.lastError.message);
        return;
      }
      chrome.runtime.openOptionsPage();
    });
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (chrome.runtime.lastError || !tabs[0]) return;

    if (command === 'go-back') {
      chrome.tabs.goBack(tabs[0].id).catch(() => {});
    } else if (command === 'go-forward') {
      chrome.tabs.goForward(tabs[0].id).catch(() => {});
    }
  });
});
