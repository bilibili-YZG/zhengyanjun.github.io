/* 画面（三）：黑板（物理公式）、横幅旗两种装饰；「同事老师」NPC；粉笔弹道。 */
(function(){
var G=window.GFX,ell=G.ell,glow=G.glow;
var FORMULAS=['F = ma','v = v₀ + at','E = ½mv²','p = mv','W = Fs','G = mg','v = s / t','ρ = m / V','p = F / S','I = U / R','P = UI','Q = I²Rt','F浮 = ρ液gV排','η = W有 / W总','Ek = ½mv²','Ep = mgh','f = μN','n = sinθ₁ / sinθ₂'];
var EX={
 /* 黑板：字号按板宽自适应，长公式自动换行，行距不重叠；右侧画一小块粉笔槽而不是压在字上的三角形 */
 blackboard:function(g,o,t,b){var x=o.x,y=o.y,w=o.w,h=o.h;
  g.fillStyle='#7a5a3a';g.beginPath();g.roundRect(x,y,w,h,6);g.fill();
  g.fillStyle='#24392f';g.beginPath();g.roundRect(x+5,y+5,w-10,h-10,4);g.fill();
  var i0=(Math.floor(o.x/32)+Math.floor(o.y/32))%FORMULAS.length,own=o.label&&o.label.indexOf('=')>=0?o.label.split('；'):null;
  var lines=[];if(own){own.slice(0,3).forEach(function(s){lines.push(s)})}else{lines.push(FORMULAS[i0]);lines.push(FORMULAS[(i0+2)%FORMULAS.length])}
  /* 粉笔槽（画在板面下缘，不再有三角形压住文字） */
  g.fillStyle='#d9d2c4';g.fillRect(x+10,y+h-5,w*.34,3);
  /* 字号自适应：从 15px 往下试，每个字号都重新排版（换行 + 高度），
     取第一个"宽度不超、全部行装得进板面"的字号；都装不下就用最小的并压缩行距。 */
  var pad=12,avail=w-pad*2,innerH=h-12,fs=15,all=[],gap=0,found=false;
  function wrapAt(s,px){g.font='bold '+px+'px "Noto Sans SC",sans-serif';
   var out=[],cur='';for(var i=0;i<s.length;i++){cur+=s[i];if(g.measureText(cur).width>avail){out.push(cur.slice(0,-1));cur=s[i]}}if(cur)out.push(cur);return out}
  for(var f=15;f>=8;f--){
   var cand=[];lines.forEach(function(s){cand=cand.concat(wrapAt(s,f))});
   var gp=f*1.15+1;
   if(cand.length*gp<=innerH){fs=f;all=cand;gap=gp;found=true;break}
   if(f===8){fs=8;all=cand}
  }
  if(!found){
   /* 最小字号仍装不下：压行距到刚好铺满板面（字号保持 8） */
   gap=Math.max(8,innerH/Math.max(1,all.length));
   fs=Math.min(fs,gap/1.15);
  }
  g.font='bold '+fs+'px "Noto Sans SC",sans-serif';
  g.fillStyle='#e8f3ee';g.globalAlpha=.9;g.textAlign='left';g.textBaseline='middle';
  var ty=y+9+gap/2;
  all.forEach(function(s){g.fillText(s,x+pad,ty);ty+=gap});
  g.textBaseline='alphabetic';g.globalAlpha=1},
 banner:function(g,o,t,b){var x=o.x,y=o.y,w=o.w,h=o.h,k=Math.sin(t*2.4+x*.05)*5;
  g.fillStyle='#4a5560';g.fillRect(x+w/2-2,y,4,h);g.fillStyle=b.accent;
  g.beginPath();g.moveTo(x+w/2+2,y+4);g.quadraticCurveTo(x+w/2+22,y+10+k,x+w/2+34,y+8);g.lineTo(x+w/2+34,y+h*.55);g.quadraticCurveTo(x+w/2+20,y+h*.55+k,x+w/2+2,y+h*.55+4);g.closePath();g.fill();
  g.fillStyle='#fff';g.globalAlpha=.6;g.font='bold 12px "Noto Sans SC",sans-serif';g.textAlign='center';g.fillText('15',x+w/2+18,y+h*.3+k*.4);g.globalAlpha=1}
};
EX.crate=function(g,o){var x=o.x,y=o.y,w=o.w,h=o.h;g.fillStyle='#a8794a';g.fillRect(x+2,y+2,w-4,h-2);g.strokeStyle='#6d4a2a';g.lineWidth=3;g.strokeRect(x+3,y+3,w-6,h-4);g.beginPath();g.moveTo(x+3,y+3);g.lineTo(x+w-3,y+h-1);g.moveTo(x+w-3,y+3);g.lineTo(x+3,y+h-1);g.stroke()};
EX.flower=function(g,o,t){var n=Math.max(3,Math.round(o.w/10)),i;for(i=0;i<n;i++){var px=o.x+(i+.5)*o.w/n,sw=Math.sin(t*2+i)*2,hh=12+(i%2)*6;g.strokeStyle='#3f9a55';g.lineWidth=2;g.beginPath();g.moveTo(px,o.y+o.h);g.lineTo(px+sw,o.y+o.h-hh);g.stroke();g.fillStyle=['#ff9fb6','#ffe27a','#c9a7ff'][i%3];ell(g,px+sw,o.y+o.h-hh-2,4,4);g.fill()}};
EX.cloud=function(g,o,t){var x=o.x+Math.sin(t*.3)*6,y=o.y;g.fillStyle='#fff';g.globalAlpha=.55;[[.25,.6,.22],[.45,.4,.28],[.68,.55,.24],[.5,.7,.3]].forEach(function(c){ell(g,x+o.w*c[0],y+o.h*c[1],o.w*c[2],o.h*c[2]*1.1);g.fill()})};
EX.arrow=function(g,o){var x=o.x,y=o.y,w=o.w,h=o.h;g.fillStyle='#ffd27a';g.beginPath();g.moveTo(x+4,y+h*.35);g.lineTo(x+w*.6,y+h*.35);g.lineTo(x+w*.6,y+h*.1);g.lineTo(x+w-4,y+h*.5);g.lineTo(x+w*.6,y+h*.9);g.lineTo(x+w*.6,y+h*.65);g.lineTo(x+4,y+h*.65);g.closePath();g.fill()};
EX.chain=function(g,o,t){var cx=o.x+o.w/2,sw=Math.sin(t*1.5)*2;g.strokeStyle='#9fb0c0';g.lineWidth=2.5;for(var y=o.y;y<o.y+o.h-8;y+=12){g.beginPath();g.ellipse(cx+sw*(y-o.y)/o.h,y+6,4,6,0,0,Math.PI*2);g.stroke()}};
EX.lantern=function(g,o,t){var cx=o.x+o.w/2,y=o.y;g.strokeStyle='#4a5560';g.lineWidth=2;g.beginPath();g.moveTo(cx,y);g.lineTo(cx,y+o.h*.3);g.stroke();glow(g,cx,y+o.h*.6,34,'#ffb36a',.4+Math.sin(t*3+o.x)*.08);g.fillStyle='#e0793a';g.beginPath();g.roundRect(cx-9,y+o.h*.3,18,o.h*.5,6);g.fill();g.fillStyle='#ffe69a';g.fillRect(cx-4,y+o.h*.4,8,o.h*.3)};
var _thing=G.thing;
G.thing=function(g,o,t,biome,lvlH){var f=EX[o.kind];if(f){g.save();f(g,o,t,G.B(biome));g.restore()}else _thing(g,o,t,biome,lvlH)};
/* 同事老师：借用旅客的造型 */
var NPC_ALIAS={colleague:'traveler',shopkeeper:'stationmaster',grandpa:'worker',pupil:'student',dog:'cat'},_npc=G.npc;
G.npc=function(g,kind,x,y,w,h,t,face){return _npc(g,NPC_ALIAS[kind]||kind,x,y,w,h,t,face)};
/* 粉笔：一小截白色圆柱，带旋转 */
G.chalk=function(g,q,t){g.save();g.translate(q.x,q.y);g.rotate(t*18);glow(g,0,0,14,'#ffffff',.35);
 g.fillStyle='#fbfbf4';g.beginPath();g.roundRect(-7,-3,14,6,3);g.fill();g.fillStyle='#d7d7c6';g.fillRect(2,-3,3,6);g.restore()};
})();
