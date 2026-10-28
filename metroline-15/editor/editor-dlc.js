/* DLC 管理（关卡工坊）
   结构：DLC → 场景(章节) → 关卡。
   - 点击某个 DLC 的场景/关卡，工坊画布就切换到该 DLC 进行编辑（与主线共用同一套编辑器）
   - 每个 DLC 有独立草稿；「发布到游戏」后写入 line15-dlc-campaign-<id>，游戏的 DLC 菜单直接使用
   - DLC 的名称、解锁条件等元数据保存在 localStorage 的 dlc_registry（游戏端 dlc-registry.js 会合并） */
(function(){
'use strict';

var $ = function(id) { return document.getElementById(id); };
var REG_KEY = 'dlc_registry', DEL_KEY = 'dlc_registry_deleted';
var currentEditingDLC = null;   // 设置面板正在编辑的 DLC（null=新建）
var expanded = {};              // DLC id -> 是否展开
var summaryCache = {};          // 非当前目标的 DLC 结构缓存

function E() { return window.L15Editor; }

/* ==================== 注册表读写 ==================== */

function registry() { return window.DLC_REGISTRY || (window.DLC_REGISTRY = []); }

function saveRegistry() {
  try {
    localStorage.setItem(REG_KEY, JSON.stringify(registry()));
    return true;
  } catch (e) {
    alert('保存失败：' + e.message);
    return false;
  }
}

function deletedList() {
  try { return JSON.parse(localStorage.getItem(DEL_KEY) || '[]') || []; } catch (e) { return []; }
}

function find(id) {
  return registry().find(function(d) { return d.id === id; }) || null;
}

// 发布/还原后，同步 DLC 卡片上显示的章节数、关卡数
function syncStats(id, campaign) {
  var dlc = find(id);
  if (!dlc || !campaign || !campaign.chapters) return;
  dlc.chapters = campaign.chapters.length;
  dlc.levels = campaign.chapters.reduce(function(a, c) { return a + c.levels.length; }, 0);
  delete summaryCache[id];
  saveRegistry();
  render();
}

/* ==================== DLC → 场景 → 关卡 树 ==================== */

// 取得某个 DLC 的结构摘要：当前编辑中的直接读，其他的读草稿/已发布/源码
function structureOf(id) {
  var ed = E();
  if (ed && ed.target === id) return ed.proj;
  if (!summaryCache[id]) summaryCache[id] = ed.peek(id);
  return summaryCache[id];
}

function openLevel(id, ci, li) {
  var ed = E();
  if (ed.target !== id) ed.openTarget(id);
  delete summaryCache[id];
  expanded[id] = true;
  ed.selectLevel(ci, li);
}

function mini(text, title, fn) {
  var b = document.createElement('button');
  b.className = 'mini';
  b.textContent = text;
  b.title = title;
  b.onclick = function(e) { e.stopPropagation(); fn(); };
  return b;
}

function render() {
  var listEl = $('dlcList'), ed = E();
  if (!listEl || !ed) return;

  listEl.innerHTML = '';
  var reg = registry();
  if (!reg.length) {
    listEl.innerHTML = '<p class="hint">还没有创建任何DLC。点击下方按钮创建你的第一个DLC。</p>';
    return;
  }

  reg.forEach(function(dlc) {
    var active = ed.target === dlc.id;
    var open = expanded[dlc.id] || active;
    var item = document.createElement('div');
    item.className = 'dlc-item' + (active ? ' active' : '');
    item.setAttribute('data-dlc', dlc.id);

    var head = document.createElement('div');
    head.className = 'dlc-item-header';
    head.innerHTML = '<span class="dlc-icon"></span><div class="dlc-item-info"><strong></strong><small></small></div>';
    head.querySelector('.dlc-icon').textContent = dlc.icon || '🎮';
    head.querySelector('strong').textContent = dlc.name;
    head.querySelector('small').textContent = (dlc.subtitle || '') + ' · ' + (dlc.chapters || 0) + '场景 ' + (dlc.levels || 0) + '关' + (active ? ' · 编辑中' : '');
    head.appendChild(mini('⚙', 'DLC设置（名称、解锁条件）', function() { showDLCPanel(dlc.id); }));
    head.appendChild(mini(open ? '▾' : '▸', '展开/收起', function() {
      expanded[dlc.id] = !open;
      render();
    }));
    head.onclick = function() { expanded[dlc.id] = !open; render(); };
    item.appendChild(head);

    if (open) {
      var camp = structureOf(dlc.id);
      var tree = document.createElement('div');
      tree.className = 'dlc-tree';

      camp.chapters.forEach(function(ch, i) {
        var scene = document.createElement('div');
        var sceneSel = active && ed.ci() === i;
        scene.className = 'dlc-scene' + (sceneSel ? ' sel' : '');

        var sh = document.createElement('div');
        sh.className = 'dlc-scene-h';
        var title = document.createElement('b');
        title.textContent = '场景 ' + (i + 1) + ' · ' + ch.name;
        var cnt = document.createElement('small');
        cnt.textContent = ch.levels.length + ' 关';
        sh.appendChild(title);
        sh.appendChild(cnt);
        if (active) {
          sh.appendChild(mini('✎', '场景设置（名称/主题/剧情）', function() { ed.selectLevel(i, 0); ed.openTab('tree'); }));
          sh.appendChild(mini('↑', '场景上移', function() { ed.moveChapter(i, -1); }));
          sh.appendChild(mini('↓', '场景下移', function() { ed.moveChapter(i, 1); }));
          sh.appendChild(mini('✕', '删除场景', function() { ed.delChapter(i); }));
        }
        sh.onclick = function() { openLevel(dlc.id, i, active && ed.ci() === i ? ed.li() : 0); };
        scene.appendChild(sh);

        ch.levels.forEach(function(lv, j) {
          var row = document.createElement('div');
          var isBoss = lv.objects && lv.objects.some(function(o) { return o.kind === 'boss' || o.kind === 'finalboss'; });
          row.className = 'dlc-level' + (active && ed.ci() === i && ed.li() === j ? ' sel' : '') + (isBoss ? ' boss' : '');
          var code = document.createElement('i');
          code.textContent = (ch.id || 'd' + (i + 1)) + '-' + String(j + 1).padStart(2, '0');
          var name = document.createElement('span');
          name.appendChild(code);
          name.appendChild(document.createTextNode(lv.name));
          row.appendChild(name);
          if (active) {
            row.appendChild(mini('↑', '上移（可移到上一个场景）', function() { ed.moveLevel(i, j, -1); }));
            row.appendChild(mini('↓', '下移（可移到下一个场景）', function() { ed.moveLevel(i, j, 1); }));
            row.appendChild(mini('⧉', '复制关卡', function() { ed.dupLevel(i, j); }));
            row.appendChild(mini('✕', '删除关卡', function() { ed.delLevel(i, j); }));
          }
          row.onclick = function() { openLevel(dlc.id, i, j); };
          scene.appendChild(row);
        });

        var add = document.createElement('button');
        add.className = 'add-lvl';
        add.textContent = '＋ 在本场景末尾添加关卡';
        add.onclick = function(e) {
          e.stopPropagation();
          if (ed.target !== dlc.id) { ed.openTarget(dlc.id); delete summaryCache[dlc.id]; }
          ed.addLevel(i);
        };
        scene.appendChild(add);
        tree.appendChild(scene);
      });

      var addScene = document.createElement('button');
      addScene.className = 'full dashed';
      addScene.textContent = '＋ 新增场景';
      addScene.onclick = function() {
        if (ed.target !== dlc.id) { ed.openTarget(dlc.id); delete summaryCache[dlc.id]; }
        expanded[dlc.id] = true;
        ed.addScene();
      };
      tree.appendChild(addScene);
      item.appendChild(tree);
    }

    listEl.appendChild(item);
  });
}

/* ==================== DLC 设置面板 ==================== */

function showDLCPanel(dlcId) {
  var panel = $('dlcPanel');
  if (!panel) return;

  if (dlcId) {
    var dlc = find(dlcId);
    if (!dlc) { alert('DLC不存在：' + dlcId); return; }
    currentEditingDLC = dlc;
    $('dlcId').value = dlc.id;
    $('dlcId').disabled = true;
    $('dlcName').value = dlc.name || '';
    $('dlcSubtitle').value = dlc.subtitle || '';
    $('dlcDesc').value = dlc.description || '';
    $('dlcIcon').value = dlc.icon || '🎮';
    if (dlc.unlockCondition) {
      $('dlcUnlockType').value = dlc.unlockCondition.type || 'shards';
      $('dlcUnlockAmount').value = dlc.unlockCondition.required || 100;
    } else {
      $('dlcUnlockType').value = 'none';
    }
    $('deleteDlcBtn').style.display = '';
  } else {
    currentEditingDLC = null;
    $('dlcId').value = '';
    $('dlcId').disabled = false;
    $('dlcName').value = '';
    $('dlcSubtitle').value = '';
    $('dlcDesc').value = '';
    $('dlcIcon').value = '🎮';
    $('dlcUnlockType').value = 'shards';
    $('dlcUnlockAmount').value = '100';
    $('deleteDlcBtn').style.display = 'none';
  }

  updateUnlockFields();
  panel.classList.remove('hidden');
  panel.scrollIntoView({ behavior: 'smooth' });
}

function hideDLCPanel() {
  var panel = $('dlcPanel');
  if (panel) panel.classList.add('hidden');
  currentEditingDLC = null;
}

function updateUnlockFields() {
  var type = $('dlcUnlockType').value;
  $('dlcUnlockAmountLabel').style.display = type === 'shards' ? 'block' : 'none';
}

/* ==================== 保存和删除 ==================== */

function saveDLC() {
  var id = $('dlcId').value.trim();
  var name = $('dlcName').value.trim();
  var unlockType = $('dlcUnlockType').value;
  var unlockAmount = parseInt($('dlcUnlockAmount').value, 10) || 100;

  if (!id) { alert('请输入DLC ID（英文，例如: my_dlc）'); return; }
  if (!/^[a-z_][a-z0-9_]*$/.test(id)) {
    alert('DLC ID只能包含小写字母、数字和下划线，且必须以字母或下划线开头');
    return;
  }
  if (!name) { alert('请输入DLC名称'); return; }
  if (!currentEditingDLC && find(id)) {
    alert('DLC ID "' + id + '" 已存在，请使用其他ID');
    return;
  }

  var isNew = !currentEditingDLC;
  var firstScene = null;
  if (isNew) {
    var tip = '给第一个场景起一个关卡文件名（导出为 名称-01.js；不能用 c1、c2…，也不能和其他场景重名）：';
    for (;;) {
      firstScene = prompt(tip, id + '_1');
      if (firstScene === null) return;
      firstScene = firstScene.trim();
      if (/^[A-Za-z][\w-]*$/.test(firstScene) && !/^c\d+$/i.test(firstScene) && !/^d\d+$/i.test(firstScene)) break;
      alert('只能用英文字母/数字/下划线/连字符，以字母开头，且不能是 c1、d1 这类已被源码占用的名字');
    }
  }
  var dlc = currentEditingDLC || {
    id: id,
    chapters: 1,
    levels: 1,
    features: [],
    difficulty: '中',
    estimatedTime: '未知',
    version: '1.0',
    releaseDate: new Date().toISOString().slice(0, 7),
    author: '自定义',
    campaignId: 'CAMPAIGN_' + id.toUpperCase(),
    firstScene: firstScene
  };

  dlc.name = name;
  dlc.subtitle = $('dlcSubtitle').value.trim();
  dlc.description = $('dlcDesc').value.trim();
  dlc.icon = $('dlcIcon').value.trim() || '🎮';

  var oldCond = dlc.unlockCondition || {};
  if (unlockType === 'shards') {
    dlc.unlockCondition = { type: 'shards', required: unlockAmount, campaign: oldCond.campaign || 'DEFAULT' };
  } else if (unlockType === 'complete') {
    dlc.unlockCondition = { type: 'complete', campaign: oldCond.campaign || 'DEFAULT' };
  } else {
    delete dlc.unlockCondition;
  }

  if (isNew) {
    registry().push(dlc);
    // 若之前删除过同名 DLC，取消删除标记
    var del = deletedList().filter(function(x) { return x !== id; });
    localStorage.setItem(DEL_KEY, JSON.stringify(del));
  }

  if (!saveRegistry()) return;

  hideDLCPanel();
  expanded[dlc.id] = true;
  render();

  if (isNew) {
    // 新 DLC 立刻切换过去，从第一个场景开始做关卡
    E().openTarget(dlc.id);
    E().openTab('tree');
  }
}

function deleteDLC() {
  if (!currentEditingDLC) return;
  var dlc = currentEditingDLC;

  if (!confirm('确定要删除DLC "' + dlc.name + '" 吗？\n\n它的草稿和已发布内容都会被清除，此操作无法撤销！')) return;

  var ed = E();
  if (ed.target === dlc.id) ed.openTarget(null);
  ed.clearDraft(dlc.id);

  var reg = registry();
  var index = reg.findIndex(function(d) { return d.id === dlc.id; });
  if (index !== -1) reg.splice(index, 1);

  var del = deletedList();
  if (del.indexOf(dlc.id) < 0) del.push(dlc.id);
  localStorage.setItem(DEL_KEY, JSON.stringify(del));

  delete expanded[dlc.id];
  delete summaryCache[dlc.id];
  saveRegistry();
  hideDLCPanel();
  render();
}

/* ==================== 初始化 ==================== */

function init() {
  $('addDLC').onclick = function() { showDLCPanel(null); };
  $('saveDlcBtn').onclick = saveDLC;
  $('cancelDlcBtn').onclick = hideDLCPanel;
  $('deleteDlcBtn').onclick = deleteDLC;
  $('dlcUnlockType').onchange = updateUnlockFields;
  render();
}

window.EditorDLC = {
  init: init,
  render: render,
  syncStats: syncStats,
  editDLC: showDLCPanel,
  loadList: render
};

// editor.js 先于本文件加载；这里直接初始化
init();

})();
