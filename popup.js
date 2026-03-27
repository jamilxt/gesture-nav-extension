// Two-Finger Gesture Navigation - Popup Script

// DOM Elements
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const enableToggle = document.getElementById('enableToggle');
const testBack = document.getElementById('testBack');
const testForward = document.getElementById('testForward');
const openOptions = document.getElementById('openOptions');

// Load current settings and update UI
function loadSettings() {
  chrome.storage.local.get({ enabled: true }, (settings) => {
    enableToggle.checked = settings.enabled;
    updateStatus(settings.enabled);
  });
}

// Update status display
function updateStatus(enabled) {
  if (enabled) {
    statusIndicator.classList.remove('disabled');
    statusText.textContent = 'Active on this page';
  } else {
    statusIndicator.classList.add('disabled');
    statusText.textContent = 'Disabled';
  }
}

// Toggle enabled state
enableToggle.addEventListener('change', (e) => {
  const enabled = e.target.checked;
  chrome.storage.local.set({ enabled }, () => {
    updateStatus(enabled);
  });
});

// Test navigation buttons
testBack.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.goBack(tabs[0].id);
    }
  });
});

testForward.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.goForward(tabs[0].id);
    }
  });
});

// Open options page
openOptions.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// Initialize
loadSettings();
