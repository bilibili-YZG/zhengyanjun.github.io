/* ============================================================
   清学拳皇 88 · 共享游戏逻辑
   11N.html（无音乐）/ 11NN.html（有音乐）共用此文件，
   差异仅由 window.PVP_CONFIG.audio 控制。
   ============================================================ */
(function () {
    'use strict';

    var CFG = window.PVP_CONFIG || { audio: false };

    /* ---------------- 数值配置 ---------------- */
    var MAX_HP = 500;
    var MAX_ENERGY = 100;
    var WALK_SPEED = 22;      // 横向 %/秒
    var RUN_SPEED = 52;       // 横向 %/秒
    var VERT_SPEED = 150;     // 纵向 像素/秒
    var ATTACK_CD = 400;      // ms
    var SKILL_CD = 900;       // ms
    var ATTACK_DMG = 12;
    var ATTACK_RANGE = 0.6;   // 攻击延伸 = 角色宽 × 该值
    var CROUCH_SCALE = 0.7;    // 蹲下缩放比例（显示与判定共用）
    var CROUCH_REDUCTION = 0.7;   // 蹲下减伤 70%
    var ENERGY_PER_HIT = 8;
    var ENERGY_PER_BEHIT = 3;
    var ENERGY_PER_SKILL_HIT = 12;
    var HP_REGEN = 13;        // 每 30 秒回 13 点（整数，不产生小数抖动）
    var HP_REGEN_MS = 30000;
    var COMBO_WINDOW = 1400;  // ms
    var PUSH_GAP = 0.06;      // 两名角色最小间距（百分比），防止穿模重叠

    /* ---------------- 手感参数（拳皇式） ---------------- */
    var HITSTOP = 70;         // 命中定格毫秒（双方同时静止，打击感的关键）
    var HITSTOP_SKILL = 110;  // 技能命中定格更重
    var KNOCKBACK = 5.5;      // 普通攻击击退（%/秒的冲量）
    var KNOCKBACK_SKILL = 9;
    var HIT_STUN = 300;       // 受击硬直毫秒（站着不动，不能边挨打边打）
    var HIT_STUN_SKILL = 420;
    var SCREEN_SHAKE = 6;     // 命中屏幕震动幅度（px）
    var SCREEN_SHAKE_SKILL = 12;
    var COMBO_DAMAGE_STEP = 0.12;  // 连击每段伤害递减
    var COMBO_MIN_DAMAGE = 0.4;    // 递减下限（保底 40%）
    var CANCEL_WINDOW = 220;  // 普攻收招前可取消接技能（连段）
    /* 破防机制（guard crush）：一直蹲着龟缩会被打破并硬直，
       杜绝"无限蹲防无解"。满 100 点破防。 */
    var GUARD_MAX = 100;
    var GUARD_GAIN = 1.7;     // 每点伤害累积的防御值
    var GUARD_DECAY = 22;     // 每秒回复的防御值
    var GUARD_BREAK_STUN = 900; // 破防后的硬直时长
    var JUMP_HEIGHT = 130;     // 跳跃高度（px）
    var JUMP_DURATION = 620;   // 跳跃总时长（ms）
    var AIR_MOVE_MUL = 0.72;   // 空中横向移动速度系数
    var LAND_LAG = 70;         // 落地僵直（ms），街机手感的关键
    var DASH_SPEED = 78;       // 冲刺速度（%/秒）
    var DASH_TIME = 200;       // 冲刺时长（ms）
    var DASH_COOLDOWN = 700;   // 冲刺冷却

    /* ---------------- 角色表 ---------------- */
    /* ============================================================
       角色表
       平衡说明：
       刘刚多一个「技4」（70能量/80伤害/最远范围），如果直接 1v1，
       选刘刚的一方天然多一个大招 → 稳赢。
       所以给每个角色一套属性乘数（atk/energy/hp/skill），
       把"技能数量差"折算进伤害和能量收支，让双人局真正对称。
       ============================================================ */
    var CHARS = {
        zhengyanjun: {
            name: '郑艳军',
            /* 属性乘数：郑艳军只有 3 个技能，但身法更快、能量循环更好 */
            mult: { atk: 1.18, energy: 1.25, hp: 1.0, speed: 1.1 },
            images: {
                idle: 'zhengyanjun01.png', run: 'zhengyanjun00.png',
                attack: 'zhengyanjun02.png', hit: 'zhengyanjun03.png',
                crouch: 'zhengyanjun04.png', skill1: 'zhengyanjun05.png',
                skill2: 'zhengyanjun06.png', skill3: 'zhengyanjun07.png',
                defeat1: 'zhengyanjun21.png', defeat2: 'zhengyanjun22.png',
                victory: 'zhengyanjun23.png'
            },
            skills: [
                { key: 'skill1', name: '技1', cost: 20, damage: 30, range: 1.2, anim: 600, hit: 250 },
                { key: 'skill2', name: '技2', cost: 35, damage: 45, range: 1.5, anim: 700, hit: 300 },
                { key: 'skill3', name: '技3', cost: 50, damage: 60, range: 1.8, anim: 800, hit: 350 }
            ],
            sound: {
                attack: 'zhengyanjun_attack.mp3', skill1: 'zhengyanjun01.mp3',
                skill2: 'zhengyanjun02.mp3', skill3: 'zhengyanjun03.mp3'
            }
        },
        liugang: {
            name: '刘刚',
            /* 刘刚技能更多更重，但身法慢、能量获取少，靠单发伤害压制 */
            mult: { atk: 0.95, energy: 0.85, hp: 1.0, speed: 0.94 },
            images: {
                idle: 'liugang01.png', run: 'liugang00.png',
                attack: 'liugang02.png', hit: 'liugang03.png',
                crouch: 'liugang04.png', skill1: 'liugang05.png',
                skill2: 'liugang06.png', skill3: 'liugang05.png',
                skill4: 'liugang06.png',
                defeat1: 'liugang21.png', defeat2: 'liugang22.png',
                victory: 'liugang23.png'
            },
            skills: [
                { key: 'skill1', name: '技1', cost: 20, damage: 30, range: 1.2, anim: 600, hit: 250 },
                { key: 'skill2', name: '技2', cost: 35, damage: 45, range: 1.5, anim: 700, hit: 300 },
                { key: 'skill3', name: '技3', cost: 50, damage: 60, range: 1.8, anim: 800, hit: 350 },
                { key: 'skill4', name: '技4', cost: 70, damage: 80, range: 2.2, anim: 900, hit: 400 }
            ],
            sound: {
                attack: 'liugang_attack.mp3', skill1: 'liugang01.mp3',
                skill2: 'liugang02.mp3', skill3: 'liugang03.mp3', skill4: 'liugang04.mp3'
            }
        }
    };
    var CHAR_KEYS = Object.keys(CHARS);
    /* 角色能量收支：同样的攻击命中，郑艳军回得更多（mult.energy） */
    function energyGain(p, base) {
        return base * (charOf(p).mult.energy || 1);
    }
    function damageMul(p) {
        return (charOf(p).mult.atk || 1);
    }
    function speedMul(p) {
        return (charOf(p).mult.speed || 1);
    }


    /* ---------------- 按键映射 ---------------- */
    /* P1：WASD / Shift 跑 / 空格 跳 / F 蹲 / C 攻击 / E Q Z X 技能
       P2：方向键 / 右Shift 跑 / ; 跳 / , 蹲 / / 攻击 / . M L K 技能

       技能键按位数给满（各 4 个），角色实际有几个技能就占用前几个。
       刘刚有 4 个技能，P1 用 E/Q/Z/X，P2 用 . M L K —— 无论谁当 1P 技4 都能按出来。
       2P 跳跃：分号 ";" 为主，PageUp / 右Ctrl 为备份（笔记本常无独立 PageUp）。 */
    var KEYMAP = [
        {
            'w': 'up', 'a': 'left', 's': 'down', 'd': 'right',
            'shift': 'run', ' ': 'jump', 'f': 'crouch', 'c': 'attack',
            'e': 'skill1', 'q': 'skill2', 'z': 'skill3', 'x': 'skill4'
        },
        {
            'arrowup': 'up', 'arrowleft': 'left', 'arrowdown': 'down', 'arrowright': 'right',
            'shiftright': 'run', ',': 'crouch', '/': 'attack',
            ';': 'jump', 'pageup': 'jump',
            '.': 'skill1', 'm': 'skill2', 'l': 'skill3', 'k': 'skill4'
        }
    ];
    var CONTINUOUS = { left: 1, right: 1, up: 1, down: 1, run: 1, crouch: 1 };

    /* ---------------- DOM ---------------- */
    var $ = function (id) { return document.getElementById(id); };
    var dom = {};
    var battleArea, overlay, panel, countdownEl;

    /* ---------------- 全局状态 ---------------- */
    var state = {
        screen: 'mode',        // mode / select / battle / result
        mode: 'solo',          // solo / duo
        players: [],
        running: false,
        paused: false,
        gameOver: false,
        winner: null,
        gameTime: 0,
        started: false,
        touchMode: false,
        lastTs: 0,
        lastUi: 0,
        charW: 0, charH: 0, areaW: 0, areaH: 0,
        regenAt: 0,
        pauseToken: 0
    };

    /* ---------------- 音频（仅 11NN 启用） ---------------- */
    var audioCache = {};
    var bgm = null;

    function playSound(file, vol) {
        if (!CFG.audio || !file) return;
        try {
            var a = audioCache[file];
            if (!a) { a = new Audio(file); audioCache[file] = a; }
            a.currentTime = 0;
            a.volume = vol == null ? 0.55 : vol;
            var p = a.play();
            if (p && p.catch) p.catch(function () { });
        } catch (e) { /* 音频文件缺失时静默忽略 */ }
    }

    function startBgm() {
        if (!CFG.audio || bgm) return;
        try {
            bgm = new Audio('bgg.mp3');
            bgm.loop = true;
            bgm.volume = 0.2;
            var p = bgm.play();
            if (p && p.catch) p.catch(function () { });
        } catch (e) { }
    }
    function duckBgm(low) {
        if (bgm) bgm.volume = low ? 0.05 : 0.2;
    }

    /* ============================================================
       玩家对象
       ============================================================ */
    function makePlayer(idx, charKey, isAI) {
        return {
            idx: idx,
            charKey: charKey,
            isAI: isAI,
            hp: MAX_HP,
            energy: 0,
            x: idx === 0 ? 12 : 88,     // 横向位置（%）
            y: 0,                       // 离底距离（px）
            isCrouching: false,
            isRunning: false,
            isMoving: false,
            isJumping: false,
            jumpStart: 0,
            jumpFromY: 0,
            isDashing: false,
            dashUntil: 0,
            dashDir: 0,
            lastDashTime: 0,
            landUntil: 0,
            isInAction: false,
            currentState: 'idle',
            facing: idx === 0 ? 1 : -1, // 1=朝右 -1=朝左
            lockedFacing: null,         // 出招瞬间锁定的朝向，避免转身打空
            lastAttackTime: 0,
            lastSkillTime: 0,
            skillReadyAt: {},            // 各技能冷却结束时间
            combo: 0,
            comboUntil: 0,
            held: {},                   // 当前按住的动作
            stunUntil: 0,              // 硬直结束时间（受击中无法行动）
            guard: 0,                  // 防御值（满则破防）
            guardBroken: false,
            kbVel: 0,                  // 击退速度
            cancelableAt: 0,           // 普攻可取消接技能的时间点
            ai: { state: 'idle', timer: 0, defend: 0, reactTimer: 0, skillPick: 0 }
        };
    }

    function charOf(p) { return CHARS[p.charKey]; }

    /* ============================================================
       尺寸 / 碰撞盒
       ============================================================ */
    /* ============================================================
       尺寸系统
       角色尺寸由 JS 统一计算：显示盒（DOM 宽高）和判定盒（hitbox）
       引用同一份数值，杜绝"看着没重叠却判定没中"或反之。
       ============================================================ */
    function updateDimensions() {
        state.areaW = battleArea.offsetWidth;
        state.areaH = battleArea.offsetHeight;
        if (!state.areaW || !state.areaH) return;

        // 角色高度：不超过战斗区高度的 78%，宽度按立绘 1:2 比例推算
        var byHeight = state.areaH * 0.78;
        var byWidth = state.areaW * 0.16;      // 单人时角色不要太宽，占屏 ≤16%
        var charH = Math.min(byHeight, byWidth * 2);
        var charW = charH / 2;

        state.charH = charH;
        state.charW = charW;

        // CSS 变量同步：倒地动画的位移依赖 --char-w，必须和判定盒一致
        state.players.forEach(function (p) {
            var el = dom['p' + (p.idx + 1)];
            el.style.setProperty('--char-h', charH + 'px');
            el.style.setProperty('--char-w', charW + 'px');
            el.style.height = charH + 'px';
            el.style.width = charW + 'px';
        });
    }

    function charHeightOf(p) {
        return p.isCrouching ? state.charH * CROUCH_SCALE : state.charH;
    }

    /* 返回像素级包围盒（底部对齐、水平居中） */
    function hitbox(p) {
        var w = state.charW;
        var h = charHeightOf(p);
        var cx = (p.x / 100) * state.areaW;
        var bottom = p.y;
        return {
            left: cx - w / 2, right: cx + w / 2,
            top: bottom + h, bottom: bottom,
            width: w, height: h, centerX: cx, centerY: bottom + h / 2
        };
    }

    /* 攻击判定：以出招时锁定的朝向为准 */
    function checkAttackHit(attacker, defender, range) {
        var A = hitbox(attacker), D = hitbox(defender);
        var facingRight = (attacker.lockedFacing == null ? attacker.facing : attacker.lockedFacing) === 1;
        var reach = A.width * (range == null ? ATTACK_RANGE : range);
        var box = {
            left: facingRight ? A.right - A.width * 0.2 : A.left - reach,
            right: facingRight ? A.right + reach : A.left + A.width * 0.2,
            top: A.top - A.height * 0.1,
            bottom: A.bottom + A.height * 0.25
        };
        var hitX = box.left < D.right && box.right > D.left;
        var hitY = box.bottom < D.top && box.top > D.bottom;
        return hitX && hitY;
    }

    /* ============================================================
       显示
       ============================================================ */
    function updateCharacterDisplay(p) {
        var el = dom['p' + (p.idx + 1)];
        var cfg = charOf(p);

        if (!state.gameOver) {
            var imgKey = p.currentState;
            if (p.isCrouching && p.currentState === 'idle') imgKey = 'crouch';
            else if (p.isMoving && p.isRunning && p.currentState === 'idle') imgKey = 'run';
            // 腾空时用跑姿，比站姿自然
            else if (p.isJumping && p.currentState === 'idle') imgKey = 'run';
            el.style.backgroundImage = 'url(' + (cfg.images[imgKey] || cfg.images.idle) + ')';
        }

        // 位置
        el.style.left = p.x + '%';
        el.style.bottom = p.y + 'px';
        el.style.right = 'auto';

        // 朝向 + 蹲下（统一用内联 transform，避免和 CSS 类冲突）
        if (!state.gameOver) {
            var t = 'scaleX(' + p.facing + ')';
            if (p.isCrouching) t += ' scale(' + CROUCH_SCALE + ')';
            el.style.transform = t;
        }
    }

    function updateUI() {
        state.players.forEach(function (p) {
            var i = p.idx + 1;
            dom['p' + i + 'hp'].style.width = (p.hp / MAX_HP * 100) + '%';
            dom['p' + i + 'energy'].style.width = (p.energy / MAX_ENERGY * 100) + '%';
            // 防御值条：快满时闪红，提示"快被破防了"
            var g = dom['p' + i + 'guard'];
            if (g) {
                var ratio = Math.min(1, p.guard / GUARD_MAX);
                g.style.width = (ratio * 100) + '%';
                g.classList.toggle('danger', ratio > 0.6);
                g.style.opacity = p.guardBroken ? '1' : (ratio > 0.02 ? '1' : '0');
            }
        });
        var m = Math.floor(state.gameTime / 60), s = Math.floor(state.gameTime % 60);
        dom.timer.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }

    /* 伤害飘字 / 连击提示 */
    function floatText(p, text, cls) {
        var el = document.createElement('div');
        el.className = cls || 'damage-text';
        el.textContent = text;
        el.style.left = 'calc(' + p.x + '% - 20px)';
        el.style.bottom = (p.y + state.charH * 0.6) + 'px';
        battleArea.appendChild(el);
        setTimeout(function () { el.remove(); }, 900);
    }

    /* ============================================================
       跳跃 / 冲刺
       ============================================================ */
    function tryJump(p) {
        if (state.gameOver || state.paused) return;
        var now = Date.now();
        if (p.isJumping) return;
        if (p.isInAction) return;                    // 出招中不能跳
        if (p.stunUntil && now < p.stunUntil) return; // 硬直中不能跳
        if (p.landUntil && now < p.landUntil) return; // 落地僵直中不能跳
        if (p.isCrouching) return;                    // 蹲着不能跳

        p.isJumping = true;
        p.jumpStart = now;
        p.jumpFromY = p.y;
        p.isMoving = false;
        p.currentState = 'idle';
    }

    function tryDash(p) {
        if (state.gameOver || state.paused) return;
        var now = Date.now();
        if (p.isDashing) return;
        if (p.isInAction) return;
        if (p.stunUntil && now < p.stunUntil) return;
        if (p.landUntil && now < p.landUntil) return;
        if (now - p.lastDashTime < DASH_COOLDOWN) return;
        // 冲刺需要一个方向：优先取按着的左右，否则朝对手方向
        var dir = 0;
        if (p.held.left) dir = -1;
        else if (p.held.right) dir = 1;
        else dir = p.facing;

        p.isDashing = true;
        p.dashUntil = now + DASH_TIME;
        p.dashDir = dir;
        p.lastDashTime = now;
        p.isCrouching = false;
    }

    /* ============================================================
       战斗动作
       ============================================================ */
    function performAttack(p) {
        if (state.gameOver || state.paused) return;
        var now = Date.now();
        if (now - p.lastAttackTime < ATTACK_CD) return;
        if (p.isInAction || p.isCrouching) return;
        if (p.stunUntil && now < p.stunUntil) return;   // 硬直中无法出手

        p.lastAttackTime = now;
        p.isInAction = true;
        p.isMoving = false;
        p.currentState = 'attack';
        p.lockedFacing = p.facing;     // 锁定出手朝向
        p.cancelableAt = now + CANCEL_WINDOW;  // 收招前可取消接技能（连段）
        p.recoverAt = 0;

        playSound(charOf(p).sound.attack);

        var opponent = otherPlayer(p);
        setTimeout(function () {
            if (state.gameOver) return;
            if (checkAttackHit(p, opponent)) {
                var dmg = Math.round(ATTACK_DMG * damageMul(p));
                if (opponent.isCrouching) dmg = Math.round(dmg * (1 - CROUCH_REDUCTION));
                dealDamage(opponent, dmg, p, false);
                p.recoverAt = now + 280;   // 打中就收招快
            } else {
                p.recoverAt = now + 400;   // 挥空走完整收招
            }
        }, 200);

        // 兜底
        setTimeout(function () {
            if (state.gameOver) return;
            if (p.recoverAt && Date.now() < p.recoverAt) return;
            p.isInAction = false;
            p.currentState = 'idle';
            p.lockedFacing = null;
        }, 400);
    }

    function useSkill(p, skillKey) {
        if (state.gameOver || state.paused) return;
        var cfg = charOf(p);
        var skill = null;
        for (var i = 0; i < cfg.skills.length; i++) {
            if (cfg.skills[i].key === skillKey) { skill = cfg.skills[i]; break; }
        }
        if (!skill) return;

        var now = Date.now();
        if (now - p.lastSkillTime < SKILL_CD) return;
        if (p.energy < skill.cost) return;
        if (p.isCrouching) return;
        if (p.stunUntil && now < p.stunUntil) return;
        // 允许「普攻取消接技能」：攻击收招前可以打断自己接技能（连段）
        var inAttack = p.isInAction && p.currentState === 'attack';
        if (p.isInAction && !(inAttack && now < p.cancelableAt)) return;

        p.lastSkillTime = now;
        p.isInAction = true;
        p.isMoving = false;
        p.currentState = skill.key;
        p.lockedFacing = p.facing;
        p.skillReadyAt[skill.key] = now + SKILL_CD;
        p.cancelableAt = Infinity;   // 技能不可被取消
        p.recoverAt = 0;

        playSound(cfg.sound[skill.key]);

        // 消耗能量（不再返还，修复"技能几乎免费"）
        p.energy = Math.max(0, p.energy - skill.cost);

        var opponent = otherPlayer(p);
        setTimeout(function () {
            if (state.gameOver) return;
            var hit = checkAttackHit(p, opponent, skill.range);
            if (hit) {
                var dmg = Math.round(skill.damage * damageMul(p));
                if (opponent.isCrouching) dmg = Math.round(dmg * (1 - CROUCH_REDUCTION));
                dealDamage(opponent, dmg, p, true);
                p.energy = Math.min(MAX_ENERGY, p.energy + energyGain(p, ENERGY_PER_SKILL_HIT));
            }
            /* 后摇缩短：命中后立刻恢复行动（打中就收招快），
               没打中才走完整个动画，避免"挥空还要罚站 1 秒"。 */
            var recover = hit ? skill.hit + 80 : skill.anim;
            p.recoverAt = now + recover;
        }, skill.hit);

        // 兜底：动画结束强制收招
        setTimeout(function () {
            if (state.gameOver) return;
            if (p.recoverAt && Date.now() < p.recoverAt) return;
            p.isInAction = false;
            p.currentState = 'idle';
            p.lockedFacing = null;
        }, skill.anim);
    }

    /* 命中定格：双方同时静止一小会儿，制造"打到了"的实感 */
    function applyHitstop(ms) {
        state.hitstopUntil = Math.max(state.hitstopUntil || 0, Date.now() + ms);
    }

    /* 屏幕震动 */
    function shake(amount) {
        state.shakeUntil = Date.now() + 180;
        state.shakeAmount = amount;
    }

    /* 落地扬尘 */
    function spawnDust(p) {
        var el = document.createElement('div');
        el.className = 'dust-puff';
        var box = hitbox(p);
        el.style.left = box.centerX + 'px';
        el.style.bottom = (box.bottom + 6) + 'px';
        battleArea.appendChild(el);
        setTimeout(function () { el.remove(); }, 340);
    }

    /* 命中火花：打击瞬间在受击点炸一下 */
    function spawnHitSpark(target, isSkill) {
        var el = document.createElement('div');
        el.className = 'hit-spark' + (isSkill ? ' big' : '');
        var box = hitbox(target);
        el.style.left = box.centerX + 'px';
        el.style.bottom = (box.bottom + box.height * 0.45) + 'px';
        battleArea.appendChild(el);
        setTimeout(function () { el.remove(); }, 320);
    }
    function dealDamage(target, damage, attacker, isSkill) {
        // 连击递减：连段越久单发伤害越低（鼓励换血节奏而非无限连）
        var now = Date.now();
        if (now < attacker.comboUntil) attacker.combo++;
        else attacker.combo = 1;
        attacker.comboUntil = now + COMBO_WINDOW;

        var falloff = Math.max(COMBO_MIN_DAMAGE, 1 - (attacker.combo - 1) * COMBO_DAMAGE_STEP);
        var finalDmg = Math.max(1, Math.round(damage * falloff));

        target.hp = Math.max(0, target.hp - finalDmg);
        targetDom(target).classList.add('hit-flash');
        setTimeout(function () { targetDom(target).classList.remove('hit-flash'); }, 150);
        floatText(target, '-' + finalDmg);

        if (attacker.combo >= 2) floatText(target, attacker.combo + ' HIT', 'combo-text');

        /* 命中定格 + 震屏 + 火花 */
        applyHitstop(isSkill ? HITSTOP_SKILL : HITSTOP);
        shake(isSkill ? SCREEN_SHAKE_SKILL : SCREEN_SHAKE);
        spawnHitSpark(target, isSkill);

        /* 受击硬直：站着不动，不能边挨打边打 */
        target.stunUntil = now + (isSkill ? HIT_STUN_SKILL : HIT_STUN);
        target.currentState = 'hit';
        target.isInAction = false;
        target.lockedFacing = null;
        target.isMoving = false;

        /* 破防（guard crush）：蹲着挨打会累积防御值，满了直接破防硬直，
           杜绝"一直蹲着无解"。站着挨打不累积（只是普通硬直）。 */
        if (target.isCrouching && !target.guardBroken) {
            target.guard += finalDmg * GUARD_GAIN;
            if (target.guard >= GUARD_MAX) {
                target.guard = 0;
                target.guardBroken = true;
                target.stunUntil = now + GUARD_BREAK_STUN;
                target.isCrouching = false;
                target.currentState = 'hit';
                floatText(target, '破防！', 'combo-text');
                shake(SCREEN_SHAKE_SKILL);
                applyHitstop(HITSTOP_SKILL);
            }
        }

        /* 击退 */
        var dir = target.x >= attacker.x ? 1 : -1;
        target.kbVel = dir * (isSkill ? KNOCKBACK_SKILL : KNOCKBACK);

        /* 能量收支（按角色乘数结算，保证双人对称） */
        target.energy = Math.min(MAX_ENERGY, target.energy + energyGain(target, ENERGY_PER_BEHIT));
        attacker.energy = Math.min(MAX_ENERGY, attacker.energy + energyGain(attacker, ENERGY_PER_HIT));

        updateUI();
        if (target.hp <= 0) triggerGameOver(attacker);
    }

    function targetDom(p) { return dom['p' + (p.idx + 1)]; }
    function otherPlayer(p) { return state.players[p.idx === 0 ? 1 : 0]; }

    /* ============================================================
       结束 / 重开
       ============================================================ */
    function triggerGameOver(winner) {
        if (state.gameOver) return;
        state.gameOver = true;
        state.winner = winner;
        state.running = false;

        var loser = otherPlayer(winner);
        winner.isInAction = true;
        winner.isMoving = false;
        loser.isInAction = true;
        loser.isMoving = false;

        duckBgm(true);

        var loserEl = targetDom(loser), winnerEl = targetDom(winner);
        var loserCfg = charOf(loser), winnerCfg = charOf(winner);

        loserEl.style.backgroundImage = 'url(' + loserCfg.images.defeat1 + ')';
        loserEl.classList.remove('crouching');

        playSound(winner.idx === 0 ? 'victory.mp3' : 'defeat.mp3', 0.7);

        setTimeout(function () {
            loserEl.style.backgroundImage = 'url(' + loserCfg.images.defeat2 + ')';
            loserEl.classList.add('defeated');
            winnerEl.style.backgroundImage = 'url(' + winnerCfg.images.victory + ')';
            winnerEl.classList.add('victory');
            setTimeout(showResult, 500);
        }, 1200);
    }

    function showResult() {
        state.screen = 'result';
        var w = state.winner;
        var other = otherPlayer(w);
        var isDuo = state.mode === 'duo';
        var title = isDuo ? (w.idx === 0 ? '1P 获胜！' : '2P 获胜！')
                          : (w.isAI ? '电脑获胜！' : '你赢了！');
        var sub = '用时 ' + fmtTime(state.gameTime) + ' · 剩余血量 ' + Math.round(w.hp) + ' / ' + MAX_HP;
        var loseSub = charOf(other).name + ' 剩余血量 ' + Math.round(other.hp) + ' / ' + MAX_HP;

        panel.innerHTML =
            '<div class="panel-title">回合结束</div>' +
            '<div class="result-name">' + title + '</div>' +
            '<div class="result-detail">' + charOf(w).name + ' 获胜 · ' + sub + '</div>' +
            '<div class="result-detail">' + loseSub + '</div>' +
            '<div class="btn-row">' +
            '<button class="ui-btn" id="again-btn">再来一局</button>' +
            '<button class="ui-btn ghost" id="reselect-btn">换人 / 换模式</button>' +
            '</div>';

        $('again-btn').addEventListener('click', function () {
            overlay.classList.remove('show');
            state.screen = 'battle';
            startBattle();
        });
        $('reselect-btn').addEventListener('click', function () {
            overlay.classList.remove('show');
            showModeScreen();
        });
        overlay.classList.add('show');
    }

    function fmtTime(t) {
        var m = Math.floor(t / 60), s = Math.floor(t % 60);
        return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }

    /* ============================================================
       模式选择 / 选人
       ============================================================ */
    function showModeScreen() {
        state.screen = 'mode';
        state.gameOver = false;
        state.running = false;
        dom.p1.classList.remove('defeated', 'victory');
        dom.p2.classList.remove('defeated', 'victory');

        panel.innerHTML =
            '<div class="panel-title">清学拳皇 88</div>' +
            '<div class="panel-sub">选择对战模式</div>' +
            '<div class="mode-row">' +
            '<button class="mode-btn" data-mode="solo">单人挑战</button>' +
            '<button class="mode-btn" data-mode="duo">双人对战</button>' +
            '</div>' +
            '<div class="panel-sub" style="margin:0">单人：1P 选角，电脑随机对手　·　双人：1P / 2P 各选各的</div>';

        panel.querySelectorAll('.mode-btn').forEach(function (b) {
            b.addEventListener('click', function () {
                state.mode = b.dataset.mode;
                showSelectScreen();
            });
        });
        overlay.classList.add('show');
    }

    function fighterCard(charKey, slot, otherSlot) {
        var c = CHARS[charKey];
        var card = document.createElement('div');
        card.className = 'fighter-card';
        card.dataset.char = charKey;
        card.dataset.slot = slot;
        card.innerHTML =
            '<div class="fighter-art">' +
            '<div class="char-img" style="background-image:url(' + c.images.idle + ')"></div>' +
            '<div class="badge' + (slot === 'p2' ? ' p2' : '') + '">' + (slot === 'p2' ? '2P / 电脑' : '1P') + '</div>' +
            '</div>' +
            '<div class="fighter-info">' +
            '<div class="fighter-name">' + c.name + '</div>' +
            '<div class="fighter-skills">' +
            c.skills.map(function (s) { return '<span>' + s.name + ' ' + s.cost + '能量</span>'; }).join('') +
            '</div>' +
            '</div>';
        return card;
    }

    function showSelectScreen() {
        state.screen = 'select';
        var p1Key = state.players[0] ? state.players[0].charKey : 'zhengyanjun';
        var p2Key = state.players[1] ? state.players[1].charKey : 'liugang';
        if (state.mode === 'solo' && p1Key === p2Key) p2Key = 'liugang';

        var p2Label = state.mode === 'duo' ? '2P 选择角色' : '选择你的对手（电脑）';

        // 单人模式才需要难度选择（AI 难度）
        var diffHtml = state.mode === 'solo'
            ? '<div class="panel-sub">电脑难度</div>' +
              '<div class="mode-row" id="diff-row">' +
              Object.keys(DIFFICULTY).map(function (k) {
                  return '<button class="mode-btn' + (state_difficulty === k ? '' : ' ghost') +
                      '" data-diff="' + k + '">' + DIFFICULTY[k].label + '</button>';
              }).join('') +
              '</div>'
            : '';

        panel.innerHTML =
            '<div class="panel-title">选择角色</div>' +
            '<div class="panel-sub">1P 选择角色</div>' +
            '<div class="fighter-row" id="row-p1"></div>' +
            '<div class="panel-sub">' + p2Label + '</div>' +
            '<div class="fighter-row" id="row-p2"></div>' +
            diffHtml +
            '<div class="btn-row">' +
            '<button class="ui-btn" id="fight-btn">开始战斗</button>' +
            '<button class="ui-btn ghost" id="back-btn">返回</button>' +
            '</div>';

        // 难度按钮
        var diffRow = $('diff-row');
        if (diffRow) {
            diffRow.querySelectorAll('.mode-btn').forEach(function (b) {
                b.addEventListener('click', function () {
                    state_difficulty = b.dataset.diff;
                    diffRow.querySelectorAll('.mode-btn').forEach(function (x) {
                        x.classList.toggle('ghost', x !== b);
                    });
                });
            });
        }

        var row1 = $('row-p1'), row2 = $('row-p2');
        var sel = { p1: p1Key, p2: p2Key };

        function renderRows() {
            row1.innerHTML = ''; row2.innerHTML = '';
            CHAR_KEYS.forEach(function (k) {
                var c1 = fighterCard(k, 'p1');
                var c2 = fighterCard(k, 'p2');
                if (sel.p1 === k) c1.classList.add('selected');
                if (sel.p2 === k) c2.classList.add('selected');
                // 同一角色不能两边都用
                if (sel.p2 === k) c1.classList.add('disabled');
                if (sel.p1 === k) c2.classList.add('disabled');
                c1.addEventListener('click', function () {
                    if (sel.p2 === k) sel.p2 = (k === 'zhengyanjun' ? 'liugang' : 'zhengyanjun');
                    sel.p1 = k; renderRows();
                });
                c2.addEventListener('click', function () {
                    if (sel.p1 === k) sel.p1 = (k === 'zhengyanjun' ? 'liugang' : 'zhengyanjun');
                    sel.p2 = k; renderRows();
                });
                row1.appendChild(c1); row2.appendChild(c2);
            });
        }
        renderRows();

        $('fight-btn').addEventListener('click', function () {
            overlay.classList.remove('show');
            state.screen = 'battle';
            setupPlayers(sel.p1, sel.p2);
            startBattle();
        });
        $('back-btn').addEventListener('click', showModeScreen);
        overlay.classList.add('show');
    }

    function setupPlayers(p1Key, p2Key) {
        state.players = [
            makePlayer(0, p1Key, false),
            makePlayer(1, p2Key, state.mode === 'solo')
        ];
        state.players[0].x = 12;
        state.players[1].x = 88;

        dom.p1name.textContent = CHARS[p1Key].name;
        dom.p2name.textContent = CHARS[p2Key].name;
        dom.p2tag.textContent = state.mode === 'duo' ? '2P' : 'CPU';
        dom.p2tag.classList.toggle('cpu', state.mode === 'solo');
        dom.vsText.textContent = state.mode === 'duo' ? 'VS' : 'VS';
        dom.p1tag.textContent = '1P';

        buildTouchPads();
        updateDimensions();
    }

    /* ============================================================
       开局
       ============================================================ */
    function startBattle() {
        state.gameOver = false;
        state.paused = false;
        state.running = false;
        state.started = false;
        state.gameTime = 0;
        state.regenAt = Date.now() + HP_REGEN_MS;

        state.players.forEach(function (p) {
            p.hp = MAX_HP; p.energy = 0; p.y = 0;
            p.isCrouching = p.isRunning = p.isMoving = p.isInAction = false;
            p.isJumping = false; p.isDashing = false;
            p.kbVel = 0; p.stunUntil = 0; p.landUntil = 0;
            p.guard = 0; p.guardBroken = false; p.recoverAt = 0;
            p.cancelableAt = 0; p.dashUntil = 0; p.lastDashTime = 0;
            p.currentState = 'idle';
            p.lastAttackTime = 0; p.lastSkillTime = 0;
            p.skillReadyAt = {}; p.combo = 0; p.comboUntil = 0;
            // 不清空 p.held：重开时玩家手指/按键可能仍按着，
            // 清空会导致"还按着但人物不动"，必须等真正松开才复位。
            p.ai = { state: 'idle', timer: 0, defend: 0, reactTimer: 0, skillPick: 0 };
            p.lockedFacing = null;
            var el = targetDom(p);
            el.classList.remove('defeated', 'victory', 'hit-flash');
            el.style.transform = 'scaleX(' + p.facing + ')';
        });
        dom.p1.classList.remove('defeated', 'victory');
        dom.p2.classList.remove('defeated', 'victory');

        updateUI();
        duckBgm(false);
        runCountdown();
    }

    function runCountdown() {
        var seq = ['3', '2', '1', '开始！'];
        var i = 0;
        countdownEl.classList.add('show');
        function next() {
            if (i >= seq.length) {
                countdownEl.classList.remove('show');
                state.running = true;
                state.started = true;
                return;
            }
            countdownEl.textContent = seq[i];
            countdownEl.classList.remove('pop');
            void countdownEl.offsetWidth;
            countdownEl.classList.add('pop');
            i++;
            setTimeout(next, 800);
        }
        next();
    }

    /* ============================================================
       输入
       ============================================================ */
    function keyToAction(playerIdx, e) {
        // 右 Shift 单独用 code 判断
        if (e.code === 'ShiftRight') return { p: 1, a: 'run' };
        if (e.code === 'ShiftLeft') return { p: 0, a: 'run' };
        // 右 Ctrl 作为 2P 跳跃的备份键（很多笔记本没有独立 PageUp）
        if (e.code === 'ControlRight') return { p: 1, a: 'jump' };
        var k = e.key.toLowerCase();
        var map = KEYMAP[playerIdx];
        if (map && map[k]) return { p: playerIdx, a: map[k] };
        return null;
    }

    function onActionDown(pIdx, action) {
        if (!state.running || state.paused || state.gameOver) return;
        var p = state.players[pIdx];
        if (!p) return;

        if (CONTINUOUS[action]) {
            p.held[action] = true;
            if (action === 'run') {
                // 按住跑 + 方向 = 冲刺（街机式快速位移）
                tryDash(p);
            }
            if (action === 'crouch') {
                // 破防硬直期间无法重新蹲下
                if (!p.isInAction && !p.isJumping && !p.guardBroken) {
                    p.isCrouching = true;
                    p.currentState = 'idle';
                }
            }
            return;
        }
        // 一次性动作
        if (action === 'jump') tryJump(p);
        else if (action === 'attack') performAttack(p);
        else if (action.indexOf('skill') === 0) useSkill(p, action);
    }

    function onActionUp(pIdx, action) {
        var p = state.players[pIdx];
        if (!p) return;
        if (CONTINUOUS[action]) {
            p.held[action] = false;
            if (action === 'crouch') {
                p.isCrouching = false;
                if (!p.isInAction) p.currentState = 'idle';
            }
        }
    }

    function bindInput() {
        document.addEventListener('keydown', function (e) {
            if (e.repeat) return;
            // 暂停
            if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
                if (state.screen === 'battle') togglePause();
                return;
            }
            var hit = keyToAction(0, e) || keyToAction(1, e);
            if (!hit) return;
            if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', '/'].indexOf(e.key.toLowerCase()) >= 0) {
                e.preventDefault();
            }
            startBgm();
            onActionDown(hit.p, hit.a);
        });

        document.addEventListener('keyup', function (e) {
            var hit = keyToAction(0, e) || keyToAction(1, e);
            if (!hit) return;
            onActionUp(hit.p, hit.a);
        });

        // 触屏/鼠标按键由 bindPointerButtons() 统一处理（Pointer Events，
        // 支持滑出取消），此处不重复绑定，避免一次按下触发两次动作。

        dom.modeToggle.addEventListener('click', toggleTouchMode);
    }

    function toggleTouchMode() {
        state.touchMode = !state.touchMode;
        document.body.classList.toggle('touch-mode', state.touchMode);
        dom.touchControls.classList.toggle('active', state.touchMode);
        dom.keyboardHint.classList.toggle('hidden', state.touchMode);
        dom.modeToggle.textContent = state.touchMode ? '切换键盘模式' : '切换触屏模式';
        setTimeout(function () {
            updateDimensions();
            state.players.forEach(updateCharacterDisplay);
        }, 60);
    }

    /* ============================================================
       触屏面板：虚拟摇杆 + 拳皇式按键
       ============================================================ */
    function buildTouchPads() {
        var pad1 = $('pad-p1'), pad2 = $('pad-p2');
        pad1.innerHTML = ''; pad2.innerHTML = '';

        function padHtml(pIdx) {
            return '' +
                '<div class="stick" data-player="' + pIdx + '">' +
                '  <div class="stick-base"></div>' +
                '  <div class="stick-knob"></div>' +
                '  <div class="stick-hint">移动</div>' +
                '</div>';
        }

        function buttonsHtml(pIdx) {
            var p = state.players[pIdx];
            var cfg = charOf(p);
            var b = [];
            b.push('<div class="game-btn gb-crouch" data-player="' + pIdx + '" data-action="crouch">蹲</div>');
            b.push('<div class="game-btn gb-jump" data-player="' + pIdx + '" data-action="jump">跳</div>');
            b.push('<div class="game-btn gb-run" data-player="' + pIdx + '" data-action="run">跑</div>');
            cfg.skills.forEach(function (s) {
                b.push('<div class="game-btn gb-skill" data-player="' + pIdx + '" data-action="' + s.key +
                    '"><span class="k">' + s.name + '</span><span class="cost">' + s.cost + '</span>' +
                    '<span class="cd"></span></div>');
            });
            b.push('<div class="game-btn gb-atk" data-player="' + pIdx + '" data-action="attack">攻击</div>');
            return '<div class="btn-cluster">' + b.join('') + '</div>';
        }

        pad1.innerHTML = padHtml(0) + buttonsHtml(0);
        pad2.innerHTML = padHtml(1) + buttonsHtml(1);
        pad2.classList.toggle('hidden', state.mode !== 'duo');

        bindPointerButtons();
        bindSticks();
    }

    /* 虚拟摇杆：像街机摇杆一样，可拖动、带动八向、有死区 */
    function bindSticks() {
        document.querySelectorAll('.stick').forEach(function (stick) {
            if (stick.dataset.bound) return;
            stick.dataset.bound = '1';
            var pIdx = parseInt(stick.dataset.player, 10);
            var knob = stick.querySelector('.stick-knob');
            var pid = null;
            var STICK_RADIUS = 46;   // 摇杆可拖动半径(px)
            var DEAD = 0.28;        // 死区比例

            function setDir(dx, dy) {
                var p = state.players[pIdx];
                if (!p) return;
                var len = Math.hypot(dx, dy);
                if (len < STICK_RADIUS * DEAD) {
                    p.held.left = p.held.right = p.held.up = p.held.down = false;
                    return;
                }
                var nx = dx / len, ny = dy / len;
                // 八向判定：加一点迟滞，避免斜向抖动
                p.held.left = nx < -0.38;
                p.held.right = nx > 0.38;
                p.held.up = ny < -0.38;
                p.held.down = ny > 0.38;
                // 斜向时以主轴为准，避免两个轴同时大幅移动导致速度翻倍
                if (p.held.left && p.held.right) p.held.right = false;
                if (p.held.up && p.held.down) p.held.down = false;
            }

            stick.addEventListener('pointerdown', function (e) {
                e.preventDefault();
                pid = e.pointerId;
                try { stick.setPointerCapture(pid); } catch (err) { }
                stick.classList.add('active');
                moveKnob(e);
                startBgm();
            });

            function moveKnob(e) {
                if (pid !== e.pointerId) return;
                var r = stick.getBoundingClientRect();
                var cx = r.left + r.width / 2;
                var cy = r.top + r.height / 2;
                var dx = e.clientX - cx;
                var dy = e.clientY - cy;
                var len = Math.hypot(dx, dy);
                if (len > STICK_RADIUS) {
                    dx = dx / len * STICK_RADIUS;
                    dy = dy / len * STICK_RADIUS;
                }
                knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
                setDir(dx, dy);
            }

            stick.addEventListener('pointermove', function (e) { moveKnob(e); });

            function release(e) {
                if (pid !== e.pointerId) return;
                pid = null;
                knob.style.transform = 'translate(0,0)';
                stick.classList.remove('active');
                var p = state.players[pIdx];
                if (p) { p.held.left = p.held.right = p.held.up = p.held.down = false; }
            }
            stick.addEventListener('pointerup', release);
            stick.addEventListener('pointercancel', release);
            stick.addEventListener('lostpointercapture', release);
        });
    }

    function bindPointerButtons() {
        document.querySelectorAll('[data-player][data-action]').forEach(function (btn) {
            if (btn.dataset.bound) return;
            btn.dataset.bound = '1';
            var rec = null;
            btn.addEventListener('pointerdown', function (e) {
                e.preventDefault();
                btn.classList.add('held');
                try { btn.setPointerCapture(e.pointerId); } catch (err) { }
                rec = { btn: btn, p: parseInt(btn.dataset.player, 10) };
                btn._rec = rec;
                startBgm();
                onActionDown(rec.p, btn.dataset.action);
            });
            function release(e) {
                var r = btn._rec;
                if (!r) return;
                btn._rec = null;
                btn.classList.remove('held');
                onActionUp(r.p, r.btn.dataset.action);
            }
            btn.addEventListener('pointerup', release);
            btn.addEventListener('pointercancel', release);
            btn.addEventListener('lostpointercapture', release);
        });
    }

    /* ============================================================
       暂停
       ============================================================ */
    function togglePause() {
        if (!state.started || state.gameOver) return;
        state.paused = !state.paused;
        if (state.paused) {
            panel.innerHTML =
                '<div class="panel-title">已暂停</div>' +
                '<div class="panel-sub">按 P 或 Esc 继续</div>' +
                '<div class="btn-row">' +
                '<button class="ui-btn" id="resume-btn">继续战斗</button>' +
                '<button class="ui-btn ghost" id="quit-btn">返回主菜单</button>' +
                '</div>';
            $('resume-btn').addEventListener('click', togglePause);
            $('quit-btn').addEventListener('click', function () {
                state.paused = false;
                overlay.classList.remove('show');
                showModeScreen();
            });
            overlay.classList.add('show');
        } else {
            overlay.classList.remove('show');
        }
    }

    /* ============================================================
       AI
       设计要点：
       1. AI 反应有延迟，不会在玩家出招的同一帧就做出反应（人类做不到）
       2. 距离远时 AI 会跑/冲刺，否则永远追不上一直疾跑的玩家
       3. 蹲防有上限，不能一直无脑龟缩
       4. 能量有规划，高耗技能留到合适距离才放
       5. 会跳跃躲避大范围技能（高手才做得到）
       ============================================================ */
    var DIFFICULTY = {
        easy: {
            label: '简单', react: 0.45, defendChance: 0.35, skillChance: 0.22,
            attackGap: 1500, moveSpeed: 0.85, jumpChance: 0.05
        },
        normal: {
            label: '普通', react: 0.25, defendChance: 0.5, skillChance: 0.35,
            attackGap: 1000, moveSpeed: 1.0, jumpChance: 0.18
        },
        hard: {
            label: '困难', react: 0.12, defendChance: 0.62, skillChance: 0.48,
            attackGap: 750, moveSpeed: 1.12, jumpChance: 0.32
        }
    };
    var state_difficulty = 'normal';

    function aiUpdate(p, dt) {
        if (state.gameOver || p.isInAction) return;
        var opponent = otherPlayer(p);
        var cfg = charOf(p);
        var now = Date.now();
        var D = DIFFICULTY[state_difficulty];

        // 防御计时
        if (p.ai.defend > 0) {
            p.ai.defend -= dt;
            p.isCrouching = true;
            p.isMoving = false;
            return;
        }
        p.isCrouching = false;

        var dx = opponent.x - p.x;
        var adx = Math.abs(dx);
        var dy = Math.abs(opponent.y - p.y);
        var charWPct = (state.charW / state.areaW) * 100;
        var attackDist = charWPct * (1 + ATTACK_RANGE * 0.8);
        var skillDist = charWPct * (1 + 1.5 * 0.8);

        // 玩家出招 → 概率蹲防 / 跳跃闪避（带反应延迟，不会瞬间看穿）
        var oppAttacking = opponent.isInAction &&
            (opponent.currentState === 'attack' || opponent.currentState.indexOf('skill') === 0);
        if (oppAttacking && adx < attackDist + 2 && dy < state.charH * 0.6) {
            p.ai.reactTimer -= dt;
            if (p.ai.reactTimer <= 0) {
                var roll = Math.random();
                if (roll < D.jumpChance) {
                    // 跳跃躲避大范围技能
                    tryJump(p);
                    p.ai.reactTimer = D.react;
                    return;
                }
                if (roll < D.jumpChance + D.defendChance) {
                    p.ai.defend = 0.35 + Math.random() * 0.5;
                    p.isCrouching = true;
                    p.ai.reactTimer = D.react;
                    return;
                }
            }
        } else {
            p.ai.reactTimer = Math.max(0, p.ai.reactTimer - dt);
        }

        p.ai.timer -= dt;
        if (p.ai.timer <= 0) {
            var r = Math.random();
            if (adx > attackDist + 3) p.ai.state = 'chase';
            else if (adx < attackDist && dy < state.charH * 0.5) {
                if (p.energy >= 25 && r < D.skillChance) p.ai.state = 'skill';
                else if (r > 0.78) p.ai.state = 'retreat';
                else p.ai.state = 'attack';
            } else {
                p.ai.state = r > 0.5 ? 'chase' : 'idle';
            }
            p.ai.timer = 0.3 + Math.random() * 0.45;
        }

        p.isMoving = false;
        p.isRunning = false;

        switch (p.ai.state) {
            case 'chase':
                p.isMoving = true;
                // 距离远就开跑，否则永远追不上一直疾跑的玩家
                p.isRunning = adx > attackDist * 2.2;
                // 很远时用冲刺快速拉近距离（有冷却，不会一直冲）
                if (adx > attackDist * 5 && !p.isDashing) {
                    p.held.left = dx < 0; p.held.right = dx > 0;
                    tryDash(p);
                }
                moveToward(p, opponent, dt, (p.isRunning ? RUN_SPEED : WALK_SPEED) * D.moveSpeed);
                if (adx < attackDist && dy < state.charH * 0.5 && now - p.lastAttackTime > D.attackGap) {
                    if (p.energy >= 25 && Math.random() < D.skillChance) p.ai.state = 'skill';
                    else p.ai.state = 'attack';
                }
                break;
            case 'retreat':
                p.isMoving = true;
                p.x += (dx > 0 ? -1 : 1) * WALK_SPEED * 0.85 * dt;
                break;
            case 'attack':
                if (adx < attackDist + 1 && dy < state.charH * 0.5 && now - p.lastAttackTime > D.attackGap) {
                    performAttack(p);
                    p.ai.state = 'idle';
                    p.ai.timer = 0.22 + Math.random() * 0.3;
                } else {
                    p.isMoving = true;
                    moveToward(p, opponent, dt, WALK_SPEED * D.moveSpeed);
                }
                break;
            case 'skill': {
                // 能量规划：只在打得着的距离才放，高耗技能留到贴身
                var usable = cfg.skills.filter(function (s) {
                    if (p.energy < s.cost) return false;
                    if (now - p.lastSkillTime < SKILL_CD) return false;
                    var reach = charWPct * (1 + s.range * 0.8);
                    return adx < reach;
                });
                if (usable.length) {
                    // 技能 1 权重最高，高耗技能权重低
                    var weights = usable.map(function (s, i) { return usable.length - i; });
                    var total = weights.reduce(function (a, b) { return a + b; }, 0);
                    var rand = Math.random() * total, chosen = usable[0];
                    for (var i = 0; i < usable.length; i++) {
                        rand -= weights[i];
                        if (rand <= 0) { chosen = usable[i]; break; }
                    }
                    useSkill(p, chosen.key);
                    p.ai.state = 'idle';
                    p.ai.timer = 0.45 + Math.random() * 0.3;
                } else {
                    p.isMoving = true;
                    moveToward(p, opponent, dt, WALK_SPEED * D.moveSpeed);
                }
                break;
            }
            case 'idle':
            default:
                if (Math.random() < 0.3) {
                    p.isMoving = true;
                    p.x += (Math.random() - 0.5) * WALK_SPEED * dt * 2;
                    p.y += (Math.random() - 0.5) * VERT_SPEED * dt * 1.5;
                }
                break;
        }

        clampPos(p);
    }

    function moveToward(p, target, dt, speed) {
        var dx = target.x - p.x;
        if (Math.abs(dx) > 0.5) p.x += (dx > 0 ? 1 : -1) * speed * dt;
        var dy = target.y - p.y;
        if (Math.abs(dy) > 10) p.y += (dy > 0 ? 1 : -1) * VERT_SPEED * 0.7 * dt;
    }

    function clampPos(p) {
        var halfPct = (state.charW / state.areaW) * 100 / 2;
        var maxY = Math.max(0, state.areaH - charHeightOf(p) + 10);
        p.x = Math.max(halfPct + 2, Math.min(100 - halfPct - 2, p.x));
        p.y = Math.max(0, Math.min(maxY, p.y));
    }

    /* ============================================================
       主循环
       ============================================================ */
    function loop(ts) {
        requestAnimationFrame(loop);
        if (!state.lastTs) state.lastTs = ts;
        var rawDt = (ts - state.lastTs) / 1000;
        state.lastTs = ts;

        /* 命中定格：定格期间双方都静止，这是打击感最关键的一环 */
        var now = Date.now();
        var hitstop = state.hitstopUntil && now < state.hitstopUntil;
        var dt = hitstop ? 0 : Math.min(0.05, rawDt);

        if (state.running && !state.paused && !state.gameOver) {
            if (!hitstop) state.gameTime += dt;

            // 玩家输入移动
            state.players.forEach(function (p) {
                if (p.isAI) { aiUpdate(p, dt); return; }
                // 硬直中不能动
                if (p.stunUntil && now < p.stunUntil) {
                    p.isMoving = false;
                    p.isRunning = false;
                    return;
                }
                // 落地僵直：极短的僵住，是街机手感的关键
                if (p.landUntil && now < p.landUntil) {
                    p.isMoving = false;
                    return;
                }
                if (p.isInAction || p.isCrouching) { p.isMoving = false; return; }
                p.isMoving = false;
                p.isRunning = !!p.held.run;

                var sp = (p.isRunning ? RUN_SPEED : WALK_SPEED) * speedMul(p);
                // 空中移动略慢
                if (p.isJumping) sp *= AIR_MOVE_MUL;

                // 冲刺：短暂高速位移
                if (p.isDashing) {
                    if (now >= p.dashUntil) {
                        p.isDashing = false;
                    } else {
                        p.x += p.dashDir * DASH_SPEED * dt;
                        p.isMoving = true;
                        clampPos(p);
                        return;
                    }
                }

                if (p.held.left) { p.x -= sp * dt; p.isMoving = true; }
                if (p.held.right) { p.x += sp * dt; p.isMoving = true; }
                if (p.held.up) { p.y += VERT_SPEED * dt; p.isMoving = true; }
                if (p.held.down) { p.y -= VERT_SPEED * dt; p.isMoving = true; }
                clampPos(p);
            });

            /* 跳跃物理：抛物线 + 落地僵直 */
            state.players.forEach(function (p) {
                if (!p.isJumping) return;
                var t = (now - p.jumpStart) / JUMP_DURATION;
                if (t >= 1) {
                    p.isJumping = false;
                    p.y = p.jumpFromY;
                    p.landUntil = now + LAND_LAG;   // 落地僵直
                    p.currentState = 'idle';
                    // 落地扬尘
                    spawnDust(p);
                } else {
                    // 二次曲线：0 → 1 → 0
                    p.y = p.jumpFromY + Math.sin(t * Math.PI) * JUMP_HEIGHT;
                }
            });

            // 击退位移（硬直期间持续后退）
            state.players.forEach(function (p) {
                if (p.kbVel) {
                    p.x += p.kbVel * dt;
                    p.kbVel *= 0.86;             // 快速衰减
                    if (Math.abs(p.kbVel) < 0.05) p.kbVel = 0;
                    clampPos(p);
                }
                // 硬直结束 → 回到待机
                if (p.stunUntil && now >= p.stunUntil && p.currentState === 'hit') {
                    p.currentState = 'idle';
                }
            });

            // 互相推挤，防止穿模重叠
            separate(state.players[0], state.players[1]);

            // 朝向（出招期间保持锁定）
            state.players.forEach(function (p) {
                var opp = otherPlayer(p);
                if (!p.isInAction) {
                    p.facing = opp.x >= p.x ? 1 : -1;
                }
            });

            // 回血
            if (Date.now() >= state.regenAt) {
                state.regenAt = Date.now() + HP_REGEN_MS;
                state.players.forEach(function (p) {
                    if (p.hp < MAX_HP) p.hp = Math.min(MAX_HP, p.hp + HP_REGEN);
                });
            }

            /* 后摇收招：技能/普攻在 recoverAt 之后才能动 */
            state.players.forEach(function (p) {
                if (p.isInAction && p.recoverAt && now >= p.recoverAt) {
                    p.isInAction = false;
                    p.currentState = 'idle';
                    p.lockedFacing = null;
                    p.recoverAt = 0;
                }
            });

            /* 防御值回复：不蹲着时快速回落，保证"龟缩"不能一直用 */
            state.players.forEach(function (p) {
                if (p.guard > 0) {
                    p.guard = Math.max(0, p.guard - GUARD_DECAY * dt);
                }
                // 破防硬直结束后解除破防状态
                if (p.guardBroken && now >= p.stunUntil) p.guardBroken = false;
            });
        }

        state.players.forEach(updateCharacterDisplay);
        applyShake();

        // UI 限流：10fps 足够，避免每帧写样式导致掉帧
        if (ts - state.lastUi > 100) {
            state.lastUi = ts;
            updateUI();
            updateSkillCooldowns();
        }
    }

    /* 屏幕震动：命中时整个战斗区抖一下 */
    function applyShake() {
        var el = dom.battleArea;
        if (!state.shakeUntil || Date.now() > state.shakeUntil) {
            if (el.style.transform) el.style.transform = '';
            return;
        }
        var amt = state.shakeAmount || 0;
        var dx = (Math.random() - 0.5) * 2 * amt;
        var dy = (Math.random() - 0.5) * 2 * amt;
        el.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
    }

    function separate(a, b) {
        var gap = PUSH_GAP * 100;
        var minDist = (state.charW / state.areaW) * 100 * 1.0;
        var d = b.x - a.x;
        var ad = Math.abs(d);
        if (ad >= minDist || ad === 0) return;
        var push = (minDist - ad) / 2;
        var sign = d > 0 ? 1 : -1;
        a.x -= sign * push;
        b.x += sign * push;
        clampPos(a); clampPos(b);
    }

    function updateSkillCooldowns() {
        if (!state.players.length) return;
        var now = Date.now();
        document.querySelectorAll('.game-btn[data-action^="skill"]').forEach(function (btn) {
            var pIdx = parseInt(btn.dataset.player, 10);
            var p = state.players[pIdx];
            if (!p) return;
            var action = btn.dataset.action;
            var ready = p.skillReadyAt[action] || 0;
            var cd = btn.querySelector('.cd');
            if (!cd) return;
            if (ready > now) {
                var total = SKILL_CD;
                var left = Math.max(0, ready - now);
                cd.style.height = (left / total * 100) + '%';
            } else {
                cd.style.height = '0%';
            }
            var cost = skillCostOf(p, action);
            btn.classList.toggle('nofuel', p.energy < cost);
            btn.classList.toggle('unavailable', p.energy < cost || ready > now);
        });
    }

    function skillCostOf(p, action) {
        var cfg = charOf(p);
        for (var i = 0; i < cfg.skills.length; i++) {
            if (cfg.skills[i].key === action) return cfg.skills[i].cost;
        }
        return 0;
    }

    /* ============================================================
       初始化
       ============================================================ */
    function init() {
        dom = {
            p1: $('p1'), p2: $('p2'),
            p1name: $('p1-name'), p2name: $('p2-name'),
            p1tag: $('p1-tag'), p2tag: $('p2-tag'),
            p1hp: $('p1-hp'), p2hp: $('p2-hp'),
            p1energy: $('p1-energy'), p2energy: $('p2-energy'),
            p1guard: $('p1-guard'), p2guard: $('p2-guard'),
            timer: $('timer'), vsText: $('vs-text'),
            modeToggle: $('mode-toggle'),
            keyboardHint: $('keyboard-hint'),
            touchControls: $('touch-controls'),
            battleArea: $('battle-area')
        };
        battleArea = dom.battleArea;
        overlay = $('overlay');
        panel = $('panel');
        countdownEl = $('countdown');

        // 默认角色，先摆好画面
        state.players = [makePlayer(0, 'zhengyanjun', false), makePlayer(1, 'liugang', true)];
        dom.p1name.textContent = CHARS.zhengyanjun.name;
        dom.p2name.textContent = CHARS.liugang.name;

        updateDimensions();
        state.players.forEach(updateCharacterDisplay);
        updateUI();

        buildTouchPads();
        bindInput();

        window.addEventListener('resize', function () {
            updateDimensions();
            state.players.forEach(function (p) { clampPos(p); updateCharacterDisplay(p); });
        });

        // 触屏设备默认切到触屏模式
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            state.touchMode = true;
            document.body.classList.add('touch-mode');
            dom.touchControls.classList.add('active');
            dom.keyboardHint.classList.add('hidden');
            dom.modeToggle.textContent = '切换键盘模式';
        }

        requestAnimationFrame(loop);
        showModeScreen();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
