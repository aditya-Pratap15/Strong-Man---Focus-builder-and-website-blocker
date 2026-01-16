// Pause screen logic
// Displays personal message and breathing exercise

// Load and display settings
chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
  if (response && response.settings) {
    const settings = response.settings;
    
    // Display personal message
    const messageEl = document.getElementById('personal-message');
    if (messageEl) {
      messageEl.textContent = settings.personalMessage;
    }
    
    // Display cooldown info
    const cooldownEl = document.getElementById('cooldown-message');
    if (cooldownEl) {
      cooldownEl.textContent = `This site is paused for ${settings.cooldownDuration} minutes to help you refocus.`;
    }
  }
});

// Update breathing text animation
const breathingText = document.getElementById('breathing-text');
if (breathingText) {
  let isInhale = true;
  setInterval(() => {
    isInhale = !isInhale;
    breathingText.textContent = isInhale ? 'Breathe In' : 'Breathe Out';
  }, 4000); // 4 seconds per phase (8 second total cycle)
}

// Settings button handler
document.getElementById('settings-btn')?.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});