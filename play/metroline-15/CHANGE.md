# CHANGE.md —— 项目结构与扩展指南（给后续维护者 / 其它 AI 看）

> 本文件不是更新日志。玩家可见的更新日志是 `changelog.txt`（见下文"更新日志"一节）。
> 本文件说明：这个项目是什么、每个文件夹/文件做什么、想加新内容时该改哪些文件。

---

## 1. 项目概述

**15号线大冒险（metroline-15）** 是一个纯前端的 2D 横版平台动作游戏，运行在浏览器里。

- **技术栈**：原生 HTML + Canvas + 原生 JavaScript（ES5 风格，IIFE，无构建、无打包、无框架、无 npm 依赖）。所有脚本通过 `index.html` 里的 `<script>` 标签按**固定顺序**加载，靠全局变量互相引用（`window.L15`、`window.GFX`、`window.Meta`、`window.DLCX` 等）。顺序错了就会报 undefined。
- **运行方式**：直接双击 `index.html`（`file://` 也能跑），或放到任何静态服务器。`open-local.bat` 会先生成更新日志数据再打开游戏。
- **题材**：中学物理老师放学后在 15 号线地铁站等末班车，闯入风雪世界，一路点亮熄灭的信标。知识点（惯性、浮力、电磁……）被做进玩法和答题终端里。
- **内容构成**：
  - **主线**：4 章 × 6 关 = 24 个房间（`c1-01 … c4-06`），每章最后一关是 Boss，收集物是"晶体/信标碎片"（`shard`）。
  - **DLC「未竟之梦 · 深渊回响」**：3 部分 × 4 关 = 12 个房间（`d1-01 … d3-04`），最后一关是三阶段 Boss「悖论」，收集物是蓝色碎片（`blueshard`）。主线收集 100 枚碎片解锁。
  - **DLC「地铁历险」**：1 个场景 `metro1`，4 个长关（`metro1-01 … metro1-04`），每关 6 节车厢，收集物是黄色水晶（`yellowshard`）。主线收集 150 枚碎片解锁。目前是框架版（版本 0.1）。
- **画面与声音**：画面几乎全部**程序化绘制**（Canvas 代码画出贴图、角色、背景），不依赖图片；音效全部程序合成；背景音乐优先播放 `assets/audio/*.mp3`，缺失则用同 BPM 的合成曲兜底。`assets/` 里放同名文件可以覆盖内置画面/音乐（见 `js/assets.js`）。
- **存档**：全部在浏览器 `localStorage`（3 个存档位 + 全局元数据），可导出/导入 `.json`。
- **配套工具**：`editor.html` 是**关卡工坊**（可视化关卡编辑器），发布后的主线/DLC 数据存在 `localStorage`，运行时**优先于**源码里的默认战役。

### 核心数据模型（理解整个项目的关键）

| 概念 | 说明 |
|---|---|
| **关卡（level）** | `{name,width,height,background,objective,intro,cells,objects,links}`。`cells` 是二维数组（行×列），每格一个地块编号；`objects` 是物件列表；`links` 是 `{from,to}` 连线（开关→闸门）。单位是"格"，1 格 = 32 像素（`L15.T`）。 |
| **地块编号** | `L15.CELL`：`ground:1` 地面、`thin:2` 薄地板（可下穿）、`bounce:3` 弹跳菌、`brick:4` 石砖、`ice:5` 冰面。0 = 空。 |
| **物件（object）** | `{id,type,kind,x,y,w,h,label,dialogue,props}`。`kind` 是种类名（`slime`、`spikes`、`gate`……），`type` 是它所属分组。 |
| **物件目录 `L15.CAT / L15.INFO`** | 在 `js/data/defs.js`。每个种类一条 `K(分组,种类名,中文名,图标,颜色,默认宽,默认高,默认props)`。**一个种类必须先在这里登记，工坊、关卡构建器、校验工具才认得它。** |
| **生物群系/背景 `L15.BIOMES`** | 也在 `defs.js`：天空渐变、远近景色、配色、音乐名、BPM、天气。关卡的 `background` 字段填这里的键名。自定义主题键名以 `t_` 开头，通过 `L15.registerThemes()` 注册（可继承某个内置主题）。 |
| **战役（campaign）** | `{chapters:[{id,name,biome,intro,outro,levels}],prologue,epilogue,...}`。主线是 `window.CAMPAIGN_DEFAULT`，DLC 是 `window.CAMPAIGN_DLC` / `window.CAMPAIGN_SUBWAY`。 |
| **关卡注册** | 每个房间文件调用 `L15.addLevel('章id', 序号, 关卡数据)`，存进 `L15.LEVELS[章id][序号-1]`。战役文件再用 `L15.LEVELS[章id]` 把关卡拼进章节。**文件加载顺序不影响关卡顺序，序号才决定。** |
| **DLC 注册表** | `window.DLC_REGISTRY`（`js/dlc-registry.js`）：DLC 的名称、简介、解锁条件、对应的战役变量名 `campaignId`。 |

---

## 2. 目录与文件说明

### 根目录

| 文件 | 作用 |
|---|---|
| `index.html` | **游戏入口**。包含全部界面 DOM（标题、菜单、存档页、图鉴页、对话框、触屏按钮等）以及**脚本加载顺序**。新增任何 JS 文件/关卡文件都要在这里加 `<script>`。 |
| `editor.html` | **关卡工坊入口**。结构同上，加载的数据脚本是 `index.html` 的子集（没有 audio/meta/dlc-engine/game.js），再加载 `editor/` 下的脚本。**新增关卡文件时 `index.html` 和 `editor.html` 两边都要加。** |
| `perfect.html` | 辅助页：生成"完美存档"`.json`（主线全解锁、全碎片、已通关；「未竟之梦」的蓝色碎片、「地铁历险」的黄色水晶也全部收集）供测试用。它自己用 `document.write` 写死了脚本和关卡文件名（`c1..c4` 各 6 关、`d1..d3` 各 4 关、`metro1` 4 关、`metro-kit`、各战役文件）。**新增关卡/章节/DLC 后，如果希望完美存档包含，要改这里。** |
| `README.md` | 面向玩家/部署者的说明：运行方式、操作键位、合并版内容、音乐清单。 |
| `changelog.txt` | **玩家可见更新日志**（Markdown）。游戏主菜单"更新日志"读取它。 |
| `open-local.bat` | Windows 一键启动：先运行 `node tools\build-changelog.js`，再用浏览器打开 `index.html`。需要装有 Node.js。 |
| `CHANGE.md` | 本文件。 |

### `css/`
| 文件 | 作用 |
|---|---|
| `style.css` | 游戏全部基础界面样式（标题、菜单、对话框、触屏布局、存档/图鉴页等）。 |
| `dlc-styles.css` | DLC 大厅/DLC 详情/章节选择界面样式。 |

### `js/`（游戏运行时代码）

| 文件 | 作用 |
|---|---|
| `data/defs.js` | **全局基石 `window.L15`**：站名/线名/主角名、`REV`（数据版本号）、地块编号、`BIOMES`（背景主题）、`CAT/INFO`（物件目录）、`GROUPS`（工坊分组）、`WEATHER`（天气粒子）、`registerThemes`、`STORAGE`（localStorage 键名）、`blankLevel`。几乎所有"新种类/新背景"都从这里开始。 |
| `data/level-builder.js` | 关卡构建器 `L15.R(名称,背景,宽,高,目标,开场,function(b){...})`：用 `b.fill / b.floors / b.plat / b.plats / b.o / b.on / b.each / b.link / b.base` 用代码生成关卡数据；同时定义 `L15.S`（对话拼接）和 `L15.addLevel`。 |
| `data/dlc-kit.js` | 「未竟之梦」专用关卡积木 `L15.KIT`：分层竖井 `shaft`、答题密室 `cache`、答题门 `door`、混沌地形碎片 `chunk`、混沌关装配 `chaos`。 |
| `data/metro-kit.js` | 「地铁历险」专用积木 `L15.metroLevel(...)`：用"车厢列表"拼出 6 节车厢的长关；车厢类型 `plain/spikes/laser/belt/saw/mix`。 |
| `levels/c1-01.js … c4-06.js` | **主线 24 个房间**，一间一个文件。`c1` 雪原、`c2` 森林、`c3` 地下洞窟、`c4` 熔岩（最短，用 `R()` 手写）。每章第 6 关是 Boss。 |
| `levels/d1-01.js … d3-04.js` | **「未竟之梦」12 个房间**（工坊发布后导出的整块 JSON 数据，文件很大）。`d1` 冰洞、`d2` 实验室、`d3` 混沌（含 Boss「悖论」）。 |
| `levels/metro1-01.js … metro1-04.js` | **「地铁历险」4 个关卡**，每个只有几行：调用 `L15.metroLevel` 并给出车厢列表和 NPC 台词。 |
| `data/campaign.js` | **主线战役** `CAMPAIGN_DEFAULT`：4 章的名称/副标题/背景/章节剧情，序章、结局。 |
| `data/dlc-campaign.js` | **「未竟之梦」战役** `CAMPAIGN_DLC`：3 个部分的剧情、序章、结局。 |
| `data/dlc-subway.js` | **「地铁历险」战役** `CAMPAIGN_SUBWAY`：自定义主题 `t_m1…t_m4`（黄昏/夜郊/隧道/黎明）、剧情、结局文案、黄色水晶命名。 |
| `dlc-registry.js` | DLC 注册表 `DLC_REGISTRY`、解锁判断 `checkDLCUnlock / getDLCUnlockStatus`、`getDLCCampaign`（工坊发布版优先，其次源码战役）。还会合并工坊保存的自定义 DLC（`localStorage: dlc_registry`）。 |
| `data/codex.js` | 图鉴条目与成就定义 `L15_META_DATA`（`CODEX`、`ACH`）。图鉴只显示"主线里出现过"的条目。 |
| `game.js` | **游戏主引擎**（最大的文件）：房间构建 `buildRoom`、玩家物理与战斗 `updatePlayer`、机关 `updateMech`、敌人 AI `updateEnemies`、Boss `updateBoss`、危险物 `updateHazards`、摄像机、渲染、剧情/对话、存档流程、菜单、主循环。内置物件/敌人的**行为逻辑**在这里。 |
| `dlc-engine.js` | **DLC 玩法扩展 `window.DLCX`**。`game.js` 在关键位置调用它的钩子（`build / initEnemy / ENEMY / update / drawWorld / drawScreen / hitBoss / updateBoss / quiz / onTalk …`）。蓝色碎片、物理机关（电弧、等离子、冷冻陷阱、引力井、电磁场）、DLC 敌人（无人机、探针、哨兵、幽灵、异常体）、物理答题终端、Boss「悖论」都在这里。 |
| `dlc.js` | DLC **界面**：DLC 大厅、单个 DLC 详情、DLC 章节选择。 |
| `gfx.js` | 画面（一）：公共绘图工具（`GFX.mk/ell/poly/glow/B`）、地块贴图 `GFX.tiles`、背景、主角、基础角色。 |
| `gfx2.js` | 画面（二）：基础敌人 `GFX.enemy`、Boss `GFX.boss`、机关/障碍/装饰物 `GFX.thing`、剧情场景 `GFX.scene`。 |
| `gfx3.js` | 画面（三）：黑板（物理公式）、横幅旗装饰；"同事老师"NPC；粉笔弹道。 |
| `gfx4.js` | 画面（四）：DLC 的物件（`X`）、敌人（`E`）、Boss「悖论」、NPC（`NPCX`）。**它重写了 `G.thing / G.enemy / G.boss / G.npc`：先查 DLC 表，查不到才回落到前面 gfx 里的旧实现。** |
| `assets.js` | 素材覆盖系统：自动识别 `assets/textures`、`assets/audio`，用外部图片/音频替换程序绘制/合成。命名规则写在文件头注释里。 |
| `audio.js` | 音乐与音效（`window.AudioFX`）：按文件名播放 mp3，缺失则合成；音乐以文件名为身份，同一首跨关不重播。 |
| `meta.js` | 元数据（纯逻辑）：3 个存档槽、碎片/蓝色碎片统计、图鉴"已见过"、成就判定。 |
| `meta-ui.js` | 存档页/成就·晶体页/图鉴页的界面渲染。 |
| `savefile.js` | 单个存档位的导出/导入 `.json`。 |
| `changelog.js` | 更新日志的 Markdown 渲染器（读 `changelog.txt`，`file://` 下读 `changelog-data.js`）。 |
| `changelog-data.js` | **自动生成，勿手改**。由 `tools/build-changelog.js` 从 `changelog.txt` 生成，供双击打开时使用。 |

### `editor/`（关卡工坊）
| 文件 | 作用 |
|---|---|
| `editor.js` | 工坊主体（最大）：画布编辑、物件放置、连线、属性面板、章节/剧情编辑、试玩、发布、导入导出、密码、草稿。 |
| `editor.css` | 工坊样式。 |
| `editor-dlc.js` / `editor-dlc.css` | 工坊里的 DLC 管理（创建/编辑 DLC、注册表、发布 DLC 战役）。 |

### `assets/`
| 路径 | 作用 |
|---|---|
| `assets.json` | 素材清单，目前是空的 `{"textures":[],"audio":[]}`。 |
| `zyj.png` | 主角的脸（头像贴图）。缺失时用默认脸。 |
| `audio/*.mp3` | 背景音乐。**文件名 = 曲名，末尾数字 = BPM**，`defs.js` 的 `BIOMES[x].music` 和 `BOSS_MUSIC` 用文件名（不含扩展名）引用它们。目录里有的曲子比 `README.md` 列的多（含 `Final Boss Phase One/Three`、`Lab`、`Ice Cave`、`Flower Castle`、`Cyprus Two Theme` 等），每个主题具体用哪首以 `defs.js` 为准。 |
| `textures/` | 自定义贴图目录（目前只有占位，没有文件）。 |

### `tools/`
| 文件 | 作用 |
|---|---|
| `validate.js` | 关卡静态检查（需 Node）：`node tools/validate.js`。检查越界、缺出生点/出口、闸门没连开关、碎片嵌进地块、未知物件种类、保守的可达性（出生点能否走到出口/碎片/开关）。**只检查主线 + 「未竟之梦」，不检查「地铁历险」。** |
| `build-changelog.js` | 把 `changelog.txt` 转成 `js/changelog-data.js`。改完 `changelog.txt` 后运行 `node tools/build-changelog.js`。 |

---

## 3. 扩展指南：想做 X，需要改哪些文件

> 通用提醒：
> 1. 新增/删除任何 `.js` 文件，都要同步改 `index.html`（以及 `editor.html`，如果工坊也要用）里的 `<script>`，并注意**加载顺序**（被依赖的先加载）。
> 2. 改了关卡/物件的数据格式，要把 `defs.js` 里的 `REV` 加 1（战役会带 `rev:L15.REV`，用于判断工坊发布的数据是否过期）。
> 3. 改完关卡后运行 `node tools/validate.js`，再进游戏实际试玩。
> 4. 玩家可见的变化写进 `changelog.txt`，然后运行 `node tools/build-changelog.js`。

### 3.1 加一个新关卡（主线）
1. 新建 `js/levels/cN-0M.js`，里面 `L15.addLevel('cN', M, R(...))`（可参考 `c4-01.js`，手写；或 `d1-01.js`，工坊导出的大块 JSON）。
2. 在 `index.html` 和 `editor.html` 的关卡 `<script>` 列表加一行。
3. 主线要求每章 6 关且只有最后一关有 Boss（`validate.js` 会检查）。如果想改这个规则，改 `validate.js` 的判断以及 `campaign.js`。
4. 新增关卡数量变了，旧存档的 `sig`（各章关卡数组成的签名）会不匹配，注意存档兼容。
5. 要让 `perfect.html` 生成的完美存档包含它：改 `perfect.html` 顶部的文件列表。
6. 另一种方式：在**关卡工坊**里画好，点"发布到游戏"（存 `localStorage`，不改源码）；要变成源码，用"导出本关"得到 JSON，再包成 `L15.addLevel(...)` 文件。

### 3.2 加一章（主线）
1. 按 3.1 创建该章各关文件。
2. `js/data/campaign.js`：在 `CHAPTERS` 里加一项 `{id,name,subtitle,biome,intro,outro,levels}`。
3. 如果这章用新背景，见 3.4。
4. 音乐：`defs.js` 的 `BIOMES[biome].music` 指向 `assets/audio/` 里的 mp3（或不放，用合成曲）。
5. `js/data/codex.js`：如需图鉴/成就更新。`validate.js` 和 `perfect.html` 里写死的 `c1..c4` 也要改。

### 3.3 加一个新 DLC（完整流程）
参考现有两个 DLC：「未竟之梦」（完整）和「地铁历险」（最小）。

1. **关卡文件**：`js/levels/` 下新建，章 id 用新前缀（如 `e1-01.js`，里面 `L15.addLevel('e1',1,...)`）。若是车厢类/重复结构的关卡，可参照 `metro-kit.js` 写一个专用积木文件放在 `js/data/`。
2. **战役文件**：新建 `js/data/dlc-xxx.js`，参考 `dlc-subway.js`：
   - 定义主题（如需新背景）并 `L15.registerThemes(THEMES)`；
   - 定义章节数组，`c.levels = L15.LEVELS[章id]`；
   - 定义 `window.CAMPAIGN_XXX = {format:'line15-campaign', version:3, rev:L15.REV, name, isDLC:true, themes, unlockCondition, prologue, chapters, epilogue, ending}`；
   - `L15.DLC_CAMPAIGNS.push(window.CAMPAIGN_XXX)`。
3. **注册**：`js/dlc-registry.js` 的 `DLC_REGISTRY` 数组加一项：`id、name、subtitle、description、icon、unlockCondition({type:'shards',required:N,campaign:'DEFAULT'})、campaignId:'CAMPAIGN_XXX'、chapters、levels、features、difficulty、estimatedTime、version、releaseDate、author`。
4. **加载**：`index.html`（与 `editor.html`）按顺序加入：关卡文件 → 积木文件（如有，必须在关卡文件前）→ 战役文件 → 位于 `dlc-registry.js` 之前。
5. **专属收集物**（如"黄色水晶"这类）：
   - `defs.js` 的 `CAT` 加种类；
   - `js/dlc-engine.js` 的 `build()` 里把它加进和 `blueshard / yellowshard` 同一个 `case`；
   - `js/gfx4.js` 的 `X` 表加绘制；
   - `js/meta.js` 里统计蓝色碎片/水晶的地方（约第 52 行）要把新种类算进去；
   - `validate.js` 里 `blueshard` 的判断按需扩展。
6. **新玩法/敌人/机关**：见 3.5–3.7。
7. **图鉴/成就**：`js/data/codex.js`。
8. **测试**：`perfect.html` 的文件列表、`validate.js` 里的战役列表（目前只有主线和 `CAMPAIGN_DLC`）。

### 3.4 加一个新背景/主题（地图外观）
- **只想换配色**：在某个战役文件里仿照 `dlc-subway.js` 写：
  ```js
  var THEMES={ t_xxx:{name:'名称', base:'metro', sky:['#上','#下'], far:'#', mid:'#', top:'#', body:'#', dark:'#', accent:'#', glow:'#', music:'曲名 BPM', bpm:120, weather:'snow'} };
  L15.registerThemes(THEMES);
  ```
  主题键必须以 `t_` 开头；颜色必须是 `#rrggbb`；`base` 指向已有内置主题以继承其余属性和绘制方式。然后关卡的 `background`（以及章节的 `biome`）填 `t_xxx`，并把 `themes:THEMES` 放进战役对象。
- **想要全新的内置背景**（有自己的天空、远景绘制、地块外观、天气）：
  - `js/data/defs.js`：`BIOMES` 加一项；`WEATHER` 加同名天气；
  - `js/gfx.js`：背景、地块贴图 `GFX.tiles(biome)` 按 biome 取色/绘制的地方要加分支；
  - `js/gfx2.js`：`G.scene` 里剧情场景（`'场景|文字'` 里的场景名）；
  - 音乐：`assets/audio/` 放 mp3 并让 `music` 指向它；`audio.js` 里没有对应文件时会按 BPM 合成；
  - 外部贴图覆盖：`assets/textures/ground_<主题名>.png` 等（见 `assets.js` 头部注释）。
- 工坊的背景下拉框也来自 `L15.BIOMES`，通常不用额外改。

### 3.5 加一个新障碍物 / 机关
1. `js/data/defs.js` → `CAT` 加一条 `K('hazard'|'mechanism', '种类名', '中文名', '图标', '#颜色', 宽, 高, {默认props})`。这一步之后，工坊、`R()` 的 `b.o('种类名',...)`、`validate.js` 才认识它。
2. **画法**：
   - 主线风格：`js/gfx2.js` 的 `G.thing` 里按 `o.kind` 加分支；
   - DLC 风格：`js/gfx4.js` 的 `X` 表加 `种类名:function(g,o,t){...}`（会优先于 gfx2）。
3. **行为**（碰到会怎样 / 怎么动）：
   - 通用障碍 / 伤害判定：`js/game.js` 的 `buildRoom`（把物件放进对应列表）、`updateHazards`、`updateMech`；
   - 若要做在 DLC 里（不想动 `game.js`）：在 `js/dlc-engine.js` 的 `build()` 登记到 `r.xthings / r.xhaz / r.fields`，然后在 `DLCX.update` / 伤害判定里实现。参考 `voltarc / plasma / cryotrap / gravwell`。
4. **图鉴**：`js/data/codex.js` 的 `CODEX` 加 `{k:'种类名',cat:'hazard',n:'名称',d:'描述'}`。
5. **放进关卡**：在关卡文件里用 `b.o('种类名',x,y,{props})`，或在工坊里放置。
6. 如果参与可达性/嵌入检查，看 `tools/validate.js` 是否需要识别。
7. 想加专属贴图覆盖：`assets/textures/<种类名>.png`（`assets.js` 自动识别，可选）。

### 3.6 加一个新怪物
1. `defs.js` → `CAT` 加 `K('enemy','种类名','名称','图标','#颜色',宽,高,{hp:..,range:..,speed:..})`。
2. **AI 与属性**：
   - 主线怪：`js/game.js` 的 `makeEnemy`（约第 125 行：初始化 hp/速度，并调用 `DLCX.initEnemy`）与 `updateEnemies`（按 `e.kind` 写移动/攻击逻辑）；
   - DLC 怪：`js/dlc-engine.js` ——把种类名加进 `ENEMY_KINDS`，在 `initEnemy` 里设初始属性，在 `DLCX.ENEMY[种类名] = function(e,dt,ctx){...}` 里写每帧行为（`ctx` 含玩家/怪物中心、距离）。参考 `drone / probe / sentinel / wraith / anomaly`。
3. **画法**：
   - 主线风格：`js/gfx2.js` 的 `G.enemy` 加 `else if(k==='种类名')`；
   - DLC 风格：`js/gfx4.js` 的 `E` 表加 `种类名:function(g,e,t){...}`。
4. **图鉴**：`js/data/codex.js` 的 `CODEX` 加 `cat:'creature'` 条目；需要成就（击杀数等）则加 `ACH`。
5. **放进关卡**：`b.on('种类名',x,地面行,{range:..,hp:..})`（`on` 会自动让底部贴地）。
6. 若想让外部素材替换其外观：`assets/textures/<种类名>.png`。
7. 若需新攻击/弹道：`game.js` 的子弹/粉笔/教鞭弹反相关逻辑（`updateChalk` 等）。

### 3.7 加一个新 Boss
1. `defs.js` → `CAT` 里已有 `boss` 种类（`props.boss` 区分类型，如 `ice/root/spore/lava/paradox`）。
2. `game.js`：`makeBoss`、`updateBoss`（主线 Boss 阶段与攻击）；DLC Boss 则像"悖论"那样走 `DLCX.updateBoss / hitBoss / drawBossHud`（`game.js` 里判断 `b.type==='paradox'`，新 Boss 要加同类分支）。
3. 画法：`gfx2.js` 的 `G.boss` 或 `gfx4.js` 的 `G.boss`。
4. 音乐：`defs.js` 的 `BOSS_MUSIC`（或主题的 `bossMusic`）。
5. 图鉴：`codex.js` 里用 `boss_<类型>` 键。
6. 规则：主线每章最后一关放 Boss，DLC 只在最后一章最后一关放（`validate.js` 会检查，必要时改）。

### 3.8 加一张新地图 / 新地形
- 改 `cells`：用 `b.fill / b.floors / b.plat / b.plats`（`level-builder.js`）；或在工坊里画，再导出。
- 新**地块类型**（比如新的可踩/可碰材质）：`defs.js` 的 `CELL` 加编号；`game.js` 的碰撞（`bakeTiles` 烘焙、实体判定）和各处 `solid()` 判断；`gfx.js` 的 `GFX.tiles` 画地块；`tools/validate.js` 里 `solid()`；工坊 `editor/editor.js` 里地块面板。**这是改动面最大的一类，慎做。**
- 整关通顶、多层竖井、车厢这类结构化地图：看 `dlc-kit.js`、`metro-kit.js` 的做法，把"骨架"封装成积木函数。
- 关卡尺寸 `width × height` 可任意，但很高/很宽的关卡会让 `.js` 文件很大（`d3-04.js` 约 90KB）。

### 3.9 加新剧情 / 对话
- 章节开场/结尾：战役文件里的 `intro / outro / prologue / epilogue`，格式 `'场景|文字'`。场景名：`school / station / snow / forest / underground / lava / train` 以及 DLC 的 `icecave / lab / chaos` 或自定义主题名。
- 对话：`'说话人：内容|说话人：内容'`，说话人为"我"时显示老师头像。关卡里放 NPC/路牌，对话写进 `dialogue`（`b.on(npc, ..., {}, {say:S('句1','句2')})`）。
- 物理答题终端：`sign` 的 `say` 以特定格式（由 `DLCX.isQuiz` 识别）写成题目，见 `dlc-engine.js` 与 `dlc-kit.js` 的 `cache / door`。

### 3.10 加新音乐
- 把 `名称 BPM.mp3` 放到 `assets/audio/`；在 `defs.js` 的 `BIOMES[...].music`（或 `BOSS_MUSIC`）写同样的名字（不含 `.mp3`）。无需改 `audio.js`。

### 3.11 加成就 / 图鉴条目
- `js/data/codex.js`：`CODEX`（图鉴）与 `ACH`（成就）；成就的计数来源是 `Meta.cnt(...)`，计数点在 `game.js` / `dlc-engine.js`；判定在 `js/meta.js`。

### 3.12 更新站名 / 线路名 / 主角名
- 只改 `js/data/defs.js` 顶部的 `STATION / LINE / HERO`。

### 3.13 发布新版本时
1. 编辑 `changelog.txt`，在最上面加 `## vX.Y.Z` 一节。
2. 运行 `node tools/build-changelog.js`（或用 `open-local.bat`）重新生成 `js/changelog-data.js`。
3. 改了数据格式则增加 `defs.js` 的 `REV`。

---

## 4. localStorage 键（排查存档问题用）

| 键 | 内容 |
|---|---|
| `line15-campaign-v3` | 工坊发布的主线（覆盖源码默认主线） |
| `line15-test-level-v3` | 工坊"试玩本关"的临时关卡 |
| `line15-save-v3` | 旧版单存档（会被迁移到存档位 1） |
| `line15-prefs-v3` | 设置（触屏布局、音量等） |
| `line15-slots-v4` | 3 个存档位 |
| `line15-meta-v4` | 全局元数据（碎片、图鉴、成就、DLC 进度） |
| `line15-dlc-campaign-<dlcId>` | 工坊发布的某个 DLC 战役（优先于源码） |
| `dlc_registry` / `dlc_registry_deleted` | 工坊里新增/覆盖/删除的 DLC 注册信息 |

**常见坑**：改了源码里的关卡但游戏里没变化 → 多半是 `localStorage` 里有工坊发布的版本在覆盖，到工坊"恢复默认"，或清除上述键。

---

## 5. 已知问题 / 注意事项（接手前先看）

- 已清理：删除了没有任何 HTML 引用的 `js/dlc-logic.js`、`editor/editor-dlc-new.js` 和空壳的顶层 `levels/` 文件夹（均可从 git 历史恢复）。
- `README.md` 里"5 首音乐""24 个房间"等描述是合并版时写的，没有反映后来加入的 DLC 与更多音乐文件。
- `tools/validate.js` 不覆盖「地铁历险」；新增关卡后记得自己检查。
- 蓝色碎片/黄色水晶的存档键是 `'dlc'+章序号+'-'+关序号`（`game.js` 的 `collectBlue`、`meta.js` 的 `blueShardInfo`），**不区分是哪个 DLC**，所以「未竟之梦」和「地铁历险」会共用同一批键（物件 id 不同所以暂时不冲突）。再加 DLC 时要注意，必要时给键加上 DLC id。
- 项目没有自动化测试；验证方式 = `node tools/validate.js` + 浏览器实际试玩。
