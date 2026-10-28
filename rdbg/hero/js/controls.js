/* 输入与设置模块：键盘（可自定义）+ 触屏虚拟按键（手机 / 大屏紧凑，可隐藏、可拖动摆放）+ 手柄。
   只负责把各种输入统一成「动作」按下/松开，世界逻辑在 world.js。
   动作：left right down jump run melee chalk

   用法：Controls.init({ down: function(action){}, up: function(action){} });
         Controls.paused()   设置面板打开时为 true（world.js 据此暂停）
   同一个动作可以同时被多个来源按住（键盘 A 和 ←、触屏、手柄），全部松开才触发 up。
   设置保存在 localStorage：rdbg.settings.v1 */
(function (root) {
  'use strict';
  var ACTIONS = [
    { id: 'left', name: '向左' }, { id: 'right', name: '向右' }, { id: 'down', name: '向下（穿平台）' },
    { id: 'jump', name: '跳跃' }, { id: 'run', name: '奔跑' }, { id: 'dash', name: '冲刺' }, { id: 'melee', name: '教鞭' }, { id: 'chalk', name: '粉笔' }, { id: 'use', name: '上/下车' }
  ];
  var DEF_KEYS = { left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'], down: ['KeyS', 'ArrowDown'], jump: ['Space', 'KeyW', 'ArrowUp'],
                   run: ['ShiftLeft', 'ShiftRight'], melee: ['KeyJ', 'KeyZ'], chalk: ['KeyL', 'KeyX'], use: ['KeyE'], dash: ['KeyK'] };
  /* 手柄按键下标按标准布局：0 A 1 B 2 X 3 Y 4 LB 5 RB 6 LT 7 RT 8 选择 9 开始 10 L3 11 R3 12 ↑ 13 ↓ 14 ← 15 → ；左摇杆固定控制 左/右/下 */
  var DEF_PAD = { left: [14], right: [15], down: [13], jump: [0], run: [5], melee: [2], chalk: [1], use: [3], dash: [7] };
  var PAD_NAMES = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', '选择', '开始', 'L3', 'R3', '↑', '↓', '←', '→', '主页'];
  var LAYOUTS = [['auto', '自动'], ['phone', '手机'], ['compact', '大屏紧凑'], ['off', '隐藏']];
  /* 触屏按键：grp 相同的按键可以手指滑动切换；toggle 为点一下开/关（奔跑） */
  var BTNS = [
    { id: 'left', label: '◀', grp: 'dpad' }, { id: 'right', label: '▶', grp: 'dpad' }, { id: 'down', label: '▼', grp: 'dpad' },
    { id: 'jump', label: '跳', size: 1.25 }, { id: 'melee', label: '鞭' }, { id: 'chalk', label: '笔' }, { id: 'run', label: '跑', toggle: true }, { id: 'use', label: '车' }, { id: 'dash', label: '冲' }
  ];
  var STORE = 'rdbg.settings.v1';

  var S = load(), api = {}, held = {}, keymap = {}, capture = null, panelOpen = false, editing = false;
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- 设置存取 ---------- */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function load() {
    var d = { layout: 'auto', size: 1, opacity: .8, help: null, volume: .7, muted: false, keys: clone(DEF_KEYS), pad: clone(DEF_PAD), pos: {} };
    try {
      var s = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (s) for (var k in d) if (s[k] != null) d[k] = s[k];
    } catch (e) {}
    /* 旧存档里没有的新动作：用默认键，但跳过已被别的动作占用的 */
    function used(map, c) { return ACTIONS.some(function (o) { return Array.isArray(map[o.id]) && map[o.id].indexOf(c) >= 0; }); }
    ACTIONS.forEach(function (a) {
      if (!Array.isArray(d.keys[a.id])) d.keys[a.id] = DEF_KEYS[a.id].filter(function (c) { return !used(d.keys, c); });
      if (!Array.isArray(d.pad[a.id])) d.pad[a.id] = DEF_PAD[a.id].filter(function (c) { return !used(d.pad, c); });
    });
    return d;
  }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) {} }

  function keyName(c) {
    var m = { Space: '空格', ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', ShiftLeft: '左Shift', ShiftRight: '右Shift',
              ControlLeft: '左Ctrl', ControlRight: '右Ctrl', AltLeft: '左Alt', AltRight: '右Alt', Enter: '回车', Tab: 'Tab', Backquote: '`',
              Comma: ',', Period: '.', Slash: '/', Semicolon: ';', Quote: "'", BracketLeft: '[', BracketRight: ']', Backslash: '\\', Minus: '-', Equal: '=' };
    if (m[c]) return m[c];
    if (/^Key[A-Z]$/.test(c)) return c.slice(3);
    if (/^Digit\d$/.test(c)) return c.slice(5);
    if (/^Numpad/.test(c)) return '小键盘' + c.slice(6);
    return c;
  }
  function padName(i) { return PAD_NAMES[i] || ('键' + i); }

  function rebuildKeymap() {
    keymap = {};
    ACTIONS.forEach(function (a) { S.keys[a.id].forEach(function (c) { keymap[c] = a.id; }); });
  }

  /* ---------- 动作：多来源计数 ---------- */
  function anyHeld(a) { for (var k in held[a]) return true; return false; }
  function down(a, src) {
    var was = anyHeld(a); (held[a] = held[a] || {})[src] = true;
    if (!was && api.down) api.down(a);
  }
  function up(a, src) {
    if (!held[a] || !held[a][src]) return;
    delete held[a][src];
    if (!anyHeld(a) && api.up) api.up(a);
  }
  function releaseAll() {
    ACTIONS.forEach(function (a) { if (held[a.id] && anyHeld(a.id)) { held[a.id] = {}; if (api.up) api.up(a.id); } });
    runOn = false; refreshButtons();
  }

  /* ---------- 键盘 ---------- */
  window.addEventListener('keydown', function (e) {
    if (capture) return;
    if (e.code === 'Escape') { e.preventDefault(); if (editing) endEdit(); else togglePanel(); return; }
    if (e.code === 'KeyF' && !keymap.KeyF && !e.repeat) { e.preventDefault(); toggleFullscreen(); return; }
    if (panelOpen || editing) return;
    var a = keymap[e.code]; if (!a) return;
    e.preventDefault(); if (e.repeat) return;
    down(a, 'k:' + e.code);
  });
  window.addEventListener('keyup', function (e) {
    var a = keymap[e.code]; if (a) up(a, 'k:' + e.code);
  });
  window.addEventListener('blur', releaseAll);
  /* 改键：捕获阶段拦截，避免触发游戏动作 */
  window.addEventListener('keydown', function (e) {
    if (!capture) return;
    e.preventDefault(); e.stopPropagation();
    if (e.code === 'Escape') { capture = null; renderPanel(); return; }
    if (capture.type === 'key') {
      var arr = S.keys[capture.action];
      if (e.code === 'Backspace' || e.code === 'Delete') arr.splice(capture.idx, 1);
      else assignTo(S.keys, e.code);
      finishCapture();
    } else if (e.code === 'Backspace' || e.code === 'Delete') {
      S.pad[capture.action].splice(capture.idx, 1); finishCapture();
    }
  }, true);
  /* 把 code 放进当前格（替换原值，没有则追加）；同一个键只能属于一个动作 */
  function assignTo(map, code) {
    var old = capture.idx < map[capture.action].length ? map[capture.action][capture.idx] : null;
    ACTIONS.forEach(function (a) { map[a.id] = map[a.id].filter(function (c) { return c !== code; }); });
    var arr = map[capture.action], i = old == null ? -1 : arr.indexOf(old);
    if (i >= 0) arr[i] = code; else arr.push(code);
  }
  function finishCapture() { capture = null; rebuildKeymap(); save(); renderPanel(); updateHelp(); }

  /* ---------- 手柄 ---------- */
  var padHeld = {}, padPrev = [], padId = '';
  function activePad() {
    var l = navigator.getGamepads ? navigator.getGamepads() : [];
    for (var i = 0; i < l.length; i++) if (l[i] && l[i].connected) return l[i];
    return null;
  }
  function pollPad() {
    var pad = activePad(), want = {}, cur = [];
    if (pad) {
      var ax = pad.axes[0] || 0, ay = pad.axes[1] || 0;
      if (ax < -.4) want.left = 1; if (ax > .4) want.right = 1; if (ay > .6) want.down = 1;
      for (var i = 0; i < pad.buttons.length; i++) cur[i] = pad.buttons[i].pressed || pad.buttons[i].value > .5;
      ACTIONS.forEach(function (a) { S.pad[a.id].forEach(function (b) { if (cur[b]) want[a.id] = 1; }); });
      if (capture && capture.type === 'pad') {
        for (i = 0; i < cur.length; i++) if (cur[i] && !padPrev[i]) { assignTo(S.pad, i); finishCapture(); break; }
      }
      if (pad.id !== padId) { padId = pad.id; renderPanel(); updateHelp(); }
    } else if (padId) { padId = ''; renderPanel(); updateHelp(); }
    padPrev = cur;
    if (panelOpen || editing || capture) want = {};
    ACTIONS.forEach(function (a) {
      if (want[a.id] && !padHeld[a.id]) { padHeld[a.id] = 1; down(a.id, 'g'); }
      else if (!want[a.id] && padHeld[a.id]) { padHeld[a.id] = 0; up(a.id, 'g'); }
    });
    requestAnimationFrame(pollPad);
  }
  window.addEventListener('gamepadconnected', function (e) { say('🎮 已连接手柄：' + e.gamepad.id.replace(/\(.*$/, '').slice(0, 40)); });
  window.addEventListener('gamepaddisconnected', function () { releaseAll(); say('🎮 手柄已断开'); });

  /* ---------- 触屏按键 ---------- */
  var tc, btnEls = {}, runOn = false, ptrs = {};
  function touchMode() {
    var m = S.layout;
    if (m === 'auto') {
      var touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || (matchMedia && matchMedia('(pointer:coarse)').matches);
      if (!touch) return 'off';
      return Math.min(innerWidth, innerHeight) < 600 ? 'phone' : 'compact';
    }
    return m;
  }
  function posKey(mode) { return mode + (innerWidth < innerHeight ? '-p' : ''); }

  function defaultLayout(mode, W, H) {
    var compact = mode === 'compact', u = (compact ? 60 : 72) * S.size, g = compact ? .1 : .2, m = compact ? 14 : 16, r = {};
    var by = H - m - u / 2, x0 = m + u / 2, jx = W - m - .625 * u, jy = H - m - .625 * u, mx = W - m - u * (1.75 + g), ty = H - m - u * (1.75 + g);
    r.left = [x0, by]; r.right = [x0 + u * (1 + g), by]; r.down = [x0 + u * (1 + g) / 2, by - u * (1 + g)];
    r.jump = [jx, jy]; r.melee = [mx, jy]; r.chalk = [jx, ty]; r.run = [mx, ty]; r.use = [mx - u * (1 + g), ty]; r.dash = [mx - u * (1 + g), jy];
    if (compact) {                                              // 学校大屏：所有按键集中在屏幕中下方，一眼就够得着
      var cx = W / 2, gm = u * .9, rx = cx - gm / 2 - u / 2, ax = cx + gm / 2, mx2 = ax + u / 2, jx2 = ax + u * (1 + g) + .625 * u;
      r.right = [rx, by]; r.left = [rx - u * (1 + g), by]; r.down = [rx - u * (1 + g) / 2, by - u * (1 + g)];
      r.melee = [mx2, jy]; r.jump = [jx2, jy]; r.run = [mx2, ty]; r.chalk = [jx2, ty]; r.use = [jx2 + u * (1 + g), ty]; r.dash = [jx2 + u * (1.125 + g), jy];
    }
    return { u: u, pos: r };
  }
  function layoutButtons() {
    var mode = touchMode(), show = mode !== 'off' || editing;
    tc.style.display = show ? 'block' : 'none';
    tc.style.opacity = editing ? 1 : S.opacity;
    tc.classList.toggle('editing', editing);
    if (!show) return;
    var W = innerWidth, H = innerHeight, eff = mode === 'off' ? 'phone' : mode, d = defaultLayout(eff, W, H), sv = (S.pos[posKey(eff)] || {});
    BTNS.forEach(function (b) {
      var el = btnEls[b.id], sz = d.u * (b.size || 1), p = sv[b.id] ? [sv[b.id][0] * W, sv[b.id][1] * H] : d.pos[b.id];
      var x = Math.max(sz / 2, Math.min(W - sz / 2, p[0])), y = Math.max(sz / 2, Math.min(H - sz / 2, p[1]));
      el.style.width = el.style.height = sz + 'px';
      el.style.left = (x - sz / 2) + 'px'; el.style.top = (y - sz / 2) + 'px';
      el.style.fontSize = Math.round(sz * (b.label.length > 1 ? .3 : .38)) + 'px';
    });
  }
  function refreshButtons() {
    BTNS.forEach(function (b) {
      var on = b.toggle ? runOn : !!(held[b.id] && held[b.id]['t:' + b.id]);
      btnEls[b.id].classList.toggle('on', on);
    });
  }
  function btnOf(id) { for (var i = 0; i < BTNS.length; i++) if (BTNS[i].id === id) return BTNS[i]; }
  function press(b, pid) {
    ptrs[pid] = b.id;
    if (b.toggle) { runOn = !runOn; if (runOn) down(b.id, 't:' + b.id); else up(b.id, 't:' + b.id); }
    else down(b.id, 't:' + b.id);
    refreshButtons();
  }
  function lift(pid) {
    var id = ptrs[pid]; if (!id) return; delete ptrs[pid];
    var b = btnOf(id); if (!b.toggle) up(id, 't:' + id);
    refreshButtons();
  }
  function buildButtons() {
    tc = document.createElement('div'); tc.id = 'tc'; document.body.appendChild(tc);
    BTNS.forEach(function (b) {
      var el = document.createElement('div'); el.className = 'tb tb-' + b.id; el.textContent = b.label; tc.appendChild(el); btnEls[b.id] = el;
      var drag = null;
      el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      el.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        try { el.setPointerCapture(e.pointerId); } catch (_) {}
        if (editing) { var r = el.getBoundingClientRect(); drag = { dx: e.clientX - r.left, dy: e.clientY - r.top, w: r.width }; return; }
        press(b, e.pointerId);
      });
      el.addEventListener('pointermove', function (e) {
        if (drag) {
          var x = Math.max(0, Math.min(innerWidth - drag.w, e.clientX - drag.dx)), y = Math.max(0, Math.min(innerHeight - drag.w, e.clientY - drag.dy));
          el.style.left = x + 'px'; el.style.top = y + 'px'; return;
        }
        var cur = ptrs[e.pointerId]; if (!cur || !b.grp) return;
        var t = document.elementFromPoint(e.clientX, e.clientY), tb = t && t.closest && t.closest('.tb');
        if (!tb) return;
        for (var i = 0; i < BTNS.length; i++) {
          var o = BTNS[i];
          if (btnEls[o.id] === tb && o.id !== cur && o.grp === b.grp) { lift(e.pointerId); press(o, e.pointerId); break; }
        }
      });
      function end(e) {
        if (drag) {
          var r = el.getBoundingClientRect(), k = posKey(touchMode() === 'off' ? 'phone' : touchMode());
          (S.pos[k] = S.pos[k] || {})[b.id] = [(r.left + r.width / 2) / innerWidth, (r.top + r.height / 2) / innerHeight];
          drag = null; save(); return;
        }
        lift(e.pointerId);
      }
      el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    });
    window.addEventListener('resize', layoutButtons);
  }

  /* 编辑按键位置 */
  var bar;
  function startEdit() {
    if (touchMode() === 'off') S.layout = 'phone';
    togglePanel(false); releaseAll(); editing = true;
    bar.style.display = 'flex'; layoutButtons();
  }
  function endEdit() { editing = false; bar.style.display = 'none'; save(); layoutButtons(); }
  function resetPos() { delete S.pos[posKey(touchMode() === 'off' ? 'phone' : touchMode())]; save(); layoutButtons(); }

  /* ---------- 全屏 ---------- */
  function toggleFullscreen() {
    var d = document, de = d.documentElement;
    var on = d.fullscreenElement || d.webkitFullscreenElement;
    try {
      if (on) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
      else if (de.requestFullscreen) de.requestFullscreen().catch(function () { say('全屏被浏览器拒绝'); });
      else if (de.webkitRequestFullscreen) de.webkitRequestFullscreen();
      else say('此浏览器不支持全屏（iPhone 可「添加到主屏幕」后全屏打开）');
    } catch (e) { say('全屏失败'); }
  }

  /* ---------- 浮动小按钮 + 提示 ---------- */
  var toastEl, toastT;
  function say(msg) {
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
  }
  function setLayout(m) { S.layout = m; save(); layoutButtons(); updateHelp(); renderPanel(); }
  function toggleTouchVisible() {
    if (touchMode() === 'off') setLayout(innerWidth < 900 ? 'phone' : 'compact');
    else setLayout('off');
  }
  function buildPill() {
    var pill = document.createElement('div'); pill.id = 'ctl-pill';
    pill.innerHTML = '<button data-a="set" title="设置">⚙</button>';        // 只留设置；小眼睛（显示/隐藏触屏按键）和全屏都在设置面板里
    pill.addEventListener('click', function (e) {
      var a = e.target.getAttribute && e.target.getAttribute('data-a');
      if (a === 'set') togglePanel();
    });
    document.body.appendChild(pill);
    toastEl = document.createElement('div'); toastEl.id = 'ctl-toast'; document.body.appendChild(toastEl);
    bar = document.createElement('div'); bar.id = 'ctl-editbar';
    bar.innerHTML = '<span>拖动按键调整位置</span><button data-a="reset">重置位置</button><button data-a="done" class="pri">完成</button>';
    bar.addEventListener('click', function (e) {
      var a = e.target.getAttribute && e.target.getAttribute('data-a');
      if (a === 'reset') resetPos(); else if (a === 'done') endEdit();
    });
    document.body.appendChild(bar);
  }

  /* ---------- 操作提示（HUD 里的 #help） ---------- */
  function ks(a) { return S.keys[a].map(keyName).join(' / ') || '—'; }
  function updateHelp() {
    var h = $('help'); if (!h) return;
    var visible = S.help === null ? touchMode() === 'off' : !!S.help;
    h.style.display = visible ? '' : 'none';
    if (!visible) return;
    h.innerHTML = '<b>' + ks('left') + '</b> / <b>' + ks('right') + '</b> 行走　<b>' + ks('run') + '</b> 奔跑　<b>' + ks('dash') + '</b> 冲刺（2 段，按时间恢复）<br>' +
      '<b>' + ks('jump') + '</b> 跳跃（空中可再跳一次，松手=小跳）<br><b>' + ks('down') + ' + 跳</b> 穿下平台<br>' +
      '<b>' + ks('melee') + '</b> 教鞭挥击　<b>' + ks('chalk') + '</b> 扔粉笔' +
      (padId ? '<br>🎮 手柄：<b>' + S.pad.jump.map(padName).join('/') + '</b> 跳　<b>' + S.pad.melee.map(padName).join('/') + '</b> 教鞭　<b>' +
        S.pad.chalk.map(padName).join('/') + '</b> 粉笔　<b>' + S.pad.run.map(padName).join('/') + '</b> 奔跑' : '') +
      '<br><b>' + ks('down') + '</b> 空中俯冲重击　<b>' + ks('use') + '</b> 上/下车·登机<br>✈ 战机：<b>' + ks('jump') + '</b> 升　<b>' + ks('down') + '</b> 降　<b>' + ks('melee') + '</b> 投弹　<b>' + ks('chalk') + '</b> 机枪（自动锁定空中目标）<br><b>F</b> 全屏　<b>Esc</b> 设置';
  }

  /* ---------- 设置面板 ---------- */
  var panel;
  function togglePanel(force) {
    panelOpen = force == null ? !panelOpen : force;
    capture = null;
    if (panelOpen) { releaseAll(); renderPanel(); }
    panel.style.display = panelOpen ? 'flex' : 'none';
  }
  function slots(type, a) {
    var arr = type === 'key' ? S.keys[a] : S.pad[a], out = '', i, wait;
    for (i = 0; i <= arr.length && i < 4; i++) {
      wait = capture && capture.type === type && capture.action === a && capture.idx === i;
      if (i < arr.length) out += '<button class="chip' + (wait ? ' wait' : '') + '" data-t="' + type + '" data-a="' + a + '" data-i="' + i + '">' + (wait ? '按下…' : (type === 'key' ? keyName(arr[i]) : padName(arr[i]))) + '</button>';
      else out += '<button class="chip add' + (wait ? ' wait' : '') + '" data-t="' + type + '" data-a="' + a + '" data-i="' + i + '">' + (wait ? '按下…' : '＋') + '</button>';
    }
    return out;
  }
  function renderPanel() {
    if (!panel || !panelOpen) return;
    var h = '<div class="ctl-card"><div class="ctl-head"><h2>设置</h2><button class="x" data-a="close">✕</button></div><div class="ctl-body">';
    h += '<h3>触屏按键</h3><div class="row seg">';
    LAYOUTS.forEach(function (l) { h += '<button data-a="layout" data-v="' + l[0] + '" class="' + (S.layout === l[0] ? 'on' : '') + '">' + l[1] + '</button>'; });
    h += '</div><p class="note">自动：触屏设备显示（小屏用手机布局，大屏用紧凑布局），电脑不显示。</p>';
    h += '<label class="row">按键大小 <input type="range" id="c-size" min="0.6" max="1.8" step="0.05" value="' + S.size + '"></label>';
    h += '<label class="row">按键透明度 <input type="range" id="c-op" min="0.25" max="1" step="0.05" value="' + S.opacity + '"></label>';
    h += '<div class="row"><button data-a="eye">👁 ' + (touchMode() === 'off' ? '显示' : '隐藏') + '触屏按键</button></div>';
    h += '<div class="row"><button data-a="edit">调整按键位置</button><button data-a="resetpos">重置当前布局位置</button></div>';
    h += '<h3>声音 / 全屏</h3><label class="row">音量 <input type="range" id="c-vol" min="0" max="1" step="0.05" value="' + S.volume + '"></label>';
    h += '<div class="row"><label class="chk"><input type="checkbox" id="c-mute"' + (S.muted ? ' checked' : '') + '> 静音</label><button data-a="fs">全屏 / 退出全屏（F）</button></div>';
    h += '<h3>显示</h3><label class="row chk"><input type="checkbox" id="c-help"' + (S.help === null ? (touchMode() === 'off' ? ' checked' : '') : (S.help ? ' checked' : '')) + '> 显示操作提示</label>';
    h += '<h3>键位 <small>点击按键格后按下新键；Backspace 删除；Esc 取消</small></h3><table class="keys"><tr><th>动作</th><th>键盘</th><th>手柄</th></tr>';
    ACTIONS.forEach(function (a) { h += '<tr><td>' + a.name + '</td><td>' + slots('key', a.id) + '</td><td>' + slots('pad', a.id) + '</td></tr>'; });
    h += '</table><div class="row"><button data-a="resetkeys">恢复默认键位</button></div>';
    h += '<p class="note">🎮 手柄：' + (padId ? '已连接 ' + padId.replace(/\(.*$/, '').slice(0, 40) : '未检测到（连接后按任意键）') + '。左摇杆固定控制 左 / 右 / 下。</p>';
    h += '<p class="note"><a href="viewer.html" style="color:#9fd0ff">← 动画浏览器</a></p>';
    h += '</div></div>';
    panel.innerHTML = h;
  }
  function buildPanel() {
    panel = document.createElement('div'); panel.id = 'ctl-panel'; panel.style.display = 'none'; document.body.appendChild(panel);
    panel.addEventListener('click', function (e) {
      var t = e.target; if (t === panel) { togglePanel(false); return; }
      var a = t.getAttribute && t.getAttribute('data-a'); if (!a) return;
      if (a === 'close') togglePanel(false);
      else if (a === 'layout') setLayout(t.getAttribute('data-v'));
      else if (a === 'edit') startEdit();
      else if (a === 'fs') toggleFullscreen();
      else if (a === 'eye') { toggleTouchVisible(); renderPanel(); }
      else if (a === 'resetpos') { resetPos(); say('已重置'); }
      else if (a === 'resetkeys') { S.keys = clone(DEF_KEYS); S.pad = clone(DEF_PAD); capture = null; rebuildKeymap(); save(); renderPanel(); updateHelp(); }
      else if (t.classList.contains('chip')) { capture = { type: t.getAttribute('data-t'), action: a, idx: +t.getAttribute('data-i') }; renderPanel(); }
    });
    panel.addEventListener('input', function (e) {
      if (e.target.id === 'c-size') { S.size = +e.target.value; layoutButtons(); save(); }
      else if (e.target.id === 'c-op') { S.opacity = +e.target.value; layoutButtons(); save(); }
      else if (e.target.id === 'c-vol') { S.volume = +e.target.value; if (root.Sfx) Sfx.setVolume(S.volume); save(); }
    });
    panel.addEventListener('change', function (e) {
      if (e.target.id === 'c-help') { S.help = e.target.checked; save(); updateHelp(); }
      else if (e.target.id === 'c-mute') { S.muted = e.target.checked; if (root.Sfx) Sfx.setMuted(S.muted); save(); }
      else if (e.target.id === 'c-vol' && root.Sfx) Sfx.play('hit');
    });
  }

  /* ---------- 入口 ---------- */
  api.init = function (cb) {
    api.down = cb.down; api.up = cb.up;
    if (root.Sfx) { Sfx.setVolume(S.volume); Sfx.setMuted(S.muted); }
    rebuildKeymap(); buildButtons(); buildPill(); buildPanel();
    layoutButtons(); refreshButtons(); updateHelp();
    requestAnimationFrame(pollPad);
  };
  /* 临时改触屏按键文字（战机模式用）；relabel(null) 还原 */
  api.relabel = function (m) { BTNS.forEach(function (b) { if (btnEls[b.id]) btnEls[b.id].textContent = (m && m[b.id]) || b.label; }); };
  api.paused = function () { return panelOpen; };
  api.key = function (a) { return S.keys[a][0] ? keyName(S.keys[a][0]) : '—'; };
  api.touchVisible = function () { return touchMode() !== 'off'; };
  root.Controls = api;
})(window);
