/* 元数据：三个存档槽、收集到的晶体、图鉴、成就。全部存在 localStorage，纯逻辑，无界面。 */
window.Meta=(function(){
var D=window.L15_META_DATA,ST=L15.STORAGE,SLOTS=3;
function jget(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}}
function jset(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
var meta=jget(ST.meta)||{};
['shards','blueShards','yellowShards','cnt','boss','seen','ach','dlcProgress','metroProgress'].forEach(function(k){if(!meta[k]||typeof meta[k]!=='object')meta[k]={}});
/* 旧版把黄色水晶也记在 blueShards 里（id 形如 m21-3）：搬到 yellowShards，免得算进蓝色碎片 */
(function(){var bs=meta.blueShards,k,id;for(k in bs)for(id in bs[k])if(/^m\d\d-\d+$/.test(id)){(meta.yellowShards[k]=meta.yellowShards[k]||{})[id]=1;delete bs[k][id]}})();
meta.metroClears=meta.metroClears||0;meta.metroClean=meta.metroClean||0;
meta.clears=meta.clears||0;meta.clean=meta.clean||0;meta.dlcUnlocked=meta.dlcUnlocked||false;meta.dlcClears=meta.dlcClears||0;meta.paradoxPerfect=meta.paradoxPerfect||false;
var dirty=false;
function flush(){if(dirty){dirty=false;jset(ST.meta,meta)}}
/* ---------- 存档槽 ---------- */
function slots(){var s=jget(ST.slots),out=[],i;if(!Array.isArray(s))s=[];for(i=0;i<SLOTS;i++)out.push(s[i]&&s[i].ci!=null?s[i]:null);
 if(!meta.legacy&&!out.some(Boolean)){meta.legacy=1;dirty=true;var old=jget(ST.save);if(old&&old.ci!=null){out[0]=old;jset(ST.slots,out)}}
 flush();return out}
/* ---------- DLC 口令解锁（存在 localStorage 的 line15-dlc-unlock-<id>）：随存档一起保存 / 导出，读取 / 导入时恢复 ---------- */
var UNLOCK_PREFIX='line15-dlc-unlock-';
function dlcUnlockMap(){var o={},i,k;try{for(i=0;i<localStorage.length;i++){k=localStorage.key(i);if(k&&k.indexOf(UNLOCK_PREFIX)===0&&localStorage.getItem(k)==='1')o[k.slice(UNLOCK_PREFIX.length)]=1}}catch(e){}return o}
function applyDlcUnlock(map){if(!map||typeof map!=='object')return;try{Object.keys(map).forEach(function(id){if(map[id]&&localStorage.getItem(UNLOCK_PREFIX+id)!=='1')localStorage.setItem(UNLOCK_PREFIX+id,'1')})}catch(e){}}
function clearDlcUnlocks(){try{var del=[],i,k;for(i=0;i<localStorage.length;i++){k=localStorage.key(i);if(k&&(k.indexOf(UNLOCK_PREFIX)===0||k.indexOf('line15-dlc-save-')===0))del.push(k)}del.forEach(function(k){localStorage.removeItem(k)})}catch(e){}}
function writeSlot(i,data){if(i<0||i>=SLOTS)return;var s=slots();applyDlcUnlock(data.dlcUnlock);data.dlcUnlock=dlcUnlockMap();s[i]=data;jset(ST.slots,s);syncSlots()}
/* 以三个存档中进度最优者为准：把所有存档里的晶体并入全局记录（只增不减），再检查成就 */
function mergeFlags(dst,src){if(src&&typeof src==='object')Object.keys(src).forEach(function(k){if(src[k]&&!dst[k]){dst[k]=src[k];dirty=true}})}
function mergeIds(dst,src){if(src&&typeof src==='object')Object.keys(src).forEach(function(gk){var m=dst[gk]||(dst[gk]={});Object.keys(src[gk]||{}).forEach(function(id){if(!m[id]){m[id]=1;dirty=true}})})}
/* DLC 自己的进度存档（line15-dlc-save-<id>）：完美存档带来的「全部章节解锁 / 已通关」并入本机，只升不降 */
function mergeDlcSaves(map){if(!map||typeof map!=='object')return;Object.keys(map).forEach(function(id){var n=map[id],o=null;try{o=JSON.parse(localStorage.getItem('line15-dlc-save-'+id))}catch(e){}
 var out=o||{};out.unlocked=Math.max(out.unlocked||0,n.unlocked||0);out.cleared=true;if(out.ci==null){out.ci=n.ci;out.li=n.li||0}
 out.got=out.got||{};Object.keys(n.got||{}).forEach(function(k){var m=out.got[k]||(out.got[k]={});Object.keys(n.got[k]).forEach(function(i){m[i]=1})});
 out.blue=Math.max(out.blue||0,n.blue||0);out.stats=out.stats||n.stats||{deaths:0,kills:0,time:0};out.t=Date.now();
 try{localStorage.setItem('line15-dlc-save-'+id,JSON.stringify(out))}catch(e){}})}
/* 完美存档附带的全局记录：成就 / 图鉴 / 晶体 / Boss / 章节进度 / 通关次数 */
function mergeProg(pg){if(!pg)return;
 mergeFlags(meta.ach,pg.ach);mergeFlags(meta.seen,pg.seen);mergeFlags(meta.boss,pg.boss);mergeFlags(meta.dlcProgress,pg.dlcProgress);mergeFlags(meta.metroProgress,pg.metroProgress);
 mergeIds(meta.shards,pg.shards);mergeIds(meta.blueShards,pg.blueShards);mergeIds(meta.yellowShards,pg.yellowShards);
 ['clears','clean','dlcClears','metroClears','metroClean'].forEach(function(k){if((pg[k]||0)>(meta[k]||0)){meta[k]=pg[k];dirty=true}});
 ['dlcUnlocked','paradoxPerfect'].forEach(function(k){if(pg[k]&&!meta[k]){meta[k]=true;dirty=true}});
 mergeDlcSaves(pg.dlcSave)}
function syncSlots(){slots().forEach(function(s){if(!s)return;applyDlcUnlock(s.dlcUnlock);
  mergeProg(s.prog);
  Object.keys(s.got||{}).forEach(function(k){var d=k[0]==='d',gk=d?'dlc'+k.slice(1):k,store=d?meta.blueShards:meta.shards;
   Object.keys(s.got[k]).forEach(function(id){var m=store[gk]||(store[gk]={});if(!m[id]){m[id]=1;dirty=true}})});
  if(s.cleared&&!meta.clears){meta.clears=1;dirty=true}});
 flush();if(window.CAMPAIGN_DEFAULT)check(window.CAMPAIGN_DEFAULT)}
function deleteSlot(i){var s=slots();s[i]=null;jset(ST.slots,s)}
function clearSlots(){jset(ST.slots,[null,null,null]);meta.legacy=1;dirty=true;flush()}
function newest(){var s=slots(),b=-1,bt=-1;s.forEach(function(x,i){if(x&&(x.t||0)>bt){bt=x.t||0;b=i}});return b}
/* ---------- 当前主线里出现过哪些图鉴条目（没出现的不进图鉴，也不影响“图鉴全收集”成就） ---------- */
var TERR={1:'ground',2:'thin',3:'bounce',4:'brick',5:'ice'},avail=null;
function appearing(campaign){var m={};
 campaign.chapters.forEach(function(ch){ch.levels.forEach(function(lv){
  lv.objects.forEach(function(o){m[o.kind==='boss'?'boss_'+((o.props&&o.props.boss)||'lava'):o.kind]=1});
  lv.cells.forEach(function(row){row.forEach(function(v){if(v&&TERR[v])m[TERR[v]]=1})})})});
 return m}
function setCampaign(c){avail=appearing(c)}
function entries(){return avail?D.CODEX.filter(function(e){return avail[e.k]}):D.CODEX}
/* ---------- 记录 ---------- */
function seen(key){if(!meta.seen[key]){meta.seen[key]=Date.now();dirty=true;return true}return false}
function hasSeen(key){return !!meta.seen[key]}
function shard(gk,id){var m=meta.shards[gk]||(meta.shards[gk]={});if(!m[id]){m[id]=1;dirty=true}}
function yellowShard(gk,id){var m=meta.yellowShards[gk]||(meta.yellowShards[gk]={});if(!m[id]){m[id]=1;dirty=true}}
function metroChapter(ch){if(!meta.metroProgress[ch]){meta.metroProgress[ch]=1;dirty=true}}
function metroCleared(clean){meta.metroClears++;if(clean)meta.metroClean++;dirty=true}
function blueShard(gk,id){var m=meta.blueShards[gk]||(meta.blueShards[gk]={});if(!m[id]){m[id]=1;dirty=true}}
function cnt(name,n){meta.cnt[name]=(meta.cnt[name]||0)+(n==null?1:n);dirty=true}
function boss(type){if(!meta.boss[type]){meta.boss[type]=1;dirty=true}}
function dlcChapter(ch){if(!meta.dlcProgress[ch]){meta.dlcProgress[ch]=1;dirty=true}}
function cleared(clean){meta.clears++;if(clean)meta.clean++;dirty=true}
function dlcCleared(clean){meta.dlcClears++;dirty=true}
/* ---------- 汇总 ---------- */
function shardInfo(campaign){var info={have:0,total:0,ch:[],rooms:[]};
 campaign.chapters.forEach(function(ch,ci){var c={have:0,total:0,rooms:[]};
  ch.levels.forEach(function(lv,li){var ids=lv.objects.filter(function(o){return o.kind==='shard'}).map(function(o){return o.id}),got=meta.shards[ci+'-'+li]||{},h=ids.filter(function(id){return got[id]}).length;
   c.rooms.push({name:lv.name,have:h,total:ids.length});c.have+=h;c.total+=ids.length});
  info.ch.push(c);info.have+=c.have;info.total+=c.total});return info}
function crystalInfo(campaign,kind,store){var info={have:0,total:0,ch:[],rooms:[]};
 campaign.chapters.forEach(function(ch,ci){var c={have:0,total:0,rooms:[]};
  ch.levels.forEach(function(lv,li){var ids=lv.objects.filter(function(o){return o.kind===kind}).map(function(o){return o.id}),got=store['dlc'+ci+'-'+li]||{},h=ids.filter(function(id){return got[id]}).length;
   c.rooms.push({name:lv.name,have:h,total:ids.length});c.have+=h;c.total+=ids.length});
  info.ch.push(c);info.have+=c.have;info.total+=c.total});return info}
function blueShardInfo(campaign){return crystalInfo(campaign,'blueshard',meta.blueShards)}
function yellowShardInfo(campaign){return crystalInfo(campaign,'yellowshard',meta.yellowShards)}
function checkDLCUnlock(){if(!meta.dlcUnlocked){var s=shardInfo(window.CAMPAIGN_DEFAULT||{chapters:[]});if(s.have>=100){meta.dlcUnlocked=true;dirty=true;return true}}return false}
function codexInfo(){var seenN=0,list=entries();list.forEach(function(e){if(meta.seen[e.k])seenN++});return {codexSeen:seenN,codexTotal:list.length}}
function summary(campaign){var i=shardInfo(campaign),c=codexInfo(),bc=window.CAMPAIGN_DLC||campaign,b=blueShardInfo(bc),yc=window.CAMPAIGN_SUBWAY,y=yc?yellowShardInfo(yc):{have:0,total:0,ch:[]};i.codexSeen=c.codexSeen;i.codexTotal=c.codexTotal;i.blueHave=b.have;i.blueTotal=b.total;i.blueCh=b.ch;i.yellowHave=y.have;i.yellowTotal=y.total;i.yellowCh=y.ch;return i}
function perfect(){if(!meta.paradoxPerfect){meta.paradoxPerfect=true;dirty=true}}
/* 检查成就；返回这次新解锁的成就 */
function check(campaign){var i=summary(campaign),out=[];
 D.ACH.forEach(function(a){if(meta.ach[a.id])return;var p=a.prog(meta,i);if(p&&p[1]>0&&p[0]>=p[1]){meta.ach[a.id]=Date.now();dirty=true;out.push(a)}});
 flush();return out}
function resetGame(){clearSlots();clearDlcUnlocks();resetProgress()}
function resetProgress(){meta={shards:{},blueShards:{},yellowShards:{},cnt:{},boss:{},seen:{},ach:{},clears:0,clean:0,legacy:1,dlcUnlocked:false,dlcClears:0,dlcProgress:{},metroProgress:{},metroClears:0,metroClean:0,paradoxPerfect:false};dirty=true;flush()}
setTimeout(syncSlots,0);
return {SLOTS:SLOTS,syncSlots:syncSlots,setCampaign:setCampaign,entries:entries,TERR:TERR,slots:slots,writeSlot:writeSlot,deleteSlot:deleteSlot,clearSlots:clearSlots,newest:newest,seen:seen,hasSeen:hasSeen,shard:shard,blueShard:blueShard,yellowShard:yellowShard,metroChapter:metroChapter,metroCleared:metroCleared,yellowShardInfo:yellowShardInfo,cnt:cnt,boss:boss,dlcChapter:dlcChapter,cleared:cleared,dlcCleared:dlcCleared,perfect:perfect,
 summary:summary,blueShardInfo:blueShardInfo,checkDLCUnlock:checkDLCUnlock,check:check,flush:flush,resetProgress:resetProgress,resetGame:resetGame,dlcUnlockMap:dlcUnlockMap,get data(){return meta},get dirty(){return dirty}};
})();
