/* 第二章 · 苔木森林 · 04 · 树冠客厅 —— 单关文件。
   可以单独复制/分享：放进 js/levels/，并在 index.html 与 editor.html 里保留对应的 <script> 即可。
   想在关卡工坊里改它：用工坊「导入」levels/ 目录下对应的 .level15.json。 */
(function(){
var R=L15.R,S=L15.S,C=L15.CELL;
L15.addLevel('c2',4,
R('04 · 树冠客厅','forest',88,18,'踩下压力板后，在闸门关闭前冲过去','压力板只能撑几秒：规划好路线再踩。',function(b){
 b.floors([[0,88]]);
 b.plats([[18,11,5],[24,8,5],[30,11,5],[72,12,4],[78,9,4]]);b.o('vine',14,5,{},{h:9});
 b.base();
 var pl=b.o('plate',40,15,{hold:9}),g=b.o('gate',66,8,{},{h:8});b.link(pl,g);
 b.on('guard',52,b.G,{range:5});b.o('bee',56,6,{range:4});b.o('checkpoint',36,14);b.o('checkpoint',70,14);b.o('spring',74,15);
 b.on('squirrel',6,b.G,{},{say:S('小松鼠：地上那块发光的板子，踩上去门就开了！可是……只开一会儿。','我：那就先把路看清楚，再踩。')});
 b.o('heart',26,7);b.each('shard',[[19,10],[25,7],[31,10],[44,15],[58,15],[73,11],[79,8],[80,4]]);
})
);
})();
