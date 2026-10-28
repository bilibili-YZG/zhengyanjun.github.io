/* 第四章 · 熔岩洞窟（最短） · 01 · 熔岩前厅 —— 单关文件。
   可以单独复制/分享：放进 js/levels/，并在 index.html 与 editor.html 里保留对应的 <script> 即可。
   想在关卡工坊里改它：用工坊「导入」levels/ 目录下对应的 .level15.json。 */
(function(){
var R=L15.R,S=L15.S,C=L15.CELL;
L15.addLevel('c4',1,
R('01 · 熔岩前厅','lava',62,18,'越过熔岩池','热风柱每隔几秒喷发一次，可以助你跳得更高。',function(b){
 b.floors([[0,16],[24,38],[46,62]]);b.o('lava',16,16,{},{w:8,h:2});b.o('lava',38,16,{},{w:8,h:2});
 b.plats([[5,12,4],[11,9,4],[18,12,4],[40,12,4],[50,12,4],[56,9,4]]);
 b.o('vent',20,15,{period:3});b.o('vent',42,15,{period:3});
 b.base();
 b.on('hologram',4,b.G,{},{say:S('旧站长留言：这里是线路的最深处。别怕热，怕的是停下来。','旧站长留言：引路人守着地底的最后一个信标。它不是敌人，只是太久没人对它说过——够了。')});
 b.on('guard',30,b.G,{range:5});b.o('bee',50,6,{range:4});b.on('turret',58,b.G,{dir:-1,rate:2});b.o('spikes',52,15);
 b.o('torch',3,14);b.o('torch',12,14);
 b.o('checkpoint',25,14);b.o('checkpoint',47,14);b.o('heart',57,8);
 b.each('shard',[[6,11],[12,8],[19,11],[28,14],[33,14],[41,11],[51,11],[57,7]]);
})
);
})();
