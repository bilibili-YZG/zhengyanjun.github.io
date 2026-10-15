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

  /* ================== 事件处理 ================== */
  GameController.prototype.eventHandler = function (i, j) {
    let controller = this.reverseLink;
    let model = controller.model;
    let selectedChessIndex = controller.chessExist(i, j);

    if (selectedChessIndex >= 0 && model.chesses[selectedChessIndex].color === model.player) {
      model.selectedChessIndex = selectedChessIndex;
    } else if (model.selectedChessIndex >= 0) {
      let previousSelected = model.chesses[model.selectedChessIndex
