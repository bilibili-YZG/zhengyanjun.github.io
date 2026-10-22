/* 第五章 · 黎明的曙光 · 04 · 外墙 —— 沿着教学楼外墙往上爬，脚手架在晃，窗台很窄（36 × 72，纵向关）
   教学：贴墙的晚风（横向阵风）· 碎裂的窗台 · 纸飞机怪夹击 · 最后一段靠纸飞机滑翔过房顶的缺口 */
L15.addLevel('c5',4,L15.R("04 · 外墙",'dawn',36,72,"沿着教学楼外墙一路向上，爬到房顶","脚手架在晃，窗台很窄。最后一段缺口，靠纸飞机飞过去。",function(b){
 var G=b.G,S=L15.S,C=L15.CELL,xs=[4,12,20,28,20,12],i;
 b.fill(0,G,36,2,C.ground);
 b.fill(0,0,2,72,C.brick);b.fill(34,0,2,72,C.brick);
 b.o('spawn',4,G-2);
 b.on('worker',9,G,{},{say:S('维修机器人：滴——检测到人类，正在攀爬外墙。','维修机器人：建议使用楼梯。……楼梯不通？那请抓紧脚手架。','维修机器人：每三层有一个检查点。祝您平安。')});
 for(i=0;i<20;i++){
  var x=xs[i%6],y=G-4-3*i;
  if(i%5===2)b.o('crumble',x,y,{delay:.5,respawn:3},{w:5});else b.plat(x,y,5);
  if(i%3===1){b.o('paperplane',(x<18?x+11:x-8),y-4,{hp:1})}
  if(i===6||i===13)b.o('checkpoint',x+2,y-2);
  if(i===8||i===9)b.o('wind',3,y-6,{dir:i===8?1:-1,strength:720},{w:30,h:6});
  if(i===4||i===11||i===16)b.o('shard',x+(x<18?7:-4),y-3);
  if(i===10)b.o('heart',x+2,y-1);
  if(i===12||i===17)b.o('spikes',x+3,y-1,{},{w:2,h:1});
 }
 /* 房顶：一段缺口，纸飞机在缺口前等着 */
 var top=G-4-3*20;
 b.fill(2,top,10,2,C.ground);b.fill(26,top,8,2,C.ground);b.o('glider',10,top-2);b.o('wind',12,top-6,{dir:1,strength:640},{w:14,h:8});
 b.o('lamppost',3,top-6);b.o('sunflag',30,top-10,{});b.o('cloud',14,top-9,{});
 b.o('exit',30,top-3);
}));
