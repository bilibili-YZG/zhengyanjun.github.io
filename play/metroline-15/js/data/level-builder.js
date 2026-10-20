/* 关卡构建器：把「R(...)」这种简写变成工坊同格式的关卡数据（cells + objects + links）。
   每个房间一个文件（js/levels/cN-NN.js），文件里只写 L15.addLevel('cN', 序号, R(...))，可单独复制、分享。
   也可以在关卡工坊里用「导出本关」得到 .level15.json，再由别人「导入」。 */
(function(){
var I=L15.INFO,C=L15.CELL;
function R(name,bg,w,h,objective,intro,fn){
 var cells=[],objects=[],links=[],y,x,seq=0; /* 物件 id 按顺序生成：每次加载都一样，存档里记录的“已收集碎片”才对得上 */
 for(y=0;y<h;y++){var row=[];for(x=0;x<w;x++)row.push(0);cells.push(row)}
 var b={G:h-2,w:w,h:h,
  fill:function(x0,y0,ww,hh,v){for(var yy=y0;yy<y0+hh;yy++)for(var xx=x0;xx<x0+ww;xx++)if(yy>=0&&yy<h&&xx>=0&&xx<w)cells[yy][xx]=v},
  floors:function(segs,v){var me=this;segs.forEach(function(s){me.fill(s[0],me.G,s[1]-s[0],2,v||1)})},
  plat:function(x0,y0,len,v){this.fill(x0,y0,len,1,v==null?2:v)},
  plats:function(a,v){var me=this;a.forEach(function(p){me.plat(p[0],p[1],p[2],p[3]!=null?p[3]:v)})},
  o:function(kind,x0,y0,props,ex){var d=I[kind];ex=ex||{};var p={},k;for(k in d.p)p[k]=d.p[k];for(k in (props||{}))p[k]=props[k];
   var id=ex.id||('o'+(++seq));objects.push({id:id,type:d.g,kind:kind,x:x0,y:y0,w:ex.w||d.w,h:ex.h||d.h,label:ex.label||d.n,dialogue:ex.say||'',props:p});return id},
  on:function(kind,x0,top,props,ex){return this.o(kind,x0,top-I[kind].h-((ex&&ex.h)?ex.h-I[kind].h:0),props,ex)},
  each:function(kind,pts,props){var me=this;pts.forEach(function(p){me.o(kind,p[0],p[1],props)})},
  link:function(a,c){links.push({from:a,to:c})},
  base:function(exitLocked){this.o('spawn',2,this.G-2);this.o('exit',w-4,this.G-3)}
 };
 fn(b);
 return {name:name,width:w,height:h,background:bg,objective:objective,intro:intro,cells:cells,objects:objects,links:links};
}

var S=function(){return Array.prototype.slice.call(arguments).join('|')};
L15.R=R;L15.S=S;
L15.LEVELS=L15.LEVELS||{};
/* 注册一个房间：章 id、序号(1 开始)。文件的加载顺序不影响最终顺序。 */
L15.addLevel=function(chapterId,no,level){(L15.LEVELS[chapterId]=L15.LEVELS[chapterId]||[])[no-1]=level;return level};
})();
