/* 第一章 · 雪原回响 · 03 · 冰河滑道 —— 单关文件。
   可以单独复制/分享：放进 js/levels/，并在 index.html 与 editor.html 里保留对应的 <script> 即可。
   想在关卡工坊里改它：用工坊「导入」levels/ 目录下对应的 .level15.json。 */
(function(){
var R=L15.R,S=L15.S,C=L15.CELL;
L15.addLevel('c1',3,
R('03 · 冰河滑道','snow',88,18,'滑过冰河，躲开坠落的冰锥','冰面几乎没有摩擦——提前松手，惯性会带着你滑出去。',function(b){
 b.floors([[0,12],[42,60],[78,88]]);b.floors([[12,34]],C.ice);b.floors([[60,78]],C.ice);
 b.o('crumble',35,15);b.o('crumble',39,15);
 b.o('spikes',20,15);b.o('spikes',27,15);
 b.plat(44,9,14);b.o('icicle',46,10);b.o('icicle',50,10);b.o('icicle',54,10);
 b.on('slime',68,b.G,{range:6});b.o('spikes',72,15);
 b.o('checkpoint',13,14);b.o('checkpoint',43,14);b.o('checkpoint',79,14);b.o('heart',58,15);
 b.on('pine',7,b.G);b.on('snowman',10,b.G);b.on('pine',83,b.G);b.on('rock',64,b.G);
 b.base();
 b.on('student',5,b.G,{},{say:S('学生：老师！我在冰面上怎么都刹不住车……','我：冰面几乎没有摩擦力。没有摩擦力，就没有“刹车”。','学生：所以要提前松手？','我：对，惯性会带着你继续往前滑。提前松手，别指望急停。')});
 b.each('shard',[[16,14],[20,12],[26,14],[30,12],[37,13],[41,13],[46,14],[50,14],[54,14],[62,14],[68,12],[75,14]]);
})
);
})();
