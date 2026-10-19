/* DLC游戏逻辑扩展 - 蓝色碎片、新障碍物、新敌人
   这个文件扩展game.js的功能，添加DLC专属的游戏逻辑 */
(function(){
'use strict';

// 等待Game对象加载
function waitForGame(callback) {
  if (window.Game) {
    callback();
  } else {
    setTimeout(function() { waitForGame(callback); }, 100);
  }
}

waitForGame(function() {

/* ==================== 蓝色碎片拾取逻辑 ==================== */

// 扩展原有的碎片拾取函数
var originalCollectShard = window.collectShard || function() {};

window.collectShard = function(obj, gameState) {
  // 处理蓝色碎片
  if (obj.kind === 'blueshard') {
    var campaign = gameState.campaign;
    var gk = campaign.id || 'dlc';

    // 记录收集
    if (Meta && Meta.blueShard) {
      Meta.blueShard(gk, obj.id);
      Meta.flush();
    }

    // 播放音效（如果有）
    if (window.Audio && Audio.play) {
      Audio.play('shard');
    }

    // 显示提示
    if (gameState.toast) {
      gameState.toast('◆ 蓝色碎片 +1', 1500);
    }

    // 检查DLC解锁
    if (Meta && Meta.checkDLCUnlock && Meta.checkDLCUnlock()) {
      setTimeout(function() {
        if (gameState.toast) {
          gameState.toast('🌀 DLC "深渊回响" 已解锁！', 3000);
        }
      }, 1600);
    }

    return true;
  }

  // 处理普通碎片
  return originalCollectShard(obj, gameState);
};

/* ==================== 新障碍物逻辑 ==================== */

// 电磁场 - 减速效果
window.applyEmfieldEffect = function(player, emfield) {
  if (!player || !emfield) return;

  // 检测碰撞
  if (isColliding(player, emfield)) {
    // 施加减速效果
    var slowFactor = emfield.p && emfield.p.strength ? emfield.p.strength : 0.5;
    player.vx *= slowFactor;
    player.vy *= slowFactor;

    // 添加视觉效果标记
    player.inEmfield = true;
  } else {
    player.inEmfield = false;
  }
};

// 低温陷阱 - 冻结效果
window.applyCryotrapEffect = function(player, cryotrap, deltaTime) {
  if (!player || !cryotrap) return;

  // 周期性激活
  var period = cryotrap.p && cryotrap.p.period ? cryotrap.p.period : 4;
  cryotrap.timer = (cryotrap.timer || 0) + deltaTime;
  var phase = (cryotrap.timer % period) / period;

  // 激活时（0.2-0.4阶段）
  var isActive = phase >= 0.2 && phase <= 0.4;
  cryotrap.active = isActive;

  if (isActive && isColliding(player, cryotrap)) {
    // 冻结玩家
    player.frozen = true;
    player.frozenTime = 0.5; // 冻结0.5秒
    player.vx = 0;
    player.vy = 0;
  }

  // 解除冻结
  if (player.frozen && player.frozenTime) {
    player.frozenTime -= deltaTime;
    if (player.frozenTime <= 0) {
      player.frozen = false;
      player.frozenTime = 0;
    }
  }
};

// 电弧 - 周期性伤害
window.applyVoltarcEffect = function(player, voltarc, deltaTime) {
  if (!player || !voltarc) return;

  // 周期性激活
  var period = voltarc.p && voltarc.p.period ? voltarc.p.period : 2.8;
  voltarc.timer = (voltarc.timer || 0) + deltaTime;
  var phase = (voltarc.timer % period) / period;

  // 闪烁预警（0.8-1.0阶段）
  voltarc.warn = phase >= 0.8;

  // 激活时（0.0-0.15阶段）
  var isActive = phase <= 0.15;
  voltarc.active = isActive;

  if (isActive && isColliding(player, voltarc) && !player.invuln) {
    // 造成伤害
    if (window.Game && Game.hurt) {
      Game.hurt(player);
    }
  }
};

// 重力井 - 增强重力
window.applyGravwellEffect = function(player, gravwell) {
  if (!player || !gravwell) return;

  if (isColliding(player, gravwell)) {
    // 增强重力
    var gravityMultiplier = gravwell.p && gravwell.p.strength ? gravwell.p.strength : 1.2;
    player.gravityScale = gravityMultiplier;
    player.inGravwell = true;
  } else {
    player.gravityScale = 1.0;
    player.inGravwell = false;
  }
};

// 等离子体 - 周期性伤害
window.applyPlasmaEffect = function(player, plasma, deltaTime) {
  if (!player || !plasma) return;

  // 周期性激活
  var period = plasma.p && plasma.p.period ? plasma.p.period : 2.5;
  plasma.timer = (plasma.timer || 0) + deltaTime;
  var phase = (plasma.timer % period) / period;

  // 激活时（0.3-0.6阶段）
  var isActive = phase >= 0.3 && phase <= 0.6;
  plasma.active = isActive;

  if (isActive && isColliding(player, plasma) && !player.invuln) {
    // 造成伤害
    if (window.Game && Game.hurt) {
      Game.hurt(player);
    }
  }
};

/* ==================== 新敌人AI逻辑 ==================== */

// 监控无人机 - 飞行追踪
window.updateDrone = function(drone, player, deltaTime) {
  if (!drone || !player) return;

  var range = drone.range || 6;
  var speed = drone.speed || 50;
  var dx = player.x - drone.x;
  var dy = player.y - drone.y;
  var dist = Math.sqrt(dx * dx + dy * dy);

  // 在范围内追踪
  if (dist < range * 32 && dist > 16) {
    drone.vx = (dx / dist) * speed * deltaTime;
    drone.vy = (dy / dist) * speed * deltaTime;
    drone.face = dx > 0 ? 1 : -1;
  } else {
    drone.vx *= 0.9;
    drone.vy *= 0.9;
  }

  // 更新位置
  drone.x += drone.vx;
  drone.y += drone.vy;
};

// 探测球 - 持续追踪
window.updateProbe = function(probe, player, deltaTime) {
  if (!probe || !player) return;

  var speed = 40;
  var dx = player.x - probe.x;
  var dy = player.y - probe.y;
  var dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > 8) {
    probe.vx = (dx / dist) * speed * deltaTime;
    probe.vy = (dy / dist) * speed * deltaTime;
  }

  // 更新位置
  probe.x += probe.vx;
  probe.y += probe.vy;
};

// 哨兵机器人 - 重型慢速单位
window.updateSentinel = function(sentinel, player, deltaTime) {
  if (!sentinel || !player) return;

  var range = sentinel.range || 7;
  var speed = sentinel.speed || 30;
  var dx = player.x - sentinel.x;
  var dist = Math.abs(dx);

  sentinel.face = dx > 0 ? 1 : -1;

  // 在范围内移动
  if (dist < range * 32 && dist > 48) {
    sentinel.vx = (dx > 0 ? 1 : -1) * speed * deltaTime;
  } else {
    sentinel.vx *= 0.85;
  }

  // 更新位置
  sentinel.x += sentinel.vx;
};

// 冰霜怨灵 - 类似幽灵但更强
window.updateWraith = function(wraith, player, deltaTime) {
  if (!wraith || !player) return;

  // 类似幽灵的行为：玩家看着它时变慢
  var dx = player.x - wraith.x;
  var dy = player.y - wraith.y;
  var dist = Math.sqrt(dx * dx + dy * dy);

  var isFacing = (player.face > 0 && dx > 0) || (player.face < 0 && dx < 0);
  var speed = isFacing ? 10 : 60;

  if (dist > 16) {
    wraith.vx = (dx / dist) * speed * deltaTime;
    wraith.vy = (dy / dist) * speed * deltaTime;
  }

  wraith.x += wraith.vx;
  wraith.y += wraith.vy;
  wraith.alpha = isFacing ? 0.3 : 0.85;
};

// 异常体 - 不规则移动
window.updateAnomaly = function(anomaly, player, deltaTime) {
  if (!anomaly || !player) return;

  // 随机移动模式
  anomaly.modeTimer = (anomaly.modeTimer || 0) + deltaTime;

  if (anomaly.modeTimer > 2) {
    anomaly.modeTimer = 0;
    anomaly.mode = Math.random() > 0.5 ? 'chase' : 'wander';
  }

  if (anomaly.mode === 'chase') {
    var dx = player.x - anomaly.x;
    var dy = player.y - anomaly.y;
    var dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 16) {
      anomaly.vx = (dx / dist) * 50 * deltaTime;
      anomaly.vy = (dy / dist) * 50 * deltaTime;
    }
  } else {
    anomaly.vx += (Math.random() - 0.5) * 20 * deltaTime;
    anomaly.vy += (Math.random() - 0.5) * 20 * deltaTime;
    anomaly.vx *= 0.95;
    anomaly.vy *= 0.95;
  }

  anomaly.x += anomaly.vx;
  anomaly.y += anomaly.vy;
};

/* ==================== 辅助函数 ==================== */

function isColliding(a, b) {
  if (!a || !b) return false;

  var ax1 = a.x - (a.w || 32) / 2;
  var ax2 = a.x + (a.w || 32) / 2;
  var ay1 = a.y - (a.h || 32) / 2;
  var ay2 = a.y + (a.h || 32) / 2;

  var bx1 = b.x;
  var bx2 = b.x + (b.w || 32);
  var by1 = b.y;
  var by2 = b.y + (b.h || 32);

  return !(ax2 < bx1 || ax1 > bx2 || ay2 < by1 || ay1 > by2);
}

/* ==================== 导出 ==================== */

window.DLC_LOGIC = {
  collectShard: window.collectShard,
  applyEmfieldEffect: window.applyEmfieldEffect,
  applyCryotrapEffect: window.applyCryotrapEffect,
  applyVoltarcEffect: window.applyVoltarcEffect,
  applyGravwellEffect: window.applyGravwellEffect,
  applyPlasmaEffect: window.applyPlasmaEffect,
  updateDrone: window.updateDrone,
  updateProbe: window.updateProbe,
  updateSentinel: window.updateSentinel,
  updateWraith: window.updateWraith,
  updateAnomaly: window.updateAnomaly
};

console.log('DLC游戏逻辑已加载');

}); // end waitForGame

})();
