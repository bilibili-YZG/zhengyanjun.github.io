"use strict";

window.TetrisCore = (() => {
  const COLS = 10;
  const ROWS = 20;
  const CELL = 30;

  const SHAPES = {
    I: [[1, 1, 1, 1]],
    O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1]],
    S: [[0, 1, 1], [1, 1, 0]],
    Z: [[1, 1, 0], [0, 1, 1]],
    J: [[1, 0, 0], [1, 1, 1]],
    L: [[0, 0, 1], [1, 1, 1]]
  };

  const COLORS = {
    I: "#39efff",
    O: "#ffe36d",
    T: "#ad82ff",
    S: "#65ffab",
    Z: "#ff557c",
    J: "#6494ff",
    L: "#ffad61"
  };

  const TYPES = Object.keys(SHAPES);

  function cloneMatrix(matrix) {
    return matrix.map(row => row.slice());
  }

  function rotateMatrix(matrix) {
    return matrix[0].map((_, i) => matrix.map(row => row[i]).reverse());
  }

  function createBag() {
    const bag = TYPES.slice();
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    return bag;
  }

  class TetrisBoard {
    constructor(player, canvas, fxCanvas, nextCanvas, callbacks = {}) {
      this.player = player;
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.fxCanvas = fxCanvas;
      this.nextCanvas = nextCanvas;
      this.nextCtx = nextCanvas.getContext("2d");
      this.callbacks = callbacks;
      this.grid = [];
      this.queue = [];
      this.piece = null;
      this.fallTime = 0;
      this.lockTime = 0;
      this.lockResets = 0;
      this.lastRotate = false;
      this.combo = -1;
      this.backToBack = false;
      this.lines = 0;
      this.score = 0;
      this.level = 1;
      this.energy = 0;
      this.shield = 0;
      this.alive = true;
      this.paused = false;
      this.flashRows = [];
      this.reset();
    }

    reset() {
      this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
      this.queue = [];
      this.piece = null;
      this.fallTime = 0;
      this.lockTime = 0;
      this.lockResets = 0;
      this.lastRotate = false;
      this.combo = -1;
      this.backToBack = false;
      this.lines = 0;
      this.score = 0;
      this.level = 1;
      this.energy = 0;
      this.shield = 0;
      this.alive = true;
      this.paused = false;
      this.flashRows = [];
      this.fillQueue();
      this.spawn();
      this.render();
    }

    fillQueue() {
      while (this.queue.length < 10) this.queue.push(...createBag());
    }

    nextType() {
      this.fillQueue();
      return this.queue.shift();
    }

    makePiece(type) {
      const shape = cloneMatrix(SHAPES[type]);
      return {
        type,
        shape,
        x: Math.floor((COLS - shape[0].length) / 2),
        y: 0
      };
    }

    spawn() {
      this.piece = this.makePiece(this.nextType());
      this.fallTime = 0;
      this.lockTime = 0;
      this.lockResets = 0;
      this.lastRotate = false;
      this.drawNext();
      if (this.collides(this.piece, 0, 0, this.piece.shape)) {
        this.alive = false;
        if (this.callbacks.onTopOut) this.callbacks.onTopOut(this.player);
      }
    }

    collides(piece, dx = 0, dy = 0, shape = piece.shape) {
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (!shape[y][x]) continue;
          const bx = piece.x + x + dx;
          const by = piece.y + y + dy;
          if (bx < 0 || bx >= COLS || by >= ROWS) return true;
          if (by >= 0 && this.grid[by][bx]) return true;
        }
      }
      return false;
    }

    move(dx) {
      if (!this.alive || this.paused || !this.piece) return false;
      if (this.collides(this.piece, dx, 0)) return false;
      this.piece.x += dx;
      this.lastRotate = false;
      this.refreshLock();
      this.render();
      return true;
    }

    refreshLock() {
      if (!this.collides(this.piece, 0, 1) && this.lockResets < 8) {
        this.lockTime = 0;
        this.lockResets++;
      }
    }

    rotate(direction = 1) {
      if (!this.alive || this.paused || !this.piece) return false;
      if (this.piece.type === "O") return true;

      let shape = cloneMatrix(this.piece.shape);
      const turns = direction > 0 ? 1 : 3;
      for (let i = 0; i < turns; i++) shape = rotateMatrix(shape);

      // 简单墙踢：旋转受边界阻挡时尝试向左右和上方微调。
      const kicks = [
        [0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0],
        [0, -1], [-1, -1], [1, -1], [0, -2]
      ];

      for (const [kx, ky] of kicks) {
        if (!this.collides(this.piece, kx, ky, shape)) {
          this.piece.x += kx;
          this.piece.y += ky;
          this.piece.shape = shape;
          this.lastRotate = true;
          this.refreshLock();
          this.render();
          return true;
        }
      }
      return false;
    }

    softDrop() {
      if (!this.alive || this.paused || !this.piece) return false;
      if (this.collides(this.piece, 0, 1)) {
        this.lockTime += 35;
        return false;
      }
      this.piece.y++;
      this.score += 1;
      this.fallTime = 0;
      this.lastRotate = false;
      this.render();
      return true;
    }

    hardDrop() {
      if (!this.alive || this.paused || !this.piece) return;
      let distance = 0;
      while (!this.collides(this.piece, 0, 1)) {
        this.piece.y++;
        distance++;
      }
      this.score += distance * 2;
      if (window.GameEffects) window.GameEffects.play("drop");
      this.lockPiece();
      this.render();
    }

    tick(dt) {
      if (!this.alive || this.paused || !this.piece) return;
      this.fallTime += dt;

      const interval = Math.max(75, 800 * Math.pow(.84, this.level - 1));
      while (this.fallTime >= interval) {
        this.fallTime -= interval;
        if (!this.collides(this.piece, 0, 1)) {
          this.piece.y++;
          this.lockTime = 0;
          this.lastRotate = false;
        } else {
          this.lockTime += interval;
          break;
        }
      }

      if (this.collides(this.piece, 0, 1)) {
        this.lockTime += dt;
        if (this.lockTime >= 450) this.lockPiece();
      } else {
        this.lockTime = 0;
      }
      this.render();
    }

    lockPiece() {
      if (!this.piece || !this.alive) return;
      const p = this.piece;
      for (let y = 0; y < p.shape.length; y++) {
        for (let x = 0; x < p.shape[y].length; x++) {
          if (!p.shape[y][x]) continue;
          const by = p.y + y;
          const bx = p.x + x;
          if (by < 0) {
            this.alive = false;
            if (this.callbacks.onTopOut) this.callbacks.onTopOut(this.player);
            return;
          }
          this.grid[by][bx] = p.type;
        }
      }

      if (window.GameEffects) window.GameEffects.play("lock");
      const clearedRows = [];
      for (let y = ROWS - 1; y >= 0; y--) {
        if (this.grid[y].every(cell => cell !== null)) {
          clearedRows.push(y);
        }
      }

      let attack = 0;
      if (clearedRows.length > 0) {
        this.flashRows = clearedRows.slice();
        const oldGrid = this.grid;
        const clearedSet = new Set(clearedRows);
        this.grid = oldGrid.filter((_, y) => !clearedSet.has(y));
        while (this.grid.length < ROWS) this.grid.unshift(Array(COLS).fill(null));

        const count = clearedRows.length;
        const points = [0, 100, 300, 500, 800];
        this.score += (points[Math.min(count, 4)] || count * 250) * this.level;
        this.lines += count;
        this.level = Math.floor(this.lines / 10) + 1;
        this.energy = Math.min(3, this.energy + Math.max(1, count));

        this.combo++;
        const comboBonus = this.combo > 0 ? Math.min(4, this.combo) : 0;
        this.score += comboBonus * 50 * this.level;

        attack = [0, 0, 1, 2, 4][Math.min(count, 4)] || 0;
        if (count === 4 && this.backToBack) attack++;
        if (count === 4) this.backToBack = true;
        else this.backToBack = false;
        attack += comboBonus >= 2 ? 1 : 0;

        if (window.GameEffects) {
          window.GameEffects.play("clear" + Math.min(count, 4));
          window.GameEffects.clearFlash(
            this.fxCanvas,
            clearedRows,
            count >= 4 ? "#ffffff" : "#7ef8ff"
          );
          const rect = this.canvas.getBoundingClientRect();
          window.GameEffects.createParticles(
            this.fxCanvas,
            rect.width / 2,
            rect.height * .5,
            count >= 4 ? "#ffffff" : "#39efff",
            12 + count * 8
          );
          if (count >= 2) window.GameEffects.shake(this.canvas, 3 + count, 200);
          if (count === 4) window.GameEffects.toast("⚡ TETRIS！四行清除！");
          else if (this.combo > 0) window.GameEffects.toast("COMBO × " + (this.combo + 1));
        }

        if (this.callbacks.onLines) {
          this.callbacks.onLines(this.player, count, attack, clearedRows);
        }
      } else {
        this.combo = -1;
      }

      this.piece = null;
      this.spawn();
      this.render();
    }

    addGarbage(count = 1) {
      if (!this.alive || count <= 0) return;
      if (this.shield > 0) {
        this.shield--;
        if (window.GameEffects) {
          window.GameEffects.play("shield");
          window.GameEffects.toast("🛡 护盾抵挡了攻击！");
        }
        return;
      }

      count = Math.min(ROWS, Math.floor(count));
      for (let n = 0; n < count; n++) {
        if (this.grid[0].some(cell => cell !== null)) {
          this.alive = false;
          if (this.callbacks.onTopOut) this.callbacks.onTopOut(this.player);
          return;
        }
        this.grid.shift();
        const hole = Math.floor(Math.random() * COLS);
        const row = Array.from({ length: COLS }, (_, x) =>
          x === hole ? null : "G"
        );
        this.grid.push(row);
      }
      if (window.GameEffects) {
        window.GameEffects.play("attack");
        window.GameEffects.shake(this.canvas, 4, 220);
      }
      this.render();
    }

    getGhostY() {
      if (!this.piece) return 0;
      let y = this.piece.y;
      while (!this.collides({ ...this.piece, y }, 0, 1)) y++;
      return y;
    }

    drawCell(ctx, x, y, type, alpha = 1, scale = 1) {
      const px = x * CELL, py = y * CELL;
      const color = type === "G" ? "#a3aec7" : COLORS[type] || "#a3aec7";
      const img = window.GameEffects ? window.GameEffects.getImage() : null;

      ctx.save();
      ctx.globalAlpha = alpha;

      if (type !== "G" && img && img.complete && img.naturalWidth > 0) {
        // 图片保持原色，不使用 hue-rotate 或整体染色。
        ctx.drawImage(img, px + 1, py + 1, CELL - 2, CELL - 2);
      } else {
        const grad = ctx.createLinearGradient(px, py, px + CELL, py + CELL);
        grad.addColorStop(0, type === "G" ? "#5c6883" : "#24314b");
        grad.addColorStop(1, "#0c1427");
        ctx.fillStyle = grad;
        ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = type === "G" ? 2 : 1.8;
      ctx.shadowColor = color;
      ctx.shadowBlur = type === "G" ? 3 : 5;
      ctx.strokeRect(px + 1.5, py + 1.5, CELL - 3, CELL - 3);
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    render() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = "#070b15";
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      ctx.strokeStyle = "#283753";
      ctx.lineWidth = .6;
      for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CELL, 0);
        ctx.lineTo(x * CELL, ROWS * CELL);
        ctx.stroke();
      }
      for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL);
        ctx.lineTo(COLS * CELL, y * CELL);
        ctx.stroke();
      }

      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (this.grid[y][x]) this.drawCell(ctx, x, y, this.grid[y][x]);
        }
      }

      if (this.piece && this.alive) {
        const ghostY = this.getGhostY();
        for (let y = 0; y < this.piece.shape.length; y++) {
          for (let x = 0; x < this.piece.shape[y].length; x++) {
            if (this.piece.shape[y][x]) {
              this.drawCell(ctx, this.piece.x + x, ghostY + y, this.piece.type, .24);
            }
          }
        }
        for (let y = 0; y < this.piece.shape.length; y++) {
          for (let x = 0; x < this.piece.shape[y].length; x++) {
            if (this.piece.shape[y][x]) {
              this.drawCell(ctx, this.piece.x + x, this.piece.y + y, this.piece.type);
            }
          }
        }
      }

      if (!this.alive) {
        ctx.fillStyle = "#080b18aa";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }

    drawNext() {
      const ctx = this.nextCtx;
      ctx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
      ctx.fillStyle = "#080e20";
      ctx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
      const type = this.queue[0];
      if (!type) return;
      const shape = SHAPES[type];
      const cell = 15;
      const width = shape[0].length * cell;
      const height = shape.length * cell;
      const ox = (this.nextCanvas.width - width) / 2;
      const oy = (this.nextCanvas.height - height) / 2;
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (!shape[y][x]) continue;
          const px = ox + x * cell, py = oy + y * cell;
          ctx.fillStyle = "#182744";
          ctx.fillRect(px, py, cell - 1, cell - 1);
          ctx.strokeStyle = COLORS[type];
          ctx.lineWidth = 1.5;
          ctx.strokeRect(px + .75, py + .75, cell - 2, cell - 2);
        }
      }
    }
  }

  return { TetrisBoard, COLS, ROWS, CELL, COLORS };
})();
