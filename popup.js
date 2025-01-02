function formatTime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelectorAll('.tab-button').forEach(button => {
    button.classList.remove('active');
  });
  
  document.getElementById(tabId).classList.add('active');
  document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
}

function updateCategoryList() {
  chrome.storage.local.get(['userCategories'], (result) => {
    const categories = result.userCategories || {};
    const categoryList = document.getElementById('categoryList');
    categoryList.innerHTML = '';
    
    Object.entries(categories).forEach(([category, patterns]) => {
      const div = document.createElement('div');
      div.className = 'category-item';
      div.innerHTML = `
        <strong>${category}</strong>: ${patterns.join(', ')}
        <span class="delete-btn" data-category="${category}">×</span>
      `;
      categoryList.appendChild(div);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Tab switching
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
      showTab(button.dataset.tab);
    });
  });
  
  // Add category
  document.getElementById('addCategory').addEventListener('click', () => {
    const categoryName = document.getElementById('categoryName').value.trim();
    const patterns = document.getElementById('domainPatterns').value
      .split(',')
      .map(p => p.trim())
      .filter(p => p);
    
    if (categoryName && patterns.length > 0) {
      chrome.storage.local.get(['userCategories'], (result) => {
        const categories = result.userCategories || {};
        categories[categoryName] = patterns;
        chrome.storage.local.set({ userCategories: categories }, () => {
          updateCategoryList();
          document.getElementById('categoryName').value = '';
          document.getElementById('domainPatterns').value = '';
        });
      });
    }
  });
  
  // Delete category
  document.getElementById('categoryList').addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
      const categoryToDelete = e.target.dataset.category;
      chrome.storage.local.get(['userCategories'], (result) => {
        const categories = result.userCategories || {};
        delete categories[categoryToDelete];
        chrome.storage.local.set({ userCategories: categories }, updateCategoryList);
      });
    }
  });
  
  // Display stats
  chrome.storage.local.get(['visitData'], (result) => {
    const visitData = result.visitData || {};
    
    // Group by category
    const categoryData = {};
    Object.entries(visitData).forEach(([domain, data]) => {
      const category = data.category || 'Other';
      if (!categoryData[category]) {
        categoryData[category] = {
          totalTime: 0,
          totalVisits: 0,
          sites: []
        };
      }
      categoryData[category].totalTime += data.totalTime;
      categoryData[category].totalVisits += data.visits;
      categoryData[category].sites.push({ domain, ...data });
    });
    
    // Display top sites
    const topSitesDiv = document.getElementById('topSites');
    const topSites = Object.entries(visitData)
      .sort(([,a], [,b]) => b.totalTime - a.totalTime)
      .slice(0, 5);
    
    topSitesDiv.innerHTML = '<h3>Most Visited Sites</h3>';
    topSites.forEach(([domain, data]) => {
      const div = document.createElement('div');
      div.className = 'site';
      div.innerHTML = `
        ${domain}<br>
        <span class="time">
          ${data.visits} visits | ${formatTime(data.totalTime)} | 
          ${data.category || 'Other'}
        </span>
      `;
      topSitesDiv.appendChild(div);
    });
    
    // Display by category
    const categoryStatsDiv = document.getElementById('categoryStats');
    Object.entries(categoryData)
      .sort(([,a], [,b]) => b.totalTime - a.totalTime)
      .forEach(([category, data]) => {
        const section = document.createElement('div');
        section.className = 'category-section';
        section.innerHTML = `
          <div class="category-header">
            ${category} - ${formatTime(data.totalTime)} total
          </div>
        `;
        
        data.sites
          .sort((a, b) => b.totalTime - a.totalTime)
          .forEach(site => {
            const div = document.createElement('div');
            div.className = 'site';
            div.innerHTML = `
              ${site.domain}<br>
              <span class="time">
                ${site.visits} visits | ${formatTime(site.totalTime)}
              </span>
            `;
            section.appendChild(div);
          });
        
        categoryStatsDiv.appendChild(section);
      });
  });
  
  // Initialize category list
  updateCategoryList();
});