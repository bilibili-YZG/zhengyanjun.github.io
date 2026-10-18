/* 15号线大冒险 · 共享定义：游戏与关卡工坊共用同一份对象目录、生物群系与关卡格式。 */
window.L15=(function(){
var T=32;
/* 故事发生的地铁站：全局只在这里改一次（剧情、站牌、标题页都会跟着变） */
var STATION='望京西站',LINE='15号线',REV=5,HERO='物理老师';
var CELL={ground:1,thin:2,bounce:3,brick:4,ice:5};
var BIOMES={
 snow:{name:'雪原',sky:['#5f95b8','#dcf3fb'],far:'#a9c8d6',mid:'#83abbb',top:'#f4fcff',body:'#8fb5c8',dark:'#5f8aa0',accent:'#74dbe8',glow:'#cfeeff',music:'Foothills 105',bpm:105,weather:'snow'},
 forest:{name:'森林',sky:['#2f7a6c','#bfe6a0'],far:'#3f7d6e',mid:'#2d6a50',top:'#86d05f',body:'#6b4b34',dark:'#432f21',accent:'#b6f28d',glow:'#d9ffb0',music:'Canopy 98',bpm:98,weather:'leaf'},
 underground:{name:'地下洞窟',sky:['#0f2b2e','#2f5f50'],far:'#1c4540',mid:'#1f4d3a',top:'#5fae6f',body:'#35583c',dark:'#1d3326',accent:'#b6ff91',glow:'#9cffc0',music:'Forest Floor 115',bpm:115,weather:'spore'},
 lava:{name:'熔岩洞窟',sky:['#26121f','#8c3b35'],far:'#4a2735',mid:'#66302c',top:'#e0793a',body:'#4c3438',dark:'#2c1d21',accent:'#ffb36a',glow:'#ff8a4a',music:'Red Cave 152',bpm:152,weather:'ember'},
 station:{name:'地铁站',sky:['#0b1a2b','#2a5a6e'],far:'#1d3b4d',mid:'#27566a',top:'#c7d7de',body:'#5d7482',dark:'#34495a',accent:'#b5f6ef',glow:'#bffcf5',music:'Foothills 105',bpm:105,weather:'dust'},
 night:{name:'夜色城市',sky:['#0b1024','#33407a'],far:'#1a2146',mid:'#242a4d',top:'#8fa0e8',body:'#46508a',dark:'#252b52',accent:'#a9b5ff',glow:'#c3ccff',music:'Foothills 105',bpm:105,weather:'dust'}
};
var BOSS_MUSIC='Troth Boss 150';
function K(g,k,n,i,c,w,h,p){return {g:g,k:k,n:n,i:i,c:c,w:w,h:h,p:p||{}}}
var CAT=[
 K('terrain','ground','地面','▰','#6b8797',1,1),K('terrain','thin','薄地板(可下穿)','▱','#a8c6ce',1,1),K('terrain','bounce','弹跳菌','✿','#76d9a4',1,1),K('terrain','brick','石砖','▦','#87939e',1,1),K('terrain','ice','冰面(打滑)','❄','#bfefff',1,1),
 K('background','wall','墙体','▥','#2c526b',2,2),K('background','window','窗户','▤','#65d8e6',2,3),K('background','lamp','灯','✦','#ffe69a',1,1),K('background','beam','梁柱','╋','#6e8393',1,6),K('background','tree','树木','♣','#39956b',3,6),K('background','building','建筑轮廓','▥','#405f78',5,7),K('background','crystal','晶簇','◆','#8ff0ff',2,3),K('background','stalactite','钟乳石','▽','#6f8a8a',1,3),
 K('background','blackboard','黑板(物理公式)','▭','#2f4a3f',3,2),K('background','banner','横幅旗','⚑','#c75a6a',1,3),
 K('background','pine','雪松','♠','#4f8f7a',3,5),K('background','bush','灌木','❦','#4faa68',2,1),K('background','rock','岩石','◒','#8d98a3',2,1),K('background','mushroom','巨型蘑菇','♠','#b66ad0',3,4),K('background','fence','栅栏','╫','#b08c5b',3,1),K('background','pillar','石柱','▮','#8793a0',2,5),K('background','pipe','管道','═','#7d93a3',4,1),K('background','torch','火把','♨','#ffb36a',1,2),K('background','snowman','雪人','☃','#eaf6fa',1,2),K('background','bench','长椅','▭','#a8794a',2,1),K('background','stationsign','站牌','⑮','#6b3f8f',4,2),K('background','lavafall','熔岩瀑布','≋','#ff744d',2,6),K('background','fireflies','萤火虫','✧','#e8ff9b',4,3),K('background','clock','站台钟','◷','#f4f7fa',1,1),
 K('hazard','spikes','尖刺','▲','#f77e7e',2,1),K('hazard','lava','熔岩池','♨','#ff744d',4,1),K('hazard','laser','激光栅','╳','#ff6b91',1,5,{period:3}),K('hazard','rubble','碎石(可击碎)','◆','#9a8a7b',2,2,{hp:2}),K('hazard','saw','旋转锯','✺','#c9d4de',2,2,{dx:0,dy:0,speed:60}),K('hazard','icicle','冰锥(坠落)','▼','#bfefff',1,2,{delay:.5}),K('hazard','flame','火焰喷口','♨','#ff8a4a',1,3,{period:3,phase:0}),
 K('mechanism','vine','藤蔓(可攀)','〰','#75d77c',1,6),K('mechanism','switch','开关','◉','#ffdb74',1,1),K('mechanism','plate','压力板','▰','#ffbe72',2,1),K('mechanism','gate','闸门','▥','#8cdcf3',1,4),K('mechanism','spring','弹簧','↟','#8bf3df',2,1),K('mechanism','vent','风口/喷口','≋','#a7e8ff',2,1,{period:3}),K('mechanism','spore','孢子云(上升气流)','✺','#b8ff9b',2,3),K('mechanism','moving','移动平台','↔','#bca0ff',3,1,{dx:5,dy:0,speed:70}),K('mechanism','lift','升降台','↕','#b4a0ff',3,1,{dx:0,dy:-6,speed:60}),K('mechanism','crumble','碎裂平台','▬','#b9a27c',3,1,{delay:.45,respawn:3}),K('mechanism','conveyor','传送带','⇉','#9fb0c0',4,1,{dir:1,speed:90}),K('mechanism','dashgem','冲刺水晶','◈','#7dffe8',1,1),K('mechanism','wind','风区(空中受力)','≈','#dff5ff',4,4,{dir:1,strength:800}),K('mechanism','checkpoint','信标灯(存档点)','✧','#ffe27a',1,2),K('mechanism','shard','信标碎片','◇','#fff1a8',1,1),K('mechanism','heart','保温杯(回血)','☕','#ff9f9f',1,1),
 K('enemy','slime','巡逻史莱姆','●','#9ce779',2,1,{range:5}),K('enemy','bee','飞行蜂','✹','#ffdc6b',2,2,{range:4}),K('enemy','turret','炮台','▣','#f69c8e',2,2,{dir:-1,rate:2}),K('enemy','ghost','追踪幽灵','◉','#c8b4ff',2,2),K('enemy','guard','装甲兵','♟','#e5b4a0',2,3,{range:6}),K('enemy','frog','跳跳蛙','◔','#8be06a',2,1,{range:5}),K('enemy','bat','蝙蝠','⋀','#8a7aa8',2,1,{range:4}),K('enemy','boss','Boss','♛','#ff785f',6,6,{boss:'lava',hp:16}),
 K('sign','sign','剧情路牌','▤','#f5d68d',2,2),
 K('npc','worker','巡线员','♙','#85d9d6',1,2),K('npc','child','雪地孩子','♙','#ffd0a1',1,2),K('npc','ranger','守林人','♙','#8bdb91',1,2),K('npc','squirrel','小松鼠','♙','#d9a066',1,2),K('npc','robot','维修机器人','▣','#8ebcff',1,2),K('npc','hologram','研究员投影','♙','#c5a7ff',1,2),K('npc','traveler','旅客','♙','#ffd0a1',1,2),K('npc','stationmaster','站务员','♙','#ff9aa0',1,2),K('npc','student','学生','♙','#9fd0ff',1,2),K('npc','cat','流浪猫','▲','#e0b070',1,1),K('npc','driver','列车员','♙','#6fa0e8',1,2),K('npc','colleague','同事老师','♙','#9fd0ff',1,2),
 K('trigger','trigger','对话触发区','◌','#ffffff',3,4,{once:1}),
 K('exit','exit','出口','⇥','#6cf1e5',2,3),K('spawn','spawn','出生点','⌖','#fff1a5',1,2)
];
var INFO={};CAT.forEach(function(c){INFO[c.k]=c});
var GROUPS=[['terrain','地块'],['background','背景装饰'],['hazard','障碍物'],['mechanism','互动机关'],['enemy','敌对生物'],['sign','剧情牌'],['npc','NPC'],['trigger','触发区'],['exit','出口'],['spawn','出生点']];
var _u=0;function uid(){_u++;return 'o'+Date.now().toString(36)+_u.toString(36)+Math.random().toString(36).slice(2,5)}
function blankLevel(name,w,h){w=w||60;h=h||18;var cells=[];for(var y=0;y<h;y++){var r=[];for(var x=0;x<w;x++)r.push(y>=h-2?1:0);cells.push(r)}
 return {name:name||'新房间',width:w,height:h,background:'snow',objective:'探索房间，找到出口。',intro:'',cells:cells,
  objects:[{id:uid(),type:'spawn',kind:'spawn',x:2,y:h-4,w:1,h:2,label:'出生点',dialogue:'',props:{}},{id:uid(),type:'exit',kind:'exit',x:w-4,y:h-5,w:2,h:3,label:'出口',dialogue:'',props:{}}],links:[]}}
return {T:T,HERO:HERO,STATION:STATION,LINE:LINE,REV:REV,CELL:CELL,BIOMES:BIOMES,BOSS_MUSIC:BOSS_MUSIC,CAT:CAT,INFO:INFO,GROUPS:GROUPS,blankLevel:blankLevel,uid:uid,STORAGE:{campaign:'line15-campaign-v3',test:'line15-test-level-v3',save:'line15-save-v3',prefs:'line15-prefs-v3',slots:'line15-slots-v4',meta:'line15-meta-v4'}};
})();
