// Settings page logic
// Handles loading, saving, and resetting user preferences
const DEFAULT_SETTINGS = {
  timerDuration: 55,
  cooldownDuration: 5,
  personalMessage: "Take a moment to refocus. You're building strength through self-control.",
  enabled: true
};

// DOM elements
const enabledCheckbox = document.getElementById('enabled');
const timerInput = document.getElementById('timer-duration');
const cooldownInput = document.getElementById('cooldown-duration');
const messageTextarea = document.getElementById('personal-message');
const saveBtn = document.getElementById('save-btn');
const resetBtn = document.getElementById('reset-btn');
const saveMessage = document.getElementById('save-message');

// Load current settings from storage
function loadSettings() {
  chrome.storage.sync.get(['settings'], (result) => {
    const settings = result.settings || DEFAULT_SETTINGS;
    
    enabledCheckbox.checked = settings.enabled;
    timerInput.value = settings.timerDuration;
    cooldownInput.value = settings.cooldownDuration;
    messageTextarea.value = settings.personalMessage;
  });
}

// Save settings to storage
function saveSettings() {
  const settings = {
    enabled: enabledCheckbox.checked,
    timerDuration: parseInt(timerInput.value),
    cooldownDuration: parseInt(cooldownInput.value),
    personalMessage: messageTextarea.value
  };

  chrome.storage.sync.set({ settings }, () => {
    // Show success message
    saveMessage.classList.remove('hidden');
    
    // Hide message after 3 seconds
    setTimeout(() => {
      saveMessage.classList.add('hidden');
    }, 3000);
    
    // Notify background script that settings have changed
    chrome.runtime.sendMessage({ action: 'settingsUpdated', settings });
  });
}

// Reset settings to default
function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to default?')) {
    chrome.storage.sync.set({ settings: DEFAULT_SETTINGS }, () => {
      loadSettings();
      saveMessage.textContent = "✓ Reset to defaults";
      saveMessage.classList.remove('hidden');
      setTimeout(() => {
        saveMessage.classList.add('hidden');
        saveMessage.textContent = "✓ Settings saved successfully";
      }, 3000);
    });
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', loadSettings);
saveBtn.addEventListener('click', saveSettings);
resetBtn.addEventListener('click', resetSettings);