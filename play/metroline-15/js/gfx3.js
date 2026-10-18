/* 画面（三）：黑板（物理公式）、横幅旗两种装饰；「同事老师」NPC；粉笔弹道。 */
(function(){
var G=window.GFX,ell=G.ell,glow=G.glow;
var FORMULAS=['F = ma','v = v₀ + at','E = ½mv²','p = mv','W = Fs','G = mg'];
var EX={
 blackboard:function(g,o,t,b){var x=o.x,y=o.y,w=o.w,h=o.h;
  g.fillStyle='#7a5a3a';g.beginPath();g.roundRect(x,y,w,h,6);g.fill();
  g.fillStyle='#24392f';g.beginPath();g.roundRect(x+5,y+5,w-10,h-10,4);g.fill();
  g.fillStyle='#e8f3ee';g.globalAlpha=.85;g.font='bold '+Math.min(15,h*.22)+'px "Noto Sans SC",sans-serif';g.textAlign='left';
  var i0=(Math.floor(o.x/32)+Math.floor(o.y/32))%FORMULAS.length;
  g.fillText(FORMULAS[i0],x+12,y+h*.36);g.fillText(FORMULAS[(i0+2)%FORMULAS.length],x+12,y+h*.62);
  g.strokeStyle='#e8f3ee';g.lineWidth=1.5;g.beginPath();g.moveTo(x+w*.55,y+h*.7);g.lineTo(x+w*.9,y+h*.35);g.lineTo(x+w*.9,y+h*.7);g.closePath();g.stroke();
  g.globalAlpha=1;g.fillStyle='#d9d2c4';g.fillRect(x+10,y+h-4,w*.3,3)},
 banner:function(g,o,t,b){var x=o.x,y=o.y,w=o.w,h=o.h,k=Math.sin(t*2.4+x*.05)*5;
  g.fillStyle='#4a5560';g.fillRect(x+w/2-2,y,4,h);g.fillStyle=b.accent;
  g.beginPath();g.moveTo(x+w/2+2,y+4);g.quadraticCurveTo(x+w/2+22,y+10+k,x+w/2+34,y+8);g.lineTo(x+w/2+34,y+h*.55);g.quadraticCurveTo(x+w/2+20,y+h*.55+k,x+w/2+2,y+h*.55+4);g.closePath();g.fill();
  g.fillStyle='#fff';g.globalAlpha=.6;g.font='bold 12px "Noto Sans SC",sans-serif';g.textAlign='center';g.fillText('15',x+w/2+18,y+h*.3+k*.4);g.globalAlpha=1}
};
var _thing=G.thing;
G.thing=function(g,o,t,biome,lvlH){var f=EX[o.kind];if(f){g.save();f(g,o,t,G.B(biome));g.restore()}else _thing(g,o,t,biome,lvlH)};
/* 同事老师：借用旅客的造型 */
var NPC_ALIAS={colleague:'traveler'},_npc=G.npc;
G.npc=function(g,kind,x,y,w,h,t,face){return _npc(g,NPC_ALIAS[kind]||kind,x,y,w,h,t,face)};
/* 粉笔：一小截白色圆柱，带旋转 */
G.chalk=function(g,q,t){g.save();g.translate(q.x,q.y);g.rotate(t*18);glow(g,0,0,14,'#ffffff',.35);
 g.fillStyle='#fbfbf4';g.beginPath();g.roundRect(-7,-3,14,6,3);g.fill();g.fillStyle='#d7d7c6';g.fillRect(2,-3,3,6);g.restore()};
})();
