/* DLC 关卡工具：分层竖井（地下冰洞「一关四层，从上到下」）、物理答题密室、答题门。
   只用到 level-builder.js 里 R(...) 提供的 b.fill / b.o / b.on / b.link，生成的仍是和工坊同格式的普通关卡数据。 */
(function(){
var K={};
/* 竖井骨架：layers 层、每层 band 行；蛇形——偶数层向右走、奇数层向左走，行进方向的尽头留一个落洞通往下一层。 */
K.shaft=function(b,w,layers,band,holeW){
 var h=layers*band,k,x;holeW=holeW||5;b.fill(0,0,w,2,1);b.fill(0,0,2,h,1);b.fill(w-2,0,2,h,1);
 var info=[];
 for(k=0;k<layers;k++){var fy=band*(k+1)-2,hx=(k%2===0)?w-11:6;
  if(k<layers-1){b.fill(2,fy,w-4,2,1);for(x=hx;x<hx+holeW;x++){b.fill(x,fy,1,2,0)}}else b.fill(2,fy,w-4,2,1);
  info.push({fy:fy,top:band*k,dir:(k%2===0)?1:-1,holeX:hx,holeW:holeW})}
 return info};
/* 答题密室：3 格高的小隔间（顶上可以踩着二段跳翻过去绕行），闸门由终端控制。top = 地面所在行 */
K.cache=function(b,x,top,say,shards,label){
 b.fill(x,top-4,7,1,4);b.fill(x+6,top-3,1,3,4);
 var gate=b.o('gate',x,top-3,{},{h:3,label:'密室闸门'}),term=b.o('sign',x-3,top-2,{},{say:say,label:label||'物理终端'});b.link(term,gate);
 for(var i=0;i<(shards||3);i++)b.o('blueshard',x+1+i*(shards>3?1:2),top-1);
 return term};/* 必答门：整堵砖墙里只有一个 5 格高的口子，口子被闸门封住 */
K.door=function(b,x,top,ceilRow,say,label,fromRight){
 b.fill(x,ceilRow,1,top-5-ceilRow,4);
 /* 终端要放在玩家来的这一侧：默认从左往右走（终端在门左），fromRight 时从右往左走（终端在门右） */
 var gate=b.o('gate',x,top-5,{},{h:5,label:'实验室大门'}),term=b.o('sign',fromRight?x+3:x-3,top-2,{},{say:say,label:label||'门禁终端'});b.link(term,gate);return term};
/* 混沌领域的"地形碎片"：宽 14 格，地面顶行 = G。各章的地形与机关被打乱拼在一起。 */
K.chunk=function(b,name,x0,G){
 var ids={};
 switch(name){
 case'ice':b.fill(x0,G,14,1,5);b.on('spikes',x0+11,G);b.o('wind',x0+2,G-6,{dir:1,strength:560});b.plat(x0+5,G-4,4);b.o('blueshard',x0+6,G-5);break;
 case'forest':b.fill(x0+3,G,2,1,3);b.fill(x0+9,G,2,1,3);b.o('vine',x0+6,G-9,{},{h:8});b.plat(x0+5,G-9,4);b.on('frog',x0+12,G,{range:3});b.o('blueshard',x0+6,G-10);break;
 case'cave':b.o('spore',x0+4,G-8,{},{h:7});b.plat(x0+3,G-9,5);b.o('bat',x0+10,G-8,{range:3});b.o('blueshard',x0+5,G-10);b.on('slime',x0+11,G,{range:3});break;
 case'lava':b.fill(x0+4,G,6,2,0);b.o('lava',x0+4,G,{},{w:6,h:2});b.o('moving',x0+4,G-1,{dx:3,dy:0,speed:60});b.on('flame',x0+11,G,{period:3});b.o('blueshard',x0+7,G-4);break;
 case'lab':b.fill(x0,G,14,1,4);b.o('voltarc',x0+4,G-4,{period:2.8});b.on('plasma',x0+9,G,{period:2.5,phase:.5});b.o('blueshard',x0+6,G-5);break;
 case'icecave':b.on('cryotrap',x0+4,G,{period:4});b.o('wraith',x0+9,G-5);b.plat(x0+6,G-4,4);b.o('blueshard',x0+7,G-5);break;
 case'grav':b.o('gravwell',x0+5,G-3,{strength:1.4});b.o('dashgem',x0+3,G-6);b.o('anomaly',x0+10,G-4);b.o('blueshard',x0+6,G-5);break;
 case'belt':b.on('conveyor',x0+1,G,{dir:-1,speed:100});b.on('conveyor',x0+7,G,{dir:1,speed:100});b.o('saw',x0+5,G-6,{dx:3,dy:0,speed:70});b.o('blueshard',x0+11,G-1);break;
 case'crumble':b.fill(x0+3,G,8,2,0);b.on('crumble',x0+3,G,{delay:.4,respawn:3},{});b.on('crumble',x0+6,G,{delay:.4,respawn:3});b.on('crumble',x0+9,G,{delay:.4,respawn:3});b.o('blueshard',x0+7,G-3);break;
 case'wind':b.o('wind',x0+1,G-7,{dir:-1,strength:900},{w:10,h:7});b.on('spikes',x0+11,G);b.plat(x0+4,G-4,4);b.o('blueshard',x0+5,G-5);break;
 case'turret':b.on('turret',x0+11,G,{dir:-1,rate:2});b.on('rubble',x0+6,G,{hp:2});b.o('blueshard',x0+4,G-1);break}
 return ids};
/* 混沌关卡装配：order 是 8 个地形碎片的顺序（前 4 个在左半、后 4 个在右半，中间是休息区）。 */
K.chaos=function(b,order,rest){
 var G=b.G,i;b.fill(0,0,156,2,1);b.fill(0,0,2,30,1);b.fill(154,0,2,30,1);b.floors([[0,156]]);
 for(i=0;i<4;i++)K.chunk(b,order[i],16+i*14,G);
 for(i=4;i<8;i++)K.chunk(b,order[i],90+(i-4)*14,G);
 b.on('checkpoint',14,G);b.on('checkpoint',74,G);b.on('checkpoint',146,G);b.on('heart',86,G);b.on('heart',148,G);
 if(rest)rest(b,G)};
L15.KIT=K;
})();
