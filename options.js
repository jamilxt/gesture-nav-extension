// Two-Finger Gesture Navigation - Options Page Script
// Depends on constants.js (loaded before this script)

// DOM Elements
const elements = {
  enabled: document.getElementById('enabled'),
  reverseDirection: document.getElementById('reverseDirection'),
  sensitivity: document.getElementById('sensitivity'),
  sensitivityValue: document.getElementById('sensitivityValue'),
  cooldown: document.getElementById('cooldown'),
  cooldownValue: document.getElementById('cooldownValue'),
  showIndicator: document.getElementById('showIndicator'),
  indicatorColor: document.getElementById('indicatorColor'),
  indicatorSize: document.getElementById('indicatorSize'),
  indicatorSizeValue: document.getElementById('indicatorSizeValue'),
  indicatorPosition: document.getElementById('indicatorPosition'),
  demoIndicator: document.getElementById('demoIndicator'),
  saveStatus: document.getElementById('saveStatus'),
  versionText: document.getElementById('versionText')
};

// Load current settings
function loadSettings() {
  chrome.storage.local.get(DEFAULT_SETTINGS, (settings) => {
    if (chrome.runtime.lastError) {
      console.error('Failed to load settings:', chrome.runtime.lastError.message);
      return;
    }

    const validated = validateSettings(settings);

    elements.enabled.checked = validated.enabled;
    elements.reverseDirection.checked = validated.reverseDirection;
    elements.sensitivity.value = validated.sensitivity;
    elements.sensitivityValue.textContent = validated.sensitivity;
    elements.cooldown.value = validated.cooldown;
    elements.cooldownValue.textContent = validated.cooldown;
    elements.showIndicator.checked = validated.showIndicator;
    elements.indicatorColor.value = validated.indicatorColor;
    elements.indicatorSize.value = validated.indicatorSize;
    elements.indicatorSizeValue.textContent = validated.indicatorSize;
    elements.indicatorPosition.value = validated.indicatorPosition;

    updatePreview(validated);
  });
}

// Save settings
function saveSettings() {
  const settings = {
    enabled: elements.enabled.checked,
    reverseDirection: elements.reverseDirection.checked,
    sensitivity: parseInt(elements.sensitivity.value, 10),
    cooldown: parseInt(elements.cooldown.value, 10),
    showIndicator: elements.showIndicator.checked,
    indicatorColor: elements.indicatorColor.value,
    indicatorSize: parseInt(elements.indicatorSize.value, 10),
    indicatorPosition: elements.indicatorPosition.value
  };

  const validated = validateSettings(settings);

  chrome.storage.local.set(validated, () => {
    if (chrome.runtime.lastError) {
      console.error('Failed to save settings:', chrome.runtime.lastError.message);
      return;
    }
    showSaveStatus();
    updatePreview(validated);
  });
}

// Debounce utility for range sliders
let saveDebounceTimer = null;
function debouncedSave() {
  clearTimeout(saveDebounceTimer);
  saveDebounceTimer = setTimeout(saveSettings, 250);
}

// Show save status notification
function showSaveStatus() {
  elements.saveStatus.classList.add('show');
  setTimeout(() => {
    elements.saveStatus.classList.remove('show');
  }, 2000);
}

// Update preview indicator
function updatePreview(settings) {
  const demo = elements.demoIndicator;
  demo.style.background = settings.indicatorColor;
  demo.style.width = Math.min(settings.indicatorSize, 48) + 'px';
  demo.style.height = Math.min(settings.indicatorSize, 48) + 'px';
  demo.style.opacity = settings.showIndicator ? '1' : '0.3';
}

// Event listeners — toggles save immediately, sliders are debounced
elements.enabled.addEventListener('change', saveSettings);
elements.reverseDirection.addEventListener('change', saveSettings);
elements.showIndicator.addEventListener('change', saveSettings);
elements.indicatorPosition.addEventListener('change', saveSettings);

elements.sensitivity.addEventListener('input', (e) => {
  elements.sensitivityValue.textContent = e.target.value;
  debouncedSave();
});

elements.cooldown.addEventListener('input', (e) => {
  elements.cooldownValue.textContent = e.target.value;
  debouncedSave();
});

elements.indicatorColor.addEventListener('input', debouncedSave);

elements.indicatorSize.addEventListener('input', (e) => {
  elements.indicatorSizeValue.textContent = e.target.value;
  debouncedSave();
});

// Set dynamic version from manifest
if (elements.versionText) {
  elements.versionText.textContent = `v${chrome.runtime.getManifest().version}`;
}

// Initialize
loadSettings();
