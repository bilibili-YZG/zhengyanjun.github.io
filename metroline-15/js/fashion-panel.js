/* 时装面板（独立文件，加载在 game.js 之后）：
   身体 4 套（2 男 2 女）+ 头贴图 2 张（郑脸 zyj.png / 胡脸 hq.png）。
   主菜单「👔 时装」按钮打开；选中立刻生效并写入本地偏好。
   手柄可用：十字键在卡片间移动，A 键选中。 */
(function(){
var $=function(id){return document.getElementById(id)};
function qa(sel){return Array.prototype.slice.call(document.querySelectorAll(sel))}
function pref(){return window.L15Game?L15Game.getFashionPref():{outfit:0,face:0}}

/* 用引擎同一套 hero() 画预览，所见即所得 */
function drawPreview(cv,outfit,face,scale){
 var x=cv.getContext('2d'),W=cv.width,H=cv.height;
 x.clearRect(0,0,W,H);
 var sc=scale||(W/48);
 x.save();x.translate(W/2,H-12);x.scale(sc,sc);
 var keep=GFX.fashion;GFX.setFashion(outfit,face);
 var acc=(GFX.B((L15.curBiome)||'snow')||{}).accent||'#7fe3e6';
 GFX.hero(x,{cx:0,cy:0,face:1,vx:0,vy:0,ground:true,anim:0,state:'idle',sx:1,sy:1,atk:0},performance.now()/1000,acc,1);
 GFX.setFashion(keep.outfit,keep.face);x.restore()}

function updatePreview(){
 var p=pref(),o=GFX.OUTFITS[p.outfit],f=GFX.FACES[p.face];
 var cv=$('fitCanvas');if(cv)drawPreview(cv,p.outfit,p.face,cv.width/48);
 var n=$('fitName'),d=$('fitDesc');
 if(n)n.textContent=o.n+' · '+f.n;
 if(d)d.textContent=o.g+'装 · 头贴图「'+f.n+'」';
 qa('#fitBody .fit-card').forEach(function(c){c.classList.toggle('on',+c.dataset.fit===p.outfit)});
 qa('#fitFace .fit-face').forEach(function(c){c.classList.toggle('on',+c.dataset.face===p.face)})}

function render(){
 var body=$('fitBody'),face=$('fitFace');if(!body||!face)return;
 body.innerHTML='';face.innerHTML='';
 GFX.OUTFITS.forEach(function(o,i){
  var d=document.createElement('div');d.className='fit-card';d.tabIndex=0;d.dataset.fit=i;
  var cv=document.createElement('canvas');cv.width=64;cv.height=80;d.appendChild(cv);
  var b=document.createElement('b');b.textContent=o.n;d.appendChild(b);
  var s=document.createElement('small');s.textContent=o.g;d.appendChild(s);
  body.appendChild(d);
  drawPreview(cv,i,pref().face,1.5);
  d.addEventListener('click',function(){pick(i,null)});
  d.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();pick(i,null)}});
 });
 GFX.FACES.forEach(function(f,i){
  var d=document.createElement('div');d.className='fit-face';d.tabIndex=0;d.dataset.face=i;
  var im=document.createElement('img');im.src=f.src;im.alt=f.n;d.appendChild(im);
  var b=document.createElement('b');b.textContent=f.n;d.appendChild(b);
  face.appendChild(d);
  d.addEventListener('click',function(){pick(null,i)});
  d.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();pick(null,i)}});
 });
 updatePreview()}

function pick(o,f){
 var p=pref();
 if(o!=null)p.outfit=o;if(f!=null)p.face=f;
 if(window.L15Game)L15Game.setFashionPref(p.outfit,p.face);
 updatePreview();
 if(window.AudioFX)AudioFX.sfx('select')}

function init(){
 var btn=$('fashionBtn');if(btn)btn.addEventListener('click',function(){if(window.AudioFX){AudioFX.init();AudioFX.sfx('select')}render();$('fashion').classList.remove('hidden')});
 var cl=$('closeFashion');if(cl)cl.addEventListener('click',function(){if(window.AudioFX)AudioFX.sfx('select');$('fashion').classList.add('hidden')});
 $('fashion').addEventListener('click',function(e){if(e.target===$('fashion')){$('fashion').classList.add('hidden')}});
 /* 面板打开时把当前时装应用到引擎（万一在别的界面改过） */
 var p=pref();if(window.L15Game)L15Game.setFashionPref(p.outfit,p.face);}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
