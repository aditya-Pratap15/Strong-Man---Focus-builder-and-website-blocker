// Service worker for Strong Man extension
// Handles site blocking logic and cooldown management

// Default settings
const DEFAULT_SETTINGS = {
  timerDuration: 55, // seconds before warning
  cooldownDuration: 5, // minutes of blocking
  personalMessage: "Take a moment to refocus. You're building strength through self-control.",
  enabled: true
};

// Local list of adult-content domains (expandable)
const DETECTED_PATTERNS = [
  'pornhub.com',
  'xvideos.com',
  'xnxx.com',
  'redtube.com',
  'youporn.com',
  'xhamster.com',
  'tube8.com',
  'spankwire.com',
  'keezmovies.com',
  'extremetube.com',
  'faphouse.tv',
  'xhamster19.com',
  'google.com'
  // Add more patterns as needed
  // Users can expand this list safely
];

// Storage for blocked sites and their cooldown expiry times
let blockedSites = {}; // { domain: expiryTimestamp }

// Initialize settings on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['settings'], (result) => {
    if (!result.settings) {
      chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
    }
  });
});

// Check if a URL matches detected patterns
function matchesDetectedPattern(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    return DETECTED_PATTERNS.some(pattern => {
      return hostname.includes(pattern) || hostname.endsWith(pattern);
    });
  } catch (e) {
    return false;
  }
}

// Check if site is currently in cooldown
function isSiteBlocked(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const now = Date.now();
    
    // Clean up expired blocks
    if (blockedSites[hostname] && blockedSites[hostname] < now) {
      delete blockedSites[hostname];
      return false;
    }
    
    return blockedSites[hostname] && blockedSites[hostname] > now;
  } catch (e) {
    return false;
  }
}

// Block a site for the cooldown duration
function blockSite(url, cooldownMinutes) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const expiryTime = Date.now() + (cooldownMinutes * 60 * 1000);
    
    blockedSites[hostname] = expiryTime;
  } catch (e) {
    console.error('Error blocking site:', e);
  }
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkUrl') {
    const matches = matchesDetectedPattern(request.url);
    const blocked = isSiteBlocked(request.url);
    
    chrome.storage.sync.get(['settings'], (result) => {
      const settings = result.settings || DEFAULT_SETTINGS;
      
      sendResponse({
        shouldMonitor: matches && settings.enabled,
        isBlocked: blocked,
        settings: settings
      });
    });
    
    return true; // Async response
  }
  
  if (request.action === 'lockSite') {
    chrome.storage.sync.get(['settings'], (result) => {
      const settings = result.settings || DEFAULT_SETTINGS;
      blockSite(request.url, settings.cooldownDuration);
      
      // Redirect to pause screen
      chrome.tabs.update(sender.tab.id, {
        url: chrome.runtime.getURL('pause-screen.html')
      });
      
      sendResponse({ success: true });
    });
    
    return true;
  }
  
  if (request.action === 'getSettings') {
    chrome.storage.sync.get(['settings'], (result) => {
      sendResponse({ settings: result.settings || DEFAULT_SETTINGS });
    });
    
    return true;
  }
});

// Monitor tab updates to check for blocked sites
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url) {
    if (isSiteBlocked(tab.url)) {
      // Redirect immediately if site is in cooldown
      chrome.tabs.update(tabId, {
        url: chrome.runtime.getURL('pause-screen.html')
      });
    }
  }
});