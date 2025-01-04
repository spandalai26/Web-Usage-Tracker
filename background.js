let visitData = {};
let activeTab = null;
let startTime = null;
let userCategories = {};

// Load user categories from storage
chrome.storage.local.get(['userCategories'], (result) => {
  userCategories = result.userCategories || {};
});

function getCategory(domain) {
  // Check each category's domain patterns
  // Users can define the categories
  for (const [category, patterns] of Object.entries(userCategories)) {
    if (patterns.some(pattern => domain.includes(pattern))) {
      return category;
    }
  }
  return 'Other';
}

function updateTimeSpent() {
  if (activeTab && startTime) {
    const domain = new URL(activeTab.url).hostname;
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    
    if (visitData[domain]) {
      visitData[domain].totalTime += timeSpent;
      chrome.storage.local.set({ visitData });
    }
  }
}

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (activeTab) {
    updateTimeSpent();
  }
  
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (tab.url) {
    activeTab = tab;
    startTime = Date.now();
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const timestamp = new Date().toISOString();
    const domain = new URL(tab.url).hostname;
    const category = getCategory(domain);
    
    if (!visitData[domain]) {
      visitData[domain] = {
        visits: 0,
        totalTime: 0,
        lastVisit: timestamp,
        category: category
      };
    }
    
    visitData[domain].visits++;
    visitData[domain].category = category; // Update category in case it changed
    chrome.storage.local.set({ visitData });
    
    if (activeTab && activeTab.id === tabId) {
      updateTimeSpent();
    }
    activeTab = tab;
    startTime = Date.now();
  }
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    updateTimeSpent();
    activeTab = null;
    startTime = null;
  }
});
