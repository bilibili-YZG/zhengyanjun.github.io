/* DLC 战役：地铁历险
   解锁条件：主线收集 150 枚信标碎片。
   结构：1 个场景（metro1）共 4 关，每关 6 节白色车厢；窗外是滚动的风景（黄昏城市 → 夜色郊野 → 隧道 → 黎明）。
   房间本身在 js/levels/metro1-NN.js；这里负责章节剧情、开场与结局。 */
(function(){
var LN=L15.LINE;

/* 四种窗外风景（继承内置「飞驰列车」主题：白色车厢 + 滚动的窗外景色），只换天色与远近景配色 */
var THEMES={
 t_m1:{name:'黄昏城市',base:'metro',sky:['#2b1d4a','#f0a060'],far:'#5a3a60',mid:'#3a2a50',accent:'#ffcf7a'},
 t_m2:{name:'夜色郊野',base:'metro',sky:['#050a1a','#1d2f5a'],far:'#10193a',mid:'#0b1228',accent:'#ffe08a'},
 t_m3:{name:'隧道深处',base:'metro',sky:['#05070c','#141e2a'],far:'#0c141c',mid:'#111b25',accent:'#ffd27a'},
 t_m4:{name:'黎明前',base:'metro',sky:['#304a7a','#ffc890'],far:'#4a5f86',mid:'#2f4366',accent:'#ffe9b0'}};
L15.registerThemes(THEMES);

var CHAPTERS=[
 {id:'metro1',name:'行驶的末班车',subtitle:'老师坐在飞驰的末班车上，一节一节车厢往前走，想弄明白这趟车开往哪里。',biome:'t_m1',
  intro:['train|晚自习批完最后一本作业，已经是深夜。','train|你坐上'+LN+'的末班车，靠着车窗，不知不觉睡着了。','train|醒来时，车厢里的人少了大半。窗外一片漆黑，只有隧道的灯光一盏盏掠过。','train|广播在循环："本次列车终点站——未知。"','train|你站起身，决定一节一节往车头走，去问问列车员。'],
  outro:['train|你推开最后一道门，车头的灯光刺得你眯起了眼。','train|列车仍在飞驰——这趟旅程，才刚刚开始。']}
];
CHAPTERS.forEach(function(c){c.levels=(L15.LEVELS[c.id]||[]).filter(Boolean)});

window.CAMPAIGN_SUBWAY={
 format:'line15-campaign',
 version:3,
 rev:L15.REV,
 name:'地铁历险',
 isDLC:true,
 themes:THEMES,
 unlockCondition:{type:'shards',count:150},
 prologue:['train|这是一个关于老师和地铁的故事。','train|有些列车，只在深夜才会出现。'],
 prologueBiome:'t_m1',
 ending:{title:'平安到家',shardName:'黄色水晶',win:'每一枚水晶都带回来了。老师，晚安。',lose:'还有 {n} 枚黄色水晶留在了车厢里——下次坐车，再去找找吧。'},
 chapters:CHAPTERS,
 epilogue:[
  't_m4|你推开驾驶室的门。列车员转过头，笑着把一枚黄色水晶放进了仪表盘。',
  't_m4|仪表盘亮了。列车缓缓减速，窗外的天色一点点变亮。',
  't_m4|广播响起："'+LN+'，到站了。请乘客带好随身物品，平安回家。"',
  't_m4|车门打开，清晨的风吹进来。你一节一节走过的车厢里，乘客们向你点头道别。',
  't_m4|你走下列车，站台上是熟悉的灯光。手机震了一下，是学生发来的消息："老师，您到家了吗？"',
  't_m4|你笑着回复："到了。明天见。"',
  't_m4|——（地铁历险 · 平安到家）——']
};

if(window.L15&&!L15.DLC_CAMPAIGNS)L15.DLC_CAMPAIGNS=[];
if(window.L15)L15.DLC_CAMPAIGNS.push(window.CAMPAIGN_SUBWAY);
})();
