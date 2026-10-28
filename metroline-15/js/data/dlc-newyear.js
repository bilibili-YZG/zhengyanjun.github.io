/* DLC 战役：雪镇跨年 · 四班 Forever
   解锁方式：在 DLC 详情页输入口令（见 dlc-registry.js）。
   用途：班级元旦联欢会。两章、每章一关；章节之间的剧情就是「报幕环节」——每一页都带一段动画（幕布 / 雪镇 / 报幕 / 钟楼 / 钟魔 / 烟花），
         老师（主持人）读完一页、点一下，再让台上的同学表演。串起整场联欢会的节目。
   ⭐ 要换成你们班的节目：只改下面的 SHOW 数组（节目名），其他不用动。 */
(function(){
var BETWEEN=['【节目：请在 js/data/dlc-newyear.js 的 BETWEEN 里改成节目名】','【节目二】','【节目三】','【节目四】','【节目五】'];
var SHOW=['【节目一：请在 js/data/dlc-newyear.js 里改成节目名】','【节目二】','【节目三】'];

var THEMES={
 t_ny1:{name:'雪镇夜',base:'snow',sky:['#0b1233','#4a5a96'],far:'#34426e',mid:'#2a3560',top:'#f4fcff',body:'#7f94bc',dark:'#4f6290',accent:'#ffd23f',glow:'#ffe9a8',music:'SnowdinTown',bossMusic:'SnowdinTown',bpm:100,weather:'snow'},
 t_ny2:{name:'钟楼',base:'snow',sky:['#1a0a2a','#5a2a4a'],far:'#3a1f4a',mid:'#4a2a56',top:'#ffe9f0',body:'#7a5a8a',dark:'#4a2f5a',accent:'#ff9ad5',glow:'#ffd9ec',music:'fresh',bossMusic:'fresh',bpm:100,weather:'snow',wx:{n:46,c:'#ffd23f',vy:34,vx:8,r:2.6,glow:1}}
};
L15.registerThemes(THEMES);

var CHAPTERS=[
 {id:'ny1',name:'雪镇欢庆',subtitle:'彩灯、气球、礼炮和烟花。联欢会要用的礼物被弄散了，老师穿过雪镇，把它们带去钟楼广场。',biome:'t_ny1',
  intro:[
   'ny_town|雪下得很大，雪镇的街上挂满了彩灯，空气里都是甜甜的味道。',
   'ny_town|可今晚出了点怪事：联欢会要用的礼物，一夜之间被淘气的雪团怪和气球怪弄散了。',
   'ny_town|报幕员：老师，能请您穿过雪镇，把礼物带去钟楼广场吗？全镇的人都在等。',
   'ny_town|我：好，就从这条街开始吧。'],
  between:[0,1,2,3,4].map(function(i){return [
   'ny_curtain|【报幕】第 '+(i+1)+' 个街区顺利通过！请欣赏节目：',
   'ny_intermission|【报幕】'+BETWEEN[i],
   'ny_intermission|【报幕】谢谢！冒险继续——请老师前往下一个街区。']}),
  outro:[
   'ny_intermission|【报幕】老师顺利穿过了雪镇的五个街区，礼物都送到了钟楼广场！',
   'ny_intermission|【报幕】冒险暂告一段落——接下来，请欣赏节目：',
   'ny_intermission|【报幕】'+SHOW[0],
   'ny_intermission|【报幕】下面请欣赏：'+SHOW[1],
   'ny_intermission|【报幕】谢谢！让我们把掌声再送给台上的同学们。',
   'ny_intermission|【报幕】冒险继续——钟楼里，好像有什么东西在等着老师……']},
 {id:'ny2',name:'零点倒数',subtitle:'大钟不肯报时，指针停在 11 点 59 分。老师登上钟楼，面对想让今年永远不结束的钟魔。',biome:'t_ny2',
  intro:[
   'ny_clock|钟楼矗立在雪夜里。分针一格一格地爬向 12，却在最后一格前停住了。',
   'ny_clock|守钟人：老师，大钟一直没响。指针就停在 11 点 59 分，怎么也走不过去。',
   'ny_midnight|钟楼深处传来一个声音：“不许走……今年还没过完呢！”',
   'ny_midnight|零点钟魔：我才不要让时间往前走！一到明年，大家就把今年忘了！',
   'ny_midnight|我：它不是坏东西，只是舍不得今年。可钟声不响，大家就没法跨年——得让它松手。'],
  outro:[
   'ny_fireworks|钟魔手里的指针一松，时间又重新走了起来。',
   'ny_fireworks|当——当——当——钟声响彻雪镇。',
   'ny_fireworks|全镇的人一起数：十、九、八、七、六、五、四、三、二、一——',
   'ny_fireworks|新年快乐！']}
];
CHAPTERS.forEach(function(c){c.levels=(L15.LEVELS[c.id]||[]).filter(Boolean)});

window.CAMPAIGN_NEWYEAR={
 format:'line15-campaign',
 version:3,
 rev:L15.REV,
 name:'雪镇跨年 · 四班 Forever',
 isDLC:true,
 themes:THEMES,
 unlockCondition:{type:'password'},
 prologue:[
  'ny_curtain|【报幕】各位老师、各位同学，晚上好！欢迎来到四班元旦联欢会！',
  'ny_curtain|【报幕】今晚的节目，由一段小小的冒险串起来——故事的主角，就是台上的这位老师。',
  'ny_curtain|【报幕】雪镇有个传统：每年的跨年夜，全镇的人都会聚在钟楼广场，一起等零点的钟声。',
  'ny_town|【报幕】故事，从一个下着雪的夜晚开始——'],
 prologueBiome:'t_ny1',
 ending:{title:'新年快乐',shardName:'份礼物',win:'每一份礼物都送到了钟楼广场。新的一年，四班 Forever！',lose:'还有 {n} 份礼物留在了雪镇的角落里——明年再去找找吧。'},
 chapters:CHAPTERS,
 epilogue:[
  'ny_fireworks|零点的烟花一朵接一朵，在雪镇上空炸开。',
  'ny_fireworks|钟魔不再生气了。它抱着自己的钟，又哭又笑：“原来新的一年，也没那么糟……”',
  'ny_fireworks|【报幕】联欢会还没有结束！最后，请欣赏压轴节目：'+SHOW[2],
  'ny_fireworks|【报幕】请全体同学上台——让我们一起迎接新的一年！',
  'ny_fireworks|【报幕】新年快乐！四班——Forever！',
  'ny_fireworks|——（雪镇跨年 · 完）——']
};

if(window.L15&&!L15.DLC_CAMPAIGNS)L15.DLC_CAMPAIGNS=[];
if(window.L15)L15.DLC_CAMPAIGNS.push(window.CAMPAIGN_NEWYEAR);
})();
