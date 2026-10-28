/* 画面（四）：DLC「未竟之梦」的物件、敌人、悖论 Boss、NPC。 */
(function(){
var G=window.GFX,ell=G.ell,poly=G.poly,glow=G.glow;
function jit(t,s){return Math.sin(t*s)*Math.cos(t*s*1.7)}

/* ---------- 物件 ---------- */
var X={
 /* 蓝色碎片：旋转的蓝色菱形，带十字闪光 */
 /* 黄色水晶（地铁DLC 专属收集物）：同蓝色碎片的玩法，金黄色的旋转菱形 */
 yellowshard:function(g,o,t){if(o.got)return;var x=o.x,y=o.y,w=o.w,h=o.h,pu=1+Math.sin(t*4+x)*.12;
  g.translate(x+w/2,y+h/2+Math.sin(t*2.3+x*.1)*3);g.scale(Math.abs(Math.cos(t*1.6+x))*.55+.45,1);g.scale(pu,pu);
  g.fillStyle='#fff3b0';poly(g,[0,-13,9,0,0,13,-9,0]);g.fill();g.fillStyle='#ffd23f';poly(g,[0,-13,9,0,0,2]);g.fill();g.fillStyle='#e0a010';poly(g,[0,13,-9,0,0,2]);g.fill();
  glow(g,0,0,40,'#ffd84a',.75);g.globalAlpha=.7;g.strokeStyle='#fff';g.lineWidth=1.5;var s=8+Math.sin(t*6)*3;g.beginPath();g.moveTo(-s,0);g.lineTo(s,0);g.moveTo(0,-s);g.lineTo(0,s);g.stroke()},
 blueshard:function(g,o,t){if(o.got)return;var x=o.x,y=o.y,w=o.w,h=o.h,pu=1+Math.sin(t*4+x)*.12;
  g.translate(x+w/2,y+h/2+Math.sin(t*2.3+x*.1)*3);g.scale(Math.abs(Math.cos(t*1.6+x))*.55+.45,1);g.scale(pu,pu);
  g.fillStyle='#d6ecff';poly(g,[0,-13,9,0,0,13,-9,0]);g.fill();g.fillStyle='#4f9dff';poly(g,[0,-13,9,0,0,2]);g.fill();g.fillStyle='#2a6fd6';poly(g,[0,13,-9,0,0,2]);g.fill();
  glow(g,0,0,40,'#6db8ff',.75);g.globalAlpha=.7;g.strokeStyle='#fff';g.lineWidth=1.5;var s=8+Math.sin(t*6)*3;g.beginPath();g.moveTo(-s,0);g.lineTo(s,0);g.moveTo(0,-s);g.lineTo(0,s);g.stroke()},
 /* 电磁场：磁场区域，⊗ 表示磁感线垂直纸面向里；进入后受电磁阻尼 */
 emfield:function(g,o,t){var x=o.x,y=o.y,w=o.w,h=o.h;g.fillStyle='#4aa8ff';g.globalAlpha=.1+Math.sin(t*3)*.03;g.fillRect(x,y,w,h);
  g.globalAlpha=.55;g.strokeStyle='#7dcfff';g.lineWidth=2;g.setLineDash([6,6]);g.strokeRect(x+1,y+1,w-2,h-2);g.setLineDash([]);
  g.fillStyle='#bfe8ff';g.font='bold 15px sans-serif';g.textAlign='center';var cols=Math.max(1,Math.floor(w/32)),rows=Math.max(1,Math.floor(h/32));
  for(var i=0;i<cols;i++)for(var j=0;j<rows;j++){g.globalAlpha=.35+Math.sin(t*2+i+j)*.25;g.fillText('⊗',x+16+i*32,y+22+j*32)}
  g.globalAlpha=.8;g.font='bold 11px sans-serif';g.fillText('B',x+w/2,y+h-4)},
 /* 重力井：向内收缩的同心环 */
 gravwell:function(g,o,t){var cx=o.x+o.w/2,cy=o.y+o.h/2,R=Math.min(o.w,o.h)/2+14;
  g.fillStyle='#6a3fd0';g.globalAlpha=.12;ell(g,cx,cy,R,R);g.fill();
  for(var i=0;i<4;i++){var k=((t*.5+i/4)%1),rr=R*(1-k);g.globalAlpha=Math.sin(k*Math.PI)*.7;g.strokeStyle='#b890ff';g.lineWidth=2;ell(g,cx,cy,rr,rr);g.stroke()}
  g.globalAlpha=1;g.fillStyle='#14041f';ell(g,cx,cy,9,9);g.fill();glow(g,cx,cy,R*1.3,'#9c6fff',.5);g.fillStyle='#e9d4ff';g.font='bold 11px sans-serif';g.textAlign='center';g.globalAlpha=.75;g.fillText('g↑',cx,o.y-3)},
 /* 等离子体：蓄能→放电 */
 plasma:function(g,o,t){var cx=o.x+o.w/2,cy=o.y+o.h/2,r=Math.min(o.w,o.h)/2;
  g.fillStyle='#3a3f50';g.beginPath();g.roundRect(o.x+2,o.y+o.h-8,o.w-4,8,3);g.fill();g.beginPath();g.roundRect(o.x+2,o.y,o.w-4,8,3);g.fill();
  if(o.off){g.fillStyle='#555a6a';ell(g,cx,cy,r*.35,r*.35);g.fill();return}
  if(o.active){for(var i=0;i<3;i++){g.strokeStyle=i?'#ff9aff':'#ffffff';g.lineWidth=i?3:1.5;g.globalAlpha=.9;g.beginPath();for(var a=0;a<=12;a++){var an=a/12*6.283,rr=r*(.7+jit(t*30+a+i*3,1)*.35);g.lineTo(cx+Math.cos(an)*rr,cy+Math.sin(an)*rr)}g.closePath();g.stroke()}
   g.globalAlpha=1;g.fillStyle='#ffd0ff';ell(g,cx,cy,r*.5,r*.5);g.fill();glow(g,cx,cy,r*2.6,'#ff6aff',.8)}
  else{var k=o.warn?.5+Math.sin(t*40)*.5:.25;g.globalAlpha=k;g.fillStyle='#ff7aff';ell(g,cx,cy,r*.4,r*.4);g.fill();glow(g,cx,cy,r*1.2,'#ff6aff',k*.5)}},
 /* 电弧：上下两根电极之间的锯齿电流 */
 voltarc:function(g,o,t){var x=o.x+o.w/2,y0=o.y,y1=o.y+o.h;
  g.fillStyle='#3a3f50';g.beginPath();g.roundRect(x-12,y0,24,10,3);g.fill();g.beginPath();g.roundRect(x-12,y1-10,24,10,3);g.fill();
  g.fillStyle=o.active?'#fff6a0':(o.warn?'#ffb060':'#7a6a3a');ell(g,x,y0+8,4,4);g.fill();ell(g,x,y1-8,4,4);g.fill();
  if(o.off){return}
  if(o.active){for(var k=0;k<2;k++){g.strokeStyle=k?'#fff':'#ffeb3b';g.lineWidth=k?2:5;g.globalAlpha=k?1:.7;g.beginPath();g.moveTo(x,y0+10);var n=7;for(var i=1;i<n;i++){g.lineTo(x+(Math.random()-.5)*22,y0+10+(y1-y0-20)*i/n)}g.lineTo(x,y1-10);g.stroke()}g.globalAlpha=1;glow(g,x,(y0+y1)/2,o.h*.5,'#ffeb3b',.7)}
  else if(o.warn){g.strokeStyle='#ffd070';g.globalAlpha=.3+Math.sin(t*40)*.3;g.lineWidth=1.5;g.beginPath();g.moveTo(x,y0+10);g.lineTo(x,y1-10);g.stroke();g.globalAlpha=1}},
 /* 低温陷阱：地面喷口，喷发时冒出冰雾 */
 cryotrap:function(g,o,t){var x=o.x,y=o.y,w=o.w,h=o.h;
  g.fillStyle='#35566b';g.beginPath();g.roundRect(x,y+h-9,w,9,3);g.fill();g.fillStyle='#bfefff';for(var i=0;i<w/10;i++){g.fillRect(x+4+i*10,y+h-7,4,5)}
  if(o.active){var hh=Math.min(120,h+80);var gr=g.createLinearGradient(0,y+h-9,0,y+h-9-hh);gr.addColorStop(0,'rgba(190,240,255,.75)');gr.addColorStop(1,'rgba(190,240,255,0)');g.fillStyle=gr;g.fillRect(x+2,y+h-9-hh,w-4,hh);
   g.fillStyle='#fff';for(var j=0;j<8;j++){var ph=(t*1.2+j*.13)%1;g.globalAlpha=1-ph;ell(g,x+8+((j*37)%(w-16)),y+h-9-ph*hh,2.4,2.4);g.fill()}g.globalAlpha=1;glow(g,x+w/2,y+h-20,w,'#8fe8ff',.5)}
  else if(o.warn){g.globalAlpha=.4+Math.sin(t*30)*.3;g.fillStyle='#bfefff';g.fillRect(x+2,y+h-14,w-4,5);g.globalAlpha=1}}
};
var _thing=G.thing;
G.thing=function(g,o,t,biome,lvlH){var f=X[o.kind];if(f){g.save();f(g,o,t,G.B(biome));g.restore()}else _thing(g,o,t,biome,lvlH)};

/* ---------- 敌人 ---------- */
var E={
 drone:function(g,e,t){var cx=e.x+e.w/2,cy=e.y+e.h/2,fl=e.flash>0;g.translate(cx,cy+Math.sin(t*5+e.x)*2);g.scale(e.face||1,1);
  g.fillStyle='rgba(180,210,255,.5)';var sp=Math.sin(t*70);ell(g,-16,-14,13*Math.abs(sp)+3,3);g.fill();ell(g,16,-14,13*Math.abs(-sp)+3,3);g.fill();
  g.fillStyle=fl?'#fff':'#6f8fc8';g.beginPath();g.ellipse(0,0,20,12,0,0,6.283);g.fill();g.fillStyle='#4a6aa8';g.fillRect(-4,-14,8,6);
  g.fillStyle=e.charge>0?'#ff4a3a':'#7dffe8';ell(g,8,0,5,5);g.fill();glow(g,8,0,e.charge>0?36:18,e.charge>0?'#ff4a3a':'#7dffe8',.6);
  g.strokeStyle='#aac8ff';g.lineWidth=2;g.beginPath();g.moveTo(-8,12);g.lineTo(-12,19);g.moveTo(8,12);g.lineTo(12,19);g.stroke()},
 probe:function(g,e,t){var cx=e.x+e.w/2,cy=e.y+e.h/2,fl=e.flash>0,r=Math.min(e.w,e.h)/2;g.translate(cx,cy);
  g.fillStyle=fl?'#fff':'#9cc0f0';ell(g,0,0,r,r);g.fill();g.strokeStyle='#5f86c4';g.lineWidth=3;g.save();g.rotate(e.rot||0);g.beginPath();g.ellipse(0,0,r,r*.35,0,0,6.283);g.stroke();g.beginPath();g.ellipse(0,0,r*.35,r,0,0,6.283);g.stroke();g.restore();
  var lx=clampV((e.vx||0)/40,-1,1)*4,ly=clampV((e.vy||0)/40,-1,1)*4;g.fillStyle='#fff';ell(g,lx,ly,r*.38,r*.38);g.fill();g.fillStyle='#d33';ell(g,lx*1.4,ly*1.4,r*.17,r*.17);g.fill();glow(g,0,0,r*2.2,'#a0c8ff',.35)},
 sentinel:function(g,e,t){var cx=e.x+e.w/2,y=e.y,w=e.w,h=e.h,fl=e.flash>0;g.translate(cx,y+h);g.scale(e.face||1,1);
  g.fillStyle='#34455f';g.fillRect(-w*.3,-16,w*.22,16);g.fillRect(w*.08,-16,w*.22,16);
  g.fillStyle=fl?'#fff':'#5f7fe0';g.beginPath();g.roundRect(-w*.42,-h*.78,w*.84,h*.56,8);g.fill();g.fillStyle='#8aa6f5';g.fillRect(-w*.42,-h*.78,w*.84,6);
  g.fillStyle='#3b4a78';g.beginPath();g.roundRect(-w*.22,-h*.98,w*.44,h*.22,6);g.fill();g.fillStyle=e.charge>0?'#ff4a3a':'#7dffe8';g.fillRect(-w*.14,-h*.9,w*.28,5);
  g.fillStyle='#2a3558';g.fillRect(w*.2,-h*.62,w*.5,10);g.fillStyle=e.charge>0?'#ff6a4a':'#9fb0e0';g.fillRect(w*.62,-h*.6,6,6);if(e.charge>0)glow(g,w*.65,-h*.57,34,'#ff4a3a',.7)},
 wraith:function(g,e,t){var cx=e.x+e.w/2,cy=e.y+e.h/2,fl=e.flash>0;g.globalAlpha=e.alpha==null?.8:e.alpha;g.translate(cx,cy+Math.sin(t*3+e.x)*4);
  g.fillStyle=fl?'#fff':'#bfefff';g.beginPath();g.arc(0,-2,e.w/2,Math.PI,0);for(var i=3;i>=0;i--)g.lineTo(-e.w/2+i*(e.w/3)+e.w/6,e.w/2+(i%2?-4:6)+Math.sin(t*6+i)*2);g.closePath();g.fill();
  g.fillStyle='#16384f';ell(g,-6,-3,3.4,5);g.fill();ell(g,7,-3,3.4,5);g.fill();ell(g,0,9,3,2.4);g.fill();
  g.strokeStyle='#e8fbff';g.lineWidth=1.5;g.globalAlpha*=.8;for(var k=0;k<3;k++){g.beginPath();g.moveTo(-12+k*12,-14);g.lineTo(-8+k*12,-22);g.stroke()}glow(g,0,0,44,'#8fe8ff',.4)},
 anomaly:function(g,e,t){var cx=e.x+e.w/2,cy=e.y+e.h/2,fl=e.flash>0,bl=e.blink>0;g.translate(cx,cy);
  for(var c=0;c<3;c++){g.fillStyle=['#ff6dff','#6dffff','#fff36d'][c];g.globalAlpha=bl?.5:.55;g.save();g.translate(jit(t*20+c,3)*(bl?7:3),jit(t*23+c*2,3)*(bl?7:3));g.rotate(t*(1+c*.6));poly(g,[0,-16,15,8,-15,8]);g.fill();g.restore()}
  g.globalAlpha=1;g.fillStyle=fl?'#fff':'#2b0a3a';ell(g,0,0,9,9);g.fill();g.fillStyle='#fff';ell(g,Math.sin(t*4)*2,0,4,4);g.fill();glow(g,0,0,bl?58:40,'#ff6dff',bl?.8:.45)}
};
function clampV(v,a,b){return Math.max(a,Math.min(b,v))}
var _enemy=G.enemy;
G.enemy=function(g,e,t,biome){var f=E[e.kind];if(f){g.save();f(g,e,t);g.restore()}else _enemy(g,e,t,biome)};

/* ---------- 悖论 Boss ---------- */
var COL=[['#c070ff','#f0d4ff','#5a2a8a'],['#ff7ad9','#ffd6f3','#8a2a70'],['#ffd060','#fff2c0','#8a6a1a']],FORM=['F=ma','p=mv','E=mgh'];
function tri(g,r,rot,col,lw){g.save();g.rotate(rot);g.strokeStyle=col;g.lineWidth=lw;g.lineJoin='round';for(var i=0;i<3;i++){var a0=i*2.0944-1.5708,a1=(i+1)*2.0944-1.5708;g.beginPath();g.moveTo(Math.cos(a0)*r,Math.sin(a0)*r);g.lineTo(Math.cos(a1)*r,Math.sin(a1)*r);g.stroke()}g.restore()}
var _boss=G.boss;
G.boss=function(g,b,t){
 if(b.type!=='paradox'){_boss(g,b,t);return}
 var ph=b.ph||0,c=COL[ph],cx=b.x+b.w/2,cy=b.y+b.h/2,R=Math.min(b.w,b.h)/2,fl=b.flash>0,wind=b.sub==='wind'||b.sub==='stun';
 g.save();g.translate(cx,cy+Math.sin(t*2.4)*5);
 glow(g,0,0,R*2.4,c[0],.35+Math.sin(t*3)*.08);
 /* 三层不可能三角：越往后转得越快 */
 tri(g,R*.98,t*(.5+ph*.3),fl?'#fff':c[0],8);tri(g,R*.74,-t*(.8+ph*.4),fl?'#fff':c[1],5);tri(g,R*.5,t*(1.2+ph*.5),fl?'#fff':c[0],4);
 /* 环绕的公式 */
 g.fillStyle=c[1];g.font='bold 15px "Noto Sans SC",sans-serif';g.textAlign='center';
 for(var i=0;i<3;i++){var a=t*(1.1+ph*.2)+i*2.0944,rr=R*1.18;g.save();g.translate(Math.cos(a)*rr,Math.sin(a)*rr*.55);g.globalAlpha=.9;g.fillText(FORM[(i+ph)%3],0,0);g.restore()}
 /* 核心之眼 */
 g.fillStyle=c[2];ell(g,0,0,R*.3,R*.3);g.fill();g.fillStyle=wind?'#ff4a3a':'#fff';ell(g,0,0,R*.22,R*.16*(wind?.5:1));g.fill();
 g.fillStyle='#14041f';ell(g,(b.face||1)*R*.07,0,R*.07,R*.12*(wind?.5:1));g.fill();
 if(wind)glow(g,0,0,R*1.1,'#ff4a3a',.6);
 g.restore();
 if(b.sub==='stun'){g.save();g.fillStyle='#ffe27a';g.font='bold 22px sans-serif';g.textAlign='center';for(var s2=0;s2<3;s2++)g.fillText('★',cx+Math.cos(t*5+s2*2.1)*40,b.y-10+Math.sin(t*5+s2*2.1)*8);g.restore()}
};

/* ---------- NPC ---------- */
var NPCX={
 scientist:function(g,x,y,w,h,t,bob){ /* 实验室研究员：白大褂、眼镜、烧杯 */
  g.fillStyle='#232f42';g.fillRect(-6,-10,5,10);g.fillRect(1,-10,5,10);g.fillStyle='#f4f7fb';g.beginPath();g.roundRect(-9,-28+bob,18,22,4);g.fill();g.fillStyle='#cfd8e6';g.fillRect(-1,-27+bob,2,20);
  g.fillStyle='#ffd9b0';ell(g,0,-35+bob,8,8);g.fill();g.fillStyle='#4a3a2a';g.beginPath();g.arc(0,-37+bob,8.4,Math.PI,0);g.fill();
  g.strokeStyle='#222';g.lineWidth=1.4;g.strokeRect(-6.5,-37+bob,5,4);g.strokeRect(1.5,-37+bob,5,4);g.beginPath();g.moveTo(-1.5,-35+bob);g.lineTo(1.5,-35+bob);g.stroke();
  g.fillStyle='#7dffe8';g.globalAlpha=.85;g.beginPath();g.roundRect(8,-20+bob,6,9,2);g.fill();g.globalAlpha=1;g.strokeStyle='#e8f6ff';g.lineWidth=1.2;g.strokeRect(8,-20+bob,6,9)},
 ai:function(g,x,y,w,h,t,bob){ /* AI 助手：悬浮的屏幕脸 */
  var fy=-30+Math.sin(t*2.2)*3;glow(g,0,fy,36,'#7dc8ff',.4);g.fillStyle='#1c3350';g.beginPath();g.roundRect(-13,fy-14,26,24,7);g.fill();g.strokeStyle='#7dc8ff';g.lineWidth=2;g.stroke();
  g.fillStyle='#7dffe8';var blink=Math.sin(t*1.3)>.96?1:5;g.fillRect(-7,fy-6,4,blink);g.fillRect(3,fy-6,4,blink);g.fillRect(-5,fy+3,10,2);
  g.strokeStyle='#7dc8ff';g.globalAlpha=.4;g.beginPath();g.moveTo(0,fy+10);g.lineTo(0,0);g.stroke();g.globalAlpha=1},
 shadow:function(g,x,y,w,h,t,bob){ /* 影子：深色半透明人形 */
  g.globalAlpha=.75+Math.sin(t*2)*.08;g.fillStyle='#10141f';g.beginPath();g.roundRect(-8,-28+bob,16,22,6);g.fill();ell(g,0,-34+bob,8,8);g.fill();g.fillRect(-6,-8,5,8);g.fillRect(1,-8,5,8);
  g.fillStyle='#bfefff';ell(g,-3,-35+bob,1.6,1.6);g.fill();ell(g,3,-35+bob,1.6,1.6);g.fill();g.globalAlpha=.3;g.fillStyle='#6d7a8f';for(var i=0;i<4;i++)g.fillRect(-9+i*5,-6+((t*14+i*7)%10),3,6);g.globalAlpha=1},
 echo:function(g,x,y,w,h,t,bob){ /* 回声：层层扩散的声波环 */
  glow(g,0,-22,40,'#9fcfef',.35);for(var i=0;i<3;i++){var k=(t*.6+i/3)%1;g.globalAlpha=(1-k)*.8;g.strokeStyle='#bfe8ff';g.lineWidth=2;ell(g,0,-22,8+k*24,12+k*30);g.stroke()}
  g.globalAlpha=.95;g.fillStyle='#dff4ff';g.beginPath();g.roundRect(-6,-30+bob,12,18,5);g.fill();ell(g,0,-35+bob,6,6);g.fill();g.globalAlpha=1}
};
var _npc=G.npc;
G.npc=function(g,kind,x,y,w,h,t,face){var base=String(kind).split('#')[0],f=NPCX[base];if(!f)return _npc(g,kind,x,y,w,h,t,face);
 g.save();g.translate(x+w/2,y+h);g.scale(face||1,1);f(g,x,y,w,h,t,Math.sin(t*2+x)*1.2);g.restore()};
})();
