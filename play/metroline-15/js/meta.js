/* 元数据：三个存档槽、收集到的晶体、图鉴、成就。全部存在 localStorage，纯逻辑，无界面。 */
window.Meta=(function(){
var D=window.L15_META_DATA,ST=L15.STORAGE,SLOTS=3;
function jget(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}}
function jset(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
var meta=jget(ST.meta)||{};
['shards','blueShards','cnt','boss','seen','ach','dlcProgress'].forEach(function(k){if(!meta[k]||typeof meta[k]!=='object')meta[k]={}});
meta.clears=meta.clears||0;meta.clean=meta.clean||0;meta.dlcUnlocked=meta.dlcUnlocked||false;meta.dlcClears=meta.dlcClears||0;meta.paradoxPerfect=meta.paradoxPerfect||false;
var dirty=false;
function flush(){if(dirty){dirty=false;jset(ST.meta,meta)}}
/* ---------- 存档槽 ---------- */
function slots(){var s=jget(ST.slots),out=[],i;if(!Array.isArray(s))s=[];for(i=0;i<SLOTS;i++)out.push(s[i]&&s[i].ci!=null?s[i]:null);
 if(!meta.legacy&&!out.some(Boolean)){meta.legacy=1;dirty=true;var old=jget(ST.save);if(old&&old.ci!=null){out[0]=old;jset(ST.slots,out)}}
 flush();return out}
function writeSlot(i,data){if(i<0||i>=SLOTS)return;var s=slots();s[i]=data;jset(ST.slots,s);syncSlots()}
/* 以三个存档中进度最优者为准：把所有存档里的晶体并入全局记录（只增不减），再检查成就 */
function syncSlots(){slots().forEach(function(s){if(!s)return;
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
function blueShardInfo(campaign){var info={have:0,total:0,ch:[],rooms:[]};
 campaign.chapters.forEach(function(ch,ci){var c={have:0,total:0,rooms:[]};
  ch.levels.forEach(function(lv,li){var ids=lv.objects.filter(function(o){return o.kind==='blueshard'||o.kind==='yellowshard'}).map(function(o){return o.id}),got=meta.blueShards['dlc'+ci+'-'+li]||{},h=ids.filter(function(id){return got[id]}).length;
   c.rooms.push({name:lv.name,have:h,total:ids.length});c.have+=h;c.total+=ids.length});
  info.ch.push(c);info.have+=c.have;info.total+=c.total});return info}
function checkDLCUnlock(){if(!meta.dlcUnlocked){var s=shardInfo(window.CAMPAIGN_DEFAULT||{chapters:[]});if(s.have>=100){meta.dlcUnlocked=true;dirty=true;return true}}return false}
function codexInfo(){var seenN=0,list=entries();list.forEach(function(e){if(meta.seen[e.k])seenN++});return {codexSeen:seenN,codexTotal:list.length}}
function summary(campaign){var i=shardInfo(campaign),c=codexInfo(),b=blueShardInfo(campaign);i.codexSeen=c.codexSeen;i.codexTotal=c.codexTotal;i.blueHave=b.have;i.blueTotal=b.total;i.blueCh=b.ch;return i}
function perfect(){if(!meta.paradoxPerfect){meta.paradoxPerfect=true;dirty=true}}
/* 检查成就；返回这次新解锁的成就 */
function check(campaign){var i=summary(campaign),out=[];
 D.ACH.forEach(function(a){if(meta.ach[a.id])return;var p=a.prog(meta,i);if(p&&p[1]>0&&p[0]>=p[1]){meta.ach[a.id]=Date.now();dirty=true;out.push(a)}});
 flush();return out}
function resetProgress(){meta={shards:{},blueShards:{},cnt:{},boss:{},seen:{},ach:{},clears:0,clean:0,legacy:1,dlcUnlocked:false,dlcClears:0,dlcProgress:{},paradoxPerfect:false};dirty=true;flush()}
setTimeout(syncSlots,0);
return {SLOTS:SLOTS,syncSlots:syncSlots,setCampaign:setCampaign,entries:entries,TERR:TERR,slots:slots,writeSlot:writeSlot,deleteSlot:deleteSlot,clearSlots:clearSlots,newest:newest,seen:seen,hasSeen:hasSeen,shard:shard,blueShard:blueShard,cnt:cnt,boss:boss,dlcChapter:dlcChapter,cleared:cleared,dlcCleared:dlcCleared,perfect:perfect,
 summary:summary,blueShardInfo:blueShardInfo,checkDLCUnlock:checkDLCUnlock,check:check,flush:flush,resetProgress:resetProgress,get data(){return meta},get dirty(){return dirty}};
})();
