/* 单个存档位的导出 / 导入（.json 文件）。由存档页按钮调用 */
window.SaveFile=(function(){
var inp=document.createElement('input');inp.type='file';inp.accept='.json';inp.style.display='none';document.body.appendChild(inp);
function exportSlot(i){var s=Meta.slots()[i];if(!s)return;
 var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({game:'metroline-15',slot:s})],{type:'application/json'}));
 a.download='metroline15-slot'+(i+1)+'.json';a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},1000)}
function importSlot(i,done){inp.onchange=function(){var f=inp.files[0];inp.value='';if(!f)return;var r=new FileReader();r.onload=function(){
 try{var o=JSON.parse(r.result);if(o.game!=='metroline-15'||!o.slot||o.slot.ci==null)throw 0;
  if(Meta.slots()[i]&&!confirm('覆盖存档 '+(i+1)+' ？原来的进度将被替换。'))return;
  Meta.writeSlot(i,o.slot);done()}catch(e){alert('存档文件无效')}};r.readAsText(f)};inp.click()}
return {exportSlot:exportSlot,importSlot:importSlot}})();
