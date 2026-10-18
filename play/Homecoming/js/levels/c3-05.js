/* 第三章 · 林下洞窟 · 05 · 传送带车间 —— 单关文件。
   可以单独复制/分享：放进 js/levels/，并在 index.html 与 editor.html 里保留对应的 <script> 即可。
   想在关卡工坊里改它：用工坊「导入」levels/ 目录下对应的 .level15.json。 */
(function(){
var R=L15.R,S=L15.S,C=L15.CELL;
L15.addLevel('c3',5,
R('05 · 传送带车间','underground',100,18,'逆着传送带跑，拉下开关，打开出口闸门','传送带上的摩擦力会带着你走。',function(b){
 b.floors([[0,10],[26,38],[54,100]]);
 [10,14,18,22].forEach(function(x){b.o('conveyor',x,16,{dir:-1,speed:90})});
 [38,42,46,50].forEach(function(x){b.o('conveyor',x,16,{dir:1,speed:120})});
 b.o('spikes',17,15);b.o('saw',28,14,{dx:8,dy:0,speed:50});
 b.plats([[58,12,4],[62,9,5]]);
 var sw=b.o('switch',64,8),g=b.o('gate',92,8,{},{h:8});b.link(sw,g);
 b.o('laser',74,11,{period:2.2,phase:0});b.o('laser',80,11,{period:2.2,phase:1});
 b.on('guard',58,b.G,{range:4});b.on('turret',96,b.G,{dir:-1,rate:2.2});b.o('bee',44,9,{range:4});
 b.o('pipe',30,3);b.o('pipe',60,3);
 b.o('checkpoint',27,14);b.o('checkpoint',55,14);b.o('checkpoint',84,14);b.o('heart',33,15);b.o('heart',70,15);
 b.base();
 b.on('robot',3,b.G,{},{say:S('维修机器人：滴——传送带靠摩擦力带着你走。','我：逆着跑，对地速度就会变慢。','维修机器人：正确。顺着跑则快得多——但小心刹不住。')});
 b.each('shard',[[14,13],[20,13],[24,13],[31,12],[34,12],[40,13],[46,13],[52,13],[59,11],[64,7],[76,13],[88,14],[96,14]]);
})
);
})();
