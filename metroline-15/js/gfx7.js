/* 画面（七）：第五章 Boss「倦怠骑士」的全新造型，以及「破败的夕阳」背景（多层视差）和黄昏的光柱。 */
(function(){
var G=window.GFX,glow=G.glow;
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
var _boss=G.boss;
G.boss=function(g,b,t){if(b.type==='knight')drawKnight(g,b,t);else _boss.apply(this,arguments)};

/* 钟魔迪斯科形态：墨镜 + 彩虹光环 + 一圈旋转的小镜面 */
var _boss2=G.boss;
G.boss=function(g,b,t){_boss2.apply(this,arguments);
 if(b.type!=='midnight'||b.stage!==2||b.dead)return;
 var R0=Math.min(b.w*.46,b.h*.5),cy=-b.h*.5-6,cols=['#ff6a8a','#ffd23f','#6dffb0','#6dd5ff','#c9a0ff'],i;
 g.save();g.translate(b.x+b.w/2,b.y+b.h);
 g.save();g.globalCompositeOperation='lighter';for(i=0;i<14;i++){var a=t*1.4+i*.4488,rx=Math.cos(a)*R0*1.28,ry=cy+Math.sin(a)*R0*1.28;glow(g,rx,ry,18,'#ffffff',.55);g.fillStyle=cols[i%5];g.beginPath();g.rect(rx-4,ry-4,8,8);g.fill()}
 g.strokeStyle='hsla('+((t*90)%360)+',100%,65%,.6)';g.lineWidth=5;g.beginPath();g.arc(0,cy,R0*1.12,0,6.2832);g.stroke();g.restore();
 var f=b.face||1;g.translate(f*3,0);g.fillStyle='#0a0612';g.beginPath();g.roundRect(-R0*.52,cy-R0*.3,R0*.48,R0*.3,6);g.fill();g.beginPath();g.roundRect(R0*.04,cy-R0*.3,R0*.48,R0*.3,6);g.fill();g.fillRect(-R0*.06,cy-R0*.24,R0*.12,5);
 g.save();g.globalCompositeOperation='lighter';var gl=((t*1.3)%1);g.fillStyle='rgba(255,255,255,.7)';g.fillRect(-R0*.5+gl*R0*.3,cy-R0*.28,5,R0*.26);g.fillRect(R0*.06+gl*R0*.3,cy-R0*.28,5,R0*.26);g.fillStyle='hsla('+((t*120)%360)+',100%,60%,.45)';g.fillRect(-R0*.52,cy-R0*.12,R0*1.04,4);g.restore();
 g.restore()};

/* ==================== 背景 ==================== */
var _bg=G.drawBg;
/* 破败的夕阳：整片重画，十来层视差 */
function ruinBg(g,W,H,cx,cy,sc,time){
 var u=H/540,hz=H*.66,i,x,y,k=sc||1,scr=function(par){return wrapX(cx*k*par,1e9)};
 /* 天空 */
 g.fillStyle=vgrad(g,0,hz,[0,'#06020b',.3,'#1d0716',.58,'#5a1522',.8,'#b33a2a',1,'#ff8f52']);g.fillRect(0,0,W,H);
 /* 星与余烬点 */
 for(i=0;i<70;i++){var stx=hash(i)*W,sty=hash(i+50)*hz*.7,tw=.35+.65*Math.abs(Math.sin(time*(.6+hash(i+9))+i));g.fillStyle='rgba(255,220,210,'+(.5*tw)+')';g.fillRect(stx,sty,1.4,1.4)}
 /* 太阳：被劈成两半，缝里透出白炽的光 */
 var sx=W*.68,sy=hz-H*.14,sr=H*.17,sa=-.38,j;
 halo(g,sx,sy,H*1.15,'255,90,70',.38+Math.sin(time*.9)*.03);halo(g,sx,sy,sr*3,'255,170,110',.35);
 g.save();g.globalCompositeOperation='lighter';g.translate(sx,sy);g.rotate(time*.05);for(i=0;i<22;i++){var ra=i/22*6.2832,rl=sr*(2.4+hash(i)*3);var rg=g.createLinearGradient(0,0,Math.cos(ra)*rl,Math.sin(ra)*rl);rg.addColorStop(0,'rgba(255,150,100,.16)');rg.addColorStop(1,'rgba(255,150,100,0)');g.fillStyle=rg;g.beginPath();g.moveTo(0,0);g.lineTo(Math.cos(ra-.03)*rl,Math.sin(ra-.03)*rl);g.lineTo(Math.cos(ra+.03)*rl,Math.sin(ra+.03)*rl);g.fill()}g.restore();
 for(j=-1;j<=1;j+=2){g.save();g.translate(sx,sy);g.rotate(sa);g.beginPath();g.rect(-sr*2,j<0?-sr*2:0,sr*4,sr*2);g.clip();g.translate(0,j*sr*.05);g.rotate(-sa);
  var sg=g.createRadialGradient(-sr*.2,-sr*.25,sr*.1,0,0,sr);sg.addColorStop(0,'#fff0c8');sg.addColorStop(.5,'#ff9a58');sg.addColorStop(1,'#a82430');g.fillStyle=sg;g.beginPath();g.arc(0,0,sr,0,6.2832);g.fill();
  g.strokeStyle='rgba(60,6,14,.55)';g.lineWidth=1.5;for(i=0;i<4;i++){g.beginPath();g.arc(0,0,sr*(.3+i*.2),sa+.4+i,sa+1.6+i*1.2);g.stroke()}g.restore()}
 g.save();g.globalCompositeOperation='lighter';g.translate(sx,sy);g.rotate(sa);var cg=g.createLinearGradient(-sr*3,0,sr*3,0);cg.addColorStop(0,'rgba(255,255,255,0)');cg.addColorStop(.5,'rgba(255,255,255,.95)');cg.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=cg;g.fillRect(-sr*3,-sr*.045,sr*6,sr*.09);halo(g,0,0,sr*1.1,'255,200,160',.45);g.restore();
 /* 云带：三层，下缘被落日照红 */
 var cl=[[.03,5,.2,.9],[.06,6,.3,.8],[.1,7,.42,.7]];
 cl.forEach(function(L,li){var off=wrapX(cx*k*L[0],W*2.4);for(var c=0;c<L[1]*2;c++){var bx=wrapX(hash(c+li*20)*W*2.4-off+time*(3+li*2),W*2.4)-W*.3,by=H*(L[2]-.12+hash(c+li*7)*.2),cw=W*(.22+hash(c+li*3)*.2),ch=H*.035*(1+li*.3);
  var cg2=g.createLinearGradient(0,by-ch,0,by+ch);cg2.addColorStop(0,'rgba(14,4,16,'+L[3]+')');cg2.addColorStop(.6,'rgba(40,10,22,'+L[3]+')');cg2.addColorStop(1,'rgba(255,100,70,'+(.5*L[3])+')');g.fillStyle=cg2;g.beginPath();g.ellipse(bx,by,cw,ch,0,0,6.2832);g.fill();
  g.beginPath();g.ellipse(bx+cw*.3,by-ch*.5,cw*.55,ch*.7,0,0,6.2832);g.fill()}});
 /* 远景：巨剑斜插在地平线，旁边是塌掉一半的城堡剪影 */
 var offS=wrapX(cx*k*.05,W*2.6),swx=wrapX(W*.28-offS+W*.3,W*2.6)-W*.3;
 g.save();g.translate(swx,hz+8);g.rotate(.08);g.fillStyle='#1b0814';g.beginPath();g.moveTo(-9*u,0);g.lineTo(-7*u,-H*.5);g.lineTo(0,-H*.56);g.lineTo(7*u,-H*.5);g.lineTo(9*u,0);g.fill();g.fillRect(-34*u,-H*.46,68*u,7*u);g.fillRect(-4*u,-H*.58,8*u,-26*u);
  g.strokeStyle='rgba(255,110,80,.45)';g.lineWidth=1.5;g.beginPath();g.moveTo(-7*u,-H*.5);g.lineTo(-9*u,0);g.stroke();g.restore();
 function skyline(par,col,rim,base,hh,spire,seed){var span=W*2.2,off=wrapX(cx*k*par,span);g.fillStyle=col;
  for(var rep=-1;rep<=1;rep++){g.beginPath();g.moveTo(rep*span-off,H);var xx=0;while(xx<=span){var n=hash(Math.floor(xx/26)+seed),bh=hh*(.25+n*.75),wdt=26+hash(xx*.1+seed)*26;
    if(n>.8){g.lineTo(rep*span-off+xx,base-bh);g.lineTo(rep*span-off+xx+wdt*.5,base-bh-spire*(.5+n));g.lineTo(rep*span-off+xx+wdt,base-bh)}
    else if(n<.18){g.lineTo(rep*span-off+xx,base-bh*.35);g.lineTo(rep*span-off+xx+wdt*.5,base-bh*.2);g.lineTo(rep*span-off+xx+wdt,base-bh*.5)}
    else{var step=Math.floor(wdt/9);for(var s=0;s<step;s++){g.lineTo(rep*span-off+xx+s*9,base-bh-(s%2?0:6));g.lineTo(rep*span-off+xx+s*9+9,base-bh-(s%2?0:6))}}
    xx+=wdt}
   g.lineTo(rep*span-off+span,H);g.closePath();g.fill()}
  if(rim){g.strokeStyle=rim;g.lineWidth=1.2;for(rep=-1;rep<=1;rep++){g.beginPath();xx=0;while(xx<=span){var n2=hash(Math.floor(xx/26)+seed),bh2=hh*(.25+n2*.75),wd2=26+hash(xx*.1+seed)*26;g.moveTo(rep*span-off+xx,base-bh2);g.lineTo(rep*span-off+xx+wd2*.4,base-bh2);xx+=wd2}g.stroke()}}}
 skyline(.09,'#1d0a16','rgba(255,120,90,.35)',hz+10,H*.2,H*.12,3);
 /* 漂浮的碎岛（带倒挂的尖石，侧面被夕阳照亮） */
 for(i=0;i<5;i++){var par=.14+hash(i)*.14,off2=wrapX(cx*k*par,W*2),ix=wrapX(hash(i+4)*W*2-off2,W*2)-W*.2,iy=H*(.12+hash(i+8)*.26)+Math.sin(time*.5+i*2)*7,iw=(56+hash(i+2)*90)*u;
  g.fillStyle='#14091a';g.beginPath();g.moveTo(ix-iw,iy);g.lineTo(ix+iw,iy-3*u);g.lineTo(ix+iw*.7,iy+iw*.35);g.lineTo(ix+iw*.2,iy+iw*.9);g.lineTo(ix-iw*.1,iy+iw*.55);g.lineTo(ix-iw*.6,iy+iw*.3);g.closePath();g.fill();
  g.strokeStyle='rgba(255,106,76,.5)';g.lineWidth=1.6;g.beginPath();g.moveTo(ix-iw,iy);g.lineTo(ix+iw,iy-3*u);g.stroke();
  g.fillStyle='#2a1124';g.fillRect(ix-iw*.5,iy-12*u,iw*.2,12*u);g.beginPath();g.moveTo(ix-iw*.55,iy-12*u);g.lineTo(ix-iw*.4,iy-26*u);g.lineTo(ix-iw*.25,iy-12*u);g.fill()}
 /* 光柱：从残日向下斜射 */
 g.save();g.globalCompositeOperation='lighter';for(i=0;i<7;i++){var ang=1.55+(i-3)*.17+Math.sin(time*.3+i)*.03,rl2=H*1.2,rg2=g.createLinearGradient(sx,sy,sx+Math.cos(ang)*rl2,sy+Math.sin(ang)*rl2);rg2.addColorStop(0,'rgba(255,130,90,.16)');rg2.addColorStop(1,'rgba(255,130,90,0)');g.fillStyle=rg2;g.beginPath();g.moveTo(sx,sy);g.lineTo(sx+Math.cos(ang-.035)*rl2,sy+Math.sin(ang-.035)*rl2);g.lineTo(sx+Math.cos(ang+.035)*rl2,sy+Math.sin(ang+.035)*rl2);g.fill()}g.restore();
 /* 中景：断柱与拱门 */
 var spanM=W*1.8,offM=wrapX(cx*k*.24,spanM);
 for(var rep2=-1;rep2<=1;rep2++)for(i=0;i<7;i++){var mx=rep2*spanM-offM+hash(i+30)*spanM,mh=H*(.14+hash(i+40)*.2),mw=(16+hash(i+50)*18)*u,base=hz+22*u;
  g.fillStyle='#10060f';g.fillRect(mx,base-mh,mw,mh+H);g.fillStyle='#180a18';g.fillRect(mx-4*u,base-mh-6*u,mw+8*u,8*u);
  if(hash(i+60)>.5){g.strokeStyle='#10060f';g.lineWidth=mw*.8;g.beginPath();g.arc(mx+mw/2+mw*2.3,base-mh+4*u,mw*2.3,Math.PI,0);g.stroke();g.fillRect(mx+mw*4.6,base-mh*.6,mw,mh+H)}
  g.strokeStyle='rgba(255,120,90,.4)';g.lineWidth=1.3;g.beginPath();g.moveTo(mx+mw,base-mh);g.lineTo(mx+mw,base);g.stroke();
  g.fillStyle='rgba(255,60,76,'+(.4+.3*Math.sin(time*2+i))+')';g.fillRect(mx+mw*.3,base-mh*.5,mw*.4,2*u)}
 /* 地面雾：几层缓缓飘动的红色薄雾 */
 for(i=0;i<3;i++){var fy=hz+(i*.045)*H,fg=g.createLinearGradient(0,fy-H*.1,0,fy+H*.12);fg.addColorStop(0,'rgba(170,40,46,0)');fg.addColorStop(.5,'rgba(170,40,46,'+(.2+i*.07)+')');fg.addColorStop(1,'rgba(20,4,12,.85)');g.fillStyle=fg;g.fillRect(0,fy-H*.1,W,H);
  g.save();g.globalCompositeOperation='lighter';for(j=0;j<5;j++){var fx=wrapX(hash(j+i*9)*W*1.5+time*(10+i*7)-cx*k*(.3+i*.1),W*1.5)-W*.25;halo(g,fx,fy,W*.22,'255,80,60',.07)}g.restore()}
 g.fillStyle='#0c040a';g.fillRect(0,hz+H*.2,W,H);
 /* 偶尔划过的猩红闪电（整片天空一亮） */
 var ft=(time*.14)%1;if(ft<.012){g.fillStyle='rgba(255,70,70,'+(.14*(1-ft/.012))+')';g.fillRect(0,0,W,H)}
 /* 前景：灰烬、火星、被风卷起的纸屑 */
 for(i=0;i<80;i++){var z=.3+hash(i)*1.1,px=wrapX(hash(i+11)*W-cx*k*.5*z-time*(30+hash(i)*60)*z,W),py=wrapX(hash(i+21)*H+time*(20+hash(i+4)*50)*z-cy*k*.2*z,H),warm=i%3===0;
  g.fillStyle=warm?'rgba(255,'+(110+hash(i)*80|0)+',80,'+(.55*z)+')':'rgba(210,190,190,'+(.35*z)+')';
  if(i%7===0){g.save();g.translate(px,py);g.rotate(time*2+i);g.fillStyle='rgba(240,230,220,'+(.45*z)+')';g.fillRect(-4*z,-3*z,8*z,6*z);g.restore()}else{g.beginPath();g.arc(px,py,(warm?1.6:1.2)*z*Math.max(1,k*.7),0,6.2832);g.fill()}}
 /* 暗角 */
 var vg=g.createRadialGradient(W/2,H*.5,H*.35,W/2,H*.5,Math.max(W,H)*.78);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.6)');g.fillStyle=vg;g.fillRect(0,0,W,H)}

/* 黎明（正常关卡）：在原背景之上加一层暖色光柱和飘浮的尘光 */
function dawnOverlay(g,W,H,cx,cy,sc,time){
 var sx=W*.7,sy=H*.6,i;g.save();g.globalCompositeOperation='lighter';
 for(i=0;i<6;i++){var ang=Math.PI+(i-2.5)*.16+Math.sin(time*.25+i)*.025,rl=W*1.1,rg=g.createLinearGradient(sx,sy,sx+Math.cos(ang)*rl,sy+Math.sin(ang)*rl);rg.addColorStop(0,'rgba(255,200,130,.13)');rg.addColorStop(1,'rgba(255,200,130,0)');g.fillStyle=rg;g.beginPath();g.moveTo(sx,sy);g.lineTo(sx+Math.cos(ang-.04)*rl,sy+Math.sin(ang-.04)*rl);g.lineTo(sx+Math.cos(ang+.04)*rl,sy+Math.sin(ang+.04)*rl);g.fill()}
 for(i=0;i<34;i++){var z=.3+hash(i)*.9,px=wrapX(hash(i+3)*W-cx*sc*.35*z+time*8*z,W),py=wrapX(hash(i+9)*H*.8+Math.sin(time*.6+i)*10-cy*sc*.1,H*.8),tw=.4+.6*Math.abs(Math.sin(time*1.3+i));g.fillStyle='rgba(255,226,170,'+(.5*z*tw)+')';g.beginPath();g.arc(px,py,1.3*z+.4,0,6.2832);g.fill()}
 g.restore();
 var vg=g.createRadialGradient(W/2,H*.5,H*.4,W/2,H*.5,Math.max(W,H)*.8);vg.addColorStop(0,'rgba(40,10,30,0)');vg.addColorStop(1,'rgba(40,10,30,.32)');g.fillStyle=vg;g.fillRect(0,0,W,H)}

G.drawBg=function(g,key,W,H,camX,camY,sc,time){
 if(!(W>0&&H>0))return _bg.apply(this,arguments);
 if(key==='t_ruin'){ruinBg(g,W,H,camX,camY,sc,time);return}
 _bg.apply(this,arguments);
 if(key==='dawn')dawnOverlay(g,W,H,camX,camY,sc,time)};
})();
