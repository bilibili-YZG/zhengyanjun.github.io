/* 15号线大冒险 · 引擎。固定 60Hz 物理 + 任意刷新率渲染；触屏/键盘/手柄；程序化动画、音效与贴图。 */
(function(){'use strict';
var T=32,$=function(id){return document.getElementById(id)};
var canvas=$('game'),g=canvas.getContext('2d');
var LS={get:function(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},del:function(k){try{localStorage.removeItem(k)}catch(e){}}};
var params=new URLSearchParams(location.search),TEST=params.get('test')==='1';
var prefs=Object.assign({mute:false,size:2,controls:'auto'},LS.get(L15.STORAGE.prefs)||{});
if(prefs.controls==='on')prefs.controls='split';else if(prefs.controls==='off')prefs.controls='hidden';
if(['auto','split','cluster','hidden'].indexOf(prefs.controls)<0)prefs.controls='auto';
if(!(prefs.size>=1&&prefs.size<=3))prefs.size=2;
/* 工坊试玩不记录成就 / 图鉴 / 晶体 */
var MM=TEST?{cnt:function(){},shard:function(){},blueShard:function(){},seen:function(){},boss:function(){},cleared:function(){},dlcChapter:function(){},dlcCleared:function(){},perfect:function(){},check:function(){return[]}}:Meta;
function savePrefs(){LS.set(L15.STORAGE.prefs,prefs)}
/* ---------- 战役数据（工坊发布的覆盖 > 默认） ---------- */
function validCampaign(c){return c&&Array.isArray(c.chapters)&&c.chapters.length&&c.chapters.every(function(ch){return Array.isArray(ch.levels)&&ch.levels.length&&ch.levels.every(function(l){return l&&Array.isArray(l.cells)&&Array.isArray(l.objects)&&l.width>0&&l.height>0})})}
var campaign=window.CAMPAIGN_DEFAULT,customCampaign=false;
if(TEST){var tl=LS.get(L15.STORAGE.test);if(tl&&tl.themes)L15.registerThemes(tl.themes);if(tl&&tl.level)campaign={name:'试玩',prologue:[],epilogue:[],chapters:[{id:'t',name:'试玩关卡',subtitle:'来自关卡工坊',biome:tl.level.background||'snow',intro:[],outro:[],levels:[tl.level]}]}}
else{var ovc=LS.get(L15.STORAGE.campaign);if(validCampaign(ovc)){campaign=ovc;customCampaign=true;L15.registerThemes(ovc.themes)}}
var baseCampaign=campaign;
var SCENES={school:1,station:1,snow:1,forest:1,underground:1,lava:1,train:1,icecave:1,lab:1,chaos:1};
function parsePage(s,def){var i=s.indexOf('|');if(i>0&&SCENES[s.slice(0,i)])return{scene:s.slice(0,i),text:s.slice(i+1)};return{scene:def,text:s}}
function parseDialog(str,kind){return String(str||'').split('|').map(function(l){var m=l.match(/^([^：:]{1,10})[：:](.*)$/);return m?{who:m[1],text:m[2],kind:m[1]==='我'?'hero':kind}:{who:'',text:l,kind:kind}}).filter(function(l){return l.text})}
/* ---------- 状态 ---------- */
var W=innerWidth,H=innerHeight,dpr=1,sc=1,vw=800,vh=576,state='menu',time=0,hitstop=0,shake=0,flashA=0;
var ci=0,li=0,R=null,P=null,cam={x:0,y:0},parts=[],weather=[],totalShards=0,unlocked=0,got={},stats={deaths:0,kills:0,time:0};
var slot=-1,codexT=0,achT=0;
var inDLC=false,dlcId=null,totalBlue=0; /* DLC 模式：战役切到 DLC，进度单独存，不动主线存档 */
var keys={},touchHeld={},buf={},joy={x:0,y:0,id:null},padPrev={},toastT=0,fadeBusy=false;
/* ---------- 画布 ---------- */
function resize(){W=innerWidth;H=innerHeight;dpr=Math.min(devicePixelRatio||1,2);while(W*H*dpr*dpr>5.2e6&&dpr>1)dpr-=.25;canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);applyPrefs();
 sc=Math.min(H/(H<560?400:576),W/(H<560?640:760));vw=W/sc;vh=H/sc;$('rotate').classList.toggle('hidden',!(H>W*1.1&&W<900&&document.body.classList.contains('touch')));vig=null;
 var s=$('storyCanvas');if(s){s.width=Math.round(W*Math.min(dpr,1.5));s.height=Math.round(H*Math.min(dpr,1.5))}}
addEventListener('resize',function(){setTimeout(resize,60)});addEventListener('orientationchange',function(){setTimeout(resize,250)});
var vig=null,ctlScale=1;
/* 触屏布局：split 分开（手机）/ cluster 聚集（教室大屏）/ hidden 隐藏（电脑键盘）/ auto 自动 */
function isTouchy(){return ('ontouchstart' in window)||navigator.maxTouchPoints>0||(window.matchMedia&&matchMedia('(pointer:coarse)').matches)}
function uiMode(){var m=prefs.controls;if(m!=='auto')return m;if(!isTouchy())return 'hidden';return (Math.min(W,H)>=760&&Math.max(W,H)>=1180)?'cluster':'split'}
function applyPrefs(){var mode=uiMode(),show=mode!=='hidden',mult=[.85,1,1.2][prefs.size-1]||1,m=Math.min(W,H),base=mode==='cluster'?Math.max(1.15,Math.min(1.9,m/560)):Math.max(.72,Math.min(1.3,m/400));
 ctlScale=base*mult;var rs=document.documentElement.style;rs.setProperty('--ctl',ctlScale.toFixed(3));rs.setProperty('--ui',Math.max(1,Math.min(1.75,m/700)).toFixed(3));
 var c=$('controls');c.classList.toggle('hidden',!show);c.classList.toggle('cluster',mode==='cluster');c.classList.toggle('split',mode==='split');
 document.body.classList.toggle('touch',show);document.body.classList.toggle('ui-cluster',mode==='cluster');document.body.classList.toggle('ui-split',mode==='split');
 $('muteBtn').textContent=prefs.mute?'🔇':'🔊';AudioFX.setMuted(prefs.mute)}
/* ---------- 输入 ---------- */
function press(n,t){buf[n]=t||.14}
function isHeld(n){
 if(n==='left')return keys.arrowleft||keys.a||touchHeld.left||joy.x<-.3||pad('left');
 if(n==='right')return keys.arrowright||keys.d||touchHeld.right||joy.x>.3||pad('right');
 if(n==='up')return keys.arrowup||keys.w||joy.y<-.55||pad('up');
 if(n==='down')return keys.arrowdown||keys.s||joy.y>.55||pad('down');
 if(n==='jump')return keys[' ']||keys.arrowup||keys.w||keys.k&&0||touchHeld.jump||pad('jump');
 return false}
var padState={};function pad(n){return !!padState[n]}
function pollPad(){var gp=navigator.getGamepads?navigator.getGamepads():[],p=null,i;for(i=0;i<gp.length;i++)if(gp[i]&&gp[i].connected){p=gp[i];break}
 padState={};if(!p)return;var ax=p.axes[0]||0,ay=p.axes[1]||0;padState.left=ax<-.4||(p.buttons[14]&&p.buttons[14].pressed);padState.right=ax>.4||(p.buttons[15]&&p.buttons[15].pressed);padState.up=ay<-.6||(p.buttons[12]&&p.buttons[12].pressed);padState.down=ay>.6||(p.buttons[13]&&p.buttons[13].pressed);
 padState.jump=p.buttons[0]&&p.buttons[0].pressed;var map={jump:0,dash:1,attack:2,interact:3,chalk:4,pause:9};Object.keys(map).forEach(function(k){var d=p.buttons[map[k]]&&p.buttons[map[k]].pressed;if(d&&!padPrev[k])act(k);padPrev[k]=d});if(p.buttons[5]&&p.buttons[5].pressed&&!padPrev.rb){act('dash')}padPrev.rb=p.buttons[5]&&p.buttons[5].pressed;if(p.buttons[7]&&p.buttons[7].pressed&&!padPrev.rt){act('chalk')}padPrev.rt=p.buttons[7]&&p.buttons[7].pressed}
function act(k){AudioFX.init();
 if(state==='dialog'){if(k==='jump'||k==='interact'||k==='attack')advanceDialog();return}
 if(state==='story'){if(k==='jump'||k==='interact'||k==='attack')advanceStory();return}
 if(k==='pause'){togglePause();return}
 if(state!=='play')return;press(k,k==='jump'?.16:.14)}
var KEYMAP={' ':'jump',w:'jump',arrowup:'jump',j:'attack',z:'attack',k:'dash',x:'dash',shift:'dash',e:'interact',enter:'interact',f:'interact',l:'chalk',c:'chalk'};
addEventListener('keydown',function(e){var k=e.key.toLowerCase();if([' ','arrowleft','arrowright','arrowup','arrowdown'].indexOf(k)>=0)e.preventDefault();
 if(e.repeat){keys[k]=true;return}keys[k]=true;
 if(k==='escape'||k==='p'){act('pause');return}if(k==='m'){prefs.mute=!prefs.mute;savePrefs();applyPrefs();return}
 if(KEYMAP[k])act(KEYMAP[k]);if(k==='arrowup'||k==='w'){if(state==='play')press('up',.2)}});
addEventListener('keyup',function(e){keys[e.key.toLowerCase()]=false});
addEventListener('blur',function(){keys={};touchHeld={};joy.x=joy.y=0;if(state==='play')togglePause(true)});
document.addEventListener('visibilitychange',function(){if(document.hidden&&state==='play')togglePause(true)});
/* 触屏：虚拟摇杆 + 按钮（多点触控，支持学校大屏） */
var joyEl=$('joy'),joyThumb=$('joyThumb');
function moveJoy(e){var r=joyEl.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,lim=r.width*.36,dx=e.clientX-cx,dy=e.clientY-cy,len=Math.hypot(dx,dy)||1,k=Math.min(1,lim/len);dx*=k;dy*=k;joy.x=dx/lim;joy.y=dy/lim;joyThumb.style.transform='translate('+dx+'px,'+dy+'px)'}
joyEl.addEventListener('pointerdown',function(e){e.preventDefault();AudioFX.init();joy.id=e.pointerId;try{joyEl.setPointerCapture(e.pointerId)}catch(x){}moveJoy(e)});
joyEl.addEventListener('pointermove',function(e){if(e.pointerId===joy.id){e.preventDefault();moveJoy(e)}});
['pointerup','pointercancel','lostpointercapture'].forEach(function(ev){joyEl.addEventListener(ev,function(e){if(e.pointerId!==joy.id&&ev!=='lostpointercapture')return;joy.id=null;joy.x=joy.y=0;joyThumb.style.transform='translate(0,0)'})});
Array.prototype.forEach.call(document.querySelectorAll('[data-act]'),function(b){var k=b.dataset.act,ids={};
 b.addEventListener('pointerdown',function(e){e.preventDefault();ids[e.pointerId]=1;try{b.setPointerCapture(e.pointerId)}catch(x){}b.classList.add('down');if(k==='jump')touchHeld.jump=true;act(k)});
 function up(e){delete ids[e.pointerId];if(!Object.keys(ids).length){b.classList.remove('down');if(k==='jump')touchHeld.jump=false}}
 b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('lostpointercapture',up)});
canvas.addEventListener('pointerdown',function(e){AudioFX.init();if(state==='dialog')advanceDialog()});
$('dialog').addEventListener('pointerdown',function(e){e.preventDefault();advanceDialog()});
$('story').addEventListener('pointerdown',function(e){if(e.target.id==='storySkip')return;advanceStory()});
document.addEventListener('contextmenu',function(e){e.preventDefault()});
document.addEventListener('gesturestart',function(e){e.preventDefault()});
/* ---------- UI 辅助 ---------- */
function toast(s,ms){var t=$('toast');t.textContent=s;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('show')},ms||2200)}
function dashBar(){var b=$("dashBar");if(!b||!P)return;var n=P.stamMax,i,c=b.children;if(c.length!==n){b.innerHTML=new Array(n+1).join("<i><b></b></i>");c=b.children}
 for(i=0;i<n;i++){var f=Math.max(0,Math.min(1,P.stam-i)),w=Math.round(f*100)+"%",bar=c[i].firstChild;if(bar.style.width!==w)bar.style.width=w;c[i].classList.toggle("full",f>=1)}
 b.classList.toggle("no",P.noStam>0)}
function hearts(){var h=$('hearts');if(!P)return;var s='';for(var i=0;i<P.max;i++)s+='<i class="'+(i<P.hp?'':'lost')+'">♥</i>';if(h.dataset.s!==s){h.innerHTML=s;h.dataset.s=s}}
function fade(cb){if(fadeBusy)return;fadeBusy=true;var f=$('fade');f.classList.add('on');setTimeout(function(){try{cb()}catch(e){console.error(e)}setTimeout(function(){f.classList.remove('on');fadeBusy=false},120)},380)}
/* 对话 */
var dlg={lines:[],i:0,chars:0,full:'',active:false,done:null,acc:0};
function startDialog(lines,done){if(!lines.length){done&&done();return}dlg.lines=lines;dlg.i=0;dlg.done=done;dlg.active=true;state='dialog';$('dialog').classList.remove('hidden');setLine();joy.x=joy.y=0;touchHeld={}}
function setLine(){var l=dlg.lines[dlg.i];dlg.full=l.text;dlg.chars=0;dlg.acc=0;$('dlName').textContent=l.who||'';$('dlName').style.visibility=l.who?'visible':'hidden';$('dlText').textContent='';drawPortrait(l)}
function advanceDialog(){if(!dlg.active)return;if(dlg.chars<dlg.full.length){dlg.chars=dlg.full.length;$('dlText').textContent=dlg.full;return}AudioFX.sfx('select');dlg.i++;if(dlg.i>=dlg.lines.length){dlg.active=false;$('dialog').classList.add('hidden');state='play';var d=dlg.done;dlg.done=null;if(d)d()}else setLine()}
function drawPortrait(l){var c=$('portrait'),x=c.getContext('2d'),S=c.width;x.clearRect(0,0,S,S);x.fillStyle='rgba(120,220,230,.16)';x.beginPath();x.arc(S/2,S/2,S/2-2,0,7);x.fill();x.save();x.beginPath();x.arc(S/2,S/2,S/2-4,0,7);x.clip();
 if(l.kind==='hero'){if(GFX.faceImg.complete&&GFX.faceImg.naturalWidth)x.drawImage(GFX.faceImg,4,4,S-8,S-8);else{x.fillStyle='#ffd9b0';x.fillRect(0,0,S,S)}}
 else if(l.kind&&L15.INFO[l.kind]&&L15.INFO[l.kind].g==='npc'){x.translate(S/2,S*.98);x.scale(2.2,2.2);GFX.npc(x,l.kind,-1,-34,2,34,0,1)}
 else{x.fillStyle='#3a2d4a';x.fillRect(0,0,S,S);x.fillStyle='#ffd88a';x.font='bold '+(S*.5)+'px sans-serif';x.textAlign='center';x.fillText((l.who||'？').charAt(0),S/2,S*.68)}
 x.restore();x.strokeStyle='rgba(180,240,245,.6)';x.lineWidth=2;x.beginPath();x.arc(S/2,S/2,S/2-3,0,7);x.stroke()}
/* 剧情分页 */
var story={pages:[],i:0,chars:0,cb:null,t:0};
function showStory(pages,def,cb){if(!pages||!pages.length){if(cb)cb();return}story.pages=pages.map(function(p){return parsePage(p,def)});story.i=0;story.chars=0;story.cb=cb;story.t=0;prevState=state;state='story';$('story').classList.remove('hidden');$('hud').classList.add('hidden');$('controls').classList.add('hidden');joy.x=joy.y=0;touchHeld={}}
function advanceStory(){if(state!=='story')return;var p=story.pages[story.i];if(story.chars<p.text.length){story.chars=p.text.length;return}AudioFX.sfx('select');story.i++;story.chars=0;if(story.i>=story.pages.length)endStory()}
function endStory(){$('story').classList.add('hidden');$('hud').classList.remove('hidden');applyPrefs();var cb=story.cb;story.cb=null;state='trans';if(cb)cb()}
$('storySkip').onclick=function(e){e.stopPropagation();story.i=story.pages.length;endStory()};
var prevState='menu';
function updateStory(dt){story.t+=dt;var p=story.pages[story.i];if(!p)return;var before=Math.floor(story.chars);story.chars=Math.min(p.text.length,story.chars+dt*34);if(Math.floor(story.chars)>before&&Math.floor(story.chars)%3===0)AudioFX.sfx('talk',240+(story.i%3)*30);
 $('storyP').textContent=p.text.slice(0,Math.floor(story.chars));$('storyHint').style.opacity=story.chars>=p.text.length?1:.25;$('storyNo').textContent=(story.i+1)+' / '+story.pages.length}
function drawStory(){var c=$('storyCanvas'),x=c.getContext('2d'),p=story.pages[story.i];if(!p)return;GFX.scene(x,p.scene,c.width,c.height,story.t)}
/* ---------- 房间构建 ---------- */
var PW=22,PH=40,DASH_MAX=2,DASH_REGEN=1.6; /* 冲刺体力：上限 2 格，每格约 1.6 秒回满 */
function ov(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function cellAt(tx,ty){if(tx<0||tx>=R.cw)return 1;if(ty<0||ty>=R.ch)return 0;var r=R.cells[ty];return r?(r[tx]||0):0}
function isSolid(v){return v===1||v===3||v===4||v===5}
function srcOn(id){var s=R.byId[id];return !!s&&(s.kind==='switch'?s.on:s.kind==='plate'?(s.on||s.hold>0):!!s.solved)}
function activated(d){var s=R.src[d.id];if(!s||!s.length)return null;return s.every(srcOn)}
function makeEnemy(d){var k=d.kind,e={kind:k,id:d.id,x:d.x,y:d.y,w:d.w,h:d.h,hx:d.x,hy:d.y,p:d.p,hp:1,vx:0,vy:0,face:-1,t:Math.random()*6,flash:0,dead:false,state:'idle',timer:1+Math.random()*2,windup:0,charge:0,alpha:.85,aim:Math.PI,hit:-1},rng=(d.p.range||5)*T;
 if(k==='slime'){e.min=d.x-rng/2;e.max=d.x+rng/2;e.vx=40;e.face=1}
 else if(k==='turret'){e.hp=3;e.face=(d.p.dir||-1)}
 else if(k==='ghost')e.hp=2;
 else if(k==='frog'){e.hp=2;e.min=d.x-rng/2;e.max=d.x+rng/2;e.air=false;e.timer=.6+Math.random()*1.2;e.face=1}
 else if(k==='bat'){e.hp=1;e.state='rest';e.rest=true;e.timer=.5}
 else if(k==='guard'){e.hp=3;e.min=d.x-rng/2;e.max=d.x+rng/2;e.vx=34;e.face=1}
 if(d.p.hp>0)e.hp=d.p.hp;if(d.p.speed>0&&(k==='slime'||k==='guard'))e.vx=d.p.speed;if(window.DLCX)DLCX.initEnemy(e,d);return e}
function makeBoss(d){var b={id:d.id,tex:d.p.tex,label:d.say||d.label||'Boss',type:d.p.boss||'lava',x:d.x,y:d.y,w:d.w,h:d.h,hx:d.x,hy:d.y,hp:d.p.hp||16,max:d.p.hp||16,state:'idle',timer:2,face:-1,flash:0,vx:0,dead:false,deadT:0,phase:0,atk:'',started:false};if(b.type==='paradox'&&window.DLCX)DLCX.initBoss(b,d);return b}
function buildRoom(lv){
 L15.curBiome=lv.background||'snow';var r={lv:lv,biome:lv.background||'snow',cw:lv.width,ch:lv.height,w:lv.width*T,h:lv.height*T,cells:lv.cells,shards:[],hearts:[],checks:[],springs:[],vents:[],spores:[],vines:[],spikes:[],lavas:[],lasers:[],rubble:[],gates:[],switches:[],plates:[],movers:[],enemyDefs:[],enemies:[],npcs:[],signs:[],triggers:[],decor:[],saws:[],icicles:[],flames:[],crumbles:[],convs:[],gems:[],winds:[],platforms:[],exit:null,spawn:{x:2*T,y:(lv.height-3)*T},boss:null,bossDef:null,src:{},byId:{},proj:[],chalk:[],warns:[],fire:[],cp:null,bounceAnim:{},xthings:[],xblue:[]};
 var gk=gkey(),gs=got[gk]||{};
 lv.objects.forEach(function(o){var d={id:o.id,kind:o.kind,x:o.x*T,y:o.y*T,w:o.w*T,h:o.h*T,p:o.props||{},say:o.dialogue||'',label:o.label};r.byId[o.id]=d;var inf=L15.INFO[o.kind];
  switch(o.kind){
  case'spawn':r.spawn={x:d.x+d.w/2-PW/2,y:d.y+d.h-PH};break;
  case'exit':r.exit=d;break;
  case'shard':if(!gs[d.id]){d.got=false;r.shards.push(d)}break;
  case'heart':if(!gs[d.id]){d.got=false;r.hearts.push(d)}break;
  case'checkpoint':d.lit=false;r.checks.push(d);break;
  case'spring':d.sq=0;r.springs.push(d);break;
  case'vent':r.vents.push(d);break;
  case'spore':r.spores.push(d);break;
  case'vine':r.vines.push(d);break;
  case'spikes':r.spikes.push(d);break;
  case'lava':r.lavas.push(d);break;
  case'laser':d.active=false;d.warn=false;r.lasers.push(d);break;
  case'rubble':d.hp=d.p.hp||2;d.max=d.hp;d.dead=false;d.hit=-1;r.rubble.push(d);break;
  case'gate':d.openT=0;d.open=false;r.gates.push(d);break;
  case'switch':d.on=false;r.switches.push(d);break;
  case'plate':d.on=false;d.hold=0;r.plates.push(d);break;
  case'moving':case'lift':d.x0=d.x;d.y0=d.y;d.dx=(d.p.dx||0)*T;d.dy=(d.p.dy||0)*T;d.sp=d.p.speed||60;d.s=0;d.dir=1;d.pdx=0;d.pdy=0;d.run=true;d.h=Math.min(d.h,T*.6);r.movers.push(d);break;
  case'slime':case'bee':case'turret':case'ghost':case'guard':case'frog':case'bat':r.enemyDefs.push(d);break;
  case'saw':d.x0=d.x;d.y0=d.y;d.dx=(d.p.dx||0)*T;d.dy=(d.p.dy||0)*T;d.sp=d.p.speed||60;d.s=0;d.dir=1;d.run=true;r.saws.push(d);break;
  case'icicle':d.y0=d.y;d.st='idle';d.t=0;d.vy=0;d.gone=false;d.shake=false;r.icicles.push(d);break;
  case'flame':d.active=false;d.warn=false;r.flames.push(d);break;
  case'crumble':d.h=Math.min(d.h,T*.6);d.crumb=true;d.st='idle';d.t=0;d.gone=false;d.shake=false;d.touched=false;d.pdx=0;d.pdy=0;r.crumbles.push(d);break;
  case'conveyor':d.h=Math.min(d.h,T*.6);d.conv=true;d.dirx=(d.p.dir<0?-1:1);d.sp=d.p.speed||90;d.run=true;d.pdx=0;d.pdy=0;r.convs.push(d);break;
  case'dashgem':d.gone=false;d.t=0;r.gems.push(d);break;
  case'wind':r.winds.push(d);break;
  case'boss':r.bossDef=d;break;
  case'sign':r.signs.push(d);break;
  case'trigger':d.used=false;r.triggers.push(d);break;
  default:if(window.DLCX&&DLCX.build(r,d,o.kind,gs))break;if(inf&&inf.g==='npc')r.npcs.push(d);else if(inf&&inf.g==='background')r.decor.push(d)}});
 (lv.links||[]).forEach(function(k){(r.src[k.to]=r.src[k.to]||[]).push(k.from)});
 r.platforms=r.movers.concat(r.crumbles,r.convs);
 resetActors(r);return r}
function resetActors(r){if(window.DLCX)DLCX.resetRoom(r);r.icicles.forEach(function(d){d.st='idle';d.gone=false;d.shake=false;d.y=d.y0;d.t=0});r.crumbles.forEach(function(d){d.st='idle';d.gone=false;d.shake=false;d.touched=false;d.t=0});r.gems.forEach(function(d){d.gone=false;d.t=0});r.enemies=r.enemyDefs.map(makeEnemy);r.boss=r.bossDef?makeBoss(r.bossDef):null;if(r.boss&&r.bossGone){r.boss.dead=true;r.boss.deadT=0}r.proj=[];r.chalk=[];r.warns=[];r.fire=[]}
function newPlayer(x,y){return{x:x,y:y,w:PW,h:PH,vx:0,vy:0,face:1,ground:false,coyote:0,jumps:0,rising:false,dash:0,dashCd:0,dashUsed:false,stam:DASH_MAX,stamMax:DASH_MAX,noStam:0,dashId:0,atk:0,atkCd:0,swing:0,slam:false,drop:0,inv:0,hurt:0,hp:5,max:5,climb:null,grabCd:0,anim:0,state:'idle',sx:1,sy:1,safe:{x:x,y:y},safeT:0,onIce:false,standOn:null,trail:[],dead:0,wasGround:false,fall:0,cx:0,cy:0}}
/* ---------- 粒子 ---------- */
function emit(x,y,col,n,spd,life,grav){spd=spd||160;for(var i=0;i<n;i++){var a=Math.random()*6.283,s=spd*(.3+Math.random()*.7);parts.push({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-spd*.3,life:(life||.6)*(.5+Math.random()*.7),max:life||.6,c:col,r:1.5+Math.random()*3,g:grav==null?500:grav})}}
function updateParts(dt){for(var i=parts.length-1;i>=0;i--){var p=parts[i];p.life-=dt;if(p.life<=0){parts.splice(i,1);continue}p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt}if(parts.length>400)parts.splice(0,parts.length-400)}
/* ---------- 碰撞 ---------- */
function dyn(){var a=[],i;for(i=0;i<R.rubble.length;i++)if(!R.rubble[i].dead)a.push(R.rubble[i]);for(i=0;i<R.gates.length;i++)if(R.gates[i].openT<.6)a.push(R.gates[i]);return a}
function moveX(p,dx){p.x+=dx;if(p.x<0){p.x=0;p.vx=0}if(p.x+p.w>R.w){p.x=R.w-p.w;p.vx=0}
 var y0=Math.floor(p.y/T),y1=Math.floor((p.y+p.h-.01)/T),x0=Math.floor(p.x/T),x1=Math.floor((p.x+p.w-.01)/T),tx,ty;
 for(ty=y0;ty<=y1;ty++)for(tx=x0;tx<=x1;tx++)if(isSolid(cellAt(tx,ty))){if(dx>0)p.x=tx*T-p.w;else if(dx<0)p.x=(tx+1)*T;else continue;p.vx=0;return}
 var d=dyn();for(var i=0;i<d.length;i++){var s=d[i];if(ov(p,s)){if(dx>0)p.x=s.x-p.w;else if(dx<0)p.x=s.x+s.w;p.vx=0}}}
function land(p,v,tx,ty){p.vy=0;p.ground=true;if(v===5)p.onIce=true;if(v===3){p.vy=-740;p.ground=false;p.jumps=1;p.rising=false;R.bounceAnim[ty*R.cw+tx]=time;AudioFX.sfx('bounce');emit(p.x+p.w/2,p.y+p.h,'#f2c9ff',10)}}
function moveY(p,dy){p.y+=dy;var pb=p.y+p.h-dy,y0=Math.floor(p.y/T),y1=Math.floor((p.y+p.h-.01)/T),x0=Math.floor(p.x/T),x1=Math.floor((p.x+p.w-.01)/T),tx,ty,v;
 for(ty=y0;ty<=y1;ty++)for(tx=x0;tx<=x1;tx++){v=cellAt(tx,ty);
  if(isSolid(v)){if(dy>0){p.y=ty*T-p.h;land(p,v,tx,ty)}else if(dy<0){p.y=(ty+1)*T;p.vy=0}else continue;return}
  if(v===2&&dy>0&&pb<=ty*T+1&&p.drop<=0){p.y=ty*T-p.h;land(p,v,tx,ty);return}}
 var d=dyn(),i;for(i=0;i<d.length;i++){var s=d[i];if(ov(p,s)){if(dy>0||(dy===0&&p.y+p.h<=s.y+8)){p.y=s.y-p.h;p.vy=0;p.ground=true}else{p.y=s.y+s.h;p.vy=0}}}
 if(dy>=0)for(i=0;i<R.platforms.length;i++){var m=R.platforms[i];if(m.gone)continue;if(p.x+p.w>m.x+2&&p.x<m.x+m.w-2&&pb<=m.y+9&&p.y+p.h>=m.y&&p.drop<=0){p.y=m.y-p.h;p.vy=0;p.ground=true;p.standOn=m;if(m.crumb)m.touched=true}}}
/* ---------- 机关 / 平台 ---------- */
function updateMech(dt){var i,m,a;
 for(i=0;i<R.movers.length;i++){m=R.movers[i];var px=m.x,py=m.y;a=activated(m);m.run=(a===null)?true:a;var L=Math.hypot(m.dx,m.dy);
  if(m.run&&L>0){m.s+=m.dir*dt*m.sp/L;if(m.s>=1){m.s=1;m.dir=-1}else if(m.s<=0){m.s=0;m.dir=1}}
  var e=m.s*m.s*(3-2*m.s);m.x=m.x0+m.dx*e;m.y=m.y0+m.dy*e;m.pdx=m.x-px;m.pdy=m.y-py}
 for(i=0;i<R.gates.length;i++){var gt=R.gates[i],ac=activated(gt),want;
  if(ac===null){var all=R.switches.concat(R.plates);want=all.length>0&&all.every(function(s){return s.on||s.hold>0})}else want=ac;
  if(want&&!gt.open){AudioFX.sfx('door');toast('机关启动：闸门开启');shake=Math.max(shake,3)}gt.open=want;gt.openT+=((want?1:0)-gt.openT)*Math.min(1,dt*4);if(want&&gt.openT>.98)gt.openT=1;if(!want&&gt.openT<.02)gt.openT=0}
 for(i=0;i<R.plates.length;i++){var pl=R.plates[i],stand=P&&P.ground&&P.x+P.w>pl.x&&P.x<pl.x+pl.w&&Math.abs(P.y+P.h-(pl.y+pl.h))<10;
  if(stand){if(!pl.on)AudioFX.sfx('plate');pl.on=true;pl.hold=pl.p.hold||0}else{pl.on=false;pl.hold=Math.max(0,pl.hold-dt)}}
 for(i=0;i<R.lasers.length;i++){var l=R.lasers[i],per=l.p.period||2.2,ph=(l.p.phase||0)*per,tt=(time+ph)%(per*2),dis=activated(l);
  var act=tt<per&&dis!==true,warn=!act&&dis!==true&&tt>per*2-.5;if(act&&!l.active)AudioFX.sfx('laser');l.active=act;l.warn=warn}
 for(i=0;i<R.vents.length;i++){var v=R.vents[i],pr=(v.p.period||3),tt2=(time+v.x*.003)%pr;v.on=tt2<pr*.55;v.warn=!v.on&&tt2>pr-.5;v.reach=150;
  if(v.on&&Math.random()<.4)emit(v.x+v.w/2+(Math.random()-.5)*v.w,v.y,R.biome==='lava'?'#ff9b55':'#dff5ff',1,60,.7,-100)}
 for(i=0;i<R.springs.length;i++)R.springs[i].sq=Math.max(0,R.springs[i].sq-dt*5);
 /* 传送带：连了开关则开关触发后才转动 */
 for(i=0;i<R.convs.length;i++){m=R.convs[i];a=activated(m);m.run=(a===null)?true:a;m.pdx=m.run?m.dirx*m.sp*dt:0;m.pdy=0}
 /* 旋转锯：和移动平台一样沿 dx,dy 往返 */
 for(i=0;i<R.saws.length;i++){m=R.saws[i];a=activated(m);m.run=(a===null)?true:a;var SL=Math.hypot(m.dx,m.dy);
  if(m.run&&SL>0){m.s+=m.dir*dt*m.sp/SL;if(m.s>=1){m.s=1;m.dir=-1}else if(m.s<=0){m.s=0;m.dir=1}}
  var se=m.s*m.s*(3-2*m.s);m.x=m.x0+m.dx*se;m.y=m.y0+m.dy*se}
 /* 火焰喷口：周期喷发（连了开关则开关触发后熄灭，和激光栅一样） */
 for(i=0;i<R.flames.length;i++){var fm=R.flames[i],fper=fm.p.period||3,ftt=(time+(fm.p.phase||0)*fper)%fper,fdis=activated(fm),fact=ftt<fper*.4&&fdis!==true;fm.warn=!fact&&fdis!==true&&ftt>fper-.6;fm.active=fact;
  if(fact&&Math.random()<.5)emit(fm.x+fm.w/2+(Math.random()-.5)*10,fm.y+fm.h*.4,'#ffb36a',1,70,.5,-160)}
 /* 碎裂平台：被踩后抖动，随后碎掉，过一会儿复原 */
 for(i=0;i<R.crumbles.length;i++){var cm=R.crumbles[i];
  if(cm.st==='idle'){if(cm.touched){cm.st='shake';cm.t=cm.p.delay!=null?cm.p.delay:.45;cm.shake=true;AudioFX.sfx('rumble')}}
  else if(cm.st==='shake'){cm.t-=dt;if(cm.t<=0){cm.st='gone';cm.gone=true;cm.shake=false;cm.t=cm.p.respawn||3;emit(cm.x+cm.w/2,cm.y+8,'#b9a27c',16,170);AudioFX.sfx('hit')}}
  else{cm.t-=dt;if(cm.t<=0&&!(P&&ov({x:P.x,y:P.y,w:P.w,h:P.h},{x:cm.x,y:cm.y-8,w:cm.w,h:cm.h+16}))){cm.st='idle';cm.gone=false;emit(cm.x+cm.w/2,cm.y+8,'#e8dcc0',8,90,.4)}}
  cm.touched=false}
 /* 冲刺水晶：复原时间 */
 for(i=0;i<R.gems.length;i++){var gm=R.gems[i];if(gm.gone){gm.t-=dt;if(gm.t<=0)gm.gone=false}}
 /* 冰锥：玩家走到下方时抖动，随后坠落 */
 for(i=0;i<R.icicles.length;i++){var ic=R.icicles[i];
  if(ic.st==='idle'){if(P&&Math.abs(P.x+P.w/2-(ic.x+ic.w/2))<44&&P.y>ic.y&&P.y<ic.y+T*10){ic.st='shake';ic.t=ic.p.delay!=null?ic.p.delay:.5;ic.shake=true;AudioFX.sfx('switch')}}
  else if(ic.st==='shake'){ic.t-=dt;if(ic.t<=0){ic.st='fall';ic.shake=false;ic.vy=60}}
  else if(ic.st==='fall'){ic.vy=Math.min(900,ic.vy+2000*dt);ic.y+=ic.vy*dt;var by2=ic.y+ic.h;
   if(solidAt(ic.x+ic.w/2,by2)||groundAt(ic.x+ic.w/2,by2)&&ic.vy>0||ic.y>R.h+40){ic.st='gone';ic.gone=true;ic.t=4;AudioFX.sfx('hit');emit(ic.x+ic.w/2,Math.min(by2,R.h),'#dff5ff',14,200)}}
  else{ic.t-=dt;if(ic.t<=0){ic.st='idle';ic.gone=false;ic.y=ic.y0}}}
}
/* ---------- 伤害 ---------- */
function damagePlayer(n,opt){var p=P;if(p.inv>0||p.dead>0||state!=='play')return;opt=opt||{};p.hp-=n||1;stats.hurt=(stats.hurt||0)+1;AudioFX.sfx('hurt');hitstop=.07;shake=Math.max(shake,9);flashA=.35;emit(p.x+p.w/2,p.y+p.h/2,'#ff7b91',16,200);p.slam=false;p.dash=0;p.atk=0;p.climb=null;
 if(p.hp<=0){die();return}
 p.inv=1.4;hearts();
 if(opt.respawn){p.vx=0;p.vy=0;p.x=p.safe.x;p.y=p.safe.y;p.state='idle';p.hurt=.1;toast('从最近的立足点重来')}
 else{p.hurt=.28;p.vy=-300;p.vx=-(opt.dir||p.face)*190}}
function die(){var p=P;p.dead=1.5;p.vx=p.vy=0;stats.deaths++;MM.cnt('deaths');AudioFX.sfx('boom');emit(p.x+p.w/2,p.y+p.h/2,'#fff',30,240);hearts();state='dead'}
function respawn(){var cp=R.cp||{x:R.spawn.x,y:R.spawn.y};P=newPlayer(cp.x,cp.y);P.inv=1.5;resetActors(R);R.shards.forEach(function(s){});hearts();state='play';cam.x=Math.max(0,Math.min(R.w-vw,P.x-vw*.4));toast(R.cp?'回到最近的信标灯':'从房间入口重新出发');AudioFX.play(R.bossDef&&!R.bossGone?'boss':R.biome);updateCamera(0,true)}
function nearHazard(p){var a=R.spikes.concat(R.lavas),i;for(i=0;i<a.length;i++){var h=a[i];if(p.x+p.w>h.x-40&&p.x<h.x+h.w+40&&p.y+p.h>h.y-60)return true}return false}
function er(e){return {x:e.x+6,y:e.y+(e.kind==='slime'?6:4),w:e.w-12,h:e.h-(e.kind==='slime'?6:8)}}
function damageEnemy(e,n,dir){if(e.dead||e.invt>0)return false;e.hp-=n;e.flash=.18;e.windup=0;e.invt=.12;emit(e.x+e.w/2,e.y+e.h/2,'#ffffff',8,150);AudioFX.sfx('hit');if(e.kind!=='turret')e.x+=dir*12;
 if(e.hp<=0){e.dead=true;stats.kills++;MM.cnt('kills');AudioFX.sfx('kill');emit(e.x+e.w/2,e.y+e.h/2,GFX.B(R.biome).accent,18,220);if(Math.random()<.18)R.hearts.push({id:'drop'+Math.random(),kind:'heart',x:e.x+e.w/2-16,y:e.y,w:32,h:32,p:{},got:false,temp:true})}return true}
function hitBoss(n,viaDash){var b=R.boss;if(!b||b.dead||b.flash>0||b.deadT>0)return false;if(b.type==='paradox'&&window.DLCX)return DLCX.hitBoss(b,n,viaDash);if(viaDash&&b.state==='wind'){n+=1;b.state='stun';b.timer=1.7;toast('打断成功！')}
 b.hp-=n;b.flash=.32;hitstop=.07;shake=Math.max(shake,6);AudioFX.sfx('hit');emit(b.x+b.w/2,b.y+b.h/2,'#ffd08a',22,260);var r=b.hp/b.max;b.phase=r<.34?2:r<.67?1:0;
 if(b.hp<=0){b.hp=0;b.deadT=.01;b.state='dying';R.proj=[];R.warns=[];R.fire=[];AudioFX.sfx('roar')}return true}
/* ---------- 玩家 ---------- */
function approach(v,t,d){return v<t?Math.min(t,v+d):Math.max(t,v-d)}
function say(d,kind){if(window.DLCX&&DLCX.isQuiz(d.say)){DLCX.quiz(d);return}startDialog(parseDialog(d.say,kind||d.kind),null)}
function updatePlayer(dt){
 var p=P,L=isHeld('left'),Rt=isHeld('right'),up=isHeld('up'),dn=isHeld('down'),dir=(Rt?1:0)-(L?1:0),i;
 if(p.frozen>0){p.frozen-=dt;L=Rt=up=dn=false;dir=0;buf.jump=0;buf.dash=0;buf.attack=0}p.anim+=dt;p.inv=Math.max(0,p.inv-dt);p.hurt=Math.max(0,p.hurt-dt);p.dashCd=Math.max(0,p.dashCd-dt);p.stam=Math.min(p.stamMax,p.stam+dt/DASH_REGEN);p.noStam=Math.max(0,p.noStam-dt);p.atkCd=Math.max(0,p.atkCd-dt);p.chalkCd=Math.max(0,(p.chalkCd||0)-dt);p.grabCd=Math.max(0,p.grabCd-dt);p.drop=Math.max(0,p.drop-dt);p.coyote=Math.max(0,p.coyote-dt);p.sx+=(1-p.sx)*Math.min(1,dt*12);p.sy+=(1-p.sy)*Math.min(1,dt*12);
 if(p.atk>0)p.atk=Math.max(0,p.atk-dt);
 // 搭乘平台
 if(p.standOn){if(p.standOn.conv){moveX(p,p.standOn.pdx)}else{p.x+=p.standOn.pdx;p.y+=p.standOn.pdy}p.standOn=null}
 // 藤蔓
 if(p.climb){var v=p.climb;p.vx=0;p.vy=((dn?1:0)-(up?1:0))*125;p.y+=p.vy*dt;p.x=v.x+v.w/2-p.w/2;if(p.y+p.h*.6<v.y)p.y=v.y-p.h*.6;
  if(p.y>v.y+v.h-8){p.climb=null;p.grabCd=.3}
  if(buf.jump>0){buf.jump=0;p.climb=null;p.grabCd=.28;p.vy=-580;p.vx=(dir||p.face)*270;p.jumps=1;p.rising=true;AudioFX.sfx('jump')}
  if(p.climb&&dir)p.face=dir;if(p.climb&&buf.dash>0){p.climb=null;p.grabCd=.3}
  p.state='climb';p.ground=false;p.dashUsed=false;if(Math.random()<.05)emit(p.x+p.w/2,p.y+p.h/2,'#8be49a',1,40,.5,0);return}
 if(p.grabCd<=0&&p.dash<=0&&p.hurt<=0){for(i=0;i<R.vines.length;i++){var vv=R.vines[i];if(Math.abs(p.x+p.w/2-(vv.x+vv.w/2))<18&&p.y+p.h*.7>vv.y&&p.y<vv.y+vv.h-14&&(buf.interact>0||(up&&p.vy>-40))){buf.interact=0;buf.jump=0;p.climb=vv;p.vx=p.vy=0;p.slam=false;AudioFX.sfx('select');return}}}
 // 水平
 var acc=p.ground?(p.onIce?900:2700):1900,fr=p.ground?(p.onIce?520:2700):760,maxV=250*(p.slowF||1); /* 少滑一点：冰面 acc/fr 原为 520/240，空中 fr 原为 420——太滑，容易滑进出口/尖刺。普通地面不变 */
 if(p.dash<=0&&p.hurt<=0){if(dir){p.vx+=dir*acc*dt;if(Math.abs(p.vx)>maxV)p.vx=approach(p.vx,dir*maxV,fr*dt*1.2);p.face=dir}else p.vx=approach(p.vx,0,fr*dt)}
 // 地面状态
 if(p.ground){p.coyote=.1;p.jumps=0;p.dashUsed=false;p.rising=false}else if(p.coyote<=0&&p.jumps===0)p.jumps=1;
 // 下穿薄地板
 if(dn&&p.ground&&buf.jump>0){var cx0=Math.floor((p.x+2)/T),cx1=Math.floor((p.x+p.w-2)/T),ty=Math.floor((p.y+p.h+2)/T),th=false;for(var q=cx0;q<=cx1;q++)if(cellAt(q,ty)===2)th=true;if(th){p.drop=.28;p.y+=4;p.ground=false;buf.jump=0;AudioFX.sfx('select')}}
 if(buf.jump>0&&p.dash<=0){if(p.ground||p.coyote>0){buf.jump=0;p.vy=-640;p.coyote=0;p.jumps=1;p.rising=true;p.ground=false;AudioFX.sfx('jump');emit(p.x+p.w/2,p.y+p.h,'#e8f6ff',6,90,.35);p.sx=.82;p.sy=1.2}
  else if(p.jumps<2){buf.jump=0;p.vy=-560;p.jumps=2;p.rising=true;AudioFX.sfx('djump');emit(p.x+p.w/2,p.y+p.h,GFX.B(R.biome).accent,12,150,.45);p.sx=.85;p.sy=1.18}}
 if(p.rising&&!isHeld('jump')&&p.vy<-210){p.vy=-210;p.rising=false}if(p.vy>=0)p.rising=false;
 // 冲刺
 if(buf.dash>0&&p.dashCd<=0&&p.stam>=1&&p.hurt<=0){buf.dash=0;p.dash=.17;p.dashCd=.3;p.stam-=1;p.dashUsed=true;p.dashId++;p.vx=(dir||p.face)*740;p.face=dir||p.face;p.vy=0;p.inv=Math.max(p.inv,.2);p.slam=false;AudioFX.sfx('dash');emit(p.x+p.w/2,p.y+p.h/2,GFX.B(R.biome).accent,10,120,.3,0)} else if(buf.dash>0&&p.stam<1&&p.hurt<=0)p.noStam=.3;
 if(p.dash>0){p.dash-=dt;p.vx=p.face*740;p.vy=0;p.trail.push({x:p.cx,y:p.cy,f:p.face,t:.22});}
 // 攻击
 if(buf.attack>0&&p.atkCd<=0&&p.hurt<=0){buf.attack=0;if(dn&&!p.ground){p.slam=true;p.vy=900;p.vx*=.3;AudioFX.sfx('dash');p.dash=0}else{p.atk=.22;p.atkCd=.28;p.swing++;AudioFX.sfx('slash')}}
 // 远程：粉笔（L / 手柄 LB·RT / 触屏「粉笔」）
 if(buf.chalk>0&&p.chalkCd<=0&&p.hurt<=0&&p.dash<=0){buf.chalk=0;throwChalk()}
 // 重力
 if(p.dash<=0){var gr=(p.vy>0?2300:1900)*(p.gravS||1);if(p.slam)gr=0;p.vy=Math.min(920,p.vy+gr*dt)}
 p.wasGround=p.ground;p.fall=p.vy;p.ground=false;p.onIce=false;
 // 气流
 for(i=0;i<R.vents.length;i++){var vt=R.vents[i];if(vt.on&&p.x+p.w>vt.x&&p.x<vt.x+vt.w&&p.y+p.h>vt.y-vt.reach&&p.y<vt.y+vt.h){p.vy-=3600*dt;if(p.vy<-420)p.vy=-420;p.jumps=Math.min(p.jumps,1)}}
 for(i=0;i<R.spores.length;i++){var sp=R.spores[i];if(p.x+p.w>sp.x&&p.x<sp.x+sp.w&&p.y+p.h>sp.y&&p.y<sp.y+sp.h){p.vy-=3300*dt;if(p.vy<-250)p.vy=-250;p.dashUsed=false;if(p.stam<1)p.stam=1;if(Math.random()<.2)emit(p.x+p.w/2,p.y+p.h,'#b8ff9b',1,40,.6,-60)}}
 // 风区（横向推力，空中最明显）
 for(i=0;i<R.winds.length;i++){var wz=R.winds[i];if(p.x+p.w>wz.x&&p.x<wz.x+wz.w&&p.y+p.h>wz.y&&p.y<wz.y+wz.h){var wdir=(wz.p.dir<0?-1:1);p.vx+=wdir*(wz.p.strength||800)*dt*(p.ground?.25:1);if(Math.abs(p.vx)>330&&(p.vx>0?1:-1)===wdir)p.vx=wdir*330;if(Math.random()<.15)emit(p.x+p.w/2-wdir*30,p.y+p.h/2+(Math.random()-.5)*30,'#eafaff',1,30,.4,0)}}
 // 冲刺水晶：补满冲刺与二段跳
 for(i=0;i<R.gems.length;i++){var gz=R.gems[i];if(!gz.gone&&Math.abs(p.x+p.w/2-(gz.x+gz.w/2))<30&&Math.abs(p.y+p.h/2-(gz.y+gz.h/2))<36){gz.gone=true;gz.t=2.8;p.dashUsed=false;p.dashCd=0;p.stam=p.stamMax;p.jumps=Math.min(p.jumps,1);AudioFX.sfx('bounce');emit(gz.x+16,gz.y+16,'#7dffe8',16,200);toast('冲刺与二段跳已恢复',900)}}
 // 位移
 p.vx+=(p.ax||0)*dt;var vxo=p.vx;moveX(p,p.vx*dt);moveY(p,p.vy*dt);
 if(p.ground&&!p.wasGround){if(p.slam){slamLand()}else if(p.fall>260){p.sx=1.22;p.sy=.8;AudioFX.sfx('land');shake=Math.max(shake,Math.min(4,p.fall/250));emit(p.x+p.w/2,p.y+p.h,'#dfeef3',Math.min(10,p.fall/90|0),110,.4)}}
 if(p.ground)p.slam=false;
 // 弹簧
 for(i=0;i<R.springs.length;i++){var s=R.springs[i];if(p.vy>=0&&p.x+p.w>s.x&&p.x<s.x+s.w&&p.y+p.h>=s.y+s.h-12&&p.y+p.h<=s.y+s.h+14){p.vy=-820;p.ground=false;p.jumps=1;p.slam=false;s.sq=1;AudioFX.sfx('bounce');emit(s.x+s.w/2,s.y,'#8bf3df',10,140)}}
 // 安全点
 if(p.ground&&!p.standOn&&!nearHazard(p)){p.safeT+=dt;if(p.safeT>.3){p.safe.x=p.x;p.safe.y=p.y}}else p.safeT=0;
 // 攻击判定
 combat();
 // 交互
 if(buf.interact>0){buf.interact=0;doInteract()}
 // 拾取
 var pr={x:p.x,y:p.y,w:p.w,h:p.h},cxp=p.x+p.w/2,cyp=p.y+p.h/2;
 R.shards.forEach(function(s){if(!s.got&&Math.abs(cxp-(s.x+16))<26&&Math.abs(cyp-(s.y+16))<30){s.got=true;totalShards++;var gk=ci+'-'+li;(got[gk]=got[gk]||{})[s.id]=1;MM.shard(gk,s.id);AudioFX.sfx('shard');emit(s.x+16,s.y+16,'#fff1a8',16,200);$('shardNum').textContent=totalShards}});
 R.hearts.forEach(function(h){if(!h.got&&Math.abs(cxp-(h.x+16))<26&&Math.abs(cyp-(h.y+16))<30){if(P.hp<P.max){h.got=true;P.hp++;hearts();AudioFX.sfx('heal');emit(h.x+16,h.y+16,'#ff9f9f',14,160);toast('喝一口保温杯，恢复 1 点生命')}else if(!h.temp&&!h.hint){h.hint=1;toast('生命已满，先留着')}}});
 R.checks.forEach(function(c){if(!c.lit&&Math.abs(cxp-(c.x+c.w/2))<36&&Math.abs(cyp-(c.y+c.h/2))<70){R.checks.forEach(function(o){o.lit=false});c.lit=true;R.cp={x:c.x+c.w/2-PW/2,y:c.y+c.h-PH};AudioFX.sfx('check');emit(c.x+16,c.y+10,'#ffe27a',20,200);toast('信标灯点亮：存档');saveGame(true)}});
 // 危险物
 if(p.inv<=0&&p.dash<=0){
  for(i=0;i<R.spikes.length;i++){var sk=R.spikes[i];if(ov(pr,{x:sk.x+3,y:sk.y+sk.h*.35,w:sk.w-6,h:sk.h*.65})){if(p.slam){p.slam=false;p.vy=-540;p.jumps=1;AudioFX.sfx('hit')}else damagePlayer(1,{respawn:true});return}}
  for(i=0;i<R.lavas.length;i++){var lv=R.lavas[i];if(ov(pr,{x:lv.x,y:lv.y+8,w:lv.w,h:R.h-lv.y})){damagePlayer(1,{respawn:true});return}}
  for(i=0;i<R.lasers.length;i++){var ls=R.lasers[i];if(ls.active&&ov(pr,{x:ls.x+ls.w/2-5,y:ls.y+8,w:10,h:ls.h-16})){damagePlayer(1,{dir:p.face});return}}
  for(i=0;i<R.fire.length;i++){var f=R.fire[i];if(f.on&&ov(pr,f)){damagePlayer(1,{dir:p.face});return}}
  for(i=0;i<R.saws.length;i++){var sw=R.saws[i];if(ov(pr,{x:sw.x+sw.w/2-sw.w*.38,y:sw.y+sw.h/2-sw.h*.38,w:sw.w*.76,h:sw.h*.76})){damagePlayer(1,{dir:p.x+p.w/2>sw.x+sw.w/2?-1:1});return}}
  for(i=0;i<R.flames.length;i++){var fl=R.flames[i];if(fl.active&&ov(pr,{x:fl.x+fl.w/2-9,y:fl.y+6,w:18,h:fl.h-14})){damagePlayer(1,{dir:p.face});return}}
  for(i=0;i<R.icicles.length;i++){var ci2=R.icicles[i];if(ci2.st==='fall'&&ov(pr,{x:ci2.x+5,y:ci2.y,w:ci2.w-10,h:ci2.h})){damagePlayer(1,{dir:p.face});ci2.st='gone';ci2.gone=true;ci2.t=4;emit(ci2.x+ci2.w/2,ci2.y+ci2.h,'#dff5ff',14,200);return}}}
 if(p.y>R.h+80){if(p.inv<=0||true){p.inv=0;damagePlayer(1,{respawn:true})}}
 // 触发区 / 出口
 R.triggers.forEach(function(t){if(!t.used&&ov(pr,t)){t.used=true;say(t,'boss')}});
 var ex=R.exit;if(ex){ex.locked=!!(R.bossDef&&!(R.boss&&R.boss.dead&&R.boss.deadT<=0&&R.bossGone));
  if(ov(pr,{x:ex.x,y:ex.y,w:ex.w,h:ex.h})){
   if(ex.locked){p.exitT=0;if(!p.warned){p.warned=true;toast('出口被封锁：先击败守关者')}}
   else if(p.dash>0||p.hurt>0){p.exitT=0} /* 冲刺 / 被击飞时穿过出口不算：避免莫名其妙过关 */
   else{p.exitT=(p.exitT||0)+dt;if(p.exitT>=.3)finishRoom()}}
  else{p.exitT=0;p.warned=false}}
 // 动画状态
 p.state=p.hurt>0?'hurt':p.dash>0?'dash':p.atk>0?'attack':!p.ground?(p.vy<0?'jump':'fall'):Math.abs(p.vx)>30?'run':'idle'}
function slamLand(){var p=P;p.slam=false;shake=Math.max(shake,9);AudioFX.sfx('boom');p.sx=1.35;p.sy=.7;emit(p.x+p.w/2,p.y+p.h,'#ffd28a',22,260);emit(p.x+p.w/2,p.y+p.h,'#fff',10,300);
 var cx=p.x+p.w/2;R.rubble.forEach(function(r){if(!r.dead&&Math.abs(cx-(r.x+r.w/2))<r.w/2+70&&r.y+r.h>p.y+p.h-50){hitRubble(r,2)}});
 R.enemies.forEach(function(e){if(!e.dead&&Math.abs(cx-(e.x+e.w/2))<90&&Math.abs(e.y+e.h-(p.y+p.h))<30)damageEnemy(e,1,p.face)});
 var b=R.boss;if(b&&!b.dead&&Math.abs(cx-(b.x+b.w/2))<b.w/2+60&&b.y+b.h>p.y+p.h-30)hitBoss(1)}
function hitRubble(r,n){if(r.dead)return;r.hp-=n;AudioFX.sfx('hit');emit(r.x+r.w/2,r.y+r.h/2,'#d7c9b7',16,200);shake=Math.max(shake,4);if(r.hp<=0){r.dead=true;MM.cnt('rubble');toast('碎石被击碎！')}else toast('碎石出现裂纹')}
/* 远程攻击：粉笔。直线偏快、带一点下坠（抛体）；对敌人 1 点伤害，对 Boss 0.5 点；也能打碎碎石、触发开关。冷却 0.42 秒，最多同时 3 支。 */
function throwChalk(){var p=P;if(R.chalk.length>=3)return;p.chalkCd=.42;AudioFX.sfx('shoot');R.chalk.push({x:p.x+p.w/2+p.face*14,y:p.y+p.h*.38,vx:p.face*600+p.vx*.25,vy:-70,t:0,life:1.7});emit(p.x+p.w/2+p.face*16,p.y+p.h*.38,'#ffffff',4,90,.25,0)}
function updateChalk(dt){var i,j,b=R.boss;for(i=R.chalk.length-1;i>=0;i--){var q=R.chalk[i],dead=false;q.t+=dt;q.life-=dt;q.vy+=330*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;
  if(q.life<=0||q.x<-20||q.x>R.w+20||q.y>R.h+40)dead=true;
  if(!dead&&solidAt(q.x,q.y))dead=true;
  var box={x:q.x-6,y:q.y-4,w:12,h:8};
  if(!dead){var d=dyn();for(j=0;j<d.length;j++)if(ov(box,d[j])){if(d[j].kind==='rubble')hitRubble(d[j],1);dead=true;break}}
  if(!dead)R.switches.forEach(function(sw){if(!dead&&!sw.on&&ov(box,{x:sw.x-4,y:sw.y-4,w:sw.w+8,h:sw.h+8})){toggleSwitch(sw);dead=true}});
  if(!dead)for(j=0;j<R.enemies.length;j++){var e=R.enemies[j];if(!e.dead&&ov(box,er(e))){if(damageEnemy(e,1,q.vx>0?1:-1))MM.cnt('chalkHits');dead=true;break}}
  if(!dead&&b&&!b.dead&&b.deadT<=0&&ov(box,{x:b.x+b.w*.15,y:b.y+b.h*.12,w:b.w*.7,h:b.h*.82})){if(!b.started){b.started=true;b.timer=1.2;AudioFX.sfx('roar');toast(b.label+' 拦住了去路！')}if(hitBoss(.5))MM.cnt('chalkHits');dead=true}
  if(dead){emit(q.x,q.y,'#ffffff',6,120,.3,300);R.chalk.splice(i,1)}}}
function combat(){var p=P,i;
 var slash=p.atk>.03&&p.atk<.2?{x:p.face>0?p.x+p.w-2:p.x-54,y:p.y-4,w:56,h:p.h+4}:null;
 var body={x:p.x,y:p.y,w:p.w,h:p.h},stab=p.slam&&p.vy>0?{x:p.x-4,y:p.y+p.h-8,w:p.w+8,h:20}:null;
 R.enemies.forEach(function(e){if(e.dead)return;var r=er(e);
  if(slash&&e.hit!==p.swing&&ov(slash,r)){e.hit=p.swing;damageEnemy(e,1,p.face);hitstop=.05;shake=Math.max(shake,3);if(e.kind==='guard'){e.windup=0}}
  else if(p.dash>0&&e.dashHit!==p.dashId&&ov(body,r)){e.dashHit=p.dashId;damageEnemy(e,1,p.face);if(e.kind==='guard'||e.kind==='turret'){p.dash=0;p.vx=-p.face*180}}
  else if(stab&&ov(stab,r)){damageEnemy(e,1,p.face);p.slam=false;p.vy=-560;p.jumps=1;p.dashUsed=false;p.stam=Math.min(p.stamMax,p.stam+1);hitstop=.05}
  if(!e.dead&&p.inv<=0&&p.dash<=0&&ov(body,r)&&!(e.kind==='ghost'&&e.alpha<.5)){damagePlayer(1,{dir:e.x+e.w/2>p.x+p.w/2?1:-1})}});
 R.rubble.forEach(function(r){if(r.dead)return;if(slash&&r.hit!==p.swing&&ov(slash,r)){r.hit=p.swing;hitRubble(r,1);hitstop=.04}});
 R.switches.forEach(function(s){if(slash&&!s.on&&ov(slash,{x:s.x-8,y:s.y-8,w:s.w+16,h:s.h+16}))toggleSwitch(s)});
 var b=R.boss;if(b&&!b.dead&&b.deadT<=0){var br={x:b.x+b.w*.15,y:b.y+b.h*.12,w:b.w*.7,h:b.h*.82};
  if(slash&&b.hitSw!==p.swing&&ov(slash,br)){b.hitSw=p.swing;hitBoss(1)}
  else if(p.dash>0&&b.dashHit!==p.dashId&&ov(body,br)){b.dashHit=p.dashId;if(hitBoss(1,true)){p.dash=0;p.vx=-p.face*260}}
  else if(stab&&ov(stab,br)){if(hitBoss(1)){p.slam=false;p.vy=-600;p.jumps=1}}
  if(p.inv<=0&&p.dash<=0&&ov(body,br))damagePlayer(1,{dir:b.x+b.w/2>p.x+p.w/2?1:-1})}}
function toggleSwitch(s){if(s.on)return;s.on=true;AudioFX.sfx('switch');emit(s.x+16,s.y+10,'#ffe79a',16,180);toast('开关已启动')}
function doInteract(){var p=P,cx=p.x+p.w/2,cy=p.y+p.h/2,i;
 for(i=0;i<R.npcs.length;i++){var n=R.npcs[i];if(Math.abs(cx-(n.x+n.w/2))<62&&Math.abs(cy-(n.y+n.h/2))<60){n.face=cx<n.x+n.w/2?-1:1;if(window.DLCX)DLCX.onTalk(n);say(n);return}}
 for(i=0;i<R.signs.length;i++){var s=R.signs[i];if(Math.abs(cx-(s.x+s.w/2))<60&&Math.abs(cy-(s.y+s.h/2))<60){if(window.DLCX&&DLCX.isQuiz(s.say)){DLCX.quiz(s);return}startDialog(parseDialog(s.say||'路牌：……','sign'),null);return}}
 for(i=0;i<R.switches.length;i++){var w=R.switches[i];if(!w.on&&Math.abs(cx-(w.x+w.w/2))<56&&Math.abs(cy-(w.y+w.h/2))<60){toggleSwitch(w);return}}}
/* ---------- 敌人 ---------- */
function solidAt(px,py){return isSolid(cellAt(Math.floor(px/T),Math.floor(py/T)))}
function groundAt(px,py){var v=cellAt(Math.floor(px/T),Math.floor(py/T));return isSolid(v)||v===2}
function shoot(x,y,vx,vy,o){o=o||{};R.proj.push({x:x,y:y,vx:vx,vy:vy,r:o.r||7,life:o.life||3,col:o.col||'#ff8a5a',g:o.g||0,home:o.home||0,wave:!!o.wave,pierce:!!o.pierce,deflect:o.deflect!==false,t:0})}
function updateEnemies(dt){var p=P,pcx=p.x+p.w/2,pcy=p.y+p.h/2;
 R.enemies.forEach(function(e){if(e.dead)return;e.t+=dt;e.flash=Math.max(0,e.flash-dt);e.invt=Math.max(0,(e.invt||0)-dt);var ecx=e.x+e.w/2,ecy=e.y+e.h/2,dx=pcx-ecx,dy=pcy-ecy,dist=Math.hypot(dx,dy);
  if(e.kind==='slime'){var nx=e.x+e.vx*dt,ahead=e.vx>0?nx+e.w+2:nx-2;if(nx<e.min||nx+e.w>e.max+e.w||!groundAt(ahead,e.y+e.h+4)||solidAt(ahead,e.y+e.h-6)){e.vx=-e.vx}else e.x=nx;e.face=e.vx>0?1:-1;
   if(dist<170&&Math.abs(dy)<40)e.vx=(dx>0?1:-1)*70;else if(Math.abs(e.vx)>45)e.vx=(e.vx>0?1:-1)*40}
  else if(e.kind==='bee'){var rg=(e.p.range||4)*T;if(dist<230&&dist>10){e.x+=dx/dist*80*dt;e.y+=dy/dist*80*dt;e.face=dx>0?1:-1}else{var tx=e.hx+Math.sin(e.t*.9)*rg/2,ty=e.hy+Math.sin(e.t*2.3)*14;e.x+=(tx-e.x)*Math.min(1,dt*2);e.y+=(ty-e.y)*Math.min(1,dt*2);e.face=Math.cos(e.t*.9)>0?1:-1}}
  else if(e.kind==='turret'){var want=Math.atan2(dy,dx);if(dist<460){e.aim+=Math.atan2(Math.sin(want-e.aim),Math.cos(want-e.aim))*Math.min(1,dt*4);e.timer-=dt;
    if(e.charge>0){e.charge-=dt;if(e.charge<=0){var sx=ecx+Math.cos(e.aim)*e.w*.6,sy=e.y+e.h*.5+Math.sin(e.aim)*e.w*.6;shoot(sx,sy,Math.cos(e.aim)*260,Math.sin(e.aim)*260,{col:'#ffb36a',r:6});AudioFX.sfx('shoot');e.timer=e.p.rate||2}}
    else if(e.timer<=0)e.charge=.55}}
  else if(e.kind==='ghost'){var looked=(P.face>0&&dx<0)||(P.face<0&&dx>0);if(looked&&dist<380){e.alpha+=(.3-e.alpha)*Math.min(1,dt*6)}else{e.alpha+=(.85-e.alpha)*Math.min(1,dt*4);if(dist<420&&dist>4){e.x+=dx/dist*62*dt;e.y+=dy/dist*62*dt}}}
  else if(e.kind==='frog'){
   if(e.air){e.vy+=1500*dt;var fnx=e.x+e.vx*dt;if(!solidAt(fnx+(e.vx>0?e.w:0),e.y+e.h*.5))e.x=fnx;e.y+=e.vy*dt;
    if(e.vy>0&&groundAt(e.x+e.w/2,e.y+e.h)){e.y=Math.floor((e.y+e.h)/T)*T-e.h;e.air=false;e.vx=0;e.vy=0;e.timer=1+Math.random()*.9}
    if(e.y>R.h+80)e.dead=true}
   else{e.timer-=dt;if(e.timer<=0){var tow=dist<320&&Math.abs(dy)<100,fd=tow?(dx>0?1:-1):e.face;if(!tow){if(e.x<e.min)fd=1;else if(e.x>e.max)fd=-1}
     if(!groundAt(e.x+e.w/2+fd*78,e.y+e.h+6))fd=-fd;e.face=fd;e.vx=fd*135;e.vy=-430;e.air=true}}}
  else if(e.kind==='bat'){
   if(e.state==='rest'){e.rest=true;e.timer-=dt;if(dist<230&&e.timer<=0){e.state='dive';e.rest=false;e.timer=1.5;var ba=Math.atan2(dy,dx);e.vx=Math.cos(ba)*240;e.vy=Math.sin(ba)*240;e.face=dx>0?1:-1;AudioFX.sfx('dash')}}
   else if(e.state==='dive'){e.timer-=dt;e.x+=e.vx*dt;e.y+=e.vy*dt;if(e.timer<=0||solidAt(e.x+e.w/2,e.y+e.h/2)){e.state='return'}}
   else{var bhx=e.hx-e.x,bhy=e.hy-e.y,bhd=Math.hypot(bhx,bhy);e.face=bhx>0?1:-1;if(bhd<6){e.x=e.hx;e.y=e.hy;e.state='rest';e.timer=1.2}else{e.x+=bhx/bhd*120*dt;e.y+=bhy/bhd*120*dt}}}
  else if(e.kind==='guard'){if(e.state==='lunge'){e.timer-=dt;var lx=e.x+e.vx*dt,la=e.vx>0?lx+e.w+2:lx-2;if(groundAt(la,e.y+e.h+4)&&!solidAt(la,e.y+e.h-6))e.x=lx;if(e.timer<=0){e.state='idle';e.timer=1;e.vx=e.face*34}}
   else if(e.windup>0){e.windup-=dt;if(e.windup<=0){e.state='lunge';e.timer=.38;e.vx=e.face*380;AudioFX.sfx('dash')}}
   else{e.timer-=dt;if(dist<170&&Math.abs(dy)<50&&e.timer<=0){e.face=dx>0?1:-1;e.windup=.5}else{var gx=e.x+e.vx*dt,ga=e.vx>0?gx+e.w+2:gx-2;if(gx<e.min||gx>e.max||!groundAt(ga,e.y+e.h+4)||solidAt(ga,e.y+e.h-6))e.vx=-e.vx;else e.x=gx;e.face=e.vx>0?1:-1}}}
  else if(window.DLCX&&DLCX.ENEMY[e.kind])DLCX.ENEMY[e.kind](e,dt,{pcx:pcx,pcy:pcy,ecx:ecx,ecy:ecy,dx:dx,dy:dy,dist:dist});
 });
 R.enemies=R.enemies.filter(function(e){return !e.dead||!e.temp})}
/* ---------- Boss ---------- */
var BOSS_ATK={ice:['charge','volley','rain'],root:['rain','volley','slam'],spore:['volley','rain','summon'],lava:['charge','volley','rain','slam']};
var BOSS_COL={ice:'#bff3ff',root:'#f7f1e0',spore:'#b8ff9b',lava:'#ff9a4a'};
function updateBoss(dt){var b=R.boss;if(!b||b.dead)return;b.flash=Math.max(0,b.flash-dt);if(b.type==='paradox'&&window.DLCX){DLCX.updateBoss(b,dt);return}
 if(b.state==='dying'){b.deadT+=dt;shake=Math.max(shake,4);if(Math.random()<.5)emit(b.x+Math.random()*b.w,b.y+Math.random()*b.h,Math.random()<.5?'#fff':BOSS_COL[b.type],3,220,.8);
  if(b.deadT>2.2){b.dead=true;b.deadT=0;R.bossGone=true;MM.boss(b.type);AudioFX.sfx('win');flashA=.6;emit(b.x+b.w/2,b.y+b.h/2,'#fff',60,380,1.2);toast(b.label+' 化作光点散去——出口已开启！',3200);AudioFX.play(R.biome);saveGame(true)}return}
 var p=P,pcx=p.x+p.w/2,bcx=b.x+b.w/2,ph=b.phase,col=BOSS_COL[b.type],floorY=b.hy+b.h;
 if(!b.started){var trig=R.triggers.length&&R.triggers.every(function(t){return t.used});if((trig&&state==='play')||Math.abs(pcx-bcx)<340){b.started=true;b.timer=1.2;AudioFX.sfx('roar');shake=10;toast(b.label+' 拦住了去路！')}return}
 if(b.state!=='atk'||b.atk!=='charge')b.face=pcx<bcx?-1:1;
 if(b.type==='spore'){b.y=b.hy-30+Math.sin(time*1.6)*18}
 var minX=T,maxX=R.w-T-b.w;
 switch(b.state){
 case'idle':b.timer-=dt*(1+ph*.3);if(b.type!=='spore'){var d=pcx-bcx;if(Math.abs(d)>220)b.x+=Math.sign(d)*60*dt}else{b.x+=((pcx-b.w/2)-b.x)*Math.min(1,dt*.5)}b.x=Math.max(minX,Math.min(maxX,b.x));
  if(b.timer<=0){var list=BOSS_ATK[b.type]||BOSS_ATK.lava;b.atk=list[Math.floor(Math.random()*list.length)];if(b.atk===b.lastAtk)b.atk=list[(list.indexOf(b.atk)+1)%list.length];b.lastAtk=b.atk;b.state='wind';b.timer=.75-ph*.12;AudioFX.sfx('switch')}break;
 case'wind':b.timer-=dt;if(b.timer<=0)startBossAtk(b);break;
 case'stun':b.timer-=dt;if(b.timer<=0){b.state='idle';b.timer=.6}break;
 case'recover':b.timer-=dt;if(b.timer<=0){b.state='idle';b.timer=1.3-ph*.3}break;
 case'atk':b.timer-=dt;
  if(b.atk==='charge'){b.x+=b.vx*dt;if(Math.random()<.6)emit(b.vx>0?b.x:b.x+b.w,floorY-6,col,2,90,.4);if(b.x<=minX||b.x>=maxX||b.timer<=0){b.x=Math.max(minX,Math.min(maxX,b.x));AudioFX.sfx('boom');shake=Math.max(shake,10);
    if(b.type==='ice'){for(var i=0;i<3+ph;i++)warn(cam.x+60+Math.random()*(vw-120),'drop',.8)}endBossAtk(b)}}
  else if(b.atk==='slam'){b.vy+=2200*dt;b.y+=b.vy*dt;b.x+=b.vx*dt;b.x=Math.max(minX,Math.min(maxX,b.x));if(b.y>=b.hy&&b.vy>0){b.y=b.hy;AudioFX.sfx('boom');shake=Math.max(shake,12);emit(bcx,floorY,col,24,300);
    shoot(b.x,floorY-14,-320-ph*60,0,{wave:true,r:12,col:col,life:2.2,deflect:false,pierce:true});shoot(b.x+b.w,floorY-14,320+ph*60,0,{wave:true,r:12,col:col,life:2.2,deflect:false,pierce:true});endBossAtk(b)}}
  else if(b.timer<=0)endBossAtk(b);break}
}
function startBossAtk(b){var ph=b.phase,col=BOSS_COL[b.type],bcx=b.x+b.w/2,bcy=b.y+b.h*.45,pcx=P.x+P.w/2,pcy=P.y+P.h/2,i;b.state='atk';
 if(b.atk==='charge'){b.vx=b.face*(420+ph*90);b.timer=2.2;AudioFX.sfx('dash')}
 else if(b.atk==='volley'){var n=3+ph*2,base=Math.atan2(pcy-bcy,pcx-bcx);AudioFX.sfx('shoot');
  for(i=0;i<n;i++){var a=base+(i-(n-1)/2)*.2,sp=b.type==='spore'?150:260;
   if(b.type==='ice'||b.type==='lava')shoot(bcx,bcy,Math.cos(a)*sp,Math.sin(a)*sp-220,{g:520,col:col,r:9,life:3.5});
   else shoot(bcx,bcy,Math.cos(a)*sp,Math.sin(a)*sp,{col:col,r:b.type==='spore'?10:7,home:b.type==='spore'?1.4:0,life:b.type==='spore'?4.5:3})}b.timer=.5}
 else if(b.atk==='rain'){var k=3+ph*2,kind=(b.type==='ice'||b.type==='spore')?'drop':'pillar';warn(pcx,kind,.9);for(i=1;i<k;i++)warn(cam.x+40+Math.random()*(vw-80),kind,.9+i*.12);b.timer=.9}
 else if(b.atk==='slam'){b.vy=-860;b.vx=(pcx-bcx)*1.15;b.y-=2;b.timer=3;AudioFX.sfx('djump')}
 else if(b.atk==='summon'){var alive=R.enemies.filter(function(e){return e.temp&&!e.dead}).length;for(i=0;i<Math.min(2,4-alive);i++){var e=makeEnemy({id:'sum'+Math.random(),kind:i%2?'ghost':'bee',x:bcx+(i?60:-90),y:b.y,w:64,h:64,p:{range:3}});e.temp=true;R.enemies.push(e);emit(e.x+32,e.y+32,col,14,160)}AudioFX.sfx('roar');b.timer=.6}}
function endBossAtk(b){b.state='recover';b.timer=.9-b.phase*.2;b.vx=0;b.vy=0}
function warn(x,kind,t){var w=56;x=Math.max(8,Math.min(R.w-w-8,x-w/2));var fy=R.h,ty=Math.floor((P.y+P.h)/T);for(var y=Math.max(0,ty-2);y<R.ch;y++){if(isSolid(cellAt(Math.floor((x+w/2)/T),y))){fy=y*T;break}}R.warns.push({x:x,w:w,y:fy,t:t,max:t,kind:kind})}
function updateHazards(dt){var i;
 for(i=R.warns.length-1;i>=0;i--){var w=R.warns[i];w.t-=dt;if(w.t<=0){R.warns.splice(i,1);var col=BOSS_COL[R.boss?R.boss.type:'lava'];
  if(w.kind==='pillar'){R.fire.push({x:w.x+6,y:w.y-T*3.2,w:w.w-12,h:T*3.2,t:.55,on:true,col:col});AudioFX.sfx('boom');shake=Math.max(shake,5);emit(w.x+w.w/2,w.y,col,16,280)}
  else shoot(w.x+w.w/2,cam.y-20,0,120,{g:900,col:col,r:11,life:3,deflect:true})}}
 for(i=R.fire.length-1;i>=0;i--){var f=R.fire[i];f.t-=dt;if(Math.random()<.6)emit(f.x+Math.random()*f.w,f.y+f.h,f.col,1,200,.5,-300);if(f.t<=0)R.fire.splice(i,1)}
 var pr={x:P.x+3,y:P.y+4,w:P.w-6,h:P.h-6},slash=P.atk>.03?{x:P.face>0?P.x+P.w-2:P.x-54,y:P.y-4,w:56,h:P.h+4}:null;
 for(i=R.proj.length-1;i>=0;i--){var q=R.proj[i];q.t+=dt;q.life-=dt;
  if(q.home&&P){var hx=P.x+P.w/2-q.x,hy=P.y+P.h/2-q.y,hd=Math.hypot(hx,hy)||1,sp=Math.hypot(q.vx,q.vy)||1;q.vx+=hx/hd*sp*q.home*dt;q.vy+=hy/hd*sp*q.home*dt;var ns=Math.hypot(q.vx,q.vy);q.vx*=sp/ns;q.vy*=sp/ns}
  q.vy+=q.g*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;var dead=q.life<=0||q.y>R.h+60||q.x<-60||q.x>R.w+60;
  if(!dead&&!q.pierce&&solidAt(q.x,q.y)){dead=true;emit(q.x,q.y,q.col,8,140,.35)}
  if(!dead&&slash&&q.deflect&&ov(slash,{x:q.x-q.r,y:q.y-q.r,w:q.r*2,h:q.r*2})){dead=true;AudioFX.sfx('hit');hitstop=.04;emit(q.x,q.y,'#ffffff',12,220,.35);MM.cnt('deflects');toast('弹反！',900)}
  if(!dead&&P.inv<=0&&P.dash<=0&&ov(pr,{x:q.x-q.r*.7,y:q.y-q.r*.7,w:q.r*1.4,h:q.r*1.4})){damagePlayer(1,{dir:q.vx>0?-1:1});dead=!q.pierce}
  if(dead)R.proj.splice(i,1)}}
/* ---------- 镜头 ---------- */
function updateCamera(dt,snap){var p=P,look=p.face*vw*.08+p.vx*.12,tx=p.x+p.w/2-vw/2+look,ty=p.y+p.h/2-vh*.55;
 var padL=document.body.classList.contains('ui-split')?Math.min((30+150*ctlScale)/sc,vw*.22):0;if(R.w+padL<=vw)tx=(R.w-vw)/2;else tx=Math.max(-padL,Math.min(R.w-vw,tx));if(R.h<=vh)ty=R.h-vh;else ty=Math.max(0,Math.min(R.h-vh,ty));
 if(R.boss&&R.boss.started&&!R.boss.dead){var bx=(R.boss.x+R.boss.w/2+p.x)/2-vw/2;if(R.w>vw)tx=Math.max(-padL,Math.min(R.w-vw,tx*.6+bx*.4))}
 if(snap){cam.x=tx;cam.y=ty}else{var k=Math.min(1,dt*6);cam.x+=(tx-cam.x)*k;cam.y+=(ty-cam.y)*Math.min(1,dt*(p.vy>500?9:4))}}
/* ---------- 渲染 ---------- */
function bakeTiles(r){var c=GFX.mk(r.w,r.h),x=c.getContext('2d'),set=GFX.tiles(r.biome),tx,ty,v;
 for(ty=0;ty<r.ch;ty++)for(tx=0;tx<r.cw;tx++){v=r.cells[ty][tx];if(!v||v===3)continue;
  GFX.drawTile(x,set,v,tx,ty,{up:!isSolid(cellAt(tx,ty-1))&&cellAt(tx,ty-1)!==2,down:!isSolid(cellAt(tx,ty+1)),left:!isSolid(cellAt(tx-1,ty)),right:!isSolid(cellAt(tx+1,ty))})}
 return c}
function drawWeather(biome){var w=L15.weatherOf(biome),i;if(weather.length!==w.n||weather.key!==biome){weather=[];weather.key=biome;for(i=0;i<w.n;i++)weather.push({x:Math.random(),y:Math.random(),z:.4+Math.random()*.9,p:Math.random()*6})}
 g.save();for(i=0;i<weather.length;i++){var q=weather[i],x=((q.x*W-cam.x*sc*q.z*.4+time*w.vx*q.z*sc)%W+W)%W,y=((q.y*H-cam.y*sc*q.z*.3+time*w.vy*q.z*sc+Math.sin(time+q.p)*10)%H+H)%H;
  g.globalAlpha=(w.glow?.35+Math.sin(time*3+q.p)*.3:.75)*q.z;g.fillStyle=w.c;
  if(w.leaf){g.save();g.translate(x,y);g.rotate(time*2+q.p);GFX.ell(g,0,0,w.r*2*q.z*sc,w.r*q.z*sc);g.fill();g.restore()}else{g.beginPath();g.arc(x,y,w.r*q.z*Math.max(1,sc*.8),0,6.283);g.fill()}}
 g.restore()}
function nearInteract(){if(!P||!R)return null;var cx=P.x+P.w/2,cy=P.y+P.h/2,i,o;
 for(i=0;i<R.npcs.length;i++){o=R.npcs[i];if(Math.abs(cx-(o.x+o.w/2))<62&&Math.abs(cy-(o.y+o.h/2))<60)return{x:o.x+o.w/2,y:o.y-30,t:'对话'}}
 for(i=0;i<R.signs.length;i++){o=R.signs[i];if(Math.abs(cx-(o.x+o.w/2))<60&&Math.abs(cy-(o.y+o.h/2))<60)return{x:o.x+o.w/2,y:o.y-12,t:'查看'}}
 for(i=0;i<R.switches.length;i++){o=R.switches[i];if(!o.on&&Math.abs(cx-(o.x+o.w/2))<56&&Math.abs(cy-(o.y+o.h/2))<60)return{x:o.x+o.w/2,y:o.y-14,t:'拉动'}}
 if(!P.climb)for(i=0;i<R.vines.length;i++){o=R.vines[i];if(Math.abs(cx-(o.x+o.w/2))<18&&P.y+P.h*.7>o.y&&P.y<o.y+o.h-14)return{x:o.x+o.w/2,y:P.y-18,t:'攀爬'}}
 return null}
var interactBtn=document.querySelector('[data-act="interact"]');
function render(){g.setTransform(dpr,0,0,dpr,0,0);
 if(!R){GFX.drawBg(g,'snow',W,H,time*30,0,sc,time);drawWeather('snow');return}
 var b=GFX.B(R.biome),i,o,t=time;GFX.drawBg(g,R.biome,W,H,cam.x,cam.y,sc,t);g.fillStyle=b.sky[0];g.globalAlpha=.28;g.fillRect(0,0,W,H);g.globalAlpha=1;
 var sx=(Math.random()-.5)*shake,sy=(Math.random()-.5)*shake*.6;
 g.setTransform(dpr*sc,0,0,dpr*sc,Math.round((-cam.x+sx)*sc*dpr),Math.round((-cam.y+sy)*sc*dpr));
 var vx0=cam.x-64,vx1=cam.x+vw+64;function vis(o){return o.x+o.w>vx0&&o.x<vx1}
 R.decor.forEach(function(o){if(vis(o))GFX.thing(g,o,t,R.biome,R.h)});
 g.drawImage(R.tileCanvas,0,0);
 var set=GFX.tiles(R.biome);for(var ty=0;ty<R.ch;ty++)for(var tx=Math.max(0,Math.floor(vx0/T));tx<Math.min(R.cw,Math.ceil(vx1/T));tx++)if(R.cells[ty][tx]===3){var ba=R.bounceAnim[ty*R.cw+tx],sq=ba!=null?Math.max(0,1-(t-ba)*4):0;g.save();g.translate(tx*T+T/2,ty*T+T);g.scale(1+sq*.25,1-sq*.3+Math.sin(t*3+tx)*.02);g.drawImage(set.bounce,-T/2,-T,T,T);g.restore()}
 [R.winds,R.lavas,R.spikes,R.lasers,R.flames,R.vines,R.vents,R.spores,R.springs,R.movers,R.crumbles,R.convs,R.gates,R.plates,R.switches,R.checks,R.signs,R.icicles,R.saws,R.gems,R.xthings].forEach(function(a){a.forEach(function(o){if(vis(o))GFX.thing(g,o,t,R.biome,R.h)})});
 R.rubble.forEach(function(o){if(!o.dead&&vis(o))GFX.thing(g,o,t,R.biome,R.h)});
 if(R.exit){GFX.thing(g,R.exit,t,R.biome,R.h);if(P&&P.exitT>0){var kx=Math.min(1,P.exitT/.3);g.save();g.strokeStyle='#fff1a8';g.lineWidth=5;g.lineCap='round';g.beginPath();g.arc(R.exit.x+R.exit.w/2,R.exit.y-18,16,-Math.PI/2,-Math.PI/2+kx*Math.PI*2);g.stroke();g.restore()}}
 R.shards.forEach(function(o){if(!o.got&&vis(o))GFX.thing(g,o,t,R.biome,R.h)});R.hearts.forEach(function(o){if(!o.got&&vis(o))GFX.thing(g,o,t,R.biome,R.h)});
 R.warns.forEach(function(w){var k=1-w.t/w.max,bl=Math.sin(t*30)>0?1:.5;g.fillStyle='#ff3a3a';g.globalAlpha=(.12+k*.25)*bl;if(w.kind==='pillar')g.fillRect(w.x,w.y-T*3.2,w.w,T*3.2);else g.fillRect(w.x,cam.y,w.w,w.y-cam.y);g.globalAlpha=.8*bl;g.fillRect(w.x,w.y-4,w.w,4);g.globalAlpha=1});
 R.fire.forEach(function(f){var fg=g.createLinearGradient(0,f.y+f.h,0,f.y);fg.addColorStop(0,'#ffffff');fg.addColorStop(.3,f.col);fg.addColorStop(1,f.col+'00');g.fillStyle=fg;g.globalAlpha=Math.min(1,f.t*4);g.fillRect(f.x,f.y,f.w,f.h);g.globalAlpha=1;GFX.glow(g,f.x+f.w/2,f.y+f.h*.6,f.h*.7,f.col,.5)});
 R.npcs.forEach(function(n){if(!vis(n))return;GFX.npc(g,n.p&&n.p.tex?n.kind+"#"+n.p.tex:n.kind,n.x,n.y,n.w,n.h,t,n.face||(P.x<n.x?-1:1));g.fillStyle='rgba(8,20,32,.6)';g.font='bold 11px "Noto Sans SC",sans-serif';g.textAlign='center';var lw=g.measureText(n.label).width+12;g.beginPath();g.roundRect(n.x+n.w/2-lw/2,n.y-56,lw,17,8);g.fill();g.fillStyle='#e9fffb';g.fillText(n.label,n.x+n.w/2,n.y-43)});
 R.enemies.forEach(function(e){if(!e.dead&&vis(e))GFX.enemy(g,e,t,R.biome)});
 if(R.boss&&!R.boss.dead){g.save();if(R.boss.state==='dying')g.globalAlpha=Math.sin(t*40)>0?1:.35;GFX.boss(g,R.boss,t);g.restore()}
 R.chalk.forEach(function(q){GFX.chalk(g,q,t)});
 R.proj.forEach(function(q){GFX.glow(g,q.x,q.y,q.r*3,q.col,.55);g.fillStyle='#fff';g.beginPath();g.arc(q.x,q.y,q.r*.55,0,6.283);g.fill();g.fillStyle=q.col;g.globalAlpha=.85;g.beginPath();g.arc(q.x,q.y,q.r,0,6.283);g.fill();g.globalAlpha=1});
 if(window.DLCX)DLCX.drawWorld(g,t);if(P&&!(state==='dead'&&P.dead<1.2)){P.cx=P.x+P.w/2;P.cy=P.y+P.h;
  for(i=P.trail.length-1;i>=0;i--){var tr=P.trail[i];GFX.hero(g,{cx:tr.x,cy:tr.y,face:tr.f,vx:400,vy:0,ground:true,anim:P.anim,state:'dash',atk:0},t,b.accent,tr.t*1.6)}
  var al=P.inv>0&&P.dash<=0&&Math.floor(t*16)%2?.35:1;GFX.hero(g,P,t,b.accent,al);
  if(P.atk>0){var pr=1-P.atk/.22;g.save();g.translate(P.x+P.w/2,P.y+P.h*.45);g.scale(P.face,1);g.globalAlpha=Math.min(1,P.atk*7);g.strokeStyle=b.accent;g.lineWidth=7;g.lineCap='round';g.beginPath();g.arc(8,0,40,-1.3+pr*.6,-1.3+pr*.6+2.2*Math.min(1,pr*2.5));g.stroke();g.strokeStyle='#fff';g.lineWidth=2.5;g.beginPath();g.arc(8,0,40,-1.2+pr*.6,-1.2+pr*.6+2*Math.min(1,pr*2.5));g.stroke();g.restore()}
  if(P.slam){g.strokeStyle='#ffd28a';g.globalAlpha=.8;g.lineWidth=4;g.beginPath();g.moveTo(P.x+4,P.y-14);g.lineTo(P.x+4,P.y-40);g.moveTo(P.x+P.w-4,P.y-14);g.lineTo(P.x+P.w-4,P.y-40);g.stroke();g.globalAlpha=1}}
 parts.forEach(function(p){g.globalAlpha=Math.max(0,Math.min(1,p.life/p.max*1.5));g.fillStyle=p.c;g.beginPath();g.arc(p.x,p.y,p.r*Math.max(.3,p.life/p.max),0,6.283);g.fill()});g.globalAlpha=1;
 var ni=state==='play'?nearInteract():null;if(ni){g.save();g.translate(ni.x,ni.y+Math.sin(t*5)*3);var touchy=document.body.classList.contains('touch'),lab=(touchy?'':'E ')+ni.t;g.font='bold 12px "Noto Sans SC",sans-serif';g.textAlign='center';var ww=g.measureText(lab).width+18;g.fillStyle='rgba(8,24,38,.88)';g.beginPath();g.roundRect(-ww/2,-22,ww,22,11);g.fill();g.strokeStyle=b.accent;g.lineWidth=1.5;g.stroke();g.fillStyle='#e5fffb';g.fillText(lab,0,-6.5);g.restore()}
 if(interactBtn)interactBtn.classList.toggle('ready',!!ni);
 g.setTransform(dpr,0,0,dpr,0,0);drawWeather(R.biome);
 if(!vig||vig.w!==W||vig.h!==H){vig=GFX.mk(Math.max(1,W),Math.max(1,H));vig.w=W;vig.h=H;var vg=vig.getContext('2d'),rg=vg.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.max(W,H)*.75);rg.addColorStop(0,'rgba(0,0,0,0)');rg.addColorStop(1,'rgba(0,0,0,.45)');vg.fillStyle=rg;vg.fillRect(0,0,W,H)}g.drawImage(vig,0,0,W,H);
 if(P&&P.hp===1&&state==='play'){g.fillStyle='rgba(255,40,70,'+(.08+Math.sin(t*5)*.05)+')';g.fillRect(0,0,W,H)}
 if(window.DLCX)DLCX.drawScreen(g,W,H,t);if(flashA>0){g.fillStyle='rgba(255,255,255,'+flashA+')';g.fillRect(0,0,W,H)}
 var bb=R.boss;if(bb&&bb.type==='paradox'&&bb.started&&!bb.dead){DLCX.drawBossHud(g,bb,W,H)}else if(bb&&bb.started&&!bb.dead){var cl=document.body.classList.contains('ui-cluster'),bw=Math.min(cl?600:520,W*(cl?.42:.6)),bx=(W-bw)/2,by=cl?Math.round(70*Math.max(1,Math.min(1.75,Math.min(W,H)/700))):H-(document.body.classList.contains('touch')?Math.min(200,H*.32):56);g.fillStyle='rgba(6,14,24,.75)';g.beginPath();g.roundRect(bx-12,by-26,bw+24,44,12);g.fill();g.fillStyle='#ffe9d9';g.font='bold 13px "Noto Sans SC",sans-serif';g.textAlign='left';g.fillText(bb.label,bx,by-8);g.textAlign='right';g.fillStyle='#ffb79a';g.fillText(['','第二阶段','狂暴'][bb.phase]||'',bx+bw,by-8);g.fillStyle='#3a1f26';g.beginPath();g.roundRect(bx,by,bw,9,5);g.fill();g.fillStyle=bb.flash>0?'#fff':'#ff6a4f';g.beginPath();g.roundRect(bx,by,Math.max(0,bw*bb.hp/bb.max),9,5);g.fill();g.textAlign='start'}
 if(state==='dead'){g.fillStyle='rgba(10,4,12,'+Math.min(.7,(1.5-P.dead)*.9)+')';g.fillRect(0,0,W,H);g.fillStyle='#ffe3e3';g.font='900 '+Math.round(Math.min(34,W*.06))+'px "Noto Sans SC",sans-serif';g.textAlign='center';g.fillText('深呼吸，再来一次',W/2,H/2);g.textAlign='start'}
}
/* ---------- 图鉴 / 成就 ---------- */
var CODEX_KEYS={};window.L15_META_DATA.CODEX.forEach(function(e){CODEX_KEYS[e.k]=1});
function scanCodex(){if(TEST||!R||!P)return;var x0=cam.x-40,x1=cam.x+vw+40,y0=cam.y-40,y1=cam.y+vh+40,k,o,key;
 for(k in R.byId){o=R.byId[k];if(!(o.x+o.w>x0&&o.x<x1&&o.y+o.h>y0&&o.y<y1))continue;key=o.kind==='boss'?'boss_'+((o.p&&o.p.boss)||'lava'):o.kind;if(CODEX_KEYS[key])MM.seen(key)}
 var tx0=Math.max(0,Math.floor(x0/T)),tx1=Math.min(R.cw-1,Math.ceil(x1/T)),ty0=Math.max(0,Math.floor(y0/T)),ty1=Math.min(R.ch-1,Math.ceil(y1/T)),tx,ty,v;
 for(ty=ty0;ty<=ty1;ty++){var row=R.cells[ty];if(!row)continue;for(tx=tx0;tx<=tx1;tx++){v=row[tx];if(v&&Meta.TERR[v])MM.seen(Meta.TERR[v])}}}
function checkAch(){if(TEST)return;if(!inDLC&&Meta.checkDLCUnlock()){Meta.flush();AudioFX.sfx('win');toast('🌀 DLC「未竟之梦」已解锁！在标题页的 DLC 菜单进入',4200)}var a=Meta.check(campaign);Meta.flush();if(a.length){AudioFX.sfx('win');toast('🏆 成就解锁：'+a.map(function(x){return x.n}).join('、'),3600)}}
/* ---------- 流程 ---------- */
function show(id,on){$(id).classList.toggle('hidden',!on)}
function hideMenus(){['menu','chapters','pause','settings','ending','testDone','saves','achv','codex'].forEach(function(id){show(id,false)})}
function setHud(){var ch=campaign.chapters[ci],lv=ch.levels[li];$('hudChapter').textContent=(TEST?'试玩':'第'+'一二三四五六七八九十'.charAt(ci)+'章')+' · '+ch.name;$('hudRoom').textContent=lv.name+'  '+(li+1)+'/'+ch.levels.length;$('objective').textContent='目标：'+(lv.objective||'找到出口');$('shardNum').textContent=inDLC?totalBlue:totalShards;document.body.classList.toggle('dlc-mode',inDLC)}
function banner(a,b2,c){var el=$('banner');$('bnA').textContent=a;$('bnB').textContent=b2;$('bnC').textContent=c||'';el.classList.remove('show');void el.offsetWidth;el.classList.add('show')}
function enterLevel(c,l){try{enterLevelRaw(c,l)}catch(e){console.error('地图加载失败，重试一次',e);try{enterLevelRaw(c,l)}catch(e2){console.error(e2);backToTitle('地图加载失败，已返回主页面')}}}
function backToTitle(msg){fadeBusy=false;var f=$('fade');if(f)f.classList.remove('on');dlg.active=false;dlg.done=null;$('dialog').classList.add('hidden');try{if(window.DLCX)DLCX.leaveRoom()}catch(e){}try{titleScreen()}catch(e){console.error(e)}if(msg)toast(msg,3200)}
function enterLevelRaw(c,l){if(window.DLCX)DLCX.leaveRoom();ci=c;li=l;$('story').classList.add('hidden');story.cb=null;dlg.active=false;dlg.done=null;$('dialog').classList.add('hidden');var ch=campaign.chapters[c],lv=ch.levels[l];R=buildRoom(lv);R.tileCanvas=bakeTiles(R);P=newPlayer(R.spawn.x,R.spawn.y);parts=[];buf={};hitstop=0;shake=0;flashA=0;
 hideMenus();show('hud',true);applyPrefs();setHud();hearts();updateCamera(0,true);AudioFX.play(R.bossDef?'boss':R.biome);state='play';
 banner(TEST?'试玩关卡':'第'+'一二三四五六七八九十'.charAt(c)+'章 · '+ch.name,lv.name,lv.intro||lv.objective);if(!TEST)saveGame(true)}
function startChapter(c){ci=c;unlocked=Math.max(unlocked,c);var ch=campaign.chapters[c];AudioFX.play(ch.biome);showStory(ch.intro||[],ch.biome,function(){fade(function(){enterLevel(c,0)})})}
function finishRoom(){if(R.done)return;R.done=true;AudioFX.sfx('door');state='trans';
 if(TEST){AudioFX.sfx('win');show('testDone',true);return}
 var ch=campaign.chapters[ci];
 if(li+1<ch.levels.length){fade(function(){enterLevel(ci,li+1)});return}
 if(inDLC)MM.dlcChapter('ch'+(ci+1));unlocked=Math.max(unlocked,Math.min(ci+1,campaign.chapters.length-1));if(ci+1<campaign.chapters.length){li=0;saveGame(true,{ci:ci+1,li:0})}
 fade(function(){R=null;P=null;show('hud',false);showStory(ch.outro||[],ch.biome,function(){
  if(ci+1<campaign.chapters.length)startChapter(ci+1);
  else{AudioFX.play('station');showStory(campaign.epilogue||[],'station',showEnding)}})})}
function totalShardCount(){var n=0;campaign.chapters.forEach(function(ch){ch.levels.forEach(function(l){l.objects.forEach(function(o){if(o.kind==='shard')n++})})});return n}
function showEnding(){if(inDLC){showDLCEnding();return}var eh=document.querySelector('#ending h2');if(eh)eh.textContent='老师到家了';state='ending';R=null;P=null;hideMenus();show('hud',false);$('controls').classList.add('hidden');AudioFX.sfx('win');
 var tot=totalShardCount();$('endStats').innerHTML='<div><b>'+totalShards+'</b><span>/ '+tot+' 信标碎片</span></div><div><b>'+stats.kills+'</b><span>击退的烦恼</span></div><div><b>'+stats.deaths+'</b><span>次重新出发</span></div>';
 $('endLine').textContent=totalShards>=tot?'你找回了每一句被遗落的话。全部碎片收集完成！':'还有 '+(tot-totalShards)+' 枚碎片散落在路上——它们是没被听见的声音，下次再去找找吧。';
 unlocked=campaign.chapters.length-1;MM.cleared(stats.deaths===0);saveGame(true,{cleared:true});show('ending',true)}
function gkey(){return (inDLC?'d':'')+ci+'-'+li}
function totalBlueCount(){var n=0;campaign.chapters.forEach(function(ch){ch.levels.forEach(function(l){l.objects.forEach(function(o){if(o.kind==='blueshard'||o.kind==='yellowshard')n++})})});return n}
function showDLCEnding(){var eh=document.querySelector('#ending h2');var en=campaign.ending||{};if(eh)eh.textContent=en.title||'大梦一场';state='ending';R=null;P=null;hideMenus();show('hud',false);$('controls').classList.add('hidden');AudioFX.sfx('win');
 var tot=totalBlueCount(),sn=en.shardName||'蓝色碎片';$('endStats').innerHTML='<div><b>'+totalBlue+'</b><span>/ '+tot+' '+sn+'</span></div><div><b>'+stats.kills+'</b><span>击退的烦恼</span></div><div><b>'+stats.deaths+'</b><span>次重新出发</span></div>';
 $('endLine').textContent=totalBlue>=tot?(en.win||'所有的问题，你都问出了口。全部蓝色碎片收集完成！'):(en.lose?en.lose.replace('{n}',tot-totalBlue):'还有 '+(tot-totalBlue)+' 枚蓝色碎片留在梦里——每一枚，都是一个值得再想一想的问题。');
 unlocked=campaign.chapters.length-1;MM.dlcCleared(stats.deaths===0);saveGame(true,{cleared:true});show('ending',true)}
/* DLC 进度：单独存，不占用主线的 3 个存档位 */
function dlcKey(){return 'line15-dlc-save-'+(dlcId||'x')}
function saveDLC(extra){var s={ci:ci,li:li,unlocked:unlocked,blue:totalBlue,got:got,stats:stats,t:Date.now()};if(extra)for(var k in extra)s[k]=extra[k];var old=LS.get(dlcKey());if(old&&old.cleared&&!s.cleared)s.cleared=true;LS.set(dlcKey(),s)}
function startDLCRun(c,id,mode,c0,l0){ /* mode: new 从序章开始 / continue 读取进度 / level 直接进某一关 / chapter 播放某章剧情后开始 */
 var s=LS.get('line15-dlc-save-'+id);setCampaign(c,id);hideMenus();AudioFX.init();
 function loadProg(){if(s&&s.stats){unlocked=Math.min(s.unlocked||0,campaign.chapters.length-1);totalBlue=s.blue||0;got=s.got||{};stats=s.stats||{deaths:0,kills:0,time:0}}else{unlocked=0;totalBlue=0;got={};stats={deaths:0,kills:0,time:0}}}
 if(mode==='continue'&&s&&s.ci!=null&&s.ci<campaign.chapters.length){loadProg();var l2=Math.min(s.li||0,campaign.chapters[s.ci].levels.length-1);fade(function(){enterLevel(s.ci,l2)});return}
 if(mode==='level'){loadProg();unlocked=Math.max(unlocked,c0);fade(function(){enterLevel(c0,l0)});return}
 if(mode==='chapter'){loadProg();unlocked=Math.max(unlocked,c0);startChapter(c0);return}
 got={};totalBlue=0;stats={deaths:0,kills:0,time:0};unlocked=0;ci=0;li=0;AudioFX.play(campaign.prologueBiome||'icecave');showStory(campaign.prologue||[],'train',function(){startChapter(0)})}function setCampaign(c,id){campaign=c||baseCampaign;if(campaign&&campaign.themes)L15.registerThemes(campaign.themes);inDLC=campaign!==baseCampaign;dlcId=inDLC?(id||null):null}
function sig(){return campaign.chapters.map(function(c){return c.levels.length}).join('-')}
/* 三个存档位：信标灯、过关、回标题时自动存到「当前使用的存档位」；暂停菜单里的「存档管理」可以手动存 / 覆盖 / 删除 / 读取。 */
function fixSave(s){if(!s||s.ci==null)return null;if(s.ci>=campaign.chapters.length){s.ci=campaign.chapters.length-1;s.li=0}if(s.li>=campaign.chapters[s.ci].levels.length)s.li=0;return s}
function ensureSlot(){if(slot<0){var n=Meta.newest();slot=n>=0?n:0}return slot}
function saveGame(silent,extra){if(TEST)return;if(inDLC){saveDLC(extra);return}var s={ci:ci,li:li,unlocked:unlocked,shards:totalShards,got:got,stats:stats,sig:sig(),t:Date.now()};if(extra)for(var k in extra)s[k]=extra[k];
 ensureSlot();var old=Meta.slots()[slot];if(old&&old.cleared&&!s.cleared)s.cleared=true;Meta.writeSlot(slot,s);if(!silent)toast('进度已保存到存档 '+(slot+1))}
function loadSave(){var n=Meta.newest();return n<0?null:fixSave(Meta.slots()[n])}
function applySave(s){unlocked=Math.min(s.unlocked||0,campaign.chapters.length-1);totalShards=s.shards||0;got=s.got||{};stats=s.stats||{deaths:0,kills:0,time:0};stats.deaths=stats.deaths||0;stats.kills=stats.kills||0;stats.time=stats.time||0}
function newGame(){got={};totalShards=0;stats={deaths:0,kills:0,time:0};unlocked=0;ci=0;li=0;hideMenus();AudioFX.init();AudioFX.play('station');if(!TEST&&slot>=0)saveGame(true);showStory(campaign.prologue||[],'school',function(){startChapter(0)})}
function titleScreen(){campaign=baseCampaign;inDLC=false;dlcId=null;document.body.classList.remove('dlc-mode');state='menu';R=null;P=null;hideMenus();show('hud',false);$('controls').classList.add('hidden');show('menu',true);var n=Meta.newest(),s=n<0?null:fixSave(Meta.slots()[n]);$('continueBtn').disabled=!s;
 $('continueInfo').textContent=s?('存档 '+(n+1)+' · '+campaign.chapters[s.ci].name+' · '+campaign.chapters[s.ci].levels[s.li].name+(s.cleared?'（已通关）':'')):'暂无存档';
 $('customTag').classList.toggle('hidden',!customCampaign);AudioFX.play('station')}
/* 存档页（界面在 meta-ui.js）：start 新旅程 / load 读取 / save 覆盖保存 / del 删除 */
function loadSlot(i){var s=fixSave(Meta.slots()[i]);if(!s)return;slot=i;applySave(s);hideMenus();AudioFX.duck(false);AudioFX.init();if(s.cleared){state='menu';show('menu',true);openChapters();return}fade(function(){enterLevel(s.ci,s.li)})}
function slotAction(act,i,mode){
 if(act==='start'){if(Meta.slots()[i]&&!confirm('存档 '+(i+1)+' 里已有进度，开始新旅程会把它覆盖，确定吗？'))return;Meta.deleteSlot(i);slot=i;newGame();return}
 if(act==='load'){loadSlot(i);return}
 if(act==='exp'){SaveFile.exportSlot(i);return}
 if(act==='imp'){SaveFile.importSlot(i,function(){toast('已导入到存档 '+(i+1));MetaUI.renderSaves(mode);if(state==='menu')titleScreen2()});return}
 if(act==='save'){if(!R||TEST)return;if(Meta.slots()[i]&&slot!==i&&!confirm('覆盖存档 '+(i+1)+' ？原来的进度将被替换。'))return;slot=i;saveGame(false);MetaUI.renderSaves(mode);return}
 if(act==='del'){if(!confirm('删除存档 '+(i+1)+' ？删除后无法恢复。'))return;Meta.deleteSlot(i);if(slot===i)slot=-1;toast('已删除存档 '+(i+1));MetaUI.renderSaves(mode);if(state==='menu')titleScreen2()}}
function titleScreen2(){var n=Meta.newest(),s=n<0?null:fixSave(Meta.slots()[n]);$('continueBtn').disabled=!s;$('continueInfo').textContent=s?('存档 '+(n+1)+' · '+campaign.chapters[s.ci].name+' · '+campaign.chapters[s.ci].levels[s.li].name+(s.cleared?'（已通关）':'')):'暂无存档'}
MetaUI.init({campaign:function(){return campaign},activeSlot:function(){return slot},slotAction:slotAction});
function openSaves(mode){MetaUI.renderSaves(mode);show('saves',true)}
function togglePause(force){if(state==='play'){state='pause';show('pause',true);AudioFX.duck(true);$('pauseInfo').textContent=campaign.chapters[ci].name+' · '+campaign.chapters[ci].levels[li].name+' · 碎片 '+totalShards}else if(state==='pause'&&!force){show('pause',false);show('settings',false);AudioFX.duck(false);state='play'}}
function openChapters(){var box=$('chapterList');box.innerHTML='';campaign.chapters.forEach(function(ch,i){var d=document.createElement('div'),locked=i>unlocked,bi=GFX.B(ch.biome);d.className='ch-card'+(locked?' locked':'');d.style.setProperty('--tint',bi.accent);d.style.setProperty('--sky',bi.sky[0]);
  d.innerHTML='<button class="ch-main"'+(locked?' disabled':'')+'><em>0'+(i+1)+'</em><strong>'+esc(ch.name)+'</strong><small>'+esc(ch.subtitle||'')+'</small><span>'+(locked?'🔒 尚未解锁':'▶ 从本章开头（含剧情）')+'</span></button><div class="rooms"></div>';
  if(!locked){d.querySelector('.ch-main').onclick=function(){hideMenus();AudioFX.init();startChapter(i)};var rb=d.querySelector('.rooms');ch.levels.forEach(function(l,j){var b=document.createElement('button');b.textContent=(j+1)+'. '+l.name.replace(/^\d+\s*·\s*/,'');b.onclick=function(){hideMenus();AudioFX.init();fade(function(){enterLevel(i,j)})};rb.appendChild(b)})}
  box.appendChild(d)});show('chapters',true)}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function qa(sel){return Array.prototype.slice.call(document.querySelectorAll(sel))}
function syncSettings(){$('setMute').checked=!prefs.mute;qa('[name=ctlSize]').forEach(function(r){r.checked=+r.value===prefs.size});qa('[name=ctlMode]').forEach(function(r){r.checked=r.value===prefs.controls});$('modeNow').textContent=({split:'分开',cluster:'聚集',hidden:'隐藏'})[uiMode()]||''}
/* 按钮 */
function on(id,fn){var el=$(id);if(el)el.addEventListener('click',function(e){AudioFX.init();AudioFX.sfx('select');fn(e)})}
on('newBtn',function(){openSaves('new')});
on('continueBtn',function(){var n=Meta.newest();if(n>=0)loadSlot(n)});
on('savesBtn',function(){openSaves('menu')});
on('achvBtn',function(){MetaUI.renderAchv();show('achv',true)});
on('codexBtn',function(){MetaUI.renderCodex();show('codex',true)});
on('chaptersBtn',function(){var n=Meta.newest(),s=n<0?null:fixSave(Meta.slots()[n]);if(s){slot=n;applySave(s)}openChapters()});
on('settingsBtn',function(){syncSettings();show('settings',true)});
on('closeChapters',function(){show('chapters',false);if(state==='menu')show('menu',true)});
on('closeSettings',function(){show('settings',false)});
on('closeSaves',function(){show('saves',false)});
on('closeAchv',function(){show('achv',false)});
on('closeCodex',function(){show('codex',false)});
on('pSavesBtn',function(){if(inDLC){toast('DLC 进度会在信标灯和过关时自动保存');return}openSaves('pause')});
on('pauseBtn',function(){togglePause()});
on('muteBtn',function(){prefs.mute=!prefs.mute;savePrefs();applyPrefs()});
on('resumeBtn',function(){togglePause()});
on('restartBtn',function(){show('pause',false);AudioFX.duck(false);fade(function(){enterLevel(ci,li)})});
on('pChaptersBtn',function(){show('pause',false);AudioFX.duck(false);openChapters()});
on('pSettingsBtn',function(){syncSettings();show('settings',true)});
on('titleBtn',function(){AudioFX.duck(false);saveGame(true);titleScreen()});
on('endTitle',function(){titleScreen()});
on('fullBtn',function(){var d=document.documentElement;try{if(!document.fullscreenElement&&!document.webkitFullscreenElement){(d.requestFullscreen||d.webkitRequestFullscreen).call(d)}else{(document.exitFullscreen||document.webkitExitFullscreen).call(document)}}catch(e){toast('此浏览器不支持全屏')}});
on('resetBtn',function(){if(confirm('确定清除全部 3 个存档？（成就 / 晶体 / 图鉴记录不受影响）')){Meta.clearSlots();LS.del(L15.STORAGE.save);slot=-1;got={};totalShards=0;unlocked=0;toast('存档已清除');if(state==='menu')titleScreen()}});
on('resetMetaBtn',function(){if(confirm('确定清除成就、累计晶体和图鉴记录？（存档不受影响）')){Meta.resetProgress();toast('成就 / 晶体 / 图鉴记录已清除')}});
on('tdRetry',function(){show('testDone',false);fade(function(){enterLevel(0,0)})});
on('tdBack',function(){location.href='editor.html'});
$('setMute').onchange=function(e){prefs.mute=!e.target.checked;savePrefs();applyPrefs()};
qa('[name=ctlSize]').forEach(function(r){r.onchange=function(){prefs.size=+r.value;savePrefs();applyPrefs()}});
qa('[name=ctlMode]').forEach(function(r){r.onchange=function(){prefs.controls=r.value;savePrefs();applyPrefs();syncSettings();toast(({auto:'触屏按钮：自动识别',split:'触屏按钮：分开摆放（适合手机）',cluster:'触屏按钮：集中在底部中间（适合大屏）',hidden:'触屏按钮：已隐藏（适合电脑键盘）'})[prefs.controls],1800)}});
addEventListener('keydown',function(e){if(e.key==='Enter'&&state==='ending'){titleScreen()}});
/* ---------- 主循环 ---------- */
var STEP=1/60,acc=0,lastT=0;
function step(dt){time+=dt;for(var k in buf){buf[k]-=dt;if(buf[k]<=0)delete buf[k]}
 shake=Math.max(0,shake-dt*30);flashA=Math.max(0,flashA-dt*1.8);if(hitstop>0){hitstop-=dt;return}
 if(state==='play'&&!TEST)stats.time=(stats.time||0)+dt;
 updateMech(dt);if(window.DLCX)DLCX.update(dt);updatePlayer(dt);if(state!=='play'&&state!=='dialog'&&state!=='dead')return;
 codexT-=dt;if(codexT<=0){codexT=.35;scanCodex()}achT-=dt;if(achT<=0){achT=1;checkAch()}
 updateEnemies(dt);updateBoss(dt);updateHazards(dt);updateChalk(dt);updateParts(dt);
 for(var i=P.trail.length-1;i>=0;i--){P.trail[i].t-=dt;if(P.trail[i].t<=0)P.trail.splice(i,1)}updateCamera(dt)}
function updateDialog(dt){if(!dlg.active)return;if(dlg.chars<dlg.full.length){var before=Math.floor(dlg.chars);dlg.chars=Math.min(dlg.full.length,dlg.chars+dt*38);var n=Math.floor(dlg.chars);if(n>before){$('dlText').textContent=dlg.full.slice(0,n);if(n%2===0){var l=dlg.lines[dlg.i];AudioFX.sfx('talk',l.kind==='hero'?220:l.kind==='robot'?520:l.kind==='boss'?140:330)}}}$('dlMore').style.opacity=dlg.chars>=dlg.full.length?1:.2}
var lastFault=-9;
function frame(now){try{frameBody(now)}catch(e){console.error(e);var t=(now||0)/1000;if(R&&state!=='menu'&&state!=='ending'&&t-lastFault>5){lastFault=t;try{enterLevel(ci,li)}catch(e2){backToTitle('地图加载失败，已返回主页面')}}else{lastFault=-9;backToTitle('地图加载失败，已返回主页面')}}requestAnimationFrame(frame)}
function frameBody(now){var dt=Math.min(.1,(now-lastT)/1000||0);lastT=now;pollPad();
 if(state==='play'){acc+=dt;var n=0;while(acc>=STEP&&state==='play'&&n<6){acc-=STEP;step(STEP);n++}if(n>=6)acc=0}else{acc=0;if(state!=='pause')time+=dt}
 if(state==='dialog'){updateDialog(dt);updateParts(dt);updateCamera(dt)}
 if(state==='dead'){P.dead-=dt;updateParts(dt);shake=Math.max(0,shake-dt*20);if(P.dead<=0)respawn()}
 if(state==='story'){updateStory(dt);drawStory()}
 hearts();dashBar();render()}
if(window.DLCX)DLCX.attach({T:T,get R(){return R},get P(){return P},get time(){return time},cam:cam,get state(){return state},setState:function(s){state=s},get inDLC(){return inDLC},get ci(){return ci},get li(){return li},
 emit:emit,shoot:shoot,damagePlayer:damagePlayer,damageEnemy:damageEnemy,makeEnemy:makeEnemy,toast:toast,startDialog:startDialog,parseDialog:parseDialog,solidAt:solidAt,groundAt:groundAt,cellAt:cellAt,ov:ov,isSolid:isSolid,
 rebake:function(){R.tileCanvas=bakeTiles(R)},shake:function(v){shake=Math.max(shake,v)},hitstop:function(v){hitstop=Math.max(hitstop,v)},flash:function(v){flashA=Math.max(flashA,v)},
 collectBlue:collectBlue,bossDone:bossDone,hurtCount:function(){return stats.hurt||0},setCP:function(x,y){R.cp={x:x,y:y}},meta:function(){return MM},hearts:hearts,save:function(){saveGame(true)}});
/* ---------- 启动 ---------- */
qa('[data-station]').forEach(function(el){el.textContent=L15.STATION});qa('[data-line]').forEach(function(el){el.textContent=L15.LINE});
resize();
function boot(){if(TEST){var tl2=LS.get(L15.STORAGE.test);if(tl2&&tl2.level){show('menu',false);document.addEventListener('pointerdown',function f(){AudioFX.init();document.removeEventListener('pointerdown',f)});enterLevel(0,0);toast('工坊试玩模式：通关或按 Esc 暂停')}else{titleScreen();toast('没有找到试玩关卡数据')}}
else titleScreen();}
if(window.Assets&&Assets.ready)Assets.ready(boot);else boot();
requestAnimationFrame(frame);
function collectBlue(d){var gk=gkey();(got[gk]=got[gk]||{})[d.id]=1;totalBlue++;MM.blueShard('dlc'+ci+'-'+li,d.id);$('shardNum').textContent=totalBlue;AudioFX.sfx('shard');var yl=d.kind==='yellowshard';emit(d.x+16,d.y+16,yl?'#ffd84a':'#6db8ff',18,220);toast('◆ '+(yl?'黄色水晶':'蓝色碎片')+' +1（'+totalBlue+'）',1400)}
function bossDone(){R.bossGone=true;MM.boss('paradox');flashA=.6;AudioFX.sfx('win');saveGame(true)}
window.L15Game={get state(){return state},get R(){return R},get P(){return P},enterLevel:enterLevel,startChapter:startChapter,startDLCRun:startDLCRun,get inDLC(){return inDLC},get campaign(){return campaign},setCampaign:setCampaign};
})();
