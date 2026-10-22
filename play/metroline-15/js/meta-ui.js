/* 三个页面的界面：存档页、成就·晶体页、图鉴页。只负责画界面，具体动作由 game.js 通过 init() 传进来。 */
window.MetaUI=(function(){
var $=function(id){return document.getElementById(id)},D=window.L15_META_DATA,api=null,saveMode='menu',codexCat='creature';
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function init(a){api=a;
 $('saveList').addEventListener('click',function(e){var b=e.target.closest('[data-sact]');if(!b||b.disabled)return;api.slotAction(b.dataset.sact,+b.dataset.i,saveMode)});
 $('codexTabs').addEventListener('click',function(e){var b=e.target.closest('[data-cat]');if(!b)return;codexCat=b.dataset.cat;renderCodex()})}
/* ---------- 存档页 ---------- */
function fmtTime(sec){sec=Math.round(sec||0);if(sec<60)return sec+' 秒';var m=Math.floor(sec/60);return m<60?m+' 分钟':Math.floor(m/60)+' 小时 '+(m%60)+' 分钟'}
function fmtDate(t){if(!t)return '';var d=new Date(t),p=function(n){return String(n).padStart(2,'0')};return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+' '+p(d.getHours())+':'+p(d.getMinutes())}
function renderSaves(mode){saveMode=mode;var slots=Meta.slots(),camp=api.campaign(),act=api.activeSlot(),html='';
 $('savesTitle').textContent=mode==='new'?'选择存档位 · 开始新旅程':mode==='pause'?'存档管理':'存档';
 $('savesHint').textContent=mode==='new'?'新旅程会从序章开始，写入你选的存档位（已有存档会被覆盖）。':mode==='pause'?'把当前进度保存到一个存档位；信标灯与过关时还会自动存到当前使用的存档位。':'读取、覆盖或删除存档。信标灯与过关时会自动存到当前使用的存档位。';
 slots.forEach(function(s,i){var cur=i===act,body,btns='';
  if(s){var ch=camp.chapters[Math.min(s.ci,camp.chapters.length-1)],lv=ch.levels[Math.min(s.li,ch.levels.length-1)],st=s.stats||{};
   body='<div class="slot-main">'+esc(ch.name)+' · '+esc(lv.name)+(s.cleared?'　<em>已通关</em>':'')+'</div><div class="slot-sub">◇ '+(s.shards||0)+' 枚碎片 · 倒下 '+(st.deaths||0)+' 次 · 游玩 '+fmtTime(st.time)+'</div><div class="slot-date">'+fmtDate(s.t)+'</div>';
   if(mode==='new')btns='<button class="btn danger" data-sact="start" data-i="'+i+'">覆盖并开始新旅程</button>';
   else if(mode==='pause')btns='<button class="btn primary" data-sact="save" data-i="'+i+'">保存到此处（覆盖）</button><button class="btn" data-sact="load" data-i="'+i+'">读取</button><button class="btn danger" data-sact="del" data-i="'+i+'">删除</button>';
   else btns='<button class="btn primary" data-sact="load" data-i="'+i+'">读取</button><button class="btn danger" data-sact="del" data-i="'+i+'">删除</button>'}
  else{body='<div class="slot-main muted">空存档</div><div class="slot-sub">还没有记录</div>';
   if(mode==='new')btns='<button class="btn primary" data-sact="start" data-i="'+i+'">在此开始新旅程</button>';
   else if(mode==='pause')btns='<button class="btn primary" data-sact="save" data-i="'+i+'">保存到此处</button>'}
  if(mode!=='new')btns+=(s?'<button class="btn" data-sact="exp" data-i="'+i+'">导出</button>':'')+'<button class="btn" data-sact="imp" data-i="'+i+'">导入覆盖</button>';
  html+='<div class="slot'+(s?'':' empty')+(cur?' current':'')+'"><div class="slot-h"><b>存档 '+(i+1)+'</b>'+(cur?'<span class="tag">使用中</span>':'')+'</div>'+body+'<div class="slot-btns">'+btns+'</div></div>'});
 $('saveList').innerHTML=html}
/* ---------- 成就 · 晶体 ---------- */
function renderAchv(){var camp=api.campaign(),info=Meta.summary(camp),m=Meta.data,h='';
 h+='<div class="crystal-top"><div class="big">◇ '+info.have+' <small>/ '+info.total+'</small></div><div class="muted">累计找回的信标碎片（所有存档合计，换存档不会丢）</div></div><div class="crystal-ch">';
 camp.chapters.forEach(function(ch,ci){var c=info.ch[ci],pct=c.total?Math.round(c.have/c.total*100):0,bi=GFX.B(ch.biome);
  h+='<div class="cc" style="--tint:'+bi.accent+'"><div class="cc-h"><b>第'+'一二三四五六七八九十'.charAt(ci)+'章 · '+esc(ch.name)+'</b><span>'+c.have+' / '+c.total+(c.have>=c.total&&c.total?' ✓':'')+'</span></div><div class="bar"><i style="width:'+pct+'%"></i></div><div class="rooms-chips">';
  c.rooms.forEach(function(r){h+='<span class="chip'+(r.total&&r.have>=r.total?' full':'')+'" title="'+esc(r.name)+'">'+esc(r.name.replace(/^(\d+)\s*·.*/,'$1'))+'<em>'+r.have+'/'+r.total+'</em></span>'});
  h+='</div></div>'});
  var blueBlock='';(window.DLC_REGISTRY||[]).forEach(function(dl){var dc=window.getDLCCampaign&&window.getDLCCampaign(dl);if(!dc||!dc.chapters)return;var yel=!!dc.requireYellow,bi=yel?Meta.yellowShardInfo(dc):Meta.blueShardInfo(dc);if(!bi.total)return;
  blueBlock+='<div class="crystal-top"><div class="big" style="color:'+(yel?'#ffd84a':'#6db8ff')+'">◆ '+bi.have+' <small>/ '+bi.total+'</small></div><div class="muted">'+esc(dl.name)+' · '+(yel?'黄色水晶':'蓝色碎片')+'（DLC 专属）</div></div><div class="crystal-ch">';
  dc.chapters.forEach(function(ch,ci){var c=bi.ch[ci]||{have:0,total:0,rooms:[]},pct=c.total?Math.round(c.have/c.total*100):0,bi2=GFX.B(ch.biome);
   blueBlock+='<div class="cc" style="--tint:'+bi2.accent+'"><div class="cc-h"><b>'+esc(ch.name)+'</b><span>'+c.have+' / '+c.total+(c.have>=c.total&&c.total?' ✓':'')+'</span></div><div class="bar"><i style="width:'+pct+'%"></i></div></div>'});
  blueBlock+='</div>'});
 h+='</div>'+blueBlock+'<h3 class="sec">成就 <small>'+D.ACH.filter(function(a){return m.ach[a.id]}).length+' / '+D.ACH.length+'</small></h3><div class="ach-grid">';
 D.ACH.forEach(function(a){var got=m.ach[a.id],p=a.prog(m,info),pc=p&&p[1]?Math.min(100,Math.round(p[0]/p[1]*100)):0;
  h+='<div class="ach'+(got?' got':'')+'"><div class="ach-i">'+(got?'★':'☆')+'</div><div class="ach-b"><b>'+esc(a.n)+'</b><span>'+esc(a.d)+'</span>'+(got?'<em>'+fmtDate(got)+' 解锁</em>':(p?'<div class="bar sm"><i style="width:'+pc+'%"></i></div><em>'+p[0]+' / '+p[1]+'</em>':''))+'</div></div>'});
 h+='</div>';$('achvBody').innerHTML=h}
/* ---------- 图鉴 ---------- */
function drawIcon(c,e,seen){var S=c.width,g=c.getContext('2d'),G=window.GFX,k=e.k,inf=L15.INFO[k.indexOf('boss_')===0?'boss':k]||{w:1,h:1},T=32,t=1.3;g.clearRect(0,0,S,S);g.save();
 try{
  if(e.cat==='creature'&&k.indexOf('boss_')===0){var bs=(S-8)/200;g.translate(S/2,S*.52);g.scale(bs,bs);G.boss(g,{type:k.slice(5),x:-96,y:-96,w:192,h:192,flash:0,face:1,state:'idle',timer:1,phase:0,hp:10,max:10,vx:0,atk:''},t)}
  else if(e.cat==='creature'){var w=inf.w*T,h=inf.h*T,s=Math.min((S-14)/w,(S-14)/h,1.7);g.translate(S/2,S/2);g.scale(s,s);G.enemy(g,{kind:k,x:-w/2,y:-h/2,w:w,h:h,flash:0,face:1,alpha:.85,aim:0,charge:0,hp:1},t,'forest')}
  else if(e.cat==='npc'){var s2=(S-8)/78;g.translate(S/2,S*.92);g.scale(s2,s2);G.npc(g,k,-16,-64,32,64,t,1)}
  else if(e.cat==='terrain'){var set=G.tiles('forest'),v={ground:1,thin:2,bounce:3,brick:4,ice:5}[k],o={up:true,down:false,left:false,right:false},n=v===1?2:2;g.translate(S/2,S/2);var s3=(S-16)/(T*2);g.scale(s3,s3);g.translate(-T,-T/2);
   for(var i=0;i<2;i++){G.drawTile(g,set,v,i,0,o);if(v===1)G.drawTile(g,set,v,i,1,{up:false,down:false,left:false,right:false})}}
  else{var w2=inf.w*T,h2=inf.h*T;if(k==='lava'){w2=96;h2=40}if(k==='laser'){w2=32;h2=160}if(k==='vine'){w2=32;h2=170}if(k==='spore'){w2=64;h2=96}if(k==='exit'||k==='sign'){}
   var s4=Math.min((S-14)/w2,(S-14)/h2,2.2);g.translate(S/2,S/2);g.scale(s4,s4);var o2={kind:k,x:-w2/2,y:-h2/2,w:w2,h:h2,p:{period:3,hold:0,dir:1,strength:800,delay:.5,dx:0,dy:0,speed:60},on:true,lit:true,active:true,run:true,open:false,openT:0,sq:0,hp:2,max:2,dead:false,reach:150,warn:false,dirx:1,gone:false,shake:false,st:'idle'};
   if(k==='saw'){w2=h2=64}
   if(k==='checkpoint')o2.lit=true;G.thing(g,o2,t,'forest',400)}
 }catch(err){}
 g.restore();
 if(!seen){g.globalCompositeOperation='source-atop';g.fillStyle='#0a1422';g.fillRect(0,0,S,S);g.globalCompositeOperation='source-over'}}
function renderCodex(){var m=Meta.data,tabs='',ALL=Meta.entries(),list=ALL.filter(function(e){return e.cat===codexCat}),all=ALL.length,seenAll=ALL.filter(function(e){return m.seen[e.k]}).length;
 D.CATS.forEach(function(c){var tot=ALL.filter(function(e){return e.cat===c[0]}),sn=tot.filter(function(e){return m.seen[e.k]}).length;if(!tot.length)return;
  tabs+='<button class="ctab'+(c[0]===codexCat?' on':'')+'" data-cat="'+c[0]+'">'+c[1]+'<em>'+sn+'/'+tot.length+'</em></button>'});
 $('codexTabs').innerHTML=tabs;$('codexCount').textContent=seenAll+' / '+all;
 var box=$('codexGrid');box.innerHTML='';
 list.forEach(function(e){var sn=!!m.seen[e.k],card=document.createElement('div');card.className='cx'+(sn?'':' unseen');
  var cv=document.createElement('canvas');cv.width=cv.height=96;card.appendChild(cv);
  var d=document.createElement('div');d.className='cx-t';d.innerHTML=sn?'<b>'+esc(e.n)+'</b><span>'+esc(e.d)+'</span>':'<b>？？？</b><span>还没有遇到过。继续往前走，在旅途中会遇见它。</span>';card.appendChild(d);box.appendChild(card);drawIcon(cv,e,sn)})}
return {init:init,renderSaves:renderSaves,renderAchv:renderAchv,renderCodex:renderCodex};
})();
