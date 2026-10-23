/* 大地图：在一条很长的横版地图里行走、跳跃、攻击。
   依赖：hero.js（角色动画）、map.js（地图数据）。这里只做「世界」：输入、物理、镜头、木桩、HUD。
   默认键位：A/D 或 ←/→ 走　Shift 跑　空格/W/↑ 跳（空中再按一次 = 二段跳，松开提前结束 = 小跳）　↓+跳 穿下平台　J/Z 教鞭　L/X 粉笔
   键位可在设置里改；另支持触屏按键与手柄（见 controls.js）
   调试参数（URL）：world.html?at=3000          从 x=3000 开始
                    world.html?auto=right,melee 自动执行按键（right left run jump melee chalk use，逗号分隔），截图/测试用 */
(function () {
  'use strict';
  var M = window.WORLD_MAP, $ = function (id) { return document.getElementById(id); };
  var VW = 1280, VH = 720, SCALE = 0.24;
  /* 手感：加速/刹车快、重力大（起落干脆）、攻击时移动惩罚小、输入有缓冲 */
  var GRAVITY = 2300, FALL_MUL = 1.3, HANG_MUL = .55, JUMP_V = 800, DJUMP_V = 740, CUT_V = 300, MAX_FALL = 1250;
  var WALK_V = 270, RUN_V = 470, ACC_G = 30, DEC_G = 24, ACC_A = 16, DEC_A = 6;
  /* 冲刺：往前猛冲一小段（空中也行），共 2 段，每段恢复 DASH_REGEN 秒；奔跑（Shift）不耗体力 */
  var DASH_V = 900, DASH_T = .2, DASH_REGEN = 2.4, DASH_MAX = 2;
  /* 载具 */
  var SLAM_V = 1500, SLAM_R = 190;
  /* 战机：巡航速度恒定向前，按住前进方向加速，反方向 = 掉头；升降直接控制高度 */
  var PL_CRUISE = 250, PL_FAST = 540, PL_BOOST = 800, PL_CLIMB = 340, PL_DIVE = 400, PL_CEIL = -520, PL_GUN_R = 820, PL_GUN_RATE = .075, BOMB_CD = .5, BOMB_G = 1500, BOMB_R = 175;
  var V_MAX = 330, V_BOOST = 560, GUN_R = 620, GUN_RATE = .085, BOARD_R = 130;

  var q = {};
  location.search.replace(/^\?/, '').split('&').forEach(function (kv) { var a = kv.split('='); if (a[0]) q[a[0]] = decodeURIComponent(a[1] || ''); });

  var world = $('world'), game = $('game');

  /* ---------- 适应窗口 ---------- */
  function fit() {
    var s = Math.min(innerWidth / VW, innerHeight / VH);
    game.style.transform = 'scale(' + s + ')';
    game.style.left = (innerWidth - VW * s) / 2 + 'px';
    game.style.top = (innerHeight - VH * s) / 2 + 'px';
  }
  window.addEventListener('resize', fit); fit();

  /* ---------- 搭建世界 ---------- */
  function box(cls, x, y, w, h, parent) {
    var d = document.createElement('div');
    d.className = cls; d.style.left = x + 'px'; d.style.top = y + 'px';
    if (w) d.style.width = w + 'px'; if (h) d.style.height = h + 'px';
    (parent || world).appendChild(d); return d;
  }
  box('ground', 0, M.groundY, M.width, 600);
  M.platforms.forEach(function (p) { box('platform', p.x, p.y, p.w, 28); });
  M.signs.forEach(function (s) { var d = box('sign', s.x - 48, M.groundY - 120); d.appendChild(document.createElement('span')).textContent = s.text; });
  box('flag', M.goal.x - 14, M.groundY - 214);

  var dummies = M.dummies.map(function (d) {
    var y = d.y == null ? M.groundY : d.y, el = box('dummy', d.x - 45, y - 130);
    var pips = document.createElement('div'); pips.className = 'pips'; el.appendChild(pips);
    for (var i = 0; i < 3; i++) pips.appendChild(document.createElement('i'));
    return { x: d.x, y: y, el: el, pips: pips.children, hp: 3, respawn: 0, lastHit: -1, mark: null };
  });

  /* 小怪：和木桩一样放进 dummies，这样教鞭/粉笔/机枪/撞击/俯冲全都能打到；mob 字段是它们的 AI 设定 */
  var MOBS = {
    slime:   { w: 64, h: 52, hp: 2, speed: 80, sight: 440, touch: 10 },
    bat:     { w: 60, h: 44, hp: 1, speed: 130, sight: 560, touch: 8, air: true },
    shooter: { w: 60, h: 70, hp: 3, speed: 0, sight: 600, touch: 0 },
    balloon: { w: 56, h: 72, hp: 1, speed: 0, sight: 0, touch: 0, air: true },
    drone:   { w: 72, h: 38, hp: 2, speed: 70, sight: 640, touch: 8, air: true },
    blimp:   { w: 170, h: 76, hp: 6, speed: 0, sight: 0, touch: 0, air: true }
  };
  M.mobs.forEach(function (m) {
    var t = MOBS[m.type], y = m.y == null ? M.groundY : m.y, el = box('mob mob-' + m.type, m.x - t.w / 2, y - t.h, t.w, t.h);
    var mb = document.createElement('div'); mb.className = 'mb'; el.appendChild(mb);
    var pips = document.createElement('div'); pips.className = 'pips'; el.appendChild(pips);
    for (var i = 0; i < t.hp; i++) pips.appendChild(document.createElement('i'));
    dummies.push({ x: m.x, y: y, hx: m.x, hy: y, w: t.w, h: t.h, el: el, pips: pips.children, hp: t.hp, maxHp: t.hp, respawn: 1.2, lastHit: -1, mark: null,
                   mob: t, type: m.type, cd: 1 + Math.random(), t: Math.random() * 6 });
  });
  var orbs = [], pickups = [];
  function addPickup(x, y, type, persist) {
    var el = box('pickup ' + type, x - 17, y - 58, 34, 34);
    el.textContent = type === 'heal' ? '✚' : '盾';
    pickups.push({ x: x, y: y, type: type, el: el, persist: persist, taken: false, t: 25, respawn: 0 });
  }
  (M.pickups || []).forEach(function (p) { addPickup(p.x, p.y == null ? M.groundY : p.y, p.type, true); });

  var vehicles = (M.vehicles || []).map(function (v) { return new Vehicle(world, v.x, M.groundY, 'svg/world/'); });
  var planes = (M.planes || []).map(function (p) { return new Plane(world, p.x, M.groundY - Plane.GEAR, 'svg/world/'); });
  var vprompt = box('vprompt', 0, 0); vprompt.style.display = 'none';

  /* ---------- 角色 ---------- */
  var chalks = [];
  var hero = new Hero(world, { scale: SCALE, base: 'svg/', onEvent: function (name, d) {
    if (name !== 'chalk') return;
    Sfx.play('chalk');
    var im = document.createElement('img');
    im.src = 'svg/chalk.svg'; im.className = 'chalk'; world.appendChild(im);
    chalks.push({ el: im, x: P.x + d.x, y: P.y + d.y, vx: 860 * hero.facing, vy: -90, life: 1.8 });
  } });

  var P = { slam: false, x: +q.at || M.spawn.x, y: M.groundY, vx: 0, vy: 0, on: true, platform: null, dropT: 0, coyote: 0, jumpBuf: 0, air: 0, wasOn: true };
  var keys = {}, dashCharge = 2, dashT = 0, dashDir = 1, ghostT = 0, driveBoost = 0, atkBuf = null, atkT = 0, driving = null, mount = null, piloting = null, bombs = [], bombT = 0, pgunT = 0, lockEl = null, gunT = 0, bullets = [], ko = 0, camX = 0, camY = 0, hitstop = 0, shake = 0, finished = false, slamId = 0, trailT = 0, engOn = false;
  var HP_MAX = 100, SH_MAX = 50, hp = HP_MAX, shield = 0, invuln = 0, hpShown = HP_MAX, shShown = 0;

  /* ---------- 输入 ----------
     键盘 / 触屏 / 手柄 都由 controls.js 统一成动作（left right down jump run melee chalk）按下/松开 */
  function press(k) {
    keys[k] = true;
    if (k === 'use') { toggleVehicle(); return; }
    if (k === 'dash') { startDash(); return; }
    if (piloting) { if (k === 'melee') dropBomb(); return; }
    if (driving || mount) return;
    if (k === 'jump') P.jumpBuf = .14;
    else if (k === 'down') { if (!P.on && !P.slam && P.dropT <= 0 && supportBelow() - P.y > 40) startSlam(); }
    else if (k === 'melee' || k === 'chalk') {
      if (hero.attack(k)) { if (k === 'melee') Sfx.play('swing'); }
      else { atkBuf = k; atkT = .2; }                          // 攻击中按下：缓冲，收招后自动接上
    }
  }
  function release(k) {
    keys[k] = false;
    /* 松开跳跃键：提前截断上升 → 可变跳跃高度 */
    if (k === 'jump' && P.vy < -CUT_V && !P.on) P.vy = -CUT_V;
  }
  Controls.init({ down: press, up: release });

  if (q.auto) q.auto.split(',').forEach(function (k) { if (k === 'melee' || k === 'chalk' || k === 'use') setTimeout(function () { press(k); }, 150); else keys[k] = true; });

  /* ---------- HUD ---------- */
  var mini = $('mini'), heroMark = document.createElement('b');
  dummies.forEach(function (d) { var i = document.createElement('i'); i.style.left = d.x / M.width * 100 + '%'; mini.appendChild(i); d.mark = i; });
  mini.appendChild(heroMark);
  $('total').textContent = dummies.length;
  function toast(msg) { var t = $('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(function () { t.classList.remove('show'); }, 3200); }

  /* ---------- 木桩 ---------- */
  function pop(x, y, text, cls) {
    var p = box('pop' + (cls ? ' ' + cls : ''), x - 10, y, 0, 0); p.textContent = text;
    p.addEventListener('animationend', function () { p.remove(); });
  }
  /* fx：0 普通命中　1 机枪（轻，不顿帧）　2 撞击（重）　3 俯冲重击　4 炸弹 */
  function hurt(d, n, fx) {
    if (d.hp <= 0) return;
    n = n || 1; d.hp = Math.max(0, d.hp - n);
    if (!fx) { hitstop = .05; shake = .12; } else if (fx === 2) { hitstop = .07; shake = .3; } else if (fx === 3) { hitstop = .05; shake = .2; } else if (fx === 4) { hitstop = .06; shake = .35; }
    Sfx.play(fx === 2 ? 'ram' : 'hit');
    pop(d.x, d.y - (d.h || 130) - 20, fx === 2 ? '撞!' : fx === 3 ? '砸!' : fx === 4 ? '炸!' : '-' + n);
    d.el.classList.remove('hit'); void d.el.offsetWidth; d.el.classList.add('hit');
    for (var i = 0; i < d.pips.length; i++) d.pips[i].className = i < d.hp ? '' : 'off';
    if (d.hp <= 0) {
      if (d.mob) dropLoot(d);
      if (d.mob && d.mob.air) for (var k = 0; k < 6; k++) Vehicle.puff(world, d.x + (Math.random() - .5) * d.w * .7, d.y - d.h / 2 + (Math.random() - .5) * d.h * .6, 12 + Math.random() * 14, (Math.random() - .5) * 120);
      Sfx.play('ko');
      d.el.classList.add('down'); d.respawn = 4; ko++; d.mark.className = 'dead';
      $('ko').textContent = ko;
    }
  }
  function overlap(d, x0, y0, x1, y1) { var hw = (d.w || 60) / 2, h = d.h || 125; return x1 > d.x - hw && x0 < d.x + hw && y1 > d.y - h && y0 < d.y; }

  /* ---------- 物理 ---------- */
  function supportBelow() {
    var best = M.groundY;
    M.platforms.forEach(function (p) { if (P.x >= p.x - 6 && P.x <= p.x + p.w + 6 && p.y >= P.y - 2 && p.y < best) best = p.y; });
    return best;
  }
  /* ---------- 冲刺（两段，按时间恢复） ---------- */
  function rechargeDash(dt) {
    var before = dashCharge;
    dashCharge = Math.min(DASH_MAX, dashCharge + dt / DASH_REGEN);
    if (Math.floor(dashCharge) > Math.floor(before)) {
      Sfx.play('ready');
      var seg = $('stam').children[Math.floor(dashCharge) - 1];
      if (seg) { seg.classList.remove('ping'); void seg.offsetWidth; seg.classList.add('ping'); }
    }
  }
  function endDash() { if (dashT > 0) { dashT = 0; hero.setDash(false); } }
  function startDash() {
    if (mount || P.slam || dashT > 0 || driveBoost > 0) return;
    if (dashCharge < 1) { Sfx.play('tired'); return; }
    var dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    dashCharge -= 1; Sfx.play('dash');
    if (driving || piloting) { driveBoost = .9; if (driving) driving.kick(-.4); return; }       // 开车 / 开飞机时：冲刺 = 短时间涡轮加速
    dashDir = dir || hero.facing; dashT = DASH_T; ghostT = 0;
    hero.setDash(true); hero.setFacing(dashDir); hero.kick(-.25);
  }

  /* ---------- 载具 ---------- */
  function nearVehicle() {
    var best = null, bd = BOARD_R;
    vehicles.concat(planes).forEach(function (v) {
      var d = Math.abs(v.x - P.x) - (v.isPlane ? 70 : 0);
      if (v.isPlane && (v === piloting || v.y < M.groundY - Plane.GEAR - 4)) return;     // 空中的飞机上不去
      if (d < bd && P.y > M.groundY - 120) { bd = d; best = v; }
    });
    return best;
  }
  function toggleVehicle() {
    if (mount) return;
    if (piloting) {                                             // 离机：跳出座舱（在空中就是跳伞，落地不掉血）
      var pl = piloting; piloting = null; pgunT = 0; setLock(null);
      hero.el.style.display = '';
      P.x = pl.x; P.y = pl.y - 20; P.vy = -260; P.vx = pl.facing * 160; P.on = false; P.air = 1; P.coyote = 0;
      hero.setFacing(pl.facing); Sfx.play('exit'); Controls.relabel(null);
      $('vhud').style.display = 'none';
      return;
    }
    if (driving) {                                              // 下车：从车顶跳出
      var v = driving; driving = null; gunT = 0;
      hero.el.style.display = '';
      P.x = v.x; P.y = M.groundY - 100; P.vy = -380; P.vx = v.facing * 180; P.on = false; P.air = 1; P.coyote = 0;
      hero.setFacing(v.facing); v.kick(-.5); v.aim(null); Sfx.play('exit');
      $('vhud').style.display = 'none';
      return;
    }
    var n = nearVehicle(); if (!n) return;
    if (P.slam) { P.slam = false; hero.setSlam(false); }
    endDash(); Sfx.play('board');
    mount = { v: n, t: 0, sx: P.x, sy: P.y }; P.vx = 0; P.vy = 0;
  }
  function mountStep(dt) {
    var m = mount, u = Math.min(1, m.t += dt / .24);
    P.x = m.sx + (m.v.x - m.sx) * u;
    P.y = m.sy + (M.groundY - 60 - m.sy) * u - Math.sin(u * Math.PI) * 70;
    hero.setLocomotion(0, true, u < .5 ? -300 : 300); hero.setAltitude(0);
    hero.update(dt); hero.place(P.x, P.y);
    if (u >= 1 && m.v.isPlane) {
      piloting = m.v; mount = null; hero.el.style.display = 'none'; pgunT = 0; bombT = 0;
      piloting.facing = hero.facing; shake = .12; Sfx.play('board');
      Controls.relabel({ jump: '升', down: '降', melee: '弹', chalk: '枪', use: '离' });
      var ph = $('vhud'); ph.style.display = 'block';
      ph.textContent = '战机 · ' + Controls.key('jump') + ' 升 / ' + Controls.key('down') + ' 降 · ' + Controls.key('melee') + ' 投弹 · ' + Controls.key('chalk') + ' 机枪（自动锁定空中目标） · ' + Controls.key('dash') + ' 加速 · ' + Controls.key('use') + ' 离机';
    } else if (u >= 1) {
      driving = m.v; mount = null; hero.el.style.display = 'none';
      driving.facing = hero.facing; driving.kick(.7); shake = .12;
      var h = $('vhud'); h.style.display = 'block'; h.textContent = '装甲车 · 撞击 + 机枪自动扫射 · ' + Controls.key('dash') + ' 加速冲刺 · ' + (Controls.touchVisible() ? '「车」键' : Controls.key('use')) + ' 下车';
    }
  }
  function driveStep(dt) {
    var v = driving, dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), i, d;
    driveBoost = Math.max(0, driveBoost - dt);
    var boost = driveBoost > 0;
    var rate = dir ? (v.vx * dir < 0 ? 6 : 3.4) : 2.4;          // 车身重：起步慢、有惯性
    v.vx += (dir * (boost ? V_BOOST : V_MAX) - v.vx) * (1 - Math.exp(-dt * rate));
    if (!dir && Math.abs(v.vx) < 5) v.vx = 0;
    if (dir) v.facing = dir;
    v.x += v.vx * dt;
    if (v.x < 90 || v.x > M.width - 90) { v.x = Math.max(90, Math.min(M.width - 90, v.x)); v.vx = 0; }
    P.x = v.x; P.y = M.groundY; P.vx = 0; P.vy = 0; P.on = true;
    hero.setFacing(v.facing);
    if (Math.abs(v.vx) > 150) {                                  // 重装撞击
      var fx = v.x + (v.vx > 0 ? 70 : -70);
      for (i = 0; i < dummies.length; i++) {
        d = dummies[i];
        if (d.hp > 0 && d.y >= M.groundY - 1 && Math.abs(d.x - fx) < 75) hurt(d, 3, 2);
      }
    }
  }
  /* 机枪：自动锁定射程内最近的木桩（含平台上的），炮塔转向后连射 */
  function gunStep(dt) {
    var v = driving, pv = v.pivot(), best = null, bd = GUN_R * GUN_R, bx = 0, by = 0, i, d, dx, dy, dd;
    gunT -= dt;
    for (i = 0; i < dummies.length; i++) {
      d = dummies[i]; if (d.hp <= 0) continue;
      dx = d.x - pv.x; dy = d.y - (d.h || 120) / 2 - pv.y; dd = dx * dx + dy * dy;
      if (dd < bd) { bd = dd; best = d; bx = dx; by = dy; }
    }
    if (best) v.aim(bx, by); else v.aim(null);
    if (best && gunT <= 0 && v.aimError() < 10) {
      gunT = GUN_RATE;
      var m = v.muzzle(), a = Math.atan2(m.dy, m.dx) + (Math.random() - .5) * .07, el = document.createElement('div');
      el.className = 'bullet'; world.appendChild(el);
      bullets.push({ el: el, x: m.x, y: m.y, vx: Math.cos(a) * 1500, vy: Math.sin(a) * 1500, a: a, life: .6 });
      v.fire(); Sfx.play('mg'); shake = Math.max(shake, .03);
    }
  }
  function bulletStep(dt) {
    for (var i = bullets.length - 1; i >= 0; i--) {
      var b = bullets[i], j, d;
      b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt;
      b.el.style.transform = 'translate(' + (b.x - 14).toFixed(1) + 'px,' + (b.y - 1.5).toFixed(1) + 'px) rotate(' + (b.a * 57.296).toFixed(1) + 'deg)';
      var gone = b.life <= 0 || b.y >= M.groundY || b.x < 0 || b.x > M.width;
      for (j = 0; !gone && j < dummies.length; j++) {
        d = dummies[j];
        if (d.hp > 0 && overlap(d, b.x - 8, b.y - 4, b.x + 8, b.y + 4)) { hurt(d, 1, 1); gone = true; }
      }
      if (gone) { b.el.remove(); bullets.splice(i, 1); }
    }
  }
  function vehiclesStep(dt) {
    vehicles.forEach(function (v) {
      if (v === driving) v.update(dt, { vx: v.vx || 0, driven: true });
      else { v.vx = (v.vx || 0) * Math.exp(-dt * 3); if (Math.abs(v.vx) < 2) v.vx = 0; v.x += v.vx * dt; v.update(dt, { vx: v.vx, driven: false }); }
    });
    if (driving) gunStep(dt);
    planesStep(dt);
    bulletStep(dt);
    var rider = driving || piloting;
    if (rider || engOn) { Sfx.engine(!!rider, driving ? Math.abs(driving.vx) / V_MAX : piloting ? Math.abs(piloting.vx) / PL_FAST * .9 : 0); engOn = !!rider; }
    var n = !driving && !piloting && !mount && nearVehicle();
    vprompt.style.display = n ? 'block' : 'none';
    if (n) {
      vprompt.style.left = n.x + 'px'; vprompt.style.top = (M.groundY - 150) + 'px';
      vprompt.textContent = Controls.touchVisible() ? '点「车」上车' : '按 ' + Controls.key('use') + ' 上车';
    }
  }

  /* ---------- 战机 ---------- */
  function planeGrounded(pl) { return pl.y >= M.groundY - Plane.GEAR - 1; }
  function flyStep(dt) {
    var pl = piloting, dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), up = (keys.jump ? 1 : 0) - (keys.down ? 1 : 0);
    driveBoost = Math.max(0, driveBoost - dt);
    var air = !planeGrounded(pl) || up > 0;
    if (dir) pl.facing = dir;
    var tv = air ? pl.facing * (driveBoost > 0 ? PL_BOOST : dir === pl.facing ? PL_FAST : PL_CRUISE) : dir * 220;
    pl.vx += (tv - pl.vx) * (1 - Math.exp(-dt * 2.4));
    var tvy = up > 0 ? -PL_CLIMB : up < 0 ? PL_DIVE : 0;
    pl.vy += (tvy - pl.vy) * (1 - Math.exp(-dt * 4));
    pl.x = Math.max(90, Math.min(M.width - 90, pl.x + pl.vx * dt));
    pl.y += pl.vy * dt;
    if (pl.y > M.groundY - Plane.GEAR) { pl.y = M.groundY - Plane.GEAR; if (pl.vy > 0) pl.vy = 0; }
    if (pl.y < PL_CEIL) { pl.y = PL_CEIL; if (pl.vy < 0) pl.vy = 0; }
    P.x = pl.x; P.y = pl.y; P.vx = 0; P.vy = 0; P.on = true;
    hero.setFacing(pl.facing);
    if (planeGrounded(pl) && Math.abs(pl.vx) > 40 && Math.random() < dt * 20) Vehicle.puff(world, pl.x - pl.facing * 140, M.groundY - 6, 12 + Math.random() * 10, -pl.facing * 30);
  }
  function setLock(d) {
    var el = d ? d.el : null;
    if (lockEl === el) return;
    if (lockEl) lockEl.classList.remove('lock');
    lockEl = el;
    if (lockEl) lockEl.classList.add('lock');
  }
  /* 机枪：自动锁定机头前方扇形内最近的空中目标；按住机枪键则无目标时也向前扫射（可扫地面） */
  function planeGun(dt) {
    var pl = piloting, m = pl.muzzle(), best = null, bd = PL_GUN_R * PL_GUN_R, bx = 0, by = 0, i, d, dx, dy, dd;
    pgunT -= dt;
    for (i = 0; i < dummies.length; i++) {
      d = dummies[i]; if (d.hp <= 0 || !d.mob || !d.mob.air) continue;
      dx = d.x - m.x; dy = (d.y - d.h / 2) - m.y; dd = dx * dx + dy * dy;
      if (dd < bd && dx * pl.facing > 0 && Math.abs(Math.atan2(dy, dx * pl.facing)) < .95) { bd = dd; best = d; bx = dx; by = dy; }
    }
    setLock(best);
    if ((best || keys.chalk) && pgunT <= 0) {
      pgunT = PL_GUN_RATE;
      var a = (best ? Math.atan2(by, bx) : (pl.facing > 0 ? 0 : Math.PI)) + (Math.random() - .5) * .06, el = document.createElement('div');
      el.className = 'bullet'; world.appendChild(el);
      bullets.push({ el: el, x: m.x, y: m.y, vx: Math.cos(a) * 1600 + pl.vx * .4, vy: Math.sin(a) * 1600, a: a, life: .55 });
      pl.fire(); Sfx.play('mg'); shake = Math.max(shake, .03);
    }
  }
  function dropBomb() {
    var pl = piloting;
    if (bombT > 0 || planeGrounded(pl)) return;
    bombT = BOMB_CD;
    var el = box('bomb', 0, 0);
    bombs.push({ el: el, x: pl.x - pl.facing * 10, y: pl.y + 58, vx: pl.vx * .95, vy: 80 });
    Sfx.play('drop');
  }
  function explode(x, y) {
    hitstop = Math.max(hitstop, .07); shake = .45; Sfx.play('bomb');
    var fire = box('boom', x - 75, y - 75); fire.addEventListener('animationend', function () { fire.remove(); });
    var ring = box('shock', x, y - 4); ring.addEventListener('animationend', function () { ring.remove(); });
    for (var i = 0; i < 12; i++) Vehicle.puff(world, x + (Math.random() - .5) * 90, y - 10 - Math.random() * 40, 16 + Math.random() * 20, (i < 6 ? -1 : 1) * (40 + Math.random() * 120));
    dummies.forEach(function (d) {
      if (d.hp <= 0) return;
      var dx = d.x - x, dy = (d.y - (d.h || 125) / 2) - y;
      if (dx * dx + dy * dy < BOMB_R * BOMB_R) hurt(d, 3, 4);
    });
  }
  function bombStep(dt) {
    for (var i = bombs.length - 1; i >= 0; i--) {
      var b = bombs[i], py = b.y, j, d, hit = false, hy = b.y;
      b.vy += BOMB_G * dt; b.vx *= Math.exp(-dt * .25); b.x += b.vx * dt; b.y += b.vy * dt;
      b.el.style.transform = 'translate(' + b.x.toFixed(1) + 'px,' + b.y.toFixed(1) + 'px) rotate(' + (Math.atan2(b.vy, b.vx) * 57.296).toFixed(1) + 'deg)';
      if (b.y >= M.groundY) { hit = true; hy = M.groundY; }
      for (j = 0; !hit && j < M.platforms.length; j++) {
        var p = M.platforms[j];
        if (b.x >= p.x && b.x <= p.x + p.w && py <= p.y && b.y >= p.y) { hit = true; hy = p.y; }
      }
      for (j = 0; !hit && j < dummies.length; j++) {
        d = dummies[j];
        if (d.hp > 0 && overlap(d, b.x - 12, b.y - 8, b.x + 12, b.y + 8)) hit = true;
      }
      if (hit) { b.el.remove(); bombs.splice(i, 1); explode(b.x, hy); }
    }
  }
  function planesStep(dt) {
    bombT -= dt;
    planes.forEach(function (pl) {
      if (pl !== piloting) {                                      // 没人驾驶：惯性滑行，空中就坠落到地面
        pl.vx *= Math.exp(-dt * 2);
        pl.x = Math.max(90, Math.min(M.width - 90, pl.x + pl.vx * dt));
        if (!planeGrounded(pl)) {
          pl.vy = Math.min(800, pl.vy + 900 * dt); pl.y += pl.vy * dt;
          if (pl.y >= M.groundY - Plane.GEAR) { pl.y = M.groundY - Plane.GEAR; if (pl.vy > 350) { shake = Math.max(shake, .25); Sfx.play('impact'); } pl.vy = 0; }
        }
      }
      pl.update(dt, { vx: pl.vx, vy: pl.vy, flying: !planeGrounded(pl), engine: pl === piloting });
    });
    if (piloting) planeGun(dt); else setLock(null);
    bombStep(dt);
  }

  /* ---------- 俯冲重击：空中按 ↓ ---------- */
  function startSlam() {
    endDash(); P.slam = true; slamId++; P.vy = Math.max(P.vy, 900); P.vx *= .25; P.jumpBuf = 0; P.coyote = 0;
    hero.setSlam(true); Sfx.play('slam');
  }
  function slamLand() {
    P.slam = false; hero.setSlam(false);
    hitstop = Math.max(hitstop, .09); shake = .42; hero.kick(.5); Sfx.play('impact');
    var ring = box('shock', P.x, P.y - 4); ring.addEventListener('animationend', function () { ring.remove(); });
    for (var i = 0; i < 10; i++) Vehicle.puff(world, P.x + (Math.random() - .5) * 40, P.y - 6, 14 + Math.random() * 14, (i < 5 ? -1 : 1) * (50 + Math.random() * 90));
    dummies.forEach(function (d) {
      if (d.hp > 0 && d.lastSlam !== slamId && Math.abs(d.x - P.x) < SLAM_R && Math.abs(d.y - P.y) < 80) { d.lastSlam = slamId; hurt(d, 2, 3); }
    });
  }

  function step(dt) {
    if (mount) { mountStep(dt); return; }
    var dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), atk = hero.isAttacking();
    if (atkBuf && (atkT -= dt) <= 0) atkBuf = null;
    if (atkBuf && !atk && hero.attack(atkBuf)) { if (atkBuf === 'melee') Sfx.play('swing'); atkBuf = null; atk = true; }
    var slow = atk ? (hero.attackName() === 'melee' ? .6 : .8) : 1;
    var target = dir * (keys.run ? RUN_V : WALK_V) * slow;
    var moving = dir && Math.abs(target) >= Math.abs(P.vx) && (P.vx * dir >= 0);
    var rate = P.on ? (moving ? ACC_G : DEC_G) : (moving ? ACC_A : DEC_A);
    if (dir && P.vx * dir < 0) rate *= 2.2;                    // 反向：更快刹住转身
    P.vx += (target - P.vx) * (1 - Math.exp(-dt * rate));
    if (!dir && Math.abs(P.vx) < 4) P.vx = 0;
    if (dir && !atk && dashT <= 0) hero.setFacing(dir);
    if (dashT > 0) {                                           // 冲刺中：水平速度锁定、不受重力，身后留残影和速度线
      dashT -= dt; P.vx = dashDir * DASH_V;
      if ((ghostT -= dt) <= 0) { ghostT = .045; hero.ghost(world); Hero.streak(world, P.x - dashDir * 30, P.y - 40 - Math.random() * 110, dashDir); }
      if (dashT <= 0) { hero.setDash(false); P.vx = dashDir * RUN_V; }
    }

    /* 跳跃：缓冲 + 土狼时间 */
    if (P.slam) P.jumpBuf = 0;
    P.jumpBuf -= dt; P.coyote = P.on ? .1 : P.coyote - dt;
    if (P.jumpBuf > 0 && P.coyote > 0) {
      if (keys.down && P.platform) { P.dropT = .28; P.on = false; P.platform = null; }
      else { P.vy = -JUMP_V; hero.kick(-.16); Sfx.play('jump'); endDash(); }
      P.on = false; P.coyote = 0; P.jumpBuf = 0; P.air = 1;
    } else if (P.jumpBuf > 0 && !P.on && P.air < 2) {          // 二段跳
      P.vy = -DJUMP_V; P.air = 2; P.jumpBuf = 0; P.vx += dir * 40;
      hero.doubleJump(); hero.kick(-.1); Sfx.play('djump'); endDash();
    }
    if (P.slam) {                                              // 俯冲：急速下坠，水平几乎锁死，身后拖气流
      P.vy = Math.min(SLAM_V, P.vy + 7000 * dt); P.vx *= Math.exp(-dt * 10);
      if ((trailT -= dt) <= 0) { trailT = .025; Vehicle.puff(world, P.x + (Math.random() - .5) * 36, P.y - 20 - Math.random() * 80, 9, 0); }
    } else if (dashT > 0) { P.vy = 0;
    } else if (!P.on) {
      var g = GRAVITY;
      if (P.vy > 0) g *= FALL_MUL;
      else if (Math.abs(P.vy) < 140 && keys.jump) g *= HANG_MUL; // 顶点滞空
      P.vy = Math.min(MAX_FALL, P.vy + g * dt);
    }

    var prevY = P.y;
    P.x = Math.max(24, Math.min(M.width - 24, P.x + P.vx * dt));
    P.y += P.vy * dt;
    P.dropT -= dt;

    P.on = false; P.platform = null;
    var land = P.vy;
    if (P.y >= M.groundY) { P.y = M.groundY; P.vy = 0; P.on = true; }
    else if (P.vy >= 0 && P.dropT <= 0) {
      for (var i = 0; i < M.platforms.length; i++) {
        var p = M.platforms[i];
        if (P.x >= p.x - 6 && P.x <= p.x + p.w + 6 && prevY <= p.y + 1 && P.y >= p.y) { P.y = p.y; P.vy = 0; P.on = true; P.platform = p; break; }
      }
    }

    if (P.on) {
      P.air = 0;
      if (P.slam) slamLand();
      else if (!P.wasOn) { hero.kick(Math.min(.2, .06 + land / 6000)); if (land > 420) Sfx.play('land'); }
    }
    P.wasOn = P.on;
    hero.setSlam(P.slam);
    hero.setLocomotion(P.on ? (Math.abs(P.vx) > 20 ? Math.abs(P.vx) / WALK_V : 0) : 0, !P.on, P.vy);
    hero.setAltitude(P.on ? 0 : supportBelow() - P.y);
    hero.update(dt);
    hero.place(P.x, P.y);
  }

  /* ---------- 玩家受伤 / 道具 / 小怪 ---------- */
  function dropLoot(d) {
    var r = Math.random(), y = d.mob.air ? M.groundY : d.y;
    if (r < .4) addPickup(d.x, y, 'heal', false); else if (r < .75) addPickup(d.x, y, 'shield', false);
  }
  function hurtPlayer(n, dir) {
    if (invuln > 0 || driving || piloting || mount) return;     // 开车 / 开飞机时免疫
    var ab = Math.min(shield, n); shield -= ab; hp -= n - ab;
    invuln = .9; shake = Math.max(shake, .22); hitstop = Math.max(hitstop, .04);
    endDash(); if (P.slam) { P.slam = false; hero.setSlam(false); }
    P.vx = dir * 340; P.vy = -320; P.on = false; P.coyote = 0; hero.kick(.3);
    pop(P.x, P.y - 200, '-' + n, 'red'); Sfx.play('hurt');
    $('hpwrap').classList.remove('hit'); void $('hpwrap').offsetWidth; $('hpwrap').classList.add('hit');
    if (hp <= 0) die();
  }
  function die() {                                             // 倒下：回到最近的路牌检查点，满血、清盾
    var cp = M.spawn.x;
    M.signs.forEach(function (sg) { if (sg.x <= P.x && sg.x > cp) cp = sg.x; });
    toast('倒下了！回到检查点');
    P.x = cp; P.y = M.groundY; P.vx = 0; P.vy = 0; P.on = true; P.air = 0;
    hp = HP_MAX; shield = 0; invuln = 2;
    camX = Math.max(0, Math.min(M.width - VW, P.x - VW / 2)); camY = 0;
  }
  function mobsStep(dt) {
    var i, d, m, dx, dy, tx, ty, dir;
    for (i = 0; i < dummies.length; i++) {
      d = dummies[i]; m = d.mob;
      if (m && d.hp <= 0 && m.air && !d.gone && d.y < M.groundY) {            // 被击落的空中目标掉下来
        d.fy = (d.fy || 0) + 1000 * dt; d.y = Math.min(M.groundY, d.y + d.fy * dt);
        d.el.style.top = (d.y - d.h) + 'px';
      }
      if (!m || d.hp <= 0) continue;
      d.cd -= dt; d.t += dt;
      dx = P.x - d.x; dy = (P.y - 55) - (d.y - d.h / 2);
      var near = Math.abs(dx) < m.sight && Math.abs(dy) < 380;
      if (d.type === 'slime') {
        d.x = Math.max(d.hx - 260, Math.min(d.hx + 260, d.x + (near ? (dx > 0 ? 1 : -1) * m.speed * dt : 0)));
      } else if (d.type === 'bat') {
        tx = near ? P.x : d.hx; ty = near && Math.abs(dx) < 180 ? P.y - 70 : d.hy + Math.sin(d.t * 3) * 14;
        d.x += Math.max(-1, Math.min(1, (tx - d.x) / 40)) * m.speed * dt;
        d.y = Math.min(M.groundY, d.y + (ty - d.y) * Math.min(1, dt * 3));
      } else if (d.type === 'balloon') {
        d.x = d.hx + Math.sin(d.t * .5 + d.hx) * 25; d.y = d.hy + Math.sin(d.t * 1.3 + d.hx) * 10;
      } else if (d.type === 'blimp') {
        d.x = d.hx + Math.sin(d.t * .2 + d.hx) * 260; d.y = d.hy + Math.sin(d.t * .7) * 8;
      } else if (d.type === 'drone') {
        d.x = d.hx + Math.sin(d.t * .6 + d.hx) * 200; d.y = d.hy + Math.sin(d.t * 1.7) * 10;
      }
      if ((d.type === 'shooter' || d.type === 'drone') && near && d.cd <= 0) {
        d.cd = 2.2 + Math.random() * .8;
        var ox = d.x, oy = d.y - d.h * .6, a = Math.atan2(P.y - 60 - oy, P.x - ox), el = box('orb', 0, 0);
        orbs.push({ el: el, x: ox, y: oy, vx: Math.cos(a) * 320, vy: Math.sin(a) * 320, life: 3 });
        d.el.classList.remove('fire'); void d.el.offsetWidth; d.el.classList.add('fire'); Sfx.play('orb');
      }
      d.el.style.left = (d.x - d.w / 2) + 'px'; d.el.style.top = (d.y - d.h) + 'px';
      if (m.touch && Math.abs(dx) < d.w / 2 + 20 && Math.abs((P.y - 45) - (d.y - d.h / 2)) < d.h / 2 + 45) hurtPlayer(m.touch, dx >= 0 ? 1 : -1);
    }
    for (i = orbs.length - 1; i >= 0; i--) {
      var o = orbs[i], gone;
      o.life -= dt; o.x += o.vx * dt; o.y += o.vy * dt;
      o.el.style.transform = 'translate(' + o.x.toFixed(1) + 'px,' + o.y.toFixed(1) + 'px)';
      gone = o.life <= 0 || o.y >= M.groundY || o.x < 0 || o.x > M.width;
      if (!gone && Math.abs(o.x - P.x) < 26 && Math.abs(o.y - (P.y - 60)) < 60) { if (!driving) hurtPlayer(12, o.vx > 0 ? 1 : -1); gone = true; }
      if (gone) { o.el.remove(); orbs.splice(i, 1); }
    }
  }
  function pickupsStep(dt) {
    for (var i = pickups.length - 1; i >= 0; i--) {
      var o = pickups[i];
      if (o.taken) {
        if (o.persist && (o.respawn -= dt) <= 0) { o.taken = false; o.el.style.display = ''; }
        continue;
      }
      if (!o.persist && (o.t -= dt) <= 0) { o.el.remove(); pickups.splice(i, 1); continue; }
      if (Math.abs(P.x - o.x) < 44 && P.y > o.y - 150 && P.y < o.y + 30) {
        if (o.type === 'heal') { if (hp >= HP_MAX) continue; hp = Math.min(HP_MAX, hp + 30); pop(P.x, P.y - 200, '+30 血', 'green'); }
        else { if (shield >= SH_MAX) continue; shield = Math.min(SH_MAX, shield + 25); pop(P.x, P.y - 200, '+25 盾', 'green'); }
        Sfx.play('pickup'); hero.kick(-.12);
        if (o.persist) { o.taken = true; o.respawn = 25; o.el.style.display = 'none'; } else { o.el.remove(); pickups.splice(i, 1); }
      }
    }
  }
  function vitalsStep(dt) {
    invuln = Math.max(0, invuln - dt);
    hpShown += (hp - hpShown) * Math.min(1, dt * 8 || 0); shShown += (shield - shShown) * Math.min(1, dt * 8 || 0);
    $('hpbar').style.width = (hpShown / HP_MAX * 100).toFixed(1) + '%'; $('shbar').style.width = (shShown / SH_MAX * 100).toFixed(1) + '%';
    $('hptxt').textContent = Math.ceil(hp) + ' / ' + HP_MAX; $('shtxt').textContent = '盾 ' + Math.ceil(shield) + ' / ' + SH_MAX;
    if (!mount) hero.el.style.opacity = invuln > 0 && !driving && !piloting && Math.floor(invuln * 18) % 2 ? .35 : 1;
  }

  function combat(dt) {
    var i, j, d, c, b;
    /* 俯冲途中砸到正下方的木桩 */
    if (P.slam && P.vy > 300) {
      for (i = 0; i < dummies.length; i++) {
        d = dummies[i];
        if (d.hp > 0 && d.lastSlam !== slamId && overlap(d, P.x - 40, P.y - 110, P.x + 40, P.y + 20)) { d.lastSlam = slamId; hurt(d, 2, 3); }
      }
    }
    /* 教鞭 */
    if (hero.hitActive) {
      b = hero.attackBox();
      for (i = 0; i < dummies.length; i++) {
        d = dummies[i];
        if (d.hp > 0 && d.lastHit !== hero.attackId && overlap(d, P.x + b.x0, P.y + b.y0, P.x + b.x1, P.y + b.y1)) { d.lastHit = hero.attackId; hurt(d); }
      }
    }
    /* 粉笔 */
    for (i = chalks.length - 1; i >= 0; i--) {
      c = chalks[i]; c.life -= dt; c.vy += 650 * dt; c.x += c.vx * dt; c.y += c.vy * dt;
      c.el.style.transform = 'translate(' + (c.x - 12) + 'px,' + (c.y - 5) + 'px) rotate(' + Math.atan2(c.vy, Math.abs(c.vx)) * 57.3 * (c.vx < 0 ? -1 : 1) + 'deg)';
      var gone = c.life <= 0 || c.y >= M.groundY || c.x < 0 || c.x > M.width;
      for (j = 0; !gone && j < dummies.length; j++) {
        d = dummies[j];
        if (d.hp > 0 && overlap(d, c.x - 8, c.y - 4, c.x + 8, c.y + 4)) { hurt(d); gone = true; }
      }
      if (gone) { c.el.remove(); chalks.splice(i, 1); }
    }
    /* 木桩复活 */
    for (i = 0; i < dummies.length; i++) {
      d = dummies[i];
      if (d.mob) { if (d.hp <= 0 && !d.gone && (d.respawn -= dt) <= 0) { d.gone = true; d.el.remove(); } continue; }
      if (d.hp <= 0 && (d.respawn -= dt) <= 0) {
        d.hp = 3; d.el.classList.remove('down'); d.mark.className = '';
        for (j = 0; j < 3; j++) d.pips[j].className = '';
      }
    }
  }

  function camera(dt) {
    var tx = Math.max(0, Math.min(M.width - VW, P.x - VW / 2 + hero.facing * 90));
    camX += (tx - camX) * (1 - Math.exp(-dt * 9));
    var ty = Math.min(0, P.y - 470);                           // 爬塔：玩家升到屏幕上部时镜头跟着上移
    camY += (ty - camY) * (1 - Math.exp(-dt * (ty < camY ? 5 : 3)));
    shake = Math.max(0, shake - dt);
    var sx = shake ? (Math.random() - .5) * 7 : 0, sy = shake ? (Math.random() - .5) * 5 : 0;
    world.style.transform = 'translate(' + (-camX + sx).toFixed(1) + 'px,' + (sy - camY).toFixed(1) + 'px)';
    /* 远近景山丘跟着地面一起下沉（否则地面出画后山丘下面会露出一条白天空），天空随高度变深 */
    var lift = Math.max(0, -camY);
    $('far').style.backgroundPosition = (-camX * .12).toFixed(1) + 'px 0';
    $('near').style.backgroundPosition = (-camX * .35).toFixed(1) + 'px 0';
    $('far').style.transform = 'translateY(' + (lift * .9).toFixed(1) + 'px)';
    $('near').style.transform = 'translateY(' + lift.toFixed(1) + 'px)';
    $('sky').style.backgroundPositionY = (100 - Math.min(100, lift / 12)).toFixed(1) + '%';
  }

  /* ---------- 主循环 ---------- */
  var last = performance.now();
  camX = Math.max(0, Math.min(M.width - VW, P.x - VW / 2));
  function frame(now) {
    var dt = Math.min(.033, (now - last) / 1000); last = now;
    if (hitstop > 0) { hitstop -= dt; dt = 0; }
    if (Controls.paused()) dt = 0;                             // 设置面板打开时暂停
    if (piloting) flyStep(dt); else if (driving) driveStep(dt); else step(dt);
    combat(dt); vehiclesStep(dt); mobsStep(dt); pickupsStep(dt); vitalsStep(dt); camera(dt);
    rechargeDash(dt);
    for (var si = 0; si < 2; si++) {
      var seg = $('stam').children[si], fill = Math.max(0, Math.min(1, dashCharge - si));
      seg.firstChild.style.width = (fill * 100).toFixed(1) + '%'; seg.classList.toggle('full', fill >= 1);
    }

    $('dist').textContent = Math.round(P.x / 5) + ' m';
    heroMark.style.left = P.x / M.width * 100 + '%';
    if (!finished && P.x >= M.goal.x - 30) { finished = true; toast('到达终点！  击倒 ' + ko + ' / ' + dummies.length); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
