/* 15号线大冒险 · 关卡工坊
   - 直接编辑主线（章节 / 房间 / 顺序 / 剧情 / 对话），格式与游戏完全一致
   - 用游戏自己的贴图绘制地图（所见即所得）
   - 草稿自动保存在本机；“发布到游戏”后游戏立即使用新主线；“试玩本关”直接打开游戏测试
   - 鼠标 / 键盘 / 触屏（双指缩放、拖动平移）均可操作 */
(function(){'use strict';
var $=function(id){return document.getElementById(id)},T=L15.T,INFO=L15.INFO,CELL=L15.CELL;
var LS={get:function(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){toast('保存失败：浏览器存储空间不足');return false}},del:function(k){try{localStorage.removeItem(k)}catch(e){}}};
var DRAFT='line15-editor-draft-v3',PASS='line15-editor-pass-hash';
function clone(o){return JSON.parse(JSON.stringify(o))}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var toastT;function toast(s,ms){var t=$('toast');t.textContent=s;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('show')},ms||2200)}

/* ================= 数据 ================= */
var OLD_KIND={storySign:'sign',warningSign:'sign'};
function normLevel(l){
  l.width=clamp(+l.width||60,20,240);l.height=clamp(+l.height||18,12,60);l.name=l.name||'新房间';l.background=L15.BIOMES[l.background]?l.background:'snow';
  l.objective=l.objective||'';l.intro=l.intro||'';
  var cells=[];for(var y=0;y<l.height;y++){var r=[];for(var x=0;x<l.width;x++){var v=l.cells&&l.cells[y]?+l.cells[y][x]||0:0;r.push(v>=0&&v<=5?v:0)}cells.push(r)}l.cells=cells;
  var dropped=0;l.objects=(l.objects||[]).map(function(o){var k=OLD_KIND[o.kind]||o.kind,d=INFO[k];if(!d){dropped++;return null}
    var p={},key;for(key in d.p)p[key]=d.p[key];for(key in (o.props||{}))p[key]=o.props[key];
    return{id:o.id||L15.uid(),type:d.g,kind:k,x:+o.x||0,y:+o.y||0,w:Math.max(1,+o.w||d.w),h:Math.max(1,+o.h||d.h),label:o.label||d.n,dialogue:o.dialogue||'',props:p}}).filter(Boolean);
  var ids={};l.objects.forEach(function(o){ids[o.id]=1});l.links=(l.links||[]).filter(function(k){return ids[k.from]&&ids[k.to]}).map(function(k){return{from:k.from,to:k.to}});
  l._dropped=dropped;return l}
function normCampaign(c){
  if(!c||!Array.isArray(c.chapters)||!c.chapters.length)throw Error('文件里没有章节数据');
  c.format='line15-campaign';c.version=3;c.name=c.name||'15号线大冒险 · 主线';c.prologue=Array.isArray(c.prologue)?c.prologue:[];c.epilogue=Array.isArray(c.epilogue)?c.epilogue:[];
  c.chapters.forEach(function(ch,i){ch.id=ch.id||('c'+i+L15.uid());ch.name=ch.name||('第'+(i+1)+'章');ch.subtitle=ch.subtitle||'';
    if(!Array.isArray(ch.levels)||!ch.levels.length)ch.levels=[L15.blankLevel('01 · 新房间')];
    ch.levels.forEach(normLevel);ch.biome=L15.BIOMES[ch.biome]?ch.biome:ch.levels[0].background;ch.intro=Array.isArray(ch.intro)?ch.intro:[];ch.outro=Array.isArray(ch.outro)?ch.outro:[]});
  return c}
function strip(c){var o=clone(c);o.chapters.forEach(function(ch){ch.levels.forEach(function(l){delete l._dropped})});return o}
var proj,ci=0,li=0;
function loadInitial(){var d=LS.get(DRAFT);try{if(d&&d.campaign){proj=normCampaign(d.campaign);ci=clamp(d.ci||0,0,proj.chapters.length-1);li=clamp(d.li||0,0,proj.chapters[ci].levels.length-1);return}}catch(e){}
  var pub=LS.get(L15.STORAGE.campaign);try{proj=normCampaign(pub?clone(pub):clone(window.CAMPAIGN_DEFAULT))}catch(e){proj=normCampaign(clone(window.CAMPAIGN_DEFAULT))}}
function chap(){return proj.chapters[ci]}
function cur(){return proj.chapters[ci].levels[li]}
function obj(id){var l=cur();for(var i=0;i<l.objects.length;i++)if(l.objects[i].id===id)return l.objects[i];return null}

/* 撤销 / 重做 / 自动保存 */
var undo=[],redo=[],pending=null,saveT=null;
function snap(){return JSON.stringify({p:proj,ci:ci,li:li})}
function begin(){pending=snap()}
function touch(){if(pending!==null){undo.push(pending);if(undo.length>100)undo.shift();redo=[];pending=null;updUndo()}}
function change(){begin();touch()}           // 立即记录一步
function restore(s){var o=JSON.parse(s);proj=o.p;ci=clamp(o.ci,0,proj.chapters.length-1);li=clamp(o.li,0,proj.chapters[ci].levels.length-1);sel=null;tilesDirty=true;refreshAll()}
function doUndo(){if(!undo.length)return;redo.push(snap());restore(undo.pop());updUndo();saved();toast('已撤销',900)}
function doRedo(){if(!redo.length)return;undo.push(snap());restore(redo.pop());updUndo();saved();toast('已重做',900)}
function updUndo(){$('undoBtn').disabled=!undo.length;$('redoBtn').disabled=!redo.length}
function saved(){clearTimeout(saveT);saveT=setTimeout(function(){LS.set(DRAFT,{campaign:strip(proj),ci:ci,li:li,t:Date.now()});var pub=LS.get(L15.STORAGE.campaign),same=JSON.stringify(strip(proj))===JSON.stringify(pub||null);
  var el=$('dirtyInfo');el.textContent=pub?(same?'草稿与游戏中的主线一致':'草稿有未发布的修改'):'游戏正在使用默认主线 · 草稿已自动保存';el.classList.toggle('dirty',!!pub&&!same||!pub&&JSON.stringify(strip(proj))!==JSON.stringify(strip(normCampaign(clone(window.CAMPAIGN_DEFAULT)))))},300)}

/* ================= 主线结构 ================= */
var biomeOpts=Object.keys(L15.BIOMES).map(function(k){return '<option value="'+k+'">'+L15.BIOMES[k].name+'（'+L15.BIOMES[k].music+'）</option>'}).join('');
$('chBiome').innerHTML=biomeOpts;$('lvBg').innerHTML=biomeOpts;
function renderTree(){var box=$('tree');box.innerHTML='';
  proj.chapters.forEach(function(ch,i){var d=document.createElement('div');d.className='chap'+(i===ci?' sel':'');d.style.setProperty('--tint',(L15.BIOMES[ch.biome]||L15.BIOMES.snow).sky[0]);
    var h=document.createElement('div');h.className='chap-h';h.innerHTML='<b>'+(i+1)+'. '+esc(ch.name)+'</b>';
    h.appendChild(btn('↑','章节上移',function(){moveChapter(i,-1)}));h.appendChild(btn('↓','章节下移',function(){moveChapter(i,1)}));h.appendChild(btn('✕','删除章节',function(){delChapter(i)}));
    h.onclick=function(e){if(e.target.tagName==='BUTTON')return;selectLevel(i,i===ci?li:0)};d.appendChild(h);
    ch.levels.forEach(function(l,j){var r=document.createElement('div');r.className='lvl'+(i===ci&&j===li?' sel':'')+(l.objects.some(function(o){return o.kind==='boss'})?' boss':'');
      r.innerHTML='<span>'+esc(l.name)+'</span>';r.appendChild(btn('↑','上移（可移到上一章）',function(){moveLevel(i,j,-1)}));r.appendChild(btn('↓','下移（可移到下一章）',function(){moveLevel(i,j,1)}));r.appendChild(btn('⧉','复制房间',function(){dupLevel(i,j)}));r.appendChild(btn('✕','删除房间',function(){delLevel(i,j)}));
      r.onclick=function(e){if(e.target.tagName==='BUTTON')return;selectLevel(i,j)};d.appendChild(r)});
    var a=document.createElement('button');a.className='add-lvl';a.textContent='＋ 在本章末尾添加房间';a.onclick=function(){addLevel(i)};d.appendChild(a);
    box.appendChild(d)})}
function btn(t,title,fn){var b=document.createElement('button');b.className='mini';b.textContent=t;b.title=title;b.onclick=function(e){e.stopPropagation();fn()};return b}
function selectLevel(i,j){ci=i;li=clamp(j,0,proj.chapters[i].levels.length-1);sel=null;linkFrom=null;tilesDirty=true;refreshAll();fit();saved()}
function moveChapter(i,d){var n=i+d;if(n<0||n>=proj.chapters.length)return;change();var a=proj.chapters;var t=a[i];a[i]=a[n];a[n]=t;if(ci===i)ci=n;else if(ci===n)ci=i;refreshAll();saved()}
function delChapter(i){if(proj.chapters.length<=1){toast('至少保留一个章节');return}if(!confirm('删除章节「'+proj.chapters[i].name+'」及其全部 '+proj.chapters[i].levels.length+' 个房间？（可撤销）'))return;change();proj.chapters.splice(i,1);ci=clamp(ci>=i?ci-1:ci,0,proj.chapters.length-1);li=0;tilesDirty=true;refreshAll();fit();saved()}
$('addChapter').onclick=function(){change();var bi=chap().biome||'snow',l=L15.blankLevel('01 · 新房间');l.background=bi;proj.chapters.push({id:'c'+L15.uid(),name:'新章节',subtitle:'',biome:bi,intro:[],outro:[],levels:[l]});selectLevel(proj.chapters.length-1,0);saved();toast('已新增章节，可在下方修改章节名与剧情')};
function addLevel(i){change();var ch=proj.chapters[i],l=L15.blankLevel(String(ch.levels.length+1).padStart(2,'0')+' · 新房间');l.background=ch.biome||'snow';ch.levels.push(l);selectLevel(i,ch.levels.length-1);saved()}
function dupLevel(i,j){change();var src=proj.chapters[i].levels[j],c=clone(src),map={};c.objects.forEach(function(o){var n=L15.uid();map[o.id]=n;o.id=n});c.links=c.links.map(function(k){return{from:map[k.from],to:map[k.to]}});c.name=src.name+' 副本';proj.chapters[i].levels.splice(j+1,0,c);selectLevel(i,j+1);saved()}
function delLevel(i,j){var ch=proj.chapters[i];if(ch.levels.length<=1){toast('每章至少保留一个房间；可删除整章');return}if(!confirm('删除房间「'+ch.levels[j].name+'」？（可撤销）'))return;change();ch.levels.splice(j,1);if(ci===i&&li>=j)li=Math.max(0,li-1);tilesDirty=true;refreshAll();saved()}
function moveLevel(i,j,d){var A=proj.chapters,ch=A[i],n=j+d;change();
  if(n>=0&&n<ch.levels.length){var t=ch.levels[j];ch.levels[j]=ch.levels[n];ch.levels[n]=t;if(ci===i&&li===j)li=n;else if(ci===i&&li===n)li=j}
  else{var ti=i+d;if(ti<0||ti>=A.length){undo.pop();return}if(ch.levels.length<=1){undo.pop();toast('这是本章唯一的房间，不能移出');return}
    var lv=ch.levels.splice(j,1)[0];if(d<0)A[ti].levels.push(lv);else A[ti].levels.unshift(lv);ci=ti;li=d<0?A[ti].levels.length-1:0;toast('已移到「'+A[ti].name+'」')}
  tilesDirty=true;refreshAll();saved()}
/* 章节字段 */
function lines(a){return (a||[]).join('\n')}function unlines(s){return String(s).split(/\n+/).map(function(x){return x.trim()}).filter(Boolean)}
function bindField(id,get,set,ev){var el=$(id);el.addEventListener(ev||'change',function(){change();set(el.value);saved();refreshLight()});el._get=get}
bindField('chName',null,function(v){chap().name=v||'未命名章节';renderTree()});
bindField('chSub',null,function(v){chap().subtitle=v});
bindField('chBiome',null,function(v){chap().biome=v;renderTree()});
bindField('chIntro',null,function(v){chap().intro=unlines(v)});
bindField('chOutro',null,function(v){chap().outro=unlines(v)});
bindField('prologue',null,function(v){proj.prologue=unlines(v)});
bindField('epilogue',null,function(v){proj.epilogue=unlines(v)});
function fillChapter(){var c=chap();$('chName').value=c.name;$('chSub').value=c.subtitle||'';$('chBiome').value=c.biome||'snow';$('chIntro').value=lines(c.intro);$('chOutro').value=lines(c.outro);$('prologue').value=lines(proj.prologue);$('epilogue').value=lines(proj.epilogue)}
/* 本关字段 */
bindField('lvName',null,function(v){cur().name=v||'未命名房间';renderTree()});
bindField('lvBg',null,function(v){cur().background=v;tilesDirty=true;thumbs()});
bindField('lvObj',null,function(v){cur().objective=v});
bindField('lvIntro',null,function(v){cur().intro=v});
['lvW','lvH'].forEach(function(id){$(id).addEventListener('change',function(){resizeLevel(+$('lvW').value,+$('lvH').value,$('lvAnchor').value)})});
function resizeLevel(w,h,anchor){var l=cur();w=clamp(w||l.width,20,240);h=clamp(h||l.height,12,60);if(w===l.width&&h===l.height){fillLevel();return}change();
  var dy=anchor==='bottom'?h-l.height:0,cells=[];for(var y=0;y<h;y++){var r=[];for(var x=0;x<w;x++){var sy=y-dy;r.push(sy>=0&&sy<l.height&&x<l.width?l.cells[sy][x]:0)}cells.push(r)}
  l.cells=cells;l.width=w;l.height=h;l.objects.forEach(function(o){o.y+=dy});
  var before=l.objects.length;l.objects=l.objects.filter(function(o){return o.x<w&&o.y+o.h>0&&o.y<h});l.objects.forEach(function(o){o.x=clamp(o.x,0,w-1);o.y=clamp(o.y,0,h-1);o.w=Math.min(o.w,w-o.x);o.h=Math.min(o.h,h-o.y)});
  var ids={};l.objects.forEach(function(o){ids[o.id]=1});l.links=l.links.filter(function(k){return ids[k.from]&&ids[k.to]});
  if(before>l.objects.length)toast('有 '+(before-l.objects.length)+' 个物件超出新尺寸，已移除（可撤销）');tilesDirty=true;refreshAll();saved()}
function fillLevel(){var l=cur();$('lvName').value=l.name;$('lvW').value=l.width;$('lvH').value=l.height;$('lvBg').value=l.background;$('lvObj').value=l.objective||'';$('lvIntro').value=l.intro||'';renderLinks()}
$('clearLevel').onclick=function(){if(!confirm('清空本关的地块和物件？（保留出生点与出口，可撤销）'))return;change();var l=cur(),b=L15.blankLevel(l.name,l.width,l.height);l.cells=b.cells;l.objects=b.objects;l.links=[];sel=null;tilesDirty=true;refreshAll();saved()};
function renderLinks(){var l=cur(),ul=$('linkList');ul.innerHTML='';if(!l.links.length){ul.innerHTML='<li><span class="hint">还没有连线。用工具栏「机关连线」：先点开关/压力板，再点目标。</span></li>';return}
  l.links.forEach(function(k,i){var f=obj(k.from),t=obj(k.to),li2=document.createElement('li');li2.innerHTML='<span>'+esc(f?f.label:'?')+' → '+esc(t?t.label:'?')+'</span>';li2.appendChild(btn('✕','删除连线',function(){change();l.links.splice(i,1);renderLinks();render();saved()}));ul.appendChild(li2)})}

/* ================= 图鉴 ================= */
var tool='select',kind='ground',brush=1;
var TOOL_HINT={select:'点选物件后可拖动；拖右下角小方块改大小；拖空白处平移。Del 删除，Ctrl+D 复制，方向键微调。',paint:'按住拖动画地块。当前：',place:'点击地图放置。当前：',erase:'点击或拖动擦除物件与地块。',link:'先点「开关/压力板」，再点「闸门/移动平台/升降台/激光栅」。',pan:'拖动平移画面；双指可缩放。'};
function renderPalette(){var box=$('palette');box.innerHTML='';
  L15.GROUPS.forEach(function(gp){var items=L15.CAT.filter(function(c){return c.g===gp[0]});if(!items.length)return;var g=document.createElement('div');g.className='pal-group';g.innerHTML='<h4>'+gp[1]+'</h4>';var grid=document.createElement('div');grid.className='pal-grid';
    items.forEach(function(c){var b=document.createElement('button');b.dataset.kind=c.k;b.title=c.n;var cv=document.createElement('canvas');cv.width=80;cv.height=60;b.appendChild(cv);b.appendChild(document.createTextNode(c.n.replace(/\(.*\)/,'')));
      b.onclick=function(){kind=c.k;setTool(c.g==='terrain'?'paint':'place')};grid.appendChild(b)});g.appendChild(grid);box.appendChild(g)});thumbs()}
function thumbs(){var bi=cur()?cur().background:'snow';Array.prototype.forEach.call(document.querySelectorAll('.pal-grid button'),function(b){var k=b.dataset.kind,c=INFO[k],cv=b.querySelector('canvas'),g=cv.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,80,60);
    var ww=c.w*T,hh=c.h*T;if(c.g==='terrain'){ww=T*2;hh=T}var s=Math.min(70/ww,52/hh,1.6);g.setTransform(s,0,0,s,(80-ww*s)/2,(60-hh*s)/2);
    if(c.g==='terrain'){var set=GFX.tiles(bi);for(var i=0;i<2;i++)GFX.drawTile(g,set,CELL[k],i,0,{up:true})}else drawObj(g,{kind:k,x:0,y:0,w:c.w,h:c.h,props:c.p,label:c.n},bi,1,hh)});markPalette()}
function markPalette(){Array.prototype.forEach.call(document.querySelectorAll('.pal-grid button'),function(b){b.classList.toggle('on',(tool==='paint'||tool==='place')&&b.dataset.kind===kind)})}
function setTool(t){tool=t;linkFrom=null;Array.prototype.forEach.call(document.querySelectorAll('#tools button'),function(b){b.classList.toggle('on',b.dataset.tool===t)});
  if(t==='paint'&&INFO[kind].g!=='terrain')kind='ground';if(t==='place'&&INFO[kind].g==='terrain')kind='shard';
  $('toolHint').textContent=TOOL_HINT[t]+((t==='paint'||t==='place')?INFO[kind].n:'');markPalette();render()}
$('tools').onclick=function(e){var b=e.target.closest('button[data-tool]');if(b)setTool(b.dataset.tool)};
$('brush').onchange=function(e){brush=+e.target.value};

/* ================= 绘制 ================= */
var cv=$('cv'),g=cv.getContext('2d'),stage=$('stage'),dpr=1,SW=800,SH=500,zoom=1,panX=0,panY=0,showGrid=true,anim=false,t0=performance.now();
var sel=null,linkFrom=null,hover=null,ghost=null,tilesDirty=true,tileCv=null,tileScale=1,needDraw=true;
function resize(){var r=stage.getBoundingClientRect();SW=Math.max(100,r.width);SH=Math.max(100,r.height);dpr=Math.min(window.devicePixelRatio||1,2);cv.width=Math.round(SW*dpr);cv.height=Math.round(SH*dpr);render()}
window.addEventListener('resize',function(){setTimeout(resize,50)});
function render(){needDraw=true}
function isSolid(v){return v===1||v===3||v===4||v===5}
function bake(){var l=cur(),pw=l.width*T,ph=l.height*T;tileScale=Math.min(1,Math.sqrt(7e6/(pw*ph)));tileCv=GFX.mk(Math.ceil(pw*tileScale),Math.ceil(ph*tileScale));var x=tileCv.getContext('2d'),set=GFX.tiles(l.background);x.scale(tileScale,tileScale);
  function at(cx,cy){if(cx<0||cx>=l.width)return 1;if(cy<0||cy>=l.height)return 0;return l.cells[cy][cx]}
  for(var y=0;y<l.height;y++)for(var xx=0;xx<l.width;xx++){var v=l.cells[y][xx];if(!v)continue;GFX.drawTile(x,set,v,xx,y,{up:!isSolid(at(xx,y-1))&&at(xx,y-1)!==2,down:!isSolid(at(xx,y+1)),left:!isSolid(at(xx-1,y)),right:!isSolid(at(xx+1,y))})}tilesDirty=false}
function px(o){var c=INFO[o.kind];return{kind:o.kind,x:o.x*T,y:o.y*T,w:o.w*T,h:o.h*T}}
function drawObj(x,o,biome,t,lvlH){var c=INFO[o.kind],d=px(o),p=o.props||{};if(!c)return;
  if(c.g==='enemy'&&o.kind!=='boss'){d.face=-1;d.alpha=.85;d.aim=Math.PI;d.flash=0;d.windup=0;d.charge=0;GFX.enemy(x,d,t,biome)}
  else if(o.kind==='boss'){GFX.boss(x,{type:p.boss||'lava',x:d.x,y:d.y,w:d.w,h:d.h,state:'idle',face:-1,flash:0},t)}
  else if(c.g==='npc'){GFX.npc(x,o.kind,d.x,d.y,d.w,d.h,t,1)}
  else if(o.kind==='spawn'){GFX.hero(x,{cx:d.x+d.w/2,cy:d.y+d.h,face:1,vx:0,vy:0,ground:true,anim:0,state:'idle',atk:0,sx:1,sy:1},t,GFX.B(biome).accent)}
  else if(o.kind==='trigger'){x.save();x.setLineDash([6,5]);x.strokeStyle='#ffffffaa';x.lineWidth=2;x.strokeRect(d.x+1,d.y+1,d.w-2,d.h-2);x.fillStyle='#ffffff14';x.fillRect(d.x,d.y,d.w,d.h);x.setLineDash([]);x.fillStyle='#fff';x.font='bold 12px sans-serif';x.textAlign='center';x.fillText('💬 剧情触发',d.x+d.w/2,d.y+d.h/2+4);x.restore()}
  else{if(o.kind==='moving'||o.kind==='lift'){d.h=Math.min(d.h,T*.6);d.run=true;var ex=d.x+(p.dx||0)*T,ey=d.y+(p.dy||0)*T;x.save();x.globalAlpha=.35;x.setLineDash([5,5]);x.strokeStyle='#bca0ff';x.lineWidth=2;x.strokeRect(ex,ey,d.w,d.h);x.beginPath();x.moveTo(d.x+d.w/2,d.y+d.h/2);x.lineTo(ex+d.w/2,ey+d.h/2);x.stroke();x.restore()}
    if(o.kind==='laser'){d.active=true}if(o.kind==='vent'){d.on=true;d.reach=150}if(o.kind==='exit'){d.locked=false}if(o.kind==='gate'){d.openT=0}if(o.kind==='rubble'){d.hp=p.hp||2;d.max=d.hp}if(o.kind==='checkpoint')d.lit=true;
    GFX.thing(x,d,t,biome,lvlH)}}
function draw(){var l=cur(),now=(performance.now()-t0)/1000,t=anim?now:1.2,bi=l.background;g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,SW,SH);
  GFX.drawBg(g,bi,SW,SH,panX,panY*.2,zoom,t);g.fillStyle='rgba(4,8,14,.35)';g.fillRect(0,0,SW,SH);
  if(tilesDirty)bake();
  var W=l.width*T,H=l.height*T;g.setTransform(dpr*zoom,0,0,dpr*zoom,-panX*zoom*dpr,-panY*zoom*dpr);
  g.fillStyle='rgba(255,255,255,.035)';g.fillRect(0,0,W,H);
  l.objects.forEach(function(o){if(o.type==='background')drawObj(g,o,bi,t,H)});
  g.drawImage(tileCv,0,0,W,H);
  l.objects.forEach(function(o){if(o.type!=='background')drawObj(g,o,bi,t,H)});
  // 名牌
  g.font='bold 11px sans-serif';g.textAlign='center';l.objects.forEach(function(o){if(o.type==='npc'||o.kind==='sign'){g.fillStyle='rgba(0,0,0,.55)';var tw=g.measureText(o.label).width+10;g.fillRect(o.x*T+o.w*T/2-tw/2,o.y*T-20,tw,15);g.fillStyle='#fff';g.fillText(o.label,o.x*T+o.w*T/2,o.y*T-9)}if(o.kind==='boss'){g.fillStyle='#ffb79a';g.fillText(o.dialogue||o.label,o.x*T+o.w*T/2,o.y*T-6)}});g.textAlign='start';
  // 网格
  if(showGrid&&zoom>=.3){var x0=Math.max(0,Math.floor(panX/T)),x1=Math.min(l.width,Math.ceil((panX+SW/zoom)/T)),y0=Math.max(0,Math.floor(panY/T)),y1=Math.min(l.height,Math.ceil((panY+SH/zoom)/T));g.strokeStyle='rgba(170,225,255,.12)';g.lineWidth=1/zoom;g.beginPath();for(var gx=x0;gx<=x1;gx++){g.moveTo(gx*T,y0*T);g.lineTo(gx*T,y1*T)}for(var gy=y0;gy<=y1;gy++){g.moveTo(x0*T,gy*T);g.lineTo(x1*T,gy*T)}g.stroke();
    g.strokeStyle='rgba(170,225,255,.25)';g.beginPath();for(gx=x0-x0%5;gx<=x1;gx+=5){g.moveTo(gx*T,y0*T);g.lineTo(gx*T,y1*T)}g.stroke()}
  g.strokeStyle='#6fe0dc';g.lineWidth=2/zoom;g.strokeRect(0,0,W,H);
  // 连线
  l.links.forEach(function(k){var a=obj(k.from),b=obj(k.to);if(a&&b)arrow(a,b,'#ffd27a')});
  if(linkFrom){var a=obj(linkFrom);if(a){outline(a,'#ffd27a',true);if(hover)arrow(a,{x:hover.x,y:hover.y,w:1,h:1},'#ffd27a88')}}
  // 选中
  if(sel){var o=obj(sel);if(o){outline(o,'#ffffff',true);var hs=10/zoom;g.fillStyle='#6fe0dc';g.fillRect((o.x+o.w)*T-hs,(o.y+o.h)*T-hs,hs*1.6,hs*1.6)}}
  // 悬停预览
  if(hover&&!drag){if(tool==='paint'||tool==='erase'){g.strokeStyle=tool==='erase'?'#ff8a7a':'#ffffff';g.lineWidth=2/zoom;g.strokeRect(hover.x*T,hover.y*T,brush*T,brush*T)}
    else if(tool==='place'){var c=INFO[kind],pos=placePos(hover,c.w,c.h);g.save();g.globalAlpha=.55;drawObj(g,{kind:kind,x:pos.x,y:pos.y,w:c.w,h:c.h,props:c.p,label:c.n},bi,t,H);g.restore();g.strokeStyle='#ffd27a';g.lineWidth=1.5/zoom;g.strokeRect(pos.x*T,pos.y*T,c.w*T,c.h*T)}}
  // 超界物件
  l.objects.forEach(function(o){if(o.x<0||o.y<0||o.x+o.w>l.width||o.y+o.h>l.height)outline(o,'#ff5a5a',false)});
  needDraw=false}
function outline(o,col,dash){g.save();if(dash)g.setLineDash([6/zoom,4/zoom]);g.strokeStyle=col;g.lineWidth=2/zoom;g.strokeRect(o.x*T-2,o.y*T-2,o.w*T+4,o.h*T+4);g.restore()}
function arrow(a,b,col){var ax=(a.x+a.w/2)*T,ay=(a.y+a.h/2)*T,bx=(b.x+b.w/2)*T,by=(b.y+b.h/2)*T,mx=(ax+bx)/2,my=Math.min(ay,by)-60;g.save();g.strokeStyle=col;g.lineWidth=2.5/zoom;g.setLineDash([8/zoom,5/zoom]);g.beginPath();g.moveTo(ax,ay);g.quadraticCurveTo(mx,my,bx,by);g.stroke();g.setLineDash([]);var an=Math.atan2(by-my,bx-mx),s=10/zoom;g.fillStyle=col;g.beginPath();g.moveTo(bx,by);g.lineTo(bx-Math.cos(an-.4)*s,by-Math.sin(an-.4)*s);g.lineTo(bx-Math.cos(an+.4)*s,by-Math.sin(an+.4)*s);g.fill();g.restore()}
(function loop(){if(proj&&(needDraw||anim))draw();requestAnimationFrame(loop)})();
var fitAll=false;function fit(){var l=cur(),W=l.width*T,H=l.height*T;zoom=fitAll?clamp(Math.min((SW-30)/W,(SH-30)/H),.15,1.5):clamp((SH-40)/H,.2,1.4);panY=(H-SH/zoom)/2;panX=W*zoom<SW?(W-SW/zoom)/2:-20/zoom;zoomLbl();render()}
function zoomAt(f,sx,sy){var wx=panX+sx/zoom,wy=panY+sy/zoom;zoom=clamp(zoom*f,.15,4);panX=wx-sx/zoom;panY=wy-sy/zoom;zoomLbl();render()}
function zoomLbl(){$('zoomLbl').textContent=Math.round(zoom*100)+'%'}
$('zoomIn').onclick=function(){zoomAt(1.25,SW/2,SH/2)};$('zoomOut').onclick=function(){zoomAt(.8,SW/2,SH/2)};$('fitBtn').onclick=function(){fitAll=!fitAll;fit();toast(fitAll?'显示整张地图':'按高度适配（从左侧开始）',1200)};
$('gridChk').onchange=function(e){showGrid=e.target.checked;render()};$('animChk').onchange=function(e){anim=e.target.checked;render()};

/* ================= 交互 ================= */
function toCell(e){var r=cv.getBoundingClientRect(),sx=e.clientX-r.left,sy=e.clientY-r.top,wx=panX+sx/zoom,wy=panY+sy/zoom;return{sx:sx,sy:sy,wx:wx,wy:wy,x:Math.floor(wx/T),y:Math.floor(wy/T)}}
function inLv(c){var l=cur();return c.x>=0&&c.y>=0&&c.x<l.width&&c.y<l.height}
function hit(c){var l=cur(),i,o;for(var pass=0;pass<2;pass++)for(i=l.objects.length-1;i>=0;i--){o=l.objects[i];if((o.type==='background')!==(pass===1))continue;if(c.wx>=o.x*T&&c.wx<(o.x+o.w)*T&&c.wy>=o.y*T&&c.wy<(o.y+o.h)*T)return o}return null}
function placePos(c,w,h){var l=cur();return{x:clamp(c.x-Math.floor((w-1)/2),0,Math.max(0,l.width-w)),y:clamp(c.y-h+1,0,Math.max(0,l.height-h))}}
var pointers={},drag=null,spaceDown=false,lastPaint=null;
cv.addEventListener('pointerdown',function(e){e.preventDefault();try{cv.setPointerCapture(e.pointerId)}catch(x){}pointers[e.pointerId]={x:e.clientX,y:e.clientY};
  var ids=Object.keys(pointers);if(ids.length===2){if(drag&&drag.type!=='pan'&&drag.type!=='pinch')endDrag();var a=pointers[ids[0]],b=pointers[ids[1]];drag={type:'pinch',d:Math.hypot(a.x-b.x,a.y-b.y),cx:(a.x+b.x)/2,cy:(a.y+b.y)/2};return}
  if(ids.length>2)return;var c=toCell(e);
  if(e.button===1||e.button===2||spaceDown||tool==='pan'){drag={type:'pan',sx:e.clientX,sy:e.clientY,px:panX,py:panY};return}
  if(tool==='select'){var o=hit(c),cur0=sel?obj(sel):null,hs=12/zoom;
    if(cur0&&Math.abs(c.wx-(cur0.x+cur0.w)*T)<hs&&Math.abs(c.wy-(cur0.y+cur0.h)*T)<hs){begin();drag={type:'resize',o:cur0};return}
    if(o){sel=o.id;begin();drag={type:'move',o:o,ox:c.wx/T-o.x,oy:c.wy/T-o.y};showProps();render()}else{sel=null;showProps();drag={type:'pan',sx:e.clientX,sy:e.clientY,px:panX,py:panY};render()}return}
  if(tool==='paint'){if(!inLv(c))return;begin();drag={type:'paint'};lastPaint=null;paintAt(c);return}
  if(tool==='erase'){begin();drag={type:'erase'};eraseAt(c);return}
  if(tool==='place'){if(!inLv(c))return;placeAt(c);return}
  if(tool==='link'){linkClick(c);return}});
cv.addEventListener('pointermove',function(e){if(pointers[e.pointerId]){pointers[e.pointerId].x=e.clientX;pointers[e.pointerId].y=e.clientY}var c=toCell(e);
  var nh=inLv(c)?{x:c.x,y:c.y}:null;if((nh&&(!hover||nh.x!==hover.x||nh.y!==hover.y))||(!nh&&hover)){hover=nh;render()}
  $('stCursor').textContent=nh?'格 ('+c.x+', '+c.y+')':'—';
  if(!drag)return;
  if(drag.type==='pinch'){var ids=Object.keys(pointers);if(ids.length<2)return;var a=pointers[ids[0]],b=pointers[ids[1]],d=Math.hypot(a.x-b.x,a.y-b.y),cx=(a.x+b.x)/2,cy=(a.y+b.y)/2,r=cv.getBoundingClientRect();panX-=(cx-drag.cx)/zoom;panY-=(cy-drag.cy)/zoom;zoomAt(d/drag.d,cx-r.left,cy-r.top);drag.d=d;drag.cx=cx;drag.cy=cy;return}
  if(drag.type==='pan'){panX=drag.px-(e.clientX-drag.sx)/zoom;panY=drag.py-(e.clientY-drag.sy)/zoom;render();return}
  if(drag.type==='move'){var o=drag.o,l=cur(),nx=clamp(Math.round(c.wx/T-drag.ox),0,l.width-o.w),ny=clamp(Math.round(c.wy/T-drag.oy),0,l.height-o.h);if(nx!==o.x||ny!==o.y){touch();o.x=nx;o.y=ny;showProps();render()}return}
  if(drag.type==='resize'){var o2=drag.o,l2=cur(),nw=clamp(Math.round(c.wx/T)-o2.x,1,l2.width-o2.x),nhh=clamp(Math.round(c.wy/T)-o2.y,1,l2.height-o2.y);if(nw!==o2.w||nhh!==o2.h){touch();o2.w=nw;o2.h=nhh;showProps();render()}return}
  if(drag.type==='paint'&&inLv(c)){paintAt(c);return}
  if(drag.type==='erase'){eraseAt(c)}});
function endDrag(){if(drag&&(drag.type==='paint'||drag.type==='erase'||drag.type==='move'||drag.type==='resize')){if(pending===null){saved();if(drag.type==='paint'||drag.type==='erase'){refreshLight()}}pending=null}drag=null;render()}
['pointerup','pointercancel'].forEach(function(ev){cv.addEventListener(ev,function(e){delete pointers[e.pointerId];if(drag&&drag.type==='pinch'){if(Object.keys(pointers).length<2)drag=null;return}endDrag()})});
cv.addEventListener('pointerleave',function(){if(hover){hover=null;render()}});
cv.addEventListener('contextmenu',function(e){e.preventDefault()});
cv.addEventListener('wheel',function(e){e.preventDefault();var r=cv.getBoundingClientRect();if(e.shiftKey){panX+=e.deltaY/zoom;render();return}if(e.ctrlKey||Math.abs(e.deltaY)>=Math.abs(e.deltaX)){zoomAt(Math.pow(1.0015,-e.deltaY),e.clientX-r.left,e.clientY-r.top)}else{panX+=e.deltaX/zoom;render()}},{passive:false});
function cellsLine(a,b,fn){var dx=Math.abs(b.x-a.x),dy=Math.abs(b.y-a.y),sx=a.x<b.x?1:-1,sy=a.y<b.y?1:-1,err=dx-dy,x=a.x,y=a.y;for(var n=0;n<500;n++){fn(x,y);if(x===b.x&&y===b.y)break;var e2=2*err;if(e2>-dy){err-=dy;x+=sx}if(e2<dx){err+=dx;y+=sy}}}
function paintAt(c){var l=cur(),v=CELL[kind]||1,changed=false;cellsLine(lastPaint||c,c,function(x0,y0){for(var y=y0;y<y0+brush;y++)for(var x=x0;x<x0+brush;x++)if(y>=0&&x>=0&&y<l.height&&x<l.width&&l.cells[y][x]!==v){if(!changed){touch();changed=true}l.cells[y][x]=v}});lastPaint={x:c.x,y:c.y};if(changed){tilesDirty=true;render()}}
function eraseAt(c){var l=cur(),o=hit(c);if(o){touch();removeObj(o.id);render();return}if(!inLv(c))return;var changed=false;for(var y=c.y;y<c.y+brush;y++)for(var x=c.x;x<c.x+brush;x++)if(y<l.height&&x<l.width&&l.cells[y][x]){if(!changed){touch();changed=true}l.cells[y][x]=0}if(changed){tilesDirty=true;render()}}
function removeObj(id){var l=cur();l.objects=l.objects.filter(function(o){return o.id!==id});l.links=l.links.filter(function(k){return k.from!==id&&k.to!==id});if(sel===id)sel=null;showProps();renderLinks()}
var UNIQUE={spawn:1,exit:1,boss:1};
function placeAt(c){var l=cur(),d=INFO[kind],pos=placePos(c,d.w,d.h);change();
  if(UNIQUE[kind]){var ex=l.objects.filter(function(o){return o.kind===kind})[0];if(ex){ex.x=pos.x;ex.y=pos.y;sel=ex.id;showProps();render();saved();toast(d.n+'每个房间只有一个，已移动到新位置',1600);return}}
  var p={},k;for(k in d.p)p[k]=d.p[k];if(kind==='boss')p.boss=({snow:'ice',forest:'root',underground:'spore',lava:'lava'})[l.background]||'lava';
  var dlg={worker:'巡线员：……',child:'孩子：老师……',ranger:'守林人：……',squirrel:'小松鼠：……',robot:'维修机器人：滴——',hologram:'投影：……',traveler:'旅客：……',stationmaster:'站务员：……',sign:'路牌：写点什么吧。',trigger:'我：……',boss:({ice:'风雪稽查员',root:'枯根傀儡',spore:'孢子母巢',lava:'守线者'})[p.boss]}[kind]||'';
  var o={id:L15.uid(),type:d.g,kind:kind,x:pos.x,y:pos.y,w:d.w,h:d.h,label:d.n.replace(/\(.*\)/,''),dialogue:dlg,props:p};l.objects.push(o);sel=o.id;showProps();render();saved();renderTree()}
var LINK_SRC={switch:1,plate:1},LINK_DST={gate:1,moving:1,lift:1,laser:1};
function linkClick(c){var o=hit(c),l=cur();if(!o){linkFrom=null;render();return}
  if(!linkFrom){if(LINK_SRC[o.kind]){linkFrom=o.id;toast('已选择「'+o.label+'」，再点一个闸门/平台/激光栅',1800)}else toast('请先点开关或压力板');render();return}
  if(LINK_SRC[o.kind]){linkFrom=o.id;render();return}
  if(!LINK_DST[o.kind]){toast('这个物件不能被机关控制');return}
  if(l.links.some(function(k){return k.from===linkFrom&&k.to===o.id})){toast('已经连过了');return}
  change();l.links.push({from:linkFrom,to:o.id});toast('已连线：'+obj(linkFrom).label+' → '+o.label);linkFrom=null;renderLinks();render();saved()}

/* 键盘 */
function typing(e){var t=e.target;return t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.tagName==='SELECT')}
window.addEventListener('keydown',function(e){if(typing(e))return;var k=e.key.toLowerCase(),mod=e.ctrlKey||e.metaKey;
  if(mod&&k==='z'&&!e.shiftKey){e.preventDefault();doUndo();return}if(mod&&(k==='y'||(k==='z'&&e.shiftKey))){e.preventDefault();doRedo();return}
  if(mod&&k==='d'){e.preventDefault();dupSel();return}if(mod&&k==='s'){e.preventDefault();LS.set(DRAFT,{campaign:strip(proj),ci:ci,li:li});toast('草稿已保存（发布到游戏请点「发布」）');return}
  if(k===' '){spaceDown=true;e.preventDefault();return}
  if((k==='delete'||k==='backspace')&&sel){e.preventDefault();change();removeObj(sel);render();saved();return}
  if(k==='escape'){linkFrom=null;sel=null;showProps();render();return}
  var mv={arrowleft:[-1,0],arrowright:[1,0],arrowup:[0,-1],arrowdown:[0,1]}[k];if(mv&&sel){e.preventDefault();var o=obj(sel),l=cur();change();o.x=clamp(o.x+mv[0],0,l.width-o.w);o.y=clamp(o.y+mv[1],0,l.height-o.h);showProps();render();saved();return}
  if(mv){panX+=mv[0]*T*2;panY+=mv[1]*T*2;render();return}
  var tl={v:'select',b:'paint',p:'place',x:'erase',l:'link',h:'pan'}[k];if(tl&&!mod){setTool(tl);return}
  if(k==='='||k==='+'){zoomAt(1.25,SW/2,SH/2)}if(k==='-'){zoomAt(.8,SW/2,SH/2)}if(k==='f'&&!mod)fit()});
window.addEventListener('keyup',function(e){if(e.key===' ')spaceDown=false});
function dupSel(){if(!sel)return;var o=obj(sel);if(!o||UNIQUE[o.kind]){toast('出生点 / 出口 / Boss 不能复制');return}change();var c=clone(o),l=cur();c.id=L15.uid();c.x=clamp(o.x+1,0,l.width-o.w);c.y=clamp(o.y,0,l.height-o.h);l.objects.push(c);sel=c.id;showProps();render();saved()}

/* ================= 属性面板 ================= */
var PROPS={range:['巡逻范围（格）','n'],dir:['朝向（-1 左 / 1 右）','n'],rate:['射击间隔（秒）','n'],boss:['Boss 类型','s',[['ice','风雪稽查员（冲撞/雪球/冰锥）'],['root','枯根傀儡（树根/纸片/重踏）'],['spore','孢子母巢（追踪孢子/孢子雨/召唤）'],['lava','守线者（全部招式）']]],hp:['生命值','n'],period:['周期（秒）','n'],phase:['相位（0 或 1 错开）','n'],hold:['离开后保持开启（秒）','n'],dx:['水平移动（格，负=向左）','n'],dy:['垂直移动（格，负=向上）','n'],speed:['速度','n'],once:['只触发一次（1/0）','n']};
var EXTRA={plate:['hold'],laser:['period','phase']};
var DLG_KINDS={npc:1,sign:1,trigger:1};
function showProps(){var box=$('props'),o=sel?obj(sel):null;$('stSel').textContent=o?('选中：'+o.label+' ('+o.x+','+o.y+')'):'';
  if(!o){box.innerHTML='<p class="hint">在地图上点选一个物件即可编辑。<br>选择工具 + 拖动 = 移动；拖右下角方块 = 改大小。</p>';return}
  var d=INFO[o.kind],h='<div class="prop-head"><b>'+esc(d.n)+'</b></div>';box.innerHTML=h;var head=box.firstChild;
  head.appendChild(btn('⧉','复制 (Ctrl+D)',dupSel));head.appendChild(btn('✕','删除 (Del)',function(){change();removeObj(o.id);render();saved()}));
  function field(label,val,type,onset,opts){var lab=document.createElement('label');lab.textContent=label;var el;
    if(type==='s'){el=document.createElement('select');opts.forEach(function(op){el.add(new Option(op[1],op[0]))});el.value=val}
    else if(type==='t'){el=document.createElement('textarea');el.rows=5;el.value=val}
    else{el=document.createElement('input');el.type=type==='n'?'number':'text';if(type==='n')el.step='any';el.value=val}
    el.addEventListener('change',function(){change();onset(type==='n'?(+el.value||0):el.value);render();saved();showProps()});lab.appendChild(el);box.appendChild(lab);return el}
  field('名称（NPC 名牌 / 对话框名字）',o.label,'x',function(v){o.label=v||d.n;renderLinks()});
  var two=document.createElement('div');two.className='two';box.appendChild(two);
  var l=cur();[['X','x',0,l.width-1],['Y','y',0,l.height-1],['宽','w',1,l.width],['高','h',1,l.height]].forEach(function(f){var lab=document.createElement('label');lab.textContent=f[0];var el=document.createElement('input');el.type='number';el.value=o[f[1]];el.onchange=function(){change();o[f[1]]=clamp(Math.round(+el.value||0),f[2],f[3]);render();saved();showProps()};lab.appendChild(el);two.appendChild(lab)});
  var keys=Object.keys(d.p).concat(EXTRA[o.kind]||[]);keys.forEach(function(k){if(!PROPS[k]||(k==='once'))return;var pd=PROPS[k];var v=o.props[k]!=null?o.props[k]:(pd[1]==='n'?0:'');field(pd[0],v,pd[1],function(nv){o.props[k]=nv;if(k==='boss')render()},pd[2])});
  if(DLG_KINDS[d.g]){var hint=document.createElement('p');hint.className='hint';hint.innerHTML=d.g==='trigger'?'玩家走进这个区域时自动播放。Boss 房里放一个，对话结束后 Boss 开战。':'玩家靠近按「互动」时播放。';box.appendChild(hint);
    field('对话（每行一句：“名字：内容”，名字写“我”=老师头像）',String(o.dialogue||'').split('|').join('\n'),'t',function(v){o.dialogue=unlines(v).join('|')})}
  if(o.kind==='boss')field('Boss 显示名',o.dialogue||'','x',function(v){o.dialogue=v});
  if(LINK_SRC[o.kind]||LINK_DST[o.kind]){var rel=l.links.filter(function(k){return k.from===o.id||k.to===o.id});var p2=document.createElement('p');p2.className='hint';
    p2.textContent=rel.length?('连线：'+rel.map(function(k){var a=obj(k.from),b=obj(k.to);return (a?a.label:'?')+' → '+(b?b.label:'?')}).join('；')):(o.kind==='gate'?'未连线：本房间所有开关/压力板都触发后打开。':LINK_DST[o.kind]?'未连线：持续运行。':'未连线：会控制本房间未连线的闸门。');box.appendChild(p2)}
  var tips={exit:'玩家走进出口即进入下一个房间。Boss 房要先击败 Boss。',spawn:'玩家从这里出生，掉落后从最近的信标灯重来。',checkpoint:'玩家碰到后点亮并存档，失败从这里重来。',shard:'信标碎片：结局统计收集数量。',heart:'保温杯：恢复 1 点生命。',vine:'按 ↑ 或「互动」抓住，可上下攀爬并跳离。',spore:'区域内持续上升气流。',vent:'周期喷发的气流，喷发时可把玩家托起。',rubble:'需要攻击或空中俯冲击碎；生命值=需要命中次数。',ghost:'玩家面朝它时会变透明停下（怕被注视）。'}[o.kind];
  if(tips){var tp=document.createElement('p');tp.className='hint';tp.textContent='💡 '+tips;box.appendChild(tp)}
  if(tool==='select'&&!quietProps)rtab('props')}

/* ================= 检查 ================= */
function checkAll(){var out=[];proj.chapters.forEach(function(ch,i){ch.levels.forEach(function(l,j){var where=(i+1)+'-'+(j+1)+' '+l.name,c=function(k){return l.objects.filter(function(o){return o.kind===k})};
    var sp=c('spawn'),ex=c('exit'),bs=c('boss');
    if(!sp.length)out.push(['err',where,'缺少出生点',i,j]);if(sp.length>1)out.push(['err',where,'有多个出生点',i,j,sp[1].id]);
    if(!ex.length)out.push(['err',where,'缺少出口，玩家无法离开',i,j]);if(ex.length>1)out.push(['warn',where,'有多个出口，游戏只使用最后一个',i,j,ex[0].id]);
    if(bs.length>1)out.push(['err',where,'一个房间只能有一个 Boss',i,j,bs[1].id]);
    sp.forEach(function(s){var solid=false,ground=false;for(var y=s.y;y<s.y+s.h;y++)for(var x=s.x;x<s.x+s.w;x++)if(l.cells[y]&&isSolid(l.cells[y][x]))solid=true;for(var y2=s.y+s.h;y2<l.height;y2++){var v=l.cells[y2][s.x];if(v){ground=true;break}}if(solid)out.push(['err',where,'出生点被地块挡住',i,j,s.id]);else if(!ground)out.push(['warn',where,'出生点下方没有地面',i,j,s.id])});
    var srcs=l.objects.filter(function(o){return LINK_SRC[o.kind]});l.objects.forEach(function(o){if(o.kind==='gate'&&!l.links.some(function(k){return k.to===o.id})&&!srcs.length)out.push(['err',where,'闸门「'+o.label+'」没有任何开关，永远打不开',i,j,o.id]);
      if(o.x<0||o.y<0||o.x+o.w>l.width||o.y+o.h>l.height)out.push(['warn',where,'「'+o.label+'」超出地图范围',i,j,o.id]);
      if(DLG_KINDS[INFO[o.kind].g]&&!String(o.dialogue||'').trim())out.push(['warn',where,'「'+o.label+'」没有对话内容',i,j,o.id])});
    if(l._dropped)out.push(['warn',where,'导入时忽略了 '+l._dropped+' 个旧版物件（新版不支持）',i,j])})});
  var box=$('checks'),errs=out.filter(function(x){return x[0]==='err'}).length;$('checkBadge').textContent=errs?errs:'';box.innerHTML='';
  if(!out.length){box.innerHTML='<div class="chk-item ok"><span>全部 '+proj.chapters.reduce(function(a,c){return a+c.levels.length},0)+' 个房间检查通过 ✓</span></div>'}
  out.forEach(function(x){var d=document.createElement('div');d.className='chk-item '+x[0];d.innerHTML='<span><b>'+esc(x[1])+'</b><br>'+esc(x[2])+'</span>';d.appendChild(btn('定位','跳到这里',function(){selectLevel(x[3],x[4]);if(x[5]){sel=x[5];showProps();var o=obj(sel);if(o){panX=o.x*T-SW/zoom/2;panY=o.y*T-SH/zoom/2}render()}}));box.appendChild(d)});
  return errs}

/* ================= 发布 / 试玩 / 导入导出 ================= */
$('publishBtn').onclick=function(){var errs=checkAll();if(errs&&!confirm('还有 '+errs+' 个错误（见「检查」页），仍然发布？'))return rtab('check');if(LS.set(L15.STORAGE.campaign,strip(proj))){saved();toast('已发布！刷新游戏页面即可游玩新主线 🎉',3000)}};
$('testBtn').onclick=function(){var l=cur(),errs=checkAll();var bad=l.objects.filter(function(o){return o.kind==='spawn'}).length!==1||!l.objects.some(function(o){return o.kind==='exit'});if(bad){toast('试玩前需要一个出生点和一个出口');return}
  LS.set(L15.STORAGE.test,{level:strip({chapters:[{levels:[l]}]}).chapters[0].levels[0],t:Date.now()});var w=window.open('index.html?test=1','line15test');if(!w)location.href='index.html?test=1'};
$('exportBtn').onclick=function(){download((proj.name||'15号线主线').replace(/[\\/:*?"<>|]/g,'_')+'.line15.json',strip(proj))};
$('exportLevelBtn').onclick=function(){download(cur().name.replace(/[\\/:*?"<>|\s·]/g,'_')+'.level15.json',{format:'line15-custom-level',version:3,level:strip({chapters:[{levels:[cur()]}]}).chapters[0].levels[0]})};
function download(name,o){var b=new Blob([JSON.stringify(o)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},2000);toast('已导出 '+name)}
$('importBtn').onclick=function(){$('fileInput').click()};
$('fileInput').onchange=function(e){var f=e.target.files[0];if(!f)return;var r=new FileReader();r.onload=function(){try{var d=JSON.parse(r.result);
    if(d.format==='line15-custom-level'&&d.level){var lv=normLevel(d.level);change();chap().levels.splice(li+1,0,lv);selectLevel(ci,li+1);toast('已把房间「'+lv.name+'」插入到当前房间之后')}
    else{var c=normCampaign(d);if(!confirm('导入的主线有 '+c.chapters.length+' 章，将替换当前草稿（可撤销），继续？'))return;change();proj=c;ci=0;li=0;tilesDirty=true;refreshAll();fit();toast('已导入「'+c.name+'」')}saved()}catch(err){alert('导入失败：'+err.message)}};r.readAsText(f,'utf-8');e.target.value=''};
$('moreBtn').onclick=function(e){e.stopPropagation();$('moreMenu').classList.toggle('hidden')};document.addEventListener('click',function(){$('moreMenu').classList.add('hidden')});
$('resetDefaultBtn').onclick=function(){if(!confirm('用默认主线（4 章 16 房间）替换当前草稿？（可撤销）'))return;change();proj=normCampaign(clone(window.CAMPAIGN_DEFAULT));ci=0;li=0;tilesDirty=true;refreshAll();fit();saved();toast('已载入默认主线')};
$('loadPublishedBtn').onclick=function(){var p=LS.get(L15.STORAGE.campaign);if(!p){toast('游戏目前用的就是默认主线');return}change();proj=normCampaign(p);ci=0;li=0;tilesDirty=true;refreshAll();fit();saved();toast('已载入已发布的主线')};
$('unpublishBtn').onclick=function(){if(!confirm('让游戏恢复使用默认主线？（你的草稿不受影响）'))return;LS.del(L15.STORAGE.campaign);saved();toast('游戏已恢复默认主线')};
$('undoBtn').onclick=doUndo;$('redoBtn').onclick=doRedo;

/* ================= 标签页 / 刷新 ================= */
Array.prototype.forEach.call(document.querySelectorAll('[data-tab]'),function(b){b.onclick=function(){Array.prototype.forEach.call(document.querySelectorAll('[data-tab]'),function(x){x.classList.toggle('on',x===b)});$('tab-tree').classList.toggle('hidden',b.dataset.tab!=='tree');$('tab-story').classList.toggle('hidden',b.dataset.tab!=='story')}});
function rtab(n){Array.prototype.forEach.call(document.querySelectorAll('[data-rtab]'),function(x){x.classList.toggle('on',x.dataset.rtab===n);$('rtab-'+x.dataset.rtab).classList.toggle('hidden',x.dataset.rtab!==n)});if(n==='check')checkAll()}
Array.prototype.forEach.call(document.querySelectorAll('[data-rtab]'),function(b){b.onclick=function(){rtab(b.dataset.rtab)}});
function refreshLight(){var l=cur();$('stLevel').textContent=chap().name+' · '+l.name+' · '+l.width+'×'+l.height+' 格 · '+l.objects.length+' 个物件';checkAll()}
function refreshAll(){renderTree();fillChapter();fillLevel();thumbs();showPropsQuiet();refreshLight();render()}
var quietProps=false;function showPropsQuiet(){quietProps=true;showProps();quietProps=false}

/* ================= 锁 ================= */
function hashStr(s){if(window.crypto&&crypto.subtle&&window.TextEncoder)return crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)).then(function(b){return Array.from(new Uint8Array(b)).map(function(x){return x.toString(16).padStart(2,'0')}).join('')});
  var h1=0xdeadbeef,h2=0x41c6ce57;for(var i=0;i<s.length;i++){var c=s.charCodeAt(i);h1=Math.imul(h1^c,2654435761);h2=Math.imul(h2^c,1597334677)}return Promise.resolve('f'+(h1>>>0).toString(16)+(h2>>>0).toString(16))}
function openApp(){$('lock').classList.add('hidden');$('app').classList.remove('hidden');setTimeout(function(){resize();fit()},30)}
function unlock(){var p=$('password').value,st=localStorage.getItem(PASS);if(!p){$('lockHint').textContent='请输入密码。';return}
  hashStr(p).then(function(h){if(!st){localStorage.setItem(PASS,h);openApp();toast('密码已设置')}else if(h===st)openApp();else $('lockHint').textContent='密码不正确，请重试。'})}
$('unlock').onclick=unlock;$('password').onkeydown=function(e){if(e.key==='Enter')unlock()};
$('lockBtn').onclick=function(){$('password').value='';$('lockHint').textContent='工坊已锁定。';$('app').classList.add('hidden');$('lock').classList.remove('hidden')};
if(!localStorage.getItem(PASS))$('lockHint').textContent='首次使用请设置一个工坊密码（防止学生误改主线）。';else $('lockHint').textContent='请输入工坊密码。';

/* ================= 启动 ================= */
loadInitial();renderPalette();setTool('select');updUndo();refreshAll();resize();saved();
if(window.ResizeObserver)new ResizeObserver(function(){resize()}).observe(stage);
window.L15Editor={get proj(){return proj},selectLevel:selectLevel,setTool:setTool,get sel(){return sel}};
})();
