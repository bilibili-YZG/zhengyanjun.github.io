"use strict";

window.GameEffects = (() => {
  let audioContext = null;
  let enabled = true;
  let image = null;
  const activeEffects = new Set();

  const palette = [
    "#39efff", "#ff54bf", "#a780ff",
    "#ffe36d", "#65ffab", "#ff795f"
  ];

  function loadImage() {
    if (image) return image;
    image = new Image();
    image.src = "assets/zyj.png";
    image.onload = () => window.dispatchEvent(new Event("zyj-image-ready"));
    image.onerror = () => console.warn("未找到 assets/zyj.png，将使用备用方块样式。");
    return image;
  }

  function setSound(value) {
    enabled = !!value;
  }

  function soundEnabled() {
    return enabled;
  }

  function getAudio() {
    if (!enabled) return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioContext) audioContext = new AudioCtx();
    if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
    return audioContext;
  }

  function tone(freq, duration, type = "sine", volume = .04, endFreq = null) {
    const ac = getAudio();
    if (!ac) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const now = ac.currentTime;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), now + duration);
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(now);
    osc.stop(now + duration + .025);
  }

  function play(name) {
    if (!enabled) return;
    switch (name) {
      case "start":
        tone(420, .12, "triangle", .035, 650);
        setTimeout(() => tone(660, .16, "triangle", .04, 900), 100);
        break;
      case "move":
        tone(250, .035, "square", .012, 220);
        break;
      case "rotate":
        tone(420, .07, "triangle", .025, 620);
        break;
      case "drop":
        tone(180, .12, "sawtooth", .035, 65);
        break;
      case "lock":
        tone(140, .045, "triangle", .018, 110);
        break;
      case "clear1":
        tone(520, .13, "triangle", .045, 760);
        break;
      case "clear2":
        tone(420, .15, "triangle", .045, 850);
        setTimeout(() => tone(700, .16, "triangle", .035, 1050), 70);
        break;
      case "clear3":
        tone(400, .20, "sawtooth", .03, 900);
        setTimeout(() => tone(650, .20, "triangle", .04, 1200), 70);
        setTimeout(() => tone(900, .22, "triangle", .035, 1400), 130);
        break;
      case "clear4":
        [440, 554, 659, 880].forEach((f, i) =>
          setTimeout(() => tone(f, .32, "triangle", .045, f * 1.4), i * 65)
        );
        break;
      case "attack":
        tone(180, .22, "sawtooth", .045, 720);
        setTimeout(() => tone(90, .18, "square", .03, 50), 100);
        break;
      case "shield":
        tone(350, .28, "sine", .04, 1100);
        break;
      case "eliminate":
        tone(300, .35, "sawtooth", .045, 55);
        break;
      case "win":
        [523, 659, 784, 1047].forEach((f, i) =>
          setTimeout(() => tone(f, .35, "triangle", .05), i * 120)
        );
        break;
      case "lose":
        tone(380, .28, "triangle", .035, 120);
        break;
    }
  }

  function createParticles(canvas, x, y, color, count = 16) {
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / Math.max(1, rect.width);
    const sy = canvas.height / Math.max(1, rect.height);
    const px = x * sx, py = y * sy;
    const particles = [];
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 4.5;
      particles.push({
        x: px, y: py,
        vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
        life: 1, size: 1.5 + Math.random() * 3,
        color: Math.random() < .3 ? palette[Math.floor(Math.random() * palette.length)] : color
      });
    }
    const effect = { canvas, ctx, particles, started: performance.now() };
    activeEffects.add(effect);
    requestAnimationFrame(function animate(now) {
      if (!activeEffects.has(effect)) return;
      const age = now - effect.started;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += .055;
        p.life -= .018;
        if (p.life <= 0) continue;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 9;
        ctx.shadowColor = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      if (age < 900 && particles.some(p => p.life > 0)) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        activeEffects.delete(effect);
      }
    });
  }

  function clearFlash(canvas, rows, color = "#ffffff") {
    const ctx = canvas.getContext("2d");
    const rowHeight = canvas.height / 20;
    const started = performance.now();
    const effect = { canvas, ctx, started };
    activeEffects.add(effect);
    function animate(now) {
      if (!activeEffects.has(effect)) return;
      const t = (now - started) / 320;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (t < 1) {
        ctx.globalAlpha = (1 - t) * .7;
        ctx.fillStyle = color;
        for (const row of rows) {
          ctx.fillRect(0, row * rowHeight, canvas.width, rowHeight);
        }
        ctx.globalAlpha = 1;
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        activeEffects.delete(effect);
      }
    }
    requestAnimationFrame(animate);
  }

  function shake(element, amount = 5, duration = 180) {
    if (!element) return;
    const started = performance.now();
    const original = element.style.transform;
    function animate(now) {
      const t = (now - started) / duration;
      if (t >= 1) {
        element.style.transform = original;
        return;
      }
      const fade = 1 - t;
      const x = (Math.random() - .5) * amount * fade;
      const y = (Math.random() - .5) * amount * fade;
      element.style.transform = `translate(${x}px,${y}px)`;
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }

  function toast(text, duration = 1000) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = text;
    el.classList.add("show");
    clearTimeout(el._toastTimer);
    el._toastTimer = setTimeout(() => el.classList.remove("show"), duration);
  }

  return {
    loadImage, getImage: loadImage, play, setSound, soundEnabled,
    createParticles, clearFlash, shake, toast
  };
})();
