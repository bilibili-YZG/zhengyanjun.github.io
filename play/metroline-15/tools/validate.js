/* 关卡静态检查（开发用，可选）：在项目根目录运行  node tools/validate.js
   - 结构：越界 / 缺出生点出口 / 碎片嵌进地块 / 连线失效
   - 可达性：按「单跳+二段跳」的保守包络，检查出生点能否到出口、碎片/开关是否够得着
   （这是近似检查，真正的手感以游戏内试玩为准） */
global.window=global;
var fs=require('fs'),path=require('path');
require('../js/data/defs.js');require('../js/data/level-builder.js');require('../js/data/dlc-kit.js');require('../js/data/metro-kit.js');
fs.readdirSync(path.join(__dirname,'../js/levels')).filter(function(f){return /\.js$/.test(f)}).sort().forEach(function(f){require('../js/levels/'+f)});
require('../js/data/campaign.js');
require('../js/data/dlc-campaign.js');require('../js/data/dlc-subway.js');
var L=window.L15,T=L.T,warns=0,errs=0,total=0;
function solid(v){return v===1||v===3||v===4||v===5}
/* 主线 + DLC（未竟之梦）；DLC 的规则略有不同：不要求每章 6 间，Boss 只在最后一章最后一间，收集物是 blueshard */
[[window.CAMPAIGN_DEFAULT,false],[window.CAMPAIGN_DLC,true],[window.CAMPAIGN_SUBWAY,true,'metro']].forEach(function(pair){var C=pair[0],isDLC=pair[1],isMetro=pair[2]==='metro';
if(isDLC)console.log('\n—— DLC：'+C.name+' ——');
C.chapters.forEach(function(ch,ci){ch.levels.forEach(function(lv,li){total++;var tag=(isDLC?'D':'')+(ci+1)+'-'+(li+1)+' '+lv.name,out=[];
 var W=lv.width,H=lv.height;function cell(x,y){if(x<0||x>=W)return 1;if(y<0||y>=H)return 0;return lv.cells[y][x]||0}
 var O=lv.objects,by={};O.forEach(function(o){by[o.id]=o});
 function of(k){return O.filter(function(o){return o.kind===k})}
 var sp=of('spawn'),ex=of('exit');
 if(!isDLC&&ch.levels.length!==6)out.push('E 本章房间数不是 6');
 if(isDLC&&!isMetro&&ch.levels.length!==4)out.push('E DLC 每个部分应有 4 关');
 var hasBoss=of('boss').length>0,wantBoss=isMetro?false:isDLC?(ci===C.chapters.length-1&&li===ch.levels.length-1):(li===ch.levels.length-1);
 if(wantBoss!==hasBoss)out.push('E '+(wantBoss?'这一间应有 Boss':(isDLC?'DLC 只有最后一间才放 Boss':'只有每章最后一间才放 Boss')));
 of('gate').forEach(function(g){if(!lv.links.some(function(k){return k.to===g.id}))out.push('E 闸门没有连开关 @'+g.x+','+g.y)});
 if(sp.length!==1)out.push('E 出生点数量='+sp.length);if(ex.length!==1)out.push('E 出口数量='+ex.length);
 if(of('boss').length>1)out.push('E 多个 Boss');
 O.forEach(function(o){var inf=L.INFO[o.kind];if(!inf){out.push('E 未知物件 '+o.kind);return}
  if(o.x<0||o.y<0||o.x+o.w>W||o.y+o.h>H)out.push('W 越界 '+o.kind+'@'+o.x+','+o.y);
  if(o.kind==='shard'||o.kind==='blueshard'||o.kind==='yellowshard'||o.kind==='heart'||o.kind==='dashgem'){if(solid(cell(o.x,o.y)))out.push('E '+o.kind+' 嵌在地块里 @'+o.x+','+o.y)}
  if(inf.g==='enemy'||inf.g==='npc'){for(var yy=o.y;yy<o.y+o.h;yy++)for(var xx=o.x;xx<o.x+o.w;xx++)if(solid(cell(xx,yy))){out.push('W '+o.kind+' 与地块重叠 @'+o.x+','+o.y);yy=999;break}}
 });
 lv.links.forEach(function(k){if(!by[k.from]||!by[k.to])out.push('E 连线指向不存在的物件')});
 /* ---- 可达性 ---- */
 var nodes={},list=[];function addNode(x,r,t){var k=x+','+r;if(x<0||x>=W||r<1||r>H)return;if(!nodes[k]){nodes[k={x:x,r:r,t:t||'s',k:k}.k]=null}}
 nodes={};function N(x,r,t){if(x<0||x>=W||r<1||r>H+1)return;var k=x+','+r;if(!nodes[k]){nodes[k]={x:x,r:r,t:t||'s',k:k};list.push(nodes[k])}}
 var free=function(x,r){return !solid(cell(x,r))};
 for(var x=0;x<W;x++)for(var r=1;r<=H;r++){var v=cell(x,r);if((solid(v)||v===2)&&free(x,r-1)&&free(x,r-2)&&cell(x,r-1)!==2)N(x,r,'s')}
 O.forEach(function(o){var d=L.INFO[o.kind],i,j;
  if(o.kind==='moving'||o.kind==='lift'||o.kind==='saw'&&false){var dx=o.props.dx||0,dy=o.props.dy||0,n=Math.max(1,Math.ceil(Math.hypot(dx,dy)));for(i=0;i<=n;i++){var px=Math.round(o.x+dx*i/n),py=Math.round(o.y+dy*i/n);for(j=0;j<o.w;j++)N(px+j,py,'p')}}
  if(o.kind==='crumble'||o.kind==='conveyor'){for(j=0;j<o.w;j++)N(o.x+j,o.y,'p')}
  if(o.kind==='vine'||o.kind==='spore'){for(i=o.y;i<o.y+o.h;i++)for(j=0;j<o.w;j++)N(o.x+j,i+1,'v')}
 });
 var boost=[];O.forEach(function(o){if(o.kind==='spring'||o.kind==='vent')boost.push(o)});
 function reach(a,b){var dx=Math.abs(b.x-a.x),rise=a.r-b.r;
  if(a.t==='v'||b.t==='v'){if(dx<=((a.t==='v')?5:3)&&rise<=((a.t==='v')?6:5))return true}
  var bo=boost.some(function(o){return a.x>=o.x-1&&a.x<=o.x+o.w&&a.r>=o.y&&a.r<=o.y+3});
  if(bo&&rise<=7&&dx<=5)return true;
  if(rise<=0)return dx<=7+Math.min(-rise,4);if(rise<=2)return dx<=7;if(rise<=3)return dx<=6;if(rise<=4)return dx<=4;if(rise<=5)return dx<=3;return false}
 var s0=sp[0],start=null;if(s0){for(var rr=s0.y+s0.h;rr<=H;rr++){var cand=nodes[s0.x+','+rr];if(cand){start=cand;break}}}
 var seen={},q=[];if(start){seen[start.k]=1;q.push(start)}else out.push('E 出生点下方没有可站立的位置');
 var qi=0;while(qi<q.length){var a=q[qi++];for(var m=0;m<list.length;m++){var b=list[m];if(seen[b.k])continue;if(Math.abs(b.x-a.x)>12)continue;if(reach(a,b)){seen[b.k]=1;q.push(b)}}}
 function near(px,py,rw,rh,mx,mUp,mDown){return q.some(function(a){return a.x>=px-mx&&a.x<=px+rw-1+mx&&Math.abs(a.r-(py+rh))<=Math.max(mUp,mDown)})}
 ex.forEach(function(e){if(start&&!near(e.x,e.y,e.w,e.h,1,1.5,1.5))out.push('E 出口够不着 @'+e.x+','+e.y)});
 var unreachShards=0;O.forEach(function(o){if(!start)return;
  if(o.kind==='shard'||o.kind==='blueshard'||o.kind==='yellowshard'){if(!q.some(function(a){return Math.abs(a.x-o.x)<=2&&a.r-o.y<=4.6&&a.r-o.y>=-3}))out.push('W 碎片可能够不着 @'+o.x+','+o.y)}
  if(o.kind==='switch'||o.kind==='plate'){if(!near(o.x,o.y,o.w,o.h,1,1.5,1.5))out.push('E 开关够不着 @'+o.x+','+o.y)}
  if(o.kind==='heart'||o.kind==='checkpoint'){if(!q.some(function(a){return Math.abs(a.x-o.x)<=2&&a.r-o.y<=5&&a.r-o.y>=-3}))out.push('W '+o.kind+' 可能够不着 @'+o.x+','+o.y)}});
 var sh=of(isMetro?'yellowshard':isDLC?'blueshard':'shard').length;
 var e=out.filter(function(s){return s[0]==='E'}).length,w=out.length-e;errs+=e;warns+=w;
 console.log((e?'✗ ':w?'△ ':'✓ ')+tag+'  ['+W+'×'+H+'] 碎片'+sh+' 物件'+O.length+' 站点'+list.length+' 可达'+q.length);out.forEach(function(s){console.log('     '+s)})})});
});
console.log('\n共 '+total+' 个房间，错误 '+errs+'，提示 '+warns);process.exit(errs?1:0);
