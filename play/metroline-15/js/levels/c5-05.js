/* 第五章 · 黎明的曙光 · 05 · 校门口 —— 放学高峰的校门口，什么都挤在这一条路上（180 格）
   所有东西混在一起：电动车 · 影子 · 篮球 · 扫帚 · 纸飞机。最后的值日闸要靠球敲铃才能过 */
L15.addLevel('c5',5,L15.R("05 · 校门口",'dawn',180,20,"冲过放学高峰的校门口，把门打开","全校的人都在往外涌。校门口，是你每天最后一个关灯的地方。",function(b){
 var G=b.G,S=L15.S,C=L15.CELL;
 b.floors([[0,58],[64,120],[126,180]]);b.base();
 b.o('cloud',12,3,{});b.o('cloud',70,5,{});b.o('cloud',126,3,{});b.o('cloud',160,5,{});
 for(var x=10;x<120;x+=22)b.o('lamppost',x,G-6);
 /* ---------- A：校道 ---------- */
 b.o('ebike',12,G-1,{period:4,phase:0,dir:1},{w:16});b.o('ebike',36,G-1,{period:4,phase:.5,dir:-1},{w:18});
 b.on('shadow',26,G,{range:4,hp:1});b.on('broom',46,G,{range:4,hp:3});
 b.plats([[18,G-5,5],[30,G-7,5],[42,G-5,4]]);b.o('shard',31,G-8);b.o('shard',19,G-6);
 b.on('student',5,G,{},{say:S('学生：老师，今天放学特别挤。','学生：校门口的值日闸要敲铃才开。铃在门边，不过——您可以试试用球打它。')});
 b.o('checkpoint',8,G-2);b.o('checkpoint',52,G-2);
 b.o('paperplane',22,G-9,{hp:1});b.o('paperplane',48,G-9,{hp:1});
 /* ---------- 缺口 1（58-64） ---------- */
 b.plat(59,G-3,4);b.o('glider',56,G-3);
 /* ---------- B：车流 ---------- */
 b.o('ebike',68,G-1,{period:3.7,phase:0,dir:1},{w:14});b.o('ebike',88,G-1,{period:3.7,phase:.33,dir:-1},{w:16});b.o('ebike',106,G-1,{period:3.7,phase:.66,dir:1},{w:12});
 b.on('shadow',78,G,{range:4,hp:1});b.on('shadow',100,G,{range:4,hp:1});b.on('hoop',94,G,{range:7});
 b.plats([[72,G-5,4],[82,G-8,4],[92,G-5,5],[102,G-8,4],[112,G-5,4]]);b.o('shard',83,G-9);b.o('heart',103,G-9);
 b.o('paperplane',86,G-12,{hp:1});b.o('paperplane',110,G-11,{hp:1});
 b.o('checkpoint',66,G-2);b.o('checkpoint',116,G-2);
 /* ---------- 缺口 2（120-126） ---------- */
 b.plat(121,G-3,4);
 /* ---------- C：校门（铃 + 球 + 闸） ---------- */
 b.on('hoop',134,G,{range:5});b.on('hoop',142,G,{range:5});
 b.on('broom',150,G,{range:3,hp:3});b.on('shadow',140,G,{range:4,hp:1});
 var bell=b.o('bell',156,G-3,{});
 b.fill(166,0,1,G-4,C.brick);
 var gate=b.o('gate',166,G-4,{},{w:1,h:4});b.link(bell,gate);
 b.o('schoolgate',162,G-6,{},{w:10,h:6});b.o('bikerack',130,G-3,{});
 b.plats([[132,G-5,4],[146,G-6,5]]);b.o('shard',148,G-7);
 b.o('checkpoint',128,G-2);b.o('checkpoint',152,G-2);
 b.on('worker',172,G,{},{say:S('门卫大叔：这么晚才放学啊，老师。','门卫大叔：……门外的路，今晚有点不对劲。路面像被谁用红笔划过一样。','门卫大叔：您先歇口气。……不歇？那、那您当心。')});
}));
