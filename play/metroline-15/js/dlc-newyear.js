/* 雪镇跨年 DLC 扩展（NYX）
   由 dlc-engine.js 在 build / initEnemy / update / drawWorld / drawScreen 里调用，只对「雪镇跨年」的物件和主题生效。
   内容（元旦联欢：气球、彩带、礼炮、烟花、彩灯）：
     5 种新怪物：雪团怪（蹲下扑咬）· 气球怪（飘过来，鼓起来，砰）· 玩具鼓兵（三声鼓点后猛冲）· 烟花射手（朝天放烟花，落成星雨）· 杂耍小丑（抛彩球）
     4 种新障碍：彩灯串 · 礼炮阵（火花一路点过去，礼炮一个接一个炸）· 气球串（横穿全场）· 彩带门
     5 种新道具：礼物（收集物）· 蛋糕（回满血）· 仙女棒（6 秒无敌）· 彩糖（回 1 点血）· 礼花筒（把你弹上天）
     Boss：零点钟魔（boss 类型 midnight）——跳砸 / 报时 / 礼炮连发 / 烟花雨，三阶段；第三阶段有「倒数」：数到 0 全场炸开，躲进缝隙里 */
window.NYX=(function(){
var C=null,T=32,G=window.GFX;
function attach(core){C=core;T=core.T}
function rnd(a,b){return a+Math.random()*(b-a)}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function ov(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function sfx(n){if(window.AudioFX)AudioFX.sfx(n)}
var COLS=['#ff6a8a','#ffd23f','#6dffb0','#6dd5ff','#c9a0ff','#ffffff'];
function pick(a){return a[Math.floor(Math.random()*a.length)]}

/* ==================== 构建 ==================== */
var HAZ={lightstring:1,salute:1,balloonrow:1,ribbongate:1,popper:1};
var PICK={cake:1,sparkler:1,candy:1};
var ENEMIES=['snowling','balloon','toysoldier','rocketeer','clown'];
function build(r,d,kind,gs){
 if(kind==='gift'){d.got=!!(gs&&gs[d.id]);r.xblue.push(d);r.xthings.push(d);return true}
 if(PICK[kind]){d.got=false;(r.nyp=r.nyp||[]).push(d);r.xthings.push(d);return true}
 if(HAZ[kind]){d.x0=d.x;d.y0=d.y;d.act=false;d.warn=false;d.cd=0;(r.ny=r.ny||[]).push(d);r.xthings.push(d);return true}
 return false}
function initEnemy(e,d){var k=e.kind,rng=(d.p.range||5)*T;
 if(ENEMIES.indexOf(k)<0)return;
 e.cs='wait';e.timer=1+Math.random()*1.5;e.min=d.x-rng/2;e.max=d.x+rng/2;e.vx=0;e.air=false;
 if(k==='snowling'){e.hp=d.p.hp||2;e.face=-1}
 else if(k==='balloon'){e.hp=d.p.hp||1;e.cs='float';e.swell=0;e.col=pick(COLS.slice(0,5))}
 else if(k==='toysoldier'){e.hp=d.p.hp||3;e.face=-1}
 else if(k==='rocketeer'){e.hp=d.p.hp||2;e.timer=1.2+Math.random()*1.5;e.rk=[]}
 else if(k==='clown'){e.hp=d.p.hp||2;e.vx=24;e.face=-1;e.timer=1.4}}

/* ==================== 怪物 AI ==================== */
function stepX(e,dx){var nx=e.x+dx,ahead=dx>0?nx+e.w+2:nx-2;if(!C.groundAt(ahead,e.y+e.h+4)||C.solidAt(ahead,e.y+e.h-6))return false;e.x=nx;return true}
function confetti(x,y,n){for(var i=0;i<n;i++)C.emit(x+rnd(-8,8),y+rnd(-8,8),pick(COLS),1,rnd(90,260),rnd(.5,1),rnd(-120,40))}
function burst(x,y,n,sp,g){for(var i=0;i<n;i++){var a=Math.PI*2*i/n+rnd(-.1,.1),s=sp*rnd(.75,1.1);C.shoot(x,y,Math.cos(a)*s,Math.sin(a)*s,{g:g||0,r:6,col:pick(COLS),life:2.6})}}
var AI={
 /* 雪团怪：滚成一团的小雪人。蹲下蓄力，朝你扑过来，落地后散成一地雪沫，喘口气 */
 snowling:function(e,dt,c){
  if(e.air){e.vy+=1500*dt;var nx=e.x+e.vx*dt;if(!C.solidAt(nx+(e.vx>0?e.w:0),e.y+e.h*.5))e.x=nx;e.y+=e.vy*dt;
   if(e.vy>0&&C.groundAt(e.x+e.w/2,e.y+e.h)){e.y=Math.floor((e.y+e.h)/T)*T-e.h;e.air=false;e.vx=0;e.vy=0;e.cs='rest';e.timer=1.1;C.emit(e.x+e.w/2,e.y+e.h,'#ffffff',10,130,.4)}return}
  if(e.cs==='wait'){e.timer-=dt;if(c.dist<460)e.face=c.dx>0?1:-1;var pace=Math.sin(e.t*.7)*22*dt;if(e.x+pace>e.min&&e.x+pace<e.max)stepX(e,pace);
   if(e.timer<=0&&Math.abs(c.dx)<280&&Math.abs(c.dy)<120){e.cs='crouch';e.timer=.5;e.face=c.dx>0?1:-1;sfx('switch')}}
  else if(e.cs==='crouch'){e.timer-=dt;if(e.timer<=0){e.air=true;e.vx=e.face*Math.min(320,Math.abs(c.dx)*1.3+80);e.vy=-470;sfx('dash')}}
  else if(e.cs==='rest'){e.timer-=dt;if(e.timer<=0){e.cs='wait';e.timer=1.2}}},
 /* 气球怪：飘着飘着发现了你，慢悠悠凑过来；贴近了就鼓起来，一秒后“砰”地炸成一圈彩纸。赶在它炸之前把它戳破 */
 balloon:function(e,dt,c){
  if(e.cs==='float'){var rg=(e.p.range||5)*T,near=c.dist<520;
   if(near){e.x+=c.dx/c.dist*70*dt;e.y+=(c.dy-30)/c.dist*70*dt;e.face=c.dx>0?1:-1}
   else{var tx=e.hx+Math.sin(e.t*.9)*rg/2,ty=e.hy+Math.sin(e.t*1.9)*12;e.x+=(tx-e.x)*Math.min(1,dt*2);e.y+=(ty-e.y)*Math.min(1,dt*2)}
   if(c.dist<115){e.cs='swell';e.timer=1;sfx('switch')}}
  else{e.timer-=dt;e.swell=1-e.timer;e.flash=Math.max(e.flash,.02);e.x+=c.dx/(c.dist||1)*30*dt;
   if(e.timer<=0){e.dead=true;sfx('boom');C.shake(5);confetti(c.ecx,c.ecy,40);burst(c.ecx,c.ecy,8,220,60);
    if(c.dist<92&&C.P.inv<=0&&C.P.dash<=0)C.damagePlayer(1,{dir:c.dx>0?-1:1})}}},
 /* 玩具鼓兵：先敲三下鼓，鼓点一停就猛冲；冲到头撞晕，甩出一把彩纸 */
 toysoldier:function(e,dt,c){
  if(e.cs==='wait'){e.timer-=dt;if(c.dist<460)e.face=c.dx>0?1:-1;var pace=Math.sin(e.t*.9)*26*dt;if(e.x+pace>e.min&&e.x+pace<e.max)stepX(e,pace);
   if(e.timer<=0&&Math.abs(c.dx)<400&&Math.abs(c.dy)<110){e.cs='drum';e.timer=.9;e.beat=0;e.face=c.dx>0?1:-1}}
  else if(e.cs==='drum'){e.timer-=dt;var b=Math.floor((.9-e.timer)/.3);if(b>e.beat){e.beat=b;sfx('hit');C.shake(2);C.emit(c.ecx+e.face*18,e.y+e.h-4,'#ffd23f',6,120,.3)}
   if(e.timer<=0){e.cs='rush';e.timer=1.1;e.vx=e.face*330;sfx('dash')}}
  else if(e.cs==='rush'){e.timer-=dt;if(!stepX(e,e.vx*dt)||e.timer<=0){e.cs='dizzy';e.timer=1;confetti(c.ecx,e.y,24);sfx('shoot')}
   if(Math.random()<.6)C.emit(e.x+e.w/2-e.face*20,e.y+e.h-2,'#fff6a0',1,60,.3,-30)}
  else if(e.cs==='dizzy'){e.timer-=dt;if(e.timer<=0){e.cs='wait';e.timer=1.4}}},
 /* 烟花射手：一动不动，朝天放一发，升到最高处炸成一片落下来的星雨 */
 rocketeer:function(e,dt,c){e.face=c.dx>0?1:-1;
  e.rk.forEach(function(k){k.t+=dt;k.x+=k.vx*dt;k.y+=k.vy*dt;k.vy+=140*dt;if(Math.random()<.9)C.emit(k.x,k.y,pick(['#ffd23f','#ff9a3a','#fff']),1,50,.4,60);
   if(k.t>=k.life&&!k.done){k.done=true;sfx('boom');C.shake(3);C.emit(k.x,k.y,pick(COLS),30,320,.8);burst(k.x,k.y,10,150,220)}});
  e.rk=e.rk.filter(function(k){return !k.done});
  if(e.cs==='aim'){e.timer-=dt;e.flash=Math.max(e.flash,.02);if(e.timer<=0){var tx=clamp(c.dx,-320,320);e.rk.push({x:c.ecx,y:e.y,vx:tx*.62,vy:-470,t:0,life:.95});sfx('shoot');C.emit(c.ecx,e.y,'#ffd23f',10,160,.3);e.cs='wait';e.timer=3.2}}
  else{e.timer-=dt;if(e.timer<=0&&c.dist<700){e.cs='aim';e.timer=.6;sfx('switch')}}},
 /* 杂耍小丑：沿着自己的小摊来回踱步，看见你就把三颗彩球一起抛过来（抛物线，要预判） */
 clown:function(e,dt,c){e.face=c.dx>0?1:-1;
  if(e.cs==='wind'){e.timer-=dt;e.flash=Math.max(e.flash,.02);if(e.timer<=0){for(var i=-1;i<=1;i++){var tf=clamp(c.dist/340,.55,1.1)+i*.1,g=700,vx=c.dx/tf,vy=c.dy/tf-.5*g*tf;C.shoot(c.ecx,e.y+10,vx,vy,{g:g,r:7,col:pick(COLS.slice(0,5)),life:2.6})}sfx('shoot');e.cs='wait';e.timer=2.6}}
  else{e.timer-=dt;var nx=e.x+e.vx*dt;if(nx<e.min||nx>e.max||!stepX(e,e.vx*dt))e.vx=-e.vx;
   if(e.timer<=0&&c.dist<500&&c.dist>110){e.cs='wind';e.timer=.55}}}
};
if(window.DLCX&&DLCX.ENEMY_KINDS)ENEMIES.forEach(function(k){DLCX.ENEMY_KINDS[k]=1;DLCX.ENEMY[k]=AI[k]}); /* 关卡工坊只用到下面的绘制，没有 DLCX */

/* ==================== 障碍物与道具 ==================== */
function cyc(d,t,def){var per=d.p.period||def;return ((t+(d.p.phase||0)*per)%per)/per}
function lsAng(d,t){var per=d.p.period||3.2;return .9*Math.sin((t/per+(d.p.phase||0))*6.2832)}
function update(dt,r,p){
 if(!p)return;
 var tm=C.time,pr={x:p.x+3,y:p.y+4,w:p.w-6,h:p.h-6},pcx=p.x+p.w/2,hurtOK=p.inv<=0&&p.dash<=0;
 function hurt(cx){if(hurtOK){C.damagePlayer(1,{dir:pcx>cx?1:-1});hurtOK=false}}
 (r.ny||[]).forEach(function(d){var k=d.kind,f;
  if(k==='lightstring'){var a=lsAng(d,tm),len=d.h;d.ang=a;
   for(var i=1;i<=4;i++){var rr=len*(.35+i*.165),bx=d.x0+T/2+Math.sin(a)*rr,by=d.y0+Math.cos(a)*rr;
    if(Math.hypot(bx-clamp(bx,pr.x,pr.x+pr.w),by-clamp(by,pr.y,pr.y+pr.h))<13){hurt(bx);break}}}
  else if(k==='salute'){var per=d.p.period||4;f=cyc(d,tm,4);var n=Math.max(2,Math.floor(d.w/22)),u=(f-.22)/.5;d.n=n;d.f=f;d.u=u;d.burst=d.burst||[];
   for(var j=0;j<n;j++){var cx=d.x+(j+.5)*d.w/n,fu=(cx-d.x)/d.w,since=(f-(.22+fu*.5))*per,live=since>=0&&since<.38;
    if(live&&!d.burst[j]){d.burst[j]=1;if(Math.abs(cx-pcx)<480){sfx('hit');if(tm-(d.shk||-9)>.5){d.shk=tm;C.shake(2)}confetti(cx,d.y+d.h-30,14)}}
    if(since<0||since>=.38)d.burst[j]=0;
    if(live&&ov(pr,{x:cx-24,y:d.y+d.h-72,w:48,h:72}))hurt(cx)}
   d.warn=u>0&&u<1}
  else if(k==='balloonrow'){var rng=(d.p.dx||12)*T,sp=d.p.speed||110,s=(tm*sp/rng+(d.p.phase||0))%2,tri=s<1?s:2-s,e2=tri*tri*(3-2*tri),prev=d.hx==null?d.x0:d.hx;
   d.hx=d.x0+rng*e2;d.sgn=d.hx>prev?1:d.hx<prev?-1:(d.sgn||1);d.x=d.hx;d.segs=[];
   for(var q=0;q<8;q++){var sx=d.hx-d.sgn*q*27,sy=d.y0+T+Math.sin(tm*5-q*.9)*13,rad=q?17:20;d.segs.push({x:sx,y:sy,r:rad});
    if(Math.hypot(sx-clamp(sx,pr.x,pr.x+pr.w),sy-clamp(sy,pr.y,pr.y+pr.h))<rad-3){hurt(sx);break}}}
  else if(k==='ribbongate'){f=cyc(d,tm,4);var open=1,st='open';
   if(f<.45){open=1;st='open'}else if(f<.6){open=1;st='warn'}else if(f<.68){open=1-(f-.6)/.08;st='closing'}else if(f<.9){open=0;st='closed'}else{open=(f-.9)/.1;st='opening'}
   if(st==='warn'&&!d.beeped){d.beeped=true;sfx('select')}if(st!=='warn')d.beeped=false;
   d.warn=st==='warn';d.open=open;d.st=st;var lw=(1-open)*d.w/2;
   if(lw>1){var Lb={x:d.x,y:d.y,w:lw,h:d.h},Rb={x:d.x+d.w-lw,y:d.y,w:lw,h:d.h};
    if(ov(pr,Lb)||ov(pr,Rb)){var side=pcx<d.x+d.w/2?-1:1;if(st==='closing')hurt(d.x+d.w/2);p.x=side<0?d.x-p.w-1:d.x+d.w+1;p.vx=0}}}
  else if(k==='popper'){d.cd=Math.max(0,d.cd-dt);d.fire=Math.max(0,(d.fire||0)-dt);
   if(d.cd<=0&&p.vy>=0&&ov(pr,{x:d.x,y:d.y-8,w:d.w,h:T})){p.vy=-940;p.ground=false;p.jumps=1;p.slam=false;d.cd=.7;d.fire=.45;sfx('bounce');sfx('boom');confetti(d.x+d.w/2,d.y,26);C.shake(3)}}
 });
 /* 道具 */
 var cy=p.y+p.h/2;
 (r.nyp||[]).forEach(function(d){if(d.got||Math.abs(pcx-(d.x+d.w/2))>26||Math.abs(cy-(d.y+d.h/2))>32)return;
  if(d.kind==='cake'){d.got=true;p.hp=p.max;C.hearts();sfx('heal');confetti(d.x+16,d.y+16,30);C.toast('蛋糕！生命回满',1800)}
  else if(d.kind==='sparkler'){d.got=true;p.inv=Math.max(p.inv,6);sfx('check');confetti(d.x+16,d.y+16,24);C.toast('仙女棒：6 秒内百邪不侵',1800)}
  else if(d.kind==='candy'&&p.hp<p.max){d.got=true;p.hp++;C.hearts();sfx('heal');C.emit(d.x+16,d.y+16,'#ff9f9f',14,160);C.toast('含一颗彩糖，恢复 1 点生命',1600)}})}
function drawWorld(g,t){
 var r=C&&C.R;if(!r)return;
 crowdWorld(g,t);
 r.enemies.forEach(function(e){if(e.kind!=='rocketeer'||!e.rk)return;e.rk.forEach(function(k){g.save();g.translate(k.x,k.y);g.fillStyle='#d9384a';g.fillRect(-3,-2,6,14);g.fillStyle='#ffd23f';g.fillRect(-3,-8,6,6);g.fillStyle='#ff9a3a';g.beginPath();g.moveTo(-3,12);g.lineTo(0,12+rnd(8,16));g.lineTo(3,12);g.fill();G.glow(g,0,6,26,'#ffd23f',.7);g.restore()})});
 var b=r.boss;if(b&&b.type==='midnight'&&b.started&&!b.dead&&b.mark!=null&&b.state==='wind'&&b.atk==='pounce'){ /* 跳砸落点标记 */
  var fy=b.hy+b.h;g.save();g.globalAlpha=.35+.3*Math.sin(t*30);g.fillStyle='#ff3a5a';g.beginPath();g.ellipse(b.mark,fy-2,90,10,0,0,6.283);g.fill();g.globalAlpha=.9;g.strokeStyle='#ffd23f';g.lineWidth=3;g.beginPath();g.ellipse(b.mark,fy-2,90,10,0,0,6.283);g.stroke();g.restore()}}
function drawScreen(g,W,H,t){
 var r=C&&C.R;if(!r)return;var b=r.boss;
 crowdScreen(g,W,H,t);
 if(b&&b.type==='midnight'&&b.started&&!b.dead){ /* 舞台气氛：扫来扫去的彩色射灯 + 顶上一串闪烁的小彩灯 */
  g.save();g.globalCompositeOperation='lighter';
  for(var i=0;i<4;i++){var bx=W*(.12+.25*i),sw=Math.sin(t*1.3+i*1.7)*W*.14,col=COLS[(i+Math.floor(t*.7))%5];g.globalAlpha=.07+.03*Math.sin(t*3+i);g.fillStyle=col;g.beginPath();g.moveTo(bx-8,0);g.lineTo(bx+8,0);g.lineTo(bx+sw+W*.09,H);g.lineTo(bx+sw-W*.09,H);g.closePath();g.fill()}
  g.globalAlpha=1;for(var j=0;j<=W;j+=34){var yy=5+Math.sin(j*.05)*3;g.fillStyle=COLS[(Math.floor(j/34)+Math.floor(t*4))%5];g.globalAlpha=.55+.4*Math.sin(t*6+j);g.beginPath();g.arc(j,yy,3.5,0,6.283);g.fill()}
  g.restore()}
 if(b&&b.type==='midnight'&&b.started&&!b.dead&&b.cd>0){ /* 倒数 */
  var n=Math.ceil(b.cd),fr=b.cd-Math.floor(b.cd),sz=Math.min(W,H)*.28*(1+fr*.18);
  g.save();g.textAlign='center';g.textBaseline='middle';g.font='900 '+sz+'px "Noto Sans SC",sans-serif';g.globalAlpha=.16+fr*.22;g.fillStyle=n<=2?'#ff3a5a':'#ffd23f';g.fillText(String(n),W/2,H*.4);
  g.globalAlpha=.9;g.font='bold 18px "Noto Sans SC",sans-serif';g.fillStyle='#fff';g.fillText('倒数 '+n+' —— 找缝隙躲好！',W/2,H*.14);g.restore()}}

/* ==================== Boss「零点钟魔」 ====================
   一只不想让今年结束的大钟。三个阶段（血量 67% / 34% 切换）；每一招都有预兆，跳砸之后必定落地喘气，不会无缝连招：
     跳砸     蹲下蓄力，地上亮出红色落点 → 蹦过去砸地，冲击波向两边；第二阶段起连砸两次
     报时     张嘴“当——”一声，吐出一扇音符弹（第三阶段是两扇）
     礼炮连发  一排礼花柱从它脚下一路炸向远处，每根都有红色预警，缝隙够你钻过去
     烟花雨   天上落下烟花球，可以用剑弹反
     彩球烟花  几朵彩球窜上天，原地闪烁预警，砰地炸成一圈圈彩色弹（第二阶段起炸两层）
     迪斯科地板 整排地板像舞池一样两拍交替亮灯：这一拍亮单号，下一拍亮双号，跟着节拍换格子站（第三阶段三拍）
     倒数     第三阶段：数 5 声，数到 0 全场炸开，只有缝隙里是安全的；炸完它会脱力趴下（大好输出机会） */
var TA=[['pounce','spit','crackers','fireworks'],['pounce','spit','crackers','rain','fireworks','disco','skate'],['pounce','spit','crackers','rain','fireworks','disco','countdown','skate','laser']];
var TW={pounce:.85,spit:.7,crackers:.75,rain:.7,fireworks:.8,disco:.9,countdown:.9,skate:.8,laser:.9};
var SHOUT={pounce:'蹦迪大跳——！',spit:'新年祝福喇叭！',crackers:'礼炮接力！',rain:'礼花雨来啦！',fireworks:'绽放吧，彩球！',disco:'迪斯科地板，跟着节拍换格子！',skate:'滑板雪人，冲啊——！',laser:'镭射灯，扫过来了！'};
function floorBelow(x,y){var R=C.R,cx=Math.floor(x/T),cy=Math.max(0,Math.floor(y/T));for(var j=cy;j<R.ch;j++)if(C.isSolid(C.cellAt(cx,j)))return j*T;return R.h}
function pillar(x,y,t){C.R.warns.push({x:x-28,w:56,y:floorBelow(x,y),t:t,max:t,kind:'pillar'})}
function later(b,t,f){(b.q=b.q||[]).push({t:t,f:f})}
function bossAtk(b,fy,minX,maxX){var ph=b.phase,p=C.P,pcx=p.x+p.w/2,pcy=p.y+p.h/2,bcx=b.x+b.w/2,i,col='#ffd23f';b.state='atk';
 if(b.atk==='pounce'){b.vy=-900;b.vx=clamp((b.mark-bcx)/1,-720,720);b.timer=3;b.combo=(ph>0&&!b.again)?1:0;b.air=true;sfx('dash')}
 else if(b.atk==='spit'){var rounds=ph>1?2:1;b.mouth=1;
  for(var r=0;r<rounds;r++)(function(r){later(b,r*.8,function(){var cx=b.x+b.w/2+b.face*b.w*.3,cy=b.y+b.h*.4,base=Math.atan2(C.P.y+C.P.h/2-cy,C.P.x+C.P.w/2-cx),n=3+ph;sfx('shoot');b.mouth=1;C.emit(cx,cy,col,14,220,.4);
   for(var k=0;k<n;k++){var a=base+(k-(n-1)/2)*.2;C.shoot(cx,cy,Math.cos(a)*280,Math.sin(a)*280,{col:pick(COLS.slice(0,5)),r:9,life:3.2})}})})(r);b.timer=.5+rounds*.8}
 else if(b.atk==='crackers'){var dir=b.face,n=ph>0?9:7,gap=ph>1?112:124,wt=.8;sfx('boom');b.stomp=1;
  for(i=0;i<n;i++)(function(i){var x=bcx+dir*(b.w*.6+i*gap);if(x<minX-20||x>maxX+b.w+20)return;later(b,i*.13,function(){pillar(x,fy-T,wt);later(b,wt,function(){confetti(x,fy-50,18);C.emit(x,fy-20,pick(COLS),6,200,.6,-200)})})})(i);b.timer=.5+n*.13+.9}
 else if(b.atk==='rain'){var k2=3+ph*2;sfx('roar');C.R.warns.push({x:clamp(pcx,40,C.R.w-100)-28,w:56,y:floorBelow(pcx,pcy),t:.9,max:.9,kind:'drop'});
  for(i=1;i<k2;i++)(function(i){later(b,i*.12,function(){var x=C.cam.x+60+Math.random()*(C.W/C.sc-120);C.R.warns.push({x:x-28,w:56,y:floorBelow(x,pcy),t:.9,max:.9,kind:'drop'})})})(i);b.timer=1.4}
 else if(b.atk==='fireworks'){var nf=2+ph;sfx('roar');b.mouth=1;
  for(i=0;i<nf;i++)(function(i){var tx=clamp(pcx+(i-(nf-1)/2)*rnd(150,230)+rnd(-40,40),minX+30,maxX+b.w-30),ty=pcy-rnd(50,170),t0=i*.38;
   later(b,t0,function(){sfx('shoot');var ox=b.x+b.w/2,oy=b.y+b.h*.3;for(var k=0;k<10;k++)C.emit(ox+(tx-ox)*k/10,oy+(ty-oy)*k/10,pick(COLS),1,40,.5)}); /* 彩球窜上天 */
   for(var s=0;s<8;s++)(function(s){later(b,t0+.1+s*.1,function(){var rr=26-s*2.5;for(var a=0;a<6;a++){var an=a*1.047+s*.6;C.emit(tx+Math.cos(an)*rr,ty+Math.sin(an)*rr,s%2?'#ffd23f':'#ff6a8a',1,20,.3)}})})(s); /* 原地闪烁收拢=预警 */
   later(b,t0+.95,function(){sfx('boom');C.shake(3);confetti(tx,ty,24);burst(tx,ty,10,170,0);if(ph>0)later(b,.18,function(){burst(tx,ty,14,95,0)})})})(i);
  b.timer=nf*.38+1.5}
 else if(b.atk==='disco'){var xs=[],x1=minX+30,x2=maxX+b.w-30,lane=112,beats=ph>1?3:2,wt2=.75;for(var xx=x1;xx<=x2;xx+=lane)xs.push(xx);sfx('select');
  for(var bt=0;bt<beats;bt++)(function(bt){later(b,bt*.95,function(){sfx('switch');var par=bt%2;xs.forEach(function(x,ix){if(ix%2===par){pillar(x,fy-T,wt2);later(b,wt2,function(){confetti(x,fy-50,10)})}});later(b,wt2,function(){sfx('hit');C.shake(3)})})})(bt);
  b.timer=beats*.95+wt2+.3}
 else if(b.atk==='skate'){var nb=2+ph,L0=minX-90,R0=maxX+b.w+90;sfx('roar');b.mouth=1;b.boards=b.boards||[];
  for(i=0;i<nb;i++){var dirb=(i+(Math.random()<.5?1:0))%2?-1:1;b.boards.push({x:dirb>0?L0:R0,end:dirb>0?R0:L0,dir:dirb,vx:dirb*(400+ph*40),y:fy-46,w:64,h:46,t:-(.75+i*.55),i:i})}
  b.timer=nb*.55+1.9}
 else if(b.atk==='laser'){var nl=b.stage===2?3:2,cy0=3*T+6,span=(maxX+b.w)-minX;sfx('roar');b.lasers=b.lasers||[];
  for(i=0;i<nl;i++){var sd=i%2?-1:1,lx=minX+span*(i+1)/(nl+1);b.lasers.push({x:lx,y:cy0,a0:-.8*sd,a1:.8*sd,t:-i*.25,tele:.95,dur:1.5,a:-.8*sd,on:false,col:COLS[(i*2)%5]})}
  b.timer=1.95+nl*.25}
 else if(b.atk==='countdown'){b.cd=5;b.timer=99;b.cdSet=false;sfx('roar');C.shake(10);C.flash(.2);C.toast('钟魔：时间到了？不，我才不让它走！',2000)}}
function bossLand(b,fy){var ph=b.phase;sfx('boom');confetti(b.x+b.w/2,fy-24,34);C.shake(12);C.hitstop(.04);C.emit(b.x+b.w/2,fy,'#ffe9a8',28,340,.7);b.air=false;b.y=b.hy;
 var sp=300+ph*50;C.shoot(b.x+4,fy-14,-sp,0,{wave:true,r:12,col:'#ffd23f',life:2.2,deflect:false,pierce:true});C.shoot(b.x+b.w-4,fy-14,sp,0,{wave:true,r:12,col:'#ffd23f',life:2.2,deflect:false,pierce:true})}
function bossStep(b,dt){
 var r=C.R,p=C.P,ph=b.phase,pcx=p.x+p.w/2,bcx=b.x+b.w/2,fy=b.hy+b.h,minX=b.p&&b.p.left!=null?b.p.left*T:T,maxX=r.w-T-b.w,i;
 b.amb=(b.amb||0)-dt;if(b.amb<=0){b.amb=.1;C.emit(C.cam.x+rnd(0,C.W/C.sc),C.cam.y+rnd(-10,24),pick(COLS),1,40,2.4,70)} /* 场地里一直飘着彩纸 */
 b.mouth=Math.max(0,(b.mouth||0)-dt*2);b.stomp=Math.max(0,(b.stomp||0)-dt*2);
 if(b.lastPh==null)b.lastPh=0;
 if(!b.stage){b.stage=1;b.hp2=b.max2=MAX2;b.rally=0;b.boards=[];b.lasers=[];b.t2=0}
 crowdStep(b,dt,C.P);
 if(ph!==b.lastPh){b.lastPh=ph;b.q=[];b.vx=0;b.vy=0;b.y=b.hy;b.air=false;b.cd=0;b.state='recover';b.timer=1.4;sfx('roar');C.shake(12);C.flash(.35);C.emit(bcx,b.y+b.h*.4,ph>1?'#ff3a5a':'#ffd23f',44,380,.9);
  C.toast(ph===1?'钟魔：节目还没演完呢，谁都别想走！':'钟魔：不许数——不许数到零！',2200)}
 if(b.q&&b.q.length)for(i=b.q.length-1;i>=0;i--){b.q[i].t-=dt;if(b.q[i].t<=0){var f=b.q[i].f;b.q.splice(i,1);f()}}
 if(b.state==='trans'){b.timer-=dt;b.face=1;b.y=b.hy;b.vx=0;b.mouth=1;if(Math.random()<.7)confetti(b.x+rnd(0,b.w),b.y+rnd(0,b.h*.5),2);if(b.timer<=0){b.state='idle';b.timer=1;b.crowdOn=true;b.t2=0;sfx('switch')}return}
 switch(b.state){
 case'idle':b.timer-=dt*(1+ph*.2);var d=pcx-bcx;b.face=d<0?-1:1;if(Math.abs(d)>260)b.x+=Math.sign(d)*80*dt;b.x=clamp(b.x,minX,maxX);
  if(b.timer<=0){var list=TA[ph],a=list[Math.floor(Math.random()*list.length)];if(a===b.lastAtk)a=list[(list.indexOf(a)+1)%list.length];b.lastAtk=b.atk=a;b.state='wind';b.timer=b.wt=TW[a]-ph*.06;b.again=false;
   if(a==='pounce')b.mark=clamp(pcx,minX+b.w/2,maxX+b.w/2);sfx('switch');if(SHOUT[a])C.toast(SHOUT[a],900)}break;
 case'wind':b.timer-=dt;b.face=(b.atk==='pounce'?b.mark:pcx)<bcx?-1:1;
  if(b.atk==='pounce')b.mark=clamp(pcx,minX+b.w/2,maxX+b.w/2);
  if(b.timer<=0)bossAtk(b,fy,minX,maxX);break;
 case'atk':b.timer-=dt;
  if(b.atk==='pounce'){b.vy+=1800*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.x=clamp(b.x,minX,maxX);
   if(b.y>=b.hy&&b.vy>0){b.x=clamp(b.x,minX,maxX);bossLand(b,fy);
    if(b.combo&&!b.again){b.again=true;b.combo=0;b.mark=clamp(pcx,minX+b.w/2,maxX+b.w/2);b.state='wind';b.atk='pounce';b.timer=b.wt=.5;b.face=b.mark<bcx?-1:1}
    else{b.again=false;b.state='recover';b.timer=1.1-ph*.2;b.vx=0;b.vy=0}}
   else if(b.timer<=0){b.y=b.hy;b.air=false;b.state='recover';b.timer=1}}
  else if(b.atk==='countdown'){b.cd-=dt;b.vx=0;b.mouth=1;if(Math.random()<.5)C.emit(b.x+b.w*rnd(.2,.8),b.y+b.h*.2,'#ffd23f',1,120,.5,-120);
   if(!b.cdSet&&b.cd<=1.6){b.cdSet=true;
    var from=minX+30,to=maxX+b.w-30,w=116,s1=clamp(pcx+rnd(-60,60),from+60,to-60),s2=rnd(from+60,to-60);if(Math.abs(s2-s1)<260)s2=s1<(from+to)/2?s1+340:s1-340;s2=clamp(s2,from+60,to-60);b.safe=[s1,s2];
    for(var x=from;x<=to;x+=w){var ok=b.safe.some(function(sf){return Math.abs(x-sf)<w*.85});if(!ok)pillar(x,fy-T,1.6)}}
   if(b.cd<=0){b.cd=0;sfx('boom');C.shake(14);C.flash(.3);C.emit(bcx,b.y+b.h*.3,'#ffffff',50,420,.9);b.state='stun';b.timer=3;b.stomp=1;C.toast('钟魔脱力了——快上！',1400)}}
  else if(b.timer<=0){b.state='recover';b.timer=1-ph*.15}break;
 case'stun':b.timer-=dt;b.cd=0;if(Math.random()<.4)C.emit(b.x+b.w*rnd(.3,.7),b.y+b.h*.05,'#ffd23f',1,50,.8,-60);if(b.timer<=0){b.state='idle';b.timer=.9-ph*.15}break;
 case'recover':b.timer-=dt;if(b.timer<=0){b.state='idle';b.timer=1.1-ph*.2}break}
}

/* ==================== 两段血：第二段由「同学们」一起击破 ====================
   第一段血（红）：老师自己打，打空后钟魔进入「迪斯科形态」，一边蹦迪一边无敌（老师砍它没用）。
   第二段血（彩虹）：只能靠全班合力——所有人一起狂按键盘 / 狂点屏幕，「应援槽」每满一次，
     同学们就踩着滑板从两侧冲过全场，撞得钟魔人仰马翻。应援槽自己也会慢慢涨（一个人也能打完，只是慢）。
   老师要做的是：在满场的滑板、镭射灯、迪斯科地板里活下来，等同学们的下一次冲锋。 */
var BPM=128,RUSH_DMG=2,MAX2=24;
var rallyAdd=0;
function onPress(e){if(!e.repeat)rallyAdd++}
if(typeof addEventListener==='function'){addEventListener('keydown',onPress);addEventListener('pointerdown',onPress)}
function beatOf(t){return t*BPM/60}
function segd(px,py,x1,y1,x2,y2){var dx=x2-x1,dy=y2-y1,l2=dx*dx+dy*dy,u=l2?clamp(((px-x1)*dx+(py-y1)*dy)/l2,0,1):0;return Math.hypot(px-(x1+u*dx),py-(y1+u*dy))}

function hitBoss(b,n,viaDash){
 if(!b||b.dead||b.state==='dying'||b.state==='trans')return false;
 if(b.stage===2){ /* 老师砍不动迪斯科钟魔：得靠同学们 */
  b.flash=.14;sfx('hit');C.emit(b.x+b.w/2,b.y+b.h*.4,'#ffffff',8,200,.3);
  if(C.time-(b.hintT||-9)>3){b.hintT=C.time;C.toast('打不动！——大家一起狂按键盘 / 点屏幕，喊同学们上！',2400)}
  return true}
 if(viaDash&&b.state==='wind'){n+=1;b.state='stun';b.timer=1.7;C.toast('打断成功！')}
 b.hp-=n;b.flash=.32;C.hitstop(.07);C.shake(6);sfx('hit');C.emit(b.x+b.w/2,b.y+b.h/2,'#ffd08a',22,260);
 var r=b.hp/b.max;b.phase=r<.34?2:r<.67?1:0;
 if(b.hp<=0){startTransition(b)}
 return true}
function startTransition(b){var R=C.R;
 b.hp=1;b.stage=2;b.phase=2;b.lastPh=2;b.state='trans';b.timer=4.4;b.q=[];b.vx=0;b.vy=0;b.y=b.hy;b.air=false;b.cd=0;b.hp2=b.max2=MAX2;b.rally=0;b.crowdOn=false;b.rush=null;b.boards=[];b.lasers=[];b.t2=0;
 R.proj=[];R.warns=[];R.fire=[];sfx('roar');C.shake(16);C.flash(.8);C.emit(b.x+b.w/2,b.y+b.h*.4,'#ffffff',60,460,1);confetti(b.x+b.w/2,b.y+b.h*.3,60);
 C.toast('钟魔：……好，好，好！既然你们都来了——那就一起蹦迪吧！！',3200)}
function finishBoss(b){b.hp=0;b.hp2=0;b.deadT=.01;b.state='dying';var R=C.R;R.proj=[];R.warns=[];R.fire=[];b.boards=[];b.lasers=[];b.rush=null;sfx('roar');confetti(b.x+b.w/2,b.y+b.h*.4,80)}
function dealCrowd(b,dmg){if(b.state==='dying'||b.hp2<=0)return;
 b.hp2=Math.max(0,b.hp2-dmg);b.flash=.3;C.hitstop(.07);C.shake(10);sfx('hit');sfx('boom');confetti(b.x+b.w/2,b.y+b.h*.4,34);C.emit(b.x+b.w/2,b.y+b.h*.4,'#ffd23f',24,380,.6);
 if(b.hp2<=0){finishBoss(b);C.toast('同学们：我们赢啦！！！',2600);return}
 if(b.state!=='stun'){b.state='stun';b.timer=1.3;b.q=[];b.cd=0;b.air=false;b.y=b.hy;b.vx=0;b.vy=0}}
function startRush(b){b.rush={t:0,dur:1.5,l:false,r:false,x0:C.cam.x-120,x1:C.cam.x+C.W/C.sc+120};b.rally=Math.min(b.rally-100,25);sfx('roar');C.shake(5);C.toast(pick(['同学们：冲啊——！！','同学们：老师别怕，我们来了！','同学们：滑板党出击！']),1600)}
function crowdStep(b,dt,p){
 var pr={x:p.x+3,y:p.y+4,w:p.w-6,h:p.h-6},hurtOK=p.inv<=0&&p.dash<=0,pcx=p.x+p.w/2,pcy=p.y+p.h/2,i,bcxx=b.x+b.w/2;
 function hurt(cx){if(hurtOK){C.damagePlayer(1,{dir:pcx>cx?1:-1});hurtOK=false}}
 (b.boards||[]).forEach(function(bd){bd.t+=dt;if(bd.t<0)return;bd.x+=bd.vx*dt;if(Math.random()<.8)C.emit(bd.x+bd.w/2-bd.dir*34,bd.y+bd.h,pick(COLS),1,60,.4,-30);
  if(ov(pr,{x:bd.x+8,y:bd.y,w:bd.w-16,h:bd.h}))hurt(bd.x+bd.w/2)});
 if(b.boards)b.boards=b.boards.filter(function(bd){return bd.t<0||(bd.dir>0?bd.x<bd.end:bd.x>bd.end)});
 (b.lasers||[]).forEach(function(l){l.t+=dt;if(l.t<l.tele)return;var u=clamp((l.t-l.tele)/l.dur,0,1);l.a=l.a0+(l.a1-l.a0)*u;l.on=true;
  var ex=l.x+Math.sin(l.a)*1000,ey=l.y+Math.cos(l.a)*1000;if(segd(pcx,pcy,l.x,l.y,ex,ey)<16)hurt(pcx)});
 if(b.lasers)b.lasers=b.lasers.filter(function(l){return l.t<l.tele+l.dur});
 if(b.stage!==2)return;
 if(b.crowdOn&&b.state!=='dying'){b.t2+=dt;b.rally+=rallyAdd*4+dt*3;if(b.rally>=100&&!b.rush)startRush(b)}
 rallyAdd=0;
 var rs=b.rush;if(rs){rs.t+=dt;var u2=rs.t/rs.dur,xl=rs.x0+(rs.x1-rs.x0)*u2,xr=rs.x1-(rs.x1-rs.x0)*u2;
  if(!rs.l&&xl>=bcxx){rs.l=true;dealCrowd(b,RUSH_DMG)}
  if(!rs.r&&xr<=bcxx){rs.r=true;dealCrowd(b,RUSH_DMG)}
  if(rs.t>rs.dur+.5)b.rush=null}}

/* 画一个踩滑板的同学（也用来画钟魔的滑板雪人） */
function mateColor(i){return ['#7fb4e8','#ff9a9a','#9ae8a8','#e8d27a','#c9a0ff','#ffb36a','#6dd5ff','#ff6a8a'][i%8]}
function drawRider(g,x,y,dir,t,i,foe){g.save();g.translate(x,y);g.scale(dir,1);var bob=Math.sin(t*14+i)*1.5,col=foe?'#ffffff':mateColor(i);
 G.glow(g,0,2,44,foe?'#ff6a8a':COLS[i%5],.55);
 g.fillStyle='#23182e';g.beginPath();g.roundRect(-30,-9,60,8,4);g.fill();g.fillStyle=COLS[(i+2)%5];g.fillRect(-26,-8,52,2.5);
 g.fillStyle='#ffd23f';g.beginPath();g.arc(-20,0,5,0,6.2832);g.fill();g.beginPath();g.arc(20,0,5,0,6.2832);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(-20,0,2,0,6.2832);g.fill();g.beginPath();g.arc(20,0,2,0,6.2832);g.fill();
 g.strokeStyle='#2a3348';g.lineWidth=5;g.lineCap='round';g.beginPath();g.moveTo(-6,-10);g.lineTo(-10,-22+bob);g.lineTo(-2,-30+bob);g.moveTo(8,-10);g.lineTo(12,-22+bob);g.lineTo(4,-30+bob);g.stroke();
 g.fillStyle=col;g.beginPath();g.roundRect(-10,-46+bob,22,22,6);g.fill();
 g.strokeStyle=col;g.lineWidth=4.5;g.beginPath();g.moveTo(-8,-40+bob);g.lineTo(-18,-52+bob+Math.sin(t*10+i)*3);g.moveTo(10,-40+bob);g.lineTo(20,-54+bob-Math.sin(t*10+i)*3);g.stroke();
 g.fillStyle=COLS[i%5];g.fillRect(19,-60+bob-Math.sin(t*10+i)*3,3,12);G.glow(g,20,-60+bob,16,COLS[i%5],.8);
 if(foe){g.fillStyle='#fff';g.beginPath();g.arc(0,-58+bob,10,0,6.2832);g.fill();g.fillStyle='#ff9a3a';g.beginPath();g.moveTo(4,-58+bob);g.lineTo(14,-56+bob);g.lineTo(4,-54+bob);g.fill();g.fillStyle='#22303f';g.fillRect(-4,-61+bob,2.4,2.4);g.fillRect(2,-61+bob,2.4,2.4);g.fillStyle='#ff3a5a';g.beginPath();g.moveTo(-8,-66+bob);g.lineTo(8,-66+bob);g.lineTo(0,-82+bob);g.fill()}
 else{g.fillStyle='#ffd9b0';g.beginPath();g.arc(0,-56+bob,9,0,6.2832);g.fill();g.fillStyle=['#3a2a1a','#c04a2a','#2a2a3a','#e8c04a'][i%4];g.beginPath();g.arc(0,-58+bob,9.4,Math.PI,0);g.fill();g.fillStyle='#22303f';g.fillRect(1,-57+bob,2.4,2.4);g.fillRect(-5,-57+bob,2.4,2.4);
  g.fillStyle=COLS[(i+1)%5];g.beginPath();g.moveTo(-5,-64+bob);g.lineTo(5,-64+bob);g.lineTo(0,-78+bob);g.fill()}
 g.restore()}

function crowdWorld(g,t){
 var r=C&&C.R;if(!r)return;var b=r.boss;if(!b||b.type!=='midnight'||!b.started||b.dead)return;
 var fy=b.hy+b.h,minX=b.p&&b.p.left!=null?b.p.left*T:T,maxX=r.w-T,beat=beatOf(t),i;
 /* 迪斯科地板：一整排会随节拍变色的舞池格子 */
 if(b.stage===2){g.save();g.globalCompositeOperation='lighter';
  var cx0=Math.floor(Math.max(minX,C.cam.x)/T),cx1=Math.floor(Math.min(maxX,C.cam.x+C.W/C.sc)/T);
  for(i=cx0;i<=cx1;i++){var k=(i+Math.floor(beat*2))%6,pl=.35+.35*Math.abs(Math.sin(beat*Math.PI+i*.5));g.fillStyle=COLS[k%5];g.globalAlpha=pl*.55;g.fillRect(i*T+1,fy-5,T-2,5);g.globalAlpha=pl*.18;g.fillRect(i*T+1,fy-46,T-2,41)}
  g.restore()}
 /* 滑板预警 + 滑板雪人 */
 (b.boards||[]).forEach(function(bd){
  if(bd.t<0){var bl=Math.sin(t*34)>0?1:.4,ex=bd.dir>0?minX:maxX;g.save();g.globalAlpha=bl;g.fillStyle='#ff3a5a';for(var a=0;a<3;a++){var ax=ex+bd.dir*(8+a*22);g.beginPath();g.moveTo(ax+bd.dir*14,fy-24);g.lineTo(ax-bd.dir*4,fy-38);g.lineTo(ax-bd.dir*4,fy-10);g.closePath();g.fill()}
   g.globalAlpha=bl*.25;g.fillRect(Math.min(ex,ex+bd.dir*(r.w)),fy-46,r.w,46);g.restore()}
  else drawRider(g,bd.x+bd.w/2,bd.y+bd.h,bd.dir,t,bd.i,true)});
 /* 镭射灯 */
 (b.lasers||[]).forEach(function(l){g.save();g.globalCompositeOperation='lighter';g.lineCap='round';var ang=l.on?l.a:l.a0,ex=l.x+Math.sin(ang)*1000,ey=l.y+Math.cos(ang)*1000;
  if(!l.on){var u=l.t/l.tele,bl=Math.sin(t*30)>0?1:.5;g.strokeStyle=l.col;g.globalAlpha=(.25+.4*u)*bl;g.lineWidth=2;g.setLineDash([12,10]);g.beginPath();g.moveTo(l.x,l.y);g.lineTo(ex,ey);g.stroke();g.setLineDash([])}
  else{g.strokeStyle=l.col;g.globalAlpha=.3;g.lineWidth=34;g.beginPath();g.moveTo(l.x,l.y);g.lineTo(ex,ey);g.stroke();g.globalAlpha=.8;g.lineWidth=14;g.stroke();g.strokeStyle='#fff';g.globalAlpha=1;g.lineWidth=4;g.stroke()}
  G.glow(g,l.x,l.y,40,l.col,.9);g.restore()});
 /* 同学们的冲锋 */
 var rs=b.rush;if(rs){var u=rs.t/rs.dur,rr=C.R;
  for(i=0;i<4;i++){var xl=rs.x0+(rs.x1-rs.x0)*u-i*46-12,xr=rs.x1-(rs.x1-rs.x0)*u+i*46+12;
   drawRider(g,xl,fy,1,t,i,false);drawRider(g,xr,fy,-1,t,i+4,false)}
  g.save();g.globalCompositeOperation='lighter';g.fillStyle='rgba(255,255,255,.25)';g.fillRect(C.cam.x,fy-70,C.W/C.sc,70);g.restore()}}

function crowdScreen(g,W,H,t){
 var r=C&&C.R;if(!r)return;var b=r.boss;if(!b||b.type!=='midnight'||!b.started||b.dead)return;
 var beat=beatOf(t),fr=beat%1,i,j;
 if(b.stage===2){
  g.save();
  /* 暗下来，让彩光更亮 */
  g.fillStyle='rgba(12,2,34,.34)';g.fillRect(0,0,W,H);
  g.globalCompositeOperation='lighter';
  /* 彩色颜色漂移 */
  var hue=(t*40)%360;g.fillStyle='hsla('+hue+',90%,55%,.06)';g.fillRect(0,0,W,H);
  /* 迪厅射灯：六束，随节拍摆动 */
  for(i=0;i<6;i++){var bx=W*(.08+.168*i),sw=Math.sin(t*1.7+i*1.3)*W*.2,col=COLS[(i+Math.floor(beat/2))%5],gr=g.createLinearGradient(bx,0,bx+sw,H);gr.addColorStop(0,'rgba(255,255,255,.35)');gr.addColorStop(1,'rgba(255,255,255,0)');
   g.save();g.globalAlpha=.16+.08*Math.sin(beat*Math.PI+i);g.fillStyle=col;g.beginPath();g.moveTo(bx-6,0);g.lineTo(bx+6,0);g.lineTo(bx+sw+W*.1,H);g.lineTo(bx+sw-W*.1,H);g.closePath();g.fill();g.restore()}
  /* 镭射扇：从顶上放射出去的细线 */
  g.lineWidth=1.6;for(i=0;i<3;i++){var ox=W*(.2+.3*i);g.strokeStyle=COLS[(i+Math.floor(beat))%5];g.globalAlpha=.45;for(j=-5;j<=5;j++){var a=Math.PI/2+j*.12+Math.sin(t*1.4+i)*.35;g.beginPath();g.moveTo(ox,0);g.lineTo(ox+Math.cos(a)*H*1.5,Math.sin(a)*H*1.5);g.stroke()}}
  /* 迪斯科球 */
  var bcx2=W/2,bcy2=H*.13,R=Math.min(W,H)*.075;
  g.globalCompositeOperation='source-over';g.globalAlpha=1;g.strokeStyle='#cfd6dc';g.lineWidth=2;g.beginPath();g.moveTo(bcx2,0);g.lineTo(bcx2,bcy2-R);g.stroke();
  var sg=g.createRadialGradient(bcx2-R*.3,bcy2-R*.3,R*.1,bcx2,bcy2,R);sg.addColorStop(0,'#ffffff');sg.addColorStop(1,'#5a6a86');g.fillStyle=sg;g.beginPath();g.arc(bcx2,bcy2,R,0,6.2832);g.fill();
  for(i=0;i<14;i++){var la=i/14*6.2832+t*.9,cs=Math.cos(la);if(cs<=0)continue;var fx=bcx2+Math.sin(la)*R*.92;for(j=0;j<7;j++){var ya=-1.2+j*.4,fyy=bcy2+Math.sin(ya)*R*.9,sz=R*.16*cs;g.fillStyle=((i+j+Math.floor(t*6))%3===0)?'rgba(255,255,255,.95)':'rgba(170,190,230,.55)';g.fillRect(fx-sz,fyy-sz*.9,sz*2,sz*1.8)}}
  g.globalCompositeOperation='lighter';G.glow(g,bcx2,bcy2,R*3.2,'#ffffff',.5);
  /* 球反射出来的光斑，满屏转 */
  for(i=0;i<28;i++){var sa=t*.55+i*.2244,sd=H*(.22+((i*37)%10)/10*.6),spx=bcx2+Math.cos(sa)*sd*1.5,spy=bcy2+R+Math.abs(Math.sin(sa*1.0+i))*sd*.8+H*.1;g.fillStyle=COLS[i%5];g.globalAlpha=.4+.3*Math.sin(t*5+i);g.beginPath();g.arc(spx,spy,5+(i%3)*2,0,6.2832);g.fill()}
  /* 频闪：每拍一次，每 4 拍一次大的 */
  var big=Math.floor(beat)%4===0;g.globalAlpha=Math.pow(1-fr,3)*(big?.16:.07);g.fillStyle='#ffffff';g.fillRect(0,0,W,H);
  g.restore();
  /* 台下的观众：随节拍蹦跳、挥荧光棒 */
  g.save();var n=Math.ceil(W/52);
  for(i=0;i<n;i++){var px=i*52+26+Math.sin(t*1.6+i)*5,jump=Math.abs(Math.sin(beat*Math.PI+i*.6))*12,py=H+4-jump;
   g.fillStyle='#08040f';g.beginPath();g.arc(px,py-48,10,0,6.2832);g.fill();g.beginPath();g.roundRect(px-12,py-38,24,40,8);g.fill();
   var sw2=Math.sin(beat*Math.PI*2+i)*10;g.strokeStyle='#08040f';g.lineWidth=5;g.lineCap='round';g.beginPath();g.moveTo(px-10,py-32);g.lineTo(px-20-sw2,py-62);g.moveTo(px+10,py-32);g.lineTo(px+20+sw2,py-62);g.stroke();
   g.globalCompositeOperation='lighter';var gc=COLS[(i+Math.floor(beat))%5];g.strokeStyle=gc;g.lineWidth=3.5;g.beginPath();g.moveTo(px-20-sw2,py-62);g.lineTo(px-24-sw2*1.4,py-80);g.moveTo(px+20+sw2,py-62);g.lineTo(px+24+sw2*1.4,py-80);g.stroke();G.glow(g,px-24-sw2*1.4,py-80,14,gc,.7);G.glow(g,px+24+sw2*1.4,py-80,14,gc,.7);g.globalCompositeOperation='source-over'}
  g.restore();
  /* 第一次进入第二段：提示怎么玩 */
  if(b.t2<12&&b.crowdOn){var a2=Math.min(1,(12-b.t2)/2,b.t2*2);g.save();g.globalAlpha=a2;g.textAlign='center';g.font='900 '+Math.round(Math.min(30,W*.045))+'px "Noto Sans SC",sans-serif';g.lineWidth=6;g.strokeStyle='rgba(20,4,40,.9)';var s1='全班一起狂按键盘 / 狂点屏幕！';g.strokeText(s1,W/2,H*.27);g.fillStyle='#ffe9a8';g.fillText(s1,W/2,H*.27);g.font='bold '+Math.round(Math.min(18,W*.028))+'px "Noto Sans SC",sans-serif';var s2='应援槽满了，同学们就会踩着滑板冲上来——老师先别死！';g.strokeText(s2,W/2,H*.27+30);g.fillStyle='#fff';g.fillText(s2,W/2,H*.27+30);g.restore()}
  /* 变身演出 */
  if(b.state==='trans'){var tu=1-b.timer/4.4;g.save();g.globalCompositeOperation='lighter';g.fillStyle='rgba(255,255,255,'+Math.max(0,.7-tu*1.4)+')';g.fillRect(0,0,W,H);g.restore();
   g.save();g.textAlign='center';g.font='900 '+Math.round(Math.min(64,W*.09))+'px "Noto Sans SC",sans-serif';g.lineWidth=9;g.strokeStyle='rgba(20,4,40,.95)';var s3='第二阶段 · 全班蹦迪！';g.globalAlpha=Math.min(1,tu*3)*Math.min(1,(1-tu)*4);g.strokeText(s3,W/2,H*.42);var tg=g.createLinearGradient(W*.25,0,W*.75,0);tg.addColorStop(0,'#ff6a8a');tg.addColorStop(.35,'#ffd23f');tg.addColorStop(.7,'#6dffb0');tg.addColorStop(1,'#6dd5ff');g.fillStyle=tg;g.fillText(s3,W/2,H*.42);g.restore()}}}

/* 两段血条 + 应援槽 */
function drawBossHud(g,b,W,H){
 var cl=document.body.classList.contains('ui-cluster'),bw=Math.min(cl?600:520,W*(cl?.42:.6)),bx=(W-bw)/2,by=cl?Math.round(70*Math.max(1,Math.min(1.75,Math.min(W,H)/700))):H-(document.body.classList.contains('touch')?Math.min(200,H*.32):56);
 var s2=b.stage===2,t=C.time;
 g.fillStyle='rgba(6,14,24,.75)';g.beginPath();g.roundRect(bx-12,by-26,bw+24,44,12);g.fill();
 g.fillStyle='#ffe9d9';g.font='bold 13px "Noto Sans SC",sans-serif';g.textAlign='left';g.fillText(b.label+(s2?' · 迪斯科形态':''),bx,by-8);
 g.textAlign='right';g.fillStyle=s2?'#9aa6b2':'#ffb79a';g.fillText(s2?'第一段血 已击破':['第一段血','第一段血 · 第二阶段','第一段血 · 狂暴'][b.phase]||'',bx+bw,by-8);
 g.fillStyle='#3a1f26';g.beginPath();g.roundRect(bx,by,bw,9,5);g.fill();
 if(!s2){g.fillStyle=b.flash>0?'#fff':'#ff6a4f';g.beginPath();g.roundRect(bx,by,Math.max(0,bw*b.hp/b.max),9,5);g.fill()}
 if(!s2){g.textAlign='start';return}
 /* 第二段：彩虹血条（同学们的血条）在上方/下方再加一块面板 */
 var dir=cl?1:-1,py=by+dir*58;
 g.fillStyle='rgba(20,6,40,.82)';g.beginPath();g.roundRect(bx-12,py-26,bw+24,62,12);g.fill();
 g.strokeStyle='rgba(255,210,63,.6)';g.lineWidth=1.5;g.stroke();
 g.textAlign='left';g.fillStyle='#ffe9a8';g.font='bold 13px "Noto Sans SC",sans-serif';g.fillText('第二段血 · 由同学们共同击破',bx,py-8);
 g.textAlign='right';g.fillStyle='#fff';g.fillText(Math.ceil(b.hp2)+' / '+b.max2,bx+bw,py-8);
 g.fillStyle='#2a1640';g.beginPath();g.roundRect(bx,py,bw,10,5);g.fill();
 var rg=g.createLinearGradient(bx,0,bx+bw,0),off=(t*.4)%1;['#ff6a8a','#ffd23f','#6dffb0','#6dd5ff','#c9a0ff','#ff6a8a'].forEach(function(c,i){rg.addColorStop(clamp(i/5,0,1),c)});
 g.save();g.beginPath();g.roundRect(bx,py,Math.max(0,bw*b.hp2/b.max2),10,5);g.clip();g.fillStyle=b.flash>0?'#fff':rg;g.fillRect(bx,py,bw,10);g.fillStyle='rgba(255,255,255,'+(.2+.15*Math.sin(t*8))+')';g.fillRect(bx,py,bw,4);g.restore();
 /* 应援槽 */
 var u=clamp((b.rally||0)/100,0,1);g.fillStyle='#2a1640';g.beginPath();g.roundRect(bx,py+18,bw,8,4);g.fill();
 g.fillStyle=u>.85?(Math.sin(t*30)>0?'#fff':'#ffd23f'):'#6dffb0';g.beginPath();g.roundRect(bx,py+18,Math.max(0,bw*u),8,4);g.fill();
 g.textAlign='left';g.font='bold 11px "Noto Sans SC",sans-serif';g.fillStyle='#b8ffd8';g.fillText('应援 '+Math.floor(u*100)+'%  ·  狂按键盘 / 点屏幕！',bx,py+36);
 g.textAlign='start'}


return {hitBoss:hitBoss,drawBossHud:drawBossHud,attach:attach,build:build,initEnemy:initEnemy,update:update,bossStep:bossStep,drawWorld:drawWorld,drawScreen:drawScreen,AI:AI}
})();
