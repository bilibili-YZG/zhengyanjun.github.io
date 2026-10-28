/* 第五章 · 黎明的曙光 · 03 · 林荫道 —— 放学的林荫道，电动车一辆接一辆，影子比人还长（170 格）
   教学：电动车道（车灯闪几下，一辆车贴地冲过来）· 夕阳的影子（照着你 1.2 秒前走的路追上来）· 纸飞机 */
L15.addLevel('c5',3,L15.R("03 · 林荫道",'dawn',170,20,"穿过林荫道。小心贴地冲来的电动车，还有你自己的影子","车灯一闪，就是电动车要来了。影子会走你走过的路——别停。",function(b){
 var G=b.G,S=L15.S,C=L15.CELL;
 b.floors([[0,56],[62,104],[110,170]]);b.base();
 b.o('cloud',14,3,{});b.o('cloud',66,4,{});b.o('cloud',120,3,{});
 for(var x=6;x<166;x+=14)b.o('tree',x===104?100:x,G-6,{});
 for(var y=10;y<160;y+=26)b.o('lamppost',y,G-6);
 /* ---------- 路段 A（0-56）：第一辆电动车 ---------- */
 b.o('bikerack',20,G-3,{});b.o('bench',34,G-1,{});
 b.o('ebike',12,G-1,{period:4.6,phase:0,dir:1},{w:14});
 b.o('ebike',34,G-1,{period:4.6,phase:.5,dir:-1},{w:16});
 b.on('student',4,G,{},{say:S('学生：老师，放学高峰，路上全是电动车！','学生：路口的灯闪黄色的时候，就是车要冲过来的前一秒——跳起来，或者躲到车棚后面。','学生：还有……您回头看看，地上那个黑黑的东西，是不是在跟着您？')});
 b.on('broom',46,G,{range:4,hp:3});
 b.plats([[24,G-4,4],[40,G-5,5]]);b.o('shard',25,G-5);b.o('shard',42,G-6);
 b.o('checkpoint',8,G-2);b.o('checkpoint',52,G-2);
 /* ---------- 缺口 1（56-62）：踩着车棚过去 ---------- */
 b.plat(57,G-3,4);b.o('paperplane',58,G-8,{hp:1});
 /* ---------- 路段 B（62-104）：影子 ---------- */
 b.on('shadow',74,G,{range:4,hp:1});b.on('shadow',92,G,{range:4,hp:1});
 b.o('ebike',66,G-1,{period:4.2,phase:.2,dir:1},{w:12});
 b.o('ebike',84,G-1,{period:4.2,phase:.7,dir:-1},{w:14});
 b.plats([[70,G-5,4],[80,G-7,4],[88,G-4,5],[96,G-6,4]]);b.o('shard',81,G-8);b.o('heart',97,G-7);
 b.o('bikerack',100,G-3,{});b.o('checkpoint',64,G-2);b.o('checkpoint',100,G-2);
 b.on('hoop',78,G,{range:6});
 /* ---------- 缺口 2（104-110） ---------- */
 b.plat(105,G-3,4);b.o('paperplane',106,G-8,{hp:1});
 /* ---------- 路段 C（110-170）：混战 ---------- */
 b.o('ebike',114,G-1,{period:3.9,phase:0,dir:1},{w:16});b.o('ebike',134,G-1,{period:3.9,phase:.45,dir:-1},{w:16});b.o('ebike',152,G-1,{period:3.9,phase:.2,dir:1},{w:12});
 b.on('shadow',120,G,{range:4,hp:1});b.on('shadow',144,G,{range:4,hp:1});b.on('broom',130,G,{range:5,hp:3});b.on('hoop',148,G,{range:6});
 b.plats([[118,G-5,5],[126,G-8,4],[138,G-5,5],[146,G-8,5],[156,G-5,4]]);
 b.o('paperplane',124,G-11,{hp:1});b.o('paperplane',150,G-11,{hp:1});
 b.o('shard',127,G-9);b.o('glider',116,G-3);b.o('checkpoint',112,G-2);b.o('checkpoint',142,G-2);
 b.on('worker',163,G,{},{say:S('维修机器人：滴——检测到人类。疲劳度 99+。','维修机器人：前面是教学楼外墙。脚手架在晃，请抓紧。')});
}));
