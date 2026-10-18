/* 元数据：三个存档槽、收集到的晶体、图鉴、成就。全部存在 localStorage，纯逻辑，无界面。 */
window.Meta=(function(){
var D=window.L15_META_DATA,ST=L15.STORAGE,SLOTS=3;
function jget(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}}
function jset(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
var meta=jget(ST.meta)||{};
['shards','cnt','boss','seen','ach'].forEach(function(k){if(!meta[k]||typeof meta[k]!=='object')meta[k]={}});
meta.clears=meta.clears||0;meta.clean=meta.clean||0;
var dirty=false;
function flush(){if(dirty){dirty=false;jset(ST.meta,meta)}}
/* ---------- 存档槽 ---------- */
function slots(){var s=jget(ST.slots),out=[],i;if(!Array.isArray(s))s=[];for(i=0;i<SLOTS;i++)out.push(s[i]&&s[i].ci!=null?s[i]:null);
 if(!meta.legacy&&!out.some(Boolean)){meta.legacy=1;dirty=true;var old=jget(ST.save);if(old&&old.ci!=null){out[0]=old;jset(ST.slots,out)}}
 flush();return out}
function writeSlot(i,data){if(i<0||i>=SLOTS)return;var s=slots();s[i]=data;jset(ST.slots,s)}
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
function cnt(name,n){meta.cnt[name]=(meta.cnt[name]||0)+(n==null?1:n);dirty=true}
function boss(type){if(!meta.boss[type]){meta.boss[type]=1;dirty=true}}
function cleared(clean){meta.clears++;if(clean)meta.clean++;dirty=true}
/* ---------- 汇总 ---------- */
function shardInfo(campaign){var info={have:0,total:0,ch:[],rooms:[]};
 campaign.chapters.forEach(function(ch,ci){var c={have:0,total:0,rooms:[]};
  ch.levels.forEach(function(lv,li){var ids=lv.objects.filter(function(o){return o.kind==='shard'}).map(function(o){return o.id}),got=meta.shards[ci+'-'+li]||{},h=ids.filter(function(id){return got[id]}).length;
   c.rooms.push({name:lv.name,have:h,total:ids.length});c.have+=h;c.total+=ids.length});
  info.ch.push(c);info.have+=c.have;info.total+=c.total});return info}
function codexInfo(){var seenN=0,list=entries();list.forEach(function(e){if(meta.seen[e.k])seenN++});return {codexSeen:seenN,codexTotal:list.length}}
function summary(campaign){var i=shardInfo(campaign),c=codexInfo();i.codexSeen=c.codexSeen;i.codexTotal=c.codexTotal;return i}
/* 检查成就；返回这次新解锁的成就 */
function check(campaign){var i=summary(campaign),out=[];
 D.ACH.forEach(function(a){if(meta.ach[a.id])return;var p=a.prog(meta,i);if(p&&p[1]>0&&p[0]>=p[1]){meta.ach[a.id]=Date.now();dirty=true;out.push(a)}});
 flush();return out}
function resetProgress(){meta={shards:{},cnt:{},boss:{},seen:{},ach:{},clears:0,clean:0,legacy:1};dirty=true;flush()}
return {SLOTS:SLOTS,setCampaign:setCampaign,entries:entries,TERR:TERR,slots:slots,writeSlot:writeSlot,deleteSlot:deleteSlot,clearSlots:clearSlots,newest:newest,seen:seen,hasSeen:hasSeen,shard:shard,cnt:cnt,boss:boss,cleared:cleared,
 summary:summary,check:check,flush:flush,resetProgress:resetProgress,get data(){return meta},get dirty(){return dirty}};
})();
