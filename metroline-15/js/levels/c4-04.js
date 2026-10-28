/* 第四章 · 熔岩洞窟（最短） · 04 · 碎裂石桥 —— 单关文件。
   可以单独复制/分享：放进 js/levels/，并在 index.html 与 editor.html 里保留对应的 <script> 即可。
   想在关卡工坊里改它：用工坊「导入」levels/ 目录下对应的 .level15.json。 */
(function(){
var R=L15.R,S=L15.S,C=L15.CELL;
L15.addLevel('c4',4,
R('04 · 碎裂石桥','lava',58,18,'踩着老石桥穿过熔岩河','每块石板都经不起久站，水晶能让你再跳一次。',function(b){
 b.floors([[0,12],[46,58]]);b.o('lava',12,16,{},{w:34,h:2});
 b.o('crumble',14,14);b.o('crumble',19,13);b.o('crumble',24,14);b.o('crumble',29,13);b.o('crumble',34,14);b.o('crumble',39,13);b.o('crumble',43,14);
 b.o('dashgem',17,10);b.o('dashgem',32,10);
 b.o('bee',26,8,{range:4});b.o('bee',36,8,{range:4});b.on('guard',50,b.G,{range:4});b.on('turret',56,b.G,{dir:-1,rate:2});
 b.on('pillar',4,b.G);b.o('torch',9,14);
 b.o('checkpoint',10,14);b.o('checkpoint',47,14);b.o('heart',52,15);
 b.base();
 b.on('hologram',6,b.G,{},{say:S('旧站长留言：石桥是老工人搭的，每一块都经不起久站。','旧站长留言：走快一点，但别慌——慌，才会掉下去。')});
 b.each('shard',[[15,12],[20,11],[25,12],[30,11],[35,12],[40,11],[44,12],[50,14]]);
})
);
})();
