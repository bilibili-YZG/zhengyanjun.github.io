/* 地铁历险 DLC 扩展（METROX）
   由 dlc-engine.js 在 build / initEnemy / update / drawWorld / drawScreen 里调用，只对地铁历险的物件和主题生效，
   不碰主线和「未竟之梦」。内容：
     8 种新怪物：赶车族 / 失控行李箱（载客车厢）· 电火花虫 / 断路器守卫（设备车厢）· 潜伏者 / 渗水怪（隧道区间）· 检票员 / 乱码体（驶向车头）
     6 种新障碍：摇晃吊环 / 车门 / 带电地板 / 液压冲头 / 第三轨 / 扫描线
     4 章各有各的氛围：黄昏掠影 → 配电闪灯（闪灯时电火花虫会扑向你）→ 隧道漆黑（只有手电和发光物）→ 信号紊乱（画面撕裂）
     第三章结尾 Boss：迷途列车（boss 类型 train，攻击表在 game.js 的 BOSS_ATK） */
window.METROX=(function(){
var C=null,T=32,G=window.GFX,M={on:true,ch:0};
var ell=G.ell,poly=G.poly,glow=G.glow;
function attach(core){C=core;T=core.T}
function rnd(a,b){return a+Math.random()*(b-a)}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function chap(r){var m=/^t_m(\d)$/.exec(r.biome||'');return m?+m[1]:0}
function ov(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function sfx(n){if(window.AudioFX)AudioFX.sfx(n)}

/* ---------- 第二章的闪灯节奏：7.2 秒一轮，亮 → 急闪 → 全黑 → 急闪回亮 ---------- */
/* 第二章三关的「全黑」时长逐关增大：2-1 约 0.8 秒 → 2-2 约 1.6 秒 → 2-3 约 2.4 秒（一轮仍是 7.2 秒，亮的时间相应缩短） */
var LIGHT_OFF=[.8,1.6,2.4];
function lightOnAt(t,li){var P=7.2,D=LIGHT_OFF[Math.max(0,Math.min(2,li|0))],onLen=P-(.8+D+.6),u=t%P;
 if(u<onLen)return true;u-=onLen;
 if(u<.8)return Math.floor(u/.09)%2===1;u-=.8;
 if(u<D)return false;u-=D;
 return Math.floor(u/.09)%2===0}

/* ==================== 构建 ==================== */
var HAZ={strap:1,autodoor:1,liveplate:1,piston:1,thirdrail:1,scanner:1};
var ENEMIES=['commuter','luggage','sparkbug','breaker','lurker','dripper','ticketer','glitch'];
function build(r,d,kind,gs){
 if(HAZ[kind]){if(kind==='strap'){d.ex=Math.ceil(Math.sin(.85)*d.h)+24;d.ey=24}else if(kind==='piston'){d.ey=(d.p.len||8)*T+40;d.ex=20}
  d.x0=d.x;d.y0=d.y;d.act=false;d.warn=false;(r.mx=r.mx||[]).push(d);r.xthings.push(d);return true}
 return false}
function initEnemy(e,d){var k=e.kind,rng=(d.p.range||5)*T;
 if(ENEMIES.indexOf(k)<0)return;
 e.cs='wait';e.timer=1+Math.random()*1.5;e.min=d.x-rng/2;e.max=d.x+rng/2;e.vx=0;e.air=false;
 if(k==='commuter'){e.hp=d.p.hp||2;e.face=-1}
 else if(k==='luggage'){e.hp=d.p.hp||2;e.dir=1;e.face=1}
 else if(k==='sparkbug'){e.hp=d.p.hp||1}
 else if(k==='breaker'){e.hp=d.p.hp||3;e.timer=1.6}
 else if(k==='lurker'){e.hp=d.p.hp||2;e.cs='hide'}
 else if(k==='dripper'){e.hp=d.p.hp||2;e.timer=rnd(.6,2)}
 else if(k==='ticketer'){e.hp=d.p.hp||3;e.vx=26;e.face=-1;e.timer=1.4}
 else if(k==='glitch'){e.hp=d.p.hp||2;e.timer=rnd(1.2,2.4);e.phased=false;e.shot=2.6}}

/* ==================== 怪物 AI ==================== */
function stepX(e,dx){var nx=e.x+dx,ahead=dx>0?nx+e.w+2:nx-2;if(!C.groundAt(ahead,e.y+e.h+4)||C.solidAt(ahead,e.y+e.h-6))return false;e.x=nx;return true}
var AI={
 /* 赶车族：站着看表 → 发现你就压低身子起跑 → 一路冲出去，收不住脚（惯性）→ 喘气 */
 commuter:function(e,dt,c){
  if(e.cs==='wait'){e.timer-=dt;if(c.dist<420)e.face=c.dx>0?1:-1;
   var pace=Math.sin(e.t*.6)*18*dt;if(e.x+pace>e.min&&e.x+pace<e.max)stepX(e,pace);
   if(e.timer<=0&&Math.abs(c.dx)<300&&Math.abs(c.dy)<90){e.cs='wind';e.timer=.45;e.face=c.dx>0?1:-1;sfx('switch')}}
  else if(e.cs==='wind'){e.timer-=dt;if(e.timer<=0){e.cs='rush';e.timer=.9;e.vx=e.face*270;sfx('dash')}}
  else if(e.cs==='rush'){e.timer-=dt;if(!stepX(e,e.vx*dt)||e.timer<=0){e.cs='slide';e.timer=.7}
   if(Math.random()<.5)C.emit(e.x+e.w/2-e.face*10,e.y+e.h-2,'#e8dcc8',1,60,.3,-30)}
  else if(e.cs==='slide'){e.vx*=Math.pow(.02,dt);stepX(e,e.vx*dt);e.timer-=dt;if(Math.abs(e.vx)<24||e.timer<=0){e.vx=0;e.cs='tired';e.timer=1.1}}
  else{e.timer-=dt;if(e.timer<=0){e.cs='wait';e.timer=1.2}}},
 /* 失控行李箱：加速度一直为正，撞墙才掉头——越跑越快 */
 luggage:function(e,dt,c){
  e.vx=clamp(e.vx+e.dir*150*dt,-200,200);var nx=e.x+e.vx*dt;
  if(nx<e.min||nx>e.max||!stepX(e,e.vx*dt)){e.dir=-e.dir;e.vx*=-.15;C.emit(e.x+e.w/2,e.y+e.h,'#c98a4a',3,70,.3)}
  e.face=e.vx>=0?1:-1;e.spin=(e.spin||0)+e.vx*dt*.12},
 /* 电火花虫：灯亮时老实待在电线上来回爬；灯一灭就朝你扑过来 */
 sparkbug:function(e,dt,c){var rg=(e.p.range||5)*T,dark=M.ch===2&&!M.on;
  if(dark&&c.dist<620){var d=c.dist||1;e.x+=c.dx/d*(105+rnd(-20,20))*dt;e.y+=c.dy/d*(105+rnd(-20,20))*dt;e.face=c.dx>0?1:-1;e.excited=true}
  else{e.excited=false;var tx=e.hx+Math.sin(e.t*1.1)*rg/2,ty=e.hy+Math.sin(e.t*2.6)*5;e.x+=(tx-e.x)*Math.min(1,dt*3);e.y+=(ty-e.y)*Math.min(1,dt*3);e.face=Math.cos(e.t*1.1)>0?1:-1}
  if(Math.random()<(e.excited?.6:.12))C.emit(c.ecx+rnd(-8,8),c.ecy+rnd(-8,8),'#fff6a0',1,50,.25,0)},
 /* 断路器守卫：拉闸蓄电，然后砸地，沿地面向两边放出电击波——跳起来躲 */
 breaker:function(e,dt,c){
  if(e.cs==='wait'){e.timer-=dt;e.face=c.dx>0?1:-1;if(e.timer<=0&&c.dist<560){e.cs='charge';e.timer=(M.ch===2&&!M.on)?.6:.95;sfx('switch')}}
  else if(e.cs==='charge'){e.timer-=dt;e.flash=Math.max(e.flash,.04);if(Math.random()<.5)C.emit(c.ecx+rnd(-20,20),e.y+rnd(0,e.h),'#fff27a',1,90,.3,0);
   if(e.timer<=0){var fy=e.y+e.h-12;C.shoot(c.ecx-8,fy,-250,0,{wave:true,pierce:true,deflect:false,r:11,col:'#fff27a',life:1.7});C.shoot(c.ecx+8,fy,250,0,{wave:true,pierce:true,deflect:false,r:11,col:'#fff27a',life:1.7});
    C.shake(5);sfx('boom');C.emit(c.ecx,e.y+e.h,'#fff27a',18,260,.5);e.cs='wait';e.timer=2.4}}},
 /* 潜伏者：藏在暗处，只露出两只眼睛；靠近了就蹲下蓄力，扑上来 */
 lurker:function(e,dt,c){
  if(e.air){e.vy+=1500*dt;var nx=e.x+e.vx*dt;if(!C.solidAt(nx+(e.vx>0?e.w:0),e.y+e.h*.5))e.x=nx;e.y+=e.vy*dt;
   if(e.vy>0&&C.groundAt(e.x+e.w/2,e.y+e.h)){e.y=Math.floor((e.y+e.h)/T)*T-e.h;e.air=false;e.vx=0;e.vy=0;e.cs='rest';e.timer=1.3;C.emit(e.x+e.w/2,e.y+e.h,'#9fffd8',8,120,.3)}return}
  if(e.cs==='hide'){e.alpha=.35;if(c.dist<330)e.cs='stalk'}
  else if(e.cs==='stalk'){e.alpha=.55;e.face=c.dx>0?1:-1;if(c.dist>520){e.cs='hide';return}
   var sp=48*dt*e.face;if(e.x+sp>e.min-60&&e.x+sp<e.max+60)stepX(e,sp);
   if(Math.abs(c.dx)<190&&Math.abs(c.dy)<110){e.cs='crouch';e.timer=.5;sfx('switch')}}
  else if(e.cs==='crouch'){e.timer-=dt;e.alpha=.9;if(e.timer<=0){e.air=true;e.vx=e.face*330;e.vy=-400;sfx('dash')}}
  else if(e.cs==='rest'){e.alpha=.8;e.timer-=dt;if(e.timer<=0)e.cs='stalk'}},
 /* 渗水怪：趴在车顶的积水里，鼓起一个水泡，然后滴下来 */
 dripper:function(e,dt,c){e.timer-=dt;e.swell=e.timer<.6?1-e.timer/.6:0;
  if(e.timer<=0){e.timer=rnd(1.8,2.8);if(Math.abs(c.dx)<420&&Math.abs(c.dy)<560)C.shoot(c.ecx,e.y+e.h,0,40,{g:900,r:5,col:'#8fd0ff',life:2.6})}},
 /* 检票员：远远地把车票朝你甩过来（抛物线），靠近了就慢慢踱步 */
 ticketer:function(e,dt,c){e.face=c.dx>0?1:-1;
  if(e.cs==='wind'){e.timer-=dt;e.flash=Math.max(e.flash,.03);if(e.timer<=0){var tf=clamp(c.dist/330,.5,1.15),g=700,vx=c.dx/tf,vy=c.dy/tf-.5*g*tf;C.shoot(c.ecx,e.y+12,vx,vy,{g:g,r:7,col:'#f3d9a4',life:2.6});sfx('shoot');e.cs='wait';e.timer=2.5}}
  else{e.timer-=dt;var nx=e.x+e.vx*dt;if(nx<e.min||nx>e.max||!stepX(e,e.vx*dt))e.vx=-e.vx;
   if(e.timer<=0&&c.dist<470&&c.dist>80){e.cs='wind';e.timer=.55}}},
 /* 乱码体：信号一抖就换个位置；换位的那一瞬间是“丢包”状态，打不到也伤不到你 */
 glitch:function(e,dt,c){var rg=(e.p.range||5)*T;
  if(e.phased){e.pt-=dt;if(e.pt<=0){e.phased=false;e.x=e.nx;e.y=e.ny;C.emit(e.x+e.w/2,e.y+e.h/2,'#6dffff',14,200,.4,0)}}
  else{e.timer-=dt;e.x+=Math.sin(e.t*4)*14*dt;e.y+=Math.cos(e.t*3.1)*10*dt;
   e.shot-=dt;if(e.shot<=0&&c.dist<480){e.shot=3;for(var i=-1;i<=1;i++){var a=Math.atan2(c.dy,c.dx)+i*.3;C.shoot(c.ecx,c.ecy,Math.cos(a)*190,Math.sin(a)*190,{r:6,col:'#6dffff',life:2.6})}}
   if(e.timer<=0){for(var k=0;k<8;k++){var nx=e.hx+rnd(-1,1)*rg/2,ny=e.hy+rnd(-1.5,1.5)*T;if(!C.solidAt(nx+e.w/2,ny+e.h/2)){e.nx=nx;e.ny=ny;e.phased=true;e.pt=.4;e.timer=rnd(2,3.2);C.emit(c.ecx,c.ecy,'#ff6dff',12,180,.4,0);break}}if(!e.phased)e.timer=.8}}}
};
if(window.DLCX&&DLCX.ENEMY_KINDS)ENEMIES.forEach(function(k){DLCX.ENEMY_KINDS[k]=1;DLCX.ENEMY[k]=AI[k]}); /* 关卡工坊只用到下面的绘制，没有 DLCX */

/* ==================== 障碍物 ==================== */
function strapAng(d,t){var per=d.p.period||3.2;return .85*Math.sin((t/per+(d.p.phase||0))*6.2832)}
function cyc(d,t,def){var per=d.p.period||def;return ((t+(d.p.phase||0)*per)%per)/per}
function update(dt,r,p){
 var ch=chap(r);M.ch=ch;
 /* 灯的计时器只在真正游玩时前进（update 只在 play 状态被调用）：对话/暂停/剧情期间灯光不变，也不会偷偷把闪灯时间走掉；每进一关从头计时 */
 if(M.rr!==r){M.rr=r;M.lt=0;M.dead=false;M.back=false}M.lt+=dt;
 if(ch===2){ /* 2-3 后段：最后一次闪烁之后彻底断电，不再恢复，一直黑到第三章结尾 */
  if(!M.dead&&C.li===2&&p&&p.x>r.w*.7){M.dead=true;C.toast('最后一次闪烁之后……电，彻底断了。',2600);C.shake(5);sfx('boom')}
  M.on=M.dead?false:lightOnAt(M.lt,C.li)}
 else M.on=true;
 if(ch===3&&!M.back&&C.li===2&&r.boss&&r.boss.dead){M.back=true;C.flash(.9);C.toast('电回来了！车厢的灯一盏接一盏亮起。',2800);sfx('win')}
 /* Boss 战开始后，车头这节车厢的后门锁上：Boss 只在这一节里冲撞，主角不能退到后面的车厢里躲 */
 var tb=r.boss;if(p&&tb&&tb.type==='train'&&tb.started&&!tb.dead&&tb.state!=='dying'){var lx=(tb.p&&tb.p.left!=null?tb.p.left:1)*T;if(p.x<lx){p.x=lx;if(p.vx<0)p.vx=0;if(!tb.locked){tb.locked=true;sfx('door');C.toast('贯通门锁上了——只能在这节车厢里决一胜负！',1800)}}}
 if(!r.mx||!p)return;
 var tm=C.time,pr={x:p.x+3,y:p.y+4,w:p.w-6,h:p.h-6},pcx=p.x+p.w/2,pcy=p.y+p.h/2,hurtOK=p.inv<=0&&p.dash<=0;
 function hurt(cx){if(hurtOK){C.damagePlayer(1,{dir:pcx>cx?1:-1});hurtOK=false}}
 r.mx.forEach(function(d){var k=d.kind,f;
  if(k==='strap'){var len=d.h,a=strapAng(d,tm);d.bx=d.x0+T/2+Math.sin(a)*len;d.by=d.y0+Math.cos(a)*len;
   var nx=clamp(d.bx,pr.x,pr.x+pr.w),ny=clamp(d.by,pr.y,pr.y+pr.h);if(Math.hypot(d.bx-nx,d.by-ny)<16)hurt(d.bx)}
  else if(k==='autodoor'){f=cyc(d,tm,4);var open=1,st='open';
   if(f<.46){open=1;st='open'}else if(f<.62){open=1;st='warn'}else if(f<.72){open=1-(f-.62)/.1;st='closing'}else if(f<.9){open=0;st='closed'}else{open=(f-.9)/.1;st='opening'}
   var near=Math.abs(d.x+d.w/2-(p.x+p.w/2))<560&&Math.abs(d.y-p.y)<420;
   if(st==='warn'){d.bt=(d.bt||0)-dt;if(d.bt<=0){d.bt=.16;if(near)sfx('beep')}}else d.bt=0;
   if(st==='closed'&&!d.shut){d.shut=true;if(near)sfx('door')}if(st!=='closed')d.shut=false;
   d.warn=st==='warn';d.open=open;d.st=st;
   var lw=(1-open)*d.w/2;
   if(lw>1){var L={x:d.x,y:d.y,w:lw,h:d.h},Rr={x:d.x+d.w-lw,y:d.y,w:lw,h:d.h};
    if(ov(pr,L)||ov(pr,Rr)){var side=pcx<d.x+d.w/2?-1:1;
     if(st==='closing')hurt(d.x+d.w/2);
     p.x=side<0?d.x-p.w-1:d.x+d.w+1;p.vx=0}}}
  else if(k==='liveplate'){f=cyc(d,tm,3.4);d.warn=f>=.55&&f<.68;d.act=f>=.68&&f<.95;
   if(d.act){if(ov(pr,{x:d.x,y:d.y+6,w:d.w,h:d.h-4}))hurt(d.x+d.w/2);if(Math.random()<.5)C.emit(d.x+rnd(0,d.w),d.y+10,'#9fe8ff',1,90,.3,0)}}
  else if(k==='piston'){f=cyc(d,tm,3.6);var full=(d.p.len||8)*T,ext=0;d.warn=f>=.4&&f<.52;
   if(f<.52)ext=0;else if(f<.6){var q=(f-.52)/.08;ext=full*q*q}else if(f<.72)ext=full;else if(f<.92)ext=full*(1-(f-.72)/.2);else ext=0;
   if(ext>full*.9&&!d.slammed){d.slammed=true;C.shake(4);C.emit(d.x+d.w/2,d.y+ext+20,'#c0c8d0',10,180,.4)}if(ext<full*.5)d.slammed=false;
   d.ext=ext;d.act=ext>14;
   if(d.act&&ov(pr,{x:d.x+6,y:d.y,w:d.w-12,h:ext+24}))hurt(d.x+d.w/2)}
  else if(k==='thirdrail'){d.act=true;if(ov(pr,{x:d.x+2,y:d.y+12,w:d.w-4,h:d.h-10}))hurt(d.x+d.w/2);if(Math.random()<.3)C.emit(d.x+rnd(0,d.w),d.y+12,'#6bd6ff',1,70,.3,0)}
  else if(k==='scanner'){var rng=(d.p.dx||8)*T,sp=d.p.speed||70,s=(tm*sp/rng+(d.p.phase||0))%2,tri=s<1?s:2-s,e2=tri*tri*(3-2*tri);d.x=d.x0+rng*e2;d.act=true;
   if(ov(pr,{x:d.x+T/2-5,y:d.y,w:10,h:d.h}))hurt(d.x+T/2)}
 })}

/* ==================== 世界层绘制（目前没有需要画在世界里的东西） ==================== */
function drawWorld(g,t){}

/* ==================== 氛围：覆盖在画面上，坐标是屏幕像素 ==================== */
var dk=null;
function lightList(r,p,ch,W,H){var L=[],sc=C.sc,cam=C.cam;
 function add(x,y,rad,a){var sx=(x-cam.x)*sc,sy=(y-cam.y)*sc,rr=rad*sc;if(sx<-rr||sx>W+rr||sy<-rr||sy>H+rr)return;L.push({x:sx,y:sy,r:rr,a:a})}
 if(p)add(p.x+p.w/2,p.y+p.h*.4,(ch===3?150:135)+Math.sin(C.time*7)*(ch===3?5:0),1);
 r.checks.forEach(function(o){add(o.x+o.w/2,o.y+o.h/2,115,.95)});
 if(r.exit)add(r.exit.x+r.exit.w/2,r.exit.y+r.exit.h/2,125,.9);
 r.xblue.forEach(function(o){if(!o.got)add(o.x+o.w/2,o.y+o.h/2,95,.95)});
 (r.mx||[]).forEach(function(d){if(d.kind==='liveplate'&&(d.act||d.warn))add(d.x+d.w/2,d.y+16,100,.8);else if(d.kind==='thirdrail')add(d.x+d.w/2,d.y+20,95,.85);else if(d.kind==='scanner')add(d.x+T/2,d.y+d.h/2,120,.9);else if(d.kind==='autodoor'&&d.warn)add(d.x+d.w/2,d.y+d.h/2,90,.8);else if(d.kind==='piston'&&d.warn)add(d.x+d.w/2,d.y+(d.p.len||8)*T,90,.7)});
 r.enemies.forEach(function(e){if(e.dead)return;var k=e.kind;if(k==='sparkbug')add(e.x+e.w/2,e.y+e.h/2,80,.9);else if(k==='glitch')add(e.x+e.w/2,e.y+e.h/2,85,.85);else if(k==='breaker'&&e.cs==='charge')add(e.x+e.w/2,e.y+e.h/2,130,.9);else if(k==='commuter'||k==='ticketer')add(e.x+e.w/2,e.y+e.h/2,45,.5)});
 r.proj.forEach(function(q){add(q.x,q.y,55,.85)});
 var b=r.boss;if(b&&b.type==='train'&&b.started&&!b.dead){var fc=(b.face||1);add(b.x+b.w/2+fc*b.w*.55,b.y+b.h*.55,300,1);add(b.x+b.w/2,b.y+b.h*.5,170,.9)}
 return L}
function darken(g,W,H,alpha,L,tint){
 var w=Math.ceil(W/2),h=Math.ceil(H/2);
 if(!dk||dk.width!==w||dk.height!==h){dk=document.createElement('canvas');dk.width=w;dk.height=h;dk.g=dk.getContext('2d')}
 var d=dk.g;d.globalCompositeOperation='source-over';d.clearRect(0,0,w,h);d.fillStyle=tint||'rgb(3,5,12)';d.globalAlpha=alpha;d.fillRect(0,0,w,h);d.globalAlpha=1;
 d.globalCompositeOperation='destination-out';
 L.forEach(function(l){var x=l.x/2,y=l.y/2,rr=l.r/2,gr=d.createRadialGradient(x,y,rr*.12,x,y,rr);gr.addColorStop(0,'rgba(0,0,0,'+l.a+')');gr.addColorStop(.55,'rgba(0,0,0,'+(l.a*.55)+')');gr.addColorStop(1,'rgba(0,0,0,0)');d.fillStyle=gr;d.fillRect(x-rr,y-rr,rr*2,rr*2)});
 d.globalCompositeOperation='source-over';
 g.drawImage(dk,0,0,W,H)}
function drawScreen(g,W,H,t){
 var r=C.R,p=C.P;if(!r)return;var ch=chap(r);if(!ch)return;
 var atmo=G.fx.atmo!==false;
 if(ch===1){ /* 黄昏：窗外的路灯一盏盏掠过车厢 */
  if(!atmo)return;
  var k=(t*.32)%1;for(var i=0;i<3;i++){var x=((k+i/3)%1)*(W+360)-180,lg=g.createLinearGradient(x-70,0,x+70,0);lg.addColorStop(0,'rgba(255,190,110,0)');lg.addColorStop(.5,'rgba(255,200,130,.085)');lg.addColorStop(1,'rgba(255,190,110,0)');
   g.save();g.translate(0,0);g.transform(1,0,-.3,1,H*.15,0);g.fillStyle=lg;g.fillRect(x-70,0,140,H);g.restore()}
  return}
 if(ch===2){ /* 配电间：灯一闪一闪，灭了只剩手电和带电的东西发光 */
  if(M.on)return;
  if(!atmo){g.fillStyle='rgba(5,8,16,.5)';g.fillRect(0,0,W,H);return}
  darken(g,W,H,.9,lightList(r,p,ch,W,H),'rgb(4,6,14)');return}
 if(ch===3){ /* 隧道：断电后一直几乎全黑，直到第三章结尾（击败迷途列车）电才回来 */
  if(M.back)return;
  if(!atmo){g.fillStyle='rgba(4,8,18,.5)';g.fillRect(0,0,W,H);return}
  darken(g,W,H,.95,lightList(r,p,ch,W,H),'rgb(2,4,10)');
  /* 潜伏者的眼睛：画在黑暗上面，所以黑暗里也看得见 */
  var sc=C.sc,cam=C.cam;
  r.enemies.forEach(function(e){if(e.dead||e.kind!=='lurker')return;var sx=(e.x+e.w/2-cam.x)*sc,sy=(e.y+e.h*.38-cam.y)*sc;if(sx<-40||sx>W+40||sy<-40||sy>H+40)return;
   var bl=e.cs==='crouch'?1.4:1,eo=sc*7*bl;g.save();g.globalAlpha=.85;g.fillStyle='#b8ffe6';ell(g,sx-eo,sy,3.4*sc,2.2*sc*(Math.sin(t*1.7+e.x)>.96?.2:1));g.fill();ell(g,sx+eo,sy,3.4*sc,2.2*sc*(Math.sin(t*1.7+e.x)>.96?.2:1));g.fill();glow(g,sx,sy,26*sc,'#7dffd0',.55);g.restore()});
  return}
 if(ch===4){ /* 驶向车头：信号越来越乱，隔一阵撕一次屏 */
  if(!atmo)return;
  var u=t%5.2,cv=g.canvas,dpr=cv.width/W;
  if(u>4.7||(u>2.3&&u<2.42)){var amt=u>4.7?1:.6,n=Math.round(3+amt*5);
   for(var j=0;j<n;j++){var sy=Math.random()*H,sh=6+Math.random()*34,off=(Math.random()-.5)*70*amt;try{g.drawImage(cv,0,sy*dpr,cv.width,sh*dpr,off,sy,W,sh)}catch(e){}}
   g.fillStyle='rgba(0,255,255,'+(.05*amt)+')';g.fillRect(0,0,W,H);g.fillStyle='rgba(255,0,200,'+(.04*amt)+')';g.fillRect(rnd(-20,20),0,W,H);
   g.fillStyle='rgba(255,255,255,.07)';for(var s=0;s<H;s+=4)g.fillRect(0,s,W,1)}
  return}}

/* ==================== 绘制：障碍物 ==================== */
var X={
 strap:function(g,o,t){var len=o.h,a=strapAng(o,t),ax=o.x+T/2,ay=o.y,bx=ax+Math.sin(a)*len,by=ay+Math.cos(a)*len;
  g.fillStyle='#8a97a3';g.fillRect(ax-14,ay-4,28,8);g.fillStyle='#5f6c78';g.fillRect(ax-14,ay+2,28,3);
  g.strokeStyle='#cfd6dc';g.lineWidth=2.5;g.beginPath();g.moveTo(ax,ay+4);g.lineTo(bx,by-14);g.stroke();
  g.fillStyle='#3a4a5a';g.beginPath();g.roundRect(bx-4,by-18,8,10,2);g.fill();
  g.strokeStyle='#f4f7fa';g.lineWidth=5;g.beginPath();g.arc(bx,by,11,0,6.283);g.stroke();g.strokeStyle='#9aa6b2';g.lineWidth=1.5;g.beginPath();g.arc(bx,by,13.5,0,6.283);g.stroke();
  g.fillStyle='rgba(255,90,90,.35)';ell(g,bx,by,6,6);g.fill()},
 autodoor:function(g,o,t){var open=o.open==null?.5:o.open,w=o.w,h=o.h,x=o.x,y=o.y,lw=(1-open)*w/2+4;
  g.fillStyle='#46525e';g.fillRect(x-4,y,6,h);g.fillRect(x+w-2,y,6,h);g.fillRect(x-4,y,w+8,8);
  var warn=o.warn||o.st==='closing';
  g.fillStyle=warn&&Math.sin(t*26)>0?'#ff4a3a':'#5a3a3a';ell(g,x+w/2,y+14,5,5);g.fill();if(warn)glow(g,x+w/2,y+14,34,'#ff4a3a',.6);
  [[x,lw],[x+w-lw,lw]].forEach(function(l){g.fillStyle='#bfd6e4';g.fillRect(l[0],y+22,l[1],h-22);g.fillStyle='rgba(120,190,220,.5)';g.fillRect(l[0]+3,y+30,Math.max(0,l[1]-6),h-60);g.fillStyle='#f4f7fa';g.fillRect(l[0],y+22,l[1],4)});
  g.fillStyle='#ffd23f';for(var i=0;i<h/16;i++){if(i%2)continue;g.fillRect(x-4,y+22+i*16,6,8)}},
 liveplate:function(g,o,t){var x=o.x,y=o.y+o.h-12,w=o.w;
  g.fillStyle='#2f3640';g.fillRect(x,y,w,12);g.fillStyle='#ffd23f';for(var i=0;i<w/16;i++){poly(g,[x+i*16,y+12,x+i*16+8,y+12,x+i*16+16,y,x+i*16+8,y]);g.fill()}
  if(o.act){for(var k=0;k<3;k++){g.strokeStyle=k?'#ffffff':'#7de8ff';g.lineWidth=k?1.5:3.5;g.globalAlpha=.9;g.beginPath();g.moveTo(x+2,y);for(var j=1;j<=8;j++)g.lineTo(x+j*w/8,y-6-Math.random()*20);g.stroke()}g.globalAlpha=1;glow(g,x+w/2,y-6,w*.8,'#7de8ff',.8)}
  else if(o.warn){g.globalAlpha=.4+Math.sin(t*40)*.4;g.fillStyle='#fff27a';g.fillRect(x,y-3,w,3);g.globalAlpha=1}},
 piston:function(g,o,t){var x=o.x,y=o.y,w=o.w,ext=o.ext||0,len=(o.p.len||8)*T;
  g.fillStyle='#4f5b67';g.fillRect(x-2,y-6,w+4,12);g.fillStyle='#2e3842';g.fillRect(x+w/2-7,y+4,14,ext+4);
  g.fillStyle='#8e9aa6';for(var i=0;i<ext/18;i++)g.fillRect(x+w/2-9,y+10+i*18,18,3);
  var hy=y+ext;g.fillStyle='#6a7683';g.beginPath();g.roundRect(x,hy,w,24,4);g.fill();g.fillStyle='#e0553a';g.fillRect(x+2,hy+14,w-4,8);
  g.fillStyle='#ffd23f';for(var j=0;j<w/12;j++)g.fillRect(x+3+j*12,hy+15,6,6);
  if(o.warn){var fy=y+len+24;g.fillStyle='rgba(255,80,60,'+(.25+Math.sin(t*34)*.18)+')';g.beginPath();g.ellipse(x+w/2,fy+2,w*.6,6,0,0,6.283);g.fill();g.strokeStyle='rgba(255,120,90,.55)';g.setLineDash([5,6]);g.beginPath();g.moveTo(x+w/2,y+ext+24);g.lineTo(x+w/2,fy);g.stroke();g.setLineDash([])}},
 thirdrail:function(g,o,t){var x=o.x,y=o.y+o.h-14,w=o.w;
  g.fillStyle='#2a323b';for(var i=0;i<w/32;i++)g.fillRect(x+i*32+10,y+6,12,8);
  g.fillStyle='#8fa3b3';g.fillRect(x,y+2,w,6);g.fillStyle='#c9d6e0';g.fillRect(x,y+2,w,2);
  g.strokeStyle='#8fe8ff';g.lineWidth=2;g.globalAlpha=.55+Math.sin(t*30+x)*.35;for(var j=0;j<w/16;j++){g.beginPath();g.moveTo(x+j*16+4,y+1);g.lineTo(x+j*16+9,y-6-Math.random()*6);g.lineTo(x+j*16+14,y+1);g.stroke()}g.globalAlpha=1;
  glow(g,x+w/2,y,w*.7,'#6bd6ff',.55)},
 scanner:function(g,o,t){var sx=o.x+T/2,h=o.h,rng=(o.p.dx||8)*T,x0=(o.x0!=null?o.x0:o.x)+T/2;
  g.strokeStyle='rgba(109,255,255,.22)';g.lineWidth=2;g.setLineDash([4,6]);g.beginPath();g.moveTo(x0,o.y+h);g.lineTo(x0+rng,o.y+h);g.stroke();g.setLineDash([]);
  var gr=g.createLinearGradient(sx-9,0,sx+9,0);gr.addColorStop(0,'rgba(109,255,255,0)');gr.addColorStop(.5,'rgba(190,255,255,.85)');gr.addColorStop(1,'rgba(109,255,255,0)');g.fillStyle=gr;g.fillRect(sx-9,o.y,18,h);
  g.fillStyle='rgba(255,255,255,.5)';for(var i=0;i<h/6;i++){if((i+Math.floor(t*14))%2)g.fillRect(sx-9,o.y+i*6,18,2)}
  g.fillStyle='#2a3a4a';g.fillRect(sx-8,o.y-6,16,8);g.fillStyle='#6dffff';g.fillRect(sx-4,o.y-4,8,3);glow(g,sx,o.y+h/2,70,'#6dffff',.5)}
};
var _thing=G.thing;
G.thing=function(g,o,t,biome,lvlH){var f=X[o.kind];if(f){if(!o.p)o.p={}; /* 关卡工坊画的物件没有 p（道具参数），补一个空的 */g.save();f(g,o,t);g.restore()}else _thing.apply(this,arguments)};

/* ==================== 绘制：怪物 ==================== */
function person(g,body,head,hair,lean,legPh,armUp){ /* 小人：身体 / 头 / 头发 */
 g.save();g.rotate(lean);
 g.fillStyle='#232b36';g.fillRect(-6,-18+Math.sin(legPh)*3,5,18);g.fillRect(1,-18-Math.sin(legPh)*3,5,18);
 g.fillStyle=body;g.beginPath();g.roundRect(-10,-46,20,30,5);g.fill();
 g.fillStyle=head;ell(g,0,-53,8,8.5);g.fill();g.fillStyle=hair;g.beginPath();g.arc(0,-55,8.6,Math.PI,0);g.fill();
 g.restore()}
var E={
 commuter:function(g,e,t){var cx=e.x+e.w/2,by=e.y+e.h,cs=e.cs||'wait',run=cs==='rush',fl=e.flash>0;g.translate(cx,by);g.scale(e.face||1,1);
  var lean=run?.35:cs==='wind'?-.25:cs==='tired'?.4:0,ph=run?t*26:t*3;
  person(g,fl?'#fff':'#4a5f86',fl?'#fff':'#f0c9a0','#2b2230',lean,ph);
  g.fillStyle='#d33';g.fillRect(-1.5,-44,3,12);
  g.fillStyle='#7a5a3a';g.beginPath();g.roundRect(8,-30+(run?Math.sin(t*26)*3:0),12,9,2);g.fill();g.fillStyle='#4a3a28';g.fillRect(12,-32+(run?Math.sin(t*26)*3:0),4,3);
  if(cs==='wait'){g.fillStyle='#f0c9a0';g.fillRect(6,-44,6,4);g.fillStyle='#e8eef4';ell(g,12,-44,3,3);g.fill()}
  if(cs==='wind'){g.fillStyle='#ff4a3a';g.font='bold 22px sans-serif';g.textAlign='center';g.fillText('!',0,-68)}
  if(run){g.strokeStyle='rgba(255,255,255,.55)';g.lineWidth=2;for(var i=0;i<3;i++){g.beginPath();g.moveTo(-18-i*10,-14-i*12);g.lineTo(-34-i*10,-14-i*12);g.stroke()}}
  if(cs==='tired'){g.fillStyle='#8fd0ff';ell(g,-10,-62+Math.sin(t*8)*2,2,3);g.fill()}},
 luggage:function(g,e,t){var cx=e.x+e.w/2,by=e.y+e.h,fl=e.flash>0,sp=Math.abs(e.vx||0);g.translate(cx,by);g.scale(e.face||1,1);
  g.fillStyle=fl?'#fff':'#c98a4a';g.beginPath();g.roundRect(-26,-26,52,22,5);g.fill();g.fillStyle='#a06c34';g.fillRect(-26,-17,52,3);g.fillStyle='#6a4520';g.fillRect(-14,-26,4,22);g.fillRect(10,-26,4,22);
  g.fillStyle='#e8c070';g.fillRect(-4,-18,8,6);g.strokeStyle='#4a3a28';g.lineWidth=3;g.beginPath();g.moveTo(-12,-26);g.lineTo(-12,-34);g.lineTo(12,-34);g.lineTo(12,-26);g.stroke();
  [-16,16].forEach(function(wx){g.fillStyle='#22282f';ell(g,wx,-4,5.5,5.5);g.fill();g.strokeStyle='#8a97a3';g.lineWidth=1.5;g.beginPath();g.moveTo(wx,-4);g.lineTo(wx+Math.cos(e.spin||0)*5,-4+Math.sin(e.spin||0)*5);g.stroke()});
  g.fillStyle='#ff7a5a';ell(g,18,-20,3,3);g.fill();g.fillStyle='#fff';ell(g,19,-21,1,1);g.fill();
  if(sp>110){g.strokeStyle='rgba(255,255,255,.5)';g.lineWidth=2;for(var i=0;i<3;i++){g.beginPath();g.moveTo(-32-i*8,-8-i*7);g.lineTo(-48-i*8,-8-i*7);g.stroke()}}},
 sparkbug:function(g,e,t){var cx=e.x+e.w/2,cy=e.y+e.h/2,fl=e.flash>0,ex=e.excited;g.translate(cx,cy+Math.sin(t*9+e.x)*2);g.scale(e.face||1,1);
  var w=Math.sin(t*60)*.5+.5;g.fillStyle='rgba(200,240,255,.6)';ell(g,-6,-9,9*w+3,3);g.fill();ell(g,6,-9,9*(1-w)+3,3);g.fill();
  g.strokeStyle='#fff6a0';g.lineWidth=1.6;g.beginPath();g.moveTo(-8,5);g.lineTo(-12,10);g.moveTo(0,7);g.lineTo(0,12);g.moveTo(8,5);g.lineTo(12,10);g.stroke();
  g.fillStyle=fl?'#fff':(ex?'#ff9a3a':'#ffe45a');ell(g,0,0,11,9);g.fill();g.fillStyle='#fff';ell(g,-2,-3,5,3);g.fill();
  g.fillStyle='#2b2230';ell(g,5,-1,2.2,2.6);g.fill();g.strokeStyle='#ffe45a';g.lineWidth=1.4;g.beginPath();g.moveTo(5,-8);g.lineTo(9,-14);g.moveTo(8,-6);g.lineTo(14,-10);g.stroke();
  glow(g,0,0,ex?60:36,ex?'#ff9a3a':'#ffe45a',ex?.8:.5)},
 breaker:function(g,e,t){var cx=e.x+e.w/2,by=e.y+e.h,w=e.w,h=e.h,fl=e.flash>0,ch=e.cs==='charge';g.translate(cx,by);
  if(ch)g.translate(Math.sin(t*70)*1.6,0);
  g.fillStyle='#38424d';g.fillRect(-w*.46,-4,w*.92,4);g.fillStyle=fl?'#fff':'#7a8794';g.beginPath();g.roundRect(-w*.44,-h+4,w*.88,h-8,6);g.fill();
  g.fillStyle='#5f6b77';g.fillRect(-w*.44,-h+4,w*.88,8);
  g.fillStyle='#ffd23f';for(var i=0;i<5;i++){poly(g,[-w*.4+i*13,-6,-w*.4+i*13+7,-6,-w*.4+i*13+14,-16,-w*.4+i*13+7,-16]);g.fill()}
  g.fillStyle=ch?'#ff4a3a':'#3affc0';ell(g,-14,-h*.7,5,5);g.fill();ell(g,14,-h*.7,5,5);g.fill();
  g.fillStyle='#22282f';g.fillRect(-4,-h*.62,8,26);g.fillStyle='#e0553a';ell(g,0,ch?-h*.62+20:-h*.62+2,6,6);g.fill();
  g.fillStyle='#ffd23f';poly(g,[0,-h+8,-6,-h+20,6,-h+20]);g.fill();
  if(ch){glow(g,0,-h/2,70,'#fff27a',.7)}},
 lurker:function(g,e,t){var cx=e.x+e.w/2,by=e.y+e.h,w=e.w,fl=e.flash>0,cr=e.cs==='crouch';g.translate(cx,by);g.scale(e.face||1,1);if(cr)g.scale(1.15,.8);
  g.globalAlpha=Math.max(.55,e.alpha==null?.8:e.alpha);
  g.fillStyle=fl?'#fff':'#0f1c24';g.beginPath();g.moveTo(-w*.46,0);g.bezierCurveTo(-w*.5,-w*.7,-w*.2,-w*.95,0,-w*.9);g.bezierCurveTo(w*.25,-w*.95,w*.5,-w*.7,w*.46,0);g.closePath();g.fill();
  g.strokeStyle='#16303c';g.lineWidth=3;g.lineCap='round';for(var i=-1;i<=1;i+=2){g.beginPath();g.moveTo(i*w*.38,-w*.3);g.lineTo(i*w*.55,-w*.1+Math.sin(t*3+i)*3);g.lineTo(i*w*.62,0);g.stroke()}
  g.fillStyle='#b8ffe6';ell(g,-9,-w*.55,4.2,Math.sin(t*1.7+e.x)>.96?.8:3);g.fill();ell(g,9,-w*.55,4.2,Math.sin(t*1.7+e.x)>.96?.8:3);g.fill();glow(g,0,-w*.55,34,'#7dffd0',.45)},
 dripper:function(g,e,t){var cx=e.x+e.w/2,top=e.y,sw=e.swell||0,fl=e.flash>0;g.translate(cx,top);
  g.fillStyle='#4a5864';g.fillRect(-9,-2,18,8);g.fillStyle='#8fd0ff';g.globalAlpha=.9;
  g.beginPath();g.moveTo(-8,5);g.bezierCurveTo(-12,14+sw*4,-10,22+sw*8,0,26+sw*10);g.bezierCurveTo(10,22+sw*8,12,14+sw*4,8,5);g.closePath();g.fillStyle=fl?'#fff':'#7cc4ee';g.fill();
  g.fillStyle='rgba(255,255,255,.55)';ell(g,-3,12,2,4);g.fill();g.fillStyle='#14384f';ell(g,-3,15,1.6,2.2);g.fill();ell(g,3,15,1.6,2.2);g.fill();g.globalAlpha=1},
 ticketer:function(g,e,t){var cx=e.x+e.w/2,by=e.y+e.h,fl=e.flash>0,wd=e.cs==='wind';g.translate(cx,by);g.scale(e.face||1,1);
  person(g,fl?'#fff':'#2f4a6a',fl?'#fff':'#f0c9a0','#3a2a1a',0,t*(wd?0:5));
  g.fillStyle='#f4f7fa';g.fillRect(-10,-46,20,3);g.fillStyle='#ffd23f';g.fillRect(-1,-46,2,30);g.fillRect(-6,-40,3,3);g.fillRect(3,-40,3,3);
  g.fillStyle='#22405f';g.beginPath();g.roundRect(-9,-65,18,7,2);g.fill();g.fillStyle='#ffd23f';g.fillRect(-3,-63,6,3);g.fillStyle='#22405f';g.fillRect(-4,-60,14,3);
  var ay=wd?-60:-34;g.strokeStyle='#2f4a6a';g.lineWidth=5;g.lineCap='round';g.beginPath();g.moveTo(8,-42);g.lineTo(wd?18:15,ay);g.stroke();
  g.fillStyle='#f3d9a4';g.beginPath();g.roundRect(wd?14:11,ay-6,12,8,1);g.fill();g.fillStyle='#c8873a';g.fillRect(wd?16:13,ay-4,8,2);
  if(wd)glow(g,18,ay-2,24,'#f3d9a4',.6)},
 glitch:function(g,e,t){var cx=e.x+e.w/2,cy=e.y+e.h/2,ph=e.phased,fl=e.flash>0;g.translate(cx,cy);
  var cols=['#6dffff','#ff6dff','#ffffff','#6dff9a'];g.globalAlpha=ph?.22:.9;
  for(var i=0;i<9;i++){var gx=(i%3-1)*15+Math.sin(t*23+i*5)*(ph?10:4),gy=(Math.floor(i/3)-1)*15+Math.cos(t*19+i*3)*(ph?10:4),s=11+((i*7)%3)*3;g.fillStyle=fl?'#fff':cols[(i+Math.floor(t*9))%4];g.fillRect(gx-s/2,gy-s/2,s,s)}
  g.globalAlpha=1;g.fillStyle='#0a1422';g.fillRect(-9,-8,6,8);g.fillRect(3,-8,6,8);g.fillStyle='#fff';g.fillRect(-8,-6,3,3);g.fillRect(4,-6,3,3);
  g.fillStyle='rgba(0,0,0,.5)';for(var j=0;j<6;j++){if(Math.sin(t*30+j*2)>.2)g.fillRect(-26,-26+j*9,52,2)}
  if(!ph)glow(g,0,0,44,'#6dffff',.4)}
};
var _enemy=G.enemy;
G.enemy=function(g,e,t,biome){var f=E[e.kind];if(f){g.save();f(g,e,t);g.restore()}else _enemy.apply(this,arguments)};

/* ==================== Boss「迷途列车」的行为 ====================
   三个阶段，每一招都有预兆，冲撞之后一定会撞墙过热（趴窝 = 输出窗口），不再无缝连冲：
     冲撞   车灯扫出红色车道 → 汽笛音调一路拉高 → 冲过去 → 撞墙，落石 + 过热趴窝
     汽笛   多普勒震波：三道地面冲击波，先慢后快，最后会叠在一起到你脚下
     放电   受电弓引雷：脚下和场地里同时落下电柱
     脱钩   第二阶段起：把车厢甩出去，低的要跳，高的别跳（第三阶段先低后高连发）
     过站不停  第三阶段：冲到一半急刹，立刻掉头反冲（假动作），然后才过热 */
var TA=[['charge','whistle','arc'],['charge','whistle','arc','uncouple'],['charge','express','uncouple','arc','whistle']];
var TW={charge:.95,express:.9,whistle:.7,arc:.6,uncouple:.85};
function floorBelow(x,y){var R=C.R,cx=Math.floor(x/T),cy=Math.max(0,Math.floor(y/T));for(var j=cy;j<R.ch;j++)if(C.isSolid(C.cellAt(cx,j)))return j*T;return R.h}
function strike(x,y,t){C.R.warns.push({x:x-28,w:56,y:floorBelow(x,y),t:t,max:t,kind:'pillar'})}
function later(b,t,f){(b.q=b.q||[]).push({t:t,f:f})}
function trainShoot(b,vx,y,o){var nx=b.face>0?b.x+b.w:b.x;C.shoot(nx,y,vx,0,o);return C.R.proj[C.R.proj.length-1]}
function trainAtk(b,fy,minX,maxX){var ph=b.phase,p=C.P,pcx=p.x+p.w/2,pcy=p.y+p.h/2,i,col='#ffd27a';b.state='atk';
 if(b.atk==='charge'||b.atk==='express'){b.vx=b.face*(430+ph*70);b.timer=2.8;b.combo=b.atk==='express'&&!b.rev?1:0;sfx('dash')}
 else if(b.atk==='whistle'){var sp=[170,250,350,430].slice(0,3+(ph>1?1:0));b.horn=1;sfx('roar');C.shake(6);
  sp.forEach(function(v,k){later(b,k*.26,function(){sfx('shoot');C.emit(b.face>0?b.x+b.w:b.x,fy-14,col,10,200,.4);trainShoot(b,b.face*v,fy-14,{wave:true,pierce:true,deflect:false,r:12,col:col,life:3.6})})});b.timer=1.1}
 else if(b.atk==='arc'){var n=3+ph,wt=1.05-ph*.1;b.arcT=wt+.4;sfx('boom');strike(pcx,pcy,wt);
  for(i=1;i<n;i++){(function(k){var x=minX+Math.random()*(maxX+b.w-minX);later(b,k*.14,function(){strike(x,Math.random()<.5?pcy:fy-T,wt)})})(i)}b.timer=.9}
 else if(b.atk==='uncouple'){var seq=ph>1?[0,1]:[0];b.hitch=1;sfx('switch');
  seq.forEach(function(hi,k){later(b,k*.7,function(){sfx('shoot');C.shake(4);C.emit(b.face>0?b.x:b.x+b.w,fy-40,col,12,160,.4);var q=trainShoot(b,b.face*(hi?340:290),hi?fy-106:fy-34,{pierce:true,deflect:false,r:20,col:col,life:3.6});q.car=b.face;q.hi=hi})});b.timer=.7*seq.length+.3}}
function trainCrash(b,fy){var ph=b.phase;sfx('boom');C.shake(14);C.hitstop(.05);C.emit(b.face>0?b.x+b.w:b.x,fy-40,'#ffd27a',30,340,.7);C.emit(b.x+b.w/2,fy-b.h,'#c0c8d0',16,200,.7);
 for(var i=0;i<3+ph;i++){var t=.8+i*.1;C.R.warns.push({x:C.P.x+(Math.random()-.5)*520,w:56,y:floorBelow(C.P.x,C.P.y),t:t,max:t,kind:'drop'})}
 b.state='stun';b.timer=2-ph*.25;b.vx=0;b.combo=0;b.rev=false;C.toast('撞墙过热——趁现在！',1100)}
function bossStep(b,dt){
 var r=C.R,p=C.P,ph=b.phase,pcx=p.x+p.w/2,bcx=b.x+b.w/2,fy=b.hy+b.h,minX=b.p&&b.p.left!=null?b.p.left*T:T,maxX=r.w-T-b.w,i;
 b.ht=(b.ht||0)+dt;b.horn=Math.max(0,(b.horn||0)-dt*1.4);b.arcT=Math.max(0,(b.arcT||0)-dt);b.hitch=Math.max(0,(b.hitch||0)-dt*1.2);
 if(b.lastPh==null)b.lastPh=0;
 if(ph!==b.lastPh){b.lastPh=ph;b.q=[];b.vx=0;b.state='recover';b.timer=1.3;b.rev=false;sfx('roar');sfx('horn');C.shake(12);C.flash(.35);C.emit(bcx,b.y+b.h*.4,ph>1?'#ff7a2a':'#ffd27a',40,360,.8);C.toast(ph===1?'迷途列车：车厢开始脱钩！':'迷途列车：过站不停——！',2200)}
 if(b.q&&b.q.length)for(i=b.q.length-1;i>=0;i--){b.q[i].t-=dt;if(b.q[i].t<=0){var f=b.q[i].f;b.q.splice(i,1);f()}}
 switch(b.state){
 case'idle':b.timer-=dt*(1+ph*.25);var d=pcx-bcx;if(Math.abs(d)>240)b.x+=Math.sign(d)*70*dt;b.x=clamp(b.x,minX,maxX);
  if(b.timer<=0){var list=TA[ph],a=list[Math.floor(Math.random()*list.length)];if(a===b.lastAtk)a=list[(list.indexOf(a)+1)%list.length];b.lastAtk=b.atk=a;b.state='wind';b.timer=b.wt=TW[a]-ph*.08;b.rev=false;sfx(a==='charge'||a==='express'?'horn':'switch')}break;
 case'wind':b.timer-=dt;
  if(b.atk==='charge'||b.atk==='express'){b.lane=b.face>0?maxX-b.x+b.w*.5:b.x-minX+b.w*.5;b.hornT=(b.hornT||0)-dt;if(b.hornT<=0){b.hornT=.46-.28*(1-b.timer/(b.wt||1));sfx('hornS')}} /* 汽笛一声比一声急 */
  if(b.timer<=0)trainAtk(b,fy,minX,maxX);break;
 case'atk':b.timer-=dt;
  if(b.atk==='charge'||b.atk==='express'){b.x+=b.vx*dt;if(Math.random()<.7)C.emit(b.vx>0?b.x:b.x+b.w,fy-6,'#ffd27a',2,110,.4);if(Math.random()<.5)C.emit(b.x+Math.random()*b.w,fy-2,'#fff6a0',1,60,.3);
   if(b.x<=minX||b.x>=maxX||b.timer<=0){b.x=clamp(b.x,minX,maxX);
    if(b.combo&&!b.rev){ /* 过站不停：急刹 → 掉头 */
     b.rev=true;b.vx=0;b.face=-b.face;b.state='wind';b.atk='express';b.timer=b.wt=.5;sfx('boom');sfx('horn');C.shake(6);C.emit(b.x+b.w/2,fy-4,'#fff6a0',20,260,.5)}
    else trainCrash(b,fy)}}
  else if(b.timer<=0){b.state='recover';b.timer=1-ph*.15}break;
 case'stun':b.timer-=dt;if(Math.random()<.5)C.emit(b.x+b.w*(.2+Math.random()*.5),b.y+b.h*.1,'#dfe6ec',1,50,.8,-60);if(b.timer<=0){b.state='idle';b.timer=.9-ph*.15}break;
 case'recover':b.timer-=dt;if(b.timer<=0){b.state='idle';b.timer=1.1-ph*.2}break}
}
/* 被甩出去的车厢（弹幕的画法） */
G.drawCar=function(g,q,t){var f=q.car||1;g.save();g.translate(q.x,q.y);g.scale(f,1);
 glow(g,0,0,70,'#ffd27a',.35);
 g.fillStyle='#c9d2da';g.beginPath();g.roundRect(-34,-17,68,32,5);g.fill();g.fillStyle='#26384f';g.fillRect(-34,2,68,9);g.fillStyle='#ffb73a';g.fillRect(-34,-1,68,3);
 g.fillStyle='#10202e';for(var i=0;i<3;i++)g.fillRect(-28+i*20,-12,14,11);
 g.fillStyle='rgba(180,240,255,.5)';for(var j=0;j<3;j++){ell(g,-21+j*20,-6,3,3);g.fill()}
 g.fillStyle='#1a222b';ell(g,-20,16,6,6);g.fill();ell(g,20,16,6,6);g.fill();
 g.strokeStyle='rgba(255,230,140,.6)';g.lineWidth=2;for(var k=0;k<3;k++){g.beginPath();g.moveTo(-40-k*10,-8+k*8);g.lineTo(-64-k*10,-8+k*8);g.stroke()}
 g.restore()};

/* ==================== 绘制：Boss「迷途列车」 ==================== */
function drawTrain(g,b,t){
 var w=b.w,h=b.h,fl=b.flash>0,face=b.face||1,ph=b.phase||0,st=b.state,wind=st==='wind',atk=st==='atk'?b.atk:'',chg=atk==='charge'||atk==='express',stun=st==='stun',
  lane=wind&&(b.atk==='charge'||b.atk==='express'),pul=.5+.5*Math.sin(t*(lane?30:12));
 g.save();g.translate(b.x+w/2,b.y+h);g.scale(face,1);
 /* 冲撞车道：红色警戒带一直铺到墙边，越临近越闪 */
 if(lane){var L=b.lane||600,k=1-(b.timer||0)/(b.wt||1),lg=g.createLinearGradient(w*.5,0,w*.5+L,0);lg.addColorStop(0,'rgba(255,60,40,'+((.2+k*.3)*pul)+')');lg.addColorStop(1,'rgba(255,60,40,.04)');
  g.fillStyle=lg;g.fillRect(w*.5,-26,L,26);g.fillStyle='rgba(255,210,120,'+(.25+k*.4)+')';for(var s=0;s<L;s+=44)g.fillRect(w*.5+(s+(t*260)%44)%L,-3,22,3)}
 var lean=wind?-10:0,hov=chg||stun?0:Math.sin(t*3)*3;g.translate(lean+(stun?Math.sin(t*50)*1.4:0),hov);
 /* 车灯光柱：蓄力时亮起，冲刺时拉满；过热时熄灭 */
 if(!stun&&(wind||chg)){var bl=chg?520:260,gr=g.createLinearGradient(w*.5,0,w*.5+bl,0);gr.addColorStop(0,'rgba(255,240,170,.55)');gr.addColorStop(1,'rgba(255,240,170,0)');g.fillStyle=gr;g.beginPath();g.moveTo(w*.48,-h*.42);g.lineTo(w*.5+bl,-h*.42-bl*.28);g.lineTo(w*.5+bl,-h*.42+bl*.28);g.lineTo(w*.48,-h*.3);g.closePath();g.fill()}
 /* 受电弓：放电时一道雷直通隧道顶 */
 g.strokeStyle='#8a97a3';g.lineWidth=4;g.beginPath();g.moveTo(-w*.1,-h*.88);g.lineTo(-w*.02,-h*1.06);g.lineTo(w*.1,-h*.88);g.moveTo(-w*.06,-h*1.06);g.lineTo(w*.06,-h*1.06);g.stroke();
 var arcing=(b.arcT||0)>0||(wind&&b.atk==='arc');
 g.strokeStyle=arcing?'#ffffff':'#8fe8ff';g.lineWidth=arcing?3:2;g.globalAlpha=arcing?.9:.5+Math.sin(t*40)*.4;g.beginPath();g.moveTo(-w*.06,-h*1.06);
 if(arcing){var yy=-h*1.06;for(var z=0;z<7;z++){yy-=34;g.lineTo(-w*.02+(Math.random()-.5)*34,yy)}}else g.lineTo(-w*.02,-h*1.16+Math.random()*8);
 g.lineTo(w*.06,-h*1.06);g.stroke();g.globalAlpha=1;if(arcing)glow(g,-w*.02,-h*1.1,90,'#8fe8ff',.8);
 /* 车身：上亮下脏的金属漆 + 铆钉 + 车厢接缝 */
 var bg=g.createLinearGradient(0,-h*.9,0,-h*.14);bg.addColorStop(0,'#f1f5f8');bg.addColorStop(.55,'#cfd8e0');bg.addColorStop(1,'#8e9ba7');
 g.fillStyle=fl?'#fff':bg;g.beginPath();g.moveTo(-w*.5,-h*.14);g.lineTo(-w*.5,-h*.82);g.quadraticCurveTo(-w*.5,-h*.9,-w*.42,-h*.9);g.lineTo(w*.2,-h*.9);g.quadraticCurveTo(w*.42,-h*.86,w*.52,-h*.5);g.lineTo(w*.52,-h*.14);g.closePath();g.fill();
 if(!fl){g.fillStyle='rgba(60,40,20,'+(.12+ph*.08)+')';g.fillRect(-w*.5,-h*.3,w*1.02,h*.16); /* 锈渍和油污，越打越惨 */
  g.strokeStyle='rgba(40,50,60,.35)';g.lineWidth=1.2;[-.2,.08].forEach(function(sx){g.beginPath();g.moveTo(w*sx,-h*.88);g.lineTo(w*sx,-h*.14);g.stroke()});
  g.fillStyle='rgba(80,90,100,.7)';for(var rv=-.46;rv<.5;rv+=.075){ell(g,w*rv,-h*.87,1.6,1.6);g.fill();ell(g,w*rv,-h*.17,1.6,1.6);g.fill()}
  g.strokeStyle='rgba(30,36,44,.4)';g.lineWidth=1;for(var sc=0;sc<5;sc++){var sx0=-w*.42+sc*w*.19;g.beginPath();g.moveTo(sx0,-h*.5-sc%2*8);g.lineTo(sx0+14,-h*.46-sc%2*8);g.stroke()}
  if(ph>=1){g.strokeStyle='#2a2f36';g.lineWidth=2;g.beginPath();g.moveTo(-w*.3,-h*.9);g.lineTo(-w*.27,-h*.8);g.lineTo(-w*.32,-h*.72);g.lineTo(-w*.28,-h*.62);g.stroke()}
  if(ph>=2){g.strokeStyle='rgba(255,120,40,'+(.55+Math.sin(t*9)*.3)+')';g.lineWidth=2.5;g.beginPath();g.moveTo(w*.05,-h*.86);g.lineTo(w*.1,-h*.74);g.lineTo(w*.04,-h*.64);g.lineTo(w*.1,-h*.52);g.stroke();glow(g,w*.08,-h*.7,60,'#ff7a2a',.35)}}
 g.fillStyle=fl?'#fff':'#26384f';g.fillRect(-w*.5,-h*.34,w*1.02,h*.2);
 g.fillStyle=fl?'#fff':'#ffb73a';g.fillRect(-w*.5,-h*.4,w*1.02,h*.05);
 /* 车窗：被遗忘的乘客，偶尔有一只手按在玻璃上 */
 g.fillStyle='#10202e';for(var i=0;i<3;i++){g.beginPath();g.roundRect(-w*.44+i*w*.19,-h*.78,w*.15,h*.3,5);g.fill()}
 for(var j=0;j<3;j++){var wx=-w*.44+j*w*.19+w*.075;g.fillStyle='rgba(180,240,255,.55)';ell(g,wx,-h*.62,5,5);g.fill();g.fillRect(wx-6,-h*.58,12,h*.08);
  if(Math.sin(t*.9+j*2.1)>.55){g.fillStyle='rgba(200,245,255,.5)';g.fillRect(wx+7,-h*.7+Math.sin(t*3+j)*2,4,12)}}
 /* 车头：挡风玻璃是一张脸；过热时眼睛暗下去，第三阶段眼睛烧橙 */
 g.fillStyle='#10202e';g.beginPath();g.moveTo(w*.22,-h*.84);g.lineTo(w*.46,-h*.74);g.lineTo(w*.5,-h*.46);g.lineTo(w*.22,-h*.46);g.closePath();g.fill();
 var ey=stun?'#5c6b78':wind?'#ff4a3a':chg?'#fff27a':ph>1?'#ff8a2a':'#ffd23f';g.fillStyle=ey;poly(g,[w*.26,-h*.7,w*.34,-h*.74,w*.34,-h*.6,w*.26,-h*.58]);g.fill();poly(g,[w*.4,-h*.68,w*.47,-h*.62,w*.46,-h*.54,w*.4,-h*.58]);g.fill();
 g.fillStyle='#eaf1f6';g.fillRect(w*.26,-h*.5,w*.22,3);
 /* 排障器（牛角）和大灯 */
 g.fillStyle=fl?'#fff':'#59636e';g.beginPath();g.moveTo(w*.5,-h*.16);g.lineTo(w*.62,-h*.04);g.lineTo(w*.5,-h*.04);g.closePath();g.fill();g.fillStyle='#ffb73a';g.fillRect(w*.5,-h*.1,w*.05,3);
 if(!stun){g.fillStyle=ey;ell(g,w*.5,-h*.3,9,9);g.fill();glow(g,w*.5,-h*.3,chg?120:70+(b.horn||0)*60,ey,chg?.9:.6)}else{g.fillStyle='#3a4650';ell(g,w*.5,-h*.3,9,9);g.fill()}
 /* 目的地牌：字在乱码 */
 g.fillStyle='#10202e';g.beginPath();g.roundRect(-w*.14,-h*.5,w*.3,h*.1,3);g.fill();g.save();g.scale(face,1);g.fillStyle=ph>1?'#ff8a2a':'#ffd23f';g.font='bold '+Math.round(h*.085)+'px sans-serif';g.textAlign='center';
 g.fillText(Math.sin(t*7)>.85?'#@%?':ph>1?'无站':'迷途',face*w*.01,-h*.425);g.restore();
 /* 汽笛：声波圈 */
 if((b.horn||0)>0){g.strokeStyle='rgba(255,226,122,'+b.horn*.7+')';g.lineWidth=3;for(var rg=0;rg<3;rg++){var rr=(1-b.horn)*220+rg*34;g.beginPath();g.arc(w*.1,-h*.95,rr,-1.2,1.2);g.stroke()}}
 /* 车钩：脱钩前亮黄 */
 if((b.hitch||0)>0)glow(g,-w*.52,-h*.2,70,'#ffd23f',b.hitch*.8);
 /* 转向架和车轮 */
 [-w*.34,-w*.12,w*.12,w*.34].forEach(function(wx){g.fillStyle='#1a222b';ell(g,wx,-h*.08,h*.1,h*.1);g.fill();g.strokeStyle='#8a97a3';g.lineWidth=3;var a=t*(chg?30:3);g.beginPath();g.moveTo(wx,-h*.08);g.lineTo(wx+Math.cos(a)*h*.08,-h*.08+Math.sin(a)*h*.08);g.stroke()});
 if(chg){g.fillStyle='#ffe27a';for(var k2=0;k2<5;k2++){ell(g,-w*.2+Math.random()*w*.6,-2+Math.random()*4,2.5,2.5);g.fill()}}
 /* 过热：车顶冒蒸汽 */
 if(stun){for(var sp=0;sp<5;sp++){var ag=(t*1.1+sp/5)%1;g.fillStyle='rgba(235,240,245,'+(1-ag)*.55+')';ell(g,-w*.34+sp*w*.17,-h*.9-ag*70,9+ag*16,9+ag*16);g.fill()}glow(g,w*.3,-h*.55,60,'#ff6a3a',.25)}
 g.restore()}
var _boss=G.boss;
G.boss=function(g,b,t){if(b.type==='train')drawTrain(g,b,t);else _boss.apply(this,arguments)};

return {attach:attach,build:build,initEnemy:initEnemy,update:update,bossStep:bossStep,drawWorld:drawWorld,drawScreen:drawScreen,get lightsOn(){return M.on}};
})();
