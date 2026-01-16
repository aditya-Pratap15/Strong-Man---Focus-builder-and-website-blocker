// Overlay countdown script
// This file is primarily for standalone overlay.html (if used separately)

let countdown = 5;
const countdownEl = document.getElementById('countdown');

const interval = setInterval(() => {
  countdown--;
  if (countdownEl) {
    countdownEl.textContent = countdown;
  }
  
  if (countdown <= 0) {
    clearInterval(interval);
    // Redirect will be handled by background script
  }
}, 1000);