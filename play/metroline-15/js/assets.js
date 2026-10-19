/* 素材系统：自动识别 assets/ 文件夹里的贴图与音频，替换游戏内置的程序绘制 / 程序合成。放在 gfx3.js 之后加载。
   ─────────────────────────────────────────────────────────────
   【识别方式】（三选一，自动按顺序尝试）
     1. assets/assets.json 清单（可选）：{"textures":["a.png"],"audio":["bgm_snow.mp3"],"meta":{"slime":{"frames":4}}}
     2. 目录列表：服务器允许浏览 assets/textures/ 与 assets/audio/ 时（python -m http.server、nginx autoindex 等），直接读文件名
     3. 按约定文件名逐个探测（用 file:// 或没有目录列表时；只探测 .png 与 .mp3/.ogg/.wav）

   【贴图命名】放在 assets/textures/，文件名（不含扩展名）= 物件种类，例如：
     slime.png  spikes.png  gate.png  tree.png  checkpoint.png ……（种类名见 defs.js 里的 CAT 列表）
     地块：ground.png（主体）、ground_top.png（露天表面）、ground_2/ground_3（变体）、thin、bounce、brick、ice
           想按主题区分：ground_snow.png、ground_forest.png …（主题名见 BIOMES）
     Boss：boss_ice / boss_root / boss_spore / boss_lava（找不到时用 boss.png）
     主角：hero.png；分状态 hero_idle / hero_run / hero_jump / hero_fall / hero_dash / hero_attack / hero_hurt / hero_climb
     状态图：xxx_on.png = 开关/压力板/信标灯/闸门等「已激活/已打开」状态；敌人/Boss 可用 xxx_<状态>.png
     粉笔：chalk.png　背景：bg_<主题>.png（整张）或 bg_<主题>_far/_mid/_near.png（三层视差）
     剧情场景：scene_school / scene_station / scene_snow / scene_forest / scene_underground / scene_lava / scene_train .png
   【动画】横向精灵条：文件名写成 slime@4.png（4 帧），或在清单 meta 里写 "frames":4,"fps":8。
   【meta 可选项】frames fps fit('stretch'拉伸铺满|'contain'等比放进格子|'natural'原始像素大小) scale ox oy flip(翻转朝向) spin(旋转速度) pixel(像素风不插值)
     默认：敌人 / NPC / Boss / 主角 = contain，其余 = stretch。素材默认朝右，向左时自动镜像。
   【每个物件单独设置贴图】关卡工坊 → 选中物件 → 属性里的「自定义贴图」，写 assets/textures/ 下的文件名即可（可带或不带扩展名）。

   【音频】放在 assets/audio/：
     bgm_<主题>.mp3|ogg|wav（snow / forest / underground / lava / station / night / boss）替换该主题音乐
     sfx_<名字>.mp3|ogg|wav 替换音效：jump djump land dash slash hit hurt kill shard heal switch plate door bounce check shoot laser boom roar win talk select rumble
     （原有的 assets/audio/<曲名 BPM>.wav 命名仍然有效，优先级低于 bgm_*） */
window.Assets=(function(){
var BASE='assets/',TEX=BASE+'textures/',AUD=BASE+'audio/',IEXT=/\.(png|webp|jpe?g|gif|svg)$/i,AEXT=/\.(mp3|ogg|wav|m4a)$/i;
var G=window.GFX,B=L15.BIOMES,INFO=L15.INFO;
var imgs={},meta={},aud={},names=[],tried={},cbs=[],rd=[],done=false,ver=0,audPool={},chT=null;
var SFX=['jump','djump','land','dash','slash','hit','hurt','kill','shard','heal','switch','plate','door','bounce','check','shoot','laser','boom','roar','win','talk','select','rumble'];

/* ---------- 加载 ---------- */
function loadImg(url){return new Promise(function(res){var im=new Image();im.onload=function(){res(im)};im.onerror=function(){res(null)};im.src=/^data:/.test(url)?url:encodeURI(url)})}
function fetchText(url){if(!window.fetch||location.protocol==='file:')return Promise.resolve(null);return fetch(url).then(function(r){return r.ok?r.text():null}).catch(function(){return null})}
function listDir(url,re){return fetchText(url).then(function(t){if(!t)return null;var out=[],m,rx=/href\s*=\s*["']([^"']+)["']/gi;
 while((m=rx.exec(t))){var h=m[1].split('?')[0].split('#')[0];if(h.slice(-1)==='/')continue;var f=h.split('/').pop();try{f=decodeURIComponent(f)}catch(e){}if(re.test(f)&&out.indexOf(f)<0)out.push(f)}
 return out.length?out:null})}
function changed(){if(!done)return;ver++;clearTimeout(chT);chT=setTimeout(function(){cbs.forEach(function(f){try{f()}catch(e){}})},30)}
function register(key,im,frames){imgs[key]={img:im,ok:true};if(frames&&!(meta[key]&&meta[key].frames)){(meta[key]=meta[key]||{}).frames=frames}if(names.indexOf(key)<0)names.push(key);changed()}
function baseKey(file){var b=file.split('/').pop().replace(IEXT,''),m=/^(.+)@(\d+)$/.exec(b);return m?{key:m[1],frames:+m[2]}:{key:b}}
function probeAudio(url){return new Promise(function(res){
 function viaEl(){var a=new Audio(),fin=false,to;function end(v){if(fin)return;fin=true;clearTimeout(to);a.onloadedmetadata=a.onerror=null;res(v)}
  a.preload='metadata';a.onloadedmetadata=function(){end(true)};a.onerror=function(){end(false)};to=setTimeout(function(){end(false)},2500);a.src=encodeURI(url)}
 if(window.fetch&&location.protocol!=='file:')fetch(encodeURI(url),{method:'HEAD'}).then(function(r){res(r.ok)},viaEl);else viaEl()})}
function candidates(){var out=[],k;
 Object.keys(INFO).forEach(function(n){out.push(n)});
 ['switch','plate','gate','checkpoint','laser','flame','vent','exit'].forEach(function(n){out.push(n+'_on')});
 ['ice','root','spore','lava'].forEach(function(t){out.push('boss_'+t)});out.push('boss','chalk','hero');
 ['idle','run','jump','fall','dash','attack','hurt','climb'].forEach(function(s){out.push('hero_'+s)});
 Object.keys(B).forEach(function(b){['','_2','_3','_top'].forEach(function(s){out.push('ground'+s+'_'+b)});['thin','bounce','brick','ice'].forEach(function(n){out.push(n+'_'+b)});
  out.push('bg_'+b,'bg_'+b+'_far','bg_'+b+'_mid','bg_'+b+'_near')});
 ['ground_2','ground_3','ground_top'].forEach(function(n){out.push(n)});
 ['school','station','snow','forest','underground','lava','train'].forEach(function(s){out.push('scene_'+s)});
 return out.filter(function(n,i){return out.indexOf(n)===i})}
function texStage(m){
 var p=Array.isArray(m.textures)?Promise.resolve(m.textures):listDir(TEX,IEXT);
 return p.then(function(list){var jobs=[];
  if(list){list.forEach(function(f){var bk=baseKey(f),url=/^(assets\/|https?:|data:|\/)/.test(f)?f:TEX+f;jobs.push(loadImg(url).then(function(im){if(im)register(bk.key,im,bk.frames)}))})}
  else candidates().forEach(function(n){jobs.push(loadImg(TEX+n+'.png').then(function(im){if(im)register(n,im)}))});
  return Promise.all(jobs)})}
function audStage(m){
 var p=Array.isArray(m.audio)?Promise.resolve(m.audio):listDir(AUD,AEXT);
 return p.then(function(list){
  if(list){list.forEach(function(f){var k=f.split('/').pop().replace(AEXT,'');if(!aud[k])aud[k]=/^(assets\/|https?:|\/)/.test(f)?f:AUD+f});return}
  var keys=Object.keys(B).map(function(b){return 'bgm_'+b}).concat('bgm_boss',SFX.map(function(n){return 'sfx_'+n}));
  return Promise.all(keys.map(function(k){return ['mp3','ogg','wav'].reduce(function(pr,e){return pr.then(function(ok){if(ok)return ok;return probeAudio(AUD+k+'.'+e).then(function(v){if(v){aud[k]=AUD+k+'.'+e}return v})})},Promise.resolve(false))}))})}
function finish(){if(done)return;done=true;ver++;rd.splice(0).forEach(function(f){try{f()}catch(e){}});cbs.forEach(function(f){try{f()}catch(e){}})}
fetchText(BASE+'assets.json').then(function(t){var m=null;try{m=t?JSON.parse(t):null}catch(e){}m=m||{};if(m.meta)for(var k in m.meta)meta[k]=m.meta[k];
 return Promise.all([texStage(m),audStage(m)])}).then(finish,finish);
setTimeout(finish,4500);

/* ---------- 查找 ---------- */
function get(k){var r=imgs[k];return r&&r.ok?r:null}
function pick(list){for(var i=0;i<list.length;i++)if(get(list[i]))return list[i];return null}
/* 自定义贴图（物件属性里的 tex）：按需加载，找不到就回退到默认画法 */
function lazy(name){if(tried[name])return;tried[name]=1;var isF=IEXT.test(name),url=/^(assets\/|https?:|data:|\/)/.test(name)?name:TEX+name,tries=isF?[url]:[url+'.png',url+'.webp'];
 (function nx(i){if(i>=tries.length)return;loadImg(tries[i]).then(function(im){if(im){register(name,im);if(!isF)lazy(name+'_on')}else nx(i+1)})})(0)}
function keys(o,base,st,on){var tex=o&&(o.tex||(o.p&&o.p.tex)),out=[];
 if(tex){tex=String(tex);if(!imgs[tex])lazy(tex);if(st)out.push(tex+'_'+st);if(on)out.push(tex+'_on');out.push(tex)}
 if(st)out.push(base+'_'+st);if(on)out.push(base+'_on');out.push(base);return out}

/* ---------- 绘制 ---------- */
function draw(g,key,x,y,w,h,t,face,o){var r=get(key);if(!r)return false;o=o||{};
 var m=meta[key]||{},im=r.img,fr=(m.frames|0)||1,iw=im.naturalWidth,ih=im.naturalHeight,fw=iw/fr,f=fr>1?Math.floor(t*(m.fps||8))%fr:0,fit=m.fit||o.fit||'stretch',sc=m.scale||1,dw,dh;
 if(fit==='stretch'){dw=w*sc;dh=h*sc}else if(fit==='natural'){dw=fw*sc;dh=ih*sc}else{var k=Math.min(w/fw,h/ih);dw=fw*k*sc;dh=ih*k*sc}
 var cx=x+w/2+(m.ox||0),by=(fit==='stretch'?y+h/2+dh/2:y+h)+(m.oy||0),flip=((face||1)<0)!==!!m.flip,spin=m.spin!=null?m.spin:(o.spin||0);
 g.save();g.translate(cx,by-dh/2);if(spin)g.rotate(t*spin);if(flip)g.scale(-1,1);
 if(o.alpha!=null&&o.alpha!==1)g.globalAlpha*=o.alpha;if(o.flash&&'filter' in g)g.filter='brightness(2.6)';
 g.imageSmoothingEnabled=m.pixel!=null?!m.pixel:!(fw<=48&&ih<=48);
 g.drawImage(im,f*fw,0,fw,ih,-dw/2,-dh/2,dw,dh);g.restore();return true}
function toCv(im,w,h){var c=G.mk(w,h),x=c.getContext('2d');x.imageSmoothingEnabled=im.naturalWidth>64;x.drawImage(im,0,0,im.naturalWidth,im.naturalHeight,0,0,w,h);return c}

/* ---------- 接管 GFX ---------- */
var _tiles=G.tiles,tc={};
G.tiles=function(biome){var c=tc[biome];if(c&&c.v===ver)return c.s;var base=_tiles(biome),s={},k;for(k in base)s[k]=base[k];
 function im(n){var p=pick([n+'_'+biome,n]);return p?imgs[p].img:null}
 var b1=im('ground'),t1=im('ground_top'),tt=t1?toCv(t1,64,64):null;
 if(b1){var b2=im('ground_2')||b1,b3=im('ground_3')||b1,c1=toCv(b1,64,64),c2=b2===b1?c1:toCv(b2,64,64),c3=b3===b1?c1:toCv(b3,64,64);s.body=[c1,c2,c3];s.top=tt?[tt,tt,tt]:[c1,c2,c3]}
 else if(tt)s.top=[tt,tt,tt];
 var th=im('thin');if(th)s.thin=toCv(th,64,24);
 ['bounce','brick','ice'].forEach(function(n){var i=im(n);if(i)s[n]=toCv(i,64,64)});
 tc[biome]={v:ver,s:s};return s};

var _bg=G.drawBg;
G.drawBg=function(g,key,W,H,camX,camY,sc,time){
 var one=pick(['bg_'+key]),far=pick(['bg_'+key+'_far']),mid=pick(['bg_'+key+'_mid']),near=pick(['bg_'+key+'_near']);
 if(!one&&!far&&!mid&&!near)return _bg.apply(this,arguments);
 var b=G.B(key),gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,b.sky[0]);gr.addColorStop(1,b.sky[1]);g.fillStyle=gr;g.fillRect(0,0,W,H);
 [[one,.1],[far,.12],[mid,.28],[near,.55]].forEach(function(l){if(!l[0])return;var im=imgs[l[0]].img,w=Math.max(1,im.naturalWidth*H/im.naturalHeight),off=-((camX*sc*l[1])%w);if(off>0)off-=w;for(var x=off;x<W;x+=w)g.drawImage(im,x,0,w,H)})};

var _th=G.thing,ITEM={shard:1,heart:1,dashgem:1};
G.thing=function(g,o,t,biome,lvlH){
 var kd=o.kind,on=!!(o.on||o.lit||o.open||o.active),k=pick(keys(o,kd,null,on));
 if(!k)return _th.apply(this,arguments);
 if(o.gone||o.dead)return;
 var x=o.x,y=o.y,w=o.w,h=o.h,al=1,grp=(INFO[kd]||{}).g;
 if(kd==='gate'&&!/_on$/.test(k)){h*=1-Math.min(1,o.openT||0);if(h<2)return}
 if(kd==='laser'||kd==='flame')al=o.active?1:o.warn?.3+.3*Math.sin(t*40):.15;
 if(kd==='vent'&&!o.on)al=.45;
 if(o.shake)x+=Math.sin(t*60)*2;
 if(ITEM[kd])y+=Math.sin(t*3+x*.05)*3;
 draw(g,k,x,y,w,h,t,1,{fit:(grp==='enemy'||grp==='npc')?'contain':null,alpha:al,spin:kd==='saw'?10:0})};

var _en=G.enemy;
G.enemy=function(g,e,t,biome){var k=pick(keys(e,e.kind,e.state));if(!k)return _en.apply(this,arguments);
 draw(g,k,e.x,e.y,e.w,e.h,t,e.face,{fit:'contain',alpha:e.kind==='ghost'&&e.alpha!=null?e.alpha:1,flash:e.flash>0})};

var _bo=G.boss;
G.boss=function(g,b,t){var ks=keys(b,'boss_'+(b.type||'lava'),b.state);ks.push('boss');var k=pick(ks);if(!k)return _bo.apply(this,arguments);
 draw(g,k,b.x,b.y,b.w,b.h,t,b.face,{fit:'contain',flash:b.flash>0})};

var _np=G.npc;
G.npc=function(g,kind,x,y,w,h,t,face){var tex=null,i=String(kind).indexOf('#');if(i>=0){tex=kind.slice(i+1);kind=kind.slice(0,i)}
 var k=pick(keys({tex:tex},kind));if(!k)return _np.call(this,g,kind,x,y,w,h,t,face);
 draw(g,k,x,y,w,h,t,face,{fit:'contain'})};

var _he=G.hero;
G.hero=function(g,p,time,accent,alpha){var k=pick(['hero_'+(p.state||'idle'),'hero']);if(!k)return _he.apply(this,arguments);
 g.save();g.translate(p.cx,p.cy);g.scale(p.sx||1,p.sy||1);if(alpha!=null)g.globalAlpha*=alpha;
 draw(g,k,-22,-56,44,56,p.anim!=null?p.anim:time,p.face,{fit:'contain'});g.restore()};

var _ch=G.chalk;
G.chalk=function(g,q,t){if(!pick(['chalk']))return _ch.apply(this,arguments);g.save();g.translate(q.x,q.y);g.rotate(t*18);draw(g,'chalk',-10,-10,20,20,t,1,{fit:'contain'});g.restore()};

var _sc=G.scene;
G.scene=function(g,kind,W,H,t){var k=pick(['scene_'+kind]);if(!k)return _sc.apply(this,arguments);
 var im=imgs[k].img,s=Math.max(W/im.naturalWidth,H/im.naturalHeight),w=im.naturalWidth*s,h=im.naturalHeight*s;g.drawImage(im,(W-w)/2,(H-h)/2,w,h)};

/* ---------- 对外接口 ---------- */
return {
 ready:function(cb){if(done)cb();else rd.push(cb)},
 onChange:function(cb){cbs.push(cb)},
 names:function(){return names.slice().sort()},
 has:function(k){return !!get(k)},
 flush:function(){ver++},
 music:function(key){return aud['bgm_'+key]||null},
 sfx:function(n){return !!aud['sfx_'+n]},
 playSfx:function(n,vol){var url=aud['sfx_'+n];if(!url)return false;var base=audPool[n]||(audPool[n]=new Audio(encodeURI(url))),a=base.cloneNode(true);a.volume=Math.max(0,Math.min(1,vol==null?.8:vol));var p=a.play();if(p&&p.catch)p.catch(function(){});return true},
 debug:function(){return {textures:names.slice(),audio:Object.keys(aud),meta:meta}}
};
})();
