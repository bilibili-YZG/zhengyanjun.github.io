/* 战机的外观与动画：机身俯仰、螺旋桨、翻身转向、枪口火焰、尾迹。
   只管「怎么画」，飞行/射击/投弹的逻辑在 world.js。需要先加载 vehicle.js（借用 Vehicle.puff）。
   var p = new Plane(worldEl, x, y, 'svg/world/');   x, y 是机身中心；停在地面时 y = groundY - Plane.GEAR
   p.x p.y p.facing 1|-1   p.update(dt, { vx, vy, engine })   p.muzzle() → { x, y }   p.fire() 枪口火焰 */
(function (root) {
  'use strict';
  var W = 200, H = 90, GEAR = 35;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function node(cls, parent) { var d = document.createElement('div'); d.className = cls; if (parent) parent.appendChild(d); return d; }
  function img(parent, src, w, h, l, t, cls) {
    var i = document.createElement('img'); i.className = cls || ''; i.src = src; i.draggable = false; parent.appendChild(i);
    i.style.cssText = 'position:absolute;width:' + w + 'px;height:' + h + 'px;left:' + l + 'px;top:' + t + 'px;pointer-events:none';
    return i;
  }

  function Plane(parent, x, y, base) {
    base = base || 'svg/world/';
    this.parent = parent; this.x = x; this.y = y; this.facing = 1; this.vx = 0; this.vy = 0;
    this.pitch = 0; this.time = 0; this.flashT = 0; this.puffT = 0;
    var el = this.el = node('plane', parent);
    this.flip = node('p-flip', el);
    this.tilt = node('p-tilt', this.flip);
    img(this.tilt, base + 'plane_body.svg', W, H, 0, 0);
    this.prop = img(this.tilt, base + 'plane_prop.svg', 12, 64, 176, 14);
    this.flash = img(this.tilt, base + 'vehicle_flash.svg', 44, 44, 188, 24);
    this.flash.style.opacity = 0;
    this.flip.style.transform = 'scaleX(1)';
    this.place();
  }
  Plane.GEAR = GEAR;
  Plane.prototype.isPlane = true;

  Plane.prototype.place = function () {
    this.el.style.left = (this.x - W / 2).toFixed(1) + 'px';
    this.el.style.top = (this.y - H / 2).toFixed(1) + 'px';
    this.flip.style.transform = 'scaleX(' + this.facing + ')';
  };
  Plane.prototype.muzzle = function () { return { x: this.x + this.facing * 104, y: this.y + 2 }; };
  Plane.prototype.fire = function () { this.flashT = .05; };

  Plane.prototype.update = function (dt, s) {
    this.time += dt;
    this.flashT = Math.max(0, this.flashT - dt);
    var flying = s.flying, pt = flying ? clamp(s.vy * .045 - (s.vx * this.facing < 120 ? 4 : 0), -24, 24) : (s.engine ? Math.sin(this.time * 40) * .5 : 0);
    this.pitch += (pt - this.pitch) * (1 - Math.exp(-dt * 8));
    this.tilt.style.transform = 'rotate(' + this.pitch.toFixed(2) + 'deg)';
    this.prop.style.transform = s.engine ? 'scaleY(' + (.55 + .45 * Math.abs(Math.sin(this.time * 55))).toFixed(2) + ')' : 'scaleY(1)';
    this.prop.style.opacity = s.engine ? .7 : 1;
    this.flash.style.opacity = this.flashT > 0 ? 1 : 0;
    this.flash.style.transform = 'scale(' + (.8 + Math.random() * .5).toFixed(2) + ')';
    if (s.engine && Math.abs(s.vx) > 60) {                          // 尾迹
      this.puffT -= dt;
      if (this.puffT <= 0) {
        this.puffT = Math.abs(s.vx) > 450 ? .035 : .08;
        Vehicle.puff(this.parent, this.x - this.facing * 104, this.y + 8, 10 + Math.random() * 6, -this.facing * 30);
      }
    }
    this.place();
  };

  root.Plane = Plane;
})(window);
