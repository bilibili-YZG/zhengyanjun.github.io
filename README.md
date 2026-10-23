# 郑艳军理论 · 双人PK赛

一个以「郑论」为主题的课堂互动双人答题对战网页。两名选手同屏对垒，限时抢答，比拼知识储备与反应速度。

---

## 🎮 玩法说明

- **双人对战**：左右分屏，蓝方（左）与红方（右）各自独立答题。
- **限时答题**：每题 15 秒，超时自动判错，进度条实时显示剩余时间。
- **积分规则**：答对一题得 5 分，答错或超时不扣分。
- **胜负判定**：20 题结束后，得分高者获胜；若得分相同，则用时少者获胜；两者皆同则为平局。
- **结果复盘**：比赛结束后，点击任意位置可查看双方逐题作答详情，包括错题的正确答案与判断思路。

---

## 🕹️ 使用方式

网站提供一个 **启动页**，进入时可以选择两种模式：

| 模式 | 入口文件 | 说明 |
| :--- | :--- | :--- |
| 🎵 有音乐版 | `ZYJPK.html` |
| 🔇 无音乐版 | `ZYJPK-NOMUS.html` |

访问网站根目录（`index.html`）即可看到选择页面。

---

## 📂 文件结构

```
根目录/
├── muspk/                         有音乐版目录
│   ├── elimination.mp3            背景音乐
│   └── index.html                 有音乐版主程序
├── nmuspk/                        无音乐版目录
│   └── index.html                 无音乐版主程序
├── play/                          娱乐小游戏目录（首页 play/index.html 是「小游戏应用库」，四个入口卡片）
│   ├── index.html                 小游戏应用库首页
│   ├── chess/                     斗兽棋
│   │   ├── index.html             主页面
│   │   ├── game.js                核心逻辑
│   │   └── style.css              样式
│   ├── tetris/                    俄罗斯方块
│   │   ├── index.html             主页面
│   │   ├── css/style.css          样式
│   │   ├── js/                    effects.js 特效 · game.js 游戏逻辑 · tetris.js 方块逻辑
│   │   └── assets/zyj.png         图片资源
│   ├── metroline-15/              15号线大冒险（横版平台动作 · 物理老师篇，详细结构见该目录下 CHANGE.md）
│   │   ├── index.html             游戏入口（全部界面 DOM + 脚本加载顺序）
│   │   ├── editor.html            关卡工坊（可视化关卡编辑器）
│   │   ├── promo.html             宣传页
│   │   ├── perfect.html           生成「完美存档」的测试辅助页
│   │   ├── egg-test.html          调试入口：直接进彩蛋房
│   │   ├── strong.html            调试入口：直接进「完全体」倦怠骑士战
│   │   ├── README.md              玩家 / 部署说明（运行、键位、设置、音乐）
│   │   ├── CHANGE.md              项目结构与扩展指南（给维护者）
│   │   ├── changelog.txt          玩家可见更新日志（游戏内「更新日志」读取它）
│   │   ├── 第五章剧情.txt · v1.1.0更新总章.txt   设计与发布说明
│   │   ├── open-local.bat         Windows 一键启动（先生成更新日志数据）
│   │   ├── assets/                zyj.png 主角头像 · audio/*.mp3 背景音乐（文件名末尾数字 = BPM） · textures/ 自定义贴图
│   │   ├── css/                   style.css 游戏界面 · dlc-styles.css DLC 界面
│   │   ├── editor/                关卡工坊的脚本与样式（含 DLC 管理）
│   │   ├── tools/                 validate.js 关卡静态检查 · build-changelog.js 生成 changelog-data.js
│   │   ├── old/                   旧版归档，不再维护
│   │   └── js/
│   │       ├── game.js            游戏主引擎（物理、战斗、敌人、Boss、摄像机、设置与输入、手柄菜单导航）
│   │       ├── audio.js           音乐与音效（音乐 / 音效音量可分开调）
│   │       ├── gfx.js … gfx7.js   全部画面（程序化绘制）：地块 · 角色 · Boss · DLC 物件 · 第五章与骑士造型
│   │       ├── dlc-engine.js      DLC 玩法扩展 DLCX（「未竟之梦」），并转发到下面三个子扩展
│   │       ├── dlc-metro.js · dlc-newyear.js · dlc-ch5.js   「地铁历险」/「雪镇跨年」/ 第五章（含倦怠骑士）玩法
│   │       ├── dlc.js · dlc-registry.js   DLC 大厅界面 · 注册表与解锁判断
│   │       ├── meta.js · meta-ui.js · savefile.js   存档位、成就、图鉴及其界面、存档导入导出
│   │       ├── assets.js · changelog.js · changelog-data.js   素材覆盖 · 更新日志渲染（data 为生成文件，勿手改）
│   │       ├── data/              defs.js 全局定义 · level-builder.js 关卡构建器 · campaign / dlc-*.js 战役 ·
│   │       │                      codex.js 图鉴与成就 · dlc-kit.js / metro-kit.js 关卡积木
│   │       └── levels/            关卡数据，一间一个文件：c1-01…c5-06（主线）· d1-01…d3-04（未竟之梦）·
│   │                              metro1-01…metro4-03（地铁历险）· ny1/ny2（雪镇跨年）· c5-egg（彩蛋房）
│   └── rdbg/                      RDBG 爬塔 · 角色与地图测试（纯 DOM + SVG 渲染，无构建）
│       ├── index.html             入口：「查看动画」「地图测试」（地图测试里再选载具测试 / Boss 测试）
│       ├── character.html         角色动画页（偏写实动漫风的角色立绘与动画）
│       ├── body.jpg · face.png    角色图片
│       └── hero/
│           ├── viewer.html        动画浏览器（待机 / 行走 / 跳跃 / 教鞭 / 粉笔，可看判定框与时间轴）
│           ├── world.html         大地图（?map=boss 进入 Boss 测试）
│           ├── _t.html            内部测试页（标题与 world.html 相同，非正式入口）
│           ├── svg/               角色分件与世界素材（svg/world/ 里是载具、飞机、小怪、地面、背景）
│           ├── css/               hero / viewer / world / controls 样式
│           └── js/
│               ├── hero.js        角色骨骼动画        viewer.js 动画浏览器
│               ├── world.js       大地图主逻辑（输入、物理、战斗、镜头、HUD、载具韧性）
│               ├── map.js         载具测试地图数据     map-boss.js  Boss 测试地图数据
│               ├── vehicle.js · plane.js   装甲车 / 战机的外观与动画
│               ├── controls.js · audio.js  键盘 / 触屏 / 手柄输入与设置面板 · 程序合成音效
│               ├── knight.js      「倦怠骑士（strong 加强版）」，从 metroline-15 原样移植（逻辑、数值、造型）
│               └── boss.js        骑士与 rdbg 世界之间的适配层（坐标换算、伤害、地形、画布特效）
├── _config.yml                    Jekyll 配置，让 README.md 自动渲染
├── 404.html                       404 错误页
├── CNAME                          自定义域名配置
├── README.md                      项目说明文档（本文件）
├── README.html                    README 渲染页（浏览器里直接看美化版）
├── icon.png                       网站图标
├── index.html                     网站首页 / 启动页
├── questions.js                   题库
└── rosters.js                     学生名单
```

> 💡 如需新增或修改题目，只需编辑 `questions.js`，无需改动 HTML 主程序。

---

## 🛠️ 部署方式

本项目托管在 **GitHub Pages**，并通过自定义域名访问。

### 在线访问
- 自定义域名：`[http://zyj.slpd.club/](http://zyj.slpd.club/)`

### 本地运行
直接将整个仓库下载到本地，用浏览器打开 `index.html` 即可，无需任何构建工具。

### 更新流程
1. 在 GitHub 仓库中修改或上传文件。
2. 提交（Commit）后，GitHub Pages 会自动重新部署。
3. 等待 1-2 分钟，刷新网站即可看到更新。

---

## ✏️ 如何新增题目

打开 `questions.js`，在对应的题库数组里，按照下面的格式添加即可：

```javascript
{
  text: "【分类】这里是题干，用 ____ 表示空格。",
  ans: "正确答案",
  opts: ["错误选项1", "错误选项2", "正确答案", "错误选项3"],
  type: "concept",
  source: "练习册：郑艳军.pdf"
}
