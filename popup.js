document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['visitData'], (result) => {
      const statsDiv = document.getElementById('stats');
      const visitData = result.visitData || {};
      
      Object.entries(visitData)
        .sort(([,a], [,b]) => b.visits - a.visits)
        .forEach(([domain, data]) => {
          const div = document.createElement('div');
          div.className = 'site';
          div.textContent = `${domain}: ${data.visits} visits`;
          statsDiv.appendChild(div);
        });
    });
  });