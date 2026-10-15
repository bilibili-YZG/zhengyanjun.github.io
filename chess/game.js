{
  /* ================== 工具 ================== */
  let red = Symbol("red");
  let blue = Symbol("blue");
  let timeoutWin = false;   // 是否是超时获胜

  function isRiver(i, j) {
    return i >= 1 && i <= 5 && i !== 3 && j >= 3 && j <= 5;
  }

  function crossRiver(x1, y1, x2, y2) {
    if (x1 === x2 && Math.abs(y1 - y2) === 4) {
      if (y1 === 2 && y2 === 6 && (x1 === 1 || x1 === 2 || x1 === 4 || x1 === 5)) return true;
      if (y2 === 2 && y1 === 6 && (x1 === 1 || x1 === 2 || x1 === 4 || x1 === 5)) return true;
    }
    if (y1 === y2 && Math.abs(x1 - x2) === 3) {
      if (x1 === 0 && x2 === 3 && (y1 === 3 || y1 === 4 || y1 === 5)) return true;
      if (x2 === 0 && x1 === 3 && (y1 === 3 || y1 === 4 || y1 === 5)) return true;
      if (x1 === 3 && x2 === 6 && (y1 === 3 || y1 === 4 || y1 === 5)) return true;
      if (x2 === 3 && x1 === 6 && (y1 === 3 || y1 === 4 || y1 === 5)) return true;
    }
    return false;
  }

  /* ================== 棋子 ================== */
  function Chess(x, y, color, type) {
    this.type = type;
    this.color = color;
    this.x = x;
    this.y = y;
  }
  // 修正：鼠吃象
  Chess.prototype.compareTo = function (chess) {
    if (chess.type === 1 && this.type === 8) return 1;   // 鼠吃象
    if (chess.type === 8 && this.type === 1) return -1;  // 象不能吃鼠
    return chess.type - this.type;                        // 数值小者吃数值大者
  };
  Chess.prototype.toChar = function () {
    return ["人", "象", "狮", "虎", "豹", "狼", "狗", "猫", "鼠"][this.type];
  };

  /* ================== 模型 ================== */
  function GameModel() {
    this.chesses = [
      // 红方：郑艳军（左）
      new Chess(0, 0, red, 3),
      new Chess(6, 0, red, 2),
      new Chess(1, 1, red, 6),
      new Chess(5, 1, red, 7),
      new Chess(0, 2, red, 1),
      new Chess(2, 2, red, 5),
      new Chess(4, 2, red, 4),
      new Chess(6, 2, red, 8),

      // 蓝方：刘刚（右）
      new Chess(6, 8, blue, 3),
      new Chess(0, 8, blue, 2),
      new Chess(5, 7, blue, 6),
      new Chess(1, 7, blue, 7),
      new Chess(6, 6, blue, 1),
      new Chess(4, 6, blue, 5),
      new Chess(2, 6, blue, 4),
      new Chess(0, 6, blue, 8)
    ];
    this.selectedChessIndex = -1;
    this.player = red;
  }

  /* ================== 视图 ================== */
  function View(table, callback, reverseLink) {
    this.table = table;
    this.cells = [];
    this.chessCand = [];
    this.callback = callback || function () {};
    this.reverseLink = reverseLink;

    for (let i = 0; i < 7; i++) {
      let row = document.createElement("tr");
      this.cells[i] = [];
      this.chessCand[i] = [];
      for (let j = 0; j < 9; j++) {
        let c = document.createElement("td");
        let d = document.createElement("div");
        d.onclick = () => this.callback(i, j);
        c.classList.add((i + j) % 2 ? "block-lighter" : "block-darker");
        d.classList.add("chess");
        row.append(c);
        c.append(d);
        this.cells[i][j] = c;
        this.chessCand[i][j] = d;
      }
      this.table.append(row);
    }

    this.cells[3][0].classList.add("block-home");
    this.cells[3][8].classList.add("block-home");

    this.cells[3][1].classList.add("block-trap");
    this.cells[4][0].classList.add("block-trap");
    this.cells[2][0].classList.add("block-trap");
    this.cells[2][8].classList.add("block-trap");
    this.cells[3][7].classList.add("block-trap");
    this.cells[4][8].classList.add("block-trap");

    for (let i = 1; i < 6; i++) {
      if (i !== 3) for (let j = 3; j < 6; j++) {
        this.cells[i][j].classList.add("block-river");
      }
    }
  }

  View.prototype.updateView = function (model) {
    for (let _ of this.chessCand) {
      for (let chessView of _) {
        chessView.innerText = "";
        chessView.classList.remove(
          "chess-selected", "chess-red", "chess-blue",
          "chess-move-target", "chess-attack-target", "chess-attack-blocked"
        );
        for (let type = 1; type <= 8; type++) {
          chessView.classList.remove("chess-type-" + type);
        }
      }
    }

    const leftDen = this.chessCand[3][0];
    const rightDen = this.chessCand[3][8];
    leftDen.innerText = "郑";
    leftDen.style.color = "#7f1d1d";
    leftDen.style.fontWeight = "900";
    leftDen.style.fontSize = "1.5rem";
    rightDen.innerText = "刘";
    rightDen.style.color = "#1e3a8a";
    rightDen.style.fontWeight = "900";
    rightDen.style.fontSize = "1.5rem";

    for (let chess of model.chesses) {
      const cell = this.chessCand[chess.x][chess.y];
      cell.classList.add("chess-" + (chess.color === red ? "red" : "blue"));
      cell.classList.add("chess-type-" + chess.type);
      cell.innerText = chess.toChar();
      cell.style.color = "";
      cell.style.fontSize = "";
    }

    if (this.reverseLink.model.selectedChessIndex >= 0) {
      let chess = model.chesses[this.reverseLink.model.selectedChessIndex];
      this.chessCand[chess.x][chess.y].classList.add("chess-selected");
    }

    if (this.reverseLink && this.reverseLink.model.selectedChessIndex >= 0) {
      const ctrl = this.reverseLink;
      const selectedIndex = ctrl.model.selectedChessIndex;
      const piece = ctrl.model.chesses[selectedIndex];
      if (piece) {
        for (let x = 0; x < 7; x++) {
          for (let y = 0; y < 9; y++) {
            if (x === piece.x && y === piece.y) continue;
            if (!ctrl.canMoveTo(piece, x, y)) continue;

            const idx = ctrl.chessExist(x, y);
            const target = idx >= 0 ? ctrl.model.chesses[idx] : null;

            if (target && target.color !== piece.color) {
              const canEat = (piece.compareTo(target) >= 0) || ctrl.inTrap(target);
              if (canEat) {
                this.chessCand[x][y].classList.add("chess-attack-target");
              } else {
                this.chessCand[x][y].classList.add("chess-attack-blocked");
              }
            } else {
              this.chessCand[x][y].classList.add("chess-move-target");
            }
          }
        }
      }
    }
  };

  /* ================== 控制器 ================== */
  function GameController(callback, playerChanged) {
    let ele = document.getElementById("animal-chess");
    let table = document.createElement("table");
    ele.append(table);
    this.model = new GameModel();
    this.view = new View(table, this.eventHandler, this);
    this.view.updateView(this.model);
    this.playerChangedCallback = playerChanged || function () {};
    this.callback = callback || function () {};
  }

  GameController.prototype.chessExist = function (x, y) {
    for (let i = 0; i < this.model.chesses.length; i++) {
      let chess = this.model.chesses[i];
      if (chess.x === x && chess.y === y) return i;
    }
    return -1;
  };

  GameController.prototype.noMice = function (x1, y1, x2, y2) {
    if (x1 === x2) {
      const from = Math.min(y1, y2) + 1;
      const to = Math.max(y1, y2) - 1;
      for (let j = from; j <= to; j++) {
        if (this.chessExist(x1, j) >= 0) return false;
      }
      return true;
    }
    if (y1 === y2) {
      const from = Math.min(x1, x2) + 1;
      const to = Math.max(x1, x2) - 1;
      for (let i = from; i <= to; i++) {
        if (this.chessExist(i, y1) >= 0) return false;
      }
      return true;
    }
    return false;
  };

  GameController.prototype.switchPlayer = function () {
    if (this.model.player === red) this.model.player = blue;
    else this.model.player = red;
    this.playerChangedCallback(this.model.player === red ? "red" : "blue");
  };

  GameController.prototype.inTrap = function (chess) {
    let x = chess.x, y = chess.y;
    return ((chess.color === blue) && ((x === 2 && y === 0) || (x === 3 && y === 1) || (x === 4 && y === 0)))
      || ((chess.color === red) && ((x === 2 && y === 8) || (x === 3 && y === 7) || (x === 4 && y === 8)));
  };

  GameController.prototype.canMoveTo = function (piece, i, j) {
    if (!piece) return false;
    if (i < 0 || i >= 7 || j < 0 || j >= 9) return false;
    if (piece.color === red && i === 3 && j === 0) return false;
    if (piece.color === blue && i === 3 && j === 8) return false;
    const idx = this.chessExist(i, j);
    if (idx >= 0 && this.model.chesses[idx].color === piece.color) return false;
    if (piece.type !== 8 && isRiver(i, j)) return false;
    if (Math.abs(i - piece.x) + Math.abs(j - piece.y) <= 1) return true;
    if ((piece.type === 2 || piece.type === 3)
      && crossRiver(piece.x, piece.y, i, j)
      && this.noMice(piece.x, piece.y, i, j)) return true;
    return false;
  };

  /* ================== 音效 ================== */
  let audioCtx = null;
  window.ensureAudio = function () {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    }
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  };

  function playMoveSound() {
    ensureAudio();
    if (!audioCtx) return;
    const t0 = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, t0);
    osc.frequency.exponentialRampToValueAtTime(300, t0 + 0.08);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.15, t0 + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(t0); osc.stop(t0 + 0.15);
  }

  function playEatSound() {
    ensureAudio();
    if (!audioCtx) return;
    const t0 = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(220, t0);
    osc.frequency.exponentialRampToValueAtTime(60, t0 + 0.18);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.35, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(t0); osc.stop(t0 + 0.25);

    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(880, t0);
    osc2.frequency.exponentialRampToValueAtTime(220, t0 + 0.12);
    gain2.gain.setValueAtTime(0.0001, t0);
    gain2.gain.exponentialRampToValueAtTime(0.2, t0 + 0.005);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.15);
    osc2.connect(gain2); gain2.connect(audioCtx.destination);
    osc2.start(t0); osc2.stop(t0 + 0.18);
  }

  function playVictorySound() {
    ensureAudio();
    if (!audioCtx) return;
    const t0 = audioCtx.currentTime;
    const notes = [
      { f: 523.25, t: 0, d: 0.18 },
      { f: 659.25, t: 0.18, d: 0.18 },
      { f: 783.99, t: 0.36, d: 0.18 },
      { f: 1046.50, t: 0.54, d: 0.55 }
    ];
    notes.forEach(n => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(n.f, t0 + n.t);
      gain.gain.setValueAtTime(0.0001, t0 + n.t);
      gain.gain.exponentialRampToValueAtTime(0.28, t0 + n.t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + n.t + n.d);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(t0 + n.t); osc.stop(t0 + n.t + n.d + 0.05);
    });
  }

  function playCaptureAnim(x, y) {
    const table = document.querySelector("#animal-chess table");
    if (!table) return;
    const cell = table.rows[x] && table.rows[x].cells[y];
    if (!cell) return;
    cell.classList.add("capturing");

    const rect = cell.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const colors = ["#fde047", "#ef4444", "#f87171", "#fbbf24", "#ffffff"];
    for (let i = 0; i < 16; i++) {
      const p = document.createElement("div");
      p.style.cssText = `
        position: fixed;
        left: ${cx}px; top: ${cy}px;
        width: 8px; height: 8px;
        border-radius: 50%;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        pointer-events: none;
        z-index: 999;
        box-shadow: 0 0 10px currentColor;
      `;
      document.body.appendChild(p);

      const angle = Math.random() * Math.PI * 2;
      const dist = 40 + Math.random() * 70;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;

      p.animate([
        { transform: "translate(0,0) scale(1)", opacity: 1 },
        { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
      ], {
        duration: 550 + Math.random() * 200,
        easing: "cubic-bezier(.2,.8,.3,1)",
        fill: "forwards"
      });

      setTimeout(() => p.remove(), 800);
    }

    setTimeout(() => cell.classList.remove("capturing"), 600);
  }

  /* ================== 吞噬胜利动画 ================== */
  window.playDevour = function (winner, piece) {
    let overlay = document.getElementById("devourOverlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "devourOverlay";
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = "";

    // 修正：type 1 是象，type 8 是鼠
    const ICON = {
      1: "🐘",
      2: "🦁",
      3: "🐯",
      4: "🐆",
      5: "🐺",
      6: "🐶",
      7: "🐱",
      8: "🐭"
    };
    let iconChar;
    if (timeoutWin) {
      iconChar = "⏰";
    } else if (piece) {
      iconChar = ICON[piece.type] || "🏆";
    } else {
      iconChar = "🏆";
    }

    overlay.style.background =
      winner === "red"
        ? "radial-gradient(circle, #ef4444cc 0%, #020617ee 70%)"
        : "radial-gradient(circle, #3b82f6cc 0%, #020617ee 70%)";

    const icon = document.createElement("div");
    icon.className = "icon";
    icon.textContent = iconChar;
    overlay.appendChild(icon);

    const ringColor = winner === "red" ? "#f87171" : "#60a5fa";
    for (let i = 0; i < 3; i++) {
      const ring = document.createElement("div");
      ring.className = "ring";
      ring.style.width = "200px";
      ring.style.height = "200px";
      ring.style.borderColor = ringColor;
      ring.style.boxShadow = `0 0 60px ${ringColor}aa, inset 0 0 40px ${ringColor}aa`;
      ring.style.animationDelay = (i * 0.15) + "s";
      overlay.appendChild(ring);
    }

    overlay.style.display = "flex";

    try {
      ensureAudio();
      if (audioCtx) {
        const t0 = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(200, t0);
        osc.frequency.exponentialRampToValueAtTime(40, t0 + 0.8);
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(0.4, t0 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.9);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(t0); osc.stop(t0 + 1);
      }
    } catch (e) {}

    setTimeout(() => {
      overlay.innerHTML = "";
      overlay.style.display = "none";
    }, 1400);
  };

  /* ================== 事件处理 ================== */
  GameController.prototype.eventHandler = function (i, j) {
    let controller = this.reverseLink;
    let model = controller.model;
    let selectedChessIndex = controller.chessExist(i, j);

    if (selectedChessIndex >= 0 && model.chesses[selectedChessIndex].color === model.player) {
      model.selectedChessIndex = selectedChessIndex;
    } else if (model.selectedChessIndex >= 0) {
      let previousSelected = model.chesses[model.selectedChessIndex];
      if (controller.canMoveTo(previousSelected, i, j)) {
        if (selectedChessIndex < 0) {
          // 走空格
          previousSelected.x = i;
          previousSelected.y = j;
          model.selectedChessIndex = -1;
          playMoveSound();
          if ((model.player === red && i === 3 && j === 8
            || model.player === blue && i === 3 && j === 0)) {
            controller.callback(model.player === red ? "red" : "blue", previousSelected);
            return;
          }
          controller.switchPlayer();
        } else if (model.chesses[selectedChessIndex].color !== previousSelected.color) {
          // 有敌人
          let nowSelected = model.chesses[selectedChessIndex];
          let result = previousSelected.compareTo(nowSelected);
          if (result >= 0 || controller.inTrap(nowSelected)) {
            playCaptureAnim(i, j);
            playEatSound();
            previousSelected.x = i;
            previousSelected.y = j;
            model.chesses.splice(selectedChessIndex, 1);
            controller.switchPlayer();
            model.selectedChessIndex = -1;

            // 吃光对方 → 立刻胜
            if (model.chesses.filter(c => c.color === previousSelected.color).length === 0) {
              controller.callback(previousSelected.color === red ? "red" : "blue", previousSelected);
              return;
            }
          }
        }
      }
    }
    this.updateView(this.reverseLink.model);
  };

  document.GameController = GameController;
  document.Chess = Chess;
  document.View = View;
  document.GameModel = GameModel;

  /* ================== 计时（全局） ================== */
  let stepLeft = 30;
  let clockTimer = null;

  window.resetClock = function () {
    stepLeft = 30;
    const clockText = document.getElementById("clockText");
    if (clockText) clockText.textContent = 30;
    const clock = document.getElementById("clock");
    if (clock) clock.classList.remove("warning");
  };

  window.startClock = function () {
    window.stopClock();
    window.resetClock();
    clockTimer = setInterval(() => {
      stepLeft--;
      const clockText = document.getElementById("clockText");
      if (clockText) clockText.textContent = Math.max(0, stepLeft);
      const clock = document.getElementById("clock");
      if (clock) clock.classList.toggle("warning", stepLeft <= 5);
      if (stepLeft <= 0) {
        window.stopClock();
        if (window.controller) {
          const winner = window.controller.model.player === red ? "blue" : "red";
          timeoutWin = true;   // 标记超时
          window.controller.callback(winner, null);
        }
      }
    }, 1000);
  };

  window.stopClock = function () {
    if (clockTimer) clearInterval(clockTimer);
    clockTimer = null;
  };

  /* ================== UI 更新（全局） ================== */
  window.updateTurnUI = function (color) {
    const cur = document.getElementById("cur");
    const turnBadge = document.getElementById("turnBadge");
    const clock = document.getElementById("clock");
    if (!cur) return;
    if (color === "red") {
      cur.textContent = "郑艳军回合";
      turnBadge.classList.add("red-active");
      turnBadge.classList.remove("blue-active");
      clock.classList.add("red-active");
      clock.classList.remove("blue-active");
    } else {
      cur.textContent = "刘刚回合";
      turnBadge.classList.add("blue-active");
      turnBadge.classList.remove("red-active");
      clock.classList.add("blue-active");
      clock.classList.remove("red-active");
    }
    window.resetClock();
    window.startClock();
  };

  window.resetTurnUI = function () {
    const cur = document.getElementById("cur");
    if (cur) cur.textContent = "郑艳军回合";
    window.stopClock();
    window.resetClock();
  };

  window.msg = function (t, highlight) {
    const el = document.getElementById("msg");
    if (!el) return;
    el.textContent = t;
    el.classList.toggle("highlight", !!highlight);
  };

  /* ================== 结束 & 烟花 ================== */
  let fwRAF = null;
  let fwRunning = false;

  window.startFireworks = function () {
    let canvas = document.getElementById("fireworks");
    if (!canvas) return;
    canvas.style.display = "block";
    const ctx = canvas.getContext("2d");
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;

    window.addEventListener("resize", () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    });

    const particles = [];
    const rockets = [];

    function spawnRocket() {
      rockets.push({
        x: Math.random() * W,
        y: H,
        vy: -(8 + Math.random() * 4),
        targetY: H * (0.15 + Math.random() * 0.35),
        hue: Math.floor(Math.random() * 360)
      });
    }

    function explode(x, y, hue) {
      const count = 60 + Math.floor(Math.random() * 40);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 5;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 60 + Math.random() * 40,
          maxLife: 100,
          hue: hue + (Math.random() * 40 - 20),
          size: 2 + Math.random() * 2
        });
      }
    }

    fwRunning = true;

    function loop() {
      if (!fwRunning) {
        canvas.style.display = "none";
        return;
      }
      ctx.fillStyle = "rgba(2,6,23,0.18)";
      ctx.fillRect(0, 0, W, H);

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.y += r.vy;
        ctx.beginPath();
        ctx.fillStyle = `hsl(${r.hue}, 100%, 70%)`;
        ctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        if (r.y <= r.targetY) {
          explode(r.x, r.y, r.hue);
          rockets.splice(i, 1);
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06;
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.life--;
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.beginPath();
        ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${alpha})`;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        if (p.life <= 0) particles.splice(i, 1);
      }

      if (Math.random() < 0.04) spawnRocket();
      fwRAF = requestAnimationFrame(loop);
    }

    for (let i = 0; i < 3; i++) setTimeout(spawnRocket, i * 200);
    loop();
  };

  window.fwStop = function () {
    fwRunning = false;
    if (fwRAF) cancelAnimationFrame(fwRAF);
    const canvas = document.getElementById("fireworks");
    if (canvas) canvas.style.display = "none";
  };

  window.endGame = function (winner, piece) {
    window.stopClock();
    window.playDevour(winner, piece);
    playVictorySound();
    window.startFireworks();
    document.getElementById("winnerName").textContent =
      winner === "red" ? "🏆 郑艳军获胜" : "🏆 刘刚获胜";
    document.getElementById("winnerInfo").textContent =
      timeoutWin ? "对方超时判负！" : "恭喜！";
    setTimeout(() => {
      document.getElementById("result").style.display = "flex";
      timeoutWin = false;
    }, 1200);
  };
}
