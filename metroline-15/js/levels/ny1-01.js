/* ny1-01 雪镇欢庆 —— 雪镇跨年 · 第 1 章 第 1 关（240 格宽，五个街区：广场 → 冰湖 → 灯会长街 → 礼炮巷 → 钟楼广场） */
L15.addLevel('ny1',1,L15.R("01 · 雪镇欢庆",'t_ny1',240,26,"穿过雪镇，把散落的礼物带去钟楼广场（礼物不强制收集）","雪在下，灯一盏盏亮起来，雪镇正在准备迎接新的一年……",function(b){
 var G=b.G,C=L15.CELL,S=L15.S;
 b.floors([[0,240]]);b.base();
 /* ---------- 街区 1 · 雪镇广场（0-48） ---------- */
 b.o('bunting',0,3,{},{w:24});b.o('bunting',24,3,{},{w:24});
 b.o('snowhouse',6,G-5,{});b.o('snowhouse',36,G-5,{});b.o('partytree',16,G-6,{});b.o('stagebanner',10,6,{},{w:10,h:2});
 b.on('host',8,G,{},{say:S('报幕员：欢迎来到雪镇的跨年庆典！','报幕员：礼物被淘气的雪团怪和气球怪弄散了，全镇人都在等老师把它们带去钟楼广场。','报幕员：用 ↑ 跳、攻击键戳破气球、冲刺能穿过危险——先热热身吧。')});
 b.o('checkpoint',20,G-2);
 b.o('gift',14,G-3);b.o('gift',27,G-6);b.o('candy',23,G-6);
 b.plats([[22,G-4,5],[30,G-7,4],[37,G-4,5]]);b.o('gift',32,G-9);
 b.on('snowling',33,G,{range:5});
 b.on('mate',43,G,{tex:'a'},{say:S('四班同学：老师！前面是冰湖，地面会打滑。','四班同学：小心头顶飘着的气球怪——它们靠近了会鼓起来，“砰”地炸开。')});
 /* ---------- 街区 2 · 冰湖滑行（48-96） ---------- */
 b.fill(48,G,48,2,C.ice);b.fill(70,G,4,2,0);
 b.plat(69,G-2,6);b.o('spikes',70,G+1,{},{w:4});
 b.o('bunting',48,3,{},{w:24});b.o('bunting',72,3,{},{w:24});
 b.o('firetower',52,G-6,{});b.o('partytree',90,G-6,{});
 b.o('popper',55,G-1);b.plats([[53,G-9,6],[63,G-6,5],[80,G-6,5]]);
 b.o('gift',55,G-11);b.o('cake',57,G-11);b.o('gift',65,G-8);b.o('gift',82,G-8);
 b.o('balloon',60,G-6,{range:6});b.o('balloon',84,G-8,{range:6});
 b.on('clown',78,G,{range:5});b.on('snowling',92,G,{range:5});
 b.o('lightstring',66,G-9,{period:3.2,phase:0},{h:8});
 b.o('checkpoint',74,G-2);b.o('sparkler',88,G-3);
 b.on('kid',50,G,{},{say:S('小孩：看！我的彩带能飘上天！','小孩：冰面上刹不住脚，别在上面发呆，会滑下去的。')});
 /* ---------- 街区 3 · 灯会长街（96-144） ---------- */
 b.o('bunting',96,3,{},{w:24});b.o('bunting',120,3,{},{w:24});
 b.o('snowhouse',98,G-5,{});b.o('snowhouse',138,G-5,{});b.o('balloons',112,G-4,{});b.o('balloons',132,G-4,{});
 b.fill(104,G-3,6,3,C.brick);b.on('rocketeer',106,G-3,{});
 b.fill(130,G-4,6,4,C.brick);b.on('rocketeer',132,G-4,{});
 b.plats([[98,G-6,4],[112,G-8,5],[122,G-10,5],[116,G-12,3]]);b.o('gift',99,G-8);b.o('gift',114,G-10);b.o('gift',124,G-12);b.o('candy',117,G-14);
 b.o('lightstring',114,G-9,{period:3.2,phase:.2},{h:8});
 b.fill(121,G-9,4,4,C.brick);b.o('ribbongate',122,G-5,{period:4,phase:0},{h:5});
 b.on('toysoldier',115,G,{range:6});b.on('clown',140,G,{range:4});
 b.o('checkpoint',118,G-2);
 b.on('seller',100,G,{},{say:S('气球叔叔：来来来，灯会长街，免费气球！','气球叔叔：路边的彩带门每隔几秒就合拢一次，看它闪就要停。','气球叔叔：屋顶上有人在放烟花，落下来的星星可以用剑弹开。')});
 /* ---------- 街区 4 · 礼炮巷（144-192） ---------- */
 b.o('bunting',144,3,{},{w:24});b.o('bunting',168,3,{},{w:24});
 b.o('firetower',146,G-6,{});b.o('partytree',186,G-6,{});
 b.o('salute',150,G-1,{period:4,phase:0},{w:10,h:1});b.o('salute',164,G-1,{period:4,phase:.5},{w:10,h:1});b.o('salute',178,G-1,{period:3.6,phase:.25},{w:8,h:1});
 b.o('balloonrow',150,G-2,{dx:30,speed:120,phase:0},{h:2});
 b.plats([[152,G-6,5],[166,G-6,5],[180,G-6,4]]);b.o('gift',154,G-8);b.o('gift',168,G-8);b.o('gift',182,G-8);b.o('sparkler',148,G-3);
 b.on('toysoldier',172,G,{range:7});b.on('snowling',158,G,{range:4});b.o('balloon',186,G-8,{range:5});
 b.o('checkpoint',176,G-2);
 b.on('mate',146,G,{tex:'b'},{say:S('四班同学：前面是礼炮巷！火花会顺着引线一路点过去，一个接一个炸。','四班同学：气球串也在地上飘，跳过去，或者冲刺穿过去。')});
 /* ---------- 街区 5 · 钟楼广场（192-240） ---------- */
 b.o('bunting',192,3,{},{w:24});b.o('bunting',216,3,{},{w:24});
 b.o('clocktower',212,G-12,{});b.o('stagebanner',196,6,{},{w:10,h:2});b.o('giftpile',204,G-1,{});
 b.fill(196,G-1,3,1,C.brick);b.fill(199,G-2,3,2,C.brick);b.fill(202,G-3,5,3,C.brick);
 b.on('rocketeer',204,G-3,{});b.on('snowling',210,G,{range:4});b.o('balloon',222,G-6,{range:5});b.on('clown',226,G,{range:4});
 b.o('cake',200,G-5);b.o('gift',206,G-6);b.o('gift',220,G-4);b.o('gift',228,G-4);
 b.plats([[218,G-5,4],[226,G-7,4]]);
 b.o('checkpoint',194,G-2);
 b.on('bellkeeper',233,G,{},{say:S('守钟人：老师，您终于到了。','守钟人：钟楼里的大钟一直不肯报时，里面好像住着个什么东西……','守钟人：通关这里，就去楼上看看吧。')});
}));
