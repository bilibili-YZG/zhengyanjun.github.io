/* 音效模块：全部用 WebAudio 现场合成，没有音频文件。
   Sfx.play(name)        播放：jump djump land swing hit ko chalk slam impact mg ram board exit tired
   Sfx.engine(on, speed) 载具引擎持续音（speed 0~1.2，随速度变调）；on=false 关闭
   Sfx.setVolume(0~1)  Sfx.setMuted(bool)  Sfx.volume / Sfx.muted
   浏览器要求用户操作后才能出声：第一次按键/点击/触摸会自动解锁。 */
(function (root) {
  'use strict';
  var AC = root.AudioContext || root.webkitAudioContext, ctx = null, master = null, noiseBuf = null, eng = null, last = {};
  var S = { volume: .7, muted: false };

  function ensure() {
    if (!AC) return null;
    if (!ctx) {
      ctx = new AC(); master = ctx.createGain(); master.connect(ctx.destination); applyVol();
      var n = ctx.sampleRate * 1, d;
      noiseBuf = ctx.createBuffer(1, n, ctx.sampleRate); d = noiseBuf.getChannelData(0);
      for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function applyVol() { if (master) master.gain.value = S.muted ? 0 : S.volume * S.volume; }

  /* 音调：freq0→freq1 指数滑音 */
  function tone(f0, f1, dur, type, vol, delay) {
    var t = ctx.currentTime + (delay || 0), o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .02);
  }
  /* 噪声：滤波类型 type，中心频率 f0→f1 */
  function noise(dur, type, f0, f1, vol, delay, q) {
    var t = ctx.currentTime + (delay || 0), s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; s.loop = true; f.type = type; f.Q.value = q || 1;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + .02);
  }
  function j(x) { return x * (.92 + Math.random() * .16); }

  var SOUNDS = {
    jump:   function () { tone(j(300), j(620), .12, 'square', .09); },
    djump:  function () { tone(j(450), j(950), .14, 'square', .09); tone(j(700), j(1300), .1, 'triangle', .07, .05); },
    land:   function () { noise(.09, 'lowpass', 500, 160, .22); tone(130, 60, .09, 'sine', .22); },
    swing:  function () { noise(.16, 'bandpass', j(2200), 500, .22, 0, 1.4); },
    hit:    function () { noise(.07, 'highpass', 1800, 900, .2); tone(j(240), 80, .12, 'triangle', .26); },
    ko:     function () { tone(320, 80, .28, 'sawtooth', .16); noise(.2, 'lowpass', 1200, 200, .2); tone(660, 880, .1, 'square', .07, .12); },
    chalk:  function () { tone(j(950), 520, .07, 'sine', .12); noise(.05, 'highpass', 4000, 3000, .06); },
    slam:   function () { tone(700, 130, .32, 'sawtooth', .13); noise(.3, 'bandpass', 2600, 400, .15, 0, 1.2); },
    impact: function () { tone(110, 32, .45, 'sine', .55); noise(.32, 'lowpass', 1400, 120, .42); tone(60, 30, .3, 'square', .1, .02); },
    mg:     function () { noise(.05, 'bandpass', j(1700), 900, .17, 0, 1.2); tone(j(200), 90, .05, 'square', .09); },
    ram:    function () { tone(80, 32, .3, 'sine', .5); noise(.22, 'lowpass', 1600, 200, .35); tone(j(320), 180, .15, 'triangle', .14, .02); },
    board:  function () { noise(.09, 'lowpass', 900, 250, .2); tone(220, 130, .12, 'square', .1); tone(330, 440, .08, 'triangle', .08, .08); },
    exit:   function () { noise(.08, 'lowpass', 700, 250, .16); tone(300, 180, .1, 'square', .08); },
    hurt:   function () { tone(260, 90, .22, 'sawtooth', .22); noise(.12, 'lowpass', 1500, 300, .22); },
    pickup: function () { tone(660, 990, .09, 'triangle', .13); tone(990, 1480, .1, 'triangle', .12, .07); },
    orb:    function () { tone(520, 220, .16, 'square', .09); noise(.08, 'bandpass', 1200, 500, .1); },
    dash:   function () { noise(.2, 'bandpass', 900, 3800, .26, 0, .9); tone(j(220), 520, .13, 'sawtooth', .09); },
    ready:  function () { tone(880, 1320, .1, 'sine', .1); tone(1320, 1760, .08, 'sine', .08, .08); },
    tired:  function () { tone(240, 130, .22, 'sawtooth', .1); tone(200, 100, .22, 'sawtooth', .08, .12); }
  };
  /* 同名音效最短间隔（秒），避免机枪/连续命中叠成噪音 */
  var GAP = { mg: .045, hit: .03, land: .08 };

  var Sfx = {
    play: function (name) {
      if (S.muted || !SOUNDS[name] || !ensure()) return;
      var t = ctx.currentTime;
      if (GAP[name] && last[name] && t - last[name] < GAP[name]) return;
      last[name] = t; SOUNDS[name]();
    },
    /* 载具引擎：锯齿波 + 低通，频率/音量随速度变化 */
    engine: function (on, speed) {
      if (!ensure()) return;
      if (on && !eng) {
        var o = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
        o.type = 'sawtooth'; o2.type = 'square'; f.type = 'lowpass'; f.frequency.value = 380; g.gain.value = 0;
        o.connect(f); o2.connect(f); f.connect(g); g.connect(master); o.start(); o2.start();
        eng = { o: o, o2: o2, f: f, g: g };
      }
      if (!eng) return;
      var t = ctx.currentTime, hz = 46 + Math.min(1.3, speed || 0) * 70;
      eng.o.frequency.setTargetAtTime(hz, t, .08); eng.o2.frequency.setTargetAtTime(hz * .5, t, .08);
      eng.f.frequency.setTargetAtTime(300 + (speed || 0) * 420, t, .1);
      eng.g.gain.setTargetAtTime(on && !S.muted ? .05 + Math.min(1.3, speed || 0) * .05 : 0, t, .12);
      if (!on) { var e = eng; eng = null; setTimeout(function () { try { e.o.stop(); e.o2.stop(); } catch (x) {} }, 600); }
    },
    setVolume: function (v) { S.volume = Math.max(0, Math.min(1, v)); applyVol(); },
    setMuted: function (m) { S.muted = !!m; applyVol(); if (m && eng) eng.g.gain.value = 0; },
    unlock: ensure
  };
  Object.defineProperty(Sfx, 'volume', { get: function () { return S.volume; } });
  Object.defineProperty(Sfx, 'muted', { get: function () { return S.muted; } });

  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { window.addEventListener(ev, function () { ensure(); }, { passive: true }); });
  root.Sfx = Sfx;
})(window);
