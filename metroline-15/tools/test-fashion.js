/* 无头测试：模拟 canvas 2D 上下文，验证 hero() 在 4 套时装下画出的配色确实不同，
   且切换头贴图会改用不同的 drawImage 源。 */
global.window=global;
global.document={getElementById:function(){return null}};
global.performance={now:function(){return 0}};
global.Image=function(){this._ok=true;this.src='';this.complete=true;this.naturalWidth=64;};
global.Image.prototype={};

/* 极简 2D 上下文：只记录关键调用 */
function mockCtx(){
 var calls=[];
 return {calls:calls,
  fillStyle:'',strokeStyle:'',lineWidth:1,globalAlpha:1,lineCap:'',font:'',
  save:function(){calls.push(['save'])},restore:function(){calls.push(['restore'])},
  translate:function(){},scale:function(){},rotate:function(){},clip:function(){},
  beginPath:function(){},closePath:function(){},ellipse:function(){},arcTo:function(){},fill:function(){calls.push(['fill',this.fillStyle])},
  stroke:function(){calls.push(['stroke',this.strokeStyle])},moveTo:function(){},lineTo:function(){},
  quadraticCurveTo:function(){},arc:function(){},rect:function(){},roundRect:function(){},
  fillRect:function(x,y,w,h){calls.push(['fillRect',this.fillStyle,x,y,w,h])},
  fillText:function(t,x,y){calls.push(['text',String(t)])},
  drawImage:function(im,x,y,w,h){calls.push(['drawImage',im.src,w,h])},
  measureText:function(){return{width:10}},
  createRadialGradient:function(){return{addColorStop:function(){}}},
  createLinearGradient:function(){return{addColorStop:function(){}}}
 };
}

global.L15={BIOMES:{snow:{accent:'#74dbe8'}}};
global.CanvasRenderingContext2D=function(){};
global.CanvasRenderingContext2D.prototype={roundRect:function(){}};
require('../js/gfx.js');

var GFX=global.GFX;
console.log('时装表:',GFX.OUTFITS.length,'套，头贴图:',GFX.FACES.length,'张');
console.log('套装名:',GFX.OUTFITS.map(function(o){return o.n+'('+o.g+')'}).join(' / '));
console.log('头贴图:',GFX.FACES.map(function(f){return f.n+'='+f.src}).join(' / '));

function render(outfit,face){
 GFX.setFashion(outfit,face);
 var c=mockCtx();
 GFX.hero(c,{cx:0,cy:0,face:1,vx:0,vy:0,ground:true,anim:0,state:'idle',sx:1,sy:1,atk:0},0,'#74dbe8',1);
 return c.calls;
}

var sigs=[];
GFX.OUTFITS.forEach(function(o,i){
 var calls=render(i,0);
 var colors={};
 calls.forEach(function(c){if(c[0]==='fillRect'||c[0]==='fill')colors[c[1]]=1});
 var imgs=calls.filter(function(c){return c[0]==='drawImage'});
 var uniq=Object.keys(colors);
 sigs.push(uniq.join(','));
 console.log('\n['+i+'] '+o.n+' ('+o.g+')');
 console.log('   用到的颜色:',uniq.join(' '));
 console.log('   头贴图 drawImage:',imgs.length?'是 src='+imgs[0][1]:'否（回退默认脸）');
});

/* 每套的配色签名必须互不相同 */
var dup=[];
for(var i=0;i<sigs.length;i++)for(var j=i+1;j<sigs.length;j++)if(sigs[i]===sigs[j])dup.push(i+'<->'+j);
console.log('\n配色重复的套装对:',dup.length?dup.join(', '):'无 ✓');

/* 切头贴图后 drawImage 的源必须变 */
var a=render(0,0).filter(function(c){return c[0]==='drawImage'});
var b=render(0,1).filter(function(c){return c[0]==='drawImage'});
console.log('头 0 →',a.length?a[0][1]:'无','| 头 1 →',b.length?b[0][1]:'无');
console.log('两张头贴图可用且不同:',a.length&&b.length&&a[0][1]!==b[0][1]?'✓':'✗');
