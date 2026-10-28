/* 第四章 · 熔岩洞窟（最短） · 02 · 火焰甬道 —— 单关文件。
   可以单独复制/分享：放进 js/levels/，并在 index.html 与 editor.html 里保留对应的 <script> 即可。
   想在关卡工坊里改它：用工坊「导入」levels/ 目录下对应的 .level15.json。 */
(function(){
var R=L15.R,S=L15.S,C=L15.CELL;
L15.addLevel('c4',2,
R('02 · 火焰甬道','lava',54,18,'抓准节奏，穿过喷火的甬道','喷口亮起前会先变红——趁熄灭的间隙冲过去。',function(b){
 b.floors([[0,28],[40,54]]);b.o('lava',28,16,{},{w:12,h:2});
 [28,32,36].forEach(function(x){b.o('conveyor',x,16,{dir:-1,speed:100})});
 b.on('flame',12,b.G,{period:3,phase:0});b.on('flame',16,b.G,{period:3,phase:.33});b.on('flame',20,b.G,{period:3,phase:.66});b.on('flame',46,b.G,{period:3,phase:.5});
 b.o('bee',34,8,{range:4});
 b.o('torch',5,14);b.o('torch',25,14);b.o('lavafall',33,4);
 b.o('checkpoint',9,14);b.o('checkpoint',41,14);b.o('heart',24,15);
 b.base();
 b.on('robot',4,b.G,{},{say:S('维修机器人：滴——火焰喷口按固定周期开关。','我：周期固定，那就能算准通过的时间。','维修机器人：对，热空气上升，冷空气补进来——这就是对流。')});
 b.each('shard',[[13,12],[17,12],[21,12],[30,13],[34,13],[38,13],[44,14],[50,14]]);
})
);
})();
