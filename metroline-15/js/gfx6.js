/* 画面（六）：第五章「黎明的曙光」的物件、怪物、Boss「倦怠骑士」，以及破败世界的背景。 */
(function(){
var G=window.GFX,ell=G.ell,poly=G.poly,glow=G.glow;
function hash(n){var s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s)}
function rr(g,x,y,w,h,r){g.beginPath();g.roundRect(x,y,w,h,r)}

/* ==================== 物件 ==================== */
var X={
 /* 电动车道：虚线路面；亮灯预警；车贴地冲过去 */
 ebike:function(g,o,t){var y=o.y+o.h,dir=(o.p&&o.p.dir<0)?-1:1;
  g.fillStyle='rgba(40,28,36,.35)';g.fillRect(o.x,y-6,o.w,6);g.strokeStyle='rgba(255,230,160,.5)';g.lineWidth=2;g.setLineDash([14,12]);g.beginPath();g.moveTo(o.x,y-3);g.lineTo(o.x+o.w,y-3);g.stroke();g.setLineDash([]);
  if(o.warn){var ex=dir>0?o.x:o.x+o.w,bl=Math.sin(t*26)>0?1:.35;g.save();g.globalAlpha=bl;g.fillStyle='#ffd23f';for(var i=0;i<3;i++){var ax=ex+dir*(14+i*24);g.beginPath();g.moveTo(ax+dir*14,y-26);g.lineTo(ax-dir*6,y-38);g.lineTo(ax-dir*6,y-14);g.closePath();g.fill()}
   var gr=g.createLinearGradient(ex,0,ex+dir*o.w,0);gr.addColorStop(0,'rgba(255,240,170,.5)');gr.addColorStop(1,'rgba(255,240,170,0)');g.fillStyle=gr;g.fillRect(Math.min(ex,ex+dir*o.w),y-30,o.w,26);g.restore()}
  if(o.bx>-900){var d=o.bdir||dir;g.save();g.translate(o.bx,y-4);g.scale(d,1);glow(g,36,-14,90,'#fff2b0',.7);
   g.fillStyle='#1a1a22';ell(g,-18,0,10,10);g.fill();ell(g,20,0,10,10);g.fill();g.fillStyle='#8a97a3';ell(g,-18,0,4,4);g.fill();ell(g,20,0,4,4);g.fill();
   g.fillStyle='#ffb35a';rr(g,-22,-22,48,16,6);g.fill();g.fillStyle='#e8334a';g.fillRect(-22,-12,48,4);g.fillStyle='#2a3348';rr(g,-4,-44,16,24,5);g.fill();g.fillStyle='#ffd9b0';ell(g,5,-50,7,7);g.fill();g.fillStyle='#e8334a';rr(g,-2,-58,14,6,3);g.fill();
   g.strokeStyle='#cfd6dc';g.lineWidth=3;g.beginPath();g.moveTo(16,-22);g.lineTo(24,-34);g.stroke();g.fillStyle='#fff';ell(g,30,-16,5,5);g.fill();g.strokeStyle='rgba(255,255,255,.4)';g.lineWidth=2;for(var k=0;k<3;k++){g.beginPath();g.moveTo(-30-k*12,-14+k*6);g.lineTo(-58-k*12,-14+k*6);g.stroke()}g.restore()}},
 /* 放学铃：挂在铁架上的铜铃；敲响后会晃，头顶一圈倒计时 */
 bell:function(g,o,t){var cx=o.x+o.w/2,ty=o.y,sw=Math.sin(t*20)*(o.ring||0)*.55;
  g.strokeStyle='#5a4a3a';g.lineWidth=4;g.beginPath();g.moveTo(cx-16,ty);g.lineTo(cx+16,ty);g.stroke();
  g.save();g.translate(cx,ty+2);g.rotate(sw);
  glow(g,0,26,60,'#ffd27a',.25+(o.ring||0)*.5);g.fillStyle='#e8b83a';g.beginPath();g.moveTo(-6,2);g.bezierCurveTo(-8,12,-18,22,-18,40);g.lineTo(18,40);g.bezierCurveTo(18,22,8,12,6,2);g.closePath();g.fill();
  g.fillStyle='#fff3b0';g.fillRect(-12,18,3,16);g.fillStyle='#b88a1a';g.fillRect(-18,38,36,5);g.fillStyle='#5a4a3a';ell(g,0,46,5,5);g.fill();g.restore();
  if(o.solved){var u=Math.max(0,o.rt)/6;g.strokeStyle='#6dffb0';g.lineWidth=4;g.beginPath();g.arc(cx,ty+26,34,-Math.PI/2,-Math.PI/2+Math.PI*2*u);g.stroke()}
  if((o.ring||0)>.05){g.strokeStyle='rgba(255,226,140,'+o.ring*.7+')';g.lineWidth=3;g.beginPath();g.arc(cx,ty+28,30+(1-o.ring)*130,0,6.283);g.stroke()}},
 /* 纸飞机（滑翔道具） */
 glider:function(g,o,t){if(o.got)return;var cx=o.x+o.w/2,cy=o.y+o.h/2+Math.sin(t*2.4+o.x)*4;g.translate(cx,cy);g.rotate(-.35+Math.sin(t*2)*.1);glow(g,0,0,34,'#fff1c8',.5);
  g.fillStyle='#fff6dc';poly(g,[-16,-2,18,-9,-4,10]);g.fill();g.fillStyle='#e0c890';poly(g,[-16,-2,-4,10,-2,2]);g.fill();g.strokeStyle='#c8a860';g.lineWidth=1.5;g.beginPath();g.moveTo(18,-9);g.lineTo(-2,2);g.stroke()},
 lamppost:function(g,o,t){var x=o.x+o.w/2,y=o.y+o.h;g.fillStyle='#3a2a34';g.fillRect(x-3,o.y+14,6,o.h-14);g.fillRect(x-9,y-6,18,6);g.beginPath();g.moveTo(x,o.y+16);g.quadraticCurveTo(x,o.y+4,x+18,o.y+6);g.lineWidth=5;g.strokeStyle='#3a2a34';g.stroke();
  glow(g,x+18,o.y+12,70,'#ffd27a',.35+Math.sin(t*3+o.x)*.04);g.fillStyle='#ffe9a8';rr(g,x+10,o.y+6,16,10,3);g.fill()},
 goalpost:function(g,o,t){var x=o.x,y=o.y+o.h;g.strokeStyle='#e8eef2';g.lineWidth=5;g.beginPath();g.moveTo(x+4,y);g.lineTo(x+4,o.y+4);g.lineTo(x+o.w-4,o.y+4);g.lineTo(x+o.w-4,y);g.stroke();
  g.strokeStyle='rgba(255,255,255,.35)';g.lineWidth=1.5;for(var i=1;i<8;i++){g.beginPath();g.moveTo(x+4+i*(o.w-8)/8,o.y+4);g.lineTo(x+4+i*(o.w-8)/8+12,y);g.stroke()}for(var j=1;j<5;j++){g.beginPath();g.moveTo(x+4,o.y+4+j*(o.h-4)/5);g.lineTo(x+o.w-4,o.y+4+j*(o.h-4)/5);g.stroke()}},
 schoolgate:function(g,o,t){var x=o.x,y=o.y+o.h,w=o.w;g.fillStyle='#8a6a52';rr(g,x,o.y+40,34,o.h-40,3);g.fill();rr(g,x+w-34,o.y+40,34,o.h-40,3);g.fill();g.fillStyle='#a8825f';g.fillRect(x-4,o.y+34,42,10);g.fillRect(x+w-38,o.y+34,42,10);
  g.fillStyle='#3a2a34';rr(g,x+30,o.y+8,w-60,34,6);g.fill();g.fillStyle='#ffd27a';g.font='900 22px "Noto Sans SC",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('放学了',x+w/2,o.y+26);
  g.strokeStyle='#2a2028';g.lineWidth=3;for(var i=0;i<9;i++){var bx=x+44+i*(w-88)/8;g.beginPath();g.moveTo(bx,o.y+60);g.lineTo(bx,y);g.stroke()}g.beginPath();g.moveTo(x+34,o.y+90);g.lineTo(x+w-34,o.y+90);g.stroke()},
 bikerack:function(g,o,t){var x=o.x,y=o.y+o.h;g.fillStyle='#6a7886';g.fillRect(x,o.y,o.w,8);g.fillRect(x+4,o.y,5,o.h);g.fillRect(x+o.w-9,o.y,5,o.h);
  for(var i=0;i<4;i++){var bx=x+22+i*(o.w-34)/4;g.strokeStyle='#1a1a22';g.lineWidth=3;g.beginPath();g.arc(bx,y-12,11,0,6.283);g.arc(bx+26,y-12,11,0,6.283);g.stroke();g.strokeStyle=['#e8334a','#6dd5ff','#ffd23f','#6dffb0'][i];g.beginPath();g.moveTo(bx,y-12);g.lineTo(bx+10,y-30);g.lineTo(bx+26,y-12);g.moveTo(bx+10,y-30);g.lineTo(bx+22,y-30);g.stroke()}},
 sunflag:function(g,o,t){var x=o.x+o.w/2,y=o.y+o.h;g.fillStyle='#cfd6dc';g.fillRect(x-3,o.y,6,o.h);glow(g,x,o.y,14,'#ffd27a',.6);
  g.fillStyle='#e8334a';g.beginPath();g.moveTo(x+3,o.y+6);for(var i=0;i<=8;i++)g.lineTo(x+3+i*6,o.y+6+Math.sin(t*3+i*.7)*3);for(var j=8;j>=0;j--)g.lineTo(x+3+j*6,o.y+34+Math.sin(t*3+j*.7)*3);g.closePath();g.fill();
  g.fillStyle='#ffd23f';ell(g,x+22,o.y+20,6,6);g.fill()}
};
var _thing=G.thing;
G.thing=function(g,o,t,biome,lvlH){var f=X[o.kind];if(f){if(!o.p)o.p={}; /* 关卡工坊画的物件没有 p */g.save();f(g,o,t,G.B(biome));g.restore()}else _thing.apply(this,arguments)};

/* ==================== 怪物 ==================== */
var E={
 /* 纸飞机怪：一张被折成飞机的作业纸，机身上还留着红叉 */
 paperplane:function(g,e,t){var cx=e.x+e.w/2,cy=e.y+e.h/2,fl=e.flash>0,aim=e.cs==='aim';g.translate(cx,cy);var a=e.ang||0;if(e.cs==='idle'||e.cs==='back')a=(e.face>0?0:Math.PI)+Math.sin(t*3)*.12;g.rotate(a);if(Math.cos(a)<0)g.scale(1,-1);
  if(aim||e.cs==='dive')glow(g,0,0,46,aim?'#ff6a5a':'#fff1c8',.5);
  g.fillStyle=fl?'#fff':'#fff6dc';poly(g,[-24,-4,26,0,-24,12]);g.fill();g.fillStyle=fl?'#fff':'#e8d6a8';poly(g,[-24,-4,26,0,-8,-9]);g.fill();g.strokeStyle='#c8b080';g.lineWidth=1.5;g.beginPath();g.moveTo(26,0);g.lineTo(-16,4);g.stroke();
  g.strokeStyle='rgba(60,90,160,.55)';g.lineWidth=1;for(var i=0;i<3;i++){g.beginPath();g.moveTo(-18+i*5,-2+i*2);g.lineTo(-4+i*5,-1+i*2);g.stroke()}
  g.strokeStyle='#e8334a';g.lineWidth=2.5;g.beginPath();g.moveTo(-8,5);g.lineTo(-1,11);g.moveTo(-1,5);g.lineTo(-8,11);g.stroke();
  g.fillStyle='#2a3348';ell(g,12,-2,2,2.4);g.fill();if(aim){g.strokeStyle='rgba(255,106,90,.7)';g.setLineDash([6,6]);g.lineWidth=2;g.beginPath();g.moveTo(26,0);g.lineTo(26+340,0);g.stroke();g.setLineDash([])}},
 /* 失控的篮球 */
 hoop:function(g,e,t){var cx=e.x+e.w/2,cy=e.y+e.h/2,r=e.w*.5,bat=e.cs==='batted';g.translate(cx,cy);if(bat){glow(g,0,0,r*3.6,'#ffb35a',.6);g.strokeStyle='rgba(255,210,120,.5)';g.lineWidth=4;g.beginPath();g.moveTo(-e.vx*.05,0);g.lineTo(-e.vx*.12,-e.vy*.05);g.stroke()}
  g.rotate(e.spin||0);var gr=g.createRadialGradient(-r*.3,-r*.3,2,0,0,r);gr.addColorStop(0,'#ffc070');gr.addColorStop(1,'#d9611a');g.fillStyle=e.flash>0?'#fff':gr;ell(g,0,0,r,r);g.fill();
  g.strokeStyle='#3a1a0a';g.lineWidth=2;g.beginPath();g.moveTo(-r,0);g.lineTo(r,0);g.moveTo(0,-r);g.lineTo(0,r);g.stroke();g.beginPath();g.arc(-r*1.15,0,r*.85,-1,1);g.stroke();g.beginPath();g.arc(r*1.15,0,r*.85,Math.PI-1,Math.PI+1);g.stroke();
  if(!bat){g.rotate(-(e.spin||0));g.fillStyle='#fff';ell(g,-4,-2,3.2,3.6);g.fill();ell(g,5,-2,3.2,3.6);g.fill();g.fillStyle='#2a1a14';ell(g,-3,-1.5,1.4,1.8);g.fill();ell(g,6,-1.5,1.4,1.8);g.fill();g.strokeStyle='#2a1a14';g.lineWidth=2;g.beginPath();g.arc(1,6,3.5,.15*Math.PI,.85*Math.PI);g.stroke()}},
 /* 值日扫帚：稻草扎的扫帚头站在地上，长杆上顶着一双眼睛 */
 broom:function(g,e,t){var cx=e.x+e.w/2,by=e.y+e.h,fl=e.flash>0,rs=e.cs==='raise',sw=e.cs==='sweep';g.translate(cx,by);g.scale(e.face||1,1);
  var lean=rs?-.55:sw?.7:Math.sin(t*2)*.04;g.save();g.rotate(lean);
  g.strokeStyle=fl?'#fff':'#a8793a';g.lineWidth=7;g.lineCap='round';g.beginPath();g.moveTo(0,-4);g.lineTo(0,-64);g.stroke();
  g.fillStyle=fl?'#fff':'#e2c26a';poly(g,[-18,0,18,0,10,-26,-10,-26]);g.fill();g.strokeStyle='#b8943a';g.lineWidth=1.5;for(var i=-3;i<=3;i++){g.beginPath();g.moveTo(i*5,-26);g.lineTo(i*6.4,0);g.stroke()}g.fillStyle='#e8334a';g.fillRect(-9,-30,18,5);
  g.fillStyle='#fff';ell(g,-5,-52,4.4,5);g.fill();ell(g,6,-52,4.4,5);g.fill();g.fillStyle=rs?'#e8334a':'#2a2028';ell(g,-4,-51,2,2.4);g.fill();ell(g,7,-51,2,2.4);g.fill();
  g.strokeStyle='#2a2028';g.lineWidth=2;g.beginPath();g.moveTo(-10,-60);g.lineTo(-2,-57);g.moveTo(12,-60);g.lineTo(4,-57);g.stroke();g.restore();
  if(sw){g.strokeStyle='rgba(232,211,160,.7)';g.lineWidth=3;for(var k=0;k<3;k++){g.beginPath();g.moveTo(20+k*8,-6-k*4);g.lineTo(44+k*8,-4-k*4);g.stroke()}}
  if(rs)glow(g,0,-40,40,'#ff6a5a',.3)},
 /* 夕阳的影子：睡着时是地上一道拉长的黑影；醒来后站起来，紫色的眼睛 */
 shadow:function(g,e,t){var cx=e.x+e.w/2,by=e.y+e.h,al=e.alpha==null?.8:e.alpha,fl=e.flash>0;g.translate(cx,by);
  if(e.cs==='sleep'){g.globalAlpha=.5;g.fillStyle='#1a0a24';ell(g,0,-3,64,6);g.fill();g.globalAlpha=.3;ell(g,0,-3,96,9);g.fill();return}
  g.globalAlpha=al;g.scale(e.face||1,1);var rise=e.cs==='rise'?Math.min(1,(1.2-e.timer)/1.2):1;g.scale(1,rise);
  g.fillStyle=fl?'#fff':'#1a0a24';ell(g,0,-36,10,11);g.fill();rr(g,-9,-30,18,22,5);g.fill();g.fillRect(-8,-10,6,10);g.fillRect(2,-10,6,10);
  g.fillStyle='#1a0a24';g.beginPath();g.moveTo(-10,-26);g.lineTo(-24,-14+Math.sin(t*5)*2);g.lineTo(-8,-18);g.fill();
  g.globalAlpha=al*.45;g.fillStyle='#1a0a24';poly(g,[-10,0,10,0,70,2,60,-2]);g.fill();g.globalAlpha=al;
  glow(g,3,-37,16,'#c070ff',.8);g.fillStyle='#e0b0ff';ell(g,-2,-37,2.2,3);g.fill();ell(g,6,-37,2.2,3);g.fill()}
};
var _enemy=G.enemy;
G.enemy=function(g,e,t,biome){var f=E[e.kind];if(f){g.save();f(g,e,t);g.restore()}else _enemy.apply(this,arguments)};

/* Boss「倦怠骑士」与破败背景见 gfx7.js */
})();
