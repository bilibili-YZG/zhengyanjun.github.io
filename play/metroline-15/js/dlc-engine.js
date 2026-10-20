/* DLC 引擎扩展 · 未竟之梦
   game.js 在关键位置调用 window.DLCX 的钩子（build / initEnemy / ENEMY / update / drawWorld …），
   这里实现 DLC 的全部玩法：蓝色碎片、物理机关、新敌人、物理答题终端、三阶段 Boss「悖论」。
   物理知识点都藏在玩法里：抛体、摆锤、摩擦与惯性、动量、电磁阻尼、万有引力、势能…… */
window.DLCX=(function(){
var C=null,T=32,G_PEND=900,G_SHELL=700;
function attach(core){C=core;T=core.T}
function rnd(a,b){return a+Math.random()*(b-a)}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function cnt(n,v){var m=C.meta();if(m&&m.cnt)m.cnt(n,v)}

/* ==================== 构建 ==================== */
var ENEMY_KINDS={drone:1,probe:1,sentinel:1,wraith:1,anomaly:1};
function build(r,d,kind,gs){
 if(!C)return false;
 switch(kind){
 case'blueshard':case'yellowshard':d.got=!!(gs&&gs[d.id]);r.xblue.push(d);r.xthings.push(d);return true;
 case'emfield':case'gravwell':(r.fields=r.fields||[]).push(d);r.xthings.push(d);return true;
 case'plasma':case'voltarc':case'cryotrap':d.active=false;d.warn=false;(r.xhaz=r.xhaz||[]).push(d);r.xthings.push(d);return true}
 if(ENEMY_KINDS[kind]){r.enemyDefs.push(d);return true}
 return false}
function initEnemy(e,d){
 var k=e.kind,rng=(d.p.range||5)*T;
 if(k==='drone'){e.hp=d.p.hp||2;e.timer=1.6;e.charge=0}
 else if(k==='probe'){e.hp=d.p.hp||2;e.vx=0;e.vy=0}
 else if(k==='sentinel'){e.hp=d.p.hp||4;e.min=d.x-rng/2;e.max=d.x+rng/2;e.vx=d.p.speed||30;e.face=1;e.timer=2.4;e.charge=0}
 else if(k==='wraith'){e.hp=d.p.hp||3;e.alpha=.8}
 else if(k==='anomaly'){e.hp=d.p.hp||3;e.timer=2;e.blink=0;e.tx=d.x;e.ty=d.y}}

/* ==================== 敌人 AI ==================== */
function aimShot(e,c,sp,col,r){var a=Math.atan2(c.pcy-c.ecy,c.pcx-c.ecx);C.shoot(c.ecx,c.ecy,Math.cos(a)*sp,Math.sin(a)*sp,{col:col,r:r||7,life:3.2})}
var ENEMY={
 /* 监控无人机：巡逻→发现→悬停锁定→发射能量弹 */
 drone:function(e,dt,c){var rg=(e.p.range||6)*T;
  if(c.dist<rg+120){var tx=c.pcx-(c.dx>0?1:-1)*170-e.w/2,ty=c.pcy-100-e.h/2;e.x+=(tx-e.x)*Math.min(1,dt*1.5);e.y+=(ty-e.y)*Math.min(1,dt*1.5);e.face=c.dx>0?1:-1;
   if(e.charge>0){e.charge-=dt;if(e.charge<=0){aimShot(e,c,250,'#7da8ff',7);C.emit(c.ecx,c.ecy,'#7da8ff',6,120,.3);e.timer=2.2}}
   else{e.timer-=dt;if(e.timer<=0)e.charge=.55}}
  else{e.charge=0;var px=e.hx+Math.sin(e.t*.8)*rg/2-e.x,py=e.hy+Math.sin(e.t*1.7)*10-e.y;e.x+=px*Math.min(1,dt*1.4);e.y+=py*Math.min(1,dt*1.4);e.face=px>0?1:-1}},
 /* 探测球：牛顿第二定律——受力指向你，加速度就指向你；有惯性，会冲过头再绕回来 */
 probe:function(e,dt,c){var tx=c.dist<420?c.pcx:e.hx+e.w/2,ty=c.dist<420?c.pcy:e.hy+e.h/2,dx=tx-c.ecx,dy=ty-c.ecy,d=Math.hypot(dx,dy)||1,a=c.dist<420?190:110;
  e.vx+=dx/d*a*dt;e.vy+=dy/d*a*dt;var damp=Math.pow(.55,dt);e.vx*=damp;e.vy*=damp;var sp=Math.hypot(e.vx,e.vy);if(sp>150){e.vx*=150/sp;e.vy*=150/sp}
  e.x+=e.vx*dt;e.y+=e.vy*dt;e.rot=(e.rot||0)+e.vx*dt*.04},
 /* 哨兵：慢，但装甲厚；站定后连发三枚扇形炮弹 */
 sentinel:function(e,dt,c){e.face=c.dx>0?1:-1;
  if(e.charge>0){e.charge-=dt;if(e.charge<=0){var a0=Math.atan2(c.pcy-c.ecy,c.pcx-c.ecx);for(var i=-1;i<=1;i++)C.shoot(c.ecx,c.ecy-6,Math.cos(a0+i*.22)*190,Math.sin(a0+i*.22)*190,{col:'#6d8aff',r:9,life:3.4});C.shake(3);e.timer=3}}
  else{e.timer-=dt;if(c.dist<(e.p.range||7)*T+160&&e.timer<=0){e.charge=.8;e.vx=0}
   else{var nx=e.x+e.vx*dt,ah=e.vx>0?nx+e.w+2:nx-2;if(nx<e.min||nx>e.max||!C.groundAt(ah,e.y+e.h+4)||C.solidAt(ah,e.y+e.h-6))e.vx=-e.vx;else e.x=nx}}},
 /* 冰霜怨灵：被注视就变淡变慢（像观测影响粒子），转身就扑来；触碰会冻结 */
 wraith:function(e,dt,c){var p=C.P,looked=(p.face>0&&c.dx<0)||(p.face<0&&c.dx>0);
  if(looked&&c.dist<400){e.alpha+=(.3-e.alpha)*Math.min(1,dt*6)}
  else{e.alpha+=(.85-e.alpha)*Math.min(1,dt*4);if(c.dist<460&&c.dist>4){e.x+=c.dx/c.dist*78*dt;e.y+=c.dy/c.dist*78*dt}}
  if(Math.random()<.35)C.emit(c.ecx+rnd(-10,10),c.ecy+rnd(0,14),'#bfefff',1,30,.7,-20)},
 /* 异常体：量子隧穿——预警后瞬移，落点再向四周弹出能量球 */
 anomaly:function(e,dt,c){
  if(e.blink>0){e.blink-=dt;e.flash=Math.max(e.flash,.05);if(e.blink<=0){C.emit(c.ecx,c.ecy,'#ff6dff',14,200);e.x=e.tx;e.y=e.ty;C.emit(e.x+e.w/2,e.y+e.h/2,'#ff6dff',18,240);
    for(var i=0;i<4;i++){var a=Math.PI/4+i*Math.PI/2;C.shoot(e.x+e.w/2,e.y+e.h/2,Math.cos(a)*170,Math.sin(a)*170,{col:'#ff6dff',r:7,life:2.2})}e.timer=2.2}}
  else{e.timer-=dt;e.x+=Math.sin(e.t*3)*10*dt;e.y+=Math.cos(e.t*2.3)*14*dt;
   if(e.timer<=0&&c.dist<520){for(var tries=0;tries<8;tries++){var nx=e.hx+rnd(-4,4)*T,ny=e.hy+rnd(-2,2)*T;if(!C.solidAt(nx+e.w/2,ny+e.h/2)){e.tx=nx;e.ty=ny;e.blink=.6;break}}if(e.blink<=0)e.timer=.6}}}
};

/* ==================== 房间级更新：机关 / 拾取 / 场效应 ==================== */
function srcOff(r,d){var s=r.src[d.id];if(!s||!s.length)return false;return s.every(function(id){var o=r.byId[id];return !!o&&(o.kind==='switch'?o.on:o.kind==='plate'?(o.on||o.hold>0):!!o.solved)})}
function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function freeze(p,t){if(p.fcd>0||p.frozen>0)return;p.frozen=t;p.fcd=t+1.6;C.toast('❄ 被冻结了！（低温下分子热运动几乎停滞）',1400);C.emit(p.x+p.w/2,p.y+p.h/2,'#bfefff',16,160)}
function update(dt){
 if(!C)return;var r=C.R,p=C.P;if(!r||!p)return;
 p.slowF=1;p.gravS=1;p.ax=0;p.fcd=Math.max(0,(p.fcd||0)-dt);
 var tm=C.time,pr={x:p.x+3,y:p.y+4,w:p.w-6,h:p.h-6},hurtOK=p.inv<=0&&p.dash<=0,i;
 if(C.inDLC&&r.biome==='chaos')cnt('chaosTime',dt);
 /* 场：电磁场（电磁阻尼：运动越快阻力越大）、重力井（万有引力：重力变大并拉向中心） */
 (r.fields||[]).forEach(function(d){if(!overlap(pr,d))return;
  if(d.kind==='emfield'){p.slowF=Math.min(p.slowF,d.p.strength||.5);p.vx*=Math.pow(.35,dt);if(Math.random()<.2)C.emit(p.x+p.w/2,p.y+p.h/2,'#7dcfff',1,40,.5,0)}
  else{p.gravS=Math.max(p.gravS,d.p.strength||1.4);p.ax+=((d.x+d.w/2)-(p.x+p.w/2))*2.4;if(Math.random()<.25)C.emit(p.x+p.w/2,p.y+p.h/2,'#9c6fff',1,50,.6,0)}});
 /* 周期性危险物：等离子体 / 电弧 / 低温陷阱（连了开关就被“断电”） */
 (r.xhaz||[]).forEach(function(d){var off=srcOff(r,d),per=d.p.period||(d.kind==='plasma'?2.5:d.kind==='voltarc'?2.8:4),f=((tm+(d.p.phase||0)*per)%per)/per;
  if(d.kind==='plasma'){d.active=!off&&f>=.35&&f<=.72;d.warn=!off&&f>=.2&&f<.35}
  else if(d.kind==='voltarc'){d.active=!off&&f<.3;d.warn=!off&&f>.78}
  else{d.active=!off&&f>=.25&&f<=.58;d.warn=!off&&f>=.1&&f<.25}
  d.off=off;
  if(!d.active)return;
  var box=d.kind==='voltarc'?{x:d.x+d.w/2-8,y:d.y+4,w:16,h:d.h-8}:{x:d.x+6,y:d.y+6,w:d.w-12,h:d.h-8};
  if(overlap(pr,box)){if(d.kind==='cryotrap')freeze(p,.8);else if(hurtOK){C.damagePlayer(1,{dir:p.face});hurtOK=false}}
  if(d.kind==='voltarc'&&Math.random()<.4)C.emit(d.x+d.w/2+rnd(-6,6),d.y+rnd(0,d.h),'#fff6a0',1,80,.25,0)});
 /* 蓝色碎片 */
 var cx=p.x+p.w/2,cy=p.y+p.h/2;
 r.xblue.forEach(function(d){if(!d.got&&Math.abs(cx-(d.x+d.w/2))<28&&Math.abs(cy-(d.y+d.h/2))<32){d.got=true;C.collectBlue(d)}});
 /* 冰霜怨灵触碰：冻结 */
 r.enemies.forEach(function(e){if(e.kind==='wraith'&&!e.dead&&overlap(pr,{x:e.x+8,y:e.y+8,w:e.w-16,h:e.h-16}))freeze(p,.7)});
 if(r.dx)updateBossRoom(r,p,dt)}

/* ==================== 物理答题终端 ====================
   对话写法：Q#题目#选项A#选项B#选项C#答案(1/2/3)#解析#提示(可省略)
   答对 → 该终端/NPC 视为“已接通”，可作为连线源去打开闸门 */
function isQuiz(s){return typeof s==='string'&&s.indexOf('Q#')===0}
var quizEl=null,quizObj=null,quizKey=null;
function ensureQuiz(){if(quizEl)return quizEl;quizEl=document.createElement('div');quizEl.id='quizBox';quizEl.className='quiz-box hidden';
 quizEl.innerHTML='<div class="quiz-card"><div class="quiz-eye">物理小测 · 答对才能通过</div><h3 id="quizQ"></h3><div id="quizOpts" class="quiz-opts"></div><p id="quizMsg" class="quiz-msg"></p><div class="quiz-foot"><button id="quizClose" class="btn">先不答了 (Esc)</button></div></div>';
 document.body.appendChild(quizEl);quizEl.querySelector('#quizClose').onclick=closeQuiz;return quizEl}
function closeQuiz(){if(!quizObj)return;quizObj=null;quizEl.classList.add('hidden');document.removeEventListener('keydown',quizKey,true);C.setState('play')}
function quiz(d){var parts=String(d.say).split('#');var q=parts[1],opts=[parts[2],parts[3],parts[4]],ans=+parts[5]||1,exp=parts[6]||'',hint=parts[7]||exp,el=ensureQuiz();
 if(d.solved){C.startDialog(C.parseDialog('已解答：'+exp,'sign'),null);return}
 quizObj=d;C.setState('dialog');el.classList.remove('hidden');el.querySelector('#quizQ').textContent=q;var box=el.querySelector('#quizOpts'),msg=el.querySelector('#quizMsg');box.innerHTML='';msg.textContent='';msg.className='quiz-msg';
 opts.forEach(function(t,i){var b=document.createElement('button');b.className='btn quiz-opt';b.textContent=(i+1)+'. '+t;b.onclick=function(){pick(i+1)};box.appendChild(b)});
 function pick(n){if(!quizObj)return;if(n===ans){d.solved=true;var mq=C.meta();if(mq&&mq.seen&&mq.seen('q'+C.ci+'-'+C.li+'-'+d.id))cnt('quizOk');msg.className='quiz-msg ok';msg.textContent='✔ 回答正确！'+exp;Array.prototype.forEach.call(box.children,function(b){b.disabled=true});
   C.toast('✔ 答对了：机关接通',1800);C.emit(d.x+d.w/2,d.y,'#6db8ff',20,220);setTimeout(closeQuiz,2600)}
  else{cnt('quizWrong');msg.className='quiz-msg bad';msg.textContent='✘ 再想想。提示：'+hint}}
 quizKey=function(e){var k=e.key;if(k==='Escape'){e.preventDefault();e.stopPropagation();closeQuiz()}else if(k==='1'||k==='2'||k==='3'){e.preventDefault();e.stopPropagation();pick(+k)}else if(k===' '||k==='Enter'){e.preventDefault();e.stopPropagation()}};
 document.addEventListener('keydown',quizKey,true)}
function onTalk(n){cnt(n.kind)}
function leaveRoom(){if(quizObj)closeQuiz()}

/* ==================== 悖论 Boss ====================
   形态一「力的平衡」：静止的竞技场。抛体、摆锤、摩擦滑行（惯性）。
   形态二「动量」：向右狂奔，身后是错题洪流。把对方的动量球用教鞭“反向冲量”打回去。
   形态三「势能」：一路向上，脚下是不断上涨的熵增之渊。重力势能 mgh——高度就是安全。 */
var PH_NAME=['形态一 · 力的平衡','形态二 · 动量守恒','形态三 · 势能与熵'];
var MUSIC=['boss','file:Final Boss Phase One 160','file:Final Boss Phase Three 96'];
function P_(b,k,def){return b.dp[k]!=null?b.dp[k]:def}
function initBoss(b,d){
 b.dp=d.p||{};b.hpP=[P_(b,'hp1',18),P_(b,'hp2',8),P_(b,'hp3',10)];b.max=b.hpP[0]+b.hpP[1]+b.hpP[2];
 var dx=building&&building.dx||{phase:0};b.ph=dx.phase||0;b.cur=b.hpP[b.ph];
 b.hp=b.max;for(var i=0;i<b.ph;i++)b.hp-=b.hpP[i];b.state='wait';b.sub='idle';b.timer=1.2;b.t=0;b.inv=0;b.landed=false;b.hurt0=null;
 if(b.ph>0){b.started=true;b.state='fight';b.phaseStart=true}}
var building=null;
function resetRoom(r){
 if(!C)return;building=r;var bd=r.bossDef;
 if(!bd||!bd.p||bd.p.boss!=='paradox'){r.dx=null;return}
 if(!r.dx){r.cells=r.cells.map(function(row){return row.slice()});r.dx={phase:0,cells0:r.cells.map(function(row){return row.slice()})}}
 var dx=r.dx;dx.orbs=[];dx.pend=[];dx.boulders=[];dx.marks=[];dx.flood=null;dx.voidY=null;dx.runout=false;dx.stall=false;
 /* 地形随形态恢复：形态二开始后，竞技场右墙是打开的 */
 var p=bd.p,wall=[p.wall||50,(p.wall||50)+1],ys=[p.wy0||54,p.wy1||71],x,y;
 for(y=0;y<r.cells.length;y++)for(x=0;x<r.cells[y].length;x++)r.cells[y][x]=dx.cells0[y][x];
 if(dx.phase>=1)for(y=ys[0];y<=ys[1];y++)for(x=wall[0];x<=wall[1];x++)r.cells[y][x]=0;
 sealShaft(r,bd.p,dx.phase<2);
 if(r.tileCanvas&&C)C.rebake()}
/* 竖井入口封死：到形态三才开放，否则没打完形态二就能爬上去 */
function sealShaft(r,p,on){
 var x0=p.s0||152,x1=p.s1||172,by=(p.ceil||60)-1,x,y,dx=r.dx;if(!dx)return;
 for(y=by-1;y<=by;y++)for(x=x0;x<=x1;x++)if(r.cells[y]&&!dx.cells0[y][x]&&x<r.cells[y].length)r.cells[y][x]=on?1:0}

function startPhase(b,ph,fromDeath){
 var r=C.R,dx=r.dx,p=C.P,dp=b.dp,fy=(dp.floor||72)*T;b.ph=ph;dx.phase=ph;b.cur=b.hpP[ph];b.state='fight';b.sub='idle';b.timer=1.4;b.inv=1.2;b.landed=false;b.phaseStart=false;dx.orbs=[];dx.pend=[];dx.boulders=[];dx.marks=[];r.proj=[];
 if(ph===1){
  var wall=dp.wall||50,y,x;for(y=dp.wy0||54;y<=(dp.wy1||71);y++)for(x=wall;x<=wall+1;x++)r.cells[y][x]=0;C.rebake();
  dx.flood={x:Math.max(2*T,p.x-14*T),sp:98};dx.stall=false;dx.runout=false;
  if(!fromDeath){C.setCP(Math.max(p.x,3*T),p.y);}
  b.x=p.x+420;b.y=fy-b.h-4*T}
 else if(ph===2){
  sealShaft(r,dp,false);C.rebake();dx.flood=null;dx.voidY=(dp.sbot||76)*T;if(fromDeath)dx.voidY=p.y+p.h+14*T;dx.voidSp=52;dx.stall=false;
  if(!fromDeath)C.setCP(p.x,p.y);
  b.x=(dp.s0||152)*T+4*T;b.y=Math.max((dp.top||16)*T-2*T,p.y-9*T)}
 else{b.hpFix=1}
 var m=MUSIC[ph];if(window.AudioFX)AudioFX.play(m)}
function endPhase(b){
 var r=C.R,dx=r.dx,ph=b.ph;b.cur=0;r.proj=[];dx.orbs=[];dx.pend=[];dx.boulders=[];dx.marks=[];C.shake(10);C.flash(.5);window.AudioFX&&AudioFX.sfx('roar');
 if(ph===2){b.state='dying';b.deadT=.01;b.dyT=0;return}
 b.state='trans';b.inv=99;
 var lines=ph===0
  ?'悖论：力平衡了——可平衡，不等于前进。|我：合力为零，物体保持静止或匀速直线运动。静止不是答案，我要往前走！|悖论：那就跑吧。看你的动量，追不追得上我的问题。'
  :'悖论：跑得再快，也躲不过时间。|我：速度变大，动量就变大，可方向由我自己决定。|悖论：那就向上——看你的势能，能攒到多高。';
 C.startDialog(C.parseDialog(lines,'boss'),function(){
  if(ph===0)startPhase(b,1,false);
  else{ /* 形态二结束：必须真正跑到竖井入口才进入形态三 */
   b.state='runout';dx.runout=true;b.inv=99;if(dx.flood)dx.flood.sp=150;C.toast('悖论暂时退去——冲向右边的竖井！',2600)}})}
function dmgBoss(b,n){
 if(b.state!=='fight'||b.cur<=0||C.state!=='play')return false;b.cur-=n;b.hp-=n;b.flash=.32;C.hitstop(.07);C.shake(6);window.AudioFX&&AudioFX.sfx('hit');C.emit(b.x+b.w/2,b.y+b.h/2,'#ffd08a',22,260);
 if(b.cur<=0)endPhase(b);return true}
function hitBoss(b,n,viaDash){
 if(b.state!=='fight'||b.inv>0)return false;
 if(b.ph===0&&viaDash&&b.sub==='wind'){n+=1;b.sub='stun';b.timer=1.8;b.vx=0;C.toast('打断成功！冲量被抵消',1200)}
 if(b.ph===0&&b.sub==='stun')n*=1.5;
 return dmgBoss(b,n)}

function bossGroundY(b){return (b.dp.floor||72)*T}
function lobShell(b,tx,ty,Tf){var mx=b.x+b.w/2,my=b.y+b.h*.4,vx=(tx-mx)/Tf,vy=(ty-my)/Tf-.5*G_SHELL*Tf;
 C.R.dx.orbs.push({k:'shell',x:mx,y:my,vx:vx,vy:vy,g:G_SHELL,r:11,life:Tf+.6,tx:tx,ty:ty});C.R.dx.marks.push({x:tx,y:ty,t:Tf,max:Tf})}
function floorBelow(x,y){for(var yy=Math.floor(y/T);yy<C.R.ch;yy++)if(C.isSolid(C.cellAt(Math.floor(x/T),yy)))return yy*T;return C.R.h}
function spawnOrb(b,vx,vy,g){var dx=C.R.dx;dx.orbs.push({k:'orb',x:b.x+b.w/2,y:b.y+b.h/2,vx:vx,vy:vy,g:g||0,r:15,life:7,back:false})}
function spawnPend(px,py,L,th0){C.R.dx.pend.push({px:px,py:py,L:L,th:th0,w:0,age:0,warn:.7,life:6.5,r:20})}
function toastOnce(b,key,txt){b.said=b.said||{};if(!b.said[key]){b.said[key]=1;C.toast(txt,2800)}}

function updateBoss(b,dt){
 var r=C.R,p=C.P,dx=r.dx,dp=b.dp;if(!dx)return;b.t+=dt;
 if(b.state==='dying'){if(C.state!=='play'){return}p.inv=Math.max(p.inv,1);b.dyT=(b.dyT||0)+dt;C.shake(4);if(Math.random()<.5)C.emit(b.x+Math.random()*b.w,b.y+Math.random()*b.h,Math.random()<.5?'#fff':'#c070ff',3,220,.8);
  if(b.dyT>2.4){b.dead=true;b.deadT=0;dx.flood=null;dx.voidY=null;dx.orbs=[];C.bossDone();
   if(b.hurt0!=null&&C.hurtCount()===b.hurt0){var mm=C.meta();if(mm&&mm.perfect)mm.perfect()}
   C.emit(b.x+b.w/2,b.y+b.h/2,'#fff',60,380,1.2);window.AudioFX&&AudioFX.play(r.biome);
   C.startDialog(C.parseDialog('悖论：……原来，被回答的问题，是会消失的。|我：不是消失。是它们终于有了答案。|悖论：可你的问题还没问完吧？老师。|我：对。所以我才要继续教下去。|悖论：那……替我，把剩下的问题也问出口吧。|（悖论化作无数蓝色的光点，散入你的手心。）','boss'),function(){C.toast('出口已开启——走上竖井顶端的光门！',3200)})}return}
 if(!b.started){var trig=r.triggers.length&&r.triggers.every(function(t){return t.used});
  if((trig&&C.state==='play')||Math.abs((p.x+p.w/2)-(b.x+b.w/2))<(dp.wake||520)){b.started=true;b.state='fight';b.timer=1.4;b.hurt0=C.hurtCount();window.AudioFX&&AudioFX.sfx('roar');C.shake(10);C.toast('悖论 拦住了去路！',2400)}return}
 if(b.state==='wait'){b.state='fight';b.timer=1.4}if(b.hurt0==null)b.hurt0=C.hurtCount();
 if(b.phaseStart){b.phaseStart=false;if(b.ph>0)startPhase(b,b.ph,true)}
 b.inv=Math.max(0,b.inv-dt);
 var pcx=p.x+p.w/2,bcx=b.x+b.w/2;b.face=pcx<bcx?-1:1;
 if(b.state==='trans')return;
 if(b.state==='runout'){ /* 形态二结束后的冲刺段 */
  bossFollow(b,dt,(dp.s0||152)*T+8*T,(dp.floor||72)*T-b.h-5*T);
  if(p.x>(dp.s0||152)*T){dx.runout=false;dx.flood=null;b.state='fight';startPhase(b,2,false);C.toast('形态三：向上！别让「熵」追上你',2600)}return}
 if(b.ph===0)bossPhase0(b,dt,pcx,bcx);else if(b.ph===1)bossPhase1(b,dt,pcx);else bossPhase2(b,dt,pcx)}
function bossFollow(b,dt,tx,ty){b.x+=clamp(tx-b.x,-300*dt,300*dt);b.y+=(ty-b.y)*Math.min(1,dt*2.4)}

/* ---- 形态一：竞技场 ---- */
function bossPhase0(b,dt,pcx,bcx){
 var r=C.R,dx=r.dx,dp=b.dp,minX=(dp.a0||2)*T+T,maxX=(dp.a1||49)*T-b.w-T,fy=bossGroundY(b),p=C.P;
 b.y=fy-b.h;
 switch(b.sub){
 case'idle':b.timer-=dt*(1+(1-b.cur/b.hpP[0])*.4);var d=pcx-bcx;if(Math.abs(d)>260)b.x+=Math.sign(d)*70*dt;b.x=clamp(b.x,minX,maxX);
  if(b.timer<=0){var list=['lob','pend','slide'],pick=list[Math.floor(Math.random()*3)];if(pick===b.last)pick=list[(list.indexOf(pick)+1)%3];b.last=pick;b.atk=pick;b.sub='wind';b.timer=pick==='slide'?.9:.75;window.AudioFX&&AudioFX.sfx('switch')}break;
 case'wind':b.timer-=dt;if(b.atk==='slide'&&b.timer>.3)b.x-=b.face*28*dt; /* 蓄力：先向后蹬 */
  if(b.timer<=0){
   if(b.atk==='lob'){toastOnce(b,'lob','抛体运动：水平方向匀速，竖直方向自由落体');var e0=1-b.cur/b.hpP[0],n=3+(e0>.5?2:e0>.25?1:0),k;for(k=0;k<n;k++){var tx=clamp(pcx+(k-(n-1)/2)*70,T*3,r.w-T*3);lobShell(b,tx,floorBelow(tx,p.y),.95+k*.25)}b.sub='atk';b.timer=1.9}
   else if(b.atk==='pend'){toastOnce(b,'pend','单摆：周期只与摆长有关，T = 2π√(L/g)');var py=((dp.ceil||60))*T,L=Math.min(10*T,fy-py-1.2*T);var sg=Math.random()<.5?-1:1;spawnPend(clamp(pcx,minX+T,maxX),py,L,.95*sg);if(1-b.cur/b.hpP[0]>.4)spawnPend(clamp(pcx+sg*9*T,minX+T,maxX),py,L,-.95*sg);b.sub='atk';b.timer=2.4}
   else{toastOnce(b,'slide','摩擦力做功：μmg·s = ½mv²——冲得越快，滑得越远');b.vx=b.face*720;b.sub='atk';b.timer=3;window.AudioFX&&AudioFX.sfx('dash')}}break;
 case'atk':
  if(b.atk==='slide'){b.x+=b.vx*dt;b.vx=approach(b.vx,0,520*dt);if(Math.random()<.7)C.emit(b.vx>0?b.x:b.x+b.w,fy-6,'#c070ff',2,90,.4);
   if(b.x<=minX||b.x>=maxX){b.x=clamp(b.x,minX,maxX);if(Math.abs(b.vx)>200){C.shake(10);window.AudioFX&&AudioFX.sfx('boom');b.vx=0}}
   if(Math.abs(b.vx)<8){b.vx=0;b.sub='stun';b.timer=2;C.toast('它停下来了——趁现在！',1200)}}
  else{b.timer-=dt;if(b.timer<=0){b.sub='recover';b.timer=.8}}break;
 case'stun':b.timer-=dt;if(b.timer<=0){b.sub='idle';b.timer=.7}break;
 case'recover':b.timer-=dt;if(b.timer<=0){b.sub='idle';b.timer=1.2-(1-b.cur/b.hpP[0])*.4}break}}
function approach(v,t,d){return v<t?Math.min(t,v+d):Math.max(t,v-d)}

/* ---- 形态二：向右奔跑 ---- */
function bossPhase1(b,dt,pcx){
 var r=C.R,dx=r.dx,dp=b.dp,p=C.P,fy=bossGroundY(b),endX=(dp.c1||150)*T,fl=dx.flood;
 /* 洪流：越来越快；玩家逼近走廊尽头时洪流停下，进入终点战 */
 if(fl&&!dx.stall){fl.sp=Math.min(dx.runout?170:128,fl.sp+3.2*dt);fl.x+=fl.sp*dt}
 if(p.x>endX-12*T&&b.cur>0)dx.stall=true;
 if(fl&&p.x<fl.x+4&&p.inv<=0){C.damagePlayer(1,{dir:1});fl.x-=5*T;C.toast('错题洪流追上了你！向前跑，别回头',1400)}
 else if(fl&&p.x<fl.x+4){p.x=fl.x+6;if(p.vx<0)p.vx=0}
 var tx,ty;
 if(dx.stall){b.landed=true;tx=clamp(pcx+260-b.w/2,endX-14*T,endX-b.w-2*T);ty=fy-b.h}
 else{tx=clamp(p.x+430-b.w/2,(dp.c0||52)*T+10*T,endX-b.w-4*T);ty=fy-b.h-4.5*T+Math.sin(b.t*1.6)*22}
 b.x+=clamp(tx-b.x,-340*dt,340*dt);b.y+=(ty-b.y)*Math.min(1,dt*3);
 b.timer-=dt;
 if(b.timer<=0){var roll=Math.random();
  if(roll<.5||dx.stall){toastOnce(b,'orb','动量 p = mv：挥教鞭给球一个反向冲量，把它打回去！');
   var a=Math.atan2((p.y+p.h/2)-(b.y+b.h/2),pcx-(b.x+b.w/2));var sp1=dx.stall?165:215;spawnOrb(b,Math.cos(a)*sp1,Math.sin(a)*sp1-30,0);if(!dx.stall&&b.cur<b.hpP[1]*.5)spawnOrb(b,Math.cos(a+.28)*sp1,Math.sin(a+.28)*sp1-30,0);b.timer=dx.stall?1.3:1.6}
  else if(roll<.78){toastOnce(b,'boulder','滚动的巨石：速度大、质量大，动能 ½mv² 也大——跳过去');
   dx.boulders.push({x:b.x,y:fy-26,r:26,vx:-(200+Math.random()*60),vy:0,rot:0});b.timer=2.2}
  else{var tx2=clamp(pcx+rnd(-30,120),T*3,r.w-T*3);lobShell(b,tx2,floorBelow(tx2,p.y),1.1);lobShell(b,tx2+110,floorBelow(tx2+110,p.y),1.5);b.timer=2.0}}}

/* ---- 形态三：向上攀登 ---- */
function bossPhase2(b,dt,pcx){
 var r=C.R,dx=r.dx,dp=b.dp,p=C.P,topY=(dp.top||16)*T;
 if(dx.voidY!=null){
  if(p.y>topY+6*T)dx.voidY=Math.max(topY+8*T,dx.voidY-Math.min(70,dx.voidSp+b.t*.3)*dt);
  else dx.stall=true;
  if(!dx.stall)dx.voidY=Math.max(dx.voidY,topY+6*T);
  if(p.y+p.h>dx.voidY+2&&p.inv<=0){C.damagePlayer(1,{dir:p.face});p.vy=-760;dx.voidY+=6*T;C.toast('熵增之渊吞没了脚下——越高越安全',1400)}}
 var s0=(dp.s0||152)*T,s1=(dp.s1||172)*T,tx,ty;
 if(dx.stall){b.landed=true;tx=clamp(pcx+200-b.w/2,s0+T,s1-b.w);ty=topY-b.h}
 else{tx=clamp(pcx-b.w/2+Math.sin(b.t*.9)*220,s0+T,s1-b.w-T);ty=Math.max(topY-b.h+T,p.y-9*T)}
 b.x+=clamp(tx-b.x,-280*dt,280*dt);b.y+=(ty-b.y)*Math.min(1,dt*2.6);
 b.timer-=dt;
 if(b.timer<=0){
  if(dx.stall||Math.random()<.6){toastOnce(b,'orb2','重力势能 mgh：球落下时势能变动能——打回去，它会把动能还给对方');
   var a=Math.atan2((p.y+p.h/2)-(b.y+b.h/2),pcx-(b.x+b.w/2));spawnOrb(b,Math.cos(a)*145,Math.sin(a)*145,dx.stall?0:260);if(b.cur<b.hpP[2]*.5)spawnOrb(b,Math.cos(a-.3)*145,Math.sin(a-.3)*145,dx.stall?0:260);b.timer=dx.stall?1.3:1.5}
  else{toastOnce(b,'rain','自由落体：不计空气阻力，轻重物体同时落地');
   for(var i=0;i<6;i++){var x=clamp(pcx+rnd(-260,260),s0+T,s1-T);r.dx.orbs.push({k:'debris',x:x,y:Math.max(p.y-10*T,topY),vx:0,vy:60,g:900,r:12,life:5});r.dx.marks.push({x:x,y:floorBelow(x,p.y),t:.8,max:.8})}
   b.timer=1.8}}}

/* ---- 物体：动量球 / 炮弹 / 碎块 / 摆锤 / 滚石 / 预警 ---- */
function updateBossRoom(r,p,dt){
 var dx=r.dx,b=r.boss,pr={x:p.x+3,y:p.y+4,w:p.w-6,h:p.h-6},i;
 var slash=p.atk>.03&&p.atk<.22?{x:p.face>0?p.x+p.w-6:p.x-62,y:p.y-8,w:68,h:p.h+12}:null;
 for(i=dx.orbs.length-1;i>=0;i--){var o=dx.orbs[i],dead=false;if(!o)continue; /* 打回的球击杀形态时 endPhase 会清空 orbs */o.life-=dt;o.vy+=o.g*dt;o.x+=o.vx*dt;o.y+=o.vy*dt;o.spin=(o.spin||0)+dt*8;
  if(Math.random()<.4)C.emit(o.x,o.y,o.back?'#ffe27a':(o.k==='orb'?'#ff7ad9':'#c070ff'),1,40,.35,0);
  var box={x:o.x-o.r,y:o.y-o.r,w:o.r*2,h:o.r*2};
  if(o.back){if(b&&b.state==='fight'&&overlap(box,{x:b.x+b.w*.12,y:b.y+b.h*.1,w:b.w*.76,h:b.h*.8})){dmgBoss(b,1);cnt('orbReturn');dead=true;C.emit(o.x,o.y,'#ffe27a',20,280)}
   else if(o.life<=0||C.solidAt(o.x,o.y))dead=true}
  else{
   if(slash&&o.k!=='debris'&&overlap(slash,box)){ /* 反向冲量：把球送回去 */
    if(o.k==='orb'&&b){var a=Math.atan2((b.y+b.h/2)-o.y,(b.x+b.w/2)-o.x),sp=Math.max(420,Math.hypot(o.vx,o.vy)*1.8);o.vx=Math.cos(a)*sp;o.vy=Math.sin(a)*sp;o.g=0;o.back=true;o.life=3;C.hitstop(.05);window.AudioFX&&AudioFX.sfx('hit');C.emit(o.x,o.y,'#fff',14,260);cnt('deflects');toastOnce(b,'ret','冲量 Ft = Δp：方向反了，动量也反了！')}
    else{dead=true;C.emit(o.x,o.y,'#fff',12,220);cnt('deflects')}}
   else if(p.inv<=0&&p.dash<=0&&overlap(pr,box)){C.damagePlayer(1,{dir:o.vx>0?-1:1});dead=true;C.emit(o.x,o.y,'#ff7ad9',14,220)}
   else if(o.k==='shell'||o.k==='debris'){if(C.solidAt(o.x,o.y+o.r)||C.groundAt(o.x,o.y+o.r)&&o.vy>0){dead=true;C.shake(4);C.emit(o.x,o.y,'#c070ff',16,240);window.AudioFX&&AudioFX.sfx('boom');
     if(o.k==='shell'&&p.inv<=0&&p.dash<=0&&Math.hypot(p.x+p.w/2-o.x,p.y+p.h-o.y)<64){C.damagePlayer(1,{dir:p.x>o.x?1:-1})}}}
   else if(C.solidAt(o.x,o.y))dead=true;
   if(o.life<=0||o.y>r.h+80)dead=true}
  if(dead)dx.orbs.splice(i,1)}
 for(i=dx.pend.length-1;i>=0;i--){var q=dx.pend[i];q.age+=dt;
  if(q.warn>0){q.warn-=dt;continue}
  q.w+=-(G_PEND/q.L)*Math.sin(q.th)*dt;q.th+=q.w*dt;q.life-=dt;q.bx=q.px+q.L*Math.sin(q.th);q.by=q.py+q.L*Math.cos(q.th);
  if(p.inv<=0&&p.dash<=0&&overlap(pr,{x:q.bx-q.r,y:q.by-q.r,w:q.r*2,h:q.r*2}))C.damagePlayer(1,{dir:p.x>q.bx?1:-1});
  if(q.life<=0)dx.pend.splice(i,1)}
 for(i=dx.boulders.length-1;i>=0;i--){var u=dx.boulders[i];u.vy+=1800*dt;u.x+=u.vx*dt;u.y+=u.vy*dt;u.rot+=u.vx*dt/u.r;
  if(C.groundAt(u.x,u.y+u.r)&&u.vy>0){u.y=Math.floor((u.y+u.r)/T)*T-u.r;u.vy=0}
  var dd=false;if(C.isSolid(C.cellAt(Math.floor((u.x-u.r)/T),Math.floor(u.y/T)))){dd=true;C.emit(u.x,u.y,'#9a8a7b',16,220);C.shake(4)}
  if(p.inv<=0&&p.dash<=0&&Math.hypot(p.x+p.w/2-u.x,p.y+p.h/2-u.y)<u.r+12){C.damagePlayer(1,{dir:p.x>u.x?1:-1});dd=true;C.emit(u.x,u.y,'#9a8a7b',16,220)}
  if(u.y>r.h+60||u.x<C.cam.x-300)dd=true;if(dd)dx.boulders.splice(i,1)}
 for(i=dx.marks.length-1;i>=0;i--){dx.marks[i].t-=dt;if(dx.marks[i].t<=0)dx.marks.splice(i,1)}
 /* 背景音乐跟随形态（读档重来时保持当前形态的曲子） */
 if(b&&b.started&&!b.dead&&b.state!=='dying'){dx.mt=(dx.mt||0)-dt;if(dx.mt<=0){dx.mt=.8;var want=MUSIC[b.ph],id=want==='boss'?'f:'+L15.BOSS_MUSIC:'f:'+want.slice(5);if(window.AudioFX&&AudioFX.current()!==id)AudioFX.play(want)}}}

/* ==================== 渲染（世界坐标系内） ==================== */
function drawWorld(g,t){
 if(!C)return;var r=C.R;if(!r||!r.dx)return;var dx=r.dx,G=window.GFX,cam=C.cam,i;
 if(dx.flood){var fx=dx.flood.x,gr=g.createLinearGradient(fx-260,0,fx,0);gr.addColorStop(0,'rgba(40,10,70,0)');gr.addColorStop(.7,'rgba(70,20,110,.65)');gr.addColorStop(1,'rgba(150,60,210,.9)');g.fillStyle=gr;g.fillRect(fx-260,cam.y-40,260,r.h+80);
  g.fillStyle='#f4eef8';g.globalAlpha=.8;for(i=0;i<9;i++){var py=cam.y+((i*97+t*60)%700),px=fx-30-((i*53+t*140)%170);g.save();g.translate(px,py);g.rotate(Math.sin(t*3+i)*.4);g.fillRect(-14,-9,28,18);g.fillStyle='#d33';g.fillRect(-9,-2,14,3);g.fillStyle='#f4eef8';g.restore()}
  g.globalAlpha=1;g.strokeStyle='#e9b4ff';g.lineWidth=3;g.beginPath();for(var yy=cam.y-40;yy<cam.y+700;yy+=14){g.lineTo(fx+Math.sin(yy*.05+t*6)*7,yy)}g.stroke();G.glow(g,fx,cam.y+260,300,'#b070ff',.35)}
 if(dx.voidY!=null){var vy=dx.voidY,vg=g.createLinearGradient(0,vy-120,0,vy+40);vg.addColorStop(0,'rgba(60,20,110,0)');vg.addColorStop(1,'rgba(30,6,60,.96)');g.fillStyle=vg;g.fillRect(cam.x-40,vy-120,1200,160);g.fillStyle='#14041f';g.fillRect(cam.x-40,vy+40,1200,r.h);
  g.strokeStyle='#c890ff';g.lineWidth=3;g.beginPath();for(i=cam.x-40;i<cam.x+1000;i+=12){g.lineTo(i,vy+Math.sin(i*.04+t*4)*6)}g.stroke();
  g.fillStyle='#e9d4ff';g.font='bold 14px sans-serif';g.textAlign='center';g.globalAlpha=.7;for(i=0;i<6;i++){var sx=cam.x+((i*173+t*20)%760),sy=vy+16+((i*41)%60);g.fillText(['S↑','ΔS>0','熵','Q','无序','∞'][i],sx,sy)}g.globalAlpha=1}
 dx.marks.forEach(function(m){var k=1-m.t/m.max;g.strokeStyle='rgba(255,90,120,'+(.35+Math.sin(t*30)*.2)+')';g.lineWidth=3;g.beginPath();g.ellipse(m.x,m.y,52*(.4+k*.6),9,0,0,6.3);g.stroke();g.fillStyle='rgba(255,70,100,'+(.1+k*.25)+')';g.fill()});
 dx.pend.forEach(function(q){var ox=q.px,oy=q.py;g.strokeStyle='rgba(255,226,122,'+(q.warn>0?.4+Math.sin(t*30)*.3:.9)+')';g.lineWidth=q.warn>0?2:4;
  if(q.warn>0){g.setLineDash([6,8]);g.beginPath();g.moveTo(ox,oy);g.lineTo(ox+q.L*Math.sin(q.th),oy+q.L*Math.cos(q.th));g.stroke();g.setLineDash([]);return}
  g.beginPath();g.moveTo(ox,oy);g.lineTo(q.bx,q.by);g.stroke();g.fillStyle='#3a2f4f';g.beginPath();g.arc(ox,oy,7,0,6.3);g.fill();g.fillStyle='#ffe27a';g.beginPath();g.arc(q.bx,q.by,q.r,0,6.3);g.fill();g.fillStyle='#fff6c0';g.beginPath();g.arc(q.bx-6,q.by-6,6,0,6.3);g.fill();G.glow(g,q.bx,q.by,52,'#ffd060',.6)});
 dx.boulders.forEach(function(u){g.save();g.translate(u.x,u.y);g.rotate(u.rot);g.fillStyle='#7a6f66';g.beginPath();g.arc(0,0,u.r,0,6.3);g.fill();g.strokeStyle='#3e3734';g.lineWidth=3;g.beginPath();g.moveTo(-u.r*.6,-4);g.lineTo(u.r*.2,u.r*.5);g.moveTo(u.r*.1,-u.r*.7);g.lineTo(u.r*.5,u.r*.1);g.stroke();g.fillStyle='#a79a8c';g.beginPath();g.arc(-u.r*.3,-u.r*.3,u.r*.28,0,6.3);g.fill();g.restore()});
 dx.orbs.forEach(function(o){var col=o.back?'#ffe27a':(o.k==='orb'?'#ff7ad9':o.k==='shell'?'#c070ff':'#9fb0ff');G.glow(g,o.x,o.y,o.r*3.4,col,.6);g.save();g.translate(o.x,o.y);g.rotate(o.spin||0);g.fillStyle=col;g.beginPath();
  if(o.k==='debris'){g.moveTo(-o.r,o.r*.6);g.lineTo(-o.r*.3,-o.r);g.lineTo(o.r,-o.r*.2);g.lineTo(o.r*.6,o.r);g.closePath()}else g.arc(0,0,o.r,0,6.3);g.fill();
  g.fillStyle='#fff';g.globalAlpha=.8;g.beginPath();g.arc(-o.r*.28,-o.r*.28,o.r*.3,0,6.3);g.fill();g.globalAlpha=1;
  if(o.k==='orb'){g.fillStyle='#4a1040';g.font='bold '+Math.round(o.r*.95)+'px sans-serif';g.textAlign='center';g.fillText('p',0,o.r*.33)}g.restore()})}

function drawScreen(g,W,H,t){
 if(!C)return;var p=C.P;if(p&&p.frozen>0){g.fillStyle='rgba(150,220,255,'+Math.min(.35,p.frozen*.5)+')';g.fillRect(0,0,W,H);g.strokeStyle='rgba(220,245,255,.5)';g.lineWidth=6;g.strokeRect(6,6,W-12,H-12)}
 if(p&&p.gravS>1.05){g.fillStyle='rgba(120,70,200,.12)';g.fillRect(0,0,W,H)}
 if(p&&p.slowF<.99){g.fillStyle='rgba(80,170,255,.09)';g.fillRect(0,0,W,H)}}

function drawBossHud(g,b,W,H){
 var touch=document.body.classList.contains('touch'),bw=Math.min(580,W*.72),bx=(W-bw)/2,by=H-(touch?Math.min(200,H*.32):58),tot=b.hpP[0]+b.hpP[1]+b.hpP[2],x=bx,i;
 g.fillStyle='rgba(6,14,24,.78)';g.beginPath();g.roundRect(bx-12,by-30,bw+24,50,12);g.fill();
 g.fillStyle='#f3e4ff';g.font='bold 13px "Noto Sans SC",sans-serif';g.textAlign='left';g.fillText('悖论',bx,by-12);g.textAlign='right';g.fillStyle='#d9b0ff';g.fillText(PH_NAME[b.ph]+(b.state==='runout'?'（冲向竖井！）':''),bx+bw,by-12);
 for(i=0;i<3;i++){var w=(bw-12)*b.hpP[i]/tot,fill=i<b.ph?0:i===b.ph?Math.max(0,b.cur/b.hpP[i]):1;
  g.fillStyle='#2a1838';g.beginPath();g.roundRect(x,by,w,10,5);g.fill();
  if(fill>0){g.fillStyle=b.flash>0&&i===b.ph?'#fff':['#c070ff','#ff7ad9','#ffd060'][i];g.beginPath();g.roundRect(x,by,Math.max(2,w*fill),10,5);g.fill()}
  x+=w+6}
 g.textAlign='start'}

return {attach:attach,build:build,initEnemy:initEnemy,ENEMY:ENEMY,update:update,isQuiz:isQuiz,quiz:quiz,onTalk:onTalk,leaveRoom:leaveRoom,
 initBoss:initBoss,resetRoom:resetRoom,updateBoss:updateBoss,hitBoss:hitBoss,drawWorld:drawWorld,drawScreen:drawScreen,drawBossHud:drawBossHud,PH_NAME:PH_NAME,debugPhase:function(ph){var b=C.R.boss;b.started=true;b.state='fight';b.hurt0=C.hurtCount();startPhase(b,ph,false)}};
})();
