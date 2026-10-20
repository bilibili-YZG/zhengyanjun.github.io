/* 动画浏览器：把 Hero 放在舞台中央，提供动画按钮、朝向、速度、判定框显示。
   调试参数（URL）：viewer.html?anim=melee&t=0.2   → 冻结在 melee 动画的第 0.2 秒（截图用）
                    可选 &face=-1（朝左）  &size=0.4 */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var stage = $('stage'), hitbox = $('hitbox');
  var q = {};
  location.search.replace(/^\?/, '').split('&').forEach(function (kv) { var a = kv.split('='); if (a[0]) q[a[0]] = decodeURIComponent(a[1] || ''); });

  var size = +q.size || 0.4, rate = 1, facing = +q.face === -1 ? -1 : 1, anim = 'idle';
  var dv = 0, dh = 0, djDone = false, loop = true, showBox = true, cool = 0, jt = 0, chalks = [];

  var hero = new Hero(stage, { scale: size, base: 'svg/', onEvent: onEvent });
  hero.setFacing(facing);
  /* 载具：放在一个按 size/0.24 放大的容器里（world 里角色缩放 0.24、载具 1:1，这里保持同样比例） */
  var vwrap = document.createElement('div');
  vwrap.style.cssText = 'position:absolute;left:0;top:0;transform-origin:0 0;display:none;pointer-events:none';
  stage.appendChild(vwrap);
  var veh = new Vehicle(vwrap, 0, 0, 'svg/world/');
  var vt = 0, vvx = 0, vgun = 0, vbullets = [], vbA = false, vbB = false, engV = false, trailT = 0;
  var sl = { ph: 0, t: 0, h: 0, v: 0 }, dsh = { t: 0, g: 0 };

  function onEvent(name, d) {
    if (name !== 'chalk') return;
    var im = document.createElement('img');
    im.src = 'svg/chalk.svg'; im.className = 'chalk'; stage.appendChild(im);
    chalks.push({ el: im, x: feet().x + d.x, y: feet().y + d.y, vx: 760 * hero.facing, vy: -120, life: 1.6 });
  }
  function feet() { var r = stage.getBoundingClientRect(); return { x: r.width / 2, y: r.height * 0.84 }; }

  /* ---------- 界面 ---------- */
  function setAnim(a) {
    anim = a; cool = 0; jt = 0; vt = 0; vvx = 0; vbA = vbB = false;
    sl.ph = 0; sl.t = 0; sl.h = 0; hero.setSlam(false); hero.setDash(false); dsh.t = 0;
    vbullets.forEach(function (b) { b.el.remove(); }); vbullets = [];
    ['anims', 'vanims'].forEach(function (id) {
      Array.prototype.forEach.call($(id).children, function (b) { b.classList.toggle('on', b.dataset.a === a); });
    });
    if (a === 'melee' || a === 'chalk') hero.attack(a);
  }
  function setFace(d) {
    facing = d; hero.setFacing(d);
    $('faceL').classList.toggle('on', d < 0); $('faceR').classList.toggle('on', d > 0);
  }
  ['anims', 'vanims'].forEach(function (id) {
    $(id).addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) setAnim(b.dataset.a); });
  });
  $('faceL').onclick = function () { setFace(-1); };
  $('faceR').onclick = function () { setFace(1); };
  $('rate').oninput = function () { rate = +this.value; };
  $('size').oninput = function () { size = +this.value; hero.setScale(size); };
  $('loop').onchange = function () { loop = this.checked; };
  $('box').onchange = function () { showBox = this.checked; };
  window.addEventListener('keydown', function (e) {
    var k = e.key;
    if (k === 'ArrowLeft') setFace(-1);
    else if (k === 'ArrowRight') setFace(1);
    else if (k === 'j' || k === 'J') setAnim('melee');
    else if (k === 'l' || k === 'L') setAnim('chalk');
    else if (k >= '1' && k <= '9') setAnim(['idle', 'walk', 'run', 'jump', 'djump', 'melee', 'chalk', 'slam', 'dash'][+k - 1]);
  });

  /* 时间轴上的判定窗口 */
  function drawTimeline() {
    var hw = Hero.HIT.melee, dur = Hero.DUR.melee, th = $('tlHit');
    if (anim === 'melee') { th.style.display = 'block'; th.style.left = hw[0] / dur * 100 + '%'; th.style.width = (hw[1] - hw[0]) / dur * 100 + '%'; }
    else th.style.display = 'none';
  }

  /* 俯冲重击演示：起跳 → 悬停蓄力 → 急速下砸 → 落地冲击波；返回离地高度（屏幕像素） */
  function slamFrame(dt, f) {
    sl.t += dt;
    if (sl.ph === 0) {
      var u = Math.min(1, sl.t / .5); sl.h = 330 * Math.sin(u * Math.PI / 2);
      hero.setLocomotion(0, true, -500 * (1 - u));
      if (u >= 1) { sl.ph = 1; sl.t = 0; }
    } else if (sl.ph === 1) {
      hero.setLocomotion(0, true, 0);
      if (sl.t > .2) { sl.ph = 2; sl.t = 0; sl.v = 600; hero.setSlam(true); Sfx.play('slam'); }
    } else if (sl.ph === 2) {
      sl.v = Math.min(1500, sl.v + 7000 * dt); sl.h -= sl.v * dt;
      hero.setLocomotion(0, true, sl.v);
      if ((trailT -= dt) <= 0) { trailT = .025; Vehicle.puff(stage, f.x + (Math.random() - .5) * 40, f.y - sl.h * size - 30 - Math.random() * 90, 9, 0); }
      if (sl.h <= 0) {
        sl.h = 0; sl.ph = 3; sl.t = 0; hero.setSlam(false); hero.kick(.5); Sfx.play('impact');
        var r = document.createElement('div'); r.className = 'shock'; r.style.left = f.x + 'px'; r.style.top = (f.y - 4) + 'px';
        stage.appendChild(r); r.addEventListener('animationend', function () { r.remove(); });
        for (var i = 0; i < 10; i++) Vehicle.puff(stage, f.x + (Math.random() - .5) * 40, f.y - 6, 14 + Math.random() * 14, (i < 5 ? -1 : 1) * (50 + Math.random() * 90));
      }
    } else {
      hero.setLocomotion(0, false, 0);
      if (sl.t > .7) { sl.ph = 0; sl.t = 0; }
    }
    return sl.h * size;
  }

  /* 冲刺演示：每 1.6 秒猛冲 0.22 秒，带残影和速度线，地面飞速后移 */
  function dashFrame(dt, f) {
    dsh.t += dt;
    var on = dsh.t % 1.6 < .22, k = size / .24;
    hero.setDash(on); hero.setLocomotion(0, false, 0);
    if (on) {
      if ((dsh.g -= dt) <= 0) {
        dsh.g = .045; hero.ghost(stage);
        Hero.streak(stage, f.x - hero.facing * 30 * k, f.y - (40 + Math.random() * 110) * k, hero.facing);
      }
      floorX -= dt * 900 * k * hero.facing;
    }
  }

  /* 上/下车演示：角色跳上车 → 车怠速 → 角色从车顶跳下；返回 { ox, lift, show } */
  function boardHero(k) {
    var T = vt % 3.2, o = { ox: 0, lift: 0, show: true };
    if (T < .24) {
      var u = T / .24;
      o.ox = -170 * k * (1 - u); o.lift = (60 * u + Math.sin(u * Math.PI) * 70 - 60 * 0) * k;
      o.lift = (Math.sin(u * Math.PI) * 70 + (1 - u) * 0 + 60 * u) * k;
      hero.setLocomotion(0, true, u < .5 ? -300 : 300);
      if (T < .05) { vbA = vbB = false; }
    } else if (T < 1.5) {
      o.show = false;
      if (!vbA) { vbA = true; veh.kick(.7); Sfx.play('board'); }
    } else {
      var tt = T - 1.5, y = 100 + 380 * tt - 1150 * tt * tt;
      if (!vbB) { vbB = true; veh.kick(-.5); Sfx.play('exit'); }
      o.ox = 180 * tt * k; o.lift = Math.max(0, y) * k;
      hero.setLocomotion(0, y > 0, -(380 - 2300 * tt));
    }
    o.driven = T >= .24 && T < 1.5;
    return o;
  }

  /* 载具演示（在 hero 更新之后调用，因为它要接管 vbullets 等） */
  function vehicleFrame(dt, f, driven) {
    var k = size / .24, target = 0, i;
    vwrap.style.transform = 'scale(' + k + ')';
    veh.x = f.x / k + (anim === 'v_board' ? 0 : 0); veh.y = f.y / k; veh.facing = facing;
    if (anim === 'v_drive') target = (vt % 6) < 4 ? 330 : 0;
    else if (anim === 'v_boost') target = 560;
    vvx += (target - vvx) * (1 - Math.exp(-dt * 3));
    if (anim === 'v_gun') {
      veh.aim(Math.cos(vt * .9) * 420, -60 + Math.sin(vt * 1.9) * 130);
      vgun -= dt;
      if (vgun <= 0 && veh.aimError() < 10) {
        vgun = .085;
        var m = veh.muzzle(), el = document.createElement('div');
        el.className = 'bullet'; vwrap.appendChild(el);
        vbullets.push({ el: el, x: m.x, y: m.y, vx: m.dx * 1500, vy: m.dy * 1500, a: Math.atan2(m.dy, m.dx), life: .3 });
        veh.fire(); Sfx.play('mg');
      }
    } else veh.aim(null);
    for (i = vbullets.length - 1; i >= 0; i--) {
      var b = vbullets[i]; b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt;
      b.el.style.transform = 'translate(' + (b.x - 14) + 'px,' + (b.y - 1.5) + 'px) rotate(' + b.a * 57.296 + 'deg)';
      if (b.life <= 0) { b.el.remove(); vbullets.splice(i, 1); }
    }
    veh.update(dt, { vx: vvx * facing, driven: driven });
    var run = driven && anim !== 'v_park';
    if (run !== engV) { Sfx.engine(run, 0); engV = run; }
    if (engV) Sfx.engine(true, Math.abs(vvx) / 330);
    floorX -= dt * vvx * k * facing;
  }

  /* ---------- 主循环 ---------- */
  var last = performance.now(), floorX = 0;
  function frame(now) {
    var dt = Math.min(.05, (now - last) / 1000) * rate; last = now;
    var f = feet(), lift = 0, ox = 0, isV = /^v_/.test(anim), showHero = !isV, vdriven = true, bd = null;
    vwrap.style.display = isV ? '' : 'none';
    if (!isV && engV) { Sfx.engine(false, 0); engV = false; }
    vt += dt;

    /* 驱动角色 */
    if (anim === 'walk' || anim === 'run') hero.setLocomotion(anim === 'run' ? 1.7 : 1, false, 0);
    else if (anim === 'jump') {
      jt += dt; if (jt > 1.1) jt = 0;
      var h = 760 * jt - 0.5 * 2100 * jt * jt;
      if (h < 0) { h = 0; if (jt > .6) jt = 0; }
      lift = h * (size / .22) * .22; hero.setLocomotion(0, h > 0, -(760 - 2100 * jt));
    } else if (anim === 'djump') {
      jt += dt;
      if (jt > 1.5) { jt = 0; dv = 0; dh = 0; djDone = false; }
      if (dv === 0 && dh === 0 && jt < .3) { dv = 760; hero.kick(-.16); }
      if (!djDone && jt > .36) { djDone = true; dv = 700; hero.doubleJump(); hero.kick(-.1); }
      dv -= (dv > 0 ? 1900 : 1900 * 1.35) * dt; dh += dv * dt;
      if (dh < 0 && jt > .1) { dh = 0; dv = 0; if (jt < 1.4) { hero.kick(.14); jt = 1.4; } }
      lift = Math.max(0, dh) * (size / .22) * .22;
      hero.setLocomotion(0, dh > 0, -dv);
    } else if (anim === 'slam') lift = slamFrame(dt, f);
    else if (anim === 'dash') dashFrame(dt, f);
    else if (anim === 'v_board') { bd = boardHero(size / .24); ox = bd.ox; lift = bd.lift; showHero = bd.show; vdriven = bd.driven; }
    else hero.setLocomotion(0, false, 0);
    if (anim === 'v_park') vdriven = false;
    hero.setAltitude(lift);

    if (anim === 'melee' || anim === 'chalk') {
      if (!hero.isAttacking()) {
        if (loop) { cool += dt; if (cool > .35) { cool = 0; hero.attack(anim); } }
        else setAnim('idle');
      }
    }
    hero.update(dt);
    hero.el.style.display = showHero ? '' : 'none';
    hero.place(f.x + ox, f.y - lift);
    if (isV) vehicleFrame(dt, f, vdriven);

    /* 跑步机地面 */
    if (anim === 'walk' || anim === 'run') floorX -= dt * (anim === 'run' ? 420 : 220) * hero.facing;
    $('floor').style.backgroundPosition = floorX + 'px 0, 0 0';

    /* 判定框 */
    if (showBox && anim === 'melee') {
      var b = hero.attackBox();
      hitbox.style.display = 'block';
      hitbox.style.left = f.x + b.x0 + 'px'; hitbox.style.top = f.y + b.y0 + 'px';
      hitbox.style.width = b.x1 - b.x0 + 'px'; hitbox.style.height = b.y1 - b.y0 + 'px';
      hitbox.classList.toggle('active', hero.hitActive);
    } else hitbox.style.display = 'none';

    /* 粉笔 */
    for (var i = chalks.length - 1; i >= 0; i--) {
      var c = chalks[i]; c.life -= dt; c.vy += 600 * dt; c.x += c.vx * dt; c.y += c.vy * dt;
      c.el.style.transform = 'translate(' + (c.x - 12) + 'px,' + (c.y - 5) + 'px) rotate(' + Math.atan2(c.vy, c.vx * hero.facing) * 57.3 * hero.facing + 'deg)';
      if (c.life <= 0) { c.el.remove(); chalks.splice(i, 1); }
    }

    /* 读数 */
    var a = hero.act;
    $('readout').textContent = '动画  ' + anim + '\n朝向  ' + (hero.facing > 0 ? '右' : '左') +
      '\n攻击  ' + (a ? a.kind + ' ' + a.t.toFixed(2) + ' / ' + a.dur.toFixed(2) + 's' : '—') +
      '\n判定  ' + (hero.hitActive ? '生效中' : '—');
    $('tlBar').style.width = (a ? a.t / a.dur * 100 : 0) + '%';
    drawTimeline();
    requestAnimationFrame(frame);
  }

  /* 静态调试：?anim=melee&t=0.2 */
  if (q.anim) {
    anim = q.anim; setAnim(q.anim); hero.act = null;
    var f0 = feet();
    hero.preview(q.anim, +q.t || 0);
    hero.place(f0.x, f0.y);
    var b0 = hero.attackBox();
    if (q.anim === 'melee') {
      hitbox.style.display = 'block'; hitbox.style.left = f0.x + b0.x0 + 'px'; hitbox.style.top = f0.y + b0.y0 + 'px';
      hitbox.style.width = b0.x1 - b0.x0 + 'px'; hitbox.style.height = b0.y1 - b0.y0 + 'px'; hitbox.classList.toggle('active', hero.hitActive);
    }
    $('readout').textContent = '冻结预览  ' + q.anim + ' @ ' + (+q.t || 0) + 's';
  } else requestAnimationFrame(frame);
})();
