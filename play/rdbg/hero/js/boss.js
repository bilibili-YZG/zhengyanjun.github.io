/* Boss 测试：把移植来的「倦怠骑士（strong 版）」接进 rdbg 的世界。
   knight.js 的逻辑跑在「骑士单位」里（1 单位 = SU 像素；玩家 22×40 单位，和原版一致，所有招式数值原样不动），
   这里负责：
     · 把 rdbg 的玩家 / 载具 / 战机换算成骑士眼里的玩家（proxy），把骑士造成的位移、伤害换算回来
     · 骑士本体当作一个特殊木桩加进 dummies，这样教鞭 / 粉笔 / 机枪 / 炸弹 / 撞击 / 俯冲都能打到它
     · 地形（坑 / 平台）、画布特效层、镜头缩放（镜头缩小到 ZOOM，让骑士的招式在屏幕里的大小和原版一致）
   world.html?map=boss 才会启用。 */
(function () {
  'use strict';
  var SU = 3.125, ZOOM = .4, VW = 1280, VH = 720;     // 1 单位 = 3.125 px；镜头缩放 0.4 → 每单位 1.25 屏幕像素（和原版一致）
  var A = null, R = null, b = null, k = null, cv = null, g = null, dm = null;
  var proxy = { x: 0, y: 0, w: 22, h: 40, vx: 0, vy: 0, inv: 0, dash: 0, dashCd: 0, stam: 2, frozen: 0, face: 1, ground: true, hp: 100, safe: null };
  var parts = [], flashA = 0, knInv = 0, wrapAcc = 0, baseHoles = null, basePlats = null, savedHoles = null, savedPlats = null, won = false, tNow = 0;

  /* ---------- 骑士看到的「核心接口」 ---------- */
  var SFX = { 'switch': 'orb', dash: 'dash', boom: 'bomb', roar: 'impact', shoot: 'orb', hit: 'hit', parry: 'slam', check: 'ready', select: 'ready', seize: 'tired', win: 'pickup', bell: 'pickup', door: 'board' };
  function emit(x, y, col, n, sp, life, vyb) {
    for (var i = 0; i < n && parts.length < 600; i++) {
      var a = Math.random() * 6.2832, s = Math.random() * (sp || 100);
      parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s + (vyb || 0), t: 0, life: (life || .5) * (.6 + Math.random() * .8), col: col, r: 1.5 + Math.random() * 2.5 });
    }
  }
  var C = {
    get R() { return R; }, get P() { return proxy; },
    cam: { x: 0, y: 0 }, W: VW, H: VH, sc: ZOOM * SU, T: 32,
    emit: emit,
    sfx: function (n) { A.sfx(SFX[n] || n); },
    shake: function (v) { A.shake(v * .03); },
    hitstop: function (v) { A.hitstop(v); },
    flash: function (v) { flashA = Math.max(flashA, v); },
    toast: function (t) { A.toast(t); },
    /* 骑士的招式打到「玩家」：骑着载具就打载具的韧性，否则扣人的血（数值 1~3，和原版一致，不换算） */
    damagePlayer: function (n, opt) {
      var rd = A.rider();
      if (rd) A.damageVehicle(rd, n || 1);
      else A.hurtPlayer(n || 1, -((opt && opt.dir) || proxy.face || 1));      // 原版 dir 是「从哪边打来」，rdbg 是「往哪边弹」
    },
    slashBox: function () {
      var h = A.hero;
      if (!h.hitActive || h.attackName() !== 'melee') return null;
      var bx = h.attackBox(), P = A.P;
      return { x: (P.x + bx.x0) / SU, y: (P.y + bx.y0) / SU, w: (bx.x1 - bx.x0) / SU, h: (bx.y1 - bx.y0) / SU };
    },
    /* 地形：原版是改地块，这里改坑和平台（像素） */
    saveTerrain: function () { savedHoles = A.M.holes.map(function (h) { return { x0: h.x0, x1: h.x1 }; }); savedPlats = A.M.platforms.map(function (p) { return { x: p.x, y: p.y, w: p.w }; }); },
    restoreTerrain: function () { if (savedHoles) { A.M.holes = savedHoles; A.M.platforms = savedPlats; A.rebuildTerrain(); } },
    breakTerrain: function (level) {
      var M = A.M, px = A.P.x, per = 6400, add = [];
      if (level === 1) [[1800, 200], [2600, 200], [4200, 200], [5000, 200]].forEach(function (h) { add.push({ hole: [h[0], h[0] + h[1]] }); });
      var plats = level === 1 ? [[2000, 450], [2400, 360], [4400, 450], [4800, 360]] : [[3000, 420], [3500, 340], [3900, 420], [5400, 340]];
      plats.forEach(function (p) { add.push({ plat: p }); });
      for (var q = 0; q < 4; q++) add.forEach(function (a) {
        if (a.hole) { var x0 = q * per + a.hole[0]; if (Math.abs(x0 - px) > 450 && Math.abs(x0 + 200 - px) > 450) M.holes.push({ x0: x0, x1: x0 + 200 }); }
        else M.platforms.push({ x: q * per + a.plat[0], y: a.plat[1], w: 200 });
      });
      A.rebuildTerrain();
    },
    ruin: function (on) { document.body.classList.toggle('ruin', !!on); },
    /* 地面上的红笔批注（裂纹、红叉）：纯装饰 */
    drawMarks: function (gg, t) {
      var cx0 = Math.floor(C.cam.x / 32) - 1, cx1 = cx0 + Math.ceil(VW / (ZOOM * SU) / 32) + 3, gy = A.M.groundY / SU;
      gg.save(); gg.lineCap = 'round';
      for (var x = cx0; x <= cx1; x++) {
        if (inHoleU(x * 32 + 16)) continue;
        var h = hash(x * 7.3), cx = x * 32 + 16;
        if (h < .22) { gg.strokeStyle = 'rgba(30,10,18,.75)'; gg.lineWidth = 2; gg.beginPath(); gg.moveTo(cx - 8, gy + 2); gg.lineTo(cx - 2 + h * 20, gy + 10); gg.lineTo(cx - 6 + h * 10, gy + 19); gg.stroke(); }
        else if (h > .9) { gg.strokeStyle = 'rgba(255,58,74,.85)'; gg.lineWidth = 3; gg.beginPath(); gg.moveTo(cx - 7, gy - 17); gg.lineTo(cx + 7, gy - 3); gg.moveTo(cx - 7, gy - 3); gg.lineTo(cx + 7, gy - 17); gg.stroke(); }
      }
      gg.restore();
    },
    victory: function () { if (won) return; won = true; A.toast('倦怠骑士倒下了——「……老师，辛苦了。」'); A.sfx('pickup'); },
    onWrap: function (sh) { wrapAcc += sh; A.shiftWorld(sh * SU); }
  };
  function hash(n) { var s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
  function inHoleU(xu) { var x = xu * SU; return A.M.holes.some(function (h) { return x >= h.x0 && x <= h.x1; }); }

  /* ---------- 同步：rdbg 的玩家 ↔ 骑士眼里的玩家 ---------- */
  var before = null;
  function syncIn() {
    var rd = A.rider(), P = A.P, v = rd;
    if (!v) { proxy.w = 22; proxy.h = 40; proxy.x = P.x / SU - 11; proxy.y = P.y / SU - 40; proxy.vx = P.vx / SU; proxy.vy = P.vy / SU; proxy.ground = P.on; proxy.face = A.hero.facing; proxy.dash = A.dashing() ? 1 : 0; proxy.stam = A.dashCharge(); proxy.dashCd = A.dashing() ? .2 : 0; }
    else if (v.isPlane) { proxy.w = 260 / SU; proxy.h = 100 / SU; proxy.x = v.x / SU - proxy.w / 2; proxy.y = (v.y - 50) / SU; proxy.vx = v.vx / SU; proxy.vy = (v.vy || 0) / SU; proxy.ground = false; proxy.face = v.facing; proxy.dash = 0; proxy.stam = 2; proxy.dashCd = 0; }
    else { proxy.w = 200 / SU; proxy.h = 100 / SU; proxy.x = v.x / SU - proxy.w / 2; proxy.y = (A.M.groundY - 105) / SU; proxy.vx = v.vx / SU; proxy.vy = 0; proxy.ground = true; proxy.face = v.facing; proxy.dash = 0; proxy.stam = 2; proxy.dashCd = 0; }
    proxy.inv = Math.max(A.invuln(), A.vehInv(), knInv);
    wrapAcc = 0;
    before = { x: proxy.x, y: proxy.y, vx: proxy.vx, vy: proxy.vy, inv: proxy.inv, rd: rd };
    C.cam.x = A.camX() / SU; C.cam.y = A.camY() / SU;
  }
  function syncOut() {
    var rd = before.rd, dx = (proxy.x - before.x - wrapAcc) * SU, dy = (proxy.y - before.y) * SU, dvx = (proxy.vx - before.vx) * SU, dvy = (proxy.vy - before.vy) * SU, P = A.P;
    if (!rd) {
      P.x += dx; P.y += dy; P.vx += dvx; P.vy += dvy;
      A.setDashCharge(Math.min(A.dashCharge(), Math.max(0, proxy.stam)));      // strong：冲刺永久被锁（在载具上不受影响）
    } else { rd.x += dx; if (rd.isPlane) rd.y += dy; rd.vx += dvx; if (rd.isPlane && rd.vy != null) rd.vy += dvy; }
    if (proxy.inv !== before.inv) knInv = proxy.inv;          // 开场演出的 999 无敌 → 演出结束时被改回 1.2
    A.setFrozen(proxy.frozen > 0);
  }

  /* ---------- 初始化 ---------- */
  function init(api) {
    A = api; Knight.attach(C);
    var M = A.M, T = 32;
    baseHoles = M.holes; basePlats = M.platforms;
    cv = document.getElementById('fx'); g = cv.getContext('2d');
    A.world.style.transformOrigin = '0 0';
    newFight(true);
    A.toast('Boss 测试 · 向右走一段，倦怠骑士（strong 版）会出现——车和飞机就在身边');
  }
  function newFight(first) {
    var M = A.M, bx = 3328;
    b = { p: { hp: 34 }, label: '倦怠骑士', type: 'knight', x: bx, y: -900, w: 64, h: 96, hx: bx, hy: 96, hp: 34, max: 34, state: 'idle', timer: 2, face: -1, flash: 0, vx: 0, dead: false, deadT: 0, phase: 0, atk: '', started: false };
    var keep = R && R.kn;
    R = { boss: b, kn: keep || null, w: M.width / SU, h: 256, cw: 256, ch: 8, spawn: { x: M.spawn.x / SU, y: 192 }, enemies: [], proj: [], warns: [], fire: [], npcs: [], biome: '' };
    Knight.initBoss(b, null, R); k = R.kn;
    if (!dm) {
      dm = { isBoss: true, x: 0, y: -9999, w: 200, h: 300, hp: 0, maxHp: 34, el: document.createElement('div'), pips: [], mob: { air: true }, lastHit: -1, mark: { className: '' }, respawn: 9, cd: 0, t: 0 };
      A.dummies.push(dm);
    }
  }

  /* ---------- 每帧 ---------- */
  function update(dt) {
    if (!R || !(dt > 0)) return;
    tNow += dt;
    syncIn();
    b.flash = Math.max(0, b.flash - dt);
    knInv = Math.max(0, knInv - dt);
    if (b.state === 'dying') {
      b.deadT += dt; A.shake(.12);
      if (Math.random() < .5) emit(b.x + Math.random() * b.w, b.y + Math.random() * b.h, Math.random() < .5 ? '#ffffff' : '#ff3a4a', 3, 220, .8);
      if (b.deadT > 2.2 && !b.dead) { Knight.onDeath(b); b.dead = true; flashA = .6; emit(b.x + b.w / 2, b.y + b.h / 2, '#ffffff', 60, 380, 1.2); }
    } else if (!b.dead) Knight.bossStep(b, dt);
    Knight.knUpdate(dt, R, proxy);
    syncOut();
    /* 「截止时间」擦除墙吞掉身后停着的载具 */
    if (k && k.wall && !b.dead) A.vehiclesList().forEach(function (v) { if (!v.dead && v !== A.rider() && v.x / SU < k.wall.x) A.blowVehicle(v); });
    /* 骑士本体 → 木桩（供教鞭 / 机枪 / 炸弹 等命中判定） */
    dm.x = (b.x + b.w / 2) * SU; dm.y = (b.y + b.h) * SU; dm.w = b.w * SU; dm.h = b.h * SU;
    dm.hp = (b.started && !b.dead && b.hp > 0 && ['wait', 'intro', 'dying'].indexOf(b.state) < 0) ? b.hp : 0;
    for (var i = parts.length - 1; i >= 0; i--) { var p = parts[i]; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt; if (p.t >= p.life) parts.splice(i, 1); }
    flashA = Math.max(0, flashA - dt * 1.6);
  }
  /* 玩家打骑士：n 直接用 rdbg 里的数值（教鞭 1 / 机枪 1 / 俯冲 2 / 撞击 3 / 炸弹 3），不做平衡 */
  function hurt(d, n, fx) {
    if (!b || b.dead) return;
    if (Knight.hitBoss(b, n || 1, false, false)) A.pop(d.x, d.y - d.h - 20, '-' + (n || 1));
  }
  /* 玩家倒下：骑士回血 25%，战斗从头来（骑士的血量和阶段保留），玩家回出生点 */
  function onPlayerDeath() {
    Knight.onPlayerDeath(b); Knight.cleanup(); won = false;
    knInv = 0;
    newFight(false);
    return A.M.spawn.x;
  }

  /* ---------- 画布层 ---------- */
  function draw() {
    if (!g) return;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, VW, VH);
    var s = A.shakeOff(), cx = A.camX(), cy = A.camY(), t = performance.now() / 1000;
    g.setTransform(ZOOM * SU, 0, 0, ZOOM * SU, (-cx + s.x) * ZOOM, (-cy + s.y) * ZOOM);
    C.cam.x = cx / SU; C.cam.y = cy / SU;
    Knight.drawBody(g, t);
    Knight.knDraw(g, t);
    parts.forEach(function (p) { g.globalAlpha = Math.max(0, 1 - p.t / p.life); g.fillStyle = p.col; g.fillRect(p.x - p.r / 2, p.y - p.r / 2, p.r, p.r); });
    g.globalAlpha = 1;
    g.setTransform(1, 0, 0, 1, 0, 0);
    Knight.knScreen(g, VW, VH, t);
    if (flashA > 0) { g.fillStyle = 'rgba(255,255,255,' + Math.min(1, flashA) + ')'; g.fillRect(0, 0, VW, VH); }
    Knight.drawBar(g, VW, VH);
  }

  window.BossMode = {
    zoom: ZOOM, init: init, update: update, draw: draw, hurt: hurt, onPlayerDeath: onPlayerDeath,
    frozen: function () { return proxy.frozen > 0; }
  };
})();
