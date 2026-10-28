/* DLC "未竟之梦" - 完整菜单系统
   包含：DLC大菜单（列出所有DLC）+ 单个DLC详情 + DLC章节选择 */
(function(){
'use strict';

var $ = function(id) { return document.getElementById(id); };
var currentCampaign = null; // 当前使用的战役（主线或DLC）
var currentDLC = null; // 当前查看的DLC

/* ==================== DLC大菜单（Hub） ==================== */

// 显示DLC大菜单
function showDLCHub() {
  var registry = window.DLC_REGISTRY;

  if (!registry || registry.length === 0) {
    alert('当前没有可用的DLC');
    return;
  }

  // 渲染DLC列表
  renderDLCList(registry);

  // 显示界面
  $('dlcHub').classList.remove('hidden');
  $('menu').classList.add('hidden');
}

// 渲染DLC列表（卡片网格）
function renderDLCList(registry) {
  var listEl = $('dlcList');
  if (!listEl) return;

  var html = '';

  registry.forEach(function(dlc) {
    var status = window.getDLCUnlockStatus ? window.getDLCUnlockStatus(dlc) : { unlocked: false, text: '未解锁' };
    var unlocked = status.unlocked;

    html += '<div class="dlc-card ' + (unlocked ? 'unlocked' : 'locked') + '" ';
    html += 'onclick="window.DLC.showDLCDetail(\'' + dlc.id + '\')">';

    // 图标和徽章
    html += '<div class="dlc-card-header">';
    html += '<div class="dlc-icon">' + escapeHtml(dlc.icon || '🎮') + '</div>';
    if (!unlocked) {
      html += '<div class="dlc-lock">🔒</div>';
    }
    html += '</div>';

    // 标题
    html += '<div class="dlc-card-body">';
    html += '<h3 class="dlc-title">' + escapeHtml(dlc.name) + '</h3>';
    html += '<p class="dlc-subtitle">' + escapeHtml(dlc.subtitle || '') + '</p>';
    html += '<p class="dlc-desc">' + escapeHtml(dlc.description || '') + '</p>';

    // 统计信息
    html += '<div class="dlc-stats">';
    html += '<span class="dlc-stat">📖 ' + dlc.chapters + '章</span>';
    html += '<span class="dlc-stat">🎯 ' + dlc.levels + '关</span>';
    html += '<span class="dlc-stat">⏱️ ' + escapeHtml(dlc.estimatedTime || '未知') + '</span>';
    html += '</div>';

    // 解锁状态
    html += '<div class="dlc-status ' + (unlocked ? 'unlocked' : 'locked') + '">';
    html += unlocked ? '✓ 已解锁' : '🔒 ' + escapeHtml(status.text);
    html += '</div>';

    html += '</div>'; // card-body
    html += '</div>'; // card
  });

  listEl.innerHTML = html;
}

/* ==================== 单个DLC详情界面 ==================== */

// 显示单个DLC的详情
function showDLCDetail(dlcId) {
  var registry = window.DLC_REGISTRY;
  if (!registry) return;

  var dlc = registry.find(function(d) { return d.id === dlcId; });
  if (!dlc) {
    alert('DLC不存在：' + dlcId);
    return;
  }

  currentDLC = dlc;

  // 渲染详情页
  renderDLCDetail(dlc);

  // 切换界面
  $('dlcHub').classList.add('hidden');
  $('dlcDetail').classList.remove('hidden');
}

// 渲染DLC详情页
function renderDLCDetail(dlc) {
  var contentEl = $('dlcDetailContent');
  if (!contentEl) return;

  var status = window.getDLCUnlockStatus ? window.getDLCUnlockStatus(dlc) : { unlocked: false, text: '未解锁' };
  var unlocked = status.unlocked;

  var html = '';

  // 头部
  html += '<div class="dlc-detail-header">';
  html += '<div class="dlc-detail-icon">' + escapeHtml(dlc.icon || '🎮') + '</div>';
  html += '<div class="dlc-detail-info">';
  html += '<div class="eyebrow">DLC</div>';
  html += '<h2>' + escapeHtml(dlc.name) + '</h2>';
  html += '<p class="dlc-detail-subtitle">' + escapeHtml(dlc.subtitle || '') + '</p>';
  html += '</div>';
  html += '</div>';

  // 描述
  html += '<div class="dlc-detail-section">';
  html += '<h3>关于这个DLC</h3>';
  html += '<p>' + escapeHtml(dlc.description || '') + '</p>';
  html += '</div>';

  // 特色功能
  if (dlc.features && dlc.features.length > 0) {
    html += '<div class="dlc-detail-section">';
    html += '<h3>特色内容</h3>';
    html += '<ul class="dlc-features">';
    dlc.features.forEach(function(f) {
      html += '<li>✨ ' + escapeHtml(f) + '</li>';
    });
    html += '</ul>';
    html += '</div>';
  }

  // 统计信息
  html += '<div class="dlc-detail-section">';
  html += '<h3>内容规模</h3>';
  html += '<div class="dlc-info-grid">';
  html += '<div class="dlc-info-item"><strong>章节数</strong><span>' + dlc.chapters + ' 章</span></div>';
  html += '<div class="dlc-info-item"><strong>关卡数</strong><span>' + dlc.levels + ' 关</span></div>';
  html += '<div class="dlc-info-item"><strong>难度</strong><span>' + escapeHtml(dlc.difficulty || '未知') + '</span></div>';
  html += '<div class="dlc-info-item"><strong>预计时长</strong><span>' + escapeHtml(dlc.estimatedTime || '未知') + '</span></div>';
  html += '</div>';
  html += '</div>';

  // 解锁状态和开始按钮
  html += '<div class="dlc-detail-footer">';
  if (unlocked) {
    html += '<button class="btn accent large" onclick="window.DLC.startDLC(\'' + dlc.id + '\')">开始冒险</button>';
  } else {
    html += '<div class="dlc-unlock-requirement">';
    html += '<p>🔒 ' + escapeHtml(status.text) + '</p>';
    if (status.needPassword) {
      html += '<div class="dlc-pw-row" style="display:flex;gap:8px;justify-content:center;margin-top:10px;flex-wrap:wrap">';
      html += '<input id="dlcPw" type="text" autocomplete="off" placeholder="输入口令" style="padding:9px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.25);background:rgba(8,16,28,.7);color:#fff;font-size:16px;min-width:180px" onkeydown="if(event.key===\'Enter\')window.DLC.tryUnlock(\'' + dlc.id + '\')">';
      html += '<button class="btn accent" onclick="window.DLC.tryUnlock(\'' + dlc.id + '\')">解锁</button>';
      html += '</div><p id="dlcPwMsg" style="margin-top:8px;min-height:1.2em;color:#ffb79a"></p>';
      html += '<p class="dlc-konami" style="margin-top:4px;opacity:.9">🎮 手柄：在本页依次按 <b>↑ ↑ ↓ ↓ ← → ← → B A</b> 解锁 <span id="dlcKonami" style="color:#ffd27a"></span></p>';
    }
    html += '</div>';
  }
  html += '</div>';

  contentEl.innerHTML = html;
}

/* ==================== DLC章节选择（原有功能） ==================== */

// 开始DLC（显示章节选择）
function startDLC(dlcId) {
  var dlc = currentDLC || (window.DLC_REGISTRY && window.DLC_REGISTRY.find(function(d) { return d.id === dlcId; }));

  if (!dlc) {
    alert('DLC不存在');
    return;
  }

  currentDLC = dlc;

  // 获取对应的战役数据并设置为全局campaign
  var dlcCampaign = window.getDLCCampaign(dlc);
  if (!dlcCampaign) {
    alert('这个DLC还没有关卡内容：请先在关卡工坊里编辑并点「发布到游戏」');
    return;
  }

  // ====== 核心修复：切换全局campaign到DLC战役 ======
  // 渲染章节列表
  renderDLCChapterList(dlcCampaign, dlc);

  // 切换界面
  $('dlcDetail').classList.add('hidden');
  $('dlcChapters').classList.remove('hidden');
}

// 渲染DLC章节列表：顶部是「新冒险 / 继续」，下面是各章节（含剧情）与关卡
function renderDLCChapterList(campaign, dlc) {
  var listEl = $('dlcChapterList');
  if (!listEl) return;

  var save = null;
  try { save = JSON.parse(localStorage.getItem('line15-dlc-save-' + dlc.id) || 'null'); } catch (e) {}
  var unlockedCh = save && save.unlocked != null ? save.unlocked : 0;
  var GFX = window.GFX;
  var html = '<div class="dlc-run-bar">';
  html += '<button class="btn accent large" onclick="window.DLC.startDLCNew()">▶ 从序章开始新冒险</button>';
  if (save && save.ci != null) {
    html += '<button class="btn large" onclick="window.DLC.startDLCContinue()">⏩ 继续（' + escapeHtml(campaign.chapters[Math.min(save.ci, campaign.chapters.length - 1)].name) + '）</button>';
  }
  html += '<div class="dlc-run-info">蓝色碎片 ◆ ' + (save && save.blue ? save.blue : 0) + (save && save.cleared ? ' · 已通关' : '') + '</div>';
  html += '</div>';

  campaign.chapters.forEach(function(ch, ci) {
    var biome = GFX && GFX.B ? GFX.B(ch.biome) : { accent: '#b890ff' };
    var chId = ch.id || ('d' + (ci + 1));
    var locked = ci > unlockedCh;

    html += '<div class="chapter dlc-chapter' + (locked ? ' locked' : '') + '" style="--tint:' + biome.accent + '; border-left: 4px solid ' + biome.accent + '">';
    html += '<div class="ch-head">';
    html += '<h3>第' + '一二三四五六七八九十'.charAt(ci) + '部分 · ' + escapeHtml(ch.name) + '</h3>';
    html += '<p class="ch-subtitle">' + escapeHtml(ch.subtitle || '') + '</p>';
    if (!locked) html += '<button class="btn small" onclick="window.DLC.startDLCChapter(' + ci + ')">▶ 从本部分开头（含剧情）</button>';
    else html += '<span class="dlc-lock-tip">🔒 通关上一部分后解锁</span>';
    html += '</div>';

    if (!locked) {
      html += '<div class="ch-levels">';
      ch.levels.forEach(function(lv, li) {
        var levelCode = chId + '-' + String(li + 1).padStart(2, '0');
        var isBoss = lv.objects && lv.objects.some(function(o) { return o.kind === 'finalboss' || o.kind === 'boss'; });
        html += '<button class="level-btn' + (isBoss ? ' boss-level' : '') + '" onclick="window.DLC.startDLCLevel(' + ci + ',' + li + ')">';
        html += '<span class="level-code">' + levelCode + '</span>';
        html += '<span class="level-name">' + escapeHtml(lv.name.replace(/^\d+\s*·\s*/, '')) + '</span>';
        if (isBoss) html += '<span class="boss-tag">BOSS</span>';
        html += '</button>';
      });
      html += '</div>';
    }
    html += '</div>';
  });

  listEl.innerHTML = html;
}

function launch(mode, ci, li) {
  var dlc = currentDLC;
  if (!dlc) { console.error('未选择DLC'); return; }
  var dlcCampaign = window.getDLCCampaign(dlc);
  if (!dlcCampaign) { alert('这个DLC还没有关卡内容：请先在关卡工坊里编辑并点「发布到游戏」'); return; }
  $('dlcChapters').classList.add('hidden');
  var menuEl = document.getElementById('menu');
  if (menuEl) menuEl.classList.add('hidden');
  if (window.AudioFX && AudioFX.init) AudioFX.init();
  if (window.L15Game && window.L15Game.startDLCRun) {
    window.L15Game.startDLCRun(dlcCampaign, dlc.id, mode, ci, li);
  } else {
    alert('无法启动，请刷新页面重试');
  }
}
function tryUnlock(dlcId) {
  var dlc = window.DLC_REGISTRY.find(function(d) { return d.id === dlcId; });
  var el = $('dlcPw'), msg = $('dlcPwMsg');
  if (!dlc || !el) return;
  if (window.tryDLCPassword && window.tryDLCPassword(dlc, el.value)) {
    if (window.AudioFX) AudioFX.sfx('win');
    currentDLC = dlc;
    renderDLCDetail(dlc);
  } else {
    if (msg) msg.textContent = '口令不对，再想想（提示：' + ((dlc.unlockCondition && dlc.unlockCondition.hint) || '') + '）';
    if (window.AudioFX) AudioFX.sfx('hurt');
  }
}
/* 手柄解锁（↑↑↓↓←→←→BA）：不用打字，输入对了直接记为已解锁，和口令解锁写的是同一个标记 */
function padUnlock(dlcId) {
  var dlc = window.DLC_REGISTRY.find(function(d) { return d.id === dlcId; });
  if (!dlc || !dlc.unlockCondition || dlc.unlockCondition.type !== 'password') return false;
  try { localStorage.setItem('line15-dlc-unlock-' + dlc.id, '1'); } catch (e) {}
  if (window.AudioFX) AudioFX.sfx('win');
  currentDLC = dlc;
  renderDLCDetail(dlc);
  return true;
}
function startDLCNew() { launch('new'); }
function startDLCContinue() { launch('continue'); }
function startDLCChapter(ci) { launch('chapter', ci, 0); }
function startDLCLevel(ci, li) { launch('level', ci, li); }
/* ==================== 旧版DLC按钮（兼容性保留） ==================== */

// 更新DLC按钮状态
function updateDLCButton() {
  var dlcBtn = $('dlcBtn');
  if (!dlcBtn) return;

  dlcBtn.style.display = 'block';
  dlcBtn.disabled = false;
  dlcBtn.classList.remove('disabled');
}

/* ==================== 事件绑定 ==================== */

// 初始化DLC功能
function initDLC() {
  // DLC按钮点击事件 - 打开DLC大菜单
  var dlcBtn = $('dlcBtn');
  if (dlcBtn) {
    dlcBtn.onclick = function() {
      showDLCHub();
    };
  }

  // 关闭DLC大菜单
  var closeDlcHubBtn = $('closeDlcHub');
  if (closeDlcHubBtn) {
    closeDlcHubBtn.onclick = function() {
      $('dlcHub').classList.add('hidden');
      $('menu').classList.remove('hidden');
    };
  }

  // 关闭DLC详情
  var closeDlcDetailBtn = $('closeDlcDetail');
  if (closeDlcDetailBtn) {
    closeDlcDetailBtn.onclick = function() {
      $('dlcDetail').classList.add('hidden');
      $('dlcHub').classList.remove('hidden');
    };
  }

  // 关闭DLC章节界面
  var closeDlcChaptersBtn = $('closeDlcChapters');
  if (closeDlcChaptersBtn) {
    closeDlcChaptersBtn.onclick = function() {
      $('dlcChapters').classList.add('hidden');
      $('dlcDetail').classList.remove('hidden');
    };
  }

  // 初始更新按钮状态
  updateDLCButton();
}

/* ==================== 辅助函数 ==================== */

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, function(c) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c];
  });
}

/* ==================== 导出到全局 ==================== */

window.DLC = {
  init: initDLC,
  updateButton: updateDLCButton,
  showHub: showDLCHub,
  showDLCDetail: showDLCDetail,
  startDLC: startDLC,
  startDLCLevel: startDLCLevel,
  tryUnlock: tryUnlock,
  padUnlock: padUnlock,
  currentId: function() { return currentDLC && currentDLC.id; },
  startDLCNew: startDLCNew,
  startDLCContinue: startDLCContinue,
  startDLCChapter: startDLCChapter,
  getCurrentCampaign: function() { return currentCampaign; },
  getCurrentDLC: function() { return currentDLC; }
};

// 页面加载后自动初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initDLC, 100);
  });
} else {
  setTimeout(initDLC, 100);
}

})();

