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
    if (chrome.runtime.lastError) {
      console.error('Failed to load settings:', chrome.runtime.lastError.message);
      return;
    }
    enableToggle.checked = settings.enabled;
    updateStatus(settings.enabled);
  });
}

// Check if current tab is a restricted page where the extension cannot run
function checkCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (chrome.runtime.lastError || !tabs[0]) return;

    const url = tabs[0].url || tabs[0].pendingUrl || '';
    // url may be empty if we lack permission to read it — skip the check in that case
    if (url && (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('edge://') || url.startsWith('about:'))) {
      statusIndicator.classList.add('disabled');
      statusText.textContent = 'Cannot run on this page';
      testBack.disabled = true;
      testForward.disabled = true;
      testBack.style.opacity = '0.5';
      testForward.style.opacity = '0.5';
    }
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
    if (chrome.runtime.lastError) {
      console.error('Failed to save settings:', chrome.runtime.lastError.message);
      return;
    }
    updateStatus(enabled);
  });
});

// Test navigation buttons
testBack.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (chrome.runtime.lastError || !tabs[0]) return;
    chrome.tabs.goBack(tabs[0].id).catch(() => {});
  });
});

testForward.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (chrome.runtime.lastError || !tabs[0]) return;
    chrome.tabs.goForward(tabs[0].id).catch(() => {});
  });
});

// Open options page
openOptions.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// Initialize
loadSettings();
checkCurrentTab();
