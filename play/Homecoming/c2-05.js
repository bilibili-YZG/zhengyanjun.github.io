/* 第二章 · 苔木森林 · 05 · 根须锯林 —— 单关文件。
   可以单独复制/分享：放进 js/levels/，并在 index.html 与 editor.html 里保留对应的 <script> 即可。
   想在关卡工坊里改它：用工坊「导入」levels/ 目录下对应的 .level15.json。 */
(function(){
var R=L15.R,S=L15.S,C=L15.CELL;
L15.addLevel('c2',5,
R('05 · 根须锯林','forest',92,18,'避开旋转锯，拉下开关，打开尽头的闸门','锯片来回的节奏是固定的——看准周期，再动身。',function(b){
 b.floors([[0,16],[22,34],[40,52],[58,70],[76,92]]);
 [19,37,55,73].forEach(function(x){b.o('vine',x,5,{},{h:9})});
 b.o('saw',25,14,{dx:6,dy:0,speed:55});b.o('saw',43,14,{dx:7,dy:0,speed:55});b.o('saw',63,9,{dx:0,dy:5,speed:60});b.o('saw',79,14,{dx:5,dy:0,speed:60});
 var sw=b.o('switch',66,15),g=b.o('gate',86,8,{},{h:8});b.link(sw,g);
 b.o('bee',30,8,{range:4});b.o('bee',46,8,{range:4});b.o('bee',68,8,{range:4});
 b.o('checkpoint',23,14);b.o('checkpoint',41,14);b.o('checkpoint',59,14);b.o('checkpoint',77,14);b.o('heart',60,15);
 b.on('tree',7,b.G);b.on('tree',28,b.G);
 b.base();
 b.on('ranger',4,b.G,{},{say:S('守林人：锯片转得再快，也有固定的周期。','我：周期运动——看准了就能算出什么时候通过。','守林人：对。开关在锯林深处，拉下它，尽头的闸门才会开。')});
 b.each('shard',[[19,9],[24,13],[31,13],[37,9],[44,13],[49,13],[55,9],[60,13],[67,13],[73,9],[80,13],[85,13]]);
})
);
})();
