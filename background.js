// Two-Finger Gesture Navigation - Background Service Worker

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'gesture') {
    handleGesture(message.action, sender.tab);
    return true;
  }
});

// Handle navigation gestures
async function handleGesture(action, tab) {
  if (!tab || !tab.id) return;

  try {
    // Navigate the tab
    if (action === 'back') {
      await chrome.tabs.goBack(tab.id);
    } else if (action === 'forward') {
      await chrome.tabs.goForward(tab.id);
    }
  } catch (error) {
    // Tab might have been closed or navigation not possible
    console.log('Navigation not possible:', error.message);
  }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default settings on install
    chrome.storage.local.set({
      enabled: true,
      sensitivity: 100,
      cooldown: 300,
      reverseDirection: true,
      showIndicator: false,
      indicatorColor: '#4285f4',
      indicatorSize: 60,
      indicatorPosition: 'bottom-right'
    });

    // Open options page on first install
    chrome.runtime.openOptionsPage();
  }
});

// Handle keyboard shortcuts (optional - can be configured in chrome://extensions/shortcuts)
chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      if (command === 'go-back') {
        chrome.tabs.goBack(tabs[0].id);
      } else if (command === 'go-forward') {
        chrome.tabs.goForward(tabs[0].id);
      }
    }
  });
});
