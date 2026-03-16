// app.mjs — 讀取 content-manifest.json 動態渲染首頁卡片
// 零編譯、零框架，純 ES Module

const MANIFEST_URL = './data/content-manifest.json';

// Lucide icon SVG 模板（手繪 24x24 viewBox, stroke-width 1.8）
const ICONS = {
  'file-text':    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  'presentation': '<path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="m7 21 5-5 5 5"/>',
  'graduation-cap':'<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
  'layers':       '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  'cpu':          '<rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>',
  'scroll-text':  '<path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4"/><path d="M19 3H8v14h12V5a2 2 0 0 0-2-2z"/>',
  'video':        '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>',
  'shield':       '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  'chevron-right':'<polyline points="9 18 15 12 9 6"/>',
  'calendar':     '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
};

function svg(name) {
  const paths = ICONS[name] || ICONS['file-text'];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())} UTC+8`;
  } catch { return dateStr; }
}

function renderCard(item) {
  const isExternal = item.href.startsWith('http');
  const target = isExternal ? ' target="_blank" rel="noopener"' : '';
  const tags = (item.tags || []).map(t => {
    const [icon, label] = t.split(':');
    return `<span>${svg(icon)}${label}</span>`;
  }).join('');

  return `
    <a class="card" href="${item.href}"${target} style="position:relative;">
      <div class="badge" style="background:${item.badgeColor};">${item.badge}</div>
      <div class="card-icon" style="background:${item.badgeColor};">${svg(item.icon)}</div>
      <div class="card-body">
        <div class="card-title">${item.title}</div>
        <div class="card-desc">${item.subtitle}</div>
        <div class="card-meta">
          ${tags}
          <span>${svg('calendar')}${formatDate(item.publishDate)}</span>
        </div>
      </div>
      <div class="card-arrow">${svg('chevron-right')}</div>
    </a>`;
}

async function init() {
  try {
    const res = await fetch(MANIFEST_URL);
    const manifest = await res.json();
    const items = manifest.items || [];

    // 按日期排序（最新在前）
    items.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));

    const container = document.getElementById('card-list');
    container.innerHTML = items.map(renderCard).join('');

    // 更新時間
    const now = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false });
    document.getElementById('update-time').textContent = manifest.metadata?.lastUpdated
      ? formatDate(manifest.metadata.lastUpdated)
      : now;

    document.getElementById('item-count').textContent = `${items.length} 項`;
  } catch (err) {
    console.error('載入失敗:', err);
    document.getElementById('card-list').innerHTML = '<p style="text-align:center;color:#999;">載入中...</p>';
  }
}

init();
