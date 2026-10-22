/* 15号线大冒险 · 共享定义：游戏与关卡工坊共用同一份对象目录、生物群系与关卡格式。 */
window.L15=(function(){
var T=32;
/* 故事发生的地铁站：全局只在这里改一次（剧情、站牌、标题页都会跟着变） */
var STATION='15号线地铁站',LINE='15号线',REV=5,HERO='物理老师';
var CELL={ground:1,thin:2,bounce:3,brick:4,ice:5};
var BIOMES={
 snow:{name:'雪原',sky:['#5f95b8','#dcf3fb'],far:'#a9c8d6',mid:'#83abbb',top:'#f4fcff',body:'#8fb5c8',dark:'#5f8aa0',accent:'#74dbe8',glow:'#cfeeff',music:'Foothills 105',bpm:105,weather:'snow'},
 forest:{name:'森林',sky:['#2f7a6c','#bfe6a0'],far:'#3f7d6e',mid:'#2d6a50',top:'#86d05f',body:'#6b4b34',dark:'#432f21',accent:'#b6f28d',glow:'#d9ffb0',music:'Canopy 98',bpm:98,weather:'leaf'},
 underground:{name:'地下洞窟',sky:['#0f2b2e','#2f5f50'],far:'#1c4540',mid:'#1f4d3a',top:'#5fae6f',body:'#35583c',dark:'#1d3326',accent:'#b6ff91',glow:'#9cffc0',music:'Forest Floor 115',bpm:115,weather:'spore'},
 lava:{name:'熔岩洞窟',sky:['#26121f','#8c3b35'],far:'#4a2735',mid:'#66302c',top:'#e0793a',body:'#4c3438',dark:'#2c1d21',accent:'#ffb36a',glow:'#ff8a4a',music:'Red Cave 152',bpm:152,weather:'ember'},
 station:{name:'地铁站',sky:['#0b1a2b','#2a5a6e'],far:'#1d3b4d',mid:'#27566a',top:'#c7d7de',body:'#5d7482',dark:'#34495a',accent:'#b5f6ef',glow:'#bffcf5',music:'Foothills 105',bpm:105,weather:'dust'},
 night:{name:'夜色城市',sky:['#0b1024','#33407a'],far:'#1a2146',mid:'#242a4d',top:'#8fa0e8',body:'#46508a',dark:'#252b52',accent:'#a9b5ff',glow:'#c3ccff',music:'Foothills 105',bpm:105,weather:'dust'},
 icecave:{name:'地下冰洞',sky:['#1a2f42','#4a6f8f'],far:'#2a4a5f',mid:'#3a5a75',top:'#b8e8ff',body:'#5a7a95',dark:'#2a3f52',accent:'#8dd5ff',glow:'#c0e8ff',music:'Ice Cave 115',bpm:115,weather:'snow'},
 lab:{name:'实验室',sky:['#0f1f2a','#2f4f5a'],far:'#1f3540',mid:'#2f4550',top:'#a8c8d8',body:'#4a6a7a',dark:'#1f3040',accent:'#7dc8ff',glow:'#a0d8ff',music:'Lab 158',bpm:158,weather:'dust'},
 metro:{name:'飞驰列车',sky:['#2b1d4a','#f0a060'],far:'#3a2a55',mid:'#2a2040',top:'#f2f5f7',body:'#c3ced6',dark:'#8896a1',accent:'#ffd27a',glow:'#ffe0a0',music:'Flower Castle',bpm:120,weather:'metro'},
 dawn:{name:'黎明的曙光',sky:['#4a3a78','#ffb15a'],far:'#b6607a',mid:'#8a4a6a',top:'#ffd27a',body:'#7b4a52',dark:'#432a3c',accent:'#ffd27a',glow:'#ffcf70',music:'Northern Overseer 82',bossMusic:'Black Knife',bpm:82,weather:'dawn'},
 redforest:{name:'红色森林',sky:['#3a0f22','#d9603c'],far:'#7a2a3a',mid:'#5a1f2e',top:'#ff6a4a',body:'#4a2a2a',dark:'#2a1418',accent:'#ff8a6a',glow:'#ff7a5a',music:'egg',bpm:100,weather:'redforest'},
 chaos:{name:'混沌领域',sky:['#1f1025','#4f3055'],far:'#2f2035',mid:'#3f2545',top:'#c8a8d8',body:'#5a4a6a',dark:'#2a1f35',accent:'#b890ff',glow:'#d0b0ff',music:'Cyprus Two Theme 143',bpm:143,weather:'ember'}
};
var BOSS_MUSIC='Troth Boss 150';
function K(g,k,n,i,c,w,h,p){return {g:g,k:k,n:n,i:i,c:c,w:w,h:h,p:p||{}}}
var CAT=[
 K('terrain','ground','地面','▰','#6b8797',1,1),K('terrain','thin','薄地板(可下穿)','▱','#a8c6ce',1,1),K('terrain','bounce','弹跳菌','✿','#76d9a4',1,1),K('terrain','brick','石砖','▦','#87939e',1,1),K('terrain','ice','冰面(打滑)','❄','#bfefff',1,1),
 K('background','wall','墙体','▥','#2c526b',2,2),K('background','window','窗户','▤','#65d8e6',2,3),K('background','lamp','灯','✦','#ffe69a',1,1),K('background','beam','梁柱','╋','#6e8393',1,6),K('background','tree','树木','♣','#39956b',3,6),K('background','redtree','红色的树','♣','#d9384a',6,10),K('background','building','建筑轮廓','▥','#405f78',5,7),K('background','crystal','晶簇','◆','#8ff0ff',2,3),K('background','stalactite','钟乳石','▽','#6f8a8a',1,3),
 K('background','blackboard','黑板(物理公式)','▭','#2f4a3f',3,2),K('background','banner','横幅旗','⚑','#c75a6a',1,3),
 K('background','pine','雪松','♠','#4f8f7a',3,5),K('background','bush','灌木','❦','#4faa68',2,1),K('background','rock','岩石','◒','#8d98a3',2,1),K('background','mushroom','巨型蘑菇','♠','#b66ad0',3,4),K('background','fence','栅栏','╫','#b08c5b',3,1),K('background','pillar','石柱','▮','#8793a0',2,5),K('background','pipe','管道','═','#7d93a3',4,1),K('background','torch','火把','♨','#ffb36a',1,2),K('background','snowman','雪人','☃','#eaf6fa',1,2),K('background','bench','长椅','▭','#a8794a',2,1),K('background','stationsign','站牌','⑮','#6b3f8f',4,2),K('background','lavafall','熔岩瀑布','≋','#ff744d',2,6),K('background','fireflies','萤火虫','✧','#e8ff9b',4,3),K('background','clock','站台钟','◷','#f4f7fa',1,1),
 K('background','crate','木箱','▣','#a8794a',1,1),K('background','flower','花丛','✿','#ff9fb6',2,1),K('background','cloud','云朵','☁','#ffffff',4,2),K('background','arrow','指示箭头','➜','#ffd27a',2,1),K('background','chain','锁链','⛓','#9fb0c0',1,4),K('background','lantern','灯笼','♨','#ffb36a',1,2),
 K('hazard','spikes','尖刺','▲','#f77e7e',2,1),K('hazard','lava','熔岩池','♨','#ff744d',4,1),K('hazard','laser','激光栅','╳','#ff6b91',1,5,{period:3}),K('hazard','rubble','碎石(可击碎)','◆','#9a8a7b',2,2,{hp:2}),K('hazard','saw','旋转锯','✺','#c9d4de',2,2,{dx:0,dy:0,speed:60}),K('hazard','icicle','冰锥(坠落)','▼','#bfefff',1,2,{delay:.5}),K('hazard','flame','火焰喷口','♨','#ff8a4a',1,3,{period:3,phase:0}),K('hazard','emfield','电磁场(减速)','≋','#7dcfff',3,3,{strength:0.5}),K('hazard','plasma','等离子体','✸','#ff7aff',2,2,{period:2.5}),K('hazard','cryotrap','低温陷阱','❄','#6dd5ff',2,1,{period:4}),K('hazard','voltarc','电弧','⚡','#ffeb3b',1,4,{period:2.8}),K('hazard','gravwell','重力井','◎','#9c6fff',3,3,{strength:1.2}),
 K('mechanism','vine','藤蔓(可攀)','〰','#75d77c',1,6),K('mechanism','switch','开关','◉','#ffdb74',1,1),K('mechanism','plate','压力板','▰','#ffbe72',2,1),K('mechanism','gate','闸门','▥','#8cdcf3',1,4),K('mechanism','spring','弹簧','↟','#8bf3df',2,1),K('mechanism','vent','风口/喷口','≋','#a7e8ff',2,1,{period:3}),K('mechanism','spore','孢子云(上升气流)','✺','#b8ff9b',2,3),K('mechanism','moving','移动平台','↔','#bca0ff',3,1,{dx:5,dy:0,speed:70}),K('mechanism','lift','升降台','↕','#b4a0ff',3,1,{dx:0,dy:-6,speed:60}),K('mechanism','crumble','碎裂平台','▬','#b9a27c',3,1,{delay:.45,respawn:3}),K('mechanism','conveyor','传送带','⇉','#9fb0c0',4,1,{dir:1,speed:90}),K('mechanism','dashgem','冲刺水晶','◈','#7dffe8',1,1),K('mechanism','wind','风区(空中受力)','≈','#dff5ff',4,4,{dir:1,strength:800}),K('mechanism','checkpoint','信标灯(存档点)','✧','#ffe27a',1,2),K('mechanism','shard','信标碎片','◇','#fff1a8',1,1),K('mechanism','blueshard','蓝色碎片(DLC)','◆','#6db8ff',1,1),K('mechanism','yellowshard','黄色水晶(DLC)','◆','#ffd84a',1,1),K('mechanism','heart','保温杯(回血)','☕','#ff9f9f',1,1),
 K('enemy','slime','巡逻史莱姆','●','#9ce779',2,1,{range:5,hp:1,speed:40}),K('enemy','bee','飞行蜂','✹','#ffdc6b',2,2,{range:4,hp:1}),K('enemy','turret','炮台','▣','#f69c8e',2,2,{dir:-1,rate:2,hp:3}),K('enemy','ghost','追踪幽灵','◉','#c8b4ff',2,2,{hp:2}),K('enemy','guard','装甲兵','♟','#e5b4a0',2,3,{range:6,hp:3,speed:34}),K('enemy','frog','跳跳蛙','◔','#8be06a',2,1,{range:5,hp:2}),K('enemy','bat','蝙蝠','⋀','#8a7aa8',2,1,{range:4,hp:1}),K('enemy','drone','监控无人机','✦','#7da8ff',2,2,{range:6,hp:2,speed:50}),K('enemy','probe','探测球','◉','#a0c8ff',2,2,{hp:2}),K('enemy','sentinel','哨兵机器人','▣','#6d8aff',2,3,{range:7,hp:4,speed:30}),K('enemy','wraith','冰霜怨灵','◎','#b0e8ff',2,2,{hp:3}),K('enemy','anomaly','异常体','◈','#ff6dff',2,2,{hp:3}),K('enemy','boss','Boss','♛','#ff785f',6,6,{boss:'lava',hp:16}),K('enemy','commuter','赶车族','➤','#ffb36a',1,2,{range:6,hp:2}),K('enemy','luggage','失控行李箱','▭','#c98a4a',2,1,{range:6,hp:2}),K('enemy','sparkbug','电火花虫','✧','#fff27a',1,1,{range:5,hp:1}),K('enemy','breaker','断路器守卫','▣','#ffd23f',2,2,{hp:3}),K('enemy','lurker','潜伏者','◉','#9fffd8',2,2,{hp:2}),K('enemy','dripper','渗水怪','▾','#8fd0ff',1,1,{hp:2}),K('enemy','ticketer','检票员','✉','#f3d9a4',1,2,{range:4,hp:3}),K('enemy','glitch','乱码体','▚','#6dffff',2,2,{range:5,hp:2}),K('hazard','strap','摇晃吊环','◌','#d8dde2',1,5,{period:3}),K('hazard','autodoor','车门','▥','#9fc3d6',2,5,{period:4}),K('hazard','liveplate','带电地板','≡','#ffe45a',4,1,{period:3.4}),K('hazard','piston','液压冲头','⇩','#8896a1',2,1,{period:3.6,len:8}),K('hazard','thirdrail','第三轨','⚡','#6bd6ff',4,1,{}),K('hazard','scanner','扫描线','▏','#6dffff',1,3,{dx:8,speed:70}),K('enemy','finalboss','最终Boss·悖论','♛','#d070ff',8,8,{boss:'paradox',hp:48}),
 K('enemy','snowling','雪团怪','☗','#dfe9f2',2,2,{range:5,hp:2}),K('enemy','balloon','气球怪','●','#ff6a8a',2,2,{range:5,hp:1}),K('enemy','toysoldier','玩具鼓兵','♘','#e8433a',2,2,{range:6,hp:3}),K('enemy','rocketeer','烟花射手','☄','#ffd23f',2,2,{hp:2}),K('enemy','clown','杂耍小丑','☺','#6dd5ff',1,2,{range:4,hp:2}),
 K('hazard','lightstring','彩灯串(摇晃)','✺','#ffd23f',1,5,{period:3.2,phase:0}),K('hazard','salute','礼炮阵','✸','#ff9ad5',8,1,{period:4,phase:0}),K('hazard','balloonrow','气球串','●','#ff6a8a',1,2,{dx:12,speed:110,phase:0}),K('hazard','ribbongate','彩带门','▥','#ff9ad5',2,5,{period:4,phase:0}),
 K('mechanism','popper','礼花筒(弹射)','✧','#ff9ad5',2,1),K('mechanism','gift','礼物(收集)','▣','#ff6a8a',1,1),K('mechanism','cake','蛋糕(回满血)','◐','#ffd9e8',1,1),K('mechanism','sparkler','仙女棒(短暂无敌)','✦','#ffe27a',1,1),K('mechanism','candy','彩糖(回血)','❦','#ff6a8a',1,1),
 K('background','balloons','气球束','●','#ff6a8a',2,4),K('background','bunting','彩旗串','⚑','#ffd23f',6,2),K('background','firetower','烟花台','♜','#c9a23a',3,6),K('background','clocktower','钟楼','◷','#8aa0c8',6,12),K('background','snowhouse','雪屋','⌂','#dfe9f2',5,5),K('background','partytree','彩灯树','♣','#3f9d62',3,6),K('background','stagebanner','联欢横幅','⚑','#ff6a8a',8,2),K('background','streamers','彩带','〰','#ff9ad5',2,4),K('background','giftpile','礼物堆','▣','#ff6a8a',2,1),
 K('npc','host','报幕员','♙','#ff6a8a',1,2),K('npc','seller','气球叔叔','♙','#c9b8a0',1,2),K('npc','kid','拉彩带的小孩','♙','#ffb36a',1,2),K('npc','bellkeeper','守钟人','♙','#8aa0c8',1,2),K('npc','mate','四班同学','♙','#7fd0ff',1,2),
 /* 第五章 · 黎明的曙光（室外夕阳）：新怪物 / 新障碍 / 新机关 / 场景装饰 */
 K('enemy','paperplane','纸飞机怪','✈','#fff1c8',2,1,{hp:1}),K('enemy','hoop','失控的篮球','●','#ff9a3a',1,1,{}),K('enemy','broom','值日扫帚','⌇','#c9a06a',1,2,{range:5,hp:3}),K('enemy','shadow','夕阳的影子','◗','#2a1a3a',1,2,{range:4,hp:1}),
 K('hazard','ebike','电动车道','⇒','#ffd23f',10,1,{period:4.5,phase:0,dir:1}),
 K('mechanism','bell','放学铃(挥击敲响)','♪','#ffd23f',1,2,{}),K('mechanism','glider','纸飞机(滑翔8秒)','✈','#fff1c8',1,1),
 K('background','lamppost','路灯','Ⅱ','#ffd27a',1,6),K('background','goalpost','球门','⊓','#e8eef2',5,4),K('background','schoolgate','校门','⛩','#c9a06a',10,6),K('background','bikerack','车棚','▤','#8a97a3',6,3),K('background','sunflag','国旗杆','⚑','#e8334a',2,10),
 K('sign','sign','剧情路牌','▤','#f5d68d',2,2),K('sign','talkonce','一次性对话框','❗','#ffb36a',1,2,{}),K('sign','talkmulti','多次对话框','💬','#8fd0ff',1,2,{mode:'seq'}),
 K('npc','worker','巡线员','♙','#85d9d6',1,2),K('npc','child','雪地孩子','♙','#ffd0a1',1,2),K('npc','ranger','守林人','♙','#8bdb91',1,2),K('npc','squirrel','小松鼠','♙','#d9a066',1,2),K('npc','robot','维修机器人','▣','#8ebcff',1,2),K('npc','hologram','研究员投影','♙','#c5a7ff',1,2),K('npc','traveler','旅客','♙','#ffd0a1',1,2),K('npc','stationmaster','站务员','♙','#ff9aa0',1,2),K('npc','student','学生','♙','#9fd0ff',1,2),K('npc','cat','流浪猫','▲','#e0b070',1,1),K('npc','driver','列车员','♙','#6fa0e8',1,2),K('npc','colleague','同事老师','♙','#9fd0ff',1,2),K('npc','shopkeeper','商贩','♙','#ffcf7a',1,2),K('npc','grandpa','老人','♙','#c9b8a0',1,2),K('npc','pupil','小学生','♙','#ff9fc8',1,2),K('npc','dog','小狗','▲','#d9b27a',1,1),K('npc','scientist','科学家','♙','#7db8ff',1,2),K('npc','ai','AI助手','◎','#b8a0ff',1,2),K('npc','shadow','影子','♙','#6d7a8f',1,2),K('npc','echo','回声','♙','#9fcfef',1,2),
 K('trigger','trigger','对话触发区','◌','#ffffff',3,4,{once:1}),
 K('exit','exit','出口','⇥','#6cf1e5',2,3),K('spawn','spawn','出生点','⌖','#fff1a5',1,2)
];
var INFO={};CAT.forEach(function(c){INFO[c.k]=c});
var GROUPS=[['terrain','地块'],['background','背景装饰'],['hazard','障碍物'],['mechanism','互动机关'],['enemy','敌对生物'],['sign','剧情牌'],['npc','NPC'],['trigger','触发区'],['exit','出口'],['spawn','出生点']];
var _u=0;function uid(){_u++;return 'o'+Date.now().toString(36)+_u.toString(36)+Math.random().toString(36).slice(2,5)}
function blankLevel(name,w,h){w=w||60;h=h||18;var cells=[];for(var y=0;y<h;y++){var r=[];for(var x=0;x<w;x++)r.push(y>=h-2?1:0);cells.push(r)}
 return {name:name||'新房间',width:w,height:h,background:'snow',objective:'探索房间，找到出口。',intro:'',cells:cells,
  objects:[{id:uid(),type:'spawn',kind:'spawn',x:2,y:h-4,w:1,h:2,label:'出生点',dialogue:'',props:{}},{id:uid(),type:'exit',kind:'exit',x:w-4,y:h-5,w:2,h:3,label:'出口',dialogue:'',props:{}}],links:[]}}
/* 自定义主题：战役数据里的 themes = {t_xxx:{name,base,sky:[上,下],far,mid,top,body,dark,accent,glow,music,bossMusic,bpm,weather,wx:{n,c,vx,vy,r,glow,leaf}}}
   载入战役时注册进 BIOMES（键必须以 t_ 开头，不会覆盖内置主题）；缺省的字段继承 base 主题。 */
var HEX=/^#[0-9a-f]{6}$/i,COLOR_KEYS=['far','mid','top','body','dark','accent','glow'];
function registerThemes(themes){
 if(!themes||typeof themes!=='object')return;
 Object.keys(themes).forEach(function(k){var t=themes[k];if(!/^t_/.test(k)||!t||typeof t!=='object')return;
  var base=BIOMES[t.base]&&!BIOMES[t.base].custom?BIOMES[t.base]:BIOMES.snow,b={custom:true,base:t.base&&BIOMES[t.base]?t.base:'snow'},p;
  for(p in base)if(p!=='custom'&&p!=='base')b[p]=base[p];
  b.name=String(t.name||k);
  if(Array.isArray(t.sky)&&HEX.test(t.sky[0])&&HEX.test(t.sky[1]))b.sky=[t.sky[0],t.sky[1]];
  COLOR_KEYS.forEach(function(c){if(HEX.test(t[c]))b[c]=t[c]});
  if(t.music)b.music=String(t.music);if(t.bossMusic)b.bossMusic=String(t.bossMusic);
  if(+t.bpm>0)b.bpm=Math.min(240,Math.max(40,+t.bpm));
  if(t.weather)b.weather=String(t.weather);
  b.wx=t.wx&&typeof t.wx==='object'?t.wx:null;
  BIOMES[k]=b})}
function dropTheme(k){if(BIOMES[k]&&BIOMES[k].custom)delete BIOMES[k]}
/* 天气粒子：n 数量 · c 颜色 · vx/vy 速度 · r 大小 · glow 发光 · leaf 叶片形状。内置主题按主题名取，自定义主题按 weather 预设 + wx 覆盖 */
var WEATHER={snow:{n:70,c:'#ffffff',vy:40,vx:-14,r:2.4},forest:{n:26,c:'#b6f28d',vy:28,vx:18,r:3,leaf:1},underground:{n:40,c:'#b8ff9b',vy:-12,vx:4,r:1.8,glow:1},lava:{n:45,c:'#ffb36a',vy:-40,vx:8,r:1.8,glow:1},station:{n:30,c:'#bffcf5',vy:6,vx:3,r:1.2},lab:{n:34,c:'#9fe8ff',vy:-8,vx:7,r:1.7,glow:1},chaos:{n:56,c:'#d6b0ff',vy:-26,vx:11,r:2.1,glow:1},night:{n:30,c:'#c3ccff',vy:6,vx:3,r:1.2},redforest:{n:32,c:'#ff6a5a',vy:30,vx:16,r:3,leaf:1},dawn:{n:34,c:'#ffe3a0',vy:-8,vx:6,r:1.9,glow:1},metro:{n:26,c:'#ffffff',vy:0,vx:-420,r:1.1}};
function weatherOf(biome){var b=BIOMES[biome];if(!b||!b.custom)return WEATHER[biome]||WEATHER.snow;
 if(b.weather==='none')return {n:0,c:'#ffffff',vy:0,vx:0,r:1};
 var w=Object.assign({},WEATHER[b.weather]||WEATHER[b.base]||WEATHER.snow),x=b.wx||{};
 ['n','vx','vy','r'].forEach(function(k){if(x[k]!=null&&x[k]!==''&&isFinite(+x[k]))w[k]=+x[k]});
 if(HEX.test(x.c))w.c=x.c;if(x.glow!=null)w.glow=x.glow?1:0;if(x.leaf!=null)w.leaf=x.leaf?1:0;
 w.n=Math.max(0,Math.min(300,Math.round(w.n)));return w}
return {T:T,HERO:HERO,STATION:STATION,LINE:LINE,REV:REV,CELL:CELL,BIOMES:BIOMES,registerThemes:registerThemes,dropTheme:dropTheme,WEATHER:WEATHER,weatherOf:weatherOf,BOSS_MUSIC:BOSS_MUSIC,CAT:CAT,INFO:INFO,GROUPS:GROUPS,blankLevel:blankLevel,uid:uid,STORAGE:{campaign:'line15-campaign-v3',test:'line15-test-level-v3',save:'line15-save-v3',prefs:'line15-prefs-v3',slots:'line15-slots-v4',meta:'line15-meta-v4'}};
})();
