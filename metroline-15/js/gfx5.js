/* 画面（五）：DLC「雪镇跨年」的物件、怪物、Boss「零点钟魔」、NPC，以及报幕环节的剧情动画（幕布拉开 / 雪镇夜景 / 报幕中 / 钟楼 / 钟魔登场 / 跨年烟花）。 */
(function(){
var G=window.GFX,ell=G.ell,poly=G.poly,glow=G.glow;
var PAL=['#ff6a8a','#ffd23f','#6dffb0','#6dd5ff','#c9a0ff','#ff9a3a'];
function hash(n){var s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s)}
function pal(i){return PAL[Math.abs(Math.floor(i))%PAL.length]}
function rr(g,x,y,w,h,r){g.beginPath();g.roundRect(x,y,w,h,r)}

/* ==================== 物件 ==================== */
var X={
 /* 礼物：包着彩带的盒子，轻轻晃动 */
 gift:function(g,o,t){if(o.got)return;var x=o.x,y=o.y,w=o.w,h=o.h,c=pal(x/32+y/32),bob=Math.sin(t*2.6+x*.1)*3;
  g.translate(x+w/2,y+h/2+bob);g.rotate(Math.sin(t*2+x)*.1);
  g.fillStyle=c;rr(g,-11,-6,22,17,3);g.fill();g.fillStyle='rgba(255,255,255,.28)';g.fillRect(-11,-6,22,4);
  g.fillStyle='#fff6d8';g.fillRect(-2.5,-6,5,17);g.fillRect(-11,1,22,4);
  g.strokeStyle='#fff6d8';g.lineWidth=3;g.beginPath();g.moveTo(0,-6);g.bezierCurveTo(-12,-18,-14,-4,0,-6);g.bezierCurveTo(12,-18,14,-4,0,-6);g.stroke();
  glow(g,0,0,34,c,.5);var s=(t*3+x)%6.28;g.fillStyle='#fff';g.fillRect(12+Math.cos(s)*2,-12,2,6);g.fillRect(10+Math.cos(s)*2,-10,6,2)},
 cake:function(g,o,t){if(o.got)return;var x=o.x,y=o.y,w=o.w,h=o.h;g.translate(x+w/2,y+h/2+Math.sin(t*2.4+x)*2);
  g.fillStyle='#fff';poly(g,[-13,10,13,10,13,-2,-13,-2]);g.fill();g.fillStyle='#ff9ac0';g.fillRect(-13,3,26,4);g.fillStyle='#fff3f8';
  for(var i=0;i<5;i++){ell(g,-10+i*5,-2,3.2,3.6);g.fill()}
  g.fillStyle='#e0334a';ell(g,0,-6,3.4,3.4);g.fill();g.fillStyle='#6b3a2a';g.fillRect(-1,-17,2,9);
  var fl=1+Math.sin(t*14)*.18;g.fillStyle='#ffd23f';g.beginPath();g.ellipse(0,-20,2.6*fl,5*fl,0,0,6.283);g.fill();glow(g,0,-18,34,'#ffd23f',.6)},
 sparkler:function(g,o,t){if(o.got)return;var x=o.x,y=o.y,w=o.w,h=o.h;g.translate(x+w/2,y+h/2);g.rotate(-.35+Math.sin(t*2)*.05);
  g.fillStyle='#8a97a3';g.fillRect(-1.5,-4,3,18);g.fillStyle='#d7dde2';g.fillRect(-1.5,-14,3,10);
  g.strokeStyle='#fff6a0';g.lineWidth=1.6;for(var i=0;i<9;i++){var a=i*.7+t*9,l=7+hash(i+Math.floor(t*14))*9;g.beginPath();g.moveTo(0,-15);g.lineTo(Math.cos(a)*l,-15+Math.sin(a)*l);g.stroke()}
  glow(g,0,-15,44,'#ffe27a',.75)},
 candy:function(g,o,t){if(o.got)return;var x=o.x,y=o.y,w=o.w,h=o.h;g.translate(x+w/2,y+h/2+Math.sin(t*2.2+x)*2);
  g.fillStyle='#e8dcc8';g.fillRect(-1.2,2,2.4,13);g.fillStyle='#fff';ell(g,0,-3,10,10);g.fill();g.strokeStyle='#ff4a6a';g.lineWidth=3;
  g.beginPath();for(var a=0;a<9;a+=.25){var r=a*1.05;g.lineTo(Math.cos(a+t*.0)*r,-3+Math.sin(a)*r)}g.stroke();glow(g,0,-3,28,'#ff6a8a',.35)},
 /* 礼花筒：踩上去“嘭”一声，把你弹上天 */
 popper:function(g,o,t){var x=o.x,y=o.y,w=o.w,fire=o.fire||0;
  g.fillStyle='#3a4658';rr(g,x+2,y+10,w-4,22,4);g.fill();
  g.save();g.translate(x+w/2,y+14);g.fillStyle='#ff6a8a';poly(g,[-14,6,14,6,8,-16,-8,-16]);g.fill();g.fillStyle='#ffd23f';for(var i=0;i<3;i++)poly(g,[-12+i*9,4,-8+i*9,4,-6+i*5,-12,-9+i*5,-12]),g.fill();
  g.fillStyle='#fff';ell(g,0,-16,9,3);g.fill();g.restore();
  if(fire>0){for(var k=0;k<22;k++){var a=-Math.PI/2+(hash(k)-.5)*1.6,d=(1-fire/.45)*(70+hash(k+9)*80);g.fillStyle=pal(k);g.globalAlpha=Math.min(1,fire*3);g.fillRect(x+w/2+Math.cos(a)*d,y-6+Math.sin(a)*d+d*d*.004,5,3)}g.globalAlpha=1}
  else{g.fillStyle='rgba(255,255,255,.55)';g.font='bold 11px sans-serif';g.textAlign='center';g.fillText('踩',x+w/2,y+28)}},
 /* 彩灯串：一串会发光的灯泡，在天花板下荡秋千 */
 lightstring:function(g,o,t){var a=o.ang!=null?o.ang:0,len=o.h,ax=o.x0!=null?o.x0+16:o.x+16,ay=o.y0!=null?o.y0:o.y;
  g.fillStyle='#6a7a8a';g.fillRect(ax-10,ay-5,20,8);
  var bx=ax+Math.sin(a)*len,by=ay+Math.cos(a)*len;g.strokeStyle='#2a3340';g.lineWidth=2.5;g.beginPath();g.moveTo(ax,ay+3);g.lineTo(bx,by);g.stroke();
  for(var i=0;i<=5;i++){var rr2=len*(.18+i*.165),px=ax+Math.sin(a)*rr2,py=ay+Math.cos(a)*rr2,on=(Math.floor(t*4)+i)%2,c=pal(i);
   g.fillStyle=on?c:'#3a4658';ell(g,px,py,i>=1&&i<=4?8:5,i>=1&&i<=4?8:5);g.fill();if(i>=1&&i<=4){glow(g,px,py,34,c,on?.6:.15);g.fillStyle='rgba(255,255,255,.55)';ell(g,px-2,py-2,2.4,2.4);g.fill()}}},
 /* 礼炮阵：一排礼炮，火花沿着引线一路点过去，一个接一个炸 */
 salute:function(g,o,t){var x=o.x,y=o.y+o.h,w=o.w,n=o.n||Math.max(2,Math.floor(w/22)),f=o.f!=null?o.f:0,per=o.p.period||4;
  g.strokeStyle='#8a6a4a';g.lineWidth=2;g.beginPath();g.moveTo(x,y-4);g.lineTo(x+w,y-4);g.stroke();
  for(var j=0;j<n;j++){var cx=x+(j+.5)*w/n,fu=(cx-x)/w,since=(f-(.22+fu*.5))*per,live=since>=0&&since<.38,spent=since>=.38||since<0&&f>.75;
   g.fillStyle=live?'#fff':'#3a4658';rr(g,cx-8,y-22,16,20,3);g.fill();g.fillStyle=pal(j);g.fillRect(cx-8,y-14,16,5);
   if(live){var k=since/.38;g.globalAlpha=1-k;for(var s=0;s<12;s++){var a=-Math.PI/2+(hash(s+j*7)-.5)*1.5,d=k*(40+hash(s+3)*30);g.fillStyle=pal(s+j);g.fillRect(cx+Math.cos(a)*d-2,y-30+Math.sin(a)*d,4,6)}
    g.fillStyle='rgba(255,230,140,'+(1-k)+')';poly(g,[cx-12,y-24,cx+12,y-24,cx+7,y-72,cx-7,y-72]);g.fill();g.globalAlpha=1;glow(g,cx,y-40,60,'#ffd23f',.6*(1-k))}}
  if(o.u>0&&o.u<1){var sx=x+o.u*w;g.fillStyle='#fff6a0';ell(g,sx,y-5,4,4);g.fill();glow(g,sx,y-5,26,'#ffd23f',.8)}
  else if(o.u<=0){g.fillStyle='rgba(255,255,255,.5)';g.font='bold 10px sans-serif';g.textAlign='left';g.fillText('礼炮',x,y-26)}},
 /* 气球串：一串气球排成长龙，贴着地面飘过去 */
 balloonrow:function(g,o,t){var s=o.segs;if(!s)return;
  g.strokeStyle='rgba(255,255,255,.7)';g.lineWidth=1.5;g.beginPath();s.forEach(function(q,i){g[i?'lineTo':'moveTo'](q.x,q.y+q.r)});g.stroke();
  for(var i=s.length-1;i>=0;i--){var q=s[i],c=pal(i);g.strokeStyle='rgba(255,255,255,.4)';g.beginPath();g.moveTo(q.x,q.y+q.r);g.lineTo(q.x+Math.sin(t*3+i)*3,q.y+q.r+16);g.stroke();
   g.fillStyle=c;ell(g,q.x,q.y,q.r*.9,q.r);g.fill();g.fillStyle='rgba(255,255,255,.5)';ell(g,q.x-q.r*.3,q.y-q.r*.4,q.r*.2,q.r*.32);g.fill()}
  var h=s[0];if(h){g.fillStyle='#10202e';ell(g,h.x+(o.sgn||1)*7,h.y-3,3,3.4);g.fill();ell(g,h.x+(o.sgn||1)*-1,h.y-3,3,3.4);g.fill();g.strokeStyle='#10202e';g.lineWidth=2;g.beginPath();g.arc(h.x+(o.sgn||1)*3,h.y+4,5,.2,2.9);g.stroke()}},
 /* 彩带门：两幅彩带帘从两边合拢，合上就是一堵墙 */
 ribbongate:function(g,o,t){var open=o.open==null?.5:o.open,x=o.x,y=o.y,w=o.w,h=o.h,lw=(1-open)*w/2+3,warn=o.warn||o.st==='closing';
  g.fillStyle='#8a5a3a';g.fillRect(x-4,y,6,h);g.fillRect(x+w-2,y,6,h);g.fillRect(x-4,y,w+8,8);
  g.fillStyle=warn&&Math.sin(t*26)>0?'#ff4a6a':'#ffd23f';for(var i=0;i<w/16;i++){ell(g,x+8+i*16,y+14,5,5);g.fill()}
  [[x,lw,1],[x+w-lw,lw,-1]].forEach(function(l){for(var i=0;i<l[1];i+=7){var c=pal(i/7),sw=Math.sin(t*3+i)*2;g.fillStyle=c;g.fillRect(l[0]+i,y+22,6,h-22+sw)}
   g.fillStyle='rgba(255,255,255,.35)';g.fillRect(l[0],y+22,l[1],3)})},
 /* ---------- 背景装饰 ---------- */
 balloons:function(g,o,t){var bx=o.x+o.w/2,by=o.y+o.h;g.strokeStyle='rgba(255,255,255,.6)';g.lineWidth=1.4;
  for(var i=0;i<4;i++){var a=-.5+i*.33+Math.sin(t*1.2+i)*.05,l=o.h*(.7+hash(i+o.x)*.3),px=bx+Math.sin(a)*l,py=by-Math.cos(a)*l;g.beginPath();g.moveTo(bx,by);g.lineTo(px,py+14);g.stroke();
   g.fillStyle=pal(i+o.x/32);ell(g,px,py,13,16);g.fill();g.fillStyle='rgba(255,255,255,.45)';ell(g,px-4,py-5,3,5);g.fill();g.fillStyle=g.fillStyle;poly(g,[px-3,py+15,px+3,py+15,px,py+19]);g.fillStyle=pal(i+o.x/32);g.fill()}},
 bunting:function(g,o,t){var x=o.x,y=o.y,w=o.w,n=Math.floor(w/22);g.strokeStyle='#5a4a3a';g.lineWidth=2;g.beginPath();
  for(var i=0;i<=n;i++){var u=i/n,px=x+u*w,py=y+4+Math.sin(u*3.14159)*14;g[i?'lineTo':'moveTo'](px,py)}g.stroke();
  for(var j=0;j<n;j++){var u2=(j+.5)/n,fx=x+u2*w,fy=y+4+Math.sin(u2*3.14159)*14;g.fillStyle=pal(j);poly(g,[fx-8,fy,fx+8,fy,fx,fy+17+Math.sin(t*3+j)*1.5]);g.fill()}},
 firetower:function(g,o,t){var x=o.x,y=o.y,w=o.w,h=o.h;g.fillStyle='#6a4a30';g.fillRect(x+4,y+h*.35,6,h*.65);g.fillRect(x+w-10,y+h*.35,6,h*.65);g.fillRect(x,y+h*.55,w,6);g.fillRect(x,y+h*.8,w,6);
  for(var i=0;i<3;i++){var cx=x+w*(.2+i*.3);g.fillStyle=pal(i*2);rr(g,cx-6,y+h*.12,12,h*.5,3);g.fill();g.fillStyle='#fff';g.fillRect(cx-6,y+h*.3,12,4);poly(g,[cx-6,y+h*.12,cx+6,y+h*.12,cx,y]);g.fillStyle='#ffd23f';g.fill()}
  if(Math.sin(t*1.3+x)>.93){glow(g,x+w/2,y-8,40,'#ffd23f',.9)}},
 clocktower:function(g,o,t){var x=o.x,y=o.y,w=o.w,h=o.h,cx=x+w/2;
  g.fillStyle='#5a6a88';g.fillRect(x+w*.14,y+h*.22,w*.72,h*.78);g.fillStyle='#4a5a78';g.fillRect(x+w*.14,y+h*.22,w*.14,h*.78);
  g.fillStyle='#394862';poly(g,[x+w*.08,y+h*.24,x+w*.92,y+h*.24,cx,y]);g.fill();g.fillStyle='#eef6fb';poly(g,[x+w*.08,y+h*.24,x+w*.3,y+h*.24,cx-w*.05,y+h*.06,cx,y]);g.fill();
  var cy=y+h*.38,r=w*.3;g.fillStyle='#f4efdc';ell(g,cx,cy,r,r);g.fill();g.strokeStyle='#c9a23a';g.lineWidth=5;ell(g,cx,cy,r,r);g.stroke();
  g.fillStyle='#394862';for(var i=0;i<12;i++){var a=i*Math.PI/6;g.fillRect(cx+Math.sin(a)*r*.82-1.5,cy-Math.cos(a)*r*.82-1.5,3,3)}
  var mn=(t*.5)%60,mA=mn/60*6.283,hA=(11+59/60)/12*6.283;g.strokeStyle='#22303f';g.lineWidth=4;g.lineCap='round';g.beginPath();g.moveTo(cx,cy);g.lineTo(cx+Math.sin(hA)*r*.5,cy-Math.cos(hA)*r*.5);g.stroke();g.lineWidth=2.5;g.beginPath();g.moveTo(cx,cy);g.lineTo(cx+Math.sin(5.9+Math.sin(t*.5)*.02)*r*.78,cy-Math.cos(5.9)*r*.78);g.stroke();
  g.fillStyle='#ffd27a';for(var k=0;k<4;k++){rr(g,x+w*.3+k*w*.12,y+h*.62,w*.07,h*.1,3);g.fill()}
  g.fillStyle='#2a3348';g.beginPath();g.arc(cx,y+h*.2,w*.1,Math.PI,0);g.fill();glow(g,cx,cy,r*1.6,'#ffe9a8',.3)},
 snowhouse:function(g,o,t){var x=o.x,y=o.y,w=o.w,h=o.h,c=['#c98a6a','#8aa0c8','#d9a0a0','#9ac8a8'][Math.floor(hash(x)*4)];
  g.fillStyle=c;g.fillRect(x+w*.08,y+h*.42,w*.84,h*.58);g.fillStyle='rgba(0,0,0,.18)';g.fillRect(x+w*.08,y+h*.42,w*.14,h*.58);
  g.fillStyle='#4a3a42';poly(g,[x,y+h*.46,x+w,y+h*.46,x+w*.5,y+h*.06]);g.fill();g.fillStyle='#f4fbff';poly(g,[x-2,y+h*.48,x+w+2,y+h*.48,x+w*.5,y+h*.04,x+w*.5,y+h*.14]);g.fill();
  g.fillStyle='#4a3a42';poly(g,[x+w*.12,y+h*.5,x+w*.88,y+h*.5,x+w*.5,y+h*.18]);g.fill();g.fillStyle='#f4fbff';poly(g,[x+w*.12,y+h*.5,x+w*.3,y+h*.5,x+w*.5,y+h*.18]);g.fill();
  var on=Math.sin(t*.7+x)>-.8;g.fillStyle=on?'#ffd98a':'#3a4658';g.fillRect(x+w*.2,y+h*.58,w*.2,h*.2);g.fillRect(x+w*.6,y+h*.58,w*.2,h*.2);if(on){glow(g,x+w*.3,y+h*.68,40,'#ffd98a',.4);glow(g,x+w*.7,y+h*.68,40,'#ffd98a',.4)}
  g.fillStyle='#6a4a30';rr(g,x+w*.44,y+h*.7,w*.14,h*.3,3);g.fill();g.fillStyle='#6a5a6a';g.fillRect(x+w*.68,y+h*.08,w*.1,h*.2)},
 partytree:function(g,o,t){var x=o.x,y=o.y,w=o.w,h=o.h,cx=x+w/2;g.fillStyle='#5a3a24';g.fillRect(cx-4,y+h*.82,8,h*.18);
  for(var i=0;i<4;i++){var ty=y+h*(.1+i*.2),hw=w*(.22+i*.12);g.fillStyle='#2f7a52';poly(g,[cx-hw,ty+h*.26,cx+hw,ty+h*.26,cx,ty]);g.fill();g.fillStyle='#f4fbff';poly(g,[cx-hw,ty+h*.26,cx-hw*.35,ty+h*.26,cx,ty+h*.12,cx,ty]);g.fill()}
  for(var j=0;j<14;j++){var by=y+h*(.18+hash(j)*.6),bw=(by-y)/h*w*.34+8,bx=cx+(hash(j+5)-.5)*bw*1.5,on=(Math.floor(t*3)+j)%2;g.fillStyle=on?pal(j):'#3a4658';ell(g,bx,by,3.6,3.6);g.fill();if(on)glow(g,bx,by,16,pal(j),.55)}
  g.fillStyle='#ffd23f';poly(g,[cx,y-6,cx+5,y+6,cx+12,y+6,cx+7,y+12,cx+9,y+20,cx,y+14,cx-9,y+20,cx-7,y+12,cx-12,y+6,cx-5,y+6]);g.fill();glow(g,cx,y+6,34,'#ffd23f',.7)},
 stagebanner:function(g,o,t){var x=o.x,y=o.y,w=o.w,h=o.h,sw=Math.sin(t*1.4+x*.02)*2;g.strokeStyle='#8a6a4a';g.lineWidth=2;g.beginPath();g.moveTo(x,y);g.lineTo(x+8,y+6);g.moveTo(x+w,y);g.lineTo(x+w-8,y+6);g.stroke();
  g.fillStyle='#e8334a';g.beginPath();g.moveTo(x+6,y+6);g.quadraticCurveTo(x+w/2,y+6+sw*3,x+w-6,y+6);g.lineTo(x+w-6,y+h-4);g.quadraticCurveTo(x+w/2,y+h-4+sw*3,x+6,y+h-4);g.closePath();g.fill();
  g.strokeStyle='#ffd23f';g.lineWidth=2;g.stroke();g.fillStyle='#ffe9a8';g.font='900 '+Math.round(h*.42)+'px "Noto Sans SC",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('元旦快乐 · 四班 Forever',x+w/2,y+h*.52+sw);g.textBaseline='alphabetic'},
 streamers:function(g,o,t){for(var i=0;i<5;i++){var px=o.x+4+i*(o.w-8)/4,c=pal(i+o.x/32);g.strokeStyle=c;g.lineWidth=4;g.lineCap='round';g.beginPath();g.moveTo(px,o.y);
   for(var s=1;s<=10;s++){g.lineTo(px+Math.sin(t*1.6+s*.55+i)*7*(s/10),o.y+s*o.h/10*(.7+hash(i)*.3))}g.stroke()}},
 giftpile:function(g,o,t){var x=o.x,y=o.y+o.h;[[0,0,26,20,0],[24,0,22,15,1],[10,-20,20,16,2],[-12,0,16,12,3]].forEach(function(b){g.fillStyle=pal(b[4]+x/32);rr(g,x+b[0],y-b[3]+b[1],b[2],b[3],2);g.fill();g.fillStyle='#fff6d8';g.fillRect(x+b[0]+b[2]/2-2,y-b[3]+b[1],4,b[3]);g.fillRect(x+b[0],y-b[3]*.55+b[1],b[2],3)})}
};
var _thing=G.thing;
G.thing=function(g,o,t,biome,lvlH){var f=X[o.kind];if(f){if(!o.p)o.p={}; /* 关卡工坊画的物件没有 p */g.save();f(g,o,t,G.B(biome));g.restore()}else _thing.apply(this,arguments)};

/* ==================== 怪物 ==================== */
var E={
 /* 雪团怪：两个雪球叠一起，围着条小围巾，鼻子是根胡萝卜 */
 snowling:function(g,e,t){var cx=e.x+e.w/2,by=e.y+e.h,cr=e.cs==='crouch',air=e.air,fl=e.flash>0;g.translate(cx,by);g.scale(e.face||1,1);if(cr)g.scale(1.18,.78);else if(air)g.scale(.86,1.14);
  g.fillStyle=fl?'#fff':'#eef6fb';ell(g,0,-13,17,14);g.fill();ell(g,0,-34,12,11);g.fill();g.fillStyle='rgba(120,160,200,.25)';ell(g,4,-10,12,8);g.fill();
  g.fillStyle='#ff6a8a';g.fillRect(-10,-26,20,5);g.fillRect(5,-26,5,12);g.fillStyle='#10202e';ell(g,-3,-37,1.8,2.2);g.fill();ell(g,5,-37,1.8,2.2);g.fill();
  g.fillStyle='#ff9a3a';poly(g,[8,-33,17,-31,8,-30]);g.fill();g.strokeStyle='#5a3a24';g.lineWidth=2;g.beginPath();g.moveTo(-14,-18);g.lineTo(-24,-26);g.moveTo(14,-18);g.lineTo(23,-26);g.stroke();
  if(cr){g.fillStyle='#ff4a6a';g.font='bold 20px sans-serif';g.textAlign='center';g.fillText('!',0,-52)}},
 /* 气球怪：一只会飘的气球，被惹急了就越鼓越大 */
 balloon:function(g,e,t){var cx=e.x+e.w/2,cy=e.y+e.h/2,sw=e.swell||0,fl=e.flash>0,c=e.col||'#ff6a8a',s=1+sw*.55;g.translate(cx,cy+Math.sin(t*3+e.x)*3);g.scale(s,s);if(sw>.5)g.translate(Math.sin(t*60)*1.2,0);
  g.strokeStyle='rgba(255,255,255,.7)';g.lineWidth=1.5;g.beginPath();g.moveTo(0,17);g.quadraticCurveTo(Math.sin(t*3)*6,28,Math.sin(t*2)*4,38);g.stroke();
  g.fillStyle=fl?'#fff':c;ell(g,0,-2,17,20);g.fill();poly(g,[-4,18,4,18,0,23]);g.fill();g.fillStyle='rgba(255,255,255,.5)';ell(g,-7,-10,4,7);g.fill();
  g.fillStyle='#10202e';var pan=sw>.5;ell(g,-5,-2,2.4,pan?3.6:2.6);g.fill();ell(g,5,-2,2.4,pan?3.6:2.6);g.fill();g.strokeStyle='#10202e';g.lineWidth=2;g.beginPath();if(pan)g.arc(0,8,3,0,6.28);else g.arc(0,4,5,.2,2.9);g.stroke();
  if(sw>.2){g.strokeStyle='rgba(255,255,255,.7)';g.lineWidth=2;for(var i=0;i<4;i++){g.beginPath();g.moveTo(Math.cos(i*1.57+.8)*(22),Math.sin(i*1.57+.8)*(26));g.lineTo(Math.cos(i*1.57+.8)*(30),Math.sin(i*1.57+.8)*(34));g.stroke()}}},
 /* 玩具鼓兵：锡制的小鼓手，高高的黑帽子 */
 toysoldier:function(g,e,t){var cx=e.x+e.w/2,by=e.y+e.h,cs=e.cs||'wait',fl=e.flash>0,rush=cs==='rush',drum=cs==='drum';g.translate(cx,by);g.scale(e.face||1,1);g.rotate(rush?.22:cs==='dizzy'?-.1+Math.sin(t*20)*.08:0);
  g.fillStyle='#2a3a5a';g.fillRect(-8,-14,6,14);g.fillRect(2,-14,6,14);g.fillStyle=fl?'#fff':'#e8433a';rr(g,-13,-46,26,34,4);g.fill();g.fillStyle='#ffd23f';g.fillRect(-13,-30,26,3);for(var i=0;i<3;i++){ell(g,0,-42+i*7,1.8,1.8);g.fill()}
  g.fillStyle='#ffd9b0';ell(g,0,-54,9,9);g.fill();g.fillStyle='#22303f';rr(g,-8,-76,16,20,2);g.fill();g.fillStyle='#ffd23f';g.fillRect(-8,-62,16,3);g.fillStyle='#e8433a';ell(g,-3,-55,1.6,1.8);g.fill();ell(g,4,-55,1.6,1.8);g.fill();
  g.fillStyle='#c93a3a';rr(g,6,-30,24,16,3);g.fill();g.fillStyle='#fff';g.fillRect(6,-30,24,3);g.fillRect(6,-17,24,3);g.strokeStyle='#ffd23f';g.lineWidth=2;for(var k=0;k<3;k++){g.beginPath();g.moveTo(9+k*7,-27);g.lineTo(13+k*7,-17);g.stroke()}
  var hit=drum?Math.sin(t*34)>0:0;g.strokeStyle='#e8d8b0';g.lineWidth=3;g.lineCap='round';g.beginPath();g.moveTo(10,-44);g.lineTo(24,hit?-36:-48);g.stroke();
  if(drum&&hit)glow(g,20,-30,28,'#ffd23f',.7)},
 /* 烟花射手：蹲在木箱后面，抱着一根烟花筒 */
 rocketeer:function(g,e,t){var cx=e.x+e.w/2,by=e.y+e.h,aim=e.cs==='aim',fl=e.flash>0;g.translate(cx,by);
  g.fillStyle='#8a5a34';rr(g,-24,-24,48,24,3);g.fill();g.fillStyle='#6a4524';g.fillRect(-24,-14,48,3);g.fillStyle='#ffd23f';g.fillRect(-20,-22,6,5);
  g.save();g.translate(6,-24);g.rotate(aim?-1.35+Math.sin(t*40)*.02:-1.1);g.fillStyle=fl?'#fff':'#2f4a6a';rr(g,-5,-34,10,34,2);g.fill();g.fillStyle='#ffd23f';g.fillRect(-5,-34,10,5);g.fillRect(-5,-12,10,3);
  if(aim){g.fillStyle='#ff9a3a';ell(g,0,-36,5,5);g.fill();glow(g,0,-36,30,'#ffd23f',.8)}g.restore();
  g.fillStyle='#ffd9b0';ell(g,-10,-34,8,8);g.fill();g.fillStyle='#e8334a';poly(g,[-18,-38,-2,-38,-10,-58]);g.fill();g.fillStyle='#fff';ell(g,-10,-58,3,3);g.fill();g.fillStyle='#10202e';ell(g,-7,-34,1.6,1.8);g.fill()},
 /* 杂耍小丑：彩色条纹衣服，头顶三颗彩球绕着转 */
 clown:function(g,e,t){var cx=e.x+e.w/2,by=e.y+e.h,fl=e.flash>0,wd=e.cs==='wind';g.translate(cx,by);g.scale(e.face||1,1);
  g.fillStyle='#e8334a';g.fillRect(-7,-12,6,12);g.fillStyle='#ffd23f';g.fillRect(1,-12,6,12);g.fillStyle='#22303f';rr(g,-9,-3,8,5,2);g.fill();rr(g,1,-3,10,5,2);g.fill();
  for(var i=0;i<4;i++){g.fillStyle=fl?'#fff':(i%2?'#6dd5ff':'#c9a0ff');g.fillRect(-10,-40+i*7,20,7)}rr(g,-10,-40,20,28,4);g.globalAlpha=0;g.fill();g.globalAlpha=1;
  g.fillStyle='#ffd9b0';ell(g,0,-49,8,8.5);g.fill();g.fillStyle='#ff4a6a';ell(g,3,-47,2.8,2.8);g.fill();g.fillStyle='#ff9a3a';poly(g,[-8,-52,-14,-58,-9,-46]);g.fill();poly(g,[8,-52,14,-58,9,-46]);g.fill();
  g.fillStyle='#10202e';ell(g,-2.5,-51,1.4,1.7);g.fill();ell(g,3.5,-51,1.4,1.7);g.fill();g.fillStyle='#6dffb0';poly(g,[-7,-56,7,-56,0,-76]);g.fill();g.fillStyle='#ffd23f';ell(g,0,-76,2.6,2.6);g.fill();
  for(var b=0;b<3;b++){var a=t*(wd?9:4)+b*2.09;g.fillStyle=pal(b*2);ell(g,Math.cos(a)*16,-70+Math.sin(a)*6-4*(wd?1:0),4.5,4.5);g.fill()}
  g.strokeStyle='#e8334a';g.lineWidth=4;g.lineCap='round';g.beginPath();g.moveTo(8,-38);g.lineTo(wd?16:13,wd?-62:-34);g.stroke()}
};
var _enemy=G.enemy;
G.enemy=function(g,e,t,biome){var f=E[e.kind];if(f){g.save();f(g,e,t);g.restore()}else _enemy.apply(this,arguments)};

/* ==================== Boss「零点钟魔」 ==================== */
function drawBoss(g,b,t){
 var w=b.w,h=b.h,fl=b.flash>0,face=b.face||1,ph=b.phase||0,st=b.state,wind=st==='wind',stun=st==='stun',air=!!b.air,cd=b.cd>0,mouth=Math.max(b.mouth||0,cd?1:0),atk=st==='atk'?b.atk:'';
 g.save();g.translate(b.x+w/2,b.y+h);
 var sq=wind?.86:air?1.08:1;g.scale(1/sq*1.0,sq);
 var R0=Math.min(w*.46,h*.5),cy=-h*.5-6;
 /* 阶段光晕：越到后面越红 */
 glow(g,0,cy,R0*1.9,ph>1?'#ff3a5a':ph>0?'#ff9a3a':'#ffd23f',.22+(cd?.25:0));
 /* 腿和靴子 */
 var step=air?0:Math.sin(b.ht||0)*0;for(var s=-1;s<=1;s+=2){g.strokeStyle='#394862';g.lineWidth=11;g.lineCap='round';g.beginPath();g.moveTo(s*R0*.45,cy+R0*.8);g.lineTo(s*R0*.55,-10);g.stroke();g.fillStyle='#e8334a';rr(g,s*R0*.55-(s<0?22:-2)*1,-14,24,14,5);g.fill();g.fillStyle='#ffd23f';g.fillRect(s*R0*.55-(s<0?22:-2),-6,24,3)}
 /* 双铃和锤子 */
 var shake=stun?0:Math.sin(t*(wind?60:atk==='countdown'?50:0))*(wind||cd?2.5:0);
 for(var k=-1;k<=1;k+=2){g.save();g.translate(k*R0*.55,cy-R0*.82);g.rotate(k*.5+shake*.05);g.fillStyle=fl?'#fff':'#e8b83a';g.beginPath();g.arc(0,0,R0*.3,Math.PI,0);g.closePath();g.fill();g.fillStyle='#fff3b0';g.beginPath();g.arc(-R0*.08,-R0*.08,R0*.12,Math.PI,Math.PI*1.7);g.fill();g.fillStyle='#b8862a';g.fillRect(-R0*.3,-2,R0*.6,5);g.restore()}
 g.strokeStyle='#8a97a3';g.lineWidth=6;g.beginPath();g.moveTo(0,cy-R0);g.lineTo(0,cy-R0*1.22);g.stroke();
 var hm=Math.sin(t*(cd?24:12))*(wind||cd?16:6);g.save();g.translate(0,cy-R0*1.25);g.rotate(hm*.03);g.strokeStyle='#8a97a3';g.lineWidth=5;g.beginPath();g.moveTo(0,0);g.lineTo(hm,-R0*.3);g.stroke();g.fillStyle='#b0b8c0';ell(g,hm,-R0*.32,8,8);g.fill();g.restore();
 /* 钟身：金属外圈 + 奶白色钟面 */
 var rim=g.createRadialGradient(-R0*.3,cy-R0*.3,R0*.2,0,cy,R0);rim.addColorStop(0,'#ff8a9a');rim.addColorStop(1,ph>1?'#a01030':'#c8203e');
 g.fillStyle=fl?'#fff':rim;ell(g,0,cy,R0,R0);g.fill();g.strokeStyle='#ffd23f';g.lineWidth=5;ell(g,0,cy,R0,R0);g.stroke();
 if(!fl){for(var bl=0;bl<16;bl++){var ba=bl*Math.PI/8;g.fillStyle=['#ffd23f','#6dffb0','#6dd5ff','#ff6a8a','#c9a0ff'][(bl+Math.floor(t*5))%5];g.globalAlpha=.6+.4*Math.sin(t*8+bl);ell(g,Math.sin(ba)*R0*.9,cy-Math.cos(ba)*R0*.9,3.6,3.6);g.fill()}g.globalAlpha=1} /* 钟边一圈小彩灯 */
 g.fillStyle=fl?'#fff':'#fff6e0';ell(g,0,cy,R0*.8,R0*.8);g.fill();
 if(!fl){g.fillStyle='#394862';for(var i=0;i<12;i++){var a=i*Math.PI/6,rx=Math.sin(a)*R0*.68,ry=cy-Math.cos(a)*R0*.68;if(i%3===0){g.font='bold '+Math.round(R0*.16)+'px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(String(i||12),rx,ry)}else{ell(g,rx,ry,2.4,2.4);g.fill()}}g.textBaseline='alphabetic'}
 /* 钟面上的裂纹（阶段越高越多） */
 if(!fl&&ph>=1){g.strokeStyle='rgba(60,40,50,.7)';g.lineWidth=2;g.beginPath();g.moveTo(-R0*.5,cy-R0*.74);g.lineTo(-R0*.38,cy-R0*.5);g.lineTo(-R0*.5,cy-R0*.32);g.stroke()}
 if(!fl&&ph>=2){g.strokeStyle='rgba(255,90,60,'+(.6+Math.sin(t*9)*.3)+')';g.lineWidth=2.5;g.beginPath();g.moveTo(R0*.45,cy-R0*.7);g.lineTo(R0*.3,cy-R0*.42);g.lineTo(R0*.48,cy-R0*.2);g.lineTo(R0*.34,cy+R0*.08);g.stroke()}
 /* 指针：指在 11:59；倒数时秒针飞转 */
 var hA=(11.98/12)*6.283,mA=(59.4/60)*6.283+(cd?-b.cd*0.3:0);g.strokeStyle='#22303f';g.lineWidth=5;g.lineCap='round';g.beginPath();g.moveTo(0,cy);g.lineTo(Math.sin(hA)*R0*.38,cy-Math.cos(hA)*R0*.38);g.stroke();g.lineWidth=3.5;g.beginPath();g.moveTo(0,cy);g.lineTo(Math.sin(mA)*R0*.58,cy-Math.cos(mA)*R0*.58);g.stroke();
 if(cd){var sA=t*(8+(5-b.cd)*2);g.strokeStyle='#e8334a';g.lineWidth=2;g.beginPath();g.moveTo(0,cy);g.lineTo(Math.sin(sA)*R0*.74,cy-Math.cos(sA)*R0*.74);g.stroke()}
 /* 脸：眼睛、眉毛、嘴（嘴张开=在报时） */
 var gz=face*3,ec=stun?'#9aa6b2':wind?'#ff2a4a':ph>1?'#ff7a2a':'#2a3348';
 g.fillStyle=fl?'#fff':ec;
 if(stun){g.strokeStyle='#394862';g.lineWidth=3;for(var s2=-1;s2<=1;s2+=2){g.beginPath();g.moveTo(s2*R0*.26-6,cy-R0*.18-6);g.lineTo(s2*R0*.26+6,cy-R0*.18+6);g.moveTo(s2*R0*.26+6,cy-R0*.18-6);g.lineTo(s2*R0*.26-6,cy-R0*.18+6);g.stroke()}}
 else{for(var s3=-1;s3<=1;s3+=2){ell(g,s3*R0*.26+gz,cy-R0*.18,R0*.1,R0*.13);g.fill();g.fillStyle='#fff';ell(g,s3*R0*.26+gz+2,cy-R0*.22,2.4,2.8);g.fill();g.fillStyle=fl?'#fff':ec}
  g.strokeStyle='#22303f';g.lineWidth=5;g.beginPath();g.moveTo(-R0*.42,cy-R0*.4+(wind?4:0));g.lineTo(-R0*.12,cy-R0*.3);g.moveTo(R0*.42,cy-R0*.4+(wind?4:0));g.lineTo(R0*.12,cy-R0*.3);g.stroke()}
 if(mouth>.1||stun){var mo=stun?.35:mouth;g.fillStyle='#3a1020';ell(g,gz,cy+R0*.3,R0*.22,R0*.07+R0*.2*mo);g.fill();g.fillStyle='#fff';for(var q=-2;q<=2;q++){g.fillRect(gz+q*R0*.07-2,cy+R0*.3-R0*.07-R0*.2*mo,4,6)}}
 else{g.strokeStyle='#22303f';g.lineWidth=4;g.beginPath();g.arc(gz,cy+R0*.22,R0*.2,.15*Math.PI,.85*Math.PI);g.stroke()}
 /* 头顶的派对帽（歪戴） */
 g.save();g.translate(R0*.34,cy-R0*.92);g.rotate(.32);g.fillStyle=fl?'#fff':'#6dd5ff';poly(g,[-R0*.26,0,R0*.26,0,0,-R0*.62]);g.fill();g.fillStyle=fl?'#fff':'#ff6a8a';for(var hs=0;hs<3;hs++){poly(g,[-R0*.2+hs*R0*.03,-R0*.14*hs-R0*.03,R0*.2-hs*R0*.03,-R0*.14*hs-R0*.03,R0*.18-hs*R0*.04,-R0*.14*hs-R0*.09,-R0*.18+hs*R0*.04,-R0*.14*hs-R0*.09]);g.fill()}
 g.fillStyle='#ffd23f';ell(g,0,-R0*.64+Math.sin(t*9)*2,R0*.09,R0*.09);g.fill();g.restore()
 /* 手：戴着白手套 */
 for(var s4=-1;s4<=1;s4+=2){var up=wind?-R0*.4:air?-R0*.3:0,sw=Math.sin(t*3+s4)*4;g.strokeStyle='#394862';g.lineWidth=9;g.beginPath();g.moveTo(s4*R0*.92,cy+R0*.1);g.lineTo(s4*R0*1.25,cy+R0*.4+up+sw);g.stroke();g.fillStyle='#fff';ell(g,s4*R0*1.28,cy+R0*.42+up+sw,10,10);g.fill()}
 /* 脱力时头顶转圈的小星星 */
 if(stun){for(var m=0;m<4;m++){var aa=t*3+m*1.57;g.fillStyle='#ffd23f';ell(g,Math.cos(aa)*R0*.5,cy-R0*1.05+Math.sin(aa)*10,5,5);g.fill()}}
 g.restore()}
var _boss=G.boss;
G.boss=function(g,b,t){if(b.type==='midnight')drawBoss(g,b,t);else _boss.apply(this,arguments)};

/* ==================== NPC ==================== */
function body(g,col,hat,bob,extra){g.fillStyle='#232f42';g.fillRect(-6,-10,5,10);g.fillRect(1,-10,5,10);g.fillStyle=col;rr(g,-9,-28+bob,18,22,5);g.fill();g.fillStyle='#ffd9b0';ell(g,0,-35+bob,8,8);g.fill();g.fillStyle='#10202e';ell(g,-2.6,-35+bob,1.2,1.5);g.fill();ell(g,2.8,-35+bob,1.2,1.5);g.fill();
 if(hat)hat(g,bob)}
function partyHat(c){return function(g,bob){g.fillStyle=c;poly(g,[-6,-40+bob,6,-40+bob,0,-58+bob]);g.fill();g.fillStyle='#fff';ell(g,0,-58+bob,2.6,2.6);g.fill();g.fillStyle='#ffd23f';g.fillRect(-5,-44+bob,10,2)}}
var NPCX={
 host:function(g,x,y,w,h,t,bob){body(g,'#22303f',null,bob);g.fillStyle='#ff6a8a';poly(g,[-4,-27+bob,4,-27+bob,0,-23+bob]);g.fill();poly(g,[-4,-23+bob,0,-23+bob,-4,-19+bob]);g.fill();poly(g,[4,-23+bob,0,-23+bob,4,-19+bob]);g.fill();
  g.fillStyle='#3a2a1a';g.beginPath();g.arc(0,-37+bob,8.4,Math.PI,0);g.fill();g.strokeStyle='#8a97a3';g.lineWidth=2;g.beginPath();g.moveTo(8,-18+bob);g.lineTo(13,-26+bob);g.stroke();g.fillStyle='#394862';ell(g,13,-28+bob,3.4,3.4);g.fill();
  g.fillStyle='#ffd23f';g.font='bold 10px sans-serif';g.textAlign='center';g.fillText('♪',-14,-42+bob+Math.sin(t*3)*3)},
 seller:function(g,x,y,w,h,t,bob){body(g,'#7a5a3a',function(g,bob){g.fillStyle='#8a97a3';g.beginPath();g.arc(0,-37+bob,8.6,Math.PI,0);g.fill();g.fillStyle='#e8e0d0';g.fillRect(-6,-31+bob,12,4)},bob);
  for(var i=0;i<5;i++){var a=-1.2+i*.6+Math.sin(t*1.2+i)*.06,l=36+hash(i)*12,px=10+Math.sin(a)*l,py=-26-Math.cos(a)*l;g.strokeStyle='rgba(255,255,255,.6)';g.lineWidth=1;g.beginPath();g.moveTo(10,-26);g.lineTo(px,py+12);g.stroke();g.fillStyle=pal(i);ell(g,px,py,9,11);g.fill()}},
 kid:function(g,x,y,w,h,t,bob){body(g,'#ff9a3a',partyHat('#6dd5ff'),bob);g.strokeStyle='#ff6a8a';g.lineWidth=3;g.lineCap='round';g.beginPath();g.moveTo(8,-22+bob);for(var s=1;s<=8;s++)g.lineTo(8+s*4,-22+bob-Math.sin(t*4+s*.8)*6-s*1.5);g.stroke()},
 bellkeeper:function(g,x,y,w,h,t,bob){body(g,'#394862',function(g,bob){g.fillStyle='#22303f';rr(g,-9,-45+bob,18,8,3);g.fill();g.fillRect(-11,-39+bob,22,3);g.fillStyle='#ffd23f';g.fillRect(-9,-42+bob,18,2)},bob);
  g.fillStyle='#e8e0d0';poly(g,[-6,-32+bob,6,-32+bob,0,-24+bob]);g.fill();g.strokeStyle='#ffd23f';g.lineWidth=2;g.beginPath();g.moveTo(9,-22+bob);g.lineTo(9,-4);g.stroke();g.fillStyle='#e8b83a';g.beginPath();g.arc(9,-4,5,Math.PI,0);g.closePath();g.fill()},
 mate:function(g,x,y,w,h,t,bob,tex){var c=['#7fb4e8','#ff9a9a','#9ae8a8','#e8d27a','#c9a0ff','#ffb36a'][Math.abs(String(tex||'').split('').reduce(function(a,ch){return a+ch.charCodeAt(0)},0))%6];
  body(g,c,partyHat(pal(String(tex||'a').charCodeAt(0))),bob);g.fillStyle='#2a3a5a';g.beginPath();g.arc(0,-37+bob,8.4,Math.PI,0);g.fill();g.fillStyle=pal(1+String(tex||'a').charCodeAt(0));ell(g,-12,-30+bob+Math.sin(t*2)*2,5,6);g.fill();g.strokeStyle='rgba(255,255,255,.6)';g.lineWidth=1;g.beginPath();g.moveTo(-9,-24+bob);g.lineTo(-12,-24+bob+Math.sin(t*2)*2+6);g.stroke()}
};
var _npc=G.npc;
G.npc=function(g,kind,x,y,w,h,t,face){var parts=String(kind).split('#'),f=NPCX[parts[0]];if(!f)return _npc(g,kind,x,y,w,h,t,face);
 g.save();g.translate(x+w/2,y+h);g.scale(face||1,1);f(g,x,y,w,h,t,Math.sin(t*2+x)*1.2,parts[1]);g.restore()};

/* ==================== 报幕环节动画 ==================== */
function ease(u){u=Math.max(0,Math.min(1,u));return u*u*(3-2*u)}
function skyGrad(g,W,H,a,b){var gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,a);gr.addColorStop(1,b);g.fillStyle=gr;g.fillRect(0,0,W,H)}
function stars(g,W,H,t,n){for(var i=0;i<n;i++){var x=hash(i)*W,y=hash(i+50)*H*.6,a=.4+.6*Math.abs(Math.sin(t*1.3+i));g.globalAlpha=a*.8;g.fillStyle='#fff';g.fillRect(x,y,2,2)}g.globalAlpha=1}
function snow(g,W,H,t,n){g.fillStyle='#fff';for(var i=0;i<n;i++){var sp=24+hash(i+7)*40,x=(hash(i)*W+Math.sin(t*.8+i)*18+W*2)%W,y=(hash(i+99)*H+t*sp)%H,r=1+hash(i+3)*2.4;g.globalAlpha=.55+hash(i+11)*.4;g.beginPath();g.arc(x,y,r,0,6.283);g.fill()}g.globalAlpha=1}
function heroAt(g,W,H,t,x,y,state,vx,scale){g.save();g.translate(x,y);var s=scale||Math.max(2.4,H/180);g.scale(s,s);G.hero(g,{cx:0,cy:-1,face:1,vx:vx||0,vy:0,ground:true,anim:t,state:state||'idle',atk:0},t,'#74dbe8');g.restore()}
function npcAt(g,kind,x,y,s,t,face){g.save();g.translate(x,y);g.scale(s,s);NPCX[kind]&&(g.save(),g.scale(face||1,1),NPCX[kind](g,0,0,0,0,t,Math.sin(t*2)*1.2,String(Math.floor(x))),g.restore());g.restore()}
function curtainSide(g,x,w,H,flip){var gr=g.createLinearGradient(x,0,x+w,0);gr.addColorStop(0,'#7a0f22');gr.addColorStop(.5,'#c8203e');gr.addColorStop(1,'#7a0f22');g.fillStyle=gr;g.fillRect(x,0,w,H);
 g.fillStyle='rgba(0,0,0,.22)';for(var i=0;i<w;i+=26){g.fillRect(x+i,0,9,H)}g.fillStyle='#ffd23f';g.fillRect(x,H*.9,w,5);for(var j=0;j<w;j+=8)g.fillRect(x+j,H*.9+5,2,9)}
function stageFloor(g,W,H){var gr=g.createLinearGradient(0,H*.78,0,H);gr.addColorStop(0,'#b07a44');gr.addColorStop(1,'#6a4524');g.fillStyle=gr;g.fillRect(0,H*.78,W,H*.22);g.fillStyle='rgba(0,0,0,.2)';for(var i=0;i<W;i+=70)g.fillRect(i,H*.78,2,H*.22)}
function spot(g,W,H,t,x0,ph,col){var ang=Math.sin(t*.7+ph)*.5,tx=x0+Math.tan(ang)*H*.8;var gr=g.createLinearGradient(x0,0,tx,H*.8);gr.addColorStop(0,col+'.35)');gr.addColorStop(1,col+'0)');g.fillStyle=gr;g.beginPath();g.moveTo(x0-10,0);g.lineTo(x0+10,0);g.lineTo(tx+W*.1,H*.82);g.lineTo(tx-W*.1,H*.82);g.closePath();g.fill()}
function confettiRain(g,W,H,t,n,t0){var a=t-t0;if(a<0)return;for(var i=0;i<n;i++){var sp=60+hash(i+4)*70,y=((hash(i+30)*H+a*sp)%(H+30))-15,x=(hash(i)*W+Math.sin(a*1.4+i)*26+W)%W;g.save();g.translate(x,y);g.rotate(a*3+i);g.fillStyle=pal(i);g.fillRect(-4,-2,8,4);g.restore()}}
function bunt(g,W,H,t,y0,sag,n,off){g.strokeStyle='#5a4a3a';g.lineWidth=2;g.beginPath();for(var i=0;i<=20;i++){var u=i/20;g[i?'lineTo':'moveTo'](u*W,y0+Math.sin(u*Math.PI)*sag+off)}g.stroke();
 for(var j=0;j<n;j++){var u2=(j+.5)/n,bx=u2*W,by=y0+Math.sin(u2*Math.PI)*sag+off,on=(Math.floor(t*3)+j)%2;g.fillStyle=on?pal(j):'#3a4658';g.beginPath();g.arc(bx,by+7,6,0,6.283);g.fill();if(on)glow(g,bx,by+7,26,pal(j),.5)}}

var NYS={
 /* 幕布拉开：观众席的灯暗下去，幕布向两边拉开，露出舞台，彩带落下 */
 ny_curtain:function(g,W,H,t){
  skyGrad(g,W,H,'#120a22','#2a1230');
  var open=ease((t-.8)/2.8),cw=(W*.5)*(1-open)+W*.06;
  skyGrad(g,W,H,'#0b1530','#1c3a5a');stars(g,W,H,t,50); /* 舞台背景画：雪镇 */
  g.fillStyle='#e8f2fa';g.beginPath();g.moveTo(0,H*.7);for(var i=0;i<=24;i++)g.lineTo(i*W/24,H*.66+Math.sin(i*1.3)*14);g.lineTo(W,H*.78);g.lineTo(0,H*.78);g.fill();
  for(var h=0;h<7;h++){var hx=W*(.12+h*.12),hh=40+hash(h)*30;g.fillStyle='#2a3a5a';g.fillRect(hx-26,H*.7-hh,52,hh);g.fillStyle='#f4fbff';poly(g,[hx-32,H*.7-hh,hx+32,H*.7-hh,hx,H*.7-hh-26]);g.fill();g.fillStyle=(Math.sin(t+h)>-.7)?'#ffd98a':'#3a4658';g.fillRect(hx-9,H*.7-hh*.7,18,14)}
  stageFloor(g,W,H);snow(g,W,H*.8,t,50);
  spot(g,W,H,t,W*.3,0,'rgba(255,240,190,');spot(g,W,H,t,W*.7,2,'rgba(190,220,255,');
  heroAt(g,W,H,t,W*.5,H*.8,'idle');
  curtainSide(g,0,cw,H);curtainSide(g,W-cw,cw,H);
  g.fillStyle='#7a0f22';g.fillRect(0,0,W,H*.1);g.fillStyle='#ffd23f';g.fillRect(0,H*.1,W,6);for(var f=0;f<W;f+=14){g.beginPath();g.arc(f+7,H*.1+6,7,0,Math.PI);g.fill()}
  g.fillStyle='#ffe9a8';g.font='900 '+Math.round(H*.052)+'px "Noto Sans SC",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('四班 · 元旦联欢会',W/2,H*.05);g.textBaseline='alphabetic';
  /* 前排观众的剪影 */
  g.fillStyle='#0a0614';for(var a=0;a<14;a++){var ax=(a+.5)*W/14;g.beginPath();g.arc(ax,H*.98,H*.05,0,6.283);g.fill();g.fillRect(ax-H*.055,H*.98,H*.11,H*.04)}
  bunt(g,W,H,t,H*.14,H*.05,16,0);
  confettiRain(g,W,H,t,70,3.2);
  var dim=Math.max(0,1-t/1.4);if(dim>0){g.fillStyle='rgba(0,0,0,'+dim*.7+')';g.fillRect(0,0,W,H)}},
 /* 雪镇夜景：暖黄的窗，成串的彩灯，远处的钟楼，老师踏雪走来 */
 ny_town:function(g,W,H,t){
  skyGrad(g,W,H,'#0b1233','#4a5a96');stars(g,W,H,t,70);glow(g,W*.82,H*.2,H*.22,'#fff6d0',.55);g.fillStyle='#fff6d0';g.beginPath();g.arc(W*.82,H*.2,H*.05,0,6.283);g.fill();
  g.fillStyle='#34426e';g.beginPath();g.moveTo(0,H*.62);for(var i=0;i<=12;i++)g.lineTo(i*W/12,H*.5+Math.sin(i*1.7)*H*.07);g.lineTo(W,H*.62);g.fill();
  var off=(t*18)%(W/3);
  /* 钟楼 */
  var tx=W*.5,ty=H*.22;g.fillStyle='#4a5a88';g.fillRect(tx-H*.06,ty,H*.12,H*.4);g.fillStyle='#394862';poly(g,[tx-H*.08,ty,tx+H*.08,ty,tx,ty-H*.1]);g.fill();g.fillStyle='#f4efdc';g.beginPath();g.arc(tx,ty+H*.08,H*.04,0,6.283);g.fill();glow(g,tx,ty+H*.08,H*.1,'#ffe9a8',.5);
  g.strokeStyle='#22303f';g.lineWidth=2;g.beginPath();g.moveTo(tx,ty+H*.08);g.lineTo(tx,ty+H*.05);g.moveTo(tx,ty+H*.08);g.lineTo(tx-H*.025,ty+H*.095);g.stroke();
  for(var k=-1;k<5;k++){var hx=k*W/3-off+W*.12,hy=H*.62,hw=W*.17,hh=H*.2;g.fillStyle=['#c98a6a','#8aa0c8','#d9a0a0','#9ac8a8'][((k%4)+4)%4];g.fillRect(hx,hy-hh,hw,hh);g.fillStyle='#4a3a42';poly(g,[hx-8,hy-hh,hx+hw+8,hy-hh,hx+hw/2,hy-hh-H*.09]);g.fill();g.fillStyle='#f4fbff';poly(g,[hx-8,hy-hh,hx+hw*.4,hy-hh,hx+hw/2,hy-hh-H*.09]);g.fill();
   g.fillStyle='#ffd98a';g.fillRect(hx+hw*.15,hy-hh*.7,hw*.2,hh*.3);g.fillRect(hx+hw*.6,hy-hh*.7,hw*.2,hh*.3);glow(g,hx+hw*.25,hy-hh*.55,H*.07,'#ffd98a',.35)}
  g.fillStyle='#e8f2fa';g.fillRect(0,H*.62,W,H*.38);g.fillStyle='#c8dcec';g.fillRect(0,H*.62,W,6);
  bunt(g,W,H,t,H*.1,H*.06,18,0);bunt(g,W,H,t+1,H*.2,H*.05,16,6);
  /* 彩灯树 */
  var cx=W*.86;g.fillStyle='#2f7a52';for(var l=0;l<4;l++)poly(g,[cx-H*.07-l*H*.02,H*.8-l*H*.09,cx+H*.07+l*H*.02,H*.8-l*H*.09,cx,H*.62-l*H*.09]),g.fill();for(var b=0;b<12;b++){var on=(Math.floor(t*3)+b)%2;g.fillStyle=on?pal(b):'#3a4658';g.beginPath();g.arc(cx+(hash(b)-.5)*H*.16,H*.5+hash(b+4)*H*.28,4,0,6.283);g.fill()}
  snow(g,W,H,t,90);
  heroAt(g,W,H,t,W*.3,H*.8,'run',200)},
 /* 报幕中：幕布合上，聚光灯下一支麦克风，跑马灯绕着“节目”二字转 */
 ny_intermission:function(g,W,H,t){
  skyGrad(g,W,H,'#1a0a1e','#3a1230');stageFloor(g,W,H);
  curtainSide(g,0,W*.5,H);curtainSide(g,W*.5,W*.5,H);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(0,0,W,H);
  spot(g,W,H,t,W*.5,0,'rgba(255,230,160,');
  var cx=W*.5,cy=H*.42,pw=W*.5,ph=H*.26;g.fillStyle='#22101a';rr(g,cx-pw/2,cy-ph/2,pw,ph,14);g.fill();g.strokeStyle='#ffd23f';g.lineWidth=4;rr(g,cx-pw/2,cy-ph/2,pw,ph,14);g.stroke();
  var n=40;for(var i=0;i<n;i++){var u=i/n,per=2*(pw+ph),d=u*per,px,py;if(d<pw){px=cx-pw/2+d;py=cy-ph/2}else if(d<pw+ph){px=cx+pw/2;py=cy-ph/2+d-pw}else if(d<2*pw+ph){px=cx+pw/2-(d-pw-ph);py=cy+ph/2}else{px=cx-pw/2;py=cy+ph/2-(d-2*pw-ph)}
   var on=(i+Math.floor(t*8))%4===0;g.fillStyle=on?'#fff6a0':'#7a5a20';g.beginPath();g.arc(px,py,on?5:3.4,0,6.283);g.fill();if(on)glow(g,px,py,22,'#ffd23f',.8)}
  g.fillStyle='#ffe9a8';g.font='900 '+Math.round(H*.11)+'px "Noto Sans SC",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('节 目 报 幕',cx,cy-ph*.06);g.font='bold '+Math.round(H*.04)+'px "Noto Sans SC",sans-serif';g.fillStyle='#ff9ad5';g.fillText('SHOW TIME  ·  请 掌 声 欢 迎',cx,cy+ph*.3);g.textBaseline='alphabetic';
  /* 麦克风架 */
  var mx=W*.5,my=H*.82;g.strokeStyle='#8a97a3';g.lineWidth=4;g.beginPath();g.moveTo(mx,H*.98);g.lineTo(mx,my-H*.1);g.stroke();g.beginPath();g.ellipse(mx,H*.98,26,6,0,0,6.283);g.stroke();
  g.fillStyle='#394862';rr(g,mx-8,my-H*.18,16,26,8);g.fill();g.strokeStyle='#8a97a3';g.lineWidth=2;for(var m=0;m<4;m++){g.beginPath();g.moveTo(mx-8,my-H*.17+m*6);g.lineTo(mx+8,my-H*.17+m*6);g.stroke()}glow(g,mx,my-H*.1,50,'#ffe9a8',.4);
  /* 两侧上浮的气球 */
  for(var s=0;s<2;s++)for(var b=0;b<6;b++){var bx=s?W*(.84+hash(b)*.1):W*(.06+hash(b+9)*.1),by=H*1.1-((t*40+b*130)%(H*1.2));g.strokeStyle='rgba(255,255,255,.5)';g.lineWidth=1;g.beginPath();g.moveTo(bx,by+14);g.lineTo(bx+Math.sin(t+b)*5,by+60);g.stroke();g.fillStyle=pal(b+s*3);g.beginPath();g.ellipse(bx,by,15,19,0,0,6.283);g.fill();g.fillStyle='rgba(255,255,255,.4)';g.beginPath();g.ellipse(bx-5,by-6,3,6,0,0,6.283);g.fill()}
  confettiRain(g,W,H,t,34,0)},
 /* 钟楼：雪夜里一座大钟，分针缓缓爬向 12，铃在拱门里晃 */
 ny_clock:function(g,W,H,t){
  skyGrad(g,W,H,'#050a1c','#22305e');stars(g,W,H,t,80);
  var cx=W*.5,top=H*.08,tw=H*.5;g.fillStyle='#4a5a88';g.fillRect(cx-tw*.32,top+tw*.3,tw*.64,H);g.fillStyle='#394862';g.fillRect(cx-tw*.32,top+tw*.3,tw*.14,H);
  g.fillStyle='#2e3a5c';poly(g,[cx-tw*.4,top+tw*.32,cx+tw*.4,top+tw*.32,cx,top-tw*.1]);g.fill();g.fillStyle='#eef6fb';poly(g,[cx-tw*.4,top+tw*.32,cx-tw*.1,top+tw*.32,cx,top+tw*.14,cx,top-tw*.1]);g.fill();
  var fy=top+tw*.7,r=tw*.26;glow(g,cx,fy,r*2,'#ffe9a8',.35);g.fillStyle='#f4efdc';g.beginPath();g.arc(cx,fy,r,0,6.283);g.fill();g.strokeStyle='#c9a23a';g.lineWidth=7;g.stroke();
  g.fillStyle='#394862';for(var i=0;i<12;i++){var a=i*Math.PI/6;g.beginPath();g.arc(cx+Math.sin(a)*r*.82,fy-Math.cos(a)*r*.82,i%3?2.5:4,0,6.283);g.fill()}
  var prog=Math.min(1,t/10),mA=(54+prog*5.6)/60*6.283,hA=(11+(54+prog*5.6)/60)/12*6.283;g.strokeStyle='#22303f';g.lineCap='round';g.lineWidth=7;g.beginPath();g.moveTo(cx,fy);g.lineTo(cx+Math.sin(hA)*r*.5,fy-Math.cos(hA)*r*.5);g.stroke();g.lineWidth=4;g.beginPath();g.moveTo(cx,fy);g.lineTo(cx+Math.sin(mA)*r*.8,fy-Math.cos(mA)*r*.8);g.stroke();
  /* 钟：拱门里晃动 */
  var by=top+tw*.44;g.fillStyle='#14203a';g.beginPath();g.arc(cx,by+14,tw*.1,Math.PI,0);g.lineTo(cx+tw*.1,by+tw*.12);g.lineTo(cx-tw*.1,by+tw*.12);g.fill();
  g.save();g.translate(cx,by-2);g.rotate(Math.sin(t*2.2)*.25);g.fillStyle='#e8b83a';g.beginPath();g.moveTo(-tw*.07,tw*.1);g.quadraticCurveTo(-tw*.07,0,0,-tw*.02);g.quadraticCurveTo(tw*.07,0,tw*.07,tw*.1);g.closePath();g.fill();g.fillStyle='#fff3b0';g.fillRect(-tw*.03,tw*.02,4,tw*.05);g.restore();
  for(var a2=0;a2<3;a2++){var ph=(t*1.4+a2*.5)%1.5;if(ph<1){g.strokeStyle='rgba(255,233,168,'+(1-ph)*.6+')';g.lineWidth=3;g.beginPath();g.arc(cx,by+10,tw*.12+ph*tw*.35,-.9,.9+Math.PI*.2);g.stroke()}}
  g.fillStyle='#e8f2fa';g.fillRect(0,H*.88,W,H*.12);bunt(g,W,H,t,H*.06,H*.04,14,0);snow(g,W,H,t,100);
  heroAt(g,W,H,t,W*.22,H*.9,'idle',0,Math.max(2,H/220))},
 /* 钟魔登场：钟面长出一张脸，指针停在 11:59，红光从裂缝里透出来 */
 ny_midnight:function(g,W,H,t){
  skyGrad(g,W,H,'#12040e','#5a1630');stars(g,W,H,t,40);
  var cx=W*.5,cy=H*.46,R=H*.3,sh=Math.sin(t*38)*(t>0.6?2.4:0.6),rise=ease(t/2.2);cy=H*.46+(1-rise)*H*.4;
  glow(g,cx,cy,R*2.4,'#ff3a5a',.35+Math.sin(t*5)*.08);
  g.save();g.translate(cx+sh,cy);
  for(var k=-1;k<=1;k+=2){g.save();g.translate(k*R*.56,-R*.84);g.rotate(k*.5+Math.sin(t*30)*.06);g.fillStyle='#e8b83a';g.beginPath();g.arc(0,0,R*.3,Math.PI,0);g.closePath();g.fill();g.restore()}
  var rim=g.createRadialGradient(-R*.3,-R*.3,R*.2,0,0,R);rim.addColorStop(0,'#ff8a9a');rim.addColorStop(1,'#a01030');g.fillStyle=rim;g.beginPath();g.arc(0,0,R,0,6.283);g.fill();g.strokeStyle='#ffd23f';g.lineWidth=7;g.stroke();
  g.fillStyle='#fff6e0';g.beginPath();g.arc(0,0,R*.8,0,6.283);g.fill();
  g.fillStyle='#394862';g.font='bold '+Math.round(R*.16)+'px sans-serif';g.textAlign='center';g.textBaseline='middle';for(var i=0;i<12;i+=3){var a=i*Math.PI/6;g.fillText(String(i||12),Math.sin(a)*R*.68,-Math.cos(a)*R*.68)}g.textBaseline='alphabetic';
  g.strokeStyle='#22303f';g.lineCap='round';g.lineWidth=7;g.beginPath();g.moveTo(0,0);g.lineTo(Math.sin(6.26)*R*.4,-Math.cos(6.26)*R*.4);g.stroke();g.lineWidth=4;g.beginPath();g.moveTo(0,0);g.lineTo(Math.sin(6.2)*R*.6,-Math.cos(6.2)*R*.6);g.stroke();
  var eye=ease((t-1.4)/.8);g.fillStyle='#ff2a4a';for(var s=-1;s<=1;s+=2){g.beginPath();g.ellipse(s*R*.26,-R*.14,R*.1,R*.13*eye+1,0,0,6.283);g.fill();glow(g,s*R*.26,-R*.14,R*.2*eye,'#ff2a4a',.8*eye)}
  g.strokeStyle='#22303f';g.lineWidth=7;g.beginPath();g.moveTo(-R*.44,-R*.42);g.lineTo(-R*.1,-R*.28);g.moveTo(R*.44,-R*.42);g.lineTo(R*.1,-R*.28);g.stroke();
  var mo=ease((t-2.2)/.6);g.fillStyle='#3a1020';g.beginPath();g.ellipse(0,R*.34,R*.24,R*.05+R*.2*mo,0,0,6.283);g.fill();g.fillStyle='#fff';for(var q=-2;q<=2;q++)g.fillRect(q*R*.08-2,R*.34-R*.05-R*.2*mo,4,7);
  g.restore();
  g.fillStyle='#e8f2fa';g.fillRect(0,H*.9,W,H*.1);
  for(var f=0;f<26;f++){var x=hash(f)*W,y=H*.95-((t*50+f*60)%(H*.9));g.globalAlpha=.5;g.fillStyle=pal(f);g.fillRect(x,y,3,3)}g.globalAlpha=1;
  heroAt(g,W,H,t,W*.18,H*.92,'idle',0,Math.max(2,H/230))},
 /* 跨年烟花：夜空里一朵接一朵，雪镇灯火通明，同学们一起举着仙女棒 */
 ny_fireworks:function(g,W,H,t){
  skyGrad(g,W,H,'#040818','#1e2a5c');stars(g,W,H,t,90);
  for(var k=0;k<7;k++){var per=2.4,a=((t*.9+k*.55)%per),bx=W*(.1+hash(k+2)*.8),by=H*(.14+hash(k+9)*.3),col=pal(k+Math.floor((t*.9+k*.55)/per)),launch=.7;
   if(a<launch){var u=a/launch,py=H*.82-(H*.82-by)*(1-(1-u)*(1-u));g.fillStyle='#ffd23f';g.fillRect(bx-1.5,py,3,10);glow(g,bx,py,16,'#ffd23f',.7)}
   else if(a<launch+1.7){var b=(a-launch);glow(g,bx,by,H*.26*(1-b/1.7),col,.25*(1-b/1.7));for(var r=0;r<36;r++){var ang=r/36*6.283,sp=H*(.12+hash(r+k*7)*.16),d=sp*Math.min(1,b*1.4),px=bx+Math.cos(ang)*d,py2=by+Math.sin(ang)*d+b*b*H*.06;g.globalAlpha=Math.max(0,1-b/1.7);g.fillStyle=r%3?col:'#fff';g.fillRect(px-1.5,py2-1.5,3,3)}g.globalAlpha=1}}
  g.fillStyle='#10183a';g.beginPath();g.moveTo(0,H*.8);for(var i=0;i<=16;i++){g.lineTo(i*W/16,H*.8-(i%2?H*.05:H*.1)*(.6+hash(i)*.8))}g.lineTo(W,H*.8);g.fill();
  for(var w=0;w<22;w++){g.fillStyle=Math.sin(t*.8+w)>-.6?'#ffd98a':'#3a4658';g.fillRect(hash(w)*W,H*.73+hash(w+4)*H*.05,5,6)}
  g.fillStyle='#e8f2fa';g.fillRect(0,H*.84,W,H*.16);bunt(g,W,H,t,H*.04,H*.04,20,0);
  var fade=ease((t-1.2)/1.6);g.globalAlpha=fade;g.fillStyle='#ffe9a8';g.font='900 '+Math.round(H*.12)+'px "Noto Sans SC",sans-serif';g.textAlign='center';g.textBaseline='middle';glow(g,W/2,H*.3,H*.3,'#ffd23f',.25*fade);g.fillText('新年快乐',W/2,H*.3);g.font='bold '+Math.round(H*.045)+'px "Noto Sans SC",sans-serif';g.fillStyle='#ff9ad5';g.fillText('HAPPY NEW YEAR  ·  四班 Forever',W/2,H*.4);g.textBaseline='alphabetic';g.globalAlpha=1;
  snow(g,W,H,t,60);
  heroAt(g,W,H,t,W*.5,H*.92,'idle');
  [[.3,'a'],[.4,'b'],[.6,'c'],[.7,'d'],[.2,'e'],[.8,'f']].forEach(function(m,i){g.save();g.translate(W*m[0],H*.92);var s=Math.max(2,H/200);g.scale(s,s);NPCX.mate(g,0,0,0,0,t+i,Math.sin(t*2+i)*1.2,m[1]);
   var sx=8,sy=-30;g.strokeStyle='#fff6a0';g.lineWidth=1.2;for(var q=0;q<7;q++){var aa=q*.9+t*10;g.beginPath();g.moveTo(sx,sy);g.lineTo(sx+Math.cos(aa)*6,sy+Math.sin(aa)*6);g.stroke()}g.restore()})}
};
var _scene=G.scene;
G.scene=function(g,kind,W,H,t){var f=NYS[kind];if(f){g.save();f(g,W,H,t);g.restore()}else _scene.apply(this,arguments)};
})();
