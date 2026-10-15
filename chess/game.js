{
  let red = Symbol("red");
  let blue = Symbol("blue");

  function isRiver(i, j) {
    return i >= 1 && i <= 5 && i !== 3 && j >= 3 && j <= 5;
  }

  function crossRiver(x1, y1, x2, y2) {
    if (x1 !== x2 && y1 !== y2) return false;
    if (y1 === 2 && y2 === 6 && (x1 === 1 || x1 === 2 || x1 === 4 || x1 === 5)) return true;
    if (y2 === 2 && y1 === 6 && (x1 === 1 || x1 === 2 || x1 === 4 || x1 === 5)) return true;
    return false;
  }

  function Chess(x, y, color, type) {
    this.type = type;
    this.color = color;
    this.x = x;
    this.y = y;
  }

  Chess.prototype.compareTo = function (chess) {
    if (chess.type === 8 && this.type === 1) return -1;
    if (chess.type === 1 && this.type === 8) return 1;
    return chess.type - this.type;
  };

  Chess.prototype.toChar = function () {
    return ["人", "象", "狮", "虎", "豹", "狼", "狗", "猫", "鼠"][this.type];
  };

  function GameModel() {
    this.chesses = [
      new Chess(0, 0, blue, 3),
      new Chess(6, 0, blue, 2),
      new Chess(1, 1, blue, 6),
      new Chess(5, 1, blue, 7),
      new Chess(0, 2, blue, 1),
      new Chess(2, 2, blue, 5),
      new Chess(4, 2, blue, 4),
      new Chess(6, 2, blue, 8),

      new Chess(6, 8, red, 3),
      new Chess(0, 8, red, 2),
      new Chess(5, 7, red, 6),
      new Chess(1, 7, red, 7),
      new Chess(6, 6, red, 1),
      new Chess(4, 6, red, 5),
      new Chess(2, 6, red, 4),
      new Chess(0, 6, red, 8)
    ];
    this.selectedChessIndex = -1;
    this.player = red;
  }

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
    this.cells[2][8].classList.add("block-trap");
    this.cells[2][0].classList.add("block-trap");
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
        chessView.classList.remove("chess-selected", "chess-red", "chess-blue");
        for (let type = 1; type <= 8; type++) {
          chessView.classList.remove("chess-type-" + type);
        }
      }
    }
    for (let chess of model.chesses) {
      this.chessCand[chess.x][chess.y].classList.add("chess-" + (chess.color === red ? "red" : "blue"));
      this.chessCand[chess.x][chess.y].classList.add("chess-type-" + chess.type);
      this.chessCand[chess.x][chess.y].innerText = chess.toChar();
    }
    if (this.reverseLink.model.selectedChessIndex >= 0) {
      let chess = model.chesses[this.reverseLink.model.selectedChessIndex];
      this.chessCand[chess.x][chess.y].classList.add("chess-selected");
    }
  };

  function GameController(callback, playerChanged, path) {
    let ele = document.getElementById("animal-chess");
    let table = document.createElement("table");
    ele.append(table);
    this.model = new GameModel();
    this.view = new View(table, this.eventHandler, this);
    this.view.updateView(this.model);
    this.playerChangedCallback = playerChanged || function () {};
    this.callback = callback || function () {};
    if (path) {
      let head = document.getElementsByTagName("head")[0];
      let link = document.createElement("link");
      link.href = path;
      link.id = "game-style";
      link.rel = "stylesheet";
      head.appendChild(link);
    }
  }

  GameController.prototype.chessExist = function (x, y) {
    for (let i = 0; i < this.model.chesses.length; i++) {
      let chess = this.model.chesses[i];
      if (chess.x === x && chess.y === y) return i;
    }
    return -1;
  };

  GameController.prototype.noMice = function (i1, j1, i2, j2) {
    for (let j = 3; j <= 5; j++) {
      if (this.chessExist(i1, j) >= 0) return false;
    }
    return true;
  };

  GameController.prototype.switchPlayer = function () {
    if (this.model.player === red) this.model.player = blue;
    else this.model.player = red;
    this.playerChangedCallback(this.model.player === red ? "red" : "blue");
  };

  GameController.prototype.inTrap = function (chess) {
    let x = chess.x, y = chess.y;
    return ((chess.color === red) && ((x === 2 && y === 0) || (x === 3 && y === 1) || (x === 4 && y === 0)))
      || ((chess.color === blue) && ((x === 2 && y === 8) || (x === 3 && y === 7) || (x === 4 && y === 8)));
  };

  let audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    }
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  }

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

  let fwRAF = null;
  function startFireworks() {
    let canvas = document.getElementById("fireworks");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "fireworks";
      document.body.appendChild(canvas);
    }
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

    let running = true;
    function loop() {
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
      if (running) fwRAF = requestAnimationFrame(loop);
      else canvas.style.display = "none";
    }

    for (let i = 0; i < 3; i++) setTimeout(spawnRocket, i * 200);
    loop();

    setTimeout(() => { running = false; }, 8000);
  }

  window.showWinner = function (msg) {
    playVictorySound();
    startFireworks();
    setTimeout(() => {
      let who = msg === "red" ? "郑艳军" : "刘刚";
      alert("🏆 " + who + " 获胜！");
      if (window.restartGame) window.restartGame();
    }, 1200);
  };

  GameController.prototype.eventHandler = function (i, j) {
    let controller = this.reverseLink;
    let model = controller.model;
    let selectedChessIndex = controller.chessExist(i, j);

    if (selectedChessIndex >= 0 && model.chesses[selectedChessIndex].color === model.player) {
      model.selectedChessIndex = selectedChessIndex;
    } else if (model.selectedChessIndex >= 0) {
      let previousSelected = model.chesses[model.selectedChessIndex];
      if (
        (!(previousSelected.color === red && i === 3 && j === 8
          || previousSelected.color === blue && i === 3 && j === 0))
        && ((previousSelected.type === 8) || !isRiver(i, j))
        && ((Math.abs(i - previousSelected.x) + Math.abs(j - previousSelected.y) <= 1)
          || ((crossRiver(previousSelected.x, previousSelected.y, i, j))
            && (previousSelected.type === 2 || previousSelected.type === 3)
            && (controller.noMice(previousSelected.x, previousSelected.y, i, j))))
      ) {
        if (selectedChessIndex < 0) {
          previousSelected.x = i;
          previousSelected.y = j;
          model.selectedChessIndex = -1;
          playMoveSound();
          if ((model.player === blue && i === 3 && j === 8
            || model.player === red && i === 3 && j === 0)) {
            controller.callback(model.player === red ? "red" : "blue");
            return;
          }
          controller.switchPlayer();
        } else if (model.chesses[selectedChessIndex].color !== previousSelected.color) {
          let nowSelected = model.chesses[selectedChessIndex];
          let result = previousSelected.compareTo(nowSelected);
          if (result > 0 || controller.inTrap(nowSelected)) {
            playCaptureAnim(i, j);
            playEatSound();
            previousSelected.x = i;
            previousSelected.y = j;
            model.chesses.splice(selectedChessIndex, 1);
            controller.switchPlayer();
            model.selectedChessIndex = -1;
          } else if (result === 0) {
            playCaptureAnim(i, j);
            playEatSound();
            let hi = Math.max(selectedChessIndex, model.selectedChessIndex);
            let lo = Math.min(selectedChessIndex, model.selectedChessIndex);
            model.chesses.splice(hi, 1);
            model.chesses.splice(lo, 1);
            controller.switchPlayer();
            model.selectedChessIndex = -1;
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
}
