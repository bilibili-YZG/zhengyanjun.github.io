/* 角色动画模块：物理老师（Hero）
   ─────────────────────────────────────────────────────────────
   只负责「骨骼 + 动画」，不含任何世界/输入逻辑；viewer.js 与 world.js 都通过它驱动角色。
   贴图全部在 svg/ 目录里，一个部件一个文件；样式在 css/hero.css。

   用法：
     var hero = new Hero(containerEl, { scale: 0.22, base: 'svg/', onEvent: function(name, data){} });
     // 每帧：
     hero.setFacing(1 | -1);                 // 朝向（切换时有转身动画）
     hero.setLocomotion(speed, inAir, vy);   // speed：0 站立，1 走，≈1.7 跑；vy：向下为正（像素/秒）
     hero.update(dt);
     hero.place(x, y);                       // 把脚底中心放到 (x, y)（容器坐标）
     hero.attack('melee' | 'chalk');         // 教鞭挥击 / 扔粉笔，返回是否开始成功
     hero.doubleJump();                      // 二段跳：空中团身前翻一圈
     hero.kick(amp);                         // 挤压拉伸：amp>0 压扁（落地），amp<0 拉长（起跳）
   事件（onEvent）：
     'chalk'  扔出粉笔：data = { x, y }（相对脚底中心、已按 scale 缩放、已乘朝向，向上为负）
   攻击判定：
     hero.hitActive   教鞭挥击的伤害窗口内为 true
     hero.attackId    每次攻击自增，用来避免同一次挥击重复命中
     hero.attackBox() 当前教鞭判定框（相对脚底中心，已缩放/含朝向）：{x0,x1,y0,y1}
   调试：
     hero.preview(name, t)  把角色冻结在某个动画的第 t 秒。name：idle walk run jump melee chalk

   坐标约定：部件在「原始画布坐标」里摆放（身高约 740，脚底在 y=772，身体中心 x=240）。
   关节角度单位是度；0 表示肢体朝下，正值顺时针（手臂朝画面左边摆）。
*/
(function (root) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg', XL = 'http://www.w3.org/1999/xlink';

  /* 部件表：键 → [文件名, x, y, w, h]。x,y,w,h 必须与对应 svg 文件的 viewBox 一致。 */
  var PARTS = {
    torso: ['torso', 150, 200, 180, 260], neck: ['neck', 215, 175, 50, 60], head: ['head', 150, 50, 180, 160],
    eyesOpen: ['eyes_open', 185, 98, 110, 58], eyesClosed: ['eyes_closed', 185, 98, 110, 58],
    glasses: ['glasses', 165, 110, 150, 48], mouthSmile: ['mouth_smile', 208, 160, 64, 44], mouthOpen: ['mouth_open', 208, 160, 64, 44],
    hair: ['hair', 150, 28, 180, 125], bangs: ['bangs', 170, 44, 145, 72],
    armUpper: ['arm_upper', -22, -22, 44, 118], armFore: ['arm_fore', -18, -18, 36, 106], watch: ['watch', -12, 66, 24, 16],
    handV: ['hand_v', -30, -4, 60, 66], handOpen: ['hand_open', -30, -4, 60, 66], handRelaxed: ['hand_relaxed', -30, -4, 60, 66], handFist: ['hand_fist', -30, -4, 60, 66],
    legThigh: ['leg_thigh', -31, -30, 62, 182], legFoot: ['leg_foot', -36, 120, 78, 62], legShin: ['leg_shin', -36, -26, 78, 206],
    pointer: ['pointer', -6, -14, 12, 134], slash: ['slash', 0, 0, 220, 220], shadow: ['shadow', -100, -16, 200, 32]
  };
  var HAND_KEYS = { v: 'handV', open: 'handOpen', relaxed: 'handRelaxed', fist: 'handFist' };

  /* 渲染视口（以脚底中心为原点）：向上 800、左右各 320 */
  var VB = { x: -320, y: -800, w: 640, h: 830 };
  var GROUND_Y = 772, CENTER_X = 240;
  /* 动画时长（秒） */
  var DUR = { melee: 0.46, chalk: 0.42, djump: 0.46 };
  /* 教鞭判定框（原始画布单位，相对脚底中心；x 为朝向前方的距离） */
  var BOX = { x0: 40, x1: 330, y0: -650, y1: -240 };
  /* 扔粉笔时粉笔出手位置（原始画布单位） */
  var CHALK_AT = { x: 110, y: -540 };

  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag), k;
    for (k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* 关键帧插值：keys = [[时间, 值], …]，值为 null 表示「沿用基础动作的值」；段内平滑 */
  function K(t, keys, base) {
    function val(k) { return k[1] == null ? base : k[1]; }
    if (t <= keys[0][0]) return val(keys[0]);
    for (var i = 1; i < keys.length; i++) {
      if (t <= keys[i][0]) {
        var a = keys[i - 1], b = keys[i], u = (t - a[0]) / (b[0] - a[0]);
        u = u * u * (3 - 2 * u);
        return val(a) + (val(b) - val(a)) * u;
      }
    }
    return val(keys[keys.length - 1]);
  }

  /* 攻击关键帧 ──────────────────────────────────────────────── */
  var MELEE = {
    rUp:   [[0, null], [.12, -150], [.17, -150], [.28, -62], [.5, null]],
    rFore: [[0, null], [.12, -45],  [.17, -45],  [.28, 28],  [.5, null]],
    lUp:   [[0, null], [.12, 28],   [.28, 14],   [.5, null]],
    lean:  [[0, null], [.12, -8],   [.17, -8],   [.28, 10],  [.5, null]],
    tilt:  [[0, null], [.12, -5],   [.28, 6],    [.5, null]],
    lT:    [[0, 0], [.12, -10], [.28, 14], [.5, 0]],
    rT:    [[0, 0], [.12, 12],  [.28, -16], [.5, 0]],
    HIT: [0.17, 0.30]
  };
  var CHALK = {
    rUp:   [[0, null], [.13, -140], [.2, -84], [.45, null]],
    rFore: [[0, null], [.13, -55],  [.2, 6],   [.45, null]],
    lUp:   [[0, null], [.13, 22],   [.45, null]],
    lean:  [[0, null], [.13, -6],   [.2, 6],   [.45, null]],
    tilt:  [[0, null], [.13, -3],   [.2, 4],   [.45, null]],
    RELEASE: 0.2
  };
  var JOINTS = ['lUp', 'lFore', 'rUp', 'rFore', 'lT', 'lS', 'rT', 'rS', 'bob', 'lean', 'tilt', 'hdx'];

  function Hero(parent, opts) {
    opts = opts || {};
    this.scale = opts.scale || 0.22;
    this.base = opts.base || 'svg/';
    this.onEvent = opts.onEvent || null;
    this.facing = 1; this.faceVis = 1;
    this.time = 0; this.phase = 0;
    this.speed = 0; this.air = false; this.vy = 0; this.altitude = 0; this.slam = false; this.dashing = false;
    this.act = null; this.dj = null; this.sq = 0; this.sqv = 0; this.attackId = 0; this.hitActive = false;
    this.blink = 0; this.nextBlink = 1.5; this.gaze = 0;
    this.pose = { hl: 'relaxed', hr: 'relaxed', mouthOpen: false, weapon: false };
    this.cur = {};
    this._build(parent);
    this._applyScale();
    this.update(0, true);
  }

  Hero.prototype._img = function (parent, key, extra) {
    var p = PARTS[key], im = el('image', { x: p[1], y: p[2], width: p[3], height: p[4] }, parent);
    im.setAttributeNS(XL, 'href', this.base + p[0] + '.svg');
    im.setAttribute('href', this.base + p[0] + '.svg');
    if (extra) for (var k in extra) im.setAttribute(k, extra[k]);
    return im;
  };
  Hero.prototype._g = function (parent, id) { var g = el('g', {}, parent); if (id) this.n[id] = g; return g; };

  Hero.prototype._build = function (parent) {
    var n = this.n = {}, self = this;
    var svg = this.el = el('svg', { 'class': 'hero', viewBox: [VB.x, VB.y, VB.w, VB.h].join(' ') });
    svg.setAttribute('stroke-linejoin', 'round');
    parent.appendChild(svg);
    var flip = this._g(svg, 'flip');
    var sh = this._g(flip, 'shadow'); this._img(sh, 'shadow');
    var bob = this._g(flip, 'bob');
    var rig = this._g(bob); rig.setAttribute('transform', 'translate(' + (-CENTER_X) + ' ' + (-GROUND_Y) + ')');
    n.rig = rig; this.legFront = 'R';

    /* 腿（先画，在躯干后面） */
    ['L', 'R'].forEach(function (s) {
      var leg = self._g(rig, 'leg' + s); self._img(leg, 'legThigh');
      var shin = self._g(leg, 'shin' + s); self._img(shin, 'legShin');
      var foot = self._g(shin, 'foot' + s); self._img(foot, 'legFoot');
    });

    /* 躯干 + 手臂 + 头 */
    var torso = this._g(rig, 'torso');
    this._img(torso, 'torso');
    ['L', 'R'].forEach(function (s) {
      var arm = self._g(torso, 'arm' + s); self._img(arm, 'armUpper');
      var fore = self._g(arm, 'fore' + s); self._img(fore, 'armFore');
      if (s === 'R') {
        self._img(fore, 'watch');
        var wp = self._g(fore, 'weapon'); wp.setAttribute('transform', 'translate(0 80)'); self._img(wp, 'pointer');
      }
      var hand = self._g(fore, 'hand' + s); hand.setAttribute('transform', 'translate(0 80)' + (s === 'R' ? ' scale(-1 1)' : ''));
      n['hands' + s] = {};
      for (var k in HAND_KEYS) n['hands' + s][k] = self._img(hand, HAND_KEYS[k]);
    });
    /* 挥击弧光（在手臂之上、头之下；以右肩为圆心） */
    this._g(torso, 'fx'); this._img(n.fx, 'slash');
    n.fx.setAttribute('opacity', 0);

    var head = this._g(torso, 'head');
    var hin = this._g(head, 'headIn');
    this._img(hin, 'neck'); this._img(hin, 'head');
    var feat = this._g(hin, 'feat');
    n.mouthS = this._img(feat, 'mouthSmile'); n.mouthO = this._img(feat, 'mouthOpen', { display: 'none' });
    var eg = this._g(feat, 'eyes');
    n.eyesO = this._img(eg, 'eyesOpen'); n.eyesC = this._img(eg, 'eyesClosed', { display: 'none' });
    this._img(feat, 'glasses');
    this._img(hin, 'hair');
    var bangs = this._g(hin, 'bangs'); this._img(bangs, 'bangs');
  };

  Hero.prototype._applyScale = function () {
    var s = this.scale;
    this.el.setAttribute('width', VB.w * s); this.el.setAttribute('height', VB.h * s);
  };
  Hero.prototype.setScale = function (s) { this.scale = s; this._applyScale(); };
  /* 把脚底中心放到容器里的 (x, y) */
  Hero.prototype.place = function (x, y) {
    var s = this.scale;
    this.el.style.transform = 'translate(' + (x + VB.x * s) + 'px,' + (y + VB.y * s) + 'px)';
  };

  Hero.prototype.setFacing = function (d) { if (d) this.facing = d > 0 ? 1 : -1; };
  Hero.prototype.setLocomotion = function (speed, inAir, vy) { this.speed = speed || 0; this.air = !!inAir; this.vy = vy || 0; };
  Hero.prototype.setAltitude = function (px) { this.altitude = Math.max(0, px || 0); };
  Hero.prototype.isAttacking = function () { return !!this.act; };
  Hero.prototype.attackName = function () { return this.act ? this.act.kind : ''; };
  Hero.prototype.attackProgress = function () { return this.act ? this.act.t / this.act.dur : 0; };

  Hero.prototype.attack = function (kind) {
    if (this.act || (kind !== 'melee' && kind !== 'chalk')) return false;
    this.act = { kind: kind, t: 0, dur: DUR[kind], sent: false };
    this.attackId++;
    return true;
  };

  Hero.prototype.attackBox = function () {
    var s = this.scale, f = this.facing, a = BOX.x0 * s * f, b = BOX.x1 * s * f;
    return { x0: Math.min(a, b), x1: Math.max(a, b), y0: BOX.y0 * s, y1: BOX.y1 * s };
  };

  /* 二段跳：开始一次团身前翻 */
  /* 俯冲重击姿势开关（空中有效；落地后由调用方关掉） */
  /* 冲刺姿势开关（持续时间由调用方控制） */
  Hero.prototype.setDash = function (on) { this.dashing = !!on; };
  /* 残影：把当前画面复制一份留在原地并淡出（插在角色后面） */
  Hero.prototype.ghost = function (parent) {
    var g = this.el.cloneNode(true);
    g.setAttribute('class', 'hero ghost');
    parent.insertBefore(g, this.el);
    g.addEventListener('animationend', function () { g.remove(); });
  };
  /* 速度线（x,y 为线头位置，dir 为运动方向 ±1） */
  Hero.streak = function (parent, x, y, dir) {
    var s = document.createElement('div'); s.className = 'streak';
    s.style.left = (dir > 0 ? x - 90 : x) + 'px'; s.style.top = y + 'px';
    if (dir < 0) s.style.background = 'linear-gradient(270deg, rgba(255,255,255,0), rgba(255,255,255,.85))';
    s.style.setProperty('--dx', (-dir * 60) + 'px');
    parent.appendChild(s); s.addEventListener('animationend', function () { s.remove(); });
  };
  Hero.prototype.setSlam = function (on) { this.slam = !!on; if (on) this.dj = null; };
  Hero.prototype.doubleJump = function () { this.dj = { t: 0, dur: DUR.djump }; };
  /* 挤压拉伸冲量（弹簧会自己回弹） */
  Hero.prototype.kick = function (amp) { this.sqv += amp * 38; };

  Hero.prototype._emit = function (name, data) { if (this.onEvent) this.onEvent(name, data); };

  /* ---------- 基础动作：待机 / 行走 / 奔跑 / 空中 ---------- */
  Hero.prototype._loco = function (dt) {
    var s = Math.sin, p = {}, sp = this.speed, t = this.time;
    if (this.air) {
      var u = (clamp(this.vy / 700, -1, 1) + 1) / 2;           // 0 上升 … 1 下落
      p.lUp = 100 - 50 * u; p.rUp = -(100 - 50 * u); p.lFore = -20; p.rFore = -20;
      p.lT = -30 + 18 * u; p.lS = 60 - 48 * u; p.rT = 10 + 2 * u; p.rS = 35 - 25 * u;
      p.bob = 0; p.lean = 4 - 4 * u; p.tilt = -3 + 6 * u; p.hdx = 7;
      if (this.dj) {                                           // 团身：抱腿收臂
        var g = Math.sin(Math.min(1, this.dj.t / this.dj.dur) * Math.PI);
        p.lUp += (30 - p.lUp) * g; p.rUp += (-30 - p.rUp) * g; p.lFore = -60 * g - 20 * (1 - g); p.rFore = -60 * g - 20 * (1 - g);
        p.lT += (-85 - p.lT) * g; p.lS += (115 - p.lS) * g; p.rT += (-70 - p.rT) * g; p.rS += (100 - p.rS) * g;
        p.lean += 14 * g; p.tilt += 4 * g;
      }
      if (this.slam) {                                         // 俯冲重击：双臂举过头顶，双腿并拢朝下
        p.lUp = 158; p.rUp = -158; p.lFore = -8; p.rFore = -8;
        p.lT = -4; p.lS = 0; p.rT = 4; p.rS = 0; p.lean = 12; p.tilt = -4; p.hdx = 7;
      }
    } else if (sp > 0.05) {
      var run = sp > 1.3, ph;
      this.phase += dt * (run ? 8.2 : 5.6) * (run ? 1 : Math.max(.7, sp));
      ph = this.phase;
      var a = s(ph), c = Math.cos(ph), A = run ? 46 : 28, K1 = run ? 58 : 38, AA = run ? 42 : 26, B0 = run ? 48 : 0;
      p.lT = -A * a; p.rT = A * a;
      p.lS = Math.max(0, c) * K1 + (run ? 10 : 0); p.rS = Math.max(0, -c) * K1 + (run ? 10 : 0);
      p.lUp = 7 + AA * a; p.rUp = -7 - AA * a;
      p.lFore = -10 - B0 - Math.max(0, -a) * 18; p.rFore = -10 - B0 - Math.max(0, a) * 18;
      p.bob = -Math.abs(s(ph)) * (run ? 11 : 6); p.lean = run ? 10 : 3.5; p.tilt = s(ph * 2) * 1.2 - 1; p.hdx = 7;
    } else {
      this.phase = 0;
      p.lUp = 7 + s(t * 1.6) * 1.5; p.rUp = -7 - s(t * 1.6) * 1.5; p.lFore = -8; p.rFore = -8;
      p.lT = 1; p.lS = 0; p.rT = -1; p.rS = 0;
      p.bob = s(t * 1.6) * -1.6; p.lean = s(t * .9) * .8; p.tilt = s(t * .8) * 1.4; p.hdx = 3;
    }
    if (this.dashing) {                                        // 冲刺：身体前压，双臂后摆，一腿前跨一腿后蹬
      p.lUp = 78; p.rUp = 52; p.lFore = -12; p.rFore = -20;
      p.lT = -52; p.lS = 8; p.rT = 38; p.rS = 78;
      p.lean = 30; p.tilt = -8; p.bob = -6; p.hdx = 8;
    }
    p.hl = 'relaxed'; p.hr = 'relaxed'; p.mouthOpen = false; p.weapon = false; p.fx = 0;
    if (this.air && this.slam) { p.hl = 'fist'; p.hr = 'fist'; p.mouthOpen = true; }
    if (this.dashing) { p.hl = 'fist'; p.hr = 'fist'; p.mouthOpen = true; }
    return p;
  };

  /* ---------- 攻击覆盖 ---------- */
  Hero.prototype._attackPose = function (p) {
    var a = this.act, t = a.t, k;
    this.hitActive = false;
    if (a.kind === 'melee') {
      for (k in MELEE) if (k !== 'HIT') {
        if (k === 'lT' || k === 'rT') p[k] += K(t, MELEE[k], 0); else p[k] = K(t, MELEE[k], p[k]);
      }
      p.hr = 'fist'; p.weapon = true; p.mouthOpen = t > .15 && t < .36;
      this.hitActive = t >= MELEE.HIT[0] && t <= MELEE.HIT[1];
      var u = (t - .17) / .2;
      p.fx = u >= 0 && u <= 1 ? { o: (1 - u) * .95, r: -35 + 80 * u, k: 1.25 + .3 * u } : 0;
    } else if (a.kind === 'chalk') {
      for (k in CHALK) if (k !== 'RELEASE') p[k] = K(t, CHALK[k], p[k]);
      p.hr = t < CHALK.RELEASE ? 'fist' : 'open';
      if (!a.sent && t >= CHALK.RELEASE) {
        a.sent = true;
        var s = this.scale, f = this.facing;
        this._emit('chalk', { x: CHALK_AT.x * s * f, y: CHALK_AT.y * s });
      }
    }
    return p;
  };

  Hero.prototype.update = function (dt, snap) {
    var i, j, p, c = this.cur, n = this.n, k;
    this.time += dt;
    this.faceVis = snap ? this.facing : this.faceVis + (this.facing - this.faceVis) * (1 - Math.exp(-dt * 18));

    /* 眨眼 */
    this.nextBlink -= dt;
    if (this.nextBlink <= 0) { this.blink = .15; this.nextBlink = 2 + Math.random() * 3.5; }
    if (this.blink > 0) this.blink -= dt;

    if (this.dj) { this.dj.t += dt; if (this.dj.t >= this.dj.dur || !this.air) this.dj = null; }
    /* 挤压拉伸弹簧 */
    this.sqv += (-this.sq * 260 - this.sqv * 18) * dt; this.sq += this.sqv * dt;
    if (snap) { this.sq = 0; this.sqv = 0; }
    if (this.act) {
      this.act.t += dt;
      if (this.act.t >= this.act.dur) { this.act = null; this.hitActive = false; }
    }
    p = this._loco(dt);
    if (this.act) p = this._attackPose(p);

    var rate = this.act ? 40 : this.dashing ? 36 : this.dj ? 26 : 22, kk = snap ? 1 : 1 - Math.exp(-dt * rate);
    for (i = 0; i < JOINTS.length; i++) {
      j = JOINTS[i];
      c[j] = c[j] == null ? p[j] : c[j] + (p[j] - c[j]) * kk;
    }
    this.pose = p;

    /* 骨骼 */
    n.flip.setAttribute('transform', 'scale(' + this.faceVis.toFixed(3) + ' 1)');
    var spin = 0, sy = 1 + this.sq * .22, sx = 1 - this.sq * .14;
    if (this.dj) { var u = Math.min(1, this.dj.t / this.dj.dur); spin = 360 * (1 - Math.pow(1 - u, 2.2)); }
    n.bob.setAttribute('transform', 'translate(0 ' + c.bob.toFixed(2) + ') scale(' + sx.toFixed(3) + ' ' + sy.toFixed(3) + ') rotate(' + spin.toFixed(1) + ' 0 -330)');
    n.armL.setAttribute('transform', 'translate(176 236) rotate(' + c.lUp.toFixed(2) + ')');
    n.foreL.setAttribute('transform', 'translate(0 88) rotate(' + c.lFore.toFixed(2) + ')');
    n.armR.setAttribute('transform', 'translate(304 236) rotate(' + c.rUp.toFixed(2) + ')');
    n.foreR.setAttribute('transform', 'translate(0 88) rotate(' + c.rFore.toFixed(2) + ')');
    n.legL.setAttribute('transform', 'translate(214 446) rotate(' + c.lT.toFixed(2) + ')');
    n.shinL.setAttribute('transform', 'translate(0 150) rotate(' + c.lS.toFixed(2) + ')');
    /* 脚踝补偿：脚掌尽量保持平行地面，不跟着小腿甩 */
    var fl = clamp(-(c.lT + c.lS) * .8, -55, 55), fr = clamp(-(c.rT + c.rS) * .8, -55, 55);
    n.footL.setAttribute('transform', 'rotate(' + fl.toFixed(2) + ' 0 138)');
    n.footR.setAttribute('transform', 'rotate(' + fr.toFixed(2) + ' 0 138)');
    n.legR.setAttribute('transform', 'translate(266 446) rotate(' + c.rT.toFixed(2) + ')');
    n.shinR.setAttribute('transform', 'translate(0 150) rotate(' + c.rS.toFixed(2) + ')');
    /* 腿的前后层：整条腿作为一组，迈在前面（角度更负）的那条画在上面；3° 滞回避免交叉瞬间来回跳 */
    var dT = c.lT - c.rT;
    if (dT < -3 && this.legFront !== 'L') { n.rig.insertBefore(n.legR, n.legL); this.legFront = 'L'; }
    else if (dT > 3 && this.legFront !== 'R') { n.rig.insertBefore(n.legL, n.legR); this.legFront = 'R'; }
    n.torso.setAttribute('transform', 'rotate(' + c.lean.toFixed(2) + ' 240 440)');
    n.head.setAttribute('transform', 'translate(' + (240 + c.hdx).toFixed(2) + ' 205) rotate(' + c.tilt.toFixed(2) + ')');
    n.headIn.setAttribute('transform', 'translate(-240 -205)');
    n.feat.setAttribute('transform', 'translate(' + (c.hdx * .55).toFixed(2) + ' 0)');
    n.bangs.setAttribute('transform', 'rotate(' + (Math.sin(this.time * 2.1) * 1.1 + (this.speed > .05 ? -3 : 0)).toFixed(2) + ' 240 70)');
    n.eyes.setAttribute('transform', 'translate(' + this.gaze.toFixed(2) + ' 0)');

    /* 表情 / 手型 / 武器 */
    var closed = this.blink > 0;
    n.eyesO.setAttribute('display', closed ? 'none' : 'inline'); n.eyesC.setAttribute('display', closed ? 'inline' : 'none');
    n.mouthS.setAttribute('display', p.mouthOpen ? 'none' : 'inline'); n.mouthO.setAttribute('display', p.mouthOpen ? 'inline' : 'none');
    for (k in HAND_KEYS) {
      n.handsL[k].setAttribute('display', p.hl === k ? 'inline' : 'none');
      n.handsR[k].setAttribute('display', p.hr === k ? 'inline' : 'none');
    }
    n.weapon.setAttribute('display', p.weapon ? 'inline' : 'none');

    /* 挥击弧光 */
    if (p.fx) {
      n.fx.setAttribute('opacity', p.fx.o.toFixed(3));
      n.fx.setAttribute('transform', 'translate(304 236) rotate(' + p.fx.r.toFixed(1) + ') scale(' + p.fx.k.toFixed(3) + ') translate(-40 -188)');
    } else n.fx.setAttribute('opacity', 0);

    /* 影子：离地越高越小越淡 */
    var h = this.altitude / this.scale, sc = 1 / (1 + h / 420);
    n.shadow.setAttribute('transform', 'scale(' + sc.toFixed(3) + ' 1)');
    n.shadow.setAttribute('opacity', (0.35 + 0.65 * sc).toFixed(2));
  };

  /* 把角色冻结在某个动画的第 t 秒（调试 / 截图用） */
  Hero.prototype.preview = function (name, t) {
    t = t || 0;
    this.act = null; this.dj = null; this.slam = false; this.dashing = name === 'dash'; this.air = false; this.speed = 0; this.vy = 0; this.phase = 0; this.cur = {};
    if (name === 'walk' || name === 'run') { this.speed = name === 'run' ? 1.7 : 1; this.phase = t * (name === 'run' ? 8.2 : 5.6); }
    else if (name === 'jump') { this.air = true; this.vy = (t - .5) * 1400; }
    else if (name === 'slam') { this.air = true; this.vy = 900; this.slam = true; }
    else if (name === 'djump') { this.air = true; this.vy = 0; this.dj = { t: t, dur: DUR.djump }; }
    else if (name === 'melee' || name === 'chalk') { this.act = { kind: name, t: t, dur: DUR[name], sent: true }; }
    this.update(0, true);
  };

  /* 供 viewer 说明用 */
  Hero.DUR = DUR;
  Hero.HIT = { melee: MELEE.HIT };
  Hero.PARTS = PARTS;
  root.Hero = Hero;
})(window);
