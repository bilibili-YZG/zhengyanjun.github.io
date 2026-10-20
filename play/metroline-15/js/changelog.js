/* 更新日志：读取 changelog.txt，按 Markdown 语法渲染。只支持常用语法：标题、列表、引用、分割线、粗体、斜体、行内代码、链接。 */
(function(){
function esc(s){return s.replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function inline(s){
 var codes=[];s=esc(s).replace(/`([^`]+)`/g,function(_,c){codes.push(c);return '\u0000'+(codes.length-1)+'\u0000'});
 s=s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,function(m,t,u){return /^(https?:|\.{0,2}\/|[\w-]+\.\w+)/i.test(u)&&!/^javascript:/i.test(u)?'<a href="'+u+'" target="_blank" rel="noopener">'+t+'</a>':m})
  .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/(^|[^*])\*([^*\s][^*]*)\*/g,'$1<em>$2</em>');
 return s.replace(/\u0000(\d+)\u0000/g,function(_,i){return '<code>'+codes[i]+'</code>'})}
function render(md){
 var lines=md.replace(/\r/g,'').split('\n'),out=[],list=null,para=[],m;
 function endPara(){if(para.length){out.push('<p>'+inline(para.join(' '))+'</p>');para=[]}}
 function endList(){if(list){out.push('</'+list+'>');list=null}}
 lines.forEach(function(l){
  if(!l.trim()){endPara();endList();return}
  if(m=/^(#{1,4})\s+(.*)$/.exec(l)){endPara();endList();out.push('<h'+(m[1].length+1)+'>'+inline(m[2])+'</h'+(m[1].length+1)+'>');return}
  if(/^\s*([-*_])(\s*\1){2,}\s*$/.test(l)){endPara();endList();out.push('<hr>');return}
  if(m=/^\s*(?:([-*+])|\d+\.)\s+(.*)$/.exec(l)){endPara();var t=m[1]?'ul':'ol';if(list!==t){endList();out.push('<'+t+'>');list=t}out.push('<li>'+inline(m[2])+'</li>');return}
  if(m=/^>\s?(.*)$/.exec(l)){endPara();endList();out.push('<blockquote>'+inline(m[1])+'</blockquote>');return}
  endList();para.push(l.trim())});
 endPara();endList();return out.join('\n')}
var loaded=false;
function open(){
 var box=document.getElementById('changelogBody');document.getElementById('changelog').classList.remove('hidden');
 if(loaded)return;box.textContent='加载中…';
 fetch('changelog.txt?'+Date.now()).then(function(r){if(!r.ok)throw 0;return r.text()}).then(function(t){box.innerHTML=render(t);loaded=true})
  .catch(function(){box.textContent='更新日志加载失败（直接双击打开本地文件时浏览器不允许读取，请通过网址访问）'})}
function init(){
 var b=document.getElementById('changelogBtn'),c=document.getElementById('closeChangelog');
 if(b)b.onclick=open;if(c)c.onclick=function(){document.getElementById('changelog').classList.add('hidden')}}
window.Changelog={render:render};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
