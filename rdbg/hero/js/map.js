/* 大地图数据（纯数据，改这里就能改地图，不需要动 world.js）。
   坐标单位：像素。x 向右；y 向下，groundY 是地面表面的 y。
   platforms：悬空平台（单向：只能从下往上跳上去，按 ↓ 再跳可以穿下来） { x, y, w }  —— y 是平台上表面
   dummies  ：训练木桩 { x, y }  —— 站立点；y 省略则站在地面上
   signs    ：路牌 { x, text }
   planes   ：停机坪上的战机 { x }，走近按 E 登机
   goal     ：终点旗 { x } */
window.WORLD_MAP = {
  width: 14000,
  groundY: 600,
  spawn: { x: 220 },
  platforms: [
    { x: 700,  y: 490, w: 192 }, { x: 960,  y: 400, w: 192 }, { x: 1240, y: 490, w: 256 },
    { x: 2000, y: 480, w: 320 }, { x: 2420, y: 380, w: 192 },
    { x: 3300, y: 500, w: 128 }, { x: 3520, y: 410, w: 128 }, { x: 3740, y: 320, w: 128 }, { x: 3960, y: 410, w: 192 },
    { x: 4700, y: 480, w: 384 }, { x: 5300, y: 400, w: 192 }, { x: 5600, y: 490, w: 192 },
    { x: 6300, y: 480, w: 256 }, { x: 6620, y: 380, w: 256 },
    /* 爬塔段：之字形向上，需要二段跳 */
    { x: 6930, y: 480, w: 128 }, { x: 7130, y: 360, w: 128 }, { x: 6930, y: 240, w: 128 }, { x: 7130, y: 120, w: 128 },
    { x: 6930, y: 0, w: 128 }, { x: 7130, y: -120, w: 128 }, { x: 6990, y: -250, w: 224 },
    /* 空军基地之后：靶场 → 高台 → 空战区 */
    { x: 10100, y: 490, w: 192 }, { x: 10380, y: 400, w: 192 }, { x: 10660, y: 490, w: 256 },
    { x: 11300, y: 470, w: 320 }, { x: 11800, y: 380, w: 192 }, { x: 12300, y: 480, w: 256 }, { x: 12700, y: 400, w: 192 }
  ],
  dummies: [
    { x: 1150 }, { x: 800, y: 490 }, { x: 1060, y: 400 }, { x: 1700 }, { x: 2160, y: 480 }, { x: 2520, y: 380 },
    { x: 2900 }, { x: 3020 }, { x: 3780, y: 320 }, { x: 4400 }, { x: 4900, y: 480 }, { x: 5400, y: 400 },
    { x: 5900 }, { x: 6000 },
    /* 载具试驾区：两段地面木桩阵 */
    { x: 3150 }, { x: 3250 }, { x: 3380 }, { x: 3600 }, { x: 3700 }, { x: 3880 }, { x: 5150 }, { x: 5230 }, { x: 5320 }, { x: 5600 }, { x: 5700 }, { x: 6420, y: 480 }, { x: 6740, y: 380 }, { x: 7200, y: 360 }, { x: 7180, y: 120 }, { x: 7100, y: -250 },
    /* 轰炸靶场：地面木桩阵，用炸弹成片炸 */
    { x: 8300 }, { x: 8380 }, { x: 8460 }, { x: 8600 }, { x: 8680 }, { x: 8800 }, { x: 8900 }, { x: 9000 }, { x: 9120 }, { x: 9200 }, { x: 9300 }, { x: 9420 }, { x: 9540 }, { x: 9640 },
    { x: 10200, y: 490 }, { x: 10450, y: 400 }, { x: 10780, y: 490 }, { x: 11460, y: 470 }, { x: 11900, y: 380 }, { x: 12420, y: 480 }, { x: 12800, y: 400 },
    { x: 11600 }, { x: 11700 }, { x: 12000 }, { x: 12100 }, { x: 12600 }, { x: 12950 }, { x: 13100 }, { x: 13200 }
  ],
  signs: [
    { x: 420,  text: '起点' },
    { x: 1900, text: '前方 · 平台区' },
    { x: 2480, text: '载具 · 按 E 上车' },
    { x: 3100, text: '木桩阵' },
    { x: 4300, text: '高台 →' },
    { x: 5800, text: '前方 · 爬塔段' },
    { x: 6860, text: '爬塔 · 二段跳' },
    { x: 7560, text: '空军基地 →' },
    { x: 7660, text: '战机 · 按 E 登机' },
    { x: 8200, text: '轰炸靶场' },
    { x: 9800, text: '空战区 →' },
    { x: 13300, text: '终点站 300 m' }
  ],
  /* 小怪：{ type: slime(史莱姆，追着咬)|bat(蝙蝠，飞着俯冲)|shooter(毒花，远程吐弹), x, y }  y 省略 = 地面（bat 的 y 是飞行高度） */
  mobs: [
    { type: 'slime', x: 1000 }, { type: 'slime', x: 1500 }, { type: 'bat', x: 1800, y: 400 }, { type: 'slime', x: 2250 },
    { type: 'shooter', x: 2850 }, { type: 'bat', x: 2900, y: 380 }, { type: 'slime', x: 3450 }, { type: 'shooter', x: 3500 },
    { type: 'bat', x: 3650, y: 300 }, { type: 'slime', x: 4100 }, { type: 'shooter', x: 4250 }, { type: 'slime', x: 4600 },
    { type: 'bat', x: 4850, y: 380 }, { type: 'shooter', x: 5050 }, { type: 'slime', x: 5400, y: 400 }, { type: 'bat', x: 5700, y: 360 },
    { type: 'slime', x: 6100 }, { type: 'shooter', x: 6200 }, { type: 'bat', x: 6500, y: 330 }, { type: 'slime', x: 6700, y: 380 },
    { type: 'bat', x: 7200, y: 260 }, { type: 'shooter', x: 7000 },
    /* 靶场与空战区的地面/空中小怪 */
    { type: 'shooter', x: 8350 }, { type: 'slime', x: 8500 }, { type: 'slime', x: 8750 }, { type: 'shooter', x: 8950 }, { type: 'slime', x: 9050 }, { type: 'shooter', x: 9250 },
    { type: 'bat', x: 9900, y: 380 }, { type: 'bat', x: 10500, y: 300 }, { type: 'bat', x: 11200, y: 360 }, { type: 'bat', x: 12000, y: 300 }, { type: 'bat', x: 12900, y: 340 },
    { type: 'shooter', x: 11500 }, { type: 'shooter', x: 12200 }, { type: 'slime', x: 11800 }, { type: 'slime', x: 12700 },
    /* 空中目标：balloon(气球，1 血，纯靶子)|drone(无人机，来回巡逻还会打你)|blimp(飞艇，6 血，大靶子)；y 是目标底边高度（地面 600） */
    { type: 'balloon', x: 900, y: 300 }, { type: 'balloon', x: 1500, y: 260 }, { type: 'balloon', x: 2100, y: 230 }, { type: 'balloon', x: 2700, y: 300 },
    { type: 'balloon', x: 3300, y: 250 }, { type: 'balloon', x: 4000, y: 200 }, { type: 'balloon', x: 4550, y: 300 }, { type: 'balloon', x: 5200, y: 240 },
    { type: 'balloon', x: 5900, y: 270 }, { type: 'balloon', x: 6500, y: 200 },
    { type: 'drone', x: 1900, y: 300 }, { type: 'drone', x: 3000, y: 260 }, { type: 'drone', x: 4200, y: 280 }, { type: 'drone', x: 5500, y: 260 }, { type: 'drone', x: 6200, y: 300 },
    { type: 'blimp', x: 4400, y: 150 }, { type: 'blimp', x: 6600, y: 120 },
    { type: 'drone', x: 8600, y: 300 }, { type: 'drone', x: 9200, y: 240 }, { type: 'drone', x: 9800, y: 300 }, { type: 'drone', x: 10400, y: 200 }, { type: 'drone', x: 11000, y: 300 },
    { type: 'drone', x: 11600, y: 240 }, { type: 'drone', x: 12200, y: 300 }, { type: 'drone', x: 12800, y: 220 }, { type: 'drone', x: 13200, y: 300 },
    { type: 'blimp', x: 9000, y: 160 }, { type: 'blimp', x: 10500, y: 140 }, { type: 'blimp', x: 12000, y: 150 }, { type: 'blimp', x: 13000, y: 170 }
  ],
  /* 道具：{ type: heal(+30 血)|shield(+25 盾), x, y }  y 省略 = 地面；拾取后 25 秒刷新；小怪被击倒也会掉落 */
  pickups: [
    { type: 'shield', x: 900 }, { type: 'heal', x: 1300 }, { type: 'shield', x: 2200 }, { type: 'heal', x: 2550 },
    { type: 'heal', x: 3250 }, { type: 'shield', x: 3600 }, { type: 'heal', x: 4000 }, { type: 'shield', x: 4800 },
    { type: 'heal', x: 5150 }, { type: 'shield', x: 6000 }, { type: 'heal', x: 6400 }, { type: 'heal', x: 7160, y: 360 },
    { type: 'shield', x: 7000, y: 120 },
    { type: 'heal', x: 7700 }, { type: 'shield', x: 8450 }, { type: 'heal', x: 9500 }, { type: 'shield', x: 10300, y: 400 }, { type: 'heal', x: 11300 },
    { type: 'shield', x: 12200 }, { type: 'heal', x: 13000 }
  ],
  /* 载具：{ x } 停在地面上，走近按 E 上车 */
  vehicles: [{ x: 2640 }],
  planes: [{ x: 7900 }],
  goal: { x: 13600 }
};

/* 空中靶子带：每 200 px 一个气球，高度错落（用程序生成，省得手写一排） */
(function (M) {
  for (var x = 8100, i = 0; x <= 13300; x += 200, i++) M.mobs.push({ type: 'balloon', x: x, y: 160 + (i * 89) % 260 });
})(window.WORLD_MAP);
