/* 音频：优先播放 assets/audio/<名字>.mp3（文件名里的数字=BPM）；缺失时用同 BPM 的程序合成曲目兜底。音效全部程序合成。
   连贯规则：音乐以「文件名」为身份。同一首曲子无论经过多少关卡、剧情、标题页都不会重新开始；
   切到别的曲子（如 Boss 战）时旧曲淡出并记住进度，回来时接着放，而不是从头重播。 */
window.AudioFX=(function(){
var ctx=null,master,musicBus,sfxBus,noiseBuf,vol={music:.55,sfx:.85},muted=false;
var timer=null,tr=null,stepN=0,nextT=0,pool={},curEl=null,curId='',wantKey='',pending=null,duckOn=false,reqN=0;
function init(){
 if(!ctx){var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
  try{ctx=new AC()}catch(e){return null}
  master=ctx.createGain();master.gain.value=muted?0:.8;var comp=ctx.createDynamicsCompressor();
  musicBus=ctx.createGain();sfxBus=ctx.createGain();musicBus.gain.value=vol.music;sfxBus.gain.value=vol.sfx;
  musicBus.connect(master);sfxBus.connect(master);master.connect(comp);comp.connect(ctx.destination);
  noiseBuf=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);var d=noiseBuf.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1}
 if(ctx.state==='suspended')ctx.resume();
 if(pending){var pf=pending;if(curEl===pf){var pr=pf.play();if(pr&&pr.then)pr.then(function(){if(pending===pf)pending=null;fadeEl(pf,vt(),700)},function(){/* 仍被浏览器拦截：保留 pending，等下一次真正的点击/按键再试 */})}else pending=null}
 return ctx}
function osc(type,f0,f1,t,dur,g,dest,att){var o=ctx.createOscillator(),a=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);
 if(f1&&f1!==f0)o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
 att=att||.008;a.gain.setValueAtTime(.0001,t);a.gain.exponentialRampToValueAtTime(Math.max(.0002,g),t+att);a.gain.exponentialRampToValueAtTime(.0001,t+dur);
 o.connect(a);a.connect(dest||sfxBus);o.start(t);o.stop(t+dur+.05)}
function noise(t,dur,g,ftype,f0,f1,q,dest){var s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),a=ctx.createGain();s.buffer=noiseBuf;f.type=ftype||'lowpass';f.Q.value=q||1;
 f.frequency.setValueAtTime(f0,t);if(f1)f.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t+dur);
 a.gain.setValueAtTime(g,t);a.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(f);f.connect(a);a.connect(dest||sfxBus);s.start(t);s.stop(t+dur+.05)}
var last={};
function sfx(n,arg){
 if(muted||!init())return;var t=ctx.currentTime;if(last[n]&&t-last[n]<.035)return;last[n]=t;if(window.Assets&&Assets.sfx(n)&&Assets.playSfx(n,vol.sfx*.9))return;
 switch(n){
 case'jump':osc('triangle',330,640,t,.16,.16);noise(t,.07,.05,'highpass',2500,5000);break;
 case'djump':osc('sine',520,980,t,.18,.15);osc('triangle',780,1400,t+.03,.14,.07);break;
 case'land':osc('sine',130,50,t,.14,.28);noise(t,.09,.12,'lowpass',900,200);break;
 case'dash':noise(t,.2,.22,'bandpass',500,3200,2);osc('sawtooth',180,520,t,.16,.06);break;
 case'slash':noise(t,.14,.2,'bandpass',1400,4200,1.4);osc('triangle',700,240,t,.1,.07);break;
 case'hit':osc('square',210,70,t,.13,.17);noise(t,.1,.2,'lowpass',2600,300);break;
 case'hurt':osc('sawtooth',320,70,t,.32,.2);noise(t,.18,.16,'lowpass',1500,200);break;
 case'kill':osc('triangle',500,120,t,.2,.18);noise(t,.14,.16,'bandpass',900,300);osc('sine',900,1500,t+.05,.12,.08);break;
 case'shard':[0,.07,.14].forEach(function(d,i){osc('sine',[880,1175,1760][i],0,t+d,.28,.13);osc('triangle',[1320,1760,2349][i],0,t+d,.2,.05)});break;
 case'heal':[523,659,784,1047].forEach(function(f,i){osc('sine',f,0,t+i*.06,.25,.1)});break;
 case'switch':osc('square',240,200,t,.05,.1);osc('triangle',420,840,t+.04,.16,.12);break;
 case'plate':osc('square',150,110,t,.08,.1);break;
 case'door':osc('sawtooth',90,55,t,.5,.12);noise(t,.5,.12,'lowpass',500,120);break;
 case'bounce':osc('sine',200,720,t,.22,.2);osc('triangle',400,1000,t+.02,.15,.08);break;
 case'check':[523,659,784,1047].forEach(function(f,i){osc('sine',f,0,t+i*.08,.4,.1);osc('triangle',f*2,0,t+i*.08,.3,.04)});break;
 case'shoot':osc('square',620,160,t,.16,.09);break;
 case'laser':osc('sawtooth',110,115,t,.18,.06);osc('square',880,860,t,.12,.03);break;
 case'boom':noise(t,.6,.35,'lowpass',1400,80);osc('sine',90,30,t,.5,.35);break;
 case'roar':osc('sawtooth',130,60,t,.8,.2);osc('square',65,45,t,.8,.14);noise(t,.7,.15,'lowpass',700,100);break;
 case'win':[523,659,784,1047,1319].forEach(function(f,i){osc('triangle',f,0,t+i*.12,.5,.14);osc('sine',f/2,0,t+i*.12,.5,.08)});break;
 case'talk':osc('square',arg||300,(arg||300)*1.05,t,.045,.04);break;
 case'select':osc('triangle',660,990,t,.09,.1);break;
 case'bell':[1].forEach(function(){osc('sine',880,860,t,.9,.2);osc('sine',1320,1300,t,.7,.1);osc('triangle',2217,2200,t,.4,.05);noise(t,.04,.12,'highpass',3000,6000)});break;
 case'parry':noise(t,.1,.25,'highpass',3000,7000);osc('square',1500,2400,t,.09,.1);osc('sine',2400,1800,t+.05,.25,.1);break;
 case'paper':noise(t,.18,.14,'bandpass',3500,1500,.8);noise(t+.07,.12,.1,'bandpass',4500,2500,.8);break;
 case'glide':osc('sine',400,1100,t,.35,.12);noise(t,.3,.08,'highpass',2000,5000);break;
 case'seize':osc('sawtooth',500,90,t,.45,.16);noise(t,.3,.2,'lowpass',1800,150);break;
 case'ok':osc('sine',660,0,t,.18,.14);osc('sine',990,0,t+.1,.3,.14);osc('triangle',1320,0,t+.1,.2,.05);break;
 case'bad':osc('square',180,120,t,.25,.12);osc('square',150,90,t+.12,.3,.12);break;
 case'rumble':noise(t,.9,.18,'lowpass',300,60);break}
}
/* 程序合成音乐 */
var TRACKS={
 snow:{bpm:105,prog:[[50,'m'],[46,'M'],[43,'m'],[45,'M']],pad:'triangle',bass:'1.......1.....1.',arp:{p:.4,oct:2,type:'sine',len:.5},hat:'',kick:'',snare:'',scale:[0,2,3,7,9]},
 forest:{bpm:98,prog:[[48,'M'],[45,'m'],[41,'M'],[43,'M']],pad:'sine',bass:'1..1..1...1..1..',arp:{p:.55,oct:2,type:'triangle',len:.25},hat:'x.x.x.x.x.x.x.x.',kick:'',snare:'',scale:[0,2,4,7,9]},
 underground:{bpm:115,prog:[[40,'m'],[36,'M'],[38,'M'],[35,'M']],pad:'sawtooth',bass:'1.1.1.1.1.1.1.1.',arp:{p:.3,oct:2,type:'sine',len:.4},hat:'..x...x...x...x.',kick:'x.......x.......',snare:'',scale:[0,3,5,7,10]},
 lava:{bpm:152,prog:[[45,'m'],[41,'M'],[43,'M'],[40,'M']],pad:'sawtooth',bass:'1.1.1.1.1.1.1.1.',arp:{p:.5,oct:3,type:'square',len:.2},hat:'x.x.x.x.x.x.x.x.',kick:'x...x...x...x...',snare:'....x.......x...',scale:[0,3,5,7,10]},
 boss:{bpm:150,prog:[[48,'m'],[44,'M'],[46,'M'],[43,'M']],pad:'sawtooth',bass:'1.11.1.11.11.1.1',arp:{p:.6,oct:3,type:'sawtooth',len:.18},hat:'xxxxxxxxxxxxxxxx',kick:'x..x..x.x..x..x.',snare:'....x.......x..x',scale:[0,1,3,5,7,8]}
};
TRACKS.station=TRACKS.snow;TRACKS.night=TRACKS.snow;
function mtof(m){return 440*Math.pow(2,(m-69)/12)}
function rnd(seed){var s=seed*9301+49297;s=(s*233280+11)%233280;return (Math.abs(s)%1000)/1000}
function sched(){
 if(!tr||!ctx)return;var spb=60/tr.bpm/4;
 while(nextT<ctx.currentTime+.25){
  var s=stepN%16,bar=Math.floor(stepN/16),ch=tr.prog[bar%4],rootM=ch[0],tri=ch[1]==='m'?[0,3,7]:[0,4,7],t=nextT;
  if(s===0){tri.forEach(function(iv,i){var o=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();o.type=tr.pad;o.frequency.value=mtof(rootM+12+iv);f.type='lowpass';f.frequency.value=tr.pad==='sawtooth'?700:1800;
   g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(tr.pad==='sawtooth'?.035:.06,t+.5);g.gain.linearRampToValueAtTime(.0001,t+spb*16);o.connect(f);f.connect(g);g.connect(musicBus);o.start(t);o.stop(t+spb*16+.1)})}
  if(tr.bass.charAt(s)==='1'){osc(tr.pad==='sine'?'triangle':'sawtooth',mtof(rootM-12+(s%8===6?7:0)),0,t,spb*1.7,.16,musicBus,.01)}
  if(tr.kick.charAt(s)==='x'){osc('sine',150,42,t,.2,.5,musicBus,.002)}
  if(tr.snare.charAt(s)==='x'){noise(t,.14,.22,'bandpass',1800,900,.8,musicBus)}
  if(tr.hat.charAt(s)==='x'){noise(t,.04,.07,'highpass',7000,8000,1,musicBus)}
  if(rnd(stepN%128+1)<tr.arp.p&&s%2===0){var sc=tr.scale,deg=sc[Math.floor(rnd(stepN%128+77)*sc.length)];osc(tr.arp.type,mtof(rootM+12*tr.arp.oct+deg),0,t,spb*4*tr.arp.len+.05,tr.arp.type==='sine'?.075:.04,musicBus,.004)}
  nextT+=spb;stepN++}
}
/* ---------- 曲目管理 ---------- */
function vt(){return duckOn?vol.music*.3:vol.music*.9}
function fadeEl(a,to,ms,done){if(a._ft){clearInterval(a._ft);a._ft=null}var from=a.volume,t0=Date.now();
 a._ft=setInterval(function(){var k=Math.min(1,(Date.now()-t0)/ms);try{a.volume=Math.max(0,Math.min(1,from+(to-from)*k))}catch(e){}if(k>=1){clearInterval(a._ft);a._ft=null;if(done)done()}},40)}
function getEl(name){var a=pool[name];if(a)return a;a=new Audio();a.loop=true;a.preload='auto';a._bad=false;
 a.addEventListener('error',function(){a._bad=true;if(curEl===a){curEl=null;if(a._tk)synth(a._tk)}});
 a.src=/^assets\//.test(name)?encodeURI(name):encodeURI('assets/audio/'+name+'.mp3');return pool[name]=a}
function synth(t){if(!init())return;tr=t;stepN=0;nextT=ctx.currentTime+.08;if(timer)clearInterval(timer);timer=setInterval(sched,50)}
function stopCur(){if(timer){clearInterval(timer);timer=null}tr=null;
 if(curEl){var a=curEl;curEl=null;if(pending===a)pending=null;fadeEl(a,0,450,function(){try{a.pause()}catch(e){}})}}
function stopAll(){stopCur();curId='';wantKey=''}
function trackId(tk){for(var k in TRACKS)if(TRACKS[k]===tk)return k;return 'x'}
function startFile(name,tk,restart){var n=++reqN,a=getEl(name);a._tk=tk;
 if(a._bad){synth(tk);return}
 if(restart){try{a.currentTime=0}catch(e){}}
 a.muted=muted;a.volume=0;curEl=a;
 var p=a.play();
 if(p&&p.then)p.then(function(){if(n===reqN&&curEl===a)fadeEl(a,vt(),700)},function(){if(n===reqN&&curEl===a&&!a._bad)pending=a});
 else fadeEl(a,vt(),700);
 setTimeout(function(){if(n===reqN&&curEl===a&&a.readyState<2&&!pending){curEl=null;a._bad=true;synth(tk)}},30000)}
/* key：生物群系名（snow/forest/underground/lava/station/night）或 'boss'。同一首曲子重复请求 = 什么都不做。 */
function play(key){
 wantKey=key;var isF=key.indexOf('file:')===0,cu=!isF&&window.Assets&&Assets.music?Assets.music(key):null,name=isF?key.slice(5):(cu||(key==='boss'?((L15.BIOMES[L15.curBiome]||{}).bossMusic||L15.BOSS_MUSIC):(L15.BIOMES[key]||{}).music)),tk=isF?(name==='OLD TITLE THEME 75'?TRACKS.snow:TRACKS.boss):(TRACKS[key]||TRACKS.snow),id=name?('f:'+name):('s:'+trackId(tk));
 if(id===curId&&(curEl||tr))return;
 stopCur();curId=id;if(muted)return;
 if(name)startFile(name,tk,key==='boss'||isF);else synth(tk)}
function setMuted(m){muted=!!m;if(master)master.gain.value=muted?0:.8;Object.keys(pool).forEach(function(k){pool[k].muted=muted});
 if(muted){stopCur()}else if(wantKey&&!curEl&&!tr){var k=wantKey;curId='';play(k)}}
function duck(on){duckOn=!!on;if(musicBus&&ctx)musicBus.gain.setTargetAtTime(on?vol.music*.35:vol.music,ctx.currentTime,.1);if(curEl)fadeEl(curEl,vt(),250)}
/* 音乐 / 音效音量分开调：kind='music'|'sfx'，v 为 0~1 */
function setVolume(kind,v){if(kind!=='music'&&kind!=='sfx')return;vol[kind]=Math.max(0,Math.min(1,v));
 if(kind==='music'){if(musicBus&&ctx)musicBus.gain.setTargetAtTime(duckOn?vol.music*.35:vol.music,ctx.currentTime,.05);if(curEl)fadeEl(curEl,vt(),120)}
 else if(sfxBus&&ctx)sfxBus.gain.setTargetAtTime(vol.sfx,ctx.currentTime,.05)}
function getVolume(kind){return vol[kind]}
return {setVolume:setVolume,getVolume:getVolume,init:init,sfx:sfx,play:play,stop:function(){stopAll()},setMuted:setMuted,isMuted:function(){return muted},duck:duck,current:function(){return curId}}
})();
