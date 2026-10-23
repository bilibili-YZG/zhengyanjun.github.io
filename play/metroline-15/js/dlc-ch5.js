/* 第五章「黎明的曙光」玩法扩展（CH5X）：室外夕阳的校园。
   由 dlc-engine.js 在 build / initEnemy / update / drawWorld / drawScreen 里调用，game.js 在 updateBoss / hitBoss / 镜头 / 音乐处调用 Boss 部分。

   新怪物（4）：
     纸飞机怪    悬在半空，瞄你一眼，折身一头扎过来；扎空了就慢慢飘回去
     失控的篮球  满场乱蹦。挥教鞭能把它「打」出去：被打飞的球会撞倒路上的怪、敲响放学铃
     值日扫帚    抬起扫帚一扫，地面卷起一道尘浪（可以跳过，也可以挥鞭拍散）
     夕阳的影子  拖得很长的影子，会照着你 1.2 秒前走过的路追上来；挥鞭可以斩断
   新障碍 / 机关：
     电动车道    放学高峰：车灯在路口闪几下，一辆电动车贴地冲过整条车道
     放学铃      挥鞭敲响，铃声会让「值日闸」打开 6 秒；也可以把篮球打过去敲
     纸飞机      拾取后 8 秒内，空中按住跳跃可以滑翔
   Boss「倦怠骑士」：见文件后半部分 */
window.CH5X=(function(){
var C=null,T=32,G=window.GFX;
function attach(core){C=core;T=core.T}
function rnd(a,b){return a+Math.random()*(b-a)}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function sfx(n){if(window.AudioFX)AudioFX.sfx(n)}
function ov(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function cnt(n,v){var m=C&&C.meta&&C.meta();if(m&&m.cnt)m.cnt(n,v)}
var PCOL=['#fff1c8','#ffd27a','#ffb35a','#ff8a5a','#ffffff'];
function paper(x,y,n){for(var i=0;i<n;i++)C.emit(x+rnd(-8,8),y+rnd(-8,8),pick(PCOL),1,rnd(70,220),rnd(.5,1),rnd(-140,40))}
function slashRect(p){return p.atk>.03&&p.atk<.2?{x:p.face>0?p.x+p.w-2:p.x-54,y:p.y-4,w:56,h:p.h+4}:null}

/* ==================== 构建 ==================== */
var ENEMIES=['paperplane','hoop','broom','shadow'];
function build(r,d,kind,gs){
 if(kind==='glider'){d.got=false;(r.c5p=r.c5p||[]).push(d);r.xthings.push(d);return true}
 if(kind==='bell'){d.solved=false;d.rt=0;d.ring=0;d.hitSw=-1;(r.c5b=r.c5b||[]).push(d);r.xthings.push(d);return true}
 if(kind==='ebike'){d.x0=d.x;d.warn=false;d.rush=false;d.bx=-999;d.beeped=false;(r.c5h=r.c5h||[]).push(d);r.xthings.push(d);return true}
 return false}
function initEnemy(e,d){var k=e.kind,rng=(d.p.range||5)*T;
 if(ENEMIES.indexOf(k)<0)return;
 e.cs='idle';e.timer=1+Math.random()*1.4;e.min=d.x-rng/2;e.max=d.x+rng/2;e.vx=0;e.air=false;
 if(k==='paperplane'){e.hp=d.p.hp||1;e.ax=-1;e.ay=0;e.ang=Math.PI}
 else if(k==='hoop'){e.hp=999;e.vx=(Math.random()<.5?-1:1)*110;e.vy=0;e.spin=0;e.swingHit=-1;e.min=d.x-(d.p.range||5)*T/2;e.max=d.x+(d.p.range||5)*T/2;e.alpha=1}
 else if(k==='broom'){e.hp=d.p.hp||3;e.face=-1}
 else if(k==='shadow'){e.hp=d.p.hp||1;e.cs='sleep';e.alpha=.55;e.tx=null}}

/* ==================== 怪物 AI ==================== */
function stepX(e,dx){var nx=e.x+dx,ahead=dx>0?nx+e.w+2:nx-2;if(!C.groundAt(ahead,e.y+e.h+4)||C.solidAt(ahead,e.y+e.h-6))return false;e.x=nx;return true}
function histAt(r,t){var h=r.c5hist||[],i;for(i=h.length-1;i>=0;i--)if(h[i].t<=t)return h[i];return null}
var AI={
 /* 纸飞机怪：悬着晃，瞄准的一瞬间机头会指向你；扎过来的方向一旦锁定就不会拐弯 */
 paperplane:function(e,dt,c){
  if(e.cs==='idle'){e.x+=(e.hx+Math.sin(e.t*.8)*40-e.x)*Math.min(1,dt*2);e.y+=(e.hy+Math.sin(e.t*1.7)*10-e.y)*Math.min(1,dt*2);e.ang=Math.atan2(c.dy,c.dx)*.3+(c.dx<0?Math.PI:0)*.0;e.face=c.dx>0?1:-1;
   e.timer-=dt;if(e.timer<=0&&c.dist<470&&c.dist>60){e.cs='aim';e.timer=.8;sfx('switch')}}
  else if(e.cs==='aim'){e.timer-=dt;e.flash=Math.max(e.flash,.02);if(e.timer>.35){e.ax=c.dx/c.dist;e.ay=c.dy/c.dist}e.ang=Math.atan2(e.ay,e.ax);e.face=e.ax>0?1:-1;
   e.x+=e.ax*-18*dt;e.y+=e.ay*-18*dt; /* 微微后仰蓄力 */
   if(e.timer<=0){e.cs='dive';e.timer=1.25;sfx('dash')}}
  else if(e.cs==='dive'){e.timer-=dt;e.x+=e.ax*340*dt;e.y+=e.ay*340*dt;if(Math.random()<.7)C.emit(e.x+e.w/2-e.ax*18,e.y+e.h/2-e.ay*18,'#fff1c8',1,40,.35);
   if(e.timer<=0||C.solidAt(e.x+e.w/2+e.ax*14,e.y+e.h/2+e.ay*14)){e.cs='back';e.timer=0;paper(e.x+e.w/2,e.y+e.h/2,8)}}
  else{var hx=e.hx-e.x,hy=e.hy-e.y,hd=Math.hypot(hx,hy);e.ang=Math.atan2(hy,hx);e.face=hx>0?1:-1;if(hd<8){e.cs='idle';e.timer=1.5+Math.random()}else{e.x+=hx/hd*150*dt;e.y+=hy/hd*150*dt}}},
 /* 失控的篮球：在自己的一小片地方乱蹦；挥鞭打中就变成炮弹 */
 hoop:function(e,dt,c){var p=C.P,r=C.R;e.hp=999;e.spin=(e.spin||0)+dt*(e.cs==='batted'?18:5)*(e.vx>0?1:-1);
  if(e.cs==='batted'){e.bt-=dt;e.x+=e.vx*dt;e.y+=e.vy*dt;e.vy+=380*dt;
   if(Math.random()<.8)C.emit(e.x+e.w/2,e.y+e.h/2,'#ffb35a',1,50,.35);
   r.enemies.forEach(function(o){if(o===e||o.dead||o.kind==='hoop')return;if(ov(e,o)){C.damageEnemy(o,3,e.vx>0?1:-1);e.vx*=.75;cnt('hoopKills');sfx('hit');C.shake(3);paper(o.x+o.w/2,o.y+o.h/2,10)}});
   (r.c5b||[]).forEach(function(b){if(!b.solved&&ov(e,b))ringBell(b,'ball')});
   if(C.solidAt(e.x+(e.vx>0?e.w:0),e.y+e.h*.5)){e.vx=-e.vx*.6;e.x+=e.vx*dt*2;sfx('bounce')}
   if(e.vy>0&&C.groundAt(e.x+e.w/2,e.y+e.h)){e.y=Math.floor((e.y+e.h)/T)*T-e.h;e.vy=-220;sfx('bounce')}
   if(e.bt<=0){e.cs='idle';e.phased=false;e.hx=e.x;e.min=e.x-80;e.max=e.x+80}return}
  e.vy+=1500*dt;e.y+=e.vy*dt;
  if(e.vy>0&&C.groundAt(e.x+e.w/2,e.y+e.h)){e.y=Math.floor((e.y+e.h)/T)*T-e.h;e.vy=-430-Math.random()*90;if(c.dist<420)sfx('bounce')}
  e.x+=e.vx*dt;if(e.x<e.min||e.x>e.max||C.solidAt(e.x+(e.vx>0?e.w:0),e.y+e.h*.5)){e.vx=-e.vx;e.x=clamp(e.x,e.min,e.max)}
  var sl=slashRect(p);if(sl&&e.swingHit!==p.swing&&ov(sl,e)){e.swingHit=p.swing;e.cs='batted';e.phased=true;e.bt=2.4;e.vx=p.face*640;e.vy=-170;sfx('hit');C.shake(3);C.hitstop(.05);C.emit(e.x+e.w/2,e.y+e.h/2,'#ffd27a',12,200,.4);cnt('hoopBat');C.toast('打出去！',700)}},
 /* 值日扫帚：抬扫帚、一扫，尘浪沿地面滚过去 */
 broom:function(e,dt,c){
  if(e.cs==='idle'){e.timer-=dt;if(c.dist<480)e.face=c.dx>0?1:-1;var pace=Math.sin(e.t*.9)*24*dt;if(e.x+pace>e.min&&e.x+pace<e.max)stepX(e,pace);
   if(e.timer<=0&&Math.abs(c.dx)<380&&Math.abs(c.dy)<100){e.cs='raise';e.timer=.6;e.face=c.dx>0?1:-1;sfx('switch')}}
  else if(e.cs==='raise'){e.timer-=dt;e.flash=Math.max(e.flash,.02);if(e.timer<=0){e.cs='sweep';e.timer=.35;sfx('dash');C.shoot(e.x+e.w/2+e.face*26,e.y+e.h-9,e.face*300,0,{r:15,col:'#e8d3a0',life:1.15});C.emit(e.x+e.w/2+e.face*30,e.y+e.h-6,'#e8d3a0',10,140,.4)}}
  else if(e.cs==='sweep'){e.timer-=dt;if(e.timer<=0){e.cs='idle';e.timer=1.6}}},
 /* 夕阳的影子：照着你 1.2 秒前走过的路追上来 */
 shadow:function(e,dt,c){var r=C.R,p=C.P,rng=(e.p.range||4)*T;
  if(e.cs==='sleep'){e.alpha+=(.45-e.alpha)*Math.min(1,dt*3);if(c.dist<rng*1.7+120){e.cs='rise';e.timer=1.2;e.wake=C.time;sfx('roar')}}
  else if(e.cs==='rise'){e.timer-=dt;e.alpha+=(.9-e.alpha)*Math.min(1,dt*3);if(e.timer<=0)e.cs='chase'}
  else{var s=histAt(r,C.time-1.2);if(s){e.x+=(s.x-e.x)*Math.min(1,dt*9);e.y+=(s.y+(p.h-e.h)-e.y)*Math.min(1,dt*9);e.face=s.f}
   if(c.dist>880){e.cs='sleep';e.x=e.hx;e.y=e.hy}}
  if(Math.random()<.15)C.emit(e.x+e.w/2,e.y+e.h,'#2a1a3a',1,30,.5,-40)}
};
if(window.DLCX&&DLCX.ENEMY_KINDS)ENEMIES.forEach(function(k){DLCX.ENEMY_KINDS[k]=1;DLCX.ENEMY[k]=AI[k]});

/* ==================== 机关 / 障碍 ==================== */
function ringBell(b,by){if(b.solved&&b.rt>4.5)return;b.solved=true;b.rt=6;b.ring=1;sfx('bell');C.shake(3);paper(b.x+b.w/2,b.y+b.h/2,16);C.emit(b.x+b.w/2,b.y+b.h/2,'#ffd27a',18,260,.6);cnt('bells');C.toast(by==='ball'?'球敲响了放学铃！':'放学铃响了——闸门打开 6 秒',1500)}
function update(dt,r,p){
 if(!p)return;
 /* 玩家走过的路（给「影子」用） */
 var hh=r.c5hist=r.c5hist||[];hh.push({t:C.time,x:p.x,y:p.y,f:p.face});while(hh.length&&hh[0].t<C.time-2.6)hh.shift();
 var cx=p.x+p.w/2,cy=p.y+p.h/2,pr={x:p.x+3,y:p.y+4,w:p.w-6,h:p.h-6},sl=slashRect(p),hurtOK=p.inv<=0&&p.dash<=0;
 function hurt(dir){if(hurtOK){C.damagePlayer(1,{dir:dir});hurtOK=false}}
 (r.c5p||[]).forEach(function(d){if(d.got||Math.abs(cx-(d.x+d.w/2))>28||Math.abs(cy-(d.y+d.h/2))>34)return;d.got=true;p.glideT=8;sfx('glide');paper(d.x+16,d.y+16,20);C.toast('纸飞机！8 秒内，空中按住跳跃可以滑翔',2200)});
 if(p.glideT>0){p.glideT-=dt;if(!p.ground&&p.vy>40&&C.held&&C.held('jump')){p.vy=Math.min(p.vy,34);p.gliding=true;if(Math.random()<.5)C.emit(p.x+p.w/2-p.face*8,p.y+p.h*.6,'#fff1c8',1,30,.4,20)}else p.gliding=false}else p.gliding=false;
 (r.c5b||[]).forEach(function(b){b.ring=Math.max(0,b.ring-dt*1.6);if(b.solved){b.rt-=dt;if(b.rt<=0)b.solved=false}
  if(sl&&b.hitSw!==p.swing&&ov(sl,{x:b.x-10,y:b.y-6,w:b.w+20,h:b.h+12})){b.hitSw=p.swing;ringBell(b,'slash')}});
 (r.c5h||[]).forEach(function(d){var per=d.p.period||4.5,u=((C.time+(d.p.phase||0)*per)%per)/per,dir=d.p.dir<0?-1:1,L=d.w+90,rushT=.62/per;
  d.warn=u<.3;d.rush=u>=.3&&u<.3+rushT;
  if(d.warn&&!d.beeped&&u>.04){d.beeped=true;sfx('switch')}if(!d.warn)d.beeped=false;
  if(d.rush){var f=(u-.3)/rushT;d.bx=dir>0?d.x-60+L*f:d.x+d.w+60-L*f;d.bdir=dir;
   if(ov(pr,{x:d.bx-26,y:d.y+T-36,w:52,h:36}))hurt(dir)}else d.bx=-999});
 if(r.kn)knUpdate(dt,r,p)}

/* ==================== 绘制（世界层 / 屏幕层） ==================== */
function drawWorld(g,t){var r=C&&C.R;if(!r)return;
 if(r.c5hist&&C.P&&C.P.gliding){var p=C.P;g.save();g.translate(p.x+p.w/2-p.face*6,p.y+p.h*.45);g.scale(p.face,1);g.fillStyle='#fff6dc';g.beginPath();g.moveTo(-22,-4);g.lineTo(18,-10);g.lineTo(-8,12);g.closePath();g.fill();g.strokeStyle='#e0c890';g.lineWidth=2;g.stroke();g.restore()}
 if(r.kn)knDraw(g,t)}
function drawScreen(g,W,H,t){var r=C&&C.R;if(!r||!r.kn)return;knScreen(g,W,H,t)}

/* ============================================================
   Boss「倦怠骑士」
   一整条会无限延伸的、被红笔批改过的公路：世界是周期性的（每 64 格重复一次），跑过头会被无缝「接回来」，
   所以可以一直往前跑——身后追着一堵「截止时间」的擦除墙，Boss 在前面带路，边跑边打。
   开场：骑士现身 → 举起红笔 → 一刀把屏幕劈成两半 → 世界被批改成破败的样子。
   招式：
     批    红笔冲刺：先画出一条红线，然后沿线穿过你；后半场连冲 2~3 次。冲完它会喘气（输出窗口）
     批注刀  白色发光的刀可以挥鞭「弹反」打回去：命中骑士受 3 点伤害；红色的刀只能躲或拍碎
     叉    在空中画几个大红叉，倒数后炸出四条斜线光
     裂    竖直一刀劈开世界，裂缝会把你往里吸
     转    （三阶段）红笔像钟表指针一样绕着它转，转到一半会反向
     分身  （三阶段）三道残影依次从不同方向斩向你
   每次阶段切换，脚下的世界会再碎一块。 */
var STRONG=/[?&]strong=1/.test(location.search);
var P_TILES=64,KN_SPEED=[78,104,132],KN_ATK=[['dash','blades','cross','rain','fan'],['dash','blades','cross','rift','seize','flip','rain','sweep','stamp','fan','verdict'],['dash','blades','cross','rift','spin','clones','seize','flip','blank','popup','rain','sweep','stamp','fan','verdict','verdict']];
var KN_LINE={dash:'批——',blades:'批注！',cross:'叉！',rift:'裂——',spin:'转——',clones:'残影——',seize:'没收——',flip:'翻页——',blank:'交白卷——',popup:'（弹窗）',rain:'红笔雨——',sweep:'横批——',stamp:'驳回！',fan:'连环批注！',verdict:'终审判决——不及格！'};
function seg(px,py,x1,y1,x2,y2){var dx=x2-x1,dy=y2-y1,l2=dx*dx+dy*dy,u=l2?clamp(((px-x1)*dx+(py-y1)*dy)/l2,0,1):0,qx=x1+dx*u,qy=y1+dy*u;return Math.hypot(px-qx,py-qy)}
function initBoss(b,d,r){var k=r.kn=r.kn||{seen:false,cued:false,hp:null,phase:0,ruined:false,cells0:null,broken:0,done:false};
 k.blades=[];k.lines=[];k.crosses=[];k.rifts=[];k.stamps=[];k.verdict=null;k.rings=[];k.bub=k.bub||[];k.spin=null;k.afters=[];k.wall=null;k.t=0;k.cap='';k.capT=0;k.cine=null;k.split=null;
 b.max=b.p.hp||34;if(k.hp!=null){b.hp=k.hp;b.phase=k.phase}
 if(STRONG&&k.hp==null){b.phase=2;k.phase=2}b.state='wait';b.vis=0;b.atk='';b.timer=0;b.combo=0;b.started=false;b.vx=0;b.vy=0;b.cx0=b.x;b.y=-900}
function ring(x,y,r,col,life){var k=C.R.kn;if(k&&k.rings)k.rings.push({x:x,y:y,r:r,t:0,life:life||.55,col:col||'255,70,86'})}
function bcx(b){return b.x+b.w/2}function bcy(b){return b.y+b.h/2}
function say(k,text,secs){k.cap=text;k.capT=secs||2}
function breakWorld(level){ /* 世界越劈越碎：改地块 + 重烘焙（四个周期同时改，保持周期性） */
 var r=C.R,k=r.kn,G=r.ch-2,P=P_TILES,n,x,y,pr,pt=Math.floor((C.P.x+C.P.w/2)/T); /* 玩家脚下 ±4 格不动手脚：否则弹反一刀把地劈没，人直接掉坑里死了重进房间 */
 function near(xx){return Math.abs(xx-pt)<=4}
 function clr(x0,w,y0,h){for(var q=0;q<4;q++)for(y=y0;y<y0+h;y++)for(x=x0;x<x0+w;x++){var xx=q*P+x;if(r.cells[y]&&xx<r.cw&&!near(xx))r.cells[y][xx]=0}}
 function put(x0,w,y,v){for(var q=0;q<4;q++)for(x=x0;x<x0+w;x++){var xx=q*P+x;if(r.cells[y]&&xx<r.cw&&!near(xx))r.cells[y][xx]=v}}
 if(level===1){clr(18,2,G,2);clr(26,2,G,2);clr(42,2,G,2);clr(50,2,G,2);put(20,2,G-3,2);put(24,2,G-4,2);put(44,2,G-3,2);put(48,2,G-4,2)}
 else if(level===2){clr(30,8,G-5,1);put(30,2,G-5,2);put(35,2,G-6,2);put(39,2,G-5,2);clr(54,6,G-6,1);put(55,2,G-6,2);put(59,2,G-7,2)}
 k.broken=level;C.rebake()}
function restoreWorld(){var r=C.R,k=r.kn;if(k.cells0){for(var y=0;y<r.ch;y++)for(var x=0;x<r.cw;x++)r.cells[y][x]=k.cells0[y][x]}C.rebake()}
function ruinTheme(on){var r=C.R;r.biome=on?'t_ruin':'dawn';C.rebake()}

/* 开场演出 + 战斗主循环 */
function bossStep(b,dt){if(STRONG&&b.state!=='intro'&&b.state!=='wait')dt*=1.5;var r=C.R,p=C.P,k=r.kn,pcx=p.x+p.w/2,pcy=p.y+p.h/2;if(!k)return;
 if(b.state==='wait'){ /* 等玩家往前走几步再触发 */
  if(!k.spawnX)k.spawnX=r.spawn.x;
  if((k.seen&&true)||p.x>k.spawnX+160)startCine(b);return}
 if(b.state==='intro'){cineStep(b,dt);return}
 if(b.state==='phase'){b.timer-=dt;b.vis=1;b.y+=(p.y-70-b.y)*Math.min(1,dt*2);b.x+=(p.x+300-b.x)*Math.min(1,dt*1.5);if(b.timer<=0){b.state='run';b.timer=1.1}return}
 b.flash=Math.max(0,b.flash);
 /* 无限公路：跑过头就整体平移一个周期（地形是周期的，看不出来） */
 var sh=P_TILES*T;if(!k.done){if(p.x>sh*3)wrap(-sh);else if(p.x<sh*1&&k.looped)wrap(sh)}
 k.t+=dt;fxStep(dt,k,p);
 var spd=KN_SPEED[b.phase]*(b.state==='dying'?0:1);if(k.wall){k.wall.x+=spd*dt;k.wall.x=Math.max(k.wall.x,p.x-980)}
 var pr={x:p.x+3,y:p.y+4,w:p.w-6,h:p.h-6};
 /* 擦除墙：碰到就受伤，并被顶出去一截 */
 if(k.wall&&p.x<k.wall.x&&p.inv<=0&&p.dash<=0){C.damagePlayer(1,{dir:1});p.x=k.wall.x+8;p.vx=Math.max(p.vx,220);say(k,'截止时间到了——快跑！',1.4)}
 var tx=p.x+(b.state==='exposed'?0:300),ty=p.y-30;
 switch(b.state){
 case'run':b.timer-=dt;b.face=-1;b.x+=clamp((p.x+330+Math.sin(k.t*1.3)*40-b.x)*3,-420,420)*dt;b.y+=(p.y-50+Math.sin(k.t*2)*24-b.y)*Math.min(1,dt*3);
  if(b.timer<=0)pickAtk(b);break;
 case'wind':b.timer-=dt;windStep(b,dt);break;
 case'atk':b.timer-=dt;atkStep(b,dt);break;
 case'exposed':b.timer-=dt;b.vx*=Math.pow(.02,dt);b.x+=b.vx*dt;b.y+=((p.y+p.h-b.h)-b.y)*Math.min(1,dt*2.5);if(Math.random()<.3)C.emit(b.x+b.w/2,b.y+b.h*.3,'#ff4a5a',1,40,.7,-50);if(b.timer<=0){b.state='run';b.timer=.9-b.phase*.2}break}
 hazards(b,dt,pr,pcx,pcy)}
function wrap(sh){var r=C.R,k=r.kn,b=r.boss,p=C.P;p.x+=sh;if(sh<0)k.looped=true;
 b.x+=sh;if(k.wall)k.wall.x+=sh;C.cam.x+=sh;
 r.enemies.forEach(function(e){e.x+=sh;e.hx=(e.hx||0)+sh});r.proj.forEach(function(q){q.x+=sh});r.warns.forEach(function(w){w.x+=sh});r.fire.forEach(function(f){f.x+=sh});
 k.blades.forEach(function(q){q.x+=sh});k.lines.forEach(function(l){l.x1+=sh;l.x2+=sh});k.crosses.forEach(function(q){q.x+=sh});k.rifts.forEach(function(q){q.x+=sh});k.afters.forEach(function(q){q.x+=sh});k.rings.forEach(function(q){q.x+=sh});k.stamps.forEach(function(q){q.x+=sh});if(k.verdict)k.verdict.x+=sh;(k.bub||[]).forEach(function(q){q.x+=sh});
 if(k.spin)k.spin.x+=sh;if(b.lockX!=null)b.lockX+=sh;if(p.safe){p.safe.x+=sh}}

function pickAtk(b){var k=C.R.kn,list=KN_ATK[b.phase],a=pick(list);if(a===b.lastAtk)a=list[(list.indexOf(a)+1)%list.length];b.lastAtk=b.atk=a;b.state='wind';b.timer=b.wt={dash:.8,blades:.7,cross:.6,rift:.55,spin:.9,clones:.6,seize:.8,flip:.9,blank:.9,popup:.7,rain:.65,sweep:.7,stamp:.75,fan:.7,verdict:1.1}[a]-b.phase*.05;b.combo=a==='dash'?1+b.phase:0;b.lockX=null;sfx('switch');say(k,KN_LINE[a],.9);
 if(a==='cross')spawnCrosses(b);else if(a==='rift')spawnRifts(b);else if(a==='clones')spawnClones(b);else if(a==='rain')spawnRain(b);else if(a==='sweep')spawnSweep(b);else if(a==='stamp')spawnStamps(b);else if(a==='verdict')spawnVerdict(b)}
function windStep(b,dt){var p=C.P,k=C.R.kn;b.flash=Math.max(b.flash,.0);
 if(b.atk==='dash'){b.x+=(p.x+250-b.x)*Math.min(1,dt*4);b.y+=(p.y-20-b.y)*Math.min(1,dt*6);
  if(b.timer<.28&&b.lockX==null){b.lockX=p.x+p.w/2+p.vx*.22;b.lockY=p.y+p.h/2;b.ddir=b.lockX<bcx(b)?-1:1;k.lines.push({x1:bcx(b),y1:bcy(b),x2:bcx(b)+(b.lockX-bcx(b))*2.2,y2:bcy(b)+(b.lockY-bcy(b))*2.2,tele:b.timer,act:0,w:30,col:'#ff3a4a',thin:true})}}
 else if(b.atk==='blades'||b.atk==='spin'){b.x+=(p.x+(b.atk==='spin'?270:300)-b.x)*Math.min(1,dt*3);b.y+=(p.y-50-b.y)*Math.min(1,dt*3)}
 else{b.x+=(p.x+300-b.x)*Math.min(1,dt*2.5);b.y+=(p.y-60-b.y)*Math.min(1,dt*2.5)}
 b.face=-1;
 if(b.timer<=0){b.state='atk';fireAtk(b)}}
function fireAtk(b){var p=C.P,k=C.R.kn,ph=b.phase;
 if(b.atk==='dash'){var dx=b.lockX-bcx(b),dy=b.lockY-bcy(b),l=Math.hypot(dx,dy)||1;b.vx=dx/l*1300;b.vy=dy/l*1300;b.timer=.5;sfx('dash');C.shake(4);b.trail=true;ring(bcx(b),bcy(b),90,'255,70,86',.45);C.emit(bcx(b),bcy(b),'#ff3a4a',16,260,.4)}
 else if(b.atk==='blades'){var n=3+ph;b.timer=n*.34+.3;b.nb=n;b.bt=0}
 else if(b.atk==='spin'){b.timer=2.7;k.spin={x:0,y:0,a:Math.PI*(b.x<C.P.x?0:1),w:2.7,t:0,L:260,sg:1};sfx('roar')}
 else if(b.atk==='fan'){var nf=5+ph*2,ba=Math.atan2(p.y+p.h/2-bcy(b),p.x+p.w/2-bcx(b));b.timer=.7;sfx('shoot');sfx('boom');C.shake(4);ring(bcx(b),bcy(b),120,'255,70,86',.4);
  for(var fi=0;fi<nf;fi++){var fa=ba+(fi-(nf-1)/2)*.2,fw=fi%2===0&&ph>0?true:fi===(nf-1)/2&&ph===0;k.blades.push({x:bcx(b)-20,y:bcy(b),vx:Math.cos(fa)*(300+ph*40),vy:Math.sin(fa)*(300+ph*40),r:15,white:fw,rev:false,life:4,a:fa});C.emit(bcx(b)-20,bcy(b),fw?'#ffffff':'#ff3a4a',3,200,.35)}}
 else if(b.atk==='verdict'){b.timer=3.1;sfx('roar');C.shake(6)}
 else if(b.atk==='seize')doSeize(b);else if(b.atk==='flip')doFlip(b);else if(b.atk==='blank')doBlank(b);else if(b.atk==='popup')doPopup(b);
 else{b.timer=.6}}
function atkStep(b,dt){var p=C.P,k=C.R.kn,ph=b.phase;
 if(b.atk==='dash'){b.x+=b.vx*dt;b.y+=b.vy*dt;if(Math.random()<.9)k.afters.push({x:b.x,y:b.y,t:.3,face:b.vx>0?1:-1});
  if(b.timer<=0){C.shake(5);b.combo--;if(b.combo>0){b.state='wind';b.timer=.42;b.lockX=null;b.wt=.42}else{b.state='exposed';b.timer=1.5-ph*.2;b.vx*=.15;b.vy=0;sfx('hit');say(k,'……（喘气）',1)}b.trail=false}}
 else if(b.atk==='blades'){b.x+=(p.x+300-b.x)*Math.min(1,dt*2);b.y+=(p.y-50-b.y)*Math.min(1,dt*3);b.bt-=dt;
  if(b.nb>0&&b.bt<=0){b.bt=.34;b.nb--;var white=ph===0?true:Math.random()<(ph===1?.6:.45),ax=p.x+p.w/2+p.vx*.35-bcx(b),ay=p.y+p.h/2-bcy(b),a=Math.atan2(ay,ax)+(Math.random()-.5)*.16,sp=330+ph*45;sfx('shoot');
   k.blades.push({x:bcx(b)-20,y:bcy(b),vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r:15,white:white,rev:false,life:4,a:a});C.emit(bcx(b)-20,bcy(b),white?'#ffffff':'#ff3a4a',8,160,.35)}
  if(b.timer<=0){b.state='run';b.timer=.7}}
 else if(b.atk==='spin'){var s=k.spin;s.t+=dt;s.x=bcx(b);s.y=bcy(b);if(s.t>1.3&&s.sg>0){s.sg=-1;sfx('roar');C.shake(4)}if(s.t<.7){s.a+=s.w*.35*dt}else s.a+=s.sg*s.w*dt;
  b.x+=(p.x+280-b.x)*Math.min(1,dt*1.2);b.y+=(p.y-70-b.y)*Math.min(1,dt*2);
  if(b.timer<=0){k.spin=null;b.state='exposed';b.timer=1.5;b.vx=0;sfx('hit')}}
 else{if(b.timer<=0){b.state='run';b.timer=1.0}}}

function spawnCrosses(b){var p=C.P,k=C.R.kn,n=2+b.phase,i;
 for(i=0;i<n;i++){var cx=p.x+p.w/2+p.vx*.9+(i===0?0:rnd(120,260)*(i%2?1:-.6)),cy=p.y+p.h/2+(i===0?-10:rnd(-110,40));cy=Math.min(cy,C.R.h-110);k.crosses.push({x:cx,y:cy,tele:.9+i*.2,L:420,fired:false})}}
function spawnRifts(b){var p=C.P,k=C.R.kn,n=b.phase>1?2:1,i;for(i=0;i<n;i++)k.rifts.push({x:p.x+p.w/2+p.vx*.7+i*rnd(150,220)+(i?60:0),tele:.85+i*.45,act:0,w:84})}
function spawnRain(b){var p=C.P,k=C.R.kn,n=4+b.phase*2,i,top=C.cam.y-100,bot=C.R.h;
 for(i=0;i<n;i++){var x=p.x+p.w/2+p.vx*(.45+i*.08)+(i===0?0:rnd(-360,360));k.lines.push({x1:x,y1:top,x2:x,y2:bot,tele:.7+i*.17,act:.22,w:38,col:'#ff3a4a',fired:false,vert:true,dmg:b.phase>0?2:1})}}
function spawnSweep(b){var p=C.P,k=C.R.kn,n=b.phase>1?2:1,i,y=p.y+p.h-14;
 for(i=0;i<n;i++)k.lines.push({x1:p.x-760,y1:y,x2:p.x+760,y2:y,tele:.75+i*.55,act:.25,w:34,col:'#ff3a4a',fired:false,horiz:true,dmg:2})}
/* 必杀「终审判决」：整片画面盖上“不及格”，只有一道白色的“及格线”光柱里是安全的；站在外面吃 2~3 点伤害（冲刺无敌帧可躲） */
function spawnVerdict(b){var p=C.P,k=C.R.kn,sd=Math.random()<.5?-1:1,pc=p.x+p.w/2,sx=pc+sd*rnd(240,340);
 cnt('verdicts');k.verdict={tele:2.7,max:2.7,x:sx,half:88,fired:false,act:0,dmg:b.phase>1?3:2};say(k,'终审判决——只有“及格线”里是安全的！',2.2);C.toast('必杀！躲进白色的及格线光柱里！',2200)}
function spawnStamps(b){var p=C.P,k=C.R.kn,n=1+(b.phase>0?1:0)+(b.phase>1?1:0),i;
 for(i=0;i<n;i++)k.stamps.push({x:p.x+p.w/2+p.vx*.6+(i?rnd(-280,280):0),y:p.y+p.h,tele:.95+i*.32,act:0,R:118,fired:false,ang:rnd(-.3,.3)})}
function spawnClones(b){var p=C.P,k=C.R.kn,i;for(i=0;i<3;i++){var ang=[-.55,.35,-Math.PI+.35][i]+rnd(-.2,.2),tx=p.x+p.w/2+p.vx*(.6+i*.4),ty=p.y+p.h/2,L=760;
  k.lines.push({x1:tx-Math.cos(ang)*L,y1:ty-Math.sin(ang)*L,x2:tx+Math.cos(ang)*L,y2:ty+Math.sin(ang)*L,tele:.6+i*.42,act:.2,w:34,col:'#ff3a4a',clone:true,fired:false})}}


/* ===== 打破第四面墙：这些招式直接动手改界面（DOM），不只是画面里的特效 ===== */
var FX={flip:0,seize:0,blank:0,pop:null,strike:null};
function $(id){return document.getElementById(id)}
function cutHud(){ /* HUD 被震得抖一下（不再切开界面） */
 var h=$('hud');if(!h)return;h.style.transition='none';h.style.transform='translateX(10px)';setTimeout(function(){h.style.transition='transform .55s cubic-bezier(.2,2,.4,1)';h.style.transform=''},60)}
function doSeize(b){var k=C.R.kn,p=C.P;b.timer=.7;FX.seize=7;k.noDash=7;p.stam=0;cutHud();sfx('seize');C.shake(10);C.flash(.25);
 var bar=$('dashBar');if(bar){if(!FX.strike){var s=document.createElement('div');s.style.cssText='position:absolute;left:-6px;right:-6px;top:50%;height:4px;background:#ff3a4a;box-shadow:0 0 8px #ff3a4a;transform:rotate(-4deg);pointer-events:none;z-index:5';var tag=document.createElement('b');tag.textContent='已没收';tag.style.cssText='position:absolute;right:-4px;top:-18px;color:#ff6a6a;font-size:12px;font-weight:900';s.appendChild(tag);bar.style.position='relative';bar.appendChild(s);FX.strike=s}FX.strike.style.display='block'}
 say(k,'冲刺，没收了。弹反一刀才能要回来。',2.4);C.toast('冲刺被没收！弹反白色的刀可以夺回来',2200)}
function doFlip(b){var k=C.R.kn;b.timer=.6;FX.flip=4.2;sfx('roar');C.shake(8);var g=$('game');if(g){g.style.transition='transform .35s cubic-bezier(.3,1.6,.5,1)';g.style.transform='scaleX(-1)'}say(k,'翻页——世界，反过来了。',2.2);C.toast('画面被翻过去了（4 秒）',1600)}
function doBlank(b){var k=C.R.kn;b.timer=.6;FX.blank=7;sfx('boom');C.shake(8);var h=$('hud');if(h){h.style.transition='opacity .25s';h.style.opacity='0'}
 var st=$('c5grade');if(!st){st=document.createElement('div');st.id='c5grade';st.style.cssText='position:fixed;left:50%;top:30%;transform:translateX(-50%) rotate(-8deg);font:900 64px "Noto Sans SC",sans-serif;color:#ff3a4a;border:6px solid #ff3a4a;border-radius:14px;padding:2px 22px;pointer-events:none;z-index:50;text-shadow:0 0 12px rgba(255,58,74,.6);opacity:.85';document.body.appendChild(st)}
 st.textContent='0 分';st.style.display='block';say(k,'血量？批改过了。你不需要知道。',2.4)}
function doPopup(b){var k=C.R.kn;b.timer=.6;if(FX.pop)return;sfx('select');
 var d=document.createElement('div');d.style.cssText='position:fixed;left:'+(20+Math.random()*40)+'%;top:'+(26+Math.random()*30)+'%;width:min(380px,78vw);background:#f0f0f0;color:#111;border:2px solid #444;box-shadow:6px 6px 0 rgba(0,0,0,.5);font:14px "Noto Sans SC",sans-serif;z-index:60;user-select:none';
 d.innerHTML='<div style="background:#2a4fa8;color:#fff;padding:4px 8px;font-weight:700;display:flex;justify-content:space-between"><span>系统提示</span><span>✕</span></div><div style="padding:14px 14px 8px">老师，您已连续工作 14 小时。<br>是否保存并退出？</div><div style="padding:6px 14px 12px;text-align:right"><button style="margin-right:8px;padding:3px 16px">退出</button><button style="padding:3px 16px">退出</button></div>';
 document.body.appendChild(d);FX.pop=d;d.onclick=function(e){if(e.target.tagName==='BUTTON'){C.toast('……两个按钮都是“退出”。',1500);closePop()}};
 FX.popT=3.4;say(k,'点“退出”也没用。它挡着你的路，就让它挡。',2.6)}
function closePop(){if(FX.pop&&FX.pop.parentNode)FX.pop.parentNode.removeChild(FX.pop);FX.pop=null;FX.popT=0}
function fxStep(dt,k,p){if(STRONG){k.noDash=Math.max(k.noDash||0,5);p.stam=0;p.dashCd=Math.max(p.dashCd,.1)}
 if(FX.flip>0){FX.flip-=dt;if(FX.flip<=0){var g=$('game');if(g){g.style.transform='';}}}
 if(k.noDash>0){k.noDash-=dt;p.stam=0;if(p.dashCd<.1)p.dashCd=.1;if(k.noDash<=0)restoreDash()}
 if(FX.blank>0){FX.blank-=dt;if(FX.blank<=0)restoreHud()}
 if(FX.pop){FX.popT-=dt;if(FX.popT<=0)closePop()}}
function restoreDash(){if(STRONG)return;var k=C.R&&C.R.kn;if(k)k.noDash=0;if(FX.strike)FX.strike.style.display='none'}
function restoreHud(){var h=$('hud');if(h){h.style.opacity='';h.style.transition=''}var st=$('c5grade');if(st)st.style.display='none'}
function cleanupFx(){FX.flip=0;FX.blank=0;var g=$('game');if(g){g.style.transform='';g.style.transition=''}restoreHud();restoreDash();closePop()}

/* 所有「独立存在」的危险物：刀、红线、叉、裂缝、旋转的笔 */
function hazards(b,dt,pr,pcx,pcy){var r=C.R,k=r.kn,p=C.P,i,sl=slashRect(p),hurtOK=p.inv<=0&&p.dash<=0;
 function hurt(dir,d){if(hurtOK){k.hits=(k.hits||0)+1;C.damagePlayer(d||1,{dir:dir});hurtOK=false}}
 for(i=k.blades.length-1;i>=0;i--){var q=k.blades[i];q.life-=dt;
  if(q.rev){var hx=bcx(b)-q.x,hy=bcy(b)-q.y,hd=Math.hypot(hx,hy)||1;q.vx+=hx/hd*1900*dt;q.vy+=hy/hd*1900*dt;var s=Math.hypot(q.vx,q.vy);if(s>760){q.vx*=760/s;q.vy*=760/s}
   if(Math.random()<.8)C.emit(q.x,q.y,'#ffd23f',1,60,.3);
   if(hd<46&&b.state!=='dying'){k.blades.splice(i,1);parryHit(b);continue}}
  q.x+=q.vx*dt;q.y+=q.vy*dt;q.a=Math.atan2(q.vy,q.vx);
  if(!q.rev){
   if(sl&&ov(sl,{x:q.x-q.r-6,y:q.y-q.r-6,w:q.r*2+12,h:q.r*2+12})){
    if(q.white){q.rev=true;if(k.noDash>0){restoreDash();C.toast('冲刺夺回来了！',1200)}q.life=3;q.vx=-q.vx*.4;q.vy=-q.vy*.4;sfx('parry');C.hitstop(.08);C.shake(5);C.flash(.12);C.emit(q.x,q.y,'#ffffff',18,300,.4);ring(q.x,q.y,80,'255,255,255',.4);cnt('parries');C.toast('弹反！',700)}
    /* 红色的刀：教鞭挡不住，只能躲 */}
   else if(hurtOK&&Math.hypot(q.x-pcx,q.y-pcy)<q.r+13){hurt(q.vx>0?-1:1);k.blades.splice(i,1);continue}}
  if(q.life<=0||q.y>r.h+80)k.blades.splice(i,1)}
 for(i=k.lines.length-1;i>=0;i--){var l=k.lines[i];
  if(l.tele>0){l.tele-=dt;if(l.tele<=0){if(l.thin){k.lines.splice(i,1);continue}l.act=l.act||.2;sfx('boom');C.shake(6);C.emit((l.x1+l.x2)/2,(l.y1+l.y2)/2,'#ffffff',16,300,.4);ring((l.x1+l.x2)/2,(l.y1+l.y2)/2,130,'255,120,130',.5)}continue}
  l.act-=dt;if(l.act>0&&seg(pcx,pcy,l.x1,l.y1,l.x2,l.y2)<l.w/2+12)hurt(1,l.dmg||1);if(l.act<=0)k.lines.splice(i,1)}
 for(i=k.crosses.length-1;i>=0;i--){var c=k.crosses[i];
  if(!c.fired){c.tele-=dt;if(c.tele<=0){c.fired=true;c.act=.45;sfx('boom');C.shake(7);C.emit(c.x,c.y,'#ff3a4a',24,320,.5);C.emit(c.x,c.y,'#ffffff',10,420,.35);ring(c.x,c.y,160,'255,70,86',.6);ring(c.x,c.y,90,'255,255,255',.4)}}
  else{c.act-=dt;var L=c.L;if(seg(pcx,pcy,c.x-L,c.y-L,c.x+L,c.y+L)<20||seg(pcx,pcy,c.x-L,c.y+L,c.x+L,c.y-L)<20)hurt(1,b.phase>0?2:1);if(c.act<=0)k.crosses.splice(i,1)}}
 for(i=k.rifts.length-1;i>=0;i--){var f=k.rifts[i];
  if(f.tele>0){f.tele-=dt;if(f.tele<=0){f.act=.65;sfx('boom');C.shake(9);C.flash(.15);ring(f.x,pcy,200,'255,255,255',.55)}}
  else{f.act-=dt;var dx=f.x-pcx;if(Math.abs(dx)<f.w*2.2&&f.act>0){p.vx+=Math.sign(dx)*2600*dt*(p.ground?.5:1)}if(Math.abs(dx)<f.w*.32&&f.act>0)hurt(Math.sign(-dx)||1,2);
   if(Math.random()<.5)C.emit(f.x+rnd(-12,12),rnd(C.cam.y,C.cam.y+520),'#ffffff',1,40,.4);if(f.act<=0)k.rifts.splice(i,1)}}
 var sp=k.spin;if(sp&&sp.t>.7){var ex=sp.x+Math.cos(sp.a)*sp.L,ey=sp.y+Math.sin(sp.a)*sp.L;if(seg(pcx,pcy,sp.x,sp.y,ex,ey)<22)hurt(1,b.phase>1?2:1)}
 for(i=k.afters.length-1;i>=0;i--){k.afters[i].t-=dt;if(k.afters[i].t<=0)k.afters.splice(i,1)}
 var vd=k.verdict;if(vd){
  if(!vd.fired){vd.tele-=dt;if(vd.tele<=0){vd.fired=true;vd.act=.9;sfx('boom');sfx('roar');C.shake(20);C.flash(.85);C.hitstop(.1);ring(vd.x,pcy,700,'255,255,255',.9);ring(pcx,pcy,420,'255,58,74',.8);C.emit(pcx,pcy,'#ff3a4a',40,520,.8);
    if(Math.abs(pcx-vd.x)>vd.half)hurt(pcx>vd.x?1:-1,vd.dmg);else{C.toast('及格！',900)}
    if(b.state==='atk'||b.state==='wind'){b.state='exposed';b.timer=1.9;b.vx=0;b.vy=0}}}
  else{vd.act-=dt;if(vd.act<=0)k.verdict=null}}
 for(i=k.stamps.length-1;i>=0;i--){var sm=k.stamps[i];
  if(!sm.fired){sm.tele-=dt;if(sm.tele<=0){sm.fired=true;sm.act=.5;sfx('boom');C.shake(9);C.hitstop(.04);ring(sm.x,sm.y,200,'255,70,86',.55);C.emit(sm.x,sm.y-6,'#ff3a4a',22,320,.5);C.emit(sm.x,sm.y-6,'#ffffff',10,260,.35)}}
  else{sm.act-=dt;if(sm.act>0&&Math.hypot(pcx-sm.x,(pcy-sm.y)*.85)<sm.R)hurt(pcx>sm.x?1:-1,2);if(sm.act<=0)k.stamps.splice(i,1)}}
 k.capT=Math.max(0,k.capT-dt)}
function parryHit(b){var k=C.R.kn;if(k.noDash>0){restoreDash();FX.seize=0;C.toast('冲刺夺回来了！',1200)}if(!hitBoss(b,3,false,true))return;b.state='exposed';b.timer=1.5;b.vx=0;b.vy=0;k.spin=null;b.combo=0;say(k,'……！',1);C.toast('反击命中！',900);if(k.wall)k.wall.x-=160}

/* 受击：普通挥击 1 点，弹反 3 点 */
function hitBoss(b,n,viaDash,force){var k=C.R.kn;
 if(!b||b.dead||b.state==='dying'||b.state==='wait'||b.state==='intro'||b.state==='phase')return false;
 if(!force&&b.flash>0)return false;
 b.hp-=n;k.hp=b.hp;b.flash=.32;C.hitstop(.07);C.shake(7);sfx('hit');ring(bcx(b),bcy(b),110,'255,90,100',.45);C.emit(bcx(b),bcy(b),'#ff4a5a',22,280,.5);C.emit(bcx(b),bcy(b),'#ffffff',10,200,.35);if(k.wall&&!force)k.wall.x-=55;
 if(viaDash&&b.state==='wind'){b.state='exposed';b.timer=1.2;b.vx=0}
 var ratio=b.hp/b.max,ph=ratio<.34?2:ratio<.67?1:0;
 if(b.hp<=0){b.hp=0;k.hp=0;b.deadT=.01;b.state='dying';k.wall=null;C.R.proj=[];C.R.warns=[];C.R.fire=[];k.blades=[];k.lines=[];k.crosses=[];k.rifts=[];k.stamps=[];k.verdict=null;k.spin=null;sfx('roar');return true}
 if(ph>b.phase){b.phase=ph;k.phase=ph;b.state='phase';b.timer=2;k.blades=[];k.lines=[];k.crosses=[];k.rifts=[];k.stamps=[];k.verdict=null;k.spin=null;sfx('roar');C.shake(14);C.flash(.5);breakWorld(ph);ring(bcx(b),bcy(b),320,'255,60,76',.9);ring(bcx(b),bcy(b),200,'255,255,255',.6);
  say(k,ph===1?'还不够……我还能把它切得更碎。':'没有人会怪你——停下来吧！！',2.6);if(k.wall)k.wall.x=Math.min(k.wall.x,C.P.x-760)}
 return true}
function onDeath(b){var r=C.R,k=r.kn;cnt('knightwin');if(!(k.hits>0))cnt('knightclean');if(STRONG)cnt('strongwin');cleanupFx();k.done=true;k.wall=null;ruinTheme(false);restoreWorld();say(k,'……老师，辛苦了。',3.2);C.flash(.7);
 var p=C.P,gx=Math.floor((p.x+360)/T);while(gx<r.cw-4&&!(C.solidAt(gx*T,(r.ch-2)*T+4)&&C.solidAt((gx+2)*T,(r.ch-2)*T+4)))gx++;
 if(r.exit){r.exit.x=gx*T;r.exit.y=(r.ch-2)*T-r.exit.h}}

/* 开场演出 */
function startCine(b){var r=C.R,k=r.kn,p=C.P;b.state='intro';k.seen0=k.seen;k.cine={t:0,short:!!k.seen,took:false};
 p.frozen=999;p.inv=999;p.vx=0;b.vis=0;b.x=p.x+360;b.y=p.y-90;b.hy=r.h-T*2-b.h;k.wall=null;
 if(window.AudioFX&&AudioFX.duck)AudioFX.duck(true)}
function cineStep(b,dt){var r=C.R,k=r.kn,p=C.P,cn=k.cine,t0=cn.t;cn.t+=dt;var t=cn.t;p.inv=999;p.frozen=999;
 var S=cn.short?{app:.2,line1:0,slash:.7,end:1.5}:{app:1.0,line1:2.4,slash:6.1,end:8.1};
 b.x+=((p.x+360)-b.x)*Math.min(1,dt*4);b.y+=((p.y-90+Math.sin(t*2)*8)-b.y)*Math.min(1,dt*4);b.face=-1;
 b.vis=clamp((t-S.app)/(cn.short?.3:1.2),0,1);
 if(t0<S.app&&t>=S.app){bubbleNpcs();sfx('roar');C.shake(8);C.emit(bcx(b),bcy(b),'#1a0a14',30,300,.8)}
 if(!cn.short){
  if(t0<2.4&&t>=2.4)say(k,'你已经很累了。',1.7);
  if(t0<4.1&&t>=4.1)say(k,'停下来吧，没人会怪你。',1.9);
  if(t0<5.6&&t>=5.6){sfx('switch');cn.frozenT=true}}
 if(t0<S.slash&&t>=S.slash){ /* 一刀 */
  sfx('boom');sfx('roar');C.shake(18);C.hitstop(.18);C.flash(.8);cn.slashT=0;k.split={t:0,ang:-.38};ring(bcx(b),bcy(b),260,'255,255,255',.7)}
 if(k.split){k.split.t+=dt}
 var st=k.split?k.split.t:-1;
 if(k.split&&!cn.swapped&&st>.2){ /* 两半撞回去的那一刻：世界被批改成破败的样子 */
  cn.swapped=true;k.cells0=C.R.cells.map(function(row){return row.slice()});ruinTheme(true);breakWorld(b.phase>0?b.phase:0);k.ruined=true;C.flash(1);C.shake(20);sfx('boom');
  for(var i=0;i<40;i++)C.emit(C.cam.x+rnd(0,800),C.cam.y+rnd(0,520),pick(['#ff4a5a','#2a1a24','#9a8a86']),1,rnd(100,380),rnd(.6,1.4),rnd(-300,100));
  k.cued=true;if(window.AudioFX){AudioFX.duck&&AudioFX.duck(false);AudioFX.play('boss')}}
 if(t>=S.end){p.frozen=0;p.inv=Math.max(1.2,0);b.state='run';b.timer=1.2;b.started=true;k.seen=true;k.cine=null;k.split=null;k.wall={x:p.x-720};say(k,'批改，开始。',1.6);C.toast('倦怠骑士 挡住了去路！',1800);k.t=0}}

/* ----- 更新 / 绘制钩子 ----- */
function resetRoom(r){cleanupFx();(r.c5p||[]).forEach(function(d){d.got=false});(r.c5b||[]).forEach(function(d){d.solved=false;d.rt=0});r.c5hist=[]}
function knUpdate(dt,r,p){var b=r.boss;if(!b||b.type!=='knight')return;var k=r.kn,i;
 for(i=k.rings.length-1;i>=0;i--){k.rings[i].t+=dt;if(k.rings[i].t>=k.rings[i].life)k.rings.splice(i,1)}
 if(k.bub)for(i=k.bub.length-1;i>=0;i--){var q=k.bub[i];q.t+=dt;q.x+=(q.vx+Math.sin(q.t*3+q.ph)*18)*dt;q.y+=q.vy*dt;
  if(q.t>=q.life){C.emit(q.x,q.y,'#bfe8ff',4,90,.4,0);C.emit(q.x,q.y,'#ffffff',2,60,.3,0);k.bub.splice(i,1)}}}
/* 所有 NPC 化作泡沫消失 */
function bubbleNpcs(){var r=C.R,k=r.kn,i;k.bub=k.bub||[];
 (r.npcs||[]).forEach(function(n){for(i=0;i<18;i++)k.bub.push({x:n.x+rnd(0,n.w||32),y:n.y+rnd(0,n.h||48),vx:rnd(-24,24),vy:-rnd(26,90),r:rnd(4,15),t:0,life:rnd(1.2,2.8),ph:rnd(0,6)});C.emit(n.x+(n.w||32)/2,n.y+(n.h||48)/2,'#bfe8ff',14,140,.6,-20)});
 if((r.npcs||[]).length)sfx('check');r.npcs=[]}
/* 玩家倒下：骑士缓过一口气 */
function onPlayerDeath(b){var k=C.R&&C.R.kn;if(!b||b.type!=='knight'||b.dead||b.state==='dying'||b.state==='wait'||!k)return;
 var heal=Math.max(1,Math.round(b.max*(STRONG?.25:.1))),before=b.hp;b.hp=Math.min(b.max,b.hp+heal);k.hp=b.hp;
 if(b.hp>before){ring(bcx(b),bcy(b),150,'255,200,120',.8);C.emit(bcx(b),bcy(b),'#ffcf8a',22,200,.7,-120);C.toast('倦怠骑士回复了一点体力……',1800)}}
/* 一道发光的光束：外层红晕 + 中层亮红 + 白芯，两端有光斑 */
function beam(g,x1,y1,x2,y2,w,a,hot){g.save();g.lineCap='round';g.globalCompositeOperation='lighter';
 g.strokeStyle='rgba(255,40,60,'+.28*a+')';g.lineWidth=w*2.4;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();
 g.strokeStyle='rgba(255,90,100,'+.7*a+')';g.lineWidth=w*1.3;g.stroke();
 g.strokeStyle='rgba(255,'+(hot?255:235)+',235,'+a+')';g.lineWidth=w*.55;g.stroke();
 if(G.glow){G.glow(g,x1,y1,w*2.2,'#ff5a6a',.6*a);G.glow(g,x2,y2,w*2.2,'#ff5a6a',.6*a)}g.restore()}
function star4(g,x,y,r,rot,col){g.save();g.translate(x,y);g.rotate(rot);g.fillStyle=col;g.beginPath();for(var i=0;i<8;i++){var a=i*Math.PI/4,rr=i%2?r*.18:r;g.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}g.closePath();g.fill();g.restore()}
function knDraw(g,t){var r=C.R,k=r.kn,b=r.boss;if(!b)return;var cam=C.cam,i;
 /* 截止时间：吞掉一切的“红墨虚空”——前沿是白炽的橡皮刃，身后是被擦成空白的世界，巨大的钟面在里面疯狂转动 */
 if(k.wall&&!b.dead){var wx=k.wall.x,y0=cam.y-120,h=760,py=C.P?C.P.x-wx:999;g.save();
  function edge(y){return wx+Math.sin(y*.031+t*6)*11+Math.sin(y*.113-t*9)*5+Math.sin(y*.007+t*2)*16}
  /* 虚空本体 */
  var vg=g.createLinearGradient(wx-760,0,wx,0);vg.addColorStop(0,'rgba(6,0,10,0)');vg.addColorStop(.45,'rgba(20,2,22,.72)');vg.addColorStop(1,'rgba(52,6,34,.94)');
  g.fillStyle=vg;g.beginPath();g.moveTo(wx-760,y0);for(i=0;i<=h;i+=10)g.lineTo(edge(y0+i),y0+i);g.lineTo(wx-760,y0+h);g.closePath();g.fill();
  /* 被擦掉的“批注文字线”在虚空里横向滚动 */
  g.save();g.beginPath();g.moveTo(wx-760,y0);for(i=0;i<=h;i+=10)g.lineTo(edge(y0+i),y0+i);g.lineTo(wx-760,y0+h);g.closePath();g.clip();
  g.strokeStyle='rgba(255,58,74,.22)';g.lineWidth=2;for(i=0;i<22;i++){var ly=y0+i*36+((t*40)%36),lw=60+hash(i)*220,lx=wx-60-((t*180+hash(i+3)*500)%700);g.beginPath();g.moveTo(lx,ly);g.lineTo(lx-lw,ly);g.stroke()}
  /* 巨大的钟面 */
  var ccx=wx-300,ccy=cam.y+260,cr=170;g.translate(ccx,ccy);g.strokeStyle='rgba(255,58,74,.38)';g.lineWidth=5;g.beginPath();g.arc(0,0,cr,0,6.2832);g.stroke();g.lineWidth=2;g.beginPath();g.arc(0,0,cr-16,0,6.2832);g.stroke();
  for(i=0;i<60;i++){var ta=i/60*6.2832,tl=i%5?8:20;g.lineWidth=i%5?1.5:3.5;g.beginPath();g.moveTo(Math.sin(ta)*(cr-18),-Math.cos(ta)*(cr-18));g.lineTo(Math.sin(ta)*(cr-18-tl),-Math.cos(ta)*(cr-18-tl));g.stroke()}
  g.strokeStyle='rgba(255,120,130,.7)';g.lineCap='round';var ma=t*5.4,ha=t*.45;g.lineWidth=8;g.beginPath();g.moveTo(0,0);g.lineTo(Math.sin(ha)*cr*.5,-Math.cos(ha)*cr*.5);g.stroke();g.lineWidth=4;g.beginPath();g.moveTo(0,0);g.lineTo(Math.sin(ma)*cr*.78,-Math.cos(ma)*cr*.78);g.stroke();g.fillStyle='rgba(255,90,100,.9)';g.beginPath();g.arc(0,0,9,0,6.2832);g.fill();
  g.restore();
  /* 前沿：色散的三层白炽刃 + 刻度尺齿 */
  g.globalCompositeOperation='lighter';g.lineJoin='round';
  [['rgba(0,220,255,.55)',-7,16],['rgba(255,40,70,.7)',7,16],['rgba(255,255,255,1)',0,6]].forEach(function(L){g.strokeStyle=L[0];g.lineWidth=L[2];g.beginPath();for(i=0;i<=h;i+=8){var ex=edge(y0+i)+L[1];if(i===0)g.moveTo(ex,y0+i);else g.lineTo(ex,y0+i)}g.stroke()});
  var gl=g.createLinearGradient(wx-10,0,wx+130,0);gl.addColorStop(0,'rgba(255,110,120,.6)');gl.addColorStop(1,'rgba(255,110,120,0)');g.fillStyle=gl;g.beginPath();g.moveTo(wx,y0);for(i=0;i<=h;i+=10)g.lineTo(edge(y0+i),y0+i);g.lineTo(wx+130,y0+h);g.lineTo(wx+130,y0);g.closePath();g.fill();
  g.strokeStyle='rgba(255,255,255,.75)';g.lineWidth=1.5;g.beginPath();for(i=0;i<h;i+=18){var ex2=edge(y0+i),len=i%90===0?34:16;g.moveTo(ex2+4,y0+i);g.lineTo(ex2+4+len,y0+i)}g.stroke();
  /* 被吞噬的碎屑逆着风向后飘，和从刃口迸出的火花 */
  for(i=0;i<40;i++){var u1=(t*.55+i*.137)%1,py2=y0+((i*97.3)%h),pxx=edge(py2)-u1*520;g.globalAlpha=(1-u1)*.9;g.fillStyle=i%3?'#ffffff':'#ff5a6a';g.save();g.translate(pxx,py2+Math.sin(t*4+i)*14);g.rotate(t*3+i);g.fillRect(-4,-3,8,6);g.restore()}
  for(i=0;i<24;i++){var u2=(t*1.8+i*.171)%1,py3=y0+((i*61.7)%h),px3=edge(py3)+u2*130;g.globalAlpha=(1-u2);g.fillStyle='#ffd0d6';g.fillRect(px3,py3+Math.sin(i)*10,10*(1-u2)+2,2)}
  g.globalAlpha=1;g.globalCompositeOperation='source-over';
  /* 字：截止时间（色散 + 抖动）+ 与玩家的距离 */
  var tx=wx-30,ty=cam.y+90+Math.sin(t*3)*3,jit=Math.sin(t*37)>.92?(Math.random()-.5)*10:0;g.textAlign='right';g.font='900 46px "Noto Sans SC",sans-serif';
  g.fillStyle='rgba(0,220,255,.7)';g.fillText('截止时间',tx-3+jit,ty);g.fillStyle='rgba(255,40,70,.85)';g.fillText('截止时间',tx+3-jit,ty);g.fillStyle='#fff';g.fillText('截止时间',tx,ty);
  g.font='900 15px "Noto Sans SC",sans-serif';g.fillStyle='rgba(255,170,180,.95)';g.fillText('D E A D L I N E   ·   '+Math.max(0,Math.round(py/32))+' m',tx,ty+24);
  var dang=clamp(1-py/420,0,1);if(dang>0){g.fillStyle='rgba(255,40,60,'+dang*.18*(.6+.4*Math.sin(t*14))+')';g.fillRect(wx-200,y0,260,h)}
  g.restore()}
 if(k.ruined&&!k.done)drawMarks(g,t);
 /* 残影 */
 k.afters.forEach(function(a){g.save();g.globalAlpha=Math.max(0,a.t/.3)*.55;G.boss(g,{type:'knight',x:a.x,y:a.y,w:b.w,h:b.h,face:a.face,state:'atk',atk:'dash',flash:0,vis:1,phase:b.phase,ghost:true},t);g.restore()});
 /* 红线：预警是流动的箭头线 + 落点准星；命中时是一道亮得发白的光束 */
 k.lines.forEach(function(l){var tele=l.tele>0;g.save();
  if(tele){var u=1-Math.min(1,l.tele),bl=Math.sin(t*40)>0?1:.6,dx=l.x2-l.x1,dy=l.y2-l.y1,ln=Math.hypot(dx,dy)||1,ux=dx/ln,uy=dy/ln;
   g.lineCap='round';g.strokeStyle='rgba(255,58,74,'+(.2+.45*u)*bl+')';g.lineWidth=l.thin?3:7+u*4;g.setLineDash([16,12]);g.lineDashOffset=-t*120;g.beginPath();g.moveTo(l.x1,l.y1);g.lineTo(l.x2,l.y2);g.stroke();g.setLineDash([]);
   g.fillStyle='rgba(255,120,130,'+(.5+.4*u)+')';for(var c2=0;c2<5;c2++){var f=((t*1.6+c2/5)%1)*ln,cx2=l.x1+ux*f,cy2=l.y1+uy*f;g.save();g.translate(cx2,cy2);g.rotate(Math.atan2(uy,ux));g.beginPath();g.moveTo(10,0);g.lineTo(-6,-8);g.lineTo(-2,0);g.lineTo(-6,8);g.closePath();g.fill();g.restore()}
   if(l.thin){var ex=l.x1+dx/2.2,ey=l.y1+dy/2.2;g.strokeStyle='rgba(255,90,100,'+(.5+.4*u)+')';g.lineWidth=2;g.beginPath();g.arc(ex,ey,26-u*10,0,6.2832);g.stroke();g.beginPath();g.moveTo(ex-34,ey);g.lineTo(ex-16,ey);g.moveTo(ex+16,ey);g.lineTo(ex+34,ey);g.moveTo(ex,ey-34);g.lineTo(ex,ey-16);g.moveTo(ex,ey+16);g.lineTo(ex,ey+34);g.stroke()}}
  else beam(g,l.x1,l.y1,l.x2,l.y2,l.w*.5,Math.min(1,l.act*7),true);
  g.restore()});
 /* 叉：地上先浮出一圈符文收缩，倒数完炸成四条斜向光 */
 k.crosses.forEach(function(c){g.save();g.translate(c.x,c.y);
  if(!c.fired){var u=1-clamp(c.tele/1.2,0,1),bl=Math.sin(t*30)>0?1:.6,s=40+u*40;g.lineCap='round';
   g.strokeStyle='rgba(255,58,74,'+(.35+u*.5)*bl+')';g.lineWidth=2+u*3;g.beginPath();g.arc(0,0,110-u*50,0,6.2832);g.stroke();g.setLineDash([8,8]);g.lineDashOffset=t*40;g.beginPath();g.arc(0,0,70-u*20,0,6.2832);g.stroke();g.setLineDash([]);
   g.lineWidth=4+u*6;g.beginPath();g.moveTo(-s,-s);g.lineTo(s,s);g.moveTo(-s,s);g.lineTo(s,-s);g.stroke();
   g.strokeStyle='rgba(255,58,74,'+.12*u+')';g.lineWidth=18;g.beginPath();g.moveTo(-420,-420);g.lineTo(420,420);g.moveTo(-420,420);g.lineTo(420,-420);g.stroke();
   G.glow(g,0,0,90,'#ff3a4a',.3+u*.4)}
  else{var L=c.L,a=Math.min(1,c.act*6);beam(g,-L,-L,L,L,17,a,true);beam(g,-L,L,L,-L,17,a,true);star4(g,0,0,120*a+30,t*3,'rgba(255,255,255,'+a+')');G.glow(g,0,0,160,'#ff3a4a',.7*a)}
  g.restore()});
 /* 裂缝：先是一线白光，爆开后是一道吸力很强的黑色伤口 */
 k.rifts.forEach(function(f){var y0=cam.y-40,y1=cam.y+620;g.save();
  if(f.tele>0){var bl=Math.sin(t*32)>0?1:.5,u=1-f.tele;g.fillStyle='rgba(255,58,74,'+(.08+.18*u)*bl+')';g.fillRect(f.x-f.w*.3,y0,f.w*.6,y1-y0);
   g.strokeStyle='rgba(255,255,255,'+.75*bl+')';g.lineWidth=1.5+u*2;g.beginPath();g.moveTo(f.x,y0);for(var yy=y0;yy<y1;yy+=34)g.lineTo(f.x+Math.sin(yy*.2+t*50)*2.5,yy+17);g.stroke();
   g.fillStyle='rgba(255,120,130,'+(.4+.4*u)+')';for(var ci=0;ci<2;ci++){var cyy=(ci?cam.y+60:cam.y+420);for(var q=-1;q<=1;q+=2){g.beginPath();g.moveTo(f.x+q*(f.w*.45-u*12),cyy);g.lineTo(f.x+q*(f.w*.45-u*12+14),cyy-9);g.lineTo(f.x+q*(f.w*.45-u*12+14),cyy+9);g.fill()}}}
  else{var u2=Math.min(1,f.act*5),w=f.w*.34*u2;g.fillStyle='#07020a';g.beginPath();g.moveTo(f.x,y0);for(var yy2=y0;yy2<y1;yy2+=40){g.lineTo(f.x+(Math.sin(yy2*.07+t*30)*.5)*w+w,yy2+20);g.lineTo(f.x+Math.cos(yy2*.09)*w*.3,yy2+40)}for(var y2=y1;y2>=y0;y2-=40){g.lineTo(f.x-w+Math.sin(y2*.05)*w*.3,y2)}g.closePath();g.fill();
   g.save();g.globalCompositeOperation='lighter';g.strokeStyle='rgba(255,70,86,.5)';g.lineWidth=10;g.stroke();g.strokeStyle='rgba(255,255,255,.95)';g.lineWidth=2.5;g.stroke();g.restore();
   G.glow(g,f.x,(y0+y1)/2,300,'#ff3a4a',.3*u2);
   g.strokeStyle='rgba(255,200,205,.55)';g.lineWidth=1.5;for(var si=0;si<14;si++){var sy=y0+((si*61.7+t*300)%(y1-y0)),sd=(si%2?1:-1),sl=40+(si*13%60);g.beginPath();g.moveTo(f.x+sd*(sl+f.w),sy);g.lineTo(f.x+sd*f.w*.4,sy);g.stroke()}}
  g.restore()});
 /* 旋转的红笔：一整道扇形拖尾 */
 if(k.spin&&b.state==='atk'){var s=k.spin,warn=s.t<.7,dir=warn?1:s.sg;g.save();g.translate(s.x,s.y);
  if(!warn){for(i=0;i<10;i++){var a0=s.a-dir*i*.1,al=(1-i/10)*.35;g.fillStyle='rgba(255,60,76,'+al+')';g.beginPath();g.moveTo(0,0);g.arc(0,0,s.L+30,a0,a0-dir*.1,dir>0);g.closePath();g.fill()}}
  g.rotate(s.a);var pg=g.createLinearGradient(0,0,s.L+34,0);pg.addColorStop(0,'#5a0c1a');pg.addColorStop(.7,'#ff3a4a');pg.addColorStop(1,'#ffb0b8');
  g.globalAlpha=warn?.55:1;g.fillStyle=pg;g.beginPath();g.moveTo(0,-9);g.lineTo(s.L,-7);g.lineTo(s.L+40,0);g.lineTo(s.L,7);g.lineTo(0,9);g.closePath();g.fill();g.fillStyle='#fff';g.fillRect(8,-2,s.L-10,4);
  if(!warn)G.glow(g,s.L*.6,0,s.L*.7,'#ff3a4a',.55);G.glow(g,s.L+30,0,40,'#ffffff',warn?.3:.8);g.restore()}
 /* 刀：拖着一条渐隐的尾迹。白刀有光环（可以弹反），红刀发暗红（只能躲） */
 k.blades.forEach(function(q){g.save();g.translate(q.x,q.y);var col=q.rev?'255,210,60':q.white?'255,255,255':'255,58,74',sp=Math.hypot(q.vx,q.vy)||1,tl=Math.min(110,sp*.22),ang=q.a||0;
  var tg=g.createLinearGradient(0,0,-Math.cos(ang)*tl,-Math.sin(ang)*tl);tg.addColorStop(0,'rgba('+col+',.8)');tg.addColorStop(1,'rgba('+col+',0');g.strokeStyle=tg;g.lineCap='round';g.lineWidth=q.r*.9;g.beginPath();g.moveTo(0,0);g.lineTo(-Math.cos(ang)*tl,-Math.sin(ang)*tl);g.stroke();
  G.glow(g,0,0,q.r*3.4,q.rev?'#ffd23f':q.white?'#ffffff':'#ff3a4a',q.white&&!q.rev?.75:.6);
  g.rotate(ang);g.fillStyle=q.white&&!q.rev?'#fff':q.rev?'#ffe27a':'#ff3a4a';g.beginPath();g.moveTo(28,0);g.quadraticCurveTo(8,-12,-16,-11);g.lineTo(-8,0);g.lineTo(-16,11);g.quadraticCurveTo(8,12,28,0);g.closePath();g.fill();g.strokeStyle=q.white&&!q.rev?'rgba(120,150,255,.9)':'#1a0a14';g.lineWidth=2;g.stroke();
  g.fillStyle=q.white&&!q.rev?'rgba(255,90,100,.9)':'rgba(255,255,255,.8)';g.fillRect(-6,-1.2,26,2.4);
  if(q.white&&!q.rev){g.rotate(-ang);g.strokeStyle='rgba(255,255,255,.85)';g.lineWidth=2;g.beginPath();g.arc(0,0,q.r+8+Math.sin(t*14)*2,0,6.2832);g.stroke();g.strokeStyle='rgba(255,255,255,.35)';g.beginPath();g.arc(0,0,q.r+16+Math.sin(t*14+1)*3,0,6.2832);g.stroke();star4(g,0,0,10+Math.sin(t*18)*3,t*4,'rgba(255,255,255,.9)')}
  g.restore()});
 /* 必杀「终审判决」 */
 if(k.verdict){var vd2=k.verdict,vx0=cam.x-40,vy0=cam.y-40,vw=C.W/C.sc+80,vh=C.H/C.sc+80,hf=vd2.half;g.save();
  if(!vd2.fired){var u3=1-vd2.tele/vd2.max,bl2=Math.sin(t*(10+u3*30))>0?1:.78;
   g.fillStyle='rgba(120,6,24,'+(.12+.5*u3)*bl2+')';g.fillRect(vx0,vy0,vd2.x-hf-vx0,vh);g.fillRect(vd2.x+hf,vy0,vx0+vw-vd2.x-hf,vh);
   g.globalCompositeOperation='lighter';g.fillStyle='rgba(255,60,80,'+.06*u3+')';for(var vi=0;vi<8;vi++){g.save();g.translate(cam.x+C.W/C.sc/2,cam.y+C.H/C.sc/2);g.rotate(t*.6+vi*.785);g.fillRect(0,-3,900,6);g.restore()}
   var pg=g.createLinearGradient(vd2.x-hf,0,vd2.x+hf,0);pg.addColorStop(0,'rgba(255,255,255,0)');pg.addColorStop(.12,'rgba(255,255,255,.55)');pg.addColorStop(.88,'rgba(255,255,255,.55)');pg.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=pg;g.fillRect(vd2.x-hf,vy0,hf*2,vh);
   g.strokeStyle='rgba(255,255,255,.95)';g.lineWidth=3;g.beginPath();g.moveTo(vd2.x-hf,vy0);g.lineTo(vd2.x-hf,vy0+vh);g.moveTo(vd2.x+hf,vy0);g.lineTo(vd2.x+hf,vy0+vh);g.stroke();g.globalCompositeOperation='source-over';
   g.textAlign='center';g.font='900 30px "Noto Sans SC",sans-serif';g.fillStyle='#fff';g.shadowColor='#fff';g.shadowBlur=14;g.fillText('及格线',vd2.x,cam.y+120);g.shadowBlur=0;
   g.save();g.translate(vd2.x-hf-170,cam.y+C.H/C.sc*.5);g.rotate(-.14);g.strokeStyle='rgba(255,58,74,'+(.35+.5*u3)+')';g.lineWidth=8;g.strokeRect(-130,-62,260,124);g.fillStyle='rgba(255,58,74,'+(.4+.5*u3)+')';g.font='900 78px "Noto Sans SC",sans-serif';g.fillText('不及格',0,26);g.restore();
   g.font='900 '+Math.round(60+u3*30)+'px sans-serif';g.fillStyle='rgba(255,255,255,'+(.25+.5*u3)+')';g.fillText(String(Math.max(1,Math.ceil(vd2.tele))),vd2.x+hf+160,cam.y+C.H/C.sc*.5+20)}
  else{var a3=clamp(vd2.act/.9,0,1);g.globalCompositeOperation='lighter';g.fillStyle='rgba(255,255,255,'+a3*.8+')';g.fillRect(vx0,vy0,vw,vh);g.fillStyle='rgba(255,40,60,'+a3*.5+')';g.fillRect(vx0,vy0,vd2.x-hf-vx0,vh);g.fillRect(vd2.x+hf,vy0,vx0+vw-vd2.x-hf,vh);
   g.strokeStyle='rgba(255,255,255,'+a3+')';g.lineWidth=40*a3;g.beginPath();g.moveTo(vx0,vy0);g.lineTo(vx0+vw,vy0+vh);g.moveTo(vx0+vw,vy0);g.lineTo(vx0,vy0+vh);g.stroke()}
  g.restore()}
 /* 批改章：地上收缩的红圈，落下去是一枚巨大的“驳回”印 */
 k.stamps.forEach(function(sm){g.save();g.translate(sm.x,sm.y);
  if(!sm.fired){var u=1-clamp(sm.tele/1.2,0,1),bl=Math.sin(t*30)>0?1:.65;g.scale(1,.34);g.strokeStyle='rgba(255,58,74,'+(.4+u*.5)*bl+')';g.lineWidth=3+u*4;g.beginPath();g.arc(0,0,sm.R*(1.5-u*.5),0,6.2832);g.stroke();g.setLineDash([10,9]);g.lineDashOffset=t*50;g.beginPath();g.arc(0,0,sm.R,0,6.2832);g.stroke();g.setLineDash([]);g.fillStyle='rgba(255,58,74,'+.1*u*bl+')';g.beginPath();g.arc(0,0,sm.R,0,6.2832);g.fill()}
  else{var a=clamp(sm.act*2.2,0,1);g.globalAlpha=a;g.save();g.scale(1,.34);g.fillStyle='rgba(255,255,255,.55)';g.beginPath();g.arc(0,0,sm.R,0,6.2832);g.fill();g.restore();
   g.rotate(sm.ang);g.translate(0,-70);g.strokeStyle='#ff3a4a';g.lineWidth=9;g.beginPath();g.roundRect(-92,-42,184,84,10);g.stroke();g.lineWidth=3;g.beginPath();g.roundRect(-82,-32,164,64,6);g.stroke();
   g.fillStyle='#ff3a4a';g.textAlign='center';g.textBaseline='middle';g.font='900 58px "Noto Sans SC",sans-serif';g.shadowColor='rgba(255,40,60,.9)';g.shadowBlur=18;g.fillText('驳回',0,2)}
  g.restore()});
 /* 泡沫（NPC 化作的） */
 (k.bub||[]).forEach(function(q){var u=q.t/q.life,rr=q.r*(1+u*.25);g.save();g.globalAlpha=1-u*u*.6;var bg=g.createRadialGradient(q.x-rr*.3,q.y-rr*.3,rr*.1,q.x,q.y,rr);bg.addColorStop(0,'rgba(255,255,255,.55)');bg.addColorStop(.7,'rgba(180,225,255,.12)');bg.addColorStop(1,'rgba(150,210,255,.3)');g.fillStyle=bg;g.beginPath();g.arc(q.x,q.y,rr,0,6.2832);g.fill();g.strokeStyle='rgba(210,240,255,.85)';g.lineWidth=1.4;g.stroke();g.fillStyle='rgba(255,255,255,.9)';g.beginPath();g.ellipse(q.x-rr*.35,q.y-rr*.4,rr*.22,rr*.12,-.6,0,6.2832);g.fill();g.restore()});
 /* 冲击波 */
 k.rings.forEach(function(q){var u=q.t/q.life,e=1-Math.pow(1-u,3);g.save();g.globalCompositeOperation='lighter';g.strokeStyle='rgba('+q.col+','+(1-u)*.9+')';g.lineWidth=2+10*(1-u);g.beginPath();g.arc(q.x,q.y,q.r*e,0,6.2832);g.stroke();g.strokeStyle='rgba('+q.col+','+(1-u)*.35+')';g.lineWidth=16*(1-u);g.beginPath();g.arc(q.x,q.y,q.r*e*.9,0,6.2832);g.stroke();g.restore()})}

/* 红笔批注（裂纹、红叉）：按可见地块表面铺，纯装饰 */
function hash(n){var s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s)}
function drawMarks(g,t){var r=C.R,cam=C.cam,x0=Math.max(0,Math.floor((cam.x-40)/T)),x1=Math.min(r.cw-1,Math.ceil((cam.x+C.W/C.sc+40)/T)),y,x;
 g.save();g.lineCap='round';
 for(y=Math.max(1,Math.floor(cam.y/T)-1);y<Math.min(r.ch,Math.ceil((cam.y+C.H/C.sc)/T)+1);y++)for(x=x0;x<=x1;x++){var v=r.cells[y][x];if(v!==1&&v!==2)continue;if(r.cells[y-1]&&(r.cells[y-1][x]===1||r.cells[y-1][x]===2))continue;
  var h=hash(x*7.3+y*13.1);
  if(h<.22){g.strokeStyle='rgba(30,10,18,.75)';g.lineWidth=2;g.beginPath();g.moveTo(x*T+8,y*T+2);g.lineTo(x*T+14+h*20,y*T+10);g.lineTo(x*T+10+h*10,y*T+19);g.stroke()}
  else if(h>.9){g.strokeStyle='rgba(255,58,74,.85)';g.lineWidth=3;var cx=x*T+16,cy=y*T-10;g.beginPath();g.moveTo(cx-7,cy-7);g.lineTo(cx+7,cy+7);g.moveTo(cx-7,cy+7);g.lineTo(cx+7,cy-7);g.stroke()}}
 g.restore()}

/* 屏幕层：开场的黑边 / 字幕 / 劈开屏幕，以及战斗中的字幕 */
var snap=null;
function knScreen(g,W,H,t){var r=C.R,k=r.kn,b=r.boss;if(!b)return;
 var cn=k.cine;
 if(!cn&&b.started&&!b.dead){var vp=.18+b.phase*.1+(b.state==='wind'?.12:0),vg=g.createRadialGradient(W/2,H/2,Math.min(W,H)*.45,W/2,H/2,Math.max(W,H)*.75);vg.addColorStop(0,'rgba(80,0,10,0)');vg.addColorStop(1,'rgba(80,0,14,'+vp+')');g.fillStyle=vg;g.fillRect(0,0,W,H)}
 if(cn){var s=Math.min(1,cn.t/.6),bar=H*.12*s;g.fillStyle='#000';g.fillRect(0,0,W,bar);g.fillRect(0,H-bar,W,bar);
  if(!cn.short){var dark=clamp(cn.t/2.2,0,1)*.38;g.fillStyle='rgba(10,2,10,'+dark+')';g.fillRect(0,0,W,H);
   if(cn.t>5.6&&cn.t<6.1){g.save();g.globalCompositeOperation='saturation';g.fillStyle='#808080';g.fillRect(0,0,W,H);g.restore()}}}
 /* 开场那一刀：不劈开屏幕，而是一道横贯画面的斩光 + 冲击波 + 放射线 */
 var sp=k.split;if(sp){var st=sp.t,ang=sp.ang,L=Math.hypot(W,H)*1.1,cx=W/2,cy=H/2,reach=clamp(st/.1,0,1),fade=Math.max(0,1-st/.95);
  g.save();g.translate(cx,cy);g.rotate(ang);g.globalCompositeOperation='lighter';g.lineCap='round';
  var fx=-L+reach*2*L;
  g.strokeStyle='rgba(255,40,60,'+.35*fade+')';g.lineWidth=150*fade+10;g.beginPath();g.moveTo(-L,0);g.lineTo(fx,0);g.stroke();
  g.strokeStyle='rgba(255,110,120,'+.75*fade+')';g.lineWidth=46*fade+4;g.stroke();
  g.strokeStyle='rgba(255,255,255,'+fade+')';g.lineWidth=14*fade+2;g.stroke();
  for(var i=0;i<26;i++){var u=(i*.1337)%1,px=-L+u*2*L;if(px>fx)continue;var d=((st*2.2+i*.31)%1),off=(hash(i)-.5)*2*d*160*(i%2?1:-1);g.fillStyle='rgba(255,'+(150+hash(i+3)*100|0)+',140,'+(1-d)*fade+')';g.fillRect(px,off,3+hash(i+7)*5,2)}
  g.restore();
  g.save();g.globalCompositeOperation='lighter';g.strokeStyle='rgba(255,230,230,'+.55*Math.max(0,1-st/.6)+')';g.lineWidth=2;for(var j=0;j<34;j++){var a2=j/34*6.2832+hash(j)*.2,r0=Math.min(W,H)*(.18+st*.9),r1=r0+Math.min(W,H)*(.25+hash(j+5)*.4);g.beginPath();g.moveTo(cx+Math.cos(a2)*r0,cy+Math.sin(a2)*r0);g.lineTo(cx+Math.cos(a2)*r1,cy+Math.sin(a2)*r1);g.stroke()}
  var rr=st*Math.max(W,H)*1.5;g.strokeStyle='rgba(255,90,100,'+Math.max(0,1-st/.8)*.8+')';g.lineWidth=18*Math.max(0,1-st/.8)+1;g.beginPath();g.arc(cx,cy,rr,0,6.2832);g.stroke();g.restore();
  if(st>1)k.split=null}
 /* 字幕 */
 if(k.capT>0&&k.cap){var a=Math.min(1,k.capT*2);g.save();g.globalAlpha=a;g.textAlign='center';g.font='900 '+Math.round(Math.min(34,W*.052))+'px "Noto Sans SC",sans-serif';g.lineWidth=6;g.strokeStyle='rgba(20,4,10,.9)';g.strokeText(k.cap,W/2,H*(cn?.84:.2));g.fillStyle=cn?'#fff':'#ff6a6a';g.fillText(k.cap,W/2,H*(cn?.84:.2));g.restore()}
 /* 阶段切换时的红叉 */
 if(b.state==='phase'){g.save();g.globalAlpha=.3+.2*Math.sin(t*20);g.strokeStyle='#ff3a4a';g.lineWidth=14;g.beginPath();g.moveTo(0,0);g.lineTo(W,H);g.moveTo(W,0);g.lineTo(0,H);g.stroke();g.restore()}}

return {onPlayerDeath:onPlayerDeath,debugAtk:function(a){var b=C.R.boss;b.phase=2;b.lastAtk='';var l=KN_ATK;KN_ATK=[[a],[a],[a]];b.state='run';b.timer=0;setTimeout(function(){KN_ATK=l},400)},cleanup:cleanupFx,resetRoom:resetRoom,attach:attach,build:build,initEnemy:initEnemy,update:update,drawWorld:drawWorld,drawScreen:drawScreen,AI:AI,initBoss:initBoss,bossStep:bossStep,hitBoss:hitBoss,onDeath:onDeath,ruinTheme:ruinTheme}
})();

/* 战斗后的「破败」主题：天空发黑发红，地面灰败，红笔的颜色是唯一的亮色 */
if(window.L15&&L15.registerThemes)L15.registerThemes({t_ruin:{name:'破败的夕阳',base:'dawn',sky:['#14080f','#8a2a26'],far:'#3a1a24',mid:'#2a141e',top:'#a89690',body:'#4a3a3e',dark:'#201418',accent:'#ff4a5a',glow:'#ff5a4a',music:'Black Knife',bossMusic:'Black Knife',bpm:150,weather:'dawn',wx:{n:70,c:'#c8b8b0',vy:46,vx:-26,r:2,glow:0}}});
