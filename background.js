let visitData = {};

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const timestamp = new Date().toISOString();
    const domain = new URL(tab.url).hostname;
    
    if (!visitData[domain]) {
      visitData[domain] = {
        visits: 0,
        totalTime: 0,
        lastVisit: timestamp
      };
    }
    
    visitData[domain].visits++;
    chrome.storage.local.set({ visitData });
  }
});