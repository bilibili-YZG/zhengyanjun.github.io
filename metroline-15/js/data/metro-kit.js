/* 地铁DLC 关卡积木：一关 = 6 节车厢（每节 50 格，共 300 格），整关通顶、地板贯通。
   L15.metroLevel(名称, 背景, 目标, 开场, 车厢列表, 难度d, 水晶id前缀)
   车厢：{t:类型, npc:[角色kind, 台词(用 | 分隔多句), 横向偏移(可省略)], y:本节水晶数(默认 2，一关合计 12 枚)}
   每章有自己的一套车厢（怪物和障碍物也是每章专属，见 js/dlc-metro.js）：
     第 1 章 载客车厢（黄昏，晚高峰）  seat 座位 · rush 晚高峰 · doors 车门段 · baggage 行李堆 · aisle 吊环长廊 · rest 休息
     第 2 章 设备车厢（闪灯）          wiring 线路间 · switchroom 配电室 · press 冲压间 · belt2 传送带间 · gen 发电机间 · relay 继电器室
     第 3 章 隧道区间（漆黑）          wet 滴水 · rail 第三轨 · crawl 爬行区 · ice3 冷凝水 · ghost3 幽灵乘客 · arena Boss 战（迷途列车）
     第 4 章 驶向车头（信号紊乱）      scan 扫描线 · ticket 检票口 · speed 加速段 · signal 信号室 · cab 驾驶前厅
   每种车厢函数负责摆平台、怪物、障碍，并返回一串水晶候选点 [x, 行]（越靠前越难拿），按 y 取前几个。
   玩法规则：地铁历险每关必须集齐本关的黄色水晶，出口才会打开（见 dlc-subway.js 的 requireYellow）。 */
(function(){
var R=L15.R,S=L15.S,C=L15.CELL,CAR=50;

function plats(b,x0,list){list.forEach(function(p){b.plat(x0+p[0],p[1],p[2])})}

/* ============================ 第 1 章：载客车厢 ============================ */
var T1={
 /* 座位车厢：座椅能踩，蜂在半空，行李箱在两排座椅之间来回冲 */
 seat:function(b,x0,G,d){
  plats(b,x0,[[6,13,5],[14,10,5],[22,8,5],[31,11,5],[40,13,5]]);
  [9,21,33].forEach(function(sx){b.fill(x0+sx,G-1,3,1,C.brick)});
  b.o('bee',x0+15,7,{range:4,hp:1});b.o('bee',x0+38,7,{range:4,hp:1});
  b.on('luggage',x0+14,G,{range:7});
  if(d>1)b.on('commuter',x0+40,G,{range:5});
  b.o('heart',x0+16,9);
  return [[23,7],[41,12],[7,12],[32,10]]},
 /* 晚高峰：赶车族扎堆，两只吊环在中间晃 */
 rush:function(b,x0,G,d){
  plats(b,x0,[[4,13,5],[10,10,5],[20,8,6],[30,8,6],[40,10,5],[45,13,4]]);
  b.on('commuter',x0+14,G,{range:8});b.on('commuter',x0+38,G,{range:8});
  b.o('strap',x0+24,4,{period:3.2,phase:0},{h:13.3});b.o('strap',x0+28,4,{period:3.2,phase:.5},{h:13.3});
  if(d>2)b.on('luggage',x0+33,G,{range:4});
  b.o('heart',x0+11,9);
  return [[21,7],[41,9],[31,7],[5,12]]},
 /* 车门段：两道车门轮流关，夹在中间的人才知道什么叫“请勿倚靠” */
 doors:function(b,x0,G,d){
  plats(b,x0,[[4,13,5],[10,11,5],[21,13,6],[38,13,5],[44,10,5]]);
  b.o('autodoor',x0+17,4,{period:4,phase:0},{h:14});b.o('autodoor',x0+33,4,{period:4,phase:.5},{h:14});
  b.on('commuter',x0+8,G,{range:5});b.on('luggage',x0+25,G,{range:6});
  if(d>1)b.on('slime',x0+43,G,{range:4});
  b.o('heart',x0+25,12);
  return [[24,16],[45,9],[11,10],[22,12]]},
 /* 行李堆：箱子垒成台阶，行李箱满地乱滚，碎石挡路 */
 baggage:function(b,x0,G,d){
  b.fill(x0+9,G-2,2,2,C.brick);b.fill(x0+21,G-2,2,2,C.brick);b.fill(x0+30,G-3,2,3,C.brick);b.o('rubble',x0+39,G-2,{hp:2});
  plats(b,x0,[[4,13,4],[14,10,5],[24,9,5],[34,10,5],[43,12,5]]);
  b.on('luggage',x0+15,G,{range:5});b.o('bat',x0+27,7,{range:4,hp:1});
  if(d>1)b.on('commuter',x0+35,G,{range:3});
  b.o('heart',x0+16,9);
  return [[25,8],[44,11],[35,9],[5,12]]},
 /* 吊环长廊：三个吊环依次摆过，像一波接一波的摆动 */
 aisle:function(b,x0,G,d){
  plats(b,x0,[[6,13,4],[13,11,4],[20,9,5],[30,9,5],[38,11,4],[45,13,4]]);
  [12,24,36].forEach(function(sx,i){b.o('strap',x0+sx,4,{period:3.2,phase:i*.33},{h:13.3})});
  b.on('commuter',x0+44,G,{range:4});if(d>1)b.o('bee',x0+20,6,{range:5,hp:1});
  b.o('heart',x0+14,10);
  return [[31,8],[46,12],[21,8],[7,12]]},
 rest:function(b,x0,G,d){
  plats(b,x0,[[5,13,5],[12,11,5],[20,9,5],[29,11,5],[38,13,5]]);
  b.on('slime',x0+24,G,{range:5});b.o('heart',x0+16,10);
  return [[21,8],[39,12],[6,12],[13,10]]}
};

/* ============================ 第 2 章：设备车厢（闪灯） ============================ */
var T2={
 /* 线路间：电火花虫趴在电线上，灯一灭它们就朝你扑来 */
 wiring:function(b,x0,G,d){
  plats(b,x0,[[5,13,5],[13,10,5],[22,8,5],[31,10,5],[41,13,5]]);
  b.o('sparkbug',x0+14,6,{range:6});b.o('sparkbug',x0+27,7,{range:6});if(d>1)b.o('sparkbug',x0+39,6,{range:6});
  b.o('liveplate',x0+8,G-1,{period:3.4,phase:0});b.o('liveplate',x0+30,G-1,{period:3.4,phase:.5});
  b.o('heart',x0+14,9);
  return [[23,7],[42,12],[32,9],[6,12]]},
 /* 配电室：断路器砸地放电击波，地上还有带电地板 */
 switchroom:function(b,x0,G,d){
  plats(b,x0,[[4,13,5],[11,11,5],[19,9,5],[28,9,5],[36,11,4],[43,13,5]]);
  b.on('breaker',x0+13,G);b.on('breaker',x0+37,G);b.o('liveplate',x0+24,G-1,{period:3.4,phase:.25});
  if(d>1)b.o('sparkbug',x0+31,7,{range:5});
  b.o('heart',x0+38,10);
  return [[29,8],[44,12],[20,8],[12,10]]},
 /* 冲压间：三台液压冲头轮流砸地；站在冲头正下方拿水晶是要赌时机的 */
 press:function(b,x0,G,d){
  plats(b,x0,[[4,13,5],[15,13,5],[27,13,5],[39,13,5],[16,10,4],[28,10,4],[40,10,4]]);
  [12,24,36].forEach(function(sx,i){b.o('piston',x0+sx,4,{period:3.6,phase:i*.33,len:13.25})});
  b.o('sparkbug',x0+20,7,{range:8});if(d>1)b.o('sparkbug',x0+44,7,{range:4});
  b.o('heart',x0+6,12);
  return [[25,16],[29,9],[41,9],[17,9]]},
 /* 传送带间：带子逆着转，带电地板夹在中间 */
 belt2:function(b,x0,G,d){
  plats(b,x0,[[5,13,5],[13,11,5],[21,9,5],[29,9,5],[37,13,5]]);
  b.on('conveyor',x0+8,G,{dir:1,speed:90});b.on('conveyor',x0+22,G,{dir:-1,speed:90});b.on('conveyor',x0+36,G,{dir:1,speed:90});
  b.o('sparkbug',x0+14,7,{range:6});if(d>1)b.o('sparkbug',x0+34,7,{range:6});
  b.o('liveplate',x0+28,G-1,{period:3.4,phase:.5});
  b.o('heart',x0+14,10);
  return [[30,8],[22,8],[6,12],[38,12]]},
 /* 发电机间：等离子体、电弧、断路器一起上 */
 gen:function(b,x0,G,d){
  plats(b,x0,[[4,13,5],[10,10,5],[20,10,5],[30,8,5],[42,11,5]]);
  b.o('plasma',x0+15,G-2,{period:2.5});b.o('voltarc',x0+27,14,{period:2.8});b.on('breaker',x0+37,G);
  b.o('sparkbug',x0+24,6,{range:6});if(d>2)b.o('plasma',x0+46,G-2,{period:2.5,phase:1});
  b.o('heart',x0+13,9);
  return [[31,7],[43,10],[5,12],[11,9]]},
 relay:function(b,x0,G,d){
  plats(b,x0,[[6,13,5],[15,11,5],[26,9,5],[37,11,5]]);
  b.on('breaker',x0+20,G);b.o('sparkbug',x0+10,8,{range:5});b.o('sparkbug',x0+41,8,{range:5});
  b.o('heart',x0+16,10);
  return [[27,8],[38,10],[7,12],[17,10]]}
};

/* ============================ 第 3 章：隧道区间（漆黑） ============================ */
var T3={
 /* 滴水车厢：车顶渗水，地板结冰，暗处还有东西盯着你 */
 wet:function(b,x0,G,d){
  b.fill(x0+8,G,10,1,C.ice);b.fill(x0+30,G,10,1,C.ice);
  plats(b,x0,[[6,13,5],[14,11,5],[24,9,5],[34,11,5],[43,13,5]]);
  [10,21,31,43].forEach(function(sx){b.o('dripper',x0+sx,4,{hp:2})});
  b.on('lurker',x0+26,G,{range:6});
  b.o('heart',x0+15,10);
  return [[25,8],[44,12],[35,10],[7,12]]},
 /* 第三轨：三段带电的钢轨横在地上，只能跳过去 */
 rail:function(b,x0,G,d){
  plats(b,x0,[[5,13,4],[14,11,5],[27,10,5],[36,12,5],[44,13,4]]);
  [9,23,37].forEach(function(sx){b.o('thirdrail',x0+sx,G-1)});
  b.on('lurker',x0+17,G,{range:5});b.o('dripper',x0+30,4,{hp:2});if(d>1)b.on('lurker',x0+44,G,{range:3});
  b.o('heart',x0+15,10);
  return [[28,9],[45,12],[6,12],[37,11]]},
 /* 爬行区：车顶垂着断裂的横梁，潜伏者一只接一只 */
 crawl:function(b,x0,G,d){
  b.fill(x0+17,4,4,5,C.brick);b.fill(x0+35,4,3,6,C.brick);
  plats(b,x0,[[5,13,5],[13,12,4],[24,10,5],[30,13,4],[40,10,4],[45,13,3]]);
  b.on('lurker',x0+10,G,{range:4});b.on('lurker',x0+27,G,{range:5});if(d>1)b.on('lurker',x0+42,G,{range:4});
  b.o('dripper',x0+22,4,{hp:2});
  b.o('heart',x0+31,12);
  return [[25,9],[41,9],[14,11],[6,12]]},
 /* 冷凝水车厢：冰面打滑，冰锥掉落，低温陷阱 */
 ice3:function(b,x0,G,d){
  b.fill(x0+6,G,11,1,C.ice);b.fill(x0+31,G,11,1,C.ice);
  plats(b,x0,[[4,13,4],[13,11,5],[23,9,5],[33,11,5],[42,13,5]]);
  b.o('cryotrap',x0+22,G-1,{period:4});b.o('icicle',x0+12,5,{delay:.5});b.o('icicle',x0+37,5,{delay:.5});
  b.o('wraith',x0+17,8,{hp:3});if(d>2)b.o('wraith',x0+40,7,{hp:3});
  b.o('heart',x0+14,10);
  return [[24,8],[43,12],[34,10],[5,12]]},
 /* 幽灵乘客：被遗忘的乘客在黑暗里飘 */
 ghost3:function(b,x0,G,d){
  plats(b,x0,[[5,13,5],[14,11,5],[24,9,5],[34,11,5],[43,13,5]]);
  b.o('wraith',x0+14,8,{hp:3});b.o('wraith',x0+34,9,{hp:3});b.o('ghost',x0+24,6,{hp:2});
  b.o('thirdrail',x0+20,G-1);b.on('lurker',x0+41,G,{range:4});
  b.o('heart',x0+15,10);
  return [[25,8],[44,12],[35,10],[6,12]]},
 /* Boss 战：迷途列车。场地中间一座高台，两头各一座，用来躲冲撞；车灯是黑暗里唯一的光 */
 arena:function(b,x0,G,d){
  plats(b,x0,[[5,13,5],[12,11,6],[21,9,8],[32,11,6],[40,13,5]]);
  b.o('checkpoint',x0+6,16);
  b.o('heart',x0+14,10);b.o('heart',x0+34,10);
  for(var x=x0+4;x<x0+46;x+=9)b.o('lamp',x,4);
  b.on('boss',x0+34,G,{boss:'train',hp:28,left:x0+2},{w:8,h:5,label:'迷途列车'});
  return [[24,8],[16,10],[36,10],[46,16]]}
};

/* ============================ 第 4 章：驶向车头（信号紊乱） ============================ */
var T4={
 /* 扫描线：两道数据光幕贴着地板来回扫，乱码体飘在半空 */
 scan:function(b,x0,G,d){
  plats(b,x0,[[5,13,5],[14,11,5],[24,9,5],[34,11,5],[43,13,5]]);
  b.o('scanner',x0+8,G-2,{dx:14,speed:110,phase:0},{h:2});b.o('scanner',x0+27,G-2,{dx:14,speed:110,phase:1},{h:2});
  b.o('glitch',x0+34,7,{range:5});if(d>2)b.o('glitch',x0+16,6,{range:4});
  b.o('heart',x0+15,10);
  return [[25,8],[44,12],[35,10],[6,12]]},
 /* 检票口：检票员远远地丢车票，砖垛当掩体 */
 ticket:function(b,x0,G,d){
  b.fill(x0+22,G-2,2,2,C.brick);b.fill(x0+8,G-1,2,1,C.brick);
  plats(b,x0,[[4,12,5],[13,9,5],[24,12,5],[31,9,5],[41,12,5]]);
  b.on('ticketer',x0+13,G,{range:4});b.on('ticketer',x0+37,G,{range:4});b.on('turret',x0+46,G,{dir:-1,rate:2});
  if(d>2)b.o('glitch',x0+28,6,{range:4});
  b.o('heart',x0+14,8);
  return [[32,8],[42,11],[5,11],[25,11]]},
 /* 加速段：顶头风、逆风，锯在地上来回，乱码体打游击 */
 speed:function(b,x0,G,d){
  plats(b,x0,[[5,13,4],[14,10,5],[22,13,4],[30,10,5],[42,12,5]]);
  b.o('wind',x0+9,9,{dir:-1,strength:900},{w:10,h:9});b.o('wind',x0+33,9,{dir:1,strength:900},{w:10,h:9});
  b.o('saw',x0+24,15,{dx:4,dy:0,speed:70});b.o('glitch',x0+20,7,{range:5});
  b.o('heart',x0+15,9);
  return [[31,9],[43,11],[6,12],[23,12]]},
 /* 信号室：异常体瞬移、哨兵压阵，扫描线从脚下扫过 */
 signal:function(b,x0,G,d){
  plats(b,x0,[[4,13,5],[13,11,5],[23,9,5],[33,11,5],[43,13,5]]);
  b.o('anomaly',x0+18,7,{hp:3});b.on('sentinel',x0+38,G,{range:5,hp:4});b.o('glitch',x0+28,6,{range:5});
  b.o('scanner',x0+6,G-2,{dx:10,speed:120,phase:0},{h:2});
  b.o('heart',x0+14,10);
  return [[24,8],[44,12],[34,10],[5,12]]},
 cab:function(b,x0,G,d){
  plats(b,x0,[[6,13,5],[15,11,5],[26,9,5],[37,11,5]]);
  b.on('ticketer',x0+22,G,{range:4});b.o('glitch',x0+32,7,{range:4});
  b.o('heart',x0+16,10);
  return [[27,8],[38,10],[7,12],[17,10]]}
};
var TYPES={};[T1,T2,T3,T4].forEach(function(T){for(var k in T)TYPES[k]=T[k]});

/* 各章车厢的背景装饰（顶灯 / 扶手 / 广告 / 座椅）：隧道里没有广告，灯也稀 */
function decor(b,x0,x1,G,k,last,ch,t){
 var x;
 if(ch===3){for(x=x0+8;x<x1-4;x+=14)b.o('lamp',x,4)}else for(x=x0+3;x<x1-2;x+=6)b.o('lamp',x,4);
 for(x=x0+9;x<x1-6;x+=12)b.o('beam',x,12);
 /* 15号线旗子已删除（总是插到窗户上） */
 if(ch===1&&(t==='seat'||t==='rest')){[x0+9,x0+21,x0+33].forEach(function(sx){b.on('bench',sx,G)})}
 if(!last){b.o('pillar',x1-1,G-5);b.o('wind',x1-3,G-7,{dir:-1,strength:500},{w:3,h:7})}
 if(k>0)b.o('checkpoint',x0+1,16)}

function metroLevel(name,bg,objective,intro,cars,d,yPrefix){
 d=d||1;var W=CAR*cars.length,ch=+String(bg).slice(3)||1;
 return R(name,bg,W,20,objective,intro,function(b){
  var G=b.G,yn=0;
  function Y(x,y){b.o('yellowshard',x,y,{},{id:(yPrefix||'y')+(++yn)})}
  b.floors([[0,W]]);
  b.fill(0,0,W,4,C.ground);                      /* 整关通顶：车厢顶 4 格 */
  b.base();
  cars.forEach(function(car,k){
   var x0=k*CAR,x1=x0+CAR,t=car.t||'rest',last=k===cars.length-1;
   decor(b,x0,x1,G,k,last,ch,t);
   var fn=TYPES[t]||TYPES.rest,spots=fn(b,x0,G,d)||[],n=car.y==null?2:car.y;
   spots.slice(0,n).forEach(function(s){Y(x0+s[0],s[1])});
   if(car.npc)b.on(car.npc[0],x0+(car.npc[2]||5),G,{},{say:S.apply(null,String(car.npc[1]).split('|'))})});
 });
}
L15.metroLevel=metroLevel;L15.METRO_CAR=CAR;
})();
