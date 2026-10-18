/* 第三章 · 林下洞窟 · 04 · 水泵走廊 —— 单关文件。
   可以单独复制/分享：放进 js/levels/，并在 index.html 与 editor.html 里保留对应的 <script> 即可。
   想在关卡工坊里改它：用工坊「导入」levels/ 目录下对应的 .level15.json。 */
(function(){
var R=L15.R,S=L15.S,C=L15.CELL;
L15.addLevel('c3',4,
R('04 · 水泵走廊','underground',100,18,'穿过激光栅，打开出口闸门','激光栅会周期性闪烁；冲刺有短暂无敌。',function(b){
 b.floors([[0,31],[36,65],[70,100]]);
 b.plats([[50,12,4],[56,9,5]]);
 b.o('laser',18,11,{period:2.2,phase:0});b.o('laser',24,11,{period:2.2,phase:1});b.o('laser',42,11,{period:2.2,phase:0});b.o('laser',48,11,{period:2.2,phase:1});
 var sw=b.o('switch',58,8),g=b.o('gate',84,8,{},{h:8});b.link(sw,g);
 b.base();
 b.on('turret',76,b.G,{dir:-1,rate:2.2});b.on('guard',64,b.G,{range:5});
 b.o('checkpoint',38,14);b.o('checkpoint',72,14);b.o('heart',52,11);
 b.on('hologram',4,b.G,{},{say:S('维护终端：前方泵房有激光栅。他们说：一直在亮的灯，只会灼伤路过的人。','我：所以灯要有间隔，人也要。','维护终端：……说得对。')});
 b.each('shard',[[20,12],[26,12],[32,13],[44,12],[50,11],[57,8],[66,15],[78,15],[90,15]]);
})
);
})();
