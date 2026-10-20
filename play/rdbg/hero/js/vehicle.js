/* 载具（装甲车）的外观与动画：车体悬挂、车轮转动、炮塔跟随瞄准、机枪后坐力与枪口火焰、尾气与扬尘、上下车挤压。
   只管「怎么画」，行驶/撞击/射击的逻辑在 world.js。
   var v = new Vehicle(worldEl, x, groundY, 'svg/world/');
   v.x 车中心   v.facing 车头朝向 1|-1   v.update(dt, { vx, driven })
   v.aim(dx, dy) 让炮塔指向（相对炮塔轴心的世界偏移）；v.aim(null) 回正
   v.muzzle() → { x, y, dx, dy } 枪口世界坐标和枪管当前方向（单位向量）
   v.fire() 触发后坐力/火焰    v.kick(a) 挤压反馈（上下车） */
(function (root) {
  'use strict';
  var W = 240, GROUND = 114, PIVOT = { x: 62, y: 44 }, TP = { x: 28, y: 34 }, WHEELS = [50, 120, 190], WHEEL_Y = 92;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function node(cls, parent, tag) { var d = document.createElement(tag || 'div'); d.className = cls; if (parent) parent.appendChild(d); return d; }
  function img(parent, src, w, h, l, t, cls) {
    var i = node(cls || '', parent, 'img'); i.src = src; i.draggable = false;
    i.style.cssText = 'position:absolute;width:' + w + 'px;height:' + h + 'px;left:' + l + 'px;top:' + t + 'px;pointer-events:none';
    return i;
  }

  function Vehicle(parent, x, y, base) {
    base = base || 'svg/world/';
    this.parent = parent; this.x = x; this.y = y; this.facing = 1;
    this.dist = 0; this.pitch = 0; this.lvPrev = 0; this.bob = 0; this.sq = 0; this.sqv = 0; this.time = 0;
    this.aimCur = -8; this.aimTgt = -8; this.tFlip = 1; this.rec = 0; this.flashT = 0; this.puffT = 0;
    var el = this.el = node('veh', parent);
    node('v-shadow', el);
    this.flip = node('v-flip', el);
    this.hull = node('v-hull', this.flip);
    this.hull.style.transformOrigin = '120px ' + GROUND + 'px';
    img(this.hull, base + 'vehicle_body.svg', 240, 120, 0, 0);
    this.wheels = WHEELS.map(function (cx) { return img(this.hull, base + 'vehicle_wheel.svg', 48, 48, cx - 24, WHEEL_Y - 24, 'v-wheel'); }, this);
    var t = this.turret = node('v-turret', this.hull);
    t.style.cssText = 'position:absolute;left:' + (PIVOT.x - TP.x) + 'px;top:' + (PIVOT.y - TP.y) + 'px;width:130px;height:56px;transform-origin:' + TP.x + 'px ' + TP.y + 'px';
    this.gun = img(t, base + 'vehicle_gun.svg', 130, 56, 0, 0);
    img(t, base + 'vehicle_turret.svg', 130, 56, 0, 0);
    this.flash = img(t, base + 'vehicle_flash.svg', 40, 40, 104, 13);
    this.flash.style.opacity = 0;
    this.place();
  }

  Vehicle.prototype.place = function () {
    this.el.style.left = (this.x - W / 2) + 'px';
    this.el.style.top = (this.y - GROUND) + 'px';
    this.flip.style.transform = 'scaleX(' + this.facing + ')';
  };

  Vehicle.prototype.kick = function (a) { this.sqv += a * 30; };

  Vehicle.prototype.aim = function (dx, dy) {
    if (dx == null) { this.aimTgt = -8; this.tFlip = 1; return; }
    var dxl = dx * this.facing;
    this.tFlip = dxl < 0 ? -1 : 1;
    this.aimTgt = clamp(Math.atan2(dy, Math.abs(dxl)) * 57.296, -75, 60);
  };
  Vehicle.prototype.aimError = function () { return Math.abs(this.aimTgt - this.aimCur); };

  Vehicle.prototype.pivot = function () { return { x: this.x + (PIVOT.x - W / 2) * this.facing, y: this.y - GROUND + PIVOT.y }; };
  Vehicle.prototype.muzzle = function () {
    var a = this.aimCur / 57.296, p = this.pivot(), dx = Math.cos(a) * this.tFlip * this.facing, dy = Math.sin(a), len = 96 - this.rec * 8;
    return { x: p.x + dx * len, y: p.y + dy * len, dx: dx, dy: dy };
  };
  Vehicle.prototype.fire = function () { this.rec = 1; this.flashT = .05; };

  /* 烟尘/气流小圆点（world 里俯冲落地也会用） */
  Vehicle.puff = function (parent, x, y, size, dx) {
    var p = node('puff', parent);
    p.style.left = (x - size / 2) + 'px'; p.style.top = (y - size / 2) + 'px'; p.style.width = p.style.height = size + 'px';
    p.style.setProperty('--dx', dx + 'px');
    p.addEventListener('animationend', function () { p.remove(); });
  };
  Vehicle.prototype.puff = function (x, y, size, dx) { Vehicle.puff(this.parent, x, y, size, dx); };

  Vehicle.prototype.update = function (dt, s) {
    var lv = s.vx * this.facing, i;
    this.time += dt;
    this.dist += lv * dt;
    var ax = dt > 0 ? (lv - this.lvPrev) / dt : 0; this.lvPrev = lv;
    var pt = clamp(-ax * .0045, -4.5, 4.5);
    this.pitch += (pt - this.pitch) * (1 - Math.exp(-dt * 9));
    this.bob = Math.abs(lv) > 25 ? Math.sin(this.dist * .11) * 1.8 : (s.driven ? Math.sin(this.time * 38) * .5 : 0);
    this.sqv += (-this.sq * 240 - this.sqv * 16) * dt; this.sq += this.sqv * dt;
    this.rec = Math.max(0, this.rec - dt * 9);
    this.flashT = Math.max(0, this.flashT - dt);

    var rot = (this.dist / 22 * 57.296) % 360;
    for (i = 0; i < this.wheels.length; i++) this.wheels[i].style.transform = 'rotate(' + rot.toFixed(1) + 'deg)';
    this.hull.style.transform = 'translateY(' + this.bob.toFixed(2) + 'px) rotate(' + this.pitch.toFixed(2) + 'deg) scale(' + (1 + this.sq * .1).toFixed(3) + ',' + (1 - this.sq * .14).toFixed(3) + ')';

    this.aimCur += (this.aimTgt - this.aimCur) * (1 - Math.exp(-dt * 16));
    this.turret.style.transform = 'scale(' + this.tFlip + ',1) rotate(' + this.aimCur.toFixed(1) + 'deg)';
    this.gun.style.transform = 'translateX(' + (-this.rec * 8).toFixed(1) + 'px)';
    this.flash.style.opacity = this.flashT > 0 ? 1 : 0;
    this.flash.style.transform = 'scale(' + (.8 + Math.random() * .5).toFixed(2) + ')';

    /* 尾气 / 扬尘 */
    if (s.driven || Math.abs(s.vx) > 30) {
      this.puffT -= dt;
      if (this.puffT <= 0) {
        var fast = Math.abs(lv) > 120, f = this.facing;
        this.puffT = fast ? .05 : .2;
        this.puff(this.x - f * 116, this.y - GROUND + 34, fast ? 14 : 10, -f * (fast ? 40 : 14));
        if (fast) this.puff(this.x - f * (70 + Math.random() * 30), this.y - 6, 16 + Math.random() * 10, -f * 30);
      }
    }
    this.place();
  };

  root.Vehicle = Vehicle;
})(window);
