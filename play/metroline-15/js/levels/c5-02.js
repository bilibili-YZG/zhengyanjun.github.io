/* 第五章 · 黎明的曙光 · 02 · 操场 —— 放学后的操场，球满场乱蹦（150 格）
   教学：失控的篮球（挥鞭把它打出去，能撞倒怪、敲响放学铃）· 放学铃 + 值日闸 · 值日扫帚的尘浪 */
L15.addLevel('c5',2,L15.R("02 · 操场",'dawn',150,20,"穿过操场，在放学铃响起的时候冲过值日闸","球满场乱蹦。挥一下教鞭，把它们打出去吧。",function(b){
 var G=b.G,S=L15.S,C=L15.CELL;
 b.floors([[0,150]]);b.base();
 b.o('cloud',10,3,{});b.o('cloud',50,5,{});b.o('cloud',100,3,{});b.o('cloud',130,6,{});
 /* ---------- 球场 A（0-46）：认识篮球 ---------- */
 b.o('goalpost',14,G-4,{});b.o('bench',4,G-1,{});b.o('lamppost',40,G-6);b.o('sunflag',44,G-10,{});
 b.on('hoop',24,G,{range:6});b.on('hoop',31,G,{range:5});
 b.on('student',7,G,{},{say:S('学生：老师！那个球不对劲，它自己在蹦！','学生：用教鞭把它打出去——它会撞倒路上的东西。','学生：前面那个铜铃是放学铃，敲响它，值日闸会打开一会儿。')});
 b.plats([[18,G-4,4],[36,G-5,5]]);b.o('shard',19,G-5);b.o('shard',38,G-6);
 b.o('checkpoint',8,G-2);
 /* ---------- 球场 B（46-90）：敲铃过闸 ---------- */
 b.on('broom',50,G,{range:5,hp:3});
 b.on('hoop',56,G,{range:6});
 var bell=b.o('bell',64,G-3,{});
 b.fill(78,0,1,G-4,C.brick);
 var gate=b.o('gate',78,G-4,{},{w:1,h:4});b.link(bell,gate);
 b.o('bench',70,G-1,{});b.o('crate',86,G-1,{});
 b.o('checkpoint',72,G-2);
 b.o('shard',60,G-4);
 b.plats([[84,G-4,4],[88,G-7,4]]);b.o('heart',89,G-8);
 /* ---------- 球场 C（90-150）：扫帚、篮球、高处平台 ---------- */
 b.on('broom',96,G,{range:5,hp:3});b.on('hoop',104,G,{range:7});b.on('broom',118,G,{range:5,hp:3});
 b.o('paperplane',108,G-7,{hp:1});b.o('paperplane',128,G-8,{hp:1});
 b.plats([[100,G-4,5],[110,G-7,5],[122,G-5,4],[130,G-8,5]]);
 b.o('shard',112,G-8);
 b.o('checkpoint',94,G-2);b.o('checkpoint',124,G-2);
 b.o('goalpost',136,G-4,{});b.o('lamppost',142,G-6);
 b.on('scientist',146,G,{},{say:S('科学家：球的弹跳，是能量在“动能”和“弹性势能”之间来回换。','科学家：你把它打出去，就是给它加了一份能量——所以它能撞倒东西。','科学家：前面是林荫道。小心你自己的影子。')});
}));
