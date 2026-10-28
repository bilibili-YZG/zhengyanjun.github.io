/* 画面：全部程序化生成的贴图/背景/角色，无需外部图片（zyj.png 作为主角的脸）。 */
(function(){
if(!CanvasRenderingContext2D.prototype.roundRect){CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r){r=Math.min(r||0,w/2,h/2);this.moveTo(x+r,y);this.arcTo(x+w,y,x+w,y+h,r);this.arcTo(x+w,y+h,x,y+h,r);this.arcTo(x,y+h,x,y,r);this.arcTo(x,y,x+w,y,r);this.closePath()}}
var T=32,cache={};
function mk(w,h){var c=document.createElement('canvas');c.width=w;c.height=h;return c}
function prng(s){s=(s>>>0)||1;return function(){s=(s*1664525+1013904223)>>>0;return s/4294967296}}
function ell(g,x,y,rx,ry){g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2)}
function poly(g,p){g.beginPath();g.moveTo(p[0],p[1]);for(var i=2;i<p.length;i+=2)g.lineTo(p[i],p[i+1]);g.closePath()}
function B(k){return L15.BIOMES[k]||L15.BIOMES.snow}
function hash(x,y){return (((x*73856093)^(y*19349663))>>>0)%3}

/* ---------- 发光精灵 ---------- */
function glowSprite(color){var k='g'+color;if(cache[k])return cache[k];var c=mk(128,128),g=c.getContext('2d'),r=g.createRadialGradient(64,64,0,64,64,64);r.addColorStop(0,color);r.addColorStop(.35,color+'88');r.addColorStop(1,color+'00');g.fillStyle=r;g.fillRect(0,0,128,128);return cache[k]=c}
var fx={on:true};
function glow(g,x,y,r,color,a){if(!fx.on)return;g.save();g.globalCompositeOperation='lighter';g.globalAlpha=a==null?.6:a;g.drawImage(glowSprite(color.length===7?color:'#ffffff'),x-r,y-r,r*2,r*2);g.restore()}

/* ---------- 地块贴图 ---------- */
function tiles(key){
 if(cache['t'+key])return cache['t'+key];
 var b=B(key),sk=b.custom?b.base:key,r=prng(key.length*131+key.charCodeAt(0)),S=64,set={body:[],top:[]},i,v;
 for(v=0;v<3;v++){
  var c=mk(S,S),g=c.getContext('2d');g.fillStyle=b.body;g.fillRect(0,0,S,S);
  for(i=0;i<30;i++){g.globalAlpha=.1+r()*.2;g.fillStyle=r()<.55?b.dark:b.top;g.fillRect(r()*S,r()*S,3+r()*8,2+r()*5)}
  g.globalAlpha=.22;g.strokeStyle=b.dark;g.lineWidth=2;g.beginPath();g.moveTo(0,20+v*9);g.lineTo(S,24+v*7);g.moveTo(0,48);g.lineTo(S,44+v*5);g.stroke();g.globalAlpha=1;
  if(sk==='lava'){g.strokeStyle='#ff8a3a';g.lineWidth=2.5;g.globalAlpha=.85;g.beginPath();var x0=r()*50+6;g.moveTo(x0,0);g.lineTo(x0+8,18);g.lineTo(x0-4,34);g.lineTo(x0+10,64);g.stroke();g.globalAlpha=1}
  if(sk==='underground'||sk==='forest'||sk==='redforest'){g.fillStyle=b.accent;g.globalAlpha=.25;for(i=0;i<3;i++){ell(g,r()*S,r()*S,4+r()*5,2+r()*2);g.fill()}g.globalAlpha=1}
  set.body.push(c);
  var t=mk(S,S),tg=t.getContext('2d');tg.drawImage(c,0,0);
  tg.fillStyle=b.top;tg.beginPath();tg.moveTo(0,0);tg.lineTo(S,0);tg.lineTo(S,14);
  for(var x=S;x>=0;x-=8){tg.lineTo(x,14+(r()*8)+(sk==='snow'?4:0))}tg.closePath();tg.fill();
  tg.fillStyle='#ffffff';tg.globalAlpha=.28;tg.fillRect(0,0,S,4);tg.globalAlpha=1;
  if(sk==='forest'||sk==='underground'||sk==='redforest'){tg.fillStyle=b.top;for(i=0;i<7;i++){var gx=i*9+r()*4;tg.beginPath();tg.moveTo(gx,0);tg.lineTo(gx+4,0);tg.lineTo(gx+2,-0);tg.fill()}}
  if(sk==='lava'){var lg=tg.createLinearGradient(0,0,0,18);lg.addColorStop(0,'#ffd18a');lg.addColorStop(1,'#e0793a');tg.fillStyle=lg;tg.globalAlpha=.9;tg.fillRect(0,0,S,8);tg.globalAlpha=1}
  set.top.push(t)}
 var th=mk(S,24),tg2=th.getContext('2d');var wood=sk==='snow'||sk==='station'||sk==='night'?'#9fb9c7':sk==='lava'?'#6a4a44':'#b08c5b';
 tg2.fillStyle=wood;tg2.fillRect(0,2,S,16);tg2.fillStyle='#ffffff';tg2.globalAlpha=.3;tg2.fillRect(0,2,S,4);tg2.globalAlpha=.25;tg2.fillStyle='#000';tg2.fillRect(0,16,S,3);tg2.fillRect(20,2,2,16);tg2.fillRect(44,2,2,16);tg2.globalAlpha=1;
 tg2.fillStyle=b.accent;tg2.globalAlpha=.7;tg2.fillRect(0,0,S,3);tg2.globalAlpha=1;set.thin=th;
 var bo=mk(S,S),bg=bo.getContext('2d');bg.fillStyle='#4a4057';bg.fillRect(0,0,S,S);bg.fillStyle='#b66ad0';bg.beginPath();bg.ellipse(32,36,32,28,0,Math.PI,0);bg.lineTo(64,36);bg.closePath();bg.fill();
 bg.fillStyle='#f2c9ff';[[16,22],[32,14],[48,24],[26,30]].forEach(function(p){ell(bg,p[0],p[1],4,3);bg.fill()});bg.fillStyle='#e9d9c6';bg.fillRect(22,36,20,28);bg.fillStyle='#cdb9a4';bg.fillRect(36,36,6,28);set.bounce=bo;
 var br=mk(S,S),rg=br.getContext('2d');rg.fillStyle=b.body;rg.fillRect(0,0,S,S);rg.fillStyle=b.dark;rg.globalAlpha=.55;for(var by=0;by<4;by++){rg.fillRect(0,by*16,S,3);for(var bx=(by%2)*16;bx<S;bx+=32)rg.fillRect(bx,by*16,3,16)}rg.globalAlpha=.25;rg.fillStyle=b.top;rg.fillRect(0,0,S,5);set.brick=br;
 var ic=mk(S,S),ig=ic.getContext('2d'),gr=ig.createLinearGradient(0,0,0,S);gr.addColorStop(0,'#dff8ff');gr.addColorStop(1,'#86cde4');ig.fillStyle=gr;ig.fillRect(0,0,S,S);ig.strokeStyle='#ffffff';ig.globalAlpha=.6;ig.lineWidth=3;ig.beginPath();ig.moveTo(8,50);ig.lineTo(30,18);ig.moveTo(34,58);ig.lineTo(52,30);ig.stroke();ig.globalAlpha=1;ig.fillStyle='#fff';ig.fillRect(0,0,S,6);set.ice=ic;
 return cache['t'+key]=set}
function drawTile(g,set,v,x,y,open,wx,wy){
 var px=x*T,py=y*T,h=hash(x,y);
 if(v===2){g.drawImage(set.thin,px,py,T,12);return}
 if(v===3){g.drawImage(set.bounce,px,py,T,T);return}
 if(v===5){g.drawImage(set.ice,px,py,T,T);return}
 if(v===4){g.drawImage(set.brick,px,py,T,T);return}
 g.drawImage(open.up?set.top[h]:set.body[h],px,py,T,T);
 g.fillStyle='rgba(0,0,0,.22)';if(open.left)g.fillRect(px,py,2,T);if(open.right)g.fillRect(px+T-2,py,2,T);if(open.down)g.fillRect(px,py+T-3,T,3)}

/* ---------- 视差背景 ---------- */
function bgLayers(key){
 if(cache['b'+key])return cache['b'+key];
 var b=B(key),sk=b.custom?b.base:key,W=1024,H=576,r=prng(key.length*977+key.charCodeAt(1)*31),L=[mk(W,H),mk(W,H),mk(W,H)],g=L.map(function(c){return c.getContext('2d')}),i;
 function wrap(fn,x,w){fn(x);if(x+w>W)fn(x-W);if(x<w)fn(x+W)}
 if(sk==='snow'){
  g[0].fillStyle=b.far;for(i=0;i<6;i++)wrap(function(x){var h=170+r()*130;poly(g[0],[x,H*.78,x+120,H*.78-h,x+250,H*.78]);g[0].fill();g[0].fillStyle='#fff';poly(g[0],[x+120,H*.78-h,x+90,H*.78-h+40,x+120,H*.78-h+28,x+148,H*.78-h+40]);g[0].fill();g[0].fillStyle=b.far},i*180,260);
  for(i=0;i<12;i++)wrap(function(x){var h=90+r()*80;g[1].fillStyle=b.mid;for(var k=0;k<4;k++){poly(g[1],[x-34+k*4,H*.8-k*h/4,x,H*.8-k*h/4-h/2.5,x+34-k*4,H*.8-k*h/4]);g[1].fill()}g[1].fillStyle='#fff';g[1].globalAlpha=.6;poly(g[1],[x-10,H*.8-h*.7,x,H*.8-h*1.05,x+10,H*.8-h*.7]);g[1].fill();g[1].globalAlpha=1},i*90+r()*30,80);
  for(i=0;i<5;i++)wrap(function(x){g[2].fillStyle='#2d5468';var h=200+r()*70;for(var k=0;k<5;k++){poly(g[2],[x-50+k*5,H-k*h/5,x,H-k*h/5-h/3,x+50-k*5,H-k*h/5]);g[2].fill()}},i*220+r()*60,100)
 }else if(sk==='redforest'){
  for(i=0;i<9;i++)wrap(function(x){g[0].fillStyle=b.far;g[0].fillRect(x,70,26,H);ell(g[0],x+13,90,80,60);g[0].fill()},i*120+r()*40,160);
  for(i=0;i<8;i++)wrap(function(x){g[1].fillStyle=b.mid;g[1].fillRect(x,40,22,H);ell(g[1],x+11,60,70,70);g[1].fill();g[1].fillStyle=b.accent;g[1].globalAlpha=.18;ell(g[1],x+30,110,26,10);g[1].fill();g[1].globalAlpha=1},i*140+r()*50,140);
  for(i=0;i<10;i++)wrap(function(x){g[2].strokeStyle='#2a0f18';g[2].lineWidth=4;g[2].beginPath();g[2].moveTo(x,0);g[2].quadraticCurveTo(x+r()*30-15,70,x+r()*20-10,110+r()*140);g[2].stroke();g[2].fillStyle='#b83a4a';ell(g[2],x,H-6,34,18);g[2].fill()},i*105+r()*30,60)
 }else if(sk==='forest'){
  for(i=0;i<9;i++)wrap(function(x){g[0].fillStyle=b.far;g[0].fillRect(x,70,26,H);ell(g[0],x+13,90,80,60);g[0].fill()},i*120+r()*40,160);
  for(i=0;i<8;i++)wrap(function(x){g[1].fillStyle='#2a5e44';g[1].fillRect(x,40,22,H);ell(g[1],x+11,60,70,70);g[1].fill();g[1].fillStyle=b.accent;g[1].globalAlpha=.18;ell(g[1],x+30,110,26,10);g[1].fill();g[1].globalAlpha=1},i*140+r()*50,140);
  for(i=0;i<10;i++)wrap(function(x){g[2].strokeStyle='#17402d';g[2].lineWidth=4;g[2].beginPath();g[2].moveTo(x,0);g[2].quadraticCurveTo(x+r()*30-15,70,x+r()*20-10,110+r()*140);g[2].stroke();g[2].fillStyle='#3d8a58';ell(g[2],x,H-6,34,18);g[2].fill()},i*105+r()*30,60)
 }else if(sk==='underground'){
  g[0].fillStyle=b.far;for(i=0;i<9;i++)wrap(function(x){var h=60+r()*140;poly(g[0],[x,0,x+34,h,x+70,0]);g[0].fill()},i*120,70);g[0].fillRect(0,H-90,W,90);
  for(i=0;i<7;i++)wrap(function(x){var hh=120+r()*80;g[1].fillStyle='#1c3c33';g[1].fillRect(x+30,H-hh,18,hh);g[1].fillStyle=b.accent;g[1].globalAlpha=.45;g[1].beginPath();g[1].ellipse(x+39,H-hh,56,30,0,Math.PI,0);g[1].fill();g[1].globalAlpha=1;g[1].fillStyle='#e8ffd6';g[1].globalAlpha=.5;[[-20,8],[10,14],[30,6]].forEach(function(p){ell(g[1],x+39+p[0],H-hh-p[1]-8,4,3);g[1].fill()});g[1].globalAlpha=1},i*150+r()*40,110);
  for(i=0;i<8;i++)wrap(function(x){var h=40+r()*100;g[2].fillStyle='#0f2a26';poly(g[2],[x,0,x+16,h,x+30,0]);g[2].fill();g[2].fillStyle='#7ff0d0';g[2].globalAlpha=.7;poly(g[2],[x+60,H,x+70,H-50-r()*40,x+80,H]);g[2].fill();g[2].globalAlpha=1},i*130+r()*30,70)
 }else if(sk==='lava'){
  g[0].fillStyle=b.far;poly(g[0],[200,H*.8,420,150,620,H*.8]);g[0].fill();poly(g[0],[560,H*.8,760,230,960,H*.8]);g[0].fill();var gl=g[0].createRadialGradient(420,150,4,420,150,80);gl.addColorStop(0,'#ffcf7a');gl.addColorStop(1,'#ff6a3000');g[0].fillStyle=gl;g[0].fillRect(300,60,240,200);
  for(i=0;i<12;i++)wrap(function(x){var h=80+r()*150;g[1].fillStyle=b.mid;g[1].fillRect(x,H*.85-h,36,h);g[1].fillStyle='#ff8a4a';g[1].globalAlpha=.55;g[1].fillRect(x+34,H*.85-h,2,h);g[1].globalAlpha=1},i*88+r()*24,40);
  for(i=0;i<8;i++)wrap(function(x){g[2].fillStyle='#1c1015';var h=80+r()*100;poly(g[2],[x,H,x+40,H-h,x+90,H]);g[2].fill();g[2].fillStyle='#ff7a3c';g[2].globalAlpha=.5;g[2].fillRect(x+40,0,3,40+r()*80);g[2].globalAlpha=1},i*135+r()*30,100)
 }else if(sk==='night'){
  for(i=0;i<18;i++)wrap(function(x){var h=120+r()*260;g[0].fillStyle=b.far;g[0].fillRect(x,H-h,58,h);g[0].fillStyle='#ffe9a8';g[0].globalAlpha=.5;for(var yy=H-h+14;yy<H-10;yy+=22)for(var xx=x+8;xx<x+50;xx+=16)if(r()<.5)g[0].fillRect(xx,yy,8,10);g[0].globalAlpha=1},i*60,58);
  for(i=0;i<8;i++)wrap(function(x){var h=200+r()*180;g[1].fillStyle=b.mid;g[1].fillRect(x,H-h,90,h)},i*130,90)
 }else if(sk==='dawn'){
  g[0].fillStyle=b.far;for(i=0;i<6;i++)wrap(function(x){var h=140+r()*120;poly(g[0],[x,H*.8,x+150,H*.8-h,x+320,H*.8]);g[0].fill()},i*190,320);
  for(i=0;i<14;i++)wrap(function(x){var h=90+r()*170;g[1].fillStyle=b.mid;g[1].fillRect(x,H-h,52,h);g[1].fillStyle='#ffe3a8';g[1].globalAlpha=.55;for(var yy=H-h+12;yy<H-10;yy+=22)for(var xx=x+8;xx<x+44;xx+=14)if(r()<.25)g[1].fillRect(xx,yy,7,9);g[1].globalAlpha=1},i*72,52);
  for(i=0;i<5;i++)wrap(function(x){var h=60+r()*60;g[2].fillStyle=b.dark;g[2].fillRect(x,H-h,30,h);ell(g[2],x+15,H-h,30,22);g[2].fill()},i*210+40,60)
 }else if(sk==='metro'){
  /* 飞驰列车窗外：远处山丘/天际线 → 中景楼房与树林（亮着窗灯） → 近景电线杆与电线（滚动速度最快，见 drawBg） */
  g[0].fillStyle=b.far;g[0].fillRect(0,H*.72,W,H);
  for(i=0;i<8;i++)wrap(function(x){var h=80+r()*140;poly(g[0],[x,H*.72,x+110,H*.72-h,x+240,H*.72]);g[0].fill()},i*128,240);
  g[1].fillStyle=b.mid;g[1].fillRect(0,H*.82,W,H);
  for(i=0;i<14;i++)wrap(function(x){var w=36+r()*34,h=70+r()*150;g[1].fillStyle=b.mid;g[1].fillRect(x,H*.82-h,w,h);g[1].fillStyle=b.accent;g[1].globalAlpha=.55;for(var yy=H*.82-h+10;yy<H*.82-12;yy+=18)for(var xx=x+6;xx<x+w-8;xx+=14)if(r()<.4)g[1].fillRect(xx,yy,6,8);g[1].globalAlpha=1},i*74,80);
  for(i=0;i<8;i++){var px=i*128+40;g[2].fillStyle=b.dark;g[2].fillRect(px,0,8,H*.92);g[2].fillRect(px-26,60,60,6);g[2].fillRect(px-20,100,48,5);
   g[2].strokeStyle=b.dark;g[2].lineWidth=2;[62,102].forEach(function(yy){g[2].beginPath();g[2].moveTo(px+34,yy);g[2].quadraticCurveTo(px+98,yy+34,px+128-26,yy);g[2].stroke()})}
  g[2].fillStyle=b.accent;g[2].globalAlpha=.3;for(i=0;i<14;i++)g[2].fillRect(r()*W,40+r()*(H*.6),60+r()*90,2);g[2].globalAlpha=1
 }else{
  for(i=0;i<6;i++)wrap(function(x){g[0].strokeStyle=b.far;g[0].lineWidth=26;g[0].beginPath();g[0].ellipse(x,H*.7,100,H*.5,0,Math.PI,0);g[0].stroke()},i*180,10);
  for(i=0;i<5;i++)wrap(function(x){g[1].fillStyle=b.mid;g[1].fillRect(x,0,26,H);g[1].fillStyle=b.accent;g[1].globalAlpha=.55;g[1].fillRect(x+10,60,6,H-120);g[1].globalAlpha=1},i*210,26)
 }
 return cache['b'+key]=L}
function drawBg(g,key,W,H,camX,camY,sc,time){
 if(!(W>0&&H>0&&sc>0))return;
 var b=B(key),sk=b.custom?b.base:key,gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,b.sky[0]);gr.addColorStop(1,b.sky[1]);g.fillStyle=gr;g.fillRect(0,0,W,H);
 var L=bgLayers(key),f=[.12,.28,.55],ds=H/576,w=Math.max(64,1024*ds),i;
 if(sk==='lava'||sk==='night'||sk==='station'){glow(g,W*.5,H*.85,H*.8,b.glow,.22+Math.sin(time*1.5)*.04)}
 if(sk==='dawn'){var sx=W*.7,sy=H*.6,sr=H*.15;glow(g,sx,sy,H*1.1,b.glow,.5+Math.sin(time*.8)*.04);glow(g,sx,sy,sr*2.4,'#fff0b0',.55);var sg=g.createRadialGradient(sx,sy,0,sx,sy,sr);sg.addColorStop(0,'#fffbe0');sg.addColorStop(.7,'#ffe28a');sg.addColorStop(1,'#ffb347');g.fillStyle=sg;g.beginPath();g.arc(sx,sy,sr,0,Math.PI*2);g.fill()}
 /* 背景撕裂的两个原因都在这里处理：① 图块宽/偏移是小数，相邻块之间会漏出细缝 → 全部取整；② 许多主题的中景图块左右边缘轮廓对不上（山脊/楼房在每个图块交界处出现断层）→ 相邻图块交替左右镜像，边缘永远严丝合缝。半透明的最前层不重叠，避免叠出深线 */
 var wi=Math.max(64,Math.round(w));
 for(i=0;i<3;i++){var sc0=Math.round(camX*sc*f[i]+(sk==='metro'?time*ds*[14,60,240][i]:0)),q=Math.floor(sc0/wi),off=-(sc0-q*wi),oy=Math.round(i===2?(-camY*sc*.12):(-camY*sc*f[i]*.5)+(i===0?-8:0)),ov=i===2?0:1;g.globalAlpha=i===2?.92:1;
  for(var x=off,j=0;x<W;x+=wi,j++){if(((q+j)%2+2)%2===0)g.drawImage(L[i],x,oy,wi+ov,H);else{g.save();g.translate(x+wi+ov,oy);g.scale(-1,1);g.drawImage(L[i],0,0,wi+ov,H);g.restore()}}}
 g.globalAlpha=1;
 if(sk==='metro'){ /* 白色车厢内壁（随关卡世界坐标滚动）：只在车窗处露出窗外的风景 */
  var T=32,s=sc,wy0=(4*T-camY)*s,wy1=(18*T-camY)*s,per=9*T,k0=Math.floor(camX/per)-1,k,wx,ww=5*T*s,wt=(6*T-camY)*s,wh=4*T*s;
  g.fillStyle='#eef2f4';g.beginPath();g.rect(0,wy0,W,wy1-wy0);
  for(k=k0;k<=k0+Math.ceil(W/(per*s))+2;k++){wx=(k*per+2*T-camX)*s;g.moveTo(wx,wt);g.lineTo(wx,wt+wh);g.lineTo(wx+ww,wt+wh);g.lineTo(wx+ww,wt)}
  g.fill('evenodd');
  g.fillStyle='#d3dbe0';g.fillRect(0,(12*T-camY)*s+wh*0,W,wy1-(12*T-camY)*s);   /* 下半截裙板 */
  g.fillStyle='#3b8bd6';g.fillRect(0,(12*T-camY)*s,W,5*s);                      /* 装饰腰线 */
  g.strokeStyle='#9aa7b0';g.lineWidth=3*s;
  for(k=k0;k<=k0+Math.ceil(W/(per*s))+2;k++){wx=(k*per+2*T-camX)*s;g.strokeRect(wx,wt,ww,wh);g.fillStyle='rgba(255,255,255,.18)';g.beginPath();g.moveTo(wx+8*s,wt+wh);g.lineTo(wx+ww*.4,wt);g.lineTo(wx+ww*.55,wt);g.lineTo(wx+8*s+ww*.15,wt+wh);g.fill()}   /* 窗框 + 玻璃反光 */
 }}

/* ---------- 主角：教师骨骼动画 ---------- */
/* 时装系统：身体 4 套（2 男 2 女）+ 头贴图 2 张（郑脸 zyj.png / 胡脸 hq.png）。
   服装由 window.L15.FASHION 提供；未注入时用默认那套（原来的白衬衫红领结）。 */
var FACES=[{id:'zyj',n:'郑脸',src:'assets/zyj.png'},{id:'hq',n:'胡脸',src:'assets/hq.png'}];
var faceImgs=FACES.map(function(f){var im=new Image();im.onload=function(){im._ok=true};im.src=f.src;return im});
var faceImg=faceImgs[0]; /* 兼容旧引用：指向当前选中的那张 */
var OUTFITS=[
 {id:'m1',n:'白衬衫',g:'男',top:'#f3f6f8',coat:'',pants:'#2a3a52',shoe:'#161c26',scarf:null,skirt:0,hair:'#2b2118',tie:'#d6363f',bag:'#8b5e3c',skin:'#ffd9b0',long:0},
 {id:'m2',n:'藏青西装',g:'男',top:'#2b3f63',coat:'#1d2c48',pants:'#1b2438',shoe:'#12161f',scarf:'#d9a441',skirt:0,hair:'#1d1710',tie:'#8fb4d8',bag:'#5a4632',skin:'#ffd9b0',long:0},
 {id:'f1',n:'米色风衣',g:'女',top:'#e6dcc4',coat:'',pants:'#6b5844',shoe:'#3a2f26',scarf:'#c96a5e',skirt:1,hair:'#3b2a1c',tie:'',bag:'#a8764e',skin:'#ffd9b0',long:1},
 {id:'f2',n:'藏青连衣裙',g:'女',top:'#33456b',coat:'',pants:'#33456b',shoe:'#1d2233',scarf:'#f0d27a',skirt:2,hair:'#241a12',tie:'',bag:'#4c5f88',skin:'#ffd9b0',long:1}
];
var curFit={outfit:0,face:0};
function setFashion(o,f){curFit.outfit=Math.max(0,Math.min(OUTFITS.length-1,o|0));curFit.face=Math.max(0,Math.min(FACES.length-1,f|0));faceImg=faceImgs[curFit.face]}
function limb(g,x0,y0,x1,y1,w,col){g.strokeStyle=col;g.lineWidth=w;g.lineCap='round';g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.stroke()}
/* p:{face,vx,vy,ground,anim,state,dash,atk,hurt,sx,sy} 原点=脚底中心 */
function hero(g,p,time,accent,alpha){
 var st=p.state,run=Math.min(1,Math.abs(p.vx)/200)*(p.ground?1:0),ph=p.anim*13,bob=st==='idle'?Math.sin(time*2.4)*1:0,sx=p.sx||1,sy=p.sy||1;
 var F=OUTFITS[curFit.outfit]||OUTFITS[0],FIM=faceImgs[curFit.face];
 g.save();g.globalAlpha=alpha==null?1:alpha;g.translate(p.cx,p.cy);g.scale(p.face*sx,sy);
 var lean=st==='dash'?.28:st==='hurt'?-.25:run*.08+(p.vy<-100?-.05:p.vy>300?.06:0);g.rotate(lean);
 var sw=Math.sin(ph)*run,lift=p.ground?0:(p.vy<0?6:3);
 // 围巾 / 长发
 if(F.scarf){g.strokeStyle=F.scarf;g.lineWidth=3.2;g.lineCap='round';g.globalAlpha*=.9;g.beginPath();g.moveTo(-4,-20+bob);g.quadraticCurveTo(-16-run*8,-18+Math.sin(time*9)*4,-22-run*10-(st==='dash'?10:0),-14+Math.sin(time*7+1)*6);g.stroke();g.globalAlpha=alpha==null?1:alpha}
 // 背包
 g.fillStyle=F.bag;g.beginPath();g.roundRect(-13,-18+bob,8,14,3);g.fill();g.fillStyle='rgba(0,0,0,.22)';g.fillRect(-13,-10+bob,8,2);
 // 后腿、后臂
 var legY=-8,la=sw*7,lb=-sw*7;
 limb(g,-2,legY,-2+lb*(p.ground?1:.2)-(p.ground?0:3),0-lift*(st==='climb'?0:1)+(p.ground?0:-4),4.2,F.pants);limb(g,-2+lb*(p.ground?1:.2)-(p.ground?0:3)-.5,0-lift,-2+lb*(p.ground?1:.2)+3-(p.ground?0:3),0-lift,4.4,F.shoe);
 limb(g,-1,-17+bob,-3-sw*6,-9+bob+(st==='climb'?-8:0),3.4,F.top);
 // 躯干
 g.fillStyle=F.top;g.beginPath();g.roundRect(-7,-21+bob,14,15,4);g.fill();
 if(F.tie){g.fillStyle=F.tie;g.beginPath();g.moveTo(0,-20+bob);g.lineTo(2.5,-16+bob);g.lineTo(0,-8+bob);g.lineTo(-2.5,-16+bob);g.closePath();g.fill()}
 if(F.coat){g.fillStyle=F.coat;g.beginPath();g.moveTo(-7,-21+bob);g.lineTo(-4.5,-21+bob);g.lineTo(-2.5,-6+bob);g.lineTo(-7,-6+bob);g.closePath();g.fill();g.moveTo(7,-21+bob);g.lineTo(4.5,-21+bob);g.lineTo(2.5,-6+bob);g.lineTo(7,-6+bob);g.closePath();g.fill()}
 // 裙子 / 裤裙（女套）
 if(F.skirt===1){g.fillStyle=F.pants;g.beginPath();g.moveTo(-7,-9+bob);g.lineTo(7,-9+bob);g.lineTo(9.5,-2+bob);g.lineTo(-9.5,-2+bob);g.closePath();g.fill()}
 else if(F.skirt===2){g.fillStyle=F.pants;g.beginPath();g.moveTo(-7,-9+bob);g.lineTo(7,-9+bob);g.lineTo(6,-1+bob);g.lineTo(-6,-1+bob);g.closePath();g.fill()}
 else{g.fillStyle=F.pants;g.fillRect(-7,-9+bob,14,5)}
 // 前腿
 limb(g,2,legY,2+la*(p.ground?1:.3)+(p.ground?0:4),0-lift,4.4,F.pants);limb(g,2+la*(p.ground?1:.3)+(p.ground?0:4)-.5,0-lift,2+la*(p.ground?1:.3)+6+(p.ground?0:4),0-lift,4.6,F.shoe);
 // 前臂+教鞭
 var ar=st==='attack'?-.2+(1-Math.min(1,p.atk/.22))*1.7:(st==='climb'?-1.3:-.9+sw*.5);
 g.save();g.translate(3,-18+bob);g.rotate(st==='attack'?ar-1:ar*.6);limb(g,0,0,9,2,3.4,F.top);g.fillStyle=F.skin;ell(g,10,2,2.4,2.4);g.fill();
 g.strokeStyle='#d0a45a';g.lineWidth=2.2;g.beginPath();g.moveTo(10,2);g.lineTo(st==='attack'?30:20,st==='attack'?-2:-6);g.stroke();g.restore();
 // 长发（女套）：画在头后面
 if(F.long){g.fillStyle=F.hair;g.beginPath();g.moveTo(-11,-32+bob);g.quadraticCurveTo(-13,-20+bob,-9,-14+bob);g.lineTo(-5,-16+bob);g.quadraticCurveTo(-8,-24+bob,-7,-32+bob);g.closePath();g.fill();g.beginPath();g.moveTo(11,-32+bob);g.quadraticCurveTo(13,-20+bob,9,-14+bob);g.lineTo(5,-16+bob);g.quadraticCurveTo(8,-24+bob,7,-32+bob);g.closePath();g.fill()}
 // 头（可切换贴图：郑脸 zyj.png / 胡脸 hq.png）
 g.save();g.translate(0,-30+bob);g.rotate(st==='hurt'?-.35:run*sw*.05);
 g.fillStyle='#fff';ell(g,0,0,13.2,13.2);g.fill();g.save();ell(g,0,0,12,12);g.clip();
 if(FIM&&FIM._ok)g.drawImage(FIM,-12,-12,24,24);else{g.fillStyle=F.skin;g.fillRect(-12,-12,24,24);g.fillStyle='#222';g.fillRect(-5,-3,2,3);g.fillRect(3,-3,2,3)}g.restore();
 g.strokeStyle='#223';g.globalAlpha*=.5;g.lineWidth=1;ell(g,0,0,12.6,12.6);g.stroke();g.restore();
 g.restore()}

/* ---------- NPC ---------- */
function npc(g,kind,x,y,w,h,time,face){
 var cx=x+w/2,fy=y+h,bob=Math.sin(time*2+x)*1.2;g.save();g.translate(cx,fy);g.scale(face||1,1);
 function person(body,hat,skin,small){var s=small?.82:1;g.scale(s,s);g.fillStyle='#232f42';g.fillRect(-6,-10,5,10);g.fillRect(1,-10,5,10);g.fillStyle=body;g.beginPath();g.roundRect(-8,-26+bob,16,18,5);g.fill();g.fillStyle=skin||'#ffd9b0';ell(g,0,-33+bob,8,8);g.fill();g.fillStyle='#222';g.fillRect(-4,-35+bob,2,3);g.fillRect(2,-35+bob,2,3);if(hat){g.fillStyle=hat;g.beginPath();g.roundRect(-9,-43+bob,18,6,3);g.fill()}}
 if(kind==='worker'){person('#f09a30','#ffd34d');g.fillStyle='#fff7c2';g.fillRect(-8,-18+bob,16,3)}
 else if(kind==='child'){person('#4aa3d8','#e24a5a',null,true);g.fillStyle='#e24a5a';g.fillRect(-8,-27+bob,16,3)}
 else if(kind==='ranger'){person('#4f7d4b','#7a5230');g.fillStyle='#8a6a40';g.fillRect(-8,-20+bob,16,3)}
 else if(kind==='traveler'){person('#9a77c8','#d8b86a');g.fillStyle='#b8793a';g.beginPath();g.roundRect(-14,-26+bob,8,14,3);g.fill()}
 else if(kind==='stationmaster'){person('#2d4a78','#d63a43');g.fillStyle='#f6d36a';g.fillRect(-1,-24+bob,2,10)}
 else if(kind==='squirrel'){g.fillStyle='#c98a52';g.beginPath();g.moveTo(-6,-4);g.quadraticCurveTo(-26,-24+bob,-8,-38+bob);g.quadraticCurveTo(-14,-20,-4,-14);g.fill();ell(g,0,-14+bob,9,11);g.fill();ell(g,4,-28+bob,7,7);g.fill();g.fillStyle='#e9c79b';ell(g,3,-10+bob,5,6);g.fill();g.fillStyle='#222';g.fillRect(6,-30+bob,2,3);g.fillStyle='#c98a52';poly(g,[0,-33+bob,3,-41+bob,6,-33+bob]);g.fill()}
 else if(kind==='robot'){g.fillStyle='#6f8fc0';g.beginPath();g.roundRect(-9,-24+bob,18,20,4);g.fill();g.fillStyle='#8fb0e0';g.beginPath();g.roundRect(-8,-37+bob,16,12,4);g.fill();g.fillStyle='#7dffe8';g.fillRect(-5,-33+bob,3,4);g.fillRect(2,-33+bob,3,4);g.fillStyle='#456';g.fillRect(-7,-4,4,4);g.fillRect(3,-4,4,4);g.strokeStyle='#8fb0e0';g.lineWidth=2;g.beginPath();g.moveTo(0,-37+bob);g.lineTo(0,-43+bob);g.stroke();g.fillStyle='#ff6b6b';ell(g,0,-44+bob,2,2);g.fill()}
 else if(kind==='hologram'){g.globalAlpha=.65+Math.sin(time*6)*.12;person('#b79cff',null,'#e5d8ff');g.globalAlpha=.25;g.fillStyle='#d9c8ff';g.fillRect(-12,-46,24,46);for(var i=0;i<6;i++)g.fillRect(-12,-46+i*8+((time*20)%8),24,1);g.globalAlpha=1}
 else if(kind==='student'){person('#7fb4e8','#2a3a5a',null,true);g.fillStyle='#fff';g.fillRect(-8,-19+bob,16,2.5);g.fillStyle='#d6363f';g.fillRect(-1.5,-19+bob,3,9);g.fillStyle='#e0a040';g.beginPath();g.roundRect(-14,-26+bob,7,12,3);g.fill()}
 else if(kind==='driver'){person('#2f6fb8','#1f3f6e');g.fillStyle='#f6d36a';g.fillRect(-8,-22+bob,16,2);g.fillRect(-1.5,-26+bob,3,3);g.fillStyle='#fff';ell(g,-9,-14+bob,3,3);g.fill()}
 else if(kind==='cat'){g.strokeStyle='#e0b070';g.lineWidth=3.4;g.lineCap='round';g.beginPath();g.moveTo(-8,-5);g.quadraticCurveTo(-20,-6,-17,-18+Math.sin(time*2.2)*3);g.stroke();g.fillStyle='#e0b070';ell(g,-1,-8+bob*.5,10,8);g.fill();ell(g,7,-16+bob*.5,6.5,6);g.fill();poly(g,[2,-20+bob*.5,4,-27+bob*.5,8,-21+bob*.5]);g.fill();poly(g,[8,-21+bob*.5,12,-27+bob*.5,13,-19+bob*.5]);g.fill();g.fillStyle='#b8823a';g.fillRect(-6,-14+bob*.5,2.4,6);g.fillRect(-1,-15+bob*.5,2.4,7);g.fillStyle='#fff';ell(g,9,-4,3,2);g.fill();ell(g,-4,-1.5,3,2);g.fill();g.fillStyle='#222';ell(g,9,-17+bob*.5,1.3,1.8);g.fill();ell(g,12,-16+bob*.5,1.3,1.8);g.fill();g.fillStyle='#f08a8a';ell(g,13.5,-14.5+bob*.5,1,.8);g.fill()}
 else person('#8b9da8','#445');
 g.restore()}

window.GFX={fx:fx,T:T,mk:mk,prng:prng,ell:ell,poly:poly,glow:glow,B:B,tiles:tiles,drawTile:drawTile,drawBg:drawBg,hero:hero,npc:npc,limb:limb,cache:cache,faceImg:faceImg,faceImgs:faceImgs,OUTFITS:OUTFITS,FACES:FACES,setFashion:setFashion,get fashion(){return {outfit:curFit.outfit,face:curFit.face}},flushTheme:function(key){delete cache['t'+key];delete cache['b'+key]}};
})();
