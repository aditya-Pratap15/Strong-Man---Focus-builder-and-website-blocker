// Content script for Strong Man extension
// Monitors page timing and triggers overlay when needed

let monitoringActive = false;
let isBlocked = false;
let timerStartTime = null;
let settings = null;
let warningShown = false;
let overlayInjected = false;

// Check with background script if this URL should be monitored
async function checkCurrentUrl() {
  const currentUrl = window.location.href;
  
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: 'checkUrl', url: currentUrl },
      (response) => {
        if (chrome.runtime.lastError) {
          resolve({ shouldMonitor: false, isBlocked: false });
        } else {
          resolve(response);
        }
      }
    );
  });
}

// Inject blur overlay
function injectOverlay(countdown = 5) {
  if (overlayInjected) return;
  overlayInjected = true;
  
  // Create overlay container
  const overlay = document.createElement('div');
  overlay.id = 'strong-man-overlay';
  overlay.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    backdrop-filter: blur(20px) !important;
    background: rgba(0, 0, 0, 0.7) !important;
    z-index: 2147483647 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
  `;
  
  // Create message container
  const messageBox = document.createElement('div');
  messageBox.style.cssText = `
    background: white !important;
    padding: 40px !important;
    border-radius: 16px !important;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3) !important;
    text-align: center !important;
    max-width: 500px !important;
    animation: fadeIn 0.3s ease-out !important;
  `;
  
  // Add countdown text
  const countdownText = document.createElement('h2');
  countdownText.id = 'strong-man-countdown';
  countdownText.style.cssText = `
    font-size: 48px !important;
    color: #2563eb !important;
    margin: 0 0 20px 0 !important;
    font-weight: 700 !important;
  `;
  countdownText.textContent = countdown;
  
  // Add message
  const message = document.createElement('p');
  message.style.cssText = `
    font-size: 18px !important;
    color: #374151 !important;
    margin: 0 !important;
    line-height: 1.6 !important;
  `;
  message.textContent = 'Site will lock in 5 seconds. Redirect your focus, Strong Man.';
  
  messageBox.appendChild(countdownText);
  messageBox.appendChild(message);
  overlay.appendChild(messageBox);
  
  // Inject styles for animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(overlay);
  
  // Start countdown
  let remaining = countdown;
  const countdownInterval = setInterval(() => {
    remaining--;
    const countdownEl = document.getElementById('strong-man-countdown');
    if (countdownEl) {
      countdownEl.textContent = remaining;
    }
    
    if (remaining <= 0) {
      clearInterval(countdownInterval);
      lockSite();
    }
  }, 1000);
}

// Lock the site and redirect to pause screen
function lockSite() {
  chrome.runtime.sendMessage(
    { action: 'lockSite', url: window.location.href },
    (response) => {
      // Background script will handle redirect
    }
  );
}

// Main monitoring logic
async function startMonitoring() {
  const result = await checkCurrentUrl();
  
  if (result.isBlocked) {
    // Site is already blocked, background will redirect
    return;
  }
  
  if (!result.shouldMonitor) {
    return; // Not a monitored site
  }
  
  settings = result.settings;
  monitoringActive = true;
  timerStartTime = Date.now();
  warningShown = false;
  overlayInjected = false;
  
  // Start checking timer
  checkTimer();
}

// Check if timer threshold is reached
function checkTimer() {
  if (!monitoringActive) return;
  
  const elapsedSeconds = Math.floor((Date.now() - timerStartTime) / 1000);
  const timerDuration = settings?.timerDuration || 55;
  const warningDuration = 5; // 5 second warning
  
  if (elapsedSeconds >= timerDuration && !warningShown) {
    // Show warning and start countdown
    warningShown = true;
    injectOverlay(warningDuration);
    return; // Overlay handles the rest
  }
  
  if (elapsedSeconds < timerDuration + warningDuration) {
    // Keep checking
    setTimeout(checkTimer, 1000);
  }
}

// Stop monitoring when user navigates away
window.addEventListener('beforeunload', () => {
  monitoringActive = false;
});

// Start monitoring on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startMonitoring);
} else {
  startMonitoring();
}