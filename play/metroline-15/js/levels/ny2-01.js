/* ny2-01 零点钟魔 —— 雪镇跨年 · 第 2 章 第 1 关（180 格宽：钟楼走廊 → Boss 战） */
L15.addLevel('ny2',1,L15.R("01 · 零点钟魔",'t_ny2',180,28,"登上钟楼，击败零点钟魔，让钟声在零点响起","钟楼里滴答作响，指针停在 11 点 59 分……",function(b){
 var G=b.G,C=L15.CELL,S=L15.S;
 b.floors([[0,180]]);b.base();
 b.fill(0,0,180,3,C.brick); /* 钟楼的顶 */
 /* ---------- 走廊 A · 楼梯间（0-38） ---------- */
 b.o('bunting',0,4,{},{w:20});b.o('bunting',20,4,{},{w:20});b.o('streamers',8,3,{},{h:4});b.o('streamers',30,3,{},{h:4});
 b.o('clocktower',4,G-12,{});
 b.on('mate',9,G,{tex:'c'},{say:S('四班同学：老师加油！我们都在台下等着。','四班同学：听说钟魔不怕普通攻击，但它一“报时”之后会喘气——那时候最好打。')});
 b.o('checkpoint',16,G-2);
 b.plats([[20,G-4,5],[28,G-7,5]]);b.o('gift',22,G-6);b.o('gift',30,G-9);b.o('candy',24,G-6);
 b.on('snowling',26,G,{range:5});b.o('balloon',34,G-6,{range:5});
 /* ---------- 走廊 B · 彩带门与礼花筒（38-80） ---------- */
 b.o('bunting',40,4,{},{w:20});b.o('bunting',60,4,{},{w:20});
 b.fill(46,G-9,4,4,C.brick);b.o('ribbongate',47,G-5,{period:4,phase:0},{h:5});
 b.fill(66,G-9,4,4,C.brick);b.o('ribbongate',67,G-5,{period:4,phase:.5},{h:5});
 b.o('popper',54,G-1);b.plats([[52,G-8,6],[60,G-12,5],[72,G-6,5]]);b.o('gift',54,G-10);b.o('gift',62,G-14);b.o('cake',74,G-8);
 b.o('lightstring',58,G-9,{period:3.2,phase:0},{h:8});b.o('lightstring',76,G-9,{period:3.2,phase:.5},{h:8});
 b.on('toysoldier',42,G,{range:5});b.on('clown',64,G,{range:4});
 b.o('checkpoint',56,G-2);
 /* ---------- 走廊 C · 礼炮与烟花（80-112） ---------- */
 b.o('bunting',80,4,{},{w:20});b.o('bunting',100,4,{},{w:20});
 b.fill(86,G-3,6,3,C.brick);b.on('rocketeer',88,G-3,{});b.fill(100,G-4,6,4,C.brick);b.on('rocketeer',102,G-4,{});
 b.o('salute',92,G-1,{period:4,phase:0},{w:8,h:1});b.o('balloonrow',82,G-2,{dx:26,speed:120,phase:.3},{h:2});
 b.plats([[90,G-7,5],[104,G-7,5]]);b.o('gift',92,G-9);b.o('gift',106,G-9);b.o('sparkler',84,G-3);b.o('candy',108,G-3);
 b.on('seller',110,G,{},{say:S('气球叔叔：再往前就是大钟的广场了，我就送到这里。','气球叔叔：它的招数很多——地上的红圈是落点，成排的火柱要从缝里钻，天上会落烟花。','气球叔叔：最要命的是“倒数”，数到 0 的时候整个大厅炸开，只有缝隙是安全的。')});
 /* ---------- Boss 战（116-180） ---------- */
 b.o('checkpoint',118,G-2);b.o('candy',120,G-3);
 b.o('clocktower',122,G-12,{});b.o('clocktower',170,G-12,{});
 b.o('stagebanner',140,6,{},{w:12,h:2});
 b.o('bunting',116,4,{},{w:20});b.o('bunting',136,4,{},{w:20});b.o('bunting',156,4,{},{w:20});b.o('streamers',126,3,{},{h:4});b.o('streamers',146,3,{},{h:4});b.o('streamers',164,3,{},{h:4});
 b.o('balloons',121,G-4,{});b.o('balloons',139,G-4,{});b.o('balloons',159,G-4,{});b.o('partytree',130,G-6,{});b.o('partytree',165,G-6,{});b.o('giftpile',152,G-1,{});
 for(var x=120;x<176;x+=8){b.o('lamp',x,5)}
 b.plats([[124,G-6,6],[168,G-6,6],[144,G-9,9]]);b.o('cake',148,G-11);b.o('candy',126,G-8);b.o('candy',170,G-8);
 b.on('boss',148,G,{boss:'midnight',hp:26,left:118},{w:7,h:6,label:'零点钟魔'});
}));
