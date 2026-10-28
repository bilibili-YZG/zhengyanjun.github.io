/* Boss 测试地图（world.html?map=boss）：把 metroline-15 第五章的「夕阳大道」搬过来。
   一条会无限延伸的公路：地图是 4 个周期（每个 6400 px = 64 格 × 100 px）首尾相接，玩家跑过头会被无缝接回来。
   Boss「倦怠骑士」（strong 加强版）在玩家往前走一段后现身。开局身边有一辆装甲车和一架战机。
   这里只放数据；逻辑在 knight.js（骑士本体，原样移植）和 boss.js（接到 rdbg 世界里的适配层）。 */
(function () {
  if (!/[?&]map=boss\b/.test(location.search)) return;
  var PERIOD = 6400, SPAWN = PERIOD + 400;
  var M = {
    boss: true,
    vehSpawn: true,                        // 路上随机刷新载具
    width: PERIOD * 4,
    groundY: 600,
    spawn: { x: SPAWN },
    platforms: [], holes: [], dummies: [], signs: [], mobs: [], pickups: [],
    vehicles: [{ x: SPAWN + 260 }],        // 车和飞机都放在 Boss 登场点（出生点右 500 px）之前
    planes: [{ x: SPAWN - 360 }],
    goal: null
  };
  for (var q = 0; q < 4; q++) {
    var o = q * PERIOD;
    [[500, 470], [1300, 360], [2500, 470], [3300, 360], [4500, 470], [5300, 360]].forEach(function (p) { M.platforms.push({ x: o + p[0], y: p[1], w: 300 }); });
    [2000, 4400].forEach(function (x) { M.holes.push({ x0: o + x, x1: o + x + 200 }); });      // 两个 2 格宽的小坑，能跳过去
    M.signs.push({ x: o + 600, text: '夕阳大道' });
  }
  M.signs.push({ x: SPAWN - 120, text: '战机 · 按 E 登机' }, { x: SPAWN + 120, text: '载具 · 按 E 上车' });
  window.WORLD_MAP = M;
})();
