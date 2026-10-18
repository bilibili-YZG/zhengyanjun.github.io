/* 第二章 · 苔木森林 · 03 · 萤火栈道 —— 单关文件。
   可以单独复制/分享：放进 js/levels/，并在 index.html 与 editor.html 里保留对应的 <script> 即可。
   想在关卡工坊里改它：用工坊「导入」levels/ 目录下对应的 .level15.json。 */
(function(){
var R=L15.R,S=L15.S,C=L15.CELL;
L15.addLevel('c2',3,
R('03 · 萤火栈道','forest',90,18,'踩着碎裂木板与传送带，穿过萤火虫栈道','木板踩上去一会儿就碎；传送带会带着人走。',function(b){
 b.floors([[0,12],[20,26],[34,40],[54,60],[72,90]]);
 b.o('crumble',13,15);b.o('crumble',17,14);
 b.o('conveyor',26,16,{dir:1,speed:100});b.o('crumble',30,15);
 b.o('conveyor',40,16,{dir:-1,speed:90});b.o('crumble',45,14);b.o('crumble',50,14);
 b.o('moving',61,14,{dx:8,dy:0,speed:60});
 b.on('frog',22,b.G,{range:3});b.on('frog',36,b.G,{range:3});b.on('frog',76,b.G,{range:5});b.on('frog',83,b.G,{range:4});b.o('bee',46,8,{range:5});
 b.o('fireflies',4,8);b.o('fireflies',45,6);b.o('fireflies',80,8);b.on('tree',8,b.G);b.on('bush',56,b.G);
 b.o('checkpoint',21,14);b.o('checkpoint',35,14);b.o('checkpoint',55,14);b.o('checkpoint',73,14);b.o('heart',57,15);
 b.base();
 b.on('squirrel',4,b.G,{},{say:S('小松鼠：老师，前面的木板一踩就碎，传送带还会拖着人走！','我：传送带是靠摩擦力带着你走的。你跑得比它快，就没事。','小松鼠：那我先观察一下它的速度！')});
 b.each('shard',[[14,13],[18,12],[22,14],[28,13],[31,13],[36,14],[41,13],[46,12],[51,12],[56,14],[65,12],[74,14],[80,14]]);
})
);
})();
