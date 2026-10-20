/* 第三章 · 林下洞窟 · 03 · 蝙蝠回廊 —— 单关文件。
   可以单独复制/分享：放进 js/levels/，并在 index.html 与 editor.html 里保留对应的 <script> 即可。
   想在关卡工坊里改它：用工坊「导入」levels/ 目录下对应的 .level15.json。 */
(function(){
var R=L15.R,S=L15.S,C=L15.CELL;
L15.addLevel('c3',3,
R('03 · 蝙蝠回廊','underground',96,18,'趁蝙蝠被吵醒前通过，用冲刺水晶续航','蝙蝠靠回声定位——一靠近，它们就会俯冲。',function(b){
 b.fill(0,0,96,2,C.brick);b.floors([[0,20],[26,46],[52,72],[78,96]]);
 b.o('crumble',22,15);b.o('crumble',48,15);b.o('crumble',74,15);b.o('dashgem',23,11);b.o('dashgem',49,11);b.o('dashgem',75,11);
 b.fill(30,10,8,1,C.brick);b.o('bat',31,11,{range:4});b.o('bat',35,11,{range:4});
 b.fill(56,10,10,1,C.brick);b.o('bat',58,11,{range:4});b.o('bat',63,11,{range:4});
 b.o('laser',84,11,{period:2.2,phase:0});b.o('laser',90,11,{period:2.2,phase:1});
 b.o('stalactite',10,2);b.o('stalactite',40,2);b.o('stalactite',68,2);b.o('stalactite',88,2);b.on('mushroom',8,b.G);b.on('crystal',14,b.G);b.on('mushroom',44,b.G);
 b.o('checkpoint',27,14);b.o('checkpoint',53,14);b.o('checkpoint',79,14);b.o('heart',42,15);b.o('heart',68,15);
 b.base();
 b.on('hologram',4,b.G,{},{say:S('研究员投影：蝙蝠靠回声定位——声音遇到障碍会反射回来，它们靠这个看世界。','我：所以别在它们底下发呆，它们比你更会利用物理。','研究员投影：……说得对。')});
 b.each('shard',[[10,13],[16,13],[23,12],[31,14],[35,14],[41,13],[48,12],[58,14],[63,14],[69,13],[75,12],[86,13],[92,14]]);
})
);
})();
