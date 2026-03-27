// Two-Finger Gesture Navigation - Options Page Script

// Default settings
const DEFAULT_SETTINGS = {
  enabled: true,
  sensitivity: 100,
  cooldown: 300,
  reverseDirection: true,
  showIndicator: false,
  indicatorColor: '#4285f4',
  indicatorSize: 60,
  indicatorPosition: 'bottom-right'
};

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
  saveStatus: document.getElementById('saveStatus')
};

// Load current settings
function loadSettings() {
  chrome.storage.local.get(DEFAULT_SETTINGS, (settings) => {
    // Apply settings to form
    elements.enabled.checked = settings.enabled;
    elements.reverseDirection.checked = settings.reverseDirection;
    elements.sensitivity.value = settings.sensitivity;
    elements.sensitivityValue.textContent = settings.sensitivity;
    elements.cooldown.value = settings.cooldown;
    elements.cooldownValue.textContent = settings.cooldown;
    elements.showIndicator.checked = settings.showIndicator;
    elements.indicatorColor.value = settings.indicatorColor;
    elements.indicatorSize.value = settings.indicatorSize;
    elements.indicatorSizeValue.textContent = settings.indicatorSize;
    elements.indicatorPosition.value = settings.indicatorPosition || 'sides';

    // Update preview
    updatePreview(settings);
  });
}

// Save settings
function saveSettings() {
  const settings = {
    enabled: elements.enabled.checked,
    reverseDirection: elements.reverseDirection.checked,
    sensitivity: parseInt(elements.sensitivity.value),
    cooldown: parseInt(elements.cooldown.value),
    showIndicator: elements.showIndicator.checked,
    indicatorColor: elements.indicatorColor.value,
    indicatorSize: parseInt(elements.indicatorSize.value),
    indicatorPosition: elements.indicatorPosition.value
  };

  chrome.storage.local.set(settings, () => {
    showSaveStatus();
    updatePreview(settings);
  });
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

// Event listeners
elements.enabled.addEventListener('change', saveSettings);
elements.reverseDirection.addEventListener('change', saveSettings);
elements.showIndicator.addEventListener('change', saveSettings);

elements.sensitivity.addEventListener('input', (e) => {
  elements.sensitivityValue.textContent = e.target.value;
  saveSettings();
});

elements.cooldown.addEventListener('input', (e) => {
  elements.cooldownValue.textContent = e.target.value;
  saveSettings();
});

elements.indicatorColor.addEventListener('input', saveSettings);

elements.indicatorSize.addEventListener('input', (e) => {
  elements.indicatorSizeValue.textContent = e.target.value;
  saveSettings();
});

elements.indicatorPosition.addEventListener('change', saveSettings);

// Initialize
loadSettings();
