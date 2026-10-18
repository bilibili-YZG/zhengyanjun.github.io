/* 第三章 · 林下洞窟 · 06 · 母巢深井 —— 单关文件。
   可以单独复制/分享：放进 js/levels/，并在 index.html 与 editor.html 里保留对应的 <script> 即可。
   想在关卡工坊里改它：用工坊「导入」levels/ 目录下对应的 .level15.json。 */
(function(){
var R=L15.R,S=L15.S,C=L15.CELL;
L15.addLevel('c3',6,
R('06 · 母巢深井','underground',50,18,'击败孢子母巢','孢子母巢：99+……99+……99+……',function(b){
 b.floors([[0,50]]);b.plats([[6,11,5],[22,9,6],[38,11,5]]);b.o('spore',14,11);b.o('spore',32,11);b.base();
 b.o('checkpoint',3,14);b.o('boss',36,10,{boss:'spore',hp:16},{say:'孢子母巢'});b.o('heart',24,8);
 b.o('trigger',4,12,{once:1},{say:S('孢子母巢：家长群 99+！成绩排名！评优材料！明天交！','我：一条一条来，一条一条回。','孢子母巢：来不及的！来不及的！','我：来得及的。至少，现在的我站在这里。')});
 b.each('shard',[[7,10],[24,7],[40,10]]);
})
);
})();
