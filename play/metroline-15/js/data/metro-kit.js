/* 地铁DLC 关卡积木：一关 = 6 节车厢（每节 50 格，共 300 格），整关通顶、地板贯通。
   L15.metroLevel(名称, 背景, 目标, 开场, 车厢列表, 难度d)
   车厢：{t:类型, npc:[角色kind, 台词(用 | 分隔多句)]}，类型：
     plain 基础 · spikes 尖刺+碎裂 · laser 激光+炮台 · belt 传送带+无人机+电弧 · saw 锯+装甲兵+弹簧 · mix 综合(哨兵)
   背景：车窗外的风景由主题的滚动背景表现（飞驰列车 biome：metro / 自定义主题 base:'metro'）。 */
(function(){
var R=L15.R,S=L15.S,C=L15.CELL,CAR=50;

function metroLevel(name,bg,objective,intro,cars,d,yPrefix){
 d=d||1;var W=CAR*cars.length;
 return R(name,bg,W,20,objective,intro,function(b){
  var G=b.G,yn=0;
  function Y(x,y){b.o('yellowshard',x,y,{},{id:(yPrefix||'y')+(++yn)})}
  b.floors([[0,W]]);
  b.fill(0,0,W,4,C.ground);                      /* 整关通顶：白色车厢顶 4 格 */
  b.base();
  cars.forEach(function(car,k){
   var x0=k*CAR,x1=x0+CAR,x,last=k===cars.length-1;
   /* ---- 车厢背景：顶灯 / 扶手杆 / 座椅 / 线路图 / 广告牌 / 贯通道门框 + 穿堂风 ---- */
   for(x=x0+3;x<x1-2;x+=6)b.o('lamp',x,4);
   for(x=x0+9;x<x1-6;x+=12)b.o('beam',x,12);
   b.o('banner',x0+4,5);b.o('banner',x0+40,5);
   [x0+9,x0+21,x0+33].forEach(function(sx){b.on('bench',sx,G)});
   if(!last){b.o('pillar',x1-1,G-5);b.o('wind',x1-3,G-7,{dir:-1,strength:500},{w:3,h:7})}
   if(k>0)b.o('checkpoint',x0+1,16);
   /* ---- 平台（吊环/行李架）和黄色水晶 ---- */
   var P=[[6,13],[13,11],[19,9],[27,12],[34,10],[41,13]];
   P.forEach(function(p){b.plat(x0+p[0],p[1],4);Y(x0+p[0]+1,p[1]-1)});
   Y(x0+10,16);Y(x0+30,16);
   if(!last||true)b.o('heart',x0+20,8);
   /* ---- 车厢类型 ---- */
   switch(car.t){
    case'spikes':b.o('spikes',x0+11,17);b.o('spikes',x0+25,17);b.o('spikes',x0+38,17);b.o('crumble',x0+32,16,{delay:.45,respawn:3});b.on('slime',x0+16,G,{range:5});if(d>1)b.o('bat',x0+28,8,{range:4,hp:1});break;
    case'laser':b.o('laser',x0+10,13,{period:3});b.o('laser',x0+24,13,{period:3});b.o('laser',x0+38,13,{period:3});b.on('turret',x0+44,G,{dir:-1,rate:2});b.o('bat',x0+18,8,{range:4,hp:1});if(d>1)b.on('turret',x0+30,G,{dir:-1,rate:2});break;
    case'belt':b.on('conveyor',x0+8,G,{dir:1,speed:90});b.on('conveyor',x0+22,G,{dir:-1,speed:90});b.on('conveyor',x0+36,G,{dir:1,speed:90});b.o('drone',x0+14,7,{range:6,hp:2});b.o('voltarc',x0+28,14,{period:2.8});if(d>1)b.o('drone',x0+34,6,{range:6,hp:2});break;
    case'saw':b.o('saw',x0+14,15,{dx:4,dy:0,speed:60});b.o('saw',x0+30,15,{dx:4,dy:0,speed:60+d*8});b.on('guard',x0+22,G,{range:6});b.o('spring',x0+8,17);if(d>2)b.o('bat',x0+40,7,{range:5,hp:1});break;
    case'mix':b.on('sentinel',x0+38,G,{range:6,hp:4});b.o('laser',x0+16,13,{period:3});b.o('voltarc',x0+26,14,{period:2.8});b.o('drone',x0+20,7,{range:6,hp:2});if(d>2)b.on('turret',x0+44,G,{dir:-1,rate:1.6});break;
    default:b.on('slime',x0+14,G,{range:5});b.on('slime',x0+34,G,{range:5});b.o('spikes',x0+24,17);if(d>2)b.o('bat',x0+30,8,{range:4,hp:1})}
   /* ---- 车厢里的人 ---- */
   if(car.npc)b.on(car.npc[0],x0+(car.npc[2]||5),G,{},{say:S.apply(null,String(car.npc[1]).split('|'))})});
 });
}
L15.metroLevel=metroLevel;L15.METRO_CAR=CAR;
})();
