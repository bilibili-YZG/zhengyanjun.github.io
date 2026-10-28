/* 倦怠骑士（strong 加强版）移植到 rdbg：逻辑、数值、招式、造型全部来自 metroline-15 的 dlc-ch5.js / gfx7.js，
   这里只加了一层适配（boss.js 里的 core）：坐标是「骑士单位」（1 单位 = 3.125 像素，玩家 22×40），所有数值保持原样。
   本文件由原版代码机械提取生成，改动处都写在 core 接口里。 */
(function(){
'use strict';
var C=null,T=32;
var G={glow:function(g,x,y,r,color,a){g.save();g.globalCompositeOperation='lighter';g.globalAlpha=a==null?.6:a;var q=g.createRadialGradient(x,y,0,x,y,r);var c=color.length===7?color:'#ffffff';q.addColorStop(0,c);q.addColorStop(.35,c+'88');q.addColorStop(1,c+'00');g.fillStyle=q;g.beginPath();g.arc(x,y,r,0,6.2832);g.fill();g.restore()}};
function attach(core){C=core}
function rnd(a,b){return a+Math.random()*(b-a)}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function sfx(n){C.sfx(n)}
function ov(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function cnt(){}
function slashRect(p){return C.slashBox()}

/* ===== 造型（gfx7.js） ===== */
var drawKnight=(function(){
var glow=G.glow;
function hash(n){var s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s)}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function wrapX(v,span){return ((v%span)+span)%span}
function rgba(c,a){return 'rgba('+c+','+a+')'}
function halo(g,x,y,r,c,a){var q=g.createRadialGradient(x,y,0,x,y,r);q.addColorStop(0,rgba(c,a));q.addColorStop(.45,rgba(c,a*.35));q.addColorStop(1,rgba(c,0));g.fillStyle=q;g.beginPath();g.arc(x,y,r,0,6.2832);g.fill()}

/* ==================== Boss「倦怠骑士」 ==================== */
/* 两节骨头的肢体：返回手肘位置（bend=±1 决定朝哪边弯） */
function ik(sx,sy,hx,hy,l1,l2,bend){var dx=hx-sx,dy=hy-sy,d=Math.hypot(dx,dy)||1,a=Math.atan2(dy,dx);d=Math.min(d,l1+l2-.5);var c=clamp((l1*l1+d*d-l2*l2)/(2*l1*d),-1,1),A=Math.acos(c)*bend;
 return {ex:sx+Math.cos(a+A)*l1,ey:sy+Math.sin(a+A)*l1,hx:sx+Math.cos(a)*d,hy:sy+Math.sin(a)*d}}
/* 一段带高光的肢体 */
function limb(g,pts,w,dark,light){g.lineCap='round';g.lineJoin='round';g.strokeStyle=dark;g.lineWidth=w;g.beginPath();g.moveTo(pts[0],pts[1]);for(var i=2;i<pts.length;i+=2)g.lineTo(pts[i],pts[i+1]);g.stroke();
 g.strokeStyle=light;g.lineWidth=Math.max(1,w*.28);g.beginPath();g.moveTo(pts[0]-w*.12,pts[1]-w*.12);for(var j=2;j<pts.length;j+=2)g.lineTo(pts[j]-w*.12,pts[j+1]-w*.12);g.stroke()}
function vgrad(g,y0,y1,stops){var q=g.createLinearGradient(0,y0,0,y1);for(var i=0;i<stops.length;i+=2)q.addColorStop(stops[i],stops[i+1]);return q}
function hgrad(g,x0,x1,stops){var q=g.createLinearGradient(x0,0,x1,0);for(var i=0;i<stops.length;i+=2)q.addColorStop(stops[i],stops[i+1]);return q}

function drawKnight(g,b,t){
 var w=b.w,h=b.h,face=b.face||-1,st=b.state,fl=b.flash>0,ph=b.phase||0,vis=b.vis==null?1:b.vis,
  wind=st==='wind',atk=st==='atk',dash=atk&&b.atk==='dash',spin=atk&&b.atk==='spin',ex=st==='exposed',rage=st==='phase',gh=!!b.ghost,
  S=1.22,H=h/S; /* H：未放大前的身高；整体放大 1.22 倍，显得更魁梧 */
 g.save();g.translate(b.x+w/2,b.y+h);g.globalAlpha*=vis;
 var bob=ex?Math.sin(t*14)*1.5:Math.sin(t*2.6)*4,lean=dash?.38:ex?.24:wind?-.06:0;
 g.translate(0,bob-(st==='run'||wind?6:0));g.scale(face===-1?S:-S,S);g.rotate(-lean);
 /* 配色：钢蓝黑 + 绯红。受击全白，残影全红 */
 var D=gh?'#7a1624':fl?'#fff':'#14101c',M=gh?'#a32030':fl?'#fff':'#2b2240',Lt=gh?'#ff6a76':fl?'#fff':'#7d6ca0',RD='#ff3a4a',RD2=gh?'#ff3a4a':'#b01a2c';
 var pw=ph>1?1:ph>0?.6:.3; /* 越到后面越亮 */
 if(!gh){
  halo(g,0,-H*.5,H*.95,'255,70,80',.2+pw*.18+(wind?.18:0)+(rage?.3:0));
  /* 脚下的法阵：一圈缓慢旋转的批改符文 */
  g.save();g.translate(0,-2);g.scale(1,.22);g.strokeStyle=rgba('255,70,86',.5+pw*.2);g.lineWidth=3;g.beginPath();g.arc(0,0,58,0,6.2832);g.stroke();g.lineWidth=1.5;g.beginPath();g.arc(0,0,46,0,6.2832);g.stroke();
  for(var i=0;i<12;i++){var a=t*.8+i*.5236;g.beginPath();g.moveTo(Math.cos(a)*46,Math.sin(a)*46);g.lineTo(Math.cos(a)*58,Math.sin(a)*58);g.stroke()}g.restore()}
 /* ---- 披风：多段飘带 + 破烂的下摆 ---- */
 var ln=70+(dash?95:0)+(ex?-25:0)+ph*8,sx0=10,sy0=-H*.8;
 function capeP(u,off){return {x:sx0+u*ln+Math.sin(t*3.2-u*4+off)*u*9,y:sy0+u*u*H*.58+u*14+Math.cos(t*2.4-u*3+off)*u*7}}
 function capeQ(u){return {x:6+u*ln*.9+Math.sin(t*3.4-u*4+1.4)*u*10,y:-H*.34+u*H*.34+Math.cos(t*2.6-u*3+1.4)*u*6}}
 g.fillStyle=gh?'#7a1624':vgrad(g,-H*.9,0,[0,fl?'#fff':'#2a1634',.6,fl?'#fff':'#150a1e',1,fl?'#fff':'#07030b']);
 g.beginPath();var p=capeP(0,0);g.moveTo(p.x,p.y);for(var u=.1;u<=1.001;u+=.1){p=capeP(u,0);g.lineTo(p.x,p.y)}
 var tip=capeP(1,0),tq=capeQ(1);for(var tk=1;tk<=5;tk++){var uu=tk/5,mx=tip.x+(tq.x-tip.x)*uu,my=tip.y+(tq.y-tip.y)*uu;g.lineTo(mx+(tk%2?-9:3),my+(tk%2?4:10))}
 for(var v=1;v>=0;v-=.1){p=capeQ(v);g.lineTo(p.x,p.y)}g.closePath();g.fill();
 if(!gh&&!fl){ /* 披风里衬：一道暗红的内侧 + 几道褶皱 */
  g.strokeStyle=rgba('176,26,44',.75);g.lineWidth=3;g.beginPath();p=capeP(0,.4);g.moveTo(p.x,p.y+4);for(var u2=.1;u2<=.96;u2+=.1){p=capeP(u2,.4);g.lineTo(p.x,p.y+4)}g.stroke();
  g.strokeStyle='rgba(255,255,255,.07)';g.lineWidth=2;for(var f=0;f<3;f++){g.beginPath();var a0=capeP(.15,f),a1=capeQ(.85);g.moveTo(a0.x,a0.y+f*8);g.quadraticCurveTo((a0.x+a1.x)/2,(a0.y+a1.y)/2-6,a1.x*.9,a1.y-f*4);g.stroke()}}
 /* ---- 后侧手臂（持剑的另一只手，被身体挡住一半） ---- */
 var pa=wind?-1.95+Math.sin(t*26)*.05:dash?-.12:spin?-.6+t*0:ex?1.15:atk?-1.25:-.62+Math.sin(t*2.6)*.1; /* 笔的角度 */
 var ox=-22,oy=-H*.6,ca=Math.cos(pa),sa=Math.sin(pa);
 var hand1={x:ox+ca*4,y:oy+sa*4},hand2={x:ox+ca*20,y:oy+sa*20};
 var armB=ik(8,-H*.74,hand2.x,hand2.y,20,20,1);limb(g,[8,-H*.74,armB.ex,armB.ey,armB.hx,armB.hy],8,D,M);
 /* ---- 腿 ---- */
 var run=st==='run'||wind,sw=run?Math.sin(t*7)*7:0,ft1={x:-9+sw,y:run?-6:0},ft2={x:11-sw,y:run&&Math.cos(t*7)>0?-10:0};
 var l1=ik(-5,-H*.36,ft1.x,ft1.y-2,19,19,-1),l2=ik(7,-H*.36,ft2.x,ft2.y-2,19,19,-1);
 limb(g,[7,-H*.36,l2.ex,l2.ey,l2.hx,l2.hy],11,D,M);limb(g,[-5,-H*.36,l1.ex,l1.ey,l1.hx,l1.hy],12,D,M);
 g.fillStyle=gh?'#a32030':fl?'#fff':'#3a2c52';[[l1,12],[l2,11]].forEach(function(q){g.beginPath();g.arc(q[0].ex,q[0].ey,q[1]*.55,0,6.2832);g.fill()});
 g.fillStyle=D;[ft1,ft2].forEach(function(f2){g.beginPath();g.moveTo(f2.x-9,f2.y);g.lineTo(f2.x+7,f2.y);g.lineTo(f2.x+7,f2.y-6);g.lineTo(f2.x-13,f2.y-3);g.closePath();g.fill()});
 /* ---- 躯干：胸甲 + 腰带 + 腰甲 ---- */
 g.fillStyle=hgrad(g,-22,22,[0,fl?'#fff':gh?'#a32030':'#3a2e56',.45,fl?'#fff':gh?'#7a1624':'#201830',1,D]);
 g.beginPath();g.moveTo(-21,-H*.82);g.lineTo(21,-H*.82);g.quadraticCurveTo(19,-H*.58,11,-H*.38);g.lineTo(-11,-H*.38);g.quadraticCurveTo(-19,-H*.58,-21,-H*.82);g.closePath();g.fill();
 g.strokeStyle=Lt;g.lineWidth=1.4;g.stroke();
 g.strokeStyle=rgba('255,255,255',.12);g.lineWidth=1.2;g.beginPath();g.moveTo(0,-H*.82);g.lineTo(0,-H*.4);g.moveTo(-16,-H*.64);g.quadraticCurveTo(0,-H*.58,16,-H*.64);g.stroke();
 for(var fp=0;fp<4;fp++){var fx=-14+fp*9.5;g.fillStyle=fp%2?M:D;g.beginPath();g.moveTo(fx,-H*.38);g.lineTo(fx+9.5,-H*.38);g.lineTo(fx+8,-H*.24-fp%2*4);g.lineTo(fx+1,-H*.24-fp%2*3);g.closePath();g.fill()}
 g.fillStyle=gh?'#a32030':'#4a3a68';g.fillRect(-14,-H*.4,28,5);if(!gh){g.fillStyle=RD;g.beginPath();g.moveTo(0,-H*.4);g.lineTo(5,-H*.375);g.lineTo(0,-H*.35);g.lineTo(-5,-H*.375);g.closePath();g.fill();halo(g,0,-H*.375,12,'255,60,76',.8)}
 /* 胸口：被批改的红叉，会随阶段越来越亮 */
 var cxp=0,cyp=-H*.62,pulse=.65+Math.sin(t*4)*.2+pw*.3;
 if(!gh){halo(g,cxp,cyp,26,'255,50,70',pulse);g.strokeStyle='#ffd8de';g.lineWidth=5;g.lineCap='round';g.beginPath();g.moveTo(-9,cyp-9);g.lineTo(9,cyp+9);g.moveTo(9,cyp-9);g.lineTo(-9,cyp+9);g.stroke();g.strokeStyle=RD;g.lineWidth=2.6;g.stroke();
  g.strokeStyle=rgba('255,58,74',.55+pw*.3);g.lineWidth=1.3;g.beginPath();g.arc(cxp,cyp,16,0,6.2832);g.stroke()}
 /* 甲片上的裂纹，阶段越高越多，里面透出红光 */
 if(!gh&&ph>0){g.strokeStyle=rgba('255,60,76',.7);g.lineWidth=1.6;g.beginPath();g.moveTo(12,-H*.8);g.lineTo(8,-H*.7);g.lineTo(13,-H*.6);g.lineTo(9,-H*.5);if(ph>1){g.moveTo(-13,-H*.75);g.lineTo(-8,-H*.66);g.lineTo(-14,-H*.56)}g.stroke()}
 /* ---- 前手臂 + 肩甲 ---- */
 var armF=ik(-12,-H*.76,hand1.x,hand1.y,20,19,-1);limb(g,[-12,-H*.76,armF.ex,armF.ey,armF.hx,armF.hy],9,D,M);
 g.fillStyle=gh?'#a32030':'#3a2c52';g.beginPath();g.arc(armF.hx,armF.hy,5.5,0,6.2832);g.fill();
 /* 肩甲：分层 + 尖刺 */
 function pauldron(x,y,sc){g.save();g.translate(x,y);g.scale(sc,sc);g.fillStyle=gh?'#7a1624':fl?'#fff':vgrad(g,-14,10,[0,'#4a3c6c',1,'#150f20']);g.beginPath();g.moveTo(-17,6);g.quadraticCurveTo(-18,-12,0,-14);g.quadraticCurveTo(18,-12,17,6);g.quadraticCurveTo(0,0,-17,6);g.fill();g.strokeStyle=Lt;g.lineWidth=1.3;g.stroke();
  g.fillStyle=gh?'#a32030':'#241a38';g.beginPath();g.moveTo(-15,8);g.quadraticCurveTo(0,2,15,8);g.lineTo(13,14);g.quadraticCurveTo(0,8,-13,14);g.fill();
  g.fillStyle=gh?'#ff6a76':fl?'#fff':RD2;g.beginPath();g.moveTo(-9,-11);g.lineTo(-13,-26);g.lineTo(-3,-13);g.fill();g.beginPath();g.moveTo(3,-13);g.lineTo(9,-28);g.lineTo(11,-10);g.fill();g.restore()}
 pauldron(-17,-H*.8,1);pauldron(18,-H*.82,.82);
 /* ---- 颈甲 + 头盔 ---- */
 g.fillStyle=D;g.fillRect(-7,-H*.9,14,H*.1);
 var hy=-H*.95;
 /* 头盔后面的鬃毛（披散的红黑长缨） */
 if(!gh){for(var s=0;s<6;s++){var len=34+s*8+(dash?26:0)+(rage?14:0),sp=Math.sin(t*3.6-s*.7)*(5+s*1.5);g.strokeStyle=s%2?rgba('255,58,74',.9):rgba('36,10,26',.95);g.lineWidth=7-s*.7;g.lineCap='round';
   g.beginPath();g.moveTo(5,hy-20);g.bezierCurveTo(24+s*2,hy-32+sp*.4,34+len*.5,hy-8+sp,18+len,hy+4+s*7+sp);g.stroke()}}
 g.fillStyle=gh?'#7a1624':fl?'#fff':hgrad(g,-16,16,[0,'#4a3c6c',.5,'#241a38',1,'#0e0a16']);
 g.beginPath();g.moveTo(-16,hy+11);g.lineTo(-17,hy-4);g.quadraticCurveTo(-17,hy-24,0,hy-27);g.quadraticCurveTo(17,hy-24,16,hy-4);g.lineTo(15,hy+11);g.lineTo(6,hy+17);g.lineTo(-6,hy+17);g.closePath();g.fill();
 g.strokeStyle=Lt;g.lineWidth=1.4;g.stroke();
 g.strokeStyle=rgba('255,255,255',.16);g.lineWidth=1.3;g.beginPath();g.moveTo(0,hy-27);g.lineTo(0,hy-5);g.moveTo(-16,hy-3);g.lineTo(16,hy-3);g.stroke();
 /* 面罩缝：两道发光的眼 */
 if(!gh){g.fillStyle='#07040c';g.beginPath();g.moveTo(-14,hy-3);g.lineTo(15,hy-3);g.lineTo(13,hy+5);g.lineTo(-12,hy+5);g.closePath();g.fill();
  var eg=.8+Math.sin(t*5)*.2+(wind||rage?.4:0);halo(g,-5,hy,18,'255,50,70',eg);halo(g,7,hy,18,'255,50,70',eg*.9);
  g.fillStyle=wind||rage?'#fff':'#ffb0b8';g.beginPath();g.moveTo(-12,hy-2);g.lineTo(-2,hy-1);g.lineTo(-4,hy+3);g.lineTo(-11,hy+2);g.fill();g.beginPath();g.moveTo(3,hy-1);g.lineTo(13,hy-2);g.lineTo(12,hy+2);g.lineTo(5,hy+3);g.fill();
  g.strokeStyle=RD;g.lineWidth=1.6;g.beginPath();g.moveTo(-14,hy-3);g.lineTo(15,hy-3);g.stroke()}
 /* 角冠：一阶段是两只弯角，三阶段头顶燃起红焰 */
 g.fillStyle=gh?'#a32030':fl?'#fff':'#1b1326';g.beginPath();g.moveTo(-13,hy-18);g.quadraticCurveTo(-26,hy-28,-22,hy-46);g.quadraticCurveTo(-18,hy-32,-8,hy-24);g.fill();g.beginPath();g.moveTo(13,hy-18);g.quadraticCurveTo(26,hy-28,22,hy-46);g.quadraticCurveTo(18,hy-32,8,hy-24);g.fill();
 g.strokeStyle=Lt;g.lineWidth=1;g.beginPath();g.moveTo(-13,hy-19);g.quadraticCurveTo(-25,hy-28,-22,hy-45);g.stroke();
 if(!gh&&ph>0){for(var fi=0;fi<(ph>1?5:3);fi++){var fo=(fi-(ph>1?2:1))*8,fu=(t*1.8+fi*.31)%1,fh=18+hash(fi)*14;g.fillStyle=rgba(fi%2?'255,120,70':'255,50,70',.85*(1-fu));g.beginPath();g.moveTo(fo-4,hy-26);g.quadraticCurveTo(fo+Math.sin(t*9+fi)*4,hy-26-fh*.6,fo+Math.sin(t*7+fi)*5,hy-26-fh*(.5+fu));g.quadraticCurveTo(fo+2,hy-26-fh*.3,fo+4,hy-26);g.fill()}halo(g,0,hy-30,26,'255,70,60',.5)}
 /* ---- 红笔重剑：握在前手 ---- */
 g.save();g.translate(ox,oy);g.rotate(pa);
 var L=(wind||atk?150:128)+(ph*6),W=11;
 if(!gh&&(wind||atk))halo(g,L*.55,0,L*.7,'255,50,70',.35+(wind?.15*Math.sin(t*30):0));
 /* 剑身：锥形，中间一道亮线，边缘有流动的高光 */
 var bg2=g.createLinearGradient(0,0,L,0);bg2.addColorStop(0,gh?'#a32030':'#5a0c1a');bg2.addColorStop(.55,gh?'#ff3a4a':'#d8283c');bg2.addColorStop(1,gh?'#ffb0b8':'#ff9aa4');
 g.fillStyle=fl?'#fff':bg2;g.beginPath();g.moveTo(24,-W*.55);g.lineTo(L-30,-W*.5);g.lineTo(L+22,0);g.lineTo(L-30,W*.5);g.lineTo(24,W*.55);g.closePath();g.fill();
 g.strokeStyle=gh?'#ffb0b8':'#ffd0d6';g.lineWidth=1.2;g.stroke();
 g.fillStyle='rgba(255,255,255,.9)';g.beginPath();g.moveTo(30,-1.3);g.lineTo(L-8,-.6);g.lineTo(L-8,.6);g.lineTo(30,1.3);g.closePath();g.fill();
 if(!gh){var hl=((t*1.4)%1)*(L-40)+26;g.fillStyle='rgba(255,255,255,.65)';g.beginPath();g.moveTo(hl,-W*.5);g.lineTo(hl+10,-W*.5);g.lineTo(hl+4,W*.5);g.lineTo(hl-6,W*.5);g.fill();
  g.strokeStyle='rgba(255,70,86,.75)';g.lineWidth=1.5;g.beginPath();g.moveTo(L+22,0);g.lineTo(L-30,0);g.stroke()} /* 笔尖那道墨缝 */
 /* 护手：笔夹造型 + 握柄 + 笔帽 */
 g.fillStyle=gh?'#a32030':fl?'#fff':'#e0b84a';g.beginPath();g.moveTo(18,-18);g.lineTo(27,-15);g.lineTo(27,15);g.lineTo(18,18);g.lineTo(14,0);g.closePath();g.fill();
 g.fillStyle=gh?'#7a1624':fl?'#fff':'#24182e';g.fillRect(-22,-5,40,10);g.fillStyle=gh?'#a32030':'#e0b84a';for(var gi=0;gi<4;gi++)g.fillRect(-18+gi*9,-5.5,2.5,11);
 g.fillStyle=gh?'#ff6a76':RD;g.beginPath();g.arc(-24,0,6,0,6.2832);g.fill();
 g.restore();
 /* ---- 飘散的灰烬 / 红色火星 / 暗雾 ---- */
 if(!gh){g.save();g.globalCompositeOperation='lighter';
  for(var e=0;e<16;e++){var eu=(t*(.35+hash(e)*.4)+hash(e+3))%1,exx=(hash(e+9)-.5)*70-eu*14,eyy=-H*.1-eu*H*1.1;g.fillStyle=rgba(e%3?'255,90,84':'255,200,170',(1-eu)*.85);g.beginPath();g.arc(exx,eyy,1+hash(e+5)*1.8,0,6.2832);g.fill()}
  g.restore();
  g.save();for(var sm=0;sm<6;sm++){var su=(t*.5+sm/6)%1;g.fillStyle=rgba('8,2,12',(1-su)*.4);g.beginPath();g.arc(-20+hash(sm)*40+su*40,-su*20-4,10+su*22,0,6.2832);g.fill()}g.restore()}
 /* 阶段切换：猩红的爆发 */
 if(rage){var ru=(t*2.2)%1;g.save();g.globalCompositeOperation='lighter';g.strokeStyle=rgba('255,70,86',1-ru);g.lineWidth=7*(1-ru);g.beginPath();g.arc(0,-H*.55,30+ru*130,0,6.2832);g.stroke();
  g.strokeStyle=rgba('255,255,255',.8);g.lineWidth=3;for(var rx=0;rx<2;rx++){g.beginPath();g.moveTo(-44,-H*(rx?.3:1.02));g.lineTo(44,-H*(rx?1.02:.3));g.stroke()}g.restore()}
 g.restore()}

return drawKnight})();
G.boss=function(g,b,t){drawKnight(g,b,t)};

/* ===== 逻辑 + 特效（dlc-ch5.js 的骑士部分） ===== */
var STRONG=true; /* 移植的是 strong=1 的「加强版骑士」：直接第三阶段、速度×1.5、冲刺永久被锁、玩家倒下回血 25% */
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
function breakWorld(level){ /* 世界越劈越碎：在玩家脚下留出安全区的前提下挖坑、架平台（地形由 rdbg 世界实现） */
 C.breakTerrain(level);C.R.kn.broken=level}
function restoreWorld(){C.restoreTerrain()}
function ruinTheme(on){C.ruin(on)}

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
 if(k.spin)k.spin.x+=sh;if(b.lockX!=null)b.lockX+=sh;if(p.safe){p.safe.x+=sh}C.onWrap(sh)}

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
 var bar=$('stam');if(bar){if(!FX.strike){var s=document.createElement('div');s.style.cssText='position:absolute;left:-6px;right:-6px;top:50%;height:4px;background:#ff3a4a;box-shadow:0 0 8px #ff3a4a;transform:rotate(-4deg);pointer-events:none;z-index:5';var tag=document.createElement('b');tag.textContent='已没收';tag.style.cssText='position:absolute;right:-4px;top:-18px;color:#ff6a6a;font-size:12px;font-weight:900';s.appendChild(tag);bar.style.position='relative';bar.appendChild(s);FX.strike=s}FX.strike.style.display='block'}
 say(k,'冲刺，没收了。弹反一刀才能要回来。',2.4);C.toast('冲刺被没收！弹反白色的刀可以夺回来',2200)}
function doFlip(b){var k=C.R.kn;b.timer=.6;FX.flip=4.2;sfx('roar');C.shake(8);var g=$('viewport');if(g){g.style.transition='transform .35s cubic-bezier(.3,1.6,.5,1)';g.style.transform='scaleX(-1)'}say(k,'翻页——世界，反过来了。',2.2);C.toast('画面被翻过去了（4 秒）',1600)}
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
 if(FX.flip>0){FX.flip-=dt;if(FX.flip<=0){var g=$('viewport');if(g){g.style.transform='';}}}
 if(k.noDash>0){k.noDash-=dt;p.stam=0;if(p.dashCd<.1)p.dashCd=.1;if(k.noDash<=0)restoreDash()}
 if(FX.blank>0){FX.blank-=dt;if(FX.blank<=0)restoreHud()}
 if(FX.pop){FX.popT-=dt;if(FX.popT<=0)closePop()}}
function restoreDash(){if(STRONG)return;var k=C.R&&C.R.kn;if(k)k.noDash=0;if(FX.strike)FX.strike.style.display='none'}
function restoreHud(){var h=$('hud');if(h){h.style.opacity='';h.style.transition=''}var st=$('c5grade');if(st)st.style.display='none'}
function cleanupFx(){FX.flip=0;FX.blank=0;var g=$('viewport');if(g){g.style.transform='';g.style.transition=''}restoreHud();restoreDash();closePop()}

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
 C.victory()}

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
  cn.swapped=true;C.saveTerrain();ruinTheme(true);breakWorld(b.phase>0?b.phase:0);k.ruined=true;C.flash(1);C.shake(20);sfx('boom');
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
function drawMarks(g,t){C.drawMarks(g,t)}

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


/* 本体（物体）绘制：原版由 game.js 的 drawBoss 调用 G.boss */
function drawBody(g,t){var b=C.R.boss;if(!b||b.dead||b.vis<=0&&b.state!=='intro')return;g.save();if(b.state==='dying')g.globalAlpha=Math.max(0,1-b.deadT/2.2);drawKnight(g,b,t);g.restore()}
/* 原版 game.js 里的 Boss 血条 */
function drawBar(g,W,H){var b=C.R.boss;if(!b||!b.started||b.dead)return;
 var bw=Math.min(520,W*.6),bx=(W-bw)/2,by=H-56;g.save();g.fillStyle='rgba(6,14,24,.75)';g.beginPath();g.roundRect(bx-12,by-26,bw+24,44,12);g.fill();g.fillStyle='#ffe9d9';g.font='bold 13px "Noto Sans SC",sans-serif';g.textAlign='left';g.fillText(b.label,bx,by-8);g.textAlign='right';g.fillStyle='#ffb79a';g.fillText(['','第二阶段','狂暴'][b.phase]||'',bx+bw,by-8);g.fillStyle='#3a1f26';g.beginPath();g.roundRect(bx,by,bw,9,5);g.fill();g.fillStyle=b.flash>0?'#fff':'#ff6a4f';g.beginPath();g.roundRect(bx,by,Math.max(0,bw*b.hp/b.max),9,5);g.fill();g.restore()}

window.Knight={attach:attach,initBoss:initBoss,bossStep:bossStep,knUpdate:knUpdate,knDraw:knDraw,knScreen:knScreen,drawBody:drawBody,drawBar:drawBar,hitBoss:hitBoss,onPlayerDeath:onPlayerDeath,onDeath:onDeath,cleanup:cleanupFx,restoreWorld:restoreWorld,STRONG:STRONG,P_TILES:P_TILES,T:T};
})();
