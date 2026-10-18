/* 第一章 · 雪原回响 · 05 · 暴风走廊 —— 单关文件。
   可以单独复制/分享：放进 js/levels/，并在 index.html 与 editor.html 里保留对应的 <script> 即可。
   想在关卡工坊里改它：用工坊「导入」levels/ 目录下对应的 .level15.json。 */
(function(){
var R=L15.R,S=L15.S,C=L15.CELL;
L15.addLevel('c1',5,
R('05 · 暴风走廊','snow',92,18,'顺着风、逆着风，跨过四道风口','风会推着你走：顺风少用力，逆风要二段跳。',function(b){
 b.floors([[0,14],[24,30],[44,50],[64,70],[80,92]]);
 b.o('wind',14,8,{dir:1,strength:900},{w:10,h:9});
 b.o('crumble',16,15);b.o('crumble',20,14);b.o('dashgem',21,10);
 b.o('moving',31,14,{dx:10,dy:0,speed:70});b.o('dashgem',36,10);
 b.o('crumble',52,14);b.o('crumble',56,13);b.o('crumble',60,14);b.o('dashgem',54,10);b.o('dashgem',58,9);
 b.o('wind',70,8,{dir:-1,strength:600},{w:10,h:9});
 b.o('crumble',72,14);b.o('crumble',76,14);b.o('dashgem',74,10);
 b.o('bee',36,7,{range:4});b.o('bee',58,6,{range:4});b.on('turret',88,b.G,{dir:-1,rate:2.2});
 b.o('checkpoint',27,14);b.o('checkpoint',46,14);b.o('checkpoint',66,14);b.o('checkpoint',81,14);b.o('heart',48,15);
 b.on('pine',8,b.G);b.on('pine',86,b.G);
 b.base();
 b.on('worker',4,b.G,{},{say:S('巡线员：前面是风口，风会给你一个水平方向的力。','我：顺风时速度会越来越快，逆风时就要多使点劲。','巡线员：没错。碰到发光的水晶，冲刺和二段跳都会补满，用好它们。')});
 b.each('shard',[[16,13],[20,12],[27,14],[34,11],[38,12],[46,14],[53,13],[57,12],[61,13],[67,14],[73,13],[77,13],[84,14]]);
})
);
})();
