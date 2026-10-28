"use strict";

(() => {
  const $ = id => document.getElementById(id);
  const COLORS = ["#39efff", "#ff54bf", "#ffe36d", "#a780ff"];
  const NAMES = ["玩家 1", "玩家 2", "玩家 3", "玩家 4"];

  // 每位玩家独立按键，避免多人争用同一组控制键。
  const KEYMAP = {
    0: {
      left: ["KeyA"], right: ["KeyD"], down: ["KeyS"],
      rotate: ["KeyW"], drop: ["Space"], shield: ["KeyQ"], attack: ["KeyE"]
    },
    1: {
      left: ["ArrowLeft"], right: ["ArrowRight"], down: ["ArrowDown"],
      rotate: ["ArrowUp"], drop: ["Enter"], shield: ["Slash"], attack: ["Period"]
    },
    2: {
      left: ["KeyF"], right: ["KeyH"], down: ["KeyG"],
      rotate: ["KeyT"], drop: ["KeyY"], shield: ["KeyR"], attack: ["KeyU"]
    },
    3: {
      left: ["Numpad4"], right: ["Numpad6"], down: ["Numpad5"],
      rotate: ["Numpad8"], drop: ["Numpad0"], shield: ["Numpad7"], attack: ["Numpad9"]
    }
  };

  let selectedCount = 2;
  let players = [];
  let running = false;
  let paused = false;
  let finished = false;
  let lastTime = 0;
  let frame = 0;
  let roundNumber = 0;
  let toastCooldown = 0;

  function setStatus(text) {
    $("status").textContent = text;
  }

  function makePlayerCard(i) {
    const color = COLORS[i];
    const controls = [
      ["left", "◀", "左移"],
      ["rotate", "⟳", "旋转"],
      ["right", "▶", "右移"],
      ["down", "▼", "下落"],
      ["drop", "⚡", "落底"]
    ];

    const el = document.createElement("section");
    el.className = "player";
    el.id = "player-" + i;
    el.style.setProperty("--accent", color);

    el.innerHTML = `
      <div class="player-head">
        <span class="player-name">${NAMES[i]}</span>
        <span class="player-tag">PLAYER 0${i + 1}</span>
      </div>
      <div class="stats">
        <div class="stat"><small>得分</small><b data-stat="score">0</b></div>
        <div class="stat"><small>消行</small><b data-stat="lines">0</b></div>
        <div class="stat"><small>等级</small><b data-stat="level">1</b></div>
      </div>
      <div class="board-wrap">
        <canvas class="board" width="300" height="600" aria-label="${NAMES[i]}的游戏棋盘"></canvas>
        <canvas class="fx" width="300" height="600" aria-hidden="true"></canvas>
      </div>
      <div class="next-row">
        <div class="next-label">NEXT
          <canvas class="next" width="100" height="65"></canvas>
        </div>
        <div class="item-buttons">
          <button type="button" data-item="shield">🛡 护盾</button>
          <button type="button" data-item="attack">☄ 干扰</button>
        </div>
      </div>
      <div class="energy">能量：<span data-stat="energy">0</span> / 3</div>
      <div class="controls">
        ${controls.map(([action, icon, label]) =>
          `<button type="button" class="ctrl" data-action="${action}">${icon}<small>${label}</small></button>`
        ).join("")}
      </div>
      <div class="key-hint">${getKeyHint(i)}</div>
    `;

    $("arena").appendChild(el);
    return el;
  }

  function getKeyHint(i) {
    const hints = [
      "A / D 移动 · W 旋转 · S 下落 · 空格落底<br>Q 护盾 · E 干扰",
      "← / → 移动 · ↑ 旋转 · ↓ 下落 · Enter 落底<br>/ 护盾 · . 干扰",
      "F / H 移动 · T 旋转 · G 下落 · Y 落底<br>R 护盾 · U 干扰",
      "小键盘 4 / 6 移动 · 8 旋转 · 5 下落 · 0 落底<br>7 护盾 · 9 干扰"
    ];
    return hints[i];
  }

  function buildGame() {
    stopLoop();
    players = [];
    finished = false;
    paused = false;
    running = false;
    $("arena").innerHTML = "";
    $("arena").className = "arena count-" + selectedCount;
    $("overlay").classList.add("hidden");
    $("lobby").classList.add("hidden");
    $("gameArea").classList.remove("hidden");
    $("pauseButton").textContent = "Ⅱ 暂停";
    $("roundInfo").textContent = `第 ${roundNumber} 局 · ${selectedCount} 人参战`;
    setStatus("准备就绪");

    for (let i = 0; i < selectedCount; i++) {
      const el = makePlayerCard(i);
      const player = {
        id: i,
        el,
        name: NAMES[i],
        color: COLORS[i],
        board: null,
        eliminated: false,
        scoreEls: {
          score: el.querySelector('[data-stat="score"]'),
          lines: el.querySelector('[data-stat="lines"]'),
          level: el.querySelector('[data-stat="level"]'),
          energy: el.querySelector('[data-stat="energy"]')
        }
      };
      players.push(player);

      player.board = new TetrisCore.TetrisBoard(
        i,
        el.querySelector(".board"),
        el.querySelector(".fx"),
        el.querySelector(".next"),
        {
          onTopOut: () => eliminatePlayer(player),
          onLines: (id, count, attack) => onPlayerLines(player, count, attack)
        }
      );

      bindCardControls(player);
      updatePlayerUI(player);
    }

    $("startButton").textContent = "⚡ 开始游戏";
  }

  function bindCardControls(player) {
    const el = player.el;
    el.querySelectorAll("[data-action]").forEach(button => {
      const action = button.dataset.action;
      button.addEventListener("click", () => perform(player, action));
    });

    el.querySelector('[data-item="shield"]').addEventListener("click", () => useShield(player));
    el.querySelector('[data-item="attack"]').addEventListener("click", () => useAttack(player));
  }

  function updatePlayerUI(player) {
    const b = player.board;
    player.scoreEls.score.textContent = b.score.toLocaleString();
    player.scoreEls.lines.textContent = b.lines;
    player.scoreEls.level.textContent = b.level;
    player.scoreEls.energy.textContent = b.energy;

    const shieldButton = player.el.querySelector('[data-item="shield"]');
    const attackButton = player.el.querySelector('[data-item="attack"]');

    shieldButton.disabled = !running || paused || player.eliminated || b.energy < 2 || b.shield > 0;
    attackButton.disabled = !running || paused || player.eliminated || b.energy < 2 || !getTargets(player).length;
    shieldButton.classList.toggle("ready", b.energy >= 2 && b.shield === 0);
    attackButton.classList.toggle("ready", b.energy >= 2 && getTargets(player).length > 0);

    player.el.classList.toggle("eliminated", player.eliminated);
  }

  function getTargets(player) {
    if (selectedCount < 2) return [];
    return players.filter(p => p !== player && !p.eliminated);
  }

  function perform(player, action) {
    if (!running || paused || finished || player.eliminated) return;
    const b = player.board;
    let moved = false;

    switch (action) {
      case "left": moved = b.move(-1); break;
      case "right": moved = b.move(1); break;
      case "down": moved = b.softDrop(); break;
      case "rotate": moved = b.rotate(1); break;
      case "drop": b.hardDrop(); moved = true; break;
      case "shield": useShield(player); return;
      case "attack": useAttack(player); return;
    }

    if (moved && window.GameEffects) {
      if (action === "rotate") window.GameEffects.play("rotate");
      else if (action === "left" || action === "right") window.GameEffects.play("move");
    }
    updatePlayerUI(player);
  }

  function useShield(player) {
    if (!running || paused || finished || player.eliminated) return;
    const b = player.board;
    if (b.energy < 2 || b.shield > 0) {
      window.GameEffects.toast(b.shield > 0 ? "护盾已经生效" : "能量不足，需要 2 点能量");
      return;
    }
    b.energy -= 2;
    b.shield++;
    window.GameEffects.play("shield");
    window.GameEffects.toast(player.name + " 启动护盾！");
    updatePlayerUI(player);
  }

  function useAttack(player) {
    if (!running || paused || finished || player.eliminated) return;
    const b = player.board;
    const targets = getTargets(player);
    if (b.energy < 2) {
      window.GameEffects.toast("能量不足，需要 2 点能量");
      return;
    }
    if (!targets.length) {
      window.GameEffects.toast("当前没有可攻击的对手");
      return;
    }

    b.energy -= 2;
    const target = targets[Math.floor(Math.random() * targets.length)];
    target.board.addGarbage(2);
    window.GameEffects.play("attack");
    window.GameEffects.toast(player.name + " 向 " + target.name + " 发起了干扰！");
    updatePlayerUI(player);
    updatePlayerUI(target);
    checkWinner();
  }

  function onPlayerLines(player, count, attack) {
    if (player.eliminated || finished) return;
    updatePlayerUI(player);

    if (selectedCount < 2) {
      if (count >= 2) window.GameEffects.toast("漂亮！一次消除 " + count + " 行");
      return;
    }

    if (attack > 0) {
      const targets = getTargets(player);
      if (targets.length) {
        // 垃圾行随机分配到存活对手，避免固定集火同一人。
        const target = targets[Math.floor(Math.random() * targets.length)];
        target.board.addGarbage(attack);
        window.GameEffects.toast(
          player.name + " 消除 " + count + " 行，攻击 " + target.name + "！"
        );
        updatePlayerUI(target);
      }
    }
    checkWinner();
  }

  function eliminatePlayer(player) {
    if (!player || player.eliminated || finished) return;
    player.eliminated = true;
    player.board.alive = false;
    player.el.classList.add("eliminated");
    window.GameEffects.play("eliminate");
    window.GameEffects.toast("💥 " + player.name + " 被淘汰！");
    updatePlayerUI(player);
    checkWinner();
  }

  function checkWinner() {
    if (finished || selectedCount < 2) return;
    const alive = players.filter(p => !p.eliminated && p.board.alive);

    if (alive.length <= 1) {
      finished = true;
      running = false;
      stopLoop();

      const winner = alive[0] || null;
      if (winner) {
        winner.el.classList.add("winner");
        window.GameEffects.play("win");
        $("resultIcon").textContent = "🏆";
        $("resultTitle").textContent = winner.name + " 获胜！";
        $("resultDescription").textContent =
          "恭喜成为最后存活的玩家！\n本局得分：" + winner.board.score.toLocaleString();
      } else {
        window.GameEffects.play("lose");
        $("resultIcon").textContent = "⚔️";
        $("resultTitle").textContent = "本局无人获胜";
        $("resultDescription").textContent = "所有玩家同时被淘汰，再来一局！";
      }

      const sorted = players.slice().sort((a, b) => {
        if (a === winner) return -1;
        if (b === winner) return 1;
        return b.board.score - a.board.score;
      });

      $("resultScores").innerHTML = sorted.map((p, index) => `
        <div class="result-score" style="--score-color:${p.color}">
          <span>${index === 0 && winner ? "🥇 " : ""}${p.name}${p.eliminated ? " · 已淘汰" : ""}</span>
          <strong>${p.board.score.toLocaleString()} 分</strong>
        </div>
      `).join("");

      $("overlay").classList.remove("hidden");
      setStatus(winner ? winner.name + " 获胜！" : "本局结束");
      $("pauseButton").textContent = "Ⅱ 暂停";
    } else {
      const aliveText = alive.map(p => p.name).join(" · ");
      $("roundInfo").textContent = `剩余 ${alive.length} 人：${aliveText}`;
    }
  }

  function stopLoop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }

  function loop(now) {
    if (!running || paused || finished) {
      frame = 0;
      return;
    }

    const dt = Math.min(50, now - (lastTime || now));
    lastTime = now;

    for (const player of players) {
      if (player.eliminated) continue;
      player.board.tick(dt);
      updatePlayerUI(player);
    }

    checkWinner();
    if (running && !paused && !finished) frame = requestAnimationFrame(loop);
    else frame = 0;
  }

  function startLoop() {
    stopLoop();
    running = true;
    paused = false;
    lastTime = 0;
    $("pauseButton").textContent = "Ⅱ 暂停";
    setStatus(selectedCount === 1 ? "练习进行中" : "比赛进行中");
    players.forEach(updatePlayerUI);
    window.GameEffects.play("start");
    frame = requestAnimationFrame(loop);
  }

  function startNewRound() {
    roundNumber++;
    buildGame();
    startLoop();
  }

  function togglePause() {
    if (!players.length || finished) return;
    if (!running && !paused) return;

    if (paused) {
      paused = false;
      startLoop();
    } else {
      paused = true;
      running = false;
      stopLoop();
      $("pauseButton").textContent = "▶ 继续";
      setStatus("比赛已暂停");
      players.forEach(updatePlayerUI);
    }
  }

  function returnToMenu() {
    stopLoop();
    running = false;
    paused = false;
    finished = false;
    players = [];
    $("gameArea").classList.add("hidden");
    $("overlay").classList.add("hidden");
    $("lobby").classList.remove("hidden");
    $("startButton").textContent = "⚡ 开始游戏";
    setStatus("选择人数，准备开战");
  }

  function handleKeyDown(event) {
    if (event.repeat) return;

    if (event.code === "Escape") {
      if (!$("overlay").classList.contains("hidden")) return;
      togglePause();
      return;
    }

    // 暂停或结算期间不响应游戏操作。
    if (!running || paused || finished) return;

    for (let i = 0; i < selectedCount; i++) {
      const map = KEYMAP[i];
      const player = players[i];
      if (!map || !player || player.eliminated) continue;

      for (const [action, codes] of Object.entries(map)) {
        if (codes.includes(event.code)) {
          event.preventDefault();
          perform(player, action);
          return;
        }
      }
    }
  }

  document.addEventListener("keydown", handleKeyDown);

  document.querySelectorAll(".mode-button").forEach(button => {
    button.addEventListener("click", () => {
      selectedCount = Number(button.dataset.count);
      document.querySelectorAll(".mode-button").forEach(b =>
        b.classList.toggle("selected", b === button)
      );
    });
  });

  $("startButton").addEventListener("click", () => {
    if ($("gameArea").classList.contains("hidden")) {
      roundNumber = 0;
      startNewRound();
    } else if (finished) {
      startNewRound();
    } else if (paused) {
      togglePause();
    } else if (!running) {
      startLoop();
    }
  });

  $("pauseButton").addEventListener("click", togglePause);
  $("restartButton").addEventListener("click", startNewRound);
  $("menuButton").addEventListener("click", returnToMenu);
  $("againButton").addEventListener("click", startNewRound);
  $("resultMenuButton").addEventListener("click", returnToMenu);

  $("soundButton").addEventListener("click", () => {
    const enabled = !window.GameEffects.soundEnabled();
    window.GameEffects.setSound(enabled);
    $("soundButton").textContent = enabled ? "🔊 音效：开" : "🔇 音效：关";
    if (enabled) window.GameEffects.play("start");
  });

  window.addEventListener("zyj-image-ready", () => {
    players.forEach(p => p.board && p.board.render());
  });

  // 浏览器需要用户交互后才能正常播放音效。
  document.addEventListener("pointerdown", () => {
    if (window.GameEffects.soundEnabled()) window.GameEffects.getImage();
  }, { once: true });

  window.GameEffects.loadImage();
})();
