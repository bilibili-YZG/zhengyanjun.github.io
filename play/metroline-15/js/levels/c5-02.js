/* 第五章 · 黎明的曙光 · 02 · 红树 —— 单关文件。
   可以单独复制/分享：放进 js/levels/，并在 index.html 与 editor.html 里保留对应的 <script> 即可。
   想在关卡工坊里改它：用工坊「导入」levels/ 目录下对应的 .level15.json。 */
(function(){
var R=L15.R,S=L15.S,C=L15.CELL;
L15.addLevel('c5',2,
R('02 · 红树','redforest',96,18,'穿过红色森林，触碰红树下的开关，打开尽头的闸门','红叶林里没有风，叶子却一直在落——别被它们晃花了眼。',function(b){
 b.floors([[0,24],[30,58],[64,96]]);
 b.plats([[10,13,4],[17,10,4],[25,13,4],[44,12,5],[58,12,5],[67,12,4]]);
 b.on('tree',6,b.G);b.on('tree',34,b.G);b.on('tree',48,b.G);b.on('tree',86,b.G);
 b.on('redtree',68,b.G); /* 关卡的主角：一棵红色的大树 */
 var sw=b.o('switch',76,15),g=b.o('gate',84,8,{},{h:8});b.link(sw,g);
 b.o('torch',3,14);b.o('torch',62,14);
 b.base();
 b.on('hologram',4,b.G,{},{say:S('学生的身影：老师，这棵树以前不是红色的。','我：它什么时候变红的？','学生的身影：从有人开始不敢说“我累了”那天起。树下有个开关，去按一下吧。')});
 b.on('slime',14,b.G,{range:5});b.on('slime',40,b.G,{range:5});b.o('bee',52,7,{range:4});b.o('bee',72,6,{range:4});
 b.o('spikes',26,15);b.o('spikes',28,15);b.o('spikes',60,15);b.o('spikes',62,15);
 b.o('checkpoint',31,14);b.o('checkpoint',65,14);b.o('heart',46,11);
 b.each('shard',[[11,12],[18,9],[26,12],[36,14],[45,11],[52,14],[59,11],[68,11],[75,14],[80,14]]);
})
);
})();
