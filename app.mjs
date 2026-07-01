// app.mjs — 讀取 content-manifest.json 動態渲染首頁卡片
// 零編譯、零框架，純 ES Module

const MANIFEST_URL = `./data/content-manifest.json?t=${Date.now()}`;
const STATS_URL = `./data/stats.json?t=${Date.now()}`;

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

// publishDate 正規化為「絕對時刻」：純日期 YYYY-MM-DD 視為台灣當地午夜(+08:00)，
// 否則照字串自帶時區解析。治本：避免被 JS 引擎把純日期當 UTC 午夜，
// 在 +8 瀏覽器顯示成早上 08:00、且排序時被當成更早 → 最新項目沉到下面。
function parsePublishDate(dateStr) {
  const s = String(dateStr || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s + 'T00:00:00+08:00');
  return new Date(s);
}

// 一律以 Asia/Taipei 呈現，數字才與「UTC+8」標籤一致（不受瀏覽者所在時區影響）。
function formatDate(dateStr) {
  const d = parsePublishDate(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).formatToParts(d).reduce((o, p) => (o[p.type] = p.value, o), {});
  const hh = parts.hour === '24' ? '00' : parts.hour; // 部分引擎午夜回傳 24
  return `${parts.year}-${parts.month}-${parts.day} ${hh}:${parts.minute} UTC+8`;
}

function renderCard(item) {
  const isExternal = item.href.startsWith('http');
  const target = isExternal ? ' target="_blank" rel="noopener"' : '';
  const tags = (item.tags || []).map(t => {
    const idx = t.indexOf(':');
    // 支援兩種格式：「icon:label」帶圖示，或純文字標籤（無冒號就只顯示文字）
    const hasIcon = idx > -1;
    const icon = hasIcon ? t.slice(0, idx) : '';
    const label = hasIcon ? t.slice(idx + 1) : t;
    if (!label) return '';
    return `<span>${hasIcon ? svg(icon) : ''}${label}</span>`;
  }).filter(Boolean).join('');

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

// Konami Code: ↑ ↑ ↓ ↓ ← → ← → B A
// 容錯：滑動視窗匹配，不管前後按了什麼都能觸發
function initKonamiCode() {
  const SECRET = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','KeyB','KeyA'];
  const buf = [];
  let unlocked = false;

  document.addEventListener('keydown', function(e) {
    if (unlocked) return;
    buf.push(e.code);
    // 只保留最近 N 個按鍵（N = 序列長度 + 容錯緩衝）
    if (buf.length > 30) buf.shift();
    // 滑動視窗：檢查 buf 尾端是否匹配 SECRET
    if (buf.length >= SECRET.length) {
      const tail = buf.slice(-SECRET.length);
      if (tail.every((k, i) => k === SECRET[i])) {
        unlocked = true;
        revealProtectedCards();
      }
    }
  });
}

function revealProtectedCards() {
  // 一併亮出標案參考專區（與機密文章同層保護）
  const tzSection = document.getElementById('tender-zone');
  if (tzSection && document.getElementById('tender-list')?.children.length > 0) {
    tzSection.style.display = '';
  }
  const section = document.getElementById('protected-section');
  if (!section) return;
  const cards = section.querySelectorAll('.card');
  if (cards.length === 0) return;

  // 顯示整個獨立區塊
  section.style.display = '';
  section.style.opacity = '0';
  section.style.transform = 'translateY(-10px)';
  section.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
  setTimeout(() => {
    section.style.opacity = '1';
    section.style.transform = 'translateY(0)';
  }, 50);

  // 卡片逐個淡入動畫
  cards.forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    setTimeout(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, i * 100 + 200);
  });

  // 更新計數（公開 + 機密）
  const countEl = document.getElementById('item-count');
  if (countEl) {
    const publicCards = document.getElementById('card-list').querySelectorAll('.card').length;
    countEl.textContent = `${publicCards + cards.length} 項`;
  }

  // 顯示提示 toast
  const toast = document.createElement('div');
  toast.textContent = `🔓 已解鎖 ${cards.length} 篇機密文章`;
  toast.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:#7c3aed;color:#fff;padding:.8rem 1.5rem;border-radius:12px;font-size:.95rem;font-weight:600;z-index:9999;box-shadow:0 4px 20px rgba(124,58,237,.4);animation:toastIn .4s ease';
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity .4s'; }, 3000);
  setTimeout(() => toast.remove(), 3500);
}

async function init() {
  try {
    const res = await fetch(MANIFEST_URL);
    const manifest = await res.json();
    let items = manifest.items || [];

    // 按日期排序（最新在前）
    items.sort((a, b) => parsePublishDate(b.publishDate) - parsePublishDate(a.publishDate));

    // 治本（LM：manifest 單筆缺 href 不可整頁空白）：在來源就濾掉壞資料，
    // 讓 renderCard 永遠拿得到字串 href；單筆異常只少一張卡，絕不讓首頁卡「載入中...」。
    const badItems = items.filter(i => typeof i.href !== 'string' || !i.href);
    if (badItems.length > 0) {
      console.warn('[manifest] 略過缺 href 的項目（請補 href）：', badItems.map(i => i.id || i.title));
      items = items.filter(i => typeof i.href === 'string' && i.href);
    }

    // 分離機密文章與公開文章
    const protectedItems = items.filter(i => i.protected === true);
    const publicItems = items.filter(i => !i.protected);

    // 渲染公開文章
    const container = document.getElementById('card-list');
    container.innerHTML = publicItems.map(renderCard).join('');

    // 渲染機密文章到獨立區塊（初始隱藏，Konami Code 解鎖）
    const protectedList = document.getElementById('protected-list');
    if (protectedItems.length > 0) {
      protectedList.innerHTML = protectedItems.map(renderCard).join('');
    }

    // 標案參考專區（資料驅動，SSOT = manifest.metadata.tenderZone）
    // DRY：以 id 查既有 item，複用 renderCard()，不重寫卡片
    const tz = manifest.metadata?.tenderZone;
    if (tz && Array.isArray(tz.items) && tz.items.length > 0) {
      const byId = new Map(items.map(i => [i.id, i]));
      const tzItems = tz.items.map(id => byId.get(id)).filter(Boolean);
      if (tzItems.length > 0) {
        const introEl = document.getElementById('tender-intro');
        if (introEl && tz.intro) introEl.textContent = tz.intro;
        const labelEl = document.querySelector('#tender-zone .tender-label');
        if (labelEl && tz.label) labelEl.textContent = tz.label;
        document.getElementById('tender-list').innerHTML = tzItems.map(renderCard).join('');
      }
    }

    // 公開項目計數（不含 protected）
    const publicCount = publicItems.length;
    document.getElementById('item-count').textContent = `${publicCount} 項`;

    // Stats bar 已永久隱藏（瀏覽量/訪客/發表篇數），不再渲染

    // 更新時間
    const now = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false });
    document.getElementById('update-time').textContent = manifest.metadata?.lastUpdated
      ? formatDate(manifest.metadata.lastUpdated)
      : now;

    // IAP 域名：預設亮出機密文章（已有 IAP 保護，不需 Konami Code）
    const isIAPProtected = location.hostname.includes('botrun-protected');
    if (isIAPProtected) {
      const section = document.getElementById('protected-section');
      if (section) {
        section.style.display = '';
        section.querySelector('.protected-label').textContent = '🔓 機密文章（IAP 保護中）';
      }
      // 標案參考專區置頂亮出（連結 protected 文章，僅 IAP 域名顯示，守 LM-129）
      const tzSection = document.getElementById('tender-zone');
      if (tzSection && document.getElementById('tender-list').children.length > 0) {
        tzSection.style.display = '';
      }
      document.getElementById('item-count').textContent = `${items.length} 項`;
    } else {
      // 公開首頁：Konami Code 解鎖
      initKonamiCode();
    }
  } catch (err) {
    console.error('載入失敗:', err);
    document.getElementById('card-list').innerHTML = '<p style="text-align:center;color:#999;">載入中...</p>';
  }
}

init();
