/* 第四章 · 熔岩洞窟（最短） · 05 · 黑曜石回环廊 —— 单关文件。
   可以单独复制/分享：放进 js/levels/，并在 index.html 与 editor.html 里保留对应的 <script> 即可。
   想在关卡工坊里改它：用工坊「导入」levels/ 目录下对应的 .level15.json。 */
(function(){
var R=L15.R,S=L15.S,C=L15.CELL;
L15.addLevel('c4',5,
R('05 · 黑曜石回环廊','lava',66,18,'同时启动两个机关，打开出口闸门','两个机关缺一不可：一个在高处，一个在碎石后。',function(b){
 b.floors([[0,24],[28,66]]);b.o('lava',24,16,{},{w:4,h:2});
 b.plats([[12,10,5],[16,7,5],[20,12,4]]);b.fill(40,12,12,1,C.brick);b.o('rubble',44,14,{hp:2});
 var s1=b.o('switch',18,6),s2=b.o('switch',48,15),g=b.o('gate',58,8,{},{h:8});b.link(s1,g);b.link(s2,g);
 b.o('laser',52,11,{period:2.2,phase:0});b.o('laser',55,11,{period:2.2,phase:1});
 b.base();
 b.on('guard',32,b.G,{range:5});b.o('ghost',44,5);b.on('turret',64,b.G,{dir:-1,rate:2});
 b.o('checkpoint',29,14);b.o('checkpoint',49,14);b.o('heart',51,15);
 b.on('hologram',4,b.G,{},{say:S('遗迹终端：门由两把钥匙启动。一把在高处，一把在碎石之后。','遗迹终端：有时候，要先弯下腰，才能打开路。')});
 b.each('shard',[[13,9],[17,6],[21,11],[34,14],[46,14],[50,14],[60,14]]);
})
);
})();
