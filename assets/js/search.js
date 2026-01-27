/**
 * 技能搜尋功能 - MiniSearch 實作
 *
 * 功能：
 * - 部分搜尋（模糊匹配）
 * - 自動完成（前綴搜尋）
 * - 權重排序
 * - 下拉提示（高亮匹配文字）
 * - 鍵盤導航（上下鍵選擇、Enter 進入）
 */

import MiniSearch from 'https://cdn.jsdelivr.net/npm/minisearch@6.3.0/+esm';

// 全域狀態
let searchIndex = null;
let currentFocusIndex = -1;
let searchResults = [];

// DOM 元素
const searchInput = document.getElementById('skill-search');
const searchDropdown = document.getElementById('search-results');

// 載入搜尋索引
async function loadSearchIndex() {
  try {
    const response = await fetch('/data/search-index.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    searchIndex = MiniSearch.loadJSON(data, {
      fields: ['name', 'description', 'content', 'tags'],
      storeFields: ['id', 'name', 'description', 'path', 'weight'],
      searchOptions: {
        boost: { name: 3, description: 2, tags: 1.5, content: 1 },
        fuzzy: 0.2,
        prefix: true,
        combineWith: 'AND'
      }
    });

    console.log('✅ 搜尋索引載入完成');
  } catch (error) {
    console.error('❌ 載入搜尋索引失敗:', error);
  }
}

// Debounce 函式
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// 高亮匹配文字
function highlightMatch(text, query) {
  if (!query || !text) return text;

  // 轉義特殊字符
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');

  return text.replace(regex, '<mark>$1</mark>');
}

// 渲染搜尋結果
function renderResults(results) {
  if (results.length === 0) {
    searchDropdown.innerHTML = '<div class="no-results">找不到相關技能</div>';
    searchDropdown.classList.add('show');
    return;
  }

  const query = searchInput.value.trim();

  const html = results
    .slice(0, 8) // 最多顯示 8 個結果
    .map((result, index) => {
      const relevance = Math.round(result.score * 100);
      const isActive = index === currentFocusIndex ? 'active' : '';

      return `
        <a href="${result.path}" class="search-result-item ${isActive}" data-index="${index}">
          <div class="result-name">${highlightMatch(result.name, query)}</div>
          <div class="result-desc">${highlightMatch(result.description, query)}</div>
          <div class="result-meta">
            <span class="result-relevance">相關度: ${relevance}%</span>
            <span class="result-weight">權重: ${result.weight}</span>
          </div>
        </a>
      `;
    })
    .join('');

  searchDropdown.innerHTML = html;
  searchDropdown.classList.add('show');

  // 重新綁定事件
  bindResultEvents();
}

// 綁定結果項目事件
function bindResultEvents() {
  const resultItems = searchDropdown.querySelectorAll('.search-result-item');

  resultItems.forEach((item, index) => {
    item.addEventListener('mouseenter', () => {
      // 清除所有 active
      resultItems.forEach(i => i.classList.remove('active'));
      // 設置當前 active
      item.classList.add('active');
      currentFocusIndex = index;
    });

    item.addEventListener('mouseleave', () => {
      item.classList.remove('active');
      currentFocusIndex = -1;
    });
  });
}

// 執行搜尋
function performSearch(query) {
  if (!searchIndex) {
    console.warn('搜尋索引尚未載入');
    return;
  }

  if (query.length < 2) {
    searchDropdown.innerHTML = '';
    searchDropdown.classList.remove('show');
    searchResults = [];
    currentFocusIndex = -1;
    return;
  }

  try {
    const results = searchIndex.search(query, {
      boost: { name: 3, description: 2, tags: 1.5, content: 1 },
      fuzzy: 0.2,
      prefix: true,
      combineWith: 'OR' // 使用 OR 提高召回率
    });

    // 按相關度和權重排序
    searchResults = results.sort((a, b) => {
      // 先按相關度排序
      const scoreDiff = b.score - a.score;
      if (Math.abs(scoreDiff) > 0.1) {
        return scoreDiff;
      }
      // 相關度相近則按權重排序
      return b.weight - a.weight;
    });

    renderResults(searchResults);
  } catch (error) {
    console.error('搜尋錯誤:', error);
  }
}

// 處理鍵盤導航
function handleKeyboardNavigation(e) {
  const resultItems = searchDropdown.querySelectorAll('.search-result-item');

  if (resultItems.length === 0) return;

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      currentFocusIndex = Math.min(currentFocusIndex + 1, resultItems.length - 1);
      updateActiveResult(resultItems);
      break;

    case 'ArrowUp':
      e.preventDefault();
      currentFocusIndex = Math.max(currentFocusIndex - 1, -1);
      updateActiveResult(resultItems);
      break;

    case 'Enter':
      e.preventDefault();
      if (currentFocusIndex >= 0 && currentFocusIndex < resultItems.length) {
        const activeItem = resultItems[currentFocusIndex];
        activeItem.click();
      }
      break;

    case 'Escape':
      searchDropdown.innerHTML = '';
      searchDropdown.classList.remove('show');
      searchInput.blur();
      currentFocusIndex = -1;
      break;
  }
}

// 更新 active 狀態
function updateActiveResult(resultItems) {
  resultItems.forEach((item, index) => {
    if (index === currentFocusIndex) {
      item.classList.add('active');
      // 滾動到可見區域
      item.scrollIntoView({ block: 'nearest' });
    } else {
      item.classList.remove('active');
    }
  });
}

// 初始化
async function init() {
  console.log('🔍 初始化搜尋功能...');

  // 載入搜尋索引
  await loadSearchIndex();

  // 綁定搜尋輸入事件（debounce 300ms）
  searchInput.addEventListener('input', debounce((e) => {
    const query = e.target.value.trim();
    performSearch(query);
  }, 300));

  // 綁定鍵盤導航
  searchInput.addEventListener('keydown', handleKeyboardNavigation);

  // 點擊外部關閉下拉
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
      searchDropdown.innerHTML = '';
      searchDropdown.classList.remove('show');
      currentFocusIndex = -1;
    }
  });

  // 聚焦時顯示最近搜尋或提示
  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim().length >= 2) {
      performSearch(searchInput.value.trim());
    }
  });

  console.log('✅ 搜尋功能初始化完成');
}

// 等待 DOM 載入完成
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
