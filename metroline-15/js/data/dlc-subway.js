/* DLC 战役：地铁历险
   解锁条件：主线收集 150 枚信标碎片。
   故事：深夜的末班车丢了自己的站名——线路图是空白的，广播只会说“终点站：未知”。
   老师一节一节往车头走，把散落在车厢里的黄色水晶（站名水晶）找回来，交给列车员，让列车重新报出站名。
   结构：4 章 × 3 关，每关 6 节车厢；四章依次是 载客车厢 → 设备车厢 → 隧道区间 → 驶向车头；窗外：黄昏城市 → 夜色郊野 → 隧道 → 黎明。
   房间本身在 js/levels/metroC-0N.js（C=章 N=关）；这里负责章节剧情、开场与结局。 */
(function(){
var LN=L15.LINE;

/* 四种窗外风景（继承内置「飞驰列车」主题：白色车厢 + 滚动的窗外景色），只换天色与远近景配色 */
var THEMES={
 t_m1:{name:'黄昏城市',base:'metro',sky:['#2b1d4a','#f0a060'],far:'#5a3a60',mid:'#3a2a50',accent:'#ffcf7a'},
 t_m2:{name:'夜色郊野',base:'metro',sky:['#050a1a','#1d2f5a'],far:'#10193a',mid:'#0b1228',accent:'#ffe08a'},
 t_m3:{name:'隧道深处',base:'metro',sky:['#05070c','#141e2a'],far:'#0c141c',mid:'#111b25',accent:'#ffd27a',music:'sunset',bpm:100},
 t_m4:{name:'黎明前',base:'metro',sky:['#304a7a','#ffc890'],far:'#4a5f86',mid:'#2f4366',accent:'#ffe9b0',music:'sunset',bpm:100}};
L15.registerThemes(THEMES);

var CHAPTERS=[
 {id:'metro1',name:'载客车厢',subtitle:'线路图上的站名全不见了。老师一节一节往车头走，想知道这趟车为什么没有终点。',biome:'t_m1',
  intro:['train|晚自习批完最后一本作业，已经是深夜。','train|你坐上'+LN+'的末班车，靠着车窗，不知不觉睡着了。','train|醒来时，车厢里的人少了大半。线路图上的站名一个不剩，广播在循环：“本次列车终点站——未知。”','train|你站起身，决定一节一节往车头走，找列车员问个明白。'],
  outro:['train|你推开贯通门，面前是一节堆满箱子的设备车厢，灯光一闪一闪。']},
 {id:'metro2',name:'设备车厢',subtitle:'配电不稳，机器乱转。没有站名，车里的信号系统也跟着乱了。',biome:'t_m2',
  intro:['train|窗外是夜色里的郊野，只有零星的灯火。','train|设备车厢里堆满零件，电路老化，电弧时断时续。','train|检修员说，报站系统缺了站名数据，信号才会乱。你得继续把水晶找回来。'],
  outro:['train|最后一次闪烁之后，整节车厢彻底暗了下来——电，断了。这不是恢复，是彻底断电。','train|列车靠着惯性滑向前方，隧道里的风声越来越近。']},
 {id:'metro3',name:'隧道区间',subtitle:'隧道里又黑又冷，车厢结了冰，回声里有人在说话。',biome:'t_m3',
  intro:['train|列车在断电的黑暗里滑进隧道，窗外只剩一盏盏闪过的应急灯。','train|车厢里结着冷凝水，地板又湿又滑。电，要到隧道尽头才会回来。','train|黑暗里有些模糊的影子——它们是被这趟车遗忘的乘客，也在找自己的站。'],
  outro:['train|前方的黑暗里透出一线微光——电，回来了。车厢的灯一盏接一盏亮起，隧道快走完了。']},
 {id:'metro4',name:'驶向车头',subtitle:'天快亮了，车头就在前面，可信号越来越乱。',biome:'t_m4',
  intro:['train|列车驶出隧道，东边的天开始泛白。','train|广播开始乱码，仪表信号紊乱，车头传来异常的波动。','train|只剩最后几节车厢了。你攥紧口袋里的黄色水晶。'],
  outro:['train|你推开最后一道门，车头的灯光刺得你眯起了眼。']}
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
 requireYellow:true, /* 每关必须集齐本关的黄色水晶，出口才会打开（只有地铁历险读这个开关） */
 prologue:['train|这是一个关于老师和地铁的故事。','train|有些列车，只在深夜才会出现——它们会弄丢自己的站名。'],
 prologueBiome:'t_m1',
 ending:{title:'平安到家',shardName:'黄色水晶',win:'每一枚站名水晶都找回来了。列车报出了你家的站名。老师，晚安。',lose:'还有 {n} 枚黄色水晶留在了车厢里——下次坐车，再去找找吧。'},
 chapters:CHAPTERS,
 epilogue:[
  'train|你推开驾驶室的门。列车员转过头，笑着接过你手里的黄色水晶，一枚一枚放进仪表盘。',
  'train|仪表盘亮了。线路图上，一个个站名重新浮现。列车缓缓减速，窗外的天色一点点变亮。',
  'train|广播响起：“'+LN+'，到站了。请乘客带好随身物品，平安回家。”',
  'train|车门打开，清晨的风吹进来。你一节一节走过的车厢里，乘客们向你点头道别。',
  'station|你走下列车，站台上是熟悉的灯光。手机震了一下，是学生发来的消息：“老师，您到家了吗？”',
  'station|你笑着回复：“到了。明天见。”',
  'station|——（地铁历险 · 平安到家）——']
};

/* 15号线旗子（banner 横幅旗）总是插在车窗上：整体删掉。工坊发布到浏览器里的版本也在 dlc-registry.js 里过一遍 */
function stripFlags(c){(c&&c.chapters||[]).forEach(function(ch){(ch.levels||[]).forEach(function(lv){if(lv&&lv.objects)lv.objects=lv.objects.filter(function(o){return o.kind!=='banner'})})});return c}
window.stripMetroFlags=stripFlags;stripFlags(window.CAMPAIGN_SUBWAY);

if(window.L15&&!L15.DLC_CAMPAIGNS)L15.DLC_CAMPAIGNS=[];
if(window.L15)L15.DLC_CAMPAIGNS.push(window.CAMPAIGN_SUBWAY);
})();
