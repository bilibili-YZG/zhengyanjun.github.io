/* 地铁DLC 关卡积木：一关 = 6 节车厢（每节 50 格，共 300 格），整关通顶、地板贯通。
   L15.metroLevel(名称, 背景, 目标, 开场, 车厢列表, 难度d, 水晶id前缀)
   车厢：{t:类型, l:平台布局(A/B/C/D，可省略，默认按车厢序号轮换), npc:[角色kind, 台词(用 | 分隔多句), 横向偏移(可省略)]}
   类型：
     plain 基础 · seat 座椅可踩+飞行怪 · spikes 碎玻璃+碎裂踏板 · laser 激光+炮台 · belt 传送带+无人机+电弧
     saw 锯+装甲兵+弹簧 · mix 综合(哨兵) · cargo 货箱+跳跳蛙+喷火+碎石 · power 配电(等离子/电弧/磁场/探测球)
     ice 结冰地板+冰锥+低温陷阱+怨灵 · ghost 幽灵乘客 · gravity 重力井+异常体+哨兵
   平台布局 A/B/C/D 的 y>=13 的踏板都避开了激光/电弧的位置，改布局时请保持这一点。 */
(function(){
var R=L15.R,S=L15.S,C=L15.CELL,CAR=50;
var LAY={
 A:[[6,13],[13,11],[19,9],[27,12],[34,10],[41,13]],
 B:[[5,14],[11,12],[17,10],[24,10],[31,12],[40,14]],
 C:[[4,13],[11,13],[16,11],[22,9],[28,11],[34,13],[40,13]],
 D:[[6,14],[13,12],[20,14],[26,11],[33,13],[40,10]]};
var LK=['A','B','C','D'];
/* 每种车厢地面上两枚水晶的横向位置（避开该车厢的机关） */
var GY={plain:[12,30],seat:[12,30],spikes:[14,30],laser:[13,31],belt:[13,31],saw:[10,41],mix:[12,32],cargo:[17,27],power:[10,30],ice:[4,28],ghost:[12,32],gravity:[10,32]};

function metroLevel(name,bg,objective,intro,cars,d,yPrefix){
 d=d||1;var W=CAR*cars.length;
 return R(name,bg,W,20,objective,intro,function(b){
  var G=b.G,yn=0;
  function Y(x,y){b.o('yellowshard',x,y,{},{id:(yPrefix||'y')+(++yn)})}
  b.floors([[0,W]]);
  b.fill(0,0,W,4,C.ground);                      /* 整关通顶：车厢顶 4 格 */
  b.base();
  cars.forEach(function(car,k){
   var x0=k*CAR,x1=x0+CAR,x,last=k===cars.length-1,t=car.t||'plain';
   /* ---- 车厢背景：顶灯 / 扶手杆 / 座椅 / 广告牌 / 贯通道门框 + 穿堂风 ---- */
   for(x=x0+3;x<x1-2;x+=6)b.o('lamp',x,4);
   for(x=x0+9;x<x1-6;x+=12)b.o('beam',x,12);
   b.o('banner',x0+4,5);b.o('banner',x0+40,5);
   if(t!=='cargo'&&t!=='ice'){[x0+9,x0+21,x0+33].forEach(function(sx){b.on('bench',sx,G)})}
   if(!last){b.o('pillar',x1-1,G-5);b.o('wind',x1-3,G-7,{dir:-1,strength:500},{w:3,h:7})}
   if(k>0)b.o('checkpoint',x0+1,16);
   /* ---- 行李架平台、保温杯和黄色水晶 ---- */
   var P=LAY[car.l||LK[(k+d)%4]];
   P.forEach(function(p){b.plat(x0+p[0],p[1],4);Y(x0+p[0]+1,p[1]-1)});
   var g=GY[t]||GY.plain;Y(x0+g[0],G-2);Y(x0+g[1],G-2);
   b.o('heart',x0+P[2][0]+2,P[2][1]-1);
   /* ---- 车厢类型 ---- */
   switch(t){
    case'seat':[9,21,33].forEach(function(sx){b.fill(x0+sx,G-1,3,1,C.brick)});b.o('bee',x0+15,9,{range:4,hp:1});b.o('bee',x0+38,8,{range:4,hp:1});if(d>1)b.o('probe',x0+27,7,{hp:2});if(d>2)b.o('ghost',x0+45,9,{hp:2});break;
    case'spikes':b.o('spikes',x0+11,17);b.o('spikes',x0+25,17);b.o('spikes',x0+38,17);b.o('crumble',x0+32,16,{delay:.45,respawn:3});b.on('slime',x0+16,G,{range:5});if(d>1)b.o('bat',x0+28,8,{range:4,hp:1});break;
    case'laser':b.o('laser',x0+10,13,{period:3});b.o('laser',x0+24,13,{period:3});b.o('laser',x0+38,13,{period:3});b.on('turret',x0+44,G,{dir:-1,rate:2});b.o('bat',x0+18,8,{range:4,hp:1});if(d>1)b.on('turret',x0+30,G,{dir:-1,rate:2});break;
    case'belt':b.on('conveyor',x0+8,G,{dir:1,speed:90});b.on('conveyor',x0+22,G,{dir:-1,speed:90});b.on('conveyor',x0+36,G,{dir:1,speed:90});b.o('drone',x0+14,7,{range:6,hp:2});b.o('voltarc',x0+28,14,{period:2.8});if(d>1)b.o('drone',x0+34,6,{range:6,hp:2});break;
    case'saw':b.o('saw',x0+14,15,{dx:4,dy:0,speed:60});b.o('saw',x0+30,15,{dx:4,dy:0,speed:60+d*8});b.on('guard',x0+22,G,{range:6});b.o('spring',x0+8,17);if(d>2)b.o('bat',x0+40,7,{range:5,hp:1});break;
    case'mix':b.on('sentinel',x0+38,G,{range:6,hp:4});b.o('laser',x0+16,13,{period:3});b.o('voltarc',x0+26,14,{period:2.8});b.o('drone',x0+20,7,{range:6,hp:2});if(d>2)b.on('turret',x0+44,G,{dir:-1,rate:1.6});if(d>3)b.o('anomaly',x0+32,8,{hp:3});break;
    case'cargo':b.fill(x0+12,G-2,2,2,C.brick);b.fill(x0+30,G-3,2,3,C.brick);b.on('guard',x0+8,G,{range:2,hp:3});b.on('frog',x0+19,G,{range:4,hp:2});b.o('rubble',x0+38,G-2,{hp:2});b.o('flame',x0+44,G-3,{period:3});b.o('bee',x0+24,8,{range:4,hp:1});if(d>2)b.o('probe',x0+34,7,{hp:2});break;
    case'power':b.o('plasma',x0+14,G-2,{period:2.5});b.o('voltarc',x0+28,14,{period:2.8});b.o('emfield',x0+34,G-3,{strength:.5});b.o('probe',x0+20,7,{hp:2});if(d>2)b.o('drone',x0+42,6,{range:6,hp:2});if(d>3)b.o('plasma',x0+44,G-2,{period:2.5,phase:1});break;
    case'ice':b.fill(x0+7,G,12,1,C.ice);b.fill(x0+30,G,12,1,C.ice);b.o('cryotrap',x0+22,G-1,{period:4});b.o('icicle',x0+26,5,{delay:.5});b.o('wraith',x0+15,8,{hp:3});if(d>2)b.o('wraith',x0+38,7,{hp:3});if(d>3)b.o('icicle',x0+45,5,{delay:.5});break;
    case'ghost':b.o('ghost',x0+14,8,{hp:2});b.o('ghost',x0+34,9,{hp:2});b.o('wraith',x0+24,7,{hp:3});if(d>3)b.o('anomaly',x0+44,8,{hp:3});break;
    case'gravity':b.o('gravwell',x0+24,G-3,{strength:1.2});b.o('anomaly',x0+14,8,{hp:3});b.on('sentinel',x0+38,G,{range:5,hp:4});if(d>3)b.o('wraith',x0+31,7,{hp:3});break;
    default:b.on('slime',x0+14,G,{range:5});b.on('slime',x0+34,G,{range:5});b.o('spikes',x0+24,17);if(d>2)b.o('bat',x0+30,8,{range:4,hp:1})}
   /* ---- 车厢里的人 ---- */
   if(car.npc)b.on(car.npc[0],x0+(car.npc[2]||5),G,{},{say:S.apply(null,String(car.npc[1]).split('|'))})});
 });
}
L15.metroLevel=metroLevel;L15.METRO_CAR=CAR;
})();
